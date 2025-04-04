// src/components/layout/Header.tsx
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Header: React.FC = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if current route is a game page
  const isGamePage = router.pathname.startsWith("/game/");

  // Toggle mobile menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="bg-game-card shadow-lg py-4 px-6 border-b border-game-neon-purple border-opacity-30">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and title */}
        <Link href="/" className="flex items-center">
          <img
            src="/images/icon.png"
            alt="Pyramid.Ninja logo"
            className="h-8 mr-3"
          />
          <span className="text-white text-xl font-display tracking-wider animate-glow font-display-fallback">
            PYRAMID.NINJA
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {!isGamePage && (
            <>
              <Link
                href="/join"
                className="btn-neon px-6 py-3 text-white bg-game-neon-blue rounded-lg transition-all hover:shadow-neon-blue hover:scale-105 flex items-center font-game-fallback tracking-wide"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
              </Link>

              <Link
                href="/host"
                className="btn-neon px-6 py-3 text-white bg-game-neon-red rounded-lg transition-all hover:shadow-neon-red hover:scale-105 flex items-center font-game-fallback tracking-wide"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
              </Link>

              <Link
                href="/about"
                className="btn-neon px-6 py-3 text-white bg-game-neon-purple rounded-lg transition-all hover:shadow-neon-purple hover:scale-105 flex items-center font-game-fallback tracking-wide"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                ABOUT
              </Link>

              <Link
                href="/privacy"
                className="btn-neon px-6 py-3 text-white bg-game-neon-green rounded-lg transition-all hover:shadow-neon-green hover:scale-105 flex items-center font-game-fallback tracking-wide"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
                PRIVACY
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-white hover:text-game-highlight focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && !isGamePage && (
        <div className="md:hidden pt-4 pb-6 px-4 mt-3 bg-game-card rounded-lg shadow-lg border border-game-neon-purple border-opacity-20">
          <Link
            href="/join"
            className="block px-5 py-3 mb-3 text-white bg-game-neon-blue rounded-lg transition-all font-game-fallback text-center touch-target"
            onClick={() => setMenuOpen(false)}
          >
            JOIN GAME
          </Link>

          <Link
            href="/host"
            className="block px-5 py-3 mb-3 text-white bg-game-neon-red rounded-lg transition-all font-game-fallback text-center touch-target"
            onClick={() => setMenuOpen(false)}
          >
            HOST GAME
          </Link>

          <Link
            href="/about"
            className="block px-5 py-3 mb-3 text-white bg-game-neon-purple rounded-lg transition-all font-game-fallback text-center touch-target"
            onClick={() => setMenuOpen(false)}
          >
            ABOUT
          </Link>

          <Link
            href="/privacy"
            className="block px-5 py-3 text-white bg-game-neon-green rounded-lg transition-all font-game-fallback text-center touch-target"
            onClick={() => setMenuOpen(false)}
          >
            PRIVACY
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;
