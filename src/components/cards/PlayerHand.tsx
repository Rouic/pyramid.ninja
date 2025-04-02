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
  debug?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardSelect,
  showAllCards = false,
  countdownActive = false,
  className = "",
  debug = false,
}) => {
  const [viewableCards, setViewableCards] = useState<boolean[]>([]);
  const [dragPositions, setDragPositions] = useState<
    { x: number; y: number }[]
  >([]);

  // Initialize drag positions with default coordinates
  useEffect(() => {
    if (cards) {
      const initialPositions = cards.map((_, index) => {
        const coords = getPlayerCardCoordinates(index);
        // Center the cards in the container
        return {
          x: coords.x + 200 - 50, // 200 is half container width, 50 is half card width
          y: coords.y,
        };
      });
      setDragPositions(initialPositions);
    }
  }, [cards.length]); // Only recreate positions when number of cards changes

  // Update viewable cards when props change
  useEffect(() => {
    if (debug)
      console.log("PlayerHand cards:", cards, "showAllCards:", showAllCards);

    if (cards && cards.length > 0) {
      // If showAllCards is true, show all cards, otherwise show only those marked as seen
      const newViewableState = showAllCards
        ? Array(cards.length).fill(true)
        : cards.map((card) => card.seen || false);

      if (debug) console.log("New viewable state:", newViewableState);
      setViewableCards(newViewableState);
    }
  }, [cards, showAllCards, debug]);

  // Reset to hidden state when countdown ends
  useEffect(() => {
    if (!countdownActive && showAllCards) {
      if (debug) console.log("Countdown ended, hiding cards");

      // Reset to normal visibility state (seen/unseen)
      setViewableCards(cards.map((card) => card.seen || false));
    }
  }, [countdownActive, showAllCards, cards, debug]);

  // Handle card selection
  const handleCardSelect = (cardIndex: number) => {
    if (debug) console.log("Card selected:", cardIndex);

    if (onCardSelect) {
      onCardSelect(cardIndex);
    }
  };

  // Update card position when dragged
  const updateCardPosition = (
    index: number,
    newPosition: { x: number; y: number }
  ) => {
    const newPositions = [...dragPositions];
    newPositions[index] = newPosition;
    setDragPositions(newPositions);
  };

  if (cards.length === 0) {
    return (
      <div
        className={`relative mx-auto ${className}`}
        style={{ width: "400px", height: "350px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-lg">
          Waiting for cards...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{ width: "400px", height: "350px" }}
    >
      {cards.map((card, index) => {
        const position =
          dragPositions[index] || getPlayerCardCoordinates(index);
        const isFaceUp = viewableCards[index] || false;

        return (
          <Card
            key={`player-card-${index}-${card.i}`}
            index={card.i}
            position={position}
            faceUp={isFaceUp}
            draggable={showAllCards || card.seen}
            onClick={() => handleCardSelect(index)}
            className={`transition-transform duration-300 ease-out ${
              onCardSelect ? "hover:scale-105" : ""
            }`}
          />
        );
      })}
    </div>
  );
};

export default PlayerHand;
