import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../../lib/formatters';
import { ExpenseFormModal } from './ExpenseFormModal';
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
} from 'lucide-react';

type DateFilterType = 'all' | 'today' | 'month' | 'custom';

export const ExpensesView: React.FC = () => {
  const { expenses, deleteExpense, loading } = useData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  // Current month prefix YYYY-MM
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Today's total expenses
  const todayExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = e.expense_date || e.date;
        return d && d.startsWith(todayStr);
      })
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses, todayStr]);

  // This month's total expenses
  const thisMonthExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => {
        const d = e.expense_date || e.date;
        return d && d.startsWith(currentMonthStr);
      })
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses, currentMonthStr]);

  // All time total expenses
  const totalAllTimeExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  // Category spent map
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    return map;
  }, [expenses]);

  // Filtered expenses based on search, category, and date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = e.expense_date || e.date || '';

      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q));

      // 2. Category Filter
      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;

      // 3. Date Range Filter
      let matchesDate = true;
      if (dateFilterType === 'today') {
        matchesDate = expDate.startsWith(todayStr);
      } else if (dateFilterType === 'month') {
        matchesDate = expDate.startsWith(currentMonthStr);
      } else if (dateFilterType === 'custom') {
        if (startDate && expDate < startDate) matchesDate = false;
        if (endDate && expDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesCat && matchesDate;
    });
  }, [expenses, searchQuery, categoryFilter, dateFilterType, todayStr, currentMonthStr, startDate, endDate]);

  // Total for currently filtered/selected range
  const selectedRangeTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

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

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDateFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  const isFiltered = searchQuery !== '' || categoryFilter !== 'all' || dateFilterType !== 'all';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>খরচ ও ব্যয়ের হিসাব (Expense Management)</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {expenses.length}টি এন্ট্রি
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            দোকান ভাড়া, কর্মচারীর বেতন, বিদ্যুৎ বিল ও যাবতীয় ব্যবসায়িক ব্যয়ের নির্ভুল হিসাব
          </p>
        </div>

        <button
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

      {/* Expense Metric Cards (Step 5 Requirement: today, this month, selected range, all time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Expense */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">আজকের মোট খরচ (Today)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-amber-700">
            {formatCurrency(todayExpensesTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">আজকের তারিখের খরচসমূহ</p>
        </div>

        {/* This Month's Expense */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">চলতি মাসের খরচ (This Month)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600">
            {formatCurrency(thisMonthExpensesTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">চলতি ক্যালেন্ডার মাস</p>
        </div>

        {/* Selected Date Range Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">নির্বাচিত তারিখের খরচ (Filtered)</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Filter className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-blue-600">
            {formatCurrency(selectedRangeTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">ফিল্টারকৃত {filteredExpenses.length}টি খরচ</p>
        </div>

        {/* Total All-Time Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">সর্বমোট ব্যয় (All Time)</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatCurrency(totalAllTimeExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">সকল এন্ট্রি মিলিয়ে সর্বমোট</p>
        </div>
      </div>

      {/* Date Range & Category Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Date Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>তারিখ ফিল্টার:</span>
            </span>

            <button
              onClick={() => setDateFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সব সময়
            </button>
            <button
              onClick={() => setDateFilterType('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilterType === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              আজকের দিন
            </button>
            <button
              onClick={() => setDateFilterType('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilterType === 'month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setDateFilterType('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilterType === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              কাস্টম তারিখ পরিসীমা
            </button>
          </div>

          {/* Custom Date Pickers */}
          {dateFilterType === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">হতে:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">পর্যন্ত:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Pills Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">ক্যাটাগরি অনুযায়ী ফিল্টার:</span>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ফিল্টার রিসেট করুন</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              সব ক্যাটাগরি ({expenses.length})
            </button>

            {EXPENSE_CATEGORIES.map((cat) => {
              const spent = categoryTotals[cat.value] || 0;
              const isSelected = categoryFilter === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(isSelected ? 'all' : cat.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.labelBn}</span>
                  {spent > 0 && (
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {formatCurrency(spent)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="খরচের শিরোনাম, বিবরণ বা ক্যাটাগরি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-xs"
          />
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">খরচ লোড হচ্ছে...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">কোনো খরচের হিসাব পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isFiltered
              ? 'ফিল্টার বা অনুসন্ধানের সাথে কোনো খরচ মেলেনি। ফিল্টার রিসেট করে দেখুন।'
              : 'এখনো কোনো খরচের হিসাব লিপিবদ্ধ করা হয়নি। প্রথম খরচ যোগ করতে বোতামে ক্লিক করুন।'}
          </p>
          {isFiltered ? (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ফিল্টার রিসেট করুন</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setExpenseToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>খরচ যোগ করুন</span>
            </button>
          )}
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
                  <th className="px-4 py-3.5">বিবরণ</th>
                  <th className="px-4 py-3.5 text-right">টাকার পরিমাণ (৳)</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const catDef = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                  const displayDate = exp.expense_date || exp.date;
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
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                        {exp.description || <span className="text-slate-400 italic">বিবরণ নেই</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-rose-600 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
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
                  <td colSpan={4} className="px-5 py-3 text-slate-600 text-right">
                    তালিকায় প্রদর্শিত মোট খরচ:
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-600 text-sm">
                    {formatCurrency(selectedRangeTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        expenseToEdit={expenseToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setExpenseToEdit(null);
        }}
      />

      {/* Delete Expense Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="খরচের হিসাব মুছুন (Delete Expense)"
        message={`আপনি কি নিশ্চিত যে "${expenseToDelete?.title || expenseToDelete?.category}" বাবদ ${expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''} খরচের রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে সর্বমোট খরচের হিসাব সমন্বয় করা হবে।`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
