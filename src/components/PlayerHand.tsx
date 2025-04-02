// src/components/PlayerHand.tsx
import React, { useState, useEffect } from "react";
import { Card } from "../lib/deck";
import GameCard from "./GameCard";
import {
  subscribeToPlayerCards,
  updatePlayerCard,
} from "../lib/firebase/gameCards";
import { usePlayerContext } from "../context/PlayerContext";

interface PlayerHandProps {
  gameId: string;
  isGameStarted: boolean;
  showFaceUp: boolean; // Only true during memorization phase or end of game
  highlightCurrentRank?: string;
  allowCardFlip?: boolean; // Controls when cards can be flipped
  challengedCardIndex?: number; // Indicates which card is being challenged
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  gameId,
  isGameStarted,
  showFaceUp,
  highlightCurrentRank,
  allowCardFlip = false,
  challengedCardIndex = -1,
}) => {
  const { playerId } = usePlayerContext();
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCardTimers, setNewCardTimers] = useState<{
    [cardId: string]: number;
  }>({});

  // Subscribe to player's cards
  useEffect(() => {
    if (!gameId || !playerId) return;

    console.log(
      `Subscribing to cards for player ${playerId} in game ${gameId}`
    );
    setIsLoading(true);

    const unsubscribe = subscribeToPlayerCards(gameId, playerId, (cards) => {
      console.log(`Received ${cards.length} cards for player ${playerId}`);

      // Check for new cards and set timers
      cards.forEach((card) => {
        if (card.newCard && !newCardTimers[card.id]) {
          // Start a 15-second timer for this new card
          setNewCardTimers((prev) => ({
            ...prev,
            [card.id]: 15, // 15 seconds
          }));
        }
      });

      setPlayerCards(cards);
      setIsLoading(false);
    });

    return () => {
      console.log(`Unsubscribing from player cards for ${playerId}`);
      unsubscribe();
    };
  }, [gameId, playerId]);

  // Handle countdown timers for new cards
  useEffect(() => {
    // Only run timers if we have any new cards
    if (Object.keys(newCardTimers).length === 0) return;

    const timerInterval = setInterval(() => {
      setNewCardTimers((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        // Decrease each timer by 1 second
        Object.keys(updated).forEach((cardId) => {
          if (updated[cardId] > 0) {
            updated[cardId] -= 1;
            hasChanges = true;
          }

          // Remove timers that have reached 0
          if (updated[cardId] === 0) {
            delete updated[cardId];
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [newCardTimers]);

  const handleCardMove = async (
    card: Card,
    position: { x: number; y: number }
  ) => {
    if (!isGameStarted) return;

    try {
      await updatePlayerCard(gameId, playerId, card.id, {
        position,
      });
    } catch (error) {
      console.error("Error updating card position:", error);
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

            // Determine if this card should be highlighted
            const shouldHighlight =
              highlightCurrentRank && card.rank === highlightCurrentRank;

            // Determine if this specific card is being challenged
            const canFlipThisCard = challengedCardIndex === index;

            // Check if this card has an active timer
            const hasTimer = newCardTimers[card.id] > 0;
            const timeRemaining = hasTimer ? newCardTimers[card.id] : 0;

            return (
              <div key={card.id} className="relative">
                <GameCard
                  card={card}
                  index={index}
                  position={position}
                  isRevealing={false}
                  canInteract={isGameStarted}
                  className={`cursor-move ${
                    shouldHighlight || canFlipThisCard
                      ? "ring-4 ring-yellow-400 z-20"
                      : ""
                  }`}
                  onReveal={() => {}} // No reveal needed for player's own cards
                  allowPeek={!showFaceUp && card.rank === highlightCurrentRank} // Allow peeking when card matches current pyramid card
                  showFace={showFaceUp || canFlipThisCard || card.newCard} // Show face up during memorization, challenges, or if it's a new card
                  allowFlip={allowCardFlip && canFlipThisCard} // Only allow flipping under specific circumstances
                />

                {/* New card timer overlay */}
                {hasTimer && (
                  <div className="absolute top-0 left-0 right-0 bg-green-600 bg-opacity-80 text-white text-center py-1 z-30 rounded-t-lg">
                    <div className="text-xs font-bold">NEW CARD</div>
                    <div className="text-sm">
                      {timeRemaining}s left to memorize
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && isGameStarted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
