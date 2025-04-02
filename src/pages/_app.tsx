import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PlayerProvider } from "../context/PlayerContext";

function MyApp({ Component, pageProps }: AppProps) {
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
      </Head>
      <Component {...pageProps} />
    </PlayerProvider>
  );
}

export default MyApp;
