import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { GameState, PlayerInput, TurnResponse, DirectorAgentResponse, WorldUpdateResponse } from '../types';

const NARRATOR_MODEL = process.env.BEDROCK_NARRATOR_MODEL_ID;
const DIRECTOR_MODEL = process.env.BEDROCK_DIRECTOR_MODEL_ID;
const EMBEDDING_MODEL = process.env.BEDROCK_EMBEDDING_MODEL_ID;
const BEDROCK_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const STORY_CARD_TOP_K = Number.parseInt(process.env.STORY_CARD_TOP_K ?? '3', 10);
const STORY_CARD_SIMILARITY_THRESHOLD = Number.parseFloat(process.env.STORY_CARD_SIMILARITY_THRESHOLD ?? '0.35');

type RateLimitRecord = { count: number; windowStart: number };

type Agent1Response = {
  transcript: string;
  audio?: {
    mimeType: string;
    payload: string;
  };
};

type Agent2Response = {
  director: DirectorAgentResponse;
  world: WorldUpdateResponse;
};

type TraceMetadata = {
  warnings?: string[];
  fallbackReason?: string;
};

type EmbeddedStoryCard = {
  title: string;
  entry: string;
  similarity?: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();
const storyCardEmbeddingStore = new Map<string, number[]>();

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

const asNumber = (value: unknown, fallback: number, min = 0, max = 100): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

const asStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) return fallback;
  return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean);
};

const sanitizeJsonText = (rawText: string): string =>
  rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const normalizeEmbedding = (embedding: number[]): number[] => {
  const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(magnitude) || magnitude === 0) {
    return embedding;
  }

  return embedding.map((value) => value / magnitude);
};

const cosineSimilarity = (left: number[], right: number[]): number => {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return -1;
  }

  let dot = 0;
  for (let i = 0; i < left.length; i += 1) {
    dot += left[i] * right[i];
  }

  return dot;
};

const parseEmbedding = (value: unknown): number[] | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const embedding = value.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  if (embedding.length !== value.length) {
    return null;
  }

  return normalizeEmbedding(embedding);
};

const getKeywordMatchedCards = (state: GameState, input: PlayerInput): EmbeddedStoryCard[] => {
  if (!state.storyCards || state.storyCards.length === 0) return [];

  const recentHistoryText = state.history
    .slice(-3)
    .map((h) => h.description)
    .join(' ')
    .toLowerCase();

  const inputText = input.content.toLowerCase();
  const combinedText = `${recentHistoryText} ${inputText}`;

  const matchedCards = state.storyCards.filter((card) =>
    card.keys.some((key) => {
      const cleanKey = key.trim().toLowerCase();
      if (!cleanKey) return false;
      return combinedText.includes(cleanKey);
    }),
  );

  if (matchedCards.length === 0) return [];

  return matchedCards.map((card) => ({ title: card.title, entry: card.entry }));
};

const getStoryCardCacheKey = (state: GameState, cardId: string, entry: string): string => `${state.id}::${cardId}::${entry}`;

const embedText = async (client: BedrockRuntimeClient, text: string): Promise<number[] | null> => {
  if (!EMBEDDING_MODEL || !text.trim()) {
    return null;
  }

  try {
    const response = await client.send(
      new InvokeModelCommand({
        modelId: EMBEDDING_MODEL,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({ inputText: text }),
      }),
    );

    const rawBody = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(rawBody) as { embedding?: unknown; embeddingsByType?: { float?: unknown } };

    return parseEmbedding(parsed.embedding ?? parsed.embeddingsByType?.float);
  } catch {
    return null;
  }
};

const getSemanticMatchedCards = async (client: BedrockRuntimeClient, state: GameState, input: PlayerInput): Promise<EmbeddedStoryCard[] | null> => {
  if (!state.storyCards || state.storyCards.length === 0) {
    return [];
  }

  const transcriptEmbedding = await embedText(client, input.content);
  if (!transcriptEmbedding) {
    return null;
  }

  const scoredCards: EmbeddedStoryCard[] = [];

  for (const card of state.storyCards) {
    const key = getStoryCardCacheKey(state, card.id, card.entry);
    const cached = storyCardEmbeddingStore.get(key);
    let cardEmbedding = cached;

    if (!cardEmbedding) {
      const cardContext = [card.title, card.entry, card.keys.join(' ')].filter(Boolean).join('\n');
      cardEmbedding = await embedText(client, cardContext) ?? undefined;
      if (cardEmbedding) {
        storyCardEmbeddingStore.set(key, cardEmbedding);
      }
    }

    if (!cardEmbedding || cardEmbedding.length !== transcriptEmbedding.length) {
      continue;
    }

    const similarity = cosineSimilarity(transcriptEmbedding, cardEmbedding);
    if (similarity >= STORY_CARD_SIMILARITY_THRESHOLD) {
      scoredCards.push({ title: card.title, entry: card.entry, similarity });
    }
  }

  return scoredCards.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0)).slice(0, Math.max(1, STORY_CARD_TOP_K));
};

const formatActiveStoryCards = (cards: EmbeddedStoryCard[]): string => {
  if (cards.length === 0) return '';

  return cards.map((card) => `[World Info - ${card.title}]: ${card.entry}`).join('\n');
};

const buildContext = (state: GameState, input: PlayerInput, activeCards: string): string => {
  const characterContext = state.characters
    .map(
      (c) =>
        `ID[${c.id}] Name[${c.name}] Role[${c.role}]\n- Status: ${c.status}\n- Psychology: [Trust:${c.emotions.trust}, Fear:${c.emotions.fear}, Anger:${c.emotions.anger}, Hope:${c.emotions.hope}]\n- Description: ${c.description}`,
    )
    .join('\n');

  const historyContext = state.history
    .slice(-8)
    .map((h) => `[${h.type}] ${h.description}`)
    .join('\n');

  const location = state.world.locations[state.world.currentLocationId];

  return [
    `Title: ${state.title}`,
    `Location: ${location?.name ?? 'Unknown'} (${location?.description ?? 'Unknown location'})`,
    `Time/Context: ${state.world.time}`,
    `DNA: orderChaos=${state.storyDNA.orderChaos}, hopeDespair=${state.storyDNA.hopeDespair}, trustBetrayal=${state.storyDNA.trustBetrayal}`,
    `Director override: tension=${state.directorState.tension}, pacing=${state.directorState.pacing}, focus=${state.directorState.narrativeFocus}`,
    `Characters:\n${characterContext}`,
    `Facts: ${state.world.facts.slice(-5).join('; ') || 'none'}`,
    activeCards ? `Triggered lore:\n${activeCards}` : '',
    `Recent history:\n${historyContext || 'none'}`,
    `Player input type=${input.type}`,
    `Player input text="${input.content}"`,
    input.isVoice && input.audioBase64 ? `Player audio provided, mimeType=${input.audioMimeType ?? 'unknown'}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
};

const buildAgent1Prompt = (context: string): string => `
You are Agent 1 (Nova 2 Sonic). Produce the narrator transcript from context + player input.
Return strict JSON only:
{
  "transcript": string,
  "audio": { "mimeType": string, "payload": string } // optional
}
Rules:
- transcript is required and non-empty.
- audio is optional. Include only if available.
- No markdown or commentary.

CONTEXT
${context}
`;

const buildAgent2Prompt = (context: string, transcript: string): string => `
You are Agent 2 (Nova 2 Lite). Use context + transcript and return strict JSON only:
{
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
  }
}
Rules:
- world.narrative must match transcript semantics.
- Return strict JSON only.
- No markdown or commentary.

CONTEXT
${context}

TRANSCRIPT
${transcript}
`;

const parseModelJson = <T>(rawText: string): T => JSON.parse(sanitizeJsonText(rawText)) as T;

const validateAgent1 = (candidate: unknown): Agent1Response => {
  const value = candidate as Partial<Agent1Response>;
  const transcript = typeof value?.transcript === 'string' ? value.transcript.trim() : '';

  if (!transcript) {
    throw new Error('Agent 1 response missing transcript');
  }

  const audio =
    value?.audio &&
    typeof value.audio.mimeType === 'string' &&
    typeof value.audio.payload === 'string' &&
    value.audio.mimeType.trim() &&
    value.audio.payload.trim()
      ? { mimeType: value.audio.mimeType.trim(), payload: value.audio.payload.trim() }
      : undefined;

  return { transcript, ...(audio ? { audio } : {}) };
};

const validateAgent2 = (candidate: unknown, transcript: string): Agent2Response => {
  const value = candidate as Partial<Agent2Response>;
  const directorSrc = value?.director ?? ({} as DirectorAgentResponse);
  const worldSrc = value?.world ?? ({} as WorldUpdateResponse);

  const pacing = directorSrc.pacing === 'Slow' || directorSrc.pacing === 'Fast' || directorSrc.pacing === 'Normal' ? directorSrc.pacing : 'Normal';
  const director: DirectorAgentResponse = {
    pacing,
    tension: asNumber(directorSrc.tension, 50),
    narrativeFocus: typeof directorSrc.narrativeFocus === 'string' && directorSrc.narrativeFocus.trim() ? directorSrc.narrativeFocus.trim() : 'Immediate consequences',
    suggestedHints: asStringArray(directorSrc.suggestedHints, []),
  };

  const characterUpdates = Array.isArray(worldSrc.characterUpdates)
    ? worldSrc.characterUpdates
        .filter((u): u is NonNullable<WorldUpdateResponse['characterUpdates']>[number] => Boolean(u && typeof u.id === 'string' && u.id.trim()))
        .map((u) => ({
          id: u.id.trim(),
          emotions: {
            trust: asNumber(u.emotions?.trust, 50),
            fear: asNumber(u.emotions?.fear, 50),
            anger: asNumber(u.emotions?.anger, 50),
            hope: asNumber(u.emotions?.hope, 50),
          },
          ...(typeof u.status === 'string' && u.status.trim() ? { status: u.status.trim() } : {}),
        }))
    : [];

  const world: WorldUpdateResponse = {
    narrative: transcript,
    characterUpdates,
    ...(Array.isArray(worldSrc.newFacts) ? { newFacts: asStringArray(worldSrc.newFacts, []) } : {}),
    ...(worldSrc.dnaShift
      ? {
          dnaShift: {
            orderChaos: asNumber(worldSrc.dnaShift.orderChaos, 50),
            hopeDespair: asNumber(worldSrc.dnaShift.hopeDespair, 50),
            trustBetrayal: asNumber(worldSrc.dnaShift.trustBetrayal, 50),
          },
        }
      : {}),
  };

  return { director, world };
};

const extractTranscriptFromRawAgent1 = (rawText: string): string | null => {
  const sanitized = sanitizeJsonText(rawText);
  const transcriptMatch = sanitized.match(/"transcript"\s*:\s*("(?:\\.|[^"\\])*")/s);

  if (!transcriptMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(transcriptMatch[1]) as string;
    const trimmed = typeof parsed === 'string' ? parsed.trim() : '';
    return trimmed || null;
  } catch {
    return null;
  }
};

const parseAgent1Response = (rawText: string): { response: Agent1Response; warning?: string } => {
  try {
    return { response: validateAgent1(parseModelJson<Agent1Response>(rawText)) };
  } catch (error) {
    const transcript = extractTranscriptFromRawAgent1(rawText);
    if (transcript) {
      return {
        response: { transcript },
        warning: `Narrator audio payload failed validation; continued with transcript-only response. (${error instanceof Error ? error.message : 'Unknown error'})`,
      };
    }

    throw error;
  }
};

const buildSafeAgent2Fallback = (state: GameState, transcript: string): Agent2Response => ({
  director: {
    pacing: state.directorState.pacing === 'Slow' || state.directorState.pacing === 'Fast' || state.directorState.pacing === 'Normal' ? state.directorState.pacing : 'Normal',
    tension: asNumber(state.directorState.tension, 50),
    narrativeFocus: typeof state.directorState.narrativeFocus === 'string' && state.directorState.narrativeFocus.trim() ? state.directorState.narrativeFocus.trim() : 'Immediate consequences',
    suggestedHints: asStringArray(state.directorState.suggestedHints, []),
  },
  world: {
    narrative: transcript,
    characterUpdates: [],
    newFacts: [],
    dnaShift: {
      orderChaos: asNumber(state.storyDNA.orderChaos, 50),
      hopeDespair: asNumber(state.storyDNA.hopeDespair, 50),
      trustBetrayal: asNumber(state.storyDNA.trustBetrayal, 50),
    },
  },
});

const assembleTurnResponse = (
  agent1: Agent1Response,
  agent2: Agent2Response,
  latencyMs: number,
  stageLatenciesMs: Record<string, number>,
  traceMetadata?: TraceMetadata
): TurnResponse => ({
  transcript: agent1.transcript,
  ...(agent1.audio ? { audio: agent1.audio } : {}),
  director: agent2.director,
  world: agent2.world,
  trace: {
    agentNames: ['Nova 2 Sonic', 'Nova 2 Lite', 'Assembler'],
    pipeline: ['agent1:narration', 'agent2:director_world', 'assembler:turn_response'],
    latencyMs,
    stageLatenciesMs,
    ...(traceMetadata ? { metadata: traceMetadata } : {}),
  },
});

const callAgent = async (client: BedrockRuntimeClient, modelId: string, prompt: string): Promise<string> => {
  const payload = {
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    inferenceConfig: {
      temperature: 0.4,
    },
  };

  const response = await client.send(
    new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    }),
  );

  const rawBody = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(rawBody) as { output?: { message?: { content?: Array<{ text?: string }> } } };
  const text = parsed.output?.message?.content?.find((part) => typeof part.text === 'string')?.text?.trim();

  return text || '';
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

  if (!BEDROCK_REGION) {
    res.status(500).json({ error: 'Server misconfiguration: AWS_REGION (or AWS_DEFAULT_REGION) is missing.' });
    return;
  }

  if (!NARRATOR_MODEL || !DIRECTOR_MODEL) {
    res.status(500).json({ error: 'Server misconfiguration: BEDROCK_NARRATOR_MODEL_ID or BEDROCK_DIRECTOR_MODEL_ID is missing.' });
    return;
  }

  const { state, input } = req.body || {};
  if (!state || !input) {
    res.status(400).json({ error: 'Expected request body with { state, input }.' });
    return;
  }

  const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });
  const start = Date.now();

  try {
    const gameState = state as GameState;
    const playerInput = input as PlayerInput;

    const semanticCards = await getSemanticMatchedCards(client, gameState, playerInput);
    const usedKeywordFallback = semanticCards === null;
    const activeCards = semanticCards ?? getKeywordMatchedCards(gameState, playerInput);
    const context = buildContext(gameState, playerInput, formatActiveStoryCards(activeCards));
    const stageLatenciesMs: Record<string, number> = {};

    const agent1Start = Date.now();
    const agent1Raw = await callAgent(client, NARRATOR_MODEL, buildAgent1Prompt(context));
    stageLatenciesMs['agent1:narration'] = Date.now() - agent1Start;
    const parsedAgent1 = parseAgent1Response(agent1Raw);
    const agent1 = parsedAgent1.response;

    const traceMetadata: TraceMetadata = {
      ...(parsedAgent1.warning ? { warnings: [parsedAgent1.warning] } : {}),
      ...(usedKeywordFallback
        ? { warnings: [...(parsedAgent1.warning ? [parsedAgent1.warning] : []), 'Story-card embeddings unavailable; used keyword matcher fallback.'] }
        : {}),
    };

    let agent2: Agent2Response;
    try {
      const agent2Start = Date.now();
      const agent2Raw = await callAgent(client, DIRECTOR_MODEL, buildAgent2Prompt(context, agent1.transcript));
      stageLatenciesMs['agent2:director_world'] = Date.now() - agent2Start;
      agent2 = validateAgent2(parseModelJson<Agent2Response>(agent2Raw), agent1.transcript);
    } catch (error) {
      const fallbackReason = `Director response invalid JSON/shape; applied safe fallback state. (${error instanceof Error ? error.message : 'Unknown error'})`;
      traceMetadata.fallbackReason = fallbackReason;
      traceMetadata.warnings = [...(traceMetadata.warnings ?? []), fallbackReason];
      agent2 = buildSafeAgent2Fallback(state as GameState, agent1.transcript);
      stageLatenciesMs['agent2:director_world'] = stageLatenciesMs['agent2:director_world'] ?? 0;
    }

    stageLatenciesMs['assembler:turn_response'] = Math.max(0, Date.now() - start - (stageLatenciesMs['agent1:narration'] ?? 0) - (stageLatenciesMs['agent2:director_world'] ?? 0));
    const response = assembleTurnResponse(agent1, agent2, Date.now() - start, stageLatenciesMs, Object.keys(traceMetadata).length > 0 ? traceMetadata : undefined);

    if (!response.transcript || !response.world.narrative || !response.director.pacing) {
      throw new Error('Defensive response validation failed');
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Turn generation failed:', error);
    res.status(502).json({ error: 'Model request failed.' });
  }
}
