// src/components/DrinkAssignmentPanel.tsx
import React, { useState } from "react";
import {
  DrinkAssignment,
  assignDrinks,
  acceptDrinkAssignment,
  challengeDrinkAssignment,
  resolveDrinkChallenge,
  replacePlayerCard,
} from "../lib/firebase/gameState";

interface DrinkAssignmentPanelProps {
  gameId: string;
  assignments: DrinkAssignment[];
  players: any[];
  currentPlayerId: string;
  isHost: boolean;
  currentCardRank?: string;
  drinkCount: number;
  onChallengeCard?: (cardIndex: number) => void; // Callback for card challenges
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
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [showingCardSelection, setShowingCardSelection] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [activeChallenge, setActiveChallenge] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    (a) => a.status === "challenged" && a.from === currentPlayerId
  );

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
  const handleResolveChallenge = async (
    assignmentIndex: number,
    wasSuccessful: boolean
  ) => {
    try {
      setIsSubmitting(true);
      await resolveDrinkChallenge(gameId, assignmentIndex, wasSuccessful);

      // If the challenge was successful, we need to replace the card
      // This means the person who assigned the drink actually had the card
      if (wasSuccessful && selectedCardIndex !== null) {
        await replacePlayerCard(
          gameId,
          assignments[assignmentIndex].from, // The player who assigned the drink
          selectedCardIndex
        );
      }

      setActiveChallenge(null);
      setSelectedCardIndex(null);
      setShowingCardSelection(false);
      // Reset the card view
      if (onChallengeCard) {
        onChallengeCard(-1);
      }
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

      {/* Card selection interface for the person being challenged (drink assigner) */}
      {challengesToResolve.length > 0 && activeChallenge === null && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            You've been challenged!
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            {getPlayerName(challengesToResolve[0].to)} is challenging your claim
            about having a {challengesToResolve[0].cardRank}. Select your card
            that has {challengesToResolve[0].cardRank} or admit that you were
            bluffing.
          </p>

          <button
            onClick={() =>
              setActiveChallenge(
                assignments.findIndex(
                  (a) => a.status === "challenged" && a.from === currentPlayerId
                )
              )
            }
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
          >
            Select My Card
          </button>
        </div>
      )}

      {/* Card selection interface once the challenged player has decided to respond */}
      {activeChallenge !== null && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">
            Select your card that has {assignments[activeChallenge].cardRank}
          </h4>
          <div className="mt-2">
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => handleSelectCardForChallenge(index)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${
                    selectedCardIndex === index
                      ? "bg-yellow-500 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                  }`}
                  disabled={isSubmitting}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleResolveChallenge(activeChallenge, true)}
                disabled={selectedCardIndex === null || isSubmitting}
                className={`px-4 py-2 rounded-lg ${
                  selectedCardIndex === null || isSubmitting
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
                  `I have it! (Card ${
                    selectedCardIndex !== null ? selectedCardIndex + 1 : ""
                  })`
                )}
              </button>

              <button
                onClick={() => handleResolveChallenge(activeChallenge, false)}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-lg ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isSubmitting ? "Processing..." : "I was bluffing..."}
              </button>
            </div>
          </div>
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
