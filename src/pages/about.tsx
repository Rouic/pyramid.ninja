import React from "react";
import Link from "next/link";
import Head from "next/head";
import Footer from "@/components/layout/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-between py-4 sm:py-7 px-4 sm:px-8 relative overflow-hidden">
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
        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(252, 50, 151, 0.7), transparent 70%)",
          filter: "blur(100px)",
        }}
      ></div>

      <Head>
        <title>About Pyramid.Ninja - The Card Drinking Game</title>
        <meta
          name="description"
          content="Learn about the Pyramid card drinking game and how to play it"
        />
      </Head>

      {/* Navigation */}
      <div className="w-full flex justify-between items-center px-2 sm:px-8 relative z-20">
        <Link href="/" className="flex items-center group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-300">
            <img
              src="/icon.png"
              alt="Pyramid Ninja Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-game-fallback text-game-neon-yellow text-base sm:text-xl group-hover:text-game-neon-red transition-colors duration-300">
            PYRAMID.NINJA
          </span>
        </Link>
        <div className="flex space-x-2 sm:space-x-4">
          <Link
            href="/"
            className="px-2 sm:px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-green/30 text-game-neon-green font-game-fallback text-xs sm:text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-green-sm"
          >
            HOME
          </Link>
          <Link
            href="/privacy"
            className="px-2 sm:px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-blue/30 text-game-neon-blue font-game-fallback text-xs sm:text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-blue-sm"
          >
            PRIVACY
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center py-6 sm:py-16">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 sm:mb-16 px-4">
          <h1 className="text-xl sm:text-5xl lg:text-6xl font-display text-game-neon-red tracking-wider mb-4 sm:mb-8 animate-glow font-display-fallback text-center">
            ABOUT PYRAMID.NINJA
          </h1>
          <div className="w-full max-w-3xl mx-auto h-1 bg-gradient-to-r from-transparent via-game-neon-red to-transparent mb-4 sm:mb-8"></div>
          <h2 className="text-lg sm:text-xl md:text-2xl text-white max-w-3xl mx-auto font-game-fallback tracking-wide text-center w-full">
            PYRAMID IS A MEMORY-BASED DRINKING CARD GAME WITH BLUFFING MECHANICS
          </h2>
        </div>

        {/* Game Overview section */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-yellow/20 mb-6 sm:mb-10 transform -rotate-0.5 shadow-neon-yellow-sm mx-4 sm:mx-auto">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-12 sm:h-12 mr-3 sm:mr-4 rotate-12 flex-shrink-0">
              <img
                src="/icon.png"
                alt="Pyramid Ninja Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl sm:text-2xl text-game-neon-yellow font-game-fallback">
              GAME OVERVIEW
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4 text-white">
            <p className="text-base sm:text-lg">
              Pyramid is a memory-based drinking card game featuring bluffing
              mechanics. Players receive hidden cards they must memorize, then
              strategically assign drinks or challenge opponents during rounds
              based on pyramid card reveals.
            </p>
          </div>
        </div>

        {/* Setup section */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-blue/20 mb-6 sm:mb-10 transform rotate-0.5 shadow-neon-blue-sm mx-4 sm:mx-auto">
          <h3 className="text-xl sm:text-2xl text-game-neon-blue font-game-fallback mb-4 sm:mb-6">
            SETUP
          </h3>

          <ol className="space-y-3 sm:space-y-4 text-white list-decimal pl-5 sm:pl-8">
            <li className="text-base sm:text-lg">
              Create a 15-card face-down pyramid (5 rows: 5-4-3-2-1)
            </li>
            <li className="text-base sm:text-lg">
              Deal 4 cards face-down to each player
            </li>
            <li className="text-base sm:text-lg">
              Allow each player 10 seconds to memorize their cards before hiding
              them again
            </li>
            <li className="text-base sm:text-lg">
              Players may reorder their own cards during memorization to aid
              recall
            </li>
          </ol>

          <div className="mt-6 bg-black/40 p-4 rounded-lg border border-white/10">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-game-neon-blue/20 rounded-full flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-game-neon-blue"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-game-neon-blue font-game-fallback text-sm sm:text-base">
                PRO TIP
              </span>
            </div>
            <p className="text-sm sm:text-base text-white">
              Try to remember both your card values and their positions.
              Creating a mental pattern or story can help you memorize them more
              effectively!
            </p>
          </div>
        </div>

        {/* Core Gameplay Loop section */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-green/20 mb-6 sm:mb-10 transform -rotate-0.5 shadow-neon-green-sm mx-4 sm:mx-auto">
          <h3 className="text-xl sm:text-2xl text-game-neon-green font-game-fallback mb-4 sm:mb-6">
            GAMEPLAY
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-game-fallback text-white mb-2 border-b border-white/20 pb-1">
                ROUND STRUCTURE
              </h4>
              <ol className="space-y-2 text-white list-decimal pl-5 sm:pl-8">
                <li className="text-base sm:text-lg">
                  Host reveals one pyramid card to begin each round
                </li>
                <li className="text-base sm:text-lg">
                  Players may assign drinks based on matching cards or bluff
                </li>
                <li className="text-base sm:text-lg">
                  Recipients may accept or challenge assignments
                </li>
                <li className="text-base sm:text-lg">
                  After all assignments are resolved, host reveals the next
                  pyramid card
                </li>
                <li className="text-base sm:text-lg">
                  Game ends when all pyramid cards are revealed
                </li>
              </ol>
            </div>

            <div>
              <h4 className="text-lg font-game-fallback text-white mb-2 border-b border-white/20 pb-1">
                DRINK VALUES
              </h4>
              <ul className="space-y-2 text-white list-disc pl-5 sm:pl-8">
                <li className="text-base sm:text-lg">
                  Row 1 (bottom): 1 drink
                </li>
                <li className="text-base sm:text-lg">Row 2: 2 drinks</li>
                <li className="text-base sm:text-lg">Row 3: 3 drinks</li>
                <li className="text-base sm:text-lg">Row 4: 4 drinks</li>
                <li className="text-base sm:text-lg">Row 5 (top): 5 drinks</li>
                <li className="text-base sm:text-lg text-game-neon-yellow">
                  Failed or successful challenges: Double the row value (e.g.,
                  10 drinks for row 5)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Assignment Mechanism section */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-red/20 mb-6 sm:mb-10 transform rotate-0.5 shadow-neon-red-sm mx-4 sm:mx-auto">
          <h3 className="text-xl sm:text-2xl text-game-neon-red font-game-fallback mb-4 sm:mb-6">
            ASSIGNMENTS & CHALLENGES
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-game-fallback text-white mb-2 border-b border-white/20 pb-1">
                ASSIGNMENT MECHANISM
              </h4>
              <ol className="space-y-2 text-white list-decimal pl-5 sm:pl-8">
                <li className="text-base sm:text-lg">
                  When assigning, player indicates a target player (implicitly
                  claiming to have a matching card)
                </li>
                <li className="text-base sm:text-lg">
                  Target player must either:
                  <ul className="pl-5 space-y-1 mt-1">
                    <li className="text-base sm:text-lg">
                      <span className="text-game-neon-green">Accept:</span>{" "}
                      Consume assigned drinks based on current row value
                    </li>
                    <li className="text-base sm:text-lg">
                      <span className="text-game-neon-purple">Challenge:</span>{" "}
                      Force assigner to reveal one of their cards
                    </li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h4 className="text-lg font-game-fallback text-white mb-2 border-b border-white/20 pb-1">
                CHALLENGE RESOLUTION
              </h4>
              <ol className="space-y-2 text-white list-decimal pl-5 sm:pl-8">
                <li className="text-base sm:text-lg">
                  Assigner selects and reveals one of their hidden cards
                </li>
                <li className="text-base sm:text-lg">
                  If revealed card matches pyramid card:
                  <ul className="pl-5 space-y-1 mt-1">
                    <li className="text-base sm:text-lg">
                      Challenger drinks double the current row value
                    </li>
                    <li className="text-base sm:text-lg">
                      Assigner receives a replacement card (15-second viewing)
                    </li>
                  </ul>
                </li>
                <li className="text-base sm:text-lg">
                  If revealed card does not match:
                  <ul className="pl-5 space-y-1 mt-1">
                    <li className="text-base sm:text-lg">
                      Assigner drinks double the current row value
                    </li>
                    <li className="text-base sm:text-lg">
                      Assigner receives a replacement card (15-second viewing)
                    </li>
                  </ul>
                </li>
                <li className="text-base sm:text-lg">
                  All new cards receive 15 seconds of viewing time before being
                  hidden
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Edge Cases section */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-purple/20 mb-6 sm:mb-10 transform -rotate-0.5 shadow-neon-purple-sm mx-4 sm:mx-auto">
          <h3 className="text-xl sm:text-2xl text-game-neon-purple font-game-fallback mb-4 sm:mb-6">
            EDGE CASES
          </h3>

          <ol className="space-y-3 sm:space-y-4 text-white list-decimal pl-5 sm:pl-8">
            <li className="text-base sm:text-lg">
              <span className="text-game-neon-purple font-bold">
                Deck Depletion:
              </span>{" "}
              When replacement cards are no longer available, players continue
              with fewer than 4 cards
            </li>
            <li className="text-base sm:text-lg">
              <span className="text-game-neon-purple font-bold">
                Multiple Assignments:
              </span>{" "}
              Process each assignment sequentially until all are resolved
            </li>
            <li className="text-base sm:text-lg">
              <span className="text-game-neon-purple font-bold">
                Round Transition:
              </span>{" "}
              Any unresolved challenges from previous round are canceled when a
              new card is revealed
            </li>
            <li className="text-base sm:text-lg">
              <span className="text-game-neon-purple font-bold">Game End:</span>{" "}
              Reveal all players&apos; remaining cards after the final pyramid
              card is processed
            </li>
          </ol>
        </div>

        {/* Pyramid.Ninja Specific Differences */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-blue/20 mb-6 sm:mb-16 transform rotate-0.5 shadow-neon-blue-sm mx-4 sm:mx-auto">
          <h3 className="text-xl sm:text-2xl text-game-neon-blue font-game-fallback mb-4 sm:mb-6">
            PYRAMID.NINJA SPECIFIC DIFFERENCES
          </h3>

          <ul className="space-y-3 sm:space-y-4 text-white list-disc pl-5 sm:pl-6">
            <li className="text-base sm:text-lg">
              There are currently{" "}
              <span className="text-game-neon-red font-bold">no</span> jokers
              (normally worth 10 drinks anywhere) in this. (coming soon)
            </li>
            <li className="text-base sm:text-lg">
              The pyramid is statically built but only ever has 5 rows. However
              you can click any card in any order allowing for &quot;reverse
              pyramid&quot;.
            </li>
            <li className="text-base sm:text-lg">
              The game will only tell you who needs to drink what{" "}
              <em>per round</em>, so make sure everyone is up to speed before
              you move on!
            </li>
          </ul>
        </div>

        {/* Contributors */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-4 sm:p-10 rounded-xl border border-game-neon-green/20 mb-6 sm:mb-8 transform -rotate-0.5 shadow-neon-green-sm mx-4 sm:mx-auto">
          <h3 className="text-xl sm:text-2xl text-game-neon-green font-game-fallback mb-4 sm:mb-6">
            CONTRIBUTORS AND SPECIAL THANKS
          </h3>

          <p className="text-base sm:text-lg text-white mb-3 sm:mb-4">
            Check out the{" "}
            <a
              href="https://github.com/Rouic/pyramid.ninja"
              rel="noreferrer"
              target="_blank"
              className="text-game-neon-yellow underline hover:text-game-neon-green transition-colors"
            >
              GitHub page
            </a>{" "}
            for a full list of contributors.
          </p>

          <ul className="space-y-2 text-white list-disc pl-5 sm:pl-6">
            <li className="text-base sm:text-lg">
              Written, refactored and fiddled with over the years by Alex Cottenham (@Rouic)
            </li>
            <li className="text-base sm:text-lg">
              Special thanks to Will Nield for finding bugs :)
            </li>
            <li className="text-base sm:text-lg">
              Special thanks to Nick Roberts for finding bugs and heavily
              critiquing everything :)
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Card decorations in corners like Balatro - hide on mobile */}
      <div className="absolute bottom-24 right-24 w-52 h-72 rounded-lg bg-game-card opacity-10 transform rotate-12 hidden sm:block"></div>
      <div className="absolute top-24 left-24 w-52 h-72 rounded-lg bg-game-card opacity-10 transform -rotate-12 hidden sm:block"></div>
    </div>
  );
};

export default AboutPage;
