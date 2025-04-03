// src/components/NewCardTimer.tsx
import React, { useState, useEffect, useRef } from "react";

interface NewCardTimerProps {
  replacedAt?: string | Date;
  onTimeEnd?: () => void;
}

const NewCardTimer: React.FC<NewCardTimerProps> = ({
  replacedAt,
  onTimeEnd,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isActive, setIsActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!replacedAt) {
      setIsActive(false);
      return;
    }

    // Clean up any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate remaining time based on replacedAt timestamp
    const startTime = new Date(replacedAt).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    const totalDuration = 15000; // 15 seconds
    const remaining = Math.max(0, Math.floor((totalDuration - elapsed) / 1000));

    console.log(`New card timer: ${remaining} seconds remaining from ${replacedAt}`);

    setTimeLeft(remaining);
    setIsActive(remaining > 0);

    if (remaining <= 0) {
      console.log("Timer already expired, calling onTimeEnd immediately");
      if (onTimeEnd) onTimeEnd();
      return;
    }

    // Set up the timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsActive(false);

          // Log and ensure the callback is called
          console.log("⏰ New card timer ended, calling onTimeEnd callback");
          if (onTimeEnd) {
            // Use setTimeout to ensure the callback runs even if there's an error in the component
            setTimeout(() => {
              try {
                onTimeEnd();
                console.log("⏰ Successfully processed end of timer");
              } catch (error) {
                console.error("❌ Error in onTimeEnd callback:", error);
              }
            }, 0);
          }
        }
        return newTime;
      });
    }, 1000);

    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [replacedAt, onTimeEnd]);

  // If we're inactive, don't render anything
  if (!isActive) return null;

  return (
    <div className="fixed z-50 bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-xs w-full text-center">
      <h4 className="font-bold text-lg mb-1">Memorize Your New Card!</h4>
      <p className="mb-2">This card will be hidden again in:</p>
      <div className="text-3xl font-bold mb-2">{timeLeft} seconds</div>
      <div className="w-full bg-green-500 h-2 rounded-full overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-1000"
          style={{ width: `${(timeLeft / 15) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default NewCardTimer;
