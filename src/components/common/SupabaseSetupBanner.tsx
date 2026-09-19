import React, { useState } from 'react';
import { Database, AlertTriangle, Key, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveSupabaseCredentials, getSupabaseCredentials, clearSupabaseCredentials } from '../../lib/supabase';
import { Modal } from './Modal';
import { useToast } from '../../context/ToastContext';

export const SupabaseSetupBanner: React.FC = () => {
  const { isConfigured, checkConfiguration } = useAuth();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const creds = getSupabaseCredentials();
  const [url, setUrl] = useState(creds.url || '');
  const [anonKey, setAnonKey] = useState(creds.anonKey || '');
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      showToast('Please enter both Supabase URL and Anon Key', 'error');
      return;
    }
    if (!url.startsWith('https://')) {
      showToast('Supabase URL must start with https://', 'error');
      return;
    }

    saveSupabaseCredentials(url.trim(), anonKey.trim());
    checkConfiguration();
    showToast('Supabase credentials saved successfully! Reloading connection...', 'success');
    setIsModalOpen(false);
    // Reload page to reinitialize Supabase auth client with the new keys
    window.location.reload();
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    checkConfiguration();
    showToast('Credentials cleared', 'info');
  };

  const handleCopySql = () => {
    const sqlContent = `-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  business_name text,
  business_type text default 'Retail',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Products Table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  sku text,
  purchase_price numeric not null default 0,
  selling_price numeric not null default 0,
  stock_quantity integer not null default 0,
  low_stock_level integer not null default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Customers Table
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  total_purchase numeric not null default 0,
  due_amount numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Sales Table
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quantity integer not null default 1,
  selling_price numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'paid',
  sale_date date not null default current_date,
  created_at timestamptz default now()
);

-- 5. Expenses Table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  amount numeric not null default 0,
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;

-- Policies for Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Policies for Products
create policy "Users can view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

-- Policies for Customers
create policy "Users can view own customers" on public.customers for select using (auth.uid() = user_id);
create policy "Users can insert own customers" on public.customers for insert with check (auth.uid() = user_id);
create policy "Users can update own customers" on public.customers for update using (auth.uid() = user_id);
create policy "Users can delete own customers" on public.customers for delete using (auth.uid() = user_id);

-- Policies for Sales
create policy "Users can view own sales" on public.sales for select using (auth.uid() = user_id);
create policy "Users can insert own sales" on public.sales for insert with check (auth.uid() = user_id);
create policy "Users can update own sales" on public.sales for update using (auth.uid() = user_id);
create policy "Users can delete own sales" on public.sales for delete using (auth.uid() = user_id);

-- Policies for Expenses
create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);`;

    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    showToast('SQL schema copied to clipboard! Paste it into Supabase SQL Editor.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  if (isConfigured) {
    return null;
  }

  return (
    <>
      <div
        id="supabase-setup-banner"
        className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 border-b border-amber-200/80 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Supabase সংযোগ প্রয়োজন (Supabase Setup Required)</span>
              </p>
              <p className="text-xs text-slate-600">
                বাস্তব অ্যাকাউন্ট ও ডেটাবেজ সক্রিয় করতে আপনার Supabase URL ও Anon Key ইনপুট করুন।
              </p>
            </div>
          </div>
          <button
            id="configure-supabase-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Key className="w-3.5 h-3.5" />
            <span>কনফিগার করুন (Configure Supabase)</span>
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Supabase সংযোগ ও সেটআপ (Supabase Setup)"
        subtitle="সহজ ব্যবসা অ্যাপের জন্য রিয়েল ডেটাবেজ ও আরএলএস নিরাপত্তা"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`pb-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'credentials'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              1. এপিআই ক্রেডেনশিয়াল (API Keys)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`pb-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'sql'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              2. ডেটাবেজ স্কিমা (SQL Schema)
            </button>
          </div>

          {activeTab === 'credentials' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800 text-sm">
                  কীভাবে Supabase ক্রেডেনশিয়াল পাবেন?
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Supabase Dashboard <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    -এ গিয়ে একটি ফ্রি প্রজেক্ট তৈরি করুন।
                  </li>
                  <li>প্রজেক্ট সেটিংস এ যান: <strong>Settings &gt; API</strong></li>
                  <li><strong>Project URL</strong> এবং <strong>anon public API Key</strong> কপি করে নিচে পেস্ট করুন।</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon (Public) Key
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {creds.url && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    ক্রেডেনশিয়াল মুছুন (Clear)
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                  >
                    সংরক্ষণ ও সংযোগ করুন (Save & Connect)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  নিচের SQL স্ক্রিপ্টটি কপি করে আপনার Supabase ড্যাশবোর্ডের <strong>SQL Editor</strong> এ রান করুন:
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'কপি হয়েছে!' : 'সম্পূর্ণ SQL কপি করুন'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs max-h-60 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre text-[11px] leading-relaxed">
{`-- সহজ ব্যবসা (Shohoj Bebsha) Part 1 Schema
-- Tables: profiles, products, customers, sales, expenses
-- Full Row Level Security (RLS) policies configured`}
                </pre>
              </div>

              <div className="text-xs text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  প্রজেক্টের রুট ডিরেক্টরিতে <code>supabase-schema.sql</code> ফাইলটিও সংরক্ষিত রয়েছে। আপনি সেটিও সরাসরি Supabase এ চালাতে পারেন।
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
