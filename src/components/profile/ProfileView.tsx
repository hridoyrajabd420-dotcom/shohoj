import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { BUSINESS_TYPES } from '../../lib/formatters';
import {
  User,
  Mail,
  Phone,
  Store,
  Briefcase,
  Check,
  ShieldCheck,
  Sparkles,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, user, updateProfile } = useAuth();
  const { proAccess, subscription } = useData();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBusinessName(profile.business_name || '');
      setBusinessType(profile.business_type || BUSINESS_TYPES[0]);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !businessName.trim()) {
      setErrorMsg('পূর্ণ নাম এবং ব্যবসার নাম প্রদান করা বাধ্যতামূলক');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      business_name: businessName.trim(),
      business_type: businessType,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      showToast('প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে', 'success');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ব্যবহারকারী ও ব্যবসার প্রোফাইল (User Profile)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          আপনার ব্যবসার বিবরণ, যোগাযোগের তথ্য এবং প্রোফাইল সংশোধন করুন
        </p>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Email read-only */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              লগইন ইমেইল (Login Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                disabled
                value={profile?.email || user?.email || ''}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              নিরাপত্তার স্বার্থে ইমেইল পরিবর্তন করা যায় না।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার পূর্ণ নাম (Full Name) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="আপনার নাম"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর (Phone Number)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ব্যবসার নাম (Business Name) *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="আপনার দোকানের বা প্রতিষ্ঠানের নাম"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ব্যবসার ধরন (Business Type)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Supabase ডেটাবেজে সংরক্ষিত</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>প্রোফাইল আপডেট করুন (Save Changes)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Details Card (Part 2 Feature 1) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">সাবস্ক্রিপশন ও মেম্বারশিপ স্ট্যাটাস</h3>
              <p className="text-[11px] text-slate-500">অ্যাকাউন্টের প্ল্যান, মেয়াদ ও এক্সেস স্তর</p>
            </div>
          </div>

          <div>
            {proAccess.isProActive ? (
              <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> PRO ACTIVE
              </span>
            ) : proAccess.hasExpired ? (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full flex items-center gap-1 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" /> EXPIRED PRO
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-200">
                FREE সাধারণ প্ল্যান
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">প্ল্যানের ধরন</span>
            <span className="font-bold text-slate-800 uppercase">{proAccess.effectivePlan}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">স্ট্যাটাস</span>
            <span className={`font-bold capitalize ${proAccess.isProActive ? 'text-emerald-700' : 'text-slate-700'}`}>
              {proAccess.status}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">মেয়াদ উত্তীর্ণের তারিখ</span>
            <span className="font-bold text-slate-800">
              {proAccess.expiresAt
                ? new Date(proAccess.expiresAt).toLocaleDateString('bn-BD')
                : 'আনলিমিটেড / প্রযোজ্য নয়'}
            </span>
          </div>
        </div>

        {proAccess.hasExpired && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              আপনার প্রো প্ল্যানের মেয়াদ শেষ হয়েছে। মেম্বারশিপ সক্রিয় না থাকায় অ্যাকাউন্টটি বর্তমানে Free ফিচারগুলো ব্যবহার করছে।
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
