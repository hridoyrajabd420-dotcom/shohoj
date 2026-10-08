import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  featureTitle?: string;
}

/**
 * UpgradeModal: In Shohoj Bebsha, all features are 100% free!
 * No upgrade modal or payment gateway is displayed.
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = () => {
  return null;
};
