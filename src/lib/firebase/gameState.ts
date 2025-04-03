// src/lib/firebase/gameState.ts
import { doc, updateDoc, onSnapshot, getDoc, setDoc, collection, getDocs, arrayUnion, deleteField } from 'firebase/firestore';
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
  resolvedAt?: number;
  resolution?: {
    message: string;
  }
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
  
  // Instead of setting a global timer, just update the game state
  await updateDoc(gameRef, {
    gameState: 'memorizing',
    memorizeStartTime: new Date().toISOString(),
  });
}

// Start playing phase (after memorization)
export async function startPlayingPhase(gameId: string) {
  const gameRef = doc(db, "games", gameId);
  
  try {
    // First get current game data
    const gameSnapshot = await getDoc(gameRef);
    if (!gameSnapshot.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameSnapshot.data();
    
    // Get all players
    const playersCollectionRef = collection(db, `games/${gameId}/players`);
    const playerDocs = await getDocs(playersCollectionRef);
    
    // Get player readiness status
    const readinessRef = doc(db, 'games', gameId, 'meta', 'playerReadiness');
    const readinessSnapshot = await getDoc(readinessRef);
    const playerReadiness = readinessSnapshot.exists() ? readinessSnapshot.data() : {};
    
    // Force mark all players as ready
    const updatedReadiness = {...playerReadiness};
    
    // For each player, hide their cards and mark them as ready
    const playerUpdates = playerDocs.docs.map(async (playerDoc) => {
      const playerData = playerDoc.data();
      const playerId = playerDoc.id;
      
      // Make sure player is marked as ready
      updatedReadiness[playerId] = true;
      
      const updatedCards = (playerData.cards || []).map(card => ({
        ...card,
        faceVisible: false,
        seen: true, // Mark as seen even if they didn't explicitly memorize
      }));
      
      return updateDoc(playerDoc.ref, {
        cards: updatedCards,
        updatedAt: new Date().toISOString(),
      });
    });
    
    // Update readiness status for all players
    await setDoc(readinessRef, updatedReadiness, { merge: true });
    
    // Wait for all player updates
    await Promise.all(playerUpdates);
    
    // Update game state to playing
    await updateDoc(gameRef, {
      gameState: 'playing',
      playingStartTime: new Date().toISOString(),
      // Clear any pending memorization timers
      memorizeEndTime: deleteField(),
      // Add a message to indicate host forced game start
      lastAction: {
        type: 'host_started_game',
        timestamp: new Date().toISOString(),
        message: 'Host started the game by revealing a card'
      }
    });
    
    console.log("Game state updated to playing successfully");
  } catch (error) {
    console.error("Error starting play phase:", error);
    throw error;
  }
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
  
  // Clear any pending challenges when a new card is revealed
  const currentAssignments = gameData.drinkAssignments || [];
  const updatedAssignments = currentAssignments.filter(
    assignment => assignment.status !== 'pending' && assignment.status !== 'challenged'
  );
  
  // Reveal the next card and clear challenges
  await updateDoc(gameRef, {
    drinkAssignments: updatedAssignments,
    lastRoundAssignments: currentAssignments,
    currentRound: (gameData.currentRound || 0) + 1
  });
  
  // IMPORTANT: Clear challenge state for ALL players when a new card is revealed
  console.log("New pyramid card revealed - clearing ALL player challenge states");
  
  // Get all players in the game
  try {
    const playersCollectionRef = collection(db, 'games', gameId, 'players');
    const playerDocs = await getDocs(playersCollectionRef);
    
    // Clear challenge state for each player
    const playerClearPromises = playerDocs.docs.map(playerDoc => {
      const playerId = playerDoc.id;
      return clearPlayerChallengeState(gameId, playerId);
    });
    
    // Wait for all challenge states to be cleared
    await Promise.all(playerClearPromises);
    console.log("Successfully cleared all player challenge states");
  } catch (error) {
    console.error("Error clearing all player challenge states:", error);
  }
  
  // Automatically replace cards for players with pending replacements
  if (gameData.pendingCardReplacements) {
    for (const [playerId, indexToReplace] of Object.entries(gameData.pendingCardReplacements)) {
      await replacePlayerCard(gameId, playerId, indexToReplace as number);
    }
    
    // Clear pending replacements
    await updateDoc(gameRef, {
      pendingCardReplacements: deleteField()
    });
  }
  
  // Now reveal the next pyramid card
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
    drinkAssignments: arrayUnion(drinkAssignment),
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
  
  // Mark assignment as challenged
  assignments[assignmentIndex].status = 'challenged';
  
  // Get the players involved for better logging
  const fromPlayer = assignments[assignmentIndex].from;
  const toPlayer = assignments[assignmentIndex].to;
  const cardRank = assignments[assignmentIndex].cardRank;
  
  console.log(`🔄 CHALLENGE FLOW: Assignment #${assignmentIndex} challenged
    - FROM player ${fromPlayer} (who claimed to have the card)
    - TO player ${toPlayer} (who is being assigned drinks)
    - Card claimed: ${cardRank}
    - Challenger: ${toPlayer} (the one who receives drinks)
    - Challenged: ${fromPlayer} (who needs to prove they have the card)
  `);
  
  // When challenged, the FROM player needs to reveal a card
  // to prove they have what they claimed
  
  await updateDoc(gameRef, {
    drinkAssignments: assignments,
    lastActivity: new Date().toISOString(),
    [`playerChallenges.${fromPlayer}`]: {
      status: 'needs_to_show_card',
      assignmentIndex: assignmentIndex,
      challengedAt: Date.now(),
      challenger: toPlayer
    }
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
    console.log(`🔄 RESOLVING CHALLENGE: assignmentIndex=${assignmentIndex}, wasSuccessful=${wasSuccessful}`);
    
    const gameRef = doc(db, "games", gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data();
    const assignments = gameData.drinkAssignments || [];
    
    if (!assignments[assignmentIndex]) {
      throw new Error('Assignment not found');
    }
    
    // Get the involved players
    const fromPlayerId = assignments[assignmentIndex].from;
    const toPlayerId = assignments[assignmentIndex].to;
    const cardRank = assignments[assignmentIndex].cardRank;
    const drinkCount = assignments[assignmentIndex].count || 1;
    
    // Find player names for clearer logging
    let fromPlayerName = 'Player 1';
    let toPlayerName = 'Player 2';
    
    if (gameData.players) {
      const fromPlayer = gameData.players.find(p => p.id === fromPlayerId);
      const toPlayer = gameData.players.find(p => p.id === toPlayerId);
      
      if (fromPlayer) fromPlayerName = fromPlayer.name;
      if (toPlayer) toPlayerName = toPlayer.name;
    }
    
    // Log detailed challenge information
    console.log(`🔄 Challenge details:
      - From: ${fromPlayerName} (${fromPlayerId})
      - To: ${toPlayerName} (${toPlayerId})
      - Card: ${cardRank}
      - Original drinks: ${drinkCount}
      - Result: ${wasSuccessful ? 'SUCCESSFUL ✓' : 'FAILED ✗'}
      - Double drinks: ${drinkCount * 2}
      - Drinks assigned to: ${wasSuccessful ? toPlayerName : fromPlayerName}
    `);
    
    // Create a timestamped resolution message
    const resolutionTime = new Date().toISOString();
    const resultMessage = wasSuccessful
      ? `${fromPlayerName} successfully proved they had the ${cardRank}. ${toPlayerName} drinks double (${drinkCount * 2}).`
      : `${fromPlayerName} failed to prove they had the ${cardRank}. ${fromPlayerName} drinks double (${drinkCount * 2}).`;
      
    // Update ONLY THIS assignment with proper status and message
    assignments[assignmentIndex] = {
      ...assignments[assignmentIndex],
      status: wasSuccessful ? 'successful_challenge' : 'failed_challenge',
      resolvedAt: Date.now(),
      isResolved: true,
      resolution: {
        time: resolutionTime,
        message: resultMessage,
        wasSuccessful: wasSuccessful,
        doubleDrinks: drinkCount * 2,
        drinker: wasSuccessful ? toPlayerId : fromPlayerId
      }
    };
    
    // Update the game document with just this assignment's updated status
    await updateDoc(gameRef, {
      drinkAssignments: assignments,
      lastAction: {
        type: wasSuccessful ? 'successful_challenge' : 'failed_challenge',
        fromPlayer: fromPlayerId,
        toPlayer: toPlayerId,
        fromPlayerName: fromPlayerName,
        toPlayerName: toPlayerName,
        cardRank: cardRank, 
        timestamp: resolutionTime,
        drinkCount: drinkCount * 2,
        message: resultMessage,
        assignedTo: wasSuccessful ? toPlayerId : fromPlayerId
      }
    });
    
    // Create a named key for properly tracking this challenge to ensure it's not processed multiple times
    const challengeKey = `resolved_${fromPlayerId}_${toPlayerId}_${Date.now()}`;
    await updateDoc(gameRef, {
      [`resolvedChallenges.${challengeKey}`]: {
        timestamp: Date.now(),
        result: wasSuccessful ? 'successful' : 'failed'
      }
    });
    
    // Update drink summary for the round
    try {
      let drinkSummary = gameData.drinkSummary || {};
      const recipientId = wasSuccessful ? toPlayerId : fromPlayerId;
      
      drinkSummary[recipientId] = (drinkSummary[recipientId] || 0) + (drinkCount * 2);
      
      await updateDoc(gameRef, {
        drinkSummary: drinkSummary
      });
      
      console.log(`🔄 Updated drink summary for ${recipientId} with ${drinkCount * 2} additional drinks`);
    } catch (summaryError) {
      console.error("Error updating drink summary:", summaryError);
    }
    
    // Now clear challenge state for BOTH involved players
    try {
      console.log("🧹 Clearing final challenge state");
      
      // Use batch updates to ensure atomicity
      
      // Clear state for the player who assigned the drink
      const fromPlayerRef = doc(db, "games", gameId, "players", fromPlayerId);
      await updateDoc(fromPlayerRef, {
        isInChallenge: false,
        challengeCardIndex: null,
        inChallenge: false,
        selectingForChallenge: false,
        challengeComplete: true,
        updatedAt: new Date().toISOString()
      });
      
      // Also clear state for the challenger
      const toPlayerRef = doc(db, "games", gameId, "players", toPlayerId);
      await updateDoc(toPlayerRef, {
        isInChallenge: false,
        challengeCardIndex: null,
        inChallenge: false,
        selectingForChallenge: false,
        challengeComplete: true,
        updatedAt: new Date().toISOString()
      });
      
      // Final game update
      await updateDoc(gameRef, {
        lastResolution: new Date().toISOString(),
        [`challengeResolutions.${assignmentIndex}`]: {
          timestamp: Date.now(),
          wasSuccessful: wasSuccessful,
          fromPlayer: fromPlayerId,
          toPlayer: toPlayerId,
          cardRank: cardRank,
          drinkCount: drinkCount * 2,
          message: resultMessage
        }
      });
      
      console.log(`✅ Challenge resolved between ${fromPlayerName} and ${toPlayerName}`);
    } catch (clearError) {
      console.error("❌ Error in final challenge cleanup:", clearError);
    }
    
    // Return the result to make it available to the calling function
    return {
      wasSuccessful,
      drinkCount: drinkCount * 2,
      assignedTo: wasSuccessful ? toPlayerId : fromPlayerId,
      message: resultMessage
    };
  } catch (error) {
    console.error("Error resolving drink challenge:", error);
    throw error;
  }
}

// Mark a card as needing replacement after a challenge
export async function markCardForReplacement(gameId: string, playerId: string, cardIndex: number) {
  if (!gameId || !playerId) {
    console.error("Missing gameId or playerId in markCardForReplacement");
    return;
  }

  try {
    const gameRef = doc(db, "games", gameId);
    
    // Add to the pendingCardReplacements map
    await updateDoc(gameRef, {
      [`pendingCardReplacements.${playerId}`]: cardIndex
    });
    
    console.log(`Card at index ${cardIndex} for player ${playerId} marked for replacement`);
  } catch (error) {
    console.error("Error marking card for replacement:", error);
  }
}

/**
 * Clear any pending challenge states for a player
 * This helps when a player gets stuck in challenge mode
 * SIMPLIFIED to avoid infinite loops and recursion
 */
export async function clearPlayerChallengeState(gameId: string, playerId: string): Promise<void> {
  if (!gameId || !playerId) {
    console.error("Missing gameId or playerId in clearPlayerChallengeState");
    return;
  }

  try {
    const playerRef = doc(db, "games", gameId, "players", playerId);
    
    // SIMPLIFIED: Less logging to avoid console flood
    
    // Update minimal player state with challenge flags reset
    // Don't read the player's cards first to avoid triggering listeners
    await updateDoc(playerRef, {
      isInChallenge: false,
      inChallenge: false,
      challengeCardIndex: null,
      selectingCardForChallenge: false,
      selectingForChallenge: false,
      updatedAt: new Date().toISOString()
    });
    
    // Don't do any more updates that might trigger listeners
    // This previous approach was likely causing infinite loops
  } catch (error) {
    console.error("Error clearing player challenge state:", error);
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
    
    const gameRef = doc(db, "games", gameId);
    const playerRef = doc(db, "games", gameId, "players", playerId);
    
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
    
    // Get player's current cards
    const playerCards = [...playerDoc.data().cards];
    
    // Check if cardIndex is valid
    if (cardIndex < 0 || cardIndex >= playerCards.length) {
      console.error(`Invalid card index: ${cardIndex}, player has ${playerCards.length} cards`);
      return null;
    }
    
    // Keep track of the old card for reference
    const oldCard = playerCards[cardIndex];
    
    // We need to check the deck format - in different parts of the codebase there seems
    // to be two different deck structures.
    let newDeck, newCard;
    
    // If deck is an array of numbers (direct card indexes)
    if (gameData["__pyramid.deck"] && Array.isArray(gameData["__pyramid.deck"])) {
      newDeck = [...gameData["__pyramid.deck"]];
      
      // Check if there are cards left in the deck
      if (newDeck.length === 0) {
        console.log('No more cards in deck, removing the challenged card without replacement');
        
        // Mark the card as revealed but don't replace it
        playerCards[cardIndex] = {
          ...oldCard,
          revealed: true,
          revealedAt: new Date().toISOString()
        };
        
        // Update player cards
        await updateDoc(playerRef, {
          cards: playerCards,
          updatedAt: new Date().toISOString(),
          isInChallenge: false, // Clear challenge state
        });
        
        // Clear any pending challenge state
        await clearPlayerChallengeState(gameId, playerId);
        
        return null;
      }
      
      // Get new card from deck (take the first card)
      const newCardIndex = newDeck.shift();
      
      // Create new card object with clear timestamps
      const now = new Date().toISOString();
      newCard = {
        i: newCardIndex,
        seen: false,
        newCard: true,  // Mark as new for the 15 second timer
        faceVisible: true,  // Show to player immediately
        replacedAt: now // Add timestamp for timer
      };
      
      // Update the deck in Firebase
      await updateDoc(gameRef, {
        "__pyramid.deck": newDeck,
      });
    } 
    // If deck is an object with a cards array
    else if (gameData.deck && gameData.deck.cards && Array.isArray(gameData.deck.cards)) {
      const deck = {...gameData.deck};
      
      // Check if there are cards left in the deck
      if (deck.cards.length === 0) {
        console.log('No more cards in deck, removing the challenged card without replacement');
        
        // Mark the card as revealed but don't replace it
        playerCards[cardIndex] = {
          ...oldCard,
          revealed: true,
          revealedAt: new Date().toISOString()
        };
        
        // Update player cards
        await updateDoc(playerRef, {
          cards: playerCards,
          updatedAt: new Date().toISOString(),
          isInChallenge: false, // Clear challenge state
        });
        
        // Clear any pending challenge state
        await clearPlayerChallengeState(gameId, playerId);
        
        return null;
      }
      
      // Get new card from deck
      newCard = deck.cards.pop();
      
      // Set card properties for the new card
      const now = new Date().toISOString();
      newCard.owner = playerId;
      newCard.revealed = false; // Not revealed to others
      newCard.faceVisible = true; // But shown to the player
      newCard.newCard = true; // Mark as new
      newCard.replacedAt = now; // Add timestamp for timer
      
      // Update the deck in Firebase
      await updateDoc(gameRef, {
        deck,
      });
    } else {
      console.error("Cannot find a valid deck in game data");
      
      // Clear any pending challenge state anyway
      await clearPlayerChallengeState(gameId, playerId);
      
      return null;
    }
    
    // Replace the card at the specified index
    playerCards[cardIndex] = newCard;
    
    // Update player cards and clear challenge state
    await updateDoc(playerRef, {
      cards: playerCards,
      updatedAt: new Date().toISOString(),
      isInChallenge: false, // Clear challenge flag
      challengeCardIndex: null, // Clear challenge card index
    });
    
    // Ensure challenge state is completely cleared
    await clearPlayerChallengeState(gameId, playerId);
    
    console.log(`Successfully replaced card for player ${playerId} with new card:`, newCard);
    
    // Set up a timer in Firebase to auto-hide the card after 15 seconds
    // Store the timestamp when the card should be hidden
    const hideCardTime = new Date(Date.now() + 15000).toISOString();
    
    // Only add timer if newCard is valid and has an i property
    if (newCard && newCard.i !== undefined) {
      await updateDoc(gameRef, {
        [`newCardTimers.${playerId}.${newCard.i}`]: hideCardTime,
        [`newCardTimers.timeLeft`]: 15
      });
    }
    
    // Remove from pending replacements if it exists
    await updateDoc(gameRef, {
      [`pendingCardReplacements.${playerId}`]: deleteField(),
      [`challengeTimers.${playerId}`]: deleteField() // Clear any challenge timers
    });
    
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