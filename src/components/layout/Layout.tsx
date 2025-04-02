// src/components/layout/Layout.tsx
import React, { ReactNode } from "react";
import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle = "" }) => {
  const fullTitle = pageTitle
    ? `Pyramid.Ninja | ${pageTitle}`
    : "Pyramid.Ninja - Online version of the drinking card game";

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">{children}</main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
