// src/components/ActivityLog.tsx
import React from "react";
import { DrinkAssignment } from "../lib/firebase/gameState";

interface ActivityLogProps {
  assignments: DrinkAssignment[];
  players: any[];
  roundNumber: number;
  currentCardRank?: string;
}

const ActivityLog: React.FC<ActivityLogProps> = ({
  assignments,
  players,
  roundNumber,
  currentCardRank,
}) => {
  // Filter assignments for the current round
  const currentRoundAssignments = assignments.filter(
    (assignment) => assignment.timestamp > 0 // Ensure it's a valid assignment
  );

  // Get player name by ID
  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player ? player.name : "Unknown Player";
  };

  // Get status badge styling based on assignment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "challenged":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "successful_challenge":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "failed_challenge":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting";
      case "accepted":
        return "Accepted";
      case "challenged":
        return "Challenged";
      case "successful_challenge":
        return "Bluff Called";
      case "failed_challenge":
        return "Challenge Failed";
      default:
        return status;
    }
  };

  // Summarize the drink assignments
  const getDrinkSummary = () => {
    const summary: Record<string, number> = {};

    currentRoundAssignments.forEach((assignment) => {
      if (assignment.status === "accepted") {
        summary[assignment.to] =
          (summary[assignment.to] || 0) + assignment.count;
      } else if (assignment.status === "successful_challenge") {
        // Bluffer drinks double
        summary[assignment.from] =
          (summary[assignment.from] || 0) + assignment.count * 2;
      } else if (assignment.status === "failed_challenge") {
        // Challenger drinks double
        summary[assignment.to] =
          (summary[assignment.to] || 0) + assignment.count * 2;
      }
    });

    return summary;
  };

  const drinkSummary = getDrinkSummary();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Round {roundNumber} Activity
        </h2>
        {currentCardRank && (
          <div className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-medium">
            Card: {currentCardRank}
          </div>
        )}
      </div>

      {/* Drink summary section */}
      {Object.keys(drinkSummary).length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            Drink Summary
          </h3>
          <div className="space-y-1">
            {Object.entries(drinkSummary).map(([playerId, drinks]) => (
              <div
                key={`summary-${playerId}`}
                className="flex justify-between items-center"
              >
                <span className="text-sm font-medium">
                  {getPlayerName(playerId)}
                </span>
                <span className="text-sm bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                  {drinks} drink{drinks !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {currentRoundAssignments.length > 0 ? (
          currentRoundAssignments.map((assignment, index) => (
            <div
              key={`activity-${index}`}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {getPlayerName(assignment.from)}
                  </div>
                  <svg
                    className="h-4 w-4 mx-1 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {getPlayerName(assignment.to)}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(
                    assignment.status
                  )}`}
                >
                  {formatStatus(assignment.status)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                  {assignment.count} drink{assignment.count !== 1 ? "s" : ""}
                </span>
                {assignment.cardRank && (
                  <span className="ml-1">
                    for card{" "}
                    <span className="font-mono">{assignment.cardRank}</span>
                  </span>
                )}
              </div>

              {(assignment.status === "successful_challenge" ||
                assignment.status === "failed_challenge") && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  {assignment.status === "successful_challenge"
                    ? `${getPlayerName(
                        assignment.from
                      )} was bluffing and drinks double (${
                        assignment.count * 2
                      })`
                    : `${getPlayerName(
                        assignment.to
                      )}'s challenge failed and drinks double (${
                        assignment.count * 2
                      })`}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No activity in this round yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
