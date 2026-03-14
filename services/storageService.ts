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
export const saveGame = (state: GameState): void => {
  try {
    const saves = loadAllSavesRaw();
    const updatedState = {
      ...sanitizeSaveState(state),
      lastPlayed: Date.now()
    };
    saves[state.id] = updatedState;
    writeSavesPayload(saves);
  } catch (e) {
    console.error("Failed to save game", e);
  }
};

/**
 * Loads a specific game by ID.
 */
export const loadGame = (id: string): GameState | null => {
  try {
    const saves = loadAllSavesRaw();
    return saves[id] || null;
  } catch (e) {
    console.error("Failed to load game", e);
    return null;
  }
};

/**
 * Deletes a game save.
 */
export const deleteGame = (id: string): void => {
  try {
    const saves = loadAllSavesRaw();
    delete saves[id];
    writeSavesPayload(saves);
  } catch (e) {
    console.error("Failed to delete save", e);
  }
};

/**
 * Returns a list of all saved games for the UI.
 */
export const getSavedGames = (): SaveMetadata[] => {
  const saves = loadAllSavesRaw();
  return Object.values(saves)
    .map(state => ({
      id: state.id,
      title: state.title,
      lastPlayed: state.lastPlayed || Date.now(),
      tick: state.tick,
      previewText: state.history[state.history.length - 1]?.description?.substring(0, 100) + "..." || "No history."
    }))
    .sort((a, b) => b.lastPlayed - a.lastPlayed); // Sort by most recent
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
  } catch {
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

const sanitizeSaveState = (state: GameState): GameState => ({
  ...state,
  history: state.history.map(entry => {
    const { audioBase64: _audioBase64, ...safeEntry } = entry;
    return safeEntry;
  })
});
