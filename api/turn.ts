import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3-flash-preview';
const SEPARATOR = '___METADATA___';
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
    Your goal is to weave a compelling, consequence-driven narrative where characters are psychologically deep and the world reacts realistically to the player.

    === CURRENT SIMULATION STATE ===
    Title: ${state.title}
    Location: ${state.world.locations[state.world.currentLocationId].name} (${state.world.locations[state.world.currentLocationId].description})
    Time/Context: ${state.world.time}

    [STORY DNA] (Thematic Resonance)
    - Order <--> Chaos (${state.storyDNA.orderChaos}/100): Low=Strict/Stagnant, High=Anarchy/Unpredictable.
    - Hope <--> Despair (${state.storyDNA.hopeDespair}/100): Low=Optimistic, High=Grim/Nihilistic.
    - Trust <--> Betrayal (${state.storyDNA.trustBetrayal}/100): Low=Honest, High=Deceptive.

    [DIRECTOR OVERRIDE]
    - Target Tension: ${state.directorState.tension}/100
    - Pacing: ${state.directorState.pacing}
    - Current Narrative Focus: "${state.directorState.narrativeFocus}"

    [CHARACTERS PRESENT]
    ${characterContext}

    [KNOWLEDGE BASE (Active Context)]
    Facts: ${state.world.facts.slice(-5).join('; ')}
    ${storyCardContext ? `Triggered Lore:\n${storyCardContext}` : ''}

    [RECENT HISTORY]
    ${historyContext}

    === PLAYER INPUT ===
    Type: ${input.type}
    Content: "${input.content}"

    === INSTRUCTIONS ===

    PHASE 1: NARRATIVE GENERATION
    Write the next segment of the story.
    1. **Show, Don't Tell**: Use sensory details (sound, smell, light) to ground the scene.
    2. **Psychological Consistency**: Characters MUST act according to their current stats.
       - High Fear (>70): Stuttering, defensive posture, irrationality.
       - Low Trust (<30): Withholding info, suspicion, lying.
       - High Anger (>70): Aggression, shouting, impulsiveness.
    3. **Consequence**: The player's input matters. If they fail, let them fail. If they succeed, reward them. Do not god-mode the player.
    4. **Director Influence**:
       - If Tension is High (>70), use short sentences, cliffhangers, and immediate threats.
       - If Pacing is Fast, skip pleasantries and move to action.
    5. **Output**: Just the story text. No prefixes.

    PHASE 2: SEPARATOR
    Output exactly "${SEPARATOR}" on a new line.

    PHASE 3: STATE SIMULATION (JSON)
    Analyze the narrative you just wrote and update the mathematical state of the world.

    Output valid JSON matching this schema:
    {
      "director": {
        "pacing": "Slow" | "Normal" | "Fast",
        "tension": number,
        "narrativeFocus": string,
        "suggestedHints": string[]
      },
      "world": {
        "characterUpdates": [
          {
            "id": string,
            "emotions": { "trust": number, "fear": number, "anger": number, "hope": number },
            "status": string
          }
        ],
        "newFacts": string[],
        "dnaShift": { "orderChaos": number, "hopeDespair": number, "trustBetrayal": number }
      }
    }
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

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: buildPrompt(state, input),
    });

    const rawText = response.text || '';
    const splitIndex = rawText.indexOf(SEPARATOR);
    const narrative = splitIndex >= 0 ? rawText.slice(0, splitIndex).trim() : rawText.trim();

    const jsonCandidate = splitIndex >= 0 ? rawText.slice(splitIndex + SEPARATOR.length).trim() : '';
    const sanitizedJson = jsonCandidate
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed = {
      director: state.directorState,
      world: {
        characterUpdates: [],
        newFacts: [],
        dnaShift: {},
      },
    };

    if (sanitizedJson) {
      parsed = JSON.parse(sanitizedJson);
    }

    res.status(200).json({ narrative, ...parsed });
  } catch (error) {
    console.error('Turn generation failed:', error);
    res.status(502).json({ error: 'Model request failed.' });
  }
}
