import React from "react";
import Link from "next/link";
import Head from "next/head";
import { usePlayerContext } from "../context/PlayerContext";

const HomePage = () => {
  const { playerName } = usePlayerContext();

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns similar to Balatro */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
      </div>
      
      {/* Glowing orb effect similar to Balatro */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle at center, rgba(151, 50, 252, 0.7), transparent 70%)",
          filter: "blur(60px)"
        }}>
      </div>
      
      <Head>
        <title>Pyramid.Ninja - The Card Drinking Game</title>
        <meta
          name="description"
          content="A digital version of the popular drinking game Pyramid"
        />
      </Head>

      <div className="max-w-4xl w-full text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-display text-game-neon-yellow tracking-wider mb-6 animate-glow font-display-fallback">
          PYRAMID.NINJA
        </h1>
        
        <div className="w-full max-w-2xl mx-auto h-1 bg-gradient-to-r from-transparent via-game-neon-purple to-transparent mb-6"></div>

        <p className="text-xl text-white mb-12 max-w-xl mx-auto font-game-fallback tracking-wide">
          A DIGITAL VERSION OF THE PYRAMID CARD GAME TO PLAY WITH
          FRIENDS, ONLINE OR IN PERSON!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
          <Link href="/host" className="btn-neon px-10 py-5 bg-game-neon-red rounded-xl shadow-lg font-game-fallback text-white text-xl tracking-wide hover:shadow-neon-red hover:scale-105 transition-all duration-300 flex items-center justify-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            HOST GAME
          </Link>

          <Link href="/join" className="btn-neon px-10 py-5 bg-game-neon-blue rounded-xl shadow-lg font-game-fallback text-white text-xl tracking-wide hover:shadow-neon-blue hover:scale-105 transition-all duration-300 flex items-center justify-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            JOIN GAME
          </Link>
        </div>

        {playerName && (
          <div className="text-white font-game-fallback mt-8 p-3 bg-black bg-opacity-30 rounded-lg inline-block">
            YOU'LL BE JOINING AS: <span className="text-game-neon-green">{playerName}</span>
          </div>
        )}
      </div>

      <div className="mt-12 text-gray-400 text-sm">
        <p>
          &copy; 2025 Pyramid.Ninja -{" "}
          <a
            href="https://github.com/Aloogy/pyramid.ninja"
            className="text-game-neon-purple hover:text-game-neon-yellow transition-colors"
          >
            Open Source on GitHub
          </a>
        </p>
      </div>
      
      {/* Card decorations in corners like Balatro */}
      <div className="absolute bottom-10 right-10 w-32 h-40 rounded-lg bg-game-card opacity-10 transform rotate-12"></div>
      <div className="absolute top-10 left-10 w-32 h-40 rounded-lg bg-game-card opacity-10 transform -rotate-12"></div>
    </div>
  );
};

export default HomePage;
