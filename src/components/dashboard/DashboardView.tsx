import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ViewTab } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Wallet,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Lock,
  FileText,
  Truck,
  CreditCard,
  FileSpreadsheet,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: ViewTab) => void;
  onOpenSaleModal: () => void;
  onOpenProductModal: () => void;
  onOpenExpenseModal: () => void;
}

type DateFilter = 'all' | 'month' | '30days' | 'today';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSaleModal,
  onOpenProductModal,
  onOpenExpenseModal,
}) => {
  const { profile } = useAuth();
  const { metrics, lowStockProducts, sales, expenses, products, customers } = useData();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeChart, setActiveChart] = useState<'all' | 'sales' | 'expenses' | 'profit'>('all');
  const isPro = profile?.plan === 'PRO';

  // Filter sales and expenses based on dateFilter
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filterFn = (dateStr: string) => {
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return dateStr === todayStr;
      if (dateFilter === 'month') return dateStr.startsWith(currentYearMonth);
      if (dateFilter === '30days') return dateStr >= thirtyDaysAgo;
      return true;
    };

    const sList = sales.filter((s) => filterFn(s.sale_date));
    const eList = expenses.filter((e) => filterFn(e.date));

    // Calculate metrics for filtered range
    const totalSales = sList.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
    const totalExpenses = eList.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const productCostMap = new Map<string, number>();
    products.forEach((p) => productCostMap.set(p.id, Number(p.purchase_price || 0)));

    let cogs = 0;
    sList.forEach((s) => {
      if (s.product_id && productCostMap.has(s.product_id)) {
        cogs += Number(s.quantity || 0) * (productCostMap.get(s.product_id) || 0);
      }
    });

    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return {
      filteredSales: sList,
      filteredExpenses: eList,
      totalSales,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
    };
  }, [sales, expenses, products, dateFilter]);

  // Aggregate daily timeline for chart
  const timelineChartData = useMemo(() => {
    const map = new Map<string, { date: string; displayDate: string; sales: number; expenses: number; profit: number }>();

    // Take sales from filtered
    filteredData.filteredSales.forEach((s) => {
      const d = s.sale_date;
      if (!map.has(d)) {
        map.set(d, { date: d, displayDate: formatDate(d), sales: 0, expenses: 0, profit: 0 });
      }
      map.get(d)!.sales += Number(s.total_amount || 0);
    });

    // Take expenses from filtered
    filteredData.filteredExpenses.forEach((e) => {
      const d = e.date;
      if (!map.has(d)) {
        map.set(d, { date: d, displayDate: formatDate(d), sales: 0, expenses: 0, profit: 0 });
      }
      map.get(d)!.expenses += Number(e.amount || 0);
    });

    // Calculate estimated daily profit = daily sales - daily expenses
    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((item) => {
      item.profit = item.sales - item.expenses;
    });

    // If empty, provide an example neutral point
    if (sorted.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: today, displayDate: 'আজ (Today)', sales: 0, expenses: 0, profit: 0 }];
    }

    return sorted.slice(-14); // Last 14 active days
  }, [filteredData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>ব্যবসায়িক ড্যাশবোর্ড</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Shohoj Bebsha
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            দৈনিক হিসাব, ইনভেন্টরি ও লাভ-ক্ষতির রিয়েল-টাইম সারসংক্ষেপ
          </p>
        </div>

        {/* Date Filter & Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="bg-transparent border-0 text-slate-700 py-1 pr-3 text-xs focus:ring-0 cursor-pointer font-semibold"
            >
              <option value="all">সব সময় (All Time)</option>
              <option value="month">চলতি মাস (This Month)</option>
              <option value="30days">গত ৩০ দিন (Last 30 Days)</option>
              <option value="today">আজকের দিন (Today)</option>
            </select>
          </div>

          <button
            onClick={onOpenSaleModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিক্রয় (New Sale)</span>
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>খরচ যোগ (Expense)</span>
          </button>
        </div>
      </div>

      {/* Low Stock Notification Alert if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                সতর্কতা: {lowStockProducts.length}টি পণ্যের স্টক কম!
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockProducts.map((p) => `${p.name} (মজুদ: ${p.stock_quantity})`).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? ' এবং আরও অন্যান্য...' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            স্টক দেখুন ও রি-অর্ডার করুন
          </button>
        </div>
      )}

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট বিক্রয় (Total Sales)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(dateFilter === 'all' ? metrics.totalSales : filteredData.totalSales)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{filteredData.filteredSales.length}টি বিক্রয় সম্পন্ন</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট খরচ (Total Expenses)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(dateFilter === 'all' ? metrics.totalExpenses : filteredData.totalExpenses)}
            </p>
            <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{filteredData.filteredExpenses.length}টি খরচ এন্ট্রি</span>
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Net Profit & Margin */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">নিট লাভ (Net Profit)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${
              (dateFilter === 'all' ? metrics.netProfit : filteredData.netProfit) >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}>
              {formatCurrency(dateFilter === 'all' ? metrics.netProfit : filteredData.netProfit)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              মার্জিন:{' '}
              <span className="font-bold text-blue-700">
                {(dateFilter === 'all' ? metrics.profitMargin : filteredData.profitMargin).toFixed(1)}%
              </span>
              {' '}• গ্রস: {formatCurrency(dateFilter === 'all' ? metrics.grossProfit : filteredData.grossProfit)}
            </p>
          </div>
        </div>

        {/* Card 4: Cash Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ক্যাশ ব্যালেন্স (Cash Balance)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${
              metrics.cashBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}>
              {formatCurrency(metrics.cashBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              পরিশোধিত নগদ - মোট খরচ
            </p>
          </div>
        </div>

        {/* Card 5: Inventory Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মজুদ পণ্যের মূল্য (Inventory Value)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.inventoryValue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              ক্রয়মূল্য অনুযায়ী স্টক ভ্যালু
            </p>
          </div>
        </div>

        {/* Card 6: Customer Due */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">গ্রাহকের মোট বকেয়া (Customer Due)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
              {formatCurrency(metrics.customerDue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              বাকি খাতায় অপরিশোধিত পাওনা
            </p>
          </div>
        </div>

        {/* Card 7: Total Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট পণ্য (Total Products)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalProductsCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              ইনভেন্টরিতে সক্রিয় পণ্য
            </p>
          </div>
        </div>

        {/* Card 8: Low Stock Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">স্বল্প স্টক পণ্য (Low Stock)</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              metrics.lowStockProductsCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${
              metrics.lowStockProductsCount > 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {metrics.lowStockProductsCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics.lowStockProductsCount > 0 ? 'দ্রুত রি-অর্ডার করা জরুরি' : 'সব পণ্যের মজুদ পর্যাপ্ত'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section: Sales, Expense & Profit Trends */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>ব্যবসায়িক ট্রেন্ড ও পরিসংখ্যান (Trends)</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              দৈনিক বিক্রয়, খরচ এবং লাভ-এর তুলনামূলক চিত্র
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveChart('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeChart === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সবগুলো (All)
            </button>
            <button
              onClick={() => setActiveChart('sales')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeChart === 'sales' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বিক্রয় (Sales)
            </button>
            <button
              onClick={() => setActiveChart('expenses')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeChart === 'expenses' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              খরচ (Expenses)
            </button>
            <button
              onClick={() => setActiveChart('profit')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeChart === 'profit' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              লাভ (Profit)
            </button>
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="w-full h-72 pt-2">
          {timelineChartData.length === 0 || (timelineChartData.length === 1 && timelineChartData[0].sales === 0 && timelineChartData[0].expenses === 0) ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs gap-2">
              <TrendingUp className="w-8 h-8 text-slate-300" />
              <span>কোনো বিক্রয় বা খরচের রেকর্ড এখনো নেই। নতুন লেনদেন যোগ করলেই চার্ট দৃশ্যমান হবে।</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'expenses' ? (
                <BarChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value) || 0), 'খরচ']}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} name="খরচ (Expenses)" />
                </BarChart>
              ) : (
                <AreaChart data={timelineChartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value) || 0), String(name)]}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  {(activeChart === 'all' || activeChart === 'sales') && (
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                      name="বিক্রয় (Sales)"
                    />
                  )}
                  {activeChart === 'all' && (
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expGrad)"
                      name="খরচ (Expenses)"
                    />
                  )}
                  {(activeChart === 'all' || activeChart === 'profit') && (
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#profitGrad)"
                      name="আনুমানিক লাভ (Profit)"
                    />
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক বিক্রয় (Recent Sales)</h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              সব দেখুন ({sales.length})
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              এখনো কোনো বিক্রয় রেকর্ড করা হয়নি
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {sales.slice(0, 5).map((sale) => {
                const prod = products.find((p) => p.id === sale.product_id);
                const cust = customers.find((c) => c.id === sale.customer_id);
                return (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {prod ? prod.name : 'পণ্য'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {cust ? cust.name : 'সরাসরি খরিদ্দার'} • {sale.quantity}টি • {formatDate(sale.sale_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(sale.total_amount)}</p>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sale.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {sale.payment_status === 'paid' ? 'পরিশোধিত (Paid)' : 'বাকি (Due)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক খরচ (Recent Expenses)</h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              সব দেখুন ({expenses.length})
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              এখনো কোনো খরচের এন্ট্রি নেই
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{exp.category}</span>
                    <p className="text-slate-500 text-[11px]">
                      {exp.description || 'বিবরণ নেই'} • {formatDate(exp.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600">{formatCurrency(exp.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
