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
}

const DrinkAssignmentPanel: React.FC<DrinkAssignmentPanelProps> = ({
  gameId,
  assignments,
  players,
  currentPlayerId,
  isHost,
  currentCardRank,
  drinkCount,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [showingCardSelection, setShowingCardSelection] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [activeChallenge, setActiveChallenge] = useState<number | null>(null);

  // Filtered assignments that are relevant to the current user
  const relevantAssignments = assignments
    .filter((a) => a.status === "pending" || a.status === "challenged")
    .filter(
      (a) => a.to === currentPlayerId || a.from === currentPlayerId || isHost
    );

  const pendingChallenges = assignments.filter(
    (a) => a.status === "challenged" && a.from === currentPlayerId
  );

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : "Unknown Player";
  };

  const handleAssignDrink = async () => {
    if (!selectedPlayerId || !currentCardRank) return;

    try {
      await assignDrinks(
        gameId,
        currentPlayerId,
        selectedPlayerId,
        "", // We don't know the specific card ID
        currentCardRank,
        drinkCount
      );

      setSelectedPlayerId("");
    } catch (error) {
      console.error("Error assigning drinks:", error);
    }
  };

  const handleAcceptDrink = async (assignmentIndex: number) => {
    try {
      await acceptDrinkAssignment(gameId, assignmentIndex);
    } catch (error) {
      console.error("Error accepting drink:", error);
    }
  };

  const handleChallengeClick = async (assignmentIndex: number) => {
    try {
      await challengeDrinkAssignment(gameId, assignmentIndex);
      setActiveChallenge(assignmentIndex);
    } catch (error) {
      console.error("Error challenging drink:", error);
    }
  };

  const handleResolveChallenge = async (
    assignmentIndex: number,
    wasSuccessful: boolean
  ) => {
    try {
      await resolveDrinkChallenge(gameId, assignmentIndex, wasSuccessful);

      // If the challenge was successful, we need to replace the card
      if (wasSuccessful) {
        if (selectedCardIndex !== null) {
          await replacePlayerCard(
            gameId,
            assignments[assignmentIndex].from,
            selectedCardIndex
          );
        }
      }

      setActiveChallenge(null);
      setSelectedCardIndex(null);
      setShowingCardSelection(false);
    } catch (error) {
      console.error("Error resolving challenge:", error);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
        Drink Assignments
      </h3>

      {currentCardRank && !isHost && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">
            Assign drinks for {currentCardRank}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              disabled={!selectedPlayerId}
              className={`px-4 py-2 rounded-lg ${
                !selectedPlayerId
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Assign {drinkCount} Drink{drinkCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {activeChallenge !== null && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
            Select your card that has {assignments[activeChallenge].cardRank}
          </h4>
          <div className="mt-2">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCardIndex(index)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    selectedCardIndex === index
                      ? "bg-yellow-500 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleResolveChallenge(activeChallenge, true)}
                disabled={selectedCardIndex === null}
                className={`px-4 py-2 rounded-lg ${
                  selectedCardIndex === null
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                I have it! (Card{" "}
                {selectedCardIndex !== null ? selectedCardIndex + 1 : ""})
              </button>

              <button
                onClick={() => handleResolveChallenge(activeChallenge, false)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                I was bluffing...
              </button>
            </div>
          </div>
        </div>
      )}

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

                {assignment.to === currentPlayerId &&
                  assignment.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptDrink(index)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                      >
                        Drink
                      </button>
                      <button
                        onClick={() => handleChallengeClick(index)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                      >
                        Challenge
                      </button>
                    </div>
                  )}

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
        <div className="text-gray-500 text-center py-4">
          No active drink assignments yet
        </div>
      )}
    </div>
  );
};

export default DrinkAssignmentPanel;
