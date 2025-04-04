import React from "react";
import Link from "next/link";
import Head from "next/head";
import { usePlayerContext } from "../context/PlayerContext";

const HomePage = () => {
  const { playerName } = usePlayerContext();

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-between px-4 sm:px-8 py-4 sm:py-8 relative overflow-hidden">
      {/* Background patterns similar to Balatro */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Glowing orb effect similar to Balatro */}
      <div
        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, rgba(252, 50, 151, 0.7), transparent 70%)",
          filter: "blur(100px)",
        }}
      ></div>

      <Head>
        <title>Pyramid.Ninja - The Card Drinking Game</title>
        <meta
          name="description"
          content="A digital version of the popular drinking game Pyramid. Play online with friends, perfect for parties!"
        />
        
        {/* Additional page-specific SEO */}
        <meta property="og:image" content="https://pyramid.ninja/images/pyramid.ninja.background.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Pyramid.Ninja",
              "url": "https://pyramid.ninja",
              "description": "A digital version of the popular drinking game Pyramid. Play online with friends!",
              "applicationCategory": "GameApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Person",
                "name": "Pyramid.Ninja Developer"
              }
            })
          }}
        />
      </Head>

      {/* Navigation */}
      <div className="w-full flex justify-end px-3 sm:px-8 pt-4 sm:pt-8 relative z-20">
        <div className="flex space-x-2 sm:space-x-4">
          <Link
            href="/about"
            className="px-3 sm:px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-yellow/30 text-game-neon-yellow font-game-fallback text-xs sm:text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-yellow-sm"
          >
            ABOUT
          </Link>
          <Link
            href="#"
            className="px-3 sm:px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-blue/30 text-game-neon-blue font-game-fallback text-xs sm:text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-blue-sm"
          >
            PRIVACY
          </Link>
        </div>
      </div>

      {/* Main content - positioned in the center */}
      <div className="max-w-5xl w-full mx-auto text-center relative z-10 flex flex-col items-center py-4 sm:py-8">
        <div className="flex flex-col items-center w-full px-1">
          <div className="w-28 h-28 sm:w-40 sm:h-40 mb-2 sm:mb-4 animate-float-slow">
            <img
              src="/icon.png"
              alt="Pyramid Ninja Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[25px] xxs:text-3xl xs:text-3xl sm:text-4xl md:text-5xl xl:text-7xl font-display text-game-neon-yellow tracking-tight xs:tracking-normal sm:tracking-wider mb-0 animate-glow font-display-fallback w-full px-2">
            PYRAMID.NINJA
          </h1>
        </div>

        <div className="w-full max-w-3xl mx-auto h-1.5 bg-gradient-to-r from-transparent via-game-neon-red to-transparent mb-2 mt-2"></div>

        <p className="text-lg sm:text-2xl md:text-3xl text-white mb-6 sm:mb-12 max-w-3xl mx-auto font-game-fallback tracking-wide text-center w-full leading-relaxed px-6 sm:px-0">
          A DIGITAL VERSION OF THE PYRAMID CARD GAME TO PLAY WITH FRIENDS,
          ONLINE OR IN PERSON!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-3xl mx-auto mb-6 w-full px-4 sm:px-8">
          {/* Balatro-style Host button */}
          <Link href="/host" className="relative group">
            <div className="absolute inset-0 bg-game-neon-red/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 animate-pulse-slow"></div>
            <div className="relative btn-neon px-6 sm:px-8 py-4 sm:py-6 h-full bg-black rounded-xl font-game-fallback text-game-neon-red text-xl sm:text-2xl tracking-wide group-hover:scale-105 transition-all duration-300 flex items-center justify-center border-2 border-game-neon-red shadow-neon-red-sm group-hover:shadow-neon-red-lg overflow-hidden transform -rotate-1">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-game-neon-red to-transparent opacity-50"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-8 sm:w-8 mr-3 group-hover:animate-pulse"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              HOST GAME
            </div>
          </Link>

          {/* Balatro-style Join button */}
          <Link href="/join" className="relative group">
            <div className="absolute inset-0 bg-game-neon-blue/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 animate-pulse-slow"></div>
            <div className="relative btn-neon px-6 sm:px-8 py-4 sm:py-6 h-full bg-black rounded-xl font-game-fallback text-game-neon-blue text-xl sm:text-2xl tracking-wide group-hover:scale-105 transition-all duration-300 flex items-center justify-center border-2 border-game-neon-blue shadow-neon-blue-sm group-hover:shadow-neon-blue-lg overflow-hidden transform rotate-1">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-game-neon-blue to-transparent opacity-50"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-8 sm:w-8 mr-3 group-hover:animate-pulse"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              JOIN GAME
            </div>
          </Link>
        </div>

        {playerName && (
          <div className="m-2 text-white font-game-fallback p-3 sm:p-4 bg-black/50 backdrop-blur-sm rounded-xl inline-block text-base sm:text-xl border border-game-neon-green/50 shadow-neon-green-sm transform -rotate-1">
            YOU'LL BE JOINING AS:{" "}
            <span className="text-game-neon-green animate-pulse-slow">
              {playerName}
            </span>
          </div>
        )}
      </div>

      {/* Footer - at the bottom */}
      <div className="w-full text-center text-gray-400 text-xs sm:text-base py-4">
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

      {/* Card decorations in corners like Balatro - hide some on mobile */}
      <div className="absolute bottom-24 right-24 w-40 h-56 rounded-lg bg-game-card opacity-10 transform rotate-12 hidden sm:block"></div>
      <div className="absolute top-24 left-24 w-40 h-56 rounded-lg bg-game-card opacity-10 transform -rotate-12 hidden sm:block"></div>
      <div className="absolute bottom-48 left-48 w-32 h-44 rounded-lg bg-game-card opacity-10 transform rotate-45 hidden md:block"></div>
      <div className="absolute top-48 right-48 w-32 h-44 rounded-lg bg-game-card opacity-10 transform -rotate-45 hidden md:block"></div>
    </div>
  );
};

export default HomePage;
