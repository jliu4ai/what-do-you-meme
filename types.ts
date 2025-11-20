export enum GameStatus {
  IDLE = 'IDLE',
  LOADING_HAND = 'LOADING_HAND', // Generating captions for the user
  PLAYING = 'PLAYING', // User selecting a card
  CALCULATING_AI = 'CALCULATING_AI', // AI Generating its move
  JUDGING = 'JUDGING', // AI Judging the winner
  RESULT = 'RESULT' // Show winner
}

export interface MemeImage {
  url: string;
  id: string;
}

export interface CaptionCard {
  id: string;
  text: string;
  isAi?: boolean;
}

export interface JudgeResult {
  winner: 'user' | 'ai' | 'tie';
  userScore: number;
  aiScore: number;
  commentary: string;
  funniestCaption: string;
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
