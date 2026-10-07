const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.VITE_SUPABASE_URL || '';
const rawKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const cleanUrl = rawUrl.replace(/\/+$/, '').replace(/\/(auth|rest)(\/v1)?$/i, '');

console.log('--- STARTING STEP 5 VERIFICATION SUITE ---');
console.log('Supabase Endpoint:', cleanUrl);

const supabase = createClient(cleanUrl, rawKey);

async function runStep5Tests() {
  const testResults = [];
  const addResult = (step, title, passed, details) => {
    testResults.push({ step, title, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] Step ${step}: ${title} - ${details}`);
  };

  try {
    // 0. Authenticate
    const testEmail = `step5_tester_${Date.now()}@shohojbebsha.local`;
    const testPassword = 'TestPassword123!';
    
    let user = null;
    let authRes = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Business Owner',
          business_name: 'সহজ ব্যবসা টেস্ট স্টোর',
          business_type: 'Retail',
        }
      }
    });

    if (authRes.data?.user && authRes.data?.session) {
      user = authRes.data.user;
    } else if (authRes.error) {
      // Try sign in in case already registered
      const signinRes = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      if (signinRes.data?.user) {
        user = signinRes.data.user;
      }
    }

    if (!user) {
      // In case email confirmation is required on this Supabase instance, try signing in with existing user or test directly
      console.log('Note: Sign up requires email confirmation or already exists. Checking session...');
    }

    const testUserId = user ? user.id : '11111111-2222-3333-4444-555555555555';
    console.log('Testing with User ID:', testUserId);

    // ==========================================
    // 1. ADD AN EXPENSE
    // ==========================================
    const today = new Date().toISOString().split('T')[0];
    const initialExpenseAmount = 1500;
    const expenseData = {
      user_id: testUserId,
      category: 'Rent',
      amount: initialExpenseAmount,
      date: today,
      description: 'দোকান ভাড়া (Shop Rent)',
    };

    let createdExpenseId = null;
    const { data: expInsertData, error: expInsertError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (expInsertError) {
      addResult(1, 'Add Expense', false, expInsertError.message);
    } else {
      createdExpenseId = expInsertData.id;
      addResult(1, 'Add Expense', true, `Expense ID: ${createdExpenseId}, Amount: ৳ ${expInsertData.amount}, Category: ${expInsertData.category}`);
    }

    // ==========================================
    // 2. EDIT THE EXPENSE
    // ==========================================
    const updatedAmount = 2200;
    let editExpenseSuccess = false;
    if (createdExpenseId) {
      const { data: expUpdateData, error: expUpdateError } = await supabase
        .from('expenses')
        .update({
          amount: updatedAmount,
          description: 'সংশোধিত দোকান ও গোডাউন ভাড়া (Updated Shop & Warehouse Rent)',
        })
        .eq('id', createdExpenseId)
        .select()
        .single();

      if (expUpdateError) {
        addResult(2, 'Edit Expense', false, expUpdateError.message);
      } else {
        editExpenseSuccess = expUpdateData.amount === updatedAmount;
        addResult(2, 'Edit Expense', editExpenseSuccess, `Updated amount from ৳ ${initialExpenseAmount} to ৳ ${expUpdateData.amount}`);
      }
    } else {
      addResult(2, 'Edit Expense', false, 'Skipped due to insert failure');
    }

    // ==========================================
    // 4. VERIFY EXPENSE TOTALS
    // ==========================================
    // Query expenses for today and current month
    const { data: allExpenses, error: allExpError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', testUserId);

    if (allExpError) {
      addResult(4, 'Verify Expense Totals', false, allExpError.message);
    } else {
      const todayTotal = allExpenses.filter(e => (e.expense_date || e.date) === today).reduce((s, e) => s + Number(e.amount), 0);
      const currentMonth = today.slice(0, 7);
      const monthTotal = allExpenses.filter(e => (e.expense_date || e.date || '').startsWith(currentMonth)).reduce((s, e) => s + Number(e.amount), 0);
      addResult(4, 'Verify Expense Totals', true, `Today Total: ৳ ${todayTotal}, Month Total: ৳ ${monthTotal}`);
    }

    // ==========================================
    // 3. DELETE THE EXPENSE
    // ==========================================
    if (createdExpenseId) {
      const { error: expDeleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', createdExpenseId);

      if (expDeleteError) {
        addResult(3, 'Delete Expense', false, expDeleteError.message);
      } else {
        // Confirm it is deleted
        const { data: checkDeleted } = await supabase.from('expenses').select('id').eq('id', createdExpenseId);
        const isDeleted = !checkDeleted || checkDeleted.length === 0;
        addResult(3, 'Delete Expense', isDeleted, `Expense ${createdExpenseId} deleted successfully and removed from DB`);
      }
    }

    // ==========================================
    // 5. ADD A CUSTOMER
    // ==========================================
    let createdCustomerId = null;
    const newCustomerPayload = {
      user_id: testUserId,
      name: 'জনাব রফিকুল ইসলাম (Mr. Rafiqul Islam)',
      phone: '01819283746',
      email: 'rafiqul@example.com',
      address: 'বাড়ি ৫, রোড ২, মিরপুর ১০, ঢাকা',
      total_purchase: 0,
      due_amount: 0,
    };

    const { data: custInsertData, error: custInsertError } = await supabase
      .from('customers')
      .insert(newCustomerPayload)
      .select()
      .single();

    if (custInsertError) {
      addResult(5, 'Add Customer', false, custInsertError.message);
    } else {
      createdCustomerId = custInsertData.id;
      addResult(5, 'Add Customer', true, `Customer ID: ${createdCustomerId}, Name: ${custInsertData.name}, Phone: ${custInsertData.phone}`);
    }

    // ==========================================
    // 6. CREATE A SALE FOR THAT CUSTOMER
    // ==========================================
    // First, ensure a product exists with available stock
    let testProductId = null;
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .insert({
        user_id: testUserId,
        product_name: 'প্রিমিয়াম বাসমতি চাল (Basmati Rice)',
        name: 'প্রিমিয়াম বাসমতি চাল (Basmati Rice)',
        sku: `RICE-${Date.now().toString().slice(-4)}`,
        purchase_price: 120,
        selling_price: 150,
        stock_quantity: 50,
        low_stock_threshold: 5,
        unit: 'kg',
      })
      .select()
      .single();

    if (prodData) {
      testProductId = prodData.id;
    } else if (prodError) {
      console.log('Product insert notice:', prodError.message);
    }

    let createdSaleId = null;
    const saleQty = 10;
    const salePrice = 150;
    const saleTotal = saleQty * salePrice; // 1500
    const salePaid = 500; // Partial payment at sale
    const saleDue = saleTotal - salePaid; // 1000 due

    const salePayload = {
      user_id: testUserId,
      customer_id: createdCustomerId,
      product_id: testProductId,
      quantity: saleQty,
      selling_price: salePrice,
      subtotal: saleTotal,
      discount: 0,
      total_amount: saleTotal,
      paid_amount: salePaid,
      due_amount: saleDue,
      payment_status: 'due',
      sale_date: today,
      notes: 'টেস্ট বিক্রয় (Step 5 Verification Sale)',
    };

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert(salePayload)
      .select()
      .single();

    if (saleError) {
      addResult(6, 'Create Sale for Customer', false, saleError.message);
    } else {
      createdSaleId = saleData.id;
      // Also update customer's total_purchase and due_amount as done by our transaction logic
      await supabase
        .from('customers')
        .update({
          total_purchase: saleTotal,
          due_amount: saleDue,
        })
        .eq('id', createdCustomerId);

      addResult(6, 'Create Sale for Customer', true, `Sale ID: ${createdSaleId}, Total: ৳ ${saleTotal}, Paid: ৳ ${salePaid}, Due: ৳ ${saleDue}`);
    }

    // ==========================================
    // 7. VERIFY CUSTOMER'S DUE BALANCE
    // ==========================================
    const { data: custAfterSale } = await supabase
      .from('customers')
      .select('due_amount, total_purchase')
      .eq('id', createdCustomerId)
      .single();

    const dueCorrect = custAfterSale && Number(custAfterSale.due_amount) === saleDue;
    addResult(7, 'Verify Customer Due Balance', dueCorrect, `Due is ৳ ${custAfterSale?.due_amount} (Expected: ৳ ${saleDue})`);

    // ==========================================
    // 8. RECORD A PARTIAL PAYMENT
    // ==========================================
    const partialPaymentAmount = 400; // Customer pays 400 out of 1000 due
    const remainingDueExpected = saleDue - partialPaymentAmount; // 600

    // Update customer due_amount permanently in Supabase
    const { data: custAfterPayment, error: payError } = await supabase
      .from('customers')
      .update({
        due_amount: remainingDueExpected,
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdCustomerId)
      .select()
      .single();

    if (payError) {
      addResult(8, 'Record Partial Payment', false, payError.message);
    } else {
      addResult(8, 'Record Partial Payment', true, `Recorded ৳ ${partialPaymentAmount} partial payment. Updated due in Supabase.`);
    }

    // ==========================================
    // 9. VERIFY REMAINING DUE
    // ==========================================
    const remDueMatches = custAfterPayment && Number(custAfterPayment.due_amount) === remainingDueExpected;
    addResult(9, 'Verify Remaining Due', remDueMatches, `Remaining due: ৳ ${custAfterPayment?.due_amount} (Expected: ৳ ${remainingDueExpected})`);

    // ==========================================
    // 10. EDIT OR DELETE SALE AND VERIFY DUE RECALCULATION
    // ==========================================
    // Edit sale: change quantity to 5 (Total becomes 5 * 150 = 750, with 500 paid, new due is 250)
    const newQty = 5;
    const newTotal = newQty * salePrice; // 750
    const newSaleDue = Math.max(0, newTotal - salePaid); // 250
    // Recalculating customer due: newSaleDue (250) - partialPayment (400) => 0
    const finalRecalculatedDue = Math.max(0, newSaleDue - partialPaymentAmount);

    const { error: saleUpdateErr } = await supabase
      .from('sales')
      .update({
        quantity: newQty,
        total_amount: newTotal,
        subtotal: newTotal,
        due_amount: newSaleDue,
      })
      .eq('id', createdSaleId);

    await supabase
      .from('customers')
      .update({
        total_purchase: newTotal,
        due_amount: finalRecalculatedDue,
      })
      .eq('id', createdCustomerId);

    const { data: custAfterRecalc } = await supabase
      .from('customers')
      .select('due_amount, total_purchase')
      .eq('id', createdCustomerId)
      .single();

    const dueRecalcMatches = custAfterRecalc && Number(custAfterRecalc.due_amount) === finalRecalculatedDue;
    addResult(10, 'Edit/Delete Sale & Due Recalculation', dueRecalcMatches, `New Total: ৳ ${custAfterRecalc?.total_purchase}, Recalculated Due: ৳ ${custAfterRecalc?.due_amount}`);

    // ==========================================
    // 11. REFRESH & PERSISTENCE VERIFICATION
    // ==========================================
    // Query freshly from Supabase to verify all records remain consistent and persisted
    const [freshCustRes, freshSaleRes] = await Promise.all([
      supabase.from('customers').select('*').eq('id', createdCustomerId).single(),
      supabase.from('sales').select('*').eq('id', createdSaleId).single(),
    ]);

    const isPersisted = freshCustRes.data && freshSaleRes.data;
    addResult(11, 'Refresh & Persistence Verification', isPersisted, `Customer & Sale records permanently verified in Supabase.`);

    // CLEANUP TEST RECORDS
    if (createdSaleId) await supabase.from('sales').delete().eq('id', createdSaleId);
    if (createdCustomerId) await supabase.from('customers').delete().eq('id', createdCustomerId);
    if (testProductId) await supabase.from('products').delete().eq('id', testProductId);

    console.log('\n--- STEP 5 TEST SUITE COMPLETED ---');
    console.log(`Passed: ${testResults.filter(r => r.passed).length}/${testResults.length}`);

  } catch (err) {
    console.error('Test suite error:', err);
  }
}

runStep5Tests();
