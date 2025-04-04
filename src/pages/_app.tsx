import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PlayerProvider } from "../context/PlayerContext";
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps) {
  // Load fonts
  useEffect(() => {
    // Load Oswald font for game-style text
    const linkOswald = document.createElement('link');
    linkOswald.rel = 'stylesheet';
    linkOswald.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&display=swap';
    document.head.appendChild(linkOswald);
    
    // Load Press Start 2P for title/display text
    const linkPressStart = document.createElement('link');
    linkPressStart.rel = 'stylesheet';
    linkPressStart.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(linkPressStart);
    
    return () => {
      document.head.removeChild(linkOswald);
      document.head.removeChild(linkPressStart);
    };
  }, []);
  
  return (
    <PlayerProvider>
      <Head>
        <title>Pyramid.Ninja - Card Drinking Game</title>
        <meta
          name="description"
          content="A digital version of the popular drinking game Pyramid"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" />
        {/* Preload fonts */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&display=swap" 
          as="style" 
        />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" 
          as="style" 
        />
      </Head>
      <Component {...pageProps} />
    </PlayerProvider>
  );
}

export default MyApp;
