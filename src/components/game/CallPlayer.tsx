// src/components/game/CallPlayer.tsx
import React from "react";
import { Player } from "../../types";

interface CallPlayerProps {
  players: Player[];
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onConfirm: () => void;
  onCancel: () => void;
  currentCard: string;
}

const CallPlayer: React.FC<CallPlayerProps> = ({
  players,
  selectedPlayer,
  onSelectPlayer,
  onConfirm,
  onCancel,
  currentCard,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Select Player to Drink!</h2>

          <p className="mb-6">
            <span className="font-semibold">
              Select a player below to tell them you have {currentCard} and make
              them drink.
            </span>{" "}
            They can either believe you and take the drinks or call bullshit.
          </p>

          {players.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              <h3 className="font-bold">
                Oh no! No other players to send drinks to! :(
              </h3>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.uid}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPlayer?.uid === player.uid
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => onSelectPlayer(player)}
                >
                  <input
                    type="radio"
                    name="playerSelect"
                    checked={selectedPlayer?.uid === player.uid}
                    onChange={() => onSelectPlayer(player)}
                    className="mr-3"
                  />
                  <img
                    src={`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/70/${player.name}.png`}
                    alt={`${player.name}'s avatar`}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <span className="font-medium">{player.name}</span>
                </div>
              ))}
            </div>
          )}

          {selectedPlayer && (
            <div className="mt-4 py-2 border-t border-gray-200">
              <p className="font-semibold">
                About to send a drink to: {selectedPlayer.name}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-200"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={!selectedPlayer}
              className={`px-4 py-2 text-white bg-rose-500 rounded-lg transition duration-200 ${
                selectedPlayer
                  ? "hover:bg-rose-600"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPlayer;
