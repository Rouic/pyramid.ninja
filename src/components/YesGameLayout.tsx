/**
 * YesGameLayout Component
 * 
 * Main game layout for the YES card game. It handles:
 * - Game state management and player interactions
 * - Player grid display with their cards and status
 * - Game flow (start game, peek, swap, cut deck, reveal cards, next round)
 * - Life tracking for each player
 * - Game over/winner detection
 * 
 * This component integrates with the GameContext to manage the YES game state
 * in Firestore, providing a complete implementation of the game rules.
 */
import React, { useState, useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import YesGameCard from "./YesGameCard";
import { YesPlayer, YesGameState, PlayerData } from "../types";

interface YesGameLayoutProps {
  gameId: string;
  currentPlayerId: string;
  gameState: YesGameState;
  players: YesPlayer[];
  isHost: boolean;
}

const YesGameLayout: React.FC<YesGameLayoutProps> = ({
  gameId,
  currentPlayerId,
  gameState,
  players,
  isHost,
}) => {
  const { startYesGame, peekCard, swapCard, cutDeck, revealCards, nextRound } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  // Force update is used to trigger re-renders when necessary
  const [forceUpdate, setForceUpdate] = useState(false);
  // Add loading state for button feedback
  const [isStartingGame, setIsStartingGame] = useState(false);
  
  // Get current player
  const currentPlayer = players.find(p => p.uid === currentPlayerId);
  
  // Debugging effect to monitor state changes
  useEffect(() => {
    console.log("YesGameLayout - game state updated:", gameState);
    console.log("YesGameLayout - players:", players);
    console.log("YesGameLayout - current player:", currentPlayer);
    console.log("YesGameLayout - started:", gameState.started);
    console.log("YesGameLayout - force update:", forceUpdate);
  }, [gameState, players, forceUpdate, currentPlayer]);
  const isDealer = currentPlayer?.isDealer || false;
  
  // Get dealer
  const dealer = players.find(p => p.uid === gameState.dealer);
  
  // Determine if we're in the reveal phase
  const isRevealPhase = gameState.revealPhase || false;
  
  // Determine if all players have acted
  const allPlayersActed = players.every(player => 
    player.hasChecked || player.hasSwapped || player.isDealer
  );
  
  // Determine if dealer has acted (cut deck or played card)
  const dealerHasActed = dealer?.hasCut || dealer?.hasChecked;
  
  // Determine if game is ready for reveal phase
  const readyForReveal = allPlayersActed && dealerHasActed;
  
  // Determine if player can swap cards
  const canSwap = !currentPlayer?.hasSwapped && !isDealer && !isRevealPhase;
  
  // Handle starting the game
  const handleStartGame = async () => {
    if (isStartingGame) return; // Prevent multiple clicks
    
    try {
      setIsStartingGame(true);
      console.log("Starting YES game");
      await startYesGame(gameId);
      
      // Create a temporary local state update to immediately reflect the change in UI
      // This will be overridden when the Firebase subscription updates
      console.log("Setting local game state to started");
      
      // Force re-render of component with updated state
      setForceUpdate(prevState => !prevState);
      
      // Add a small delay then fetch latest game data
      setTimeout(() => {
        console.log("Game should be started now, local UI should update");
        setIsStartingGame(false);
      }, 1000);
    } catch (error) {
      console.error("Error starting YES game:", error);
      setIsStartingGame(false);
    }
  };
  
  // Handle peeking at card
  const handlePeekCard = async () => {
    try {
      await peekCard(gameId, currentPlayerId);
    } catch (error) {
      console.error("Error peeking at card:", error);
    }
  };
  
  // Handle player selection for swap
  const handlePlayerSelect = (playerId: string) => {
    if (swapMode && playerId !== currentPlayerId) {
      // Try to swap cards with selected player
      handleSwapCard(playerId);
      // Reset swap mode
      setSwapMode(false);
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(playerId);
    }
  };
  
  // Handle swap mode activation
  const handleSwapActivate = () => {
    setSwapMode(true);
  };
  
  // Handle card swap
  const handleSwapCard = async (targetPlayerId: string) => {
    if (!canSwap) return;
    
    try {
      await swapCard(gameId, currentPlayerId, targetPlayerId);
    } catch (error) {
      console.error("Error swapping cards:", error);
    }
  };
  
  // Handle dealer cutting the deck
  const handleCutDeck = async () => {
    if (!isDealer) return;
    
    try {
      await cutDeck(gameId, currentPlayerId);
    } catch (error) {
      console.error("Error cutting deck:", error);
    }
  };
  
  // Handle revealing all cards
  const handleRevealCards = async () => {
    if (!readyForReveal) return;
    
    try {
      await revealCards(gameId);
    } catch (error) {
      console.error("Error revealing cards:", error);
    }
  };
  
  // Handle advancing to next round
  const handleNextRound = async () => {
    if (!isRevealPhase) return;
    
    try {
      await nextRound(gameId);
    } catch (error) {
      console.error("Error advancing to next round:", error);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Game not started yet */}
      {!gameState.started && isHost && (
        <div className="flex flex-col items-center mb-8 gap-4">
          <button
            onClick={handleStartGame}
            disabled={isStartingGame}
            className={`px-6 py-3 ${isStartingGame ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} 
            text-white font-bold rounded-lg shadow-lg transition-colors relative`}
          >
            {isStartingGame ? (
              <>
                <span className="inline-block mr-2 animate-spin">⟳</span>
                Starting Game...
              </>
            ) : (
              'Start YES Game'
            )}
          </button>
          
          {/* Debug */}
          <div className="text-xs text-gray-400 flex flex-col items-center mt-2">
            <div>Game ID: {gameId}</div>
            <div>Started: {gameState.started ? 'Yes' : 'No'}</div>
            <div>Players: {players.length}</div>
            <div>Current Player: {currentPlayerId}</div>
            {gameState.dealer && <div>Dealer: {gameState.dealer}</div>}
            <button 
              onClick={() => setForceUpdate(prev => !prev)}
              className="mt-2 text-xs text-blue-500 underline"
            >
              Force Refresh
            </button>
          </div>
        </div>
      )}
      
      {/* Game info header */}
      <div className="mb-6 p-4 bg-blue-950 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl text-white font-bold">Round {gameState.currentRound}</h2>
            <p className="text-blue-300">
              Dealer: {dealer?.name || "Not selected"}
            </p>
          </div>
          
          <div className="flex gap-4">
            {isRevealPhase ? (
              <button
                onClick={handleNextRound}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
              >
                Next Round
              </button>
            ) : readyForReveal && (isHost || isDealer) && (
              <button
                onClick={handleRevealCards}
                className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
              >
                Reveal Cards
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Players grid */}
      {gameState.started && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {players.map(player => (
            <div 
              key={player.uid} 
              className={`p-4 rounded-lg ${player.uid === currentPlayerId 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-gray-100'}
                ${swapMode && player.uid !== currentPlayerId ? 'cursor-pointer hover:bg-yellow-100' : ''}
                ${selectedPlayer === player.uid ? 'ring-2 ring-yellow-500' : ''}
                ${player.lostLife ? 'bg-red-100 border-red-300' : ''}`}
              onClick={() => swapMode && handlePlayerSelect(player.uid)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold">{player.name}</h3>
                <div className="flex items-center">
                  {/* Lives display */}
                  <div className="flex">
                    {Array.from({ length: player.lives }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-5 h-5 rounded-full bg-red-500 mx-0.5"
                      ></div>
                    ))}
                    {Array.from({ length: 3 - player.lives }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-5 h-5 rounded-full bg-gray-300 mx-0.5"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Only show card for current player or during reveal phase */}
              {(player.uid === currentPlayerId || isRevealPhase) && (
                <div className="flex justify-center">
                  <YesGameCard
                    gameId={gameId}
                    playerId={player.uid}
                    card={player.card}
                    isDealer={player.isDealer || false}
                    canReveal={isRevealPhase}
                    onPeek={player.uid === currentPlayerId ? handlePeekCard : undefined}
                    onSwap={player.uid === currentPlayerId && canSwap ? handleSwapActivate : undefined}
                    onCut={player.uid === currentPlayerId && isDealer ? handleCutDeck : undefined}
                    onReveal={handleRevealCards}
                  />
                </div>
              )}
              
              {/* Status indicators */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {player.hasChecked && !player.hasSwapped && (
                  <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                    Checked Card
                  </span>
                )}
                {player.hasSwapped && (
                  <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                    Swapped
                  </span>
                )}
                {player.hasCut && (
                  <span className="px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded-full">
                    Cut Deck
                  </span>
                )}
                {player.blockingSwap && (
                  <span className="px-2 py-1 text-xs bg-indigo-200 text-indigo-800 rounded-full">
                    Blocked Swap (King)
                  </span>
                )}
                {player.lostLife && (
                  <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">
                    Lost a Life
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Swap mode indicator */}
      {swapMode && (
        <div className="fixed bottom-4 inset-x-0 mx-auto w-full max-w-sm p-4 bg-yellow-100 border border-yellow-400 rounded-lg text-center shadow-lg">
          <p className="text-yellow-800 font-semibold">Select a player to swap cards with</p>
          <button 
            onClick={() => setSwapMode(false)} 
            className="mt-2 px-4 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Game over display */}
      {gameState.finished && gameState.winner && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-md text-center">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-6">
              {players.find(p => p.uid === gameState.winner)?.name || "Unknown"} wins!
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YesGameLayout;