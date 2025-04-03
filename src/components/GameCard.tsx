import React, { useState, useEffect } from "react";
import { Card as CardType } from "../lib/deck";
import { motion } from "framer-motion";
import { usePlayerContext } from "../context/PlayerContext";

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
  allowFlip?: boolean;
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
  allowFlip = false,
}) => {
  const { playerId } = usePlayerContext();
  const [isFlipped, setIsFlipped] = useState(card.revealed || showFace);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [userFlipped, setUserFlipped] = useState(false);

  // Update flip state when revealed status or showFace changes
  useEffect(() => {
    setIsFlipped(card.revealed || showFace || userFlipped || card.newCard);
  }, [card.revealed, showFace, userFlipped, card.newCard]);

  const handleReveal = () => {
    // For pyramid cards: standard reveal logic
    if (onReveal && canInteract && !isFlipped) {
      onReveal(card);
      return;
    }

    // For player cards: Only allow flipping if explicitly permitted
    if (allowFlip && !userFlipped) {
      setUserFlipped(true);
    }
  };

  const handlePeekStart = () => {
    if (allowPeek) {
      setIsPeeking(true);
    }
  };

  const handlePeekEnd = () => {
    setIsPeeking(false);
  };

  // Get suit symbol
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  };

  // Get suit color
  const getSuitColor = (suit: string) => {
    return suit === "hearts" || suit === "diamonds"
      ? "text-red-600"
      : "text-gray-900";
  };

  // Generate card face with correct layout
  const renderCardFace = (rank: string, suit: string) => {
    const symbol = getSuitSymbol(suit);

    // Handle face cards (J, Q, K)
    if (rank === "J") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">J</div>
            <div className="text-3xl">{symbol}</div>
            <div className="text-lg mt-1">JACK</div>
          </div>
        </div>
      );
    }

    if (rank === "Q") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">Q</div>
            <div className="text-3xl">{symbol}</div>
            <div className="text-lg mt-1">QUEEN</div>
          </div>
        </div>
      );
    }

    if (rank === "K") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">K</div>
            <div className="text-3xl">{symbol}</div>
            <div className="text-lg mt-1">KING</div>
          </div>
        </div>
      );
    }

    // Handle Ace
    if (rank === "A") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-5xl">{symbol}</div>
        </div>
      );
    }

    // Handle number cards (2-10) with proper layouts
    const numValue = parseInt(rank, 10);

    switch (numValue) {
      case 2:
        return (
          // Tightened layout for 2
          <div className="flex flex-col justify-between h-full my-3">
            <div className="text-2xl text-center">{symbol}</div>
            <div className="text-2xl text-center transform rotate-180">
              {symbol}
            </div>
          </div>
        );
      case 3:
        return (
          // Tightened layout for 3
          <div className="flex flex-col justify-between h-full my-2">
            <div className="text-2xl text-center">{symbol}</div>
            <div className="text-2xl text-center">{symbol}</div>
            <div className="text-2xl text-center transform rotate-180">
              {symbol}
            </div>
          </div>
        );
      case 4:
        return (
          // 2x2 grid
          <div className="grid grid-cols-2 h-full items-center px-2 my-6">
            <div className="text-xl text-left">{symbol}</div>
            <div className="text-xl text-right">{symbol}</div>
            <div className="text-xl text-left transform rotate-180">
              {symbol}
            </div>
            <div className="text-xl text-right transform rotate-180">
              {symbol}
            </div>
          </div>
        );
      case 5:
        return (
          // 2x2 grid with center symbol
          <div className="h-full flex flex-col justify-center my-4">
            <div className="grid grid-cols-2 mb-2">
              <div className="text-xl text-left ml-2">{symbol}</div>
              <div className="text-xl text-right mr-2">{symbol}</div>
            </div>
            <div className="text-xl text-center my-1">{symbol}</div>
            <div className="grid grid-cols-2 mt-2">
              <div className="text-xl text-left ml-2 transform rotate-180">
                {symbol}
              </div>
              <div className="text-xl text-right mr-2 transform rotate-180">
                {symbol}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          // 2x3 grid
          <div className="h-full flex flex-col justify-center my-2">
            <div className="grid grid-cols-2 gap-y-2">
              <div className="text-lg text-left ml-2">{symbol}</div>
              <div className="text-lg text-right mr-2">{symbol}</div>
              <div className="text-lg text-left ml-2">{symbol}</div>
              <div className="text-lg text-right mr-2">{symbol}</div>
              <div className="text-lg text-left ml-2">{symbol}</div>
              <div className="text-lg text-right mr-2">{symbol}</div>
            </div>
          </div>
        );
      case 7:
        // 2x3 grid plus 1 center symbol
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-y-1 mb-1">
              <div className="text-lg text-left ml-2">{symbol}</div>
              <div className="text-lg text-right mr-2">{symbol}</div>
              <div className="text-lg text-left ml-2">{symbol}</div>
              <div className="text-lg text-right mr-2">{symbol}</div>
            </div>
            <div className="text-lg text-center my-1">{symbol}</div>
            <div className="grid grid-cols-2 gap-y-1 mt-1">
              <div className="text-lg text-left ml-2">{symbol}</div>
              <div className="text-lg text-right mr-2">{symbol}</div>
            </div>
          </div>
        );
      case 8:
        // Traditional 2x4 grid layout
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-y-1">
              <div className="text-md text-left ml-2">{symbol}</div>
              <div className="text-md text-right mr-2">{symbol}</div>
              <div className="text-md text-left ml-2">{symbol}</div>
              <div className="text-md text-right mr-2">{symbol}</div>
              <div className="text-md text-left ml-2 transform rotate-180">
                {symbol}
              </div>
              <div className="text-md text-right mr-2 transform rotate-180">
                {symbol}
              </div>
              <div className="text-md text-left ml-2 transform rotate-180">
                {symbol}
              </div>
              <div className="text-md text-right mr-2 transform rotate-180">
                {symbol}
              </div>
            </div>
          </div>
        );
      case 9:
        // 3x3 grid layout
        return (
          <div className="h-full flex flex-col justify-center my-2">
            <div className="grid grid-cols-3 gap-y-2">
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
              <div className="text-md text-center">{symbol}</div>
            </div>
          </div>
        );
      case 10:
        // Traditional 10 layout (4 + 2 + 4)
        return (
          <div className="h-full flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-y-1">
              <div className="text-sm text-left ml-2">{symbol}</div>
              <div className="text-sm text-right mr-2">{symbol}</div>
              <div className="text-sm text-left ml-2">{symbol}</div>
              <div className="text-sm text-right mr-2">{symbol}</div>
              <div className="text-sm text-left ml-2">{symbol}</div>
              <div className="text-sm text-right mr-2">{symbol}</div>
              <div className="text-sm text-left ml-2">{symbol}</div>
              <div className="text-sm text-right mr-2">{symbol}</div>
            </div>
            <div className="flex justify-center gap-4 my-1">
              <div className="text-sm">{symbol}</div>
              <div className="text-sm">{symbol}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`absolute ${className} ${isDragging ? "z-50" : "z-10"} ${
        isHighlighted ? "ring-4 ring-yellow-400 z-20" : ""
      }`}
      style={{
        x: position.x,
        y: position.y,
        rotate: card.rotation || 0,
        width: "100px",
        height: "140px",
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
      whileHover={
        canInteract && !isFlipped && (allowFlip || onReveal)
          ? { scale: 1.05 }
          : {}
      }
      drag={card.owner === playerId && canInteract}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <div
        className="relative w-full h-full rounded-lg select-none"
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
          <div
            className={`h-full w-full rounded-lg shadow-md overflow-hidden ${
              (allowFlip || onReveal) && canInteract && !isFlipped
                ? "cursor-pointer"
                : ""
            }`}
            onClick={handleReveal}
            onMouseDown={handlePeekStart}
            onMouseUp={handlePeekEnd}
            onMouseLeave={handlePeekEnd}
            onTouchStart={handlePeekStart}
            onTouchEnd={handlePeekEnd}
          >
            <div className="h-full w-full relative">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-900">
                {/* Pattern overlay */}
                <div
                  className="absolute inset-0 opacity-30 bg-repeat"
                  style={{
                    backgroundImage: "url('/images/card-pattern.png')",
                    backgroundSize: "10px 10px",
                  }}
                ></div>

                {/* Card back logo/design */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <div className="text-white font-bold text-2xl">P</div>
                  </div>
                </div>

                {/* Decorative border */}
                <div className="absolute inset-0 border-4 border-white opacity-10 rounded-lg"></div>
                <div className="absolute inset-0 m-3 border-2 border-white opacity-10 rounded-lg"></div>
              </div>

              {/* Loading state */}
              {isRevealing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
              )}

              {/* Peek hint */}
              {allowPeek && (
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <div className="inline-block text-xs bg-white bg-opacity-30 text-white px-2 py-1 rounded-full animate-pulse">
                    Hold to peek
                  </div>
                </div>
              )}

              {/* Flip hint - only show when card can be flipped */}
              {allowFlip && !userFlipped && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
                  <div className="text-white text-center px-3 py-1 bg-blue-600 rounded-lg animate-pulse">
                    Click to reveal
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Front */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div
            className={`h-full w-full rounded-lg bg-white shadow-md overflow-hidden ${getSuitColor(
              card.suit
            )}`}
          >
            <div className="relative h-full border border-gray-200 rounded-lg">
              {/* Top left corner */}
              <div className="absolute top-1 left-1 z-10">
                <div className="text-sm font-bold">{card.rank}</div>
                <div className="text-sm">{getSuitSymbol(card.suit)}</div>
              </div>

              {/* Bottom right corner (rotated) */}
              <div className="absolute bottom-1 right-1 transform rotate-180 z-10">
                <div className="text-sm font-bold">{card.rank}</div>
                <div className="text-sm">{getSuitSymbol(card.suit)}</div>
              </div>

              {/* Card face content */}
              <div className="h-full w-full flex items-center justify-center">
                {renderCardFace(card.rank, card.suit)}
              </div>

              {/* New card indicator */}
              {card.newCard && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl z-20">
                  NEW
                </div>
              )}

              {/* User revealed indicator */}
              {userFlipped && (
                <div className="absolute top-0 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-br z-20">
                  REVEALED
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
