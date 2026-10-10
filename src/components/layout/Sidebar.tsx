import React from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  UserCheck,
  Settings,
  LogOut,
  AlertTriangle,
  DollarSign,
  Truck,
  CreditCard,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Calculator,
  Landmark,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { profile, signOut } = useAuth();
  const { lowStockProducts } = useData();

  const isStudent = profile?.user_type === 'student';

  // Core Management Modules (All 100% Free)
  const coreNavItems = [
    {
      id: (isStudent ? 'student_dashboard' : 'dashboard') as ViewTab,
      labelBn: isStudent ? 'শিক্ষার্থী ড্যাশবোর্ড' : 'ড্যাশবোর্ড',
      labelEn: isStudent ? 'Student Dashboard' : 'Dashboard',
      icon: isStudent ? GraduationCap : LayoutDashboard,
    },
    {
      id: 'products' as ViewTab,
      labelBn: 'পণ্য ও স্টক',
      labelEn: 'Products & Stock',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'sales' as ViewTab,
      labelBn: 'বিক্রয়',
      labelEn: 'Sales',
      icon: ShoppingCart,
    },
    {
      id: 'expenses' as ViewTab,
      labelBn: 'খরচের হিসাব',
      labelEn: 'Expenses',
      icon: Receipt,
    },
    {
      id: 'customers' as ViewTab,
      labelBn: 'গ্রাহক ও বাকি',
      labelEn: 'Customers',
      icon: Users,
    },
  ];

  // Business Analytics & Management Modules (All 100% Free)
  const businessNavItems = [
    {
      id: 'financials' as ViewTab,
      labelBn: 'লাভ-ক্ষতি ও মার্জিন',
      labelEn: 'Profit & Loss',
      icon: DollarSign,
    },
    {
      id: 'fixed_assets' as ViewTab,
      labelBn: 'স্থায়ী সম্পদ ও অবচয়',
      labelEn: 'Fixed Assets & CapEx',
      icon: Landmark,
    },
    {
      id: 'inventory_pro' as ViewTab,
      labelBn: 'ইনভেন্টরি ও ক্রয় খাতা',
      labelEn: 'Inventory & Purchases',
      icon: Truck,
    },
    {
      id: 'payables' as ViewTab,
      labelBn: 'বকেয়া ও দেনা খাতা',
      labelEn: 'Payables & Dues',
      icon: CreditCard,
    },
    {
      id: 'invoices' as ViewTab,
      labelBn: 'ইনভয়েস ও কোটেশন',
      labelEn: 'Invoices & Quotes',
      icon: FileText,
    },
    {
      id: 'reports' as ViewTab,
      labelBn: 'রিপোর্ট সেন্টার',
      labelEn: 'Reports & Export',
      icon: FileSpreadsheet,
    },
    {
      id: 'analytics' as ViewTab,
      labelBn: 'বিজনেস অ্যানালিটিক্স',
      labelEn: 'Analytics & Insights',
      icon: TrendingUp,
    },
    {
      id: 'calculators' as ViewTab,
      labelBn: 'ব্যবসায়িক ক্যালকুলেটর',
      labelEn: 'Business Calculators',
      icon: Calculator,
    },
  ];

  // Bottom Settings Items
  const systemNavItems = [
    {
      id: 'profile' as ViewTab,
      labelBn: 'প্রোফাইল ও ব্যবসা',
      labelEn: 'Profile & Business',
      icon: UserCheck,
    },
    {
      id: 'settings' as ViewTab,
      labelBn: 'সেটিংস ও ডেটাবেজ',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 h-screen sticky top-0 hidden md:flex">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl min-w-0"
          aria-label="Shohoj Bebsha Home"
        >
          <div className="relative flex items-center justify-center p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs group-hover:border-emerald-300 transition-colors shrink-0">
            <img
              src="/assets/shohoj-bebsha-logo.png"
              alt="Shohoj Bebsha Logo"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="overflow-hidden min-w-0">
            <h1 className="font-bold text-sm text-slate-900 leading-tight truncate group-hover:text-emerald-700 transition-colors">
              সহজ ব্যবসা
            </h1>
            <p className="text-[10px] text-slate-500 truncate">Shohoj Bebsha</p>
          </div>
        </a>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
          isStudent ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {isStudent ? 'শিক্ষার্থী' : 'ফুল ভার্সন'}
        </span>
      </div>

      {/* Business Snippet */}
      <div className="px-3.5 py-2 mx-3 my-1.5 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-xs font-bold text-slate-800 truncate">
          {isStudent
            ? (profile?.institution_name || profile?.business_name || 'শিক্ষার্থী অ্যাকাউন্ট')
            : (profile?.business_name || 'আমার ব্যবসা')}
        </p>
        <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.2">
          {isStudent ? (profile?.field_of_study || 'Student / Accounting Lab') : (profile?.business_type || 'Retail & Trading')}
        </p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
        {/* CORE MODULES */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            দৈনিক ব্যবস্থাপনা
          </span>
          <div className="mt-1 space-y-0.5">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.labelBn}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-emerald-800' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* BUSINESS & FINANCIAL MODULES */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            হিসাব, রিপোর্ট ও টুলস
          </span>
          <div className="mt-1 space-y-0.5">
            {businessNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.labelBn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SYSTEM / SETTINGS */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            অ্যাকাউন্ট ও সেটিংস
          </span>
          <div className="mt-1 space-y-0.5">
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.labelBn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Low Stock Warning Alert if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-2.5 mx-3 mb-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{lowStockProducts.length}টি পণ্যের স্টক কম!</span>
            <p className="text-[10px] text-amber-700">স্টক চেক করুন।</p>
          </div>
        </div>
      )}

      {/* User Logout Footer */}
      <div className="p-3 border-t border-slate-100">
        <button
          id="sidebar-logout-btn"
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>লগআউট (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
