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

export type UserType = 'student' | 'business';

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
  user_type?: UserType;
  institution_name?: string; // Optional for students
  field_of_study?: string;   // Optional for students
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
  recurring_expense_id?: string | null;
  is_recurring_auto?: boolean;
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
  recurring_expense_id?: string | null;
  is_recurring_auto?: boolean;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  id: string;
  user_id: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  frequency: RecurringFrequency;
  day_of_month?: number; // 1-31 for monthly
  day_of_week?: number; // 0-6 for weekly (0=Sun, 1=Mon, etc.)
  execution_date?: string; // Next or base execution date YYYY-MM-DD
  is_active: boolean;
  last_generated_date?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringExpenseInput {
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  frequency: RecurringFrequency;
  day_of_month?: number;
  day_of_week?: number;
  execution_date?: string;
  is_active?: boolean;
  notes?: string;
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
  subtotal?: number;
  discount?: number;
  total_amount: number;
  paid_amount?: number;
  due_amount?: number;
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

export type FixedAssetCategory =
  | 'Shop'
  | 'Land'
  | 'Vehicle'
  | 'Machinery'
  | 'Computer'
  | 'Equipment'
  | 'Furniture'
  | 'Shop Interior'
  | 'Other';

export type DepreciationMethod = 'straight_line';

export interface FixedAsset {
  id: string;
  user_id: string;
  name: string;
  category: FixedAssetCategory | string;
  purchase_date: string; // YYYY-MM-DD
  purchase_cost: number;
  useful_life: number;
  useful_life_unit: 'months' | 'years';
  salvage_value: number;
  depreciation_method: DepreciationMethod | string;
  depreciation_start_date?: string; // YYYY-MM-DD, defaults to purchase_date
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FixedAssetInput {
  name: string;
  category: FixedAssetCategory | string;
  purchase_date: string;
  purchase_cost: number;
  useful_life: number;
  useful_life_unit: 'months' | 'years';
  salvage_value: number;
  depreciation_method?: DepreciationMethod | string;
  depreciation_start_date?: string;
  notes?: string;
}

export interface CalculatedAssetMetrics {
  usefulLifeMonths: number;
  totalDepreciableAmount: number;
  monthlyDepreciation: number;
  annualDepreciation: number;
  monthsElapsed: number;
  remainingMonths: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  isFullyDepreciated: boolean;
  status: 'active' | 'fully_depreciated';
}

export interface FixedAssetsSummary {
  totalGrossAssets: number;
  totalSalvageValue: number;
  totalAccumulatedDepreciation: number;
  totalNetBookValue: number;
  totalMonthlyDepreciation: number;
  totalAnnualDepreciation: number;
  activeAssetsCount: number;
  fullyDepreciatedCount: number;
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
  // Fixed Assets additions
  grossFixedAssets?: number;
  accumulatedDepreciation?: number;
  netFixedAssets?: number;
  monthlyDepreciation?: number;
}

export type StudentSubjectTab =
  | 'student_accounting'
  | 'student_finance'
  | 'student_economics'
  | 'student_business_math'
  | 'student_cost_accounting'
  | 'student_management_accounting'
  | 'student_statistics'
  | 'student_practice'
  | 'student_saved_problems'
  | 'student_study_history';

export type ViewTab =
  | 'dashboard'
  | 'student_dashboard'
  // Student Specific Academic Tabs
  | 'student_accounting'
  | 'student_finance'
  | 'student_economics'
  | 'student_business_math'
  | 'student_cost_accounting'
  | 'student_management_accounting'
  | 'student_statistics'
  | 'student_practice'
  | 'student_saved_problems'
  | 'student_study_history'
  // Business Tabs
  | 'products'
  | 'sales'
  | 'expenses'
  | 'customers'
  | 'fixed_assets'
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

export interface StudentCalculation {
  id: string;
  userId: string;
  subject: string;
  topicTitle: string;
  formulaUsed: string;
  inputs: Record<string, any>;
  result: Record<string, any>;
  summary: string;
  notes?: string;
  timestamp: string;
}

export interface StudentProblem {
  id: string;
  userId: string;
  subject: string;
  topicTitle: string;
  question: string;
  givenData: Record<string, any>;
  solutionSteps: string[];
  finalAnswer: string;
  explanation: string;
  isFavorite?: boolean;
  savedAt: string;
}

export interface StudentStudyHistoryItem {
  id: string;
  userId: string;
  subject: string;
  topicTitle: string;
  action: 'studied_topic' | 'ran_calculation' | 'saved_problem' | 'practiced_quiz';
  description: string;
  timestamp: string;
}

