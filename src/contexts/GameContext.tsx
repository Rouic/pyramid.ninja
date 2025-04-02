// src/contexts/GameContext.tsx
import React, { createContext, useContext, useState } from "react";
import {
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  updateDoc,
  onSnapshot,
  DocumentSnapshot,
} from "firebase/firestore";
import { CardHelpers } from "../lib/CardHelpers";
import { db } from "../lib/firebase/firebase";
import { useAuth } from "./AuthContext";
import { generateGameCode, shuffleDeck } from "../lib/deckUtils";
import {
  GameContextType,
  GameData,
  Player,
  Transaction,
} from "../types";

// Create Game Context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Game Provider Component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userUid } = useAuth();
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  


  // Create a new game as host
  const createGame = async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      // Generate a new game code (4 random letters)
      const roomCode = generateGameCode();
      console.log(`Creating new game with ID: ${roomCode}`);

      // Create shuffled deck and pyramid cards
      const deck = shuffleDeck(roomCode);
      const pyramidCards = deck.splice(0, 15).map((cardId) => ({
        id: cardId,
        shown: false,
      }));

      // Create a timestamp to help debug concurrency issues
      const timestamp = new Date().toISOString();

      // Create game document in Firestore with a unique debug field
      const gameData = {
        "__pyramid.meta": {
          started: false,
          total_drinks: 0,
          created_at: new Date(),
          fancy_shown: false,
          debug_id: `${timestamp}_${Math.random()
            .toString(36)
            .substring(2, 7)}`,
        },
        "__pyramid.cards": pyramidCards,
        "__pyramid.deck": deck,
      };

      // Create the document
      await setDoc(doc(db, "games", roomCode), gameData);

      setGameId(roomCode);

      // Subscribe to game updates
      subscribeToGameUpdates(roomCode);

      setLoading(false);
      return roomCode;
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Failed to create game. Please try again.");
      setLoading(false);
      throw error;
    }
  };

  // Join an existing game
  const joinGame = async (gameId: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Joining game: ${gameId} as ${name}`);

      // Check if game exists
      const gameRef = doc(db, "games", gameId.toUpperCase());
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error("Game not found");
      }

      if (!userUid) {
        throw new Error("Not authenticated");
      }

      // Get the game data to check if it's started
      const gameData = gameSnap.data() as GameData;
      const gameStarted = gameData["__pyramid.meta"]?.started === true;

      // If game has already started, we need to deal cards to the player immediately
      let playerCards = [];
      if (
        gameStarted &&
        gameData["__pyramid.deck"] &&
        gameData["__pyramid.deck"].length >= 4
      ) {
        console.log("Game has already started, dealing cards to new player");

        // Take 4 cards from the deck for this player
        const newDeck = [...gameData["__pyramid.deck"]];
        const cardIds = newDeck.splice(0, 4);
        playerCards = cardIds.map((id) => ({ i: id, seen: false }));

        // Update the deck in the game data
        await updateDoc(gameRef, {
          "__pyramid.deck": newDeck,
        });

        console.log("Dealt cards to player:", playerCards);
      }

      // Join the game by adding player to game document
      const playerData = {
        admin: false,
        uid: userUid,
        name: name.toUpperCase(),
        drinks: 0,
        initial_deal: gameStarted, // Mark as initial_deal if game already started
        ...(playerCards.length > 0 ? { cards: playerCards } : {}), // Add cards if we dealt them
      };

      console.log("Adding player to game:", playerData);
      await updateDoc(gameRef, {
        [userUid]: playerData,
      });

      setGameId(gameId.toUpperCase());

      // Subscribe to game updates
      subscribeToGameUpdates(gameId.toUpperCase());

      // Save user name in local storage
      localStorage.setItem("playerName", name.toUpperCase());

      setLoading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to join game";
      console.error("Error joining game:", error);
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  // Start the game (host only)
const startGame = async (gameId: string): Promise<void> => {
  try {
    const gameIdUpper = gameId.toUpperCase();
    console.log(`Starting game with ID: ${gameIdUpper}`);

    // Get a fresh reference to the game
    const gameRef = doc(db, "games", gameIdUpper);

    // Get current document data directly from server
    const gameSnap = await getDocFromServer(gameRef);
    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }

    // Get the complete document data
    const gameData = gameSnap.data();
    console.log("Current full game data:", gameData);

    // Create an entirely new meta object
    const newMeta = {
      ...gameData["__pyramid.meta"],
      started: true,
      last_updated: new Date(),
      debug_id: `started_${new Date().toISOString()}`,
    };

    // Create a completely new document with all the same data but updated meta
    const newGameData = {
      ...gameData,
      "__pyramid.meta": newMeta,
    };

    console.log("New game data to save:", newGameData);

    // Complete document replacement instead of field update
    await setDoc(gameRef, newGameData);

    // Force a server read right after update to verify
    setTimeout(async () => {
      const verifySnap = await getDocFromServer(gameRef);
      const verifyData = verifySnap.data();
      console.log("VERIFICATION - Game data after update:", verifyData);
      console.log(
        "VERIFICATION - Started value:",
        verifyData?.["__pyramid.meta"]?.started
      );
    }, 1000);
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

  // Select a card from the pyramid (host only)
const selectCard = async (gameId: string, cardIndex: number): Promise<void> => {
  try {
    console.log(`Selecting card at index ${cardIndex} in game ${gameId}`);

    // Get fresh game data from server to avoid race conditions
    const gameRef = doc(db, "games", gameId.toUpperCase());
    const gameSnap = await getDocFromServer(gameRef);

    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }

    const gameData = gameSnap.data() as GameData;
    console.log("Game data before card selection:", gameData);

    if (
      !gameData ||
      !gameData["__pyramid.cards"] ||
      !gameData["__pyramid.cards"][cardIndex]
    ) {
      console.error("Invalid card index or missing cards data");
      throw new Error("Invalid card data");
    }

    const roundNumber =
      Object.keys(gameData["__pyramid.rounds"] || {}).length + 1;
    const roundRow = Math.ceil((15 - cardIndex) / 5); // Calculate row based on card position
    const cardId = gameData["__pyramid.cards"][cardIndex].id;

    console.log(
      `Selected card details - Round: ${roundNumber}, Row: ${roundRow}, CardId: ${cardId}`
    );

    // Update shown status for the selected card
    const updatedCards = [...gameData["__pyramid.cards"]];
    updatedCards[cardIndex].shown = true;

    // Create a new round
    const updateData = {
      "__pyramid.cards": updatedCards,
      "__pyramid.currentRound": {
        round_number: roundNumber,
        round_row: roundRow,
        round_card: cardId,
      },
      [`__pyramid.rounds.${roundNumber}`]: {
        round_row: roundRow,
        round_card: cardId,
        round_transactions: [],
      },
    };

    console.log("Updating game with:", updateData);

    await updateDoc(gameRef, updateData);
    console.log("Card selection successfully updated in Firebase");

    // Verify the update
    setTimeout(async () => {
      const verifySnap = await getDocFromServer(gameRef);
      console.log("Game data after card selection:", verifySnap.data());
    }, 1000);
  } catch (error) {
    console.error("Error selecting card:", error);
    throw error;
  }
};

  // Call another player to drink
  const callPlayer = async (
    gameId: string,
    fromUid: string,
    toUid: string,
    roundNumber: number
  ): Promise<void> => {
    try {
      const gameRef = doc(db, "games", gameId.toUpperCase());
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data() as GameData;

      if (
        !gameData ||
        !gameData["__pyramid.rounds"] ||
        !gameData["__pyramid.rounds"][roundNumber]
      ) {
        throw new Error("Round not found");
      }

      const transaction: Transaction = {
        t_from: fromUid,
        t_to: toUid,
        status: "waiting",
      };

      const currentRoundTransactions = [
        ...(gameData["__pyramid.rounds"][roundNumber].round_transactions || []),
        transaction,
      ];

      await updateDoc(gameRef, {
        [`__pyramid.rounds.${roundNumber}.round_transactions`]:
          currentRoundTransactions,
      });
    } catch (error) {
      console.error("Error calling player:", error);
      throw error;
    }
  };

  // Respond to a call (accept or call bullshit)
  const respondToCall = async (
    gameId: string,
    fromUid: string,
    toUid: string,
    roundNumber: number,
    accept: boolean
  ): Promise<void> => {
    try {
      const gameRef = doc(db, "games", gameId.toUpperCase());
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data() as GameData;

      if (
        !gameData ||
        !gameData["__pyramid.rounds"] ||
        !gameData["__pyramid.rounds"][roundNumber]
      ) {
        throw new Error("Round not found");
      }

      const transactions =
        gameData["__pyramid.rounds"][roundNumber].round_transactions;
      const transactionIndex = transactions.findIndex(
        (t) =>
          t.t_from === fromUid && t.t_to === toUid && t.status === "waiting"
      );

      if (transactionIndex === -1) {
        throw new Error("Transaction not found");
      }

      const updatedTransactions = [...transactions];
      updatedTransactions[transactionIndex].status = accept
        ? "accepted"
        : "bullshit";

      await updateDoc(gameRef, {
        [`__pyramid.rounds.${roundNumber}.round_transactions`]:
          updatedTransactions,
      });
    } catch (error) {
      console.error("Error responding to call:", error);
      throw error;
    }
  };

  // Show a card for bullshit check
  const showBullshitCard = async (
    gameId: string,
    playerUid: string,
    cardIndex: number,
    roundNumber: number,
    correct: boolean
  ): Promise<void> => {
    try {
      const gameRef = doc(db, "games", gameId.toUpperCase());
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data() as GameData;

      if (!gameData) return;

      const player = gameData[playerUid] as Player;
      if (!player || !player.cards) return;

      // Find transaction
      const transactions =
        gameData["__pyramid.rounds"][roundNumber].round_transactions;
      const transactionIndex = transactions.findIndex(
        (t) => t.t_from === playerUid && t.status === "bullshit"
      );

      if (transactionIndex === -1) return;

      // Update transaction status
      const updatedTransactions = [...transactions];
      updatedTransactions[transactionIndex].status = correct
        ? "bullshit_correct"
        : "bullshit_wrong";

      // Remove card and get a new one
      const newDeck = [...gameData["__pyramid.deck"]];
      const newCard = newDeck.shift();

      const updatedCards = player.cards.filter((_, i) => i !== cardIndex);
      if (newCard !== undefined) {
        updatedCards.push({ i: newCard, seen: false });
      }

      // Update game state
      await updateDoc(gameRef, {
        [`__pyramid.rounds.${roundNumber}.round_transactions`]:
          updatedTransactions,
        [`${playerUid}.cards`]: updatedCards,
        "__pyramid.deck": newDeck,
      });
    } catch (error) {
      console.error("Error showing bullshit card:", error);
      throw error;
    }
  };

  // Subscribe to game updates
  const subscribeToGameUpdates = (gameId: string) => {
    const gameIdUpper = gameId.toUpperCase();
    console.log(`Subscribing to game updates for: ${gameIdUpper}`);

    // Use getDocFromServer to ensure fresh data
    const gameRef = doc(db, "games", gameIdUpper);

    // Get fresh data first
    getDocFromServer(gameRef)
      .then((snapshot) => {
        console.log("Initial fresh server data:", snapshot.data());

        // Process this initial data
        const data = snapshot.data() as GameData | undefined;
        if (data) {
          setGameData(data);

          // Extract players from game data
          const playerEntries = Object.entries(data).filter(
            ([key, value]) =>
              typeof value === "object" && value !== null && "name" in value
          );

          const playersList = playerEntries.map(([uid, player]) => ({
            uid,
            ...(player as Player),
          }));

          setPlayers(playersList);
        }
      })
      .catch((err) => console.error("Error getting fresh data:", err));

    // Then set up real-time listener with metadata to detect data source
    return onSnapshot(
      gameRef,
      { includeMetadataChanges: true },
      (snapshot: DocumentSnapshot) => {
        const source = snapshot.metadata.hasPendingWrites
          ? "Local"
          : snapshot.metadata.fromCache
          ? "Cache"
          : "Server";

        console.log(`Data came from ${source}:`, snapshot.data());

        const data = snapshot.data() as GameData | undefined;
        if (data) {
          // Force data refresh when needed
          if (source === "Cache") {
            console.log("Got cached data, forcing refresh from server");
            getDocFromServer(gameRef).catch((err) =>
              console.error("Refresh error:", err)
            );
          }

          // Log the specific meta field we care about
          console.log("Meta data:", data["__pyramid.meta"]);
          console.log(
            "Started value from Firestore:",
            data["__pyramid.meta"]?.started
          );

          setGameData(data);

          // Extract players from game data
          const playerEntries = Object.entries(data).filter(
            ([key, value]) =>
              typeof value === "object" && value !== null && "name" in value
          );

          const playersList = playerEntries.map(([uid, player]) => ({
            uid,
            ...(player as Player),
          }));

          setPlayers(playersList);
        }
      },
      (error) => {
        console.error("Error getting game updates:", error);
        setError("Failed to get game updates. Please try refreshing the page.");
      }
    );
  };

const markCardsAsSeen = async (
  gameId: string,
  playerUid: string
): Promise<void> => {
  if (!gameId || !playerUid) {
    console.error("Missing gameId or playerUid in markCardsAsSeen");
    return;
  }

  try {
    console.log(
      `Marking cards as seen for player ${playerUid} in game ${gameId}`
    );
    setLoading(true);

    // Get fresh game data
    const gameRef = doc(db, "games", gameId.toUpperCase());
    const gameSnap = await getDocFromServer(gameRef);

    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }

    const gameData = gameSnap.data() as GameData;
    console.log("Game data retrieved:", gameData);
    console.log("Player data:", gameData[playerUid]);

    // Check if player exists
    if (!gameData[playerUid]) {
      console.error("Player not found in game data");
      setLoading(false);
      return;
    }

    // If player exists but doesn't have cards yet, we may need to initialize them
    if (
      !gameData[playerUid].cards ||
      !Array.isArray(gameData[playerUid].cards)
    ) {
      console.log(
        "Player cards not found, checking if we need to initialize cards"
      );

      // If deck exists, we might need to deal cards to this player
      if (
        gameData["__pyramid.deck"] &&
        Array.isArray(gameData["__pyramid.deck"]) &&
        gameData["__pyramid.deck"].length >= 4
      ) {
        console.log("Initializing cards for player from deck");

        // Take the first 4 cards from the deck
        const newDeck = [...gameData["__pyramid.deck"]];
        const playerCards = newDeck
          .splice(0, 4)
          .map((cardId) => ({ i: cardId, seen: true }));

        // Update player cards and deck in database
        await updateDoc(gameRef, {
          [`${playerUid}.cards`]: playerCards,
          [`${playerUid}.initial_deal`]: true,
          "__pyramid.deck": newDeck,
        });

        console.log("Cards initialized for player", playerCards);
        setLoading(false);
        return;
      } else {
        console.error(
          "Cannot initialize cards: deck not found or insufficient cards"
        );
        setLoading(false);
        return;
      }
    }

    // Mark all cards as seen
    const updatedCards = gameData[playerUid].cards.map((card) => ({
      ...card,
      seen: true,
    }));

    console.log("Updating cards in Firebase:", updatedCards);

    // Update Firebase
    await updateDoc(gameRef, {
      [`${playerUid}.cards`]: updatedCards,
    });

    console.log("Cards marked as seen successfully");
    setLoading(false);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to mark cards as seen";
    console.error("Error marking cards as seen:", error);
    setError(errorMessage);
    setLoading(false);
    throw error;
  }
};

// Get a new card for a player (after showing card for bullshit)
const getNewCard = async (
  gameId: string,
  playerUid: string,
  cardIndex: number
): Promise<void> => {
  if (!gameId || !playerUid) {
    console.error("Missing gameId or playerUid in getNewCard");
    return;
  }

  try {
    console.log(`Getting new card for player ${playerUid} in game ${gameId}, replacing card at index ${cardIndex}`);
    setLoading(true);
    
    // Get fresh game data
    const gameRef = doc(db, "games", gameId.toUpperCase());
    const gameSnap = await getDocFromServer(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }
    
    const gameData = gameSnap.data() as GameData;
    
    // Check if player exists and has cards
    if (!gameData[playerUid] || !gameData[playerUid].cards) {
      console.error("Player or player cards not found in game data");
      setLoading(false);
      return;
    }
    
    // Get a new card from the deck
    const newDeck = [...gameData["__pyramid.deck"]];
    const newCard = newDeck.shift();
    
    if (newCard === undefined) {
      throw new Error("No cards left in deck");
    }
    
    // Remove the old card and add the new one
    const updatedCards = gameData[playerUid].cards.filter((_, i) => i !== cardIndex);
    updatedCards.push({ i: newCard, seen: false });
    
    console.log("Updating cards and deck in Firebase:", { updatedCards, newDeck });
    
    // Update Firebase
    await updateDoc(gameRef, {
      [`${playerUid}.cards`]: updatedCards,
      "__pyramid.deck": newDeck
    });
    
    console.log("New card added successfully");
    setLoading(false);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get new card";
    console.error("Error getting new card:", error);
    setError(errorMessage);
    setLoading(false);
    throw error;
  }
};

// Check if a card matches the current round card (for bullshit calls)
const checkCardMatch = (
  gameData: GameData,
  roundNumber: number,
  cardIndex: number
): boolean => {
  if (!gameData["__pyramid.currentRound"] || !gameData["__pyramid.rounds"]) {
    return false;
  }
  
  const currentRound = gameData["__pyramid.currentRound"];
  const roundData = gameData["__pyramid.rounds"][roundNumber];
  
  if (!roundData) {
    return false;
  }
  
  // Get the card index from the player's hand
  const playerCard = gameData[userUid].cards[cardIndex];
  
  // Get rank of the player's card
  const playerCardRank = Math.floor(playerCard.i % 13);
  
  // Get rank of the round card
  const roundCardRank = Math.floor(roundData.round_card % 13);
  
  // Cards match if they have the same rank
  return playerCardRank === roundCardRank;
};

    // Add these functions to the context value
    const value: GameContextType = {
      gameId,
      gameData,
      players,
      loading,
      error,
      joinGame,
      createGame,
      startGame,
      selectCard,
      callPlayer,
      respondToCall,
      showBullshitCard,
      markCardsAsSeen,  // Add this new function
      getNewCard,       // Add this new function
      checkCardMatch    // Add this new function
    };


  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

export default GameContext;
