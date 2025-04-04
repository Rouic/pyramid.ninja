// src/components/ChallengeResetControls.tsx
import React, { useState } from "react";
import { doc, updateDoc, getDoc, deleteField } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { clearPlayerChallengeState } from "../lib/firebase/gameState";

interface ChallengeResetControlsProps {
  gameId: string;
  playerId: string;
}

const ChallengeResetControls: React.FC<ChallengeResetControlsProps> = ({
  gameId,
  playerId,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const resetPlayerChallengeState = async () => {
    setIsResetting(true);
    setResetResult(null);

    try {
      // 1. Reset player document
      const playerRef = doc(db, "games", gameId, "players", playerId);
      await updateDoc(playerRef, {
        isInChallenge: false,
        inChallenge: false,
        challengeCardIndex: null,
        selectingForChallenge: false,
        challengeComplete: true,
        selectingCardForChallenge: false,
        updatedAt: new Date().toISOString(),
      });

      // 2. Reset any pending replacements
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        [`pendingCardReplacements.${playerId}`]: deleteField(),
        [`playerChallenges.${playerId}`]: deleteField(),
        [`challengeTimers.${playerId}`]: deleteField(),
      });

      // 3. Try to fix any stuck challenges in the drink assignments
      try {
        const gameDoc = await getDoc(gameRef);
        if (gameDoc.exists()) {
          const gameData = gameDoc.data();
          const assignments = gameData.drinkAssignments || [];
          let fixedChallenges = false;

          // Look for assignments in "challenged" state involving this player
          for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];
            if (
              assignment.status === "challenged" &&
              (assignment.from === playerId || assignment.to === playerId)
            ) {
              // Auto-resolve as a failed challenge
              assignments[i] = {
                ...assignment,
                status:
                  assignment.from === playerId
                    ? "failed_challenge"
                    : "successful_challenge",
                resolvedAt: Date.now(),
                isResolved: true,
                resolution: {
                  message:
                    assignment.from === playerId
                      ? `CHALLENGE AUTO-RESOLVED: ${playerId} didn't show a card in time.`
                      : `CHALLENGE AUTO-RESOLVED: Timeout during challenge.`,
                  wasSuccessful: assignment.from !== playerId,
                  time: new Date().toISOString(),
                },
              };
              fixedChallenges = true;
            }
          }

          if (fixedChallenges) {
            await updateDoc(gameRef, {
              drinkAssignments: assignments,
              [`challengeResultId`]: `emergency_reset_${Date.now()}`,
            });
          }
        }
      } catch (err) {
        console.error("Error fixing stuck assignments:", err);
      }

      // 4. Call the official clearPlayerChallengeState function for thoroughness
      await clearPlayerChallengeState(gameId, playerId);

      setResetResult("Successfully reset your challenge state!");
    } catch (error) {
      console.error("Error resetting challenge state:", error);
      setResetResult(
        "Error: " + (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mt-6">
      {!showControls ? (
        <button
          onClick={() => setShowControls(true)}
          className="text-xs text-gray-400 hover:text-game-neon-red border-b border-dotted border-gray-700 font-game-fallback flex items-center"
        >
          <span className="mr-1 text-game-neon-red">⚠</span> EMERGENCY CONTROLS
        </button>
      ) : (
        <div className="border-2 border-game-neon-red/70 bg-black/60 backdrop-blur-sm p-4 rounded-lg shadow-neon-red-sm transform -rotate-1">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-game-fallback text-game-neon-red animate-pulse-slow flex items-center">
              <span className="mr-2">⚠</span> EMERGENCY CONTROLS
            </h4>
            <button
              onClick={() => setShowControls(false)}
              className="text-xs text-gray-400 hover:text-white bg-black/40 rounded-full h-6 w-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-300 mb-3 border-l-2 border-game-neon-red/50 pl-2 bg-black/40 py-2 rounded-r-lg">
            If you&apos;re stuck in a challenge state and can&apos;t proceed,
            use this emergency reset button.
          </p>

          <button
            onClick={resetPlayerChallengeState}
            disabled={isResetting}
            className={`w-full px-4 py-3 rounded-lg text-sm font-game-fallback relative overflow-hidden ${
              isResetting
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                : "bg-black text-game-neon-red border-2 border-game-neon-red hover:bg-game-neon-red/10 transition-colors duration-300 shadow-neon-red-sm btn-neon"
            }
            `}
          >
            {isResetting ? "RESETTING..." : "RESET MY CHALLENGE STATE"}
          </button>

          {resetResult && (
            <div
              className={`mt-3 p-2 rounded-lg text-xs font-game-fallback border ${
                resetResult.startsWith("Error")
                  ? "border-game-neon-red bg-black/60 text-game-neon-red animate-pulse-slow"
                  : "border-game-neon-green bg-black/60 text-game-neon-green animate-pulse-slow"
              }
              `}
            >
              {resetResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeResetControls;
