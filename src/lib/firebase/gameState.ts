// src/lib/firebase/gameState.ts
import { doc, updateDoc, onSnapshot, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { revealPyramidCard } from './gameCards';

// Game state types
export type GameState = 'waiting' | 'ready' | 'memorizing' | 'playing' | 'ended';

export interface DrinkAssignment {
  from: string;
  to: string;
  count: number;
  cardId: string;
  cardRank: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'challenged' | 'successful_challenge' | 'failed_challenge';
  resolvedAt?: number; // Add this optional property
}

// Update game state
export async function updateGameState(gameId: string, state: GameState) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    gameState: state,
    stateUpdatedAt: new Date().toISOString(),
  });
}

// Start memorization phase
export async function startMemorizationPhase(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  
  // Set memorization time to 10 seconds
  const memorizeEndTime = new Date(Date.now() + 10000).toISOString();
  
  await updateDoc(gameRef, {
    gameState: 'memorizing',
    memorizeStartTime: new Date().toISOString(),
    memorizeEndTime,
  });

  // Schedule automatic transition to playing state after 10 seconds
  setTimeout(async () => {
    const gameSnapshot = await getDoc(gameRef);
    const data = gameSnapshot.data();
    if (data?.gameState === 'memorizing') {
      // Update cards to hide them after memorization
      const playersCollectionRef = collection(db, `games/${gameId}/players`);
      const playerDocs = await getDocs(playersCollectionRef);
      
      // For each player, hide their cards
      const playerUpdates = playerDocs.docs.map(async (playerDoc) => {
        const playerData = playerDoc.data();
        const updatedCards = (playerData.cards || []).map(card => ({
          ...card,
          faceVisible: false,
        }));
        
        return updateDoc(playerDoc.ref, {
          cards: updatedCards,
          updatedAt: new Date().toISOString(),
        });
      });
      
      // Wait for all player updates
      await Promise.all(playerUpdates);
      
      // Update game state to playing
      await updateDoc(gameRef, {
        gameState: 'playing',
        playingStartTime: new Date().toISOString(),
      });
    }
  }, 10000);
}

// Reveal next pyramid card
export async function revealNextPyramidCard(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const gameData = gameDoc.data();
  const pyramidCards = [...gameData.pyramidCards];
  const nextCardIndex = pyramidCards.findIndex(card => !card.revealed);
  
  if (nextCardIndex === -1) {
    // All cards are revealed, end the game
    await updateDoc(gameRef, {
      gameState: 'ended',
      endedAt: new Date().toISOString(),
    });
    return null;
  }
  
  // Reveal the next card
  await revealPyramidCard(gameId, nextCardIndex);
  
  return pyramidCards[nextCardIndex];
}

// Assign drinks to a player
export async function assignDrinks(
  gameId: string, 
  fromPlayer: string, 
  toPlayer: string, 
  cardId: string, 
  cardRank: string, 
  count: number
) {
  const gameRef = doc(db, 'games', gameId);
  const drinkAssignment: DrinkAssignment = {
    from: fromPlayer,
    to: toPlayer,
    cardId,
    cardRank,
    count,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  await updateDoc(gameRef, {
    drinkAssignments: [drinkAssignment, ...(await getCurrentDrinkAssignments(gameId))],
    lastActivity: new Date().toISOString(),
  });
  
  return drinkAssignment;
}

// Get current drink assignments
export async function getCurrentDrinkAssignments(gameId: string): Promise<DrinkAssignment[]> {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    return [];
  }
  
  return gameDoc.data().drinkAssignments || [];
}

// Accept a drink assignment
export async function acceptDrinkAssignment(gameId: string, assignmentIndex: number) {
  const gameRef = doc(db, 'games', gameId);
  const assignments = await getCurrentDrinkAssignments(gameId);
  
  if (!assignments[assignmentIndex]) {
    throw new Error('Assignment not found');
  }
  
  assignments[assignmentIndex].status = 'accepted';
  
  await updateDoc(gameRef, {
    drinkAssignments: assignments,
    lastActivity: new Date().toISOString(),
  });
}

// Challenge a drink assignment
export async function challengeDrinkAssignment(gameId: string, assignmentIndex: number) {
  const gameRef = doc(db, 'games', gameId);
  const assignments = await getCurrentDrinkAssignments(gameId);
  
  if (!assignments[assignmentIndex]) {
    throw new Error('Assignment not found');
  }
  
  assignments[assignmentIndex].status = 'challenged';
  
  await updateDoc(gameRef, {
    drinkAssignments: assignments,
    lastActivity: new Date().toISOString(),
  });
}

// Resolve a challenge (was it successful or failed)
export async function resolveDrinkChallenge(
  gameId: string, 
  assignmentIndex: number, 
  wasSuccessful: boolean
) {
  if (!gameId) {
    console.error("Missing gameId in resolveDrinkChallenge");
    return;
  }

  try {
    const gameRef = doc(db, 'games', gameId);
    const assignments = await getCurrentDrinkAssignments(gameId);
    
    if (!assignments[assignmentIndex]) {
      throw new Error('Assignment not found');
    }
    
    // Update assignment status based on whether the card matched
    assignments[assignmentIndex].status = wasSuccessful ? 'successful_challenge' : 'failed_challenge';
    
    // Also record the timestamp when the challenge was resolved
    assignments[assignmentIndex].resolvedAt = Date.now();
    
    // Update the assignments in Firebase
    await updateDoc(gameRef, {
      drinkAssignments: assignments,
      lastActivity: new Date().toISOString(),
    });
    
    console.log(`Challenge resolved as ${wasSuccessful ? 'successful' : 'failed'}`);
  } catch (error) {
    console.error("Error resolving drink challenge:", error);
    throw error;
  }
}

// Replace a player's card after it was revealed in a challenge
export async function replacePlayerCard(gameId: string, playerId: string, cardIndex: number) {
  if (!gameId || !playerId) {
    console.error("Missing gameId or playerId in replacePlayerCard");
    return null;
  }

  try {
    console.log(`Replacing card at index ${cardIndex} for player ${playerId} in game ${gameId}`);
    
    const gameRef = doc(db, 'games', gameId);
    const playerRef = doc(db, 'games', gameId, 'players', playerId);
    
    // Get current player cards
    const playerDoc = await getDoc(playerRef);
    if (!playerDoc.exists()) {
      throw new Error('Player not found');
    }
    
    // Get deck
    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data();
    
    // Make sure we have a deck with cards
    if (!gameData || !gameData.deck || !gameData.deck.cards || !Array.isArray(gameData.deck.cards)) {
      console.error("Invalid deck structure in game data");
      return null;
    }
    
    const deck = {...gameData.deck};
    
    // Get player's current cards
    const playerCards = [...playerDoc.data().cards];
    
    // Check if cardIndex is valid
    if (cardIndex < 0 || cardIndex >= playerCards.length) {
      console.error(`Invalid card index: ${cardIndex}, player has ${playerCards.length} cards`);
      return null;
    }
    
    // Check if there are cards left in the deck
    if (deck.cards.length === 0) {
      console.log('No more cards in deck, removing the challenged card without replacement');
      
      // Mark the card as revealed but don't replace it
      playerCards[cardIndex] = {
        ...playerCards[cardIndex],
        revealed: true,
        revealedAt: new Date().toISOString()
      };
      
      // Update player cards
      await updateDoc(playerRef, {
        cards: playerCards,
        updatedAt: new Date().toISOString(),
      });
      
      return null;
    }
    
    // Get new card from deck
    const newCard = deck.cards.pop();
    
    // Set card properties for the new card
    newCard.owner = playerId;
    newCard.revealed = false; // Not revealed to others
    newCard.faceVisible = true; // But shown to the player
    newCard.newCard = true; // Mark as new
    newCard.replacedAt = new Date().toISOString();
    
    // Replace the card at the specified index
    playerCards[cardIndex] = newCard;
    
    // Update player cards
    await updateDoc(playerRef, {
      cards: playerCards,
      updatedAt: new Date().toISOString(),
    });
    
    // Update deck in the game data
    await updateDoc(gameRef, {
      deck,
    });
    
    console.log(`Successfully replaced card for player ${playerId} with new card`);
    return newCard;
  } catch (error) {
    console.error("Error replacing player card:", error);
    return null;
  }
}

// Listen for game state changes
export function subscribeToGameStateDetails(gameId: string, callback: (gameData: any) => void) {
  const gameRef = doc(db, 'games', gameId);
  
  return onSnapshot(gameRef, (snapshot) => {
    if (!snapshot.exists()) return;
    
    const gameData = snapshot.data();
    callback(gameData);
  });
}