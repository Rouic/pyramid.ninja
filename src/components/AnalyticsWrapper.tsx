import React, { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useConsent } from '../contexts/ConsentContext';
import { initializeFirebase } from '../lib/firebase/firebase';

const AnalyticsWrapper: React.FC = () => {
  const { consent, hasSetConsent } = useConsent();

  // Initialize Firebase services based on consent
  useEffect(() => {
    if (hasSetConsent) {
      // Only initialize if consent has been explicitly set
      initializeFirebase(consent.firebase, consent.analytics);
    }
  }, [consent, hasSetConsent]);

  if (consent.analytics && hasSetConsent) {
    return <Analytics />;
  }

  return null;
};

export default AnalyticsWrapper;