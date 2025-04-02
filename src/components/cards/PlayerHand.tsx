// src/components/cards/PlayerHand.tsx
import React, { useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPositionSetRef = useRef(false);

  // Initialize drag positions with default coordinates
  useEffect(() => {
    if (cards.length > 0 && !initialPositionSetRef.current) {
      const initialPositions = cards.map((_, index) => {
        const coords = getPlayerCardCoordinates(index);
        // Center the cards in the container
        const containerWidth = containerRef.current?.clientWidth || 400;
        return {
          x: coords.x + containerWidth / 2 - 50, // 50 is half card width
          y: coords.y,
        };
      });

      setDragPositions(initialPositions);
      initialPositionSetRef.current = true;

      if (debug) console.log("Initial card positions set:", initialPositions);
    }
  }, [cards.length, debug]);

  // Reset position tracking when cards array changes length
  useEffect(() => {
    if (
      initialPositionSetRef.current &&
      dragPositions.length !== cards.length
    ) {
      initialPositionSetRef.current = false;
    }
  }, [cards.length, dragPositions.length]);

  // Update viewable cards when props change
  useEffect(() => {
    if (debug)
      console.log(
        "PlayerHand update - cards:",
        cards,
        "showAllCards:",
        showAllCards
      );

    if (cards && cards.length > 0) {
      // If showAllCards is true, show all cards, otherwise show only those marked as seen
      const newViewableState = showAllCards
        ? Array(cards.length).fill(true)
        : cards.map((card) => card.seen || false);

      if (debug) console.log("Setting new viewable state:", newViewableState);
      setViewableCards(newViewableState);
    }
  }, [cards, showAllCards, debug]);

  // Reset to hidden state when countdown ends
  useEffect(() => {
    if (!countdownActive && showAllCards) {
      if (debug) console.log("Countdown ended, resetting card visibility");

      // Delay this slightly to allow for transition effects
      const timer = setTimeout(() => {
        setViewableCards(cards.map((card) => card.seen || false));
      }, 500);

      return () => clearTimeout(timer);
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

  if (!cards || cards.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center mx-auto ${className}`}
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
      ref={containerRef}
      className={`relative mx-auto ${className}`}
      style={{ width: "400px", height: "350px", overflow: "visible" }}
    >
      {cards.map((card, index) => {
        // Make sure we have a position for this card
        const position =
          index < dragPositions.length
            ? dragPositions[index]
            : getPlayerCardCoordinates(index);

        // Determine if card should be face up
        const isFaceUp = viewableCards[index] || false;

        if (debug)
          console.log(
            `Rendering card ${index} - id:${card.i}, faceUp:${isFaceUp}`
          );

        return (
          <Card
            key={`player-card-${index}-${card.i}`}
            index={card.i}
            position={position}
            faceUp={isFaceUp}
            draggable={showAllCards || card.seen}
            onClick={() => handleCardSelect(index)}
            className={`transition-all ${
              onCardSelect ? "hover:scale-105" : ""
            }`}
          />
        );
      })}

      {countdownActive && (
        <div className="absolute top-2 right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          Memorize your cards!
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
