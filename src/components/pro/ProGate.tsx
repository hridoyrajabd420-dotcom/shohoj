import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Lock, Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal';

interface ProGateProps {
  children: React.ReactNode;
  featureTitle: string;
  featureDescription?: string;
  onNavigateToUpgrade?: () => void;
  // If previewMode is true, renders children in disabled/blurred background with lock overlay
  previewMode?: boolean;
}

export const ProGate: React.FC<ProGateProps> = ({
  children,
  featureTitle,
  featureDescription,
  onNavigateToUpgrade,
  previewMode = false,
}) => {
  const { proAccess } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pro access is strictly true only if pro is active and not expired
  const isPro = proAccess.isProActive;
  const hasExpired = proAccess.hasExpired;

  if (isPro) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onNavigateToUpgrade) {
      onNavigateToUpgrade();
    } else {
      setIsModalOpen(true);
    }
  };

  const defaultDescription = hasExpired
    ? 'আপনার Shohoj Bebsha Pro সাবস্ক্রিপশনের মেয়াদ উত্তীর্ণ হয়েছে। পুনরায় সচল করতে রিনিউ বা আপগ্রেড করুন।'
    : 'এই ফিচারটি ব্যবহার করতে Shohoj Bebsha Pro-তে Upgrade করুন।';

  if (previewMode) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="filter blur-[2px] pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 z-10 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-amber-200 max-w-md text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 mb-2">
              <Sparkles className="w-3 h-3" /> PRO ফিচার
            </span>
            <h4 className="font-bold text-slate-900 text-base">{featureTitle}</h4>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              এই ফিচারটি ব্যবহার করতে Shohoj Bebsha Pro-তে Upgrade করুন।
            </p>
            <button
              onClick={handleUpgrade}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <UpgradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpgrade={() => {
            if (onNavigateToUpgrade) onNavigateToUpgrade();
          }}
          featureTitle={featureTitle}
        />
      </div>
    );
  }

  // Full page / container locked state
  return (
    <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 text-center shadow-sm">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 mb-3">
        <Sparkles className="w-3.5 h-3.5" /> Shohoj Bebsha Pro
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
        {featureTitle}
      </h3>

      <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
        {featureDescription || defaultDescription}
      </p>

      <div className="inline-flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleUpgrade}
          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Upgrade to Pro</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <span className="text-xs text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> ১ বছরের ফুল এক্সেস মাত্র ৳২,৯৯০
        </span>
      </div>

      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpgrade={() => {
          if (onNavigateToUpgrade) onNavigateToUpgrade();
        }}
        featureTitle={featureTitle}
      />
    </div>
  );
};
