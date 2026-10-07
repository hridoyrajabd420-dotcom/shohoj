import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials, getSupabaseClient, normalizeSupabaseUrl, normalizeSupabaseKey } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import {
  Database,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Terminal,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  FileArchive,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { isConfigured, checkConfiguration } = useAuth();
  const { showToast } = useToast();

  const creds = getSupabaseCredentials();
  const [url, setUrl] = useState(creds.url || '');
  const [anonKey, setAnonKey] = useState(creds.anonKey || '');
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedPro, setCopiedPro] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = normalizeSupabaseKey(anonKey);

    if (!cleanUrl || !cleanKey) {
      showToast('উভয় Supabase URL এবং Anon Key পূরণ করুন', 'error');
      return;
    }

    saveSupabaseCredentials(cleanUrl, cleanKey);
    checkConfiguration();
    showToast('Supabase ক্রেডেনশিয়াল সঠিকভাবে সংরক্ষিত হয়েছে। রিফ্রেশ করা হচ্ছে...', 'success');
    window.location.reload();
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    checkConfiguration();
    showToast('ক্রেডেনশিয়াল মুছে ফেলা হয়েছে', 'info');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const client = getSupabaseClient();
    if (!client) {
      setTestResult({ success: false, message: 'Supabase ক্লায়েন্ট ইনিশিয়ালাইজ করা যায়নি। URL ও Key যাচাই করুন।' });
      setTesting(false);
      return;
    }

    try {
      // 1. Verify Auth endpoint reachable without 404/Invalid path
      const authRes = await client.auth.getSession();
      if (authRes.error) {
        setTestResult({
          success: false,
          message: `Auth এন্ডপয়েন্ট ত্রুটি: ${authRes.error.message}`,
        });
        setTesting(false);
        return;
      }

      // 2. Test by querying public tables
      const { error } = await client.from('products').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          setTestResult({
            success: true,
            message: 'Supabase Auth ও সংযোগ সফল হয়েছে! তবে ডেটাবেজ টেবিলগুলো এখনো তৈরি করা হয়নি। অনুগ্রহ করে নিচের SQL স্ক্রিপ্টটি Supabase SQL Editor এ রান করুন।',
          });
        } else {
          setTestResult({
            success: false,
            message: `ডেটাবেজ ত্রুটি: ${error.message} (Code: ${error.code})`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message: 'অসাধারণ! Supabase Auth এবং ডেটাবেজ সফলভাবে সংযুক্ত ও কার্যকর রয়েছে।',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'সংযোগ ব্যর্থ হয়েছে',
      });
    } finally {
      setTesting(false);
    }
  };

  const fullSqlContent = `-- ==========================================
-- SHOHOJ BEBSHA - FULL SUPABASE DATABASE SCHEMA
-- PART 1 (FREE) + PART 2 (PRO)
-- ==========================================

-- 1. Profiles Table with Plan Column
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  business_name text,
  business_type text default 'Retail',
  plan text default 'FREE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure plan column exists if table was created in Part 1
alter table public.profiles add column if not exists plan text default 'FREE';

-- 2. Products Table (Inventory items: Part 1 Step 3)
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_name text not null,
  category text,
  sku text,
  purchase_price numeric not null default 0,
  selling_price numeric not null default 0,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  unit text default 'pcs',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Safe column additions if table was created in an earlier step
alter table public.products add column if not exists product_name text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists purchase_price numeric not null default 0;
alter table public.products add column if not exists selling_price numeric not null default 0;
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists low_stock_threshold integer not null default 5;
alter table public.products add column if not exists unit text default 'pcs';
alter table public.products add column if not exists description text;
alter table public.products add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'name') then
    update public.products set product_name = name where product_name is null and name is not null;
    alter table public.products alter column name drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'low_stock_level') then
    update public.products set low_stock_threshold = low_stock_level where low_stock_threshold is null and low_stock_level is not null;
    alter table public.products alter column low_stock_level drop not null;
  end if;
end $$;

-- 3. Customers Table
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  total_purchase numeric not null default 0,
  due_amount numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.customers add column if not exists notes text;

-- 4. Sales Table (Part 1 Step 4: Sales Management)
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quantity integer not null default 1,
  selling_price numeric not null default 0,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  due_amount numeric not null default 0,
  payment_status text not null default 'paid',
  sale_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Safe migrations: Ensure all Step 4 columns exist if table was already created
alter table public.sales add column if not exists subtotal numeric default 0;
alter table public.sales add column if not exists discount numeric default 0;
alter table public.sales add column if not exists paid_amount numeric default 0;
alter table public.sales add column if not exists due_amount numeric default 0;
alter table public.sales add column if not exists notes text;

-- 4b. Sale Items Table (Detailed itemized records per sale)
create table if not exists public.sale_items (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references public.sales(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz default now()
);

-- 5. Expenses Table (Part 1 Step 5: Expense Management)
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text,
  category text not null,
  amount numeric not null default 0,
  expense_date date not null default current_date,
  date date default current_date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.expenses add column if not exists title text;
alter table public.expenses add column if not exists expense_date date default current_date;
alter table public.expenses add column if not exists date date default current_date;
alter table public.expenses add column if not exists updated_at timestamptz default now();

-- ==========================================
-- PART 2 (PRO) TABLES
-- ==========================================

-- 6. Suppliers Table
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  total_purchased numeric not null default 0,
  payable_amount numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Purchases Table
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_cost numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'paid',
  purchase_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 8. Invoices Table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_number text not null,
  type text not null default 'INVOICE',
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  due_amount numeric not null default 0,
  status text not null default 'ISSUED',
  issue_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]'::jsonb,
  notes text,
  terms text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Payment Requests Table (Pro Upgrade & Manual Verification)
create table if not exists public.payment_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  plan_requested text not null default 'PRO',
  billing_cycle text not null default 'monthly',
  amount numeric not null default 499,
  payment_method text not null,
  sender_number text not null,
  transaction_id text not null,
  screenshot_url text,
  status text not null default 'PENDING',
  admin_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- 10. Business Settings Table
create table if not exists public.business_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  invoice_prefix text default 'INV-',
  quotation_prefix text default 'QTN-',
  next_invoice_number integer default 1001,
  tax_rate numeric default 0,
  default_notes text,
  default_terms text,
  bank_details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. Stock Adjustments Table
create table if not exists public.stock_adjustments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  adjusted_quantity integer not null,
  reason text not null,
  notes text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- 12. Subscriptions Table (Part 2: Pro Plan & Feature Access Control)
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired', 'pending')),
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists plan text default 'free';
alter table public.profiles add column if not exists subscription_status text default 'active';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;

-- 13. Customer Payments Table
create table if not exists public.customer_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  amount numeric not null default 0,
  payment_method text not null default 'CASH',
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 13. Supplier Payments Table
create table if not exists public.supplier_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  amount numeric not null default 0,
  payment_method text not null default 'CASH',
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_requests enable row level security;
alter table public.business_settings enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.customer_payments enable row level security;
alter table public.supplier_payments enable row level security;

-- Profiles Policies
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Products Policies
create policy "Users view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users delete own products" on public.products for delete using (auth.uid() = user_id);

-- Customers Policies
create policy "Users view own customers" on public.customers for select using (auth.uid() = user_id);
create policy "Users insert own customers" on public.customers for insert with check (auth.uid() = user_id);
create policy "Users update own customers" on public.customers for update using (auth.uid() = user_id);
create policy "Users delete own customers" on public.customers for delete using (auth.uid() = user_id);

-- Sales Policies
create policy "Users view own sales" on public.sales for select using (auth.uid() = user_id);
create policy "Users insert own sales" on public.sales for insert with check (auth.uid() = user_id);
create policy "Users update own sales" on public.sales for update using (auth.uid() = user_id);
create policy "Users delete own sales" on public.sales for delete using (auth.uid() = user_id);

-- Expenses Policies
create policy "Users view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users update own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Users delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- Suppliers Policies
create policy "Users view own suppliers" on public.suppliers for select using (auth.uid() = user_id);
create policy "Users insert own suppliers" on public.suppliers for insert with check (auth.uid() = user_id);
create policy "Users update own suppliers" on public.suppliers for update using (auth.uid() = user_id);
create policy "Users delete own suppliers" on public.suppliers for delete using (auth.uid() = user_id);

-- Purchases Policies
create policy "Users view own purchases" on public.purchases for select using (auth.uid() = user_id);
create policy "Users insert own purchases" on public.purchases for insert with check (auth.uid() = user_id);
create policy "Users update own purchases" on public.purchases for update using (auth.uid() = user_id);
create policy "Users delete own purchases" on public.purchases for delete using (auth.uid() = user_id);

-- Invoices Policies
create policy "Users view own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "Users insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users update own invoices" on public.invoices for update using (auth.uid() = user_id);
create policy "Users delete own invoices" on public.invoices for delete using (auth.uid() = user_id);

-- Payment Requests Policies
create policy "Users view own payment requests" on public.payment_requests for select using (auth.uid() = user_id);
create policy "Users insert own payment requests" on public.payment_requests for insert with check (auth.uid() = user_id);

-- Business Settings Policies
create policy "Users view own business settings" on public.business_settings for select using (auth.uid() = user_id);
create policy "Users insert own business settings" on public.business_settings for insert with check (auth.uid() = user_id);
create policy "Users update own business settings" on public.business_settings for update using (auth.uid() = user_id);

-- Stock Adjustments Policies
create policy "Users view own stock adjustments" on public.stock_adjustments for select using (auth.uid() = user_id);
create policy "Users insert own stock adjustments" on public.stock_adjustments for insert with check (auth.uid() = user_id);

-- Customer Payments Policies
create policy "Users view own customer payments" on public.customer_payments for select using (auth.uid() = user_id);
create policy "Users insert own customer payments" on public.customer_payments for insert with check (auth.uid() = user_id);

-- Sale Items Policies
create policy "Users view own sale_items" on public.sale_items for select using (auth.uid() = user_id);
create policy "Users insert own sale_items" on public.sale_items for insert with check (auth.uid() = user_id);
create policy "Users update own sale_items" on public.sale_items for update using (auth.uid() = user_id);
create policy "Users delete own sale_items" on public.sale_items for delete using (auth.uid() = user_id);

-- Supplier Payments Policies
create policy "Users view own supplier payments" on public.supplier_payments for select using (auth.uid() = user_id);
create policy "Users insert own supplier payments" on public.supplier_payments for insert with check (auth.uid() = user_id);

-- ==============================================================================
-- ATOMIC TRANSACTION FUNCTIONS FOR SALES MANAGEMENT (Part 1 Step 4)
-- ==============================================================================

create or replace function public.record_sale_transaction(
  p_product_id uuid,
  p_customer_id uuid,
  p_quantity integer,
  p_selling_price numeric,
  p_subtotal numeric,
  p_discount numeric,
  p_total_amount numeric,
  p_paid_amount numeric,
  p_due_amount numeric,
  p_payment_status text,
  p_sale_date date,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_stock integer;
  v_new_sale_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  select stock_quantity into v_current_stock from public.products where id = p_product_id and user_id = v_user_id for update;
  if not found then raise exception 'Product not found'; end if;
  if v_current_stock < p_quantity then raise exception 'Insufficient stock: Available %, requested %', v_current_stock, p_quantity; end if;

  update public.products set stock_quantity = stock_quantity - p_quantity, updated_at = now() where id = p_product_id and user_id = v_user_id;

  insert into public.sales (user_id, product_id, customer_id, quantity, selling_price, subtotal, discount, total_amount, paid_amount, due_amount, payment_status, sale_date, notes)
  values (v_user_id, p_product_id, p_customer_id, p_quantity, p_selling_price, coalesce(p_subtotal, p_quantity * p_selling_price), coalesce(p_discount, 0), p_total_amount, coalesce(p_paid_amount, case when p_payment_status = 'paid' then p_total_amount else 0 end), coalesce(p_due_amount, case when p_payment_status = 'due' then p_total_amount else 0 end), p_payment_status, p_sale_date, p_notes)
  returning id into v_new_sale_id;

  insert into public.sale_items (sale_id, user_id, product_id, quantity, unit_price, total_price)
  values (v_new_sale_id, v_user_id, p_product_id, p_quantity, p_selling_price, p_total_amount);

  if p_customer_id is not null then
    update public.customers set total_purchase = coalesce(total_purchase, 0) + p_total_amount, due_amount = coalesce(due_amount, 0) + coalesce(p_due_amount, case when p_payment_status = 'due' then p_total_amount else 0 end), updated_at = now() where id = p_customer_id and user_id = v_user_id;
  end if;

  return jsonb_build_object('success', true, 'sale_id', v_new_sale_id, 'new_stock', v_current_stock - p_quantity);
end;
$$;

create or replace function public.update_sale_transaction(
  p_sale_id uuid,
  p_product_id uuid,
  p_customer_id uuid,
  p_quantity integer,
  p_selling_price numeric,
  p_subtotal numeric,
  p_discount numeric,
  p_total_amount numeric,
  p_paid_amount numeric,
  p_due_amount numeric,
  p_payment_status text,
  p_sale_date date,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_sale record;
  v_available_stock integer;
  v_old_due numeric;
  v_calc_due numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  select * into v_old_sale from public.sales where id = p_sale_id and user_id = v_user_id for update;
  if not found then raise exception 'Sale not found'; end if;

  v_old_due := coalesce(v_old_sale.due_amount, case when v_old_sale.payment_status = 'due' then v_old_sale.total_amount else 0 end);
  v_calc_due := coalesce(p_due_amount, case when p_payment_status = 'due' then p_total_amount else 0 end);

  if v_old_sale.product_id = p_product_id then
    select stock_quantity into v_available_stock from public.products where id = p_product_id and user_id = v_user_id for update;
    if (v_available_stock + v_old_sale.quantity) < p_quantity then raise exception 'Insufficient stock: Available %, requested %', (v_available_stock + v_old_sale.quantity), p_quantity; end if;
    update public.products set stock_quantity = stock_quantity + v_old_sale.quantity - p_quantity, updated_at = now() where id = p_product_id and user_id = v_user_id;
  else
    if v_old_sale.product_id is not null then
      update public.products set stock_quantity = stock_quantity + v_old_sale.quantity, updated_at = now() where id = v_old_sale.product_id and user_id = v_user_id;
    end if;
    select stock_quantity into v_available_stock from public.products where id = p_product_id and user_id = v_user_id for update;
    if v_available_stock < p_quantity then raise exception 'Insufficient stock: Available %, requested %', v_available_stock, p_quantity; end if;
    update public.products set stock_quantity = stock_quantity - p_quantity, updated_at = now() where id = p_product_id and user_id = v_user_id;
  end if;

  if v_old_sale.customer_id is not null and v_old_sale.customer_id != p_customer_id then
    update public.customers set total_purchase = greatest(0, coalesce(total_purchase, 0) - v_old_sale.total_amount), due_amount = greatest(0, coalesce(due_amount, 0) - v_old_due), updated_at = now() where id = v_old_sale.customer_id and user_id = v_user_id;
  end if;

  if p_customer_id is not null then
    if v_old_sale.customer_id = p_customer_id then
      update public.customers set total_purchase = greatest(0, coalesce(total_purchase, 0) - v_old_sale.total_amount + p_total_amount), due_amount = greatest(0, coalesce(due_amount, 0) - v_old_due + v_calc_due), updated_at = now() where id = p_customer_id and user_id = v_user_id;
    else
      update public.customers set total_purchase = coalesce(total_purchase, 0) + p_total_amount, due_amount = coalesce(due_amount, 0) + v_calc_due, updated_at = now() where id = p_customer_id and user_id = v_user_id;
    end if;
  end if;

  update public.sales set product_id = p_product_id, customer_id = p_customer_id, quantity = p_quantity, selling_price = p_selling_price, subtotal = coalesce(p_subtotal, p_quantity * p_selling_price), discount = coalesce(p_discount, 0), total_amount = p_total_amount, paid_amount = coalesce(p_paid_amount, case when p_payment_status = 'paid' then p_total_amount else 0 end), due_amount = v_calc_due, payment_status = p_payment_status, sale_date = p_sale_date, notes = p_notes where id = p_sale_id and user_id = v_user_id;

  delete from public.sale_items where sale_id = p_sale_id and user_id = v_user_id;
  insert into public.sale_items (sale_id, user_id, product_id, quantity, unit_price, total_price) values (p_sale_id, v_user_id, p_product_id, p_quantity, p_selling_price, p_total_amount);

  return jsonb_build_object('success', true, 'sale_id', p_sale_id);
end;
$$;

create or replace function public.delete_sale_transaction(p_sale_id uuid) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale record;
  v_due numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  select * into v_sale from public.sales where id = p_sale_id and user_id = v_user_id for update;
  if not found then raise exception 'Sale not found'; end if;

  v_due := coalesce(v_sale.due_amount, case when v_sale.payment_status = 'due' then v_sale.total_amount else 0 end);

  if v_sale.product_id is not null then
    update public.products set stock_quantity = stock_quantity + v_sale.quantity, updated_at = now() where id = v_sale.product_id and user_id = v_user_id;
  end if;

  if v_sale.customer_id is not null then
    update public.customers set total_purchase = greatest(0, coalesce(total_purchase, 0) - v_sale.total_amount), due_amount = greatest(0, coalesce(due_amount, 0) - v_due), updated_at = now() where id = v_sale.customer_id and user_id = v_user_id;
  end if;

  delete from public.sale_items where sale_id = p_sale_id and user_id = v_user_id;
  delete from public.sales where id = p_sale_id and user_id = v_user_id;

  return jsonb_build_object('success', true, 'deleted_sale_id', p_sale_id);
end;
$$;

grant execute on function public.record_sale_transaction to authenticated;
grant execute on function public.update_sale_transaction to authenticated;
grant execute on function public.delete_sale_transaction to authenticated;

create or replace function public.record_customer_payment_transaction(
  p_customer_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_payment_method text default 'CASH',
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_payment_id uuid;
  v_customer record;
  v_new_due numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  select * into v_customer from public.customers where id = p_customer_id and user_id = v_user_id for update;
  if not found then raise exception 'Customer not found'; end if;

  if p_amount > coalesce(v_customer.due_amount, 0) then
    raise exception 'Payment amount (%) cannot exceed outstanding due balance (%)', p_amount, coalesce(v_customer.due_amount, 0);
  end if;

  v_new_due := greatest(0, coalesce(v_customer.due_amount, 0) - p_amount);

  insert into public.customer_payments (user_id, customer_id, amount, payment_date, date, payment_method, notes)
  values (v_user_id, p_customer_id, p_amount, p_payment_date, p_payment_date, p_payment_method, p_notes)
  returning id into v_new_payment_id;

  update public.customers
  set due_amount = v_new_due, updated_at = now()
  where id = p_customer_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'payment_id', v_new_payment_id,
    'new_due', v_new_due
  );
end;
$$;

grant execute on function public.record_customer_payment_transaction to authenticated;

create or replace function public.delete_customer_payment_transaction(
  p_payment_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment record;
  v_new_due numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_payment from public.customer_payments where id = p_payment_id and user_id = v_user_id for update;
  if not found then raise exception 'Payment record not found'; end if;

  update public.customers
  set due_amount = coalesce(due_amount, 0) + v_payment.amount,
      updated_at = now()
  where id = v_payment.customer_id and user_id = v_user_id
  returning due_amount into v_new_due;

  delete from public.customer_payments where id = p_payment_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'customer_id', v_payment.customer_id,
    'new_due', coalesce(v_new_due, 0)
  );
end;
$$;

grant execute on function public.delete_customer_payment_transaction to authenticated;
`;

  const proMigrationOnlySql = `-- ==========================================
-- SHOHOJ BEBSHA - PART 2 PRO TABLES MIGRATION
-- Run this if you already ran Part 1 schema previously
-- ==========================================

-- 1. Ensure plan column in profiles
alter table public.profiles add column if not exists plan text default 'FREE';

-- 2. Suppliers Table
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  total_purchased numeric not null default 0,
  payable_amount numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Purchases Table
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_cost numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'paid',
  purchase_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 4. Invoices Table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_number text not null,
  type text not null default 'INVOICE',
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  due_amount numeric not null default 0,
  status text not null default 'ISSUED',
  issue_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]'::jsonb,
  notes text,
  terms text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Payment Requests Table
create table if not exists public.payment_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  plan_requested text not null default 'PRO',
  billing_cycle text not null default 'monthly',
  amount numeric not null default 499,
  payment_method text not null,
  sender_number text not null,
  transaction_id text not null,
  screenshot_url text,
  status text not null default 'PENDING',
  admin_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- 6. Business Settings Table
create table if not exists public.business_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  invoice_prefix text default 'INV-',
  quotation_prefix text default 'QTN-',
  next_invoice_number integer default 1001,
  tax_rate numeric default 0,
  default_notes text,
  default_terms text,
  bank_details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Stock Adjustments Table
create table if not exists public.stock_adjustments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  adjusted_quantity integer not null,
  reason text not null,
  notes text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- 8. Customer Payments Table
create table if not exists public.customer_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  amount numeric not null default 0,
  payment_method text not null default 'CASH',
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 9. Supplier Payments Table
create table if not exists public.supplier_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  amount numeric not null default 0,
  payment_method text not null default 'CASH',
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_requests enable row level security;
alter table public.business_settings enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.customer_payments enable row level security;
alter table public.supplier_payments enable row level security;

-- Policies
create policy "Users view own suppliers" on public.suppliers for select using (auth.uid() = user_id);
create policy "Users insert own suppliers" on public.suppliers for insert with check (auth.uid() = user_id);
create policy "Users update own suppliers" on public.suppliers for update using (auth.uid() = user_id);
create policy "Users delete own suppliers" on public.suppliers for delete using (auth.uid() = user_id);

create policy "Users view own purchases" on public.purchases for select using (auth.uid() = user_id);
create policy "Users insert own purchases" on public.purchases for insert with check (auth.uid() = user_id);
create policy "Users update own purchases" on public.purchases for update using (auth.uid() = user_id);
create policy "Users delete own purchases" on public.purchases for delete using (auth.uid() = user_id);

create policy "Users view own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "Users insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users update own invoices" on public.invoices for update using (auth.uid() = user_id);
create policy "Users delete own invoices" on public.invoices for delete using (auth.uid() = user_id);

create policy "Users view own payment requests" on public.payment_requests for select using (auth.uid() = user_id);
create policy "Users insert own payment requests" on public.payment_requests for insert with check (auth.uid() = user_id);

create policy "Users view own business settings" on public.business_settings for select using (auth.uid() = user_id);
create policy "Users insert own business settings" on public.business_settings for insert with check (auth.uid() = user_id);
create policy "Users update own business settings" on public.business_settings for update using (auth.uid() = user_id);

create policy "Users view own stock adjustments" on public.stock_adjustments for select using (auth.uid() = user_id);
create policy "Users insert own stock adjustments" on public.stock_adjustments for insert with check (auth.uid() = user_id);

create policy "Users view own customer payments" on public.customer_payments for select using (auth.uid() = user_id);
create policy "Users insert own customer payments" on public.customer_payments for insert with check (auth.uid() = user_id);

create policy "Users view own supplier payments" on public.supplier_payments for select using (auth.uid() = user_id);
create policy "Users insert own supplier payments" on public.supplier_payments for insert with check (auth.uid() = user_id);

-- 10. Subscriptions Table & Policies
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired', 'pending')),
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users insert own subscription" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users update own subscription" on public.subscriptions for update using (auth.uid() = user_id);

-- Pro security check and activation functions
create or replace function public.is_pro_active(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_sub record;
begin
  select plan, status, expires_at into v_sub
  from public.subscriptions
  where user_id = p_user_id;

  if found and lower(v_sub.plan) = 'pro' and lower(v_sub.status) = 'active' then
    if v_sub.expires_at is null or v_sub.expires_at > now() then
      return true;
    end if;
  end if;
  return false;
end;
$$;
grant execute on function public.is_pro_active to authenticated;

create or replace function public.set_user_subscription(
  p_plan text,
  p_duration_days integer default 365
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_expires_at timestamptz;
  v_plan_clean text := lower(p_plan);
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if v_plan_clean not in ('free', 'pro') then raise exception 'Invalid plan: must be free or pro'; end if;

  if v_plan_clean = 'pro' then
    v_expires_at := now() + (p_duration_days || ' days')::interval;
  else
    v_expires_at := null;
  end if;

  insert into public.subscriptions (user_id, plan, status, started_at, expires_at, updated_at)
  values (v_user_id, v_plan_clean, 'active', now(), v_expires_at, now())
  on conflict (user_id)
  do update set
    plan = v_plan_clean,
    status = 'active',
    expires_at = v_expires_at,
    updated_at = now();

  update public.profiles
  set plan = v_plan_clean,
      subscription_status = 'active',
      subscription_expires_at = v_expires_at,
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object('success', true, 'plan', v_plan_clean, 'expires_at', v_expires_at);
end;
$$;
grant execute on function public.set_user_subscription to authenticated;
`;

  const handleCopyFullSql = () => {
    navigator.clipboard.writeText(fullSqlContent);
    setCopiedFull(true);
    showToast('সম্পূর্ণ SQL স্ক্রিপ্ট (Part 1 + Part 2) ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    setTimeout(() => setCopiedFull(false), 3000);
  };

  const handleCopyProSql = () => {
    navigator.clipboard.writeText(proMigrationOnlySql);
    setCopiedPro(true);
    showToast('Part 2 প্রো মাইগ্রেশন SQL ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    setTimeout(() => setCopiedPro(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          অ্যাপ ও ডেটাবেজ সেটিংস (Settings)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Supabase অথেনটিকেশন, ক্লাউড ডেটাবেজ সংযোগ এবং নিরাপত্তা কনফিগারেশন
        </p>
      </div>

      {/* Supabase Connection Manager */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Supabase সংযোগ ও ক্রেডেনশিয়াল</h2>
              <p className="text-xs text-slate-500">
                বাস্তব অ্যাকাউন্ট ব্যবস্থাপনা ও Row Level Security (RLS) ডেটাবেজ
              </p>
            </div>
          </div>

          <div>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>সংযুক্ত (Configured)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>সংযোগ প্রয়োজন (Missing Keys)</span>
              </span>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              required
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              সরাসরি Supabase Dashboard &gt; Settings &gt; API থেকে Project URL কপি করুন (যেমন: <code className="font-mono text-emerald-700">https://xyz.supabase.co</code>)। কোনো <code className="font-mono text-rose-600">/auth</code> বা বাড়তি পাথ যুক্ত করবেন না।
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon (Public) Key
            </label>
            <input
              type="text"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Supabase API Settings থেকে <code className="font-mono text-emerald-700">anon</code> / <code className="font-mono text-emerald-700">public</code> কী কপি করুন (JWT টোকেন যা সাধারণত <code className="font-mono">eyJ</code> দিয়ে শুরু হয়)।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !url || !anonKey}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>সংযোগ টেস্ট করুন (Test Connection)</span>
              </button>

              {creds.url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                >
                  ক্লিয়ার করুন
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              সংরক্ষণ ও সংযোগ রিফ্রেশ
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </form>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Supabase SQL ডেটাবেজ স্কিমা</h2>
              <p className="text-xs text-slate-500">
                পার্ট ১ ও পার্ট ২ প্রো এর সকল ১৩টি টেবিল ও Row Level Security (RLS) পলিসি
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyProSql}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{copiedPro ? 'কপি হয়েছে!' : 'শুধু Pro স্কিমা'}</span>
            </button>

            <button
              onClick={handleCopyFullSql}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              {copiedFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFull ? 'কপি হয়েছে!' : 'সম্পূর্ণ স্কিমা (Part 1+2)'}</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">ব্যবহারের সহজ নিয়ম:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Supabase ড্যাশবোর্ডে লগইন করে{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                SQL Editor <ExternalLink className="w-3 h-3" />
              </a>{' '}
              ট্যাবে যান।
            </li>
            <li>উপরে থাকা "সম্পূর্ণ স্কিমা" অথবা "শুধু Pro স্কিমা" বাটনে ক্লিক করে কপি করুন।</li>
            <li>Supabase এ পেস্ট করে <strong>Run</strong> বাটনে চাপ দিন। আপনার ক্লাউড ডেটাবেজ প্রস্তুত হয়ে যাবে!</li>
          </ol>
        </div>
      </div>

      {/* Project Export / Netlify Deployment ZIP */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                সম্পূর্ণ প্রজেক্ট জিপ ডাউনলোড (Download Full Project ZIP)
              </h3>
              <p className="text-xs text-slate-500">
                Netlify বা GitHub এ ডিপ্লয় করার জন্য প্রস্তুত সম্পূর্ণ সোর্স কোড (.zip)
              </p>
            </div>
          </div>

          <a
            href="/shohoj-bebsha.zip"
            download="shohoj-bebsha.zip"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>প্রজেক্ট ZIP ডাউনলোড করুন</span>
          </a>
        </div>

        <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="font-semibold text-slate-800">Netlify-তে ডিপ্লয় করার সহজ ধাপ:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>উপরে থাকা <strong>"প্রজেক্ট ZIP ডাউনলোড করুন"</strong> বাটনে ক্লিক করে জিপ ফাইলটি নামান।</li>
            <li>জিপ ফাইলটি আনজিপ করে আপনার GitHub রিপোজিটরিতে পুশ করুন অথবা Netlify Drop এ আপলোড করুন।</li>
            <li>Netlify সাইট সেটিংসে গিয়ে <code className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[11px]">VITE_SUPABASE_URL</code> এবং <code className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code> ভ্যারিয়েবল যোগ করুন।</li>
            <li>Netlify তে <strong>Clear cache and deploy site</strong> দিন।</li>
          </ul>
        </div>
      </div>

      {/* Part 1 & 2 Architecture Notice */}
      <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>সহজ ব্যবসা - পার্ট ১ ও পার্ট ২ প্রো আর্কিটেকচার</span>
        </div>
        <p className="leading-relaxed">
          Shohoj Bebsha সম্পূর্ণ মডুলার আর্কিটেকচারে তৈরি। Free ইউজাররা স্বাচ্ছন্দ্যে সমস্ত মৌলিক ফিচার ব্যবহার করতে পারেন,
          এবং Pro আপগ্রেডেশনের সাথে সাথেই স্বয়ংক্রিয়ভাবে P&L হিসাব, ইনভয়েস/কোটেশন, ৮টি অ্যাডভান্সড রিপোর্ট, ৯টি ক্যালকুলেটর
          ও সাপ্লায়ার দেনা খাতা সক্রিয় হয়ে যায়।
        </p>
      </div>
    </div>
  );
};
