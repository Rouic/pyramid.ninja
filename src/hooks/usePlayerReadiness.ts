// src/hooks/usePlayerReadiness.ts
import { useEffect, useState } from 'react';
import { doc, updateDoc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebase';
import { usePlayerContext } from '../context/PlayerContext';

export function usePlayerReadiness(gameId: string) {
  const { playerId } = usePlayerContext();
  const [isReady, setIsReady] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [playerReadiness, setPlayerReadiness] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerId) return;
    
    const gameRef = doc(db, 'games', gameId);
    const readinessRef = doc(db, 'games', gameId, 'meta', 'playerReadiness');
    
    // Ensure the readiness document exists
    getDoc(readinessRef).then((docSnap) => {
      if (!docSnap.exists()) {
        // Create the document if it doesn't exist
        setDoc(readinessRef, {});
      }
    });
    
    // Listen to the player readiness status changes
    const unsubscribe = onSnapshot(readinessRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, boolean>;
        setPlayerReadiness(data);
        
        // Check if current player is ready
        setIsReady(data[playerId] || false);
        
        // Get fresh data about players
        getDoc(gameRef).then((gameSnap) => {
          if (gameSnap.exists()) {
            const gameData = gameSnap.data();
            const players = gameData.players || [];
            
            // Check if all players are ready (excluding host)
            const playerIds = players
              .filter((p: any) => p.id !== gameData.hostId)
              .map((p: any) => p.id);
            
            if (playerIds.length > 0) {
              // All players are ready when each player ID in the game has a true value in playerReadiness
              const allReady = playerIds.every(id => data[id] === true);
              setAllPlayersReady(allReady);
            }
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [gameId, playerId]);

  // Mark current player as ready
  const markAsReady = async () => {
    if (!gameId || !playerId) return;
    
    const readinessRef = doc(db, 'games', gameId, 'meta', 'playerReadiness');
    await updateDoc(readinessRef, {
      [playerId]: true
    });
  };

  // Reset all player readiness
  const resetReadiness = async () => {
    if (!gameId) return;
    
    const gameRef = doc(db, 'games', gameId);
    const snapshot = await getDoc(gameRef);
    
    if (snapshot.exists()) {
      const gameData = snapshot.data();
      const players = gameData.players || [];
      
      const resetData: Record<string, boolean> = {};
      players.forEach((player: any) => {
        resetData[player.id] = false;
      });
      
      const readinessRef = doc(db, 'games', gameId, 'meta', 'playerReadiness');
      await updateDoc(readinessRef, resetData);
    }
  };

  return { 
    isReady, 
    markAsReady, 
    allPlayersReady, 
    resetReadiness, 
    playerReadiness,
    loading 
  };
}