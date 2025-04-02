import React, { useState, useEffect, useCallback, useRef } from "react";
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
  revealNextPyramidCard,
} from "../../lib/firebase/gameState";
import GamePyramid from "../../components/GamePyramid";
import PlayerHand from "../../components/PlayerHand";
import MemorizeTimer from "../../components/MemorizeTimer";
import DrinkAssignmentPanel from "../../components/DrinkAssignmentPanel";
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
  const [playerReadyToMemorize, setPlayerReadyToMemorize] = useState(false);
  const [allCardsDealt, setAllCardsDealt] = useState(false);

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
    if (!id || typeof id !== "string" || gameState !== "ready") return;

    setPlayerReadyToMemorize(true);

    try {
      await startMemorizationPhase(id);
    } catch (error) {
      console.error("Error starting memorization phase:", error);
      setPlayerReadyToMemorize(false);
    }
  }, [id, gameState]);

  const handleRevealCard = useCallback(
    async (cardIndex: number) => {
      if (!id || typeof id !== "string" || !isHost || gameState !== "playing")
        return;

      try {
        await revealPyramidCard(id, cardIndex);
      } catch (error) {
        console.error("Error revealing card:", error);
      }
    },
    [id, isHost, gameState]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          onClick={() => router.push("/")}
        >
          Back to Home
        </button>
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
        <div className="max-w-6xl mx-auto px-4">
          {/* Game header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {gameData?.name || "Pyramid Game"}{" "}
                <span className="text-purple-600">(Host View)</span>
              </h1>

              {gameState === "waiting" && (
                <button
                  className={`px-4 py-2 ${
                    isStartingGame
                      ? "bg-gray-400"
                      : "bg-green-500 hover:bg-green-600"
                  } text-white rounded-lg`}
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
                  <div className="text-md font-medium">
                    Current drink value:{" "}
                    <span className="text-xl font-bold text-yellow-500">
                      {drinksForCurrentRow}
                    </span>
                  </div>
                </div>
              )}

              {gameState === "ended" && (
                <div className="text-xl font-bold text-green-500">
                  Game Over!
                </div>
              )}
            </div>
          </div>

          {/* Player list */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Players in Game
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                You (Host)
              </div>

              {(gameData?.players || []).map((player: any) => (
                <div
                  key={player.id}
                  className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                >
                  {player.name}
                </div>
              ))}
            </div>
          </div>

          {/* Game area - only for host */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 flex flex-col">
            {gameState === "waiting" ? (
              <div className="text-center py-12 text-gray-500">
                Click 'Start Game' when everyone has joined
              </div>
            ) : (
              <>
                {/* Pyramid display area - host view */}
                <GamePyramid
                  gameId={id as string}
                  rows={5}
                  isGameStarted={gameState !== "waiting"}
                  highlightCurrentCard={currentPyramidCard?.id}
                  drinksForCurrentRow={drinksForCurrentRow}
                  canRevealCards={gameState === "playing"}
                  onRevealCard={handleRevealCard}
                />

                {/* Game state information */}
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Game Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Game State:</span>
                      <span
                        className="ml-2 px-2 py-1 rounded-lg text-sm font-medium 
                        {gameState === 'playing' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}"
                      >
                        {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
                      </span>
                    </div>

                    {currentPyramidCard && (
                      <div>
                        <span className="font-medium">Current Card:</span>
                        <span className="ml-2 px-2 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {currentPyramidCard.rank} of{" "}
                          {currentPyramidCard.suit.charAt(0).toUpperCase() +
                            currentPyramidCard.suit.slice(1)}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="font-medium">Players with cards:</span>
                      <span className="ml-2">
                        {(gameData?.players || []).length}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">Current drink value:</span>
                      <span className="ml-2 font-bold text-yellow-500">
                        {drinksForCurrentRow}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Host instructions */}
                {gameState === "memorizing" && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Memorization Phase
                    </h3>
                    <p>
                      Players are memorizing their cards. They have 10 seconds
                      to remember their cards before play begins.
                    </p>
                  </div>
                )}

                {gameState === "playing" && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Playing Instructions
                    </h3>
                    <p className="mb-2">
                      Click on the pyramid cards to reveal them one by one.
                    </p>
                    <p>
                      After revealing a card, players can assign drinks based on
                      having that card in their hand (or bluffing).
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // Player View - focuses on their cards and drink assignments
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Game header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {gameData?.name || "Pyramid Game"}{" "}
                <span className="text-sm font-normal text-gray-500">
                  (Look at host's screen for the pyramid)
                </span>
              </h1>

              {gameState === "ready" &&
                allCardsDealt &&
                !playerReadyToMemorize && (
                  <button
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                    onClick={handleStartMemorizing}
                  >
                    Memorize My Cards
                  </button>
                )}

              {gameState === "memorizing" && memorizationEndTime && (
                <MemorizeTimer endTime={memorizationEndTime} />
              )}

              {gameState === "playing" && currentPyramidCard && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg">
                  Current Card:{" "}
                  <span className="font-bold">{currentPyramidCard.rank}</span> (
                  {drinksForCurrentRow} drinks)
                </div>
              )}
            </div>
          </div>

          {/* Player info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {playerName} (You)
              </div>

              <div className="text-sm text-gray-500">
                Game Code: <span className="font-mono font-medium">{id}</span>
              </div>
            </div>
          </div>

          {/* Player game area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 flex flex-col">
            {gameState === "waiting" ? (
              <div className="text-center py-12 text-gray-500">
                Waiting for the host to start the game...
              </div>
            ) : gameState === "ready" && !playerReadyToMemorize ? (
              <div className="text-center py-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  Ready to Play?
                </h3>
                <p className="mb-4 text-yellow-700 dark:text-yellow-300">
                  You'll have 10 seconds to memorize your cards.
                </p>
                <button
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold"
                  onClick={handleStartMemorizing}
                >
                  I'm Ready to Memorize
                </button>
              </div>
            ) : (
              <>
                {/* Instructions reminder */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                  <div className="flex items-start">
                    <div className="mr-3 text-blue-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800 dark:text-blue-200">
                        Game Info
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {gameState === "memorizing"
                          ? "Memorize your cards now! They'll be hidden after the timer."
                          : "Watch the host's screen for pyramid cards. Your matching cards are highlighted."}
                      </p>
                    </div>
                  </div>
                </div>

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
                  />
                )}

                {/* Player's hand */}
                <PlayerHand
                  gameId={id as string}
                  isGameStarted={gameState !== "waiting"}
                  showFaceUp={
                    gameState === "memorizing" || gameState === "ended"
                  }
                  highlightCurrentRank={currentPyramidCard?.rank}
                />
              </>
            )}
          </div>

          {/* Mobile tips */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Playing Tips
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
              <li>
                Look at the host's screen to see which card is currently shown
                in the pyramid
              </li>
              <li>Your matching cards will be highlighted in yellow</li>
              <li>
                You can hold down on a card to peek at it if it matches the
                current pyramid card
              </li>
              <li>
                If someone assigns you drinks, you can accept or challenge them
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
};

export default GamePage;
