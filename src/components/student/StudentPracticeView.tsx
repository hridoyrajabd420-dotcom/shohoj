import React, { useState } from 'react';
import { ViewTab } from '../../types';
import { useStudent } from '../../context/StudentContext';
import {
  Calculator,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface StudentPracticeViewProps {
  onNavigate: (tab: ViewTab) => void;
}

export const StudentPracticeView: React.FC<StudentPracticeViewProps> = ({ onNavigate }) => {
  const { saveCalculation, saveProblem } = useStudent();

  const [activeTab, setActiveTab] = useState<'bep' | 'tvm' | 'markup' | 'interest'>('bep');
  const [calcNotice, setCalcNotice] = useState<string | null>(null);

  // 1. Break-Even Calculator state
  const [bepFixedCost, setBepFixedCost] = useState('50000');
  const [bepSellingPrice, setBepSellingPrice] = useState('100');
  const [bepVariableCost, setBepVariableCost] = useState('60');

  // 2. TVM (Compound FV) Calculator state
  const [tvmPrincipal, setTvmPrincipal] = useState('10000');
  const [tvmRate, setTvmRate] = useState('10');
  const [tvmYears, setTvmYears] = useState('5');

  // 3. Markup vs Margin state
  const [markupCost, setMarkupCost] = useState('400');
  const [markupSellingPrice, setMarkupSellingPrice] = useState('500');

  // 4. Simple Interest state
  const [siPrincipal, setSiPrincipal] = useState('20000');
  const [siRate, setSiRate] = useState('8');
  const [siYears, setSiYears] = useState('3');

  // Calculations
  const fc = parseFloat(bepFixedCost) || 0;
  const sp = parseFloat(bepSellingPrice) || 0;
  const vc = parseFloat(bepVariableCost) || 0;
  const cmPerUnit = Math.max(0, sp - vc);
  const cmRatio = sp > 0 ? (cmPerUnit / sp) * 100 : 0;
  const bepUnits = cmPerUnit > 0 ? fc / cmPerUnit : 0;
  const bepRevenue = bepUnits * sp;

  // TVM
  const pv = parseFloat(tvmPrincipal) || 0;
  const r = (parseFloat(tvmRate) || 0) / 100;
  const n = parseFloat(tvmYears) || 0;
  const fv = pv * Math.pow(1 + r, n);
  const totalInterestEarned = fv - pv;

  // Markup
  const cost = parseFloat(markupCost) || 0;
  const price = parseFloat(markupSellingPrice) || 0;
  const profit = price - cost;
  const markupPercent = cost > 0 ? (profit / cost) * 100 : 0;
  const marginPercent = price > 0 ? (profit / price) * 100 : 0;

  // Simple interest
  const sip = parseFloat(siPrincipal) || 0;
  const sir = (parseFloat(siRate) || 0) / 100;
  const sit = parseFloat(siYears) || 0;
  const simpleInterest = sip * sir * sit;
  const totalWithInterest = sip + simpleInterest;

  const handleSaveCurrentCalc = async () => {
    if (activeTab === 'bep') {
      await saveCalculation({
        subject: 'Cost Accounting',
        topicTitle: 'ব্রেক-ইভেন পয়েন্ট (Break-Even Point)',
        formulaUsed: 'BEP Units = Fixed Cost / (SP - VC)',
        inputs: { 'স্থির ব্যয়': `৳${fc}`, 'একক বিক্রয়মূল্য': `৳${sp}`, 'একক পরিবর্তনশীল ব্যয়': `৳${vc}` },
        result: { 'ব্রেক-ইভেন একক': `${Math.round(bepUnits)} ইউনিট`, 'ব্রেক-ইভেন বিক্রয়': `৳${Math.round(bepRevenue)}` },
        summary: `BEP: ${Math.round(bepUnits)} ইউনিট (৳${Math.round(bepRevenue)})`,
      });
      setCalcNotice('ব্রেক-ইভেন হিসাব সফলভাবে আপনার স্টাডি ইতিহাসে সেভ হয়েছে!');
    } else if (activeTab === 'tvm') {
      await saveCalculation({
        subject: 'Finance',
        topicTitle: 'অর্থের ভবিষ্যৎ মূল্য (Future Value)',
        formulaUsed: 'FV = PV * (1 + r)^n',
        inputs: { 'বর্তমান মূল্য (PV)': `৳${pv}`, 'সুদের হার': `${tvmRate}%`, 'মেয়াদ': `${n} বছর` },
        result: { 'ভবিষ্যৎ মূল্য (FV)': `৳${Math.round(fv)}`, 'মোট সুদ': `৳${Math.round(totalInterestEarned)}` },
        summary: `FV: ৳${Math.round(fv)} (সুদ: ৳${Math.round(totalInterestEarned)})`,
      });
      setCalcNotice('ভবিষ্যৎ মূল্যের হিসাব সফলভাবে সেভ হয়েছে!');
    } else if (activeTab === 'markup') {
      await saveCalculation({
        subject: 'Business Math',
        topicTitle: 'মার্কআপ ও প্রফিট মার্জিন',
        formulaUsed: 'Markup = (Profit/Cost)*100, Margin = (Profit/Price)*100',
        inputs: { 'ক্রয়মূল্য': `৳${cost}`, 'বিক্রয়মূল্য': `৳${price}` },
        result: { 'নিট মুনাফা': `৳${profit}`, 'মার্কআপ হার': `${markupPercent.toFixed(1)}%`, 'প্রফিট মার্জিন': `${marginPercent.toFixed(1)}%` },
        summary: `মুনাফা: ৳${profit} (মার্কআপ: ${markupPercent.toFixed(1)}%, মার্জিন: ${marginPercent.toFixed(1)}%)`,
      });
      setCalcNotice('মার্কআপ ও মার্জিন হিসাব সেভ হয়েছে!');
    } else {
      await saveCalculation({
        subject: 'Business Math',
        topicTitle: 'সরল সুদ ও সুদাসল (Simple Interest)',
        formulaUsed: 'I = P * r * t',
        inputs: { 'আসল (P)': `৳${sip}`, 'সুদের হার (r)': `${siRate}%`, 'মেয়াদ (t)': `${sit} বছর` },
        result: { 'মোট সুদ (I)': `৳${Math.round(simpleInterest)}`, 'সুদাসল': `৳${Math.round(totalWithInterest)}` },
        summary: `সুদ: ৳${Math.round(simpleInterest)}, সুদাসল: ৳${Math.round(totalWithInterest)}`,
      });
      setCalcNotice('সরল সুদ হিসাব সেভ হয়েছে!');
    }

    setTimeout(() => setCalcNotice(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <button
            onClick={() => onNavigate('student_dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>শিক্ষার্থী ড্যাশবোর্ডে ফিরে যান</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ৮. প্র্যাকটিস ও অ্যাকাডেমিক ক্যালকুলেটর (Practice Lab)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              ইন্টারেক্টিভ ল্যাব
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            বাণিজ্য শাখার শিক্ষার্থীদের জন্য দ্রুত গাণিতিক হিসাব ও সমীকরণ যাচাইয়ের ভার্চুয়াল ক্যালকুলেটর।
          </p>
        </div>

        <button
          onClick={() => onNavigate('student_saved_problems')}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-600" />
          <span>সংরক্ষিত প্রশ্নব্যাংক</span>
        </button>
      </div>

      {calcNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{calcNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('bep')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'bep'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          ব্রেক-ইভেন পয়েন্ট (BEP)
        </button>
        <button
          onClick={() => setActiveTab('tvm')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'tvm'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          অর্থের ভবিষ্যৎ মূল্য (TVM / FV)
        </button>
        <button
          onClick={() => setActiveTab('markup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'markup'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          মার্কআপ বনাম প্রফিট মার্জিন
        </button>
        <button
          onClick={() => setActiveTab('interest')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'interest'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          সরল সুদ ও সুদাসল (Simple Interest)
        </button>
      </div>

      {/* Calculator Body */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* 1. BEP */}
        {activeTab === 'bep' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ব্রেক-ইভেন একক ও বিক্রয় নির্ণয় (Break-Even Calculator)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                কস্ট অ্যাকাউন্টিং ও ম্যানেজমেন্ট অ্যাকাউন্টিং এর জন্য স্থির ব্যয় এবং পরিবর্তনশীল ব্যয়ের ভিত্তিতে ব্রেক-ইভেন হিসাব।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোট স্থির ব্যয় (Fixed Cost - Tk)
                </label>
                <input
                  type="number"
                  value={bepFixedCost}
                  onChange={(e) => setBepFixedCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  একক প্রতি বিক্রয়মূল্য (Selling Price - Tk)
                </label>
                <input
                  type="number"
                  value={bepSellingPrice}
                  onChange={(e) => setBepSellingPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  একক প্রতি পরিবর্তনশীল ব্যয় (Variable Cost - Tk)
                </label>
                <input
                  type="number"
                  value={bepVariableCost}
                  onChange={(e) => setBepVariableCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">কন্ট্রিবিউশন মার্জিন (CM)</span>
                <span className="text-base sm:text-lg font-black text-slate-900">৳{cmPerUnit.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 block">প্রতি একক</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">সিএম অনুপাত (CM Ratio)</span>
                <span className="text-base sm:text-lg font-black text-slate-900">{cmRatio.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-500 block">বিক্রয়ের শতকরা হার</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">ব্রেক-ইভেন একক (BEP Units)</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">{Math.round(bepUnits).toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">একক পণ্য</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">ব্রেক-ইভেন বিক্রয় (BEP Sales)</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">৳{Math.round(bepRevenue).toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">মোট টাকা</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. TVM */}
        {activeTab === 'tvm' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                অর্থের ভবিষ্যৎ মূল্য ক্যালকুলেটর (Future Value / Compound Interest)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ফাইন্যান্স ও ব্যাংকিং এর মূল সূত্র: FV = PV × (1 + r)^n
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বর্তমান বিনিয়োগ / মূলধন (Present Value - Tk)
                </label>
                <input
                  type="number"
                  value={tvmPrincipal}
                  onChange={(e) => setTvmPrincipal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বার্ষিক সুদের হার (Annual Interest Rate - %)
                </label>
                <input
                  type="number"
                  value={tvmRate}
                  onChange={(e) => setTvmRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মেয়াদ (Number of Years - n)
                </label>
                <input
                  type="number"
                  value={tvmYears}
                  onChange={(e) => setTvmYears(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50/60 rounded-xl border border-blue-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-800 block">মূলধন (Principal)</span>
                <span className="text-base sm:text-lg font-black text-slate-900">৳{pv.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-800 block">মোট চক্রবৃদ্ধি সুদ অর্জিত</span>
                <span className="text-base sm:text-lg font-black text-emerald-600">৳{Math.round(totalInterestEarned).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-800 block">চূড়ান্ত ভবিষ্যৎ মূল্য (FV)</span>
                <span className="text-base sm:text-lg font-black text-blue-700">৳{Math.round(fv).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Markup */}
        {activeTab === 'markup' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                মার্কআপ বনাম প্রফিট মার্জিন তুলনা (Markup vs Margin)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                বাণিজ্য শাখার একটি সাধারণ বিভ্রান্তি: মার্কআপ ক্রয়মূল্যের ওপর এবং মার্জিন বিক্রয়মূল্যের ওপর হিসাব করা হয়।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্রয়মূল্য / উৎপাদন খরচ (Cost - Tk)
                </label>
                <input
                  type="number"
                  value={markupCost}
                  onChange={(e) => setMarkupCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিক্রয়মূল্য (Selling Price - Tk)
                </label>
                <input
                  type="number"
                  value={markupSellingPrice}
                  onChange={(e) => setMarkupSellingPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 block">মোট নিট লাভ (Profit)</span>
                <span className="text-base sm:text-lg font-black text-slate-900">৳{profit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 block">মার্কআপ শতাংশ (Markup %)</span>
                <span className="text-base sm:text-lg font-black text-amber-700">{markupPercent.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-500 block">(লাভ ÷ ক্রয়মূল্য) × ১০০</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 block">প্রফিট মার্জিন (Margin %)</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">{marginPercent.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-500 block">(লাভ ÷ বিক্রয়মূল্য) × ১০০</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Simple Interest */}
        {activeTab === 'interest' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                সরল সুদ ও সুদাসল ক্যালকুলেটর (Simple Interest)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                বিজনেস গণিত ও কমার্স ফাউন্ডেশনের মূল সূত্র: I = P × r × t
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আসল মূলধন (Principal - P)
                </label>
                <input
                  type="number"
                  value={siPrincipal}
                  onChange={(e) => setSiPrincipal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সুদের হার (Rate of Interest - r %)
                </label>
                <input
                  type="number"
                  value={siRate}
                  onChange={(e) => setSiRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সময়কাল (Time in Years - t)
                </label>
                <input
                  type="number"
                  value={siYears}
                  onChange={(e) => setSiYears(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-teal-50/60 rounded-xl border border-teal-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-800 block">আসল (Principal)</span>
                <span className="text-base sm:text-lg font-black text-slate-900">৳{sip.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-800 block">মোট অর্জিত সুদ (I)</span>
                <span className="text-base sm:text-lg font-black text-emerald-600">৳{Math.round(simpleInterest).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-800 block">মোট সুদাসল (Total Amount)</span>
                <span className="text-base sm:text-lg font-black text-teal-800">৳{Math.round(totalWithInterest).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            এই হিসাবটি আপনার ব্যক্তিগত শিক্ষার্থী স্টাডি লগে সংরক্ষণ করে রাখতে পারবেন।
          </p>

          <button
            type="button"
            onClick={handleSaveCurrentCalc}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>এই হিসাবটি সেভ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
