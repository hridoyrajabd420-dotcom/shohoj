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
  student_dashboard: { bn: 'শিক্ষার্থী ড্যাশবোর্ড ওভারভিউ', en: 'Student Academic Dashboard' },
  // Academic Subjects & Modules
  student_accounting: { bn: 'অ্যাকাউন্টিং (হিসাববিজ্ঞান)', en: 'Financial Accounting' },
  student_finance: { bn: 'ফাইন্যান্স (অর্থায়ন)', en: 'Corporate & Managerial Finance' },
  student_economics: { bn: 'অর্থনীতি (Economics)', en: 'Micro & Macro Economics' },
  student_business_math: { bn: 'বিজনেস গণিত (Business Math)', en: 'Business Mathematics & Financial Modeling' },
  student_cost_accounting: { bn: 'কস্ট অ্যাকাউন্টিং (উৎপাদন ব্যয় হিসাব)', en: 'Cost Accounting & Job Costing' },
  student_management_accounting: { bn: 'ম্যানেজমেন্ট অ্যাকাউন্টিং', en: 'Management Accounting & Decision Making' },
  student_statistics: { bn: 'পরিসংখ্যান (Business Statistics)', en: 'Business Statistics & Data Analysis' },
  student_practice: { bn: 'প্র্যাকটিস ও একাডেমিক ক্যালকুলেটর', en: 'Academic Practice & Formulas' },
  student_saved_problems: { bn: 'সংরক্ষিত সমস্যা ও সমাধান খাতা', en: 'Saved Problems & Notes' },
  student_study_history: { bn: 'অধ্যয়ন ইতিহাস ও অগ্রগতি লগ', en: 'Study History & Activity Log' },
  // Business Tabs
  products: { bn: 'পণ্য ও ইনভেন্টরি', en: 'Products & Inventory' },
  sales: { bn: 'বিক্রয় ও লেনদেন', en: 'Sales & Transactions' },
  expenses: { bn: 'খরচের খাতা', en: 'Expense Tracker' },
  customers: { bn: 'গ্রাহক ও বাকির খাতা', en: 'Customer & Due Ledger' },
  fixed_assets: { bn: 'স্থায়ী সম্পদ ও অবচয় খাতা', en: 'Fixed Assets & CapEx' },
  financials: { bn: 'লাভ-ক্ষতি ও আর্থিক হিসাব', en: 'Profit & Loss (P&L)' },
  inventory_pro: { bn: 'ইনভেন্টরি ও স্টক মূল্যায়ন', en: 'Inventory & Purchases' },
  payables: { bn: 'বকেয়া ও পাওনাদার খাতা', en: 'Receivables & Payables' },
  invoices: { bn: 'ইনভয়েস ও কোটেশন', en: 'Invoices & Quotations' },
  reports: { bn: 'রিপোর্ট ও এক্সপোর্ট সেন্টার', en: 'Reports & Export' },
  analytics: { bn: 'অ্যানালিটিক্স ও ব্যবসায়িক পর্যবেক্ষণ', en: 'Business Analytics' },
  calculators: { bn: 'ব্যবসায়িক ক্যালকুলেটর স্যুট', en: 'Business Calculators' },
  tools: { bn: 'টুলস ও ইউটিলিটি', en: 'Business Utilities' },
  pro_upgrade: { bn: 'সহজ ব্যবসা ফিচারসমূহ', en: 'Shohoj Bebsha Features' },
  profile: { bn: 'ইউজার ও প্রোফাইল সেটিংস', en: 'Profile Settings' },
  settings: { bn: 'অ্যাপ ও ডেটাবেজ সেটিংস', en: 'App & Database Settings' },
};

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onOpenMobileMenu }) => {
  const { isConfigured, profile } = useAuth();
  const currentTitle = TAB_TITLES[currentTab] || { bn: 'সহজ ব্যবসা', en: 'Shohoj Bebsha' };
  const isStudent = profile?.user_type === 'student';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Official Shohoj Bebsha Logo - Clickable linking to homepage */}
        <a
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl shrink-0"
          aria-label="Shohoj Bebsha Home"
        >
          <div className="relative flex items-center justify-center p-1 bg-white rounded-lg sm:rounded-xl border border-slate-200/80 shadow-2xs group-hover:border-emerald-300 transition-colors">
            <img
              src="/assets/shohoj-bebsha-logo.png"
              alt="Shohoj Bebsha Logo"
              className="h-7 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </a>

        {/* Active Page / Tab Title */}
        <div className="min-w-0 border-l border-slate-200/80 pl-2.5 sm:pl-3.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
            {currentTitle.bn}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">{currentTitle.en}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* User Mode Indicator Badge */}
        {profile && (
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${
              isStudent
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isStudent ? 'শিক্ষার্থী মোড (Student)' : 'ব্যবসা মোড (Business)'}
          </span>
        )}

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
