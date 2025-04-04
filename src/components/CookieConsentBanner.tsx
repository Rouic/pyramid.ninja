import React from "react";
import { useConsent } from "../contexts/ConsentContext";
import Link from "next/link";

const CookieConsentBanner: React.FC = () => {
  const { consent, setConsent, hasSetConsent, setHasSetConsent } = useConsent();

  const handleAcceptAll = () => {
    setConsent({
      analytics: true,
      localStorage: true,
      firebase: true,
    });
    setHasSetConsent(true);
  };

  const handleDeclineAll = () => {
    setConsent({
      analytics: false,
      localStorage: false,
      firebase: false,
    });
    setHasSetConsent(true);
  };

  const handleAcceptNecessary = () => {
    setConsent({
      analytics: false,
      localStorage: false,
      firebase: false,
    });
    setHasSetConsent(true);
  };

  if (hasSetConsent) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-4 rounded-lg shadow-xl game-table border-2 border-neon-purple animate-float-slow">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-white font-game-fallback tracking-wide">
            Cookie Consent
          </h2>

          <p className="text-white">
            This website uses cookies and collects certain data to provide you
            with a better experience.
          </p>

          <div className="flex flex-col space-y-3 mt-2">
            <button
              onClick={handleAcceptAll}
              className="w-full py-2 px-4 bg-neon-green text-black font-game-fallback tracking-wide rounded btn-neon shadow-neon-green-lg-shadow"
            >
              ACCEPT ALL
            </button>

            <button
              onClick={handleDeclineAll}
              className="w-full py-2 px-4 bg-neon-red text-white font-game-fallback tracking-wide rounded btn-neon shadow-neon-red-lg-shadow"
            >
              DECLINE ALL
            </button>

            <button
              onClick={handleAcceptNecessary}
              className="w-full py-2 px-4 bg-neon-blue text-white font-game-fallback tracking-wide rounded btn-neon shadow-neon-blue-lg-shadow"
            >
              NECESSARY COOKIES ONLY
            </button>
          </div>

          <p className="text-white text-sm mt-2">
            By clicking &quot;Accept All&quot;, you consent to the use of ALL
            cookies. Visit our{" "}
            <Link
              href="/privacy"
              className="text-game-neon-blue hover:text-game-neon-yellow underline"
            >
              privacy policy
            </Link>{" "}
            to learn more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
