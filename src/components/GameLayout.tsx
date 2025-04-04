import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card } from "./Card";
import { GameControls } from "./GameControls";
import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import { useWindowSize } from "../hooks/useWindowSize";

export function GameLayout({ gameData, isHost }) {
  const router = useRouter();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { gameId } = router.query;
  const { allPlayersReady } = usePlayerReadiness(gameId as string);
  const [pyramidRevealLevel, setPyramidRevealLevel] = useState(0);

  // Determine layout based on device and if host
  const isHostOnLargeScreen = isHost && !isMobile;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Game Header */}
      <header className="bg-white shadow-sm py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Pyramid Ninja
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Room: {gameData?.roomCode || "Loading..."}
            </span>
            <button className="text-sm text-slate-600 hover:text-slate-800">
              Rules
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Game Content - Adaptive Layout */}
        <div
          className={`${
            isHostOnLargeScreen
              ? "md:grid md:grid-cols-4 gap-8"
              : "flex flex-col space-y-6"
          }`}
        >
          {/* Pyramid Section */}
          <div
            className={`${
              isHostOnLargeScreen ? "md:col-span-3" : ""
            } bg-white rounded-xl shadow-md p-4 md:p-6`}
          >
            <h2 className="text-lg md:text-xl font-semibold text-slate-700 mb-4">
              The Pyramid
            </h2>

            {/* Pyramid Display - Responsive Grid */}
            <div className="py-4">
              {Array.from({ length: 5 }).map((_, row) => (
                <div key={`row-${row}`} className="flex justify-center mb-4">
                  {Array.from({ length: row + 1 }).map((_, col) => (
                    <div key={`card-${row}-${col}`} className="mx-1 md:mx-2">
                      <Card
                        card={
                          pyramidRevealLevel > row
                            ? gameData?.pyramid?.[row]?.[col]
                            : undefined
                        }
                        flipped={pyramidRevealLevel > row}
                        className={
                          isHostOnLargeScreen
                            ? "w-28 h-36 md:w-32 md:h-44"
                            : "w-16 h-20 md:w-20 md:h-28"
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls & Player Cards */}
          <div className={`${isHostOnLargeScreen ? "md:col-span-1" : ""}`}>
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Game Controls
              </h2>
              <GameControls
                gameId={gameId as string}
                currentPhase={gameData?.phase}
                isHost={isHost}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Your Cards
              </h2>
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {gameData?.playerCards?.map((card, index) => (
                  <Card
                    key={`player-card-${index}`}
                    card={card}
                    flipped={true}
                    className="w-16 h-20 md:w-20 md:h-28"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-4 md:p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Players</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {gameData?.players?.map((player) => (
              <div
                key={player.id}
                className="flex flex-col items-center p-3 rounded-lg bg-slate-50"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="mt-2 text-sm font-medium text-slate-700">
                  {player.name}
                </span>
                <span
                  className={`mt-1 text-xs px-2 py-0.5 rounded-full ${
                    gameData?.playerReadiness?.[player.id]
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {gameData?.playerReadiness?.[player.id]
                    ? "Ready"
                    : "Not Ready"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
