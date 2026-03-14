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

const HOSTILE_CLIENT_DEESCALATION_STATE: GameState = {
  id: "session-003",
  title: "Hostile Client De-escalation",
  tick: 0,
  lastPlayed: Date.now(),
  isProcessing: false,
  directorState: {
    pacing: "Fast",
    tension: 82,
    narrativeFocus: "Stabilize a volatile client interaction before it escalates into legal and safety risk.",
    suggestedHints: ["Acknowledge the client's frustration", "Set boundaries while offering options"]
  },
  storyDNA: {
    orderChaos: 35,
    hopeDespair: 25,
    trustBetrayal: 75
  },
  world: {
    currentLocationId: "loc_executive_briefing",
    time: "09:03",
    facts: [
      "A top-revenue client is threatening to terminate their enterprise contract on a live escalation call.",
      "The client has already posted a public complaint naming your team."
    ],
    locations: {
      "loc_executive_briefing": {
        id: "loc_executive_briefing",
        name: "Executive Escalation Bridge",
        description: "A high-pressure virtual war room where legal, support, and account leadership are listening in real time."
      }
    }
  },
  characters: [
    {
      id: "char_client",
      name: "Dana Cross",
      role: "Enterprise Client Stakeholder",
      description: "VP of Operations, furious after repeated outages during a major launch.",
      status: "Confrontational",
      emotions: {
        trust: 8,
        fear: 62,
        anger: 90,
        hope: 12
      }
    },
    {
      id: "char_legal",
      name: "Mara Chen",
      role: "Internal Counsel",
      description: "Monitoring every phrase for liability exposure while urging a calm, compliant response.",
      status: "On Edge",
      emotions: {
        trust: 35,
        fear: 58,
        anger: 28,
        hope: 30
      }
    }
  ],
  storyCards: [
    {
      id: "card_sla",
      title: "SLA Breach Window",
      keys: ["sla", "uptime", "breach", "contract"],
      entry: "The account has crossed the SLA error budget threshold for the quarter. Credits and executive remediation are now in scope."
    },
    {
      id: "card_social",
      title: "Public Escalation",
      keys: ["social", "public", "press", "complaint"],
      entry: "The client's complaint is circulating on industry channels, increasing reputational pressure and urgency."
    }
  ],
  history: [
    {
      id: "evt_init",
      tick: 0,
      type: "NARRATOR",
      description: "Dana slams her hand on the table camera feed. 'You have 10 minutes to tell me why I shouldn't cancel and notify procurement.' Every executive line goes silent, waiting for your first sentence.",
      timestamp: Date.now()
    }
  ]
};

const MEDICAL_TRIAGE_CRISIS_STATE: GameState = {
  id: "session-004",
  title: "Medical Triage Crisis",
  tick: 0,
  lastPlayed: Date.now(),
  isProcessing: false,
  directorState: {
    pacing: "Fast",
    tension: 88,
    narrativeFocus: "Prioritize scarce resources while balancing patient risk, team bandwidth, and escalating uncertainty.",
    suggestedHints: ["Call out triage priority", "Delegate immediate interventions"]
  },
  storyDNA: {
    orderChaos: 30,
    hopeDespair: 18,
    trustBetrayal: 48
  },
  world: {
    currentLocationId: "loc_er_triage",
    time: "02:14",
    facts: [
      "An MCI alert has flooded the emergency department with critical patients.",
      "Only one trauma bay and one respiratory therapist are immediately available."
    ],
    locations: {
      "loc_er_triage": {
        id: "loc_er_triage",
        name: "Emergency Triage Intake",
        description: "Alarms pulse from every direction as stretchers stack the corridor and vitals monitors compete for attention."
      }
    }
  },
  characters: [
    {
      id: "char_charge_nurse",
      name: "Riley Ortiz",
      role: "Charge Nurse",
      description: "Experienced, exhausted, and trying to keep the team synchronized under impossible load.",
      status: "Overwhelmed",
      emotions: {
        trust: 52,
        fear: 74,
        anger: 34,
        hope: 24
      }
    },
    {
      id: "char_resident",
      name: "Dr. Amir Salim",
      role: "Emergency Resident",
      description: "Clinically sharp but visibly shaken by simultaneous life-threatening presentations.",
      status: "Strained",
      emotions: {
        trust: 46,
        fear: 81,
        anger: 12,
        hope: 20
      }
    }
  ],
  storyCards: [
    {
      id: "card_airway",
      title: "Airway Collapse Risk",
      keys: ["airway", "oxygen", "respiratory", "intubate"],
      entry: "One patient is rapidly desaturating and may require intubation within minutes if not prioritized."
    },
    {
      id: "card_peds",
      title: "Pediatric Red Tag",
      keys: ["pediatric", "child", "red tag", "family"],
      entry: "A pediatric trauma patient arrives with unstable vitals while family members demand immediate updates."
    }
  ],
  history: [
    {
      id: "evt_init",
      tick: 0,
      type: "NARRATOR",
      description: "A triage alarm blares: 'Code surge in progress.' Riley locks eyes with you—'I need a decision now: who gets the trauma bay first?'",
      timestamp: Date.now()
    }
  ]
};

export const PREMADE_SCENARIOS: ScenarioTemplate[] = [
  {
    id: "scen_hostile_client",
    title: "Hostile Client De-escalation",
    description: "Enterprise Simulation (Default Demo): Defuse a high-value client escalation before contractual and reputational fallout.",
    initialState: HOSTILE_CLIENT_DEESCALATION_STATE
  },
  {
    id: "scen_medical_triage",
    title: "Medical Triage Crisis",
    description: "Healthcare crisis simulation. Make rapid triage calls with constrained staff and rising patient acuity.",
    initialState: MEDICAL_TRIAGE_CRISIS_STATE
  },
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
