// src/contexts/GameContext.tsx
import React, { createContext, useContext, useState } from "react";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
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

      // Create shuffled deck and pyramid cards
      const deck = shuffleDeck(roomCode);
      const pyramidCards = deck.splice(0, 15).map((cardId) => ({
        id: cardId,
        shown: false,
      }));

      // Create game document in Firestore
      await setDoc(doc(db, "games", roomCode), {
        "__pyramid.meta": {
          started: false,
          total_drinks: 0,
          created_at: new Date(),
          fancy_shown: false,
        },
        "__pyramid.cards": pyramidCards,
        "__pyramid.deck": deck,
      });

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

      // Check if game exists
      const gameRef = doc(db, "games", gameId.toUpperCase());
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        throw new Error("Game not found");
      }

      if (!userUid) {
        throw new Error("Not authenticated");
      }

      // Join the game by adding player to game document
      await updateDoc(gameRef, {
        [userUid]: {
          admin: true,
          uid: userUid,
          name: name.toUpperCase(),
          drinks: 0,
          initial_deal: false,
        },
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
      const gameRef = doc(db, "games", gameId.toUpperCase());
      await updateDoc(gameRef, {
        "__pyramid.meta.started": true,
      });
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  };

  // Select a card from the pyramid (host only)
  const selectCard = async (
    gameId: string,
    cardIndex: number
  ): Promise<void> => {
    try {
      const gameRef = doc(db, "games", gameId.toUpperCase());
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data() as GameData;

      if (!gameData) return;

      const roundNumber =
        Object.keys(gameData["__pyramid.rounds"] || {}).length + 1;
      const roundRow = Math.ceil((15 - cardIndex) / 5); // Calculate row based on card position
      const cardId = gameData["__pyramid.cards"][cardIndex].id;

      // Update shown status for the selected card
      const updatedCards = [...gameData["__pyramid.cards"]];
      updatedCards[cardIndex].shown = true;

      // Create a new round
      await updateDoc(gameRef, {
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
      });
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
    const gameRef = doc(db, "games", gameId);

    return onSnapshot(
      gameRef,
      (snapshot: DocumentSnapshot) => {
        const data = snapshot.data() as GameData | undefined;
        if (data) {
          setGameData(data);

          // Extract players from game data
          const playerEntries = Object.entries(data).filter(
            ([key]) =>
              key !== "__pyramid.meta" &&
              key !== "__pyramid.cards" &&
              key !== "__pyramid.deck" &&
              key !== "__pyramid.currentRound" &&
              key !== "__pyramid.rounds" &&
              key !== "__pyramid.summary"
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

  // Context value
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
