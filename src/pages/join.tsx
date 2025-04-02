import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { usePlayerContext } from "../context/PlayerContext";
import { v4 as uuidv4 } from "uuid";

const JoinPage = () => {
  const router = useRouter();
  const { playerId, playerName, setPlayerId, setPlayerName } =
    usePlayerContext();

  const [gameId, setGameId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a player ID if one doesn't exist
  useEffect(() => {
    if (!playerId) {
      const newPlayerId = uuidv4();
      setPlayerId(newPlayerId);
    }
  }, [playerId, setPlayerId]);

  // Pre-fill game ID from URL if available
  useEffect(() => {
    if (router.query.id) {
      setGameId(router.query.id as string);
    }
  }, [router.query]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!gameId.trim()) {
      setError("Please enter a game ID");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const gameRef = doc(db, "games", gameId);
      const gameSnapshot = await getDoc(gameRef);

      if (!gameSnapshot.exists()) {
        setError("Game not found");
        setIsJoining(false);
        return;
      }

      const gameData = gameSnapshot.data();

      // Check if the game has already started
      if (gameData.gameState === "started") {
        setError("This game has already started");
        setIsJoining(false);
        return;
      }

      // Check if player is already in the game
      const players = gameData.players || [];
      if (players.some((p: any) => p.id === playerId)) {
        // Already in game, just redirect
        router.push(`/game/${gameId}`);
        return;
      }

      // Add player to the game
      await updateDoc(gameRef, {
        players: arrayUnion({
          id: playerId,
          name: playerName,
        }),
      });

      // Navigate to the game page
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setError("Failed to join game. Please try again.");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          Join a Game
        </h1>

        <form onSubmit={handleJoinGame} className="space-y-6">
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="gameId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Game ID
            </label>
            <input
              id="gameId"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter game ID"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            {isJoining ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Joining...
              </span>
            ) : (
              "Join Game"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
