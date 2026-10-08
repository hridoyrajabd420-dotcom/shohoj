import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ProGate } from './ProGate';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FinancialsViewProps {
  onNavigateToUpgrade?: () => void;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({ onNavigateToUpgrade }) => {
  const { sales, expenses, products } = useData();

  const [timeRange, setTimeRange] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');

  // Filtered sales and expenses
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filterDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (timeRange === 'this_month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (timeRange === 'last_month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
      }
      if (timeRange === 'this_year') {
        return d.getFullYear() === currentYear;
      }
      return true; // 'all'
    };

    return {
      filteredSales: sales.filter((s) => filterDate(s.sale_date)),
      filteredExpenses: expenses.filter((e) => filterDate(e.date)),
    };
  }, [sales, expenses, timeRange]);

  // Financial Calculations
  const calculations = useMemo(() => {
    const grossSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

    // COGS
    const prodCostMap = new Map<string, number>();
    products.forEach((p) => prodCostMap.set(p.id, Number(p.purchase_price || 0)));

    let totalCogs = 0;
    filteredSales.forEach((s) => {
      if (s.product_id && prodCostMap.has(s.product_id)) {
        totalCogs += Number(s.quantity || 0) * (prodCostMap.get(s.product_id) || 0);
      }
    });

    const grossProfit = grossSales - totalCogs;
    const grossMargin = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;

    // Expenses breakdown
    const expByCategory: Record<string, number> = {};
    let totalOperatingExpenses = 0;
    filteredExpenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      totalOperatingExpenses += amt;
      expByCategory[e.category] = (expByCategory[e.category] || 0) + amt;
    });

    const netProfit = grossProfit - totalOperatingExpenses;
    const netMargin = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

    return {
      grossSales,
      totalCogs,
      grossProfit,
      grossMargin,
      totalOperatingExpenses,
      expByCategory,
      netProfit,
      netMargin,
    };
  }, [filteredSales, filteredExpenses, products]);

  // Monthly Comparison Chart Data (Last 6 Months)
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { month: string; revenue: number; cogs: number; expenses: number; netProfit: number } } = {};

    const monthNames = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = {
        month: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
        revenue: 0,
        cogs: 0,
        expenses: 0,
        netProfit: 0,
      };
    }

    const prodCostMap = new Map<string, number>();
    products.forEach((p) => prodCostMap.set(p.id, Number(p.purchase_price || 0)));

    sales.forEach((s) => {
      const key = s.sale_date.slice(0, 7);
      if (months[key]) {
        const amt = Number(s.total_amount || 0);
        months[key].revenue += amt;
        if (s.product_id && prodCostMap.has(s.product_id)) {
          months[key].cogs += Number(s.quantity || 0) * (prodCostMap.get(s.product_id) || 0);
        }
      }
    });

    expenses.forEach((e) => {
      const key = e.date.slice(0, 7);
      if (months[key]) {
        months[key].expenses += Number(e.amount || 0);
      }
    });

    return Object.values(months).map((m) => ({
      ...m,
      netProfit: m.revenue - m.cogs - m.expenses,
    }));
  }, [sales, expenses, products]);

  return (
    <ProGate
      featureTitle="অ্যাডভান্সড লাভ-ক্ষতি ও আর্থিক ব্যবস্থাপনা (Profit & Loss)"
      featureDescription="পূর্ণাঙ্গ লাভ-ক্ষতি স্টেটমেন্ট, গ্রস ও নেট মার্জিন বিশ্লেষণ, মাসভিত্তিক আর্থিক তুলনা এবং রেভিনিউ ব্রেকডাউন দেখতে Shohoj Bebsha Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
      previewMode={false}
    >
      <div className="space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              লাভ-ক্ষতি বিবরণী (Profit & Loss Statement)
            </h2>
            <p className="text-xs text-slate-500">
              ব্যবসায়ের মোট রেভিনিউ, বিক্রীত পণ্যের ব্যয় (COGS), পরিচালন ব্যয় এবং নেট মুনাফা
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="this_month">এই মাস (This Month)</option>
              <option value="last_month">গত মাস (Last Month)</option>
              <option value="this_year">এই বছর (This Year)</option>
              <option value="all">সর্বমোট (All Time)</option>
            </select>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>মোট রেভিনিউ (Revenue)</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">৳{calculations.grossSales.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{filteredSales.length}টি</span> বিক্রয় লেনদেন
            </p>
          </div>

          {/* Gross Profit & Margin */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>গ্রস লাভ (Gross Profit)</span>
              <Percent className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-600">৳{calculations.grossProfit.toLocaleString()}</p>
            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
              গ্রস মার্জিন: <span className="font-bold text-slate-900">{calculations.grossMargin.toFixed(1)}%</span>
            </p>
          </div>

          {/* Operating Expenses */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>মোট খরচ (Expenses)</span>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-600">৳{calculations.totalOperatingExpenses.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              COGS ছাড়া অনান্য পরিচালন ব্যয়
            </p>
          </div>

          {/* Net Profit & Net Margin */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>নেট লাভ (Net Profit)</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <p className={`text-2xl font-black ${calculations.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ৳{calculations.netProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
              নেট মার্জিন: <span className="font-bold text-slate-900">{calculations.netMargin.toFixed(1)}%</span>
            </p>
          </div>
        </div>

        {/* Structured Income Statement Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">ফরম্যাটেড ইনকাম স্টেটমেন্ট (P&L Breakdown)</h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              অডিটেড ফরম্যাট
            </span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5">হিসাবের খাত (Line Item)</th>
                <th className="py-2.5 text-right">টাকার পরিমাণ (BDT)</th>
                <th className="py-2.5 text-right">অনুপাত / মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {/* Revenue */}
              <tr className="bg-emerald-50/40 font-bold text-slate-900">
                <td className="py-3">মোট বিক্রয় রেভিনিউ (Gross Sales)</td>
                <td className="py-3 text-right">৳{calculations.grossSales.toLocaleString()}</td>
                <td className="py-3 text-right text-emerald-700">১০০% বেস</td>
              </tr>

              {/* COGS */}
              <tr className="text-slate-600">
                <td className="py-2.5 pl-4">(-) বিক্রীত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS)</td>
                <td className="py-2.5 text-right text-rose-600">৳{calculations.totalCogs.toLocaleString()}</td>
                <td className="py-2.5 text-right text-slate-500">
                  {calculations.grossSales > 0
                    ? `${((calculations.totalCogs / calculations.grossSales) * 100).toFixed(1)}%`
                    : '০%'}
                </td>
              </tr>

              {/* Gross Profit */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2.5">গ্রস লাভ / মোট মুনাফা (Gross Profit)</td>
                <td className="py-2.5 text-right text-blue-700">৳{calculations.grossProfit.toLocaleString()}</td>
                <td className="py-2.5 text-right text-blue-700">{calculations.grossMargin.toFixed(1)}% মার্জিন</td>
              </tr>

              {/* Operating Expenses */}
              <tr className="text-slate-500 font-bold text-[11px] pt-4">
                <td colSpan={3} className="py-2 text-slate-800">
                  পরিচালন ব্যয়সমূহ (Operating Expenses):
                </td>
              </tr>
              {Object.entries(calculations.expByCategory).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 pl-4 text-slate-400 italic">
                    এই সময়ের মধ্যে কোনো পরিচালন খরচ নেই
                  </td>
                </tr>
              ) : (
                Object.entries(calculations.expByCategory).map(([cat, amt]) => (
                  <tr key={cat} className="text-slate-600">
                    <td className="py-2 pl-6">(-) {cat}</td>
                    <td className="py-2 text-right">৳{amt.toLocaleString()}</td>
                    <td className="py-2 text-right text-slate-500">
                      {calculations.grossSales > 0 ? `${((amt / calculations.grossSales) * 100).toFixed(1)}%` : '০%'}
                    </td>
                  </tr>
                ))
              )}

              {/* Total Expenses */}
              <tr className="bg-slate-50 font-semibold text-slate-800">
                <td className="py-2.5 pl-4">মোট পরিচালন ব্যয় (Total Operating Expenses)</td>
                <td className="py-2.5 text-right text-rose-600">৳{calculations.totalOperatingExpenses.toLocaleString()}</td>
                <td className="py-2.5 text-right text-slate-500">
                  {calculations.grossSales > 0
                    ? `${((calculations.totalOperatingExpenses / calculations.grossSales) * 100).toFixed(1)}%`
                    : '০%'}
                </td>
              </tr>

              {/* Net Profit */}
              <tr className="bg-emerald-100/60 font-black text-slate-950 text-sm border-t-2 border-emerald-600">
                <td className="py-3">নেট লাভ / চূড়ান্ত মুনাফা (Net Profit)</td>
                <td className={`py-3 text-right ${calculations.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ৳{calculations.netProfit.toLocaleString()}
                </td>
                <td className="py-3 text-right text-emerald-800">{calculations.netMargin.toFixed(1)}% নেট মার্জিন</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Financial Comparison Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                মাসভিত্তিক আর্থিক তুলনা (Monthly Financial Comparison)
              </h3>
              <p className="text-xs text-slate-500">গত ৬ মাসের রেভিনিউ, পরিচালন ব্যয় ও নেট মুনাফা</p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: unknown) => [`৳${Number(value || 0).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="রেভিনিউ" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="ব্যয়" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="নেট মুনাফা" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ProGate>
  );
};
