// src/pages/index.tsx
import React from "react";
import Link from "next/link";
import Layout from "../components/layout/Layout";

const HomePage: React.FC = () => {
  return (
    <Layout pageTitle="Home">
      <div className="container mx-auto px-4 pt-8 pb-20">
        <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img
                src="/assets/img/logo.png"
                alt="Pyramid.Ninja logo"
                className="h-32"
              />
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
              Welcome to the digital version of the drinking game Pyramid
            </h2>

            <p className="text-gray-600 text-center mb-8">
              <strong>
                Requires at least 2 players each with their own device.
              </strong>{" "}
              Every player needs a drink & should be able to see the host screen
              (use Discord, Skype, Zoom etc).
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Join Game Card */}
              <div className="bg-blue-50 rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-500 text-white p-3 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Join Game</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Choose this option to join an existing host&apos;s game.
                  You&apos;ll need their 4-digit code.
                </p>
                <Link href="/join">
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 flex items-center justify-center">
                    Join Game
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </Link>
              </div>

              {/* Host Game Card */}
              <div className="bg-rose-50 rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="bg-rose-500 text-white p-3 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Start as Host
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Choose this option to use this device as the host. Everyone
                  should be able to see this screen.
                </p>
                <Link href="/host">
                  <button className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 flex items-center justify-center">
                    Host Game
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
