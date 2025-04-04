import React, { useState, useEffect, useRef } from "react";
import { Card } from "../lib/deck";
import { generatePyramidLayout, getPyramidIndex } from "../lib/deck";
import GameCard from "./GameCard";
import { subscribeToPyramidCards } from "../lib/firebase/gameCards";
import { usePlayerContext } from "../context/PlayerContext";

interface GamePyramidProps {
  gameId: string;
  rows: number;
  isGameStarted: boolean;
  highlightCurrentCard?: string;
  drinksForCurrentRow?: number;
  canRevealCards?: boolean;
  onRevealCard?: (cardIndex: number) => void;
}

const GamePyramid: React.FC<GamePyramidProps> = ({
  gameId,
  rows,
  isGameStarted,
  highlightCurrentCard,
  drinksForCurrentRow,
  canRevealCards = false,
  onRevealCard,
}) => {
  const { playerId, isHost } = usePlayerContext();
  const [pyramidCards, setPyramidCards] = useState<Card[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Calculate container size for layout
  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        setContainerSize({
          width: containerRef.current?.offsetWidth || 0,
          height: containerRef.current?.offsetHeight || 0,
        });
      };

      updateSize();
      window.addEventListener("resize", updateSize);

      return () => {
        window.removeEventListener("resize", updateSize);
      };
    }
  }, []);

  // Subscribe to pyramid card updates
  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = subscribeToPyramidCards(gameId, (cards) => {
      setPyramidCards(cards);
      setIsRevealing(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleReveal = async (
    card: Card,
    rowIndex: number,
    positionIndex: number
  ) => {
    // Add extra logging for debugging
    console.log("Card click attempted:", {
      isGameStarted,
      canRevealCards,
      isRevealing,
      rowIndex,
      positionIndex,
    });

    if (!isGameStarted) {
      console.log("Game not started, ignoring click");
      return;
    }

    if (!canRevealCards) {
      console.log("Cards not revealable yet, ignoring click");
      return;
    }

    if (isRevealing) {
      console.log("Already revealing a card, ignoring click");
      return;
    }

    if (!onRevealCard) {
      console.log("No reveal handler, ignoring click");
      return;
    }

    try {
      console.log("Revealing card at index:", rowIndex, positionIndex);
      setIsRevealing(true);
      const cardIndex = getPyramidIndex(rowIndex, positionIndex);
      onRevealCard(cardIndex);
    } catch (error) {
      console.error("Error revealing card:", error);
      setIsRevealing(false);
    }
  };

  // Generate layout for cards
  const layout = generatePyramidLayout(
    rows,
    containerSize.width,
    containerSize.height
  );

  // Map of row indices to drink values (bottom row = 1, top row = rows)
  const rowDrinkMap = Array.from({ length: rows }, (_, i) => rows - i);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[650px] mx-auto rounded-lg p-6 border-2 border-game-neon-purple border-opacity-30"
      style={{
        background: "#1b084e",
        backgroundImage: "linear-gradient(to right, rgba(30, 14, 96, 0.8), rgba(66, 21, 143, 0.4)), linear-gradient(to bottom, rgba(30, 14, 96, 0.8), rgba(89, 30, 184, 0.2))",
        boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Row indicators - showing drink values with Balatro styling */}
      {isGameStarted && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex flex-col justify-around h-full">
          {rowDrinkMap.map((drinks, index) => (
            <div
              key={index}
              className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 text-sm
                ${
                  drinks === drinksForCurrentRow
                    ? "bg-game-neon-yellow text-black font-bold animate-pulse-fast shadow-neon-yellow font-game-fallback"
                    : "bg-black bg-opacity-40 text-white border border-white border-opacity-20 font-game-fallback"
                }`}
            >
              {drinks}
            </div>
          ))}
        </div>
      )}

      {pyramidCards.map((card, index) => {
        const rowIndex = Math.floor(Math.sqrt(2 * index + 0.25) - 0.5);
        const positionIndex = index - (rowIndex * (rowIndex + 1)) / 2;
        const layoutItem = layout.find(
          (item) => item.row === rowIndex && item.position === positionIndex
        );

        if (!layoutItem) return null;

        const isHighlighted =
          highlightCurrentCard && card.id === highlightCurrentCard;

        return (
          <GameCard
            key={card.id}
            card={card}
            index={index}
            position={{ x: layoutItem.x, y: layoutItem.y }}
            isRevealing={isRevealing && !card.revealed}
            onReveal={() => handleReveal(card, rowIndex, positionIndex)}
            canInteract={isGameStarted && canRevealCards}
            className={`${
              isGameStarted && canRevealCards && !card.revealed
                ? "cursor-pointer hover:scale-110 hover:shadow-card-hover transition-all duration-300 animate-float"
                : "transform hover:scale-105 transition-transform duration-300"
            } card-enhanced`}
            isHighlighted={isHighlighted}
          />
        );
      })}

      {pyramidCards.length === 0 && isGameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
          <div className="bg-game-card px-6 py-4 rounded-lg border border-game-neon-blue shadow-neon-blue border-opacity-40">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-game-neon-blue border-t-transparent mr-3"></div>
              <span className="text-white font-game-fallback tracking-wide">SETTING UP PYRAMID...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePyramid;
