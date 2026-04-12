import { useEffect, useState } from "react";
import { getDoc, subscribeDoc } from "../lib/api/client";

type Player = {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
};

export function useGamePlayers(gameId: string) {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    function processGameData(gameData: Record<string, unknown> | null) {
      if (!gameData) {
        setError(new Error("Game not found"));
        setLoading(false);
        return;
      }

      const playerMap: Record<string, Player> = {};
      const playerList = gameData.players as any[];

      if (playerList && Array.isArray(playerList)) {
        playerList.forEach((player: any) => {
          if (player.id) {
            playerMap[player.id] = {
              id: player.id,
              name: player.name || "Unknown",
              avatar: player.avatar,
              isHost: player.isHost || false,
            };
          }
        });
      }

      setPlayers(playerMap);
      setLoading(false);
    }

    // Initial fetch
    getDoc("games", gameId).then(processGameData).catch((err) => {
      setError(err);
      setLoading(false);
    });

    // Real-time updates via SSE
    const unsubscribe = subscribeDoc("games", gameId, processGameData);

    return () => unsubscribe();
  }, [gameId]);

  return { players, loading, error };
}
