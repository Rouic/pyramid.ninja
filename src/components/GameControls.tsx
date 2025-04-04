// src/components/GameControls.tsx
import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { usePlayerContext } from "../context/PlayerContext";
import { AdjustmentsHorizontalIcon, CheckCircleIcon, ExclamationCircleIcon, FaceSmileIcon, InformationCircleIcon } from "@heroicons/react/16/solid";

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
      {/* Host controls - Completely redesigned in Balatro style */}
      {isHost &&
        (currentPhase === "memorizing" || currentPhase === "ready") && (
          <div className="relative mt-6 overflow-hidden">
            {/* Host info panel - Balatro style */}
            <div className="bg-game-card rounded-xl shadow-xl border-4 border-game-neon-blue border-opacity-30 overflow-hidden">
              {/* Header with color bar */}
              <div className="bg-gradient-to-r from-game-neon-blue/20 to-transparent px-5 py-3 border-b border-white/10 flex items-center">
                <div className="w-10 h-10 rounded-lg bg-game-neon-blue bg-opacity-20 flex items-center justify-center mr-3 border-2 border-game-neon-blue border-opacity-40 shadow-neon-blue">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-black" />
                </div>
                <h4 className="font-game-fallback tracking-wide text-game-neon-blue text-xl">
                  HOST CONTROLS
                </h4>
              </div>

              {/* Content with better layout */}
              <div className="p-5">
                <div className="bg-black bg-opacity-30 border border-white border-opacity-5 rounded-lg p-4 mb-4">
                  <p className="text-white text-base">
                    {currentPhase === "ready" ? (
                      <>
                        Players are joining and preparing for the game.
                        <span className="text-game-neon-yellow">
                          {" "}
                          Encourage them to click &quot;START MEMORIZING MY
                          CARDS&quot;.
                        </span>
                      </>
                    ) : (
                      <>
                        Players are currently memorizing their cards.
                        {allPlayersReady ? (
                          <span className="text-game-neon-green">
                            {" "}
                            Everyone is ready to start playing!
                          </span>
                        ) : (
                          <span className="text-game-neon-yellow">
                            {" "}
                            Waiting for all players to finish memorizing.
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Tip with visual styling */}
                <div className="flex p-3 bg-game-neon-blue/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-game-neon-blue bg-opacity-20 flex items-center justify-center mr-3 border-2 border-game-neon-blue border-opacity-20 flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-black" />
                  </div>
                  <div className="text-sm text-game-neon-blue">
                    <span className="font-bold">TIP:</span> You can click any
                    pyramid card to start the game for everyone at any time.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Player memorization controls - Enhanced Balatro style */}
      {(currentPhase === "memorizing" || currentPhase === "ready") &&
        !isHost && (
          <div className="flex flex-col space-y-4">
            {isMemorizing ? (
              <div className="bg-game-card rounded-xl shadow-xl border-4 border-game-neon-yellow border-opacity-30 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-game-neon-yellow/20 to-transparent px-5 py-3 border-b border-white/10 flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-game-neon-yellow bg-opacity-20 flex items-center justify-center mr-3 border-2 border-game-neon-yellow border-opacity-40 shadow-neon-yellow animate-pulse-fast">
                    <ExclamationCircleIcon className="h-5 w-5 text-black" />
                  </div>
                  <h4 className="font-game-fallback tracking-wide text-game-neon-yellow text-xl">
                    MEMORIZING YOUR CARDS!
                  </h4>
                </div>

                {/* Timer content */}
                <div className="p-5">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-16 h-16 rounded-full bg-black bg-opacity-30 border-4 border-game-neon-yellow border-opacity-30 flex items-center justify-center shadow-neon-yellow">
                      <span className="text-2xl font-bold font-game-fallback text-white">
                        {memorizeTimeLeft}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-xl font-bold font-game-fallback text-white">
                        SECONDS LEFT
                      </div>
                      <div className="text-sm text-gray-300">
                        Memorize your cards before time expires
                      </div>
                    </div>
                  </div>

                  {/* Progress bar - Enhanced with animation */}
                  <div className="w-full h-5 bg-black bg-opacity-50 rounded-full overflow-hidden border border-white border-opacity-10 relative">
                    <div
                      className="h-full transition-all duration-1000 relative overflow-hidden"
                      style={{
                        width: `${(memorizeTimeLeft / 10) * 100}%`,
                        background:
                          "linear-gradient(90deg, rgba(255,215,0,0.7) 0%, rgba(255,165,0,0.9) 100%)",
                      }}
                    >
                      {/* Animated stripes */}
                      <div
                        className="absolute inset-0 overflow-hidden opacity-30"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)",
                          backgroundSize: "20px 20px",
                          animation: "move-stripes 1s linear infinite",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : personalMemorizationComplete || isReady ? (
              <div className="bg-game-card rounded-xl shadow-xl border-4 border-game-neon-green border-opacity-30 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-game-neon-green/20 to-transparent px-5 py-3 border-b border-white/10 flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-game-neon-green bg-opacity-20 flex items-center justify-center mr-3 border-2 border-game-neon-green border-opacity-40 shadow-neon-green animate-pulse-fast">
                    <CheckCircleIcon className="h-5 w-5 text-black" />
                  </div>
                  <h4 className="font-game-fallback tracking-wide text-game-neon-green text-xl">
                    CARDS MEMORIZED!
                  </h4>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center bg-black bg-opacity-30 p-4 rounded-lg">
                    <div className="min-w-[20px]">
                      <div className="animate-spin h-6 w-6 border-4 border-game-neon-green border-opacity-20 border-t-game-neon-green rounded-full mr-4"></div>
                    </div>
                    <div className="text-white">
                      <div className="font-game-fallback">
                        WAITING FOR OTHER PLAYERS
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Game will start automatically when everyone is ready
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Big Start button - Balatro style with animation and effects */}
                <div className="w-full py-8 flex flex-col items-center justify-center relative">
                  {/* Background pattern */}
                  <div
                    className="absolute inset-0 bg-black bg-opacity-10 rounded-xl"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, rgba(50, 135, 252, 0.05) 25%, transparent 25%, transparent 50%, rgba(50, 135, 252, 0.05) 50%, rgba(50, 135, 252, 0.05) 75%, transparent 75%, transparent)",
                      backgroundSize: "10px 10px",
                    }}
                  ></div>

                  {/* Glow effect */}
                  <div
                    className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-32 w-full"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(50, 135, 252, 0.3), transparent 70%)",
                      filter: "blur(20px)",
                      animation: "pulse 3s ease-in-out infinite alternate",
                    }}
                  ></div>

                  <button
                    onClick={startPersonalMemorization}
                    className="relative w-5/6 mx-auto flex items-center justify-center px-8 py-8 bg-game-neon-blue text-white rounded-xl font-game-fallback tracking-wide text-3xl border-4 border-game-neon-blue border-opacity-70 transition-all duration-300 hover:scale-105 shadow-neon-blue hover:shadow-neon-blue-lg animate-pulse-slow"
                    style={{
                      boxShadow:
                        "0 0 20px rgba(50, 135, 252, 0.8), 0 0 40px rgba(50, 135, 252, 0.4)",
                    }}
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background:
                            "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent 70%)",
                        }}
                      ></div>
                    </div>

                    {/* Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mr-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>

                    <span>START MEMORIZING</span>
                  </button>

                  {/* Instruction with card icons */}
                  <div className="mt-4 bg-black bg-opacity-30 rounded-lg px-4 py-2 max-w-lg mx-auto text-center flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-game-neon-blue mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-300">
                      You&apos;ll have 10 seconds to memorize your cards
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Player readiness status - Enhanced Balatro style */}
      {(currentPhase === "memorizing" ||
        (isHost && currentPhase === "ready")) && (
        <div className="mt-5 bg-game-card rounded-xl shadow-xl border-4 border-game-neon-purple border-opacity-30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-game-neon-purple/20 to-transparent px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-game-neon-purple bg-opacity-20 flex items-center justify-center mr-3 border-2 border-game-neon-purple border-opacity-40 shadow-neon-purple">
                <FaceSmileIcon className="h-5 w-5 text-black" />
              </div>
              <h3 className="font-game-fallback text-xl tracking-wide text-game-neon-purple">
                {allPlayersReady && currentPhase === "memorizing"
                  ? "GAME READY"
                  : "PLAYER STATUS"}
              </h3>
            </div>

            <div className="font-game-fallback bg-black bg-opacity-40 text-white px-3 py-1 rounded-lg border-2 border-game-neon-purple border-opacity-20 flex items-center space-x-2 shadow-inner">
              <span className="text-game-neon-green font-bold">
                {readyCount}
              </span>
              <span className="text-xs opacity-70">/</span>
              <span>{totalPlayers} READY</span>
            </div>
          </div>

          {/* Content section */}
          <div className="p-5">
            {/* Progress bar with improved animation and styling */}
            <div className="w-full h-5 bg-black bg-opacity-50 rounded-full mb-5 overflow-hidden border border-white border-opacity-10 relative">
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalPlayers }).map((_, i) => (
                  <div key={i} className="h-full flex-1">
                    <div
                      className={`h-full transition-all duration-500 ${
                        i < readyCount
                          ? "bg-gradient-to-r from-game-neon-green to-game-neon-blue"
                          : "bg-transparent"
                      }`}
                      style={{
                        boxShadow:
                          i < readyCount
                            ? "0 0 10px rgba(50, 252, 88, 0.5)"
                            : "none",
                      }}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Segment lines */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: totalPlayers - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full flex-1 border-r border-black border-opacity-30"
                  ></div>
                ))}
              </div>

              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {readyPercentage}%
                </span>
              </div>
            </div>

            {/* Player list with better styling */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                <div className="text-center py-6 text-white flex flex-col items-center justify-center bg-black bg-opacity-30 rounded-lg border border-white border-opacity-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-game-neon-purple border-t-transparent mb-3"></div>
                  <span className="font-game-fallback tracking-wide">
                    LOADING PLAYERS...
                  </span>
                </div>
              ) : (
                Object.entries(playerReadiness).map(([playerId, ready]) => (
                  <div
                    key={playerId}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-black bg-opacity-30 border border-white border-opacity-5 hover:border-white hover:border-opacity-10 transition-colors"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white ${
                          ready
                            ? "bg-game-neon-green border-2 border-white border-opacity-20 animate-pulse-fast shadow-neon-green"
                            : "bg-game-neon-red border-2 border-white border-opacity-20 shadow-neon-red"
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {getPlayerName(playerId).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">
                        {getPlayerName(playerId)}
                      </span>
                    </div>
                    <span
                      className={`text-sm px-3 py-1 rounded-lg font-game-fallback ${
                        ready
                          ? "bg-game-neon-green text-black shadow-neon-green border border-white border-opacity-20"
                          : "bg-game-neon-red text-white shadow-neon-red border border-white border-opacity-20"
                      }`}
                    >
                      {ready ? "READY" : "WAITING"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Start game button for host when all ready - Now with additional explanation */}
            {isHost && allPlayersReady && currentPhase === "memorizing" && (
              <div className="mt-6">
                <div className="bg-black bg-opacity-30 border border-white border-opacity-5 rounded-lg p-3 mb-4">
                  <p className="text-game-neon-green text-center font-bold">
                    All players have memorized their cards! You can start the
                    game now.
                  </p>
                </div>
                <button
                  onClick={onStartPlaying}
                  className="w-full px-6 py-4 bg-game-neon-green text-black rounded-lg font-game-fallback tracking-wide transition-all hover:scale-105 text-lg btn-neon border-4 border-game-neon-green border-opacity-50 hover:shadow-neon-green shadow-neon-green flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  START GAME
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
