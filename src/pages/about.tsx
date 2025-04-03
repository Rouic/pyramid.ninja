import React from "react";
import Link from "next/link";
import Head from "next/head";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-between py-7 px-8 relative overflow-hidden">
      {/* Background patterns similar to Balatro */}
      <div className="absolute inset-0" 
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}>
      </div>
      
      {/* Glowing orb effect similar to Balatro */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle at center, rgba(252, 50, 151, 0.7), transparent 70%)",
          filter: "blur(100px)"
        }}>
      </div>
      
      <Head>
        <title>About Pyramid.Ninja - The Card Drinking Game</title>
        <meta
          name="description"
          content="Learn about the Pyramid card drinking game and how to play it"
        />
      </Head>

      {/* Navigation */}
      <div className="w-full flex justify-between items-center px-8 relative z-20">
        <Link href="/" className="flex items-center group">
          <div className="w-10 h-10 mr-3 group-hover:scale-110 transition-transform duration-300">
            <img src="/icon.png" alt="Pyramid Ninja Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-game-fallback text-game-neon-yellow text-xl group-hover:text-game-neon-red transition-colors duration-300">PYRAMID.NINJA</span>
        </Link>
        <div className="flex space-x-4">
          <Link href="/" className="px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-green/30 text-game-neon-green font-game-fallback text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-green-sm">
            HOME
          </Link>
          <Link href="#" className="px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-blue/30 text-game-neon-blue font-game-fallback text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-blue-sm">
            PRIVACY
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center py-16">
        {/* Header */}
        <div className="flex flex-col items-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display text-game-neon-red tracking-wider mb-8 animate-glow font-display-fallback">
            ABOUT PYRAMID.NINJA
          </h1>
          <div className="w-full max-w-3xl mx-auto h-1 bg-gradient-to-r from-transparent via-game-neon-red to-transparent mb-8"></div>
          <h2 className="text-xl md:text-2xl text-white max-w-3xl mx-auto font-game-fallback tracking-wide text-center w-full">
            PYRAMID IS AN AWESOME CARD BASED DRINKING GAME - AND THIS IS THE DIGITAL COUNTERPART!
          </h2>
        </div>
        
        {/* Game rules section */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-10 rounded-xl border border-game-neon-yellow/20 mb-16 transform -rotate-0.5 shadow-neon-yellow-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 mr-4 rotate-12">
              <img src="/icon.png" alt="Pyramid Ninja Logo" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-2xl text-game-neon-yellow font-game-fallback">BASIC RULES</h3>
          </div>
          
          <div className="space-y-4 text-white">
            <p className="text-lg">
              First, everyone gets to look at their cards for 10 seconds until they are covered again. You should remember <span className="text-game-neon-green font-bold">just the rank</span> (so suit is irrelevant) of your cards without revealing what you have to anyone else. The key is to memorise what you have, and in what order, because you won't be allowed to look at them again, unless you get called out on a bluff.
            </p>
            
            <p className="text-lg">
              Once everyone is set, each card in the pyramid begins to be flipped over, one at a time, row by row. After a card is flipped, you can assign drinks to other players based on either having the card in your hand, or based on a bluff. If assigned a drink by another player, you have the option of calling their bluff (in which case the player that assigned the drink to you has to find that card in their hand in one guess), or drink the assigned drinks and continue playing.
            </p>
            
            <p className="text-lg">
              If you are called on a bluff and flip a card over, you then discard that card and are given a new one in its place. You will see this new card for 15 more seconds before it is covered like the rest.
            </p>
            
            <p className="text-lg">
              Each row of the pyramid represents the number of drinks given, ranging from the bottom row which begins at one drink, to the top which represents five drinks. Also, if a player calls someone out on a bluff incorrectly, they drink number doubles. If a player calls someone out on a bluff correctly, then the bluffer drinks double the drinks instead!
            </p>
          </div>
        </div>
        
        {/* Pyramid.Ninja differences */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-10 rounded-xl border border-game-neon-blue/20 mb-16 transform rotate-0.5 shadow-neon-blue-sm">
          <h3 className="text-2xl text-game-neon-blue font-game-fallback mb-6">PYRAMID.NINJA SPECIFIC DIFFERENCES</h3>
          
          <ul className="space-y-4 text-white list-disc pl-6">
            <li className="text-lg">
              There are currently <span className="text-game-neon-red font-bold">no</span> jokers (normally worth 10 drinks anywhere) in this. (coming soon)
            </li>
            <li className="text-lg">
              You cannot currently call more than once per round. (coming soon)
            </li>
            <li className="text-lg">
              The pyramid is statically built but only ever has 5 rows. However you can click any card in any order allowing for "reverse pyramid".
            </li>
            <li className="text-lg">
              The game will only tell you who needs to drink what <em>per round</em>, so make sure everyone is up to speed before you move on!
            </li>
          </ul>
        </div>
        
        {/* Contributors */}
        <div className="w-full max-w-4xl bg-black/30 backdrop-blur-sm p-10 rounded-xl border border-game-neon-green/20 mb-8 transform -rotate-0.5 shadow-neon-green-sm">
          <h3 className="text-2xl text-game-neon-green font-game-fallback mb-6">CONTRIBUTORS AND SPECIAL THANKS</h3>
          
          <p className="text-lg text-white mb-4">
            Check out the <a href="https://github.com/Rouic/pyramid.ninja" rel="noreferrer" target="_blank" className="text-game-neon-yellow underline hover:text-game-neon-green transition-colors">GitHub page</a> for a full list of contributors.
          </p>
          
          <ul className="space-y-2 text-white list-disc pl-6">
            <li className="text-lg">
              Special thanks to Will Nield for finding bugs :)
            </li>
            <li className="text-lg">
              Special thanks to Nick Roberts for finding bugs and heavily critiquing everything :)
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center text-gray-400 text-base pb-8">
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
      <div className="absolute bottom-24 right-24 w-52 h-72 rounded-lg bg-game-card opacity-10 transform rotate-12"></div>
      <div className="absolute top-24 left-24 w-52 h-72 rounded-lg bg-game-card opacity-10 transform -rotate-12"></div>
    </div>
  );
};

export default AboutPage;