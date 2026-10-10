import React from 'react';
import {
  PackageCheck,
  TrendingUp,
  Users,
  Receipt,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Smartphone,
  Layers,
  Download,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenSetup?: () => void;
  isConfigured: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onOpenSetup,
  isConfigured,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-3 sm:gap-3.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            aria-label="Shohoj Bebsha Home"
          >
            <div className="relative flex items-center justify-center p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-xs group-hover:border-emerald-300 transition-colors">
              <img
                src="/assets/shohoj-bebsha-logo.png"
                alt="Shohoj Bebsha Logo"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-none">
                  সহজ ব্যবসা
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Shohoj Bebsha
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">সহজভাবে ব্যবসা পরিচালনা করুন</p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/shohoj-bebsha.zip"
              download="shohoj-bebsha.zip"
              title="Download complete project ZIP for Netlify deployment"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>ডাউনলোড জিপ (ZIP)</span>
            </a>

            {!isConfigured && onOpenSetup && (
              <button
                onClick={onOpenSetup}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase সেটআপ</span>
              </button>
            )}

            <button
              id="landing-login-btn"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100/80 rounded-xl transition-colors"
            >
              লগইন (Login)
            </button>
            <button
              id="landing-signup-btn"
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <span>ফ্রি শুরু করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>পার্ট ১ ফ্রি এমভিপি • সম্পূর্ণ স্বাধীন ও রিয়েল-টাইম</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            সহজভাবে ব্যবসা <span className="text-emerald-600">পরিচালনা করুন</span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 font-medium mt-3 tracking-wide">
            Manage Your Business, Simply.
          </p>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            দোকান বা ব্যবসা পরিচালনার সবচেয়ে সহজ সফটওয়্যার। পণ্য মজুদ, বিক্রয়, গ্রাহকের বাকি খাতা,
            দৈনিক খরচ এবং সঠিক লাভ-ক্ষতির হিসাব এক ক্লিকেই।
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <span>আজই বিনামূল্যে রেজিস্টার করুন</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 text-base font-semibold rounded-xl shadow-sm transition-all"
            >
              বিদ্যমান একাউন্টে প্রবেশ করুন
            </button>
          </div>

          {/* Device & Security Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>মোবাইল, ট্যাবলেট ও ডেক্সটপ রেস্পন্সিভ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Supabase RLS সুরক্ষিত নিজস্ব ডেটা</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>স্বয়ংক্রিয় স্টক হ্রাস ও লাভ ক্যালকুলেশন</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              আপনার ব্যবসার প্রতিটি হিসাব থাকুক হাতের মুঠোয়
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              দৈনন্দিন ব্যবসায়িক জটিলতা কমিয়ে লাভজনকভাবে সিদ্ধান্ত নিন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ইনভেন্টরি ও স্টক অ্যালার্ট</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                পণ্য যোগ, এডিট ও ডিলিট করুন। স্টক কমে গেলে স্বয়ংক্রিয় লো-স্টক সতর্কবার্তা প্রদর্শিত হবে।
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">দ্রুত বিক্রয় ও স্টক হ্রাস</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                পণ্য নির্বাচন করে সাথে সাথে বিক্রয় রেকর্ড করুন। অটোমেটিক স্টক কমে যাবে এবং কাস্টমারের হিসাব আপডেট হবে।
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">গ্রাহক ও বাকির খাতা</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                কার কাছে কত টাকা বাকি আছে এক নজরে দেখুন। প্রতিটি গ্রাহকের পূর্ববর্তী ক্রয়ের পূর্ণ ইতিহাস ট্র্যাক করুন।
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">প্রকৃত নিট লাভ ও মার্জিন</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                বিক্রয় - ক্রয়মূল্য = গ্রস প্রফিট, এবং খরচ বাদ দিয়ে নিট লাভ ও প্রফিট মার্জিন শতভাগ সঠিক উপায়ে গণনা করা হয়।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-100/70 border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">সহজ ব্যবসা (Shohoj Bebsha)</span>
            <span>• সহজভাবে ব্যবসা পরিচালনা করুন</span>
          </div>
          <p>
            পার্ট ১: ফ্রি বিজনেস ম্যানেজমেন্ট এমভিপি • Powered by Supabase RLS
          </p>
        </div>
      </footer>
    </div>
  );
};
