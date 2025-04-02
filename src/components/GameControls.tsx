import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import { useGamePlayers } from "../hooks/useGamePlayers"; // New hook for player data

export function GameControls({ gameId, currentPhase, isHost }) {
  // Get all values from the hook, including playerReadiness
  const { isReady, markAsReady, allPlayersReady, playerReadiness } =
    usePlayerReadiness(gameId);

  // Get player information to display names
  const { players } = useGamePlayers(gameId);

  return (
    <div className="flex flex-col space-y-4 p-4 rounded-lg bg-slate-100">
      {currentPhase === "memorizing" && (
        <button
          onClick={markAsReady}
          disabled={isReady}
          className={`px-6 py-3 rounded-lg font-medium text-white ${
            isReady
              ? "bg-green-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isReady ? "You're Ready!" : "I've Memorized My Cards"}
        </button>
      )}

      {/* Game host can see player readiness status */}
      {isHost && (
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-2">Player Status:</h3>
          <div className="space-y-2">
            {Object.entries(playerReadiness).map(([playerId, ready]) => (
              <div key={playerId} className="flex items-center">
                <span
                  className={`h-3 w-3 rounded-full mr-2 ${
                    ready ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span>{players?.[playerId]?.name || "Unknown Player"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
