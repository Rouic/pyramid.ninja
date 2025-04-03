// src/components/layout/Layout.tsx
import React, { ReactNode } from "react";
import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
  isGameLayout?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  pageTitle = "",
  isGameLayout = false
}) => {
  const fullTitle = pageTitle
    ? `Pyramid.Ninja | ${pageTitle}`
    : "Pyramid.Ninja - Online version of the drinking card game";

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className={`flex flex-col min-h-screen ${isGameLayout ? 'bg-game-bg' : 'bg-gradient-to-b from-game-bg to-game-card'}`}>
        <Header />

        <main className={`flex-grow ${isGameLayout ? 'px-0' : 'px-4 md:px-6'}`}>
          {children}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
