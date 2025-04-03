// src/components/PlayerHand.tsx
import React, { useState, useEffect } from "react";
import { Card } from "../lib/deck";
import GameCard from "./GameCard";
import {
  subscribeToPlayerCards,
  updatePlayerCard,
} from "../lib/firebase/gameCards";
import { usePlayerContext } from "../context/PlayerContext";
import { replacePlayerCard, clearPlayerChallengeState } from "../lib/firebase/gameState";
import NewCardTimer from "./NewCardTimer"; // Import the timer component
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";

interface PlayerHandProps {
  gameId: string;
  isGameStarted: boolean;
  showFaceUp: boolean; // Only true during memorization phase or end of game
  highlightCurrentRank?: string;
  allowCardFlip?: boolean; // Controls when cards can be flipped
  challengedCardIndex?: number; // Indicates which card is being challenged
  onCardSelect?: (cardIndex: number) => void; // For handling card selection
  isSelectingForChallenge?: boolean; // Indicates if we're in challenge select mode
  onReplaceCard?: (cardIndex: number) => Promise<void>; // Added this prop for card replacement
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  gameId,
  isGameStarted,
  showFaceUp,
  highlightCurrentRank,
  allowCardFlip = false,
  challengedCardIndex = -1,
  onCardSelect,
  isSelectingForChallenge = false,
  onReplaceCard, // New parameter
}) => {
  const { playerId } = usePlayerContext();
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCardForChallenge, setSelectedCardForChallenge] = useState<
    number | null
  >(null);
  const [isDeckEmpty, setIsDeckEmpty] = useState(false);
  const [replacingCardIndex, setReplacingCardIndex] = useState<number | null>(
    null
  );
  const [shownCards, setShownCards] = useState<number[]>([]);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);
  const [newCardTimestamp, setNewCardTimestamp] = useState<string | null>(null);
  const [hidingCard, setHidingCard] = useState<boolean>(false);

  // Subscribe to player's cards
  useEffect(() => {
    if (!gameId || !playerId) return;

    console.log(
      `Subscribing to cards for player ${playerId} in game ${gameId}`
    );
    setIsLoading(true);

    const unsubscribe = subscribeToPlayerCards(gameId, playerId, (cards) => {
      console.log(`Received ${cards.length} cards for player ${playerId}`);

      // Find any new card and record its index and timestamp
      const newCard = cards.findIndex((card) => card.newCard === true);
      if (newCard !== -1) {
        setNewCardIndex(newCard);
        // Use replacedAt if available, otherwise use current time
        setNewCardTimestamp(
          cards[newCard].replacedAt || new Date().toISOString()
        );
      } else {
        setNewCardIndex(null);
        setNewCardTimestamp(null);
      }

      setPlayerCards(cards);
      setIsLoading(false);
    });

    // Subscribe to player document to watch for needsCardReplacement flag
    const playerRef = doc(db, "games", gameId, "players", playerId);
    const playerUnsubscribe = onSnapshot(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        const playerData = snapshot.data();
        if (playerData.needsCardReplacement && playerData.cardToReplace !== undefined) {
          console.log(`🃏 AUTO-REPLACE: Detected card replacement needed for index ${playerData.cardToReplace}`);
          
          // Automatically replace the card
          handleReplaceCard(playerData.cardToReplace);
          
          // Clear the flag to prevent multiple replacements
          updateDoc(playerRef, {
            needsCardReplacement: false,
            cardToReplace: null
          }).catch(err => console.error("Error clearing replacement flags:", err));
        }
      }
    });

    return () => {
      console.log(`Unsubscribing from player cards for ${playerId}`);
      unsubscribe();
      playerUnsubscribe();
    };
  }, [gameId, playerId]);

  // Reset selected card when challenge mode is exited
  useEffect(() => {
    if (!isSelectingForChallenge) {
      setSelectedCardForChallenge(null);
    }
  }, [isSelectingForChallenge]);

  // Track cards that have been shown in challenges
  useEffect(() => {
    if (
      challengedCardIndex !== -1 &&
      !shownCards.includes(challengedCardIndex)
    ) {
      setShownCards((prev) => [...prev, challengedCardIndex]);
    }
  }, [challengedCardIndex, shownCards]);

  const handleReplaceCard = async (cardIndex: number) => {
    if (!gameId || !playerId) return;

    setReplacingCardIndex(cardIndex);

    try {
      // If external handler is provided, use it
      if (onReplaceCard) {
        await onReplaceCard(cardIndex);
      } else {
        // Otherwise use the default implementation
        await replacePlayerCard(gameId, playerId, cardIndex);
      }

      // Remove card from shown cards after replacement
      setShownCards((prev) => prev.filter((idx) => idx !== cardIndex));
    } catch (error) {
      console.error("Error replacing card:", error);
    } finally {
      setReplacingCardIndex(null);
    }
  };

  // Handler for card selection during challenge
  const handleCardSelect = (card: Card, index: number) => {
    console.log("🎮 Card selected:", index, "isSelectingForChallenge:", isSelectingForChallenge);
    
    if (isSelectingForChallenge && onCardSelect) {
      // Only allow selection if no card is already selected or this is the selected card
      if (
        selectedCardForChallenge === null ||
        selectedCardForChallenge === index
      ) {
        console.log("🎮 CHALLENGE FLOW: Selected card for challenge", index);
        setSelectedCardForChallenge(index);
        onCardSelect(index);
      }
    }
  };

  // Handler for when a new card timer ends
  const handleNewCardTimerEnd = async () => {
    if (newCardIndex === null || !gameId || !playerId) return;

    try {
      setHidingCard(true);
      console.log(`🃏 AUTO-HIDE: Hiding card at index ${newCardIndex} after timer ended`);
      
      // Find the card that needs to be hidden
      const cardToHide = playerCards[newCardIndex];
      if (!cardToHide) {
        console.error("Card to hide not found");
        setHidingCard(false);
        return;
      }

      // Important: Check for card.i instead of card.id
      // The card structure might be using .i as the identifier
      if (cardToHide.i === undefined && cardToHide.id === undefined) {
        console.error("Card has no identifier (i or id)");
        setHidingCard(false);
        return;
      }

      // Get the card identifier (either .i or .id)
      const cardId = cardToHide.id || cardToHide.i.toString();

      console.log(`🃏 AUTO-HIDE: Processing card ${cardId} after memorization timer`);

      // SIMPLIFIED: Don't call clearPlayerChallengeState directly to avoid infinite loops
      // Instead, directly update our card state
      
      // COMPLETELY REPLACE the card object with a fresh version that has ONLY the necessary properties
      // This prevents any lingering state that might cause the card to show "click to reveal"
      try {
        const playerRef = doc(db, "games", gameId, "players", playerId);
        
        // Get all player cards
        const snapshot = await getDoc(playerRef);
        if (snapshot.exists()) {
          const playerData = snapshot.data();
          const cards = [...(playerData.cards || [])];
          
          // Create a completely fresh card object with only the needed properties
          if (cards[newCardIndex]) {
            // Keep only the essential properties (like suit, value, id) and reset all state flags
            // Extract the card's core properties
            const i = cards[newCardIndex].i;
            const suit = cards[newCardIndex].suit;
            const rank = cards[newCardIndex].rank;
            const value = cards[newCardIndex].value;
            
            // Create a completely fresh card with clean state
            cards[newCardIndex] = {
              i, // Index in the deck (0-51)
              suit, // Keep the suit
              rank, // Keep the rank
              value, // Keep the value if exists
              faceVisible: false, // NOT visible to player
              newCard: false, // NOT new anymore
              revealed: false, // NOT revealed
              seen: true, // Player has seen it
              // Explicitly remove all challenge-related properties
              isInChallenge: false,
              challengeCardIndex: null,
              userFlipped: false
            };
            
            // Aggressive update of the player document
            await updateDoc(playerRef, {
              cards,
              isInChallenge: false, // Ensure player is not in challenge mode
              challengeCardIndex: null, // Clear any selected card index
              updatedAt: new Date().toISOString()
            });
            
            // SIMPLIFIED: Just clear the specific timer for this card
            const gameRef = doc(db, "games", gameId);
            await updateDoc(gameRef, {
              [`newCardTimers.${playerId}.${cardId}`]: null
            });
          } else {
            // Just update player state if we can't find the card
            await updateDoc(playerRef, {
              isInChallenge: false,
              challengeCardIndex: null
            });
          }
        }
        console.log("✅ Successfully reset card state after memorization");
      } catch (err) {
        console.error("❌ Error clearing player challenge state:", err);
      }

      // Log the change
      console.log(`🃏 AUTO-HIDE: Card ${cardId} successfully hidden after memorization`);

      // Reset state including challenge state
      setNewCardIndex(null);
      setNewCardTimestamp(null);
      setHidingCard(false);
      
      // Remove card from shown cards to ensure UI reflects new state
      setShownCards((prev) => prev.filter((idx) => idx !== newCardIndex));
    } catch (error) {
      console.error("❌ Error handling new card timer end:", error);
      setHidingCard(false);
    }
  };

  return (
    <div className="w-full h-48 md:h-56 relative border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mt-8 pt-4">
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 px-4 flex justify-between items-center">
        <span>Your Cards</span>
        {isLoading && (
          <span className="text-xs text-gray-500">(loading...)</span>
        )}
        {!showFaceUp && !isLoading && (
          <span className="text-xs text-red-500 inline-flex items-center">
            <svg
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                clipRule="evenodd"
              />
            </svg>
            Cards hidden - remember what you have!
          </span>
        )}

        {isSelectingForChallenge && (
          <span className="text-xs text-yellow-500 font-bold animate-pulse">
            Select a card to show for the challenge
          </span>
        )}
      </h3>

      <div className="relative h-36 md:h-44 w-full px-4">
        {playerCards.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-gray-500">
            {isGameStarted
              ? "No cards in your hand yet. Waiting for deal..."
              : "Cards will appear here once the game starts"}
          </div>
        ) : (
          playerCards.map((card, index) => {
            // Calculate default fan layout if position not set
            const defaultX = 20 + index * (window.innerWidth < 768 ? 25 : 35);
            const position = card.position || { x: defaultX, y: 10 };

            // Determine if this specific card is being challenged
            const isBeingChallenged = challengedCardIndex === index;

            // Determine if this card has been selected for challenge
            const isSelected = selectedCardForChallenge === index;

            // Check if card has been shown in a challenge
            const hasBeenShown = shownCards.includes(index);

            // Clear shown state for new cards (important to prevent issues after replacement)
            if (card.newCard && hasBeenShown) {
              setShownCards(prev => prev.filter(idx => idx !== index));
            }

            // Determine if this card is selectable for challenge
            const isSelectable =
              isSelectingForChallenge &&
              (selectedCardForChallenge === null ||
                selectedCardForChallenge === index);

            // Only highlight cards if they're face up AND match current rank,
            // OR if they're specifically selected for challenge
            // This prevents giving clues about face-down cards
            const shouldHighlight =
              (showFaceUp &&
                highlightCurrentRank &&
                card.rank === highlightCurrentRank) ||
              isSelected ||
              isBeingChallenged;

            // Fix for "click to reveal" issue - determine when to allow peeking
            // A card should be peekable during memorization or if it's a new card, but not in challenge mode
            const allowPeekForCard =
              (!showFaceUp && shouldHighlight) ||
              (card.newCard && !isSelectingForChallenge);

            // Fix for card visibility - update logic for when to show card face
            // Include a check for specific cases where we want to show the card
            const showCardFace =
              showFaceUp || 
              isBeingChallenged || 
              card.newCard || 
              (card.faceVisible === true);

            return (
              <div key={card.id || index} className="relative">
                <GameCard
                  card={card}
                  index={index}
                  position={position}
                  isRevealing={false}
                  canInteract={isGameStarted}
                  className={`cursor-move ${
                    shouldHighlight || isBeingChallenged
                      ? "ring-4 ring-yellow-400 z-20"
                      : ""
                  } ${
                    isSelected
                      ? "ring-4 ring-blue-600 z-30"
                      : isSelectable
                      ? "hover:scale-110 hover:ring-2 hover:ring-blue-400"
                      : ""
                  }`}
                  onReveal={() => {
                    if (isSelectable) {
                      // Simply handle card selection - nothing more
                      handleCardSelect(card, index);
                    }
                  }}
                  allowPeek={allowPeekForCard}
                  showFace={showCardFace}
                  allowFlip={
                    allowCardFlip && (isBeingChallenged || isSelectable)
                  }
                  isHighlighted={isSelectable}
                  isSelectingForChallenge={isSelectingForChallenge}
                />

                {/* New card indicator */}
                {card.newCard && (
                  <div className="absolute top-0 left-0 right-0 bg-green-600 bg-opacity-80 text-white text-center py-1 z-30 rounded-t-lg">
                    <div className="text-xs font-bold">NEW CARD</div>
                    <div className="text-sm">Memorize this card!</div>
                  </div>
                )}

                {/* Card needs replacement indicator (removed - now automatically handled by the challenge flow) */}

                
              </div>
            );
          })
        )}

        {isLoading && isGameStarted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {hidingCard && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-40 rounded-lg">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-sm font-medium">Hiding card...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add the new card timer */}
      {newCardIndex !== null && newCardTimestamp && (
        <NewCardTimer
          replacedAt={newCardTimestamp}
          onTimeEnd={handleNewCardTimerEnd}
        />
      )}
    </div>
  );
};

export default PlayerHand;
