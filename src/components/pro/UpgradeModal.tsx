import React from 'react';
import { Lock, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureTitle?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  featureTitle = 'Shohoj Bebsha Pro',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200/80 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon / Banner */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-amber-200" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-900 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> PRO ফিচার
          </span>
          <h3 className="text-xl font-black">{featureTitle}</h3>
          <p className="text-xs text-amber-100 mt-1 max-w-xs mx-auto">
            এই ফিচারটি ব্যবহার করতে Shohoj Bebsha Pro-তে Upgrade করুন।
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5">
            <p className="text-xs font-semibold text-amber-900 mb-2">
              Shohoj Bebsha Pro-এর মাধ্যমে আপনি যা পাচ্ছেন:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>বিস্তারিত লাভ-ক্ষতি (Profit & Loss) ও আর্থিক বিশ্লেষণ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ক্রয় ব্যবস্থাপনা ও ইনভেন্টরি স্টক এডজাস্টমেন্ট</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>সাপ্লায়ার দেনা ও বাকি আদায়ের স্বয়ংক্রিয় হিসাব</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>প্রফেশনাল ইনভয়েস ও কোটেশন তৈরি এবং PDF প্রিন্ট</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>৮টি অ্যাডভান্সড রিপোর্ট ও স্মার্ট ব্যবসায়িক ইনসাইটস</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>৯টি রেডি বিজনেস ক্যালকুলেটর (ROI, Break-even, Pricing)</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> ১০০% নিরাপদ ডেটা
            </span>
            <span className="font-semibold text-slate-800">শুরু মাত্র ৳৯৯০ থেকে</span>
          </div>

          <div className="space-y-2 pt-2">
            <button
              id="upgrade-to-pro-btn"
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              এখন নয়, পরে দেখব
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
