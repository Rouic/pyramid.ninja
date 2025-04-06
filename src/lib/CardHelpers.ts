// src/lib/CardHelpers.ts
import { GameData, PlayerCard, PlayerData } from "../types";
import { getCardDetails } from "./deckUtils";

/**
 * Class to handle card-related operations in a central place
 */
export class CardHelpers {
  /**
   * Deal initial cards to a player from the deck
   */
  static dealInitialCards(gameData: GameData, playerUid: string): {
    playerCards: PlayerCard[];
    updatedDeck: number[];
  } {
    if (!gameData || !gameData["__pyramid.deck"] || gameData["__pyramid.deck"].length < 4) {
      console.error("Cannot deal cards: Deck is missing or has insufficient cards");
      return { playerCards: [], updatedDeck: gameData["__pyramid.deck"] || [] };
    }

    // Copy the deck to avoid mutating the original
    const deck = [...gameData["__pyramid.deck"]];
    
    // Take the first 4 cards
    const cardIds = deck.splice(0, 4);
    
    // Create player cards with seen=false
    const playerCards = cardIds.map(id => ({ i: id, seen: false }));
    
    console.log(`Dealt ${playerCards.length} cards to player ${playerUid}`);
    
    return {
      playerCards,
      updatedDeck: deck
    };
  }

  /**
   * Deal a single new card to a player (used after bullshit calls)
   */
  static dealNewCard(gameData: GameData, playerUid: string): {
    newCard: PlayerCard | null;
    updatedDeck: number[];
  } {
    if (!gameData || !gameData["__pyramid.deck"] || gameData["__pyramid.deck"].length < 1) {
      console.error("Cannot deal new card: Deck is empty or missing");
      return { newCard: null, updatedDeck: gameData["__pyramid.deck"] || [] };
    }

    // Copy the deck to avoid mutating the original
    const deck = [...gameData["__pyramid.deck"]];
    
    // Take the top card
    const cardId = deck.shift();
    
    // Create a new player card with seen=false
    const newCard = cardId !== undefined ? { i: cardId, seen: false } : null;
    
    if (newCard) {
      console.log(`Dealt new card ${newCard.i} to player ${playerUid}`);
    } else {
      console.error("Failed to deal new card - undefined card ID");
    }
    
    return {
      newCard,
      updatedDeck: deck
    };
  }

  /**
   * Check if a card matches the current round card (for bullshit calls)
   */
  static checkCardMatch(
    playerCard: PlayerCard,
    roundCardId: number
  ): boolean {
    if (playerCard === undefined || roundCardId === undefined) {
      console.error("Cannot check card match: Missing card data");
      return false;
    }
    
    // Get card details
    const playerCardDetails = getCardDetails(playerCard.i);
    const roundCardDetails = getCardDetails(roundCardId);
    
    // Cards match if they have the same rank (regardless of suit)
    const isMatch = playerCardDetails.rank === roundCardDetails.rank;
    
    console.log(`Card match check: Player card ${playerCard.i} (${playerCardDetails.rank}) vs Round card ${roundCardId} (${roundCardDetails.rank}): ${isMatch}`);
    
    return isMatch;
  }

  /**
   * Log the current state of cards for debugging
   */
  static logCardState(gameData: GameData, playerUid: string): void {
    if (!gameData) {
      console.log("Card state: No game data available");
      return;
    }
    
    console.log("===== CARD STATE =====");
    console.log(`Deck: ${gameData["__pyramid.deck"]?.length || 0} cards remaining`);
    
    if (gameData["__pyramid.cards"]) {
      const revealedCount = gameData["__pyramid.cards"].filter(c => c.shown).length;
      console.log(`Pyramid: ${revealedCount}/${gameData["__pyramid.cards"].length} cards revealed`);
    }
    
    if (playerUid && gameData[playerUid]) {
      const playerData = gameData[playerUid] as PlayerData;
      if (playerData && 'cards' in playerData && Array.isArray(playerData.cards)) {
        const playerCards = playerData.cards;
        const seenCount = playerCards.filter(c => c.seen).length;
        console.log(`Player ${playerUid}: ${playerCards.length} cards, ${seenCount} seen`);
        console.log("Cards:", playerCards);
      } else {
        console.log(`Player ${playerUid}: No cards found`);
      }
    } else {
      console.log(`Player ${playerUid}: No player data found`);
    }
    
    console.log("======================");
  }
}