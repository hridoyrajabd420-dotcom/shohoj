import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../../lib/formatters';
import { ViewTab, Sale, Expense, Product } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Receipt,
  Filter,
  BarChart3,
  Layers,
  Info,
  CheckCircle2,
  Clock,
  RotateCcw,
  Tag,
  Boxes,
  Landmark,
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

export type DashboardFilter = 'today' | '7days' | 'month' | 'lastMonth' | 'custom' | 'all';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSaleModal,
  onOpenProductModal,
  onOpenExpenseModal,
}) => {
  const { sales, expenses, products, customers, fixedAssets, fixedAssetsSummary, loading } = useData();

  // Filters State (Part E)
  const [filterPeriod, setFilterPeriod] = useState<DashboardFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Analytics View Tab
  const [analyticsTab, setAnalyticsTab] = useState<'sales' | 'expenses' | 'profit'>('sales');

  // Dates helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Last 7 days boundary
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  // Yesterday string
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Last Month prefix
  const lastMonthStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0].slice(0, 7);
  }, []);

  // Map of products for fast lookups
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // ==========================================
  // PART A: FIXED HIGH-LEVEL SUMMARY METRICS
  // ==========================================

  // 1. Today's total sales
  const todayTotalSales = useMemo(() => {
    return sales
      .filter((s) => s.sale_date === todayStr)
      .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  }, [sales, todayStr]);

  // Yesterday's total sales for daily comparison
  const yesterdayTotalSales = useMemo(() => {
    return sales
      .filter((s) => s.sale_date === yesterdayStr)
      .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  }, [sales, yesterdayStr]);

  // 2. This month's total sales
  const thisMonthTotalSales = useMemo(() => {
    return sales
      .filter((s) => s.sale_date && s.sale_date.startsWith(currentMonthStr))
      .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  }, [sales, currentMonthStr]);

  // 3. Today's expenses
  const todayTotalExpenses = useMemo(() => {
    return expenses
      .filter((e) => (e.expense_date || e.date) === todayStr)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses, todayStr]);

  // 4. This month's expenses
  const thisMonthTotalExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = e.expense_date || e.date || '';
        return d.startsWith(currentMonthStr);
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses, currentMonthStr]);

  // 6. Total inventory value = sum(stock_quantity * purchase_price)
  const totalInventoryValue = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + Number(p.stock_quantity || 0) * Number(p.purchase_price || 0),
      0
    );
  }, [products]);

  // 7. Total customer receivables (outstanding dues)
  const totalCustomerReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.due_amount || 0), 0);
  }, [customers]);

  // 8. Total number of products
  const totalProductsCount = products.length;

  // 9. Low-stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.low_stock_threshold ?? p.low_stock_level ?? 5;
      return Number(p.stock_quantity || 0) <= Number(threshold);
    });
  }, [products]);

  // ==========================================
  // PART E & D: FILTERED SALES, EXPENSES & P&L
  // ==========================================
  const filteredRecords = useMemo(() => {
    const isDateMatch = (dateStr: string) => {
      if (!dateStr) return false;
      if (filterPeriod === 'all') return true;
      if (filterPeriod === 'today') return dateStr === todayStr;
      if (filterPeriod === '7days') return dateStr >= sevenDaysAgoStr && dateStr <= todayStr;
      if (filterPeriod === 'month') return dateStr.startsWith(currentMonthStr);
      if (filterPeriod === 'lastMonth') return dateStr.startsWith(lastMonthStr);
      if (filterPeriod === 'custom') {
        if (customStartDate && dateStr < customStartDate) return false;
        if (customEndDate && dateStr > customEndDate) return false;
        return true;
      }
      return true;
    };

    const periodSales = sales.filter((s) => isDateMatch(s.sale_date));
    const periodExpenses = expenses.filter((e) => isDateMatch(e.expense_date || e.date));

    // PART D: PROFIT & LOSS CALCULATIONS
    // Total Sales = completed sales revenue after discounts
    const periodTotalSales = periodSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

    // Cost of Goods Sold (COGS) = cost price of products sold
    let periodCogs = 0;
    periodSales.forEach((s) => {
      if (s.product_id) {
        const prod = productMap.get(s.product_id);
        const unitCost = prod ? Number(prod.purchase_price || 0) : 0;
        periodCogs += Number(s.quantity || 0) * unitCost;
      }
    });

    // Gross Profit = Total Sales - COGS
    const periodGrossProfit = periodTotalSales - periodCogs;

    // Total Expenses = business operating expenses
    const periodTotalExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Net Profit = Gross Profit - Total Expenses
    const periodNetProfit = periodGrossProfit - periodTotalExpenses;

    const netMarginPercent = periodTotalSales > 0 ? (periodNetProfit / periodTotalSales) * 100 : 0;
    const grossMarginPercent = periodTotalSales > 0 ? (periodGrossProfit / periodTotalSales) * 100 : 0;

    return {
      periodSales,
      periodExpenses,
      periodTotalSales,
      periodCogs,
      periodGrossProfit,
      periodTotalExpenses,
      periodNetProfit,
      netMarginPercent,
      grossMarginPercent,
    };
  }, [
    sales,
    expenses,
    productMap,
    filterPeriod,
    todayStr,
    sevenDaysAgoStr,
    currentMonthStr,
    lastMonthStr,
    customStartDate,
    customEndDate,
  ]);

  // ==========================================
  // PART B: SALES ANALYTICS
  // ==========================================

  // 1. Last 7 Days Daily Sales Chart Data
  const last7DaysChartData = useMemo(() => {
    const days: { date: string; displayDate: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const daySales = sales
        .filter((s) => s.sale_date === dStr)
        .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

      let dayCogs = 0;
      sales
        .filter((s) => s.sale_date === dStr)
        .forEach((s) => {
          if (s.product_id) {
            const p = productMap.get(s.product_id);
            dayCogs += Number(s.quantity || 0) * (p ? Number(p.purchase_price || 0) : 0);
          }
        });

      const dayExpenses = expenses
        .filter((e) => (e.expense_date || e.date) === dStr)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const dayProfit = daySales - dayCogs - dayExpenses;

      days.push({
        date: dStr,
        displayDate: formatDate(dStr),
        sales: daySales,
        profit: dayProfit,
      });
    }
    return days;
  }, [sales, expenses, productMap]);

  // 2. Best-Selling Products (Top Products by Quantity & Revenue)
  const bestSellingProducts = useMemo(() => {
    const agg = new Map<
      string,
      {
        product: Product | undefined;
        unitsSold: number;
        revenue: number;
        profit: number;
      }
    >();

    filteredRecords.periodSales.forEach((s) => {
      const pId = s.product_id || 'unknown';
      const existing = agg.get(pId) || {
        product: s.product_id ? productMap.get(s.product_id) : undefined,
        unitsSold: 0,
        revenue: 0,
        profit: 0,
      };

      const qty = Number(s.quantity || 0);
      const rev = Number(s.total_amount || 0);
      const prod = s.product_id ? productMap.get(s.product_id) : undefined;
      const cost = qty * (prod ? Number(prod.purchase_price || 0) : 0);

      existing.unitsSold += qty;
      existing.revenue += rev;
      existing.profit += rev - cost;

      agg.set(pId, existing);
    });

    return Array.from(agg.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [filteredRecords.periodSales, productMap]);

  // 3. Sales by Product Category
  const salesByCategory = useMemo(() => {
    const agg = new Map<string, { category: string; revenue: number; count: number }>();
    filteredRecords.periodSales.forEach((s) => {
      const prod = s.product_id ? productMap.get(s.product_id) : undefined;
      const cat = prod?.category?.trim() || 'অন্যান্য (Other)';
      const existing = agg.get(cat) || { category: cat, revenue: 0, count: 0 };
      existing.revenue += Number(s.total_amount || 0);
      existing.count += Number(s.quantity || 0);
      agg.set(cat, existing);
    });

    return Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRecords.periodSales, productMap]);

  // ==========================================
  // PART C: EXPENSE ANALYTICS
  // ==========================================

  // 1. Expense Totals by Category
  const expensesByCategory = useMemo(() => {
    const agg = new Map<string, { category: string; amount: number; count: number }>();
    filteredRecords.periodExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      const existing = agg.get(cat) || { category: cat, amount: 0, count: 0 };
      existing.amount += Number(e.amount || 0);
      existing.count += 1;
      agg.set(cat, existing);
    });

    const total = filteredRecords.periodTotalExpenses || 1;
    return Array.from(agg.values())
      .map((item) => ({
        ...item,
        percentage: ((item.amount / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredRecords.periodExpenses, filteredRecords.periodTotalExpenses]);

  // Monthly timeline chart data for the filtered range
  const timelineComparisonData = useMemo(() => {
    const dateMap = new Map<string, { date: string; displayDate: string; sales: number; expenses: number; cogs: number; profit: number }>();

    filteredRecords.periodSales.forEach((s) => {
      const d = s.sale_date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, displayDate: formatDate(d), sales: 0, expenses: 0, cogs: 0, profit: 0 });
      }
      const item = dateMap.get(d)!;
      const rev = Number(s.total_amount || 0);
      item.sales += rev;

      const p = s.product_id ? productMap.get(s.product_id) : undefined;
      const cost = Number(s.quantity || 0) * (p ? Number(p.purchase_price || 0) : 0);
      item.cogs += cost;
    });

    filteredRecords.periodExpenses.forEach((e) => {
      const d = e.expense_date || e.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, displayDate: formatDate(d), sales: 0, expenses: 0, cogs: 0, profit: 0 });
      }
      dateMap.get(d)!.expenses += Number(e.amount || 0);
    });

    const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach((item) => {
      item.profit = item.sales - item.cogs - item.expenses;
    });

    if (sorted.length === 0) {
      return [{ date: todayStr, displayDate: 'আজ (Today)', sales: 0, expenses: 0, cogs: 0, profit: 0 }];
    }

    return sorted;
  }, [filteredRecords.periodSales, filteredRecords.periodExpenses, productMap, todayStr]);

  // 10. Recent Sales
  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  // 11. Recent Expenses
  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Date Range Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>ব্যবসায়িক ড্যাশবোর্ড ও বিশ্লেষণ</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Shohoj Bebsha
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            দৈনিক বিক্রয়, লাভ-ক্ষতি (P&L), ব্যয় ও ইনভেন্টরির রিয়েল-টাইম রিপোর্ট
          </p>
        </div>

        {/* Date Filter Bar (Part E) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1.5" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as DashboardFilter)}
              className="bg-transparent border-0 text-slate-800 py-1 pr-3 text-xs focus:ring-0 cursor-pointer font-bold"
            >
              <option value="today">আজকের দিন (Today)</option>
              <option value="7days">গত ৭ দিন (Last 7 Days)</option>
              <option value="month">চলতি মাস (This Month)</option>
              <option value="lastMonth">গত মাস (Last Month)</option>
              <option value="custom">কাস্টম তারিখ পরিসীমা (Custom)</option>
              <option value="all">সব সময় (All Time)</option>
            </select>
          </div>

          {filterPeriod === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-slate-400">হতে</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}

          {/* Quick Buttons */}
          <button
            onClick={onOpenSaleModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিক্রয়</span>
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>খরচ যোগ</span>
          </button>
        </div>
      </div>

      {/* 2. Low Stock Alert Banner (Part A: 9) */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                সতর্কতা: {lowStockProducts.length}টি পণ্যের মজুদ বিপজ্জনকভাবে কম!
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockProducts
                  .map((p) => `${p.name} (মজুদ: ${p.stock_quantity}${p.unit || 'টি'})`)
                  .slice(0, 3)
                  .join(', ')}
                {lowStockProducts.length > 3 ? ' এবং আরও অন্যান্য...' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            স্টক দেখুন ও রি-অর্ডার করুন
          </button>
        </div>
      )}

      {/* 3. Core Business Dashboard Metrics (Part A: 1 - 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 & 2: Sales (Today & This Month) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">আজকের মোট বিক্রয় (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(todayTotalSales)}
            </p>
            <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center justify-between">
              <span>চলতি মাস: <strong className="text-emerald-700">{formatCurrency(thisMonthTotalSales)}</strong></span>
              {yesterdayTotalSales > 0 && (
                <span className={todayTotalSales >= yesterdayTotalSales ? 'text-emerald-600' : 'text-slate-400'}>
                  {todayTotalSales >= yesterdayTotalSales ? '▲ গতকালের চেয়ে বেশি' : 'গতকালের চেয়ে কম'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3 & 4: Expenses (Today & This Month) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">আজকের মোট খরচ (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
              {formatCurrency(todayTotalExpenses)}
            </p>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              <span>চলতি মাসে ব্যয়: <strong className="text-rose-700">{formatCurrency(thisMonthTotalExpenses)}</strong></span>
            </div>
          </div>
        </div>

        {/* Metric 5: Estimated Net Profit (Filtered Period) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">প্রকৃত নিট লাভ (Net Profit)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                filteredRecords.periodNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(filteredRecords.periodNetProfit)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              মার্জিন: <strong className="text-blue-700">{filteredRecords.netMarginPercent.toFixed(1)}%</strong> • গ্রস:{' '}
              {formatCurrency(filteredRecords.periodGrossProfit)}
            </p>
          </div>
        </div>

        {/* Metric 7: Customer Receivables (Total Due) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">বকেয়া পাওনা (Customer Due)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
              {formatCurrency(totalCustomerReceivables)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {customers.filter((c) => Number(c.due_amount || 0) > 0).length} জন গ্রাহকের কাছে পাওনা
            </p>
          </div>
        </div>

        {/* Metric 6: Total Inventory Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মজুদ পণ্যের মূল্য (Inventory Value)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalInventoryValue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">ক্রয়মূল্য অনুসারে মোট স্টক</p>
          </div>
        </div>

        {/* Metric 8: Total Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট নিবন্ধিত পণ্য</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {totalProductsCount}টি পণ্য
            </p>
            <p className="text-[11px] text-slate-500 mt-1">ক্যাটালগে সক্রিয় পণ্যের সংখ্যা</p>
          </div>
        </div>

        {/* Metric 9: Low-Stock Products Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">স্বল্প স্টক পণ্য (Low Stock)</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                lowStockProducts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                lowStockProducts.length > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {lowStockProducts.length}টি
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {lowStockProducts.length > 0 ? 'রি-অর্ডার সীমার নিচে' : 'সকল পণ্যের মজুদ পর্যাপ্ত'}
            </p>
          </div>
        </div>

        {/* Metric: Filtered Period Summary */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">নির্বাচিত সময়ের বিক্রয়</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(filteredRecords.periodTotalSales)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {filteredRecords.periodSales.length}টি বিক্রয় সম্পন্ন
            </p>
          </div>
        </div>
      </div>

      {/* Requirement 8: Fixed Asset Dashboard Summary */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                স্থায়ী সম্পদ ও অবচয় সামারি (Fixed Assets & CapEx)
              </h3>
              <p className="text-[11px] text-slate-500">
                ব্যবসায়ের মূলধনী সম্পদ, সঞ্চিত অবচয় ও বর্তমান নিট পুস্তক মূল্য
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('fixed_assets')}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all flex items-center gap-1.5"
          >
            <span>সম্পদ রেজিস্টার দেখুন</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-semibold block">মোট স্থায়ী সম্পদ (Gross)</span>
            <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {formatCurrency(fixedAssetsSummary.totalGrossAssets)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {fixedAssets.length}টি নিবন্ধিত সম্পদ
            </span>
          </div>

          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
            <span className="text-[11px] text-rose-700 font-semibold block">মোট পুঞ্জীভূত অবচয় (Accum.)</span>
            <span className="text-base sm:text-lg font-black text-rose-600 mt-0.5 block">
              {formatCurrency(fixedAssetsSummary.totalAccumulatedDepreciation)}
            </span>
            <span className="text-[10px] text-rose-500 mt-0.5 block">
              আজ পর্যন্ত মোট ক্ষয়
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-800 font-semibold block">নিট পুস্তক মূল্য (Net Book Value)</span>
            <span className="text-base sm:text-lg font-black text-emerald-700 mt-0.5 block">
              {formatCurrency(fixedAssetsSummary.totalNetBookValue)}
            </span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">
              ব্যালেন্স শীট খাঁটি সম্পদ
            </span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
            <span className="text-[11px] text-blue-800 font-semibold block">মাসিক অবচয় ব্যয় (Monthly)</span>
            <span className="text-base sm:text-lg font-black text-blue-700 mt-0.5 block">
              {formatCurrency(fixedAssetsSummary.totalMonthlyDepreciation)}
            </span>
            <span className="text-[10px] text-blue-600 mt-0.5 block">
              চলতি মাসের P&L বরাদ্দ
            </span>
          </div>
        </div>
      </div>

      {/* 4. PART D: PROFIT & LOSS PERFORMANCE BREAKDOWN CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>প্রকৃত লাভ-ক্ষতির হিসাব (Profit & Loss Statement)</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Formula Grounded
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              নিট লাভ = (মোট বিক্রয় রাজস্ব - বিক্রিত পণ্যের ক্রয়মূল্য) - ব্যবসায়িক পরিচালনা খরচ
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            ফিল্টার: <strong className="text-slate-900">{filteredRecords.periodSales.length}টি বিক্রয়</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Box 1: Total Sales */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">১. মোট বিক্রয় রাজস্ব (Sales)</span>
            <span className="text-base font-black text-slate-900 block mt-1">
              {formatCurrency(filteredRecords.periodTotalSales)}
            </span>
            <span className="text-[10px] text-slate-400">ডিসকাউন্ট পরবর্তী প্রকৃত বিক্রয়</span>
          </div>

          {/* Box 2: COGS */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">২. পণ্যের কেনাদাম (COGS)</span>
            <span className="text-base font-black text-rose-600 block mt-1">
              - {formatCurrency(filteredRecords.periodCogs)}
            </span>
            <span className="text-[10px] text-slate-400">বিক্রিত পণ্যের ক্রয়মূল্য</span>
          </div>

          {/* Box 3: Gross Profit */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 block uppercase">৩. মোট গ্রস লাভ (Gross Profit)</span>
            <span className="text-base font-black text-emerald-700 block mt-1">
              {formatCurrency(filteredRecords.periodGrossProfit)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              মার্জিন: {filteredRecords.grossMarginPercent.toFixed(1)}%
            </span>
          </div>

          {/* Box 4: Operating Expenses */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">৪. পরিচালনা খরচ (Expenses)</span>
            <span className="text-base font-black text-rose-600 block mt-1">
              - {formatCurrency(filteredRecords.periodTotalExpenses)}
            </span>
            <span className="text-[10px] text-slate-400">দোকান ভাড়া, বেতন, ইউটিলিটি ইত্যাদি</span>
          </div>

          {/* Box 5: Net Profit */}
          <div className={`p-3.5 rounded-xl border ${
            filteredRecords.periodNetProfit >= 0
              ? 'bg-blue-50/70 border-blue-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <span className="text-[11px] font-bold text-slate-700 block uppercase">৫. প্রকৃত নিট লাভ (Net Profit)</span>
            <span
              className={`text-base font-black block mt-1 ${
                filteredRecords.periodNetProfit >= 0 ? 'text-blue-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(filteredRecords.periodNetProfit)}
            </span>
            <span className="text-[10px] font-bold text-slate-600">
              নিট মার্জিন: {filteredRecords.netMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            লক্ষ্য করুন: বকেয়া পাওনাকে পৃথক আয় হিসেবে দ্বৈত গণনা করা হয় না এবং শুধুমাত্র বাস্তব পরিচালন খরচ বাদ দিয়ে প্রকৃত লাভ নির্ণয় করা হয়েছে।
          </span>
        </div>
      </div>

      {/* 5. ANALYTICS TABS SECTION (PART B & PART C) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>উন্নত ব্যবসায়িক বিশ্লেষণ (Business Analytics)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              বিক্রয় চার্ট, শীর্ষ বিক্রিত পণ্য এবং ব্যয় বিশ্লেষণ
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setAnalyticsTab('sales')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                analyticsTab === 'sales'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বিক্রয় বিশ্লেষণ (Sales)
            </button>
            <button
              onClick={() => setAnalyticsTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                analyticsTab === 'expenses'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ব্যয় বিশ্লেষণ (Expenses)
            </button>
            <button
              onClick={() => setAnalyticsTab('profit')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                analyticsTab === 'profit'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              লাভ-ক্ষতি চার্ট (Trends)
            </button>
          </div>
        </div>

        {/* TAB 1: SALES ANALYTICS (PART B) */}
        {analyticsTab === 'sales' && (
          <div className="space-y-6">
            {/* Last 7 Days Sales Trend Chart (Part B: 1) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>বিগত ৭ দিনের দৈনিক বিক্রয় চিত্র (Last 7 Days Sales)</span>
                </span>
                <span className="text-xs text-slate-400">দৈনিক মোট বিল</span>
              </div>

              <div className="w-full h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'বিক্রয়']}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="sales" fill="#059669" radius={[6, 6, 0, 0]} name="দৈনিক বিক্রয় (৳)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best Selling Products & Category Share Grid (Part B: 4 & 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Best Selling Products */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>শীর্ষ বিক্রিত পণ্যসমূহ (Best-Selling Products)</span>
                </h4>

                {bestSellingProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    এই নির্বাচিত সময়ে কোনো বিক্রয় পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {bestSellingProducts.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{item.product?.name || 'অজানা পণ্য'}</p>
                            <p className="text-[10px] text-slate-400">
                              SKU: {item.product?.sku || 'N/A'} • বিক্রিত: {item.unitsSold}টি
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(item.revenue)}</p>
                          <p className="text-[10px] text-emerald-700 font-semibold">
                            লাভ: {formatCurrency(item.profit)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales by Category */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>ক্যাটাগরি অনুযায়ী বিক্রয় (Sales by Category)</span>
                </h4>

                {salesByCategory.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    কোনো ক্যাটাগরি ডাটা পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {salesByCategory.map((cat, idx) => {
                      const share = (
                        (cat.revenue / (filteredRecords.periodTotalSales || 1)) *
                        100
                      ).toFixed(1);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800">{cat.category}</span>
                            <span className="text-slate-900 font-bold">
                              {formatCurrency(cat.revenue)} ({share}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Number(share))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSE ANALYTICS (PART C) */}
        {analyticsTab === 'expenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>ক্যাটাগরি ভিত্তিক মোট ব্যয় (Expense by Category)</span>
                </h4>

                {expensesByCategory.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    কোনো খরচের এন্ট্রি পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {expensesByCategory.map((item, idx) => {
                      const catDef = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>{catDef?.labelBn || item.category}</span>
                            </span>
                            <span className="text-rose-600 font-bold">
                              {formatCurrency(item.amount)} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Number(item.percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Monthly Expense Trend */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span>ব্যয়ের সময়কাল চার্ট (Expense Trend)</span>
                </h4>

                <div className="w-full h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'ব্যয়']}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="খরচ (৳)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROFIT TRENDS & DAILY COMPARISON */}
        {analyticsTab === 'profit' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>দৈনিক বিক্রয়, ব্যয় এবং লাভ-এর তুলনামূলক ট্রেন্ড চার্ট</span>
              </span>
              <span className="text-xs text-slate-400">ফিল্টারকৃত সময়কাল</span>
            </div>

            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineComparisonData}>
                  <defs>
                    <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="profitGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [formatCurrency(Number(val) || 0), String(name)]}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGrad2)"
                    name="বিক্রয় (Sales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expGrad2)"
                    name="খরচ (Expenses)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGrad2)"
                    name="প্রকৃত নিট লাভ (Profit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 6. RECENT ACTIVITY QUICK LISTS (PART A: 10 & 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales (Part A: 10) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>সাম্প্রতিক বিক্রয় (Recent Sales)</span>
            </h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              সব দেখুন ({sales.length})
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              এখনো কোনো বিক্রয় রেকর্ড করা হয়নি
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentSales.map((sale) => {
                const prod = productMap.get(sale.product_id || '');
                const cust = customers.find((c) => c.id === sale.customer_id);
                return (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {prod ? prod.name : 'পণ্য'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {cust ? cust.name : 'সরাসরি খরিদ্দার'} • {sale.quantity}টি • {formatDate(sale.sale_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{formatCurrency(sale.total_amount)}</p>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          sale.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.payment_status === 'paid' ? 'পরিশোধিত' : 'বাকি'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Expenses (Part A: 11) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>সাম্প্রতিক খরচ (Recent Expenses)</span>
            </h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              সব দেখুন ({expenses.length})
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              এখনো কোনো খরচের এন্ট্রি নেই
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentExpenses.map((exp) => {
                const catDef = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                const displayDate = exp.expense_date || exp.date;
                return (
                  <div key={exp.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {exp.title || catDef?.labelBn || exp.category}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${catDef?.color || 'bg-slate-100 text-slate-700'}`}>
                          {catDef?.labelBn || exp.category}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {exp.description || 'বিবরণ নেই'} • {formatDate(displayDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-rose-600">{formatCurrency(exp.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
