// src/components/layout/Footer.tsx
import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {

  // App version from environment or default
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v3.0.0";

  return (
    <footer className="py-4 px-6 mt-auto z-30 rounded-lg">
      <div className="container mx-auto">
        <div className="flex flex-col justify-between items-center">
          {/* Footer links */}
          <nav className="mb-4 md:mb-0">
            <ul className="flex flex-wrap gap-4 justify-center md:justify-start font-game-fallback">
              <li>
                <Link
                  href="/about"
                  className="text-white/40 hover:text-white transition duration-200"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/40 hover:text-white transition duration-200"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/join"
                  className="text-white/40 hover:text-white transition duration-200"
                >
                  Join Game
                </Link>
              </li>
              <li>
                <Link
                  href="/host"
                  className="text-white/40 hover:text-white transition duration-200"
                >
                  Host Game
                </Link>
              </li>
            </ul>
          </nav>

          {/* Copyright */}
          <Link
            href="https://github.com/Rouic/pyramid.ninja"
            target="_blank"
            rel="noreferrer"
            className=" text-xs mt-4 text-game-neon-yellow/50 font-display-fallback hover:text-game-neon-yellow transition duration-200"
          >
            v{appVersion}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
