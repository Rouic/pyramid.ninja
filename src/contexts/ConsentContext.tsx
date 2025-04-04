import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ConsentState {
  analytics: boolean;
  necessary: boolean; // Always true, required for app functionality
  localStorage: boolean;
  firebase: boolean;
}

interface ConsentContextType {
  consent: ConsentState;
  setConsent: (consent: Partial<ConsentState>) => void;
  hasSetConsent: boolean;
  setHasSetConsent: (hasSet: boolean) => void;
}

const defaultConsentState: ConsentState = {
  analytics: false,
  necessary: true, // Always true, required for app functionality
  localStorage: false,
  firebase: false,
};

const defaultContext: ConsentContextType = {
  consent: defaultConsentState,
  setConsent: () => {},
  hasSetConsent: false,
  setHasSetConsent: () => {},
};

const ConsentContext = createContext<ConsentContextType>(defaultContext);

export const useConsent = () => useContext(ConsentContext);

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsentState] = useState<ConsentState>(defaultConsentState);
  const [hasSetConsent, setHasSetConsent] = useState<boolean>(false);

  // Load consent state from localStorage on mount
  useEffect(() => {
    // Only attempt to read if localStorage is available
    if (typeof window !== 'undefined') {
      const storedConsent = localStorage.getItem('consent');
      const storedHasSetConsent = localStorage.getItem('hasSetConsent');
      
      if (storedConsent) {
        try {
          const parsedConsent = JSON.parse(storedConsent);
          setConsentState(parsedConsent);
        } catch (error) {
          console.error('Failed to parse stored consent', error);
        }
      }
      
      if (storedHasSetConsent) {
        setHasSetConsent(storedHasSetConsent === 'true');
      }
    }
  }, []);

  // Update localStorage when consent changes
  useEffect(() => {
    // Only save if the user has explicitly set consent
    if (hasSetConsent && typeof window !== 'undefined') {
      localStorage.setItem('consent', JSON.stringify(consent));
      localStorage.setItem('hasSetConsent', hasSetConsent.toString());
    }
  }, [consent, hasSetConsent]);

  const setConsent = (newConsent: Partial<ConsentState>) => {
    setConsentState((prev) => ({
      ...prev,
      ...newConsent,
    }));
  };

  return (
    <ConsentContext.Provider
      value={{
        consent,
        setConsent,
        hasSetConsent,
        setHasSetConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};
