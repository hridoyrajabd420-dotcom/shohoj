import React from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calculator,
  PieChart,
  Compass,
  BarChart3,
  Bookmark,
  History,
  UserCheck,
  Settings,
  LogOut,
  Sparkles,
  School,
} from 'lucide-react';

interface StudentSidebarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const { profile, signOut } = useAuth();
  const { savedProblems, studyHistory } = useStudent();

  // Academic Modules Menu
  const academicNavItems = [
    {
      id: 'student_dashboard' as ViewTab,
      labelBn: 'অ্যাকাডেমিক ড্যাশবোর্ড',
      labelEn: 'Dashboard Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'student_accounting' as ViewTab,
      labelBn: 'হিসাববিজ্ঞান (Accounting)',
      labelEn: 'Financial Accounting',
      icon: BookOpen,
    },
    {
      id: 'student_finance' as ViewTab,
      labelBn: 'ফাইন্যান্স (Finance)',
      labelEn: 'Corporate Finance',
      icon: DollarSign,
    },
    {
      id: 'student_economics' as ViewTab,
      labelBn: 'অর্থনীতি (Economics)',
      labelEn: 'Micro & Macro',
      icon: TrendingUp,
    },
    {
      id: 'student_business_math' as ViewTab,
      labelBn: 'বিজনেস গণিত (Math)',
      labelEn: 'Business Math',
      icon: Calculator,
    },
    {
      id: 'student_cost_accounting' as ViewTab,
      labelBn: 'কস্ট অ্যাকাউন্টিং',
      labelEn: 'Cost Accounting',
      icon: PieChart,
    },
    {
      id: 'student_management_accounting' as ViewTab,
      labelBn: 'ম্যানেজমেন্ট অ্যাকাউন্টিং',
      labelEn: 'Managerial Accounting',
      icon: Compass,
    },
    {
      id: 'student_statistics' as ViewTab,
      labelBn: 'পরিসংখ্যান (Statistics)',
      labelEn: 'Business Statistics',
      icon: BarChart3,
    },
  ];

  // Practice & Personal Learning Tools
  const studentToolItems = [
    {
      id: 'student_practice' as ViewTab,
      labelBn: 'প্র্যাকটিস ও ক্যালকুলেটর',
      labelEn: 'Practice Lab',
      icon: Sparkles,
      badge: 'ল্যাব',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'student_saved_problems' as ViewTab,
      labelBn: 'সংরক্ষিত সমস্যা ও নোট',
      labelEn: 'Saved Problems',
      icon: Bookmark,
      badge: savedProblems.length > 0 ? savedProblems.length : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'student_study_history' as ViewTab,
      labelBn: 'অধ্যয়ন ইতিহাস ও লগ',
      labelEn: 'Study History',
      icon: History,
      badge: studyHistory.length > 0 ? studyHistory.length : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const systemNavItems = [
    {
      id: 'profile' as ViewTab,
      labelBn: 'প্রোফাইল ও অ্যাকাডেমিক তথ্য',
      labelEn: 'Profile Settings',
      icon: UserCheck,
    },
    {
      id: 'settings' as ViewTab,
      labelBn: 'অ্যাপ সেটিংস',
      labelEn: 'App Settings',
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
            <p className="text-[10px] text-slate-500 truncate">Academic Suite</p>
          </div>
        </a>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-800 border-blue-200 shrink-0">
          শিক্ষার্থী
        </span>
      </div>

      {/* Student Profile Snippet */}
      <div className="px-3.5 py-2 mx-3 my-1.5 bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border border-blue-100/80 rounded-xl">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs truncate">
          <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{profile?.full_name || 'শিক্ষার্থী পোর্টাল'}</span>
        </div>
        <p className="text-[10px] text-slate-600 truncate mt-0.5">
          {profile?.institution_name || 'বাণিজ্য ও ব্যবসায় শিক্ষা'}
        </p>
        <p className="text-[9px] text-blue-700 font-semibold truncate">
          {profile?.field_of_study || 'BBA / Accounting / Commerce'}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
        {/* Academic Core Subjects */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            অ্যাকাডেমিক বিষয়সমূহ (Subjects)
          </span>
          <div className="mt-1 space-y-0.5">
            {academicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.labelBn}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Practice & Tools */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            প্র্যাকটিস ও নোটবুক (Tools)
          </span>
          <div className="mt-1 space-y-0.5">
            {studentToolItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.labelBn}</span>
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

        {/* Account / Settings */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            অ্যাকাউন্ট ও মোড সেটিংস
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
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-bold'
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
