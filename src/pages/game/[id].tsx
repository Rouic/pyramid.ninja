// src/pages/game/[id].tsx
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
import {
  dealCardsToPlayer,
  initializeGameDeck,
  revealPyramidCard,
} from "../../lib/firebase/gameCards";
import {
  DrinkAssignment,
  subscribeToGameStateDetails,
  startMemorizationPhase,
} from "../../lib/firebase/gameState";
import GamePyramid from "../../components/GamePyramid";
import PlayerHand from "../../components/PlayerHand";
import MemorizeTimer from "../../components/MemorizeTimer";
import DrinkAssignmentPanel from "../../components/DrinkAssignmentPanel";
import { GameControls } from "../../components/GameControls";
import ActivityLog from "../../components/ActivityLog";
import { usePlayerContext } from "../../context/PlayerContext";

const GamePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { playerId, playerName, isHost, setIsHost } = usePlayerContext();

  const [gameData, setGameData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<string>("waiting");
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [memorizationEndTime, setMemorizationEndTime] = useState<Date | null>(
    null
  );
  const [drinkAssignments, setDrinkAssignments] = useState<DrinkAssignment[]>(
    []
  );
  const [currentPyramidCard, setCurrentPyramidCard] = useState<any>(null);
  const [currentRowNumber, setCurrentRowNumber] = useState(0);
  const [allCardsDealt, setAllCardsDealt] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // New state to track which card is being challenged (for flipping)
  const [challengedCardIndex, setChallengedCardIndex] = useState<number>(-1);
  const [isDeckEmpty, setIsDeckEmpty] = useState(false);

  useEffect(() => {
    if (gameData && gameData.deck && gameData.deck.cards) {
      setIsDeckEmpty(gameData.deck.cards.length === 0);
    }
  }, [gameData]);

  // Load game data
  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const gameRef = doc(db, "games", id);

    // Initial fetch to check if player is allowed
    getDoc(gameRef)
      .then((docSnap) => {
        if (!docSnap.exists()) {
          setError("Game not found");
          setIsLoading(false);
          return;
        }

        const data = docSnap.data();

        // Check if player is in the game or is host
        const players = data.players || [];
        const isHostUser = data.hostId === playerId;

        if (!isHostUser && !players.some((p: any) => p.id === playerId)) {
          setError("You are not a player in this game");
          setIsLoading(false);
          return;
        }

        // Check if player is host
        setIsHost(isHostUser);

        // Subscribe to detailed game state updates
        const unsubscribe = subscribeToGameStateDetails(id, (data) => {
          setGameData(data);
          setGameState(data.gameState || "waiting");
          setDrinkAssignments(data.drinkAssignments || []);
          setAllCardsDealt(data.allCardsDealt || false);

          // Update current round
          if (data.currentRound) {
            setCurrentRound(data.currentRound);
          }

          // Handle memorization timer
          if (data.gameState === "memorizing" && data.memorizeEndTime) {
            setMemorizationEndTime(new Date(data.memorizeEndTime));
          } else {
            setMemorizationEndTime(null);
          }

          // Handle current pyramid card
          if (data.currentCardIndex !== undefined && data.pyramidCards) {
            setCurrentPyramidCard(data.pyramidCards[data.currentCardIndex]);

            // Calculate current row
            let cardCount = 0;
            let rowNum = 0;

            while (cardCount <= data.currentCardIndex) {
              rowNum++;
              cardCount += rowNum;
            }

            // Row number from bottom, for drink count
            setCurrentRowNumber(
              data.pyramidCards.length > 0
                ? Math.sqrt(2 * data.pyramidCards.length + 0.25) -
                    0.5 -
                    rowNum +
                    1
                : 0
            );
          }

          setIsLoading(false);
          setIsStartingGame(false);
        });

        return () => unsubscribe();
      })
      .catch((err) => {
        console.error("Error loading game:", err);
        setError("Failed to load game");
        setIsLoading(false);
      });
  }, [id, playerId, setIsHost]);

  const handleStartGame = useCallback(async () => {
    if (
      !id ||
      typeof id !== "string" ||
      !isHost ||
      isStartingGame ||
      gameState !== "waiting"
    )
      return;

    setIsStartingGame(true);

    try {
      console.log("Starting game...");

      // Initialize deck and pyramid
      const rowCount = 5; // 5 rows in the pyramid
      await initializeGameDeck(id, rowCount);
      console.log("Game initialized with deck and pyramid");

      // Deal cards to all players (skip host)
      const players = gameData.players || [];
      for (const player of players) {
        // Skip dealing cards to the host
        if (player.id !== gameData.hostId) {
          console.log(`Dealing cards to player ${player.id}`);
          await dealCardsToPlayer(id, player.id, 5);
        }
      }

      // Mark all cards as dealt
      await updateDoc(doc(db, "games", id), {
        allCardsDealt: true,
        gameState: "ready", // Change to 'ready' state
      });

      console.log("Game ready! Players can now start memorizing cards.");
    } catch (error) {
      console.error("Error starting game:", error);
      setError(
        `Failed to start game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsStartingGame(false);
    }
  }, [id, isHost, gameData, gameState, isStartingGame]);

  const handleStartMemorizing = useCallback(async () => {
    if (!id || typeof id !== "string") return;

    try {
      await startMemorizationPhase(id);
    } catch (error) {
      console.error("Error starting memorization phase:", error);
    }
  }, [id]);

  const handleRevealCard = useCallback(
    async (cardIndex: number) => {
      if (!id || typeof id !== "string" || !isHost || gameState !== "playing")
        return;

      try {
        await revealPyramidCard(id, cardIndex);
        // Update round number
        setCurrentRound((prev) => prev + 1);
      } catch (error) {
        console.error("Error revealing card:", error);
      }
    },
    [id, isHost, gameState]
  );

  // Handler for when a player is challenged and needs to show a card
  const handleChallengeCard = useCallback((cardIndex: number) => {
    setChallengedCardIndex(cardIndex);
  }, []);

  const renderNewCardAlert = () => {
    if (
      !gameData ||
      !gameData.newCardTimers ||
      Object.keys(gameData.newCardTimers).length === 0
    ) {
      return null;
    }

    return (
      <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-xs">
        <h4 className="font-bold mb-1">New Card!</h4>
        <p>You have a new card. Memorize it before it's hidden again!</p>
        <div className="mt-2 bg-green-500 h-2 rounded-full overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-1000"
            style={{
              width: `${(gameData.newCardTimers.timeLeft / 15) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    );
  };

  {
    isDeckEmpty && (
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-yellow-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            Deck is empty! Any cards you reveal during challenges won't be
            replaced.
          </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <svg
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Error
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Determine drinks for current row
  const drinksForCurrentRow = Math.max(1, currentRowNumber);

  // Render different UIs for host and players
  if (isHost) {
    // Host View - shows the pyramid and game controls
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-8">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          {/* Game header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {gameData?.name || "Pyramid Game"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Game ID: <span className="font-mono">{id}</span> •
                  <span className="ml-1 font-medium text-purple-600 dark:text-purple-400">
                    Host View
                  </span>
                </p>
              </div>

              {gameState === "waiting" && (
                <button
                  className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    isStartingGame
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                >
                  {isStartingGame ? (
                    <span className="flex items-center">
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
                      Starting...
                    </span>
                  ) : (
                    "Start Game"
                  )}
                </button>
              )}

              {gameState === "playing" && (
                <div className="flex items-center gap-4">
                  <div className="py-2 px-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      Current Drink Value
                    </div>
                    <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                      {drinksForCurrentRow} drink
                      {drinksForCurrentRow !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}

              {gameState === "ended" && (
                <div className="py-2 px-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">
                    Game Complete!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game content - two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Pyramid */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Pyramid
                </h2>

                {gameState === "waiting" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <svg
                      className="h-16 w-16 mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <p className="text-lg">
                      Click "Start Game" to begin the pyramid game
                    </p>
                  </div>
                ) : (
                  <GamePyramid
                    gameId={id as string}
                    rows={5}
                    isGameStarted={gameState !== "waiting"}
                    highlightCurrentCard={currentPyramidCard?.id}
                    drinksForCurrentRow={drinksForCurrentRow}
                    canRevealCards={gameState === "playing"}
                    onRevealCard={handleRevealCard}
                  />
                )}
              </div>

              {/* Activity Log - Only for host during gameplay */}
              {(gameState === "playing" || gameState === "ended") && (
                <ActivityLog
                  assignments={drinkAssignments}
                  players={gameData?.players || []}
                  roundNumber={currentRound}
                  currentCardRank={currentPyramidCard?.rank}
                />
              )}
            </div>

            {/* Right column - Game controls, player list */}
            <div className="lg:col-span-1">
              {/* Game Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Game Controls
                </h2>
                <GameControls
                  gameId={id as string}
                  currentPhase={gameState}
                  isHost={isHost}
                  onStartMemorization={handleStartMemorizing}
                />
              </div>

              {/* Player list */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Players
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {(gameData?.players || []).map((player: any) => (
                    <div
                      key={player.id}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-800 dark:text-blue-200 font-bold mb-2">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Player View - focuses on their cards and drink assignments
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-8">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          {/* Game header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {gameData?.name || "Pyramid Game"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Game ID: <span className="font-mono">{id}</span> •
                  <span className="ml-1">
                    Playing as <span className="font-medium">{playerName}</span>
                  </span>
                </p>
              </div>

              {gameState === "memorizing" && memorizationEndTime && (
                <MemorizeTimer endTime={memorizationEndTime} />
              )}

              {gameState === "playing" && currentPyramidCard && (
                <div className="py-2 px-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Current Card
                  </div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {currentPyramidCard.rank} ({drinksForCurrentRow} drink
                    {drinksForCurrentRow !== 1 ? "s" : ""})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Player game area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            {gameState === "waiting" ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg
                  className="h-16 w-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg">
                  Waiting for the host to start the game...
                </p>
              </div>
            ) : (
              <>
                {/* Game controls for player readiness */}
                <div className="mb-6">
                  <GameControls
                    gameId={id as string}
                    currentPhase={gameState}
                    isHost={isHost}
                    onStartMemorization={handleStartMemorizing}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

                {/* Drink assignments panel */}
                {gameState === "playing" && (
                  <DrinkAssignmentPanel
                    gameId={id as string}
                    assignments={drinkAssignments}
                    players={gameData?.players || []}
                    currentPlayerId={playerId}
                    isHost={isHost}
                    currentCardRank={currentPyramidCard?.rank}
                    drinkCount={drinksForCurrentRow}
                    onChallengeCard={handleChallengeCard}
                  />
                )}

                {renderNewCardAlert()}

                {/* Player's hand */}
                <PlayerHand
                  gameId={id as string}
                  isGameStarted={gameState !== "waiting"}
                  showFaceUp={
                    gameState === "memorizing" || gameState === "ended"
                  }
                  highlightCurrentRank={currentPyramidCard?.rank}
                  allowCardFlip={gameState === "playing"} // Only allow flipping during gameplay
                  challengedCardIndex={challengedCardIndex} // Pass the challenged card index
                />
              </>
            )}
          </div>

          {/* Game tips */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Game Tips
            </h2>

            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-2">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Watch the host's screen to see which card is currently shown
                  in the pyramid
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-2">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Cards matching the current pyramid card will be highlighted in
                  yellow
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-2">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Hold down on a matching card to peek at it during gameplay
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-2">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  If you challenge someone successfully, they drink double. If
                  you fail, you drink double!
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
};

export default GamePage;
