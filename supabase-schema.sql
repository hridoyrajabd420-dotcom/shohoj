-- ==============================================================================
-- সহজ ব্যবসা (Shohoj Bebsha) - Part 1 Database Schema for Supabase
-- Target Tables: profiles, products, sales, sale_items, expenses, customers
-- Fully secured with Row Level Security (RLS) & Performance Indexes
-- ==============================================================================

-- 1. Profiles Table (Linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  business_name text default 'আমার ব্যবসা',
  business_type text default 'Retail',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Products Table (Inventory items)
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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
  user_id uuid references auth.users(id) on delete cascade not null,
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
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  selling_price numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'paid' check (payment_status in ('paid', 'due')),
  sale_date date not null default current_date,
  created_at timestamptz default now()
);

-- 5. Sale Items Table (Detailed itemized records per sale)
create table if not exists public.sale_items (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references public.sales(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz default now()
);

-- 6. Expenses Table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  amount numeric not null default 0,
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Absolute Isolation: auth.uid() = user_id
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- Products Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own products" on public.products;
create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products"
  on public.products for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Customers Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own customers" on public.customers;
create policy "Users can view own customers"
  on public.customers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own customers" on public.customers;
create policy "Users can insert own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own customers" on public.customers;
create policy "Users can update own customers"
  on public.customers for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own customers" on public.customers;
create policy "Users can delete own customers"
  on public.customers for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Sales Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own sales" on public.sales;
create policy "Users can view own sales"
  on public.sales for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sales" on public.sales;
create policy "Users can insert own sales"
  on public.sales for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sales" on public.sales;
create policy "Users can update own sales"
  on public.sales for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own sales" on public.sales;
create policy "Users can delete own sales"
  on public.sales for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Sale Items Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own sale_items" on public.sale_items;
create policy "Users can view own sale_items"
  on public.sale_items for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sale_items" on public.sale_items;
create policy "Users can insert own sale_items"
  on public.sale_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sale_items" on public.sale_items;
create policy "Users can update own sale_items"
  on public.sale_items for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own sale_items" on public.sale_items;
create policy "Users can delete own sale_items"
  on public.sale_items for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Expenses Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- INDEXES - Optimal Performance for Queries & Relationships
-- ==============================================================================

-- Products
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_created_at on public.products(created_at desc);

-- Customers
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_created_at on public.customers(created_at desc);

-- Sales
create index if not exists idx_sales_user_id on public.sales(user_id);
create index if not exists idx_sales_customer_id on public.sales(customer_id);
create index if not exists idx_sales_product_id on public.sales(product_id);
create index if not exists idx_sales_date on public.sales(sale_date desc);
create index if not exists idx_sales_created_at on public.sales(created_at desc);

-- Sale Items
create index if not exists idx_sale_items_user_id on public.sale_items(user_id);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items(product_id);

-- Expenses
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(date desc);
create index if not exists idx_expenses_created_at on public.expenses(created_at desc);

-- ==============================================================================
-- AUTH TRIGGER - Automatic Profile Row on Sign-up
-- ==============================================================================

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
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
