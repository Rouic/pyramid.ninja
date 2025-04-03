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

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce-slow">
      <div className="flex items-center">
        <svg
          className="h-5 w-5 mr-2"
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
        <div>
          <span className="font-medium">Game has started!</span>
          <span className="ml-2">
            The host revealed a card. Your cards are now hidden.
          </span>
        </div>
        <button
          onClick={() => {
            setIsShowing(false);
            onClose();
          }}
          className="ml-4 text-white hover:text-blue-100"
        >
          <svg
            className="h-5 w-5"
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
  );
};

export default GameStartNotification;
