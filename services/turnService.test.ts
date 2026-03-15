import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeTurn, TurnTimeoutError } from './turnService';
import { TURN_TIMEOUT_MS } from './config';
import { buildGameState, buildPlayerInput } from '../tests/fixtures';

describe('executeTurn timeout behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('throws TurnTimeoutError when request exceeds configured timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      })
    );

    const turnPromise = executeTurn(buildGameState(), buildPlayerInput());
    const rejection = expect(turnPromise).rejects.toBeInstanceOf(TurnTimeoutError);

    await vi.advanceTimersByTimeAsync(TURN_TIMEOUT_MS + 1);
    await rejection;
  });
});
