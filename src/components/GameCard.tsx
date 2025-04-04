import React, { useState, useEffect, useRef } from "react";
import { Card as CardType } from "../lib/deck";
import { motion } from "framer-motion";
import { usePlayerContext } from "../context/PlayerContext";
import { useWindowSize } from "../hooks/useWindowSize";

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
  isSelectingForChallenge?: boolean;
  onDragEnd?: (delta: { x: number; y: number }) => void;
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
  isSelectingForChallenge = false,
  onDragEnd,
}) => {
  const { playerId } = usePlayerContext();
  const windowSize = useWindowSize();
  const [isFlipped, setIsFlipped] = useState(card.revealed || showFace);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [userFlipped, setUserFlipped] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update flip state when revealed status or showFace changes
  useEffect(() => {
    setIsFlipped(card.revealed || showFace || userFlipped);
  }, [card.revealed, showFace, userFlipped]);
  
  // Update drag constraints when window size changes
  useEffect(() => {
    // This will ensure constraints are recalculated when window is resized
    // The actual calculation happens in the render function
  }, [windowSize.width, windowSize.height, position.x, position.y]);
  
  // Reset click counter after timeout
  useEffect(() => {
    return () => {
      // Cleanup function to clear timeout when component unmounts
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleReveal = (e: React.MouseEvent) => {
    // Prevent event from bubbling to the drag handler
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    // Detect multiple rapid clicks
    setClickCount(prev => {
      const newCount = prev + 1;
      
      // Check for multiple rapid clicks (3+ clicks within 1.5 seconds)
      if (newCount >= 3) {
        console.log("Multiple clicks detected - might be accidentally dragging");
        
        // Notify parent to reset position if we have 3+ rapid clicks
        if (onDragEnd) {
          // Signal to reset position by passing {0,0} as delta
          onDragEnd({ x: 0, y: 0 });
        }
        
        // Reset click counter
        setTimeout(() => {
          setClickCount(0);
        }, 300);
        
        return 0;
      }
      
      // Reset click counter after 1.5 seconds of no clicks
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);
      
      return newCount;
    });
    
    // Only allow card flips for certain conditions
    if (!canInteract) return;

    // For pyramid cards: standard reveal logic
    if (onReveal && !isFlipped) {
      onReveal(card);
      return;
    }

    // For player cards: Only allow flipping if explicitly permitted
    if (allowFlip && !userFlipped) {
      console.log(
        `🎴 CARD: Card ${index} manually flipped by user during challenge`
      );
      setUserFlipped(true);

      // FIX: If we're in challenge mode and selecting a card, make sure the parent component knows
      if (isSelectingForChallenge) {
        console.log(
          `🎴 CARD: Broadcasting card selection event for index ${index}`
        );

        // Dispatch event to notify listeners
        const customEvent = new CustomEvent("card:selected", {
          detail: { index, card },
        });
        document.dispatchEvent(customEvent);

        // Also dispatch the auto-submit event directly
        // This ensures the challenge resolution starts even if other listeners fail
        setTimeout(() => {
          console.log(
            `🎴 CARD: Auto-triggering challenge submit for index ${index}`
          );
          const submitEvent = new CustomEvent("challenge:autoSubmit", {
            detail: { cardIndex: index },
          });
          document.dispatchEvent(submitEvent);
        }, 300);
      }
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

  // Get suit symbol - handle both string and number formats
  const getSuitSymbol = (suit: string | number) => {
    if (typeof suit === "number") {
      // Handle numeric suit (0=spades, 1=hearts, 2=clubs, 3=diamonds)
      return ["♠", "♥", "♣", "♦"][suit] || "♠";
    }

    // Handle string suit
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
        return "♠"; // Default to spades
    }
  };

  // Get suit color - handle both string and number formats
  const getSuitColor = (suit: string | number) => {
    if (typeof suit === "number") {
      // Handle numeric suit (0=spades, 1=hearts, 2=clubs, 3=diamonds)
      return suit === 1 || suit === 3 ? "text-red-600" : "text-gray-900";
    }

    // Handle string suit
    return suit === "hearts" || suit === "diamonds"
      ? "text-red-600"
      : "text-gray-900";
  };

  // CRITICAL FIX: Handle rendering when suit or rank are not available
  const suitSymbol = card.suit ? getSuitSymbol(card.suit) : "♠";
  const suitColor = card.suit ? getSuitColor(card.suit) : "text-gray-900";
  const cardRank =
    card.rank ||
    (typeof card.i === "number"
      ? ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
          card.i % 13
        ]
      : "A");

  // Generate card symbols layout based on value with correct positioning
  const renderCardFace = (value: string, suitSymbol: string) => {
    // Handle face cards (J, Q, K) with simpler design
    if (value === "J") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">J</div>
            <div className="text-3xl">{suitSymbol}</div>
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
            <div className="text-3xl">{suitSymbol}</div>
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
            <div className="text-3xl">{suitSymbol}</div>
            <div className="text-lg mt-1">KING</div>
          </div>
        </div>
      );
    }

    // Handle Ace
    if (value === "A") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-5xl">{suitSymbol}</div>
        </div>
      );
    }

    // Handle number cards with properly centered layouts
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      // Fallback for invalid values
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-5xl">{suitSymbol}</div>
        </div>
      );
    }

    switch (numValue) {
      case 2:
        return (
          // Tightened layout for 2
          <div className="flex flex-col justify-between h-full my-3">
            <div className="text-2xl text-center">{suitSymbol}</div>
            <div className="text-2xl text-center transform rotate-180">
              {suitSymbol}
            </div>
          </div>
        );
      case 3:
        return (
          // Tightened layout for 3
          <div className="flex flex-col justify-between h-full my-2">
            <div className="text-2xl text-center">{suitSymbol}</div>
            <div className="text-2xl text-center">{suitSymbol}</div>
            <div className="text-2xl text-center transform rotate-180">
              {suitSymbol}
            </div>
          </div>
        );
      case 4:
        return (
          // 2x2 grid
          <div className="grid grid-cols-2 h-full items-center px-2 my-6">
            <div className="text-xl text-left">{suitSymbol}</div>
            <div className="text-xl text-right">{suitSymbol}</div>
            <div className="text-xl text-left transform rotate-180">
              {suitSymbol}
            </div>
            <div className="text-xl text-right transform rotate-180">
              {suitSymbol}
            </div>
          </div>
        );
      case 5:
        return (
          // 2x2 grid with center symbol
          <div className="h-full flex flex-col justify-center my-4">
            <div className="grid grid-cols-2 mb-2">
              <div className="text-xl text-left ml-2">{suitSymbol}</div>
              <div className="text-xl text-right mr-2">{suitSymbol}</div>
            </div>
            <div className="text-xl text-center my-1">{suitSymbol}</div>
            <div className="grid grid-cols-2 mt-2">
              <div className="text-xl text-left ml-2 transform rotate-180">
                {suitSymbol}
              </div>
              <div className="text-xl text-right mr-2 transform rotate-180">
                {suitSymbol}
              </div>
            </div>
          </div>
        );
      // ... rest of the cases remain the same
      default:
        // Fallback for any other number
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-4xl mt-2">{suitSymbol}</div>
            </div>
          </div>
        );
    }
  };

  // Determine if we should show the "click to reveal" hint
  // We only want to show this on cards that are being explicitly selected for a challenge
  // And NEVER for cards that are new or already seen
  const shouldShowRevealHint =
    canInteract &&
    allowFlip &&
    isSelectingForChallenge &&
    !isFlipped &&
    !card.newCard &&
    !card.seen;

  // Simple drag constraints to prevent cards from going off-screen
  const safetyMargin = 50; // Keep cards at least partially visible
  const cardWidth = 100;
  const cardHeight = 140; 
  
  // Simple constraints to keep cards visible on screen
  const dragConstraints = {
    left: -position.x + safetyMargin, 
    right: windowSize.width - position.x - cardWidth + safetyMargin,
    top: -position.y + safetyMargin,
    bottom: windowSize.height - position.y - cardHeight + safetyMargin
  };
  
  // Debug log for card rendering (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Rendering card ${index} with position:`,
      position,
      "constraints:",
      dragConstraints,
      "card data:",
      {
        i: card.i,
        suit: card.suit,
        rank: card.rank,
        owner: card.owner,
        revealed: card.revealed,
        isFlipped: isFlipped,
      }
    );
  }

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
      // Simple drag handling 
      drag={!!canInteract}
      dragConstraints={dragConstraints}
      dragElastic={0.5}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        
        // Call the callback with the offset
        if (onDragEnd) {
          onDragEnd({ 
            x: info.offset.x, 
            y: info.offset.y 
          });
        }
      }}
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
            onClick={(e) => handleReveal(e)}
            onMouseDown={handlePeekStart}
            onMouseUp={handlePeekEnd}
            onMouseLeave={handlePeekEnd}
            onTouchStart={handlePeekStart}
            onTouchEnd={handlePeekEnd}
          >
            <div className="h-full w-full relative">
              {/* Solid background - Balatro-style */}
              <div className="absolute inset-0 bg-game-card rounded-lg shadow-md">
                {/* Card back - solid color with pattern like Balatro */}
                <div className="absolute inset-0 bg-[#130632] rounded-lg">
                  {/* Pattern grid overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-15">
                    <div className="absolute inset-0" 
                      style={{
                        backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
                        backgroundSize: "10px 10px"
                      }}>
                    </div>
                  </div>

                  {/* Card back logo/design - Balatro style with chip */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-[#1b084e] flex items-center justify-center border-2 border-game-neon-yellow border-opacity-70 overflow-hidden shadow-neon-yellow">
                      <div className="text-game-neon-yellow font-display-fallback text-2xl tracking-wider animate-pulse-fast">P</div>
                      <div className="absolute inset-0 bg-opacity-20" 
                        style={{
                          backgroundImage: "radial-gradient(circle at center, rgba(255,201,5,0.3), transparent 70%)"
                        }}>
                      </div>
                    </div>
                  </div>

                  {/* Decorative elements - Balatro inspired card design */}
                  <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-game-neon-purple to-transparent opacity-20"></div>
                  <div className="absolute inset-0 border-[3px] rounded-lg" style={{ borderColor: 'rgba(147, 51, 234, 0.3)' }}></div>
                  <div className="absolute inset-0 m-2 border border-white border-opacity-10 rounded-lg"></div>
                  
                  {/* Corner design elements more pronounced */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-game-neon-yellow border-opacity-40 rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-game-neon-yellow border-opacity-40 rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-game-neon-yellow border-opacity-40 rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-game-neon-yellow border-opacity-40 rounded-br-lg"></div>
                </div>
              </div>

              {/* Loading state */}
              {isRevealing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
              )}

              {/* Peek hint with Balatro styling */}
              {allowPeek && !card.newCard && (
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <div className="inline-block text-sm bg-black bg-opacity-50 text-game-neon-yellow px-3 py-1.5 rounded-lg animate-pulse-fast border border-game-neon-yellow border-opacity-40 shadow-neon-yellow">
                    HOLD TO PEEK
                  </div>
                </div>
              )}

              {/* Flip hint - Balatro style */}
              {shouldShowRevealHint && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg backdrop-blur-sm">
                  <div className="text-white font-game-fallback tracking-wide text-center px-4 py-2 bg-game-neon-blue rounded-lg animate-pulse-fast shadow-neon-blue">
                    TAP TO REVEAL
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
            className={`h-full w-full rounded-lg shadow-card overflow-hidden ${suitColor} hover:shadow-card-hover transition-shadow`}
          >
            <div className="relative h-full border rounded-lg bg-white">
              {/* Card inset shadow for depth */}
              <div className="absolute inset-0 shadow-inner rounded-lg"></div>
              
              {/* Inset pattern to look like Balatro */}
              <div className="absolute inset-0 bg-opacity-5" 
                  style={{
                    backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
                    backgroundSize: "8px 8px"
                  }}>
              </div>
              
              {/* Top left corner - Balatro style */}
              <div className="absolute top-1 left-2 z-10 flex flex-col items-center">
                <div className="text-base font-bold font-game-fallback">{cardRank}</div>
                <div className="text-xl mt-0.5">{suitSymbol}</div>
              </div>

              {/* Bottom right corner (rotated) - Balatro style */}
              <div className="absolute bottom-1 right-2 transform rotate-180 z-10 flex flex-col items-center">
                <div className="text-base font-bold font-game-fallback">{cardRank}</div>
                <div className="text-xl mt-0.5">{suitSymbol}</div>
              </div>

              {/* Card face content - enhanced styling with better centering */}
              <div className="h-full w-full flex items-center justify-center py-6">
                {renderCardFace(cardRank, suitSymbol)}
              </div>

              {/* Card border like Balatro */}
              <div className="absolute inset-0 border-2 border-black border-opacity-5 rounded-lg pointer-events-none"></div>
              
              {/* Corner decorations like Balatro */}
              <div className="absolute top-0.5 left-0.5 w-4 h-4 border-t border-l rounded-tl-lg pointer-events-none" style={{borderColor: 'rgba(0,0,0,0.2)'}}></div>
              <div className="absolute top-0.5 right-0.5 w-4 h-4 border-t border-r rounded-tr-lg pointer-events-none" style={{borderColor: 'rgba(0,0,0,0.2)'}}></div>
              <div className="absolute bottom-0.5 left-0.5 w-4 h-4 border-b border-l rounded-bl-lg pointer-events-none" style={{borderColor: 'rgba(0,0,0,0.2)'}}></div>
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 border-b border-r rounded-br-lg pointer-events-none" style={{borderColor: 'rgba(0,0,0,0.2)'}}></div>

              {/* New card indicator - Balatro style */}
              {card.newCard && (
                <div className="absolute top-0 right-0 bg-game-neon-green text-white text-xs font-game-fallback px-3 py-1 rounded-bl z-20 shadow-neon-green animate-pulse-fast font-medium tracking-wider">
                  NEW
                </div>
              )}

              {/* User revealed indicator - Balatro style */}
              {userFlipped && (
                <div className="absolute top-0 left-0 bg-game-neon-yellow text-black text-xs font-game-fallback px-3 py-1 rounded-br z-20 shadow-neon-yellow font-medium tracking-wider">
                  REVEALED
                </div>
              )}

              {/* Challenge indicator - Balatro style */}
              {isSelectingForChallenge && isFlipped && (
                <div className="absolute bottom-0 left-0 right-0 bg-game-neon-blue text-white text-xs font-game-fallback tracking-wide text-center py-1.5 z-20 shadow-neon-blue font-medium">
                  SHOWING FOR CHALLENGE
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
