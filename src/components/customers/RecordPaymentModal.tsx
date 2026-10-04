import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { DollarSign, Calendar, CreditCard, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { recordCustomerPayment } = useData();
  const { showToast } = useToast();

  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentDue = Number(customer?.due_amount || 0);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('CASH');
      setNotes('');
      setErrorMsg(null);
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  const handlePayFull = () => {
    setAmount(currentDue);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      setErrorMsg('পরিশোধের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে (Enter a valid amount)');
      return;
    }

    if (payAmount > currentDue) {
      setErrorMsg(
        `পরিশোধের পরিমাণ (${formatCurrency(payAmount)}) বর্তমান বকেয়া পাওনা (${formatCurrency(currentDue)})-এর চেয়ে বেশি হতে পারবে না।`
      );
      return;
    }

    setLoading(true);

    const res = await recordCustomerPayment({
      customerId: customer.id,
      amount: payAmount,
      paymentDate,
      paymentMethod,
      notes: notes.trim(),
    });

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      showToast(
        `গ্রাহক ${customer.name}-এর নিকট হতে ${formatCurrency(payAmount)} বকেয়া আদায় সফলভাবে রেকর্ড হয়েছে`,
        'success'
      );
      onClose();
    }
  };

  const remainingDueAfter = Math.max(0, currentDue - (Number(amount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বকেয়া আদায় গ্রহণ (Record Customer Payment)"
      subtitle={`গ্রাহক: ${customer.name} • বর্তমান বকেয়া পাওনা: ${formatCurrency(currentDue)}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Due Banner */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-amber-800 font-semibold block">বর্তমান অপরিশোধিত বকেয়া:</span>
            <span className="text-base font-black text-amber-900">{formatCurrency(currentDue)}</span>
          </div>

          {currentDue > 0 && (
            <button
              type="button"
              onClick={handlePayFull}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>সম্পূর্ণ পরিশোধ</span>
            </button>
          )}
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            আদায়ের পরিমাণ (Payment Amount ৳) *
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="number"
              min="0.01"
              max={currentDue}
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold text-slate-900"
            />
          </div>
          {Number(amount) > 0 && (
            <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
              <span>পরিশোধের পর অবশিষ্ট বকেয়া:</span>
              <strong className={remainingDueAfter > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formatCurrency(remainingDueAfter)}
              </strong>
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            পরিশোধের মাধ্যম (Payment Method) *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'CASH', label: 'নগদ (Cash)' },
              { id: 'BKASH', label: 'বিকাশ' },
              { id: 'NAGAD', label: 'নগদ (App)' },
              { id: 'BANK', label: 'ব্যাংক' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all truncate text-center ${
                  paymentMethod === m.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            আদায়ের তারিখ (Payment Date) *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            নোট বা রশিদ নম্বর (Notes / Reference - ঐচ্ছিক)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="যেমন: রশিদ নং ১২৩৪ বা আংশিক বকেয়া পরিশোধ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading || currentDue <= 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>বকেয়া আদায় নিশ্চিত করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
