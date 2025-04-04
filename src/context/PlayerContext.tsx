import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import { useConsent } from "../contexts/ConsentContext";

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
  const { consent, hasSetConsent } = useConsent();

  // Initialize player info from localStorage if available and consent is given
  useEffect(() => {
    // Only access localStorage if we have consent or consent hasn't been set yet
    if (consent.localStorage || !hasSetConsent) {
      const storedPlayerId = localStorage.getItem("playerId");
      const storedPlayerName = localStorage.getItem("playerName");
  
      if (storedPlayerId) setPlayerId(storedPlayerId);
      if (storedPlayerName) setPlayerName(storedPlayerName);
    }
  }, [consent.localStorage, hasSetConsent]);

  // Save changes to localStorage if consent is given
  useEffect(() => {
    if ((consent.localStorage || !hasSetConsent) && playerId) {
      localStorage.setItem("playerId", playerId);
    }
    if ((consent.localStorage || !hasSetConsent) && playerName) {
      localStorage.setItem("playerName", playerName);
    }
  }, [playerId, playerName, consent.localStorage, hasSetConsent]);

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
