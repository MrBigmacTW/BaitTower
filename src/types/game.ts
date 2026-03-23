export interface EventLogEntry {
  floor: number;
  eventType: string;
  eventName: string;
  result: 'passed' | 'paid' | 'fled' | 'died' | 'survived' | 'skipped';
  dogTagsChange: number;
  costPaid: number;
  choiceMade?: string;
}

export interface GameState {
  currentFloor: number;
  isAlive: boolean;
  hasCompleted: boolean;
  dogTags: number;
  totalSpent: number;
  courage: number; // +1 each floor passed, every 10 → 5% discount

  // Buffs
  hasShield: boolean;
  hasCampfire: boolean;
  hasBoots: boolean;
  hasLucky: boolean;
  hasGoblinTrap: boolean;

  // Debuffs
  isInjured: boolean;
  cursed: boolean;
  poisonLayers: number;
  steleCurseLayers: number;
  detourCurse: boolean;

  // Pass effects
  safePassLayers: number;
  richPassLayers: number;
  altarPassLayers: number;

  // Event state
  eventLog: EventLogEntry[];
  currentEvent: GameEvent | null;
  phase: 'idle' | 'roulette' | 'event' | 'animating' | 'result' | 'settlement' | 'zone_transition' | 'zone_gate';
  animationIcon: string;
  animationText: string;
  settlementType: 'exit' | 'death' | 'summit' | null;
  resultText: string;
  resultColor: string;

  // Roulette
  rouletteSegments: string[]; // 12 category icons
  rouletteResult: number; // index of winning segment
  rouletteSpinning: boolean;

  // Telescope
  previewEvents: string[];
  previewFloorStart: number;
  preGeneratedEvents: Map<number, GameEvent>;

  // Zone transition
  zoneTransitionName: string;
  zoneTransitionDesc: string;
  zoneTransitionWarning: string;

  // Tutorial & hints
  tutorialComplete: boolean;
  seenEventTypes: Set<string>;

  // History (persisted)
  historyTotalCoins: number;
  historyBestFloor: number;
  historyRunCount: number;
  historySummitCount: number;
}

export type EventCategory = 'free' | 'obstacle' | 'deadly' | 'choice' | 'rare';

export interface GameEvent {
  type: string;
  category: EventCategory;
  name: string;
  description: string;
  floor: number;
}

export type TutorialStep = 'welcome' | 'rules' | 'practice' | 'done';

export type Zone = 'grass' | 'mist' | 'lava' | 'dragon' | 'sky';
