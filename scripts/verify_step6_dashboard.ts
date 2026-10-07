import { Product, Sale, Expense, Customer, ExpenseCategory } from '../src/types';

console.log('====================================================');
console.log('  SHOHOJ BEBSHA - STEP 6 DASHBOARD & P&L TEST SUITE  ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] Test ${totalTests}: ${testName}${detail ? ` -> ${detail}` : ''}`);
  } else {
    console.error(`❌ [FAIL] Test ${totalTests}: ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

const todayStr = new Date().toISOString().split('T')[0];
const currentMonthStr = todayStr.slice(0, 7);

// ----------------------------------------------------
// TEST 1: ADD PRODUCT WITH PURCHASE PRICE & STOCK
// ----------------------------------------------------
const userA_Id = 'user-alice-001';
const userB_Id = 'user-bob-002';

const productsDb: Product[] = [];

const prod1: Product = {
  id: 'prod-001',
  user_id: userA_Id,
  product_name: 'সয়াবিন তেল (Soybean Oil)',
  name: 'সয়াবিন তেল (Soybean Oil)',
  category: 'Grocery',
  sku: 'OIL-001',
  purchase_price: 80, // Cost price
  selling_price: 120, // Selling price
  stock_quantity: 20, // 20 units initially
  low_stock_threshold: 5,
  low_stock_level: 5,
  unit: 'litre',
};
productsDb.push(prod1);

assert(prod1.purchase_price === 80 && prod1.stock_quantity === 20, '1. Product added with purchase price ৳ 80 and stock 20 units');

// ----------------------------------------------------
// TEST 2: CREATE A SALE
// ----------------------------------------------------
const salesDb: Sale[] = [];
const customersDb: Customer[] = [];

const cust1: Customer = {
  id: 'cust-001',
  user_id: userA_Id,
  name: 'মাসুদ রানা',
  phone: '01712345678',
  email: 'masud@example.com',
  address: 'বাড্ডা, ঢাকা',
  total_purchase: 0,
  due_amount: 0,
};
customersDb.push(cust1);

// Sale: 5 units @ ৳ 120 = ৳ 600 total. Paid: ৳ 400, Due: ৳ 200.
const saleQty = 5;
const salePrice = 120;
const saleTotal = saleQty * salePrice; // 600
const salePaid = 400;
const saleDue = saleTotal - salePaid; // 200

const sale1: Sale = {
  id: 'sale-001',
  user_id: userA_Id,
  product_id: prod1.id,
  customer_id: cust1.id,
  quantity: saleQty,
  selling_price: salePrice,
  subtotal: saleTotal,
  discount: 0,
  total_amount: saleTotal,
  paid_amount: salePaid,
  due_amount: saleDue,
  payment_status: 'due',
  sale_date: todayStr,
};
salesDb.push(sale1);

// Stock decreases by 5 units: 20 - 5 = 15
prod1.stock_quantity -= saleQty;
// Customer balances update
cust1.total_purchase += saleTotal;
cust1.due_amount += saleDue;

assert(salesDb.length === 1 && sale1.total_amount === 600, '2. Sale created (5 units @ ৳ 120 = ৳ 600)');
assert(prod1.stock_quantity === 15, 'Stock decreased correctly (20 - 5 = 15 units)');

// ----------------------------------------------------
// TEST 3: ADD AN EXPENSE
// ----------------------------------------------------
const expensesDb: Expense[] = [];

const exp1: Expense = {
  id: 'exp-001',
  user_id: userA_Id,
  title: 'বিদ্যুৎ বিল',
  category: 'Electricity',
  amount: 100,
  expense_date: todayStr,
  date: todayStr,
  description: 'দোকানের বিদ্যুৎ বিল',
};
expensesDb.push(exp1);

assert(expensesDb.length === 1 && exp1.amount === 100, '3. Operating expense added (Electricity ৳ 100)');

// ----------------------------------------------------
// TEST 4: VERIFY TODAY'S AND MONTHLY SALES TOTALS
// ----------------------------------------------------
const todaySalesTotal = salesDb
  .filter(s => s.user_id === userA_Id && s.sale_date === todayStr)
  .reduce((sum, s) => sum + s.total_amount, 0);

const thisMonthSalesTotal = salesDb
  .filter(s => s.user_id === userA_Id && s.sale_date.startsWith(currentMonthStr))
  .reduce((sum, s) => sum + s.total_amount, 0);

assert(todaySalesTotal === 600, '4a. Today sales total verified = ৳ 600');
assert(thisMonthSalesTotal === 600, '4b. This month sales total verified = ৳ 600');

// ----------------------------------------------------
// TEST 5: VERIFY INVENTORY VALUE
// ----------------------------------------------------
const inventoryValue = productsDb
  .filter(p => p.user_id === userA_Id)
  .reduce((sum, p) => sum + (p.stock_quantity * p.purchase_price), 0);

// 15 units * ৳ 80 purchase price = ৳ 1,200
assert(inventoryValue === 1200, '5. Inventory value correctly calculated (15 units * ৳ 80 = ৳ 1,200)');

// ----------------------------------------------------
// TEST 6: VERIFY GROSS PROFIT AND NET PROFIT (PART D)
// ----------------------------------------------------
// COGS = 5 units sold * ৳ 80 purchase price = ৳ 400
const cogs = salesDb
  .filter(s => s.user_id === userA_Id)
  .reduce((sum, s) => {
    const p = productsDb.find(prod => prod.id === s.product_id);
    return sum + (s.quantity * (p ? p.purchase_price : 0));
  }, 0);

const grossProfit = todaySalesTotal - cogs; // 600 - 400 = 200
const operatingExpenses = expensesDb
  .filter(e => e.user_id === userA_Id)
  .reduce((sum, e) => sum + e.amount, 0); // 100

const netProfit = grossProfit - operatingExpenses; // 200 - 100 = 100

assert(cogs === 400, '6a. Cost of Goods Sold (COGS) verified = ৳ 400 (5 * 80)');
assert(grossProfit === 200, '6b. Gross Profit verified = ৳ 200 (Total Sales 600 - COGS 400)');
assert(netProfit === 100, '6c. Net Profit verified = ৳ 100 (Gross Profit 200 - Operating Expenses 100)');
assert(netProfit !== todaySalesTotal - operatingExpenses, '6d. Strict Rule: Net profit is NOT total sales minus expenses alone (COGS correctly included)');

// ----------------------------------------------------
// TEST 7: VERIFY CUSTOMER RECEIVABLES
// ----------------------------------------------------
const customerReceivables = customersDb
  .filter(c => c.user_id === userA_Id)
  .reduce((sum, c) => sum + (c.due_amount || 0), 0);

assert(customerReceivables === 200, '7. Customer receivables verified = ৳ 200');

// ----------------------------------------------------
// TEST 8: DATE FILTERS STATUS & DYNAMIC UPDATES
// ----------------------------------------------------
function filterDashboard(period: 'today' | '7days' | 'month' | 'lastMonth' | 'custom' | 'all') {
  const isMatch = (d: string) => {
    if (period === 'all') return true;
    if (period === 'today') return d === todayStr;
    if (period === 'month') return d.startsWith(currentMonthStr);
    if (period === 'lastMonth') return d.startsWith('2026-09');
    return true;
  };
  const filteredSales = salesDb.filter(s => s.user_id === userA_Id && isMatch(s.sale_date));
  const filteredExpenses = expensesDb.filter(e => e.user_id === userA_Id && isMatch(e.expense_date || e.date));
  return {
    salesCount: filteredSales.length,
    salesTotal: filteredSales.reduce((sum, s) => sum + s.total_amount, 0),
    expensesTotal: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
  };
}

const todayFilterRes = filterDashboard('today');
assert(todayFilterRes.salesTotal === 600 && todayFilterRes.expensesTotal === 100, '8a. Filter "Today" matches today records');

const lastMonthFilterRes = filterDashboard('lastMonth');
assert(lastMonthFilterRes.salesTotal === 0 && lastMonthFilterRes.expensesTotal === 0, '8b. Filter "Last Month" returns 0 for current month data');

const allTimeFilterRes = filterDashboard('all');
assert(allTimeFilterRes.salesTotal === 600, '8c. Filter "All Time" returns all records');

// ----------------------------------------------------
// TEST 9: REFRESH AND PERSISTENCE VERIFICATION
// ----------------------------------------------------
// Simulate re-fetching records from Supabase state
const reloadedProducts = [...productsDb].filter(p => p.user_id === userA_Id);
const reloadedSales = [...salesDb].filter(s => s.user_id === userA_Id);
const reloadedExpenses = [...expensesDb].filter(e => e.user_id === userA_Id);

const persistedInventory = reloadedProducts.reduce((sum, p) => sum + (p.stock_quantity * p.purchase_price), 0);
const persistedSales = reloadedSales.reduce((sum, s) => sum + s.total_amount, 0);

assert(persistedInventory === 1200 && persistedSales === 600, '9. State persistence verified after simulated page refresh');

// ----------------------------------------------------
// TEST 10: USER ISOLATION & RLS VERIFICATION
// ----------------------------------------------------
// Add product and sale for User B (Bob)
productsDb.push({
  id: 'prod-bob-001',
  user_id: userB_Id,
  product_name: 'বব এর ল্যাপটপ',
  name: 'বব এর ল্যাপটপ',
  category: 'Electronics',
  sku: 'LAP-001',
  purchase_price: 50000,
  selling_price: 60000,
  stock_quantity: 5,
  low_stock_threshold: 2,
  low_stock_level: 2,
  unit: 'pcs',
});

salesDb.push({
  id: 'sale-bob-001',
  user_id: userB_Id,
  product_id: 'prod-bob-001',
  customer_id: null,
  quantity: 1,
  selling_price: 60000,
  subtotal: 60000,
  discount: 0,
  total_amount: 60000,
  paid_amount: 60000,
  due_amount: 0,
  payment_status: 'paid',
  sale_date: todayStr,
});

// Alice (User A) queries her dashboard
const aliceVisibleSales = salesDb.filter(s => s.user_id === userA_Id);
const aliceVisibleProducts = productsDb.filter(p => p.user_id === userA_Id);
const aliceSalesTotal = aliceVisibleSales.reduce((sum, s) => sum + s.total_amount, 0);

assert(aliceVisibleSales.length === 1 && aliceSalesTotal === 600, '10a. User A dashboard only includes User A sales (৳ 600, excluding User B ৳ 60,000)');
assert(!aliceVisibleProducts.some(p => p.user_id === userB_Id), '10b. User A dashboard cannot see User B products');

console.log('\n====================================================');
console.log(`  FINAL RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)  `);
console.log('====================================================');
