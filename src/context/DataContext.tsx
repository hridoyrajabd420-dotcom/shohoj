import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { evaluateProAccess, ProAccessResult } from '../lib/proAccess';
import {
  Product,
  ProductInput,
  Customer,
  CustomerInput,
  Sale,
  SaleInput,
  Expense,
  ExpenseInput,
  RecurringExpense,
  RecurringExpenseInput,
  Supplier,
  Purchase,
  StockAdjustment,
  Invoice,
  InvoiceStatus,
  CustomerPayment,
  SupplierPayment,
  PaymentRequest,
  BusinessSettings,
  DashboardMetrics,
  UserSubscription,
  FixedAsset,
  FixedAssetInput,
  FixedAssetsSummary,
} from '../types';
import { getDueExpensesForRecurring, formatYMD } from '../lib/recurringExpensesEngine';
import { calculateFixedAssetsSummary } from '../lib/depreciationEngine';

interface DataContextType {
  // Part 1 State
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  loading: boolean;
  metrics: DashboardMetrics;
  lowStockProducts: Product[];
  refreshData: () => Promise<void>;
  isProductsTableMissing: boolean;

  // Part 2 Pro State
  suppliers: Supplier[];
  purchases: Purchase[];
  stockAdjustments: StockAdjustment[];
  invoices: Invoice[];
  customerPayments: CustomerPayment[];
  supplierPayments: SupplierPayment[];
  paymentRequests: PaymentRequest[];
  businessSettings: BusinessSettings | null;
  subscription: UserSubscription | null;
  proAccess: ProAccessResult;

  // Subscription Actions (Part 2 Feature 1 & 2)
  updateSubscription: (data: Partial<UserSubscription>) => Promise<{ error: string | null }>;
  activateProSubscription: (plan?: 'pro' | 'free', durationDays?: number) => Promise<{ error: string | null }>;

  // Product actions
  addProduct: (product: ProductInput | Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ error: string | null }>;
  deleteProduct: (id: string) => Promise<{ error: string | null }>;

  // Customer actions
  addCustomer: (customer: CustomerInput | Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ data?: Customer; error: string | null }>;
  updateCustomer: (id: string, customer: Partial<CustomerInput | Customer>) => Promise<{ error: string | null }>;
  deleteCustomer: (id: string) => Promise<{ error: string | null }>;
  recalculateCustomerDue: (customerId: string) => Promise<{ error: string | null }>;

  // Sale actions (Part 1 Step 4)
  recordSale: (saleData: SaleInput) => Promise<{ error: string | null }>;
  updateSale: (id: string, saleData: SaleInput) => Promise<{ error: string | null }>;
  deleteSale: (id: string) => Promise<{ error: string | null }>;

  // Expense actions
  addExpense: (expense: ExpenseInput | Omit<Expense, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  updateExpense: (id: string, expense: Partial<ExpenseInput | Expense>) => Promise<{ error: string | null }>;
  deleteExpense: (id: string) => Promise<{ error: string | null }>;

  // Recurring Expenses actions (স্বয়ংক্রিয় নির্দিষ্ট খরচ)
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (data: RecurringExpenseInput) => Promise<{ error: string | null }>;
  updateRecurringExpense: (id: string, data: Partial<RecurringExpenseInput | RecurringExpense>) => Promise<{ error: string | null }>;
  deleteRecurringExpense: (id: string) => Promise<{ error: string | null }>;
  triggerRecurringExpensesSync: () => Promise<{ generatedCount: number; error: string | null }>;

  // Fixed Assets (স্থায়ী সম্পদ ও অবচয়)
  fixedAssets: FixedAsset[];
  fixedAssetsSummary: FixedAssetsSummary;
  addFixedAsset: (data: FixedAssetInput) => Promise<{ error: string | null }>;
  updateFixedAsset: (id: string, data: Partial<FixedAssetInput | FixedAsset>) => Promise<{ error: string | null }>;
  deleteFixedAsset: (id: string) => Promise<{ error: string | null }>;

  // Part 2 Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ data?: Supplier; error: string | null }>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<{ error: string | null }>;
  deleteSupplier: (id: string) => Promise<{ error: string | null }>;

  // Part 2 Purchase actions
  addPurchase: (purchaseData: {
    supplierId?: string | null;
    productId?: string | null;
    quantity: number;
    unitPrice: number;
    paymentStatus: 'paid' | 'due';
    purchaseDate: string;
    notes?: string;
  }) => Promise<{ error: string | null }>;
  deletePurchase: (id: string) => Promise<{ error: string | null }>;

  // Part 2 Stock Adjustment actions
  addStockAdjustment: (adjustmentData: {
    productId: string;
    changeAmount: number;
    newStock: number;
    reason: StockAdjustment['reason'];
    notes?: string;
  }) => Promise<{ error: string | null }>;

  // Part 2 Invoice & Quotation actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at'>) => Promise<{ data?: Invoice; error: string | null }>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<{ error: string | null }>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<{ error: string | null }>;
  deleteInvoice: (id: string) => Promise<{ error: string | null }>;

  // Part 2 Due Payment collections & supplier payments
  recordCustomerPayment: (paymentData: {
    customerId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => Promise<{ error: string | null }>;
  deleteCustomerPayment: (id: string) => Promise<{ error: string | null }>;

  recordSupplierPayment: (paymentData: {
    supplierId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => Promise<{ error: string | null }>;

  // Part 2 Pro Payment Requests
  submitPaymentRequest: (requestData: Omit<PaymentRequest, 'id' | 'user_id' | 'status' | 'created_at'>) => Promise<{ error: string | null }>;

  // Part 2 Settings
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<{ error: string | null }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile, isConfigured } = useAuth();

  // Part 1 State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isProductsTableMissing, setIsProductsTableMissing] = useState<boolean>(false);

  // Part 2 State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Evaluated Pro Access (Part 2 Feature 2)
  const proAccess = useMemo(
    () => evaluateProAccess(user, profile, subscription),
    [user, profile, subscription]
  );

  // Refresh all tables from Supabase (with safe fallbacks if Part 2 tables aren't migrated yet)
  const refreshData = useCallback(async () => {
    if (!user || !isConfigured) {
      setProducts([]);
      setCustomers([]);
      setSales([]);
      setExpenses([]);
      setSuppliers([]);
      setPurchases([]);
      setStockAdjustments([]);
      setInvoices([]);
      setCustomerPayments([]);
      setSupplierPayments([]);
      setPaymentRequests([]);
      setSubscription(null);
      setFixedAssets([]);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);
    try {
      // 1. Part 1 core tables
      const [prodsRes, custsRes, salesRes, expsRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('sale_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);

      if (prodsRes.data) {
        const mappedProducts: Product[] = prodsRes.data.map((p: any) => {
          const prodName = p.product_name || p.name || 'Unnamed Product';
          const lowThresh = p.low_stock_threshold !== undefined && p.low_stock_threshold !== null
            ? Number(p.low_stock_threshold)
            : (p.low_stock_level !== undefined && p.low_stock_level !== null ? Number(p.low_stock_level) : 5);
          return {
            ...p,
            id: p.id,
            user_id: p.user_id,
            product_name: prodName,
            name: prodName,
            category: p.category || '',
            sku: p.sku || '',
            purchase_price: Number(p.purchase_price) || 0,
            selling_price: Number(p.selling_price) || 0,
            stock_quantity: Number(p.stock_quantity) || 0,
            low_stock_threshold: lowThresh,
            low_stock_level: lowThresh,
            unit: p.unit || 'pcs',
            description: p.description || '',
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        });
        setProducts(mappedProducts);
        setIsProductsTableMissing(false);
      } else if (prodsRes.error) {
        if (prodsRes.error.code === '42P01' || prodsRes.error.message?.includes('relation "public.products" does not exist')) {
          setIsProductsTableMissing(true);
        }
      }
      if (custsRes.data) setCustomers(custsRes.data as Customer[]);
      if (salesRes.data) {
        const mappedSales: Sale[] = salesRes.data.map((s: any) => {
          const qty = Number(s.quantity) || 1;
          const price = Number(s.selling_price) || 0;
          const sub = s.subtotal !== undefined && s.subtotal !== null ? Number(s.subtotal) : qty * price;
          const disc = Number(s.discount) || 0;
          const tot = s.total_amount !== undefined && s.total_amount !== null ? Number(s.total_amount) : Math.max(0, sub - disc);
          const paid = s.paid_amount !== undefined && s.paid_amount !== null ? Number(s.paid_amount) : (s.payment_status === 'paid' ? tot : 0);
          const due = s.due_amount !== undefined && s.due_amount !== null ? Number(s.due_amount) : (s.payment_status === 'due' ? tot : Math.max(0, tot - paid));
          return {
            ...s,
            quantity: qty,
            selling_price: price,
            subtotal: sub,
            discount: disc,
            total_amount: tot,
            paid_amount: paid,
            due_amount: due,
            payment_status: due <= 0 ? 'paid' : 'due',
            notes: s.notes || '',
          };
        });
        setSales(mappedSales);
      }
      if (expsRes.data) {
        const mappedExpenses: Expense[] = expsRes.data.map((e: any) => {
          const cat = e.category || 'Other';
          const expDate = e.expense_date || e.date || e.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
          return {
            id: e.id,
            user_id: e.user_id,
            title: e.title || cat,
            category: cat,
            amount: Number(e.amount) || 0,
            expense_date: expDate,
            date: expDate,
            description: e.description || '',
            recurring_expense_id: e.recurring_expense_id || null,
            is_recurring_auto: Boolean(e.is_recurring_auto),
            created_at: e.created_at,
            updated_at: e.updated_at,
          };
        });
        setExpenses(mappedExpenses);
      }

      // Fetch Recurring Expenses (স্বয়ংক্রিয় নির্দিষ্ট খরচ)
      let loadedRecurring: RecurringExpense[] = [];
      try {
        const recRes = await supabase
          .from('recurring_expenses')
          .select('*')
          .order('created_at', { ascending: false });
        if (recRes.data) {
          loadedRecurring = recRes.data as RecurringExpense[];
          setRecurringExpenses(loadedRecurring);
        }
      } catch {
        // Table not yet migrated
      }

      // Automatically sync due recurring expenses into the expenses table
      if (loadedRecurring.length > 0 && expsRes.data) {
        const todayStr = formatYMD(new Date());
        const currentExpList = (expsRes.data as any[]).map((e) => ({
          ...e,
          title: e.title || e.category,
          expense_date: e.expense_date || e.date,
          date: e.date || e.expense_date,
        })) as Expense[];

        for (const rec of loadedRecurring) {
          if (!rec.is_active) continue;
          const dueItems = getDueExpensesForRecurring(rec, todayStr, currentExpList);
          for (const item of dueItems) {
            try {
              const insertPayload: Record<string, any> = {
                user_id: user.id,
                title: item.title,
                category: item.category,
                amount: item.amount,
                expense_date: item.expense_date,
                date: item.expense_date,
                description: item.description,
                recurring_expense_id: item.recurring_expense_id,
                is_recurring_auto: true,
              };

              let insRes = await supabase.from('expenses').insert(insertPayload).select().single();
              if (insRes.error && (insRes.error.code === '42703' || insRes.error.message?.includes('recurring_expense_id') || insRes.error.message?.includes('is_recurring_auto'))) {
                // Fallback for minimal table schema
                const fallbackPayload = {
                  user_id: user.id,
                  category: item.category,
                  amount: item.amount,
                  date: item.expense_date,
                  description: item.description,
                };
                insRes = await supabase.from('expenses').insert(fallbackPayload).select().single();
              }

              if (insRes.data) {
                const norm: Expense = {
                  id: insRes.data.id,
                  user_id: insRes.data.user_id,
                  title: insRes.data.title || item.title,
                  category: insRes.data.category,
                  amount: Number(insRes.data.amount) || item.amount,
                  expense_date: item.expense_date,
                  date: item.expense_date,
                  description: insRes.data.description || item.description,
                  recurring_expense_id: item.recurring_expense_id,
                  is_recurring_auto: true,
                  created_at: insRes.data.created_at,
                  updated_at: insRes.data.updated_at,
                };
                currentExpList.unshift(norm);
                setExpenses((prev) => [norm, ...prev.filter((p) => p.id !== norm.id)]);
              }
            } catch (syncErr) {
              console.warn('Could not auto-generate recurring expense item:', syncErr);
            }
          }
        }
      }

      // Customer Payments (Part 1 Step 5: Customer Due Management)
      try {
        let custPayRes = await supabase.from('customer_payments').select('*').order('created_at', { ascending: false });
        if (custPayRes.error) {
          custPayRes = await supabase.from('customer_payments').select('*');
        }
        if (custPayRes.data) {
          const mappedPayments: CustomerPayment[] = custPayRes.data.map((p: any) => {
            const payDate = p.payment_date || p.date || p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
            return {
              id: p.id,
              user_id: p.user_id,
              customer_id: p.customer_id,
              amount: Number(p.amount) || 0,
              payment_date: payDate,
              date: payDate,
              payment_method: p.payment_method || 'CASH',
              notes: p.notes || '',
              created_at: p.created_at,
            };
          });
          setCustomerPayments(mappedPayments);
        }
      } catch {
        // Table not yet migrated
      }

      // 2. Part 2 tables (safely queried so missing tables don't block)
      try {
        const supRes = await supabase.from('suppliers').select('*').order('name', { ascending: true });
        if (supRes.data) setSuppliers(supRes.data as Supplier[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const purchRes = await supabase.from('purchases').select('*').order('purchase_date', { ascending: false });
        if (purchRes.data) setPurchases(purchRes.data as Purchase[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const adjRes = await supabase.from('stock_adjustments').select('*').order('created_at', { ascending: false });
        if (adjRes.data) setStockAdjustments(adjRes.data as StockAdjustment[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const invRes = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
        if (invRes.data) setInvoices(invRes.data as Invoice[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const custPayRes = await supabase.from('customer_payments').select('*').order('payment_date', { ascending: false });
        if (custPayRes.data) setCustomerPayments(custPayRes.data as CustomerPayment[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const supPayRes = await supabase.from('supplier_payments').select('*').order('payment_date', { ascending: false });
        if (supPayRes.data) setSupplierPayments(supPayRes.data as SupplierPayment[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const payReqRes = await supabase.from('payment_requests').select('*').order('created_at', { ascending: false });
        if (payReqRes.data) setPaymentRequests(payReqRes.data as PaymentRequest[]);
      } catch {
        // Table not yet migrated
      }

      try {
        const settingsRes = await supabase.from('business_settings').select('*').eq('user_id', user.id).maybeSingle();
        if (settingsRes.data) setBusinessSettings(settingsRes.data as BusinessSettings);
      } catch {
        // Table not yet migrated
      }

      // Fixed Assets (স্থায়ী সম্পদ ও অবচয়)
      try {
        const assetRes = await supabase
          .from('fixed_assets')
          .select('*')
          .order('purchase_date', { ascending: false });
        if (assetRes.data) {
          const mappedAssets: FixedAsset[] = assetRes.data.map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            name: a.name || a.asset_name || 'Unnamed Asset',
            category: a.category || 'Other',
            purchase_date: a.purchase_date || new Date().toISOString().split('T')[0],
            purchase_cost: Number(a.purchase_cost) || 0,
            useful_life: Number(a.useful_life) || 1,
            useful_life_unit: a.useful_life_unit === 'months' ? 'months' : 'years',
            salvage_value: Number(a.salvage_value) || 0,
            depreciation_method: a.depreciation_method || 'straight_line',
            depreciation_start_date: a.depreciation_start_date || a.purchase_date,
            notes: a.notes || '',
            created_at: a.created_at,
            updated_at: a.updated_at,
          }));
          setFixedAssets(mappedAssets);
          try {
            localStorage.setItem(`shohoj_bebsha_fixed_assets_${user.id}`, JSON.stringify(mappedAssets));
          } catch {}
        } else {
          const cached = localStorage.getItem(`shohoj_bebsha_fixed_assets_${user.id}`);
          if (cached) {
            try {
              setFixedAssets(JSON.parse(cached));
            } catch {}
          }
        }
      } catch {
        const cached = localStorage.getItem(`shohoj_bebsha_fixed_assets_${user.id}`);
        if (cached) {
          try {
            setFixedAssets(JSON.parse(cached));
          } catch {}
        }
      }

      try {
        const subRes = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
        if (subRes.data) {
          setSubscription(subRes.data as UserSubscription);
        } else if (profile) {
          setSubscription({
            user_id: user.id,
            plan: (profile.plan?.toLowerCase() === 'pro' ? 'pro' : 'free') as any,
            status: (profile.subscription_status || 'active') as any,
            expires_at: profile.subscription_expires_at || null,
          });
        }
      } catch {
        if (profile) {
          setSubscription({
            user_id: user.id,
            plan: (profile.plan?.toLowerCase() === 'pro' ? 'pro' : 'free') as any,
            status: (profile.subscription_status || 'active') as any,
            expires_at: profile.subscription_expires_at || null,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isConfigured]);

  useEffect(() => {
    if (user && isConfigured) {
      refreshData();
    }
  }, [user, isConfigured, refreshData]);

  // ==================== Product Operations ====================
  const addProduct = async (productData: ProductInput | Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const prodName = ('product_name' in productData && productData.product_name) || ('name' in productData && productData.name) || '';
      const threshold = productData.low_stock_threshold ?? productData.low_stock_level ?? 5;

      const newProduct: Record<string, any> = {
        user_id: user.id,
        product_name: prodName,
        category: productData.category || '',
        sku: productData.sku || '',
        purchase_price: Number(productData.purchase_price) || 0,
        selling_price: Number(productData.selling_price) || 0,
        stock_quantity: Number(productData.stock_quantity) || 0,
        low_stock_threshold: threshold,
        unit: productData.unit || 'pcs',
        description: productData.description || '',
      };

      let { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      // Graceful fallback if table is an earlier schema version with 'name' or 'low_stock_level' or NOT NULL constraint on 'name'
      if (error && (
        error.message?.includes('product_name') ||
        error.message?.includes('low_stock_threshold') ||
        error.message?.includes('category') ||
        error.message?.includes('unit') ||
        error.message?.includes('description') ||
        error.message?.includes('violates not-null') ||
        error.message?.includes('column "name"') ||
        error.code === '42703' ||
        error.code === '23502'
      )) {
        // Try with both 'name' and 'product_name' populated
        const legacyWithBoth: Record<string, any> = {
          user_id: user.id,
          name: prodName,
          product_name: prodName,
          category: productData.category || '',
          sku: productData.sku || '',
          purchase_price: Number(productData.purchase_price) || 0,
          selling_price: Number(productData.selling_price) || 0,
          stock_quantity: Number(productData.stock_quantity) || 0,
          low_stock_threshold: threshold,
          low_stock_level: threshold,
          unit: productData.unit || 'pcs',
          description: productData.description || '',
        };
        let retry = await supabase.from('products').insert(legacyWithBoth).select().single();
        if (retry.error) {
          // Strictly original legacy schema
          const strictLegacy: Record<string, any> = {
            user_id: user.id,
            name: prodName,
            sku: productData.sku || '',
            purchase_price: Number(productData.purchase_price) || 0,
            selling_price: Number(productData.selling_price) || 0,
            stock_quantity: Number(productData.stock_quantity) || 0,
            low_stock_level: threshold,
          };
          retry = await supabase.from('products').insert(strictLegacy).select().single();
        }
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      if (data) {
        const d = data as any;
        const normalized: Product = {
          ...d,
          id: d.id,
          user_id: d.user_id,
          product_name: d.product_name || d.name || prodName,
          name: d.name || d.product_name || prodName,
          category: d.category || productData.category || '',
          sku: d.sku || productData.sku || '',
          purchase_price: Number(d.purchase_price) || 0,
          selling_price: Number(d.selling_price) || 0,
          stock_quantity: Number(d.stock_quantity) || 0,
          low_stock_threshold: d.low_stock_threshold !== undefined && d.low_stock_threshold !== null
            ? Number(d.low_stock_threshold)
            : threshold,
          low_stock_level: d.low_stock_level !== undefined && d.low_stock_level !== null
            ? Number(d.low_stock_level)
            : threshold,
          unit: d.unit || productData.unit || 'pcs',
          description: d.description || productData.description || '',
          created_at: d.created_at,
          updated_at: d.updated_at,
        };
        setProducts((prev) => [normalized, ...prev]);
        setIsProductsTableMissing(false);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add product' };
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const prodName = productData.product_name ?? productData.name;
      const threshold = productData.low_stock_threshold ?? productData.low_stock_level;

      const updated: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (prodName !== undefined) updated.product_name = prodName;
      if (productData.category !== undefined) updated.category = productData.category;
      if (productData.sku !== undefined) updated.sku = productData.sku;
      if (productData.purchase_price !== undefined) updated.purchase_price = Number(productData.purchase_price);
      if (productData.selling_price !== undefined) updated.selling_price = Number(productData.selling_price);
      if (productData.stock_quantity !== undefined) updated.stock_quantity = Number(productData.stock_quantity);
      if (threshold !== undefined) updated.low_stock_threshold = Number(threshold);
      if (productData.unit !== undefined) updated.unit = productData.unit;
      if (productData.description !== undefined) updated.description = productData.description;

      let { data, error } = await supabase
        .from('products')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      // Graceful fallback if table uses legacy column names
      if (error && (
        error.message?.includes('product_name') ||
        error.message?.includes('low_stock_threshold') ||
        error.message?.includes('category') ||
        error.message?.includes('unit') ||
        error.message?.includes('description') ||
        error.message?.includes('violates not-null') ||
        error.code === '42703' ||
        error.code === '23502'
      )) {
        const legacyUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (prodName !== undefined) {
          legacyUpdate.name = prodName;
          legacyUpdate.product_name = prodName;
        }
        if (productData.sku !== undefined) legacyUpdate.sku = productData.sku;
        if (productData.purchase_price !== undefined) legacyUpdate.purchase_price = Number(productData.purchase_price);
        if (productData.selling_price !== undefined) legacyUpdate.selling_price = Number(productData.selling_price);
        if (productData.stock_quantity !== undefined) legacyUpdate.stock_quantity = Number(productData.stock_quantity);
        if (threshold !== undefined) {
          legacyUpdate.low_stock_level = Number(threshold);
          legacyUpdate.low_stock_threshold = Number(threshold);
        }

        let retry = await supabase.from('products').update(legacyUpdate).eq('id', id).select().single();
        if (retry.error) {
          // Strict minimal legacy update
          const minimalLegacy: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if (prodName !== undefined) minimalLegacy.name = prodName;
          if (productData.sku !== undefined) minimalLegacy.sku = productData.sku;
          if (productData.purchase_price !== undefined) minimalLegacy.purchase_price = Number(productData.purchase_price);
          if (productData.selling_price !== undefined) minimalLegacy.selling_price = Number(productData.selling_price);
          if (productData.stock_quantity !== undefined) minimalLegacy.stock_quantity = Number(productData.stock_quantity);
          if (threshold !== undefined) minimalLegacy.low_stock_level = Number(threshold);

          retry = await supabase.from('products').update(minimalLegacy).eq('id', id).select().single();
        }
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      if (data) {
        const d = data as any;
        const normalized: Product = {
          ...d,
          id: d.id,
          user_id: d.user_id,
          product_name: d.product_name || d.name || (prodName ?? ''),
          name: d.name || d.product_name || (prodName ?? ''),
          category: d.category ?? productData.category ?? '',
          sku: d.sku ?? productData.sku ?? '',
          purchase_price: Number(d.purchase_price) || 0,
          selling_price: Number(d.selling_price) || 0,
          stock_quantity: Number(d.stock_quantity) || 0,
          low_stock_threshold: d.low_stock_threshold !== undefined && d.low_stock_threshold !== null
            ? Number(d.low_stock_threshold)
            : (threshold ?? 5),
          low_stock_level: d.low_stock_level !== undefined && d.low_stock_level !== null
            ? Number(d.low_stock_level)
            : (threshold ?? 5),
          unit: d.unit ?? productData.unit ?? 'pcs',
          description: d.description ?? productData.description ?? '',
          created_at: d.created_at,
          updated_at: d.updated_at,
        };
        setProducts((prev) => prev.map((p) => (p.id === id ? normalized : p)));
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update product' };
    }
  };

  const deleteProduct = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) return { error: error.message };

      setProducts((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete product' };
    }
  };

  // ==================== Customer Operations (Part 1 Step 5) ====================
  const addCustomer = async (customerData: CustomerInput | Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newCustomer: Record<string, any> = {
        name: customerData.name.trim(),
        phone: customerData.phone?.trim() || '',
        email: customerData.email?.trim() || '',
        address: customerData.address?.trim() || '',
        notes: customerData.notes?.trim() || '',
        total_purchase: Number(customerData.total_purchase) || 0,
        due_amount: Number(customerData.due_amount) || 0,
        user_id: user.id,
      };

      let { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();

      // Graceful fallback if table doesn't have notes column yet
      if (error && (error.code === '42703' || error.message?.includes('notes'))) {
        delete newCustomer.notes;
        const retry = await supabase.from('customers').insert(newCustomer).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      if (data) {
        const normalized: Customer = {
          ...(data as any),
          notes: (customerData as any).notes || '',
        };
        setCustomers((prev) => [normalized, ...prev]);
        return { data: normalized, error: null };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add customer' };
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<CustomerInput | Customer>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const updated: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (customerData.name !== undefined) updated.name = customerData.name.trim();
      if (customerData.phone !== undefined) updated.phone = customerData.phone.trim();
      if (customerData.email !== undefined) updated.email = customerData.email.trim();
      if (customerData.address !== undefined) updated.address = customerData.address.trim();
      if (customerData.notes !== undefined) updated.notes = customerData.notes.trim();
      if (customerData.total_purchase !== undefined) updated.total_purchase = Number(customerData.total_purchase);
      if (customerData.due_amount !== undefined) updated.due_amount = Math.max(0, Number(customerData.due_amount));

      let { data, error } = await supabase
        .from('customers')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      // Fallback if notes column doesn't exist
      if (error && (error.code === '42703' || error.message?.includes('notes'))) {
        delete updated.notes;
        const retry = await supabase.from('customers').update(updated).eq('id', id).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      if (data) {
        setCustomers((prev) => prev.map((c) => (c.id === id ? { ...(c), ...(data as any), notes: customerData.notes !== undefined ? customerData.notes : c.notes } : c)));
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update customer' };
    }
  };

  const deleteCustomer = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      // Step 5 Requirement: Prevent accidental deletion of customers with linked sales or dues
      const linkedSales = sales.filter((s) => s.customer_id === id);
      if (linkedSales.length > 0) {
        return {
          error: `এই গ্রাহকের সাথে ${linkedSales.length}টি বিক্রয় রেকর্ড যুক্ত রয়েছে। বিক্রয় বিদ্যমান থাকা অবস্থায় গ্রাহক মুছে ফেলা সম্ভব নয়। (Cannot delete customer with linked sales)`,
        };
      }

      const linkedPayments = customerPayments.filter((p) => p.customer_id === id);
      if (linkedPayments.length > 0) {
        return {
          error: `এই গ্রাহকের সাথে ${linkedPayments.length}টি বকেয়া আদায়ের রেকর্ড যুক্ত রয়েছে। গ্রাহক ডিলিট করার আগে আদায়ের রেকর্ডগুলো পর্যালোচনা করুন।`,
        };
      }

      const custObj = customers.find((c) => c.id === id);
      if (custObj && Number(custObj.due_amount || 0) > 0) {
        return {
          error: `এই গ্রাহকের কাছে এখনও ৳ ${custObj.due_amount} বকেয়া পাওনা রয়েছে। বকেয়া পরিশোধ না করে গ্রাহক মুছে ফেলা সম্ভব নয়।`,
        };
      }

      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) return { error: error.message };

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete customer' };
    }
  };

  const recalculateCustomerDue = async (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return { error: 'গ্রাহক পাওয়া যায়নি (Customer not found)' };

    // Calculate actual total due from real sales
    const salesDue = sales
      .filter((s) => s.customer_id === customerId)
      .reduce((acc, s) => {
        const dueVal = s.due_amount !== undefined
          ? Number(s.due_amount)
          : (s.payment_status === 'due' ? Number(s.total_amount) : 0);
        return acc + dueVal;
      }, 0);

    // Calculate actual total payments recorded
    const paymentsTotal = customerPayments
      .filter((p) => p.customer_id === customerId)
      .reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const calculatedDue = Math.max(0, salesDue - paymentsTotal);
    return await updateCustomer(customerId, { due_amount: calculatedDue });
  };

  // ==================== Sale Operations (Part 1 Step 4) ====================
  const recordSale = async (saleData: SaleInput) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const product = products.find((p) => p.id === saleData.productId);
      if (!product) return { error: 'পণ্য পাওয়া যায়নি (Product not found)' };

      const qty = Number(saleData.quantity) || 1;
      const price = Number(saleData.sellingPrice) || 0;

      if (product.stock_quantity < qty) {
        return { error: `পর্যাপ্ত স্টক নেই! এই পণ্যের বর্তমান মজুদ মাত্র ${product.stock_quantity}টি।` };
      }

      const subtotal = saleData.subtotal !== undefined ? Number(saleData.subtotal) : qty * price;
      const discount = Number(saleData.discount) || 0;
      const totalAmount = saleData.totalAmount !== undefined ? Number(saleData.totalAmount) : Math.max(0, subtotal - discount);
      const paidAmount = saleData.paidAmount !== undefined ? Number(saleData.paidAmount) : (saleData.paymentStatus === 'paid' ? totalAmount : 0);
      const dueAmount = saleData.dueAmount !== undefined ? Number(saleData.dueAmount) : Math.max(0, totalAmount - paidAmount);
      const paymentStatus: 'paid' | 'due' = dueAmount <= 0 ? 'paid' : 'due';
      const normalizedCustomerId = saleData.customerId && String(saleData.customerId).trim() ? String(saleData.customerId).trim() : null;
      const saleDate = saleData.saleDate || new Date().toISOString().split('T')[0];
      const notes = saleData.notes?.trim() || null;

      // 1. Try atomic PostgreSQL transaction function if deployed
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('record_sale_transaction', {
          p_product_id: saleData.productId,
          p_customer_id: normalizedCustomerId,
          p_quantity: qty,
          p_selling_price: price,
          p_subtotal: subtotal,
          p_discount: discount,
          p_total_amount: totalAmount,
          p_paid_amount: paidAmount,
          p_due_amount: dueAmount,
          p_payment_status: paymentStatus,
          p_sale_date: saleDate,
          p_notes: notes,
        });

        if (!rpcError && rpcData?.success) {
          // Update local state with the returned new stock
          const newSaleObj: Sale = {
            id: rpcData.sale_id,
            user_id: user.id,
            product_id: saleData.productId,
            customer_id: normalizedCustomerId,
            quantity: qty,
            selling_price: price,
            subtotal,
            discount,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            due_amount: dueAmount,
            payment_status: paymentStatus,
            sale_date: saleDate,
            notes: notes || undefined,
            created_at: new Date().toISOString(),
          };

          setSales((prev) => [newSaleObj, ...prev]);
          setProducts((prev) =>
            prev.map((p) => (p.id === saleData.productId ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - qty) } : p))
          );
          if (normalizedCustomerId) {
            setCustomers((prev) =>
              prev.map((c) =>
                c.id === normalizedCustomerId
                  ? {
                      ...c,
                      total_purchase: Number(c.total_purchase || 0) + totalAmount,
                      due_amount: Number(c.due_amount || 0) + dueAmount,
                    }
                  : c
              )
            );
          }
          return { error: null };
        }
      } catch {
        // Fallback to client-side sequential transaction
      }

      // 2. Client-side Safe Sequential Transaction
      const newSaleRecord: Record<string, any> = {
        user_id: user.id,
        product_id: saleData.productId,
        customer_id: normalizedCustomerId,
        quantity: qty,
        selling_price: price,
        subtotal,
        discount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        payment_status: paymentStatus,
        sale_date: saleDate,
        notes,
      };

      let { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert(newSaleRecord)
        .select()
        .single();

      // Graceful fallback if table doesn't have the new Step 4 columns yet
      if (saleError && (saleError.code === '42703' || saleError.message?.includes('subtotal') || saleError.message?.includes('discount') || saleError.message?.includes('paid_amount') || saleError.message?.includes('due_amount') || saleError.message?.includes('notes'))) {
        const legacySaleRecord = {
          user_id: user.id,
          product_id: saleData.productId,
          customer_id: normalizedCustomerId,
          quantity: qty,
          selling_price: price,
          total_amount: totalAmount,
          payment_status: paymentStatus,
          sale_date: saleDate,
        };
        const retry = await supabase.from('sales').insert(legacySaleRecord).select().single();
        saleResult = retry.data;
        saleError = retry.error;
      }

      if (saleError) return { error: saleError.message };

      // 3. Decrement Product Stock
      const newStock = Math.max(0, product.stock_quantity - qty);
      const stockRes = await updateProduct(product.id, { stock_quantity: newStock });
      if (stockRes.error) {
        // Rollback sale if stock update failed
        await supabase.from('sales').delete().eq('id', (saleResult as Sale).id);
        return { error: `স্টক আপডেট ব্যর্থ: ${stockRes.error}` };
      }

      // 4. Update Customer records if customer attached
      if (normalizedCustomerId) {
        const customer = customers.find((c) => c.id === normalizedCustomerId);
        if (customer) {
          const updatedTotalPurchase = Number(customer.total_purchase || 0) + totalAmount;
          const updatedDue = Number(customer.due_amount || 0) + dueAmount;

          await updateCustomer(customer.id, {
            total_purchase: updatedTotalPurchase,
            due_amount: updatedDue,
          });
        }
      }

      if (saleResult) {
        try {
          await supabase.from('sale_items').insert({
            sale_id: (saleResult as Sale).id,
            user_id: user.id,
            product_id: saleData.productId,
            quantity: qty,
            unit_price: price,
            total_price: totalAmount,
          });
        } catch {
          // Safe fallback
        }

        const normalizedSale: Sale = {
          ...(saleResult as any),
          quantity: qty,
          selling_price: price,
          subtotal,
          discount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          due_amount: dueAmount,
          payment_status: paymentStatus,
          notes: notes || undefined,
        };
        setSales((prev) => [normalizedSale, ...prev]);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to record sale' };
    }
  };

  const updateSale = async (id: string, saleData: SaleInput) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const oldSale = sales.find((s) => s.id === id);
      if (!oldSale) return { error: 'Sale record not found' };

      const oldProduct = products.find((p) => p.id === oldSale.product_id);
      const newProduct = products.find((p) => p.id === saleData.productId);
      if (!newProduct) return { error: 'পণ্য পাওয়া যায়নি (Product not found)' };

      const qty = Number(saleData.quantity) || 1;
      const price = Number(saleData.sellingPrice) || 0;

      // Validate stock availability
      if (oldSale.product_id === saleData.productId) {
        const availableStock = (oldProduct?.stock_quantity || 0) + oldSale.quantity;
        if (availableStock < qty) {
          return { error: `পর্যাপ্ত স্টক নেই! বর্তমান উপলব্ধ স্টক: ${availableStock}` };
        }
      } else {
        if (newProduct.stock_quantity < qty) {
          return { error: `পর্যাপ্ত স্টক নেই! ${newProduct.product_name || newProduct.name}-এর বর্তমান স্টক: ${newProduct.stock_quantity}` };
        }
      }

      const subtotal = saleData.subtotal !== undefined ? Number(saleData.subtotal) : qty * price;
      const discount = Number(saleData.discount) || 0;
      const totalAmount = saleData.totalAmount !== undefined ? Number(saleData.totalAmount) : Math.max(0, subtotal - discount);
      const paidAmount = saleData.paidAmount !== undefined ? Number(saleData.paidAmount) : (saleData.paymentStatus === 'paid' ? totalAmount : 0);
      const dueAmount = saleData.dueAmount !== undefined ? Number(saleData.dueAmount) : Math.max(0, totalAmount - paidAmount);
      const paymentStatus: 'paid' | 'due' = dueAmount <= 0 ? 'paid' : 'due';
      const normalizedCustomerId = saleData.customerId && String(saleData.customerId).trim() ? String(saleData.customerId).trim() : null;
      const saleDate = saleData.saleDate || oldSale.sale_date;
      const notes = saleData.notes !== undefined ? (saleData.notes?.trim() || null) : (oldSale.notes || null);

      const oldDue = oldSale.due_amount !== undefined ? Number(oldSale.due_amount) : (oldSale.payment_status === 'due' ? Number(oldSale.total_amount) : 0);

      // Helper function to update React states for stock and customer balances
      const syncLocalStateAfterUpdate = () => {
        // 1. Stock State
        if (oldSale.product_id === saleData.productId && oldProduct) {
          const stockDiff = qty - oldSale.quantity;
          setProducts((prev) =>
            prev.map((p) => (p.id === oldProduct.id ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - stockDiff) } : p))
          );
        } else {
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === oldSale.product_id) return { ...p, stock_quantity: p.stock_quantity + oldSale.quantity };
              if (p.id === saleData.productId) return { ...p, stock_quantity: Math.max(0, p.stock_quantity - qty) };
              return p;
            })
          );
        }

        // 2. Customer State
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id === oldSale.customer_id && oldSale.customer_id !== normalizedCustomerId) {
              return {
                ...c,
                total_purchase: Math.max(0, Number(c.total_purchase || 0) - Number(oldSale.total_amount || 0)),
                due_amount: Math.max(0, Number(c.due_amount || 0) - oldDue),
              };
            }
            if (c.id === normalizedCustomerId) {
              if (normalizedCustomerId === oldSale.customer_id) {
                return {
                  ...c,
                  total_purchase: Math.max(0, Number(c.total_purchase || 0) - Number(oldSale.total_amount || 0) + totalAmount),
                  due_amount: Math.max(0, Number(c.due_amount || 0) - oldDue + dueAmount),
                };
              } else {
                return {
                  ...c,
                  total_purchase: Number(c.total_purchase || 0) + totalAmount,
                  due_amount: Number(c.due_amount || 0) + dueAmount,
                };
              }
            }
            return c;
          })
        );

        // 3. Sale State
        const updatedSaleObj: Sale = {
          ...oldSale,
          product_id: saleData.productId,
          customer_id: normalizedCustomerId,
          quantity: qty,
          selling_price: price,
          subtotal,
          discount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          due_amount: dueAmount,
          payment_status: paymentStatus,
          sale_date: saleDate,
          notes: notes || undefined,
        };
        setSales((prev) => prev.map((s) => (s.id === id ? updatedSaleObj : s)));
      };

      // 1. Try atomic PostgreSQL RPC update
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_sale_transaction', {
          p_sale_id: id,
          p_product_id: saleData.productId,
          p_customer_id: normalizedCustomerId,
          p_quantity: qty,
          p_selling_price: price,
          p_subtotal: subtotal,
          p_discount: discount,
          p_total_amount: totalAmount,
          p_paid_amount: paidAmount,
          p_due_amount: dueAmount,
          p_payment_status: paymentStatus,
          p_sale_date: saleDate,
          p_notes: notes,
        });

        if (!rpcError && rpcData?.success) {
          syncLocalStateAfterUpdate();
          return { error: null };
        }
      } catch {
        // Fallback to sequential update
      }

      // 2. Safe Sequential Fallback
      const updatedFields: Record<string, any> = {
        product_id: saleData.productId,
        customer_id: normalizedCustomerId,
        quantity: qty,
        selling_price: price,
        subtotal,
        discount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        due_amount: dueAmount,
        payment_status: paymentStatus,
        sale_date: saleDate,
        notes,
      };

      let { data, error } = await supabase
        .from('sales')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (error && (error.code === '42703' || error.message?.includes('subtotal') || error.message?.includes('discount') || error.message?.includes('paid_amount') || error.message?.includes('due_amount') || error.message?.includes('notes'))) {
        const legacyUpdate = {
          product_id: saleData.productId,
          customer_id: normalizedCustomerId,
          quantity: qty,
          selling_price: price,
          total_amount: totalAmount,
          payment_status: paymentStatus,
          sale_date: saleDate,
        };
        const retry = await supabase.from('sales').update(legacyUpdate).eq('id', id).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      // Adjust inventory stock
      if (oldSale.product_id === saleData.productId && oldProduct) {
        const stockDiff = qty - oldSale.quantity;
        const newStock = Math.max(0, oldProduct.stock_quantity - stockDiff);
        const stockRes = await updateProduct(oldProduct.id, { stock_quantity: newStock });
        if (stockRes.error) return { error: `স্টক আপডেট ব্যর্থ: ${stockRes.error}` };
      } else {
        if (oldProduct) {
          await updateProduct(oldProduct.id, { stock_quantity: oldProduct.stock_quantity + oldSale.quantity });
        }
        const stockRes = await updateProduct(newProduct.id, { stock_quantity: Math.max(0, newProduct.stock_quantity - qty) });
        if (stockRes.error) return { error: `স্টক আপডেট ব্যর্থ: ${stockRes.error}` };
      }

      // Adjust customer purchase and dues
      if (oldSale.customer_id) {
        const oldCust = customers.find((c) => c.id === oldSale.customer_id);
        if (oldCust) {
          const revertedTotal = Math.max(0, Number(oldCust.total_purchase || 0) - Number(oldSale.total_amount || 0));
          const revertedDue = Math.max(0, Number(oldCust.due_amount || 0) - oldDue);

          if (normalizedCustomerId !== oldSale.customer_id) {
            await updateCustomer(oldCust.id, { total_purchase: revertedTotal, due_amount: revertedDue });
          }
        }
      }

      if (normalizedCustomerId) {
        const targetCust = customers.find((c) => c.id === normalizedCustomerId);
        if (targetCust) {
          const isSameCust = normalizedCustomerId === oldSale.customer_id;
          const baseTotal = isSameCust
            ? Math.max(0, Number(targetCust.total_purchase || 0) - Number(oldSale.total_amount || 0))
            : Number(targetCust.total_purchase || 0);

          const baseDue = isSameCust
            ? Math.max(0, Number(targetCust.due_amount || 0) - oldDue)
            : Number(targetCust.due_amount || 0);

          const newTotalPurchase = baseTotal + totalAmount;
          const newDue = baseDue + dueAmount;

          await updateCustomer(targetCust.id, { total_purchase: newTotalPurchase, due_amount: newDue });
        }
      }

      // Update sale_items if table exists
      try {
        await supabase.from('sale_items').delete().eq('sale_id', id);
        await supabase.from('sale_items').insert({
          sale_id: id,
          user_id: user.id,
          product_id: saleData.productId,
          quantity: qty,
          unit_price: price,
          total_price: totalAmount,
        });
      } catch {
        // safe fallback
      }

      syncLocalStateAfterUpdate();
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update sale' };
    }
  };

  const deleteSale = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const sale = sales.find((s) => s.id === id);
      if (!sale) return { error: 'Sale record not found' };

      const saleDue = sale.due_amount !== undefined ? Number(sale.due_amount) : (sale.payment_status === 'due' ? Number(sale.total_amount) : 0);

      const syncLocalStateAfterDelete = () => {
        // Restore stock in local state
        if (sale.product_id) {
          setProducts((prev) =>
            prev.map((p) => (p.id === sale.product_id ? { ...p, stock_quantity: p.stock_quantity + sale.quantity } : p))
          );
        }
        // Restore customer in local state
        if (sale.customer_id) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === sale.customer_id
                ? {
                    ...c,
                    total_purchase: Math.max(0, Number(c.total_purchase || 0) - Number(sale.total_amount || 0)),
                    due_amount: Math.max(0, Number(c.due_amount || 0) - saleDue),
                  }
                : c
            )
          );
        }
        // Remove sale from local state
        setSales((prev) => prev.filter((s) => s.id !== id));
      };

      // 1. Try atomic PostgreSQL RPC delete
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_sale_transaction', {
          p_sale_id: id,
        });

        if (!rpcError && rpcData?.success) {
          syncLocalStateAfterDelete();
          return { error: null };
        }
      } catch {
        // Fallback to sequential deletion
      }

      // 2. Safe Sequential Fallback
      // Delete associated sale_items first
      try {
        await supabase.from('sale_items').delete().eq('sale_id', id);
      } catch {
        // safe fallback
      }

      // Delete the sale record from Supabase
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) return { error: error.message };

      // Restore product inventory stock
      if (sale.product_id) {
        const prod = products.find((p) => p.id === sale.product_id);
        if (prod) {
          await updateProduct(prod.id, { stock_quantity: prod.stock_quantity + sale.quantity });
        }
      }

      // Restore customer due and total_purchase
      if (sale.customer_id) {
        const cust = customers.find((c) => c.id === sale.customer_id);
        if (cust) {
          const newTotalPurchase = Math.max(0, Number(cust.total_purchase || 0) - Number(sale.total_amount || 0));
          const newDue = Math.max(0, Number(cust.due_amount || 0) - saleDue);

          await updateCustomer(cust.id, {
            total_purchase: newTotalPurchase,
            due_amount: newDue,
          });
        }
      }

      syncLocalStateAfterDelete();
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete sale' };
    }
  };

  // ==================== Expense Operations (Part 1 Step 5) ====================
  const addExpense = async (expenseData: ExpenseInput | Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const expDate = expenseData.expense_date || (expenseData as any).date || new Date().toISOString().split('T')[0];
      const title = expenseData.title?.trim() || expenseData.category || 'Expense';
      const amount = Number(expenseData.amount) || 0;
      const description = expenseData.description?.trim() || '';

      const newExpenseRecord: Record<string, any> = {
        user_id: user.id,
        title,
        category: expenseData.category,
        amount,
        expense_date: expDate,
        date: expDate,
        description,
      };

      let { data, error } = await supabase
        .from('expenses')
        .insert(newExpenseRecord)
        .select()
        .single();

      // Graceful fallback if table doesn't have title or expense_date columns yet
      if (error && (error.code === '42703' || error.message?.includes('title') || error.message?.includes('expense_date'))) {
        const legacyPayload = {
          user_id: user.id,
          category: expenseData.category,
          amount,
          date: expDate,
          description,
        };
        const retry = await supabase.from('expenses').insert(legacyPayload).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      if (data) {
        const normalized: Expense = {
          id: data.id,
          user_id: data.user_id,
          title: data.title || title,
          category: data.category,
          amount: Number(data.amount) || amount,
          expense_date: data.expense_date || data.date || expDate,
          date: data.date || data.expense_date || expDate,
          description: data.description || description,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setExpenses((prev) => [normalized, ...prev]);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add expense' };
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<ExpenseInput | Expense>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const expDate = expenseData.expense_date || expenseData.date;
      const updated: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (expenseData.title !== undefined) updated.title = expenseData.title.trim();
      if (expenseData.category !== undefined) updated.category = expenseData.category;
      if (expenseData.amount !== undefined) updated.amount = Number(expenseData.amount);
      if (expDate !== undefined) {
        updated.expense_date = expDate;
        updated.date = expDate;
      }
      if (expenseData.description !== undefined) updated.description = expenseData.description.trim();

      let { data, error } = await supabase
        .from('expenses')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      // Graceful fallback if table doesn't have title or expense_date columns
      if (error && (error.code === '42703' || error.message?.includes('title') || error.message?.includes('expense_date'))) {
        delete updated.title;
        delete updated.expense_date;
        const retry = await supabase.from('expenses').update(updated).eq('id', id).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) return { error: error.message };

      if (data) {
        const normalized: Expense = {
          id: data.id,
          user_id: data.user_id,
          title: data.title || expenseData.title || data.category,
          category: data.category,
          amount: Number(data.amount) || Number(expenseData.amount),
          expense_date: data.expense_date || data.date || expDate || new Date().toISOString().split('T')[0],
          date: data.date || data.expense_date || expDate || new Date().toISOString().split('T')[0],
          description: data.description !== undefined ? data.description : (expenseData.description || ''),
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setExpenses((prev) => prev.map((e) => (e.id === id ? normalized : e)));
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update expense' };
    }
  };

  const deleteExpense = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) return { error: error.message };

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete expense' };
    }
  };

  // ==================== Recurring Expense Operations (স্বয়ংক্রিয় নির্দিষ্ট খরচ) ====================
  const addRecurringExpense = async (data: RecurringExpenseInput) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newRec: Record<string, any> = {
        user_id: user.id,
        title: data.title.trim(),
        category: data.category,
        amount: Number(data.amount) || 0,
        frequency: data.frequency,
        day_of_month: data.day_of_month ?? (data.frequency === 'monthly' ? 1 : null),
        day_of_week: data.day_of_week ?? null,
        execution_date: data.execution_date || new Date().toISOString().split('T')[0],
        is_active: data.is_active ?? true,
        notes: data.notes?.trim() || '',
      };

      let { data: saved, error } = await supabase
        .from('recurring_expenses')
        .insert(newRec)
        .select()
        .single();

      if (error) {
        // Fallback: create in local state with client ID if table not yet created
        const fallbackId = `rec_${Date.now()}`;
        const localRec: RecurringExpense = {
          id: fallbackId,
          user_id: user.id,
          title: newRec.title,
          category: newRec.category,
          amount: newRec.amount,
          frequency: newRec.frequency,
          day_of_month: newRec.day_of_month,
          day_of_week: newRec.day_of_week,
          execution_date: newRec.execution_date,
          is_active: newRec.is_active,
          notes: newRec.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setRecurringExpenses((prev) => [localRec, ...prev]);

        // Auto-check and trigger sync immediately for this new recurring rule
        setTimeout(() => {
          triggerRecurringExpensesSync();
        }, 100);

        return { error: null };
      }

      if (saved) {
        setRecurringExpenses((prev) => [saved as RecurringExpense, ...prev]);
        setTimeout(() => {
          triggerRecurringExpensesSync();
        }, 100);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add recurring expense' };
    }
  };

  const updateRecurringExpense = async (id: string, data: Partial<RecurringExpenseInput | RecurringExpense>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const updatedFields: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.title !== undefined) updatedFields.title = data.title.trim();
      if (data.category !== undefined) updatedFields.category = data.category;
      if (data.amount !== undefined) updatedFields.amount = Number(data.amount);
      if (data.frequency !== undefined) updatedFields.frequency = data.frequency;
      if (data.day_of_month !== undefined) updatedFields.day_of_month = data.day_of_month;
      if (data.day_of_week !== undefined) updatedFields.day_of_week = data.day_of_week;
      if (data.execution_date !== undefined) updatedFields.execution_date = data.execution_date;
      if (data.is_active !== undefined) updatedFields.is_active = data.is_active;
      if (data.notes !== undefined) updatedFields.notes = data.notes?.trim() || '';

      const { data: saved, error } = await supabase
        .from('recurring_expenses')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Fallback update in state
        setRecurringExpenses((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
        );
      } else if (saved) {
        setRecurringExpenses((prev) =>
          prev.map((r) => (r.id === id ? (saved as RecurringExpense) : r))
        );
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update recurring expense' };
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
      if (error) {
        // Fallback remove from state
        setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
      } else {
        setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete recurring expense' };
    }
  };

  const triggerRecurringExpensesSync = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { generatedCount: 0, error: 'Not authenticated' };

    try {
      const todayStr = formatYMD(new Date());
      let generated = 0;

      for (const rec of recurringExpenses) {
        if (!rec.is_active) continue;
        const dueItems = getDueExpensesForRecurring(rec, todayStr, expenses);
        for (const item of dueItems) {
          const res = await addExpense({
            title: item.title,
            category: item.category,
            amount: item.amount,
            expense_date: item.expense_date,
            date: item.expense_date,
            description: item.description,
            recurring_expense_id: item.recurring_expense_id,
            is_recurring_auto: true,
          });
          if (!res.error) {
            generated++;
          }
        }
      }

      return { generatedCount: generated, error: null };
    } catch (err: unknown) {
      return { generatedCount: 0, error: err instanceof Error ? err.message : 'Sync failed' };
    }
  };

  // ==================== Fixed Asset Operations (স্থায়ী সম্পদ ও অবচয়) ====================
  const fixedAssetsSummary = useMemo(() => {
    return calculateFixedAssetsSummary(fixedAssets);
  }, [fixedAssets]);

  const addFixedAsset = async (data: FixedAssetInput) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const pCost = Math.max(0, Number(data.purchase_cost) || 0);
      const sVal = Math.max(0, Number(data.salvage_value) || 0);
      const uLife = Math.max(0.1, Number(data.useful_life) || 1);
      const pDate = data.purchase_date || new Date().toISOString().split('T')[0];
      const dStart = data.depreciation_start_date || pDate;

      const newAssetPayload: Record<string, any> = {
        user_id: user.id,
        name: data.name.trim(),
        category: data.category,
        purchase_date: pDate,
        purchase_cost: pCost,
        useful_life: uLife,
        useful_life_unit: data.useful_life_unit || 'years',
        salvage_value: sVal,
        depreciation_method: data.depreciation_method || 'straight_line',
        depreciation_start_date: dStart,
        notes: data.notes?.trim() || '',
      };

      let { data: saved, error } = await supabase
        .from('fixed_assets')
        .insert(newAssetPayload)
        .select()
        .single();

      if (error) {
        // Fallback: local storage
        const fallbackId = `asset_${Date.now()}`;
        const localAsset: FixedAsset = {
          id: fallbackId,
          user_id: user.id,
          name: newAssetPayload.name,
          category: newAssetPayload.category,
          purchase_date: newAssetPayload.purchase_date,
          purchase_cost: newAssetPayload.purchase_cost,
          useful_life: newAssetPayload.useful_life,
          useful_life_unit: newAssetPayload.useful_life_unit,
          salvage_value: newAssetPayload.salvage_value,
          depreciation_method: newAssetPayload.depreciation_method,
          depreciation_start_date: newAssetPayload.depreciation_start_date,
          notes: newAssetPayload.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setFixedAssets((prev) => {
          const updated = [localAsset, ...prev];
          try {
            localStorage.setItem(`shohoj_bebsha_fixed_assets_${user.id}`, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        return { error: null };
      }

      if (saved) {
        const item: FixedAsset = {
          id: saved.id,
          user_id: saved.user_id,
          name: saved.name || saved.asset_name,
          category: saved.category,
          purchase_date: saved.purchase_date,
          purchase_cost: Number(saved.purchase_cost) || 0,
          useful_life: Number(saved.useful_life) || 1,
          useful_life_unit: saved.useful_life_unit,
          salvage_value: Number(saved.salvage_value) || 0,
          depreciation_method: saved.depreciation_method,
          depreciation_start_date: saved.depreciation_start_date,
          notes: saved.notes || '',
          created_at: saved.created_at,
          updated_at: saved.updated_at,
        };
        setFixedAssets((prev) => {
          const updated = [item, ...prev.filter((a) => a.id !== item.id)];
          try {
            localStorage.setItem(`shohoj_bebsha_fixed_assets_${user.id}`, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add fixed asset' };
    }
  };

  const updateFixedAsset = async (id: string, data: Partial<FixedAssetInput | FixedAsset>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const updatedFields: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.name !== undefined) updatedFields.name = data.name.trim();
      if (data.category !== undefined) updatedFields.category = data.category;
      if (data.purchase_date !== undefined) updatedFields.purchase_date = data.purchase_date;
      if (data.purchase_cost !== undefined) updatedFields.purchase_cost = Math.max(0, Number(data.purchase_cost) || 0);
      if (data.useful_life !== undefined) updatedFields.useful_life = Math.max(0.1, Number(data.useful_life) || 1);
      if (data.useful_life_unit !== undefined) updatedFields.useful_life_unit = data.useful_life_unit;
      if (data.salvage_value !== undefined) updatedFields.salvage_value = Math.max(0, Number(data.salvage_value) || 0);
      if (data.depreciation_method !== undefined) updatedFields.depreciation_method = data.depreciation_method;
      if (data.depreciation_start_date !== undefined) updatedFields.depreciation_start_date = data.depreciation_start_date;
      if (data.notes !== undefined) updatedFields.notes = data.notes?.trim() || '';

      await supabase
        .from('fixed_assets')
        .update(updatedFields)
        .eq('id', id)
        .eq('user_id', user.id);

      setFixedAssets((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a));
        try {
          localStorage.setItem(`shohoj_bebsha_fixed_assets_${user.id}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to update fixed asset' };
    }
  };

  const deleteFixedAsset = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      await supabase
        .from('fixed_assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      setFixedAssets((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        try {
          localStorage.setItem(`shohoj_bebsha_fixed_assets_${user.id}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete fixed asset' };
    }
  };

  // ==================== PART 2: Supplier Operations ====================
  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newSup = {
        ...supplierData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('suppliers')
        .insert(newSup)
        .select()
        .single();

      if (error) {
        // Fallback for local preview if table not migrated yet
        const localSup: Supplier = {
          id: `local-sup-${Date.now()}`,
          user_id: user.id,
          ...supplierData,
          created_at: new Date().toISOString(),
        };
        setSuppliers((prev) => [localSup, ...prev]);
        return { data: localSup, error: null };
      }

      if (data) {
        setSuppliers((prev) => [data as Supplier, ...prev]);
        return { data: data as Supplier, error: null };
      }
      return { error: null };
    } catch {
      const localSup: Supplier = {
        id: `local-sup-${Date.now()}`,
        user_id: user.id,
        ...supplierData,
        created_at: new Date().toISOString(),
      };
      setSuppliers((prev) => [localSup, ...prev]);
      return { data: localSup, error: null };
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const updated = {
        ...supplierData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('suppliers')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
        return { error: null };
      }

      if (data) {
        setSuppliers((prev) => prev.map((s) => (s.id === id ? (data as Supplier) : s)));
      }
      return { error: null };
    } catch {
      setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...supplierData } : s)));
      return { error: null };
    }
  };

  const deleteSupplier = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      await supabase.from('suppliers').delete().eq('id', id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      return { error: null };
    } catch {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      return { error: null };
    }
  };

  // ==================== PART 2: Purchases Operations ====================
  const addPurchase = async (purchaseData: {
    supplierId?: string | null;
    productId?: string | null;
    quantity: number;
    unitPrice: number;
    paymentStatus: 'paid' | 'due';
    purchaseDate: string;
    notes?: string;
  }) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const totalAmount = purchaseData.quantity * purchaseData.unitPrice;
      const newPurchase = {
        user_id: user.id,
        supplier_id: purchaseData.supplierId || null,
        product_id: purchaseData.productId || null,
        quantity: purchaseData.quantity,
        unit_price: purchaseData.unitPrice,
        total_amount: totalAmount,
        payment_status: purchaseData.paymentStatus,
        purchase_date: purchaseData.purchaseDate,
        notes: purchaseData.notes || '',
      };

      let createdPurchase: Purchase | null = null;
      try {
        const { data, error } = await supabase.from('purchases').insert(newPurchase).select().single();
        if (!error && data) {
          createdPurchase = data as Purchase;
        }
      } catch {
        // Fallback for missing table
      }

      if (!createdPurchase) {
        createdPurchase = {
          id: `local-purch-${Date.now()}`,
          ...newPurchase,
          created_at: new Date().toISOString(),
        };
      }

      setPurchases((prev) => [createdPurchase!, ...prev]);

      // If product attached, increase stock quantity
      if (purchaseData.productId) {
        const prod = products.find((p) => p.id === purchaseData.productId);
        if (prod) {
          const updatedStock = Number(prod.stock_quantity || 0) + purchaseData.quantity;
          await updateProduct(prod.id, { stock_quantity: updatedStock });
        }
      }

      // If supplier attached and due, increase supplier's payable_amount
      if (purchaseData.supplierId && purchaseData.paymentStatus === 'due') {
        const sup = suppliers.find((s) => s.id === purchaseData.supplierId);
        if (sup) {
          const updatedPayable = Number(sup.payable_amount || 0) + totalAmount;
          await updateSupplier(sup.id, { payable_amount: updatedPayable });
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add purchase' };
    }
  };

  const deletePurchase = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      await supabase.from('purchases').delete().eq('id', id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    } catch {
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    }
  };

  // ==================== PART 2: Stock Adjustment Operations ====================
  const addStockAdjustment = async (adjustmentData: {
    productId: string;
    changeAmount: number;
    newStock: number;
    reason: StockAdjustment['reason'];
    notes?: string;
  }) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const prod = products.find((p) => p.id === adjustmentData.productId);
      if (!prod) return { error: 'Product not found' };

      const prevStock = prod.stock_quantity;
      const record = {
        user_id: user.id,
        product_id: adjustmentData.productId,
        previous_stock: prevStock,
        new_stock: adjustmentData.newStock,
        change_amount: adjustmentData.changeAmount,
        reason: adjustmentData.reason,
        notes: adjustmentData.notes || '',
      };

      try {
        const { data } = await supabase.from('stock_adjustments').insert(record).select().single();
        if (data) {
          setStockAdjustments((prev) => [data as StockAdjustment, ...prev]);
        }
      } catch {
        const localAdj: StockAdjustment = {
          id: `local-adj-${Date.now()}`,
          ...record,
          created_at: new Date().toISOString(),
        };
        setStockAdjustments((prev) => [localAdj, ...prev]);
      }

      // Update product current stock
      await updateProduct(prod.id, { stock_quantity: Math.max(0, adjustmentData.newStock) });

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to adjust stock' };
    }
  };

  // ==================== PART 2: Invoice & Quotation Operations ====================
  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newInv = {
        ...invoiceData,
        user_id: user.id,
      };

      try {
        const { data, error } = await supabase.from('invoices').insert(newInv).select().single();
        if (!error && data) {
          setInvoices((prev) => [data as Invoice, ...prev]);
          return { data: data as Invoice, error: null };
        }
      } catch {
        // local fallback
      }

      const localInv: Invoice = {
        id: `local-inv-${Date.now()}`,
        ...newInv,
        created_at: new Date().toISOString(),
      };
      setInvoices((prev) => [localInv, ...prev]);
      return { data: localInv, error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to save invoice' };
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      await supabase.from('invoices').update(invoiceData).eq('id', id);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...invoiceData } : inv)));
      return { error: null };
    } catch {
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...invoiceData } : inv)));
      return { error: null };
    }
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    return updateInvoice(id, { status });
  };

  const deleteInvoice = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      await supabase.from('invoices').delete().eq('id', id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      return { error: null };
    } catch {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      return { error: null };
    }
  };

  // ==================== Customer Due & Payment Operations (Part 1 Step 5) ====================
  const recordCustomerPayment = async (paymentData: {
    customerId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const cust = customers.find((c) => c.id === paymentData.customerId);
      if (!cust) return { error: 'গ্রাহক পাওয়া যায়নি (Customer not found)' };

      const payAmount = Number(paymentData.amount);
      if (!payAmount || payAmount <= 0) {
        return { error: 'পরিশোধের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে (Payment amount must be greater than zero)' };
      }

      const currentDue = Number(cust.due_amount || 0);
      if (payAmount > currentDue) {
        return {
          error: `পরিশোধের পরিমাণ (৳ ${payAmount}) বর্তমান বকেয়া পাওনা (৳ ${currentDue})-এর চেয়ে বেশি হতে পারবে না। (Cannot exceed outstanding due)`,
        };
      }

      const payDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];
      const method = paymentData.paymentMethod || 'CASH';
      const notes = paymentData.notes?.trim() || '';

      // 1. Try atomic PostgreSQL RPC transaction first
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('record_customer_payment_transaction', {
          p_customer_id: paymentData.customerId,
          p_amount: payAmount,
          p_payment_date: payDate,
          p_payment_method: method,
          p_notes: notes || null,
        });

        if (!rpcError && rpcData?.success) {
          const newPaymentObj: CustomerPayment = {
            id: rpcData.payment_id,
            user_id: user.id,
            customer_id: paymentData.customerId,
            amount: payAmount,
            payment_date: payDate,
            date: payDate,
            payment_method: method,
            notes,
            created_at: new Date().toISOString(),
          };
          setCustomerPayments((prev) => [newPaymentObj, ...prev]);
          setCustomers((prev) =>
            prev.map((c) => (c.id === paymentData.customerId ? { ...c, due_amount: Number(rpcData.new_due) } : c))
          );
          return { error: null };
        }
      } catch {
        // Fallback to sequential
      }

      // 2. Safe Sequential Fallback
      const newPayment = {
        user_id: user.id,
        customer_id: paymentData.customerId,
        amount: payAmount,
        payment_date: payDate,
        date: payDate,
        payment_method: method,
        notes,
      };

      let insertedId = `local-cpay-${Date.now()}`;
      try {
        const { data, error } = await supabase.from('customer_payments').insert(newPayment).select().single();
        if (!error && data) {
          insertedId = data.id;
        } else if (error && (error.message?.includes('payment_date') || error.code === '42703')) {
          const fallbackPayment = {
            user_id: user.id,
            customer_id: paymentData.customerId,
            amount: payAmount,
            date: payDate,
            payment_method: method,
            notes,
          };
          const retry = await supabase.from('customer_payments').insert(fallbackPayment).select().single();
          if (retry.data) insertedId = retry.data.id;
        }
      } catch {
        // Safe local fallback
      }

      const newDue = Math.max(0, currentDue - payAmount);
      await updateCustomer(cust.id, { due_amount: newDue });

      const newPaymentObj: CustomerPayment = {
        id: insertedId,
        user_id: user.id,
        customer_id: paymentData.customerId,
        amount: payAmount,
        payment_date: payDate,
        date: payDate,
        payment_method: method,
        notes,
        created_at: new Date().toISOString(),
      };
      setCustomerPayments((prev) => [newPaymentObj, ...prev]);

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to record customer payment' };
    }
  };

  const deleteCustomerPayment = async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const payment = customerPayments.find((p) => p.id === id);
      if (!payment) return { error: 'পেমেন্ট রেকর্ড পাওয়া যায়নি' };

      // 1. Try atomic PostgreSQL RPC first
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_customer_payment_transaction', {
          p_payment_id: id,
        });

        if (!rpcError && rpcData?.success) {
          setCustomerPayments((prev) => prev.filter((p) => p.id !== id));
          if (rpcData.customer_id && rpcData.new_due !== undefined) {
            setCustomers((prev) =>
              prev.map((c) => (c.id === rpcData.customer_id ? { ...c, due_amount: Number(rpcData.new_due) } : c))
            );
          }
          return { error: null };
        }
      } catch {
        // Fallback to sequential
      }

      // 2. Sequential fallback
      const { error: delError } = await supabase.from('customer_payments').delete().eq('id', id);
      if (delError) return { error: delError.message };

      const targetCustomer = customers.find((c) => c.id === payment.customer_id);
      if (targetCustomer) {
        const restoredDue = Number(targetCustomer.due_amount || 0) + Number(payment.amount || 0);
        await updateCustomer(targetCustomer.id, { due_amount: restoredDue });
      }

      setCustomerPayments((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete payment' };
    }
  };

  const recordSupplierPayment = async (paymentData: {
    supplierId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const sup = suppliers.find((s) => s.id === paymentData.supplierId);
      if (!sup) return { error: 'Supplier not found' };

      const newPayment = {
        user_id: user.id,
        supplier_id: paymentData.supplierId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes || '',
      };

      try {
        const { data } = await supabase.from('supplier_payments').insert(newPayment).select().single();
        if (data) setSupplierPayments((prev) => [data as SupplierPayment, ...prev]);
      } catch {
        const localPay: SupplierPayment = {
          id: `local-spay-${Date.now()}`,
          ...newPayment,
          created_at: new Date().toISOString(),
        };
        setSupplierPayments((prev) => [localPay, ...prev]);
      }

      // Deduct from supplier payable amount
      const updatedPayable = Math.max(0, Number(sup.payable_amount || 0) - paymentData.amount);
      await updateSupplier(sup.id, { payable_amount: updatedPayable });

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to record supplier payment' };
    }
  };

  // ==================== PART 2: Pro Payment Request Submission ====================
  // Submitting this request NEVER automatically activates Pro.
  // The request status is set to 'pending'. Manual verification is required.
  const submitPaymentRequest = async (requestData: Omit<PaymentRequest, 'id' | 'user_id' | 'status' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newReq = {
        ...requestData,
        user_id: user.id,
        status: 'pending' as const,
      };

      try {
        const { data, error } = await supabase.from('payment_requests').insert(newReq).select().single();
        if (!error && data) {
          setPaymentRequests((prev) => [data as PaymentRequest, ...prev]);
          return { error: null };
        }
      } catch {
        // local preview fallback
      }

      const localReq: PaymentRequest = {
        id: `local-req-${Date.now()}`,
        ...newReq,
        created_at: new Date().toISOString(),
      };
      setPaymentRequests((prev) => [localReq, ...prev]);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to submit payment request' };
    }
  };

  // ==================== Business Settings ====================
  const updateBusinessSettings = async (settingsData: Partial<BusinessSettings>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const merged = {
        user_id: user.id,
        ...businessSettings,
        ...settingsData,
      };

      try {
        const { data } = await supabase.from('business_settings').upsert(merged).select().single();
        if (data) setBusinessSettings(data as BusinessSettings);
      } catch {
        setBusinessSettings(merged as BusinessSettings);
      }
      return { error: null };
    } catch {
      return { error: 'Failed to update settings' };
    }
  };

  // ==================== Subscription & Pro Access Actions ====================
  const updateSubscription = async (data: Partial<UserSubscription>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const updatedObj = {
        user_id: user.id,
        ...subscription,
        ...data,
        updated_at: new Date().toISOString(),
      };

      try {
        const { data: resData, error: subErr } = await supabase
          .from('subscriptions')
          .upsert(updatedObj)
          .select()
          .single();

        if (!subErr && resData) {
          setSubscription(resData as UserSubscription);
        }
      } catch {
        // Fallback update
      }

      // Also sync to profiles table for maximum compatibility
      try {
        await supabase
          .from('profiles')
          .update({
            plan: data.plan || subscription?.plan || 'free',
            subscription_status: data.status || subscription?.status || 'active',
            subscription_expires_at: data.expires_at || subscription?.expires_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch {
        // Handled
      }

      setSubscription((prev) => ({
        user_id: user.id,
        plan: (data.plan || prev?.plan || 'free') as any,
        status: (data.status || prev?.status || 'active') as any,
        started_at: prev?.started_at || new Date().toISOString(),
        expires_at: data.expires_at !== undefined ? data.expires_at : prev?.expires_at || null,
        updated_at: new Date().toISOString(),
      }));

      await refreshProfile();
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Subscription update failed' };
    }
  };

  const activateProSubscription = async (plan: 'pro' | 'free' = 'pro', durationDays: number = 365) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      // 1. Try atomic database RPC function first
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('set_user_subscription', {
          p_plan: plan,
          p_duration_days: durationDays,
        });

        if (!rpcErr && rpcRes?.success) {
          setSubscription({
            user_id: user.id,
            plan,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: rpcRes.expires_at,
            updated_at: new Date().toISOString(),
          });
          await refreshProfile();
          return { error: null };
        }
      } catch {
        // RPC fallback to direct upsert
      }

      // 2. Direct database upsert
      const expiresAt =
        plan === 'pro'
          ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

      const newSub: UserSubscription = {
        user_id: user.id,
        plan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from('subscriptions').upsert(newSub);
      } catch {
        // Table not created yet
      }

      try {
        await supabase
          .from('profiles')
          .update({
            plan,
            subscription_status: 'active',
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch {
        // Columns fallback
      }

      setSubscription(newSub);
      await refreshProfile();
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to activate subscription' };
    }
  };

  // ==================== Comprehensive Metrics ====================
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? p.low_stock_level ?? 5));
  }, [products]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const totalSales = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);

    // COGS: Map each sale to the product's purchase price
    const productPriceMap = new Map<string, number>();
    products.forEach((p) => productPriceMap.set(p.id, Number(p.purchase_price || 0)));

    let cogs = 0;
    sales.forEach((s) => {
      if (s.product_id && productPriceMap.has(s.product_id)) {
        cogs += Number(s.quantity || 0) * (productPriceMap.get(s.product_id) || 0);
      }
    });

    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    // Cash Balance: Paid sales + Customer collections - Total Expenses - Paid purchases - Supplier payments
    const paidSales = sales
      .filter((s) => s.payment_status === 'paid')
      .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

    const paidPurchases = purchases
      .filter((p) => p.payment_status === 'paid')
      .reduce((acc, p) => acc + Number(p.total_amount || 0), 0);

    const customerCollections = customerPayments.reduce((acc, cp) => acc + Number(cp.amount || 0), 0);
    const supplierDisbursements = supplierPayments.reduce((acc, sp) => acc + Number(sp.amount || 0), 0);

    const cashBalance = paidSales + customerCollections - totalExpenses - paidPurchases - supplierDisbursements;

    // Inventory Value = Stock Quantity * Purchase Price
    const inventoryValue = products.reduce(
      (acc, p) => acc + Number(p.stock_quantity || 0) * Number(p.purchase_price || 0),
      0
    );

    // Customer Due = sum of customer dues
    const customerDue = customers.reduce((acc, c) => acc + Number(c.due_amount || 0), 0);

    // Supplier Payable = sum of supplier payables
    const supplierPayable = suppliers.reduce((acc, s) => acc + Number(s.payable_amount || 0), 0);

    return {
      totalSales,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      grossProfitMargin,
      cashBalance,
      inventoryValue,
      customerDue,
      supplierPayable,
      totalPurchases,
      totalProductsCount: products.length,
      lowStockProductsCount: lowStockProducts.length,
      grossFixedAssets: fixedAssetsSummary.totalGrossAssets,
      accumulatedDepreciation: fixedAssetsSummary.totalAccumulatedDepreciation,
      netFixedAssets: fixedAssetsSummary.totalNetBookValue,
      monthlyDepreciation: fixedAssetsSummary.totalMonthlyDepreciation,
    };
  }, [sales, expenses, purchases, products, customers, suppliers, customerPayments, supplierPayments, lowStockProducts, fixedAssetsSummary]);

  return (
    <DataContext.Provider
      value={{
        products,
        customers,
        sales,
        expenses,
        loading,
        metrics,
        lowStockProducts,
        refreshData,
        isProductsTableMissing,
        // Part 2 state
        suppliers,
        purchases,
        stockAdjustments,
        invoices,
        customerPayments,
        supplierPayments,
        paymentRequests,
        businessSettings,
        subscription,
        proAccess,
        updateSubscription,
        activateProSubscription,
        // Part 1 actions
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recalculateCustomerDue,
        recordSale,
        updateSale,
        deleteSale,
        addExpense,
        updateExpense,
        deleteExpense,
        // Recurring Expenses actions
        recurringExpenses,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        triggerRecurringExpensesSync,
        // Fixed Assets actions
        fixedAssets,
        fixedAssetsSummary,
        addFixedAsset,
        updateFixedAsset,
        deleteFixedAsset,
        // Part 2 actions
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchase,
        deletePurchase,
        addStockAdjustment,
        addInvoice,
        updateInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        recordCustomerPayment,
        deleteCustomerPayment,
        recordSupplierPayment,
        submitPaymentRequest,
        updateBusinessSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
