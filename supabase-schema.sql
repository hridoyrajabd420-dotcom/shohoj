-- ==============================================================================
-- সহজ ব্যবসা (Shohoj Bebsha) - Part 1 Database Schema for Supabase
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Create Profiles Table (links to auth.users)
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

-- 2. Create Products Table
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

-- 3. Create Customers Table
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

-- 4. Create Sales Table
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quantity integer not null default 1,
  selling_price numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'paid', -- 'paid' or 'due'
  sale_date date not null default current_date,
  created_at timestamptz default now()
);

-- 5. Create Expenses Table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null, -- 'Rent', 'Salary', 'Transport', 'Marketing', 'Electricity', 'Internet', 'Other'
  amount numeric not null default 0,
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Each user can ONLY access their own business data
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Products policies
create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id);

create policy "Users can delete own products"
  on public.products for delete
  using (auth.uid() = user_id);

-- Customers policies
create policy "Users can view own customers"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can insert own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own customers"
  on public.customers for update
  using (auth.uid() = user_id);

create policy "Users can delete own customers"
  on public.customers for delete
  using (auth.uid() = user_id);

-- Sales policies
create policy "Users can view own sales"
  on public.sales for select
  using (auth.uid() = user_id);

create policy "Users can insert own sales"
  on public.sales for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sales"
  on public.sales for update
  using (auth.uid() = user_id);

create policy "Users can delete own sales"
  on public.sales for delete
  using (auth.uid() = user_id);

-- Expenses policies
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Trigger to automatically create a profile row on auth sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, business_name, business_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'business_name', 'আমার ব্যবসা'),
    coalesce(new.raw_user_meta_data->>'business_type', 'Retail')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
