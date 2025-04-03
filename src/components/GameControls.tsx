// src/components/GameControls.tsx
import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { usePlayerContext } from "../context/PlayerContext";

interface GameControlsProps {
  gameId: string;
  currentPhase: string;
  isHost: boolean;
  onStartMemorization?: () => Promise<void>;
  onStartPlaying?: () => Promise<void>;
  onPersonalMemorizationStart?: (seconds: number) => void; // Update to include seconds
  onPersonalMemorizationTick?: (seconds: number) => void; // Add this prop for time updates
  onPersonalMemorizationEnd?: () => void;
}

export function GameControls({
  gameId,
  currentPhase,
  isHost,
  onStartMemorization,
  onStartPlaying,
  onPersonalMemorizationStart,
  onPersonalMemorizationTick,
  onPersonalMemorizationEnd,
}: GameControlsProps) {
  const { playerId } = usePlayerContext();
  const { isReady, markAsReady, allPlayersReady, playerReadiness, loading } =
    usePlayerReadiness(gameId);
  const { players } = useGamePlayers(gameId);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState<number | null>(null);
  const [personalMemorizationComplete, setPersonalMemorizationComplete] =
    useState(false);

  // Get a player's name by ID
  const getPlayerName = (playerId: string) => {
    const player = Object.values(players).find((p) => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  // Check localStorage for memorization state when component mounts
  useEffect(() => {
    if (playerId && gameId) {
      const memorizationKey = `${gameId}_${playerId}_memorized`;
      const hasMemorized = localStorage.getItem(memorizationKey) === "true";
      setPersonalMemorizationComplete(hasMemorized);

      // If player has already memorized but game still shows as not ready,
      // ensure they're marked as ready
      if (hasMemorized && !isReady && currentPhase === "memorizing") {
        markAsReady();
      }
    }
  }, [playerId, gameId, isReady, currentPhase, markAsReady]);

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

    // Initial time
    const initialTime = 10;
    setMemorizeTimeLeft(initialTime);

    // Notify parent component that personal memorization has started
    if (onPersonalMemorizationStart) {
      onPersonalMemorizationStart(initialTime);
    }

    // Update the player's memorizing status in Firebase
    await updateDoc(doc(db, "games", gameId), {
      [`playerMemorizing.${playerId}`]: true,
    });

    // Start countdown
    let timeLeft = initialTime;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setMemorizeTimeLeft(timeLeft);

      // Send time updates to parent
      if (onPersonalMemorizationTick) {
        onPersonalMemorizationTick(timeLeft);
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsMemorizing(false);
        setMemorizeTimeLeft(null);
        setPersonalMemorizationComplete(true);

        // Notify parent that personal memorization has ended
        if (onPersonalMemorizationEnd) {
          onPersonalMemorizationEnd();
        }

        // Store in localStorage that this player has completed memorization
        const memorizationKey = `${gameId}_${playerId}_memorized`;
        localStorage.setItem(memorizationKey, "true");

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
    <div className="flex flex-col space-y-6">
      {isHost &&
        (currentPhase === "memorizing" || currentPhase === "ready") && (
          <div className="mt-4 p-5 bg-game-card rounded-xl border border-game-neon-blue border-opacity-30 shadow-lg">
            <h4 className="font-game-fallback tracking-wide text-game-neon-blue text-lg mb-3">
              HOST CONTROLS
            </h4>
            <p className="text-white mb-4">
              You can click any pyramid card at any time to start the game.
              {currentPhase === "memorizing" &&
                " Players are currently memorizing their cards."}
              {currentPhase === "ready" &&
                " Players are ready to start memorizing."}
            </p>

            {currentPhase === "memorizing" && allPlayersReady && (
              <button
                onClick={onStartPlaying}
                className="w-full mt-2 px-6 py-3 bg-game-neon-green hover:shadow-neon-green text-white rounded-lg font-game-fallback tracking-wide transition-all duration-300 hover:scale-105 btn-neon"
              >
                EVERYONE'S READY - START GAME
              </button>
            )}

            <div className="mt-3 text-sm text-game-neon-blue">
              <strong>TIP:</strong> Clicking any pyramid card will automatically
              start the game for everyone.
            </div>
          </div>
        )}
      {currentPhase === "memorizing" && (
        <div className="flex flex-col space-y-4">
          {isMemorizing ? (
            <div className="bg-game-card border border-game-neon-yellow border-opacity-40 p-5 rounded-xl shadow-lg">
              <div className="font-game-fallback tracking-wide text-game-neon-yellow text-lg">MEMORIZING YOUR CARDS!</div>
              <div className="text-2xl font-bold font-game-fallback mt-2 text-white">
                {memorizeTimeLeft} SECONDS LEFT
              </div>
              <div className="w-full bg-black bg-opacity-50 h-3 rounded-full mt-3 overflow-hidden border border-white border-opacity-10">
                <div
                  className="bg-game-neon-yellow h-full transition-all duration-1000 shadow-neon-yellow"
                  style={{ width: `${(memorizeTimeLeft / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : personalMemorizationComplete || isReady ? (
            <div className="bg-game-card border border-game-neon-green border-opacity-40 p-5 rounded-xl shadow-lg">
              <div className="font-game-fallback tracking-wide text-game-neon-green text-lg">CARDS MEMORIZED!</div>
              <div className="text-white mt-2">
                Waiting for other players to finish memorizing...
              </div>
            </div>
          ) : (
            <button
              onClick={startPersonalMemorization}
              className="px-6 py-4 rounded-lg font-game-fallback tracking-wide text-white transition-all bg-game-neon-blue hover:shadow-neon-blue hover:scale-105 duration-300 text-lg btn-neon"
            >
              START MEMORIZING MY CARDS
            </button>
          )}

          {!isMemorizing && !personalMemorizationComplete && !isReady && (
            <div className="mt-1 text-sm text-gray-300 text-center">
              Click to start your 10-second memorization period
            </div>
          )}
        </div>
      )}

      {currentPhase === "ready" && !isReady && (
        <button
          onClick={startPersonalMemorization}
          className="px-6 py-4 rounded-lg font-game-fallback tracking-wide text-white transition-all bg-game-neon-yellow hover:shadow-neon-yellow hover:scale-105 duration-300 text-lg btn-neon"
        >
          START MEMORIZING MY CARDS
        </button>
      )}

      {/* Player readiness status with Balatro styling */}
      {(currentPhase === "memorizing" ||
        (isHost && currentPhase === "ready")) && (
        <div className="mt-5 bg-game-card rounded-xl shadow-lg border border-game-neon-purple border-opacity-30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-game-fallback text-lg tracking-wide text-game-neon-purple animate-pulse-fast">
              PLAYER STATUS
            </h3>
            <div className="font-game-fallback text-white px-3 py-1 bg-black bg-opacity-40 rounded-lg border-2 border-white border-opacity-10 flex items-center space-x-2">
              <span className="text-game-neon-green font-bold">{readyCount}</span>
              <span className="text-xs opacity-70">/</span>
              <span>{totalPlayers} READY</span>
            </div>
          </div>

          {/* Progress bar - Balatro style with segments */}
          <div className="w-full h-4 bg-black bg-opacity-40 rounded-lg my-4 overflow-hidden border border-white border-opacity-5 p-0.5">
            <div className="relative h-full w-full flex">
              {Array.from({ length: totalPlayers }).map((_, i) => (
                <div key={i} className="h-full flex-1 px-0.5">
                  <div 
                    className={`h-full rounded-sm transition-all duration-300 ${
                      i < readyCount 
                      ? "bg-gradient-to-r from-game-neon-green to-game-neon-blue" 
                      : "bg-game-card bg-opacity-40"
                    }`}
                    style={{
                      boxShadow: i < readyCount ? "0 0 10px rgba(50, 252, 88, 0.5)" : "none"
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-white flex items-center justify-center bg-black bg-opacity-20 rounded-lg border border-white border-opacity-10">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-game-neon-blue border-t-transparent mr-3"></div>
                <span className="font-game-fallback tracking-wide">LOADING PLAYERS...</span>
              </div>
            ) : (
              Object.entries(playerReadiness).map(([playerId, ready]) => (
                <div
                  key={playerId}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-black bg-opacity-20 border border-white border-opacity-5"
                >
                  <div className="flex items-center">
                    <span
                      className={`h-4 w-4 rounded-full mr-3 ${
                        ready 
                        ? "bg-game-neon-green animate-pulse-fast shadow-neon-green" 
                        : "bg-game-neon-red shadow-neon-red"
                      }`}
                    ></span>
                    <span className="text-white font-medium">
                      {getPlayerName(playerId)}
                    </span>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-lg font-game-fallback ${
                      ready
                        ? "bg-game-neon-green text-black"
                        : "bg-game-neon-red text-white"
                    }`}
                  >
                    {ready ? "READY" : "WAITING"}
                  </span>
                </div>
              ))
            )}
          </div>

          {isHost && allPlayersReady && currentPhase === "memorizing" && (
            <button
              onClick={onStartPlaying}
              className="w-full mt-5 px-6 py-4 bg-game-neon-green hover:shadow-neon-green text-black rounded-lg font-game-fallback tracking-wide transition-all hover:scale-105 text-lg btn-neon"
            >
              EVERYONE'S READY - START GAME
            </button>
          )}
        </div>
      )}
    </div>
  );
}
