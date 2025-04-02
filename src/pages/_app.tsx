// src/pages/_app.tsx
import React, { useState, useEffect } from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "../contexts/AuthContext";
import { GameProvider } from "../contexts/GameContext";
import "../styles/globals.css";


function MyApp({ Component, pageProps }: AppProps) {
  const [randomBackground, setRandomBackground] = useState(1);

  // Set random background on initial load
  useEffect(() => {
    setRandomBackground(Math.floor(Math.random() * 10) + 1);
  }, []);

  return (
    <>
      <Head>
        <title>Pyramid.Ninja - Online version of the drinking card game</title>
        <meta
          name="description"
          content="The digital, online version of the drinking game 'pyramid'. Requires 2+ players each with an internet connected device."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=6.0, user-scalable=0"
        />
        <meta name="theme-color" content="#e91e63" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pyramid.ninja/" />
        <meta
          property="og:title"
          content="Pyramid.Ninja - Online version of the drinking card game."
        />
        <meta
          property="og:description"
          content="The digital, online version of the drinking game 'pyramid'. Requires 2+ players each with an internet connected device."
        />
        <meta
          property="og:image"
          content="https://pyramid.ninja/imgages/pyramid.ninja.background.png"
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://pyramid.ninja/" />
        <meta
          property="twitter:title"
          content="Pyramid.Ninja - Online version of the drinking card game."
        />
        <meta
          property="twitter:description"
          content="The digital, online version of the drinking game 'pyramid'. Requires 2+ players each with an internet connected device."
        />
        <meta
          property="twitter:image"
          content="https://pyramid.ninja/imgages/pyramid.ninja.background.png"
        />

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/images/icon.png" />
      </Head>

      <AuthProvider>
        <GameProvider>
          <div
            className="min-h-screen bg-cover bg-center flex flex-col"
            style={{
              backgroundImage: `url('/images/${randomBackground}.jpg')`,
            }}
          >
            <Component {...pageProps} />
          </div>
        </GameProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp;
