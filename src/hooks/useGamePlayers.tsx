import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";

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

    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(
      gameRef,
      (doc) => {
        if (doc.exists()) {
          const gameData = doc.data();
          const playerMap: Record<string, Player> = {};

          // Format players into a map for easy lookup
          if (gameData.players && Array.isArray(gameData.players)) {
            gameData.players.forEach((player: any) => {
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
        } else {
          setError(new Error("Game not found"));
          setLoading(false);
        }
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  return { players, loading, error };
}
