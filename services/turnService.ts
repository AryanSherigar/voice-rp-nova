import { GameState, PlayerInput, TurnResponse } from '../types';

const PRIMARY_TURN_ENDPOINT = '/api/turn';
const GEMINI_FALLBACK_TURN_ENDPOINT = '/api/aws-turn';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isPacing = (value: unknown): value is 'Slow' | 'Normal' | 'Fast' => {
  return value === 'Slow' || value === 'Normal' || value === 'Fast';
};

export const isTurnResponse = (value: unknown): value is TurnResponse => {
  if (!isRecord(value)) return false;
  if (!isRecord(value.narrator) || typeof value.narrator.transcript !== 'string') return false;

  if (value.narrator.audio !== undefined) {
    if (!isRecord(value.narrator.audio)) return false;
    if (typeof value.narrator.audio.mimeType !== 'string' || typeof value.narrator.audio.payload !== 'string') return false;
  }

  if (!isRecord(value.director)) return false;
  if (!isPacing(value.director.pacing)) return false;
  if (typeof value.director.tension !== 'number') return false;
  if (typeof value.director.narrativeFocus !== 'string') return false;
  if (!Array.isArray(value.director.suggestedHints) || !value.director.suggestedHints.every(h => typeof h === 'string')) return false;

  if (!isRecord(value.world)) return false;
  if (!Array.isArray(value.world.characterUpdates)) return false;

  if (value.trace !== undefined) {
    if (!isRecord(value.trace)) return false;
    if (value.trace.agentNames !== undefined && (!Array.isArray(value.trace.agentNames) || !value.trace.agentNames.every(a => typeof a === 'string'))) return false;
    if (value.trace.latencyMs !== undefined && typeof value.trace.latencyMs !== 'number') return false;
  }

  return true;
};

const postTurn = async (endpoint: string, state: GameState, input: PlayerInput): Promise<TurnResponse> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, input })
  });

  if (!response.ok) {
    throw new Error(`Turn request failed with status ${response.status} (${endpoint})`);
  }

  const data: unknown = await response.json();
  if (!isTurnResponse(data)) {
    throw new Error(`Turn request returned an invalid response contract (${endpoint}).`);
  }

  return data;
};

export const executeTurn = async (state: GameState, input: PlayerInput): Promise<TurnResponse> => {
  try {
    return await postTurn(PRIMARY_TURN_ENDPOINT, state, input);
  } catch (error) {
    console.warn('Primary turn route failed; falling back to Gemini route during migration.', error);
    return postTurn(GEMINI_FALLBACK_TURN_ENDPOINT, state, input);
  }
};
