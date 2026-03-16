import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteGame, getSavedGames, loadGame, saveGame } from './storageService';
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

    const savesResult = getSavedGames();

    expect(savesResult.ok).toBe(true);
    if (!savesResult.ok) return;

    expect(savesResult.data).toHaveLength(1);
    expect(savesResult.data[0].previewText).toBe('No history.');
  });
});


describe('saveGame snapshot behavior', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips localStorage writes for unchanged snapshots unless forced', () => {
    const localStorageMock = createStorage();
    vi.stubGlobal('localStorage', localStorageMock);

    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    const state = buildGameState();
    const firstSave = saveGame(state);
    expect(firstSave).toEqual({ ok: true, data: { skipped: false } });
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(2000);
    const secondSave = saveGame(state);
    expect(secondSave).toEqual({ ok: true, data: { skipped: true } });
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(3000);
    const forcedSave = saveGame(state, { force: true });
    expect(forcedSave).toEqual({ ok: true, data: { skipped: false } });
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });
});


describe('storage errors', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns structured load/list/delete errors when localStorage read fails', () => {
    const localStorageMock = {
      getItem: vi.fn(() => {
        throw new Error('read fail');
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    vi.stubGlobal('localStorage', localStorageMock);

    const loadResult = loadGame('missing-id');
    expect(loadResult.ok).toBe(false);
    if (loadResult.ok) return;
    expect(loadResult.error.code).toBe('STORAGE_READ_FAILED');

    const listResult = getSavedGames();
    expect(listResult.ok).toBe(false);
    if (listResult.ok) return;
    expect(listResult.error.code).toBe('STORAGE_READ_FAILED');

    const deleteResult = deleteGame('save-id');
    expect(deleteResult.ok).toBe(false);
    if (deleteResult.ok) return;
    expect(deleteResult.error.code).toBe('STORAGE_WRITE_FAILED');
  });

  it('returns structured save/delete errors when localStorage write fails', () => {
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('write fail');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    vi.stubGlobal('localStorage', localStorageMock);

    const state = buildGameState();
    const saveResult = saveGame(state);
    expect(saveResult.ok).toBe(false);
    if (saveResult.ok) return;
    expect(saveResult.error.code).toBe('STORAGE_WRITE_FAILED');

    const deleteResult = deleteGame(state.id);
    expect(deleteResult.ok).toBe(false);
    if (deleteResult.ok) return;
    expect(deleteResult.error.code).toBe('STORAGE_WRITE_FAILED');
  });
});
