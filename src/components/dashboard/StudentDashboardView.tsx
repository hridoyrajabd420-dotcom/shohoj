import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ViewTab } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import {
  GraduationCap,
  BookOpen,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Landmark,
  ArrowRight,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface StudentDashboardViewProps {
  onNavigate: (tab: ViewTab) => void;
  onOpenSaleModal?: () => void;
  onOpenProductModal?: () => void;
  onOpenExpenseModal?: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  onNavigate,
  onOpenSaleModal,
  onOpenProductModal,
  onOpenExpenseModal,
}) => {
  const { profile } = useAuth();
  const { sales, expenses, products, customers, fixedAssets } = useData();

  const [activeFormulaTab, setActiveFormulaTab] = useState<'pnl' | 'depr' | 'cogs' | 'markup'>('pnl');

  // Compute live metrics from practical learning ledger
  const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalProductsCount = products.length;
  const totalCustomersCount = customers.length;
  const totalAssetsCount = fixedAssets.length;

  // Learning Modules / Practical Accounting Cases
  const accountingTopics = [
    {
      titleBn: 'লাভ-ক্ষতি ও মার্জিন বিশ্লেষণ',
      titleEn: 'Profit & Loss (P&L) Statement',
      desc: 'বিক্রয়, COGS (বিক্রিত পণ্যের ব্যয়), গ্রস প্রফিট ও নিট মুনাফার সমীকরণ বুঝুন।',
      icon: DollarSign,
      tab: 'financials' as ViewTab,
      badge: 'কোর অ্যাকাউন্টিং',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      titleBn: 'স্থায়ী সম্পদ ও অবচয় গণনা',
      titleEn: 'CapEx & Depreciation Accounting',
      desc: 'সরলরৈখিক (Straight-Line) অবচয় পদ্ধতি, ভগ্নাবশেষ মূল্য (Salvage Value) ও পুস্তক মূল্য (Net Book Value)।',
      icon: Landmark,
      tab: 'fixed_assets' as ViewTab,
      badge: 'CapEx বনাম OpEx',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      titleBn: 'ইনভেন্টরি মূল্যায়ন ও স্টক হিসাব',
      titleEn: 'Inventory & Purchases Ledger',
      desc: 'পণ্য ক্রয়, বিক্রয়মূল্য বনাম ক্রয়মূল্য, রি-অর্ডার লেভেল এবং স্টক ট্র্যাকিং।',
      icon: Package,
      tab: 'products' as ViewTab,
      badge: 'ইনভেন্টরি কন্ট্রোল',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      titleBn: 'ব্যবসায়িক ক্যালকুলেটর স্যুট',
      titleEn: 'Financial Formula Practice',
      desc: 'ব্রেক-ইভেন পয়েন্ট (BEP), মার্কআপ বনাম মার্জিন, আরওআই (ROI) এবং ক্যাশ ফ্লো ক্যালকুলেটর।',
      icon: Calculator,
      tab: 'calculators' as ViewTab,
      badge: 'ইন্টারেক্টিভ টুলস',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      titleBn: 'আর্থিক প্রতিবেদন ও ব্যালেন্স শীট',
      titleEn: 'Financial Statements & Reports',
      desc: 'ব্যালেন্স শীট, ক্যাশ ফ্লো সারাংশ এবং পর্যায়ভিত্তিক প্রতিবেদন এক্সপোর্ট।',
      icon: FileSpreadsheet,
      tab: 'reports' as ViewTab,
      badge: 'রিপোর্টিং',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      titleBn: 'গ্রাহক দেনাদার ও পাওনাদার খাতা',
      titleEn: 'Receivables & Payables Ledger',
      desc: 'বকেয়া হিসাব, প্রাপ্য ও প্রদেয় খাতা এবং নগদান সমীকরণ।',
      icon: Users,
      tab: 'customers' as ViewTab,
      badge: 'লেজার ম্যানেজমেন্ট',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Student Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-emerald-100 text-xs font-semibold mb-4">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>শিক্ষার্থী মোড • অ্যাকাউন্টিং ও বিজনেস ল্যাব (Student Learning Lab)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            স্বাগতম, {profile?.full_name || 'শিক্ষার্থী'}!
          </h1>

          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            {profile?.institution_name ? (
              <span>
                প্রতিষ্ঠান: <strong className="text-white">{profile.institution_name}</strong>
                {profile.field_of_study && <span> • বিভাগ: <strong className="text-white">{profile.field_of_study}</strong></span>}
              </span>
            ) : (
              'সহজ ব্যবসা ল্যাবে বাস্তব অ্যাকাউন্টিং, জার্নাল, লেজার, লাভ-ক্ষতি ও স্থায়ী সম্পদের হিসাব প্র্যাকটিস করুন।'
            )}
          </p>

          {/* Quick Practice Actions */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('financials')}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>লাভ-ক্ষতি বিবরণী দেখুন (P&L)</span>
            </button>

            <button
              onClick={() => onNavigate('fixed_assets')}
              className="px-4 py-2 bg-emerald-900/60 hover:bg-emerald-900/80 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-emerald-300" />
              <span>অবচয় ও স্থায়ী সম্পদ খাতা (CapEx)</span>
            </button>

            <button
              onClick={() => onNavigate('calculators')}
              className="px-4 py-2 bg-emerald-900/60 hover:bg-emerald-900/80 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-emerald-300" />
              <span>ব্যবসায়িক ক্যালকুলেটর</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Live Hands-on Project Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>আপনার প্র্যাকটিস প্রজেক্ট সারসংক্ষেপ (Hands-on Ledger Summary)</span>
          </h2>
          <span className="text-xs text-slate-500">রিয়েল-টাইম এন্ট্রি সংখ্যা</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">মোট বিক্রয় আয়</span>
            <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(totalSalesRevenue)}</p>
            <span className="text-[10px] text-emerald-600 font-medium">{sales.length}টি বিক্রয় এন্ট্রি</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">মোট পরিচালন ব্যয়</span>
            <p className="text-lg font-black text-rose-600 mt-1">{formatCurrency(totalOperatingExpenses)}</p>
            <span className="text-[10px] text-slate-500 font-medium">{expenses.length}টি খরচ এন্ট্রি</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">নিবন্ধিত পণ্য ক্যাটালগ</span>
            <p className="text-lg font-black text-slate-900 mt-1">{totalProductsCount}টি পণ্য</p>
            <span className="text-[10px] text-slate-500 font-medium">ইনভেন্টরি আইটেম</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">গ্রাহক ও বাকি খাতা</span>
            <p className="text-lg font-black text-slate-900 mt-1">{totalCustomersCount} জন</p>
            <span className="text-[10px] text-slate-500 font-medium">প্রাপ্য হিসাব</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 block">স্থায়ী সম্পদ (CapEx)</span>
            <p className="text-lg font-black text-slate-900 mt-1">{totalAssetsCount}টি সম্পদ</p>
            <span className="text-[10px] text-indigo-600 font-medium">অবচয় কার্যকর</span>
          </div>
        </div>
      </div>

      {/* 3. Core Accounting Learning Modules */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>অ্যাকাউন্টিং মডিউল ও প্র্যাকটিস ল্যাব (Accounting Learning Modules)</span>
          </h2>
          <span className="text-xs text-slate-500">সরাসরি ডেটা এন্ট্রি ও বিশ্লেষণ করুন</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountingTopics.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(topic.tab)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${topic.color}`}>
                      {topic.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {topic.titleBn}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{topic.titleEn}</p>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {topic.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>অনুশীলন শুরু করুন</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Accounting Formula Guide for Students */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>প্রয়োজনীয় অ্যাকাউন্টিং ও ব্যবসায়িক সূত্রাবলি (Key Accounting Formulas)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              পরীক্ষা, অ্যাসাইনমেন্ট ও বাস্তব ব্যবসার হিসাব রাখার মৌলিক সূত্রসমূহ
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveFormulaTab('pnl')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormulaTab === 'pnl' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              লাভ-ক্ষতি (P&L)
            </button>
            <button
              onClick={() => setActiveFormulaTab('depr')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormulaTab === 'depr' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              অবচয় (Depreciation)
            </button>
            <button
              onClick={() => setActiveFormulaTab('cogs')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormulaTab === 'cogs' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              COGS ও স্টক
            </button>
            <button
              onClick={() => setActiveFormulaTab('markup')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormulaTab === 'markup' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              মার্জিন বনাম মার্কআপ
            </button>
          </div>
        </div>

        {/* Formula Details */}
        {activeFormulaTab === 'pnl' && (
          <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs text-slate-700">
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-emerald-800 font-bold">
              গ্রস প্রফিট (Gross Profit) = মোট বিক্রয় (Total Sales) − বিক্রিত পণ্যের ব্যয় (COGS)
            </div>
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-emerald-800 font-bold">
              নিট লাভ (Net Profit) = গ্রস প্রফিট − পরিচালন ব্যয় (OpEx) − অবচয় খরচ (Depreciation)
            </div>
            <p className="text-slate-500 pt-1">
              • মূলধনী ব্যয় (CapEx) একবারে পরিচালন ব্যয়ে অন্তর্ভুক্ত হয় না, বরং অবচয়ের মাধ্যমে সময়ের সাথে সাথে চার্জ করা হয়।
            </p>
          </div>
        )}

        {activeFormulaTab === 'depr' && (
          <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs text-slate-700">
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-indigo-800 font-bold">
              মাসিক অবচয় (Monthly Depreciation) = (ক্রয়মূল্য − ভগ্নাবশেষ মূল্য) ÷ আয়ুষ্কাল (মাসে)
            </div>
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-indigo-800 font-bold">
              পুস্তক মূল্য (Net Book Value) = ক্রয়মূল্য − পুঞ্জীভূত অবচয় (Accumulated Depreciation)
            </div>
            <p className="text-slate-500 pt-1">
              • পুঞ্জীভূত অবচয় বাদ দেওয়ার পর নিট বুক ভ্যালু কখনোই ভগ্নাবশেষ মূল্যের (Salvage Value) নিচে নামতে পারবে না।
            </p>
          </div>
        )}

        {activeFormulaTab === 'cogs' && (
          <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs text-slate-700">
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-purple-800 font-bold">
              COGS = প্রারম্ভিক স্টক + ক্রয়কৃত পণ্যের ব্যয় − সমাপনী স্টক
            </div>
            <p className="text-slate-500 pt-1">
              • সহজ ব্যবসায় প্রতিটি বিক্রয়ের সাথে সাথে সংশ্লিষ্ট পণ্যের ক্রয়মূল্যের ভিত্তিতে তাৎক্ষণিকভাবে COGS স্বয়ংক্রিয়ভাবে হিসাব হয়।
            </p>
          </div>
        )}

        {activeFormulaTab === 'markup' && (
          <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs text-slate-700">
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-amber-900 font-bold">
              প্রফিট মার্জিন (%) = (লাভ ÷ বিক্রয়মূল্য) × ১০০
            </div>
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-amber-900 font-bold">
              মার্কআপ (%) = (লাভ ÷ ক্রয়মূল্য) × ১০০
            </div>
            <p className="text-slate-500 pt-1">
              • ক্রয়মূল্য ১০০ টাকা এবং বিক্রয়মূল্য ১২৫ টাকা হলে: লাভ ২৫ টাকা, মার্কআপ ২৫%, কিন্তু মার্জিন ২০%।
            </p>
          </div>
        )}
      </div>

      {/* 5. Switch to Business Mode Shortcut */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            সহ
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              বাস্তব ব্যবসা পরিচালনা করতে চান?
            </h4>
            <p className="text-[11px] text-slate-600">
              আপনি যেকোনো সময় আপনার প্রোফাইল সেটিংস থেকে 'ব্যবসা মোড' (Business Mode)-এ সুইচ করতে পারবেন।
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          প্রোফাইল সেটিংস
        </button>
      </div>
    </div>
  );
};
