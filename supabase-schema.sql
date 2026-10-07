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

-- Safe migrations: Ensure all Part 1 Step 3 columns exist if table was already created
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

-- Ensure legacy 'name' or 'low_stock_level' are migrated to product_name / low_stock_threshold
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

-- Safe migrations: Ensure all Step 5 customer columns exist
alter table public.customers add column if not exists notes text;

-- 4. Sales Table (Part 1 Step 4: Sales Management)
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
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

-- 6. Expenses Table (Part 1 Step 5: Expense Management)
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  category text not null,
  amount numeric not null default 0,
  expense_date date not null default current_date,
  date date default current_date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Safe migrations: Ensure all Step 5 expense columns exist if table was already created
alter table public.expenses add column if not exists title text;
alter table public.expenses add column if not exists expense_date date default current_date;
alter table public.expenses add column if not exists date date default current_date;
alter table public.expenses add column if not exists updated_at timestamptz default now();

-- 7. Customer Payments Table (Part 1 Step 5: Customer Due Management)
create table if not exists public.customer_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  amount numeric not null default 0,
  payment_method text not null default 'CASH',
  payment_date date not null default current_date,
  date date default current_date,
  notes text,
  created_at timestamptz default now()
);

alter table public.customer_payments add column if not exists payment_date date default current_date;
alter table public.customer_payments add column if not exists date date default current_date;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Absolute Isolation: auth.uid() = user_id
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.customer_payments enable row level security;

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

-- ------------------------------------------------------------------------------
-- Customer Payments Policies (Part 1 Step 5)
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own customer_payments" on public.customer_payments;
create policy "Users can view own customer_payments"
  on public.customer_payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own customer_payments" on public.customer_payments;
create policy "Users can insert own customer_payments"
  on public.customer_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own customer_payments" on public.customer_payments;
create policy "Users can update own customer_payments"
  on public.customer_payments for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own customer_payments" on public.customer_payments;
create policy "Users can delete own customer_payments"
  on public.customer_payments for delete
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
create index if not exists idx_expenses_expense_date on public.expenses(expense_date desc);
create index if not exists idx_expenses_created_at on public.expenses(created_at desc);

-- Customer Payments
create index if not exists idx_customer_payments_user_id on public.customer_payments(user_id);
create index if not exists idx_customer_payments_customer_id on public.customer_payments(customer_id);
create index if not exists idx_customer_payments_date on public.customer_payments(payment_date desc);

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

-- ==============================================================================
-- ATOMIC TRANSACTION FUNCTION FOR SALES MANAGEMENT (Part 1 Step 4)
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
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Check current stock with row lock
  select stock_quantity into v_current_stock
  from public.products
  where id = p_product_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  if v_current_stock < p_quantity then
    raise exception 'Insufficient stock: Available %, requested %', v_current_stock, p_quantity;
  end if;

  -- 2. Deduct stock atomically
  update public.products
  set stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  where id = p_product_id and user_id = v_user_id;

  -- 3. Insert sale
  insert into public.sales (
    user_id,
    product_id,
    customer_id,
    quantity,
    selling_price,
    subtotal,
    discount,
    total_amount,
    paid_amount,
    due_amount,
    payment_status,
    sale_date,
    notes
  ) values (
    v_user_id,
    p_product_id,
    p_customer_id,
    p_quantity,
    p_selling_price,
    coalesce(p_subtotal, p_quantity * p_selling_price),
    coalesce(p_discount, 0),
    p_total_amount,
    coalesce(p_paid_amount, case when p_payment_status = 'paid' then p_total_amount else 0 end),
    coalesce(p_due_amount, case when p_payment_status = 'due' then p_total_amount else 0 end),
    p_payment_status,
    p_sale_date,
    p_notes
  ) returning id into v_new_sale_id;

  -- 4. Insert into sale_items
  insert into public.sale_items (
    sale_id,
    user_id,
    product_id,
    quantity,
    unit_price,
    total_price
  ) values (
    v_new_sale_id,
    v_user_id,
    p_product_id,
    p_quantity,
    p_selling_price,
    p_total_amount
  );

  -- 5. Update customer balance
  if p_customer_id is not null then
    update public.customers
    set total_purchase = coalesce(total_purchase, 0) + p_total_amount,
        due_amount = coalesce(due_amount, 0) + coalesce(p_due_amount, case when p_payment_status = 'due' then p_total_amount else 0 end),
        updated_at = now()
    where id = p_customer_id and user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'sale_id', v_new_sale_id,
    'new_stock', v_current_stock - p_quantity
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- Atomic Function: update_sale_transaction
-- Restores old stock, applies new stock, recalculates customer dues atomically
-- ------------------------------------------------------------------------------
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
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Fetch old sale with lock
  select * into v_old_sale
  from public.sales
  where id = p_sale_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Sale not found';
  end if;

  v_old_due := coalesce(v_old_sale.due_amount, case when v_old_sale.payment_status = 'due' then v_old_sale.total_amount else 0 end);
  v_calc_due := coalesce(p_due_amount, case when p_payment_status = 'due' then p_total_amount else 0 end);

  -- 2. Stock handling
  if v_old_sale.product_id = p_product_id then
    -- Check if new quantity exceeds current stock + old quantity
    select stock_quantity into v_available_stock
    from public.products
    where id = p_product_id and user_id = v_user_id
    for update;

    if (v_available_stock + v_old_sale.quantity) < p_quantity then
      raise exception 'Insufficient stock: Available %, requested %', (v_available_stock + v_old_sale.quantity), p_quantity;
    end if;

    update public.products
    set stock_quantity = stock_quantity + v_old_sale.quantity - p_quantity,
        updated_at = now()
    where id = p_product_id and user_id = v_user_id;
  else
    -- Restoring stock to old product
    if v_old_sale.product_id is not null then
      update public.products
      set stock_quantity = stock_quantity + v_old_sale.quantity,
          updated_at = now()
      where id = v_old_sale.product_id and user_id = v_user_id;
    end if;

    -- Deducting from new product
    select stock_quantity into v_available_stock
    from public.products
    where id = p_product_id and user_id = v_user_id
    for update;

    if v_available_stock < p_quantity then
      raise exception 'Insufficient stock: Available %, requested %', v_available_stock, p_quantity;
    end if;

    update public.products
    set stock_quantity = stock_quantity - p_quantity,
        updated_at = now()
    where id = p_product_id and user_id = v_user_id;
  end if;

  -- 3. Update customer due & total_purchase balances
  if v_old_sale.customer_id is not null and v_old_sale.customer_id != p_customer_id then
    -- Revert old customer's balances
    update public.customers
    set total_purchase = greatest(0, coalesce(total_purchase, 0) - v_old_sale.total_amount),
        due_amount = greatest(0, coalesce(due_amount, 0) - v_old_due),
        updated_at = now()
    where id = v_old_sale.customer_id and user_id = v_user_id;
  end if;

  if p_customer_id is not null then
    if v_old_sale.customer_id = p_customer_id then
      -- Same customer: adjust difference
      update public.customers
      set total_purchase = greatest(0, coalesce(total_purchase, 0) - v_old_sale.total_amount + p_total_amount),
          due_amount = greatest(0, coalesce(due_amount, 0) - v_old_due + v_calc_due),
          updated_at = now()
      where id = p_customer_id and user_id = v_user_id;
    else
      -- New customer
      update public.customers
      set total_purchase = coalesce(total_purchase, 0) + p_total_amount,
          due_amount = coalesce(due_amount, 0) + v_calc_due,
          updated_at = now()
      where id = p_customer_id and user_id = v_user_id;
    end if;
  end if;

  -- 4. Update the sale record
  update public.sales
  set product_id = p_product_id,
      customer_id = p_customer_id,
      quantity = p_quantity,
      selling_price = p_selling_price,
      subtotal = coalesce(p_subtotal, p_quantity * p_selling_price),
      discount = coalesce(p_discount, 0),
      total_amount = p_total_amount,
      paid_amount = coalesce(p_paid_amount, case when p_payment_status = 'paid' then p_total_amount else 0 end),
      due_amount = v_calc_due,
      payment_status = p_payment_status,
      sale_date = p_sale_date,
      notes = p_notes
  where id = p_sale_id and user_id = v_user_id;

  -- 5. Update or insert sale_items
  delete from public.sale_items where sale_id = p_sale_id and user_id = v_user_id;
  insert into public.sale_items (
    sale_id,
    user_id,
    product_id,
    quantity,
    unit_price,
    total_price
  ) values (
    p_sale_id,
    v_user_id,
    p_product_id,
    p_quantity,
    p_selling_price,
    p_total_amount
  );

  return jsonb_build_object(
    'success', true,
    'sale_id', p_sale_id
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- Atomic Function: delete_sale_transaction
-- Restores product stock and reverts customer dues atomically
-- ------------------------------------------------------------------------------
create or replace function public.delete_sale_transaction(
  p_sale_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale record;
  v_due numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_sale
  from public.sales
  where id = p_sale_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Sale not found';
  end if;

  v_due := coalesce(v_sale.due_amount, case when v_sale.payment_status = 'due' then v_sale.total_amount else 0 end);

  -- 1. Restore product stock
  if v_sale.product_id is not null then
    update public.products
    set stock_quantity = stock_quantity + v_sale.quantity,
        updated_at = now()
    where id = v_sale.product_id and user_id = v_user_id;
  end if;

  -- 2. Restore customer due & total_purchase
  if v_sale.customer_id is not null then
    update public.customers
    set total_purchase = greatest(0, coalesce(total_purchase, 0) - v_sale.total_amount),
        due_amount = greatest(0, coalesce(due_amount, 0) - v_due),
        updated_at = now()
    where id = v_sale.customer_id and user_id = v_user_id;
  end if;

  -- 3. Delete sale items
  delete from public.sale_items where sale_id = p_sale_id and user_id = v_user_id;

  -- 4. Delete the sale
  delete from public.sales where id = p_sale_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'deleted_sale_id', p_sale_id
  );
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.record_sale_transaction to authenticated;
grant execute on function public.update_sale_transaction to authenticated;
grant execute on function public.delete_sale_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: record_customer_payment_transaction (Part 1 Step 5)
-- Records customer due payment and updates customer due_amount atomically
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Atomic Function: delete_customer_payment_transaction (Part 1 Step 5)
-- Deletes customer due payment and restores customer due_amount atomically
-- ------------------------------------------------------------------------------
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

  -- Restore customer due balance
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

-- ==============================================================================
-- PART 2: PRO PLAN, SUBSCRIPTION, INVOICES, REPORTS & PAYMENTS
-- ==============================================================================

-- 8. Subscriptions Table (Part 2 Feature 1 & 2)
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

-- Ensure profiles table has subscription columns
alter table public.profiles add column if not exists plan text default 'free';
alter table public.profiles add column if not exists subscription_status text default 'active';
alter table public.profiles add column if not exists subscription_expires_at timestamptz;

-- 9. Invoices Table (Part 2 Feature 3: PDF Invoices & Quotations)
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  invoice_number text not null,
  type text not null default 'invoice',
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  discount_type text default 'fixed',
  tax numeric default 0,
  vat_rate numeric default 0,
  vat_amount numeric default 0,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  due_amount numeric not null default 0,
  status text not null default 'due',
  issue_date date not null default current_date,
  due_date date,
  items jsonb not null default '[]'::jsonb,
  notes text,
  terms text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Payment Requests Table (Part 2 Feature 1: Manual Upgrade Requests)
create table if not exists public.payment_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_requested text not null default 'PRO',
  billing_cycle text not null default 'yearly',
  amount numeric not null default 990,
  payment_method text not null,
  sender_number text not null,
  transaction_id text not null,
  payment_date date not null default current_date,
  reference text,
  screenshot text,
  screenshot_url text,
  message text,
  status text not null default 'pending',
  rejection_reason text,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz default now()
);

-- 11. Business Settings Table
create table if not exists public.business_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  invoice_prefix text default 'INV-',
  quotation_prefix text default 'QTN-',
  next_invoice_number integer default 1001,
  default_vat_rate numeric default 0,
  currency_symbol text default '৳',
  payment_bkash_number text,
  payment_nagad_number text,
  payment_bank_info text,
  invoice_footer text,
  vat_reg_no text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12. Suppliers Table
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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

-- 13. Purchases Table
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  unit_cost numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'paid',
  purchase_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- 14. Supplier Payments Table
create table if not exists public.supplier_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  amount numeric not null default 0,
  payment_date date not null default current_date,
  payment_method text not null default 'CASH',
  notes text,
  created_at timestamptz default now()
);

-- 15. Stock Adjustments Table
create table if not exists public.stock_adjustments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  previous_quantity integer not null default 0,
  previous_stock integer not null default 0,
  new_quantity integer not null default 0,
  new_stock integer not null default 0,
  change_amount integer not null default 0,
  adjusted_quantity integer not null default 0,
  reason text not null,
  notes text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- ==============================================================================
-- PART 2 RLS POLICIES
-- ==============================================================================

alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_requests enable row level security;
alter table public.business_settings enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.stock_adjustments enable row level security;

-- Subscriptions policies
drop policy if exists "Users view own subscription" on public.subscriptions;
create policy "Users view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "Users insert own subscription" on public.subscriptions;
create policy "Users insert own subscription" on public.subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own subscription" on public.subscriptions;
create policy "Users update own subscription" on public.subscriptions for update using (auth.uid() = user_id);

-- Invoices policies
drop policy if exists "Users view own invoices" on public.invoices;
create policy "Users view own invoices" on public.invoices for select using (auth.uid() = user_id);
drop policy if exists "Users insert own invoices" on public.invoices;
create policy "Users insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own invoices" on public.invoices;
create policy "Users update own invoices" on public.invoices for update using (auth.uid() = user_id);
drop policy if exists "Users delete own invoices" on public.invoices;
create policy "Users delete own invoices" on public.invoices for delete using (auth.uid() = user_id);

-- Payment Requests policies
drop policy if exists "Users view own payment requests" on public.payment_requests;
create policy "Users view own payment requests" on public.payment_requests for select using (auth.uid() = user_id);
drop policy if exists "Users insert own payment requests" on public.payment_requests;
create policy "Users insert own payment requests" on public.payment_requests for insert with check (auth.uid() = user_id);

-- Business Settings policies
drop policy if exists "Users view own business settings" on public.business_settings;
create policy "Users view own business settings" on public.business_settings for select using (auth.uid() = user_id);
drop policy if exists "Users upsert own business settings" on public.business_settings;
create policy "Users upsert own business settings" on public.business_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Suppliers policies
drop policy if exists "Users view own suppliers" on public.suppliers;
create policy "Users view own suppliers" on public.suppliers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Purchases policies
drop policy if exists "Users view own purchases" on public.purchases;
create policy "Users view own purchases" on public.purchases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Supplier payments policies
drop policy if exists "Users view own supplier payments" on public.supplier_payments;
create policy "Users view own supplier payments" on public.supplier_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stock adjustments policies
drop policy if exists "Users view own stock adjustments" on public.stock_adjustments;
create policy "Users view own stock adjustments" on public.stock_adjustments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==============================================================================
-- PART 2 HELPER & ATOMIC FUNCTIONS
-- ==============================================================================

-- Check whether authenticated user has active Pro access
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

-- Activate or toggle subscription (can be called by user for demo/verified upgrades)
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

  if v_plan_clean not in ('free', 'pro') then
    raise exception 'Invalid plan: must be free or pro';
  end if;

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

  return jsonb_build_object(
    'success', true,
    'plan', v_plan_clean,
    'status', 'active',
    'expires_at', v_expires_at
  );
end;
$$;

grant execute on function public.set_user_subscription to authenticated;

-- ==============================================================================
-- PART 3: PURCHASE, SUPPLIER, CASH & ADVANCED INVENTORY ATOMIC TRANSACTIONS
-- ==============================================================================

-- Safe column additions for purchases & suppliers
alter table public.purchases add column if not exists subtotal numeric;
alter table public.purchases add column if not exists discount numeric default 0;
alter table public.purchases add column if not exists paid_amount numeric default 0;
alter table public.purchases add column if not exists due_amount numeric default 0;
alter table public.purchases add column if not exists updated_at timestamptz default now();
alter table public.suppliers add column if not exists notes text;

-- 16. Stock Movements Traceability Table (Part 3F)
create table if not exists public.stock_movements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  movement_type text not null, -- 'purchase', 'sale', 'purchase_edit', 'purchase_delete', 'sale_edit', 'sale_delete', 'adjustment_increase', 'adjustment_decrease', 'damaged', 'lost', 'correction'
  quantity integer not null,
  previous_stock integer not null default 0,
  new_stock integer not null default 0,
  reference_id uuid,
  notes text,
  created_at timestamptz default now()
);

alter table public.stock_movements enable row level security;
drop policy if exists "Users view own stock movements" on public.stock_movements;
create policy "Users view own stock movements" on public.stock_movements for select using (auth.uid() = user_id);
drop policy if exists "Users insert own stock movements" on public.stock_movements;
create policy "Users insert own stock movements" on public.stock_movements for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own stock movements" on public.stock_movements;
create policy "Users update own stock movements" on public.stock_movements for update using (auth.uid() = user_id);
drop policy if exists "Users delete own stock movements" on public.stock_movements;
create policy "Users delete own stock movements" on public.stock_movements for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Atomic Function: record_purchase_transaction (Part 3A)
-- Inserts purchase, atomically increments product stock, logs movement, updates supplier payable
-- ------------------------------------------------------------------------------
create or replace function public.record_purchase_transaction(
  p_supplier_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_unit_price numeric,
  p_subtotal numeric,
  p_discount numeric,
  p_total_amount numeric,
  p_paid_amount numeric,
  p_due_amount numeric,
  p_payment_status text,
  p_purchase_date date,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_stock integer;
  v_new_stock integer;
  v_new_purchase_id uuid;
  v_due numeric;
  v_paid numeric;
  v_total numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_quantity <= 0 then raise exception 'Purchase quantity must be greater than zero'; end if;

  v_total := coalesce(p_total_amount, p_quantity * p_unit_price);
  v_paid := coalesce(p_paid_amount, case when p_payment_status = 'paid' then v_total else 0 end);
  v_due := greatest(0, coalesce(p_due_amount, v_total - v_paid));

  -- 1. Product stock update
  if p_product_id is not null then
    select stock_quantity into v_old_stock
    from public.products
    where id = p_product_id and user_id = v_user_id
    for update;

    if not found then raise exception 'Product not found'; end if;

    v_new_stock := v_old_stock + p_quantity;

    update public.products
    set stock_quantity = v_new_stock,
        purchase_price = case when p_unit_price > 0 then p_unit_price else purchase_price end,
        updated_at = now()
    where id = p_product_id and user_id = v_user_id;
  end if;

  -- 2. Insert purchase record
  insert into public.purchases (
    user_id, supplier_id, product_id, quantity, unit_price, unit_cost,
    subtotal, discount, total_amount, paid_amount, due_amount,
    payment_status, purchase_date, notes
  ) values (
    v_user_id, p_supplier_id, p_product_id, p_quantity, p_unit_price, p_unit_price,
    coalesce(p_subtotal, p_quantity * p_unit_price), coalesce(p_discount, 0),
    v_total, v_paid, v_due,
    p_payment_status, p_purchase_date, p_notes
  ) returning id into v_new_purchase_id;

  -- 3. Record stock movement
  if p_product_id is not null then
    insert into public.stock_movements (
      user_id, product_id, movement_type, quantity,
      previous_stock, new_stock, reference_id, notes
    ) values (
      v_user_id, p_product_id, 'purchase', p_quantity,
      v_old_stock, v_new_stock, v_new_purchase_id, p_notes
    );
  end if;

  -- 4. Supplier payable & total purchased update
  if p_supplier_id is not null then
    update public.suppliers
    set total_purchased = coalesce(total_purchased, 0) + v_total,
        payable_amount = coalesce(payable_amount, 0) + v_due,
        updated_at = now()
    where id = p_supplier_id and user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'purchase_id', v_new_purchase_id,
    'new_stock', v_new_stock,
    'due_amount', v_due
  );
end;
$$;

grant execute on function public.record_purchase_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: update_purchase_transaction (Part 3A)
-- Restores old purchase stock/dues, applies new values atomically
-- ------------------------------------------------------------------------------
create or replace function public.update_purchase_transaction(
  p_purchase_id uuid,
  p_supplier_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_unit_price numeric,
  p_subtotal numeric,
  p_discount numeric,
  p_total_amount numeric,
  p_paid_amount numeric,
  p_due_amount numeric,
  p_payment_status text,
  p_purchase_date date,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_purchase record;
  v_old_stock integer;
  v_new_stock integer;
  v_total numeric;
  v_paid numeric;
  v_due numeric;
  v_old_due numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_old_purchase
  from public.purchases
  where id = p_purchase_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Purchase record not found'; end if;

  v_total := coalesce(p_total_amount, p_quantity * p_unit_price);
  v_paid := coalesce(p_paid_amount, case when p_payment_status = 'paid' then v_total else 0 end);
  v_due := greatest(0, coalesce(p_due_amount, v_total - v_paid));
  v_old_due := coalesce(v_old_purchase.due_amount, case when v_old_purchase.payment_status = 'due' then v_old_purchase.total_amount else 0 end);

  -- 1. Restore old product stock and apply new product stock
  if v_old_purchase.product_id is not null and v_old_purchase.product_id = p_product_id then
    select stock_quantity into v_old_stock
    from public.products
    where id = p_product_id and user_id = v_user_id
    for update;

    v_new_stock := v_old_stock - v_old_purchase.quantity + p_quantity;
    if v_new_stock < 0 then
      raise exception 'Stock cannot become negative (Calculated: %)', v_new_stock;
    end if;

    update public.products
    set stock_quantity = v_new_stock,
        purchase_price = case when p_unit_price > 0 then p_unit_price else purchase_price end,
        updated_at = now()
    where id = p_product_id and user_id = v_user_id;

    insert into public.stock_movements (
      user_id, product_id, movement_type, quantity,
      previous_stock, new_stock, reference_id, notes
    ) values (
      v_user_id, p_product_id, 'purchase_edit', p_quantity - v_old_purchase.quantity,
      v_old_stock, v_new_stock, p_purchase_id, 'Purchase updated'
    );
  elsif v_old_purchase.product_id <> p_product_id then
    -- Product changed
    if v_old_purchase.product_id is not null then
      update public.products
      set stock_quantity = greatest(0, stock_quantity - v_old_purchase.quantity),
          updated_at = now()
      where id = v_old_purchase.product_id and user_id = v_user_id;
    end if;
    if p_product_id is not null then
      select stock_quantity into v_old_stock from public.products where id = p_product_id and user_id = v_user_id for update;
      v_new_stock := v_old_stock + p_quantity;
      update public.products set stock_quantity = v_new_stock, updated_at = now() where id = p_product_id and user_id = v_user_id;
    end if;
  end if;

  -- 2. Restore and update supplier payable
  if v_old_purchase.supplier_id is not null and v_old_purchase.supplier_id = p_supplier_id then
    update public.suppliers
    set total_purchased = coalesce(total_purchased, 0) - v_old_purchase.total_amount + v_total,
        payable_amount = greatest(0, coalesce(payable_amount, 0) - v_old_due + v_due),
        updated_at = now()
    where id = p_supplier_id and user_id = v_user_id;
  elsif v_old_purchase.supplier_id <> p_supplier_id then
    if v_old_purchase.supplier_id is not null then
      update public.suppliers
      set total_purchased = greatest(0, coalesce(total_purchased, 0) - v_old_purchase.total_amount),
          payable_amount = greatest(0, coalesce(payable_amount, 0) - v_old_due),
          updated_at = now()
      where id = v_old_purchase.supplier_id and user_id = v_user_id;
    end if;
    if p_supplier_id is not null then
      update public.suppliers
      set total_purchased = coalesce(total_purchased, 0) + v_total,
          payable_amount = coalesce(payable_amount, 0) + v_due,
          updated_at = now()
      where id = p_supplier_id and user_id = v_user_id;
    end if;
  end if;

  -- 3. Update purchase record
  update public.purchases
  set supplier_id = p_supplier_id,
      product_id = p_product_id,
      quantity = p_quantity,
      unit_price = p_unit_price,
      unit_cost = p_unit_price,
      subtotal = coalesce(p_subtotal, p_quantity * p_unit_price),
      discount = coalesce(p_discount, 0),
      total_amount = v_total,
      paid_amount = v_paid,
      due_amount = v_due,
      payment_status = p_payment_status,
      purchase_date = p_purchase_date,
      notes = p_notes,
      updated_at = now()
  where id = p_purchase_id and user_id = v_user_id;

  return jsonb_build_object('success', true, 'purchase_id', p_purchase_id, 'new_stock', v_new_stock);
end;
$$;

grant execute on function public.update_purchase_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: delete_purchase_transaction (Part 3A)
-- Restores inventory, prevents negative stock, adjusts supplier balances
-- ------------------------------------------------------------------------------
create or replace function public.delete_purchase_transaction(
  p_purchase_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_purchase record;
  v_current_stock integer;
  v_new_stock integer;
  v_due numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_purchase
  from public.purchases
  where id = p_purchase_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Purchase record not found'; end if;

  -- 1. Deduct stock safely (prevent negative stock)
  if v_purchase.product_id is not null then
    select stock_quantity into v_current_stock
    from public.products
    where id = v_purchase.product_id and user_id = v_user_id
    for update;

    if v_current_stock < v_purchase.quantity then
      raise exception 'Cannot delete purchase: Current stock (%) is less than purchased quantity (%)', v_current_stock, v_purchase.quantity;
    end if;

    v_new_stock := v_current_stock - v_purchase.quantity;

    update public.products
    set stock_quantity = v_new_stock,
        updated_at = now()
    where id = v_purchase.product_id and user_id = v_user_id;

    insert into public.stock_movements (
      user_id, product_id, movement_type, quantity,
      previous_stock, new_stock, reference_id, notes
    ) values (
      v_user_id, v_purchase.product_id, 'purchase_delete', -v_purchase.quantity,
      v_current_stock, v_new_stock, p_purchase_id, 'Purchase deleted'
    );
  end if;

  -- 2. Adjust supplier payable
  v_due := coalesce(v_purchase.due_amount, case when v_purchase.payment_status = 'due' then v_purchase.total_amount else 0 end);
  if v_purchase.supplier_id is not null then
    update public.suppliers
    set total_purchased = greatest(0, coalesce(total_purchased, 0) - v_purchase.total_amount),
        payable_amount = greatest(0, coalesce(payable_amount, 0) - v_due),
        updated_at = now()
    where id = v_purchase.supplier_id and user_id = v_user_id;
  end if;

  -- 3. Delete purchase
  delete from public.purchases where id = p_purchase_id and user_id = v_user_id;

  return jsonb_build_object('success', true, 'purchase_id', p_purchase_id, 'new_stock', v_new_stock);
end;
$$;

grant execute on function public.delete_purchase_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: record_supplier_payment_transaction (Part 3C)
-- Records supplier payment against outstanding dues, updates payable atomically
-- ------------------------------------------------------------------------------
create or replace function public.record_supplier_payment_transaction(
  p_supplier_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_payment_method text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_supplier record;
  v_new_payable numeric;
  v_new_payment_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  select * into v_supplier
  from public.suppliers
  where id = p_supplier_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Supplier not found'; end if;

  v_new_payable := greatest(0, coalesce(v_supplier.payable_amount, 0) - p_amount);

  insert into public.supplier_payments (user_id, supplier_id, amount, payment_date, payment_method, notes)
  values (v_user_id, p_supplier_id, p_amount, p_payment_date, p_payment_method, p_notes)
  returning id into v_new_payment_id;

  update public.suppliers
  set payable_amount = v_new_payable,
      updated_at = now()
  where id = p_supplier_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'payment_id', v_new_payment_id,
    'new_payable', v_new_payable
  );
end;
$$;

grant execute on function public.record_supplier_payment_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: delete_supplier_payment_transaction (Part 3C)
-- Deletes supplier payment and restores outstanding payable
-- ------------------------------------------------------------------------------
create or replace function public.delete_supplier_payment_transaction(
  p_payment_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment record;
  v_new_payable numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select * into v_payment
  from public.supplier_payments
  where id = p_payment_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Payment record not found'; end if;

  update public.suppliers
  set payable_amount = coalesce(payable_amount, 0) + v_payment.amount,
      updated_at = now()
  where id = v_payment.supplier_id and user_id = v_user_id
  returning payable_amount into v_new_payable;

  delete from public.supplier_payments where id = p_payment_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'new_payable', coalesce(v_new_payable, 0)
  );
end;
$$;

grant execute on function public.delete_supplier_payment_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: recalculate_supplier_due_transaction (Part 3C)
-- Recalculates supplier payable balance from actual purchases and payments
-- ------------------------------------------------------------------------------
create or replace function public.recalculate_supplier_due_transaction(
  p_supplier_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_purchased numeric := 0;
  v_total_dues numeric := 0;
  v_total_payments numeric := 0;
  v_recalculated_payable numeric := 0;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select coalesce(sum(total_amount), 0),
         coalesce(sum(coalesce(due_amount, case when payment_status = 'due' then total_amount else 0 end)), 0)
  into v_total_purchased, v_total_dues
  from public.purchases
  where supplier_id = p_supplier_id and user_id = v_user_id;

  select coalesce(sum(amount), 0)
  into v_total_payments
  from public.supplier_payments
  where supplier_id = p_supplier_id and user_id = v_user_id;

  v_recalculated_payable := greatest(0, v_total_dues - v_total_payments);

  update public.suppliers
  set total_purchased = v_total_purchased,
      payable_amount = v_recalculated_payable,
      updated_at = now()
  where id = p_supplier_id and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'supplier_id', p_supplier_id,
    'total_purchased', v_total_purchased,
    'total_payments', v_total_payments,
    'payable_amount', v_recalculated_payable
  );
end;
$$;

grant execute on function public.recalculate_supplier_due_transaction to authenticated;

-- ------------------------------------------------------------------------------
-- Atomic Function: record_stock_adjustment_transaction (Part 3F)
-- Adjusts product inventory with reason (Damaged, Lost, Physical count), logs movement, prevents negative
-- ------------------------------------------------------------------------------
create or replace function public.record_stock_adjustment_transaction(
  p_product_id uuid,
  p_change_amount integer,
  p_reason text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_stock integer;
  v_new_stock integer;
  v_adj_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_change_amount = 0 then raise exception 'Change amount cannot be zero'; end if;

  select stock_quantity into v_old_stock
  from public.products
  where id = p_product_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Product not found'; end if;

  v_new_stock := v_old_stock + p_change_amount;
  if v_new_stock < 0 then
    raise exception 'Stock cannot be negative. Current stock: %, requested change: %', v_old_stock, p_change_amount;
  end if;

  update public.products
  set stock_quantity = v_new_stock,
      updated_at = now()
  where id = p_product_id and user_id = v_user_id;

  insert into public.stock_adjustments (
    user_id, product_id, previous_quantity, new_quantity,
    adjusted_quantity, reason, notes, date
  ) values (
    v_user_id, p_product_id, v_old_stock, v_new_stock,
    p_change_amount, p_reason, p_notes, current_date
  ) returning id into v_adj_id;

  insert into public.stock_movements (
    user_id, product_id, movement_type, quantity,
    previous_stock, new_stock, reference_id, notes
  ) values (
    v_user_id, p_product_id,
    case
      when lower(p_reason) like '%damage%' then 'damaged'
      when lower(p_reason) like '%loss%' or lower(p_reason) like '%lost%' then 'lost'
      when p_change_amount > 0 then 'adjustment_increase'
      else 'adjustment_decrease'
    end,
    p_change_amount, v_old_stock, v_new_stock, v_adj_id, coalesce(p_notes, p_reason)
  );

  return jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'old_stock', v_old_stock,
    'new_stock', v_new_stock,
    'change_amount', p_change_amount
  );
end;
$$;

grant execute on function public.record_stock_adjustment_transaction to authenticated;


