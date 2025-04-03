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
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-6 lg:p-10 relative overflow-hidden">
      {/* Background patterns - Balatro style */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
      </div>
      
      {/* Multiple glowing orb effects for more visual interest */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle at center, rgba(252, 70, 107, 0.5), transparent 70%)",
          filter: "blur(80px)",
          animation: "pulse 8s ease-in-out infinite alternate"
        }}>
      </div>
      
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle at center, rgba(151, 50, 252, 0.6), transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse 10s ease-in-out infinite alternate-reverse"
        }}>
      </div>
      
      {/* Floating card decorations */}
      <div className="absolute top-20 right-[20%] w-32 h-44 rounded-lg opacity-20 animate-float-slow"
        style={{
          background: "radial-gradient(circle at center, rgba(252, 70, 107, 0.7), transparent 90%)", 
          boxShadow: "0 0 30px rgba(252, 70, 107, 0.5)"
        }}>
      </div>
      
      <div className="absolute bottom-32 left-[15%] w-28 h-40 rounded-lg opacity-20 animate-float-slow-reverse"
        style={{
          background: "radial-gradient(circle at center, rgba(151, 50, 252, 0.7), transparent 90%)",
          boxShadow: "0 0 30px rgba(151, 50, 252, 0.5)",
          animationDelay: "2s"
        }}>
      </div>
      
      {/* Card host form with enhanced Balatro style */}
      <div className="max-w-xl w-full bg-game-card rounded-2xl shadow-2xl p-8 md:p-10 border-4 border-game-neon-red border-opacity-40 relative z-10 overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute -inset-px rounded-2xl overflow-hidden opacity-40"
          style={{ 
            background: "radial-gradient(circle at 30% 30%, rgba(252, 70, 107, 0.7), transparent 70%)",
            filter: "blur(20px)"
          }}>
        </div>
        
        {/* Corner card chip decorations like Balatro */}
        <div className="absolute top-3 left-3 w-16 h-16 border-t-4 border-l-4 border-game-neon-red border-opacity-30 rounded-tl-xl"></div>
        <div className="absolute top-3 right-3 w-16 h-16 border-t-4 border-r-4 border-game-neon-red border-opacity-30 rounded-tr-xl"></div>
        <div className="absolute bottom-3 left-3 w-16 h-16 border-b-4 border-l-4 border-game-neon-red border-opacity-30 rounded-bl-xl"></div>
        <div className="absolute bottom-3 right-3 w-16 h-16 border-b-4 border-r-4 border-game-neon-red border-opacity-30 rounded-br-xl"></div>

        {/* Main content with better spacing */}
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display-fallback text-game-neon-red text-center mb-6 tracking-wider animate-glow">
            HOST A GAME
          </h1>
          
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-game-neon-red to-transparent mb-8 opacity-70"></div>

          <div className="mb-8 p-6 bg-black bg-opacity-40 rounded-xl border-2 border-game-neon-red border-opacity-30 text-white shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] flex items-center">
            <div className="w-12 h-12 rounded-full bg-game-neon-red bg-opacity-20 flex items-center justify-center flex-shrink-0 mr-5 border-2 border-game-neon-red border-opacity-40 shadow-neon-red">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-game-neon-red" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="font-game-fallback text-xl mb-2 text-game-neon-yellow">HOST INFORMATION</h2>
              <p className="text-base text-gray-200">
                As the host, you'll control the game flow and display the pyramid
                for all players. Hosts don't participate with their own cards.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateGame} className="space-y-8">
            <div>
              <label
                htmlFor="gameName"
                className="block text-xl font-game-fallback text-game-neon-yellow mb-3 tracking-wider animate-pulse-slow"
              >
                GAME NAME
              </label>
              <div className="relative group">
                {/* Input glow effect */}
                <div className="absolute -inset-0.5 bg-game-neon-yellow/20 rounded-xl blur-md group-hover:blur-lg group-hover:bg-game-neon-yellow/30 transition-all duration-300 animate-pulse-slow"></div>
                
                <div className="relative">
                  <input
                    id="gameName"
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full px-6 py-3 border-4 border-game-neon-yellow border-opacity-60 rounded-xl bg-black bg-opacity-70 text-white focus:border-game-neon-yellow focus:ring-2 focus:ring-game-neon-yellow focus:ring-opacity-70 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] text-3xl font-game-fallback tracking-wide"
                    placeholder="Enter a game name..."
                    required
                  />
                  
                  {/* Inner input highlights */}
                  <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-r from-transparent via-game-neon-yellow/30 to-transparent opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-game-neon-yellow/50"></div>
                    <div className="absolute top-0 right-6 w-4 h-4 bg-game-neon-yellow/30 rounded-full blur-sm"></div>
                  </div>
                </div>
                
              </div>
            </div>

            {error && (
              <div className="p-4 bg-black bg-opacity-40 rounded-xl border-2 border-game-neon-red border-opacity-70 shadow-neon-red">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-game-neon-red mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-game-neon-red font-medium">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div className="relative group mt-6">
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-game-neon-red/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse-slow opacity-70"></div>
              
              <button
                type="submit"
                disabled={isCreating}
                className="w-full btn-neon py-5 px-6 my-4 bg-black text-game-neon-red font-game-fallback tracking-wide text-2xl rounded-xl transition-all duration-300 group-hover:scale-[1.02] focus:outline-none border-2 border-game-neon-red relative overflow-hidden transform shadow-neon-red-sm group-hover:shadow-neon-red-lg"
              >
                {/* Button gradient overlay */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-game-neon-red to-transparent opacity-50"></div>
                
                {/* Corner card chip decorations like Balatro */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-game-neon-red border-opacity-70 rounded-tl-lg"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-game-neon-red border-opacity-70 rounded-tr-lg"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-game-neon-red border-opacity-70 rounded-bl-lg"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-game-neon-red border-opacity-70 rounded-br-lg"></div>
                
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-7 w-7 text-game-neon-red"
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
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    CREATE GAME
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 flex justify-between items-center">
            {/* Balatro-style Back to Home button */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-game-neon-purple/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <button
                onClick={() => router.push("/")}
                className="relative text-game-neon-purple hover:text-white transition-all flex items-center group px-5 py-3 rounded-lg bg-black/30 hover:bg-game-neon-purple/20 border border-game-neon-purple/30 group-hover:border-game-neon-purple/60"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 group-hover:translate-x-[-2px] transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="font-game-fallback">BACK TO HOME</span>
              </button>
            </div>

            {/* Balatro-style Join Game button */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-game-neon-blue/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <button
                onClick={() => router.push("/join")}
                className="relative flex items-center text-game-neon-blue hover:text-white transition-all group px-5 py-3 rounded-lg bg-black/30 hover:bg-game-neon-blue/20 border border-game-neon-blue/30 group-hover:border-game-neon-blue/60 transform rotate-1"
              >
                <span className="font-game-fallback mr-3">JOIN GAME</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-[2px] transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional decorative elements */}
      <div className="absolute -bottom-10 right-10 w-40 h-56 rounded-xl bg-game-card opacity-10 transform rotate-12"
        style={{
          background: "linear-gradient(135deg, rgba(252, 70, 107, 0.8), rgba(63, 94, 251, 0.8))"
        }}>
      </div>
      
      <div className="absolute -top-10 left-10 w-32 h-48 rounded-xl bg-game-card opacity-10 transform -rotate-12"
        style={{
          background: "linear-gradient(135deg, rgba(151, 50, 252, 0.8), rgba(252, 70, 107, 0.8))"
        }}>
      </div>
    </div>
  );
};

export default HostPage;
