import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { PaymentMethod } from '../../types';
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  XCircle,
  AlertCircle,
  Upload,
  Send,
  HelpCircle,
  Check,
  FileText,
} from 'lucide-react';

export const ProUpgradeView: React.FC = () => {
  const { user, profile } = useAuth();
  const { paymentRequests, submitPaymentRequest, businessSettings, proAccess, activateProSubscription } = useData();
  const { showToast } = useToast();

  const isPro = proAccess.isProActive;
  const hasExpired = proAccess.hasExpired;

  // Selected billing cycle
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');

  // Payment form state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(billingCycle === 'yearly' ? '2990' : '990');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(profile?.business_name || '');
  const [message, setMessage] = useState('');
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update amount if billing cycle changes
  const handleBillingCycleChange = (cycle: 'yearly' | 'monthly') => {
    setBillingCycle(cycle);
    setPaymentAmount(cycle === 'yearly' ? '2990' : '990');
  };

  // Handle screenshot file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('স্ক্রিনশটের সাইজ সর্বোচ্চ 4MB হতে পারবে', 'error');
      return;
    }

    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmed) {
      showToast('দয়া করে তথ্যের সত্যতা নিশ্চিতকরণ চেকবক্সে টিক দিন', 'error');
      return;
    }

    if (!senderNumber.trim()) {
      showToast('প্রেরক মোবাইল নম্বর লিখুন', 'error');
      return;
    }

    if (!transactionId.trim()) {
      showToast('ট্রানজেকশন আইডি (TrxID) লিখুন', 'error');
      return;
    }

    const numericAmount = parseFloat(paymentAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('সঠিক টাকার পরিমাণ উল্লেখ করুন', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitPaymentRequest({
        payment_method: selectedMethod,
        sender_number: senderNumber.trim(),
        transaction_id: transactionId.trim().toUpperCase(),
        amount: numericAmount,
        payment_date: paymentDate,
        reference: reference.trim(),
        screenshot: screenshotData,
        message: message.trim(),
      });

      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          'পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! ম্যানুয়াল ভেরিফিকেশন সাপেক্ষে খুব দ্রুত প্রো প্ল্যান সক্রিয় হবে।',
          'success'
        );
        // Reset form
        setSenderNumber('');
        setTransactionId('');
        setScreenshotData('');
        setScreenshotFileName('');
        setMessage('');
        setIsConfirmed(false);
      }
    } catch {
      showToast('পেমেন্ট রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Configurable / default placeholder payment accounts (not hardcoded real numbers)
  const bkashNumber = businessSettings?.payment_bkash_number || '01XXXXXXXXX (Personal Send Money)';
  const nagadNumber = businessSettings?.payment_nagad_number || '01XXXXXXXXX (Send Money)';
  const bankInfo =
    businessSettings?.payment_bank_info ||
    'Bank: City Bank / Dutch-Bangla Bank | A/C: 1234567890123 | A/C Name: Shohoj Bebsha';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Current Plan Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">আপনার বর্তমান প্ল্যান</span>
            {isPro ? (
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> PRO এক্টিভ
              </span>
            ) : hasExpired ? (
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> মেয়াদোত্তীর্ণ PRO (Expired)
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                FREE সাধারণ প্ল্যান
              </span>
            )}

            {isPro && proAccess.daysRemaining !== null && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                মেয়াদ বাকি: {proAccess.daysRemaining} দিন
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isPro ? 'Shohoj Bebsha Pro সদস্য' : hasExpired ? 'প্রো প্ল্যানের মেয়াদ শেষ হয়েছে' : 'সহজ ব্যবসা প্রো-তে আপগ্রেড করুন'}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            {isPro
              ? `আপনার প্রো প্ল্যান সক্রিয় রয়েছে। আপনি সকল অ্যাডভান্সড ফিচার ও রিপোর্ট আনলিমিটেড উপভোগ করছেন।${
                  proAccess.expiresAt ? ` (মেয়াদ: ${new Date(proAccess.expiresAt).toLocaleDateString('bn-BD')})` : ''
                }`
              : hasExpired
              ? 'আপনার প্রো মেম্বারশিপের মেয়াদ উত্তীর্ণ হওয়ায় অ্যাকাউন্টটি স্বয়ংক্রিয়ভাবে Free মোডে পরিচালিত হচ্ছে। পুনরায় সচল করতে নিচের ফর্মটি ব্যবহার করুন।'
              : 'আর্থিক হিসাব, প্রফেশনাল ইনভয়েস, সাপ্লায়ার ম্যানেজমেন্ট ও ৮টি অ্যাডভান্সড রিপোর্টের মাধ্যমে আপনার ব্যবসাকে ডিজিটালাইজ করুন।'}
          </p>
        </div>

        {!isPro && (
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-stretch md:self-auto justify-center">
            <button
              onClick={() => handleBillingCycleChange('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              মাসিক (৳৯৯০)
            </button>
            <button
              onClick={() => handleBillingCycleChange('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>বার্ষিক (৳২,৯৯০)</span>
              <span className="ml-1 text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                সেভ ৭৫%
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Plan Feature Comparison Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FREE PLAN */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Shohoj Free</h3>
                <p className="text-xs text-slate-500">ছোট ব্যবসার নিত্যপ্রয়োজনীয় সমাধান</p>
              </div>
              <span className="text-2xl font-black text-slate-900">৳০</span>
            </div>
            <hr className="border-slate-100 my-4" />
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>পণ্য ও সাধারণ স্টক এন্ট্রি</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>দৈনিক বিক্রয় ও লেনদেন রেকর্ড</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>সাধারণ খরচের খাতা ক্যাটাগরিভিত্তিক</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>গ্রাহক ডিরেক্টরি ও বাকির হিসাব</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>মৌলিক ড্যাশবোর্ড ওভারভিউ</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100">
            <span className="block text-center text-xs font-semibold text-slate-500 py-2">
              ডিফল্ট ফ্রি লাইফটাইম প্ল্যান
            </span>
          </div>
        </div>

        {/* PRO PLAN */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-32 h-32 text-amber-400" />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 mb-2">
                  জনপ্রিয়
                </span>
                <h3 className="text-xl font-black">Shohoj Pro</h3>
                <p className="text-xs text-slate-300">পূর্ণাঙ্গ ডিজিটাল বিজনেস ম্যানেজমেন্ট</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-amber-400">
                  {billingCycle === 'yearly' ? '৳২,৯৯০' : '৳৯৯০'}
                </span>
                <p className="text-[10px] text-slate-400">{billingCycle === 'yearly' ? '/বছর' : '/মাস'}</p>
              </div>
            </div>

            <hr className="border-white/10 my-4" />

            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">বিস্তারিত লাভ-ক্ষতি (P&L) ও আর্থিক বিশ্লেষণ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ক্রয় অর্ডার, স্টক এডজাস্টমেন্ট ও ইনভেন্টরি ভ্যালুয়েশন</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>সাপ্লায়ার খাতা (Payables) ও বাকি আদায়ের স্বয়ংক্রিয় ট্র্যাকিং</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>প্রফেশনাল ইনভয়েস ও কোটেশন জেনারেটর (PDF & Print)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>৮টি অ্যাডভান্সড রিপোর্ট ও স্মার্ট ব্যবসায়িক পর্যবেক্ষণ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>৯টি রেডি বিজনেস ক্যালকুলেটর (ROI, Break-even, Pricing ইত্যাদি)</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 relative z-10">
            {isPro ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl py-2.5 text-center text-xs font-bold text-emerald-300">
                ✓ আপনার প্রো প্ল্যান বর্তমানে সক্রিয় রয়েছে
              </div>
            ) : (
              <a
                href="#activation-form"
                className="block text-center py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                নিচে পেমেন্ট করে অ্যাক্টিভেশন ফর্ম পূরণ করুন ↓
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          পেমেন্ট মাধ্যম ও নির্দেশিকা
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          নিচের যে কোনো একটি মাধ্যমে নির্ধারিত ফি পাঠিয়ে নিচের ফর্মটি পূরণ করুন:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* bKash */}
          <div
            onClick={() => setSelectedMethod('bkash')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedMethod === 'bkash'
                ? 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-pink-700">বিকাশ (bKash)</span>
              {selectedMethod === 'bkash' && <CheckCircle2 className="w-4 h-4 text-pink-600" />}
            </div>
            <p className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 mb-2">
              {bkashNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              * Send Money করে TrxID সংরক্ষণ করুন।
            </p>
          </div>

          {/* Nagad */}
          <div
            onClick={() => setSelectedMethod('nagad')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedMethod === 'nagad'
                ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-orange-700">নগদ (Nagad)</span>
              {selectedMethod === 'nagad' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
            </div>
            <p className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 mb-2">
              {nagadNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              * Send Money করে TrxID সংরক্ষণ করুন।
            </p>
          </div>

          {/* Bank */}
          <div
            onClick={() => setSelectedMethod('bank')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedMethod === 'bank'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-blue-700">ব্যাংক ট্রান্সফার</span>
              {selectedMethod === 'bank' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 mb-2 font-mono">
              {bankInfo}
            </p>
            <p className="text-[11px] text-slate-500">
              * ডিপোজিট স্লিপ বা অ্যাপের স্ক্রিনশট আপলোড করুন।
            </p>
          </div>
        </div>
      </div>

      {/* PRO ACTIVATION FORM */}
      <div id="activation-form" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">প্রো অ্যাক্টিভেশন রিকোয়েস্ট ফর্ম</h3>
            <p className="text-xs text-slate-500">
              পেমেন্ট সম্পন্ন করার পর নিচের সঠিক তথ্যগুলো পূরণ করে রিকোয়েস্ট পাঠান।
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
            অ্যাক্টিভেশন
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal & Business Info (Auto filled from profile) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              ব্যক্তিগত ও ব্যবসায়ের তথ্য
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">পূর্ণ নাম</label>
                <input
                  type="text"
                  disabled
                  value={profile?.full_name || 'Business Owner'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ইমেইল</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ব্যবসার নাম</label>
                <input
                  type="text"
                  disabled
                  value={profile?.business_name || 'আমার ব্যবসা'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-400" />
              পেমেন্ট সংক্রান্ত তথ্য
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পেমেন্ট মেথড <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  প্রেরক নম্বর / অ্যাকাউন্ট <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 9J3K8L2M9P"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">পেমেন্টের তারিখ</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">রেফারেন্স / নোট</label>
                <input
                  type="text"
                  placeholder="রেফারেন্স নম্বর বা টেক্সট"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                পেমেন্ট স্ক্রিনশট / মানি রিসিট (ঐচ্ছিক কিন্তু যাচাইয়ে সহায়ক)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="screenshot-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    ছবি সিলেক্ট করুন
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    PNG, JPG বা WEBP (সর্বোচ্চ 4MB)
                  </span>
                </label>
                {screenshotFileName && (
                  <div className="mt-2 text-xs font-medium text-emerald-700 flex items-center justify-center gap-1.5 bg-emerald-50 py-1 px-3 rounded-lg max-w-xs mx-auto">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{screenshotFileName}</span>
                  </div>
                )}
                {screenshotData && (
                  <div className="mt-3 max-w-[200px] mx-auto rounded-lg overflow-hidden border border-slate-200">
                    <img src={screenshotData} alt="Payment Preview" className="w-full h-auto object-cover max-h-32" />
                  </div>
                )}
              </div>
            </div>

            {/* Message / Additional Note */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">অতিরিক্ত কোনো মেসেজ / বার্তা</label>
              <textarea
                rows={2}
                placeholder="প্রয়োজনীয় কোনো তথ্য থাকলে লিখতে পারেন..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Verification Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">গুরুত্বপূর্ণ নোটিশ:</span> ফর্মটি সাবমিট করার পর স্বয়ংক্রিয়ভাবে প্রো সক্রিয় হবে না। আমাদের টিম পেমেন্টটি ম্যানুয়ালি যাচাই করার পর আপনার অ্যাকাউন্টটিকে PRO প্ল্যানে আপগ্রেড করবে। অনুমোদন সম্পন্ন হওয়া পর্যন্ত অ্যাকাউন্টটি FREE প্ল্যানে থাকবে।
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="confirm-payment-info"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="confirm-payment-info" className="text-xs text-slate-700 select-none cursor-pointer leading-tight">
              আমি নিশ্চিত করছি যে প্রদত্ত পেমেন্ট সংক্রান্ত যাবতীয় তথ্য সঠিক ও সত্য। (I confirm that the payment information I submitted is correct.)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isConfirmed}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                রিকোয়েস্ট প্রসেসিং হচ্ছে...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Pro Activation Request (প্রো অ্যাক্টিভেশন রিকোয়েস্ট পাঠান)
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Payment Requests History & Status */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">আপনার সাবমিটকৃত পেমেন্ট রিকোয়েস্টসমূহ</h3>
            <p className="text-xs text-slate-500">আপনার প্রেরিত রিকোয়েস্টের ভেরিফিকেশন স্ট্যাটাস ট্র্যাক করুন</p>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            মোট: {paymentRequests.length}টি
          </span>
        </div>

        {paymentRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">এখনো কোনো পেমেন্ট রিকোয়েস্ট পাঠাননি</p>
            <p className="text-[11px] text-slate-400 mt-0.5">পেমেন্ট করার পর উপরের ফর্মটি পূরণ করে পাঠান।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentRequests.map((req) => {
              const isApproved = req.status === 'approved';
              const isRejected = req.status === 'rejected';
              const isPending = req.status === 'pending';

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 uppercase">
                        {req.payment_method}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        TrxID: {req.transaction_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      প্রেরক: {req.sender_number} • পরিমাণ: <span className="font-bold text-slate-900">৳{req.amount}</span> • তারিখ: {req.payment_date}
                    </p>
                    {req.rejection_reason && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-1.5 rounded-lg">
                        বাতিলের কারণ: {req.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> অপেক্ষমাণ (Pending)
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদিত (PRO Active)
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> প্রত্যাখ্যাত (Rejected)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAQ & Support Section */}
      <div className="p-6 bg-slate-100/70 rounded-3xl border border-slate-200/80 flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800 mb-1">পেমেন্ট সংক্রান্ত সহায়তা প্রয়োজন?</p>
          যেকোনো প্রশ্ন, সাহায্য বা ভেরিফিকেশনে বিলম্বের জন্য আমাদের হেল্পলাইন বা সাপোর্টে যোগাযোগ করতে পারেন। সঠিক TrxID ও প্রেরক নম্বর প্রদান করলে সাধারণ ১-৩ ঘণ্টার মধ্যে ভেরিফিকেশন সম্পন্ন হয়।
        </div>
      </div>
    </div>
  );
};
