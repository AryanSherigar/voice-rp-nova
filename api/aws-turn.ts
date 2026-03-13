import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3-flash-preview';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

type RateLimitRecord = { count: number; windowStart: number };

const rateLimitStore = new Map<string, RateLimitRecord>();

const getClientIp = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
};

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  existing.count += 1;
  rateLimitStore.set(ip, existing);
  return existing.count > RATE_LIMIT_MAX_REQUESTS;
};

const isAuthorized = (req: any): boolean => {
  const requestOrigin = req.headers.origin;
  const requestHost = req.headers.host;

  if (typeof requestOrigin === 'string' && typeof requestHost === 'string') {
    try {
      const originHost = new URL(requestOrigin).host;
      if (originHost !== requestHost) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const serverSecret = process.env.TURN_API_SECRET;
  if (!serverSecret) {
    return true;
  }

  return req.headers['x-turn-token'] === serverSecret;
};

const getActiveStoryCards = (state: any, input: any): string => {
  if (!state.storyCards || state.storyCards.length === 0) return '';

  const recentHistoryText = state.history
    .slice(-3)
    .map((h: any) => h.description)
    .join(' ')
    .toLowerCase();

  const inputText = input.content.toLowerCase();
  const combinedText = `${recentHistoryText} ${inputText}`;

  const matchedCards = state.storyCards.filter((card: any) => {
    return card.keys.some((key: string) => {
      const cleanKey = key.trim().toLowerCase();
      if (!cleanKey) return false;
      return combinedText.includes(cleanKey);
    });
  });

  if (matchedCards.length === 0) return '';

  return matchedCards.map((card: any) => `[World Info - ${card.title}]: ${card.entry}`).join('\n');
};

const buildPrompt = (state: any, input: any): string => {
  const characterContext = state.characters
    .map(
      (c: any) =>
        `ID[${c.id}] Name[${c.name}] Role[${c.role}]\n   - Status: ${c.status}\n   - Psychology: [Trust:${c.emotions.trust} (0=Paranoid, 100=Blind Faith), Fear:${c.emotions.fear} (0=Brave, 100=Terrified), Anger:${c.emotions.anger}, Hope:${c.emotions.hope}]\n   - Description: ${c.description}`,
    )
    .join('\n');

  const historyContext = state.history
    .slice(-8)
    .map((h: any) => `[${h.type}] ${h.description}`)
    .join('\n');

  const storyCardContext = getActiveStoryCards(state, input);

  return `
    You are the CORE ENGINE of an advanced interactive role-play simulation.
    Return ONLY strict JSON for this schema:
    {
      "narrator": {
        "transcript": string,
        "audio": { "mimeType": string, "payload": string } // optional
      },
      "director": {
        "pacing": "Slow" | "Normal" | "Fast",
        "tension": number,
        "narrativeFocus": string,
        "suggestedHints": string[]
      },
      "world": {
        "narrative": string,
        "characterUpdates": [
          {
            "id": string,
            "emotions": { "trust": number, "fear": number, "anger": number, "hope": number },
            "status": string
          }
        ],
        "newFacts": string[],
        "dnaShift": { "orderChaos": number, "hopeDespair": number, "trustBetrayal": number }
      },
      "trace": {
        "agentNames": string[],
        "latencyMs": number
      }
    }

    Rules:
    - narrator.transcript and world.narrative must contain the same story text.
    - audio is optional; omit it if unavailable.
    - trace is optional.
    - No markdown, no separators, no prose outside JSON.

    CURRENT SIMULATION STATE
    Title: ${state.title}
    Location: ${state.world.locations[state.world.currentLocationId].name} (${state.world.locations[state.world.currentLocationId].description})
    Time/Context: ${state.world.time}

    STORY DNA
    - OrderChaos: ${state.storyDNA.orderChaos}
    - HopeDespair: ${state.storyDNA.hopeDespair}
    - TrustBetrayal: ${state.storyDNA.trustBetrayal}

    DIRECTOR OVERRIDE
    - Tension: ${state.directorState.tension}
    - Pacing: ${state.directorState.pacing}
    - Focus: ${state.directorState.narrativeFocus}

    CHARACTERS
    ${characterContext}

    FACTS
    ${state.world.facts.slice(-5).join('; ')}
    ${storyCardContext ? `Triggered Lore:\n${storyCardContext}` : ''}

    RECENT HISTORY
    ${historyContext}

    PLAYER INPUT
    Type: ${input.type}
    Content: "${input.content}"
  `;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized request.' });
    return;
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY is missing.' });
    return;
  }

  const { state, input } = req.body || {};
  if (!state || !input) {
    res.status(400).json({ error: 'Expected request body with { state, input }.' });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const start = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildPrompt(state, input),
    });

    const rawText = response.text || '';
    const sanitizedJson = rawText
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(sanitizedJson);
    const transcript = parsed?.narrator?.transcript ?? parsed?.world?.narrative ?? '';

    res.status(200).json({
      narrator: {
        transcript,
        ...(parsed?.narrator?.audio ? { audio: parsed.narrator.audio } : {}),
      },
      director: parsed?.director ?? state.directorState,
      world: {
        narrative: transcript,
        characterUpdates: parsed?.world?.characterUpdates ?? [],
        ...(parsed?.world?.newFacts ? { newFacts: parsed.world.newFacts } : {}),
        ...(parsed?.world?.dnaShift ? { dnaShift: parsed.world.dnaShift } : {}),
      },
      trace: {
        ...(parsed?.trace?.agentNames ? { agentNames: parsed.trace.agentNames } : { agentNames: ['narrator', 'director', 'world'] }),
        latencyMs: Date.now() - start,
      },
    });
  } catch (error) {
    console.error('Turn generation failed:', error);
    res.status(502).json({ error: 'Model request failed.' });
  }
}
