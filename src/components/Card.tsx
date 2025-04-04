import React, { useState, useEffect } from "react";

type CardProps = {
  card?: {
    suit: string;
    value: string;
  };
  flipped?: boolean;
  onClick?: () => void;
  className?: string;
};

export function Card({
  card,
  flipped = false,
  onClick,
  className = "",
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(flipped);

  useEffect(() => {
    setIsFlipped(flipped);
  }, [flipped]);

  const handleClick = () => {
    if (onClick) onClick();
  };

  // Card dimensions with proper aspect ratio (poker card is 2.5:3.5)
  const baseClass = `relative rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 ${className}`;

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

  // Generate card symbols layout based on value with correct positioning
  const renderCardFace = (value: string, suit: string) => {
    const symbol = getSuitSymbol(suit);

    // Handle face cards (J, Q, K) with simpler design
    if (value === "J") {
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

    if (value === "Q") {
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

    if (value === "K") {
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
    if (value === "A") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-5xl">{symbol}</div>
        </div>
      );
    }

    // Handle number cards with properly centered layouts
    const numValue = parseInt(value, 10);

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
        // 2x3 grid plus 1 center symbol (4+1+2 layout)
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
    <div
      className={`${baseClass} ${onClick ? "hover:scale-105" : ""}`}
      onClick={handleClick}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute w-full h-full transition-transform duration-500"
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Card Back */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Textured card back */}
          <div className="h-full w-full relative bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-md">
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
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <div className="text-white font-bold text-xl">P</div>
              </div>
            </div>

            {/* Decorative border */}
            <div className="absolute inset-0 border-4 border-white opacity-10 rounded-lg"></div>
            <div className="absolute inset-0 m-3 border-2 border-white opacity-10 rounded-lg"></div>
          </div>
        </div>

        {/* Card Front */}
        <div
          className="absolute w-full h-full bg-white rounded-lg shadow-md backface-hidden"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          {card ? (
            <div
              className={`relative h-full ${getSuitColor(
                card.suit
              )} border border-gray-200 rounded-lg`}
            >
              {/* Top left corner */}
              <div className="absolute top-1 left-1 z-10">
                <div className="text-sm font-bold">{card.value}</div>
                <div className="text-sm">{getSuitSymbol(card.suit)}</div>
              </div>

              {/* Bottom right corner (rotated) */}
              <div className="absolute bottom-1 right-1 transform rotate-180 z-10">
                <div className="text-sm font-bold">{card.value}</div>
                <div className="text-sm">{getSuitSymbol(card.suit)}</div>
              </div>

              {/* Card face content */}
              <div className="h-full w-full flex items-center justify-center">
                {renderCardFace(card.value, card.suit)}
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              Empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
