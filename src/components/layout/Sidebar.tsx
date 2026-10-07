import React, { useState } from 'react';
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
  Lock,
  Sparkles,
  DollarSign,
  Truck,
  CreditCard,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { UpgradeModal } from '../pro/UpgradeModal';

interface SidebarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { profile, signOut } = useAuth();
  const { lowStockProducts, proAccess } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureTitle, setModalFeatureTitle] = useState('Shohoj Bebsha Pro');

  const isPro = proAccess.isProActive;

  // Core Part 1 (Free) Nav Items
  const freeNavItems = [
    {
      id: 'dashboard' as ViewTab,
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
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

  // Part 2 (Pro) Nav Items with Lock for Free Users
  const proNavItems = [
    {
      id: 'financials' as ViewTab,
      labelBn: 'লাভ-ক্ষতি ও মার্জিন',
      labelEn: 'Profit & Loss',
      icon: DollarSign,
    },
    {
      id: 'inventory_pro' as ViewTab,
      labelBn: 'ইনভেন্টরি প্রো ও ক্রয়',
      labelEn: 'Inventory Pro',
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
      labelBn: 'অ্যাডভান্সড রিপোর্ট',
      labelEn: 'Advanced Reports',
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
      labelEn: '9 Calculators',
      icon: Calculator,
    },
  ];

  // Bottom Settings Items
  const systemNavItems = [
    {
      id: 'profile' as ViewTab,
      labelBn: 'প্রোফাইল',
      labelEn: 'Profile',
      icon: UserCheck,
    },
    {
      id: 'settings' as ViewTab,
      labelBn: 'সেটিংস ও ডেটাবেজ',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  const handleProItemClick = (tabId: ViewTab, titleBn: string) => {
    // If not pro, still allow switching to the view (which renders ProGate with upgrade prompt),
    // or trigger upgrade modal!
    setCurrentTab(tabId);
    if (!isPro) {
      setModalFeatureTitle(titleBn);
      setIsModalOpen(true);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 h-screen sticky top-0 hidden md:flex">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-emerald-600/20">
            সহ
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-slate-900 leading-none truncate">সহজ ব্যবসা</h1>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Shohoj Bebsha</p>
          </div>
        </div>

        {isPro ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> PRO
          </span>
        ) : (
          <button
            onClick={() => setCurrentTab('pro_upgrade')}
            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            FREE
          </button>
        )}
      </div>

      {/* Business Snippet */}
      <div className="px-3.5 py-2 mx-3 my-1.5 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-xs font-bold text-slate-800 truncate">
          {profile?.business_name || 'আমার ব্যবসা'}
        </p>
        <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.2">
          {profile?.business_type || 'Retail & Trading'}
        </p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
        {/* FREE CORE MODULES */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            মৌলিক মেনু (Core MVP)
          </span>
          <div className="mt-1 space-y-0.5">
            {freeNavItems.map((item) => {
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

        {/* SYSTEM / SETTINGS */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            অ্যাকাউন্ট
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

      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpgrade={() => setCurrentTab('pro_upgrade')}
        featureTitle={modalFeatureTitle}
      />
    </aside>
  );
};
