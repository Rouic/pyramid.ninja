// src/pages/game/[gameId].tsx
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/layout/Layout";
import PlayerHand from "../../components/cards/PlayerHand";
import CallPlayer from "../../components/game/CallPlayer";
import { useGame } from "../../contexts/GameContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSound } from "../../hooks/useSound";
import { Player, PlayerCard } from "../../types";
import { cardIndexToText } from "../../lib/deckUtils";

const GamePage: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  const { gameData, players, markCardsAsSeen, showBullshitCard, checkCardMatch } = useGame();
  const { userUid } = useAuth();
  const { playSound } = useSound();

  // State for game
  const [myName, setMyName] = useState<string | null>(null);
  const [myCards, setMyCards] = useState<PlayerCard[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [instruction, setInstruction] = useState(
    "Waiting for host to continue..."
  );
  const [showAllCards, setShowAllCards] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [currentRow, setCurrentRow] = useState<number | null>(null);
  const [currentCard, setCurrentCard] = useState<string | null>(null);
  const [bullshitMode, setBullshitMode] = useState(false);
  const [drinkNumber, setDrinkNumber] = useState(0);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [continueButton, setContinueButton] = useState(false);
  const [allowCalling, setAllowCalling] = useState(false);
  const [allowViewAll, setAllowViewAll] = useState(false);
  const [allowNewCard, setAllowNewCard] = useState(false);
  const [allowDecision, setAllowDecision] = useState(false);
  const [currentDecision, setCurrentDecision] = useState<{
    from_player: string;
    to_player: string;
  } | null>(null);
  const [transactionIteration, setTransactionIteration] = useState(-1);
  const [gameEnded, setGameEnded] = useState(false);

  // Timer for countdown
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load player name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setMyName(savedName);
    }
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      // Countdown is running
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => {
        if (countdownRef.current) clearTimeout(countdownRef.current);
      };
    } else if (countdown === 0 && showAllCards) {
      // Time's up, hide cards
      setShowAllCards(false);

      // Mark cards as seen in the database
      if (gameData && userUid && routeGameId) {
        // Call the new function to mark cards as seen in Firebase
        markCardsAsSeen(routeGameId.toString(), userUid)
          .then(() => {
            console.log("Cards marked as seen in Firebase");
            // Update local state to match
            setMyCards((prev) => prev.map((card) => ({ ...card, seen: true })));
            setInstruction("Waiting for host to continue...");
          })
          .catch((error) => {
            console.error("Error marking cards as seen:", error);
          });
      }
    }
  }, [
    countdown,
    showAllCards,
    gameData,
    userUid,
    routeGameId,
    markCardsAsSeen,
  ]);

  // Process game data updates
  useEffect(() => {
    if (!gameData || !userUid || !routeGameId) return;

    // Get player data
    const playerData = gameData[userUid];
    if (!playerData) return;

    // Update cards
    if (playerData.cards) {
      setMyCards(playerData.cards);
    }

    // Check if game has started
    if (gameData["__pyramid.meta"].started) {
      setGameStarted(true);

      // Check if player has viewed their initial cards yet
      const hasViewedInitialCards =
        playerData.cards?.every((card) => card.seen) || false;

      if (!hasViewedInitialCards && !gameData["__pyramid.currentRound"]) {
        setInstruction(
          "Press the button below to view your cards. You will have just 10 seconds to remember them! Tip: You can drag your cards around to re-order them."
        );
        setAllowViewAll(true);
        setAllowCalling(false);
      }
    } else {
      // Game hasn't started yet
      setInstruction("Waiting for host to continue...");

      // Check if player can trigger game start (first player to join)
      if (players.length > 1) {
        setContinueButton(true);
      } else {
        setContinueButton(false);
      }
    }

    // Handle current round information
    if (gameData["__pyramid.currentRound"]) {
      const { round_number, round_row, round_card } =
        gameData["__pyramid.currentRound"];
      setCurrentRound(round_number);
      setCurrentRow(round_row);
      setCurrentCard(cardIndexToText(round_card));

      setAllowViewAll(false);
      setAllowDecision(false);

      // Check if the player can make calls in this round
      let canCall = true;

      // Check if transactions exist for this round
      if (
        gameData["__pyramid.rounds"] &&
        gameData["__pyramid.rounds"][round_number] &&
        gameData["__pyramid.rounds"][round_number].round_transactions
      ) {
        const transactions =
          gameData["__pyramid.rounds"][round_number].round_transactions;

        // Check if player has already made a call this round
        const hasCalledThisRound = transactions.some(
          (t) => t.t_from === userUid
        );

        if (hasCalledThisRound) {
          canCall = false;
          setInstruction(
            "You have sent drinks already - please wait for updates or the round to finish..."
          );
        }

        // Calculate drinks for this round
        let roundDrinks = 0;

        transactions.forEach((transaction, index) => {
          // Handle incoming drink requests
          if (
            transaction.t_to === userUid &&
            transaction.status === "waiting"
          ) {
            const fromPlayer = players.find(
              (p) => p.uid === transaction.t_from
            );
            if (fromPlayer) {
              setCurrentDecision({
                from_player: fromPlayer.name,
                to_player: myName || "You",
              });
              setTransactionIteration(index);

              // Play notification sound
              playSound("notification");

              setInstruction("drink");
              setAllowDecision(true);
              setAllowCalling(false);
              canCall = false;
            }
          }

          // Handle bullshit calls that need response
          if (
            transaction.t_from === userUid &&
            transaction.status === "bullshit"
          ) {
            const toPlayer = players.find((p) => p.uid === transaction.t_to);
            if (toPlayer) {
              setCurrentDecision({
                from_player: myName || "You",
                to_player: toPlayer.name,
              });
              setTransactionIteration(index);

              // Play bullshit sound
              playSound("bullshit");

              setInstruction("bullshit");
              setBullshitMode(true);
              setAllowCalling(false);
              canCall = false;
            }
          }

          // Calculate drinks
          if (
            transaction.t_to === userUid &&
            transaction.status === "accepted"
          ) {
            roundDrinks += round_row * 1;
          }

          if (
            transaction.t_from === userUid &&
            transaction.status === "bullshit_wrong"
          ) {
            roundDrinks += round_row * 2;
          }

          if (
            transaction.t_to === userUid &&
            transaction.status === "bullshit_correct"
          ) {
            roundDrinks += round_row * 2;
          }
        });

        setDrinkNumber(roundDrinks);
      }

      if (canCall && !bullshitMode) {
        setInstruction("To call someone to drink use the button below!");
        setAllowCalling(true);
      }
    }

    // Check if game has ended
    if (gameData["__pyramid.summary"]) {
      setGameEnded(true);
      setInstruction("Game Over! Here are your final cards:");
      setShowAllCards(true);
    }
  }, [gameData, userUid, routeGameId, players, myName, playSound]);

  // Handle showing all cards
  const handleShowAllCards = () => {
    console.log("Showing all cards");
    setShowAllCards(true);
    setAllowViewAll(false);
    setCountdown(10); // 10 seconds to memorize cards
    setInstruction(
      "Remember your cards now! You will NOT be able to view them again!"
    );

    // Play a notification sound
    playSound("notification");
  };

  // Handle getting a new card
  const handleGetNewCard = () => {
    console.log("Getting new card");
    setShowAllCards(true);
    setAllowNewCard(false);
    setCountdown(15); // 15 seconds to memorize the new card
    setInstruction(
      "Remember your new card! You will NOT be able to view it again!"
    );

    // Play a notification sound
    playSound("notification");
  };

  // Handle calling another player
  const handleCallPlayer = () => {
    setCallModalOpen(true);
  };

  // Handle selecting a player to call
  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
  };

  // Handle confirming a call
  const handleConfirmCall = async () => {
    if (!userUid || !routeGameId || !selectedPlayer || currentRound === null)
      return;

    try {
      // We'd need to call a function from GameContext to create a transaction
      // For demonstration, we'll just update the UI state

      setAllowCalling(false);
      setCallModalOpen(false);
      setSelectedPlayer(null);
      setInstruction("Waiting for player to respond...");

      // In a real implementation, we'd create a transaction in the database
    } catch (error) {
      console.error("Failed to call player:", error);
    }
  };

  // Handle decision on a drink request (accept or call bullshit)
  const handleDecision = async (accept: boolean) => {
    if (
      !userUid ||
      !routeGameId ||
      currentRound === null ||
      transactionIteration === -1
    )
      return;

    try {
      // We'd need to call a function from GameContext to update the transaction
      // For demonstration, we'll just update the UI state

      setAllowDecision(false);
      setCurrentDecision(null);

      if (accept) {
        // Player accepted the drink
        setInstruction("You accepted the drinks!");
      } else {
        // Player called bullshit
        setInstruction(
          "You called bullshit! The player now needs to show a matching card."
        );
      }

      // In a real implementation, we'd update the transaction in the database
    } catch (error) {
      console.error("Failed to process decision:", error);
    }
  };

  // Handle card selection for bullshit response
  const handleCardSelect = (cardIndex: number) => {
    if (!bullshitMode || !userUid || !routeGameId || currentRound === null) {
      return;
    }

    console.log(`Selected card ${cardIndex} for bullshit response`);

    // Check if card matches the current round card
    const isMatch =
      gameData && checkCardMatch(gameData, currentRound, cardIndex);

    // Update transaction status and get a new card
    if (gameData && userUid && routeGameId && transactionIteration !== -1) {
      showBullshitCard(
        routeGameId.toString(),
        userUid,
        cardIndex,
        currentRound,
        isMatch || false
      )
        .then(() => {
          console.log("Bullshit response processed");
          setBullshitMode(false);
          setAllowNewCard(true);

          // Play appropriate sound
          if (isMatch) {
            playSound("success");
            setInstruction(
              "You showed a matching card! Click below to get a new card."
            );
          } else {
            playSound("wrong");
            setInstruction(
              "Your card didn't match! You'll need to drink double. Click below to get a new card."
            );
          }
        })
        .catch((error) => {
          console.error("Error processing bullshit response:", error);
        });
    }
  };

  // Handle starting the game (first player can trigger game start)
  const handleStartGame = async () => {
    if (!routeGameId) return;

    try {
      // We'd need to call a function from GameContext to start the game
      // For demonstration, we'll just update the UI state

      setContinueButton(false);
      setInstruction("Starting game...");

      // In a real implementation, we'd start the game in the database
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  return (
    <Layout pageTitle={`Game ${String(routeGameId).toUpperCase()}`}>
      <div className="container mx-auto px-4 pt-6 pb-20">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden relative">
          {/* Room code */}
          {routeGameId && (
            <div className="absolute top-2 right-2 bg-indigo-800 text-white px-3 py-1 rounded-full text-sm font-bold">
              Room: {String(routeGameId).toUpperCase()}
            </div>
          )}

          {/* Player name */}
          {myName && (
            <div className="absolute top-2 left-2 bg-rose-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {myName}
            </div>
          )}

          {/* Countdown timer */}
          {countdown > 0 && (
            <div className="absolute top-10 right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {countdown}s
            </div>
          )}

          {/* Main content */}
          <div className="p-6 pt-14">
            {!gameStarted ? (
              // Waiting for host screen
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-6">
                  Waiting for host to continue...
                </h2>

                {continueButton && (
                  <button
                    onClick={handleStartGame}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full transition duration-300"
                  >
                    Start Game
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
            ) : (
              // Game in progress
              <div>
                {/* Game instructions */}
                <div className="text-center mb-6">
                  {gameEnded ? (
                    <h2 className="text-xl font-bold">
                      That&apos;s the end of the game! You can see your final
                      cards below!
                    </h2>
                  ) : (
                    <>
                      {currentRound !== null && currentCard && (
                        <h3 className="text-lg font-semibold mb-1">
                          <span className="text-gray-600">
                            Row {currentRow}, round {currentRound} - it&apos;s{" "}
                          </span>
                          <span className="text-black">{currentCard}</span>
                          <span className="text-gray-600">!</span>
                        </h3>
                      )}

                      {instruction === "bullshit" ? (
                        <h3 className="text-lg">
                          What&apos;s this?{" "}
                          <span className="font-bold">
                            {currentDecision?.to_player}
                          </span>{" "}
                          has called{" "}
                          <span className="font-bold text-rose-600">
                            BULLSHIT
                          </span>
                          ! Select the card with the{" "}
                          <span className="font-bold">same</span> rank as the
                          card in play below - or face drinking double!
                          {drinkNumber > 0 && (
                            <span className="text-gray-600 block mt-1">
                              By the way you already need to drink {drinkNumber}{" "}
                              this round!
                            </span>
                          )}
                        </h3>
                      ) : instruction === "drink" ? (
                        <h3 className="text-lg">
                          <span className="font-bold">
                            {currentDecision?.from_player}
                          </span>{" "}
                          has asked you to drink! Decide what to do by choosing
                          a button below.
                        </h3>
                      ) : instruction === "several_drink" ? (
                        <h3 className="text-lg">
                          You have been called to drink by{" "}
                          <span className="font-bold">multiple</span> other
                          players! We&apos;ll begin with{" "}
                          <span className="font-bold">
                            {currentDecision?.from_player}
                          </span>
                          . Decide what to do by choosing a button below.
                        </h3>
                      ) : (
                        <h3 className="text-lg">
                          {instruction}{" "}
                          {drinkNumber > 0 && (
                            <span className="font-semibold text-rose-600">
                              You need to drink {drinkNumber} this round!
                            </span>
                          )}
                        </h3>
                      )}
                    </>
                  )}
                </div>

                {/* Player's hand */}
                <div className="mb-8">
                  <PlayerHand
                    cards={myCards}
                    showAllCards={showAllCards}
                    countdownActive={countdown > 0}
                    onCardSelect={bullshitMode ? handleCardSelect : undefined}
                    className="mb-8"
                    debug={true} // Add debug to help troubleshoot
                  />
                </div>

                {/* Game controls */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {allowViewAll && (
                    <button
                      onClick={handleShowAllCards}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                    >
                      Show My Cards
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}

                  {allowNewCard && (
                    <button
                      onClick={handleGetNewCard}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                    >
                      Get New Card
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}

                  {allowCalling && (
                    <button
                      onClick={handleCallPlayer}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                    >
                      Select Player
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}

                  {allowDecision && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleDecision(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                      >
                        Accept Drinks
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleDecision(false)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 flex items-center"
                      >
                        Bullshit!
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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

      {/* Call Player Modal */}
      {callModalOpen && (
        <CallPlayer
          players={players.filter((p) => p.uid !== userUid)}
          onSelectPlayer={handleSelectPlayer}
          selectedPlayer={selectedPlayer}
          onConfirm={handleConfirmCall}
          onCancel={() => {
            setCallModalOpen(false);
            setSelectedPlayer(null);
          }}
          currentCard={currentCard || ""}
        />
      )}
    </Layout>
  );
};

export default GamePage;
