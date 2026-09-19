import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ProGate } from './ProGate';
import {
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Plus,
  X,
  CreditCard,
  Search,
} from 'lucide-react';

interface PayablesViewProps {
  onNavigateToUpgrade?: () => void;
}

export const PayablesView: React.FC<PayablesViewProps> = ({ onNavigateToUpgrade }) => {
  const {
    customers,
    suppliers,
    customerPayments,
    supplierPayments,
    addSupplier,
    recordCustomerPayment,
    recordSupplierPayment,
  } = useData();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'receivables' | 'payables' | 'history'>('receivables');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCustomerPayOpen, setIsCustomerPayOpen] = useState(false);
  const [isSupplierPayOpen, setIsSupplierPayOpen] = useState(false);

  // Selected entities for recording payment
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('নগদ (Cash)');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [isSavingPay, setIsSavingPay] = useState(false);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supInitialPayable, setSupInitialPayable] = useState('0');
  const [isSavingSup, setIsSavingSup] = useState(false);

  // Aggregated totals
  const totals = useMemo(() => {
    const totalReceivables = customers.reduce((acc, c) => acc + Number(c.due_amount || 0), 0);
    const totalPayables = suppliers.reduce((acc, s) => acc + Number(s.payable_amount || 0), 0);
    const netPosition = totalReceivables - totalPayables;
    return { totalReceivables, totalPayables, netPosition };
  }, [customers, suppliers]);

  // Handle Add Supplier
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      showToast('সাপ্লায়ারের নাম আবশ্যক', 'error');
      return;
    }

    setIsSavingSup(true);
    const payableNum = parseFloat(supInitialPayable) || 0;
    const res = await addSupplier({
      name: supName.trim(),
      phone: supPhone.trim(),
      company: supCompany.trim(),
      address: supAddress.trim(),
      payable_amount: payableNum,
    });
    setIsSavingSup(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('সাপ্লায়ার সফলভাবে সংরক্ষিত হয়েছে', 'success');
      setIsAddSupplierOpen(false);
      setSupName('');
      setSupPhone('');
      setSupCompany('');
      setSupAddress('');
      setSupInitialPayable('0');
    }
  };

  // Open Customer Payment Modal
  const openCollectModal = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    setPayAmount(cust ? String(cust.due_amount || '') : '');
    setIsCustomerPayOpen(true);
  };

  // Submit Customer Payment Collection
  const handleCollectCustomerDue = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('সঠিক টাকার পরিমাণ লিখুন', 'error');
      return;
    }

    setIsSavingPay(true);
    const res = await recordCustomerPayment({
      customerId: selectedCustomerId,
      amount: amt,
      paymentDate: payDate,
      paymentMethod: payMethod,
      notes: payNotes,
    });
    setIsSavingPay(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('বাকি আদায় সফলভাবে রেকর্ড হয়েছে ও গ্রাহকের বকেয়া হ্রাস পেয়েছে', 'success');
      setIsCustomerPayOpen(false);
      setPayAmount('');
      setPayNotes('');
    }
  };

  // Open Supplier Payment Modal
  const openDisburseModal = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    setPayAmount(sup ? String(sup.payable_amount || '') : '');
    setIsSupplierPayOpen(true);
  };

  // Submit Supplier Payment Disbursement
  const handleDisburseSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('সঠিক টাকার পরিমাণ লিখুন', 'error');
      return;
    }

    setIsSavingPay(true);
    const res = await recordSupplierPayment({
      supplierId: selectedSupplierId,
      amount: amt,
      paymentDate: payDate,
      paymentMethod: payMethod,
      notes: payNotes,
    });
    setIsSavingPay(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('সাপ্লায়ার পাওনা পরিশোধ সফলভাবে রেকর্ড হয়েছে', 'success');
      setIsSupplierPayOpen(false);
      setPayAmount('');
      setPayNotes('');
    }
  };

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => c.due_amount > 0)
      .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));
  }, [customers, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.company && s.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  return (
    <ProGate
      featureTitle="বকেয়া ও পাওনাদার খাতা (Receivables & Payables)"
      featureDescription="গ্রাহক থেকে বকেয়া আদায়, সাপ্লায়ারদের পাওনা পরিশোধ ট্র্যাকিং এবং নেট ক্যাশ ব্যালেন্স নিরীক্ষণ করতে Shohoj Bebsha Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              বকেয়া পাওনা ও দেনা ব্যবস্থাপনা
            </h2>
            <p className="text-xs text-slate-500">
              গ্রাহক বকেয়া (Receivables) এবং সাপ্লায়ার পাওনা (Payables) পূর্ণাঙ্গ হিসাব
            </p>
          </div>

          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সাপ্লায়ার যোগ</span>
          </button>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>মোট বকেয়া পাওনা (Receivables)</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">৳{totals.totalReceivables.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">গ্রাহকদের কাছে মোট পাওনা টাকা</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>সাপ্লায়ারদের বকেয়া দেনা (Payables)</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-600">৳{totals.totalPayables.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">পণ্য ক্রয়ের পাওনাদারদের বকেয়া বিল</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>নেট অবস্থান (Net Balance)</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className={`text-2xl font-black ${totals.netPosition >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              ৳{totals.netPosition.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {totals.netPosition >= 0 ? 'উদ্বৃত্ত পাওনা পজিশন' : 'অতিরিক্ত দেনা পজিশন'}
            </p>
          </div>
        </div>

        {/* Tab Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'receivables'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              গ্রাহকের বকেয়া পাওনা ({filteredCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('payables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'payables'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              সাপ্লায়ারের দেনা ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              আদায় ও পরিশোধ হিস্ট্রি
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* TAB 1: Customer Receivables */}
        {activeTab === 'receivables' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">গ্রাহকদের কাছে বর্তমান বকেয়া তালিকা</h3>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                কোনো গ্রাহকের বকেয়া নেই অথবা খোঁজা নাম পাওয়া যায়নি।
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">গ্রাহকের নাম</th>
                    <th className="py-2.5">মোবাইল</th>
                    <th className="py-2.5 text-right">মোট ক্রয় (৳)</th>
                    <th className="py-2.5 text-right">বর্তমান বকেয়া (৳)</th>
                    <th className="py-2.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-3 text-slate-600 font-mono">{cust.phone || '-'}</td>
                      <td className="py-3 text-right">৳{cust.total_purchase.toLocaleString()}</td>
                      <td className="py-3 text-right font-black text-rose-600">৳{cust.due_amount.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => openCollectModal(cust.id)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[11px] cursor-pointer"
                        >
                          বাকি আদায়
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: Supplier Payables */}
        {activeTab === 'payables' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">সাপ্লায়ার ডিরেক্টরি ও পাওনা হিসাব</h3>
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                কোনো সাপ্লায়ার এখনো যোগ করা হয়নি। "নতুন সাপ্লায়ার যোগ" বাটনে ক্লিক করুন।
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">সাপ্লায়ার ও কোম্পানি</th>
                    <th className="py-2.5">ফোন নম্বর</th>
                    <th className="py-2.5">ঠিকানা</th>
                    <th className="py-2.5 text-right">বকেয়া পাওনা (৳)</th>
                    <th className="py-2.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSuppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{sup.name}</p>
                        <p className="text-[10px] text-slate-500">{sup.company || 'ব্যক্তিগত'}</p>
                      </td>
                      <td className="py-3 text-slate-600 font-mono">{sup.phone || '-'}</td>
                      <td className="py-3 text-slate-500">{sup.address || '-'}</td>
                      <td className="py-3 text-right font-black text-rose-600">৳{sup.payable_amount.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => openDisburseModal(sup.id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-[11px] cursor-pointer"
                        >
                          পাওনা পরিশোধ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: History */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Collections */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                গ্রাহক থেকে বাকি আদায়ের ইতিহাস
              </h4>
              {customerPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">কোনো আদায়ের রেকর্ড নেই</p>
              ) : (
                <div className="space-y-2">
                  {customerPayments.map((cp) => {
                    const cust = customers.find((c) => c.id === cp.customer_id);
                    return (
                      <div key={cp.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{cust?.name || 'গ্রাহক'}</p>
                          <p className="text-[10px] text-slate-500">{cp.payment_date} • {cp.payment_method}</p>
                        </div>
                        <p className="font-black text-emerald-600 text-sm">৳{cp.amount.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Supplier Disbursements */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                সাপ্লায়ারদের পাওনা পরিশোধের ইতিহাস
              </h4>
              {supplierPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">কোনো পরিশোধের রেকর্ড নেই</p>
              ) : (
                <div className="space-y-2">
                  {supplierPayments.map((sp) => {
                    const sup = suppliers.find((s) => s.id === sp.supplier_id);
                    return (
                      <div key={sp.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{sup?.name || 'সাপ্লায়ার'}</p>
                          <p className="text-[10px] text-slate-500">{sp.payment_date} • {sp.payment_method}</p>
                        </div>
                        <p className="font-black text-rose-600 text-sm">৳{sp.amount.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" /> নতুন সাপ্লায়ার যোগ করুন
              </h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সাপ্লায়ার / ডিস্ট্রিবিউটরের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রহিম অ্যান্ড সন্স"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">কোম্পানি / ব্র্যান্ড</label>
                <input
                  type="text"
                  placeholder="যেমন: ইউনিলিভার / স্কয়ার"
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা / গুদাম</label>
                <input
                  type="text"
                  placeholder="বাজার বা এলাকা"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্বের বকেয়া দেনা (যদি থাকে ৳)</label>
                <input
                  type="number"
                  min="0"
                  value={supInitialPayable}
                  onChange={(e) => setSupInitialPayable(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingSup}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingSup ? 'সংরক্ষণ হচ্ছে...' : 'সাপ্লায়ার সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Customer Due Collection */}
      {isCustomerPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" /> গ্রাহকের বাকি আদায়
              </h3>
              <button onClick={() => setIsCustomerPayOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectCustomerDue} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  আদায়ের পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মেথড</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="নগদ (Cash)">নগদ (Cash)</option>
                  <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                  <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                  <option value="ব্যাংক (Bank)">ব্যাংক (Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মন্তব্য</label>
                <input
                  type="text"
                  placeholder="রিসিট নম্বর বা নোট..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerPayOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingPay}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingPay ? 'জমা হচ্ছে...' : 'আদায় সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Supplier Payment Disbursement */}
      {isSupplierPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" /> সাপ্লায়ার পাওনা পরিশোধ
              </h3>
              <button onClick={() => setIsSupplierPayOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisburseSupplierPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পরিশোধের পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মেথড</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="নগদ (Cash)">নগদ (Cash)</option>
                  <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                  <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                  <option value="ব্যাংক চেক (Bank/Cheque)">ব্যাংক চেক (Bank/Cheque)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ভাউচার / রেফারেন্স</label>
                <input
                  type="text"
                  placeholder="ভাউচার নম্বর..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierPayOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingPay}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingPay ? 'পরিশোধ হচ্ছে...' : 'পেমেন্ট সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProGate>
  );
};
