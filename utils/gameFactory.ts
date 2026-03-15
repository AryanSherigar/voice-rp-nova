import { GameState, CreateStoryFormData, CharacterState, StoryCard } from "../types";
import { generateId } from "./id";

export const createGameStateFromForm = (data: CreateStoryFormData): GameState => {
  const locationId = "loc_start";

  const characterIds = data.characters.map(() => generateId('char'));

  // Transform form characters to CharacterState
  const characters: CharacterState[] = data.characters.map((c, index) => ({
    id: characterIds[index],
    name: c.name,
    role: c.role,
    description: c.description,
    status: "Normal",
    emotions: {
      trust: 50,
      fear: 20,
      anger: 10,
      hope: 50
    }
  }));

  // Create StoryCards from Character Lore
  const loreCards: StoryCard[] = data.characters
    .map((c, index): StoryCard | null => {
        if (!c.lore) return null;
        return {
            id: `card_lore_${index}`,
            title: `${c.name}'s Secret`,
            keys: [c.name.toLowerCase()], // Trigger on character name
            entry: c.lore,
            isActive: false,
            characterId: characterIds[index] // Link to character ID
        };
    })
    .filter((c): c is StoryCard => c !== null);

  const initialNarrative = `You find yourself in ${data.settingName}. ${data.settingDescription} Nearby, ${characters.map(c => c.name).join(' and ')} are waiting.`;

  return {
    id: generateId('custom'),
    title: data.title,
    tick: 0,
    lastPlayed: Date.now(),
    isProcessing: false,
    directorState: {
      pacing: "Normal",
      tension: 10,
      narrativeFocus: "Establish the scene and introducing characters.",
      suggestedHints: ["Observe the surroundings", "Talk to the characters"]
    },
    storyDNA: {
      orderChaos: 50,
      hopeDespair: 50,
      trustBetrayal: 50
    },
    world: {
      currentLocationId: locationId,
      time: "Start",
      facts: [
        `Setting: ${data.settingName}`
      ],
      locations: {
        [locationId]: {
          id: locationId,
          name: data.settingName,
          description: data.settingDescription
        }
      }
    },
    characters: characters,
    storyCards: loreCards, // Inject generated cards
    history: [
      {
        id: "evt_init",
        tick: 0,
        type: "NARRATOR",
        description: initialNarrative,
        timestamp: Date.now()
      }
    ]
  };
};
