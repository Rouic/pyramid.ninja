import { useEffect, useState } from 'react';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebase';
import { useAuth } from '../contexts/AuthContext';

export function usePlayerReadiness(gameId: string) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [playerReadiness, setPlayerReadiness] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!gameId || !user) return;
    
    const gameRef = doc(db, 'games', gameId);
    
    // Listen to the player readiness status changes
    const unsubscribe = onSnapshot(doc(db, 'games', gameId, 'playerReadiness', 'status'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Record<string, boolean>;
        setPlayerReadiness(data);
        
        // Check if current player is ready
        setIsReady(data[user.uid] || false);
        
        // Check if all players are ready
        const gameDoc = getDoc(gameRef);
        gameDoc.then((snapshot) => {
          if (snapshot.exists()) {
            const players = snapshot.data().players || [];
            const allReady = players.every((playerId: string) => data[playerId]);
            setAllPlayersReady(allReady);
          }
        });
      }
    });
    
    return () => unsubscribe();
  }, [gameId, user]);

  // Mark current player as ready
  const markAsReady = async () => {
    if (!gameId || !user) return;
    
    const readinessRef = doc(db, 'games', gameId, 'playerReadiness', 'status');
    await updateDoc(readinessRef, {
      [user.uid]: true
    });
  };

  // Reset all player readiness
  const resetReadiness = async () => {
    if (!gameId) return;
    
    const gameRef = doc(db, 'games', gameId);
    const snapshot = await getDoc(gameRef);
    
    if (snapshot.exists()) {
      const players = snapshot.data().players || [];
      const resetData = players.reduce((acc: Record<string, boolean>, playerId: string) => {
        acc[playerId] = false;
        return acc;
      }, {});
      
      const readinessRef = doc(db, 'games', gameId, 'playerReadiness', 'status');
      await updateDoc(readinessRef, resetData);
    }
  };

  return { isReady, markAsReady, allPlayersReady, resetReadiness, playerReadiness };
}