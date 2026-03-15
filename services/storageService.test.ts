import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSavedGames } from './storageService';
import { buildGameState } from '../tests/fixtures';

const createStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void store.set(key, value)),
    removeItem: vi.fn((key: string) => void store.delete(key)),
    clear: vi.fn(() => void store.clear()),
  };
};

describe('getSavedGames preview text', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns "No history." preview when a save has no events', () => {
    const localStorageMock = createStorage();
    vi.stubGlobal('localStorage', localStorageMock);

    const state = buildGameState();
    localStorageMock.setItem(
      'rp_agent_saves_v2',
      JSON.stringify({
        schemaVersion: 1,
        saves: {
          [state.id]: state
        }
      })
    );

    const saves = getSavedGames();

    expect(saves).toHaveLength(1);
    expect(saves[0].previewText).toBe('No history.');
  });
});
