/**
 * Modern React implementation of deck.js
 * Based on the original implementation but optimized for React/NextJS
 */

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  i: number; // Unique identifier for the card (0-51)
  id?: string; // Optional string ID (sometimes used instead of i)
  suit: string; // 'hearts', 'diamonds', 'clubs', 'spades'
  rank: string; // 'A', '2', '3', etc.
  value?: number; // 1-13 (optional)
  revealed?: boolean;
  animation?: string;
  position?: { x: number; y: number };
  rotation?: number;
  owner?: string;
  newCard?: boolean;
  faceVisible?: boolean; // Track if the face is visible in the UI
  replacedAt?: string; // Timestamp when the card was replaced
  
  // Challenge-related properties
  isInChallenge?: boolean;
  challengeCardIndex?: number | null;
  userFlipped?: boolean;
  revealedAt?: string;
  seen?: boolean;
}

export class Deck {
  cards: Card[] = [];

  constructor() {
    this.init();
  }

  init() {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    this.cards = [];

    for (let s = 0; s < suits.length; s++) {
      for (let r = 0; r < ranks.length; r++) {
        this.cards.push({
          i: s * ranks.length + r,
          id: `${ranks[r]}-${suits[s]}`,
          suit: suits[s],
          rank: ranks[r],
          value: values[r],
          revealed: false,
          faceVisible: false,
        });
      }
    }
  }

  shuffle() {
    // Fisher-Yates shuffle algorithm
    let currentIndex = this.cards.length;
    let temporaryValue, randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = this.cards[currentIndex];
      this.cards[currentIndex] = this.cards[randomIndex];
      this.cards[randomIndex] = temporaryValue;
    }

    return this;
  }

  deal(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error(`Cannot deal ${count} cards, only ${this.cards.length} left in deck`);
    }
    return this.cards.splice(0, count);
  }

  /**
   * Creates a pyramid layout of cards
   * @param rows Number of rows in the pyramid
   * @returns The pyramid cards in order
   */
  createPyramid(rows: number): Card[] {
    if (rows > 7) {
      throw new Error('Pyramid cannot be larger than 7 rows');
    }

    const totalCards = (rows * (rows + 1)) / 2; // Sum of 1 to n
    if (totalCards > this.cards.length) {
      throw new Error(`Not enough cards for a ${rows}-row pyramid (need ${totalCards})`);
    }

    return this.cards.splice(0, totalCards);
  }

  /**
   * Serializes the deck for storage in Firebase
   */
  serialize() {
    return {
      cards: this.cards,
    };
  }

  /**
   * Creates a deck from serialized data
   */
  static deserialize(data: { cards: Card[] }): Deck {
    const deck = new Deck();
    deck.cards = data.cards;
    return deck;
  }
}

/**
 * Generate a layout for pyramid cards
 * @param rows Number of rows in the pyramid
 * @returns Position data for each card
 */
export function generatePyramidLayout(rows: number, containerWidth: number, containerHeight: number) {
  const layout: { row: number; position: number; x: number; y: number }[] = [];
  const cardSpacing = 10; // pixels between cards
  const cardWidth = 120; // assumed card width
  const cardHeight = 168; // assumed card height
  const verticalSpacing = cardHeight * 0.3; // overlap between rows

  for (let row = 0; row < rows; row++) {
    const cardsInRow = row + 1;
    const rowWidth = cardsInRow * cardWidth + (cardsInRow - 1) * cardSpacing;
    const startX = (containerWidth - rowWidth) / 2;
    const y = row * (cardHeight - verticalSpacing);

    for (let pos = 0; pos < cardsInRow; pos++) {
      const x = startX + pos * (cardWidth + cardSpacing);
      layout.push({ row, position: pos, x, y });
    }
  }

  return layout;
}

/**
 * Calculate the index in a pyramid for a given row and position
 */
export function getPyramidIndex(row: number, position: number): number {
  // Sum of cards in previous rows (1 + 2 + ... + row)
  const previousRowsCount = (row * (row + 1)) / 2;
  return previousRowsCount + position;
}