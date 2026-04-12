import {
  getDoc,
  setDoc,
  updateDoc,
  modifyDoc,
  subscribeDoc,
} from '@/lib/api/client';
import { Deck, Card } from '../deck';

/**
 * Initialize a new game deck and pyramid in the datastore
 */
export async function initializeGameDeck(gameId: string, rows: number) {
  // Create and shuffle a new deck
  const deck = new Deck();
  deck.shuffle();

  // Deal cards for the pyramid
  const pyramidCards = deck.createPyramid(rows);

  // Save the deck and pyramid
  await updateDoc('games', gameId, {
    deck: deck.serialize(),
    pyramidCards,
    gameState: 'ready',
  });

  return { deck, pyramidCards };
}

/**
 * Deal cards to a player
 */
export async function dealCardsToPlayer(
  gameId: string,
  playerId: string,
  count: number = 5
) {
  const gameData = await getDoc('games', gameId);

  if (!gameData) {
    throw new Error('Game not found');
  }

  const deck = Deck.deserialize(gameData.deck as string);

  // Deal cards to the player
  const playerCards = deck.deal(count);

  // Mark cards as owned by this player
  playerCards.forEach((card) => {
    card.owner = playerId;
    card.faceVisible = false;
  });

  const playerDocId = `${gameId}_${playerId}`;

  // Read existing player doc so we can merge rather than overwrite
  const existing = (await getDoc('players', playerDocId)) || {};

  await setDoc('players', playerDocId, {
    ...existing,
    cards: playerCards,
    cardCount: count,
    updatedAt: new Date().toISOString(),
  });

  // Update the main game document with the new deck state
  // Use modifyDoc for the nested playerCardCount field
  await modifyDoc('games', gameId, (current) => ({
    ...current,
    deck: deck.serialize(),
    playerCardCount: {
      ...((current.playerCardCount as Record<string, number>) || {}),
      [playerId]: count,
    },
  }));

  return playerCards;
}

/**
 * Listen for changes to a player's cards
 */
export function subscribeToPlayerCards(
  gameId: string,
  playerId: string,
  callback: (cards: Card[]) => void
) {
  const playerDocId = `${gameId}_${playerId}`;

  // Fetch initial state immediately
  getDoc('players', playerDocId).then((data) => {
    if (!data || !data.cards || !Array.isArray(data.cards)) {
      console.log(
        'Player document does not exist or has no cards, returning empty array'
      );
      callback([]);
      return;
    }
    console.log(
      `Found ${(data.cards as Card[]).length} cards for player (initial fetch)`
    );
    callback(data.cards as Card[]);
  });

  return subscribeDoc('players', playerDocId, (data) => {
    if (!data) {
      console.log('Player document does not exist, returning empty array');
      callback([]);
      return;
    }

    if (!data.cards || !Array.isArray(data.cards)) {
      console.log(
        'Player has no cards or cards is not an array, returning empty array'
      );
      callback([]);
      return;
    }

    console.log(
      `Found ${(data.cards as Card[]).length} cards for player in snapshot`
    );
    callback(data.cards as Card[]);
  });
}

export async function hideNewCard(
  gameId: string,
  playerId: string,
  cardId: string
) {
  if (!gameId || !playerId || !cardId) {
    console.error('Missing required parameters in hideNewCard');
    return;
  }

  try {
    const playerDocId = `${gameId}_${playerId}`;
    const playerData = await getDoc('players', playerDocId);

    if (!playerData) {
      console.error('Player document not found');
      return;
    }

    if (!playerData.cards || !Array.isArray(playerData.cards)) {
      console.error('Invalid cards data structure');
      return;
    }

    // Find and update the card
    const updatedCards = (playerData.cards as Card[]).map((card) =>
      card.id === cardId
        ? { ...card, newCard: false, faceVisible: false }
        : card
    );

    await updateDoc('players', playerDocId, {
      cards: updatedCards,
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `Successfully hid new card ${cardId} for player ${playerId}`
    );
  } catch (error) {
    console.error('Error hiding new card:', error);
  }
}

/**
 * Listen for changes to the pyramid cards
 */
export function subscribeToPyramidCards(
  gameId: string,
  callback: (cards: Card[]) => void
) {
  // Fetch initial state immediately
  getDoc('games', gameId).then((data) => {
    if (!data) {
      callback([]);
      return;
    }
    const pyramidCards = (data.pyramidCards as Card[]) || [];
    callback(pyramidCards);
  });

  return subscribeDoc('games', gameId, (data) => {
    if (!data) {
      callback([]);
      return;
    }

    const pyramidCards = (data.pyramidCards as Card[]) || [];
    callback(pyramidCards);
  });
}

/**
 * Reveal a pyramid card
 */
export async function revealPyramidCard(
  gameId: string,
  cardIndex: number
) {
  const gameData = await getDoc('games', gameId);

  if (!gameData) {
    throw new Error('Game not found');
  }

  const pyramidCards = [...(gameData.pyramidCards as Card[])];

  if (!pyramidCards[cardIndex]) {
    throw new Error('Card not found');
  }

  // Update the revealed status
  pyramidCards[cardIndex] = {
    ...pyramidCards[cardIndex],
    revealed: true,
  };

  await updateDoc('games', gameId, {
    pyramidCards,
    currentCardIndex: cardIndex,
    currentCardRevealed: new Date().toISOString(),
    lastRevealedCard: pyramidCards[cardIndex],
    lastRevealTime: new Date().toISOString(),
    gameState: 'playing',
  });

  return pyramidCards[cardIndex];
}

/**
 * Update a player's card (e.g., when moved)
 */
export async function updatePlayerCard(
  gameId: string,
  playerId: string,
  cardId: string,
  updates: Partial<Card>
) {
  const playerDocId = `${gameId}_${playerId}`;
  const playerData = await getDoc('players', playerDocId);

  if (!playerData) {
    throw new Error('Player data not found');
  }

  const playerCards = [...((playerData.cards as Card[]) || [])];

  const cardIndex = playerCards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('Card not found');
  }

  // Update the card
  playerCards[cardIndex] = {
    ...playerCards[cardIndex],
    ...updates,
  };

  // If we're hiding a card after the reveal/challenge is over,
  // make sure to clear all visibility states
  if (updates.faceVisible === false || updates.newCard === false) {
    playerCards[cardIndex].revealed = false;
    playerCards[cardIndex].isInChallenge = false;
    playerCards[cardIndex].challengeCardIndex = null;

    // If this is a new card being hidden, make sure it's fully reset
    if (updates.newCard === false) {
      playerCards[cardIndex].faceVisible = false;
    }
  }

  await updateDoc('players', playerDocId, {
    cards: playerCards,
    updatedAt: new Date().toISOString(),
  });

  return playerCards[cardIndex];
}
