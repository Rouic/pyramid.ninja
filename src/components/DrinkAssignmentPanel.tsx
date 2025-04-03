// src/components/DrinkAssignmentPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  DrinkAssignment,
  assignDrinks,
  acceptDrinkAssignment,
  challengeDrinkAssignment,
  resolveDrinkChallenge,
  markCardForReplacement,
} from "../lib/firebase/gameState";
import { doc, getDoc } from "firebase/firestore";
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

  // Keep track of handled challenges to avoid reprocessing them
  const [handledChallenges, setHandledChallenges] = useState<Set<number>>(
    new Set()
  );

  // Use a ref to store the timestamp of when the current challenge was resolved
  const challengeResolvedTimeRef = useRef<number | null>(null);

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
  const challengesToResolve = assignments.filter(
    (a) =>
      a.status === "challenged" &&
      a.from === currentPlayerId &&
      !handledChallenges.has(assignments.indexOf(a))
  );

  // Reset challenge state if we go to a new round (assignments array changes completely)
  useEffect(() => {
    // If assignments array length changes drastically, we likely moved to a new round
    // This is a basic heuristic, might need adjustment
    if (assignments.length === 0) {
      setHandledChallenges(new Set());
      setActiveChallenge(null);
      setChallengeResult(null);
      setProcessingChallenge(false);
      setSelectedCardIndex(null);
      challengeResolvedTimeRef.current = null;

      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
      }

      if (onChallengeCard) {
        onChallengeCard(-1);
      }
    }
  }, [assignments, setIsSelectingForChallenge, onChallengeCard]);

  // Automatically enter selection mode when there are new challenges to resolve
  useEffect(() => {
    // Check if we need to exit challenge mode due to time elapsed since resolution
    const now = Date.now();
    if (
      challengeResolvedTimeRef.current &&
      now - challengeResolvedTimeRef.current > 5000 &&
      processingChallenge
    ) {
      // Reset challenge state after 5 seconds
      setProcessingChallenge(false);
      setChallengeResult(null);
      challengeResolvedTimeRef.current = null;

      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
      }

      if (onChallengeCard) {
        onChallengeCard(-1);
      }

      return;
    }

    // Don't start a new challenge if we're still processing one
    if (challengesToResolve.length > 0 && !processingChallenge) {
      console.log("New challenge to resolve found, entering selection mode");

      // Only auto-enter selection mode if it's a new challenge
      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(true);
      }

      const challengeIndex = assignments.findIndex(
        (a) =>
          a.status === "challenged" &&
          a.from === currentPlayerId &&
          !handledChallenges.has(assignments.indexOf(a))
      );

      setActiveChallenge(challengeIndex);
      setProcessingChallenge(true);
    } else if (
      challengesToResolve.length === 0 &&
      processingChallenge &&
      !challengeResult
    ) {
      // If there are no more challenges and we're not showing a result, exit challenge mode
      setProcessingChallenge(false);

      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
      }
    }
  }, [
    challengesToResolve,
    currentPlayerId,
    assignments,
    setIsSelectingForChallenge,
    processingChallenge,
    challengeResult,
    onChallengeCard,
  ]);

  // Clean up selection mode when component unmounts
  useEffect(() => {
    return () => {
      if (setIsSelectingForChallenge) {
        setIsSelectingForChallenge(false);
      }
    };
  }, [setIsSelectingForChallenge]);

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
    setSelectedCardIndex(cardIndex);
    // Notify parent component to show this specific card
    if (onChallengeCard) {
      onChallengeCard(cardIndex);
    }
  };

  // Used by the person who is being challenged (the assigner of the drink)
  const handleResolveChallenge = async (assignmentIndex: number) => {
    try {
      if (selectedCardIndex === null || assignmentIndex === null) {
        // Require card selection before submission
        return;
      }

      setIsSubmitting(true);

      // Find the current challenge
      const challenge = assignments[assignmentIndex];

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

      if (!playerCards[selectedCardIndex]) {
        console.error("Selected card not found");
        setIsSubmitting(false);
        return;
      }

      // Get the selected card details
      const selectedCard = playerCards[selectedCardIndex];

      // Get the card rank (we need to convert from the numeric index to the actual rank)
      if (selectedCard.i === undefined) {
        console.error("Selected card has no index property");
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
        `Challenge check: Selected card rank is ${actualRank}, claimed ${challenge.cardRank}, match: ${wasSuccessful}`
      );

      // Resolve the challenge in Firebase
      await resolveDrinkChallenge(gameId, assignmentIndex, wasSuccessful);

      // Mark the card for replacement
      await markCardForReplacement(gameId, currentPlayerId, selectedCardIndex);

      // Set challenge result to show appropriate message
      setChallengeResult({
        index: assignmentIndex,
        result: wasSuccessful,
        from: challenge.from,
        to: challenge.to,
      });

      // Add this challenge to the set of handled challenges
      setHandledChallenges((prev) => {
        const newSet = new Set(prev);
        newSet.add(assignmentIndex);
        return newSet;
      });

      // Store the timestamp when we resolved this challenge
      challengeResolvedTimeRef.current = Date.now();

      // Reset the card view after a delay to show the result
      setTimeout(() => {
        if (onChallengeCard) {
          onChallengeCard(-1);
        }

        // Also reset challenge result
        setChallengeResult(null);
        setSelectedCardIndex(null);

        // Check if there are more challenges to resolve
        const remainingChallenges = assignments.filter(
          (a) =>
            a.status === "challenged" &&
            a.from === currentPlayerId &&
            !handledChallenges.has(assignments.indexOf(a))
        );

        if (remainingChallenges.length === 0) {
          // If no more challenges, exit selection mode
          setProcessingChallenge(false);
          challengeResolvedTimeRef.current = null;

          if (setIsSelectingForChallenge) {
            setIsSelectingForChallenge(false);
          }
        } else {
          // If more challenges exist, reset to enter selection mode for the next one
          setProcessingChallenge(false);
        }
      }, 5000); // Show result for 5 seconds

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error resolving challenge:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
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
            className={`font-medium ${
              challengeResult.result
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            } mb-2`}
          >
            Challenge Result
          </h4>
          <p
            className={`text-sm ${
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
        !challengeResult && (
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

            {selectedCardIndex !== null && activeChallenge !== null && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleResolveChallenge(activeChallenge)}
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
