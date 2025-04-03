// src/components/GameControls.tsx
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { usePlayerContext } from "../context/PlayerContext";

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
  const { playerId } = usePlayerContext();
  const { isReady, markAsReady, allPlayersReady, playerReadiness, loading } =
    usePlayerReadiness(gameId);
  const { players } = useGamePlayers(gameId);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState<number | null>(null);

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

  // Start personal memorization phase for this player
  const startPersonalMemorization = async () => {
    if (!gameId || !playerId) return;

    setIsMemorizing(true);

    // Show player's cards for 10 seconds
    let timeLeft = 10;
    setMemorizeTimeLeft(timeLeft);

    // Update the player's memorizing status
    await updateDoc(doc(db, "games", gameId), {
      [`playerMemorizing.${playerId}`]: true,
    });

    // Start countdown
    const interval = setInterval(() => {
      timeLeft -= 1;
      setMemorizeTimeLeft(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsMemorizing(false);
        setMemorizeTimeLeft(null);

        // Mark player as ready when time is up
        markAsReady();

        // Update the player's memorizing status
        updateDoc(doc(db, "games", gameId), {
          [`playerMemorizing.${playerId}`]: false,
        });
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col space-y-4">
      {currentPhase === "memorizing" && (
        <div className="flex flex-col space-y-2">
          {isMemorizing ? (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
              <div className="font-medium">Memorizing your cards!</div>
              <div className="text-xl font-bold mt-1">
                {memorizeTimeLeft} seconds left
              </div>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full transition-all duration-1000"
                  style={{ width: `${(memorizeTimeLeft / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={startPersonalMemorization}
              disabled={isReady}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                isReady
                  ? "bg-green-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isReady ? "You're Ready!" : "Start Memorizing My Cards"}
            </button>
          )}

          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {isReady
              ? "Waiting for other players..."
              : "Click to start your 10-second memorization period"}
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
