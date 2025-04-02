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

  useEffect(() => {
    setShowFront(faceUp);
  }, [faceUp]);

  useEffect(() => {
    setPos(position);
  }, [position]);

  const { suit, rank } = getCardDetails(index);

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

  // Handle drag events if draggable
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggable) return;

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
      onClick();
    }
  };

  // Generate pips for number cards
  const renderPips = () => {
    if (rank < 1 || rank > 9) return null; // Only for number cards 2-10

    // Fix: Explicitly type the pips array as React.ReactNode[]
    const pips: React.ReactNode[] = [];
    const count = rank + 1; // Adjust for 0-based index

    // Generate specific patterns based on card rank
    if (count === 2) {
      pips.push(
        <div key="top" className="absolute top-1/4 left-1/2 -translate-x-1/2">
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="bottom"
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 rotate-180"
        >
          {getSuitSymbol(suit)}
        </div>
      );
    } else if (count === 3) {
      pips.push(
        <div key="top" className="absolute top-1/4 left-1/2 -translate-x-1/2">
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="middle"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="bottom"
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 rotate-180"
        >
          {getSuitSymbol(suit)}
        </div>
      );
    } else if (count === 4) {
      pips.push(
        <div key="top-left" className="absolute top-1/4 left-1/4">
          {getSuitSymbol(suit)}
        </div>,
        <div key="top-right" className="absolute top-1/4 right-1/4">
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="bottom-left"
          className="absolute bottom-1/4 left-1/4 rotate-180"
        >
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="bottom-right"
          className="absolute bottom-1/4 right-1/4 rotate-180"
        >
          {getSuitSymbol(suit)}
        </div>
      );
    } else if (count === 5) {
      pips.push(
        <div key="top-left" className="absolute top-1/4 left-1/4">
          {getSuitSymbol(suit)}
        </div>,
        <div key="top-right" className="absolute top-1/4 right-1/4">
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="middle"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="bottom-left"
          className="absolute bottom-1/4 left-1/4 rotate-180"
        >
          {getSuitSymbol(suit)}
        </div>,
        <div
          key="bottom-right"
          className="absolute bottom-1/4 right-1/4 rotate-180"
        >
          {getSuitSymbol(suit)}
        </div>
      );
    } else {
      // For cards 6-10, create appropriate pip configurations
      const rows = Math.ceil(count / 2);
      const spacing = 1 / (rows + 1);

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const top = spacing * (row + 1);
        const left = col === 0 ? "1/4" : "3/4";
        const rotation = row >= rows / 2 ? "rotate-180" : "";

        pips.push(
          <div
            key={i}
            className={`absolute ${rotation}`}
            style={{
              top: `${top * 100}%`,
              left,
              transform: "translate(-50%, -50%)",
            }}
          >
            {getSuitSymbol(suit)}
          </div>
        );
      }
    }

    return pips;
  };

  // Render court cards (J, Q, K)
  const renderCourtCard = () => {
    const courtRanks = ["J", "Q", "K"];
    if (rank < 10 || rank > 12) return null;

    const courtRank = courtRanks[rank - 10];
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-4xl font-bold ${suitColor}`}>
          {courtRank}
          {getSuitSymbol(suit)}
        </div>
      </div>
    );
  };

  // Render ace cards
  const renderAce = () => {
    if (rank !== 0) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-5xl ${suitColor}`}>{getSuitSymbol(suit)}</div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`absolute transform transition-transform cursor-pointer select-none ${className}`}
      style={{
        width: "100px",
        height: "140px",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transformStyle: "preserve-3d",
        transition: isDragging ? "none" : "transform 0.5s ease",
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
      <div
        className={`absolute w-full h-full rounded-lg border border-gray-300 shadow-lg transform ${
          showFront ? "rotateY(0deg)" : "rotateY(180deg)"
        }`}
        style={{
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease",
        }}
      >
        {/* Card Front */}
        <div className="absolute w-full h-full bg-white rounded-lg p-2">
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
          {renderCourtCard()}
          {renderAce()}
        </div>
      </div>

      {/* Card Back */}
      <div
        className={`absolute w-full h-full rounded-lg border border-gray-300 shadow-lg bg-indigo-600 transform ${
          showFront ? "rotateY(180deg)" : "rotateY(0deg)"
        }`}
        style={{
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
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
  );
};

export default Card;
