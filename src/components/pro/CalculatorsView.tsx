import React, { useState } from 'react';
import { ProGate } from './ProGate';
import {
  Calculator,
  Percent,
  TrendingUp,
  DollarSign,
  PieChart,
  Tag,
  Scale,
  Package,
  Wallet,
} from 'lucide-react';

interface CalculatorsViewProps {
  onNavigateToUpgrade?: () => void;
}

type CalcType =
  | 'profit'
  | 'roi'
  | 'break_even'
  | 'pricing'
  | 'discount'
  | 'markup'
  | 'margin'
  | 'budget'
  | 'inventory_value';

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({ onNavigateToUpgrade }) => {
  const [activeCalc, setActiveCalc] = useState<CalcType>('profit');

  // 1. Profit Calculator State
  const [costPrice, setCostPrice] = useState<number>(500);
  const [sellingPrice, setSellingPrice] = useState<number>(750);
  const [profitQty, setProfitQty] = useState<number>(50);

  // 2. ROI Calculator State
  const [initialInvestment, setInitialInvestment] = useState<number>(100000);
  const [totalReturn, setTotalReturn] = useState<number>(145000);

  // 3. Break-even Calculator State
  const [fixedCosts, setFixedCosts] = useState<number>(30000);
  const [unitSellingPrice, setUnitSellingPrice] = useState<number>(1200);
  const [unitVariableCost, setUnitVariableCost] = useState<number>(800);

  // 4. Pricing Calculator State
  const [targetCost, setTargetCost] = useState<number>(600);
  const [desiredMargin, setDesiredMargin] = useState<number>(30); // 30%

  // 5. Discount Calculator State
  const [originalPrice, setOriginalPrice] = useState<number>(1500);
  const [discountPercent, setDiscountPercent] = useState<number>(15);

  // 6. Markup Calculator State
  const [markupBaseCost, setMarkupBaseCost] = useState<number>(400);
  const [markupPercent, setMarkupPercent] = useState<number>(40);

  // 7. Margin Calculator State
  const [marginRevenue, setMarginRevenue] = useState<number>(50000);
  const [marginCogs, setMarginCogs] = useState<number>(32000);

  // 8. Budget Calculator State
  const [projectedIncome, setProjectedIncome] = useState<number>(120000);
  const [rentExp, setRentExp] = useState<number>(20000);
  const [salariesExp, setSalariesExp] = useState<number>(45000);
  const [marketingExp, setMarketingExp] = useState<number>(15000);
  const [utilitiesExp, setUtilitiesExp] = useState<number>(8000);
  const [otherExp, setOtherExp] = useState<number>(5000);

  // 9. Inventory Value Calculator State
  const [invUnits, setInvUnits] = useState<number>(250);
  const [invUnitCost, setInvUnitCost] = useState<number>(450);
  const [invHoldingRate, setInvHoldingRate] = useState<number>(10); // 10%

  return (
    <ProGate
      featureTitle="৯টি স্মার্ট ব্যবসায়িক ক্যালকুলেটর (Business Calculators)"
      featureDescription="লাভ, আরওআই (ROI), ব্রেক-ইভেন পয়েন্ট, পণ্যের সঠিক মূল্য নির্ধারণ ও বাজেট ক্যালকুলেটর ব্যবহার করতে Shohoj Bebsha Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              ব্যবসায়িক ক্যালকুলেটর স্যুট (৯টি টুল)
            </h2>
            <p className="text-xs text-slate-500">
              নির্ভুল হিসাব, মুনাফার অনুপাত ও স্মার্ট প্রাইজ নির্ধারণের প্রয়োজনীয় সরঞ্জাম
            </p>
          </div>
        </div>

        {/* 9 Calculators Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'profit', label: 'লাভ ক্যালকুলেটর', icon: TrendingUp },
            { id: 'roi', label: 'ROI ক্যালকুলেটর', icon: DollarSign },
            { id: 'break_even', label: 'ব্রেক-ইভেন পয়েন্ট', icon: Scale },
            { id: 'pricing', label: 'মূল্য নির্ধারণ (Pricing)', icon: Tag },
            { id: 'discount', label: 'ডিসকাউন্ট হিসাব', icon: Percent },
            { id: 'markup', label: 'মার্কআপ (Markup)', icon: TrendingUp },
            { id: 'margin', label: 'মার্জিন ক্যালকুলেটর', icon: PieChart },
            { id: 'budget', label: 'বাজেট ও সেভিং', icon: Wallet },
            { id: 'inventory_value', label: 'স্টক সম্পদ ভ্যালু', icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCalc === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCalc(tab.id as CalcType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE CALCULATOR DISPLAY */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          {/* 1. PROFIT CALCULATOR */}
          {activeCalc === 'profit' && (() => {
            const unitProfit = sellingPrice - costPrice;
            const totalProfit = unitProfit * profitQty;
            const margin = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">মুনাফা ও মার্জিন ক্যালকুলেটর (Profit Calculator)</h3>
                  <p className="text-xs text-slate-500">একক ও সামগ্রিক লাভের পরিমাণ ও লাভের শতাংশ নির্ণয় করুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">একক ক্রয়মূল্য (Cost Price ৳)</label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">একক বিক্রয়মূল্য (Selling Price ৳)</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">বিক্রয়ের সংখ্যা (Quantity)</label>
                    <input
                      type="number"
                      value={profitQty}
                      onChange={(e) => setProfitQty(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">একক লাভ (Per Unit Profit)</span>
                    <p className={`text-2xl font-black mt-1 ${unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ৳{unitProfit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">সর্বমোট প্রত্যাশিত লাভ</span>
                    <p className={`text-2xl font-black mt-1 ${totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ৳{totalProfit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">মুনাফার হার (Profit Margin)</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{margin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. ROI CALCULATOR */}
          {activeCalc === 'roi' && (() => {
            const netReturn = totalReturn - initialInvestment;
            const roiPercent = initialInvestment > 0 ? (netReturn / initialInvestment) * 100 : 0;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">রিটার্ন অন ইনভেস্টমেন্ট (ROI Calculator)</h3>
                  <p className="text-xs text-slate-500">বিনিয়োগকৃত পুঁজির বিপরীতে কত শতাংশ মুনাফা আসল হিসাব করুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মোট বিনিয়োগকৃত পুঁজি (৳)</label>
                    <input
                      type="number"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মোট অর্জিত ফেরত / রিটার্ন (৳)</label>
                    <input
                      type="number"
                      value={totalReturn}
                      onChange={(e) => setTotalReturn(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <div>
                    <span className="text-xs text-blue-800 font-medium">নেট লাভ / ক্ষতি (Net Return)</span>
                    <p className={`text-2xl font-black mt-1 ${netReturn >= 0 ? 'text-blue-900' : 'text-rose-600'}`}>
                      ৳{netReturn.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-800 font-medium">ROI হার (Return on Investment)</span>
                    <p className={`text-2xl font-black mt-1 ${roiPercent >= 0 ? 'text-blue-900' : 'text-rose-600'}`}>
                      {roiPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. BREAK-EVEN CALCULATOR */}
          {activeCalc === 'break_even' && (() => {
            const contributionMargin = unitSellingPrice - unitVariableCost;
            const breakEvenUnits = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
            const breakEvenRevenue = breakEvenUnits * unitSellingPrice;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">ব্রেক-ইভেন পয়েন্ট ক্যালকুলেটর (Break-Even Point)</h3>
                  <p className="text-xs text-slate-500">লাভ বা ক্ষতিহীন অবস্থায় পৌঁছাতে কতটি পণ্য বা কত টাকার বিক্রি লাগবে</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">নির্দিষ্ট মাসিক খরচ (Fixed Costs ৳)</label>
                    <input
                      type="number"
                      value={fixedCosts}
                      onChange={(e) => setFixedCosts(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">একক বিক্রয়মূল্য (৳)</label>
                    <input
                      type="number"
                      value={unitSellingPrice}
                      onChange={(e) => setUnitSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">একক পরিবর্তনশীল খরচ (Variable Cost ৳)</label>
                    <input
                      type="number"
                      value={unitVariableCost}
                      onChange={(e) => setUnitVariableCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                  <div>
                    <span className="text-xs text-amber-800 font-medium">ব্রেক-ইভেন বিক্রয়ের পরিমাণ</span>
                    <p className="text-2xl font-black text-amber-950 mt-1">{breakEvenUnits} পিস পণ্য</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">খরচ সমান হতে এই পরিমাণ পণ্য বিক্রি করতে হবে</p>
                  </div>
                  <div>
                    <span className="text-xs text-amber-800 font-medium">ব্রেক-ইভেন রেভিনিউ</span>
                    <p className="text-2xl font-black text-amber-950 mt-1">৳{breakEvenRevenue.toLocaleString()}</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">শূন্য মুনাফা-শূন্য ক্ষতি বিক্রয় পরিমাণ</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 4. PRICING CALCULATOR */}
          {activeCalc === 'pricing' && (() => {
            const recommendedPrice = desiredMargin < 100 ? targetCost / (1 - desiredMargin / 100) : 0;
            const profitPerUnit = recommendedPrice - targetCost;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">সঠিক পণ্য মূল্য নির্ধারণ (Pricing Calculator)</h3>
                  <p className="text-xs text-slate-500">টার্গেট মার্জিন অর্জনে পণ্য কত টাকায় বিক্রি করা উচিত হিসাব করুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">পণ্যের ক্রয় ও মোট খরচ (Cost ৳)</label>
                    <input
                      type="number"
                      value={targetCost}
                      onChange={(e) => setTargetCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">প্রত্যাশিত গ্রস মার্জিন (%)</label>
                    <input
                      type="number"
                      max="99"
                      value={desiredMargin}
                      onChange={(e) => setDesiredMargin(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">প্রস্তাবিত খুচরা বিক্রয়মূল্য (MRP)</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">৳{Math.round(recommendedPrice).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">একক প্রতি নগদ লাভ</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">৳{Math.round(profitPerUnit).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5. DISCOUNT CALCULATOR */}
          {activeCalc === 'discount' && (() => {
            const savings = (originalPrice * discountPercent) / 100;
            const finalPrice = Math.max(0, originalPrice - savings);

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">ডিসকাউন্ট হিসাব (Discount Calculator)</h3>
                  <p className="text-xs text-slate-500">বিশেষ অফার বা ছাড়ের পর চূড়ান্ত মূল্য ও সাশ্রয় জানুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">আসল মূল্য (Original Price ৳)</label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ছাড় বা ডিসকাউন্টের হার (%)</label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-purple-50 rounded-2xl border border-purple-100">
                  <div>
                    <span className="text-xs text-purple-800 font-medium">ডিসকাউন্ট পরবর্তী মূল্য (Final Price)</span>
                    <p className="text-2xl font-black text-purple-900 mt-1">৳{Math.round(finalPrice).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-purple-800 font-medium">গ্রাহকের সাশ্রয় (Discount Amount)</span>
                    <p className="text-2xl font-black text-purple-900 mt-1">৳{Math.round(savings).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 6. MARKUP CALCULATOR */}
          {activeCalc === 'markup' && (() => {
            const markupAmount = (markupBaseCost * markupPercent) / 100;
            const markupSelling = markupBaseCost + markupAmount;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">মার্কআপ ক্যালকুলেটর (Markup Calculator)</h3>
                  <p className="text-xs text-slate-500">ক্রয়মূল্যের ওপর নির্দিষ্ট শতাংশ বাড়িয়ে বিক্রয়মূল্য নির্ধারণ</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ক্রয়মূল্য (Cost Price ৳)</label>
                    <input
                      type="number"
                      value={markupBaseCost}
                      onChange={(e) => setMarkupBaseCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মার্কআপ শতাংশ (Markup %)</label>
                    <input
                      type="number"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-teal-50 rounded-2xl border border-teal-100">
                  <div>
                    <span className="text-xs text-teal-800 font-medium">নির্ধারিত বিক্রয়মূল্য</span>
                    <p className="text-2xl font-black text-teal-900 mt-1">৳{Math.round(markupSelling).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-teal-800 font-medium">যোগকৃত অর্থ (Markup Amount)</span>
                    <p className="text-2xl font-black text-teal-900 mt-1">৳{Math.round(markupAmount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 7. MARGIN CALCULATOR */}
          {activeCalc === 'margin' && (() => {
            const gross = marginRevenue - marginCogs;
            const marginPct = marginRevenue > 0 ? (gross / marginRevenue) * 100 : 0;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">গ্রস মার্জিন ক্যালকুলেটর (Margin Calculator)</h3>
                  <p className="text-xs text-slate-500">বিক্রিত পণ্যের ক্রয়ব্যয় বাদ দিয়ে মার্জিন শতাংশ জানুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মোট বিক্রয় রেভিনিউ (৳)</label>
                    <input
                      type="number"
                      value={marginRevenue}
                      onChange={(e) => setMarginRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মোট বিক্রীত পণ্যের খরচ (COGS ৳)</label>
                    <input
                      type="number"
                      value={marginCogs}
                      onChange={(e) => setMarginCogs(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <div>
                    <span className="text-xs text-blue-800 font-medium">গ্রস মুনাফা (Gross Profit)</span>
                    <p className="text-2xl font-black text-blue-900 mt-1">৳{gross.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-800 font-medium">গ্রস মার্জিন</span>
                    <p className="text-2xl font-black text-blue-900 mt-1">{marginPct.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 8. BUDGET CALCULATOR */}
          {activeCalc === 'budget' && (() => {
            const totalBudgetExp = rentExp + salariesExp + marketingExp + utilitiesExp + otherExp;
            const surplus = projectedIncome - totalBudgetExp;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">মাসিক ব্যবসায়িক বাজেট (Budget Calculator)</h3>
                  <p className="text-xs text-slate-500">প্রত্যাশিত আয় ও বিভিন্ন ব্যয়ের প্ল্যান সাজিয়ে উদ্বৃত্ত নির্ণয় করুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">প্রত্যাশিত আয় (৳)</label>
                    <input
                      type="number"
                      value={projectedIncome}
                      onChange={(e) => setProjectedIncome(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">দোকান / অফিস ভাড়া (৳)</label>
                    <input
                      type="number"
                      value={rentExp}
                      onChange={(e) => setRentExp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">কর্মচারী বেতন (৳)</label>
                    <input
                      type="number"
                      value={salariesExp}
                      onChange={(e) => setSalariesExp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মার্কেটিং ও প্রচার (৳)</label>
                    <input
                      type="number"
                      value={marketingExp}
                      onChange={(e) => setMarketingExp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">বিদ্যুৎ ও ইউটিলিটি (৳)</label>
                    <input
                      type="number"
                      value={utilitiesExp}
                      onChange={(e) => setUtilitiesExp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">বিবিধ খরচ (৳)</label>
                    <input
                      type="number"
                      value={otherExp}
                      onChange={(e) => setOtherExp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-xs text-slate-600 font-medium">মোট পরিকল্পিত ব্যয়</span>
                    <p className="text-2xl font-black text-rose-600 mt-1">৳{totalBudgetExp.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 font-medium">প্রত্যাশিত নেট সঞ্চয় / উদ্বৃত্ত</span>
                    <p className={`text-2xl font-black mt-1 ${surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ৳{surplus.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 9. INVENTORY VALUE CALCULATOR */}
          {activeCalc === 'inventory_value' && (() => {
            const rawValue = invUnits * invUnitCost;
            const holdingCost = (rawValue * invHoldingRate) / 100;
            const totalCarryingCost = rawValue + holdingCost;

            return (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">ইনভেন্টরি সম্পদ ও হোল্ডিং খরচ (Inventory Valuation)</h3>
                  <p className="text-xs text-slate-500">গুদামে থাকা পণ্যের মোট মূল্য ও গুদামজাতকরণ খরচ পরিমাপ করুন</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">মোট পণ্য সংখ্যা (Units)</label>
                    <input
                      type="number"
                      value={invUnits}
                      onChange={(e) => setInvUnits(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">একক ক্রয়মূল্য (৳)</label>
                    <input
                      type="number"
                      value={invUnitCost}
                      onChange={(e) => setInvUnitCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">বার্ষিক হোল্ডিং খরচ (%)</label>
                    <input
                      type="number"
                      value={invHoldingRate}
                      onChange={(e) => setInvHoldingRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">ইনভেন্টরি নিট ক্রয়মূল্য সম্পদ</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">৳{rawValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">আনুমানিক গুদামজাতকরণ ও হোল্ডিং খরচ</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">৳{Math.round(holdingCost).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </ProGate>
  );
};
