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
  showFaceUp: boolean;
  highlightCurrentRank?: string;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  gameId,
  isGameStarted,
  showFaceUp,
  highlightCurrentRank,
}) => {
  const { playerId } = usePlayerContext();
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to player's cards
  useEffect(() => {
    if (!gameId || !playerId) return;

    console.log(
      `Subscribing to cards for player ${playerId} in game ${gameId}`
    );
    setIsLoading(true);

    const unsubscribe = subscribeToPlayerCards(gameId, playerId, (cards) => {
      console.log(`Received ${cards.length} cards for player ${playerId}`);
      setPlayerCards(cards);
      setIsLoading(false);
    });

    return () => {
      console.log(`Unsubscribing from player cards for ${playerId}`);
      unsubscribe();
    };
  }, [gameId, playerId]);

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
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 px-4">
        Your Cards{" "}
        {isLoading && (
          <span className="text-xs text-gray-500">(loading...)</span>
        )}
        {!showFaceUp && !isLoading && (
          <span className="text-xs text-red-500 ml-2">
            (hidden - remember your cards!)
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

            return (
              <GameCard
                key={card.id}
                card={card}
                index={index}
                position={position}
                isRevealing={false}
                canInteract={isGameStarted}
                className={`cursor-move ${
                  shouldHighlight ? "ring-4 ring-yellow-400 z-20" : ""
                }`}
                onReveal={() => {}} // No reveal needed for player's own cards
                allowPeek={!showFaceUp && card.rank === highlightCurrentRank} // Allow peeking when card matches current pyramid card
                showFace={showFaceUp} // Show face up during memorization phase
              />
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
