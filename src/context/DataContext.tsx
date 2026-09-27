import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import {
  Product,
  Customer,
  Sale,
  Expense,
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
} from '../types';

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

  // Part 2 Pro State
  suppliers: Supplier[];
  purchases: Purchase[];
  stockAdjustments: StockAdjustment[];
  invoices: Invoice[];
  customerPayments: CustomerPayment[];
  supplierPayments: SupplierPayment[];
  paymentRequests: PaymentRequest[];
  businessSettings: BusinessSettings | null;

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ error: string | null }>;
  deleteProduct: (id: string) => Promise<{ error: string | null }>;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ data?: Customer; error: string | null }>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<{ error: string | null }>;
  deleteCustomer: (id: string) => Promise<{ error: string | null }>;

  // Sale actions
  recordSale: (saleData: {
    productId: string;
    customerId: string | null;
    quantity: number;
    sellingPrice: number;
    paymentStatus: 'paid' | 'due';
    saleDate: string;
  }) => Promise<{ error: string | null }>;
  updateSale: (
    id: string,
    saleData: {
      productId: string;
      customerId: string | null;
      quantity: number;
      sellingPrice: number;
      paymentStatus: 'paid' | 'due';
      saleDate: string;
    }
  ) => Promise<{ error: string | null }>;
  deleteSale: (id: string) => Promise<{ error: string | null }>;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<{ error: string | null }>;
  deleteExpense: (id: string) => Promise<{ error: string | null }>;

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
  const { user, isConfigured } = useAuth();

  // Part 1 State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Part 2 State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

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
        supabase.from('sales').select('*').order('sale_date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);

      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
      if (custsRes.data) setCustomers(custsRes.data as Customer[]);
      if (salesRes.data) setSales(salesRes.data as Sale[]);
      if (expsRes.data) setExpenses(expsRes.data as Expense[]);

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
  const addProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newProduct = {
        ...productData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setProducts((prev) => [data as Product, ...prev]);
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
      const updated = {
        ...productData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setProducts((prev) => prev.map((p) => (p.id === id ? (data as Product) : p)));
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

  // ==================== Customer Operations ====================
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newCustomer = {
        ...customerData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setCustomers((prev) => [data as Customer, ...prev]);
        return { data: data as Customer, error: null };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add customer' };
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const updated = {
        ...customerData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('customers')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setCustomers((prev) => prev.map((c) => (c.id === id ? (data as Customer) : c)));
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
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) return { error: error.message };

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete customer' };
    }
  };

  // ==================== Sale Operations ====================
  const recordSale = async (saleData: {
    productId: string;
    customerId: string | null;
    quantity: number;
    sellingPrice: number;
    paymentStatus: 'paid' | 'due';
    saleDate: string;
  }) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const product = products.find((p) => p.id === saleData.productId);
      if (!product) return { error: 'Product not found' };

      if (product.stock_quantity < saleData.quantity) {
        return { error: `পর্যাপ্ত স্টক নেই! বর্তমান স্টক: ${product.stock_quantity}` };
      }

      const totalAmount = saleData.quantity * saleData.sellingPrice;

      // 1. Insert Sale record
      const newSale = {
        user_id: user.id,
        product_id: saleData.productId,
        customer_id: saleData.customerId,
        quantity: saleData.quantity,
        selling_price: saleData.sellingPrice,
        total_amount: totalAmount,
        payment_status: saleData.paymentStatus,
        sale_date: saleData.saleDate,
      };

      const { data: saleResult, error: saleError } = await supabase
        .from('sales')
        .insert(newSale)
        .select()
        .single();

      if (saleError) return { error: saleError.message };

      // 2. Decrement Product Stock
      const newStock = Math.max(0, product.stock_quantity - saleData.quantity);
      await updateProduct(product.id, { stock_quantity: newStock });

      // 3. Update Customer records if customer attached
      if (saleData.customerId) {
        const customer = customers.find((c) => c.id === saleData.customerId);
        if (customer) {
          const updatedTotalPurchase = Number(customer.total_purchase || 0) + totalAmount;
          const updatedDue =
            saleData.paymentStatus === 'due'
              ? Number(customer.due_amount || 0) + totalAmount
              : Number(customer.due_amount || 0);

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
            quantity: saleData.quantity,
            unit_price: saleData.sellingPrice,
            total_price: totalAmount,
          });
        } catch {
          // Safe fallback
        }
        setSales((prev) => [saleResult as Sale, ...prev]);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to record sale' };
    }
  };

  const updateSale = async (
    id: string,
    saleData: {
      productId: string;
      customerId: string | null;
      quantity: number;
      sellingPrice: number;
      paymentStatus: 'paid' | 'due';
      saleDate: string;
    }
  ) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const oldSale = sales.find((s) => s.id === id);
      if (!oldSale) return { error: 'Sale record not found' };

      const oldProduct = products.find((p) => p.id === oldSale.product_id);
      const newProduct = products.find((p) => p.id === saleData.productId);
      if (!newProduct) return { error: 'Product not found' };

      // Validate stock availability
      if (oldSale.product_id === saleData.productId) {
        const availableStock = (oldProduct?.stock_quantity || 0) + oldSale.quantity;
        if (availableStock < saleData.quantity) {
          return { error: `পর্যাপ্ত স্টক নেই! বর্তমান উপলব্ধ স্টক: ${availableStock}` };
        }
      } else {
        if (newProduct.stock_quantity < saleData.quantity) {
          return { error: `পর্যাপ্ত স্টক নেই! ${newProduct.name}-এর বর্তমান স্টক: ${newProduct.stock_quantity}` };
        }
      }

      const totalAmount = saleData.quantity * saleData.sellingPrice;

      const updatedFields = {
        product_id: saleData.productId,
        customer_id: saleData.customerId,
        quantity: saleData.quantity,
        selling_price: saleData.sellingPrice,
        total_amount: totalAmount,
        payment_status: saleData.paymentStatus,
        sale_date: saleData.saleDate,
      };

      const { data, error } = await supabase
        .from('sales')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();

      if (error) return { error: error.message };

      // 1. Adjust inventory stock
      if (oldSale.product_id === saleData.productId && oldProduct) {
        const stockDiff = saleData.quantity - oldSale.quantity;
        const newStock = Math.max(0, oldProduct.stock_quantity - stockDiff);
        await updateProduct(oldProduct.id, { stock_quantity: newStock });
      } else {
        if (oldProduct) {
          await updateProduct(oldProduct.id, { stock_quantity: oldProduct.stock_quantity + oldSale.quantity });
        }
        await updateProduct(newProduct.id, { stock_quantity: Math.max(0, newProduct.stock_quantity - saleData.quantity) });
      }

      // 2. Adjust customer purchase and dues
      if (oldSale.customer_id) {
        const oldCust = customers.find((c) => c.id === oldSale.customer_id);
        if (oldCust) {
          const revertedTotal = Math.max(0, Number(oldCust.total_purchase || 0) - Number(oldSale.total_amount || 0));
          const revertedDue = oldSale.payment_status === 'due'
            ? Math.max(0, Number(oldCust.due_amount || 0) - Number(oldSale.total_amount || 0))
            : Number(oldCust.due_amount || 0);

          if (saleData.customerId !== oldSale.customer_id) {
            await updateCustomer(oldCust.id, { total_purchase: revertedTotal, due_amount: revertedDue });
          }
        }
      }

      if (saleData.customerId) {
        const targetCust = customers.find((c) => c.id === saleData.customerId);
        if (targetCust) {
          const isSameCust = saleData.customerId === oldSale.customer_id;
          const baseTotal = isSameCust
            ? Math.max(0, Number(targetCust.total_purchase || 0) - Number(oldSale.total_amount || 0))
            : Number(targetCust.total_purchase || 0);

          const baseDue = isSameCust && oldSale.payment_status === 'due'
            ? Math.max(0, Number(targetCust.due_amount || 0) - Number(oldSale.total_amount || 0))
            : Number(targetCust.due_amount || 0);

          const newTotalPurchase = baseTotal + totalAmount;
          const newDue = saleData.paymentStatus === 'due' ? baseDue + totalAmount : baseDue;

          await updateCustomer(targetCust.id, { total_purchase: newTotalPurchase, due_amount: newDue });
        }
      }

      if (data) {
        setSales((prev) => prev.map((s) => (s.id === id ? (data as Sale) : s)));
      }

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

      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) return { error: error.message };

      // Restore product inventory!
      if (sale && sale.product_id) {
        const prod = products.find((p) => p.id === sale.product_id);
        if (prod) {
          await updateProduct(prod.id, { stock_quantity: prod.stock_quantity + sale.quantity });
        }
      }

      // Restore customer due and total_purchase!
      if (sale && sale.customer_id) {
        const cust = customers.find((c) => c.id === sale.customer_id);
        if (cust) {
          const newTotalPurchase = Math.max(0, Number(cust.total_purchase || 0) - Number(sale.total_amount || 0));
          const newDue = sale.payment_status === 'due'
            ? Math.max(0, Number(cust.due_amount || 0) - Number(sale.total_amount || 0))
            : Number(cust.due_amount || 0);

          await updateCustomer(cust.id, {
            total_purchase: newTotalPurchase,
            due_amount: newDue,
          });
        }
      }

      setSales((prev) => prev.filter((s) => s.id !== id));
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to delete sale' };
    }
  };

  // ==================== Expense Operations ====================
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const newExpense = {
        ...expenseData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(newExpense)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setExpenses((prev) => [data as Expense, ...prev]);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to add expense' };
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? (data as Expense) : e)));
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

  // ==================== PART 2: Due & Payable Payments ====================
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
      if (!cust) return { error: 'Customer not found' };

      const newPayment = {
        user_id: user.id,
        customer_id: paymentData.customerId,
        amount: paymentData.amount,
        payment_date: paymentData.paymentDate,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes || '',
      };

      try {
        const { data } = await supabase.from('customer_payments').insert(newPayment).select().single();
        if (data) setCustomerPayments((prev) => [data as CustomerPayment, ...prev]);
      } catch {
        const localPay: CustomerPayment = {
          id: `local-cpay-${Date.now()}`,
          ...newPayment,
          created_at: new Date().toISOString(),
        };
        setCustomerPayments((prev) => [localPay, ...prev]);
      }

      // Deduct from customer due amount
      const updatedDue = Math.max(0, Number(cust.due_amount || 0) - paymentData.amount);
      await updateCustomer(cust.id, { due_amount: updatedDue });

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to record customer payment' };
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

  // ==================== Comprehensive Metrics ====================
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock_quantity <= p.low_stock_level);
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
    };
  }, [sales, expenses, purchases, products, customers, suppliers, customerPayments, supplierPayments, lowStockProducts]);

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
        // Part 2 state
        suppliers,
        purchases,
        stockAdjustments,
        invoices,
        customerPayments,
        supplierPayments,
        paymentRequests,
        businessSettings,
        // Part 1 actions
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordSale,
        updateSale,
        deleteSale,
        addExpense,
        updateExpense,
        deleteExpense,
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
