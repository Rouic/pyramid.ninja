import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PlayerProvider } from "../context/PlayerContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ConsentProvider } from "../contexts/ConsentContext";
import { AuthProvider } from "../contexts/AuthContext";
import CookieConsentBanner from "../components/CookieConsentBanner";
import AnalyticsWrapper from "../components/AnalyticsWrapper";
import { initializeFirebase } from "../lib/firebase/firebase";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const canonicalUrl = `https://pyramid.ninja${router.asPath === "/" ? "" : router.asPath}`;
  
  // Initialize Firebase
  useEffect(() => {
    // Initialize Firebase before anything else
    initializeFirebase(true, false);
    console.log("Firebase initialized in _app.tsx");
  }, []);
  
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
    <ConsentProvider>
      <AuthProvider>
        <PlayerProvider>
          <Head>
            {/* Primary Meta Tags */}
          <title>Pyramid.Ninja - The Digital Card Drinking Game</title>
          <meta
            name="description"
            content="Play the Pyramid card drinking game online with friends. Host or join a game, perfect for parties and social gatherings!"
          />
          <meta name="keywords" content="pyramid game, drinking game, card game, online game, party game, social game, virtual drinking game" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          
          {/* Canonical URL */}
          <link rel="canonical" href={canonicalUrl} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:title" content="Pyramid.Ninja - The Digital Card Drinking Game" />
          <meta property="og:description" content="Play the Pyramid card drinking game online with friends. Host or join a game, perfect for parties and social gatherings!" />
          <meta property="og:image" content="https://pyramid.ninja/images/social-cover.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:site_name" content="Pyramid.Ninja" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={canonicalUrl} />
          <meta property="twitter:title" content="Pyramid.Ninja - The Digital Card Drinking Game" />
          <meta property="twitter:description" content="Play the Pyramid card drinking game online with friends. Host or join a game, perfect for parties and social gatherings!" />
          <meta property="twitter:image" content="https://pyramid.ninja/images/social-cover.png" />
          
          {/* Favicon and icons */}
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
          <AnalyticsWrapper />
          <CookieConsentBanner />
        </PlayerProvider>
      </AuthProvider>
    </ConsentProvider>
  );
}

export default MyApp;
