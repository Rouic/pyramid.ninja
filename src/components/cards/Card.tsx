// src/components/cards/Card.tsx
import React, { useState, useEffect } from "react";
import { getCardDetails } from "../../lib/deckUtils";

interface CardProps {
  index: number;
  position?: { x: number; y: number };
  faceUp?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  index,
  position = { x: 0, y: 0 },
  faceUp = false,
  draggable = false,
  onClick,
  className = "",
}) => {
  const [isFaceUp, setIsFaceUp] = useState(faceUp);

  // Update face-up state when props change
  useEffect(() => {
    console.log(`Card ${index} faceUp prop changed to:`, faceUp);
    setIsFaceUp(faceUp);
  }, [faceUp, index]);

  // Get card details
  const { suit, rank } = getCardDetails(index);

  // Determine suit and rank display
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const suits = ["♠", "♥", "♣", "♦"];
  const rankDisplay = ranks[rank];
  const suitDisplay = suits[suit];
  const isRed = suit === 1 || suit === 3; // hearts or diamonds

  return (
    <div
      className={`absolute ${className}`}
      style={{
        width: "100px",
        height: "140px",
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: "transform 0.3s ease",
        cursor: draggable ? "move" : "pointer",
      }}
      onClick={onClick}
    >
      {isFaceUp ? (
        // Card Front
        <div className="w-full h-full bg-white rounded-lg border-2 border-gray-300 shadow-md p-2">
          {/* Top left rank and suit */}
          <div
            className={`absolute top-1 left-1 font-bold ${
              isRed ? "text-red-600" : "text-black"
            }`}
          >
            <div>{rankDisplay}</div>
            <div>{suitDisplay}</div>
          </div>

          {/* Bottom right rank and suit (inverted) */}
          <div
            className={`absolute bottom-1 right-1 font-bold ${
              isRed ? "text-red-600" : "text-black"
            } rotate-180`}
          >
            <div>{rankDisplay}</div>
            <div>{suitDisplay}</div>
          </div>

          {/* Center display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-3xl ${isRed ? "text-red-600" : "text-black"}`}
            >
              {rankDisplay}
              {suitDisplay}
            </span>
          </div>
        </div>
      ) : (
        // Card Back
        <div className="w-full h-full bg-indigo-600 rounded-lg border-2 border-gray-300 shadow-md">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-4 border-indigo-300 rounded-lg flex items-center justify-center">
              <div className="text-white text-2xl">🔺</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
