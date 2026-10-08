import React from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

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
  inventory_pro: { bn: 'ইনভেন্টরি ও স্টক মূল্যায়ন', en: 'Inventory & Purchases' },
  payables: { bn: 'বকেয়া ও পাওনাদার খাতা', en: 'Receivables & Payables' },
  invoices: { bn: 'ইনভয়েস ও কোটেশন', en: 'Invoices & Quotations' },
  reports: { bn: 'রিপোর্ট ও এক্সপোর্ট সেন্টার', en: 'Reports & Export' },
  analytics: { bn: 'অ্যানালিটিক্স ও ব্যবসায়িক পর্যবেক্ষণ', en: 'Business Analytics' },
  calculators: { bn: 'ব্যবসায়িক ক্যালকুলেটর স্যুট', en: 'Business Calculators' },
  tools: { bn: 'টুলস ও ইউটিলিটি', en: 'Business Utilities' },
  pro_upgrade: { bn: 'সহজ ব্যবসা ফিচারসমূহ', en: 'Shohoj Bebsha Features' },
  profile: { bn: 'ইউজার ও ব্যবসার প্রোফাইল', en: 'Profile Settings' },
  settings: { bn: 'অ্যাপ ও ডেটাবেজ সেটিংস', en: 'App & Database Settings' },
};

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onOpenMobileMenu }) => {
  const { isConfigured } = useAuth();
  const currentTitle = TAB_TITLES[currentTab] || { bn: 'সহজ ব্যবসা', en: 'Shohoj Bebsha' };

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
        {/* Supabase Status Indicator */}
        {isConfigured ? (
          <div
            title="Connected to Supabase with Row Level Security"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Supabase সিঙ্ক</span>
          </div>
        ) : (
          <div
            title="Supabase credentials not configured"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">সেটআপ প্রয়োজন</span>
          </div>
        )}
      </div>
    </header>
  );
};
