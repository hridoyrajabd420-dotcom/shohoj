import React, { useState } from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calculator,
  PieChart,
  BarChart3,
  Bookmark,
  History,
  ArrowRight,
  Sparkles,
  School,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Star,
  ChevronRight,
} from 'lucide-react';

interface StudentDashboardViewProps {
  onNavigate: (tab: ViewTab) => void;
  onOpenSaleModal?: () => void;
  onOpenProductModal?: () => void;
  onOpenExpenseModal?: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  onNavigate,
}) => {
  const { profile } = useAuth();
  const { savedProblems, studyHistory, calculations } = useStudent();
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  const studentName = profile?.full_name || 'শিক্ষার্থী';
  const institution = profile?.institution_name || 'বাণিজ্য ও ব্যবসায় শিক্ষা বিভাগ';
  const department = profile?.field_of_study || 'BBA / Accounting / Finance';

  // The 10 Core Academic Sections
  const academicSections = [
    {
      id: 'student_accounting' as ViewTab,
      subjectKey: 'accounting',
      titleBn: '১. অ্যাকাউন্টিং (হিসাববিজ্ঞান)',
      titleEn: 'Financial Accounting & Reporting',
      desc: 'হিসাব সমীকরণ (A = L + OE), দুতরফা দাখিলা, জাবেদা, খতিয়ান, রেওয়ামিল এবং আর্থিক বিবরণী।',
      icon: BookOpen,
      badge: 'কোর সাবজেক্ট',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentColor: 'from-emerald-500 to-teal-600',
      topicsCount: '১০+ টপিক ও লেকচার নোট',
    },
    {
      id: 'student_finance' as ViewTab,
      subjectKey: 'finance',
      titleBn: '২. ফাইন্যান্স (অর্থায়ন)',
      titleEn: 'Corporate & Managerial Finance',
      desc: 'অর্থের সময়মূল্য (TVM), বর্তমান ও ভবিষ্যৎ মূল্য, মূলধন বাজেটিং (NPV, IRR), এবং কার্যকরী মূলধন।',
      icon: DollarSign,
      badge: 'কোর সাবজেক্ট',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      accentColor: 'from-blue-500 to-indigo-600',
      topicsCount: '৮+ টপিক ও ভ্যালুয়েশন',
    },
    {
      id: 'student_economics' as ViewTab,
      subjectKey: 'economics',
      titleBn: '৩. অর্থনীতি (Economics)',
      titleEn: 'Micro & Macro Economics',
      desc: 'চাহিদা ও যোগান বিধি, স্থিতিস্থাপকতা (Elasticity), বাজার কাঠামো, জিডিপি ও মুদ্রাস্ফীতি।',
      icon: TrendingUp,
      badge: 'তাত্ত্বিক ও ফলিত',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      accentColor: 'from-purple-500 to-violet-600',
      topicsCount: '৭+ অর্থনৈতিক মডেল',
    },
    {
      id: 'student_business_math' as ViewTab,
      subjectKey: 'math',
      titleBn: '৪. বিজনেস গণিত (Business Math)',
      titleEn: 'Business Mathematics',
      desc: 'সরল ও চক্রবৃদ্ধি সুদ, কিস্তি (Annuity), ম্যাট্রিক্স, লাভ-ক্ষতি ও সরলরৈখিক সমীকরণ।',
      icon: Calculator,
      badge: 'গাণিতিক ভিত্তি',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      accentColor: 'from-amber-500 to-orange-600',
      topicsCount: '৬+ গাণিতিক ফর্মুলা',
    },
    {
      id: 'student_cost_accounting' as ViewTab,
      subjectKey: 'cost',
      titleBn: '৫. কস্ট অ্যাকাউন্টিং (Cost Accounting)',
      titleEn: 'Cost Analysis & Control',
      desc: 'উৎপাদন ব্যয় বিবরণী (Cost Sheet), ব্রেক-ইভেন পয়েন্ট (BEP), উপাদান ও শ্রম ব্যয় নিয়ন্ত্রণ।',
      icon: PieChart,
      badge: 'উৎপাদন হিসাব',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      accentColor: 'from-rose-500 to-pink-600',
      topicsCount: '৮+ কস্ট শীট কাঠামো',
    },
    {
      id: 'student_management_accounting' as ViewTab,
      subjectKey: 'management',
      titleBn: '৬. ম্যানেজমেন্ট অ্যাকাউন্টিং',
      titleEn: 'Managerial Decision Making',
      desc: 'বাজেট ও বাজেটীয় নিয়ন্ত্রণ, সিভিপি (CVP) অ্যানালাইসিস, এবং সিদ্ধান্ত গ্রহণ প্রক্রিয়া।',
      icon: Compass,
      badge: 'ম্যানেজেরিয়াল',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      accentColor: 'from-teal-500 to-emerald-600',
      topicsCount: '৭+ ডিসিশন টুলস',
    },
    {
      id: 'student_statistics' as ViewTab,
      subjectKey: 'statistics',
      titleBn: '৭. পরিসংখ্যান (Business Statistics)',
      titleEn: 'Business Statistics & Probability',
      desc: 'গড়, মধ্যমা ও প্রচুরক, পরিমিত ব্যবধান, কোরিলেশন, রিগ্রেশন এবং সম্ভাবনা (Probability)।',
      icon: BarChart3,
      badge: 'ডেটা বিশ্লেষণ',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      accentColor: 'from-indigo-500 to-blue-600',
      topicsCount: '৯+ পরিসংখ্যানিক সূত্র',
    },
    {
      id: 'student_practice' as ViewTab,
      subjectKey: 'practice',
      titleBn: '৮. প্র্যাকটিস ও ক্যালকুলেটর (Practice Lab)',
      titleEn: 'Academic Practice & Calculators',
      desc: 'সকল বিষয়ের প্রয়োজনীয় গাণিতিক ক্যালকুলেটর, ফর্মুলা শীট ও সমস্যা অনুশীলনী ল্যাব।',
      icon: Sparkles,
      badge: 'ইন্টারেক্টিভ ল্যাব',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentColor: 'from-emerald-600 to-teal-700',
      topicsCount: '১০+ লাইভ ক্যালকুলেটর',
    },
    {
      id: 'student_saved_problems' as ViewTab,
      subjectKey: 'saved',
      titleBn: '৯. সংরক্ষিত সমস্যা (Saved Problems)',
      titleEn: 'Personal Question Bank & Notes',
      desc: 'পরীক্ষার প্রস্তুতির জন্য আপনার নিজের সেভ করা গাণিতিক সমস্যা, কেস সমাধান ও রিভিশন নোট।',
      icon: Bookmark,
      badge: `${savedProblems.length}টি সেভ করা`,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      accentColor: 'from-amber-600 to-orange-700',
      topicsCount: 'ব্যক্তিগত প্রশ্নব্যাংক',
    },
    {
      id: 'student_study_history' as ViewTab,
      subjectKey: 'history',
      titleBn: '১০. অধ্যয়ন ইতিহাস (Study History)',
      titleEn: 'Learning Progress & Log',
      desc: 'আপনার বিগত দিনের পড়ার ইতিহাস, সমাধানকৃত সমস্যা এবং বিষয়ভিত্তিক পড়াশোনার অগ্রগতি লগ।',
      icon: History,
      badge: `${studyHistory.length}টি অ্যাক্টিভিটি`,
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      accentColor: 'from-slate-600 to-slate-800',
      topicsCount: 'অটোমেটিক স্টাডি লগ',
    },
  ];

  const filteredSections = activeSubjectFilter === 'all'
    ? academicSections
    : academicSections.filter((s) => s.subjectKey === activeSubjectFilter);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Academic Header & Student Welcome Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>সহজ ব্যবসা অ্যাকাডেমিক শিক্ষার্থী পোর্টাল (Academic Suite)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              স্বাগতম, {studentName}!
            </h1>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-emerald-400" />
                {institution}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                {department}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              বাণিজ্য শাখার শিক্ষার্থীদের জন্য একটি পূর্ণাঙ্গ অ্যাকাডেমিক ল্যাব — হিসাববিজ্ঞান, ফাইন্যান্স, অর্থনীতি,
              ব্যবসায়িক গণিত, কস্ট ও ম্যানেজমেন্ট অ্যাকাউন্টিং এবং পরিসংখ্যানের বিষয়ভিত্তিক থিওরি, ফর্মুলা ও প্র্যাকটিস।
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-2.5 shrink-0 bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10">
            <div className="text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">কোর বিষয়</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">৭ টি</span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">সংরক্ষিত সমস্যা</span>
              <span className="text-lg sm:text-xl font-black text-amber-300">{savedProblems.length} টি</span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">স্টাডি হিস্ট্রি</span>
              <span className="text-lg sm:text-xl font-black text-blue-300">{studyHistory.length} টি</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action / Direct Link Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('student_practice')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>প্র্যাকটিস ও ফর্মুলা ল্যাব</span>
          </button>
          <button
            onClick={() => onNavigate('student_saved_problems')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>সংরক্ষিত প্রশ্নব্যাংক ({savedProblems.length})</span>
          </button>
          <button
            onClick={() => onNavigate('student_study_history')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>পড়ার ইতিহাস ({studyHistory.length})</span>
          </button>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <span>প্রোফাইল সেটিংস</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. The 10 Academic Sections Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              প্রধান অ্যাকাডেমিক বিভাগসমূহ (Academic Modules)
            </h2>
            <p className="text-xs text-slate-500">
              যে বিষয়ের থিওরি, ফর্মুলা ও সমস্যা সমাধান অনুশীলন করতে চান সেটি নির্বাচন করুন
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 hidden sm:block">মোট ১০টি সেকশন</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                onClick={() => onNavigate(sec.id)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sec.accentColor} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sec.badgeColor}`}>
                      {sec.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {sec.titleBn}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">{sec.titleEn}</p>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-2">
                    {sec.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">{sec.topicsCount}</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>প্রবেশ করুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Saved Problems Preview & Recent Study History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Problems Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">সংরক্ষিত সমস্যা ও কেস</h3>
                  <p className="text-[10px] text-slate-500">আপনার ব্যক্তিগত প্রশ্নব্যাংক</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('student_saved_problems')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
              >
                সবগুলো দেখুন
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {savedProblems.slice(0, 3).map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => onNavigate('student_saved_problems')}
                  className="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                      {prob.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(prob.savedAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1.5 truncate">
                    {prob.topicTitle}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                    {prob.question}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('student_saved_problems')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            প্রশ্নব্যাংক ওপেন করুন ({savedProblems.length} টি সমস্যা)
          </button>
        </div>

        {/* Study History Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">অধ্যয়ন ইতিহাস ও অগ্রগতি লগ</h3>
                  <p className="text-[10px] text-slate-500">আপনার সাম্প্রতিক পড়াশোনা</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('student_study_history')}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                পূর্ণাঙ্গ হিস্ট্রি
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {studyHistory.slice(0, 3).map((hist) => (
                <div
                  key={hist.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-blue-700">
                      {hist.subject}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(hist.timestamp).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">
                    {hist.topicTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {hist.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('student_study_history')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            সম্পূর্ণ স্টাডি হিস্ট্রি দেখুন ({studyHistory.length} টি রেকর্ড)
          </button>
        </div>
      </div>

      {/* 5. Switch to Business Mode Shortcut */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center p-1 bg-white rounded-xl border border-emerald-200 shadow-2xs shrink-0">
            <img
              src="/assets/shohoj-bebsha-logo.png"
              alt="Shohoj Bebsha Logo"
              className="h-8 w-auto object-contain"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              বাস্তব ব্যবসা পরিচালনা করতে চান?
            </h4>
            <p className="text-[11px] text-slate-600">
              প্রোফাইল সেটিংস থেকে যেকোনো সময় 'ব্যবসায়ী মোড' (Business Mode)-এ সুইচ করে পণ্যের স্টক, সেলস ও ইনভয়েস পরিচালনা করতে পারবেন।
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="px-4 py-2 bg-white hover:bg-emerald-100/50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          মোড পরিবর্তন করুন
        </button>
      </div>
    </div>
  );
};
