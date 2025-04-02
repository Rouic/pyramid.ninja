// src/components/game/PlayerList.tsx
import React from "react";
import { Player } from "../../types";

interface PlayerListProps {
  players: Player[];
  onSelectPlayer?: (player: Player) => void;
  currentPlayer?: string | null;
  displayMode?: "horizontal" | "vertical" | "grid";
  showDrinks?: boolean;
  className?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onSelectPlayer,
  currentPlayer = null,
  displayMode = "horizontal",
  showDrinks = false,
  className = "",
}) => {
  // Get avatar URL for a player
  const getAvatarUrl = (name: string, size: number = 70) => {
    return `https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/${size}/${name}.png`;
  };

  // Layout classes based on display mode
  const containerClasses = {
    horizontal: "flex flex-row flex-wrap justify-center gap-4",
    vertical: "flex flex-col items-center gap-4",
    grid: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
  };

  // Player item classes
  const playerClasses = `
    flex flex-col items-center 
    p-2 rounded-lg 
    transition-all duration-300
    ${onSelectPlayer ? "cursor-pointer hover:bg-indigo-100" : ""}
  `;

  return (
    <div className={`${containerClasses[displayMode]} ${className}`}>
      {players.map((player) => (
        <div
          key={player.uid}
          className={`${playerClasses} ${
            player.uid === currentPlayer
              ? "bg-indigo-100 border-2 border-indigo-500"
              : ""
          }`}
          onClick={() => onSelectPlayer && onSelectPlayer(player)}
        >
          <div className="relative">
            <img
              src={getAvatarUrl(player.name)}
              alt={`${player.name}'s avatar`}
              className="w-16 h-16 rounded-full object-cover shadow-md"
            />
            {showDrinks && player.drinks > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow">
                {player.drinks}
              </div>
            )}
          </div>
          <div className="mt-2 text-center">
            <p className="font-semibold text-sm truncate max-w-[100px]">
              {player.name}
            </p>
            {showDrinks && (
              <p className="text-xs text-gray-500">{player.drinks} drinks</p>
            )}
          </div>
        </div>
      ))}

      {players.length === 0 && (
        <div className="text-center text-gray-500 p-4">
          No players have joined yet
        </div>
      )}
    </div>
  );
};

export default PlayerList;
