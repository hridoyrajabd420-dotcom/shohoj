import { Expense, Customer, Sale, CustomerPayment, ExpenseCategory } from '../src/types';

console.log('====================================================');
console.log('  SHOHOJ BEBSHA - STEP 5 LOGIC & CALCULATION TESTS  ');
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

// ----------------------------------------------------
// 1. EXPENSE ADDITION & VALIDATION
// ----------------------------------------------------
const today = new Date().toISOString().split('T')[0];
const testUserId = 'user-uuid-1234';

function validateExpenseAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'টাকার পরিমাণ অবশ্যই ০-এর বেশি হতে হবে' };
  }
  return { valid: true };
}

assert(validateExpenseAmount(0).valid === false, 'Expense validation rejects 0 amount');
assert(validateExpenseAmount(-500).valid === false, 'Expense validation rejects negative amount');
assert(validateExpenseAmount(1500).valid === true, 'Expense validation accepts positive amount (৳ 1,500)');

const expensesState: Expense[] = [];

function addExpense(expenseInput: {
  title?: string;
  category: ExpenseCategory;
  amount: number;
  date?: string;
  description?: string;
}): { expense?: Expense; error?: string } {
  const val = validateExpenseAmount(expenseInput.amount);
  if (!val.valid) return { error: val.error };

  const expDate = expenseInput.date || today;
  const newExp: Expense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    user_id: testUserId,
    title: expenseInput.title || expenseInput.category,
    category: expenseInput.category,
    amount: expenseInput.amount,
    expense_date: expDate,
    date: expDate,
    description: expenseInput.description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  expensesState.unshift(newExp);
  return { expense: newExp };
}

const exp1 = addExpense({
  title: 'দোকান ভাড়া',
  category: 'Rent',
  amount: 8000,
  date: today,
  description: 'চলতি মাসের দোকান ভাড়া',
});
assert(exp1.expense !== undefined && exp1.expense.amount === 8000, 'Add Expense 1 (Rent ৳ 8,000)');

const exp2 = addExpense({
  title: 'বিদ্যুৎ বিল',
  category: 'Electricity',
  amount: 1500,
  date: today,
  description: 'ডেসকো বিদ্যুৎ বিল',
});
assert(exp2.expense !== undefined && exp2.expense.amount === 1500, 'Add Expense 2 (Electricity ৳ 1,500)');

const exp3 = addExpense({
  title: 'ইন্টারনেট বিল',
  category: 'Internet',
  amount: 800,
  date: '2026-10-01',
  description: 'ব্রডব্যান্ড ইন্টারনেট',
});
assert(exp3.expense !== undefined && exp3.expense.amount === 800, 'Add Expense 3 (Internet ৳ 800)');

// ----------------------------------------------------
// 2. EXPENSE EDITING
// ----------------------------------------------------
function updateExpense(id: string, updates: Partial<Expense>): boolean {
  const index = expensesState.findIndex(e => e.id === id);
  if (index === -1) return false;
  expensesState[index] = {
    ...expensesState[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return true;
}

const editSuccess = updateExpense(exp1.expense!.id, {
  amount: 9000,
  description: 'দোকান ও সার্ভিস চার্জ ভাড়া',
});
assert(editSuccess, 'Edit Expense: update amount from ৳ 8,000 to ৳ 9,000');
assert(expensesState.find(e => e.id === exp1.expense!.id)?.amount === 9000, 'Expense amount reflects edit in state');

// ----------------------------------------------------
// 3. EXPENSE TOTALS CALCULATION
// ----------------------------------------------------
function calculateExpenseTotals(expenses: Expense[], selectedDate?: string, currentMonthPrefix?: string) {
  const todayTotal = expenses
    .filter(e => (e.expense_date || e.date) === today)
    .reduce((s, e) => s + e.amount, 0);

  const monthPrefix = currentMonthPrefix || today.slice(0, 7);
  const monthTotal = expenses
    .filter(e => (e.expense_date || e.date || '').startsWith(monthPrefix))
    .reduce((s, e) => s + e.amount, 0);

  const allTimeTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return { todayTotal, monthTotal, allTimeTotal };
}

const totalsBeforeDelete = calculateExpenseTotals(expensesState);
// exp1 = 9000 (today), exp2 = 1500 (today), exp3 = 800 (this month)
assert(totalsBeforeDelete.todayTotal === 10500, 'Verify Today Expenses Total (9000 + 1500 = ৳ 10,500)');
assert(totalsBeforeDelete.monthTotal === 11300, 'Verify Month Expenses Total (9000 + 1500 + 800 = ৳ 11,300)');
assert(totalsBeforeDelete.allTimeTotal === 11300, 'Verify All-Time Expenses Total = ৳ 11,300');

// ----------------------------------------------------
// 4. EXPENSE DELETION
// ----------------------------------------------------
function deleteExpense(id: string): boolean {
  const idx = expensesState.findIndex(e => e.id === id);
  if (idx === -1) return false;
  expensesState.splice(idx, 1);
  return true;
}

const delSuccess = deleteExpense(exp2.expense!.id);
assert(delSuccess, 'Delete Expense (Electricity bill ৳ 1,500 removed)');
const totalsAfterDelete = calculateExpenseTotals(expensesState);
assert(totalsAfterDelete.todayTotal === 9000, 'Verify Today Expenses adjusted after deletion (10500 - 1500 = ৳ 9,000)');
assert(totalsAfterDelete.monthTotal === 9800, 'Verify Month Expenses adjusted after deletion (11300 - 1500 = ৳ 9,800)');

// ----------------------------------------------------
// 5. CUSTOMER ADDITION & VALIDATION
// ----------------------------------------------------
const customersState: Customer[] = [];

function addCustomer(data: {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  due_amount?: number;
}): { customer?: Customer; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { error: 'গ্রাহকের নাম আবশ্যক' };
  }
  const newCust: Customer = {
    id: `cust-${Date.now()}`,
    user_id: testUserId,
    name: data.name.trim(),
    phone: data.phone?.trim() || '',
    email: '',
    address: data.address?.trim() || '',
    notes: data.notes?.trim() || '',
    total_purchase: 0,
    due_amount: Number(data.due_amount) || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  customersState.unshift(newCust);
  return { customer: newCust };
}

assert(addCustomer({ name: '' }).error !== undefined, 'Customer validation rejects empty name');

const cust1Res = addCustomer({
  name: 'মোঃ রফিক সাহেব',
  phone: '01711223344',
  address: 'মিরপুর ২, ঢাকা',
  notes: 'নিয়মিত খুচরা খদ্দের',
  due_amount: 0,
});
assert(cust1Res.customer !== undefined && cust1Res.customer.name === 'মোঃ রফিক সাহেব', 'Add Customer (মোঃ রফিক সাহেব)');
const testCust = cust1Res.customer!;

// ----------------------------------------------------
// 6. SALE CREATION & AUTOMATIC STOCK / DUE DEDUCTION
// ----------------------------------------------------
const salesState: Sale[] = [];

function recordSale(saleInput: {
  customerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  paidAmount?: number;
}): { sale?: Sale; error?: string } {
  const subtotal = saleInput.quantity * saleInput.unitPrice;
  const discount = saleInput.discount || 0;
  const totalAmount = Math.max(0, subtotal - discount);
  const paidAmount = saleInput.paidAmount !== undefined ? saleInput.paidAmount : totalAmount;
  const dueAmount = Math.max(0, totalAmount - paidAmount);
  const paymentStatus: 'paid' | 'due' = dueAmount <= 0 ? 'paid' : 'due';

  const newSale: Sale = {
    id: `sale-${Date.now()}`,
    user_id: testUserId,
    customer_id: saleInput.customerId,
    product_id: saleInput.productId,
    quantity: saleInput.quantity,
    selling_price: saleInput.unitPrice,
    subtotal,
    discount,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    due_amount: dueAmount,
    payment_status: paymentStatus,
    sale_date: today,
  };
  salesState.unshift(newSale);

  // Update customer balance atomically
  const cust = customersState.find(c => c.id === saleInput.customerId);
  if (cust) {
    cust.total_purchase = (cust.total_purchase || 0) + totalAmount;
    cust.due_amount = (cust.due_amount || 0) + dueAmount;
  }

  return { sale: newSale };
}

// Create sale: 10 units @ ৳ 200 = ৳ 2,000 total. Paid: ৳ 800, Due: ৳ 1,200
const sale1 = recordSale({
  customerId: testCust.id,
  productId: 'prod-001',
  quantity: 10,
  unitPrice: 200,
  paidAmount: 800,
});
assert(sale1.sale !== undefined && sale1.sale.total_amount === 2000, 'Sale recorded (Total: ৳ 2,000, Paid: ৳ 800, Due: ৳ 1,200)');
assert(testCust.due_amount === 1200, 'Customer due balance updated to ৳ 1,200');
assert(testCust.total_purchase === 2000, 'Customer total purchase updated to ৳ 2,000');

// ----------------------------------------------------
// 7. RECORD PARTIAL PAYMENT & PREVENT OVERPAYMENT
// ----------------------------------------------------
const paymentsState: CustomerPayment[] = [];

function recordCustomerPayment(paymentData: {
  customerId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}): { payment?: CustomerPayment; error?: string } {
  const cust = customersState.find(c => c.id === paymentData.customerId);
  if (!cust) return { error: 'Customer not found' };

  if (paymentData.amount <= 0) {
    return { error: 'পেমেন্টের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে' };
  }

  if (paymentData.amount > cust.due_amount) {
    return {
      error: `পেমেন্টের পরিমাণ (৳ ${paymentData.amount}) বর্তমান বকেয়া (৳ ${cust.due_amount})-এর চেয়ে বেশি হতে পারবে না`,
    };
  }

  const newDue = Math.max(0, cust.due_amount - paymentData.amount);
  cust.due_amount = newDue;

  const newPay: CustomerPayment = {
    id: `pay-${Date.now()}`,
    user_id: testUserId,
    customer_id: paymentData.customerId,
    amount: paymentData.amount,
    payment_date: today,
    date: today,
    payment_method: paymentData.paymentMethod,
    notes: paymentData.notes || '',
    created_at: new Date().toISOString(),
  };
  paymentsState.unshift(newPay);

  return { payment: newPay };
}

// Test overpayment prevention
const overpayAttempt = recordCustomerPayment({
  customerId: testCust.id,
  amount: 2000, // Due is only 1,200
  paymentMethod: 'CASH',
});
assert(overpayAttempt.error !== undefined, 'Overpayment prevention blocks payment greater than due (৳ 2,000 > ৳ 1,200)');

// Test legitimate partial payment: ৳ 500
const partPay = recordCustomerPayment({
  customerId: testCust.id,
  amount: 500,
  paymentMethod: 'BKASH',
  notes: 'বিকাশ মারফত আংশিক পরিশোধ',
});
assert(partPay.payment !== undefined && partPay.payment.amount === 500, 'Partial payment of ৳ 500 recorded');
assert(testCust.due_amount === 700, 'Remaining due balance correctly calculated (1200 - 500 = ৳ 700)');

// ----------------------------------------------------
// 8. ON-DEMAND DUE RECALCULATION & SALE EDIT / DELETE
// ----------------------------------------------------
function recalculateCustomerDue(customerId: string): number {
  const custSalesDue = salesState
    .filter(s => s.customer_id === customerId)
    .reduce((sum, s) => sum + (s.due_amount || 0), 0);

  const totalPayments = paymentsState
    .filter(p => p.customer_id === customerId)
    .reduce((sum, p) => sum + p.amount, 0);

  const calcDue = Math.max(0, custSalesDue - totalPayments);
  const cust = customersState.find(c => c.id === customerId);
  if (cust) cust.due_amount = calcDue;
  return calcDue;
}

const recalculated = recalculateCustomerDue(testCust.id);
assert(recalculated === 700, 'On-demand recalculation matches remaining due (৳ 700)');

// ----------------------------------------------------
// 9. SAFE CUSTOMER DELETION CHECKS
// ----------------------------------------------------
function safeDeleteCustomer(id: string): { success: boolean; error?: string } {
  const linkedSales = salesState.filter(s => s.customer_id === id);
  if (linkedSales.length > 0) {
    return {
      success: false,
      error: `এই গ্রাহকের সাথে ${linkedSales.length}টি বিক্রয় রেকর্ড যুক্ত রয়েছে। বিক্রয় বিদ্যমান থাকা অবস্থায় গ্রাহক মুছে ফেলা সম্ভব নয়।`,
    };
  }
  const cust = customersState.find(c => c.id === id);
  if (cust && cust.due_amount > 0) {
    return {
      success: false,
      error: `এই গ্রাহকের কাছে এখনও ৳ ${cust.due_amount} বকেয়া পাওনা রয়েছে।`,
    };
  }
  const idx = customersState.findIndex(c => c.id === id);
  if (idx !== -1) customersState.splice(idx, 1);
  return { success: true };
}

const deleteWithLinkedSales = safeDeleteCustomer(testCust.id);
assert(!deleteWithLinkedSales.success, 'Safe delete customer blocks deletion when linked sales exist');
assert(deleteWithLinkedSales.error !== undefined, 'Clear Bangladeshi error message provided for blocked deletion');

console.log('\n====================================================');
console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)  `);
console.log('====================================================');
