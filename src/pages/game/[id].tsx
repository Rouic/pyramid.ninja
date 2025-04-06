// src/pages/game/[id].tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
import {
  dealCardsToPlayer,
  initializeGameDeck,
  revealPyramidCard,
  updatePlayerCard,
} from "../../lib/firebase/gameCards";
import { Card } from "../../lib/deck";
import {
  DrinkAssignment,
  subscribeToGameStateDetails,
  startMemorizationPhase,
  startPlayingPhase,
  replacePlayerCard,
  clearPlayerChallengeState,
} from "../../lib/firebase/gameState";
import GamePyramid from "../../components/GamePyramid";
import YesGameLayout from "../../components/YesGameLayout";
import PlayerHand from "../../components/PlayerHand";
import MemorizeTimer from "../../components/MemorizeTimer";
import DrinkAssignmentPanel from "../../components/DrinkAssignmentPanel";
import { GameControls } from "../../components/GameControls";
import ActivityLog from "../../components/ActivityLog";
import { usePlayerContext } from "../../context/PlayerContext";
import { GameProvider } from "../../contexts/GameContext";
import { YesPlayer, YesGameState } from "../../types";
import MemorizationOverlay from "../../components/MemorizationOverlay";
import GameStartNotification from "../../components/GameStartNotification";
import ChallengeResetControls from "../../components/ChallengeResetControls";


const GamePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { playerId, playerName, isHost, setIsHost } = usePlayerContext();

  const [gameData, setGameData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<string>("waiting");
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [gameType, setGameType] = useState<'pyramid' | 'yes' | null>(null);
  const [memorizationEndTime, setMemorizationEndTime] = useState<Date | null>(
    null
  );
  const [drinkAssignments, setDrinkAssignments] = useState<DrinkAssignment[]>(
    []
  );
  const [currentPyramidCard, setCurrentPyramidCard] = useState<any>(null);
  const [currentRowNumber, setCurrentRowNumber] = useState(0);
  const [allCardsDealt, setAllCardsDealt] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [isSelectingForChallenge, setIsSelectingForChallenge] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);

  const [isPersonallyMemorizing, setIsPersonallyMemorizing] = useState(false);
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState<number | null>(null);

  const previousChallengeResultIdRef = useRef<string | null>(null);
  const autoResolveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [challengeResolutionId, setChallengeResolutionId] = useState<
    string | null
  >(null);
  const [autoResolveTimer, setAutoResolveTimer] =
    useState<NodeJS.Timeout | null>(null);

  const [hasShownGameStartNotification, setHasShownGameStartNotification] =
    useState(false);


  // New state to track which card is being challenged (for flipping)
  const [challengedCardIndex, setChallengedCardIndex] = useState<number>(-1);
  const [isDeckEmpty, setIsDeckEmpty] = useState(false);
  const [showGameStartNotification, setShowGameStartNotification] =
    useState(false);

    useEffect(() => {
      if (
        !hasShownGameStartNotification && // Only show if we haven't shown it before
        gameData &&
        gameData.lastAction &&
        gameData.lastAction.type === "host_started_game" &&
        gameState === "playing" &&
        !isHost
      ) {
        // Show notification that host started the game
        setShowGameStartNotification(true);
        // Mark that we've shown it
        setHasShownGameStartNotification(true);
      }
    }, [gameData, gameState, isHost, hasShownGameStartNotification]);

    const handleCloseGameStartNotification = () => {
      setShowGameStartNotification(false);
      // We don't reset hasShownGameStartNotification here
    };

  useEffect(() => {
    if (gameData && gameData.deck && gameData.deck.cards) {
      setIsDeckEmpty(gameData.deck.cards.length === 0);
    }
    
    // If the game state changes from challenged to not challenged, make sure to clear any leftover state
    if (gameData && 
        challengedCardIndex !== -1 && 
        !isSelectingForChallenge) {
      // Reset challenge card index when we've finished a challenge
      console.log("Clearing challenge card index");
      setChallengedCardIndex(-1);
    }
  }, [gameData, challengedCardIndex, isSelectingForChallenge]);

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
         setGameType(data.gameType || 'pyramid');

         // Update challenge resolution ID only if it changed
         // Also check it against a ref to prevent extra renders
         if (
           data.challengeResultId &&
           data.challengeResultId !== challengeResolutionId &&
           data.challengeResultId !== previousChallengeResultIdRef.current
         ) {
           console.log(
             "New challenge resolution detected:",
             data.challengeResultId
           );
           previousChallengeResultIdRef.current = data.challengeResultId;
           setChallengeResolutionId(data.challengeResultId);

           // Auto reset challenge card index after a delay
           if (challengedCardIndex !== -1) {
             if (autoResolveTimerRef.current) {
               clearTimeout(autoResolveTimerRef.current);
               autoResolveTimerRef.current = null;
             }

             const timer = setTimeout(() => {
               console.log("Auto-resetting challenge card index");
               setChallengedCardIndex(-1);
               if (isSelectingForChallenge) {
                 setIsSelectingForChallenge(false);
               }
               autoResolveTimerRef.current = null;
             }, 3000);

             autoResolveTimerRef.current = timer;
           }
         }

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

         // Update player cards if available
         if (data[playerId] && data[playerId].cards) {
           setPlayerCards(data[playerId].cards);
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

   // Cleanup function for the autoResolveTimer
   return () => {
     if (autoResolveTimerRef.current) {
       clearTimeout(autoResolveTimerRef.current);
       autoResolveTimerRef.current = null;
     }
   };
 }, [
   id,
   playerId,
   setIsHost,
   challengeResolutionId,
   challengedCardIndex,
   isSelectingForChallenge,
 ]);

  // Update the handlers to track time information
  const handlePersonalMemorizationStart = useCallback((seconds: number) => {
    setIsPersonallyMemorizing(true);
    setMemorizeTimeLeft(seconds);
    console.log(
      `Personal memorization started with ${seconds} seconds - cards should be visible now`
    );
  }, []);

  const handlePersonalMemorizationTick = useCallback((seconds: number) => {
    setMemorizeTimeLeft(seconds);
  }, []);

  const handlePersonalMemorizationEnd = useCallback(() => {
    setIsPersonallyMemorizing(false);
    setMemorizeTimeLeft(null);
    console.log("Personal memorization ended - cards should be hidden now");
  }, []);

  const handleStartGame = useCallback(async () => {
    if (
      !id ||
      !isHost ||
      isStartingGame ||
      gameState !== "waiting"
    )
      return;
    
    // Convert id to string if it's an array
    const gameId = typeof id === 'string' ? id : id[0];
    if (!gameId) return;

    setIsStartingGame(true);

    try {
      console.log("Starting game...");

      // Initialize deck and pyramid
      const rowCount = 5; // 5 rows in the pyramid
      await initializeGameDeck(gameId, rowCount);
      console.log("Game initialized with deck and pyramid");

      // Deal cards to all players (skip host)
      const players = gameData.players || [];
      for (const player of players) {
        // Skip dealing cards to the host
        if (player.id !== gameData.hostId) {
          console.log(`Dealing cards to player ${player.id}`);
          await dealCardsToPlayer(gameId, player.id, 4);
        }
      }

      // Mark all cards as dealt
      await updateDoc(doc(db, "games", gameId), {
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
    if (!id) return;
    
    // Convert id to string if it's an array
    const gameId = typeof id === 'string' ? id : id[0];
    if (!gameId) return;

    try {
      // Start memorization phase
      await startMemorizationPhase(gameId);
    } catch (error) {
      console.error("Error starting memorization phase:", error);
    }
  }, [id]);

  const handleStartPlaying = useCallback(async () => {
    if (!id || !isHost) return;
    
    // Convert id to string if it's an array
    const gameId = typeof id === 'string' ? id : id[0];
    if (!gameId) return;

    console.log("Starting playing phase...");
    try {
      // Transition from memorization to playing phase
      await startPlayingPhase(gameId);

      // Immediately update the local game state to ensure UI updates promptly
      // This ensures the GamePyramid becomes clickable right away
      setGameState("playing");

      console.log("Game state updated to 'playing'");
    } catch (error) {
      console.error("Error starting playing phase:", error);
    }
  }, [id, isHost]);

  // Also add this debugging useEffect to help track state changes
  useEffect(() => {
    console.log("Game state changed:", gameState);
    console.log("Pyramid clickable:", gameState === "playing");
  }, [gameState]);

  const handleCardReplacement = useCallback(
    async (cardIndex: number) => {
      if (!id || !playerId) return;
      
      // Convert id to string if it's an array
      const gameId = typeof id === 'string' ? id : id[0];
      if (!gameId) return;

      try {
        await replacePlayerCard(gameId, playerId, cardIndex);

        // Reset challenge state after replacing a card
        setChallengedCardIndex(-1);

        console.log(`Card at index ${cardIndex} successfully replaced`);
      } catch (error) {
        console.error("Error replacing card:", error);
      }
    },
    [id, playerId]
  );

  const handleRevealCard = useCallback(
    async (cardIndex: number) => {
      if (!id || !isHost) return;
      
      // Convert id to string if it's an array
      const gameId = typeof id === 'string' ? id : id[0];
      if (!gameId) return;

      try {
        // If the game is in memorizing or ready state, automatically
        // transition to playing phase for everyone
        if (gameState === "memorizing" || gameState === "ready") {
          console.log(
            "Host clicked a card: Automatically transitioning to playing phase..."
          );

          // Force update gameState to playing locally for immediate UI response
          setGameState("playing");

          // Then update the server
          await startPlayingPhase(gameId);
        }

        // Now reveal the card
        await revealPyramidCard(gameId, cardIndex);

        // Update round number
        setCurrentRound((prev) => prev + 1);
      } catch (error) {
        console.error("Error revealing card:", error);
      }
    },
    [id, isHost, gameState, startPlayingPhase]
  );

  // Handler for when a player is challenged and needs to show a card
  const handleChallengeCard = useCallback(
    (cardIndex: number) => {
      console.log(`Challenge card index set to ${cardIndex}`);

      // If we're setting to the same value, don't update to prevent rerenders
      if (cardIndex === challengedCardIndex) {
        console.log("Card index unchanged, skipping update");
        return;
      }

      setChallengedCardIndex(cardIndex);

      // If cardIndex is -1, it means we're resetting the challenge state
      if (cardIndex === -1) {
        console.log("Challenge selection mode disabled");
        setIsSelectingForChallenge(false);

        // Also explicitly clear any challenge state in Firebase - but only if needed
        if (id && playerId && isSelectingForChallenge) {
          // Handle case where id might be a string or array
          const gameId = typeof id === "string" ? id : id[0];
          if (gameId) {
            clearPlayerChallengeState(gameId, playerId).catch((err) =>
              console.error("Error clearing challenge state:", err)
            );
          }
        }
      } else {
        // If selecting a card for challenge, make sure we're in selection mode
        console.log(
          "Challenge card selected, ensuring selection mode is enabled"
        );
        setIsSelectingForChallenge(true);

        // Add auto-transition after showing card
        if (autoResolveTimerRef.current) {
          clearTimeout(autoResolveTimerRef.current);
          autoResolveTimerRef.current = null;
        }

        const timer = setTimeout(() => {
          // If still showing a challenge card after timeout, auto-hide it
          if (challengedCardIndex !== -1) {
            console.log("Auto-resetting challenge card index after timeout");
            setChallengedCardIndex(-1);
            setIsSelectingForChallenge(false);
            autoResolveTimerRef.current = null;
          }
        }, 5000); // Give 5 seconds for the challenge to complete

        autoResolveTimerRef.current = timer;
      }
    },
    [id, playerId, challengedCardIndex, isSelectingForChallenge]
  );

  // Single useEffect for handling new cards with auto-hide timer
  useEffect(() => {
    // Make sure we have a valid string ID
    if (!id || !playerId || !gameData) return;
    const gameId = typeof id === 'string' ? id : id[0];
    if (!gameId) return;

    // Check for newCardTimers in gameData
    const newCardTimers = gameData.newCardTimers || {};
    const playerTimers = newCardTimers[playerId];

    // Process timers from Firebase if they exist
    if (playerTimers) {
      Object.entries(playerTimers).forEach(([cardId, hideTimeStr]) => {
        if (!hideTimeStr) return; // Skip null entries

        const hideTime = new Date(hideTimeStr as string).getTime();
        const now = Date.now();
        const timeRemaining = Math.max(0, hideTime - now);

        if (timeRemaining > 0) {
          // Set a timer to auto-hide this card
          const timer = setTimeout(async () => {
            console.log(`Auto-hiding card ${cardId} after 15 seconds`);

            try {
              // Get current player cards
              const gameId = typeof id === 'string' ? id : id[0];
              if (!gameId) return;
              const playerRef = doc(db, "games", gameId, "players", playerId);
              const playerDoc = await getDoc(playerRef);

              if (playerDoc.exists()) {
                const playerData = playerDoc.data();
                const cards = playerData.cards || [];

                // Find the card by ID and update it - Add proper null checks
                const updatedCards = cards.map((card) => {
                  // Make sure card and card.i exist before calling toString()
                  if (
                    card &&
                    card.i !== undefined &&
                    card.i !== null &&
                    card.i.toString() === cardId
                  ) {
                    return { ...card, newCard: false, faceVisible: false };
                  }
                  return card;
                });

                // Update the cards in Firebase
                await updateDoc(playerRef, {
                  cards: updatedCards,
                  updatedAt: new Date().toISOString(),
                });

                // Remove this timer from Firebase
                const gameId = typeof id === 'string' ? id : id[0];
                if (gameId) {
                  const gameRef = doc(db, "games", gameId);
                  await updateDoc(gameRef, {
                    [`newCardTimers.${playerId}.${cardId}`]: null,
                  });
                }
              }
            } catch (error) {
              console.error("Error auto-hiding card:", error);
            }
          }, timeRemaining);

          return () => clearTimeout(timer);
        }
      });
    }

    // Also look for any direct newCard flags in player data
    const playerData = gameData[playerId];
    if (playerData && playerData.cards) {
      const newCards = playerData.cards.filter((card) => card.newCard === true);

      // For each new card that doesn't have a timer yet, set up a hide timer
      newCards.forEach((newCard) => {
        const cardId = newCard.i;
        const hasExistingTimer = playerTimers && playerTimers[cardId];

        if (!hasExistingTimer) {
          console.log(`Setting timer to hide card ${cardId} in 15 seconds`);

          // Create a manual timer for this session
          const timer = setTimeout(() => {
            console.log(`Hiding card ${cardId} after 15 seconds`);
            if (id) {
              // Convert id to string if it's an array
              const gameId = typeof id === 'string' ? id : id[0];
              if (!gameId) return;
              
              // Update the card in Firebase
              const playerRef = doc(db, "games", gameId, "players", playerId);
              getDoc(playerRef)
                .then((snapshot) => {
                  if (snapshot.exists()) {
                    const playerData = snapshot.data();
                    const updatedCards = playerData.cards.map((card) =>
                      card.i === cardId
                        ? { ...card, newCard: false, faceVisible: false }
                        : card
                    );

                    updateDoc(playerRef, {
                      cards: updatedCards,
                      updatedAt: new Date().toISOString(),
                    }).catch((err) =>
                      console.error("Error updating card visibility:", err)
                    );
                  }
                })
                .catch((err) =>
                  console.error("Error reading player data:", err)
                );
            }
          }, 15000);

          return () => clearTimeout(timer);
        }
      });
    }
  }, [gameData, id, playerId]);

  useEffect(() => {
    // Global event listeners for debugging challenge flow
    const handleChallengeAutoSubmit = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(
        "🔍 DEBUG: Challenge auto-submit event received:",
        customEvent.detail
      );

      // If we have an auto-resolve timer, clear it
      if (autoResolveTimerRef.current) {
        clearTimeout(autoResolveTimerRef.current);
        autoResolveTimerRef.current = null;
      }

      // Set a new timer that will clear the challenge state if nothing happens
      const timer = setTimeout(() => {
        console.log("🔍 DEBUG: Auto-cleanup after challenge submission");
        if (challengedCardIndex !== -1) {
          setChallengedCardIndex(-1);
        }
        if (isSelectingForChallenge) {
          setIsSelectingForChallenge(false);
        }
      }, 8000); // Extra long timeout

      autoResolveTimerRef.current = timer;
    };

    const handleCardSelected = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(
        "🔍 DEBUG: Card selected event received:",
        customEvent.detail
      );
    };

    // Add listeners for both events
    document.addEventListener(
      "challenge:autoSubmit",
      handleChallengeAutoSubmit
    );
    document.addEventListener("card:selected", handleCardSelected);

    // Cleanup
    return () => {
      document.removeEventListener(
        "challenge:autoSubmit",
        handleChallengeAutoSubmit
      );
      document.removeEventListener("card:selected", handleCardSelected);
    };
  }, [challengedCardIndex, isSelectingForChallenge]);

  const debugChallengeState = () => {
    console.log("🔍 CHALLENGE DEBUG - Current state:");
    console.log("- isSelectingForChallenge:", isSelectingForChallenge);
    console.log("- challengedCardIndex:", challengedCardIndex);
    console.log("- challengeResolutionId:", challengeResolutionId);
    console.log("- Current assignments:", drinkAssignments);

    // Find any challenged assignments
    const challengedAssignments = drinkAssignments.filter(
      (a) => a.status === "challenged"
    );
    console.log("- Challenged assignments:", challengedAssignments);

    // Add a debug button to player view
    return (
      <button
        onClick={() => {
          console.log("🔍 Manual debug triggered");
          debugChallengeState();

          // Force clean state after 1 second
          setTimeout(() => {
            console.log("🔍 Forcing challenge state cleanup");
            setChallengedCardIndex(-1);
            setIsSelectingForChallenge(false);

            // Also clear Firebase challenge state
            if (id && playerId) {
              const gameId = typeof id === "string" ? id : id[0];
              if (gameId) {
                clearPlayerChallengeState(gameId, playerId);
              }
            }
          }, 1000);
        }}
        className="mt-2 p-1 bg-red-600 text-white text-xs rounded"
      >
        Debug Challenge
      </button>
    );
  };


  useEffect(() => {
    const handleCardSelectedEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("🎮 Card selected event received", customEvent.detail);

      // This optional code can help auto-resolve the selection
      if (customEvent.detail && customEvent.detail.index !== undefined) {
        handleChallengeCard(customEvent.detail.index);
      }
    };

    document.addEventListener("card:selected", handleCardSelectedEvent);

    return () => {
      document.removeEventListener("card:selected", handleCardSelectedEvent);
    };
  }, [handleChallengeCard]);

  // Render new card alert notification
  const renderNewCardAlert = () => {
    // Check if this player has a new card
    const newCards = playerCards?.filter((card) => card.newCard) || [];

    if (newCards.length === 0) {
      return null;
    }

    // Calculate remaining time based on the newest card's replacedAt timestamp
    let timeLeftPercent = 100;
    const newestCard = newCards.reduce((newest, card) => {
      if (
        !newest.replacedAt ||
        (card.replacedAt &&
          new Date(card.replacedAt) > new Date(newest.replacedAt))
      ) {
        return card;
      }
      return newest;
    }, newCards[0]);

    if (newestCard.replacedAt) {
      const replacedTime = new Date(newestCard.replacedAt).getTime();
      const now = Date.now();
      const elapsed = now - replacedTime;
      const totalDuration = 15000; // 15 seconds

      timeLeftPercent = Math.max(
        0,
        Math.min(100, 100 - (elapsed / totalDuration) * 100)
      );
    }

    return (
      <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-xs">
        <h4 className="font-bold mb-1">New Card!</h4>
        <p>You have a new card. Memorize it before it&apos;s hidden again!</p>
        <div className="mt-2 bg-green-500 h-2 rounded-full overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-1000"
            style={{ width: `${timeLeftPercent}%` }}
          ></div>
        </div>
      </div>
    );
  };

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

  // Check if this is a YES game
  if (gameType === 'yes') {
    console.log("Rendering YES game UI with gameData:", gameData);
    
    // Map players from gameData to YesPlayer type
    const yesPlayers: YesPlayer[] = Object.entries(gameData || {})
      .filter(([key, value]) => 
        typeof value === 'object' && 
        value !== null && 
        'name' in value &&
        !key.startsWith('__')
      )
      .map(([key, playerData]) => {
        // Type assertion for accessing properties
        const player = playerData as {
          name?: string;
          lives?: number;
          isDealer?: boolean;
          card?: any;
          hasSwapped?: boolean;
          hasChecked?: boolean;
          admin?: boolean;
          drinks?: number;
          blockingSwap?: boolean;
          lostLife?: boolean;
          hasCut?: boolean;
        };
        
        return {
          uid: key,
          name: player.name || 'Unknown',
          lives: player.lives || 3,
          isDealer: player.isDealer || false,
          card: player.card,
          hasSwapped: player.hasSwapped || false,
          hasChecked: player.hasChecked || false,
          admin: player.admin || false,
          drinks: player.drinks || 0,
          blockingSwap: player.blockingSwap || false,
          lostLife: player.lostLife || false,
          hasCut: player.hasCut || false
        };
      });
    
    // Get the YES state
    const yesState = (gameData && gameData["__yes.state"]) 
      ? gameData["__yes.state"] 
      : {
          started: false,
          dealer: '',
          currentRound: 0,
          deck: [],
          usedCards: [],
          playerOrder: [],
          revealPhase: false
        };
        
    console.log("YES state for component:", yesState);
    console.log("YES players for component:", yesPlayers);
    console.log("Is started:", yesState.started);
    console.log("Is host:", isHost);
      
    return (
      <div className="min-h-screen bg-game-bg pb-8 relative overflow-hidden">
        {/* Background patterns - Balatro style */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
        
        {/* Decorative elements */}
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at center, rgba(70, 252, 167, 0.5), transparent 70%)",
            filter: "blur(100px)",
          }}
        ></div>
        
        <div className="max-w-7xl mx-auto px-4 pt-6 relative z-10">
          <div className="pb-4 relative">
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center">
                <img
                  src="/icon.png"
                  alt="YES Game"
                  className="h-12 w-12 mr-3"
                />
                <h1 className="text-lg font-display text-game-neon-green tracking-tight xs:tracking-normal sm:tracking-wider mb-0 animate-glow font-display-fallback w-full px-2">
                  YES GAME
                </h1>
              </div>
              <div className="text-white font-medium">
                Game ID: <span className="font-mono">{id}</span>
              </div>
            </div>
          </div>
          
          <YesGameLayout 
            gameId={id as string}
            currentPlayerId={playerId}
            gameState={yesState as YesGameState}
            players={yesPlayers}
            isHost={isHost}
          />
        </div>
      </div>
    );
  }
  
  // Standard Pyramid Game UI - Pyramid game
  else if (isHost) {
    // Host View - shows the pyramid and game controls
    return (
      <div className="min-h-screen bg-game-bg pb-8 relative overflow-hidden">
        {/* Background patterns - Balatro style */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Multiple glowing orb effects for visual interest */}
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at center, rgba(252, 70, 107, 0.5), transparent 70%)",
            filter: "blur(100px)",
          }}
        ></div>

        <div
          className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle at center, rgba(151, 50, 252, 0.6), transparent 70%)",
            filter: "blur(80px)",
          }}
        ></div>

        {/* Card decorations in corners */}
        <div className="absolute bottom-24 right-24 w-52 h-72 rounded-lg bg-game-card opacity-5 transform rotate-12"></div>
        <div className="absolute top-24 left-24 w-52 h-72 rounded-lg bg-game-card opacity-5 transform -rotate-12"></div>

        <div className="max-w-7xl mx-auto px-4 pt-6 relative z-10">
          {/* Small branded header with logo and game name */}
          <div className="pb-4  relative">
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
          </div>

          {/* Display empty deck warning if needed */}
          {isDeckEmpty && (
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
                  Deck is empty! Any cards you reveal during challenges
                  won&apos;t be replaced.
                </span>
              </div>
            </div>
          )}

          {/* Game content - Main game card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unified game card that contains both pyramid and controls */}
            <div className="lg:col-span-3">
              <div className="bg-black/70 backdrop-blur-md rounded-xl border-2 border-game-neon-purple/40 shadow-neon-purple-sm p-6 mb-6 relative transform rotate-0.5 overflow-hidden">
                {/* Glow effect */}
                <div
                  className="absolute -inset-px rounded-xl overflow-hidden opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(153, 50, 252, 0.7), transparent 70%)",
                    filter: "blur(20px)",
                  }}
                ></div>

                {/* Card corner decorations */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-game-neon-purple/40 rounded-tl-lg"></div>
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-game-neon-purple/40 rounded-tr-lg"></div>
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-game-neon-purple/40 rounded-bl-lg"></div>
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-game-neon-purple/40 rounded-br-lg"></div>

                {/* Game header information inside the card */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative z-10">
                  <div className="flex-grow">
                    <h2 className="text-2xl font-game-fallback text-game-neon-purple mb-1 tracking-wide">
                      {gameData?.name || "PYRAMID GAME"}
                    </h2>
                    <div className="flex items-center">
                      <div className="text-game-neon-yellow font-medium mr-2">
                        GAME ID:
                      </div>
                      <div className="bg-black/50 px-3 py-1 rounded-lg font-mono text-white text-lg tracking-wide border border-game-neon-yellow/30">
                        {id}
                      </div>
                    </div>
                  </div>

                  {gameState === "waiting" && (
                    <div className="relative group md:min-w-[200px]">
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-game-neon-green/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse-slow opacity-70"></div>

                      <button
                        onClick={handleStartGame}
                        disabled={isStartingGame}
                        className="w-full btn-neon py-4 px-6 bg-black text-game-neon-green font-game-fallback tracking-wide text-xl rounded-xl transition-all duration-300 group-hover:scale-[1.02] focus:outline-none border-2 border-game-neon-green relative overflow-hidden transform rotate-1 shadow-neon-green-sm group-hover:shadow-neon-green-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {/* Button gradient overlay */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-game-neon-green to-transparent opacity-50"></div>

                        {/* Corner card chip decorations */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-game-neon-green border-opacity-70 rounded-tl-lg"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-game-neon-green border-opacity-70 rounded-tr-lg"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-game-neon-green border-opacity-70 rounded-bl-lg"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-game-neon-green border-opacity-70 rounded-br-lg"></div>

                        {isStartingGame ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-6 w-6 text-game-neon-green"
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
                            STARTING...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 mr-3 group-hover:animate-pulse"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            START GAME
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {gameState === "playing" && (
                    <div className="flex items-center gap-4">
                      <div className="py-2 px-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center shadow-neon-yellow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2 text-yellow-700 dark:text-yellow-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            Current Drink Value
                          </div>
                          <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                            {drinksForCurrentRow} drink
                            {drinksForCurrentRow !== 1 ? "s" : ""}
                          </div>
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

                {/* Main content area - split into two columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                  {/* Pyramid column */}
                  <div className="lg:col-span-2">
                    {gameState === "waiting" ? (
                      <div className="flex flex-col items-center justify-center py-16 relative overflow-hidden bg-black/40 rounded-xl">
                        {/* Balatro-style background pattern */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
                            backgroundSize: "20px 20px",
                          }}
                        ></div>

                        {/* Glowing orb effect */}
                        <div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-30"
                          style={{
                            background:
                              "radial-gradient(circle at center, rgba(252, 50, 151, 0.7), transparent 70%)",
                            filter: "blur(60px)",
                          }}
                        ></div>

                        {/* Card decorations */}
                        <div
                          className="absolute top-1/4 right-1/4 w-32 h-44 rounded-lg opacity-20 transform rotate-12 animate-float-slow"
                          style={{
                            background:
                              "radial-gradient(circle at center, rgba(252, 70, 107, 0.7), transparent 90%)",
                            boxShadow: "0 0 30px rgba(252, 70, 107, 0.5)",
                          }}
                        ></div>

                        <div
                          className="absolute bottom-1/4 left-1/4 w-28 h-40 rounded-lg opacity-20 animate-float-slow-reverse"
                          style={{
                            background:
                              "radial-gradient(circle at center, rgba(151, 50, 252, 0.7), transparent 90%)",
                            boxShadow: "0 0 30px rgba(151, 50, 252, 0.5)",
                            animationDelay: "2s",
                          }}
                        ></div>

                        <div className="relative z-10 bg-black bg-opacity-60 p-8 rounded-xl border-2 border-game-neon-red border-opacity-40 shadow-neon-red-sm transform -rotate-1">
                          {/* Glow effect */}
                          <div
                            className="absolute -inset-px rounded-xl overflow-hidden opacity-40"
                            style={{
                              background:
                                "radial-gradient(circle at 30% 30%, rgba(252, 70, 107, 0.7), transparent 70%)",
                              filter: "blur(20px)",
                            }}
                          ></div>

                          {/* Corner card chip decorations */}
                          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-game-neon-red border-opacity-50 rounded-tl-lg"></div>
                          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-game-neon-red border-opacity-50 rounded-tr-lg"></div>
                          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-game-neon-red border-opacity-50 rounded-bl-lg"></div>
                          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-game-neon-red border-opacity-50 rounded-br-lg"></div>

                          <div className="relative z-10 flex flex-col items-center">
                            <svg
                              className="h-16 w-16 mb-4 text-game-neon-red animate-pulse-slow"
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
                            <h3 className="text-2xl font-display-fallback text-game-neon-red tracking-wide mb-2 animate-glow">
                              GAME READY
                            </h3>
                            <p className="text-lg text-white font-game-fallback tracking-wide text-center">
                              CLICK &apos;START GAME&apos; TO BEGIN THE PYRAMID
                              GAME
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <GamePyramid
                        gameId={id as string}
                        rows={5}
                        isGameStarted={gameState !== "waiting"}
                        highlightCurrentCard={currentPyramidCard?.id}
                        drinksForCurrentRow={drinksForCurrentRow}
                        canRevealCards={isHost && gameState !== "waiting"} // This is the key change
                        onRevealCard={handleRevealCard}
                      />
                    )}
                  </div>

                  {/* Right column - Players, Activity Log, Controls */}
                  <div className="lg:col-span-1 flex flex-col space-y-6">
                    {/* Activity Log - Only for host during gameplay */}
                    {(gameState === "playing" || gameState === "ended") && (
                      <div>
                        <ActivityLog
                          assignments={drinkAssignments}
                          players={gameData?.players || []}
                          roundNumber={currentRound + 1} // Adding 1 to show Round 1 instead of Round 0
                          currentCardRank={currentPyramidCard?.rank}
                        />
                      </div>
                    )}

                    {/* Player list moved into the main card */}
                    <div className="bg-black/50 rounded-xl p-4 relative">
                      <h3 className="text-lg font-game-fallback text-game-neon-yellow mb-4 tracking-wide relative">
                        PLAYERS
                      </h3>
                      <div className="grid grid-cols-2 gap-3 relative">
                        {(gameData?.players || []).length > 0 ? (
                          (gameData?.players || []).map((player: any) => (
                            <div
                              key={player.id}
                              className="p-3 rounded-lg bg-black/40 border border-game-neon-yellow/30 flex flex-col items-center transform hover:scale-105 transition-transform duration-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-game-neon-yellow/20 border-2 border-game-neon-yellow/40 flex items-center justify-center text-game-neon-yellow mb-2 shadow-neon-yellow-sm">
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-game-fallback text-white text-center truncate w-full">
                                {player.name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-white/70">
                            <p className="font-game-fallback">
                              NO PLAYERS HAVE JOINED YET
                            </p>
                            <p className="text-sm mt-2">
                              Share the Game ID with players
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Game Controls - Only show when in ready or memorizing state when there are actual controls to show */}
                    {(gameState === "ready" || gameState === "memorizing") && (
                      <div className="bg-black/50 rounded-xl p-4 relative">
                        <GameControls
                          gameId={id as string}
                          currentPhase={gameState}
                          isHost={isHost}
                          onStartMemorization={handleStartMemorizing}
                          onStartPlaying={handleStartPlaying}
                        />
                      </div>
                    )}
                  </div>
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
      <div className="min-h-screen bg-game-bg pb-8 relative overflow-hidden">
        {/* Background patterns - Balatro style */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Multiple glowing orb effects for visual interest */}
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at center, rgba(50, 135, 252, 0.5), transparent 70%)",
            filter: "blur(100px)",
          }}
        ></div>

        <div
          className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle at center, rgba(151, 50, 252, 0.6), transparent 70%)",
            filter: "blur(80px)",
          }}
        ></div>

        {/* Card decorations in corners */}
        <div className="absolute bottom-24 right-24 w-52 h-72 rounded-lg bg-game-card opacity-5 transform rotate-12"></div>
        <div className="absolute top-24 left-24 w-52 h-72 rounded-lg bg-game-card opacity-5 transform -rotate-12"></div>

        <div className="max-w-4xl mx-auto px-4 pt-6 relative z-10">
          {/* Game header */}
          <div className="bg-black/70 backdrop-blur-md rounded-xl border-2 border-game-neon-blue/40 shadow-neon-blue-sm p-6 mb-6 relative transform -rotate-0.5 overflow-hidden">
            {/* Glow effect */}
            <div
              className="absolute -inset-px rounded-xl overflow-hidden opacity-20"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(50, 135, 252, 0.7), transparent 70%)",
                filter: "blur(20px)",
              }}
            ></div>

            {/* Card corner decorations */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-game-neon-blue/40 rounded-tl-lg"></div>
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-game-neon-blue/40 rounded-tr-lg"></div>
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-game-neon-blue/40 rounded-bl-lg"></div>
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-game-neon-blue/40 rounded-br-lg"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div>
                <h1 className="text-2xl font-game-fallback text-game-neon-blue mb-1 tracking-wide">
                  {gameData?.name || "PYRAMID GAME"}
                </h1>
                <p className="text-white text-sm">
                  Game ID: <span className="font-mono">{id}</span> •
                  <span className="ml-1">
                    Playing as{" "}
                    <span className="font-medium text-game-neon-green">
                      {playerName}
                    </span>
                  </span>
                </p>
              </div>
              {showGameStartNotification && (
                <GameStartNotification
                  isVisible={showGameStartNotification}
                  onClose={() => handleCloseGameStartNotification}
                />
              )}

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

          {/* Display empty deck warning if needed */}
          {isDeckEmpty && (
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
                  Deck is empty! Any cards you reveal during challenges
                  won&apos;t be replaced.
                </span>
              </div>
            </div>
          )}

          {/* Player game area */}
          <div className="bg-black/70 backdrop-blur-md rounded-xl border-2 border-game-neon-purple/40 shadow-neon-purple-sm p-6 mb-6 relative transform rotate-0.5 overflow-hidden">
            {/* Glow effect */}
            <div
              className="absolute -inset-px rounded-xl overflow-hidden opacity-20"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(153, 50, 252, 0.7), transparent 70%)",
                filter: "blur(20px)",
              }}
            ></div>

            {/* Card corner decorations */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-game-neon-purple/40 rounded-tl-lg"></div>
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-game-neon-purple/40 rounded-tr-lg"></div>
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-game-neon-purple/40 rounded-bl-lg"></div>
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-game-neon-purple/40 rounded-br-lg"></div>

            <div className="relative z-10">
              {gameState === "waiting" && !allCardsDealt ? (
                <div className="flex flex-col items-center justify-center py-16 relative overflow-hidden">
                  {/* Balatro-style background pattern */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  ></div>

                  {/* Glowing orb effect */}
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-30"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(50, 135, 252, 0.7), transparent 70%)",
                      filter: "blur(60px)",
                    }}
                  ></div>

                  {/* Card decorations */}
                  <div
                    className="absolute top-1/4 right-1/4 w-32 h-44 rounded-lg opacity-20 transform rotate-12 animate-float-slow"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(252, 70, 107, 0.7), transparent 90%)",
                      boxShadow: "0 0 30px rgba(252, 70, 107, 0.5)",
                    }}
                  ></div>

                  <div
                    className="absolute bottom-1/4 left-1/4 w-28 h-40 rounded-lg opacity-20 animate-float-slow-reverse"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(151, 50, 252, 0.7), transparent 90%)",
                      boxShadow: "0 0 30px rgba(151, 50, 252, 0.5)",
                      animationDelay: "2s",
                    }}
                  ></div>

                  <div className="relative z-10 bg-black bg-opacity-60 p-8 rounded-xl border-2 border-game-neon-blue border-opacity-40 shadow-neon-blue-sm transform rotate-1">
                    {/* Glow effect */}
                    <div
                      className="absolute -inset-px rounded-xl overflow-hidden opacity-40"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(50, 135, 252, 0.7), transparent 70%)",
                        filter: "blur(20px)",
                      }}
                    ></div>

                    {/* Corner card chip decorations */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-game-neon-blue border-opacity-50 rounded-tl-lg"></div>
                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-game-neon-blue border-opacity-50 rounded-tr-lg"></div>
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-game-neon-blue border-opacity-50 rounded-bl-lg"></div>
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-game-neon-blue border-opacity-50 rounded-br-lg"></div>

                    <div className="relative z-10 flex flex-col items-center">
                      <svg
                        className="h-16 w-16 mb-4 text-game-neon-blue animate-pulse-slow"
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
                      <h3 className="text-2xl font-display-fallback text-game-neon-blue tracking-wide mb-2 animate-glow">
                        WAITING FOR HOST
                      </h3>
                      <p className="text-lg text-white font-game-fallback tracking-wide text-center">
                        THE HOST WILL START THE GAME SOON...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Game controls for player readiness - always show for "ready" state */}
                  <div className="mb-6">
                    <GameControls
                      gameId={id as string}
                      currentPhase={gameState === "ready" ? "ready" : gameState}
                      isHost={isHost}
                      onStartMemorization={handleStartMemorizing}
                      onPersonalMemorizationStart={
                        handlePersonalMemorizationStart
                      }
                      onPersonalMemorizationTick={
                        handlePersonalMemorizationTick
                      }
                      onPersonalMemorizationEnd={handlePersonalMemorizationEnd}
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

                  {/* Player Emergency Controls */}
                  {/* <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    💥 Emergency Controls
                  </h3>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={async () => {
                        if (!id || !playerId) return;
                        const gameId = typeof id === "string" ? id : id[0];
                        if (!gameId) return;

                        try {
                          // Reset player's challenge state
                          await clearPlayerChallengeState(gameId, playerId);

                          // Reset UI state
                          setChallengedCardIndex(-1);
                          setIsSelectingForChallenge(false);

                          alert("Your challenge state has been reset!");
                        } catch (error) {
                          console.error("Error in emergency reset:", error);
                          alert(
                            "Error resetting your state. Try asking the host to reset all players."
                          );
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                    >
                      🚨 Reset My Challenge State (If Stuck)
                    </button>

                    <button
                      onClick={async () => {
                        if (!id || !playerId) return;
                        const gameId = typeof id === "string" ? id : id[0];
                        if (!gameId) return;

                        try {
                          // Get the current game data
                          const gameRef = doc(db, "games", gameId);
                          const gameDoc = await getDoc(gameRef);

                          if (gameDoc.exists()) {
                            const gameData = gameDoc.data();
                            const assignments = gameData.drinkAssignments || [];

                            // Find any challenged assignments involving this player
                            const challengedAssignments = assignments
                              .map((assignment, index) => ({
                                assignment,
                                index,
                              }))
                              .filter(
                                (item) =>
                                  item.assignment.status === "challenged" &&
                                  (item.assignment.from === playerId ||
                                    item.assignment.to === playerId)
                              );

                            if (challengedAssignments.length > 0) {
                              // Force them to resolve as failed challenges
                              for (const item of challengedAssignments) {
                                const wasFromMe =
                                  item.assignment.from === playerId;

                                // Update the assignment status
                                assignments[item.index] = {
                                  ...assignments[item.index],
                                  status: wasFromMe
                                    ? "failed_challenge"
                                    : "successful_challenge",
                                  resolvedAt: Date.now(),
                                  isResolved: true,
                                };
                              }

                              // Update all assignments at once
                              await updateDoc(gameRef, {
                                drinkAssignments: assignments,
                              });

                              // Reset player state
                              await clearPlayerChallengeState(gameId, playerId);

                              // Reset UI state
                              setChallengedCardIndex(-1);
                              setIsSelectingForChallenge(false);

                              alert(
                                `Fixed ${challengedAssignments.length} stuck challenge(s)!`
                              );
                            } else {
                              alert("No challenged assignments found to fix.");
                            }
                          }
                        } catch (error) {
                          console.error(
                            "Error forcing challenge resolution:",
                            error
                          );
                          alert(
                            "Error resolving challenges. Try reloading the game."
                          );
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg"
                    >
                      🔧 Force Resolve Stuck Challenges
                    </button>
                  </div>
                </div> */}

                  {/* Render new card alert */}
                  {renderNewCardAlert()}

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
                      setIsSelectingForChallenge={setIsSelectingForChallenge}
                      isSelectingForChallenge={isSelectingForChallenge} // Add this line
                    />
                  )}

                  {/* Player's hand */}
                  <PlayerHand
                    gameId={id as string}
                    isGameStarted={gameState !== "waiting" || allCardsDealt}
                    showFaceUp={
                      gameState === "memorizing" ||
                      gameState === "ended" ||
                      isPersonallyMemorizing
                    }
                    highlightCurrentRank={currentPyramidCard?.rank}
                    allowCardFlip={gameState === "playing"}
                    challengedCardIndex={challengedCardIndex}
                    onCardSelect={handleChallengeCard}
                    isSelectingForChallenge={isSelectingForChallenge}
                    onReplaceCard={handleCardReplacement}
                  />

                  {isPersonallyMemorizing && memorizeTimeLeft !== null && (
                    <MemorizationOverlay
                      seconds={memorizeTimeLeft}
                      isVisible={isPersonallyMemorizing}
                    />
                  )}

                  <ChallengeResetControls
                    gameId={id as string}
                    playerId={playerId}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// GameProvider is now imported at the top of the file

const GamePageWithProvider = () => {
  return (
    <GameProvider>
      <GamePage />
    </GameProvider>
  );
};

export default GamePageWithProvider;
