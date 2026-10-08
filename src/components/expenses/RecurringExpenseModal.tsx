import React, { useState, useEffect } from 'react';
import { RecurringExpense, RecurringFrequency, ExpenseCategory } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { EXPENSE_CATEGORIES } from '../../lib/formatters';
import { Repeat, Calendar, DollarSign, Tag, Clock, FileText, Check } from 'lucide-react';

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringToEdit?: RecurringExpense | null;
}

export const RecurringExpenseModal: React.FC<RecurringExpenseModalProps> = ({
  isOpen,
  onClose,
  recurringToEdit,
}) => {
  const { addRecurringExpense, updateRecurringExpense } = useData();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [amount, setAmount] = useState<number | ''>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (recurringToEdit) {
        setTitle(recurringToEdit.title);
        setCategory((recurringToEdit.category as ExpenseCategory) || 'Rent');
        setAmount(recurringToEdit.amount);
        setFrequency(recurringToEdit.frequency);
        setDayOfMonth(recurringToEdit.day_of_month ?? 1);
        setDayOfWeek(recurringToEdit.day_of_week ?? 0);
        setExecutionDate(recurringToEdit.execution_date || new Date().toISOString().split('T')[0]);
        setIsActive(recurringToEdit.is_active ?? true);
        setNotes(recurringToEdit.notes || '');
      } else {
        setTitle('');
        setCategory('Rent');
        setAmount('');
        setFrequency('monthly');
        setDayOfMonth(1);
        setDayOfWeek(0);
        setExecutionDate(new Date().toISOString().split('T')[0]);
        setIsActive(true);
        setNotes('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, recurringToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const expenseAmount = Number(amount);
    if (!expenseAmount || expenseAmount <= 0) {
      setErrorMsg('খরচের সঠিক পরিমাণ প্রদান করুন (টাকার পরিমাণ অবশ্যই ০-এর বেশি হতে হবে)');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('দয়া করে খরচের নাম লিখুন (যেমন: দোকান ভাড়া, ইন্টারনেট বিল)');
      return;
    }

    setLoading(true);

    try {
      if (recurringToEdit) {
        const res = await updateRecurringExpense(recurringToEdit.id, {
          title: title.trim(),
          category,
          amount: expenseAmount,
          frequency,
          day_of_month: frequency === 'monthly' ? Number(dayOfMonth) : undefined,
          day_of_week: frequency === 'weekly' ? Number(dayOfWeek) : undefined,
          execution_date: executionDate,
          is_active: isActive,
          notes: notes.trim(),
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        showToast('স্বয়ংক্রিয় নির্দিষ্ট খরচের শিডিউল সফলভাবে আপডেট হয়েছে', 'success');
      } else {
        const res = await addRecurringExpense({
          title: title.trim(),
          category,
          amount: expenseAmount,
          frequency,
          day_of_month: frequency === 'monthly' ? Number(dayOfMonth) : undefined,
          day_of_week: frequency === 'weekly' ? Number(dayOfWeek) : undefined,
          execution_date: executionDate,
          is_active: isActive,
          notes: notes.trim(),
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        showToast('নতুন স্বয়ংক্রিয় নির্দিষ্ট খরচ সফলভাবে সেট করা হয়েছে!', 'success');
      }

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'ত্রুটি ঘটেছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recurringToEdit ? 'স্বয়ংক্রিয় খরচ সম্পাদনা করুন (Edit Recurring Expense)' : 'নতুন স্বয়ংক্রিয় নির্দিষ্ট খরচ যোগ করুন'}
      subtitle="দোকান ভাড়া, ইন্টারনেট বিল, কর্মচারীর বেতন ইত্যাদি স্বয়ংক্রিয় হিসাবভুক্ত করুন"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Title */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            খরচের নাম / বিবরণ (Expense Title) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: দোকান ভাড়া, ইন্টারনেট বিল, বেতন"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              ক্যাটাগরি (Category) <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.labelBn} ({cat.labelEn})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              টাকার পরিমাণ (Amount ৳) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="০.০০"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Frequency Schedule */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            পুনরাবৃত্তি শিডিউল (Schedule Frequency) <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'daily', labelBn: 'দৈনিক', labelEn: 'Daily' },
              { id: 'weekly', labelBn: 'সাপ্তাহিক', labelEn: 'Weekly' },
              { id: 'monthly', labelBn: 'মাসিক', labelEn: 'Monthly' },
              { id: 'yearly', labelBn: 'বাৎসরিক', labelEn: 'Yearly' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id as RecurringFrequency)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                  frequency === f.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <div>{f.labelBn}</div>
                <div className="text-[10px] opacity-75">{f.labelEn}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Specific Config */}
        {frequency === 'monthly' && (
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700">
              প্রতি মাসের কত তারিখে যোগ হবে? (Day of Month)
            </label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  প্রতি মাসের {d} তারিখ (Day {d})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              উদাহরণ: ১ তারিখ দিলে প্রতি মাসের প্রথম দিনে স্বয়ংক্রিয়ভাবে খরচের তালিকায় যোগ হবে।
            </p>
          </div>
        )}

        {frequency === 'weekly' && (
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700">
              সপ্তাহের কোন বারে যোগ হবে? (Day of Week)
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={0}>রবিবার (Sunday)</option>
              <option value={1}>সোমবার (Monday)</option>
              <option value={2}>মঙ্গলবার (Tuesday)</option>
              <option value={3}>বুধবার (Wednesday)</option>
              <option value={4}>বৃহস্পতিবার (Thursday)</option>
              <option value={5}>শুক্রবার (Friday)</option>
              <option value={6}>শনিবার (Saturday)</option>
            </select>
          </div>
        )}

        {/* Start / Base Execution Date */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            কার্যকরী শুরুর তারিখ (Effective Start Date)
          </label>
          <input
            type="date"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
          <div>
            <span className="text-xs font-bold text-slate-800">স্বয়ংক্রিয় হিসাব সক্রিয় রাখুন</span>
            <p className="text-[11px] text-slate-500">বন্ধ রাখলে স্বয়ংক্রিয় খরচ তৈরি হবে না</p>
          </div>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            নোট / মন্তব্য (Optional Notes)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{recurringToEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
