import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { usePlayerContext } from "../context/PlayerContext";
import { v4 as uuidv4 } from "uuid";
import { CodeBracketIcon, FaceSmileIcon, NumberedListIcon } from "@heroicons/react/16/solid";
import Head from "next/head";
import Link from "next/link";

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
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      <Head>
        <title>Join a Game - Pyramid.Ninja</title>
        <meta
          name="description"
          content="Join an existing Pyramid drinking game with friends. Enter your name and the game ID to start playing!"
        />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Join a Game - Pyramid.Ninja",
              description:
                "Join an existing Pyramid drinking game with friends. Enter your name and the game ID to start playing!",
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": "https://pyramid.ninja/join",
              },
            }),
          }}
        />
      </Head>
      {/* Background patterns - Balatro style */}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Multiple glowing orb effects */}
      <div
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle at center, rgba(50, 135, 252, 0.5), transparent 70%)",
          filter: "blur(80px)",
          animation: "pulse 8s ease-in-out infinite alternate",
        }}
      ></div>

      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(70, 191, 252, 0.6), transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse 10s ease-in-out infinite alternate-reverse",
        }}
      ></div>

      {/* Floating card decorations - hide on smaller screens */}
      <div
        className="absolute top-20 right-[20%] w-32 h-44 rounded-lg opacity-20 animate-float-slow hidden sm:block"
        style={{
          background:
            "radial-gradient(circle at center, rgba(70, 191, 252, 0.7), transparent 90%)",
          boxShadow: "0 0 30px rgba(70, 191, 252, 0.5)",
        }}
      ></div>

      <div
        className="absolute bottom-32 left-[15%] w-28 h-40 rounded-lg opacity-20 animate-float-slow-reverse hidden sm:block"
        style={{
          background:
            "radial-gradient(circle at center, rgba(50, 135, 252, 0.7), transparent 90%)",
          boxShadow: "0 0 30px rgba(50, 135, 252, 0.5)",
          animationDelay: "2s",
        }}
      ></div>

      <div className="flex flex-col">
        <div className="mx-auto mb-6">
          <Link className="relative" href="/">
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center">
                <img
                  src="/icon.png"
                  alt="Pyramid Ninja"
                  className="h-12 w-12 mr-3"
                />
                <h1 className="text-lg font-display text-game-neon-yellow tracking-tight xs:tracking-normal sm:tracking-wider mb-0 animate-glow font-display-fallback w-full px-2">
                  PYRAMID.NINJA
                </h1>
              </div>
            </div>
          </Link>
        </div>

        {/* Card join form with enhanced Balatro style */}
        <div className="w-full max-w-xl bg-game-card rounded-2xl shadow-2xl p-4 sm:p-8 md:p-10 border-4 border-game-neon-blue border-opacity-40 relative z-10 overflow-hidden md:mx-4">
          {/* Card glow effect */}

          <div
            className="absolute -inset-px rounded-2xl overflow-hidden opacity-40"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(50, 135, 252, 0.7), transparent 70%)",
              filter: "blur(20px)",
            }}
          ></div>

          {/* Corner card chip decorations */}
          <div className="absolute top-3 left-3 w-8 h-8 sm:w-16 sm:h-16 border-t-2 sm:border-t-4 border-l-2 sm:border-l-4 border-game-neon-blue border-opacity-30 rounded-tl-xl"></div>
          <div className="absolute top-3 right-3 w-8 h-8 sm:w-16 sm:h-16 border-t-2 sm:border-t-4 border-r-2 sm:border-r-4 border-game-neon-blue border-opacity-30 rounded-tr-xl"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 sm:w-16 sm:h-16 border-b-2 sm:border-b-4 border-l-2 sm:border-l-4 border-game-neon-blue border-opacity-30 rounded-bl-xl"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 sm:w-16 sm:h-16 border-b-2 sm:border-b-4 border-r-2 sm:border-r-4 border-game-neon-blue border-opacity-30 rounded-br-xl"></div>

          {/* Main content with better spacing */}
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display-fallback text-game-neon-blue text-center mb-4 sm:mb-6 tracking-wider animate-glow">
              JOIN A GAME
            </h1>

            <div className="w-full h-1 bg-gradient-to-r from-transparent via-game-neon-blue to-transparent mb-4 sm:mb-8 opacity-70"></div>

            <form onSubmit={handleJoinGame} className="space-y-4 sm:space-y-8">
              <div>
                <label
                  htmlFor="playerName"
                  className="block text-sm sm:text-base font-game-fallback text-white mb-2 sm:mb-3 tracking-wider flex items-center"
                >
                  <span className="bg-game-neon-blue bg-opacity-20 w-6 h-6 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg mr-2 shadow-inner">
                    <FaceSmileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                  </span>
                  YOUR NAME
                </label>
                <div className="relative">
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 sm:border-4 border-game-neon-blue border-opacity-50 rounded-xl bg-black bg-opacity-40 text-white focus:border-game-neon-blue focus:ring-2 focus:ring-game-neon-blue focus:ring-opacity-50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] text-base sm:text-lg"
                    placeholder="Enter your name..."
                    required
                  />
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(50, 135, 252, 0.1), transparent 10%)",
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="gameId"
                  className="block text-sm sm:text-base font-game-fallback text-white mb-2 sm:mb-3 tracking-wider flex items-center"
                >
                  <span className="bg-game-neon-blue bg-opacity-20 w-6 h-6 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg mr-2 shadow-inner">
                    <CodeBracketIcon className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                  </span>
                  GAME ID
                </label>
                <div className="relative">
                  <input
                    id="gameId"
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value.toUpperCase())}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 sm:border-4 border-game-neon-blue border-opacity-50 rounded-xl bg-black bg-opacity-40 text-white uppercase focus:border-game-neon-blue focus:ring-2 focus:ring-game-neon-blue focus:ring-opacity-50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] text-base sm:text-lg font-mono font-semibold tracking-wider"
                    placeholder="Enter game ID..."
                    required
                  />
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(50, 135, 252, 0.1), transparent 10%)",
                    }}
                  ></div>
                </div>
              </div>

              {error && (
                <div className="p-3 sm:p-4 bg-black bg-opacity-40 rounded-xl border-2 border-game-neon-red border-opacity-70 shadow-neon-red">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-game-neon-red mr-2 sm:mr-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-game-neon-red font-medium text-sm sm:text-base">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isJoining}
                className="w-full btn-neon py-3 sm:py-5 px-4 sm:px-6 bg-game-neon-blue text-white font-game-fallback tracking-wide text-lg sm:text-xl rounded-xl transition-all duration-300 hover:shadow-neon-blue hover:scale-105 focus:outline-none border-2 sm:border-4 border-opacity-50 border-game-neon-blue relative overflow-hidden mt-2"
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent 70%)",
                  }}
                ></div>
                {isJoining ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 sm:h-6 sm:w-6 text-white"
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
                    JOINING GAME...
                  </span>
                ) : (
                  "JOIN GAME"
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <button
                onClick={() => router.push("/")}
                className="text-white hover:text-game-neon-purple transition-all flex items-center group px-4 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-black hover:bg-opacity-30 border-2 border-white border-opacity-10 text-sm sm:text-base"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:translate-x-[-2px] transition-transform"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-game-fallback">BACK TO HOME</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional decorative card elements - hide on mobile */}
      <div
        className="absolute -bottom-10 right-10 w-40 h-56 rounded-xl bg-game-card opacity-10 transform rotate-12 hidden sm:block"
        style={{
          background:
            "linear-gradient(135deg, rgba(50, 135, 252, 0.8), rgba(70, 191, 252, 0.8))",
        }}
      ></div>

      <div
        className="absolute -top-10 left-10 w-32 h-48 rounded-xl bg-game-card opacity-10 transform -rotate-12 hidden sm:block"
        style={{
          background:
            "linear-gradient(135deg, rgba(70, 191, 252, 0.8), rgba(50, 135, 252, 0.8))",
        }}
      ></div>
    </div>
  );
};

export default JoinPage;
