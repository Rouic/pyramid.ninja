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
    if (!isGameStarted || isRevealing || !canRevealCards || !onRevealCard)
      return;

    try {
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
      className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[450px] mx-auto bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4"
    >
      {/* Row indicators - showing drink values */}
      {isGameStarted && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex flex-col justify-around h-full">
          {rowDrinkMap.map((drinks, index) => (
            <div
              key={index}
              className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 text-xs
                ${
                  drinks === drinksForCurrentRow
                    ? "bg-yellow-400 text-yellow-900 font-bold animate-pulse"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
            isHighlighted={isHighlighted}
          />
        );
      })}

      {pyramidCards.length === 0 && isGameStarted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">
            Setting up pyramid...
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePyramid;
