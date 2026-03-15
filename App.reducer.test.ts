import { describe, it, expect } from 'vitest';
import { gameReducer } from './App';
import { buildGameState } from './tests/fixtures';

describe('gameReducer END_TURN world facts behavior', () => {
  it('appends newFacts, de-duplicates, and caps to max fact count', () => {
    const existingFacts = Array.from({ length: 50 }, (_, idx) => `fact-${idx + 1}`);
    const state = buildGameState(existingFacts);

    const nextState = gameReducer(state, {
      type: 'END_TURN',
      payload: {
        director: {
          pacing: 'Normal',
          tension: 60,
          narrativeFocus: 'Escalation',
          suggestedHints: []
        },
        world: {
          narrative: 'Things changed',
          characterUpdates: [],
          newFacts: ['fact-10', 'fact-51', 'fact-52']
        }
      }
    });

    expect(nextState).not.toBeNull();
    expect(nextState?.world.facts).toHaveLength(50);
    expect(nextState?.world.facts.filter(f => f === 'fact-10')).toHaveLength(1);
    expect(nextState?.world.facts[0]).toBe('fact-3');
    expect(nextState?.world.facts.slice(-2)).toEqual(['fact-51', 'fact-52']);
  });
});
