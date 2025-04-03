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
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-300"
        >
          ▶ Show Emergency Controls
        </button>
      ) : (
        <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
              Emergency Controls
            </h4>
            <button
              onClick={() => setShowControls(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ▼ Hide
            </button>
          </div>

          <p className="text-xs text-red-600 dark:text-red-400 mb-2">
            If you're stuck in a challenge state, use these controls to reset.
          </p>

          <button
            onClick={resetPlayerChallengeState}
            disabled={isResetting}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${
              isResetting
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isResetting ? "Resetting..." : "Reset My Challenge State"}
          </button>

          {resetResult && (
            <div
              className={`mt-2 p-2 rounded-lg text-xs ${
                resetResult.startsWith("Error")
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              }`}
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
