// src/lib/deckUtils.ts
import seedrandom from 'seedrandom';
import { Card } from '../types';

// Create a full deck of 52 cards
export const createDeck = (): number[] => {
  const deck: number[] = [];
  for (let i = 0; i < 52; i++) {
    deck.push(i);
  }
  console.log("Created new deck of 52 cards");
  return deck;
};

// Generate a random 4-letter game code
export const generateGameCode = (): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  const code = result.toUpperCase();
  console.log(`Generated game code: ${code}`);
  return code;
};

// Shuffle a deck using a seed
export const shuffleDeck = (seed: string): number[] => {
  console.log(`Shuffling deck with seed: ${seed}`);
  const rng = seedrandom(seed);
  const deck = createDeck();
  
  // Fisher-Yates shuffle algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  console.log("Deck shuffled successfully");
  return deck;
};

// Convert card index to suit and rank
export const getCardDetails = (cardIndex: number): Card => {
  if (cardIndex < 0 || cardIndex >= 52) {
    console.error(`Invalid card index: ${cardIndex}`);
    // Default to ace of spades if invalid
    return { suit: 0, rank: 0, i: 0 };
  }
  
  const suit = Math.floor(cardIndex / 13);
  const rank = cardIndex % 13;
  
  return {
    suit,
    rank,
    i: cardIndex
  };
};

// Convert card index to readable string
export const cardIndexToString = (cardIndex: number): string => {
  const card = getCardDetails(cardIndex);
  
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suits = ['♠', '♥', '♣', '♦'];
  
  return `${ranks[card.rank]}${suits[card.suit]}`;
};

// Convert card index to English text
export const cardIndexToText = (cardIndex: number): string => {
  if (cardIndex === undefined || cardIndex === null) {
    console.error("Undefined or null card index passed to cardIndexToText");
    return "an unknown card";
  }
  
  const card = getCardDetails(cardIndex);
  
  const ranks = [
    'an Ace', 'a Two', 'a Three', 'a Four', 'a Five', 
    'a Six', 'a Seven', 'an Eight', 'a Nine', 'a Ten', 
    'a Jack', 'a Queen', 'a King'
  ];
  
  return ranks[card.rank];
};

// Get pyramid card coordinates for display
export const getPyramidCoordinates = (index: number) => {
  const coords = [
    { x: 179, y: 442 },  // Row 1, Card 1
    { x: 81, y: 442 },   // Row 1, Card 2
    { x: -17, y: 442 },  // Row 1, Card 3
    { x: -115, y: 442 }, // Row 1, Card 4
    { x: -217, y: 442 }, // Row 1, Card 5
    { x: 123, y: 310 },  // Row 2, Card 1
    { x: 29, y: 310 },   // Row 2, Card 2
    { x: -69, y: 310 },  // Row 2, Card 3
    { x: -166, y: 310 }, // Row 2, Card 4
    { x: 73, y: 190 },   // Row 3, Card 1
    { x: -23, y: 190 },  // Row 3, Card 2
    { x: -116, y: 190 }, // Row 3, Card 3
    { x: 37, y: 65 },    // Row 4, Card 1
    { x: -57, y: 65 },   // Row 4, Card 2
    { x: -10, y: -59 },  // Row 5, Card 1
  ];
  
  return index >= 0 && index < coords.length ? coords[index] : { x: -1000, y: -1000 };
};

// Get which row a card is in
export const getPyramidRow = (index: number): number => {
  if (index <= 4) return 1;
  if (index <= 8) return 2;
  if (index <= 11) return 3;
  if (index <= 13) return 4;
  if (index === 14) return 5;
  return 1;
};

// Get player card coordinates for display
export const getPlayerCardCoordinates = (index: number) => {
  const coords = [
    { x: 49, y: 0 },    // Card 1
    { x: -89, y: 0 },   // Card 2
    { x: 49, y: 175 },  // Card 3
    { x: -89, y: 175 }, // Card 4
  ];
  
  return index >= 0 && index < coords.length ? coords[index] : { x: 0, y: 0 };
};