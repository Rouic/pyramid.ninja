import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";

interface PlayerContextType {
  playerId: string;
  playerName: string;
  isHost: boolean;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setIsHost: (isHost: boolean) => void;
}

const defaultContext: PlayerContextType = {
  playerId: "",
  playerName: "",
  isHost: false,
  setPlayerId: () => {},
  setPlayerName: () => {},
  setIsHost: () => {},
};

const PlayerContext = createContext<PlayerContextType>(defaultContext);

export const usePlayerContext = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);

  // Initialize player info from localStorage if available
  useEffect(() => {
    const storedPlayerId = localStorage.getItem("playerId");
    const storedPlayerName = localStorage.getItem("playerName");

    if (storedPlayerId) setPlayerId(storedPlayerId);
    if (storedPlayerName) setPlayerName(storedPlayerName);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (playerId) localStorage.setItem("playerId", playerId);
    if (playerName) localStorage.setItem("playerName", playerName);
  }, [playerId, playerName]);

  return (
    <PlayerContext.Provider
      value={{
        playerId,
        playerName,
        isHost,
        setPlayerId,
        setPlayerName,
        setIsHost,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
