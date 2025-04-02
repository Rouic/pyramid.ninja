// src/components/cards/Card.tsx
import React, { useState, useEffect, useRef } from "react";
import { getCardDetails } from "../../lib/deckUtils";

interface CardProps {
  index: number;
  position?: { x: number; y: number };
  faceUp?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  index,
  position = { x: 0, y: 0 },
  faceUp = false,
  draggable = false,
  onClick,
  style = {},
  className = "",
}) => {
  const [showFront, setShowFront] = useState(faceUp);
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Make sure to update card face when props change
  useEffect(() => {
    console.log(`Card ${index} faceUp changed to:`, faceUp);
    setShowFront(faceUp);
  }, [faceUp, index]);

  // Update position when props change
  useEffect(() => {
    setPos(position);
  }, [position]);

  const { suit, rank } = getCardDetails(index);

  // Handle drag events if draggable
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggable) return;
    e.preventDefault(); // Prevent text selection while dragging

    const cardRect = cardRef.current?.getBoundingClientRect();
    if (cardRect) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - cardRect.left,
        y: e.clientY - cardRect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggable || !cardRef.current) return;

    const parentRect = cardRef.current.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setPos({
        x: e.clientX - parentRect.left - dragOffset.x,
        y: e.clientY - parentRect.top - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Similar handlers for touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggable) return;

    const cardRect = cardRef.current?.getBoundingClientRect();
    if (cardRect) {
      setIsDragging(true);
      setDragOffset({
        x: e.touches[0].clientX - cardRect.left,
        y: e.touches[0].clientY - cardRect.top,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !draggable || !cardRef.current) return;
    e.preventDefault();

    const parentRect = cardRef.current.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setPos({
        x: e.touches[0].clientX - parentRect.left - dragOffset.x,
        y: e.touches[0].clientY - parentRect.top - dragOffset.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle card click
  const handleClick = () => {
    if (onClick && !isDragging) {
      console.log(`Card ${index} clicked!`);
      onClick();
    }
  };

  // Determine card rank and suit symbols
  const getRankSymbol = (rank: number): string => {
    const symbols = [
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
    return symbols[rank];
  };

  const getSuitSymbol = (suit: number): string => {
    const symbols = ["♠", "♥", "♣", "♦"];
    return symbols[suit];
  };

  const suitColor = suit === 0 || suit === 2 ? "text-black" : "text-red-600";

  // Generate pips for number cards
  const renderPips = () => {
    if (rank < 1 || rank > 9) return null; // Only for number cards 2-10

    const pips: React.ReactNode[] = [];
    const count = rank + 1; // Adjust for 0-based index

    // Generate appropriate pip patterns based on card rank
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const top = (row + 1) * (100 / (Math.ceil(count / 2) + 1));
      const left = col === 0 ? "1/4" : "3/4";
      const rotation = row >= Math.ceil(count / 2) / 2 ? "rotate-180" : "";

      pips.push(
        <div
          key={i}
          className={`absolute ${suitColor} ${rotation}`}
          style={{
            top: `${top}%`,
            left,
            transform: "translate(-50%, -50%)",
          }}
        >
          {getSuitSymbol(suit)}
        </div>
      );
    }

    return pips;
  };

  // Render court cards or aces
  const renderSpecialCard = () => {
    if (rank >= 10) {
      // Face cards (J, Q, K)
      const courtRank = ["J", "Q", "K"][rank - 10];
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-4xl font-bold ${suitColor}`}>
            {courtRank}
            {getSuitSymbol(suit)}
          </div>
        </div>
      );
    } else if (rank === 0) {
      // Ace
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-5xl ${suitColor}`}>{getSuitSymbol(suit)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={cardRef}
      className={`absolute select-none ${className} ${
        draggable ? "cursor-move" : "cursor-pointer"
      }`}
      style={{
        width: "100px",
        height: "140px",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease",
        zIndex: isDragging ? 10 : 1,
        ...style,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card container with 3D effect */}
      <div
        className="relative w-full h-full"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front face */}
        <div
          className={`absolute w-full h-full rounded-lg border border-gray-300 shadow-lg bg-white ${
            !showFront ? "card-hidden" : "card-visible"
          }`}
          style={{
            backfaceVisibility: "hidden",
            transform: showFront ? "rotateY(0deg)" : "rotateY(180deg)",
            transition: "transform 0.5s ease",
          }}
        >
          {/* Top left rank and suit */}
          <div
            className={`absolute top-1 left-1 text-lg font-bold ${suitColor}`}
          >
            {getRankSymbol(rank)}
            <div>{getSuitSymbol(suit)}</div>
          </div>

          {/* Bottom right rank and suit (inverted) */}
          <div
            className={`absolute bottom-1 right-1 text-lg font-bold rotate-180 ${suitColor}`}
          >
            {getRankSymbol(rank)}
            <div>{getSuitSymbol(suit)}</div>
          </div>

          {/* Card center content */}
          {renderPips()}
          {renderSpecialCard()}
        </div>

        {/* Back face */}
        <div
          className={`absolute w-full h-full rounded-lg border border-gray-300 shadow-lg bg-indigo-600 ${
            showFront ? "card-hidden" : "card-visible"
          }`}
          style={{
            backfaceVisibility: "hidden",
            transform: showFront ? "rotateY(-180deg)" : "rotateY(0deg)",
            transition: "transform 0.5s ease",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-4 border-indigo-300 rounded-lg flex items-center justify-center">
              <div className="text-white text-2xl font-bold">🔺</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
