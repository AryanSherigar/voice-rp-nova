import { GameState, ScenarioTemplate } from "./types";

const NEON_PROTOCOL_STATE: GameState = {
  id: "session-001",
  title: "The Neon Protocol",
  tick: 0,
  lastPlayed: Date.now(),
  isProcessing: false,
  directorState: {
    pacing: "Normal",
    tension: 15,
    narrativeFocus: "Establish the setting and initial mystery.",
    suggestedHints: ["Look around the apartment", "Check your terminal"]
  },
  storyDNA: {
    orderChaos: 50,
    hopeDespair: 30,
    trustBetrayal: 50
  },
  world: {
    currentLocationId: "loc_apartment",
    time: "22:42",
    facts: [
      "It is the year 2142.",
      "Rain never stops in Sector 4."
    ],
    locations: {
      "loc_apartment": {
        id: "loc_apartment",
        name: "Apartment 4B",
        description: "A cramped, dim unit overlooking the neon-soaked streets of Sector 4. The air recycler hums rhythmically."
      },
      "loc_street": {
        id: "loc_street",
        name: "Main Street Level",
        description: "Crowded, wet, and smelling of ozone and fried noodles."
      }
    }
  },
  characters: [
    {
      id: "char_jax",
      name: "Jax",
      role: "The Contact",
      description: "A nervous data-courier with cybernetic eyes.",
      status: "Anxious",
      emotions: {
        trust: 40,
        fear: 70,
        anger: 10,
        hope: 20
      }
    },
    {
      id: "char_elara",
      name: "Elara",
      role: "Rival Hacker",
      description: "Cool, calculated, and dangerous.",
      status: "Observing",
      emotions: {
        trust: 10,
        fear: 10,
        anger: 30,
        hope: 50
      }
    }
  ],
  storyCards: [
    {
      id: "card_syndicate",
      title: "The Syndicate",
      keys: ["syndicate", "gang", "mob"],
      entry: "The Iron Lotus Syndicate runs Sector 4. They are ruthless, cybernetically enhanced thugs who demand protection money from everyone."
    },
    {
      id: "card_deck",
      title: "Cyberdeck",
      keys: ["deck", "terminal", "hack", "computer"],
      entry: "Standard issue Mk-IV cyberdeck. Allows interface with local subnets. Illegal modifications allow for ice-breaking protocols."
    },
    // Character Linked Cards
    {
      id: "card_jax_lore",
      title: "Jax's Debt",
      keys: ["jax"],
      characterId: "char_jax",
      entry: "Jax owes a massive debt to the Syndicate after losing a shipment of neural chips. He believes they are tracking his biomonitor."
    },
    {
      id: "card_elara_lore",
      title: "Elara's Mission",
      keys: ["elara"],
      characterId: "char_elara",
      entry: "Elara isn't just a hacker; she is an undercover agent for Corporate Security, looking for the very chips Jax lost."
    }
  ],
  history: [
    {
      id: "evt_init",
      tick: 0,
      type: "NARRATOR",
      description: "You wake up to the sound of pounding on your door. The holo-display on your wall flashes RED: 'BREACH DETECTED'. Jax is in the corner, shaking.",
      timestamp: Date.now()
    }
  ]
};

const FANTASY_STATE: GameState = {
  id: "session-002",
  title: "The Whispering Throne",
  tick: 0,
  lastPlayed: Date.now(),
  isProcessing: false,
  directorState: {
    pacing: "Slow",
    tension: 10,
    narrativeFocus: "Build atmosphere and introduce the royal dilemma.",
    suggestedHints: ["Approach the throne", "Speak to the advisor"]
  },
  storyDNA: {
    orderChaos: 80,
    hopeDespair: 40,
    trustBetrayal: 20
  },
  world: {
    currentLocationId: "loc_throne",
    time: "Dusk",
    facts: [
      "The King has been missing for 3 days.",
      "Magic is forbidden in the capital."
    ],
    locations: {
      "loc_throne": {
        id: "loc_throne",
        name: "Throne Room",
        description: "Vast, cold, and echoing. The Obsidian Throne sits empty, bathed in the dying light of the setting sun through stained glass."
      }
    }
  },
  characters: [
    {
      id: "char_advisor",
      name: "Grand Vizier Malak",
      role: "Royal Advisor",
      description: "An elderly man with sharp eyes and silk robes.",
      status: "Calculating",
      emotions: {
        trust: 30,
        fear: 20,
        anger: 0,
        hope: 40
      }
    },
    {
      id: "char_captain",
      name: "Captain Valerius",
      role: "Guard Captain",
      description: "Armored in gold, hand resting on his pommel.",
      status: "Alert",
      emotions: {
        trust: 60,
        fear: 10,
        anger: 10,
        hope: 50
      }
    }
  ],
  storyCards: [
    {
      id: "card_magic",
      title: "Forbidden Magic",
      keys: ["magic", "spell", "sorcery", "witch"],
      entry: "Magic was banned fifty years ago after the Great Scourge. Practitioners are hunted by the Inquisition."
    },
    {
      id: "card_throne",
      title: "Obsidian Throne",
      keys: ["throne", "seat", "king"],
      entry: "The Obsidian Throne is said to whisper secrets to the true heir. It feels cold to the touch for anyone else."
    },
    {
      id: "card_malak_lore",
      title: "Malak's Ambition",
      keys: ["malak", "vizier"],
      characterId: "char_advisor",
      entry: "Malak secretly practices the forbidden arts. He arranged the King's disappearance to seize the throne."
    }
  ],
  history: [
    {
      id: "evt_init",
      tick: 0,
      type: "NARRATOR",
      description: "The heavy doors creak open. You stand before the empty Obsidian Throne. Vizier Malak steps forward from the shadows, a scroll in his hand.",
      timestamp: Date.now()
    }
  ]
};

export const PREMADE_SCENARIOS: ScenarioTemplate[] = [
  {
    id: "scen_cyberpunk",
    title: "The Neon Protocol",
    description: "Cyberpunk mystery. You are a hacker caught in a corporate war.",
    initialState: NEON_PROTOCOL_STATE
  },
  {
    id: "scen_fantasy",
    title: "The Whispering Throne",
    description: "High Fantasy politics. The King is missing, and the court is restless.",
    initialState: FANTASY_STATE
  }
];