// src/components/layout/Footer.tsx
import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {

  // App version from environment or default
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "v2.1.0";

  return (
    <footer className="bg-gray-900 bg-opacity-55 py-4 px-6 mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Footer links */}
          <nav className="mb-4 md:mb-0">
            <ul className="flex flex-wrap gap-4 justify-center md:justify-start">
              <li>
                <Link
                  href="/about"
                  className="text-white hover:text-gray-300 transition duration-200"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://www.iubenda.com/privacy-policy/71074056"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white hover:text-gray-300 transition duration-200"
                >
                  Privacy
                </a>
              </li>
              <li>
                <Link
                  href="/join"
                  className="text-white hover:text-gray-300 transition duration-200"
                >
                  Join Game
                </Link>
              </li>
              <li>
                <Link
                  href="/host"
                  className="text-white hover:text-gray-300 transition duration-200"
                >
                  Host Game
                </Link>
              </li>
            </ul>
          </nav>

          {/* Copyright */}
          <div className="text-white text-sm">
            {appVersion} made with
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 inline mx-1 text-rose-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            by{" "}
            <a
              href="https://www.rouic.com"
              target="_blank"
              rel="noreferrer"
              className="text-rose-500 hover:text-rose-400 transition duration-200"
            >
              Rouic
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
