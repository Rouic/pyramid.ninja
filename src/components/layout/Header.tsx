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
    <nav className="bg-gray-900 bg-opacity-55 py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and title */}
        <Link href="/" className="flex items-center">
          <img
            src="/assets/img/icon.png"
            alt="Pyramid.Ninja logo"
            className="h-8 mr-2"
          />
          <span className="text-white text-xl font-bold">Pyramid.Ninja</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {!isGamePage && (
            <>
              <Link
                href="/join"
                className="px-4 py-2 text-white hover:bg-gray-700 hover:bg-opacity-70 rounded transition duration-200 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Join Game
              </Link>

              <Link
                href="/host"
                className="px-4 py-2 text-white hover:bg-gray-700 hover:bg-opacity-70 rounded transition duration-200 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Host Game
              </Link>

              <Link
                href="/about"
                className="px-4 py-2 text-white hover:bg-gray-700 hover:bg-opacity-70 rounded transition duration-200 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                About
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        <div className="md:hidden pt-2 pb-4 px-4">
          <Link
            href="/join"
            className="block px-4 py-2 text-white hover:bg-gray-700 hover:bg-opacity-70 rounded transition duration-200"
            onClick={() => setMenuOpen(false)}
          >
            Join Game
          </Link>

          <Link
            href="/host"
            className="block px-4 py-2 text-white hover:bg-gray-700 hover:bg-opacity-70 rounded transition duration-200"
            onClick={() => setMenuOpen(false)}
          >
            Host Game
          </Link>

          <Link
            href="/about"
            className="block px-4 py-2 text-white hover:bg-gray-700 hover:bg-opacity-70 rounded transition duration-200"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;
