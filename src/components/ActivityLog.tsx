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
        return "bg-game-neon-yellow/20 text-game-neon-yellow border border-game-neon-yellow/50";
      case "accepted":
        return "bg-game-neon-green/20 text-game-neon-green border border-game-neon-green/50";
      case "challenged":
        return "bg-game-neon-purple/20 text-game-neon-purple border border-game-neon-purple/50";
      case "successful_challenge":
        return "bg-game-neon-green/30 text-game-neon-green border border-game-neon-green font-bold animate-pulse-slow";
      case "failed_challenge":
        return "bg-game-neon-red/30 text-game-neon-red border border-game-neon-red font-bold animate-pulse-slow";
      default:
        return "bg-gray-800/50 text-gray-300 border border-gray-700";
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
        return "SUCCESS";
      case "failed_challenge":
        return "FAILED";
      default:
        return status;
    }
  };

  // Summarize the drink assignments
  const getDrinkSummary = () => {
    const summary: Record<string, number> = {};

    currentRoundAssignments.forEach((assignment) => {
      if (assignment.status === "accepted") {
        // Normal accepted - receiver drinks
        summary[assignment.to] =
          (summary[assignment.to] || 0) + assignment.count;
      } else if (assignment.status === "successful_challenge") {
        // Successful challenge - assigner had the card, challenger drinks double
        summary[assignment.to] =
          (summary[assignment.to] || 0) + assignment.count * 2;
      } else if (assignment.status === "failed_challenge") {
        // Failed challenge - assigner was bluffing, assigner drinks double
        summary[assignment.from] =
          (summary[assignment.from] || 0) + assignment.count * 2;
      }
    });

    return summary;
  };

  const drinkSummary = getDrinkSummary();

  // Determine if there are any resolved challenges to display
  const hasResolvedChallenges = currentRoundAssignments.some(
    (a) =>
      a.status === "successful_challenge" || a.status === "failed_challenge"
  );

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg border border-game-neon-blue/30 p-4 font-game-fallback">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-game-neon-blue animate-glow font-game-fallback">
          ROUND {roundNumber}
        </h2>
        {currentCardRank && (
          <div className="px-3 py-1 rounded-lg bg-black/60 text-game-neon-green border border-game-neon-green/50 shadow-neon-green-sm text-sm font-game-fallback">
            <span className="animate-pulse-slow">♠</span> {currentCardRank} <span className="animate-pulse-slow">♠</span>
          </div>
        )}
      </div>

      {/* Resolved challenges section */}
      {hasResolvedChallenges && (
        <div className="mb-4 p-3 bg-black/60 border border-game-neon-orange/50 rounded-lg transform -rotate-1 shadow-neon-orange-sm">
          <h3 className="text-sm font-game-fallback text-game-neon-orange animate-glow mb-2 flex items-center">
            <span className="mr-2">♦</span> CHALLENGE RESULTS <span className="ml-2">♦</span>
          </h3>
          <div className="space-y-2">
            {currentRoundAssignments
              .filter(
                (a) =>
                  a.status === "successful_challenge" ||
                  a.status === "failed_challenge"
              )
              .map((challenge, idx) => (
                <div
                  key={`challenge-${idx}`}
                  className={`p-2 rounded-lg text-sm border-2 ${challenge.status === "successful_challenge"
                      ? "bg-black/40 border-game-neon-green text-game-neon-green shadow-neon-green-sm"
                      : "bg-black/40 border-game-neon-red text-game-neon-red shadow-neon-red-sm"
                  } transform ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
                >
                  {challenge.status === "successful_challenge"
                    ? `${getPlayerName(challenge.from)} had the ${
                        challenge.cardRank
                      }! ${getPlayerName(challenge.to)} drinks ${
                        challenge.count * 2
                      }.`
                    : `${getPlayerName(
                        challenge.from
                      )} bluffed about having the ${
                        challenge.cardRank
                      }! ${getPlayerName(challenge.from)} drinks ${
                        challenge.count * 2
                      }.`}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Drink summary section */}
      {Object.keys(drinkSummary).length > 0 && (
        <div className="mb-4 p-3 bg-black/60 border border-game-neon-green/50 rounded-lg transform rotate-1 shadow-neon-green-sm">
          <h3 className="text-sm font-game-fallback text-game-neon-green animate-glow mb-2 flex items-center">
            <span className="mr-2">♣</span> DRINK SUMMARY <span className="ml-2">♣</span>
          </h3>
          <div className="space-y-1">
            {Object.entries(drinkSummary).map(([playerId, drinks], idx) => (
              <div
                key={`summary-${playerId}`}
                className="flex justify-between items-center p-2 bg-black/40 border border-gray-700 rounded-lg transform ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'}"
              >
                <span className="text-sm font-game-fallback text-white">
                  {getPlayerName(playerId)}
                </span>
                <span className="text-sm bg-game-neon-green/20 border border-game-neon-green text-game-neon-green px-3 py-1 rounded-lg font-game-fallback animate-pulse-slow">
                  {drinks} DRINK{drinks !== 1 ? "S" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {currentRoundAssignments.length > 0 ? (
          currentRoundAssignments.map((assignment, index) => (
            <div
              key={`activity-${index}`}
              className={`p-3 bg-black/60 backdrop-blur-sm rounded-lg border ${assignment.status === "successful_challenge" ||
                assignment.status === "failed_challenge"
                  ? (assignment.status === "successful_challenge"
                      ? "border-game-neon-green shadow-neon-green-sm"
                      : "border-game-neon-red shadow-neon-red-sm")
                  : "border-gray-700"
              } transform ${index % 2 === 0 ? 'rotate-0.5' : '-rotate-0.5'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="font-game-fallback text-white">
                    {getPlayerName(assignment.from)}
                  </div>
                  <svg
                    className="h-5 w-5 mx-2 text-game-neon-blue"
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
                  <div className="font-game-fallback text-white">
                    {getPlayerName(assignment.to)}
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-lg font-game-fallback ${getStatusBadge(
                    assignment.status
                  )}`}
                >
                  {formatStatus(assignment.status)}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-300 flex items-center">
                <span className="inline-block bg-black/60 border border-game-neon-orange/50 rounded-lg px-2 py-1 text-game-neon-orange font-game-fallback mr-2">
                  {assignment.count} DRINK{assignment.count !== 1 ? "S" : ""}
                </span>
                {assignment.cardRank && (
                  <span className="flex items-center">
                    <span className="text-gray-400 mr-1">FOR CARD</span>
                    <span className="bg-black/60 px-2 py-1 rounded-lg border border-white/30 font-game-fallback text-white">
                      {assignment.cardRank}
                    </span>
                  </span>
                )}
              </div>

              {/* Challenge result explanation */}
              {(assignment.status === "successful_challenge" ||
                assignment.status === "failed_challenge") && (
                <div
                  className={`mt-3 px-3 py-2 rounded-lg font-bold text-sm border-2 ${assignment.status === "successful_challenge"
                      ? "bg-black/60 text-game-neon-green border-game-neon-green animate-pulse-slow"
                      : "bg-black/60 text-game-neon-red border-game-neon-red animate-pulse-slow"
                  }`}
                >
                  {/* Show custom message from resolution if available */}
                  <div className="font-game-fallback">
                    {assignment.resolution && assignment.resolution.message
                      ? assignment.resolution.message
                      : assignment.status === "successful_challenge"
                      ? <>
                          <span className="text-white">CHALLENGE SUCCESSFUL:</span> {getPlayerName(assignment.from)} showed the {assignment.cardRank}! {getPlayerName(assignment.to)} drinks double ({assignment.count * 2})
                        </>
                      : <>
                          <span className="text-white">CHALLENGE FAILED:</span> {getPlayerName(assignment.from)} bluffed about having the {assignment.cardRank}! Drinks double ({assignment.count * 2})
                        </>}
                  </div>

                  {/* Show timestamp for when the challenge was resolved */}
                  {assignment.resolvedAt && (
                    <div className="text-xs mt-2 opacity-80 text-gray-300 font-normal">
                      Resolved at{" "}
                      {new Date(assignment.resolvedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 rounded-lg border border-dashed border-gray-700 bg-black/40">
            <div className="font-game-fallback text-gray-500 animate-pulse-slow">
              NO ACTIVITY YET
            </div>
            <div className="text-xs text-gray-600 mt-1">Waiting for first drink assignment</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
