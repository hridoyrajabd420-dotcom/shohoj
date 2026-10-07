export type ExpenseCategory =
  | 'Rent'
  | 'Salary'
  | 'Transport'
  | 'Marketing'
  | 'Electricity'
  | 'Internet'
  | 'Utilities'
  | 'Other';

export type UserPlan = 'FREE' | 'PRO' | 'free' | 'pro';

export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'pending';

export interface UserSubscription {
  id?: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at?: string;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_type: string;
  plan?: UserPlan;
  subscription_status?: SubscriptionStatus;
  subscription_expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  user_id: string;
  product_name: string;
  name: string; // Backwards compatibility alias for product_name
  category?: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  low_stock_level: number; // Backwards compatibility alias for low_stock_threshold
  unit?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductInput {
  product_name: string;
  name?: string;
  category?: string;
  sku?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  low_stock_level?: number;
  unit?: string;
  description?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  total_purchase: number;
  due_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  total_purchase?: number;
  due_amount?: number;
}

export interface SaleItem {
  id: string;
  user_id: string;
  sale_id: string;
  product_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
  product?: Product;
}

export interface Sale {
  id: string;
  user_id: string;
  product_id: string | null;
  customer_id: string | null;
  quantity: number;
  selling_price: number;
  subtotal?: number;
  discount?: number;
  total_amount: number;
  paid_amount?: number;
  due_amount?: number;
  payment_status: 'paid' | 'due';
  sale_date: string;
  notes?: string;
  created_at?: string;
  // Joined or referenced objects
  product?: Product;
  customer?: Customer;
  sale_items?: SaleItem[];
}

export interface SaleInput {
  productId: string;
  customerId: string | null;
  quantity: number;
  sellingPrice: number;
  subtotal?: number;
  discount?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus: 'paid' | 'due';
  saleDate: string;
  notes?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  expense_date: string;
  date: string; // Compatibility alias with expense_date
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseInput {
  title?: string;
  category: ExpenseCategory | string;
  amount: number;
  expense_date?: string;
  date?: string;
  description?: string;
}

// PART 2 PRO MODELS

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  payable_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  supplier_id?: string | null;
  product_id?: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: 'paid' | 'due';
  purchase_date: string;
  notes?: string;
  created_at?: string;
  supplier?: Supplier;
  product?: Product;
}

export type StockAdjustmentReason =
  | 'damage'
  | 'loss'
  | 'audit_correction'
  | 'return'
  | 'bonus'
  | 'other';

export interface StockAdjustment {
  id: string;
  user_id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  change_amount: number;
  reason: StockAdjustmentReason;
  notes?: string;
  created_at?: string;
  product?: Product;
}

export interface InvoiceItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export type InvoiceType = 'invoice' | 'quotation';
export type InvoiceStatus = 'paid' | 'due' | 'draft' | 'sent' | 'partially_paid' | 'unpaid' | 'cancelled';

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  type: InvoiceType;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discount_type: 'fixed' | 'percentage';
  tax?: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  notes?: string;
  terms?: string;
  created_at?: string;
}

export interface CustomerPayment {
  id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  date?: string;
  payment_method: string;
  notes?: string;
  created_at?: string;
  customer?: Customer;
}

export interface SupplierPayment {
  id: string;
  user_id: string;
  supplier_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at?: string;
  supplier?: Supplier;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'bank';
export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  user_id: string;
  payment_method: PaymentMethod;
  sender_number: string;
  transaction_id: string;
  amount: number;
  payment_date: string;
  reference?: string;
  screenshot?: string;
  message?: string;
  status: PaymentRequestStatus;
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  created_at?: string;
}

export interface BusinessSettings {
  id?: string;
  user_id: string;
  logo_url?: string;
  invoice_footer?: string;
  vat_reg_no?: string;
  default_vat_rate?: number;
  currency_symbol?: string;
  payment_bkash_number?: string;
  payment_nagad_number?: string;
  payment_bank_info?: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  grossProfitMargin: number;
  cashBalance: number;
  inventoryValue: number;
  customerDue: number;
  supplierPayable: number;
  totalPurchases: number;
  totalProductsCount: number;
  lowStockProductsCount: number;
}

export type ViewTab =
  | 'dashboard'
  | 'products'
  | 'sales'
  | 'expenses'
  | 'customers'
  // Pro Tabs
  | 'financials'
  | 'inventory_pro'
  | 'payables'
  | 'invoices'
  | 'reports'
  | 'analytics'
  | 'calculators'
  | 'tools'
  | 'pro_upgrade'
  // Core Tabs
  | 'profile'
  | 'settings';

