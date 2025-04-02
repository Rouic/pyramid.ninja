// src/pages/join.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/layout/Layout";
import { useGame } from "../contexts/GameContext";
import { useAuth } from "../contexts/AuthContext";

const JoinPage: React.FC = () => {
  const router = useRouter();
  const { joinGame, loading, error } = useGame();
  const { userUid } = useAuth();

  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load name from local storage if available
  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setFormError(null);

    // Validate inputs
    if (!gameCode.trim()) {
      setFormError("Game code is required");
      return;
    }

    if (!playerName.trim()) {
      setFormError("Your name is required");
      return;
    }

    // Check if authenticated
    if (!userUid) {
      setFormError("Not authenticated. Please refresh the page and try again.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Join the game
      await joinGame(gameCode, playerName);

      // Store name in localStorage for future use
      localStorage.setItem("playerName", playerName);

      // Navigate to game page
      router.push(`/game/${gameCode.toUpperCase()}`);
    } catch (err) {
      console.error("Failed to join game:", err);
      setFormError(
        error ||
          "Failed to join game. Please check your game code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout pageTitle="Join Game">
      <div className="container mx-auto px-4 pt-8 pb-20">
        <div className="max-w-md mx-auto bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Enter Game Code to Join
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center p-2 bg-gray-100 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="text-gray-500 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Game Code (4 letters)"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center p-2 bg-gray-100 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="text-gray-500 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={playerName}
                    onChange={(e) =>
                      setPlayerName(e.target.value.toUpperCase())
                    }
                    maxLength={10}
                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {(formError || error) && (
                <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ${
                  isSubmitting || loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? "Joining..." : "Join Game"}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-blue-500 hover:text-blue-700 transition duration-300"
              >
                &larr; Back to Start
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JoinPage;
