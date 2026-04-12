// src/hooks/usePlayerReadiness.ts
import { useEffect, useState } from 'react';
import { getDoc, setDoc, updateDoc, subscribeDoc } from '../lib/api/client';
import { usePlayerContext } from '../context/PlayerContext';

export function usePlayerReadiness(gameId: string) {
  const { playerId } = usePlayerContext();
  const [isReady, setIsReady] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [playerReadiness, setPlayerReadiness] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !playerId) return;

    // Ensure the readiness document exists
    getDoc('readiness', gameId).then((data) => {
      if (!data) {
        setDoc('readiness', gameId, {});
      }
    });

    // Initial fetch
    getDoc('readiness', gameId).then((data) => {
      if (data) {
        handleReadinessUpdate(data as Record<string, boolean>);
      }
      setLoading(false);
    });

    // Listen to readiness changes via SSE
    const unsubscribe = subscribeDoc('readiness', gameId, (data) => {
      if (data) {
        handleReadinessUpdate(data as Record<string, boolean>);
      }
    });

    function handleReadinessUpdate(data: Record<string, boolean>) {
      setPlayerReadiness(data);
      setIsReady(data[playerId] || false);

      // Check if all players are ready
      getDoc('games', gameId).then((gameData) => {
        if (gameData) {
          const players = (gameData.players as any[]) || [];
          const playerIds = players
            .filter((p: any) => p.id !== gameData.hostId)
            .map((p: any) => p.id);

          if (playerIds.length > 0) {
            const allReady = playerIds.every((id: string) => data[id] === true);
            setAllPlayersReady(allReady);
          }
        }
      });
    }

    return () => unsubscribe();
  }, [gameId, playerId]);

  // Mark current player as ready
  const markAsReady = async () => {
    if (!gameId || !playerId) return;
    await updateDoc('readiness', gameId, { [playerId]: true });
  };

  // Reset all player readiness
  const resetReadiness = async () => {
    if (!gameId) return;

    const gameData = await getDoc('games', gameId);
    if (gameData) {
      const players = (gameData.players as any[]) || [];
      const resetData: Record<string, boolean> = {};
      players.forEach((player: any) => {
        resetData[player.id] = false;
      });
      await updateDoc('readiness', gameId, resetData);
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
