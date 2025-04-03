// src/components/DrinkAssignmentPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  DrinkAssignment,
  assignDrinks,
  acceptDrinkAssignment,
  challengeDrinkAssignment,
  resolveDrinkChallenge,
  markCardForReplacement,
  clearPlayerChallengeState,
} from "../lib/firebase/gameState";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";

interface DrinkAssignmentPanelProps {
  gameId: string;
  assignments: DrinkAssignment[];
  players: any[];
  currentPlayerId: string;
  isHost: boolean;
  currentCardRank?: string;
  drinkCount: number;
  onChallengeCard?: (cardIndex: number) => void; // Callback for card challenges
  setIsSelectingForChallenge?: (selecting: boolean) => void; // Callback to indicate card selection mode
  isSelectingForChallenge?: boolean; // Add this to props
}

const DrinkAssignmentPanel: React.FC<DrinkAssignmentPanelProps> = ({
  gameId,
  assignments,
  players,
  currentPlayerId,
  isHost,
  currentCardRank,
  drinkCount,
  onChallengeCard,
  setIsSelectingForChallenge,
  isSelectingForChallenge = false, // Default value
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [activeChallenge, setActiveChallenge] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingChallenge, setProcessingChallenge] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{
    index: number;
    result: boolean;
    from: string;
    to: string;
  } | null>(null);

  // Track local selection mode state to avoid TypeScript errors
  const [localSelectionMode, setLocalSelectionMode] = useState<boolean>(
    isSelectingForChallenge
  );

  // Keep track of handled challenges to avoid reprocessing them
  const [handledChallenges, setHandledChallenges] = useState<Set<number>>(
    new Set()
  );

  // Use a ref to store the timestamp of when the current challenge was resolved
  const challengeResolvedTimeRef = useRef<number | null>(null);

  // Also store the challenge resolution timer
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're in the post-challenge cleanup phase
  const [cleaningUpChallenge, setCleaningUpChallenge] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectionMode(isSelectingForChallenge);
  }, [isSelectingForChallenge]);

  // Filter assignments to show only the relevant ones
  // First, get all pending or challenged assignments
  const allActiveAssignments = assignments.filter(
    (a) => a.status === "pending" || a.status === "challenged"
  );

  // Assignments where current player is involved
  const relevantAssignments = allActiveAssignments.filter(
    (a) => a.to === currentPlayerId || a.from === currentPlayerId || isHost
  );

  // Assignments that need the current player to resolve a challenge
  // CRITICAL FIX: This should only include assignments where current player is the assigner (from)
  // since they're the one who needs to select a card when challenged
  const challengesToResolve = assignments.filter(
    (a) =>
      a.status === "challenged" &&
      a.from === currentPlayerId &&
      !handledChallenges.has(assignments.indexOf(a))
  );

  // Reset challenge state if we go to a new round (assignments array changes completely)
  useEffect(() => {
    // If assignments array length changes drastically, we likely moved to a new round
    if (assignments.length === 0) {
      setHandledChallenges(new Set());
      setActiveChallenge(null);
      setChallengeResult(null);
      setProcessingChallenge(false);
      setSelectedCardIndex(null);
      challengeResolvedTimeRef.current = null;

      // Clear any existing timers
      if (challengeTimerRef.current) {
        clearTimeout(challengeTimerRef.current);
        challengeTimerRef.current = null;
      }

      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
        setLocalSelectionMode(false);
      }

      if (onChallengeCard) {
        onChallengeCard(-1);
      }

      // Explicitly clear challenge state in Firebase
      if (gameId && currentPlayerId) {
        console.log("Clearing challenge state on assignments reset");
        clearPlayerChallengeState(gameId, currentPlayerId).catch((err) =>
          console.error("Error clearing challenge state on reset:", err)
        );
      }
    }
  }, [
    assignments,
    setIsSelectingForChallenge,
    onChallengeCard,
    gameId,
    currentPlayerId,
  ]);

  // Automatically enter selection mode when there are new challenges to resolve
  useEffect(() => {
    // Only run this effect when assignments change, not on every state change
    // This prevents infinite cycles of state updates

    // CRITICAL FIX: The person who ASSIGNED the drink (from) is the one
    // who needs to select a card to show when challenged
    const challengedAssignmentsFromMe = assignments.filter(
      (a) => a.status === "challenged" && a.from === currentPlayerId
    );

    // DEBUG: Log only on actual changes, not every render
    const hasActiveChallenge = activeChallenge !== null;
    const isCurrentlyProcessing = processingChallenge;

    if (!isCurrentlyProcessing && challengedAssignmentsFromMe.length > 0) {
      console.log(
        "🔄 CHALLENGE FLOW: I was challenged and need to select a card to show"
      );

      // Find the first challenge that needs resolution
      const challengeIndex = assignments.findIndex(
        (a) => a.status === "challenged" && a.from === currentPlayerId
      );

      if (challengeIndex !== -1 && !hasActiveChallenge) {
        // Force UI into selection mode - IMPORTANT: Only call these if the state
        // actually needs to change to prevent infinite update cycles
        if (setIsSelectingForChallenge && !localSelectionMode) {
          setIsSelectingForChallenge(true);
          setLocalSelectionMode(true);
        }

        setActiveChallenge(challengeIndex);
        setProcessingChallenge(true);
      }
    } else if (
      isCurrentlyProcessing &&
      challengedAssignmentsFromMe.length === 0 &&
      !challengeResult &&
      !cleaningUpChallenge &&
      !isSubmitting
    ) {
      console.log(
        "🔄 CHALLENGE FLOW: No more pending challenges, exiting selection mode"
      );

      // Exit challenge mode - only if currently in challenge mode
      setProcessingChallenge(false);
      setActiveChallenge(null);

      if (setIsSelectingForChallenge && localSelectionMode) {
        setIsSelectingForChallenge(false);
        setLocalSelectionMode(false);
      }

      if (onChallengeCard) {
        onChallengeCard(-1);
      }
    }

    // We still need a timeout to automatically clear challenge state if it gets stuck,
    // but we'll use a ref to track time instead of re-running the effect
    if (challengeResolvedTimeRef.current) {
      const now = Date.now();
      const elapsed = now - challengeResolvedTimeRef.current;

      if (elapsed > 5000 && processingChallenge && !cleaningUpChallenge) {
        console.log(
          "🔄 CHALLENGE FLOW: Auto-timeout, forcing exit from challenge mode"
        );

        // Reset all local UI state
        setProcessingChallenge(false);
        setChallengeResult(null);
        challengeResolvedTimeRef.current = null;
        setActiveChallenge(null);
        setSelectedCardIndex(null);
        setCleaningUpChallenge(false);

        if (setIsSelectingForChallenge && localSelectionMode) {
          setIsSelectingForChallenge(false);
          setLocalSelectionMode(false);
        }

        if (onChallengeCard) {
          onChallengeCard(-1);
        }
      }
    }
    // IMPORTANT: Update dependency array to include necessary values but avoid causing infinite loops
  }, [
    assignments,
    currentPlayerId,
    activeChallenge,
    processingChallenge,
    localSelectionMode,
    challengeResult,
    cleaningUpChallenge,
    isSubmitting,
    setIsSelectingForChallenge,
    onChallengeCard,
  ]);

  // Clean up selection mode when component unmounts
  useEffect(() => {
    return () => {
      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
      }

      // Clear any timers
      if (challengeTimerRef.current) {
        clearTimeout(challengeTimerRef.current);
      }

      // Make sure we clear challenge state in Firebase when unmounting
      if (gameId && currentPlayerId) {
        clearPlayerChallengeState(gameId, currentPlayerId).catch((err) =>
          console.error("Error clearing challenge state on unmount:", err)
        );
      }
    };
  }, [setIsSelectingForChallenge, gameId, currentPlayerId]);

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : "Unknown Player";
  };

  const handleAssignDrink = async () => {
    if (!selectedPlayerId || !currentCardRank) return;

    try {
      setIsSubmitting(true);
      await assignDrinks(
        gameId,
        currentPlayerId,
        selectedPlayerId,
        "", // We don't know the specific card ID
        currentCardRank,
        drinkCount
      );

      setSelectedPlayerId("");
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error assigning drinks:", error);
      setIsSubmitting(false);
    }
  };

  const handleAcceptDrink = async (assignmentIndex: number) => {
    try {
      setIsSubmitting(true);
      await acceptDrinkAssignment(gameId, assignmentIndex);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error accepting drink:", error);
      setIsSubmitting(false);
    }
  };

  const handleChallengeClick = async (assignmentIndex: number) => {
    try {
      setIsSubmitting(true);
      await challengeDrinkAssignment(gameId, assignmentIndex);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error challenging drink:", error);
      setIsSubmitting(false);
    }
  };

  // Used by the person who is being challenged (the assigner of the drink)
 const handleSelectCardForChallenge = (cardIndex: number) => {
   console.log("🎮 CHALLENGE FLOW: Card selected for challenge:", cardIndex);

   // Notify parent component to show this specific card
   if (onChallengeCard) {
     onChallengeCard(cardIndex);
   }

   // IMPORTANT: Set the selected card index AFTER calling onChallengeCard
   // This ensures the card is visible when the auto-resolve useEffect runs
   setSelectedCardIndex(cardIndex);

   // CRITICAL FIX: Directly trigger resolution if we have an active challenge
   // This ensures the challenge is resolved even if the useEffect doesn't trigger
   if (activeChallenge !== null) {
     console.log("🎮 CHALLENGE FLOW: Directly triggering challenge resolution");
     // Use a short timeout to allow the card to be shown first
     setTimeout(() => {
       try {
         handleResolveChallenge(activeChallenge);
       } catch (err) {
         console.error("Error in direct resolution:", err);
       }
     }, 1000);
   }
 };

  // Auto-resolve the challenge when a card is selected
  useEffect(() => {
    if (!selectedCardIndex || selectedCardIndex === null) {
      return; // Exit early if no card selected
    }

    if (activeChallenge !== null && !isSubmitting && processingChallenge) {
      console.log(
        "🎮 CHALLENGE FLOW: Auto-resolving challenge with selected card",
        selectedCardIndex
      );
      console.log("Active challenge:", activeChallenge);
      console.log("Processing challenge:", processingChallenge);
      console.log("Is submitting:", isSubmitting);

      // Use a short timeout to allow the card to be shown first
      const timer = setTimeout(() => {
        try {
          console.log("🎮 CHALLENGE FLOW: Executing auto-resolution");
          handleResolveChallenge(activeChallenge);
        } catch (err) {
          console.error("Error in auto-resolution:", err);
        }
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      console.log("🎮 Auto-resolution conditions not met:", {
        selectedCardIndex,
        activeChallenge,
        isSubmitting,
        processingChallenge,
      });
    }
  }, [selectedCardIndex, activeChallenge, isSubmitting, processingChallenge]);

  // Used by the person who is being challenged (the assigner of the drink)
  const handleResolveChallenge = async (assignmentIndex: number) => {
    try {
      console.log(
        "🎮 CHALLENGE FLOW: handleResolveChallenge called with index",
        assignmentIndex
      );

      if (selectedCardIndex === null) {
        console.error("Cannot resolve challenge: No card selected");
        return;
      }

      // Double-check that the assignment exists
      if (!assignments[assignmentIndex]) {
        console.error(
          "Cannot resolve challenge: Invalid assignment index",
          assignmentIndex
        );
        return;
      }

      // Double-check the assignment is still in challenged status
      if (assignments[assignmentIndex].status !== "challenged") {
        console.log(
          "Challenge already resolved. Status:",
          assignments[assignmentIndex].status
        );
        return;
      }

      // Save a reference to the selected card index before we do anything else
      const cardToReveal = selectedCardIndex;

      console.log("🎮 CHALLENGE FLOW: Starting challenge resolution process");
      console.log("Selected card index:", cardToReveal);
      console.log("Assignment index:", assignmentIndex);

      // IMPORTANT: First disable challenges UI immediately
      // Set state variables in a very specific order to ensure consistent UI
      setIsSubmitting(true);
      setProcessingChallenge(false);
      setActiveChallenge(null);

      // First make sure we've shown the card by calling the parent handler
      console.log("🎮 CHALLENGE FLOW: Showing card", cardToReveal);
      if (onChallengeCard) {
        onChallengeCard(cardToReveal);
      }

      // Find the current challenge
      const challenge = assignments[assignmentIndex];

      // Find player name (for better logging)
      const fromPlayerName = getPlayerName(challenge.from);
      const toPlayerName = getPlayerName(challenge.to);

      console.log(
        `🎮 CHALLENGE FLOW: ${fromPlayerName} is showing a card to ${toPlayerName}`
      );

      // Find the player's cards
      const playerRef = doc(db, "games", gameId, "players", currentPlayerId);
      const playerDoc = await getDoc(playerRef);

      if (!playerDoc.exists()) {
        console.error("Player document not found");
        setIsSubmitting(false);
        return;
      }

      const playerData = playerDoc.data();
      const playerCards = playerData.cards || [];

      console.log("Player has", playerCards.length, "cards");
      console.log("Selected card index:", cardToReveal);
      console.log("Card at index:", playerCards[cardToReveal]);

      if (!playerCards[cardToReveal]) {
        console.error("Selected card not found at index", cardToReveal);
        console.log("Available cards:", playerCards);
        setIsSubmitting(false);
        return;
      }

      // Get the selected card details
      const selectedCard = playerCards[cardToReveal];
      console.log("Selected card:", selectedCard);

      // Get the card rank (we need to convert from the numeric index to the actual rank)
      if (selectedCard.i === undefined) {
        console.error("Selected card has no index property");
        console.log("Card data:", selectedCard);
        setIsSubmitting(false);
        return;
      }

      const suit = Math.floor(selectedCard.i / 13);
      const rankValue = selectedCard.i % 13;

      // Convert rank value to actual rank
      const ranks = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      const actualRank = ranks[rankValue];

      // Check if the card matches the claimed rank
      const wasSuccessful = actualRank === challenge.cardRank;

      console.log(
        `🎮 CHALLENGE RESULT: Card is ${actualRank}, claimed ${
          challenge.cardRank
        }, match: ${wasSuccessful ? "YES ✅" : "NO ❌"}`
      );

      // Store the timestamp when we resolved this challenge
      challengeResolvedTimeRef.current = Date.now();

      // STEP 1: CRITICAL FIX - Set challenge result in local state immediately
      // This ensures the UI updates right away with the result
      setChallengeResult({
        index: assignmentIndex,
        result: wasSuccessful,
        from: challenge.from,
        to: challenge.to,
      });

      // STEP 2: Aggressive update of the assignment status first
      try {
        console.log("🎮 CHALLENGE FLOW: Updating assignment status");
        const gameRef = doc(db, "games", gameId);
        const gameDoc = await getDoc(gameRef);

        if (gameDoc.exists()) {
          const gameData = gameDoc.data();
          const currentAssignments = [...(gameData.drinkAssignments || [])];

          if (currentAssignments[assignmentIndex]) {
            // Update ONLY this assignment's status
            currentAssignments[assignmentIndex] = {
              ...currentAssignments[assignmentIndex],
              status: wasSuccessful
                ? "successful_challenge"
                : "failed_challenge",
              resolvedAt: Date.now(),
              isResolved: true,
            };

            // Update JUST the assignments first
            await updateDoc(gameRef, {
              drinkAssignments: currentAssignments,
            });

            console.log("🎮 Assignment status updated successfully");
          }
        }
      } catch (updateError) {
        console.error("Error updating assignment status:", updateError);
      }

      // STEP 3: Mark card for replacement immediately
      try {
        console.log(
          `🎮 CHALLENGE FLOW: Marking card ${cardToReveal} for replacement`
        );
        await markCardForReplacement(gameId, currentPlayerId, cardToReveal);
      } catch (markError) {
        console.error("Error marking card for replacement:", markError);
      }

      // STEP 4: Call resolveDrinkChallenge to handle drink assignment logic
      try {
        console.log("🎮 CHALLENGE FLOW: Calling resolveDrinkChallenge");
        await resolveDrinkChallenge(gameId, assignmentIndex, wasSuccessful);
        console.log("🎮 Drink challenge resolved successfully");
      } catch (resolveError) {
        console.error("Error resolving drink challenge:", resolveError);
      }

      // STEP 5: Exit selection mode
      if (setIsSelectingForChallenge) {
        console.log("🎮 CHALLENGE FLOW: Exiting selection mode");
        setIsSelectingForChallenge(false);
        setLocalSelectionMode(false);
      }

      // STEP 6: Update player state to trigger card replacement
      try {
        console.log(
          `🎮 CHALLENGE FLOW: Setting player state for card replacement`
        );
        await updateDoc(playerRef, {
          needsCardReplacement: true,
          cardToReplace: cardToReveal,
          isInChallenge: false,
          inChallenge: false,
          challengeCardIndex: null,
          selectingForChallenge: false,
          challengeComplete: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (playerUpdateError) {
        console.error("Error updating player state:", playerUpdateError);
      }

      // STEP 7: Add this challenge to handled set
      setHandledChallenges(
        (prev) => new Set([...Array.from(prev), assignmentIndex])
      );

      console.log("🎮 CHALLENGE FLOW: Challenge resolution complete!");

      // STEP 8: Wait a moment to let user see the card and result
      setTimeout(() => {
        // Hide the card after a delay
        if (onChallengeCard) {
          console.log("🎮 CHALLENGE FLOW: Hiding card after showing result");
          onChallengeCard(-1);
        }

        // Then after another short delay, clean up
        setTimeout(() => {
          console.log("🎮 CHALLENGE FLOW: Final cleanup");
          setSelectedCardIndex(null);
          setActiveChallenge(null);
          setCleaningUpChallenge(false);
          setIsSubmitting(false);
        }, 2000);
      }, 3000);
    } catch (error) {
      console.error("❌ CHALLENGE ERROR:", error);
      setIsSubmitting(false);

      // Extra aggressive error recovery
      setProcessingChallenge(false);
      setActiveChallenge(null);
      setChallengeResult(null);
      setSelectedCardIndex(null);
      setCleaningUpChallenge(false);

      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
        setLocalSelectionMode(false);
      }
      if (onChallengeCard) {
        onChallengeCard(-1);
      }

      // Force clear Firebase state
      clearPlayerChallengeState(gameId, currentPlayerId);
    }
  };

  useEffect(() => {
    // Handler for auto-submit events - this directly triggers challenge resolution
    const handleAutoSubmit = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(
        "🚀 AUTO-SUBMIT: Received event with data:",
        customEvent.detail
      );

      // Make sure we have an active challenge to resolve
      if (activeChallenge === null && challengesToResolve.length > 0) {
        // If we don't have an active challenge but there are challenges to resolve,
        // set the active challenge to the first one
        const challengeIndex = assignments.findIndex(
          (a) => a.status === "challenged" && a.from === currentPlayerId
        );

        if (challengeIndex !== -1) {
          console.log(
            "🚀 AUTO-SUBMIT: Setting active challenge to",
            challengeIndex
          );
          setActiveChallenge(challengeIndex);

          // Now directly handle resolution with this index
          if (
            customEvent.detail &&
            customEvent.detail.cardIndex !== undefined
          ) {
            const cardIndex = customEvent.detail.cardIndex;
            console.log("🚀 AUTO-SUBMIT: Selected card index is", cardIndex);

            // Set the selected card index if needed
            if (selectedCardIndex !== cardIndex) {
              setSelectedCardIndex(cardIndex);
            }

            // Give a moment for state to update, then resolve
            setTimeout(() => {
              console.log(
                "🚀 AUTO-SUBMIT: Directly resolving challenge",
                challengeIndex
              );
              handleResolveChallenge(challengeIndex);
            }, 500);
          }
        } else {
          console.log("🚀 AUTO-SUBMIT: No valid challenge found to resolve");
        }
      }
      // If we already have an active challenge, just resolve it
      else if (activeChallenge !== null) {
        if (customEvent.detail && customEvent.detail.cardIndex !== undefined) {
          const cardIndex = customEvent.detail.cardIndex;
          console.log("🚀 AUTO-SUBMIT: Selected card index is", cardIndex);

          // Set the selected card index if needed
          if (selectedCardIndex !== cardIndex) {
            setSelectedCardIndex(cardIndex);
          }

          // Give a moment for state to update, then resolve
          setTimeout(() => {
            console.log(
              "🚀 AUTO-SUBMIT: Directly resolving active challenge",
              activeChallenge
            );
            handleResolveChallenge(activeChallenge);
          }, 500);
        }
      } else {
        console.log("🚀 AUTO-SUBMIT: No active challenge to resolve");
        console.log("Active challenge:", activeChallenge);
        console.log("Challenges to resolve:", challengesToResolve);
      }
    };

    // Add the event listener
    document.addEventListener("challenge:autoSubmit", handleAutoSubmit);

    // Cleanup
    return () => {
      document.removeEventListener("challenge:autoSubmit", handleAutoSubmit);
    };
  }, [
    activeChallenge,
    challengesToResolve,
    assignments,
    currentPlayerId,
    selectedCardIndex,
  ]);

  return (
    <div
      className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
      data-component="drink-assignment-panel"
    >
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
        Drink Assignments
      </h3>

      {/* Challenge result notification */}
      {challengeResult && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            challengeResult.result
              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
          }`}
        >
          <h4
            className={`font-medium text-lg ${
              challengeResult.result
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            } mb-2`}
          >
            Challenge Result
          </h4>
          <p
            className={`text-md font-bold ${
              challengeResult.result
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {challengeResult.result
              ? `You showed a ${
                  assignments[challengeResult.index]?.cardRank || "card"
                }! ${getPlayerName(challengeResult.to)} drinks double (${
                  (assignments[challengeResult.index]?.count || 0) * 2
                }).`
              : `You didn't have the ${
                  assignments[challengeResult.index]?.cardRank || "card"
                }! You drink double (${
                  (assignments[challengeResult.index]?.count || 0) * 2
                }).`}
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            Your card has been marked for replacement. Check your hand to get a
            new card.
          </p>
          <p className="text-xs mt-2 text-blue-500 animate-pulse">
            Challenge completed! Game will continue automatically...
          </p>
        </div>
      )}

      {/* Assign drinks control - only shown to players during gameplay with a current card */}
      {currentCardRank && !isHost && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">
            Assign drinks for {currentCardRank}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isSubmitting}
            >
              <option value="">Select player</option>
              {players
                .filter((p) => p.id !== currentPlayerId)
                .map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
            </select>

            <button
              onClick={handleAssignDrink}
              disabled={!selectedPlayerId || isSubmitting}
              className={`px-4 py-2 rounded-lg ${
                !selectedPlayerId || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Assigning...
                </span>
              ) : (
                `Assign ${drinkCount} Drink${drinkCount !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Card selection notification for the person being challenged (drink assigner) */}
      {challengesToResolve.length > 0 &&
        processingChallenge &&
        !challengeResult &&
        !isSubmitting && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              You've been challenged!
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              {activeChallenge !== null && assignments[activeChallenge]
                ? `${getPlayerName(
                    assignments[activeChallenge].to
                  )} is challenging your claim
               about having a ${
                 assignments[activeChallenge].cardRank
               }. Please select the
               card to reveal.`
                : "You're being challenged. Please select a card to reveal."}
            </p>

            {/* Show this button if we've actually selected a card */}
            {selectedCardIndex !== null && activeChallenge !== null && (
              <div className="mt-4 flex gap-2">
                <button
                  data-action="confirm-challenge"
                  onClick={() => {
                    // Call the handler to resolve the challenge
                    handleResolveChallenge(activeChallenge);
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg ${
                    isSubmitting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Confirm & Show Card #${selectedCardIndex + 1}`
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      {/* List of active drink assignments */}
      {relevantAssignments.length > 0 ? (
        <div className="space-y-3">
          {relevantAssignments.map((assignment, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                assignment.status === "challenged"
                  ? "bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800"
                  : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {getPlayerName(assignment.from)} →{" "}
                    {getPlayerName(assignment.to)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Card: {assignment.cardRank} | {assignment.count} drink
                    {assignment.count !== 1 ? "s" : ""}
                  </div>
                  {assignment.status === "challenged" && (
                    <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">
                      Challenge in progress!
                    </div>
                  )}
                </div>

                {/* Buttons for drink recipient to accept or challenge */}
                {assignment.to === currentPlayerId &&
                  assignment.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptDrink(index)}
                        disabled={isSubmitting}
                        className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                          isSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {isSubmitting ? "..." : "Drink"}
                      </button>
                      <button
                        onClick={() => handleChallengeClick(index)}
                        disabled={isSubmitting}
                        className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                          isSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {isSubmitting ? "..." : "Challenge"}
                      </button>
                    </div>
                  )}

                {/* Status indicator for host */}
                {isHost && assignment.status === "challenged" && (
                  <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Resolving challenge...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          No active drink assignments yet
        </div>
      )}
    </div>
  );
};

export default DrinkAssignmentPanel;
