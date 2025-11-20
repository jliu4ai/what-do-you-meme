
export enum GameStatus {
  IDLE = 'IDLE',
  LOADING_HAND = 'LOADING_HAND',
  PLAYING = 'PLAYING',
  CALCULATING_AI = 'CALCULATING_AI',
  JUDGING = 'JUDGING',
  RESULT = 'RESULT'
}

export interface MemeImage {
  url: string;
  id: string;
  themeId?: string;
}

export interface CaptionCard {
  id: string;
  text: string;
  isAi?: boolean;
  ownerId?: string; // For multiplayer
}

export interface JudgeResult {
  winner: 'user' | 'ai' | 'tie' | string; // string = player ID in multiplayer
  userScore: number;
  aiScore: number;
  commentary: string;
  funniestCaption: string;
}

// --- NEW FEATURES TYPES ---

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  coins: number;
  unlockedThemes: string[]; // list of theme IDs
}

export interface ThemePack {
  id: string;
  name: string;
  description: string;
  price: number; // USD cents or coins
  coverImage: string; // Emoji or URL
  imageIds: string[]; // IDs from constants
}

// Multiplayer Room Types
export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  currentCard: CaptionCard | null; // Card played this round
}

export interface Room {
  id: string;
  code: string; // 4 digit code
  hostId: string;
  players: Player[];
  status: 'LOBBY' | 'PLAYING' | 'VOTING' | 'LEADERBOARD';
  currentRound: number;
  maxRounds: number;
  currentImage: MemeImage | null;
  themeId: string;
  roundCaptions: CaptionCard[]; // All cards played this round
}

export interface GameState {
  status: GameStatus;
  currentImage: MemeImage | null;
  userHand: CaptionCard[];
  selectedCard: CaptionCard | null;
  aiCard: CaptionCard | null;
  roundResult: JudgeResult | null;
  totalUserScore: number;
  totalAiScore: number;
  roundCount: number;
}
