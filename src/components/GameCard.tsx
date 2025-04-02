import React, { useState, useEffect, useRef } from "react";
import { Card as CardType } from "../lib/deck";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerContext } from "../context/PlayerContext";
import Image from "next/image";

interface GameCardProps {
  card: CardType;
  index: number;
  position: { x: number; y: number };
  isRevealing: boolean;
  onReveal?: (card: CardType) => void;
  canInteract?: boolean;
  className?: string;
  allowPeek?: boolean;
  isHighlighted?: boolean;
  showFace?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  card,
  index,
  position,
  isRevealing,
  onReveal,
  canInteract = true,
  className = "",
  allowPeek = false,
  isHighlighted = false,
  showFace = false,
}) => {
  const { playerId } = usePlayerContext();
  const [isFlipped, setIsFlipped] = useState(card.revealed || showFace);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update flip state when revealed status or showFace changes
  useEffect(() => {
    setIsFlipped(card.revealed || showFace);
  }, [card.revealed, showFace]);

  const handleReveal = () => {
    if (!canInteract || isFlipped || !onReveal) return;

    onReveal(card);
    setIsFlipped(true);
  };

  const handlePeekStart = () => {
    if (allowPeek) {
      setIsPeeking(true);
    }
  };

  const handlePeekEnd = () => {
    setIsPeeking(false);
  };

  const cardFrontClasses = `bg-white rounded-lg shadow-lg overflow-hidden transform ${
    card.suit === "hearts" || card.suit === "diamonds"
      ? "text-red-600"
      : "text-black"
  } ${card.newCard ? "ring-2 ring-green-400" : ""}`;

  const cardBackClasses = `bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg overflow-hidden ${
    allowPeek ? "cursor-pointer" : ""
  }`;

  // Use card images with public path
  const cardFront = (
    <div className={cardFrontClasses}>
      <div className="p-2 flex flex-col h-full justify-between">
        <div className="text-left">
          <div className="text-lg font-bold">{card.rank}</div>
          <div className="text-lg">
            {card.suit === "hearts" && "♥"}
            {card.suit === "diamonds" && "♦"}
            {card.suit === "clubs" && "♣"}
            {card.suit === "spades" && "♠"}
          </div>
        </div>
        <div className="flex justify-center items-center text-4xl">
          {card.suit === "hearts" && "♥"}
          {card.suit === "diamonds" && "♦"}
          {card.suit === "clubs" && "♣"}
          {card.suit === "spades" && "♠"}
        </div>
        <div className="text-right transform rotate-180">
          <div className="text-lg font-bold">{card.rank}</div>
          <div className="text-lg">
            {card.suit === "hearts" && "♥"}
            {card.suit === "diamonds" && "♦"}
            {card.suit === "clubs" && "♣"}
            {card.suit === "spades" && "♠"}
          </div>
        </div>
      </div>

      {card.newCard && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
          NEW
        </div>
      )}
    </div>
  );

  const cardBack = (
    <div
      className={`${cardBackClasses} flex items-center justify-center`}
      onClick={handleReveal}
      onMouseDown={handlePeekStart}
      onMouseUp={handlePeekEnd}
      onMouseLeave={handlePeekEnd}
      onTouchStart={handlePeekStart}
      onTouchEnd={handlePeekEnd}
    >
      {isRevealing ? (
        <div className="animate-pulse text-white text-center px-2">
          <div className="text-sm">Loading...</div>
        </div>
      ) : (
        <div className="text-white font-bold text-lg flex flex-col items-center justify-center">
          <span className="text-white opacity-80">🎴</span>
          {allowPeek && (
            <div className="text-xs mt-1 animate-pulse">Hold to peek</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      className={`absolute w-24 h-36 select-none ${className} ${
        isDragging ? "z-50" : "z-10"
      } ${isHighlighted ? "ring-4 ring-yellow-400 z-20" : ""}`}
      style={{
        x: position.x,
        y: position.y,
        rotate: card.rotation || 0,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          delay: index * 0.05,
          duration: 0.3,
        },
      }}
      whileHover={canInteract && !isFlipped ? { scale: 1.05 } : {}}
      drag={card.owner === playerId && canInteract}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <div
        className="relative w-full h-full rounded-lg"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${isFlipped || isPeeking ? "180deg" : "0deg"})`,
          transition: "transform 0.6s",
        }}
      >
        {/* Card Back */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          {cardBack}
        </div>

        {/* Card Front */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {cardFront}
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
