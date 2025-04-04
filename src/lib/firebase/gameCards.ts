import { doc, updateDoc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Deck, Card } from '../deck';

/**
 * Initialize a new game deck and pyramid in Firebase
 */
export async function initializeGameDeck(gameId: string, rows: number) {
  const gameRef = doc(db, 'games', gameId);
  
  // Create and shuffle a new deck
  const deck = new Deck();
  deck.shuffle();
  
  // Deal cards for the pyramid
  const pyramidCards = deck.createPyramid(rows);
  
  // Save the deck and pyramid to Firebase
  await updateDoc(gameRef, {
    deck: deck.serialize(),
    pyramidCards,
    gameState: 'ready', // Change to ready instead of started
  });
  
  return { deck, pyramidCards };
}

/**
 * Deal cards to a player
 */
export async function dealCardsToPlayer(gameId: string, playerId: string, count: number = 5) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnapshot = await getDoc(gameRef);
  
  if (!gameSnapshot.exists()) {
    throw new Error('Game not found');
  }
  
  const gameData = gameSnapshot.data();
  const deck = Deck.deserialize(gameData.deck);
  
  // Deal cards to the player
  const playerCards = deck.deal(count);
  
  // Mark cards as owned by this player
  playerCards.forEach(card => {
    card.owner = playerId;
    card.faceVisible = false; // Will be shown during memorization phase
  });
  
  // Update the game document - use setDoc with merge to ensure atomic updates
  await setDoc(doc(db, 'games', gameId, 'players', playerId), {
    cards: playerCards,
    cardCount: count,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  
  // Update the main game document with the new deck state
  await updateDoc(gameRef, {
    deck: deck.serialize(),
    [`playerCardCount.${playerId}`]: count,
  });
  
  return playerCards;
}

/**
 * Listen for changes to a player's cards
 */
export function subscribeToPlayerCards(gameId: string, playerId: string, callback: (cards: Card[]) => void) {
  // Subscribe to the player-specific subcollection instead of the main document
  const playerRef = doc(db, 'games', gameId, 'players', playerId);
  
  return onSnapshot(playerRef, (snapshot) => {
    if (!snapshot.exists()) {
      console.log("Player document does not exist, returning empty array");
      callback([]);
      return;
    }
    
    const playerData = snapshot.data();
    
    // Ensure cards is an array
    if (!playerData.cards || !Array.isArray(playerData.cards)) {
      console.log("Player has no cards or cards is not an array, returning empty array");
      callback([]);
      return;
    }
    
    console.log(`Found ${playerData.cards.length} cards for player in snapshot`);
    callback(playerData.cards);
  });
}

export async function hideNewCard(gameId: string, playerId: string, cardId: string) {
  if (!gameId || !playerId || !cardId) {
    console.error("Missing required parameters in hideNewCard");
    return;
  }

  try {
    const playerRef = doc(db, 'games', gameId, 'players', playerId);
    const playerDoc = await getDoc(playerRef);
    
    if (!playerDoc.exists()) {
      console.error("Player document not found");
      return;
    }
    
    const playerData = playerDoc.data();
    
    if (!playerData.cards || !Array.isArray(playerData.cards)) {
      console.error("Invalid cards data structure");
      return;
    }
    
    // Find and update the card
    const updatedCards = playerData.cards.map(card => 
      card.id === cardId ? { ...card, newCard: false, faceVisible: false } : card
    );
    
    // Update the player document
    await updateDoc(playerRef, {
      cards: updatedCards,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Successfully hid new card ${cardId} for player ${playerId}`);
  } catch (error) {
    console.error("Error hiding new card:", error);
  }
}

/**
 * Listen for changes to the pyramid cards
 */
export function subscribeToPyramidCards(gameId: string, callback: (cards: Card[]) => void) {
  const gameRef = doc(db, 'games', gameId);
  
  return onSnapshot(gameRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const gameData = snapshot.data();
    const pyramidCards = gameData.pyramidCards || [];
    
    callback(pyramidCards);
  });
}

/**
 * Reveal a pyramid card
 */
export async function revealPyramidCard(gameId: string, cardIndex: number) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnapshot = await getDoc(gameRef);
  
  if (!gameSnapshot.exists()) {
    throw new Error('Game not found');
  }
  
  const gameData = gameSnapshot.data();
  const pyramidCards = [...gameData.pyramidCards];
  
  if (!pyramidCards[cardIndex]) {
    throw new Error('Card not found');
  }
  
  // Update the revealed status
  pyramidCards[cardIndex] = {
    ...pyramidCards[cardIndex],
    revealed: true,
  };
  
  // Update Firebase
  await updateDoc(gameRef, {
    pyramidCards,
    currentCardIndex: cardIndex,
    currentCardRevealed: new Date().toISOString(),
    lastRevealedCard: pyramidCards[cardIndex],
    lastRevealTime: new Date().toISOString(),
    gameState: 'playing', // Ensure game state is playing
  });
  
  return pyramidCards[cardIndex];
}

/**
 * Update a player's card (e.g., when moved)
 */
export async function updatePlayerCard(gameId: string, playerId: string, cardId: string, updates: Partial<Card>) {
  const playerRef = doc(db, 'games', gameId, 'players', playerId);
  const playerSnapshot = await getDoc(playerRef);
  
  if (!playerSnapshot.exists()) {
    throw new Error('Player data not found');
  }
  
  const playerData = playerSnapshot.data();
  const playerCards = [...(playerData.cards || [])];
  
  const cardIndex = playerCards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('Card not found');
  }
  
  // Update the card
  playerCards[cardIndex] = {
    ...playerCards[cardIndex],
    ...updates,
  };
  
  // If we're hiding a card after the reveal/challenge is over, make sure to clear all visibility states
  if (updates.faceVisible === false || updates.newCard === false) {
    playerCards[cardIndex].revealed = false;
    playerCards[cardIndex].isInChallenge = false;
    playerCards[cardIndex].challengeCardIndex = null;
    
    // If this is a new card being hidden, make sure it's fully reset
    if (updates.newCard === false) {
      playerCards[cardIndex].faceVisible = false;
    }
  }
  
  // Update Firebase
  await updateDoc(playerRef, {
    cards: playerCards,
    updatedAt: new Date().toISOString()
  });
  
  return playerCards[cardIndex];
}