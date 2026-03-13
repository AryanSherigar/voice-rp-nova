import { GameState } from '../types';

const STORAGE_KEY = 'rp_agent_saves_v2';

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
    const updatedState = { ...state, lastPlayed: Date.now() };
    saves[state.id] = updatedState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
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
    return JSON.parse(json);
  } catch {
    return {};
  }
};