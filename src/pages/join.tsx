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
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns similar to Balatro */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
      </div>
      
      {/* Glowing orb effect */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle at center, rgba(50, 135, 252, 0.7), transparent 70%)",
          filter: "blur(60px)"
        }}>
      </div>
      
      {/* Card join form with Balatro style */}
      <div className="max-w-md w-full bg-game-card rounded-xl shadow-xl p-8 border border-game-neon-blue border-opacity-20 relative z-10">
        <h1 className="text-3xl font-display text-game-neon-blue text-center mb-6 tracking-wider animate-glow">
          JOIN A GAME
        </h1>
        
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-game-neon-blue to-transparent mb-6 opacity-50"></div>

        <form onSubmit={handleJoinGame} className="space-y-6">
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-game-fallback text-white mb-2 tracking-wider"
            >
              YOUR NAME
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-game-neon-blue border-opacity-50 rounded-lg bg-black bg-opacity-20 text-white focus:border-game-neon-blue focus:ring-1 focus:ring-game-neon-blue"
              placeholder="Enter your name..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="gameId"
              className="block text-sm font-game-fallback text-white mb-2 tracking-wider"
            >
              GAME ID
            </label>
            <input
              id="gameId"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-game-neon-blue border-opacity-50 rounded-lg bg-black bg-opacity-20 text-white uppercase focus:border-game-neon-blue focus:ring-1 focus:ring-game-neon-blue"
              placeholder="Enter game ID..."
              required
            />
          </div>

          {error && (
            <div className="text-game-neon-red text-sm p-3 bg-black bg-opacity-30 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full btn-neon py-4 px-6 bg-game-neon-blue text-white font-game-fallback tracking-wide text-lg rounded-lg transition-all duration-300 hover:shadow-neon-blue hover:scale-105 focus:outline-none"
          >
            {isJoining ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                JOINING...
              </span>
            ) : (
              "JOIN GAME"
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-game-neon-purple transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            BACK TO HOME
          </button>
        </div>
      </div>
      
      {/* Decorative cards */}
      <div className="absolute top-20 right-20 w-28 h-36 rounded-lg bg-game-card opacity-10 transform rotate-6"></div>
      <div className="absolute bottom-20 left-20 w-28 h-36 rounded-lg bg-game-card opacity-10 transform -rotate-6"></div>
    </div>
  );
};

export default JoinPage;
