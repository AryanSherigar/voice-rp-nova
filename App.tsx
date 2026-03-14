import React, { useReducer, useCallback, useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StoryLog } from './components/StoryLog';
import { ActionPanel } from './components/ActionPanel';
import { LandingPage } from './components/LandingPage';
import { Hub } from './components/Hub';
import { CreateStory } from './components/CreateStory';
import { StoryCardManager } from './components/StoryCardManager';
import { CharacterManager } from './components/CharacterManager';
import { LocationManager } from './components/LocationManager';
import { DirectorOverlay } from './components/DirectorOverlay'; // Import DirectorOverlay
import { createGameStateFromForm } from './utils/gameFactory';
import { saveGame } from './services/storageService';
import {
  GameState,
  PlayerInput,
  EventLogEntry,
  WorldUpdateResponse,
  DirectorAgentResponse,
  TurnResponse,
  ViewMode,
  ScenarioTemplate,
  CreateStoryFormData,
  StoryCard,
  CharacterState,
  Location,
  DirectorDecision,
  TurnTrace
} from './types';
import { TurnTimeoutError, executeTurn } from './services/turnService';
import { TURN_TIMEOUT_MS } from './services/config';

const SYSTEM_STABILIZED_MESSAGE = '[SYSTEM: Cognitive divergence detected. World state stabilized.]';
const SYSTEM_MISSING_TERMINAL_MESSAGE = '[SYSTEM: Turn finalized with fallback (missing terminal chunk).]';

// --- State Management ---

type Action =
  | { type: 'START_TURN' }
  | { type: 'STREAM_UPDATE'; payload: { description: string; audioBase64?: string; audioMimeType?: string } }
  | { type: 'END_TURN'; payload: { director: DirectorAgentResponse; world: WorldUpdateResponse } }
  | { type: 'ADD_LOG'; payload: EventLogEntry }
  | { type: 'INIT_GAME'; payload: GameState }
  | { type: 'RESET_GAME' }
  // Story Card Actions
  | { type: 'ADD_CARD'; payload: StoryCard }
  | { type: 'UPDATE_CARD'; payload: StoryCard }
  | { type: 'DELETE_CARD'; payload: string }
  // Character Actions
  | { type: 'ADD_CHARACTER'; payload: CharacterState }
  | { type: 'UPDATE_CHARACTER'; payload: CharacterState }
  | { type: 'DELETE_CHARACTER'; payload: string }
  // Location Actions
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: Location }
  | { type: 'DELETE_LOCATION'; payload: string }
  // Director Actions
  | { type: 'UPDATE_DIRECTOR_STATE'; payload: Partial<DirectorDecision> };

function gameReducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === 'INIT_GAME') {
    return action.payload;
  }
  if (action.type === 'RESET_GAME') {
    return null;
  }
  if (!state) return null;

  switch (action.type) {
    case 'START_TURN':
      return { ...state, isProcessing: true };

    case 'ADD_LOG':
      return { ...state, history: [...state.history, action.payload] };

    case 'STREAM_UPDATE': {
      const narratorEntry: EventLogEntry = {
        id: `evt_${Date.now()}`,
        tick: state.tick + 1,
        type: 'NARRATOR',
        description: action.payload.description,
        timestamp: Date.now(),
        audioBase64: action.payload.audioBase64,
        audioMimeType: action.payload.audioMimeType
      };

      return { ...state, history: [...state.history, narratorEntry] };
    }

    case 'END_TURN':
      const { director, world } = action.payload;

      const updatedCharacters = state.characters.map(char => {
        const update = world.characterUpdates?.find(u => u.id === char.id);
        if (!update) return char;
        return {
          ...char,
          status: update.status || char.status,
          emotions: { ...char.emotions, ...update.emotions }
        };
      });

      const directorEntry: EventLogEntry = {
        id: `dir_${Date.now()}`,
        tick: state.tick + 1,
        type: 'DIRECTOR',
        description: `Director: ${director.pacing} Pacing`,
        timestamp: Date.now()
      };

      // Reset card activity on new turn (could be enhanced to highlight cards used in *this* turn if backend returned them)
      const resetCards = state.storyCards.map(c => ({ ...c, isActive: false }));

      const newState = {
        ...state,
        tick: state.tick + 1,
        isProcessing: false,
        history: [...state.history, directorEntry],
        characters: updatedCharacters,
        directorState: director,
        storyCards: resetCards,
        storyDNA: { ...state.storyDNA, ...(world.dnaShift || {}) }
      };

      return newState;

    // Story Card Reducers
    case 'ADD_CARD':
      return { ...state, storyCards: [...(state.storyCards || []), action.payload] };

    case 'UPDATE_CARD':
      return {
        ...state,
        storyCards: state.storyCards.map(c => c.id === action.payload.id ? action.payload : c)
      };

    case 'DELETE_CARD':
      return {
        ...state,
        storyCards: state.storyCards.filter(c => c.id !== action.payload)
      };

    // Character Reducers
    case 'ADD_CHARACTER':
      return { ...state, characters: [...state.characters, action.payload] };

    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map(c => c.id === action.payload.id ? action.payload : c)
      };

    case 'DELETE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter(c => c.id !== action.payload)
      };

    // Location Reducers
    case 'ADD_LOCATION':
      return {
        ...state,
        world: {
          ...state.world,
          locations: { ...state.world.locations, [action.payload.id]: action.payload }
        }
      };

    case 'UPDATE_LOCATION':
      return {
        ...state,
        world: {
          ...state.world,
          locations: { ...state.world.locations, [action.payload.id]: action.payload }
        }
      };

    case 'DELETE_LOCATION': {
      // Don't delete current location
      if (action.payload === state.world.currentLocationId) return state;

      const newLocations = { ...state.world.locations };
      delete newLocations[action.payload];
      return {
        ...state,
        world: { ...state.world, locations: newLocations }
      };
    }

    // Director Reducers
    case 'UPDATE_DIRECTOR_STATE':
      return {
        ...state,
        directorState: { ...state.directorState, ...action.payload }
      };

    default:
      return state;
  }
}

export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.LANDING);
  const [gameState, dispatch] = useReducer(gameReducer, null);
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [lastTurnTrace, setLastTurnTrace] = useState<TurnTrace | null>(null);

  // Persistence Effect: Auto-save when game state changes (and isn't processing)
  useEffect(() => {
    if (gameState && !gameState.isProcessing) {
      saveGame(gameState);
    }
  }, [gameState]);

  // --- Actions ---

  const enterHub = () => setView(ViewMode.HUB);
  const startCreation = () => setView(ViewMode.CREATE);

  const startScenario = (scenario: ScenarioTemplate) => {
    // Generate a fresh unique ID for new scenario instances so they don't overwrite the template slots if we had them
    const freshState = {
      ...scenario.initialState,
      id: `game_${Date.now()}`,
      lastPlayed: Date.now()
    };
    dispatch({ type: 'INIT_GAME', payload: freshState });
    setView(ViewMode.PLAY);
  };

  const loadSavedGame = (state: GameState) => {
    dispatch({ type: 'INIT_GAME', payload: state });
    setView(ViewMode.PLAY);
  };

  const submitCustomStory = (data: CreateStoryFormData) => {
    const newState = createGameStateFromForm(data);
    dispatch({ type: 'INIT_GAME', payload: newState });
    setView(ViewMode.PLAY);
  };

  const exitGame = () => {
    if (gameState) saveGame(gameState); // Ensure save on exit
    dispatch({ type: 'RESET_GAME' });
    setView(ViewMode.HUB);
  };

  const handleInput = useCallback(async (input: PlayerInput) => {
    if (!gameState) return;

    const fallbackTurnPayload: TurnResponse = {
      transcript: 'World state stabilized after a transient systems anomaly.',
      director: gameState.directorState,
      world: {
        narrative: 'World state stabilized after a transient systems anomaly.',
        characterUpdates: []
      },
      trace: {
        agentNames: ['fallback'],
      }
    };

    const inputEntry: EventLogEntry = {
      id: `in_${Date.now()}`,
      tick: gameState.tick,
      type: 'PLAYER',
      description: input.content,
      timestamp: Date.now(),
      audioBase64: input.audioBase64,
      audioMimeType: input.audioMimeType
    };
    dispatch({ type: 'ADD_LOG', payload: inputEntry });
    dispatch({ type: 'START_TURN' });
    setLastTurnTrace(null);

    const appendSystemLog = (description: string) => {
      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: `sys_${Date.now()}`,
          tick: gameState.tick + 1,
          type: 'DIRECTOR',
          description,
          timestamp: Date.now()
        }
      });
    };

    const finalizeWithFallback = (description: string) => {
      const fallbackTrace: TurnTrace = {
        agentNames: ['Nova 2 Sonic', 'Nova 2 Lite'],
        latencyMs: 0,
        stageLatenciesMs: {
          'agent1:narration': 0,
          'agent2:director_world': 0,
          'assembler:turn_response': 0
        },
        metadata: {
          fallbackReason: description
        }
      };
      setLastTurnTrace(fallbackTrace);
      dispatch({
        type: 'STREAM_UPDATE',
        payload: {
          description: fallbackTurnPayload.transcript,
          audioBase64: fallbackTurnPayload.audio?.payload,
          audioMimeType: fallbackTurnPayload.audio?.mimeType
        }
      });
      dispatch({ type: 'END_TURN', payload: { director: fallbackTurnPayload.director, world: fallbackTurnPayload.world } });
      appendSystemLog(description);
    };

    try {
      const turnResponse = await executeTurn(gameState, input);

      setLastTurnTrace(turnResponse.trace ?? null);
      dispatch({
        type: 'STREAM_UPDATE',
        payload: {
          description: turnResponse.transcript,
          audioBase64: turnResponse.audio?.payload,
          audioMimeType: turnResponse.audio?.mimeType
        }
      });
      dispatch({ type: 'END_TURN', payload: { director: turnResponse.director, world: turnResponse.world } });
    } catch (error) {
      console.error("Turn failed", error);
      if (error instanceof TurnTimeoutError) {
        finalizeWithFallback(`[SYSTEM: Stream timeout detected after ${TURN_TIMEOUT_MS}ms. World state stabilized.]`);
        return;
      }

      finalizeWithFallback(`${SYSTEM_STABILIZED_MESSAGE} (${SYSTEM_MISSING_TERMINAL_MESSAGE})`);
    }
  }, [gameState]);

  // --- Views ---

  if (view === ViewMode.LANDING) return <LandingPage onEnter={enterHub} />;

  if (view === ViewMode.HUB) return (
    <Layout>
      <Hub
        onSelectScenario={startScenario}
        onCreateNew={startCreation}
        onLoadGame={loadSavedGame}
      />
    </Layout>
  );

  if (view === ViewMode.CREATE) return <Layout><CreateStory onSubmit={submitCustomStory} onCancel={enterHub} /></Layout>;

  if (view === ViewMode.PLAY && gameState) {
    const locationList = Object.values(gameState.world.locations);

    // 1. Left Sidebar Content (Location Manager + DNA + Story Cards)
    const LeftSidebar = (
      <div className="p-4 space-y-8">
        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Current Location</h3>
          <div className="bg-navy-900 border border-navy-800 p-4 rounded mb-4">
            <h2 className="text-lg font-bold text-white mb-1">{gameState.world.locations[gameState.world.currentLocationId]?.name}</h2>
            <div className="text-[10px] text-teal-500 font-bold uppercase mb-2">CALM TONE</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {gameState.world.locations[gameState.world.currentLocationId]?.description}
            </p>
          </div>

          <LocationManager
            locations={locationList}
            currentLocationId={gameState.world.currentLocationId}
            onAdd={(loc) => dispatch({ type: 'ADD_LOCATION', payload: loc })}
            onUpdate={(loc) => dispatch({ type: 'UPDATE_LOCATION', payload: loc })}
            onDelete={(id) => dispatch({ type: 'DELETE_LOCATION', payload: id })}
          />
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Story DNA</h3>
          <div className="space-y-4">
            <DNAProgress label="Order / Chaos" value={gameState.storyDNA.orderChaos} />
            <DNAProgress label="Hope / Despair" value={gameState.storyDNA.hopeDespair} color="orange" />
            <DNAProgress label="Trust / Betrayal" value={gameState.storyDNA.trustBetrayal} color="teal" />
          </div>
        </section>

        <section className="pt-4 border-t border-navy-800">
          <StoryCardManager
            cards={gameState.storyCards || []}
            characters={gameState.characters}
            locations={locationList}
            onAdd={(card) => dispatch({ type: 'ADD_CARD', payload: card })}
            onUpdate={(card) => dispatch({ type: 'UPDATE_CARD', payload: card })}
            onDelete={(id) => dispatch({ type: 'DELETE_CARD', payload: id })}
          />
        </section>
      </div>
    );

    // 2. Right Sidebar Content (Character Manager)
    const RightSidebar = (
      <div className="p-4">
        <CharacterManager
          characters={gameState.characters}
          onAdd={(char) => dispatch({ type: 'ADD_CHARACTER', payload: char })}
          onUpdate={(char) => dispatch({ type: 'UPDATE_CHARACTER', payload: char })}
          onDelete={(id) => dispatch({ type: 'DELETE_CHARACTER', payload: id })}
        />
      </div>
    );

    const stageEntries = Object.entries(lastTurnTrace?.stageLatenciesMs ?? {});
    const TracePanel = (
      <div className="bg-navy-900/90 border border-navy-700 rounded px-2 py-1 text-[10px] leading-tight min-w-[220px]">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">● Agent 1 running (Nova Sonic)</span>
          <span className="text-cyan-400">● Agent 2 running (Nova Lite)</span>
        </div>
        <div className="text-slate-400 mt-1">Latency:</div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-slate-300">
          {stageEntries.length > 0 ? stageEntries.map(([stage, latency]) => (
            <span key={stage}>{stage}: {Math.round(latency)}ms</span>
          )) : <span className="text-slate-500">awaiting trace…</span>}
        </div>
        <div className="mt-1 text-slate-300">
          Fallback: <span className={lastTurnTrace?.metadata?.fallbackReason ? 'text-amber-400' : 'text-emerald-400'}>{lastTurnTrace?.metadata?.fallbackReason ? 'active' : 'none'}</span>
        </div>
      </div>
    );

    // 3. Director Overlay Content
    const DirectorContent = (
      <DirectorOverlay
        directorState={gameState.directorState}
        dna={gameState.storyDNA}
        onUpdate={(update) => dispatch({ type: 'UPDATE_DIRECTOR_STATE', payload: update })}
      />
    );

    return (
      <Layout
        leftSidebar={LeftSidebar}
        rightSidebar={RightSidebar}
        topOverlay={isDirectorMode ? DirectorContent : undefined}
        onExit={exitGame}
        showExit
        isDirectorMode={isDirectorMode}
        onToggleDirector={() => setIsDirectorMode(!isDirectorMode)}
        tracePanel={TracePanel}
      >
        {/* Center: Story & Input */}
        <div className="flex flex-col h-full">
          <StoryLog history={gameState.history} />
          <ActionPanel onInput={handleInput} isProcessing={gameState.isProcessing} />
        </div>
      </Layout>
    );
  }

  return <div>Loading...</div>;
}

const DNAProgress: React.FC<{ label: string; value: number; color?: 'blue' | 'orange' | 'teal' }> = ({ label, value, color = 'blue' }) => {
  const [left, right] = label.split(' / ');
  const getColor = () => {
    if (color === 'orange') return 'bg-orange-500';
    if (color === 'teal') return 'bg-teal-500';
    return 'bg-blue-500';
  }
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="h-1.5 bg-navy-900 rounded-full overflow-hidden">
        <div className={`h-full ${getColor()} transition-all`} style={{ width: `${value}%` }}></div>
      </div>
      <div className="text-right text-[10px] text-slate-600 mt-0.5">{value}%</div>
    </div>
  )
}
