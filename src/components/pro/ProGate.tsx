import React from 'react';

interface ProGateProps {
  children: React.ReactNode;
  featureTitle?: string;
  featureDescription?: string;
  onNavigateToUpgrade?: () => void;
  previewMode?: boolean;
}

/**
 * ProGate: In Shohoj Bebsha, all features are 100% free!
 * ProGate simply passes through children directly with zero locks, zero modals, zero restrictions.
 */
export const ProGate: React.FC<ProGateProps> = ({ children }) => {
  return <>{children}</>;
};
