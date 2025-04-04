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
import { HandRaisedIcon } from "@heroicons/react/16/solid";

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
      className="mt-6 pt-5 relative z-10"
      data-component="drink-assignment-panel"
    >
      {/* Balatro-style divider gradient */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-game-neon-purple to-transparent opacity-50"></div>

      {/* Balatro-style header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-game-neon-purple bg-opacity-20 flex items-center justify-center mr-3 border-2 border-game-neon-purple border-opacity-30 shadow-neon-purple">
            <HandRaisedIcon className="h-6 w-6 text-black" />
          </div>
          <h3 className="text-xl font-game-fallback text-game-neon-purple tracking-wide">
            DRINK ASSIGNMENTS
          </h3>
        </div>
        <div className="text-white text-sm bg-black bg-opacity-30 rounded-lg px-3 py-1 border border-white border-opacity-10">
          {relevantAssignments.length} Active
        </div>
      </div>

      {/* Challenge result notification - Balatro style */}
      {challengeResult && (
        <div
          className={`mb-6 p-5 rounded-xl border-4 shadow-xl relative overflow-hidden ${
            challengeResult.result
              ? "border-game-neon-green border-opacity-40 shadow-neon-green"
              : "border-game-neon-red border-opacity-40 shadow-neon-red"
          }`}
        >
          {/* Background glow effect */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: challengeResult.result
                ? "radial-gradient(circle at center, rgba(50, 252, 88, 1), transparent 70%)"
                : "radial-gradient(circle at center, rgba(252, 70, 107, 1), transparent 70%)",
              filter: "blur(20px)",
            }}
          ></div>

          {/* Challenge result header */}
          <div
            className={`flex items-center mb-4 ${
              challengeResult.result
                ? "text-game-neon-green"
                : "text-game-neon-red"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                challengeResult.result
                  ? "bg-game-neon-green bg-opacity-20 border-2 border-game-neon-green border-opacity-40"
                  : "bg-game-neon-red bg-opacity-20 border-2 border-game-neon-red border-opacity-40"
              }`}
            >
              {challengeResult.result ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div>
              <h4 className="font-game-fallback text-2xl tracking-wide">
                {challengeResult.result
                  ? "CHALLENGE SUCCESS!"
                  : "CHALLENGE FAILED!"}
              </h4>
              <div className="text-sm text-gray-300">
                Card will be replaced automatically
              </div>
            </div>
          </div>

          {/* Result message - Balatro style box */}
          <div className="bg-black bg-opacity-40 p-4 rounded-lg border border-white border-opacity-10 text-white mb-3">
            <p className="text-lg font-game-fallback">
              {challengeResult.result
                ? `You showed a ${
                    assignments[challengeResult.index]?.cardRank || "card"
                  }! ${getPlayerName(challengeResult.to)} drinks double (${
                    (assignments[challengeResult.index]?.count || 0) * 2
                  }).`
                : `You didnt have the ${
                    assignments[challengeResult.index]?.cardRank || "card"
                  }! You drink double (${
                    (assignments[challengeResult.index]?.count || 0) * 2
                  }).`}
            </p>
          </div>

          {/* Animation indicator */}
          <div
            className={`text-center ${
              challengeResult.result
                ? "text-game-neon-green"
                : "text-game-neon-red"
            } text-sm font-game-fallback animate-pulse-fast tracking-wide`}
          >
            CHALLENGE COMPLETED
          </div>
        </div>
      )}

      {/* Assign drinks control - Balatro style */}
      {currentCardRank && !isHost && (
        <div className="mb-6 p-5 bg-game-card rounded-xl border-4 border-game-neon-blue border-opacity-30 shadow-lg relative overflow-hidden">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
              backgroundSize: "10px 10px",
            }}
          ></div>

          {/* Header with card icon - Enhanced with suit symbol and color matching */}
          <div className="flex items-center mb-4">
            <div
              className={`w-10 h-14 bg-white rounded-lg overflow-hidden relative mr-3 border-2 border-game-neon-blue shadow-neon-blue transform -rotate-3 ${
                // Determine if it's a red or black card (assuming simple pattern where even ranks are red)
                ["A", "3", "5", "7", "9", "J", "K"].includes(currentCardRank)
                  ? "text-gray-900"
                  : "text-red-600"
              }`}
            >
              {/* Main rank display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{currentCardRank}</span>
              </div>

              {/* Top-left corner suit and rank */}
              <div className="absolute top-0.5 left-0.5 flex flex-col items-center">
                <span className="text-[10px] font-bold leading-none">
                  {currentCardRank}
                </span>
                <span
                  className={`text-[10px] leading-none ${
                    // Determine if it's a red or black card (assuming simple pattern where even ranks are red)
                    ["A", "3", "5", "7", "9", "J", "K"].includes(
                      currentCardRank
                    )
                      ? "text-gray-900"
                      : "text-red-600"
                  }`}
                >
                  {/* Show appropriate suit symbol based on card rank (just example logic) */}
                  {["A", "5", "9", "K"].includes(currentCardRank)
                    ? "♠"
                    : ["2", "6", "10"].includes(currentCardRank)
                    ? "♥"
                    : ["3", "7", "J"].includes(currentCardRank)
                    ? "♣"
                    : "♦"}
                </span>
              </div>

              {/* Bottom-right corner suit and rank (rotated) */}
              <div className="absolute bottom-0.5 right-0.5 flex flex-col items-center transform rotate-180">
                <span className="text-[10px] font-bold leading-none">
                  {currentCardRank}
                </span>
                <span
                  className={`text-[10px] leading-none ${
                    ["A", "3", "5", "7", "9", "J", "K"].includes(
                      currentCardRank
                    )
                      ? "text-gray-900"
                      : "text-red-600"
                  }`}
                >
                  {["A", "5", "9", "K"].includes(currentCardRank)
                    ? "♠"
                    : ["2", "6", "10"].includes(currentCardRank)
                    ? "♥"
                    : ["3", "7", "J"].includes(currentCardRank)
                    ? "♣"
                    : "♦"}
                </span>
              </div>
            </div>
            <h4 className="font-game-fallback text-xl text-game-neon-blue tracking-wide">
              ASSIGN DRINKS FOR {currentCardRank}
            </h4>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 mt-3">
            {/* Select player dropdown - Balatro style */}
            <div className="relative w-full md:w-2/3">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-4 py-3 appearance-none border-4 border-game-neon-blue border-opacity-50 rounded-xl bg-black bg-opacity-40 text-white focus:border-game-neon-blue focus:ring-2 focus:ring-game-neon-blue font-game-fallback text-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                disabled={isSubmitting}
              >
                <option value="">SELECT PLAYER TO DRINK</option>
                {players
                  .filter((p) => p.id !== currentPlayerId)
                  .map((player) => (
                    <option
                      key={player.id}
                      value={player.id}
                      className="bg-black"
                    >
                      {player.name}
                    </option>
                  ))}
              </select>

              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-game-neon-blue"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Select highlight effect */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(50, 135, 252, 0.1), transparent 10%)",
                }}
              ></div>
            </div>

            {/* Assign button - Balatro style */}
            <button
              onClick={handleAssignDrink}
              disabled={!selectedPlayerId || isSubmitting}
              className={`w-full md:w-1/3 py-3 px-4 rounded-xl font-game-fallback text-lg tracking-wide transition-all duration-300 relative overflow-hidden ${
                !selectedPlayerId || isSubmitting
                  ? "bg-gray-700 text-gray-400 border-4 border-gray-600 border-opacity-50 cursor-not-allowed"
                  : "bg-game-neon-blue text-white border-4 border-game-neon-blue border-opacity-50 hover:shadow-neon-blue hover:scale-105 btn-neon"
              }`}
            >
              {/* Button highlight effect */}
              {!isSubmitting && selectedPlayerId && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent 70%)",
                  }}
                ></div>
              )}

              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  ASSIGNING...
                </span>
              ) : (
                `ASSIGN ${drinkCount} DRINK${drinkCount !== 1 ? "S" : ""}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Challenge notification - Balatro style */}
      {challengesToResolve.length > 0 &&
        processingChallenge &&
        !challengeResult &&
        !isSubmitting && (
          <div className="mb-6 p-5 bg-game-card rounded-xl border-4 border-game-neon-yellow border-opacity-40 shadow-neon-yellow relative overflow-hidden">
            {/* Background glow effect */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255, 204, 0, 1), transparent 70%)",
                filter: "blur(20px)",
              }}
            ></div>

            {/* Alert header */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-game-neon-yellow bg-opacity-20 border-2 border-game-neon-yellow border-opacity-40 flex items-center justify-center mr-4 animate-pulse-fast">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-game-neon-yellow"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-game-fallback text-2xl text-game-neon-yellow tracking-wide">
                  YOU&apos;VE BEEN CHALLENGED!
                </h4>
                <div className="text-sm text-white">
                  Select a card from your hand to show
                </div>
              </div>
            </div>

            {/* Challenge details - Balatro style box */}
            <div className="bg-black bg-opacity-40 p-4 rounded-lg border border-white border-opacity-10 text-white mb-4">
              <p className="text-lg">
                {activeChallenge !== null && assignments[activeChallenge]
                  ? `${getPlayerName(
                      assignments[activeChallenge].to
                    )} is challenging your claim about having a ${
                      assignments[activeChallenge].cardRank
                    }. Please select the card to reveal.`
                  : "You're being challenged. Please select a card to reveal."}
              </p>
            </div>

            {/* Show confirmation button if card selected */}
            {selectedCardIndex !== null && activeChallenge !== null && (
              <div className="flex justify-center">
                <button
                  data-action="confirm-challenge"
                  onClick={() => handleResolveChallenge(activeChallenge)}
                  disabled={isSubmitting}
                  className={`py-3 px-6 rounded-xl font-game-fallback tracking-wide text-lg relative overflow-hidden ${
                    isSubmitting
                      ? "bg-gray-700 text-gray-400 border-4 border-gray-600 border-opacity-50 cursor-not-allowed"
                      : "bg-game-neon-green text-black border-4 border-game-neon-green border-opacity-50 hover:shadow-neon-green hover:scale-105 transition-all duration-300 btn-neon"
                  }`}
                >
                  {/* Button highlight effect */}
                  {!isSubmitting && (
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent 70%)",
                      }}
                    ></div>
                  )}

                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      PROCESSING...
                    </span>
                  ) : (
                    `CONFIRM & SHOW CARD #${selectedCardIndex + 1}`
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      {/* List of active drink assignments - Balatro style */}
      {relevantAssignments.length > 0 ? (
        <div className="space-y-4">
          {relevantAssignments.map((assignment, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl relative overflow-hidden ${
                assignment.status === "challenged"
                  ? "border-4 border-game-neon-yellow border-opacity-30 shadow-neon-yellow"
                  : "border-4 border-white border-opacity-10 shadow-lg"
              }`}
              style={{
                background:
                  assignment.status === "challenged"
                    ? "linear-gradient(to right, rgba(255, 204, 0, 0.1), rgba(0, 0, 0, 0.3))"
                    : "linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(30, 14, 96, 0.4))",
              }}
            >
              {/* Card pattern background */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>

              <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex-1">
                  {/* Assignment icons and info */}
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-game-card flex items-center justify-center mr-2 border border-white border-opacity-20">
                      <span className="text-white text-xs font-bold">
                        {assignment.cardRank}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-game-fallback text-white mr-2">
                          {getPlayerName(assignment.from)}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-game-neon-blue mx-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-game-fallback text-white">
                          {getPlayerName(assignment.to)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {assignment.count} drink
                        {assignment.count !== 1 ? "s" : ""} •{" "}
                        {assignment.cardRank} card
                      </div>
                    </div>
                  </div>

                  {/* Challenge status indicator */}
                  {assignment.status === "challenged" && (
                    <div className="bg-black bg-opacity-40 rounded-lg px-3 py-2 border border-game-neon-yellow border-opacity-30 mt-2">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-game-neon-yellow mr-2 animate-pulse-fast"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-game-neon-yellow font-game-fallback text-sm tracking-wide">
                          CHALLENGE IN PROGRESS
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {assignment.to === currentPlayerId &&
                  assignment.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptDrink(index)}
                        disabled={isSubmitting}
                        className={`py-2 px-4 rounded-lg font-game-fallback text-sm tracking-wide flex-1 transition-all duration-300 ${
                          isSubmitting
                            ? "bg-gray-700 text-gray-400 border-2 border-gray-600 border-opacity-50 cursor-not-allowed"
                            : "bg-game-neon-green text-black border-2 border-game-neon-green border-opacity-40 hover:shadow-neon-green hover:scale-105"
                        }`}
                      >
                        {isSubmitting ? "..." : "DRINK"}
                      </button>
                      <button
                        onClick={() => handleChallengeClick(index)}
                        disabled={isSubmitting}
                        className={`py-2 px-4 rounded-lg font-game-fallback text-sm tracking-wide flex-1 transition-all duration-300 ${
                          isSubmitting
                            ? "bg-gray-700 text-gray-400 border-2 border-gray-600 border-opacity-50 cursor-not-allowed"
                            : "bg-game-neon-red text-white border-2 border-game-neon-red border-opacity-40 hover:shadow-neon-red hover:scale-105"
                        }`}
                      >
                        {isSubmitting ? "..." : "CHALLENGE"}
                      </button>
                    </div>
                  )}

                {/* Status indicator for host */}
                {isHost && assignment.status === "challenged" && (
                  <div className="bg-black bg-opacity-30 rounded-lg px-3 py-2 border border-game-neon-yellow border-opacity-30 text-sm font-medium text-game-neon-yellow">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-game-neon-yellow border-t-transparent mr-2"></div>
                      <span className="font-game-fallback">
                        RESOLVING CHALLENGE...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-center py-10 bg-black bg-opacity-30 rounded-xl border-2 border-white border-opacity-5 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-500 mb-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
            </svg>
            <p className="font-game-fallback text-xl text-white mb-1">
              NO ACTIVE ASSIGNMENTS
            </p>
            <p className="text-gray-500">
              Match pyramid cards to assign drinks
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrinkAssignmentPanel;
