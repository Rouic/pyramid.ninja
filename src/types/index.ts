// src/types/index.ts
import { User } from 'firebase/auth';
import { DocumentData } from 'firebase/firestore';

// Card types
export interface Card {
  suit: number; // 0: spades, 1: hearts, 2: clubs, 3: diamonds
  rank: number; // 0: ace, 1-9: 2-10, 10: jack, 11: queen, 12: king
  i: number; // 0-51, unique identifier for each card
  newCard?: boolean; // Whether this card is new (dealt after a bullshit call)
}

export interface PlayerCard {
  i: number; // Card index
  seen: boolean; // Whether the player has seen this card
}

// Player types
export interface Player {
  uid: string;
  name: string;
  admin?: boolean;
  drinks: number;
  initial_deal?: boolean;
  cards?: PlayerCard[];
}

// Transaction types for game actions
export type TransactionStatus = 
  | 'waiting' 
  | 'accepted' 
  | 'bullshit' 
  | 'bullshit_correct' 
  | 'bullshit_wrong';

export interface Transaction {
  t_from: string; // Player UID who initiated
  t_to: string; // Player UID who receives
  status: TransactionStatus;
  seenby?: string[];
}

export interface DisplayTransaction {
  from_player: string;
  to_player: string;
  result: TransactionStatus | null;
}

// Game round information
export interface Round {
  round_row: number;
  round_card: number;
  round_transactions: Transaction[];
  drink_log?: DrinkLog[];
}

export interface CurrentRound {
  round_number: number;
  round_row: number;
  round_card: number;
}

export interface DrinkLog {
  name: string;
  drinks: number;
}

// Game metadata
export interface GameMeta {
  started: boolean;
  finished?: boolean;
  total_drinks?: number;
  created_at: Date;
  fancy_shown?: boolean;
}

// YES Game specific types
export interface YesPlayer extends Player {
  lives: number;
  isDealer: boolean;
  card?: PlayerCard;
  hasSwapped?: boolean;
  hasChecked?: boolean;
  blockingSwap?: boolean;
  lostLife?: boolean;
  hasCut?: boolean;
}

export interface YesGameState {
  dealer: string; // Player ID of current dealer
  currentRound: number;
  deck: number[];
  usedCards: number[];
  started: boolean;
  finished?: boolean;
  revealPhase?: boolean;
  winner?: string;
  playerOrder: string[]; // Ordered player IDs in clockwise order
}

// Custom type for player data in documents
export type PlayerData = Player | YesPlayer | DocumentData;

// Firestore game document structure
export interface GameData extends DocumentData {
  id?: string;
  name?: string;
  hostId?: string;
  createdAt?: any;
  players?: any[];
  gameState?: string;
  gameType?: 'pyramid' | 'yes';
  
  // Pyramid game data
  '__pyramid.meta'?: GameMeta;
  '__pyramid.cards'?: PyramidCard[];
  '__pyramid.deck'?: number[];
  '__pyramid.currentRound'?: CurrentRound;
  '__pyramid.rounds'?: Record<number, Round>;
  '__pyramid.summary'?: Record<string, number>;
  
  // YES game data
  '__yes.state'?: YesGameState;
  
  // Dynamic player data indexed by UID
  [playerUid: string]: PlayerData | string | any[] | 'pyramid' | 'yes' | undefined;
}

export interface PyramidCard {
  id: number;
  shown: boolean;
}

// Context types
export interface AuthContextType {
  user: User | null;
  userUid: string | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface GameContextType {
  gameId: string | null;
  gameData: GameData | null;
  players: Player[];
  loading: boolean;
  error: string | null;
  
  // Common functions for both games
  joinGame: (gameId: string, name: string) => Promise<void>;
  createGame: (gameType?: 'pyramid' | 'yes') => Promise<string>;
  
  // Pyramid game functions
  startGame: (gameId: string) => Promise<void>;
  selectCard: (gameId: string, cardIndex: number) => Promise<void>;
  callPlayer: (gameId: string, fromUid: string, toUid: string, roundNumber: number) => Promise<void>;
  respondToCall: (gameId: string, fromUid: string, toUid: string, roundNumber: number, accept: boolean) => Promise<void>;
  showBullshitCard: (gameId: string, playerUid: string, cardIndex: number, roundNumber: number, correct: boolean) => Promise<void>;
  markCardsAsSeen: (gameId: string, playerUid: string) => Promise<void>;
  getNewCard: (gameId: string, playerUid: string, cardIndex: number) => Promise<void>;
  checkCardMatch: (gameData: GameData, roundNumber: number, cardIndex: number) => boolean;
  
  // YES game functions
  startYesGame: (gameId: string) => Promise<void>;
  peekCard: (gameId: string, playerId: string) => Promise<void>;
  swapCard: (gameId: string, fromPlayerId: string, toPlayerId: string) => Promise<void>;
  cutDeck: (gameId: string, dealerId: string) => Promise<void>;
  revealCards: (gameId: string) => Promise<void>;
  nextRound: (gameId: string) => Promise<void>;
}