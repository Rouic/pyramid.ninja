// src/contexts/GameContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  updateDoc,
  onSnapshot,
  DocumentSnapshot,
  getFirestore,
} from "firebase/firestore";
import { CardHelpers } from "../lib/CardHelpers";
import { db as firebaseDb, initializeFirebase } from "../lib/firebase/firebase";
import { useAuth } from "./AuthContext";
import { generateGameCode, shuffleDeck } from "../lib/deckUtils";
import {
  GameContextType,
  GameData,
  Player,
  Transaction,
  YesPlayer,
  YesGameState,
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
  const [db, setDb] = useState(firebaseDb);

  // Initialize Firebase and get Firestore instance
  useEffect(() => {
    // Make sure Firebase is initialized and get the db instance
    const { db: firestoreDb } = initializeFirebase(true, false);
    if (firestoreDb) {
      setDb(firestoreDb);
      console.log("Firestore initialized in GameContext");
    } else {
      // Fallback to getting Firestore directly
      const fallbackDb = getFirestore();
      setDb(fallbackDb);
      console.log("Using fallback Firestore in GameContext");
    }
  }, []);

  


  // Create a new game as host
  const createGame = async (gameType: 'pyramid' | 'yes' = 'pyramid'): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      // Generate a new game code (4 random letters)
      const roomCode = generateGameCode();
      console.log(`Creating new ${gameType} game with ID: ${roomCode}`);

      // Create a shuffled deck
      const deck = shuffleDeck(roomCode);
      
      // Create a timestamp to help debug concurrency issues
      const timestamp = new Date().toISOString();

      // Prepare game data based on game type
      let gameData: any = {
        gameType, // Store the game type
      };

      if (gameType === 'pyramid') {
        // Setup for Pyramid game
        const pyramidCards = deck.splice(0, 15).map((cardId) => ({
          id: cardId,
          shown: false,
        }));

        gameData = {
          ...gameData,
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
      } else if (gameType === 'yes') {
        // Setup for YES game
        gameData = {
          ...gameData,
          "__yes.state": {
            dealer: "", // Will be set when game starts
            currentRound: 0,
            deck: deck,
            usedCards: [],
            started: false,
            playerOrder: [], // Will be populated when players join
          },
        };
      }

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

    // Get player data with proper type checking
    const playerData = gameData[playerUid] as Player;
    
    // If player exists but doesn't have cards yet, we may need to initialize them
    if (
      !playerData?.cards ||
      !Array.isArray(playerData.cards)
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
    const updatedCards = playerData.cards.map((card) => ({
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
    const playerData = gameData[playerUid] as Player;
    if (!playerData || !playerData.cards) {
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
    const updatedCards = playerData.cards.filter((_, i) => i !== cardIndex);
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
  
  // Get the player data with proper type assertion
  const playerData = gameData[userUid] as Player;
  if (!playerData || !playerData.cards || !playerData.cards[cardIndex]) {
    return false;
  }
  
  // Get the card index from the player's hand
  const playerCard = playerData.cards[cardIndex];
  
  // Get rank of the player's card
  const playerCardRank = Math.floor(playerCard.i % 13);
  
  // Get rank of the round card
  const roundCardRank = Math.floor(roundData.round_card % 13);
  
  // Cards match if they have the same rank
  return playerCardRank === roundCardRank;
};

    // YES game related functions
    const startYesGame = async (gameId: string): Promise<void> => {
      try {
        const gameIdUpper = gameId.toUpperCase();
        console.log(`Starting YES game with ID: ${gameIdUpper}`);
        
        const gameRef = doc(db, "games", gameIdUpper);
        
        // Get current game state
        const gameSnap = await getDocFromServer(gameRef);
        if (!gameSnap.exists()) {
          throw new Error("Game not found");
        }
        
        const gameData = gameSnap.data() as GameData;
        
        // Make sure it's a YES game
        if (gameData.gameType !== "yes") {
          throw new Error("Not a YES game");
        }
        
        console.log("Full game data:", gameData);
        
        // Get all player IDs
        const playerIds = Object.keys(gameData).filter(key => 
          typeof gameData[key] === 'object' && 
          gameData[key] !== null && 
          'name' in gameData[key] &&
          !key.startsWith('__')
        );
        
        console.log("Found players:", playerIds);
        
        // Randomly select initial dealer
        const initialDealerId = playerIds[Math.floor(Math.random() * playerIds.length)];
        
        // Arrange players in clockwise order from dealer
        // For now we'll just use the order they joined, starting with dealer
        const dealerIndex = playerIds.indexOf(initialDealerId);
        const playerOrder = [
          ...playerIds.slice(dealerIndex),
          ...playerIds.slice(0, dealerIndex)
        ];
        
        console.log("Player order:", playerOrder, "Initial dealer:", initialDealerId);
        
        // Check if YES state exists and create a new deck if needed
        const yesState = gameData["__yes.state"] as YesGameState;
        console.log("YES state from Firestore:", yesState);
        
        let gameDeck;
        if (!yesState || !yesState.deck || yesState.deck.length === 0) {
          console.log("Creating a new deck as YES state or deck is missing");
          // Create a new deck if one doesn't exist
          gameDeck = shuffleDeck(gameIdUpper);
        } else {
          gameDeck = yesState.deck;
        }
        
        console.log("Game deck for YES game:", gameDeck.length, "cards");
        
        // Prepare state update with correct deck
        const updatedYesState = {
          ...(yesState || {}),
          started: true,
          dealer: initialDealerId,
          playerOrder: playerOrder,
          currentRound: 1,
          deck: gameDeck,
          usedCards: yesState?.usedCards || []
        };
        
        // Update game state
        console.log("Updating YES state:", updatedYesState);
        await updateDoc(gameRef, {
          "__yes.state": updatedYesState
        });
        
        // Deal one card to each player using the new deck
        const remainingDeck = [...gameDeck];
        console.log("Initial deck for dealing:", remainingDeck.length, "cards");
        
        for (const playerId of playerIds) {
          // Take one card from the deck
          const cardId = remainingDeck.shift();
          
          if (cardId === undefined) {
            console.error("Deck is empty when trying to deal to player:", playerId);
            throw new Error("Deck is empty");
          }
          
          console.log(`Dealing card ${cardId} to player ${playerId}`);
          
          // Store the player's card
          await updateDoc(gameRef, {
            [`${playerId}.card`]: { i: cardId, seen: false },
            [`${playerId}.hasSwapped`]: false,
            [`${playerId}.hasChecked`]: false,
            [`${playerId}.lives`]: 3, // Each player starts with 3 lives
            [`${playerId}.isDealer`]: playerId === initialDealerId
          });
        }
        
        // Update the deck after dealing all cards
        console.log("Remaining deck after dealing:", remainingDeck.length, "cards");
        await updateDoc(gameRef, {
          "__yes.state.deck": remainingDeck
        });
        
      } catch (error) {
        console.error("Error starting YES game:", error);
        throw error;
      }
    };
    
    const peekCard = async (gameId: string, playerId: string): Promise<void> => {
      try {
        const gameRef = doc(db, "games", gameId.toUpperCase());
        const gameSnap = await getDocFromServer(gameRef);
        
        if (!gameSnap.exists()) {
          throw new Error("Game not found");
        }
        
        const gameData = gameSnap.data() as GameData;
        
        // Check that this is a YES game and player exists
        const playerData = gameData[playerId] as YesPlayer;
        if (!playerData || !playerData.card) {
          throw new Error("Player or card not found");
        }
        
        // Mark the player's card as seen
        await updateDoc(gameRef, {
          [`${playerId}.card.seen`]: true,
          [`${playerId}.hasChecked`]: true
        });
        
      } catch (error) {
        console.error("Error peeking at card:", error);
        throw error;
      }
    };
    
    const swapCard = async (gameId: string, fromPlayerId: string, toPlayerId: string): Promise<void> => {
      try {
        const gameRef = doc(db, "games", gameId.toUpperCase());
        const gameSnap = await getDocFromServer(gameRef);
        
        if (!gameSnap.exists()) {
          throw new Error("Game not found");
        }
        
        const gameData = gameSnap.data() as GameData;
        
        // Check if the players exist and have YES game data
        const fromPlayerData = gameData[fromPlayerId] as YesPlayer;
        const toPlayerData = gameData[toPlayerId] as YesPlayer;
        
        if (!fromPlayerData || !toPlayerData) {
          throw new Error("Player not found");
        }
        
        // Check if the target player has a King (which blocks swaps)
        const targetCard = toPlayerData.card;
        if (targetCard) {
          const cardRank = targetCard.i % 13;
          
          // King is rank 12 (0-based)
          if (cardRank === 12) {
            // Reveal King and block the swap
            await updateDoc(gameRef, {
              [`${toPlayerId}.card.seen`]: true,
              [`${toPlayerId}.blockingSwap`]: true,
            });
            
            return; // Swap is blocked
          }
        }
        
        // Swap the cards
        const fromPlayerCard = fromPlayerData.card;
        const toPlayerCard = toPlayerData.card;
        
        if (!fromPlayerCard || !toPlayerCard) {
          throw new Error("One or both players don't have cards to swap");
        }
        
        await updateDoc(gameRef, {
          [`${fromPlayerId}.card`]: { ...toPlayerCard, seen: false },
          [`${toPlayerId}.card`]: { ...fromPlayerCard, seen: false },
          [`${fromPlayerId}.hasSwapped`]: true
        });
        
      } catch (error) {
        console.error("Error swapping cards:", error);
        throw error;
      }
    };
    
    const cutDeck = async (gameId: string, dealerId: string): Promise<void> => {
      try {
        const gameRef = doc(db, "games", gameId.toUpperCase());
        const gameSnap = await getDocFromServer(gameRef);
        
        if (!gameSnap.exists()) {
          throw new Error("Game not found");
        }
        
        const gameData = gameSnap.data() as GameData;
        console.log("Game data in cutDeck:", gameData);
        
        // Check that this is a YES game with valid state
        const yesState = gameData["__yes.state"] as YesGameState;
        console.log("YES state in cutDeck:", yesState);
        
        // Create a new deck if needed
        let gameDeck;
        if (!yesState || !yesState.deck || yesState.deck.length === 0) {
          console.log("Creating a new deck as deck is missing in cutDeck");
          gameDeck = shuffleDeck(gameId.toUpperCase());
        } else {
          gameDeck = [...yesState.deck];
        }
        
        console.log("Deck for cutting:", gameDeck.length, "cards");
        
        // Check if dealer exists and has YES game data
        const dealerData = gameData[dealerId] as YesPlayer;
        if (!dealerData) {
          throw new Error("Dealer not found");
        }
        
        // Take a card from the deck
        const cardId = gameDeck.shift();
        
        if (cardId === undefined) {
          throw new Error("Deck is empty");
        }
        
        // Replace dealer's card with the cut card
        const dealerOldCard = dealerData.card;
        if (!dealerOldCard) {
          throw new Error("Dealer doesn't have a card");
        }
        
        // Add old card to used pile
        const usedCards = [...(yesState?.usedCards || []), dealerOldCard.i];
        
        console.log(`Dealer ${dealerId} cut deck, got card ${cardId}`);
        
        await updateDoc(gameRef, {
          [`${dealerId}.card`]: { i: cardId, seen: true },
          "__yes.state.deck": gameDeck,
          "__yes.state.usedCards": usedCards,
          [`${dealerId}.hasCut`]: true
        });
        
      } catch (error) {
        console.error("Error cutting deck:", error);
        throw error;
      }
    };
    
    const revealCards = async (gameId: string): Promise<void> => {
      try {
        const gameRef = doc(db, "games", gameId.toUpperCase());
        const gameSnap = await getDocFromServer(gameRef);
        
        if (!gameSnap.exists()) {
          throw new Error("Game not found");
        }
        
        const gameData = gameSnap.data() as GameData;
        console.log("Game data in revealCards:", gameData);
        
        // Check that this is a YES game with valid state
        const yesState = gameData["__yes.state"] as YesGameState;
        
        if (!yesState) {
          throw new Error("Invalid YES game state - missing state object");
        }
        
        // Handle missing player order
        if (!yesState.playerOrder || !Array.isArray(yesState.playerOrder) || yesState.playerOrder.length === 0) {
          console.error("Missing player order in YES state, using all player IDs");
          // Fallback: get player IDs from gameData
          const playerIds = Object.keys(gameData).filter(key => 
            typeof gameData[key] === 'object' && 
            gameData[key] !== null && 
            'name' in gameData[key] &&
            !key.startsWith('__')
          );
          yesState.playerOrder = playerIds;
        }
        
        // Get all player IDs
        const playerIds = yesState.playerOrder;
        
        // Mark all cards as revealed
        const updates: { [key: string]: any } = {
          "__yes.state.revealPhase": true
        };
        
        // Mark all player cards as revealed
        for (const playerId of playerIds) {
          // Type check the player
          const playerData = gameData[playerId] as YesPlayer;
          if (playerData && playerData.card) {
            updates[`${playerId}.card.seen`] = true;
          }
        }
        
        // Find players with Aces
        const playersWithAces: string[] = [];
        let lowestCardPlayerId: string | null = null;
        let lowestCardValue = 13; // Higher than any card
        
        for (const playerId of playerIds) {
          // Type check the player
          const playerData = gameData[playerId] as YesPlayer;
          if (playerData && playerData.card) {
            const cardRank = playerData.card.i % 13;
            
            // Check for Ace (rank 0)
            if (cardRank === 0) {
              playersWithAces.push(playerId);
            } else if (playersWithAces.length === 0 && cardRank < lowestCardValue) {
              // Track lowest card (only matters if no Aces found)
              lowestCardValue = cardRank;
              lowestCardPlayerId = playerId;
            }
          }
        }
        
        // Determine who loses a life
        if (playersWithAces.length > 0) {
          // Players with Aces lose a life
          for (const playerId of playersWithAces) {
            const playerData = gameData[playerId] as YesPlayer;
            const currentLives = playerData?.lives || 0;
            updates[`${playerId}.lives`] = Math.max(0, currentLives - 1);
            updates[`${playerId}.lostLife`] = true;
          }
        } else if (lowestCardPlayerId) {
          // Player with lowest card loses a life
          const playerData = gameData[lowestCardPlayerId] as YesPlayer;
          const currentLives = playerData?.lives || 0;
          updates[`${lowestCardPlayerId}.lives`] = Math.max(0, currentLives - 1);
          updates[`${lowestCardPlayerId}.lostLife`] = true;
        }
        
        await updateDoc(gameRef, updates);
        
      } catch (error) {
        console.error("Error revealing cards:", error);
        throw error;
      }
    };
    
    const nextRound = async (gameId: string): Promise<void> => {
      try {
        const gameRef = doc(db, "games", gameId.toUpperCase());
        const gameSnap = await getDocFromServer(gameRef);
        
        if (!gameSnap.exists()) {
          throw new Error("Game not found");
        }
        
        const gameData = gameSnap.data() as GameData;
        console.log("Game data in nextRound:", gameData);
        
        // Check that this is a YES game with valid state
        const yesState = gameData["__yes.state"] as YesGameState;
        if (!yesState) {
          throw new Error("Invalid YES game state");
        }
        
        // Ensure we have a deck - create a new one if needed
        let gameDeck;
        if (!yesState.deck || yesState.deck.length === 0) {
          console.log("Creating a new deck in nextRound as deck is missing");
          gameDeck = shuffleDeck(gameId.toUpperCase());
        } else {
          // Move used cards to the bottom of the deck
          gameDeck = [
            ...(yesState.deck || []),
            ...(yesState.usedCards || [])
          ];
        }
        
        console.log("Deck for next round:", gameDeck.length, "cards");
        
        // Get all player IDs from the playerOrder
        const playerIds = yesState.playerOrder || [];
        
        // Add the current dealer's card to used cards (for tracking)
        const currentDealerId = yesState.dealer;
        
        if (!currentDealerId) {
          throw new Error("No dealer specified");
        }
        
        const dealerData = gameData[currentDealerId] as YesPlayer;
        const currentDealerCard = dealerData?.card?.i;
        
        // Determine the next dealer
        const currentDealerIndex = playerIds.indexOf(currentDealerId);
        if (currentDealerIndex === -1) {
          throw new Error("Dealer not found in player order");
        }
        
        const nextDealerIndex = (currentDealerIndex + 1) % playerIds.length;
        const nextDealerId = playerIds[nextDealerIndex];
        
        // Check if any players have zero lives - they're eliminated
        const remainingPlayers = playerIds.filter(playerId => {
          const player = gameData[playerId] as YesPlayer;
          return player && player.lives > 0;
        });
        
        // If only one player remains, they are the winner
        const gameOver = remainingPlayers.length <= 1;
        const winner = remainingPlayers.length === 1 ? remainingPlayers[0] : null;
        
        // Create updates object
        const updates: { [key: string]: any } = {
          "__yes.state": {
            ...yesState,
            dealer: nextDealerId,
            currentRound: (yesState.currentRound || 0) + 1,
            deck: gameDeck,
            usedCards: [],
            revealPhase: false,
            finished: gameOver,
            winner: winner
          }
        };
        
        // Reset player state for the new round
        for (const playerId of playerIds) {
          const playerData = gameData[playerId] as YesPlayer;
          
          // Skip eliminated players
          if (!playerData || playerData.lives <= 0) continue;
          
          // Move their card to used pile
          if (playerData.card?.i !== undefined) {
            updates["__yes.state.usedCards"] = [...(updates["__yes.state.usedCards"] || []), playerData.card.i];
          }
          
          // Reset player state
          updates[`${playerId}.card`] = null;
          updates[`${playerId}.hasSwapped`] = false;
          updates[`${playerId}.hasChecked`] = false;
          updates[`${playerId}.isDealer`] = playerId === nextDealerId;
          updates[`${playerId}.lostLife`] = false;
          updates[`${playerId}.blockingSwap`] = false;
          updates[`${playerId}.hasCut`] = false;
        }
        
        // Deal new cards for the next round
        if (!gameOver) {
          // Take cards from the top of the deck for each player
          const newDeck = [...gameDeck];
          console.log("Dealing new cards from deck with", newDeck.length, "cards");
          
          for (const playerId of playerIds) {
            const playerData = gameData[playerId] as YesPlayer;
            
            // Skip eliminated players
            if (!playerData || playerData.lives <= 0) continue;
            
            const cardId = newDeck.shift();
            if (cardId === undefined) {
              console.error("Deck is empty when dealing cards to player:", playerId);
              
              // Create more cards if needed
              const extraCards = shuffleDeck(gameId.toUpperCase());
              newDeck.push(...extraCards);
              console.log("Added extra cards to deck, now has", newDeck.length, "cards");
              
              // Try again with the new deck
              const newCardId = newDeck.shift();
              if (newCardId !== undefined) {
                updates[`${playerId}.card`] = { i: newCardId, seen: false };
                console.log(`Dealt card ${newCardId} to player ${playerId} from extended deck`);
              } else {
                console.error("Still couldn't get a card even after extending the deck");
                break;
              }
            } else {
              updates[`${playerId}.card`] = { i: cardId, seen: false };
              console.log(`Dealt card ${cardId} to player ${playerId}`);
            }
          }
          
          console.log("Remaining deck after dealing:", newDeck.length, "cards");
          updates["__yes.state.deck"] = newDeck;
        }
        
        await updateDoc(gameRef, updates);
        
      } catch (error) {
        console.error("Error advancing to next round:", error);
        throw error;
      }
    };

    // Add these functions to the context value
    const value: GameContextType = {
      gameId,
      gameData,
      players,
      loading,
      error,
      
      // Common functions
      joinGame,
      createGame,
      
      // Pyramid game functions
      startGame,
      selectCard,
      callPlayer,
      respondToCall,
      showBullshitCard,
      markCardsAsSeen,
      getNewCard,
      checkCardMatch,
      
      // YES game functions
      startYesGame,
      peekCard,
      swapCard,
      cutDeck,
      revealCards,
      nextRound
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
