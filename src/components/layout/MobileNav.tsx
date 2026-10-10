import React from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useStudent } from '../../context/StudentContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  UserCheck,
  Settings,
  LogOut,
  X,
  DollarSign,
  Truck,
  CreditCard,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Calculator,
  Landmark,
  GraduationCap,
  BookOpen,
  PieChart,
  Compass,
  BarChart3,
  Bookmark,
  History,
  Sparkles,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  onClose,
}) => {
  const { profile, signOut } = useAuth();
  const { lowStockProducts } = useData();
  const { savedProblems, studyHistory } = useStudent();
  const isStudent = profile?.user_type === 'student';

  const handleSelect = (tab: ViewTab) => {
    setCurrentTab(tab);
    onClose();
  };

  // Student specific navigation items
  const studentAcademicItems = [
    { id: 'student_dashboard' as ViewTab, labelBn: 'অ্যাকাডেমিক ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'student_accounting' as ViewTab, labelBn: 'হিসাববিজ্ঞান (Accounting)', icon: BookOpen },
    { id: 'student_finance' as ViewTab, labelBn: 'ফাইন্যান্স (Finance)', icon: DollarSign },
    { id: 'student_economics' as ViewTab, labelBn: 'অর্থনীতি (Economics)', icon: TrendingUp },
    { id: 'student_business_math' as ViewTab, labelBn: 'বিজনেস গণিত (Math)', icon: Calculator },
    { id: 'student_cost_accounting' as ViewTab, labelBn: 'কস্ট অ্যাকাউন্টিং', icon: PieChart },
    { id: 'student_management_accounting' as ViewTab, labelBn: 'ম্যানেজমেন্ট অ্যাকাউন্টিং', icon: Compass },
    { id: 'student_statistics' as ViewTab, labelBn: 'পরিসংখ্যান (Statistics)', icon: BarChart3 },
  ];

  const studentToolItems = [
    { id: 'student_practice' as ViewTab, labelBn: 'প্র্যাকটিস ও ক্যালকুলেটর', icon: Sparkles },
    {
      id: 'student_saved_problems' as ViewTab,
      labelBn: 'সংরক্ষিত সমস্যা ও নোট',
      icon: Bookmark,
      badge: savedProblems.length > 0 ? savedProblems.length : undefined,
    },
    {
      id: 'student_study_history' as ViewTab,
      labelBn: 'অধ্যয়ন ইতিহাস ও লগ',
      icon: History,
      badge: studyHistory.length > 0 ? studyHistory.length : undefined,
    },
  ];

  // Business specific navigation items
  const businessCoreItems = [
    { id: 'dashboard' as ViewTab, labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    {
      id: 'products' as ViewTab,
      labelBn: 'পণ্য ও স্টক',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined,
    },
    { id: 'sales' as ViewTab, labelBn: 'বিক্রয়', icon: ShoppingCart },
    { id: 'expenses' as ViewTab, labelBn: 'খরচের হিসাব', icon: Receipt },
    { id: 'customers' as ViewTab, labelBn: 'গ্রাহক ও বাকি', icon: Users },
  ];

  const businessReportItems = [
    { id: 'financials' as ViewTab, labelBn: 'লাভ-ক্ষতি (P&L)', icon: DollarSign },
    { id: 'fixed_assets' as ViewTab, labelBn: 'স্থায়ী সম্পদ ও অবচয়', icon: Landmark },
    { id: 'inventory_pro' as ViewTab, labelBn: 'ইনভেন্টরি ও ক্রয়', icon: Truck },
    { id: 'payables' as ViewTab, labelBn: 'বকেয়া ও দেনা খাতা', icon: CreditCard },
    { id: 'invoices' as ViewTab, labelBn: 'ইনভয়েস ও কোটেশন', icon: FileText },
    { id: 'reports' as ViewTab, labelBn: 'রিপোর্ট ও এক্সপোর্ট', icon: FileSpreadsheet },
    { id: 'analytics' as ViewTab, labelBn: 'অ্যানালিটিক্স', icon: TrendingUp },
    { id: 'calculators' as ViewTab, labelBn: 'ব্যবসায়িক ক্যালকুলেটর', icon: Calculator },
  ];

  const systemNavItems = [
    { id: 'profile' as ViewTab, labelBn: isStudent ? 'প্রোফাইল সেটিংস' : 'প্রোফাইল ও ব্যবসা', icon: UserCheck },
    { id: 'settings' as ViewTab, labelBn: 'সেটিংস', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <a
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-2.5 group cursor-pointer"
                  aria-label="Shohoj Bebsha Home"
                >
                  <div className="relative flex items-center justify-center p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <img
                      src="/assets/shohoj-bebsha-logo.png"
                      alt="Shohoj Bebsha Logo"
                      className="h-8 w-auto object-contain"
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">সহজ ব্যবসা</h3>
                    <p className="text-[10px] text-slate-500">
                      {isStudent ? 'Academic Suite' : 'Shohoj Bebsha'}
                    </p>
                  </div>
                </a>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Bar */}
              <div className="p-3 mx-3 my-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {isStudent
                      ? (profile?.full_name || 'শিক্ষার্থী পোর্টাল')
                      : (profile?.business_name || 'আমার ব্যবসা')}
                  </p>
                  <p className="text-[10px] text-emerald-700 truncate">
                    {isStudent
                      ? (profile?.institution_name || profile?.field_of_study || 'Student')
                      : (profile?.business_type || 'Retail & Trading')}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isStudent ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {isStudent ? 'শিক্ষার্থী' : 'ব্যবসা'}
                </span>
              </div>

              {/* STUDENT DRAWER VIEW */}
              {isStudent ? (
                <>
                  <div className="px-2 py-1">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      অ্যাকাডেমিক বিষয়সমূহ
                    </span>
                    <div className="space-y-0.5">
                      {studentAcademicItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4" />
                              <span>{item.labelBn}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="px-2 pt-2 pb-1 border-t border-slate-100">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      প্র্যাকটিস ও নোটবুক
                    </span>
                    <div className="space-y-0.5">
                      {studentToolItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4" />
                              <span>{item.labelBn}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* BUSINESS DRAWER VIEW */
                <>
                  <div className="px-2 py-1">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      দৈনিক ব্যবসা
                    </span>
                    <div className="space-y-0.5">
                      {businessCoreItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4" />
                              <span>{item.labelBn}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="px-2 pt-2 pb-1 border-t border-slate-100">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      হিসাব ও রিপোর্ট
                    </span>
                    <div className="space-y-0.5">
                      {businessReportItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4" />
                              <span>{item.labelBn}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* System Nav */}
              <div className="px-2 pt-2 pb-1 border-t border-slate-100">
                <div className="space-y-0.5">
                  {systemNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.labelBn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => {
                  onClose();
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-1 flex items-center justify-around">
        {isStudent ? (
          /* Student Bottom Bar */
          [
            { id: 'student_dashboard' as ViewTab, labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard },
            { id: 'student_accounting' as ViewTab, labelBn: 'হিসাববিজ্ঞান', icon: BookOpen },
            { id: 'student_finance' as ViewTab, labelBn: 'ফাইন্যান্স', icon: DollarSign },
            { id: 'student_practice' as ViewTab, labelBn: 'প্র্যাকটিস', icon: Calculator },
            { id: 'student_saved_problems' as ViewTab, labelBn: 'নোটবুক', icon: Bookmark },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[9px] mt-0.5">{item.labelBn}</span>
              </button>
            );
          })
        ) : (
          /* Business Bottom Bar */
          [
            { id: 'dashboard' as ViewTab, labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard },
            { id: 'products' as ViewTab, labelBn: 'পণ্য', icon: Package },
            { id: 'sales' as ViewTab, labelBn: 'বিক্রয়', icon: ShoppingCart },
            { id: 'expenses' as ViewTab, labelBn: 'খরচ', icon: Receipt },
            { id: 'reports' as ViewTab, labelBn: 'রিপোর্ট', icon: FileSpreadsheet },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[9px] mt-0.5">{item.labelBn}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
};
