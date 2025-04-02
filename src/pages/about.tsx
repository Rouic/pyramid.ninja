// src/pages/about.tsx
import React from "react";
import Link from "next/link";
import Layout from "../components/layout/Layout";

const AboutPage: React.FC = () => {
  return (
    <Layout pageTitle="About">
      <div className="container mx-auto px-4 pt-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              About Pyramid.Ninja
            </h1>
            <h4 className="text-xl text-white">
              Pyramid is an awesome card based drinking game - and this is the
              digital counterpart! It&apos;s still very alpha so enjoy breaking
              it!
            </h4>
          </div>

          <div className="bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <img
                  src="/assets/img/logo.png"
                  alt="Pyramid.Ninja logo"
                  className="h-32"
                />
              </div>

              <h2 className="text-2xl font-bold mb-4">Basic Rules</h2>
              <p className="mb-4">
                First, everyone gets to look at their cards for 10 seconds until
                they are covered again. You should remember <b>just the rank</b>{" "}
                (so suit is irrelevant) of your cards without revealing what you
                have to anyone else. The key is to memorise what you have, and
                in what order, because you won&apos;t be allowed to look at them
                again, unless you get called out on a bluff.
              </p>

              <p className="mb-4">
                Once everyone is set, each card in the pyramid begins to be
                flipped over, one at a time, row by row. After a card is
                flipped, you can assign drinks to other players based on either
                having the card in your hand, or based on a bluff. If assigned a
                drink by another player, you have the option of calling their
                bluff (in which case the player that assigned the drink to you
                has to find that card in their hand in one guess), or drink the
                assigned drinks and continue playing.
              </p>

              <p className="mb-4">
                If a you are called on a bluff and flip a card over, you then
                discard that card and are given a new one in its place. You will
                see this new card for 15 more seconds before it is covered like
                the rest.
              </p>

              <p className="mb-6">
                Each row of the pyramid represents the number of drinks given,
                ranging from the bottom row which begins at one drink, to the
                top which represents five drinks. Also, if a player calls
                someone out on a bluff incorrectly, they drink number doubles.
                If a player calls someone out on a bluff correctly, then the
                bluffer drinks double the drinks instead!
              </p>

              <h2 className="text-2xl font-bold mb-4">
                Pyramid.Ninja Specific Differences
              </h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>
                  There are currently <b>no</b> jokers (normally worth 10 drinks
                  anywhere) in this. (coming soon)
                </li>
                <li>
                  You cannot currently call more than once per round. (coming
                  soon)
                </li>
                <li>
                  The pyramid is statically built but only ever has 5 rows.
                  However you can click any card in any order allowing for
                  <em>reverse pyramid</em>.
                </li>
                <li>
                  The game will only tell you who needs to drink what{" "}
                  <em>per round</em>, so make sure everyone is up to speed
                  before you move on!
                </li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">
                Contributors and special thanks
              </h2>
              <p className="mb-3">
                Check out the{" "}
                <a
                  href="https://github.com/Rouic/pyramid.ninja"
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub page
                </a>{" "}
                for a full list of contributors.
              </p>

              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Special thanks to Will Nield for finding bugs :)</li>
                <li>
                  Special thanks to Nick Roberts for finding bugs and heavily
                  critiquing everything :)
                </li>
              </ul>

              <div className="text-center mt-8">
                <Link
                  href="/"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition duration-300"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
