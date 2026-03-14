import { GameState, PlayerInput, TurnResponse } from '../types';
import { TURN_TIMEOUT_MS } from './config';

const PRIMARY_TURN_ENDPOINT = '/api/turn';

export class TurnTimeoutError extends Error {
  constructor(message = `Turn request timed out after ${TURN_TIMEOUT_MS}ms.`, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TurnTimeoutError';
  }
}

const isAbortError = (error: unknown): error is DOMException => {
  return error instanceof DOMException && error.name === 'AbortError';
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isPacing = (value: unknown): value is 'Slow' | 'Normal' | 'Fast' => {
  return value === 'Slow' || value === 'Normal' || value === 'Fast';
};

export const isTurnResponse = (value: unknown): value is TurnResponse => {
  if (!isRecord(value)) return false;
  if (typeof value.transcript !== 'string') return false;

  if (value.audio !== undefined) {
    if (!isRecord(value.audio)) return false;
    if (typeof value.audio.mimeType !== 'string' || typeof value.audio.payload !== 'string') return false;
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
    if (value.trace.stageLatenciesMs !== undefined) {
      if (!isRecord(value.trace.stageLatenciesMs)) return false;
      if (!Object.values(value.trace.stageLatenciesMs).every(v => typeof v === 'number')) return false;
    }
    if (value.trace.metadata !== undefined) {
      if (!isRecord(value.trace.metadata)) return false;
      if (value.trace.metadata.warnings !== undefined && (!Array.isArray(value.trace.metadata.warnings) || !value.trace.metadata.warnings.every(w => typeof w === 'string'))) return false;
      if (value.trace.metadata.fallbackReason !== undefined && typeof value.trace.metadata.fallbackReason !== 'string') return false;
    }
  }

  return true;
};

const postTurn = async (endpoint: string, state: GameState, input: PlayerInput, signal?: AbortSignal): Promise<TurnResponse> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, input }),
    signal
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
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, TURN_TIMEOUT_MS);

  try {
    return await postTurn(PRIMARY_TURN_ENDPOINT, state, input, abortController.signal);
  } catch (error) {
    if (isAbortError(error) || abortController.signal.aborted) {
      throw new TurnTimeoutError(undefined, { cause: error });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
