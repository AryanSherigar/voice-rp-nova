import { GoogleGenAI } from "@google/genai";
import {
  GameState,
  PlayerInput,
  DirectorAgentResponse,
  WorldUpdateResponse
} from "../types";

// Helper to ensure API Key exists
const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const MODEL_NAME = 'gemini-3-flash-preview';
const SEPARATOR = "___METADATA___";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isPacing = (value: unknown): value is 'Slow' | 'Normal' | 'Fast' => {
  return value === 'Slow' || value === 'Normal' || value === 'Fast';
};

const parseFinalPayload = (
  payload: unknown
): { success: true; data: { director: DirectorAgentResponse; world: WorldUpdateResponse } } | { success: false; reason: string } => {
  if (!isRecord(payload)) return { success: false, reason: 'invalid_payload_shape' };

  const director = payload.director;
  const world = payload.world;

  if (!isRecord(director) || !isRecord(world)) {
    return { success: false, reason: 'missing_director_or_world' };
  }

  const { pacing, tension, narrativeFocus, suggestedHints } = director;

  if (!isPacing(pacing) || typeof tension !== 'number' || typeof narrativeFocus !== 'string' || !Array.isArray(suggestedHints) || !suggestedHints.every(h => typeof h === 'string')) {
    return { success: false, reason: 'invalid_director_schema' };
  }

  const { characterUpdates, newFacts, dnaShift } = world;

  if (!Array.isArray(characterUpdates)) {
    return { success: false, reason: 'invalid_character_updates_schema' };
  }

  if (newFacts !== undefined && (!Array.isArray(newFacts) || !newFacts.every(f => typeof f === 'string'))) {
    return { success: false, reason: 'invalid_new_facts_schema' };
  }

  if (dnaShift !== undefined && !isRecord(dnaShift)) {
    return { success: false, reason: 'invalid_dna_shift_schema' };
  }

  const sanitizedCharacterUpdates = characterUpdates
    .filter((update): update is Record<string, unknown> => isRecord(update) && typeof update.id === 'string' && isRecord(update.emotions))
    .map(update => {
      const emotions = update.emotions as Record<string, unknown>;
      return {
        id: update.id as string,
        status: typeof update.status === 'string' ? update.status : undefined,
        emotions: {
          ...(typeof emotions.trust === 'number' ? { trust: clamp(emotions.trust) } : {}),
          ...(typeof emotions.fear === 'number' ? { fear: clamp(emotions.fear) } : {}),
          ...(typeof emotions.anger === 'number' ? { anger: clamp(emotions.anger) } : {}),
          ...(typeof emotions.hope === 'number' ? { hope: clamp(emotions.hope) } : {}),
        }
      };
    });

  const sanitizedDnaShift = isRecord(dnaShift)
    ? {
        ...(typeof dnaShift.orderChaos === 'number' ? { orderChaos: clamp(dnaShift.orderChaos) } : {}),
        ...(typeof dnaShift.hopeDespair === 'number' ? { hopeDespair: clamp(dnaShift.hopeDespair) } : {}),
        ...(typeof dnaShift.trustBetrayal === 'number' ? { trustBetrayal: clamp(dnaShift.trustBetrayal) } : {}),
      }
    : undefined;

  return {
    success: true,
    data: {
      director: {
        pacing,
        tension: clamp(tension),
        narrativeFocus,
        suggestedHints: suggestedHints.slice(0, 3),
      },
      world: {
        narrative: '',
        characterUpdates: sanitizedCharacterUpdates,
        ...(newFacts ? { newFacts } : {}),
        ...(sanitizedDnaShift && Object.keys(sanitizedDnaShift).length > 0 ? { dnaShift: sanitizedDnaShift } : {})
      }
    }
  };
};

const getFallbackFinalPayload = (state: GameState) => ({
  director: state.directorState,
  world: {
    narrative: 'World state stabilized after a transient systems anomaly.',
    characterUpdates: []
  } as WorldUpdateResponse
});

export type TurnStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'final'; data: { director: DirectorAgentResponse; world: WorldUpdateResponse } }
  | { type: 'error_final'; data: { director: DirectorAgentResponse; world: WorldUpdateResponse; reason: string } };

/**
 * Scans recent history and current input to find triggered Story Cards.
 * Returns the content of triggered cards to be injected into context.
 */
const getActiveStoryCards = (state: GameState, input: PlayerInput): string => {
  if (!state.storyCards || state.storyCards.length === 0) return "";

  // Combine recent text to scan against
  const recentHistoryText = state.history
    .slice(-3) // Look at last 3 turns
    .map(h => h.description)
    .join(' ')
    .toLowerCase();

  const inputText = input.content.toLowerCase();
  const combinedText = `${recentHistoryText} ${inputText}`;

  // Find matches
  const matchedCards = state.storyCards.filter(card => {
    return card.keys.some(key => {
      const cleanKey = key.trim().toLowerCase();
      if (!cleanKey) return false;
      // Simple inclusion check, could be regex for word boundaries in future
      return combinedText.includes(cleanKey);
    });
  });

  if (matchedCards.length === 0) return "";

  return matchedCards.map(card => `[World Info - ${card.title}]: ${card.entry}`).join('\n');
};

/**
 * EXECUTE TURN STREAM
 * Streams the narrative text first, then parses the JSON metadata.
 * This ensures immediate UI feedback (responsiveness) while maintaining state integrity.
 */
export async function* executeTurnStream(
  state: GameState,
  input: PlayerInput
): AsyncGenerator<TurnStreamChunk> {
  const ai = getAIClient();

  // CRITICAL: Include ID in the context so the LLM can reference it in the JSON response
  const characterContext = state.characters.map(c =>
    `ID[${c.id}] Name[${c.name}] Role[${c.role}]\n   - Status: ${c.status}\n   - Psychology: [Trust:${c.emotions.trust} (0=Paranoid, 100=Blind Faith), Fear:${c.emotions.fear} (0=Brave, 100=Terrified), Anger:${c.emotions.anger}, Hope:${c.emotions.hope}]\n   - Description: ${c.description}`
  ).join('\n');

  const historyContext = state.history
    .slice(-8)
    .map(h => `[${h.type}] ${h.description}`)
    .join('\n');

  // Trigger Story Cards
  const storyCardContext = getActiveStoryCards(state, input);

  // We ask for text first, then a specific separator, then JSON.
  const prompt = `
    You are the CORE ENGINE of an advanced interactive role-play simulation.
    Your goal is to weave a compelling, consequence-driven narrative where characters are psychologically deep and the world reacts realistically to the player.

    === CURRENT SIMULATION STATE ===
    Title: ${state.title}
    Location: ${state.world.locations[state.world.currentLocationId].name} (${state.world.locations[state.world.currentLocationId].description})
    Time/Context: ${state.world.time}

    [STORY DNA] (Thematic Resonance)
    - Order <--> Chaos (${state.storyDNA.orderChaos}/100): Low=Strict/Stagnant, High=Anarchy/Unpredictable.
    - Hope <--> Despair (${state.storyDNA.hopeDespair}/100): Low=Optimistic, High=Grim/Nihilistic.
    - Trust <--> Betrayal (${state.storyDNA.trustBetrayal}/100): Low=Honest, High=Deceptive.

    [DIRECTOR OVERRIDE]
    - Target Tension: ${state.directorState.tension}/100
    - Pacing: ${state.directorState.pacing}
    - Current Narrative Focus: "${state.directorState.narrativeFocus}"

    [CHARACTERS PRESENT]
    ${characterContext}

    [KNOWLEDGE BASE (Active Context)]
    Facts: ${state.world.facts.slice(-5).join('; ')}
    ${storyCardContext ? `Triggered Lore:\n${storyCardContext}` : ""}

    [RECENT HISTORY]
    ${historyContext}

    === PLAYER INPUT ===
    Type: ${input.type}
    Content: "${input.content}"

    === INSTRUCTIONS ===

    PHASE 1: NARRATIVE GENERATION
    Write the next segment of the story.
    1. **Show, Don't Tell**: Use sensory details (sound, smell, light) to ground the scene.
    2. **Psychological Consistency**: Characters MUST act according to their current stats.
       - High Fear (>70): Stuttering, defensive posture, irrationality.
       - Low Trust (<30): Withholding info, suspicion, lying.
       - High Anger (>70): Aggression, shouting, impulsiveness.
    3. **Consequence**: The player's input matters. If they fail, let them fail. If they succeed, reward them. Do not god-mode the player.
    4. **Director Influence**:
       - If Tension is High (>70), use short sentences, cliffhangers, and immediate threats.
       - If Pacing is Fast, skip pleasantries and move to action.
    5. **Output**: Just the story text. No prefixes.

    PHASE 2: SEPARATOR
    Output exactly "${SEPARATOR}" on a new line.

    PHASE 3: STATE SIMULATION (JSON)
    Analyze the narrative you just wrote and update the mathematical state of the world.

    1. **Character Updates**:
       - Adjust emotions based on *events*.
       - Example: Player threatens NPC -> NPC Fear +15, Trust -20.
       - Example: Player helps NPC -> NPC Hope +10, Trust +15.
       - **Status**: Update status strings (e.g., "Wounded", "Terrified", "Unconscious") if changed.
       - **Death**: If a character dies, set status to "Dead".

    2. **Story DNA Mutation**:
       - Did the scene become more chaotic/violent? Increase OrderChaos.
       - Did a secret get revealed or a lie told? Increase TrustBetrayal.
       - Did the situation look grim? Increase HopeDespair.
       - Shift values by 1-5 for minor events, 10-25 for major plot twists.

    3. **Director Logic (The GM)**:
       - **Tension**: Did the player resolve the threat? Lower tension. Did they make it worse? Raise it.
       - **Pacing**: Decide if the next scene should breathe (Slow) or accelerate (Fast).
       - **Narrative Focus**: Give yourself a short directive for the *next* turn (e.g., "The villain escapes," "Reveal the secret door").
       - **Hints**: Provide 3 short, actionable options for the player based on the new context.

    4. **World Updates**:
       - add NEW facts if learned.

    Output valid JSON matching this schema:
    {
      "director": {
        "pacing": "Slow" | "Normal" | "Fast",
        "tension": number,
        "narrativeFocus": string,
        "suggestedHints": string[]
      },
      "world": {
        "characterUpdates": [
          {
            "id": string,
            "emotions": { "trust": number, "fear": number, "anger": number, "hope": number },
            "status": string
          }
        ],
        "newFacts": string[],
        "dnaShift": { "orderChaos": number, "hopeDespair": number, "trustBetrayal": number }
      }
    }
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: prompt,
    });

    let buffer = "";
    let narrativeFinished = false;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;

      buffer += text;

      if (!narrativeFinished) {
        const splitIndex = buffer.indexOf(SEPARATOR);
        if (splitIndex !== -1) {
          narrativeFinished = true;
          // Extract the final clean narrative
          const narrative = buffer.substring(0, splitIndex).trim();
          yield { type: 'text', content: narrative };

          // Keep only the potential JSON part in the buffer
          buffer = buffer.substring(splitIndex + SEPARATOR.length);
        } else {
          // Yield the full buffer as the current narrative draft
          yield { type: 'text', content: buffer };
        }
      }
    }

    // If the stream ends but we never saw the separator, we assume it's just text
    // and no state update occurred (or an error occurred in generation).
    if (!narrativeFinished) {
      yield { type: 'text', content: buffer };
      yield { type: 'error_final', data: { ...getFallbackFinalPayload(state), reason: 'missing_separator' } };
      return;
    }

    // Parse the JSON from the remaining buffer
    try {
      // Clean up markdown code blocks if present
      const jsonStr = buffer.trim()
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');

      if (jsonStr) {
        const data = JSON.parse(jsonStr);
        const parsed = parseFinalPayload(data);

        if (!parsed.success) {
          yield { type: 'error_final', data: { ...getFallbackFinalPayload(state), reason: parsed.reason } };
          return;
        }

        yield { type: 'final', data: parsed.data };
      } else {
        yield { type: 'error_final', data: { ...getFallbackFinalPayload(state), reason: 'empty_json_payload' } };
      }
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.log("Buffer was:", buffer);
      yield { type: 'error_final', data: { ...getFallbackFinalPayload(state), reason: 'json_parse_error' } };
    }

  } catch (error) {
    console.error("Stream Error:", error);
    yield { type: 'text', content: "The simulation wavers... (Connection Error)" };
    yield { type: 'error_final', data: { ...getFallbackFinalPayload(state), reason: 'stream_error' } };
  }
}

// Deprecated
export const executeTurn = async () => { throw new Error("Deprecated"); };
export const runDirectorAgent = async () => { throw new Error("Deprecated"); };
export const runWorldSimulation = async () => { throw new Error("Deprecated"); };