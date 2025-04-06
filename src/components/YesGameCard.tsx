/**
 * YesGameCard Component
 * 
 * This component represents a card in the YES card game. It handles:
 * - Card display (face up/down)
 * - Long press to peek at card
 * - Card actions (swap, cut deck, reveal)
 * - Special styling for Aces and Kings
 * - Dealer status indication
 */
import React, { useState, useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import { getCardDetails, cardIndexToString } from "../lib/deckUtils";

interface YesGameCardProps {
  gameId: string;
  playerId: string;
  card?: { i: number; seen: boolean };
  isDealer: boolean;
  canReveal: boolean;
  onReveal?: () => void;
  onPeek?: () => void;
  onSwap?: () => void;
  onCut?: () => void;
}

const YesGameCard: React.FC<YesGameCardProps> = ({
  gameId,
  playerId,
  card,
  isDealer,
  canReveal,
  onReveal,
  onPeek,
  onSwap,
  onCut,
}) => {
  const { peekCard } = useGame();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const handleLongPressStart = () => {
    if (card && !isRevealed) {
      // Start a timer for long press (peek)
      const timer = setTimeout(() => {
        // After 500ms, show the card (peek)
        setIsPeeking(true);
        // Call the peek function in context
        peekCard(gameId, playerId);
        // If there's an external handler
        if (onPeek) onPeek();
      }, 500);
      
      setLongPressTimer(timer);
    }
  };
  
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Hide card when releasing
    setIsPeeking(false);
  };
  
  const handleSwap = () => {
    if (onSwap) onSwap();
  };
  
  const handleCut = () => {
    if (isDealer && onCut) onCut();
  };
  
  const handleReveal = () => {
    if (canReveal && onReveal) {
      setIsRevealed(true);
      onReveal();
    }
  };
  
  // Determine card color and rank for display
  const getCardDisplay = () => {
    if (!card) return { color: "text-gray-400", symbol: "?", rank: "?" };
    
    const cardDetails = getCardDetails(card.i);
    const isRed = cardDetails.suit === 1 || cardDetails.suit === 3; // hearts or diamonds
    const color = isRed ? "text-red-600" : "text-black";
    
    // Get symbol based on suit
    const symbols = ["♠", "♥", "♣", "♦"];
    const symbol = symbols[cardDetails.suit];
    
    // Get rank name
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const rank = ranks[cardDetails.rank];
    
    return { color, symbol, rank };
  };
  
  const cardDisplay = getCardDisplay();
  const showCardFace = (card?.seen && isPeeking) || isRevealed;
  
  // Check if card is an Ace for highlighting
  const isAce = card && card.i % 13 === 0;
  // Check if card is a King for blocking
  const isKing = card && card.i % 13 === 12;
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`relative w-32 h-48 rounded-lg flex items-center justify-center p-2
                   ${isRevealed ? "cursor-default" : "cursor-pointer"}
                   ${isDealer ? "ring-2 ring-blue-500" : ""}
                   ${isAce && showCardFace ? "ring-2 ring-red-500" : ""}
                   ${isKing && showCardFace ? "ring-2 ring-purple-500" : ""}`}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        {/* Card back or face */}
        <div className={`absolute inset-0 rounded-lg flex items-center justify-center
                        ${showCardFace ? "bg-white" : "bg-gradient-to-br from-blue-500 to-purple-600"} 
                        shadow-md transition-all duration-200 transform
                        ${isPeeking ? "scale-105" : ""}`}>
          
          {/* Card pattern on back */}
          {!showCardFace && (
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full grid grid-cols-4 grid-rows-6 gap-1 p-3">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="rounded-full bg-white opacity-50"></div>
                ))}
              </div>
            </div>
          )}
          
          {/* Card content when revealed */}
          {showCardFace && (
            <div className={`flex flex-col items-center justify-center w-full h-full ${cardDisplay.color}`}>
              <div className="absolute top-2 left-2 text-xl font-bold">
                {cardDisplay.rank}
              </div>
              <div className="absolute bottom-2 right-2 text-xl font-bold transform rotate-180">
                {cardDisplay.rank}
              </div>
              <div className="text-5xl font-bold">
                {cardDisplay.symbol}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons below card */}
      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleSwap} 
          disabled={isRevealed}
          className={`px-3 py-1 text-xs rounded-full 
                    ${isRevealed 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-blue-500 text-white hover:bg-blue-600"}`}
        >
          Swap
        </button>
        
        {isDealer && (
          <button 
            onClick={handleCut} 
            disabled={isRevealed}
            className={`px-3 py-1 text-xs rounded-full 
                      ${isRevealed 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                        : "bg-purple-500 text-white hover:bg-purple-600"}`}
          >
            Cut
          </button>
        )}
        
        {canReveal && (
          <button 
            onClick={handleReveal}
            className="px-3 py-1 text-xs rounded-full bg-green-500 text-white hover:bg-green-600"
          >
            Reveal
          </button>
        )}
      </div>
      
      {/* Dealer indication */}
      {isDealer && (
        <div className="mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
          Dealer
        </div>
      )}
      
      {/* Peek instruction */}
      <div className="mt-2 text-xs text-gray-400">
        Hold to peek at your card
      </div>
    </div>
  );
};

export default YesGameCard;