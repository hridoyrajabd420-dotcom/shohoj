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
  Building2,
  FileText,
  MapPin,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, user, updateProfile } = useAuth();
  const { businessSettings, updateBusinessSettings } = useData();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('৳');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBusinessName(profile.business_name || '');
      setBusinessType(profile.business_type || BUSINESS_TYPES[0]);
    }
    if (businessSettings) {
      setAddress((businessSettings as any).address || '');
      setLogoUrl(businessSettings.logo_url || '');
      setInvoiceFooter(businessSettings.invoice_footer || '');
      setCurrencySymbol(businessSettings.currency_symbol || '৳');
    }
  }, [profile, businessSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !businessName.trim()) {
      setErrorMsg('পূর্ণ নাম এবং ব্যবসার নাম প্রদান করা বাধ্যতামূলক');
      return;
    }

    setLoading(true);

    const profileRes = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      business_name: businessName.trim(),
      business_type: businessType,
    });

    const settingsRes = await updateBusinessSettings({
      logo_url: logoUrl.trim(),
      invoice_footer: invoiceFooter.trim(),
      currency_symbol: currencySymbol.trim(),
      ...({ address: address.trim(), business_name: businessName.trim(), phone: phone.trim() } as any),
    });

    setLoading(false);

    if (profileRes.error) {
      setErrorMsg(profileRes.error);
    } else if (settingsRes.error) {
      setErrorMsg(settingsRes.error);
    } else {
      showToast('প্রোফাইল ও ব্যবসার তথ্য সফলভাবে সংরক্ষিত হয়েছে', 'success');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ব্যবহারকারী ও ব্যবসার প্রোফাইল (Business Settings)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          আপনার ব্যবসার বিবরণ, যোগাযোগের তথ্য, ইনভয়েস নোট ও ব্র্যান্ডিং সেট করুন (সম্পূর্ণ বিনামূল্যে)
        </p>
      </div>

      {/* Main Profile & Business Settings Form */}
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
            {/* Full Name / Owner */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মালিকের নাম (Owner Name) *
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
                  placeholder="দোকান বা প্রতিষ্ঠানের নাম"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ব্যবসার ঠিকানা (Address)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="যেমন: দোকান নং ১২, নিউ মার্কেট, ঢাকা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মুদ্রা প্রতীক (Currency)
              </label>
              <input
                type="text"
                placeholder="৳"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Business Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ব্যবসার লোগো লিংক (Logo Image URL - Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              ইনভয়েস ও রসিদে এই লোগোটি স্বয়ংক্রিয়ভাবে যুক্ত হবে।
            </p>
          </div>

          {/* Invoice Notes / Footer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইনভয়েস পাদটীকা / নোট (Invoice Footer / Terms)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="ধন্যবাদ! বিক্রিত পণ্য ফেরতযোগ্য নহে।"
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>সংরক্ষণ করুন (Save Changes)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">অ্যাকাউন্ট স্ট্যাটাস</h3>
            <p className="text-[11px] text-slate-500">সহজ ব্যবসার সকল প্রিমিয়াম ফিচার আপনার জন্য উন্মুক্ত</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
          সম্পূর্ণ বিনামূল্যে সক্রিয় (Free & Unrestricted)
        </span>
      </div>
    </div>
  );
};
