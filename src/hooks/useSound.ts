// src/hooks/useSound.ts
import { useState, useEffect, useRef } from 'react';

// Sound categories and their counts
const soundCategories = {
  notification: 1,
  bullshit: 7,
  success: 3,
  wrong: 2,
};

// Type of sounds available
type SoundCategory = keyof typeof soundCategories;

export const useSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Create audio element only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      // Check if audio is muted in localStorage
      const storedMuted = localStorage.getItem('pyramid_sound_muted');
      if (storedMuted) {
        setIsMuted(storedMuted === 'true');
      }
    }
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Play a sound from a category
  const playSound = (category: SoundCategory) => {
    if (isMuted || !audioRef.current) return;
    
    try {
      // Get max number for this category
      const maxNumber = soundCategories[category];
      
      // Generate random index within available sounds
      const randomIndex = Math.floor(Math.random() * maxNumber) + 1;
      
      // Set the source and play
      audioRef.current.src = `/sounds/${category}/${randomIndex}.mp3`;
      audioRef.current.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pyramid_sound_muted', newMuted.toString());
    }
    
    return newMuted;
  };
  
  return {
    playSound,
    isMuted,
    toggleMute,
  };
};

export default useSound;