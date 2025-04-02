import React from "react";
import Link from "next/link";
import Head from "next/head";
import { usePlayerContext } from "../context/PlayerContext";

const HomePage = () => {
  const { playerName } = usePlayerContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Pyramid.Ninja - The Card Drinking Game</title>
        <meta
          name="description"
          content="A digital version of the popular drinking game Pyramid"
        />
      </Head>

      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-8">
          Pyramid.Ninja
        </h1>

        <p className="text-xl text-white mb-12 max-w-xl mx-auto">
          A digital version of the popular pyramid card game to play with
          friends, online or in person!
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/host" className="px-8 py-4 bg-white text-purple-600 rounded-lg shadow-lg font-bold text-lg hover:bg-gray-100 transition duration-150 ease-in-out">
              Host Game
          </Link>

          <Link href="/join" className="px-8 py-4 bg-purple-700 text-white rounded-lg shadow-lg font-bold text-lg hover:bg-purple-800 transition duration-150 ease-in-out">
              Join Game
          </Link>
        </div>

        {playerName && (
          <div className="mt-8 text-white">
            You'll be joining as:{" "}
            <span className="font-semibold">{playerName}</span>
          </div>
        )}
      </div>

      <div className="mt-12 text-white text-sm">
        <p>
          &copy; 2025 Pyramid.Ninja -{" "}
          <a
            href="https://github.com/Aloogy/pyramid.ninja"
            className="underline"
          >
            Open Source on GitHub
          </a>
        </p>
      </div>
    </div>
  );
};

export default HomePage;
