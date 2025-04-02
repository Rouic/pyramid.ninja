import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { usePlayerContext } from "../context/PlayerContext";
import { v4 as uuidv4 } from "uuid";

const HostPage = () => {
  const router = useRouter();
  const { playerId, setPlayerId, setIsHost } = usePlayerContext();

  const [gameName, setGameName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a host ID if one doesn't exist
  useEffect(() => {
    if (!playerId) {
      const newPlayerId = uuidv4();
      setPlayerId(newPlayerId);
    }
  }, [playerId, setPlayerId]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameName.trim()) {
      setError("Please enter a game name");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Generate a new game ID
      const gameId = uuidv4().substring(0, 8);

      // Create game document in Firestore
      await setDoc(doc(db, "games", gameId), {
        id: gameId,
        name: gameName,
        hostId: playerId,
        createdAt: serverTimestamp(),
        players: [], // Host is not a player in the game
        gameState: "waiting", // waiting, memorizing, playing, ended
      });

      // Mark this user as the host
      setIsHost(true);

      // Navigate to the game page
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Failed to create game. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          Host a Game
        </h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-800 dark:text-blue-200">
          <h2 className="font-medium text-lg mb-1">Host Information</h2>
          <p className="text-sm">
            As the host, you'll control the game flow and display the pyramid
            for all players. Hosts don't participate with their own cards.
          </p>
        </div>

        <form onSubmit={handleCreateGame} className="space-y-6">
          <div>
            <label
              htmlFor="gameName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Game Name
            </label>
            <input
              id="gameName"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter a name for your game"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            {isCreating ? (
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
                Creating Game...
              </span>
            ) : (
              "Create Game"
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

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Want to join a game instead?{" "}
          <button
            onClick={() => router.push("/join")}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostPage;
