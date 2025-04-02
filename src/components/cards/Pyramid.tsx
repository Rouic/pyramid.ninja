// src/components/cards/Pyramid.tsx
import React, { useState, useEffect } from "react";
import Card from "./Card";
import { getPyramidCoordinates } from "../../lib/deckUtils";
import { PyramidCard } from "../../types";

interface PyramidProps {
  cards: PyramidCard[];
  onCardSelect: (index: number) => void;
  isActive: boolean;
  className?: string;
  gameEnded?: boolean;
  debug?: boolean;
}

const Pyramid: React.FC<PyramidProps> = ({
  cards,
  onCardSelect,
  isActive,
  className = "",
  gameEnded = false,
  debug = false,
}) => {
  // State to track which cards have been shown
  const [shownCards, setShownCards] = useState<boolean[]>(
    Array(15).fill(false)
  );

  // Update shown cards when props change
  useEffect(() => {
    if (debug) console.log("Pyramid cards updated:", cards);

    if (cards && cards.length > 0) {
      const newShownState = cards.map((card) => card.shown);
      setShownCards(newShownState);

      if (debug) console.log("New shown state:", newShownState);
    }
  }, [cards, debug]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (debug)
      console.log(
        "Pyramid card clicked:",
        index,
        "isActive:",
        isActive,
        "shown:",
        shownCards[index]
      );

    if (isActive && !shownCards[index] && !gameEnded) {
      if (debug) console.log("Selecting card:", index);
      onCardSelect(index);
    }
  };

  // Calculate container size based on pyramid layout
  const containerWidth = 500;
  const containerHeight = 550;

  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
      }}
    >
      {/* Render pyramid cards */}
      {cards.map((card, index) => {
        const coords = getPyramidCoordinates(index);
        // Center the pyramid in the container
        const adjustedX = coords.x + containerWidth / 2 - 50; // 50 is half card width
        const adjustedY = coords.y;

        return (
          <Card
            key={`pyramid-card-${index}-${card.id}`}
            index={card.id}
            position={{ x: adjustedX, y: adjustedY }}
            faceUp={shownCards[index]}
            onClick={() => handleCardClick(index)}
            className={`transition-transform duration-500 ease-out ${
              isActive && !shownCards[index] && !gameEnded
                ? "hover:scale-105 cursor-pointer"
                : ""
            }`}
          />
        );
      })}

      {/* Render pyramid layout lines */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-25"
        style={{ zIndex: -1 }}
      >
        {/* Base row horizontal line */}
        <line
          x1="50"
          y1="490"
          x2="450"
          y2="490"
          stroke="#888"
          strokeWidth="1"
        />

        {/* Row 2 horizontal line */}
        <line
          x1="100"
          y1="360"
          x2="400"
          y2="360"
          stroke="#888"
          strokeWidth="1"
        />

        {/* Row 3 horizontal line */}
        <line
          x1="150"
          y1="240"
          x2="350"
          y2="240"
          stroke="#888"
          strokeWidth="1"
        />

        {/* Row 4 horizontal line */}
        <line
          x1="200"
          y1="120"
          x2="300"
          y2="120"
          stroke="#888"
          strokeWidth="1"
        />

        {/* Left diagonal line */}
        <line x1="50" y1="490" x2="250" y2="0" stroke="#888" strokeWidth="1" />

        {/* Right diagonal line */}
        <line x1="450" y1="490" x2="250" y2="0" stroke="#888" strokeWidth="1" />
      </svg>
    </div>
  );
};

export default Pyramid;
