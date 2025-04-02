// src/components/cards/PlayerHand.tsx
import React, { useState, useEffect } from "react";
import Card from "./Card";
import { PlayerCard } from "../../types";
import { getPlayerCardCoordinates } from "../../lib/deckUtils";

interface PlayerHandProps {
  cards: PlayerCard[];
  onCardSelect?: (index: number) => void;
  showAllCards?: boolean;
  countdownActive?: boolean;
  className?: string;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardSelect,
  showAllCards = false,
  countdownActive = false,
  className = "",
}) => {
  const [viewableCards, setViewableCards] = useState<boolean[]>([]);

  // Update viewable cards when props change
  useEffect(() => {
    if (cards) {
      // If showAllCards is true, show all cards, otherwise show only those marked as seen
      const newViewableState = showAllCards
        ? Array(cards.length).fill(true)
        : cards.map((card) => card.seen);

      setViewableCards(newViewableState);
    }
  }, [cards, showAllCards]);

  // Reset to hidden state when countdown ends
  useEffect(() => {
    if (!countdownActive && showAllCards) {
      // Reset to normal visibility state (seen/unseen)
      setViewableCards(cards.map((card) => card.seen));
    }
  }, [countdownActive, showAllCards, cards]);

  // Handle card selection
  const handleCardSelect = (cardIndex: number) => {
    if (onCardSelect) {
      onCardSelect(cardIndex);
    }
  };

  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{ width: "400px", height: "350px" }}
    >
      {cards.map((card, index) => {
        const coords = getPlayerCardCoordinates(index);
        // Center the cards in the container
        const adjustedX = coords.x + 200 - 50; // 200 is half container width, 50 is half card width
        const adjustedY = coords.y;

        return (
          <Card
            key={index}
            index={card.i}
            position={{ x: adjustedX, y: adjustedY }}
            faceUp={viewableCards[index]}
            draggable={true}
            onClick={() => handleCardSelect(index)}
            className={`transition-transform duration-300 ease-out ${
              onCardSelect ? "hover:scale-105 cursor-pointer" : ""
            }`}
          />
        );
      })}
    </div>
  );
};

export default PlayerHand;
