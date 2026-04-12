// src/lib/api/gameState.ts
// Drop-in replacement for firebase/gameState.ts using PaaS Datastore client
import {
  getDoc,
  updateDoc,
  setDoc,
  modifyDoc,
  queryDocs,
  subscribeDoc,
} from "@/lib/api/client";

// Game state types (unchanged)
export type GameState = "waiting" | "ready" | "memorizing" | "playing" | "ended";

export interface DrinkAssignment {
  from: string;
  to: string;
  count: number;
  cardId: string;
  cardRank: string;
  timestamp: number;
  status:
    | "pending"
    | "accepted"
    | "challenged"
    | "successful_challenge"
    | "failed_challenge";
  resolvedAt?: number;
  resolution?: {
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Helper: inline equivalent of revealPyramidCard from gameCards.ts
// (avoids dependency on a file that may not exist in lib/api yet)
// ---------------------------------------------------------------------------
async function revealPyramidCard(gameId: string, cardIndex: number) {
  const gameData = await getDoc("games", gameId);
  if (!gameData) throw new Error("Game not found");

  const pyramidCards = [...(gameData.pyramidCards as any[])];
  if (!pyramidCards[cardIndex]) throw new Error("Card not found");

  pyramidCards[cardIndex] = {
    ...pyramidCards[cardIndex],
    revealed: true,
  };

  await updateDoc("games", gameId, {
    pyramidCards,
    currentCardIndex: cardIndex,
    currentCardRevealed: new Date().toISOString(),
    lastRevealedCard: pyramidCards[cardIndex],
    lastRevealTime: new Date().toISOString(),
    gameState: "playing",
  });

  return pyramidCards[cardIndex];
}

// ---------------------------------------------------------------------------
// Exported functions – same names & signatures as the Firebase version
// (minus the implicit `db` parameter which the client handles)
// ---------------------------------------------------------------------------

// Update game state
export async function updateGameState(gameId: string, state: GameState) {
  await updateDoc("games", gameId, {
    gameState: state,
    stateUpdatedAt: new Date().toISOString(),
  });
}

// Start memorization phase
export async function startMemorizationPhase(gameId: string) {
  await updateDoc("games", gameId, {
    gameState: "memorizing",
    memorizeStartTime: new Date().toISOString(),
  });
}

// Start playing phase (after memorization)
export async function startPlayingPhase(gameId: string) {
  try {
    // Get current game data
    const gameData = await getDoc("games", gameId);
    if (!gameData) throw new Error("Game not found");

    // Get all players (flattened sub-collection: "games/{gameId}/players" → collection "players", id prefix "{gameId}_")
    const playerDocs = await queryDocs("players", { _gameId: gameId });

    // Get player readiness status
    const playerReadiness =
      (await getDoc("meta", `${gameId}_playerReadiness`)) || ({} as Record<string, unknown>);

    // Force mark all players as ready
    const updatedReadiness: Record<string, unknown> = { ...playerReadiness };

    // For each player, hide their cards and mark them as ready
    const playerUpdates = playerDocs.map(async (playerDoc) => {
      const playerData = playerDoc.data as Record<string, any>;
      const playerId = playerDoc.id.replace(`${gameId}_`, "");

      updatedReadiness[playerId] = true;

      const updatedCards = ((playerData.cards as any[]) || []).map((card: any) => ({
        ...card,
        faceVisible: false,
        seen: true,
      }));

      return updateDoc("players", playerDoc.id, {
        cards: updatedCards,
        updatedAt: new Date().toISOString(),
      });
    });

    // Update readiness status for all players (merge via modifyDoc)
    await modifyDoc("meta", `${gameId}_playerReadiness`, (current) => ({
      ...current,
      ...updatedReadiness,
    }));

    // Wait for all player updates
    await Promise.all(playerUpdates);

    // Update game state to playing
    // Need modifyDoc to delete memorizeEndTime field
    await modifyDoc("games", gameId, (current) => {
      const updated = { ...current };
      delete updated.memorizeEndTime;
      return {
        ...updated,
        gameState: "playing",
        playingStartTime: new Date().toISOString(),
        lastAction: {
          type: "host_started_game",
          timestamp: new Date().toISOString(),
          message: "Host started the game by revealing a card",
        },
      };
    });

    console.log("Game state updated to playing successfully");
  } catch (error) {
    console.error("Error starting play phase:", error);
    throw error;
  }
}

// Reveal next pyramid card
export async function revealNextPyramidCard(gameId: string) {
  const gameData = await getDoc("games", gameId);
  if (!gameData) throw new Error("Game not found");

  const pyramidCards = [...(gameData.pyramidCards as any[])];
  const nextCardIndex = pyramidCards.findIndex((card: any) => !card.revealed);

  if (nextCardIndex === -1) {
    // All cards are revealed, end the game
    await updateDoc("games", gameId, {
      gameState: "ended",
      endedAt: new Date().toISOString(),
    });
    return null;
  }

  // Clear any pending challenges when a new card is revealed
  const currentAssignments = (gameData.drinkAssignments as DrinkAssignment[]) || [];
  const updatedAssignments = currentAssignments.filter(
    (assignment) => assignment.status !== "pending" && assignment.status !== "challenged"
  );

  // Reveal the next card and clear challenges
  await updateDoc("games", gameId, {
    drinkAssignments: updatedAssignments,
    lastRoundAssignments: currentAssignments,
    currentRound: ((gameData.currentRound as number) || 0) + 1,
  });

  // Clear challenge state for ALL players
  console.log("New pyramid card revealed - clearing ALL player challenge states");

  try {
    const playerDocs = await queryDocs("players", { _gameId: gameId });

    const playerClearPromises = playerDocs.map((playerDoc) => {
      const playerId = playerDoc.id.replace(`${gameId}_`, "");
      return clearPlayerChallengeState(gameId, playerId);
    });

    await Promise.all(playerClearPromises);
    console.log("Successfully cleared all player challenge states");
  } catch (error) {
    console.error("Error clearing all player challenge states:", error);
  }

  // Automatically replace cards for players with pending replacements
  const pendingReplacements = gameData.pendingCardReplacements as
    | Record<string, number>
    | undefined;
  if (pendingReplacements) {
    for (const [playerId, indexToReplace] of Object.entries(pendingReplacements)) {
      await replacePlayerCard(gameId, playerId, indexToReplace as number);
    }

    // Clear pending replacements (delete the field)
    await modifyDoc("games", gameId, (current) => {
      const updated = { ...current };
      delete updated.pendingCardReplacements;
      return updated;
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
  const drinkAssignment: DrinkAssignment = {
    from: fromPlayer,
    to: toPlayer,
    cardId,
    cardRank,
    count,
    timestamp: Date.now(),
    status: "pending",
  };

  // arrayUnion equivalent: read-modify-write to push onto the array
  await modifyDoc("games", gameId, (current) => ({
    ...current,
    drinkAssignments: [...((current.drinkAssignments as any[]) || []), drinkAssignment],
    lastActivity: new Date().toISOString(),
  }));

  return drinkAssignment;
}

// Get current drink assignments
export async function getCurrentDrinkAssignments(
  gameId: string
): Promise<DrinkAssignment[]> {
  const gameData = await getDoc("games", gameId);
  if (!gameData) return [];
  return (gameData.drinkAssignments as DrinkAssignment[]) || [];
}

// Accept a drink assignment
export async function acceptDrinkAssignment(
  gameId: string,
  assignmentIndex: number
) {
  const assignments = await getCurrentDrinkAssignments(gameId);
  if (!assignments[assignmentIndex]) throw new Error("Assignment not found");

  assignments[assignmentIndex].status = "accepted";

  await updateDoc("games", gameId, {
    drinkAssignments: assignments,
    lastActivity: new Date().toISOString(),
  });
}

// Challenge a drink assignment
export async function challengeDrinkAssignment(
  gameId: string,
  assignmentIndex: number
) {
  const assignments = await getCurrentDrinkAssignments(gameId);
  if (!assignments[assignmentIndex]) throw new Error("Assignment not found");

  assignments[assignmentIndex].status = "challenged";

  const fromPlayer = assignments[assignmentIndex].from;
  const toPlayer = assignments[assignmentIndex].to;
  const cardRank = assignments[assignmentIndex].cardRank;

  console.log(`CHALLENGE FLOW: Assignment #${assignmentIndex} challenged
    - FROM player ${fromPlayer} (who claimed to have the card)
    - TO player ${toPlayer} (who is being assigned drinks)
    - Card claimed: ${cardRank}
    - Challenger: ${toPlayer} (the one who receives drinks)
    - Challenged: ${fromPlayer} (who needs to prove they have the card)
  `);

  // Need modifyDoc for nested path playerChallenges.{fromPlayer}
  await modifyDoc("games", gameId, (current) => {
    const playerChallenges = (current.playerChallenges as Record<string, unknown>) || {};
    return {
      ...current,
      drinkAssignments: assignments,
      lastActivity: new Date().toISOString(),
      playerChallenges: {
        ...playerChallenges,
        [fromPlayer]: {
          status: "needs_to_show_card",
          assignmentIndex: assignmentIndex,
          challengedAt: Date.now(),
          challenger: toPlayer,
        },
      },
    };
  });
}

// Resolve a challenge (was it successful or failed)
export async function resolveDrinkChallenge(
  gameId: string,
  assignmentIndex: number,
  wasSuccessful: boolean
) {
  if (!gameId) {
    console.error("CRITICAL: Missing gameId in resolveDrinkChallenge");
    return;
  }

  console.log(
    `DRINK RESOLUTION: Starting resolution for assignment #${assignmentIndex}, success=${wasSuccessful}`
  );

  try {
    const gameData = await getDoc("games", gameId);
    if (!gameData) {
      console.error("CRITICAL: Game not found in resolveDrinkChallenge");
      throw new Error("Game not found");
    }

    const assignments = (gameData.drinkAssignments as any[]) || [];
    if (!assignments[assignmentIndex]) {
      console.error("CRITICAL: Assignment not found in resolveDrinkChallenge");
      throw new Error("Assignment not found");
    }

    const fromPlayerId = assignments[assignmentIndex].from;
    const toPlayerId = assignments[assignmentIndex].to;
    const cardRank = assignments[assignmentIndex].cardRank;
    const drinkCount = assignments[assignmentIndex].count || 1;

    // Find player names
    let fromPlayerName = "Player 1";
    let toPlayerName = "Player 2";

    if (gameData.players) {
      try {
        const players = gameData.players as any[];
        const fromPlayer = players.find((p: any) => p.id === fromPlayerId);
        const toPlayer = players.find((p: any) => p.id === toPlayerId);

        if (fromPlayer) fromPlayerName = fromPlayer.name;
        if (toPlayer) toPlayerName = toPlayer.name;
      } catch (error) {
        console.error("Error finding player names:", error);
      }
    }

    console.log(
      `DRINK RESOLUTION: Challenge between ${fromPlayerName} and ${toPlayerName} for ${cardRank}`
    );
    console.log(
      `DRINK RESOLUTION: Result is ${wasSuccessful ? "SUCCESS" : "FAILURE"}`
    );

    const resolutionTime = new Date().toISOString();
    const resultMessage = wasSuccessful
      ? `${fromPlayerName} successfully proved they had the ${cardRank}. ${toPlayerName} drinks double (${drinkCount * 2}).`
      : `${fromPlayerName} failed to prove they had the ${cardRank}. ${fromPlayerName} drinks double (${drinkCount * 2}).`;

    console.log(`DRINK RESOLUTION: Message: ${resultMessage}`);

    // Step 1: Update just the assignment status (re-read fresh to avoid conflicts)
    try {
      const freshGameData = await getDoc("games", gameId);
      const freshAssignments = [...((freshGameData?.drinkAssignments as any[]) || [])];

      if (freshAssignments[assignmentIndex]) {
        freshAssignments[assignmentIndex] = {
          ...freshAssignments[assignmentIndex],
          status: wasSuccessful ? "successful_challenge" : "failed_challenge",
          resolvedAt: Date.now(),
          isResolved: true,
          resolution: {
            time: resolutionTime,
            message: resultMessage,
            wasSuccessful: wasSuccessful,
            doubleDrinks: drinkCount * 2,
            drinker: wasSuccessful ? toPlayerId : fromPlayerId,
          },
        };

        await updateDoc("games", gameId, {
          drinkAssignments: freshAssignments,
        });

        console.log("DRINK RESOLUTION: Assignment status updated successfully");
      }
    } catch (updateError) {
      console.error("CRITICAL: Error updating assignment status:", updateError);
    }

    // Step 2: Update game state with resolved challenge info
    const challengeKey = `resolved_${fromPlayerId}_${toPlayerId}_${Date.now()}`;

    try {
      await modifyDoc("games", gameId, (current) => {
        const resolvedChallenges =
          (current.resolvedChallenges as Record<string, unknown>) || {};
        return {
          ...current,
          resolvedChallenges: {
            ...resolvedChallenges,
            [challengeKey]: {
              timestamp: Date.now(),
              result: wasSuccessful ? "successful" : "failed",
            },
          },
          challengeResultId: `resolution_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          lastAction: {
            type: wasSuccessful ? "successful_challenge" : "failed_challenge",
            fromPlayer: fromPlayerId,
            toPlayer: toPlayerId,
            fromPlayerName: fromPlayerName,
            toPlayerName: toPlayerName,
            cardRank: cardRank,
            timestamp: resolutionTime,
            drinkCount: drinkCount * 2,
            message: resultMessage,
            assignedTo: wasSuccessful ? toPlayerId : fromPlayerId,
          },
          lastResolution: new Date().toISOString(),
        };
      });

      console.log("DRINK RESOLUTION: Game state updated successfully");
    } catch (updateError) {
      console.error("CRITICAL: Error updating game state:", updateError);
    }

    // Step 3: Update drink summary
    try {
      const summaryData = await getDoc("games", gameId);
      const drinkSummary =
        ((summaryData?.drinkSummary as Record<string, number>) || {});
      const recipientId = wasSuccessful ? toPlayerId : fromPlayerId;

      drinkSummary[recipientId] =
        (drinkSummary[recipientId] || 0) + drinkCount * 2;

      await updateDoc("games", gameId, {
        drinkSummary: drinkSummary,
      });

      console.log(
        `DRINK RESOLUTION: Updated drink summary for ${recipientId} with ${drinkCount * 2} additional drinks`
      );
    } catch (summaryError) {
      console.error("Error updating drink summary:", summaryError);
    }

    // Step 4: Clear challenge state for BOTH involved players
    try {
      console.log("DRINK RESOLUTION: Clearing final challenge state");

      // Clear state for the player who assigned the drink
      await updateDoc("players", `${gameId}_${fromPlayerId}`, {
        isInChallenge: false,
        challengeCardIndex: null,
        inChallenge: false,
        selectingForChallenge: false,
        challengeComplete: true,
        updatedAt: new Date().toISOString(),
      });

      // Also clear state for the challenger
      await updateDoc("players", `${gameId}_${toPlayerId}`, {
        isInChallenge: false,
        challengeCardIndex: null,
        inChallenge: false,
        selectingForChallenge: false,
        challengeComplete: true,
        updatedAt: new Date().toISOString(),
      });

      console.log("DRINK RESOLUTION: Challenge state cleared for both players");
    } catch (clearError) {
      console.error("CRITICAL: Error in final challenge cleanup:", clearError);
    }

    console.log(
      `DRINK RESOLUTION: Challenge fully resolved between ${fromPlayerName} and ${toPlayerName}`
    );

    return {
      wasSuccessful,
      drinkCount: drinkCount * 2,
      assignedTo: wasSuccessful ? toPlayerId : fromPlayerId,
      message: resultMessage,
    };
  } catch (error) {
    console.error("CRITICAL: Error resolving drink challenge:", error);
    throw error;
  }
}

// Mark a card as needing replacement after a challenge
export async function markCardForReplacement(
  gameId: string,
  playerId: string,
  cardIndex: number
) {
  if (!gameId || !playerId) {
    console.error("Missing gameId or playerId in markCardForReplacement");
    return;
  }

  try {
    // Nested path pendingCardReplacements.{playerId} → modifyDoc
    await modifyDoc("games", gameId, (current) => {
      const pendingCardReplacements =
        (current.pendingCardReplacements as Record<string, number>) || {};
      return {
        ...current,
        pendingCardReplacements: {
          ...pendingCardReplacements,
          [playerId]: cardIndex,
        },
      };
    });

    console.log(
      `Card at index ${cardIndex} for player ${playerId} marked for replacement`
    );
  } catch (error) {
    console.error("Error marking card for replacement:", error);
  }
}

/**
 * Clear any pending challenge states for a player.
 * SIMPLIFIED to avoid infinite loops and recursion.
 */
export async function clearPlayerChallengeState(
  gameId: string,
  playerId: string
): Promise<void> {
  if (!gameId || !playerId) {
    console.error("Missing gameId or playerId in clearPlayerChallengeState");
    return;
  }

  try {
    // Update player sub-document
    await updateDoc("players", `${gameId}_${playerId}`, {
      isInChallenge: false,
      inChallenge: false,
      challengeCardIndex: null,
      selectingCardForChallenge: false,
      selectingForChallenge: false,
      updatedAt: new Date().toISOString(),
    });

    // Clear global challenge state for this player (delete field)
    await modifyDoc("games", gameId, (current) => {
      const playerChallenges =
        (current.playerChallenges as Record<string, unknown>) || {};
      const updated = { ...playerChallenges };
      delete updated[playerId];
      return {
        ...current,
        playerChallenges: updated,
      };
    });

    console.log(`Successfully cleared challenge state for player ${playerId}`);
  } catch (error) {
    console.error("Error clearing player challenge state:", error);
  }
}

// Replace a player's card after it was revealed in a challenge
export async function replacePlayerCard(
  gameId: string,
  playerId: string,
  cardIndex: number
) {
  if (!gameId || !playerId) {
    console.error("Missing gameId or playerId in replacePlayerCard");
    return null;
  }

  try {
    console.log(
      `Replacing card at index ${cardIndex} for player ${playerId} in game ${gameId}`
    );

    const playerDocId = `${gameId}_${playerId}`;

    // Get current player cards
    const playerData = await getDoc("players", playerDocId);
    if (!playerData) throw new Error("Player not found");

    // Get game / deck
    const gameData = await getDoc("games", gameId);
    if (!gameData) throw new Error("Game not found");

    // Get player's current cards
    const playerCards = [...((playerData.cards as any[]) || [])];

    // Check if cardIndex is valid
    if (cardIndex < 0 || cardIndex >= playerCards.length) {
      console.error(
        `Invalid card index: ${cardIndex}, player has ${playerCards.length} cards`
      );
      return null;
    }

    const oldCard = playerCards[cardIndex];

    // Preserve old card's position
    const oldPosition =
      oldCard.position || {
        x:
          20 +
          cardIndex *
            (typeof window !== "undefined" && window.innerWidth < 768 ? 25 : 35),
        y: 10,
      };
    const oldRotation = oldCard.rotation || 0;

    let newCard: any;

    // ---------- Deck format 1: __pyramid.deck (array of card indexes) ----------
    if (
      gameData["__pyramid.deck"] &&
      Array.isArray(gameData["__pyramid.deck"])
    ) {
      const newDeck = [...(gameData["__pyramid.deck"] as number[])];

      if (newDeck.length === 0) {
        console.log(
          "No more cards in deck, removing the challenged card without replacement"
        );

        playerCards[cardIndex] = {
          ...oldCard,
          revealed: true,
          revealedAt: new Date().toISOString(),
        };

        await updateDoc("players", playerDocId, {
          cards: playerCards,
          updatedAt: new Date().toISOString(),
          isInChallenge: false,
          inChallenge: false,
          challengeCardIndex: null,
          selectingForChallenge: false,
        });

        await clearPlayerChallengeState(gameId, playerId);
        return null;
      }

      const newCardIndex = newDeck.shift()!;
      const now = new Date().toISOString();

      newCard = {
        i: newCardIndex,
        seen: false,
        newCard: true,
        faceVisible: true,
        replacedAt: now,
        owner: playerId,
        position: oldPosition,
        rotation: oldRotation,
        suit:
          Math.floor(newCardIndex / 13) === 0
            ? "spades"
            : Math.floor(newCardIndex / 13) === 1
              ? "hearts"
              : Math.floor(newCardIndex / 13) === 2
                ? "clubs"
                : "diamonds",
        rank: ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
          newCardIndex % 13
        ],
      };

      await updateDoc("games", gameId, {
        "__pyramid.deck": newDeck,
      });
    }
    // ---------- Deck format 2: deck.cards (array of card objects) ----------
    else if (
      gameData.deck &&
      (gameData.deck as any).cards &&
      Array.isArray((gameData.deck as any).cards)
    ) {
      const deck = { ...(gameData.deck as any) };
      const deckCards = [...deck.cards];

      if (deckCards.length === 0) {
        console.log(
          "No more cards in deck, removing the challenged card without replacement"
        );

        playerCards[cardIndex] = {
          ...oldCard,
          revealed: true,
          revealedAt: new Date().toISOString(),
        };

        await updateDoc("players", playerDocId, {
          cards: playerCards,
          updatedAt: new Date().toISOString(),
          isInChallenge: false,
          inChallenge: false,
          challengeCardIndex: null,
          selectingForChallenge: false,
        });

        await clearPlayerChallengeState(gameId, playerId);
        return null;
      }

      newCard = deckCards.pop();
      const now = new Date().toISOString();

      newCard.owner = playerId;
      newCard.revealed = false;
      newCard.faceVisible = true;
      newCard.newCard = true;
      newCard.replacedAt = now;
      newCard.position = oldPosition;
      newCard.rotation = oldRotation;

      deck.cards = deckCards;

      await updateDoc("games", gameId, {
        deck,
      });
    } else {
      console.error("Cannot find a valid deck in game data");
      await clearPlayerChallengeState(gameId, playerId);
      return null;
    }

    // Replace the card at the specified index
    playerCards[cardIndex] = newCard;

    // Update player cards and clear challenge state
    await updateDoc("players", playerDocId, {
      cards: playerCards,
      updatedAt: new Date().toISOString(),
      isInChallenge: false,
      inChallenge: false,
      challengeCardIndex: null,
      selectingForChallenge: false,
      needsCardReplacement: false,
      cardToReplace: null,
    });

    console.log(
      `Successfully replaced card for player ${playerId} with new card:`,
      newCard
    );

    // Set up timer metadata for auto-hiding the card after 15 seconds
    const hideCardTime = new Date(Date.now() + 15000).toISOString();

    if (newCard && newCard.i !== undefined) {
      await modifyDoc("games", gameId, (current) => {
        const newCardTimers =
          (current.newCardTimers as Record<string, any>) || {};
        const playerTimers = newCardTimers[playerId] || {};
        return {
          ...current,
          newCardTimers: {
            ...newCardTimers,
            [playerId]: {
              ...playerTimers,
              [newCard.i]: hideCardTime,
            },
            timeLeft: 15,
          },
        };
      });
    }

    // Remove from pending replacements & challenge timers (delete fields)
    await modifyDoc("games", gameId, (current) => {
      const updated = { ...current };

      // Remove pendingCardReplacements.{playerId}
      if (updated.pendingCardReplacements) {
        const pending = {
          ...(updated.pendingCardReplacements as Record<string, unknown>),
        };
        delete pending[playerId];
        updated.pendingCardReplacements = pending;
      }

      // Remove challengeTimers.{playerId}
      if (updated.challengeTimers) {
        const timers = {
          ...(updated.challengeTimers as Record<string, unknown>),
        };
        delete timers[playerId];
        updated.challengeTimers = timers;
      }

      return updated;
    });

    return newCard;
  } catch (error) {
    console.error("Error replacing player card:", error);
    return null;
  }
}

// Listen for game state changes (with initial fetch — SSE only fires on changes)
export function subscribeToGameStateDetails(
  gameId: string,
  callback: (gameData: any) => void
) {
  // Fetch current state immediately (Firebase onSnapshot fires on connect, SSE doesn't)
  getDoc("games", gameId).then((data) => {
    if (data) callback(data);
  });

  return subscribeDoc("games", gameId, (data) => {
    if (!data) return;
    callback(data);
  });
}
