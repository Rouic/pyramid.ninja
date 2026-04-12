import React from 'react';
import { useConsent } from '../contexts/ConsentContext';

const AnalyticsWrapper: React.FC = () => {
  const { consent, hasSetConsent } = useConsent();

  // Analytics is now handled by the platform's injector sidecar
  // This component is kept for compatibility but renders nothing
  return null;
};

export default AnalyticsWrapper;
