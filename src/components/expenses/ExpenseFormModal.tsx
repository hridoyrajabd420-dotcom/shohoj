import React, { useState, useEffect } from 'react';
import { ExpenseCategory, Expense } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { EXPENSE_CATEGORIES } from '../../lib/formatters';
import { Receipt, Calendar, FileText, ArrowRight } from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { addExpense, updateExpense } = useData();
  const { showToast } = useToast();

  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setCategory(expenseToEdit.category);
        setAmount(expenseToEdit.amount);
        setDescription(expenseToEdit.description || '');
        setDate(expenseToEdit.date);
      } else {
        setCategory('Rent');
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
      setErrorMsg(null);
    }
  }, [isOpen, expenseToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const expenseAmount = Number(amount);
    if (!expenseAmount || expenseAmount <= 0) {
      setErrorMsg('খরচের সঠিক পরিমাণ প্রদান করুন (Enter a valid amount)');
      return;
    }

    setLoading(true);

    let res: { error: string | null };

    if (expenseToEdit) {
      res = await updateExpense(expenseToEdit.id, {
        category,
        amount: expenseAmount,
        description: description.trim(),
        date,
      });
    } else {
      res = await addExpense({
        category,
        amount: expenseAmount,
        description: description.trim(),
        date,
      });
    }

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      showToast(
        expenseToEdit
          ? 'খরচের হিসাব সফলভাবে আপডেট করা হয়েছে'
          : 'খরচের হিসাব সফলভাবে লিপিবদ্ধ হয়েছে',
        'success'
      );
      setAmount('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'খরচের হিসাব এডিট করুন (Edit Expense)' : 'নতুন খরচ যোগ করুন (Add Expense)'}
      subtitle="দোকান বা ব্যবসায়িক ব্যয়ের হিসাব রাখুন সঠিক লাভ গণনার জন্য"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            খরচের ক্যাটাগরি (Expense Category) *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value as ExpenseCategory)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left truncate ${
                  category === cat.value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.labelBn}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            টাকার পরিমাণ (Amount ৳) *
          </label>
          <div className="relative">
            <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="number"
              min="1"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            খরচের বিবরণ (Description)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="যেমন: চলতি মাসের দোকান ভাড়া / বিদ্যুৎ বিল"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            তারিখ (Date) *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>সংরক্ষণ করুন (Save Expense)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
