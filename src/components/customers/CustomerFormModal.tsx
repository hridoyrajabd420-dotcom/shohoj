import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { User, Phone, Mail, MapPin, DollarSign, ArrowRight, FileText } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const { addCustomer, updateCustomer } = useData();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAmount, setDueAmount] = useState<number | ''>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setNotes(customerToEdit.notes || '');
      setDueAmount(customerToEdit.due_amount);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setDueAmount(0);
    }
    setErrorMsg(null);
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('গ্রাহকের নাম প্রদান করুন (Customer name is required)');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      total_purchase: customerToEdit ? customerToEdit.total_purchase : 0,
      due_amount: Number(dueAmount) || 0,
    };

    if (customerToEdit) {
      const { error } = await updateCustomer(customerToEdit.id, payload);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        showToast('গ্রাহকের তথ্য সফলভাবে আপডেট হয়েছে', 'success');
        onClose();
      }
    } else {
      const { error } = await addCustomer(payload);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        showToast('নতুন গ্রাহক সফলভাবে যুক্ত করা হয়েছে', 'success');
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'গ্রাহকের তথ্য সম্পাদনা (Edit Customer)' : 'নতুন গ্রাহক যোগ করুন (Add Customer)'}
      subtitle="গ্রাহকের যোগাযোগের তথ্য এবং বাকির খাতার হিসাব রাখুন"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            গ্রাহকের নাম (Customer Name) *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="যেমন: মোঃ কামাল হোসেন"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            মোবাইল নম্বর (Phone Number)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="tel"
              placeholder="যেমন: 017XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ঠিকানা (Address - ঐচ্ছিক)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="যেমন: বাড়ি নং ১২, রোড ৩, মিরপুর, ঢাকা"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Notes (Customer field required by Part B) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            নোট বা মন্তব্য (Notes - ঐচ্ছিক)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="গ্রাহক সম্পর্কে যেকোনো বিশেষ নোট..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Initial Due Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            প্রারম্ভিক বকেয়া (Initial Due Amount ৳)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="number"
              min="0"
              step="any"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            পূর্বের কোনো বকেয়া থাকলে এখানে লিখতে পারেন। পরবর্তীতে বিক্রয়ের বকেয়া স্বয়ংক্রিয়ভাবে যোগ হবে।
          </p>
        </div>

        {/* Action Buttons */}
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
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{customerToEdit ? 'হালনাগাদ করুন' : 'গ্রাহক সংরক্ষণ করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
