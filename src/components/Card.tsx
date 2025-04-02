import Image from "next/image";
import { useState, useEffect } from "react";

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
  const baseClass = `relative w-24 h-32 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 ${className}`;

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
          className="absolute w-full h-full flex items-center justify-center bg-white rounded-lg shadow-md"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src="/images/card-back.png"
            alt="Card Back"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>

        {/* Card Front */}
        <div
          className="absolute w-full h-full bg-white rounded-lg shadow-md flex flex-col items-center justify-center"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          {card ? (
            <>
              <div className="absolute top-2 left-2 text-xl font-bold">
                {card.value}
              </div>
              <div className="text-4xl">
                {card.suit === "hearts"
                  ? "♥️"
                  : card.suit === "diamonds"
                  ? "♦️"
                  : card.suit === "clubs"
                  ? "♣️"
                  : "♠️"}
              </div>
              <div className="absolute bottom-2 right-2 text-xl font-bold transform rotate-180">
                {card.value}
              </div>
            </>
          ) : (
            <div className="text-gray-400">Empty</div>
          )}
        </div>
      </div>
    </div>
  );
}
