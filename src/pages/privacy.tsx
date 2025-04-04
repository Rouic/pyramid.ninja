// src/pages/privacy.tsx
import React from "react";
import Link from "next/link";
import Head from "next/head";
import Footer from "@/components/layout/Footer";

const PrivacyPage = () => {
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
            "radial-gradient(circle at center, rgba(153, 50, 252, 0.7), transparent 70%)",
          filter: "blur(100px)",
        }}
      ></div>

      <Head>
        <title>Privacy Policy - Pyramid.Ninja</title>
        <meta
          name="description"
          content="Privacy policy for Pyramid.Ninja, the digital card drinking game"
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
            href="/about"
            className="px-2 sm:px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-green/30 text-game-neon-green font-game-fallback text-xs sm:text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-green-sm"
          >
            ABOUT
          </Link>
          <Link
            href="/"
            className="px-2 sm:px-6 py-2 bg-black/30 backdrop-blur-sm rounded-full border border-game-neon-blue/30 text-game-neon-blue font-game-fallback text-xs sm:text-sm hover:bg-black/50 hover:scale-105 transition-all duration-300 shadow-neon-blue-sm"
          >
            HOME
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center py-6 sm:py-16">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 sm:mb-16 px-4">
          <h1 className="text-xl sm:text-5xl lg:text-6xl font-display text-game-neon-blue tracking-wider mb-4 sm:mb-8 animate-glow font-display-fallback text-center">
            PRIVACY POLICY
          </h1>
          <div className="w-full max-w-3xl mx-auto h-1 bg-gradient-to-r from-transparent via-game-neon-blue to-transparent mb-4 sm:mb-8"></div>
          <h2 className="text-lg sm:text-xl md:text-2xl text-white max-w-3xl mx-auto font-game-fallback tracking-wide text-center w-full">
            LAST UPDATED: APRIL 4, 2025
          </h2>
        </div>

        {/* Policy content */}
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="space-y-8 text-white">
            {/* Introduction section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-blue/20 transform -rotate-0.5 shadow-neon-blue-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-blue font-game-fallback mb-4">
                INTRODUCTION
              </h3>
              <p className="mb-4">
                Welcome to Pyramid.Ninja! This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our digital card drinking game application.
              </p>
              <p>
                We respect your privacy and are committed to protecting your
                personal data. Please read this Privacy Policy carefully to
                understand our practices regarding your personal information.
              </p>
            </div>

            {/* Information We Collect section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-purple/20 transform rotate-0.5 shadow-neon-purple-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-purple font-game-fallback mb-4">
                INFORMATION WE COLLECT
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Game Information
                  </h4>
                  <p>
                    When you use Pyramid.Ninja, we collect game-related
                    information such as:
                  </p>
                  <ul className="list-disc pl-8 mt-2 space-y-1">
                    <li>User-provided names</li>
                    <li>Game session data</li>
                    <li>Game progress and actions</li>
                    <li>Randomly generated player and game identifiers</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Device Information
                  </h4>
                  <p>
                    We may automatically collect certain information about the
                    device you use to access the application, including:
                  </p>
                  <ul className="list-disc pl-8 mt-2 space-y-1">
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Screen size and resolution</li>
                    <li>Referring website</li>
                    <li>IP address</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Your Information section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-green/20 transform -rotate-0.5 shadow-neon-green-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-green font-game-fallback mb-4">
                HOW WE USE YOUR INFORMATION
              </h3>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Provide, maintain, and improve Pyramid.Ninja</li>
                <li>Create and manage game sessions</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Diagnose technical issues and optimize performance</li>
                <li>Develop new features and functionality</li>
                <li>Protect against fraud and unauthorized access</li>
              </ul>
            </div>

            {/* Third-Party Services section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-red/20 transform rotate-0.5 shadow-neon-red-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-red font-game-fallback mb-4">
                THIRD-PARTY SERVICES
              </h3>
              <p className="mb-4">
                We use several third-party services to operate Pyramid.Ninja.
                Each of these services may collect and process data according to
                their own privacy policies:
              </p>

              <div className="space-y-4 mt-6">
                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Firebase / Firestore
                  </h4>
                  <p className="mb-2">
                    We use Google Firebase and Firestore for our database
                    infrastructure and real-time updates.
                  </p>
                  <p className="text-sm text-gray-400">
                    Firebase collects and processes data according to the
                    <a
                      href="https://firebase.google.com/support/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-neon-blue hover:text-game-neon-yellow ml-1"
                    >
                      Firebase Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Vercel
                  </h4>
                  <p className="mb-2">
                    Pyramid.Ninja is hosted on Vercel, which provides hosting
                    and deployment services.
                  </p>
                  <p className="text-sm text-gray-400">
                    Vercel may collect server logs and usage data according to
                    the
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-neon-blue hover:text-game-neon-yellow ml-1"
                    >
                      Vercel Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Vercel Analytics
                  </h4>
                  <p className="mb-2">
                    We use Vercel Analytics to understand how users interact
                    with our application.
                  </p>
                  <p className="text-sm text-gray-400">
                    Analytics data is processed according to the
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-neon-blue hover:text-game-neon-yellow ml-1"
                    >
                      Vercel Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Cloudflare
                  </h4>
                  <p className="mb-2">
                    We use Cloudflare for content delivery network (CDN)
                    services and security.
                  </p>
                  <p className="text-sm text-gray-400">
                    Cloudflare processes user data according to the
                    <a
                      href="https://www.cloudflare.com/privacypolicy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-neon-blue hover:text-game-neon-yellow ml-1"
                    >
                      Cloudflare Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-lg text-game-neon-yellow font-game-fallback mb-2">
                    Google Fonts
                  </h4>
                  <p className="mb-2">
                    We use Google Fonts to enhance the visual appearance of our
                    application.
                  </p>
                  <p className="text-sm text-gray-400">
                    Google may collect data related to font usage according to
                    the
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-game-neon-blue hover:text-game-neon-yellow ml-1"
                    >
                      Google Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Cookies & Storage section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-yellow/20 transform -rotate-0.5 shadow-neon-yellow-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-yellow font-game-fallback mb-4">
                COOKIES & LOCAL STORAGE
              </h3>
              <p className="mb-4">
                Pyramid.Ninja uses cookies and local storage to enhance your
                experience and enable certain functionality:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg text-game-neon-blue font-game-fallback mb-2">
                    Necessary Storage
                  </h4>
                  <p>
                    We use necessary local storage to maintain basic game
                    functionality, including remembering your game session and
                    player information.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg text-game-neon-blue font-game-fallback mb-2">
                    Analytics Cookies
                  </h4>
                  <p>
                    With your consent, we use analytics cookies to understand
                    how users interact with our application, which helps us
                    improve the user experience.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg text-game-neon-blue font-game-fallback mb-2">
                    Cookie Consent
                  </h4>
                  <p>
                    When you first visit Pyramid.Ninja, you&apos;ll be asked to
                    consent to our use of cookies and local storage. You can
                    change your preferences at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Your Rights section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-purple/20 transform rotate-0.5 shadow-neon-purple-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-purple font-game-fallback mb-4">
                YOUR RIGHTS
              </h3>
              <p className="mb-4">
                Depending on your location, you may have certain rights
                regarding your personal information:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-game-neon-yellow font-game-fallback mb-2">
                    Access
                  </h4>
                  <p className="text-sm">
                    You may have the right to access personal information we
                    hold about you.
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-game-neon-yellow font-game-fallback mb-2">
                    Correction
                  </h4>
                  <p className="text-sm">
                    You may have the right to correct incomplete or inaccurate
                    information.
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-game-neon-yellow font-game-fallback mb-2">
                    Deletion
                  </h4>
                  <p className="text-sm">
                    You may have the right to request deletion of your personal
                    information.
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-game-neon-yellow font-game-fallback mb-2">
                    Restriction
                  </h4>
                  <p className="text-sm">
                    You may have the right to request restriction of processing
                    of your data.
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-game-neon-yellow font-game-fallback mb-2">
                    Data Portability
                  </h4>
                  <p className="text-sm">
                    You may have the right to receive your data in a structured,
                    commonly used format.
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <h4 className="text-game-neon-yellow font-game-fallback mb-2">
                    Objection
                  </h4>
                  <p className="text-sm">
                    You may have the right to object to processing of your
                    personal information.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Security section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-green/20 transform -rotate-0.5 shadow-neon-green-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-green font-game-fallback mb-4">
                DATA SECURITY
              </h3>
              <p className="mb-4">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
              <p>
                While we strive to use commercially acceptable means to protect
                your personal information, we cannot guarantee absolute
                security. Internet transmission is never 100% secure, and we
                cannot guarantee the security of information transmitted through
                our application.
              </p>
            </div>

            {/* Children's Privacy section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-red/20 transform rotate-0.5 shadow-neon-red-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-red font-game-fallback mb-4">
                CHILDREN&apos;S PRIVACY
              </h3>
              <p className="mb-4">
                Pyramid.Ninja is a drinking game application and is not intended
                for children under the legal drinking age in their respective
                jurisdictions. We do not knowingly collect personal information
                from children under the legal drinking age.
              </p>
              <p>
                If we discover that we have collected personal information from
                a child under the legal drinking age, we will promptly delete
                that information.
              </p>
            </div>

            {/* Changes to Privacy Policy section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-blue/20 transform -rotate-0.5 shadow-neon-blue-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-blue font-game-fallback mb-4">
                CHANGES TO THIS PRIVACY POLICY
              </h3>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect
                changes to our practices or for other operational, legal, or
                regulatory reasons. We will post the updated Privacy Policy on
                this page and update the &quot;Last Updated&quot; date.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically to
                stay informed about how we collect, use, and protect your
                information.
              </p>
            </div>

            {/* Contact Us section */}
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl border border-game-neon-purple/20 transform rotate-0.5 shadow-neon-purple-sm">
              <h3 className="text-xl sm:text-2xl text-game-neon-purple font-game-fallback mb-4">
                CONTACT US
              </h3>
              <p className="mb-4">
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-black/50 p-4 rounded-lg border border-white/10 text-center">
                <p className="text-game-neon-yellow font-game-fallback">
                  hello@rouic.com
                </p>
              </div>
            </div>
          </div>
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

export default PrivacyPage;
