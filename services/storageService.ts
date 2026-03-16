import { GameState } from '../types';

const STORAGE_KEY = 'rp_agent_saves_v2';
const SAVE_SCHEMA_VERSION = 1;

interface SavesPayload {
  schemaVersion: number;
  saves: Record<string, GameState>;
}

export interface SaveMetadata {
  id: string;
  title: string;
  lastPlayed: number;
  tick: number;
  previewText: string;
}

/**
 * Saves the game state to LocalStorage.
 * Updates the 'lastPlayed' timestamp.
 */
interface SaveGameOptions {
  force?: boolean;
}

export type StorageOperation = 'save' | 'load' | 'delete' | 'list';

export type StorageErrorCode =
  | 'STORAGE_READ_FAILED'
  | 'STORAGE_WRITE_FAILED'
  | 'STORAGE_PARSE_FAILED';

export interface StorageError {
  code: StorageErrorCode;
  operation: StorageOperation;
  message: string;
  cause?: unknown;
}

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StorageError };

interface SaveGameResult {
  skipped: boolean;
}

export const saveGame = (state: GameState, options?: SaveGameOptions): StorageResult<SaveGameResult> => {
  try {
    const saves = loadAllSavesRaw();
    const sanitizedState = sanitizeSaveState(state);
    const existingState = saves[state.id];

    if (!options?.force && existingState && areSnapshotsEqual(existingState, sanitizedState)) {
      return {
        ok: true,
        data: { skipped: true }
      };
    }

    const updatedState = {
      ...sanitizedState,
      lastPlayed: Date.now()
    };
    saves[state.id] = updatedState;
    writeSavesPayload(saves);
    return {
      ok: true,
      data: { skipped: false }
    };
  } catch (e) {
    console.error("Failed to save game", e);
    return {
      ok: false,
      error: {
        code: 'STORAGE_WRITE_FAILED',
        operation: 'save',
        message: 'Could not save progress to local storage.',
        cause: e
      }
    };
  }
};

/**
 * Loads a specific game by ID.
 */
export const loadGame = (id: string): StorageResult<GameState | null> => {
  try {
    const saves = loadAllSavesRaw();
    return {
      ok: true,
      data: saves[id] || null
    };
  } catch (e) {
    console.error("Failed to load game", e);
    return {
      ok: false,
      error: {
        code: 'STORAGE_READ_FAILED',
        operation: 'load',
        message: 'Could not load save data from local storage.',
        cause: e
      }
    };
  }
};

/**
 * Deletes a game save.
 */
export const deleteGame = (id: string): StorageResult<void> => {
  try {
    const saves = loadAllSavesRaw();
    delete saves[id];
    writeSavesPayload(saves);
    return {
      ok: true,
      data: undefined
    };
  } catch (e) {
    console.error("Failed to delete save", e);
    return {
      ok: false,
      error: {
        code: 'STORAGE_WRITE_FAILED',
        operation: 'delete',
        message: 'Could not delete save from local storage.',
        cause: e
      }
    };
  }
};

/**
 * Returns a list of all saved games for the UI.
 */
export const getSavedGames = (): StorageResult<SaveMetadata[]> => {
  try {
    const saves = loadAllSavesRaw();
    return {
      ok: true,
      data: Object.values(saves)
        .map(state => {
          const lastDescription = state.history[state.history.length - 1]?.description;

          return {
            id: state.id,
            title: state.title,
            lastPlayed: state.lastPlayed || Date.now(),
            tick: state.tick,
            previewText: lastDescription
              ? lastDescription.substring(0, 100) + "..."
              : "No history."
          };
        })
        .sort((a, b) => b.lastPlayed - a.lastPlayed)
    };
  } catch (e) {
    console.error("Failed to list saves", e);
    return {
      ok: false,
      error: {
        code: 'STORAGE_READ_FAILED',
        operation: 'list',
        message: 'Could not list save data from local storage.',
        cause: e
      }
    };
  }
};

// Internal Helper
const loadAllSavesRaw = (): Record<string, GameState> => {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return {};

  try {
    const parsed = JSON.parse(json) as Record<string, GameState> | SavesPayload;

    // Backward compatibility for older storage payloads that persisted raw map directly.
    if (!('schemaVersion' in parsed) || !('saves' in parsed)) {
      return parsed as Record<string, GameState>;
    }

    return parsed.saves;
  } catch (e) {
    console.error("Failed to parse save payload", e);
    return {};
  }
};

const writeSavesPayload = (saves: Record<string, GameState>): void => {
  const payload: SavesPayload = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    saves
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};


const stripLastPlayed = (state: GameState): Omit<GameState, 'lastPlayed'> => {
  const { lastPlayed: _lastPlayed, ...rest } = state;
  return rest;
};

const areSnapshotsEqual = (previous: GameState, next: GameState): boolean => {
  return JSON.stringify(stripLastPlayed(previous)) === JSON.stringify(stripLastPlayed(next));
};

const sanitizeSaveState = (state: GameState): GameState => ({
  ...state,
  history: state.history.map(entry => {
    const { audioBase64: _audioBase64, ...safeEntry } = entry;
    return safeEntry;
  })
});
