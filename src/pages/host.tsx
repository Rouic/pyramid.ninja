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
          background: "radial-gradient(circle at center, rgba(151, 50, 252, 0.7), transparent 70%)",
          filter: "blur(60px)"
        }}>
      </div>
      
      {/* Card host form with Balatro style */}
      <div className="max-w-md w-full bg-game-card rounded-xl shadow-xl p-8 border border-game-neon-red border-opacity-20 relative z-10">
        <h1 className="text-3xl font-display-fallback text-game-neon-red text-center mb-6 tracking-wider animate-glow">
          HOST A GAME
        </h1>
        
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-game-neon-red to-transparent mb-6 opacity-50"></div>

        <div className="mb-6 p-5 bg-black bg-opacity-30 rounded-lg border border-white border-opacity-5 text-white">
          <h2 className="font-game-fallback text-lg mb-2 text-game-neon-yellow">HOST INFORMATION</h2>
          <p className="text-sm">
            As the host, you'll control the game flow and display the pyramid
            for all players. Hosts don't participate with their own cards.
          </p>
        </div>

        <form onSubmit={handleCreateGame} className="space-y-6">
          <div>
            <label
              htmlFor="gameName"
              className="block text-sm font-game-fallback text-white mb-2 tracking-wider"
            >
              GAME NAME
            </label>
            <input
              id="gameName"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-game-neon-red border-opacity-50 rounded-lg bg-black bg-opacity-20 text-white focus:border-game-neon-red focus:ring-1 focus:ring-game-neon-red"
              placeholder="Enter a game name..."
              required
            />
          </div>

          {error && (
            <div className="text-game-neon-red text-sm p-2 bg-black bg-opacity-30 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full btn-neon py-4 px-6 bg-game-neon-red text-white font-game-fallback tracking-wide text-lg rounded-lg transition-all duration-300 hover:shadow-neon-red hover:scale-105 focus:outline-none"
          >
            {isCreating ? (
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
                CREATING GAME...
              </span>
            ) : (
              "CREATE GAME"
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-game-neon-purple transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            BACK TO HOME
          </button>

          <button
            onClick={() => router.push("/join")}
            className="text-game-neon-blue hover:text-game-neon-yellow transition-colors"
          >
            JOIN GAME
          </button>
        </div>
      </div>
      
      {/* Decorative card */}
      <div className="absolute bottom-10 right-10 w-32 h-40 rounded-lg bg-game-card opacity-10 transform rotate-12"></div>
    </div>
  );
};

export default HostPage;
