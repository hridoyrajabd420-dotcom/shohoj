import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { BUSINESS_TYPES } from '../../lib/formatters';
import { UserType } from '../../types';
import {
  Mail,
  Lock,
  User,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Briefcase,
  School,
  BookOpen,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  initialUserType?: UserType;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialUserType = 'business',
}) => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(initialUserType);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [institutionName, setInstitutionName] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');

  const handleFillDemo = (typeForDemo: UserType = selectedUserType) => {
    if (typeForDemo === 'student') {
      setEmail('student@shohojbebsha.com');
      setPassword('shohoj123');
      if (mode === 'signup') {
        setFullName('তানভীর আহমেদ');
        setInstitutionName('ঢাকা বিশ্ববিদ্যালয় (University of Dhaka)');
        setFieldOfStudy('ফিন্যান্স ও অ্যাকাউন্টিং (Finance & Accounting)');
        setBusinessName('তানভীরের স্টাডি প্রজেক্ট');
        setBusinessType('Education / Project');
      }
      showToast('শিক্ষার্থী ডেমো তথ্য বসানো হয়েছে! (Student demo filled)', 'success');
    } else {
      setEmail('demo@shohojbebsha.com');
      setPassword('shohoj123');
      if (mode === 'signup') {
        setFullName('মোঃ রফিকুল ইসলাম');
        setBusinessName('রফিক জেনারেল স্টোর');
        setBusinessType(BUSINESS_TYPES[0]);
      }
      showToast('ব্যবসায়িক ডেমো তথ্য বসানো হয়েছে! (Business demo filled)', 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!isConfigured) {
      setErrorMsg('Supabase কনফিগার করা নেই। অনুগ্রহ করে VITE_SUPABASE_URL ও VITE_SUPABASE_ANON_KEY এনভায়রনমেন্ট ভেরিয়েবল সেট করুন। (Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set in your deployment).');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          setErrorMsg('সবগুলো আবশ্যক তথ্য পূরণ করুন (Please fill all required fields)');
          setLoading(false);
          return;
        }

        if (selectedUserType === 'business' && !businessName.trim()) {
          setErrorMsg('ব্যবসার নাম প্রদান করা আবশ্যক (Business name is required)');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Password must be at least 6 characters)');
          setLoading(false);
          return;
        }

        const bName = selectedUserType === 'student'
          ? (businessName.trim() || (institutionName.trim() ? `${institutionName.trim()} - স্টুডেন্ট অ্যাকাউন্ট` : 'শিক্ষার্থী প্রজেক্ট / ব্যক্তিগত হিসাব'))
          : businessName.trim();
        const bType = selectedUserType === 'student' ? 'Student / Academic' : businessType;

        const { error } = await signUp(
          email.trim(),
          password,
          fullName.trim(),
          bName,
          bType,
          selectedUserType,
          institutionName.trim(),
          fieldOfStudy.trim()
        );

        if (error) {
          setErrorMsg(error);
        } else {
          showToast(
            selectedUserType === 'student'
              ? 'অভিনন্দন! শিক্ষার্থী অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। (Student Account created)'
              : 'অভিনন্দন! আপনার ব্যবসা অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। (Business Account created)',
            'success'
          );
          onClose();
        }
      } else if (mode === 'login') {
        if (!email.trim() || !password.trim()) {
          setErrorMsg('ইমেইল এবং পাসওয়ার্ড দিন (Please provide email and password)');
          setLoading(false);
          return;
        }

        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else {
          showToast('সফলভাবে লগইন হয়েছে (Logged in successfully)', 'success');
          onClose();
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('আপনার ইমেইল ঠিকানা দিন (Please enter your email)');
          setLoading(false);
          return;
        }

        const { error } = await resetPassword(email.trim());
        if (error) {
          setErrorMsg(error);
        } else {
          showToast('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে (Reset link sent to your email)', 'success');
          setMode('login');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'signup'
          ? selectedUserType === 'student'
            ? 'শিক্ষার্থী অ্যাকাউন্ট খুলুন (Student Sign Up)'
            : 'নতুন ব্যবসা অ্যাকাউন্ট খুলুন (Business Sign Up)'
          : mode === 'login'
          ? 'লগইন করুন (Login)'
          : 'পাসওয়ার্ড রিসেট (Reset Password)'
      }
      subtitle={
        mode === 'signup'
          ? selectedUserType === 'student'
            ? 'অ্যাকাউন্টিং শেখা, হ্যান্ডস-অন কেস স্টাডি ও ফাইনান্স প্র্যাকটিসের জন্য'
            : 'সহজ ব্যবসা এর সাথে আপনার ব্যবসার হিসাব সহজ ও নির্ভুল করুন'
          : mode === 'login'
          ? 'আপনার সহজ ব্যবসা ড্যাশবোর্ডে প্রবেশ করুন'
          : 'আপনার নিবন্ধিত ইমেইল ঠিকানা লিখুন'
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
            {mode === 'login' && errorMsg.includes('Invalid login credentials') && (
              <div className="pt-1.5 border-t border-rose-200/80 flex items-center justify-between">
                <span className="text-[11px] text-rose-800">অ্যাকাউন্টটি এখনো তৈরি করা নেই?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    handleFillDemo();
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)
                </button>
              </div>
            )}
          </div>
        )}

        {/* User Type Mode Selector (Clean Option for Student vs Business) */}
        {mode !== 'forgot' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              ব্যবহারকারীর ধরন নির্বাচন করুন (Select Account Mode) *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                id="select-business-mode-btn"
                onClick={() => setSelectedUserType('business')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedUserType === 'business'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>ব্যবসায়ী (Business)</span>
              </button>

              <button
                type="button"
                id="select-student-mode-btn"
                onClick={() => setSelectedUserType('student')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedUserType === 'student'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>শিক্ষার্থী (Student)</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Demo Credentials Box */}
        {mode !== 'forgot' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {selectedUserType === 'student' ? 'শিক্ষার্থী ডেমো তথ্য (Student Demo)' : 'ব্যবসা ডেমো তথ্য (Business Demo)'}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800">
                <span>ইমেইল: </span>
                <strong className="font-mono text-emerald-950">
                  {selectedUserType === 'student' ? 'student@shohojbebsha.com' : 'demo@shohojbebsha.com'}
                </strong>
                <span className="mx-1.5 opacity-40">|</span>
                <span>পাসওয়ার্ড: </span>
                <strong className="font-mono text-emerald-950">shohoj123</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFillDemo(selectedUserType)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              তথ্য বসান
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার পূর্ণ নাম (Full Name) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={selectedUserType === 'student' ? 'যেমন: তানভীর আহমেদ' : 'যেমন: মোঃ রফিকুল ইসলাম'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {selectedUserType === 'business' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ব্যবসার নাম (Business Name) *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ভাই ভাই এন্টারপ্রাইজ / নিউ ফ্যাশন"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ব্যবসার ধরন (Business Type)
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শিক্ষা প্রতিষ্ঠান / কলেজ / বিশ্ববিদ্যালয় (Institution Name)
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয় / নর্থ সাউথ বিশ্ববিদ্যালয়"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিভাগ / বিষয় (Department / Field of Study)
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="যেমন: BBA, Accounting, Commerce, Finance"
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ইমেইল ঠিকানা (Email Address) *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              placeholder={selectedUserType === 'student' ? 'student@university.edu / mail@gmail.com' : 'name@business.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                পাসওয়ার্ড (Password) *
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setMode('forgot');
                  }}
                  className="text-xs text-emerald-700 hover:underline font-medium"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {mode === 'signup'
                  ? selectedUserType === 'student'
                    ? 'শিক্ষার্থী অ্যাকাউন্ট তৈরি করুন (Sign Up)'
                    : 'ব্যবসা অ্যাকাউন্ট তৈরি করুন (Sign Up)'
                  : mode === 'login'
                  ? 'লগইন করুন (Login)'
                  : 'রিসেট লিঙ্ক পাঠান (Send Reset Link)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Mode Switchers */}
        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          {mode === 'signup' && (
            <p>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('login');
                }}
                className="text-emerald-700 hover:underline font-semibold ml-1 cursor-pointer"
              >
                লগইন করুন
              </button>
            </p>
          )}

          {mode === 'login' && (
            <p>
              নতুন ব্যবহারকারী?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signup');
                }}
                className="text-emerald-700 hover:underline font-semibold ml-1 cursor-pointer"
              >
                ফ্রি অ্যাকাউন্ট খুলুন
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              মনে পড়েছে?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('login');
                }}
                className="text-emerald-700 hover:underline font-semibold ml-1 cursor-pointer"
              >
                লগইনে ফিরে যান
              </button>
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase RLS সুরক্ষিত ডেটাবেজ এনক্রিপশন</span>
        </div>
      </form>
    </Modal>
  );
};
