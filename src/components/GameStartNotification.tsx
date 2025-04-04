// Add this component to notify players when the host forces game start
// Create a new file src/components/GameStartNotification.tsx

import React, { useState, useEffect } from "react";

interface GameStartNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const GameStartNotification: React.FC<GameStartNotificationProps> = ({
  isVisible,
  onClose,
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);

  useEffect(() => {
    setIsShowing(isVisible);

    if (isVisible) {
      const timer = setTimeout(() => {
        setIsShowing(false);
        onClose();
      }, 5000); // Auto dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isShowing) return null;

  return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      {/* Background glow effect */}
      <div className="absolute -inset-4 bg-game-neon-green/30 rounded-xl blur-xl animate-pulse-slow"></div>
      
      {/* Card-like notification */}
      <div className="relative bg-black border-2 border-game-neon-green border-opacity-70 rounded-xl px-6 py-4 shadow-neon-green-sm backdrop-blur-sm animate-float-slow transform -rotate-1">
        {/* Corner card chip decorations */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-game-neon-green border-opacity-50 rounded-tl-lg"></div>
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-game-neon-green border-opacity-50 rounded-tr-lg"></div>
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-game-neon-green border-opacity-50 rounded-bl-lg"></div>
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-game-neon-green border-opacity-50 rounded-br-lg"></div>
        
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3 w-10 h-10 rounded-full bg-game-neon-green bg-opacity-20 flex items-center justify-center border-2 border-game-neon-green border-opacity-40">
            <svg
              className="h-5 w-5 text-game-neon-green animate-pulse-slow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="mr-4">
            <span className="block font-game-fallback text-game-neon-green mb-1">GAME STARTED!</span>
            <span className="block text-white text-sm">
              Host revealed a card. Your cards are now hidden.
            </span>
          </div>
          <button
            onClick={() => {
              setIsShowing(false);
              onClose();
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-game-neon-green/40 hover:bg-game-neon-green/20 transition-colors duration-300"
          >
            <svg
              className="h-4 w-4 text-game-neon-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameStartNotification;
