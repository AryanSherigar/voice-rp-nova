import { GameState, InputType, PlayerInput } from '../types';

export const buildGameState = (facts: string[] = []): GameState => ({
  id: 'game-1',
  title: 'Test Game',
  tick: 1,
  world: {
    currentLocationId: 'loc-1',
    locations: {
      'loc-1': {
        id: 'loc-1',
        name: 'Bridge',
        description: 'Command bridge'
      }
    },
    time: 'Noon',
    facts,
  },
  characters: [
    {
      id: 'char-1',
      name: 'Ari',
      role: 'Pilot',
      description: 'Steady hands',
      emotions: { trust: 50, fear: 10, anger: 5, hope: 70 },
      status: 'Ready'
    }
  ],
  storyCards: [],
  storyDNA: {
    orderChaos: 50,
    hopeDespair: 50,
    trustBetrayal: 50
  },
  directorState: {
    pacing: 'Normal',
    tension: 50,
    narrativeFocus: 'Immediate consequences',
    suggestedHints: []
  },
  history: [],
  isProcessing: false,
});

export const buildPlayerInput = (): PlayerInput => ({
  type: InputType.DO,
  content: 'Look around'
});
