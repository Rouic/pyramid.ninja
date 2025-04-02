// src/pages/host.tsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/layout/Layout";
import PlayerList from "../components/game/PlayerList";
import Pyramid from "../components/cards/Pyramid";
import { useGame } from "../contexts/GameContext";
import { getRandomTaunt, cardIndexToText } from "../lib/deckUtils";
import { Round, DisplayTransaction } from "../types";

const DEBUG = true;

const HostPage: React.FC = () => {
  const { createGame, gameId, gameData, players, startGame, selectCard } =
    useGame();

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [currentRow, setCurrentRow] = useState<number | null>(null);
  const [information, setInformation] = useState("Generating Game...");
  const [roundTransactions, setRoundTransactions] = useState<
    DisplayTransaction[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [drinkLog, setDrinkLog] = useState<{ name: string; drinks: number }[]>(
    []
  );

  useEffect(() => {
    // Check localStorage for game state
    if (gameId) {
      const localStarted = localStorage.getItem(`game_${gameId}_started`);
      if (localStarted === "true") {
        console.log("Found local state, starting game");
        setIsGameStarted(true);
      }
    }
  }, [gameId]);

  // Initialize game on component mount
  useEffect(() => {
    const initGame = async () => {
      if (!gameId) {
        try {
          await createGame();
          setInformation("Waiting for players to join...");
        } catch (error) {
          console.error("Failed to create game:", error);
          setInformation("Error creating game. Please try again.");
        }
      }
    };

    initGame();

    // Cleanup on unmount - could add code to end game here
    return () => {
      // Handle game cleanup
    };
  }, [createGame, gameId]);

  // Watch for game data changes
  useEffect(() => {
    if (gameData) {

      if (DEBUG) {
        console.log("Game data updated in host:", gameData);
        console.log("Meta data:", gameData["__pyramid.meta"]);
        console.log("Started value:", gameData["__pyramid.meta"]?.started);
      }

      // Check if game has started
      if (
        gameData["__pyramid.meta"] &&
        typeof gameData["__pyramid.meta"] === "object" &&
        gameData["__pyramid.meta"].started === true
      ) {
        console.log("Setting game started to true");
        setIsGameStarted(true);
      }

      // Check for game summary (end of game)
      if (gameData["__pyramid.summary"]) {
        setGameEnded(true);
        setInformation("That's the end of the game! Let's look at our cards!");
      }

      // Update current round information
      if (gameData["__pyramid.currentRound"]) {
        const { round_number, round_row, round_card } =
          gameData["__pyramid.currentRound"];
        setCurrentRound(round_number);
        setCurrentRow(round_row);
        setCurrentCard(round_card);

        // Generate taunt for current round
        setInformation(getRandomTaunt(round_number, gameId || ""));

        // Show modal
        setShowModal(true);

        // Process round transactions
        if (
          gameData["__pyramid.rounds"] &&
          gameData["__pyramid.rounds"][round_number] &&
          gameData["__pyramid.rounds"][round_number].round_transactions
        ) {
          processTransactions(
            gameData["__pyramid.rounds"][round_number],
            round_number,
            round_row
          );
        }
      } else if (isGameStarted && !showModal) {
        setInformation("Select another card from the pyramid to continue...");
      } else if (!isGameStarted && players.length > 0) {
        setInformation(
          players.length < 2
            ? "Waiting for more players..."
            : "Press Continue when ready..."
        );
      }
    }
  }, [gameData, gameId, players, showModal]);

  // Process transactions for display
  const processTransactions = (
    round: Round,
    roundNumber: number,
    rowNumber: number
  ) => {
    const transactions: DisplayTransaction[] = [];
    const drinks: { name: string; drinks: number }[] = [];

    round.round_transactions.forEach((transaction) => {
      // Find player names
      const fromPlayer = players.find((p) => p.uid === transaction.t_from);
      const toPlayer = players.find((p) => p.uid === transaction.t_to);

      if (fromPlayer && toPlayer) {
        // Add transaction to display list
        transactions.push({
          from_player: fromPlayer.name,
          to_player: toPlayer.name,
          result: transaction.status,
        });

        // Calculate drinks
        if (transaction.status === "accepted") {
          addToDrinkLog(drinks, toPlayer.name, rowNumber);
        } else if (transaction.status === "bullshit_wrong") {
          addToDrinkLog(drinks, fromPlayer.name, rowNumber * 2);
        } else if (transaction.status === "bullshit_correct") {
          addToDrinkLog(drinks, toPlayer.name, rowNumber * 2);
        }
      }
    });

    setRoundTransactions(transactions);
    setDrinkLog(drinks);
  };

  // Helper to update drink log
  const addToDrinkLog = (
    log: { name: string; drinks: number }[],
    name: string,
    drinks: number
  ) => {
    const existingEntry = log.find((entry) => entry.name === name);
    if (existingEntry) {
      existingEntry.drinks += drinks;
    } else {
      log.push({ name, drinks });
    }
  };

  // Handle starting the game
  const handleStartGame = async () => {
    if (gameId) {
      try {
        await startGame(gameId);

        // Manually force UI into game mode regardless of Firestore
        console.log("Manually forcing game to start in UI");
        setIsGameStarted(true);
        setInformation("Game is starting! Pick a card to begin...");

        // Save state to localStorage as backup
        localStorage.setItem(`game_${gameId}_started`, "true");
      } catch (error) {
        console.error("Failed to start game:", error);
      }
    }
  };

  // Handle card selection in pyramid
  const handleCardSelect = async (index: number) => {
    if (gameId && isGameStarted && !gameEnded) {
      try {
        await selectCard(gameId, index);
      } catch (error) {
        console.error("Failed to select card:", error);
      }
    }
  };

  // Handle closing the round modal
  const handleCloseModal = () => {
    setShowModal(false);
    setRoundTransactions([]);
    setDrinkLog([]);
  };

  // Get domain for display
  const domain =
    typeof window !== "undefined" ? window.location.hostname : "pyramid.ninja";

  return (
    <Layout pageTitle="Host Game">
      <div className="container mx-auto px-4 pt-6 pb-20">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden">
          {/* Game room header with code */}
          {gameId && (
            <div className="bg-indigo-800 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Room Code: {gameId}</h2>
              {gameData && (
                <div className="text-sm">
                  {gameData["__pyramid.deck"]?.length || 0} Cards Left •{" "}
                  {players.length} Players
                </div>
              )}
            </div>
          )}

          {/* Waiting for players screen */}
          {!isGameStarted ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-6">{information}</h2>

              {gameId && (
                <div className="mb-8">
                  <p className="text-lg mb-4">
                    Open <span className="font-bold">{domain}</span> on your
                    devices and enter{" "}
                    <span className="font-bold text-rose-600">{gameId}</span> to
                    join this game.
                  </p>

                  <div className="my-8">
                    <PlayerList players={players} displayMode="grid" />
                  </div>

                  {players.length > 1 && (
                    <button
                      onClick={handleStartGame}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full transition duration-300"
                    >
                      Continue
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2 inline"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              {/* Connected players */}
              <div className="mb-4 overflow-x-auto whitespace-nowrap py-2">
                <PlayerList
                  players={players}
                  displayMode="horizontal"
                  showDrinks={true}
                />
              </div>

              {/* Game information */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold">{information}</h3>
                {!gameEnded && (
                  <p className="text-gray-600">
                    Pick a card from below to continue...
                  </p>
                )}
                {gameEnded && (
                  <Link href="/">
                    <button className="mt-4 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300">
                      Start New Game
                    </button>
                  </Link>
                )}
              </div>

              {/* Pyramid display */}
              {gameData && gameData["__pyramid.cards"] && (
                <div className="mb-8 overflow-hidden">
                  <Pyramid
                    cards={gameData["__pyramid.cards"]}
                    onCardSelect={handleCardSelect}
                    isActive={isGameStarted && !showModal && !gameEnded}
                    gameEnded={gameEnded}
                    className="transform scale-90 md:scale-100"
                  />
                </div>
              )}
            </div>
          )}

          <div className="text-center pb-6">
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-700 transition duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              Exit Game
            </Link>
          </div>
        </div>
      </div>

      {/* Round Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-4">
                Round {currentRound}, Row {currentRow} - it&apos;s{" "}
                {currentCard !== null ? cardIndexToText(currentCard) : ""}!
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Card display */}
                <div className="flex justify-center items-center bg-gray-800 rounded-lg p-4">
                  {currentCard !== null && (
                    <div className="transform scale-75 md:scale-100">
                      {/* We'd use our Card component here, but it's simplified for the modal */}
                      <div className="w-64 h-96 bg-white rounded-lg shadow-lg relative flex items-center justify-center">
                        <span className="text-4xl">
                          {cardIndexToText(currentCard)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Round log */}
                <div>
                  <p className="mb-2">
                    {information}{" "}
                    <span className="text-gray-400">
                      The card on the left is currently in play. Use your device
                      to call a drink to another player.
                    </span>
                  </p>

                  {roundTransactions.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Round Log:</h4>
                      <div className="bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {roundTransactions.map((transaction, index) => (
                          <div
                            key={index}
                            className="mb-2 pb-2 border-b border-gray-700 last:border-0"
                          >
                            <div className="flex items-center">
                              <img
                                src={`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/${transaction.from_player}.png`}
                                alt={transaction.from_player}
                                className="w-6 h-6 rounded-full mr-1"
                              />
                              <span className="font-semibold">
                                {transaction.from_player}
                              </span>
                              <span className="mx-1">has called on</span>
                              <img
                                src={`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/${transaction.to_player}.png`}
                                alt={transaction.to_player}
                                className="w-6 h-6 rounded-full mr-1"
                              />
                              <span className="font-semibold">
                                {transaction.to_player}
                              </span>
                              <span className="ml-1">to drink!</span>
                            </div>

                            {transaction.result === null && (
                              <div className="text-sm text-gray-400 ml-6 mt-1">
                                Waiting on response from {transaction.to_player}
                                ...
                              </div>
                            )}

                            {transaction.result === "accepted" && (
                              <div className="text-sm text-green-400 ml-6 mt-1">
                                {transaction.to_player}{" "}
                                <span className="font-bold">ACCEPTED</span> the
                                drinks!
                              </div>
                            )}

                            {transaction.result === "bullshit" && (
                              <div className="text-sm text-rose-400 ml-6 mt-1">
                                {transaction.to_player} has called{" "}
                                <span className="font-bold">BULLSHIT!</span>{" "}
                                Waiting for {transaction.from_player} to show a
                                card...
                              </div>
                            )}

                            {transaction.result === "bullshit_wrong" && (
                              <div className="text-sm text-rose-400 ml-6 mt-1">
                                {transaction.to_player} has called{" "}
                                <span className="font-bold">BULLSHIT!</span>{" "}
                                {transaction.from_player} turned over a card
                                with the{" "}
                                <span className="font-bold text-red-500">
                                  WRONG
                                </span>{" "}
                                rank!
                              </div>
                            )}

                            {transaction.result === "bullshit_correct" && (
                              <div className="text-sm text-rose-400 ml-6 mt-1">
                                {transaction.to_player} has called{" "}
                                <span className="font-bold">BULLSHIT!</span>{" "}
                                {transaction.from_player} turned over a card
                                with the{" "}
                                <span className="font-bold text-green-500">
                                  CORRECT
                                </span>{" "}
                                rank!
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 mt-4">
                      No updates yet...
                    </div>
                  )}
                </div>
              </div>

              {/* Round results */}
              {drinkLog.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                  <h4 className="font-semibold mb-2">Round Results:</h4>
                  <p>
                    {drinkLog.map((entry, index) => (
                      <span key={index}>
                        <span className="inline-flex items-center">
                          <img
                            src={`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/${entry.name}.png`}
                            alt={entry.name}
                            className="w-6 h-6 rounded-full mr-1"
                          />
                          <span className="font-semibold">{entry.name}</span>
                        </span>{" "}
                        drinks <span className="font-bold">{entry.drinks}</span>
                        {index < drinkLog.length - 1 ? ", " : "!"}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={handleCloseModal}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300"
                >
                  Finish Round
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HostPage;
