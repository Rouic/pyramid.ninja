// src/components/MemorizationOverlay.tsx
import React from "react";

interface MemorizationOverlayProps {
  seconds: number;
  isVisible: boolean;
}

const MemorizationOverlay: React.FC<MemorizationOverlayProps> = ({
  seconds,
  isVisible,
}) => {

    
  if (!isVisible) return null;

  return null; //temp hide

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Use pointer-events-none to ensure clicks go through to elements below */}
      <div className="bg-yellow-500 bg-opacity-90 rounded-xl shadow-2xl p-8 max-w-md w-full text-center pointer-events-auto">
        <h2 className="text-white text-2xl font-bold mb-4">
          Memorize Your Cards!
        </h2>
        <div className="text-white text-6xl font-bold mb-6">{seconds}</div>
        <div className="w-full bg-yellow-300 h-4 rounded-full overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-1000"
            style={{ width: `${(seconds / 10) * 100}%` }}
          ></div>
        </div>
        <p className="text-white mt-4 text-lg">
          Remember your cards before they&apos;re hidden again!
        </p>
      </div>
    </div>
  );
};

export default MemorizationOverlay;
