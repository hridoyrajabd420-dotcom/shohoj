import React from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Menu, Database, ShieldCheck, User, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onOpenMobileMenu: () => void;
  onOpenSetup?: () => void;
  onNavigateToUpgrade?: () => void;
}

const TAB_TITLES: Record<ViewTab, { bn: string; en: string }> = {
  dashboard: { bn: 'ড্যাশবোর্ড ওভারভিউ', en: 'Dashboard Overview' },
  products: { bn: 'পণ্য ও ইনভেন্টরি', en: 'Products & Inventory' },
  sales: { bn: 'বিক্রয় ও লেনদেন', en: 'Sales & Transactions' },
  expenses: { bn: 'খরচের খাতা', en: 'Expense Tracker' },
  customers: { bn: 'গ্রাহক ও বাকির খাতা', en: 'Customer & Due Ledger' },
  financials: { bn: 'লাভ-ক্ষতি ও আর্থিক হিসাব', en: 'Profit & Loss (P&L)' },
  inventory_pro: { bn: 'ইনভেন্টরি প্রো ও স্টক মূল্যায়ন', en: 'Advanced Inventory' },
  payables: { bn: 'বকেয়া ও পাওনাদার খাতা', en: 'Receivables & Payables' },
  invoices: { bn: 'ইনভয়েস ও কোটেশন', en: 'Invoices & Quotations' },
  reports: { bn: 'অ্যাডভান্সড রিপোর্ট সেন্টার', en: 'Advanced Reports' },
  analytics: { bn: 'অ্যানালিটিক্স ও ব্যবসায়িক পর্যবেক্ষণ', en: 'Business Analytics' },
  calculators: { bn: 'ব্যবসায়িক ক্যালকুলেটর স্যুট', en: 'Business Calculators' },
  tools: { bn: 'টুলস ও ইউটিলিটি', en: 'Business Utilities' },
  pro_upgrade: { bn: 'Shohoj Bebsha Pro আপগ্রেড', en: 'Pro Membership & Billing' },
  profile: { bn: 'ইউজার ও ব্যবসার প্রোফাইল', en: 'Profile Settings' },
  settings: { bn: 'অ্যাপ ও ডেটাবেজ সেটিংস', en: 'App & Database Settings' },
};

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onOpenMobileMenu, onOpenSetup, onNavigateToUpgrade }) => {
  const { profile, user, isConfigured } = useAuth();
  const currentTitle = TAB_TITLES[currentTab] || { bn: 'সহজ ব্যবসা', en: 'Shohoj Bebsha' };
  const isPro = profile?.plan === 'PRO';

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {currentTitle.bn}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">{currentTitle.en}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Plan status / Upgrade trigger */}
        {isPro ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PRO</span>
          </div>
        ) : (
          <button
            onClick={onNavigateToUpgrade}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white text-xs font-bold rounded-full shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">Upgrade to Pro</span>
            <span className="sm:hidden">Pro</span>
          </button>
        )}

        {/* Supabase Status Indicator */}
        {isConfigured ? (
          <div
            title="Connected to Supabase with Row Level Security"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase লাইভ</span>
          </div>
        ) : (
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-300 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">সেটআপ সংযোগ প্রয়োজন</span>
            <span className="sm:hidden">সেটআপ</span>
          </button>
        )}

        {/* User profile pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden lg:block text-left">
            <p className="font-semibold text-slate-800 leading-none">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 truncate max-w-[130px] mt-0.5">
              {profile?.business_name || 'My Business'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
