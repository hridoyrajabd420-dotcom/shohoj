import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Expense, ExpenseCategory, RecurringExpense } from '../../types';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../../lib/formatters';
import { DateRangePreset, getDateRangeFromPreset, isDateInRange, DATE_PRESETS } from '../../lib/dateRangeUtils';
import { DateRangeFilterBar } from '../common/DateRangeFilterBar';
import { DynamicProfitSummaryCards, DynamicProfitSummaryMetrics } from '../common/DynamicProfitSummaryCards';
import { PeriodClosingModal } from '../common/PeriodClosingModal';
import { ExpenseFormModal } from './ExpenseFormModal';
import { RecurringExpenseModal } from './RecurringExpenseModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Calendar,
  DollarSign,
  TrendingDown,
  RotateCcw,
  Repeat,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    sales,
    products,
    recurringExpenses,
    deleteExpense,
    deleteRecurringExpense,
    updateRecurringExpense,
    triggerRecurringExpensesSync,
    loading,
  } = useData();
  const { showToast } = useToast();

  // Active view tab: standard expenses vs recurring rules
  const [activeTab, setActiveTab] = useState<'expenses' | 'recurring'>('expenses');

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Unified Date Filter
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const initialRange = useMemo(() => getDateRangeFromPreset('this_month'), []);
  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Recurring Modal
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringExpense | null>(null);
  const [recurringToDelete, setRecurringToDelete] = useState<RecurringExpense | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Period Closing Modal
  const [isPeriodClosingModalOpen, setIsPeriodClosingModalOpen] = useState(false);

  // Filtered expenses based on search, category, and unified date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = e.expense_date || e.date || '';

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q));

      // Category Filter
      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;

      // Date Range Filter
      const matchesDate = isDateInRange(expDate, startDate, endDate);

      return matchesSearch && matchesCat && matchesDate;
    });
  }, [expenses, searchQuery, categoryFilter, startDate, endDate]);

  // Product map for COGS calculation
  const productPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.id, Number(p.purchase_price || 0)));
    return map;
  }, [products]);

  // Filtered sales in the same date range for accurate COGS, Gross Profit and Net Profit
  const periodSales = useMemo(() => {
    return sales.filter((s) => isDateInRange(s.sale_date, startDate, endDate));
  }, [sales, startDate, endDate]);

  // Summary Metrics calculation for this period
  const periodMetrics: DynamicProfitSummaryMetrics = useMemo(() => {
    const totalSales = periodSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

    const cashReceived = periodSales.reduce((acc, s) => {
      if (s.paid_amount !== undefined) return acc + Number(s.paid_amount);
      return acc + (s.payment_status === 'paid' ? Number(s.total_amount || 0) : 0);
    }, 0);

    const totalDue = periodSales.reduce((acc, s) => {
      if (s.due_amount !== undefined) return acc + Number(s.due_amount);
      return acc + (s.payment_status === 'due' ? Number(s.total_amount || 0) : 0);
    }, 0);

    let cogs = 0;
    periodSales.forEach((s) => {
      if (s.product_id && productPriceMap.has(s.product_id)) {
        cogs += Number(s.quantity || 0) * (productPriceMap.get(s.product_id) || 0);
      }
    });

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const recurringExpensesTotal = filteredExpenses
      .filter((e) => e.is_recurring_auto || Boolean(e.recurring_expense_id))
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      totalSales,
      totalExpenses,
      cogs,
      grossProfit,
      netProfit,
      cashReceived,
      totalDue,
      salesCount: periodSales.length,
      expensesCount: filteredExpenses.length,
      recurringExpensesTotal,
    };
  }, [periodSales, filteredExpenses, productPriceMap]);

  // Recurring expenses stats
  const activeRecurringCount = useMemo(() => {
    return recurringExpenses.filter((r) => r.is_active).length;
  }, [recurringExpenses]);

  const monthlyRecurringEstimated = useMemo(() => {
    return recurringExpenses
      .filter((r) => r.is_active)
      .reduce((sum, r) => {
        if (r.frequency === 'monthly') return sum + r.amount;
        if (r.frequency === 'daily') return sum + r.amount * 30;
        if (r.frequency === 'weekly') return sum + r.amount * 4.33;
        if (r.frequency === 'yearly') return sum + r.amount / 12;
        return sum + r.amount;
      }, 0);
  }, [recurringExpenses]);

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteExpense(expenseToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('খরচের রেকর্ড সফলভাবে মুছে ফেলা হয়েছে', 'success');
      setExpenseToDelete(null);
    }
  };

  const handleDeleteRecurringConfirm = async () => {
    if (!recurringToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteRecurringExpense(recurringToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('স্বয়ংক্রিয় নির্দিষ্ট খরচের শিডিউল মুছে ফেলা হয়েছে', 'success');
      setRecurringToDelete(null);
    }
  };

  const handleManualSyncRecurring = async () => {
    setSyncLoading(true);
    const res = await triggerRecurringExpensesSync();
    setSyncLoading(false);
    if (res.error) {
      showToast(res.error, 'error');
    } else if (res.generatedCount > 0) {
      showToast(`${res.generatedCount}টি বকেয়া স্বয়ংক্রিয় খরচ সফলভাবে যোগ করা হয়েছে!`, 'success');
    } else {
      showToast('সব স্বয়ংক্রিয় নির্দিষ্ট খরচ ইতোমধ্যে আপ-টু-ডেট আছে!', 'info');
    }
  };

  const handleDatePresetChange = (preset: DateRangePreset, start: string, end: string) => {
    setDatePreset(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    const range = getDateRangeFromPreset('this_month');
    setDatePreset('this_month');
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const periodLabelName = useMemo(() => {
    const found = DATE_PRESETS.find((p) => p.key === datePreset);
    return found ? `${found.labelBn} (${found.labelEn})` : 'নির্বাচিত সময়';
  }, [datePreset]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>খরচ ও স্বয়ংক্রিয় ব্যয়ের হিসাব (Expense Management)</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {expenses.length}টি এন্ট্রি
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            দোকান ভাড়া, কর্মচারীর বেতন, বিদ্যুৎ বিল ও স্বয়ংক্রিয় নির্দিষ্ট খরচের নির্ভুল ট্র্যাকার
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setRecurringToEdit(null);
              setIsRecurringModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="মাসিক দোকান ভাড়া, বেতন বা ইন্টারনেট বিল স্বয়ংক্রিয় শিডিউল করুন"
          >
            <Repeat className="w-4 h-4 text-purple-600" />
            <span>+ স্বয়ংক্রিয় নির্দিষ্ট খরচ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExpenseToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন খরচ যোগ করুন (Add Expense)</span>
          </button>
        </div>
      </div>

      {/* Unified Date Range Filter Bar with Period Closing Button */}
      <DateRangeFilterBar
        preset={datePreset}
        startDate={startDate}
        endDate={endDate}
        onPresetChange={handleDatePresetChange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleResetFilters}
        extraRightAction={
          <button
            type="button"
            onClick={() => setIsPeriodClosingModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            title="নির্বাচিত সময়কালের সমাপ্তি হিসাব ও সমন্বিত লাভ-ক্ষতি ক্লোজ করুন"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>হিসাব ক্লোজ করুন (Close Period)</span>
          </button>
        }
      />

      {/* Dynamic Automated Summary Cards: Sales, COGS, Expenses, Net Profit, Cash Received & Due */}
      <DynamicProfitSummaryCards
        metrics={periodMetrics}
        periodLabel={periodLabelName}
      />

      {/* Sub-Tabs: খরচের তালিকা vs স্বয়ংক্রিয় নির্দিষ্ট খরচ (Recurring Schedules) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>খরচের তালিকা (Expenses List)</span>
          <span className="text-[11px] opacity-80 px-1.5 py-0.2 rounded-full bg-black/10">
            {filteredExpenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recurring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'recurring'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>স্বয়ংক্রিয় নির্দিষ্ট খরচ শিডিউল (Recurring Costs)</span>
          <span className="text-[11px] opacity-80 px-1.5 py-0.2 rounded-full bg-black/10">
            {recurringExpenses.length}
          </span>
        </button>

        {activeTab === 'recurring' && (
          <button
            type="button"
            onClick={handleManualSyncRecurring}
            disabled={syncLoading}
            className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="এখনই স্বয়ংক্রিয় খরচ চেক ও সিঙ্ক করুন"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${syncLoading ? 'animate-spin' : ''}`} />
            <span>{syncLoading ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক চেক করুন'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: STANDARD EXPENSES TABLE */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="খরচের নাম, ক্যাটাগরি বা বিবরণ দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                <option value="all">সকল ক্যাটাগরি (All Categories)</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.labelBn} ({c.labelEn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">খরচের তালিকা লোড হচ্ছে...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">কোনো খরচের হিসাব পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== 'all' || startDate || endDate
                  ? 'নির্বাচিত ফিল্টারের সাথে কোনো খরচ মেলেনি।'
                  : 'এখনো কোনো খরচের হিসাব যোগ করা হয়নি।'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>খরচ যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">তারিখ</th>
                      <th className="px-4 py-3.5">খরচের শিরোনাম</th>
                      <th className="px-4 py-3.5">ক্যাটাগরি</th>
                      <th className="px-4 py-3.5">ধরন</th>
                      <th className="px-4 py-3.5">বিবরণ</th>
                      <th className="px-4 py-3.5 text-right">টাকার পরিমাণ (৳)</th>
                      <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => {
                      const catDef = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                      const displayDate = exp.expense_date || exp.date;
                      const isAuto = exp.is_recurring_auto || Boolean(exp.recurring_expense_id);

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {formatDate(displayDate)}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {exp.title || catDef?.labelBn || exp.category}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${catDef?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {catDef?.labelBn || exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {isAuto ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Repeat className="w-3 h-3" />
                                <span>স্বয়ংক্রিয়</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                ম্যানুয়াল
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                            {exp.description || <span className="text-slate-400 italic">বিবরণ নেই</span>}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-rose-600 text-sm">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpenseToEdit(exp);
                                  setIsFormModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="খরচের হিসাব এডিট করুন"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpenseToDelete(exp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="খরচের এন্ট্রি মুছুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-bold">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-slate-600 text-right">
                        তালিকায় প্রদর্শিত মোট খরচ:
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-600 text-sm">
                        {formatCurrency(periodMetrics.totalExpenses)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECURRING EXPENSES SCHEDULES */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          {/* Recurring Top Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">সক্রিয় শিডিউল সংখ্যা</span>
              <p className="text-xl font-extrabold text-purple-700 mt-1">{activeRecurringCount}টি শিডিউল</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">সর্বমোট {recurringExpenses.length}টি সেট করা আছে</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">আনুমানিক মাসিক স্বয়ংক্রিয় খরচ</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(monthlyRecurringEstimated)}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">ভাড়া, বেতন, ইন্টারনেট ইত্যাদি মিলিয়ে</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold">স্বয়ংক্রিয় হিসাবের সুবিধা</span>
                <p className="text-xs font-medium text-slate-700 mt-1">
                  তারিখ পৌঁছালেই স্বয়ংক্রিয়ভাবে মূল খরচের টেবিলে যোগ হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecurringToEdit(null);
                  setIsRecurringModalOpen(true);
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                + নতুন শিডিউল
              </button>
            </div>
          </div>

          {/* Recurring Schedules List */}
          {recurringExpenses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">কোনো স্বয়ংক্রিয় খরচ শিডিউল নেই</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                প্রতি মাসে দোকান ভাড়া, কর্মচারীর বেতন, ইন্টারনেট বা বিদ্যুৎ বিল স্বয়ংক্রিয়ভাবে খরচের তালিকায় যোগ করতে নিচের বাটনে ক্লিক করুন।
              </p>
              <button
                type="button"
                onClick={() => {
                  setRecurringToEdit(null);
                  setIsRecurringModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন স্বয়ংক্রিয় খরচ যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">খরচের শিরোনাম</th>
                      <th className="px-4 py-3.5">ক্যাটাগরি</th>
                      <th className="px-4 py-3.5">শিডিউল ফ্রিকোয়েন্সি</th>
                      <th className="px-4 py-3.5">টাকার পরিমাণ (৳)</th>
                      <th className="px-4 py-3.5">স্ট্যাটাস</th>
                      <th className="px-4 py-3.5">মন্তব্য</th>
                      <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recurringExpenses.map((rec) => {
                      const catDef = EXPENSE_CATEGORIES.find((c) => c.value === rec.category);
                      const freqLabels: Record<string, string> = {
                        daily: 'দৈনিক (Daily)',
                        weekly: `সাপ্তাহিক (Day ${rec.day_of_week ?? 0})`,
                        monthly: `প্রতি মাসের ${rec.day_of_month || 1} তারিখ`,
                        yearly: 'বাৎসরিক (Yearly)',
                      };

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {rec.title}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${catDef?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {catDef?.labelBn || rec.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 font-semibold flex items-center gap-1.5 mt-3">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{freqLabels[rec.frequency] || rec.frequency}</span>
                          </td>
                          <td className="px-4 py-3.5 font-black text-rose-600 text-sm">
                            {formatCurrency(rec.amount)}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => updateRecurringExpense(rec.id, { is_active: !rec.is_active })}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                                rec.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {rec.is_active ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs max-w-xs truncate">
                            {rec.notes || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setRecurringToEdit(rec);
                                  setIsRecurringModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                title="শিডিউল সম্পাদনা করুন"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecurringToDelete(rec)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="শিডিউল মুছে ফেলুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expense Modal (Add / Edit) */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        expenseToEdit={expenseToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setExpenseToEdit(null);
        }}
      />

      {/* Recurring Expense Modal (Add / Edit) */}
      <RecurringExpenseModal
        isOpen={isRecurringModalOpen}
        recurringToEdit={recurringToEdit}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setRecurringToEdit(null);
        }}
      />

      {/* Accounting Period Closing Modal */}
      <PeriodClosingModal
        isOpen={isPeriodClosingModalOpen}
        onClose={() => setIsPeriodClosingModalOpen(false)}
        metrics={periodMetrics}
        startDate={startDate}
        endDate={endDate}
        periodName={periodLabelName}
      />

      {/* Delete Expense Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="খরচের হিসাব মুছুন (Delete Expense)"
        message={`আপনি কি নিশ্চিত যে "${expenseToDelete?.title || expenseToDelete?.category}" বাবদ ${expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''} খরচের রেকর্ডটি মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />

      {/* Delete Recurring Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(recurringToDelete)}
        onClose={() => setRecurringToDelete(null)}
        onConfirm={handleDeleteRecurringConfirm}
        title="স্বয়ংক্রিয় খরচের শিডিউল মুছুন"
        message={`আপনি কি নিশ্চিত যে "${recurringToDelete?.title}" স্বয়ংক্রিয় খরচের শিডিউলটি মুছে ফেলতে চান? পূর্বে তৈরি হওয়া খরচের এন্ট্রিগুলো বহাল থাকবে।`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
