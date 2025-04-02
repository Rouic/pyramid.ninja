// src/components/GameControls.tsx
import React from "react";
import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import { useGamePlayers } from "../hooks/useGamePlayers";

interface GameControlsProps {
  gameId: string;
  currentPhase: string;
  isHost: boolean;
  onStartMemorization?: () => Promise<void>;
}

export function GameControls({
  gameId,
  currentPhase,
  isHost,
  onStartMemorization,
}: GameControlsProps) {
  const { isReady, markAsReady, allPlayersReady, playerReadiness, loading } =
    usePlayerReadiness(gameId);

  const { players } = useGamePlayers(gameId);

  // Get a player's name by ID
  const getPlayerName = (playerId: string) => {
    const player = Object.values(players).find((p) => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  // Calculate ready percentage for progress indicator
  const readyCount = Object.values(playerReadiness).filter(
    (ready) => ready
  ).length;
  const totalPlayers = Object.keys(playerReadiness).length || 1;
  const readyPercentage = Math.round((readyCount / totalPlayers) * 100);

  return (
    <div className="flex flex-col space-y-4">
      {currentPhase === "memorizing" && (
        <div className="flex flex-col space-y-2">
          <button
            onClick={markAsReady}
            disabled={isReady}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isReady
                ? "bg-green-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isReady ? "You're Ready!" : "I've Memorized My Cards"}
          </button>

          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {isReady
              ? "Waiting for other players..."
              : "Click when you've memorized your cards"}
          </div>
        </div>
      )}

      {currentPhase === "ready" && !isReady && onStartMemorization && (
        <button
          onClick={onStartMemorization}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
        >
          Start Memorizing My Cards
        </button>
      )}

      {/* Player readiness status with modern UI */}
      {(currentPhase === "memorizing" ||
        (isHost && currentPhase === "ready")) && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              Player Status
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {readyCount}/{totalPlayers} Ready
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${readyPercentage}%` }}
            ></div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center py-2 text-gray-500 dark:text-gray-400">
                Loading player status...
              </div>
            ) : (
              Object.entries(playerReadiness).map(([playerId, ready]) => (
                <div
                  key={playerId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span
                      className={`h-3 w-3 rounded-full mr-2 ${
                        ready ? "bg-green-500" : "bg-amber-500"
                      }`}
                    ></span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {getPlayerName(playerId)}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      ready
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {ready ? "Ready" : "Not Ready"}
                  </span>
                </div>
              ))
            )}
          </div>

          {isHost && allPlayersReady && currentPhase === "memorizing" && (
            <button
              onClick={onStartMemorization}
              className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Everyone's Ready - Start Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}
