export enum EmotionType {
  Trust = 'Trust',
  Fear = 'Fear',
  Anger = 'Anger',
  Hope = 'Hope'
}

export interface EmotionModel {
  trust: number;
  fear: number;
  anger: number;
  hope: number;
}

export interface CharacterState {
  id: string;
  name: string;
  role: string;
  description: string;
  emotions: EmotionModel;
  status: string; // e.g., "Healthy", "Injured", "Suspicious"
}

export interface Location {
  id: string;
  name: string;
  description: string;
}

// New Interface for Story Cards
export interface StoryCard {
  id: string;
  title: string;
  keys: string[]; // Keywords that trigger this card
  entry: string; // The content injected into context
  isActive?: boolean; // UI helper to show if it was triggered in the last turn
  characterId?: string; // Optional link to a specific character
  locationId?: string; // Optional link to a specific location
}

export interface WorldState {
  currentLocationId: string;
  locations: Record<string, Location>;
  time: string;
  facts: string[];
}

export interface StoryDNAState {
  orderChaos: number; // 0-100
  hopeDespair: number; // 0-100
  trustBetrayal: number; // 0-100
}

export interface DirectorDecision {
  pacing: 'Slow' | 'Normal' | 'Fast';
  tension: number; // 0-100
  narrativeFocus: string;
  suggestedHints: string[];
}

export interface EventLogEntry {
  id: string;
  tick: number;
  type: 'PLAYER' | 'DIRECTOR' | 'NARRATOR';
  description: string;
  timestamp: number;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface GameState {
  id: string;
  title: string;
  tick: number;
  lastPlayed?: number; // Added for save system
  world: WorldState;
  characters: CharacterState[];
  storyCards: StoryCard[]; // Added Story Cards to State
  storyDNA: StoryDNAState;
  directorState: DirectorDecision;
  history: EventLogEntry[];
  isProcessing: boolean;
}

export enum InputType {
  DO = 'DO',
  SAY = 'SAY',
  STORY = 'STORY'
}

export interface PlayerInput {
  type: InputType;
  content: string;
  isVoice?: boolean;
  audioBase64?: string;
  audioMimeType?: string;
}

// Responses from turn engine
export interface DirectorAgentResponse {
  pacing: 'Slow' | 'Normal' | 'Fast';
  tension: number;
  narrativeFocus: string;
  suggestedHints: string[];
}

export interface WorldUpdateResponse {
  narrative: string;
  characterUpdates: {
    id: string;
    emotions: Partial<EmotionModel>;
    status?: string;
  }[];
  newFacts?: string[];
  dnaShift?: Partial<StoryDNAState>;
}

export interface NarratorAudioPayload {
  mimeType: string;
  payload: string;
}

export interface TurnTrace {
  agentNames?: string[];
  latencyMs?: number;
  pipeline?: string[];
  metadata?: {
    warnings?: string[];
    fallbackReason?: string;
  };
}

export interface TurnResponse {
  narrator: {
    transcript: string;
    audio?: NarratorAudioPayload;
    audioBase64?: string;
    audioMimeType?: string;
  };
  director: DirectorAgentResponse;
  world: WorldUpdateResponse;
  event?: {
    audioBase64?: string;
    audioMimeType?: string;
  };
  trace?: TurnTrace;
}

// --- Navigation & Creation Types ---

export enum ViewMode {
  LANDING = 'LANDING',
  HUB = 'HUB',
  CREATE = 'CREATE',
  PLAY = 'PLAY'
}

export interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  initialState: GameState;
}

export interface CreateStoryFormData {
  title: string;
  settingName: string;
  settingDescription: string;
  characters: {
    name: string;
    role: string;
    description: string;
    lore?: string; // New field for character backstory/secrets
  }[];
}
