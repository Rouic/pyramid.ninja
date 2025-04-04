// src/components/PlayerHand.tsx (Update)
import React, { useState, useEffect, useRef } from "react";
import { Card } from "../lib/deck";
import GameCard from "./GameCard";
import {
  subscribeToPlayerCards,
  updatePlayerCard,
} from "../lib/firebase/gameCards";
import { usePlayerContext } from "../context/PlayerContext";
import {
  replacePlayerCard,
  clearPlayerChallengeState,
} from "../lib/firebase/gameState";
import NewCardTimer from "./NewCardTimer"; // Import the timer component
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";

interface PlayerHandProps {
  gameId: string;
  isGameStarted: boolean;
  showFaceUp: boolean; // Only true during memorization phase or end of game
  highlightCurrentRank?: string;
  allowCardFlip?: boolean; // Controls when cards can be flipped
  challengedCardIndex?: number; // Indicates which card is being challenged
  onCardSelect?: (cardIndex: number) => void; // For handling card selection
  isSelectingForChallenge?: boolean; // Indicates if we're in challenge select mode
  onReplaceCard?: (cardIndex: number) => Promise<void>; // Added this prop for card replacement
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  gameId,
  isGameStarted,
  showFaceUp,
  highlightCurrentRank,
  allowCardFlip = false,
  challengedCardIndex = -1,
  onCardSelect,
  isSelectingForChallenge = false,
  onReplaceCard, // New parameter
}) => {
  const { playerId } = usePlayerContext();
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug logging of component state
  useEffect(() => {
    console.log("PlayerHand component state:", {
      gameId,
      playerId,
      isGameStarted,
      showFaceUp,
      cardsLength: playerCards.length,
      isArray: Array.isArray(playerCards),
      isLoading
    });
  }, [gameId, playerId, isGameStarted, showFaceUp, playerCards, isLoading]);
  const [selectedCardForChallenge, setSelectedCardForChallenge] = useState<
    number | null
  >(null);
  const [isDeckEmpty, setIsDeckEmpty] = useState(false);
  const [replacingCardIndex, setReplacingCardIndex] = useState<number | null>(
    null
  );
  const [shownCards, setShownCards] = useState<number[]>([]);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);
  const [newCardTimestamp, setNewCardTimestamp] = useState<string | null>(null);
  const [hidingCard, setHidingCard] = useState<boolean>(false);

  const isProcessingReplacement = useRef(false);


  // Subscribe to player's cards
  useEffect(() => {
    if (!gameId || !playerId) return;

    console.log(
      `Subscribing to cards for player ${playerId} in game ${gameId}`
    );
    setIsLoading(true);

    const unsubscribe = subscribeToPlayerCards(gameId, playerId, (cards) => {
      // We already ensure cards is an array in the subscribeToPlayerCards function
      // but we'll double-check here for extra safety
      console.log(`Received ${cards.length} cards for player ${playerId}`);
      
      try {
        if (cards.length > 0) {
          // Find any new card and record its index and timestamp
          const newCard = cards.findIndex((card) => card && card.newCard === true);
          if (newCard !== -1) {
            setNewCardIndex(newCard);
            // Use replacedAt if available, otherwise use current time
            setNewCardTimestamp(
              cards[newCard].replacedAt || new Date().toISOString()
            );
          } else {
            setNewCardIndex(null);
            setNewCardTimestamp(null);
          }
        }
        
        // Always update player cards with whatever we received (even if empty)
        setPlayerCards(cards);
      } catch (error) {
        console.error("Error processing player cards:", error);
        // Only use an empty array as fallback if we really had an error
        if (!Array.isArray(cards)) {
          setPlayerCards([]);
        } else {
          setPlayerCards(cards);
        }
      }
      
      setIsLoading(false);
    });

    // Subscribe to player document to watch for needsCardReplacement flag
    // FIXED: Use a more controlled approach with debouncing to prevent infinite loops
    const playerRef = doc(db, "games", gameId, "players", playerId);
    let lastProcessedTime = 0;

    const playerUnsubscribe = onSnapshot(playerRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const playerData = snapshot.data();

      // FIX: Only process replacement requests if we're not already processing one
      // and if enough time has passed since the last one (debounce)
      const now = Date.now();
      const needsReplacement =
        playerData.needsCardReplacement === true &&
        playerData.cardToReplace !== undefined &&
        playerData.cardToReplace !== null;

      if (
        needsReplacement &&
        !isProcessingReplacement.current &&
        now - lastProcessedTime > 2000
      ) {
        // At least 2 seconds between processing

        console.log(
          `🃏 AUTO-REPLACE: Detected card replacement needed for index ${playerData.cardToReplace}`
        );

        // Set the flag to prevent concurrent processing
        isProcessingReplacement.current = true;
        lastProcessedTime = now;

        // Force a small delay to ensure the card is properly shown during the challenge
        setTimeout(() => {
          // Automatically replace the card
          handleReplaceCard(playerData.cardToReplace)
            .then(() => {
              // Clear the flag to prevent multiple replacements, but do it after a delay
              // to prevent Firebase update race conditions
              setTimeout(() => {
                updateDoc(playerRef, {
                  needsCardReplacement: false,
                  cardToReplace: null,
                })
                  .catch((err) =>
                    console.error("Error clearing replacement flags:", err)
                  )
                  .finally(() => {
                    // Reset processing flag
                    isProcessingReplacement.current = false;
                  });
              }, 1000);
            })
            .catch((error) => {
              console.error("Error in auto-replace:", error);
              isProcessingReplacement.current = false;
            });
        }, 500);
      }
    });

    return () => {
      console.log(`Unsubscribing from player cards for ${playerId}`);
      unsubscribe();
      playerUnsubscribe();
    };
  }, [gameId, playerId]);

  // Reset selected card when challenge mode is exited
  useEffect(() => {
    if (!isSelectingForChallenge) {
      setSelectedCardForChallenge(null);
    }
  }, [isSelectingForChallenge]);

  // Track cards that have been shown in challenges
  useEffect(() => {
    if (
      challengedCardIndex !== -1 &&
      !shownCards.includes(challengedCardIndex)
    ) {
      setShownCards((prev) => [...prev, challengedCardIndex]);
    }
  }, [challengedCardIndex, shownCards]);

  const handleReplaceCard = async (cardIndex: number) => {
    if (!gameId || !playerId) return;

    console.log(
      `🃏 AUTO-REPLACE: Starting replacement for card at index ${cardIndex}`
    );
    setReplacingCardIndex(cardIndex);

    try {
      // If external handler is provided, use it
      if (onReplaceCard) {
        await onReplaceCard(cardIndex);
      } else {
        // Otherwise use the default implementation
        await replacePlayerCard(gameId, playerId, cardIndex);
      }

      // Remove card from shown cards after replacement
      setShownCards((prev) => prev.filter((idx) => idx !== cardIndex));
      console.log(
        `🃏 AUTO-REPLACE: Successfully replaced card at index ${cardIndex}`
      );
    } catch (error) {
      console.error("Error replacing card:", error);
    } finally {
      setReplacingCardIndex(null);
    }
  };

  const saveCardPosition = async (
    card: Card,
    index: number,
    newX: number,
    newY: number
  ) => {
    if (!gameId || !playerId) return;

    try {
      // Check for reset position signal (both x and y are 0)
      // This is a special signal from the card component indicating we should reset position
      if (newX === 0 && newY === 0) {
        console.log(`Reset position requested for card ${index} - repositioning to default`);
        
        // Calculate default position based on screen size and index
        const screenWidth = window.innerWidth;
        const cardSpacing = screenWidth < 768 ? 30 : 40;
        const defaultX = 20 + index * cardSpacing;
        const defaultY = 20;
        
        // Use default position
        const newPosition = { x: defaultX, y: defaultY };
        console.log(`Resetting card ${index} to default position: (${newPosition.x}, ${newPosition.y})`);
        
        // Update the card's position in Firebase
        const playerRef = doc(db, "games", gameId, "players", playerId);
        await updateDoc(playerRef, {
          [`cards.${index}.position`]: newPosition
        });
        
        return;
      }
      
      // Normal position update (not a reset)
      // Get current position, defaulting to a reasonable position if none exists
      const currentPos = card.position || { x: 20 + (index * 30), y: 20 };
      
      // Calculate new position with constraints to keep cards in view
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const cardWidth = 100;
      const cardHeight = 140;
      
      // Calculate constrained position to keep cards within the player area
      // The player area is roughly the bottom 200px of the screen with 20px margins
      const handAreaTop = Math.max(screenHeight - 200, 200); // Top of player hand area
      const handAreaBottom = screenHeight - 20; // Bottom of player hand area with margin
      const handAreaLeft = 20; // Left margin
      const handAreaRight = screenWidth - 20; // Right margin
      
      // Apply constraints to keep card in player area
      const constrainedX = Math.max(
        handAreaLeft, 
        Math.min(handAreaRight - cardWidth, currentPos.x + newX)
      );
      
      const constrainedY = Math.max(
        handAreaTop, 
        Math.min(handAreaBottom - cardHeight, currentPos.y + newY)
      );
      
      const newPosition = {
        x: constrainedX,
        y: constrainedY,
      };

      console.log(
        `Saving new position for card ${index}: (${newPosition.x}, ${newPosition.y})`
      );

      // Update the card's position in Firebase
      const playerRef = doc(db, "games", gameId, "players", playerId);
      const playerDoc = await getDoc(playerRef);

      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        const cards = [...(playerData.cards || [])];

        if (cards[index]) {
          // Update the position without changing other properties
          cards[index] = {
            ...cards[index],
            position: newPosition,
          };

          // Update the Firebase document
          await updateDoc(playerRef, {
            cards: cards,
          });
        }
      }
    } catch (error) {
      console.error("Error saving card position:", error);
    }
  };

  // Handler for card selection during challenge
  const handleCardSelect = (card: Card | null, index: number) => {
    // Guard against invalid card data
    if (!card) {
      console.error("Attempted to select a null or undefined card");
      return;
    }
    
    console.log(
      "🎮 Card selected:",
      index,
      "isSelectingForChallenge:",
      isSelectingForChallenge
    );

    try {
      if (isSelectingForChallenge && onCardSelect) {
        // Only allow selection if no card is already selected or this is the selected card
        if (
          selectedCardForChallenge === null ||
          selectedCardForChallenge === index
        ) {
          console.log("🎮 CHALLENGE FLOW: Selected card for challenge", index);
          setSelectedCardForChallenge(index);

          // IMPORTANT: Call onCardSelect immediately to ensure the parent component knows
          // which card was selected
          onCardSelect(index);

          // Directly fire an event to trigger the auto-submit in DrinkAssignmentPanel
          // This helps bridge the communication gap between components
          console.log("🎮 CHALLENGE FLOW: Dispatching auto-submit event");
          const customEvent = new CustomEvent("challenge:autoSubmit", {
            detail: { cardIndex: index },
          });
          document.dispatchEvent(customEvent);
        }
      }
    } catch (error) {
      console.error("Error in handleCardSelect:", error);
    }
  };

  // Handler for when a new card timer ends
  const handleNewCardTimerEnd = async () => {
    if (newCardIndex === null || !gameId || !playerId) return;

    try {
      setHidingCard(true);
      console.log(
        `🃏 AUTO-HIDE: Hiding card at index ${newCardIndex} after timer ended`
      );

      // Find the card that needs to be hidden
      const cardToHide = playerCards[newCardIndex];
      if (!cardToHide) {
        console.error("Card to hide not found");
        setHidingCard(false);
        return;
      }

      // Important: Check for card.i instead of card.id
      // The card structure might be using .i as the identifier
      if (cardToHide.i === undefined && cardToHide.id === undefined) {
        console.error("Card has no identifier (i or id)");
        setHidingCard(false);
        return;
      }

      // Get the card identifier (either .i or .id)
      const cardId = cardToHide.id || cardToHide.i.toString();

      console.log(
        `🃏 AUTO-HIDE: Processing card ${cardId} after memorization timer`
      );

      try {
        const playerRef = doc(db, "games", gameId, "players", playerId);

        // Get all player cards
        const snapshot = await getDoc(playerRef);
        if (snapshot.exists()) {
          const playerData = snapshot.data();
          const cards = [...(playerData.cards || [])];

          // Create a completely fresh card object with only the needed properties
          if (cards[newCardIndex]) {
            // Keep only the essential properties (like suit, value, id) and reset all state flags
            // Extract the card's core properties
            const i = cards[newCardIndex].i;
            const suit = cards[newCardIndex].suit;
            const rank = cards[newCardIndex].rank;
            const value = cards[newCardIndex].value;

            // Create a completely fresh card with clean state
            cards[newCardIndex] = {
              i, // Index in the deck (0-51)
              suit, // Keep the suit
              rank, // Keep the rank
              value, // Keep the value if exists
              faceVisible: false, // NOT visible to player
              newCard: false, // NOT new anymore
              revealed: false, // NOT revealed
              seen: true, // Player has seen it
              // Explicitly remove all challenge-related properties
              isInChallenge: false,
              challengeCardIndex: null,
              userFlipped: false,
            };

            // Aggressive update of the player document
            await updateDoc(playerRef, {
              cards,
              isInChallenge: false, // Ensure player is not in challenge mode
              challengeCardIndex: null, // Clear any selected card index
              updatedAt: new Date().toISOString(),
            });

            // SIMPLIFIED: Just clear the specific timer for this card
            const gameRef = doc(db, "games", gameId);
            await updateDoc(gameRef, {
              [`newCardTimers.${playerId}.${cardId}`]: null,
            });
          } else {
            // Just update player state if we can't find the card
            await updateDoc(playerRef, {
              isInChallenge: false,
              challengeCardIndex: null,
            });
          }
        }
        console.log("✅ Successfully reset card state after memorization");
      } catch (err) {
        console.error("❌ Error clearing player challenge state:", err);
      }

      // Log the change
      console.log(
        `🃏 AUTO-HIDE: Card ${cardId} successfully hidden after memorization`
      );

      // Reset state including challenge state
      setNewCardIndex(null);
      setNewCardTimestamp(null);
      setHidingCard(false);

      // Remove card from shown cards to ensure UI reflects new state
      setShownCards((prev) => prev.filter((idx) => idx !== newCardIndex));
    } catch (error) {
      console.error("❌ Error handling new card timer end:", error);
      setHidingCard(false);
    }
  };

  const ensureCardHasPosition = (card: Card, index: number): Card => {
    // If card already has position, return it unchanged
    if (card.position) {
      return card;
    }

    // Calculate simple evenly distributed positions for cards
    const screenWidth = window.innerWidth;
    const cardSpacing = screenWidth < 768 ? 30 : 40; // Spacing between cards
    const totalCards = 4; // Fixed number of cards
    
    // Calculate the starting X position to center the cards
    const startX = 20 + index * cardSpacing;
    
    // Simple flat layout - all cards at same height
    const defaultY = 20;
    
    // Return card with position added
    return {
      ...card,
      position: { x: startX, y: defaultY },
      owner: playerId, // Always ensure owner is set for drag functionality
    };
  };

  useEffect(() => {
    const handleCardSelectedEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (
        customEvent.detail &&
        customEvent.detail.index !== undefined &&
        isSelectingForChallenge
      ) {
        console.log(
          "🎮 CHALLENGE FLOW: Received card selection event:",
          customEvent.detail
        );
        const index = customEvent.detail.index;
        handleCardSelect(playerCards[index], index);
      }
    };

    document.addEventListener("card:selected", handleCardSelectedEvent);

    return () => {
      document.removeEventListener("card:selected", handleCardSelectedEvent);
    };
  }, [isSelectingForChallenge, playerCards, onCardSelect]);

  return (
    <div className="w-full h-48 md:h-56 relative border-t-2 border-game-neon-purple border-opacity-40 mt-8 pt-5 rounded-b-lg shadow-xl" 
      style={{
        background: "#1b084e",
        backgroundImage: "linear-gradient(to right, rgba(30, 14, 96, 0.8), rgba(66, 21, 143, 0.4)), linear-gradient(to bottom, rgba(30, 14, 96, 0.8), rgba(89, 30, 184, 0.2))",
        boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.5)"
      }}>
      <h3 className="text-lg font-game-fallback tracking-wide mb-4 px-5 flex justify-between items-center">
        <span className="text-game-neon-yellow animate-pulse-fast font-game-fallback">YOUR CARDS</span>
        {isLoading && (
          <span className="text-xs text-white font-sans bg-black bg-opacity-40 px-2 py-1 rounded-md animate-pulse">
            LOADING...
          </span>
        )}
        {!showFaceUp && !isLoading && (
          <span className="text-sm text-game-neon-red inline-flex items-center font-game-fallback px-3 py-1 bg-black bg-opacity-30 rounded-lg border border-game-neon-red border-opacity-30">
            <svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                clipRule="evenodd"
              />
            </svg>
            CARDS HIDDEN
          </span>
        )}

        {isSelectingForChallenge && (
          <span className="text-sm text-game-neon-yellow font-game-fallback tracking-wide animate-pulse-fast bg-black bg-opacity-40 px-3 py-1 rounded-lg border border-game-neon-yellow border-opacity-40 shadow-neon-yellow">
            SELECT CARD TO SHOW
          </span>
        )}
      </h3>

      <div className="relative h-36 md:h-44 w-full px-4">
        {(!Array.isArray(playerCards) || playerCards.length === 0) && !isLoading ? (
          <div className="text-center py-8 text-white bg-black bg-opacity-30 rounded-lg shadow-inner border border-white border-opacity-5 font-game-fallback tracking-wide px-3">
            {isGameStarted
              ? "NO CARDS YET. WAITING FOR DEAL..."
              : "CARDS WILL APPEAR WHEN GAME STARTS"}
          </div>
        ) : (
          playerCards.map((cardData, index) => {
            // Skip processing if card data is invalid
            if (!cardData) return null;

            try {
              // Make sure card has position data
              const card = ensureCardHasPosition(cardData, index);

              // Calculate default fan layout using the card's position
              const position = card.position || { x: 20 + (index * 30), y: 20 };

              // Determine if this specific card is being challenged
              const isBeingChallenged = challengedCardIndex === index;

              // Determine if this card has been selected for challenge
              const isSelected = selectedCardForChallenge === index;

              // Check if card has been shown in a challenge
              const hasBeenShown = shownCards.includes(index);

              // Clear shown state for new cards (important to prevent issues after replacement)
              if (card.newCard && hasBeenShown) {
                setShownCards((prev) => prev.filter((idx) => idx !== index));
              }

              // Determine if this card is selectable for challenge
              const isSelectable =
                isSelectingForChallenge &&
                (selectedCardForChallenge === null ||
                  selectedCardForChallenge === index);

              // Only highlight cards if they're face up AND match current rank,
              // OR if they're specifically selected for challenge
              // This prevents giving clues about face-down cards
              const shouldHighlight =
                (showFaceUp &&
                  highlightCurrentRank &&
                  card.rank === highlightCurrentRank) ||
                isSelected ||
                isBeingChallenged;

              // Fix for "click to reveal" issue - determine when to allow peeking
              // A card should be peekable during memorization or if it's a new card, but not in challenge mode
              const allowPeekForCard =
                (!showFaceUp && shouldHighlight) ||
                (card.newCard && !isSelectingForChallenge);

              // Fix for card visibility - update logic for when to show card face
              // Include a check for specific cases where we want to show the card
              const showCardFace =
                showFaceUp ||
                isBeingChallenged ||
                card.newCard ||
                card.faceVisible === true;

              return (
                <div key={card.id || index} className="relative">
                  <GameCard
                    card={card}
                    index={index}
                    position={position}
                    isRevealing={false}
                    canInteract={isGameStarted}
                    onDragEnd={(delta) =>
                      saveCardPosition(card, index, delta.x, delta.y)
                    }
                    className={`cursor-move ${
                      shouldHighlight || isBeingChallenged
                        ? "ring-4 ring-yellow-400 z-20"
                        : ""
                    } ${
                      isSelected
                        ? "ring-4 ring-blue-600 z-30"
                        : isSelectable
                        ? "hover:scale-110 hover:ring-2 hover:ring-blue-400"
                        : ""
                    }`}
                    onReveal={() => {
                      if (isSelectable) {
                        // Simply handle card selection - nothing more
                        handleCardSelect(card, index);
                      }
                    }}
                    allowPeek={allowPeekForCard}
                    showFace={showCardFace}
                    allowFlip={
                      allowCardFlip && (isBeingChallenged || isSelectable)
                    }
                    isHighlighted={isSelectable}
                    isSelectingForChallenge={isSelectingForChallenge}
                  />

                  {/* New card indicator */}
                  {card.newCard && (
                    <div className="absolute top-0 left-0 right-0 bg-green-600 bg-opacity-80 text-white text-center py-1 z-30 rounded-t-lg">
                      <div className="text-xs font-bold">NEW CARD</div>
                      <div className="text-sm">Memorize this card!</div>
                    </div>
                  )}
                </div>
              );
            } catch (error) {
              console.error(`Error rendering card at index ${index}:`, error);
              // Return a simple placeholder for the broken card
              return (
                <div key={`error-card-${index}`} className="relative w-[100px] h-[140px] absolute bg-red-900 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs text-center">
                    Card Error
                  </div>
                </div>
              );
            }
          })
        )}

        {isLoading && isGameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
            <div className="bg-game-card rounded-lg p-4 shadow-lg border border-game-neon-purple border-opacity-40 flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-game-neon-purple border-t-transparent mr-3"></div>
              <span className="text-white font-game-fallback tracking-wide">LOADING CARDS...</span>
            </div>
          </div>
        )}

        {hidingCard && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-40 rounded-lg backdrop-blur-sm">
            <div className="bg-game-card rounded-lg p-5 shadow-lg border-2 border-game-neon-yellow border-opacity-40 shadow-neon-yellow">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-game-neon-yellow border-t-transparent mr-3"></div>
                <span className="text-base font-game-fallback tracking-wide text-white">HIDING CARD...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add the new card timer */}
      {newCardIndex !== null && newCardTimestamp && (
        <NewCardTimer
          replacedAt={newCardTimestamp}
          onTimeEnd={handleNewCardTimerEnd}
        />
      )}
    </div>
  );
};

export default PlayerHand;
