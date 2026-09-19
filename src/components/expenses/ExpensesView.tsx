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
  ArrowDownRight,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, deleteExpense, loading } = useData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Category spent map
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    return map;
  }, [expenses]);

  // Total expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteExpense(expenseToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('খরচের রেকর্ড মুছে ফেলা হয়েছে', 'success');
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>খরচ ও ব্যয়ের হিসাব</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {expenses.length}টি এন্ট্রি
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            দোকান ভাড়া, বেতন, ইউটিলিটি ও আনুষঙ্গিক খরচের তালিকা
          </p>
        </div>

        <button
          onClick={() => setIsFormModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন খরচ যোগ করুন (Add Expense)</span>
        </button>
      </div>

      {/* Category Totals Pills Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">ক্যাটাগরি অনুযায়ী মোট ব্যয়:</span>
          <span className="text-sm font-black text-rose-600">
            সর্বমোট: {formatCurrency(totalExpenses)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {EXPENSE_CATEGORIES.map((cat) => {
            const spent = categoryTotals[cat.value] || 0;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(categoryFilter === cat.value ? 'all' : cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                  categoryFilter === cat.value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.labelBn}</span>
                <span className={`text-[11px] font-bold ${categoryFilter === cat.value ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {formatCurrency(spent)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ক্যাটাগরি বা খরচের বিবরণ দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {categoryFilter !== 'all' && (
          <button
            onClick={() => setCategoryFilter('all')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors shrink-0"
          >
            ফিল্টার রিসেট (সব খরচ দেখুন)
          </button>
        )}
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
          <h3 className="text-sm font-bold text-slate-800">কোনো খরচের হিসাব নেই</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'all'
              ? 'অনুসন্ধানের সাথে কোনো খরচ মেলেনি।'
              : 'এখনো কোনো খরচের হিসাব লিপিবদ্ধ করা হয়নি। প্রথম খরচ যোগ করুন।'}
          </p>
          <button
            onClick={() => setIsFormModalOpen(true)}
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
                  <th className="px-4 py-3.5">ক্যাটাগরি</th>
                  <th className="px-4 py-3.5">বিবরণ</th>
                  <th className="px-4 py-3.5 text-right">টাকার পরিমাণ (৳)</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const catDef = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${catDef?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {catDef?.labelBn || exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {exp.description || <span className="text-slate-400 italic">বিবরণ নেই</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-rose-600 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right flex items-center justify-end gap-1">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
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
        message="আপনি কি নিশ্চিত যে এই খরচের রেকর্ডটি মুছে ফেলতে চান?"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
