import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ProGate } from './ProGate';
import { StockAdjustmentReason } from '../../types';
import {
  Package,
  Plus,
  SlidersHorizontal,
  History,
  TrendingUp,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  X,
  Truck,
} from 'lucide-react';

interface InventoryProViewProps {
  onNavigateToUpgrade?: () => void;
}

export const InventoryProView: React.FC<InventoryProViewProps> = ({ onNavigateToUpgrade }) => {
  const {
    products,
    suppliers,
    purchases,
    stockAdjustments,
    sales,
    addPurchase,
    addStockAdjustment,
    lowStockProducts,
  } = useData();

  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'valuation' | 'purchases' | 'adjustments' | 'profitability' | 'movement'>('valuation');

  // Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchaseProductId, setPurchaseProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('1');
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState<'paid' | 'due'>('paid');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  // Stock Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjReason, setAdjReason] = useState<StockAdjustmentReason>('audit_correction');
  const [adjType, setAdjType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjAmount, setAdjAmount] = useState('1');
  const [adjNotes, setAdjNotes] = useState('');
  const [isSavingAdj, setIsSavingAdj] = useState(false);

  // Auto set unit price when product selected in purchase modal
  const handleSelectPurchaseProduct = (prodId: string) => {
    setPurchaseProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setPurchaseUnitPrice(String(prod.purchase_price || 0));
    }
  };

  // Submit Purchase
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseProductId) {
      showToast('পণ্য নির্বাচন করুন', 'error');
      return;
    }

    const qty = parseInt(purchaseQty, 10);
    const unitPrice = parseFloat(purchaseUnitPrice);

    if (isNaN(qty) || qty <= 0) {
      showToast('সঠিক পরিমাণ লিখুন', 'error');
      return;
    }
    if (isNaN(unitPrice) || unitPrice < 0) {
      showToast('সঠিক ক্রয়মূল্য লিখুন', 'error');
      return;
    }

    setIsSavingPurchase(true);
    const res = await addPurchase({
      productId: purchaseProductId,
      supplierId: purchaseSupplierId || null,
      quantity: qty,
      unitPrice,
      paymentStatus: purchaseStatus,
      purchaseDate,
      notes: purchaseNotes,
    });
    setIsSavingPurchase(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('ক্রয় রেকর্ড সফলভাবে যোগ হয়েছে ও স্টক বৃদ্ধি পেয়েছে', 'success');
      setIsPurchaseModalOpen(false);
      setPurchaseNotes('');
    }
  };

  // Submit Stock Adjustment
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) {
      showToast('পণ্য নির্বাচন করুন', 'error');
      return;
    }

    const prod = products.find((p) => p.id === adjProductId);
    if (!prod) return;

    const amt = parseInt(adjAmount, 10);
    if (isNaN(amt) || amt < 0) {
      showToast('সঠিক পরিমাণ লিখুন', 'error');
      return;
    }

    let newStock = prod.stock_quantity;
    let changeAmount = 0;

    if (adjType === 'add') {
      newStock += amt;
      changeAmount = amt;
    } else if (adjType === 'subtract') {
      newStock = Math.max(0, newStock - amt);
      changeAmount = -amt;
    } else {
      // 'set' exact
      changeAmount = amt - newStock;
      newStock = amt;
    }

    setIsSavingAdj(true);
    const res = await addStockAdjustment({
      productId: adjProductId,
      newStock,
      changeAmount,
      reason: adjReason,
      notes: adjNotes,
    });
    setIsSavingAdj(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('স্টক সফলভাবে সমন্বয় করা হয়েছে', 'success');
      setIsAdjModalOpen(false);
      setAdjNotes('');
    }
  };

  // Calculations for Stock Valuation
  const valuation = useMemo(() => {
    let totalCost = 0;
    let totalRetail = 0;
    let totalItems = 0;

    products.forEach((p) => {
      const q = Number(p.stock_quantity || 0);
      totalItems += q;
      totalCost += q * Number(p.purchase_price || 0);
      totalRetail += q * Number(p.selling_price || 0);
    });

    const potentialProfit = totalRetail - totalCost;
    const potentialMargin = totalRetail > 0 ? (potentialProfit / totalRetail) * 100 : 0;

    return { totalCost, totalRetail, totalItems, potentialProfit, potentialMargin };
  }, [products]);

  // Product Profitability Analysis
  const productProfitability = useMemo(() => {
    const map = new Map<string, { unitsSold: number; totalRevenue: number; totalCost: number }>();

    sales.forEach((s) => {
      if (!s.product_id) return;
      const current = map.get(s.product_id) || { unitsSold: 0, totalRevenue: 0, totalCost: 0 };
      const qty = Number(s.quantity || 0);
      const rev = Number(s.total_amount || 0);
      const prod = products.find((p) => p.id === s.product_id);
      const cost = qty * Number(prod?.purchase_price || 0);

      map.set(s.product_id, {
        unitsSold: current.unitsSold + qty,
        totalRevenue: current.totalRevenue + rev,
        totalCost: current.totalCost + cost,
      });
    });

    return products.map((p) => {
      const perf = map.get(p.id) || { unitsSold: 0, totalRevenue: 0, totalCost: 0 };
      const profit = perf.totalRevenue - perf.totalCost;
      const margin = perf.totalRevenue > 0 ? (profit / perf.totalRevenue) * 100 : 0;

      return {
        product: p,
        ...perf,
        profit,
        margin,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [sales, products]);

  // Inventory Movement Log (Combined chronological list)
  const movementLog = useMemo(() => {
    const logs: {
      id: string;
      date: string;
      productName: string;
      type: 'IN' | 'OUT' | 'ADJ';
      qty: number;
      label: string;
      note?: string;
    }[] = [];

    // Sales: OUT
    sales.forEach((s) => {
      const prod = products.find((p) => p.id === s.product_id);
      logs.push({
        id: `sale-${s.id}`,
        date: s.sale_date,
        productName: prod?.name || 'অজানা পণ্য',
        type: 'OUT',
        qty: s.quantity,
        label: `বিক্রয় (Sale #${s.id.slice(0, 5)})`,
      });
    });

    // Purchases: IN
    purchases.forEach((p) => {
      const prod = products.find((pr) => pr.id === p.product_id);
      logs.push({
        id: `purch-${p.id}`,
        date: p.purchase_date,
        productName: prod?.name || 'অজানা পণ্য',
        type: 'IN',
        qty: p.quantity,
        label: `ক্রয় (Purchase #${p.id.slice(0, 5)})`,
        note: p.notes,
      });
    });

    // Adjustments
    stockAdjustments.forEach((adj) => {
      const prod = products.find((pr) => pr.id === adj.product_id);
      logs.push({
        id: `adj-${adj.id}`,
        date: adj.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        productName: prod?.name || 'অজানা পণ্য',
        type: 'ADJ',
        qty: adj.change_amount,
        label: `এডজাস্টমেন্ট (${adj.reason})`,
        note: adj.notes,
      });
    });

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, purchases, stockAdjustments, products]);

  return (
    <ProGate
      featureTitle="অ্যাডভান্সড ইনভেন্টরি ও স্টক ম্যানেজমেন্ট (Inventory Pro)"
      featureDescription="ক্রয় ব্যবস্থাপনা, স্টক এডজাস্টমেন্ট, ইনভেন্টরি ভ্যালুয়েশন, মুভমেন্ট হিস্ট্রি ও পণ্যভিত্তিক মুনাফা বিশ্লেষণ পেতে Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
    >
      <div className="space-y-6">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              ইনভেন্টরি প্রো ও স্টক মূল্যায়ন
            </h2>
            <p className="text-xs text-slate-500">
              ক্রয় ট্র্যাকিং, স্টক অ্যাডজাস্টমেন্ট ও রিয়েল-টাইম সম্পদ মূল্যায়ন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্রয় (Purchase)</span>
            </button>

            <button
              onClick={() => setIsAdjModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>স্টক এডজাস্ট করুন</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'valuation', label: 'স্টক ভ্যালুয়েশন', icon: TrendingUp },
            { id: 'purchases', label: 'ক্রয় হিস্ট্রি', icon: Truck, count: purchases.length },
            { id: 'adjustments', label: 'স্টক এডজাস্টমেন্টস', icon: SlidersHorizontal, count: stockAdjustments.length },
            { id: 'profitability', label: 'পণ্যভিত্তিক মুনাফা', icon: Package },
            { id: 'movement', label: 'ইনভেন্টরি মুভমেন্ট লগ', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Valuation */}
        {activeSubTab === 'valuation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">ইনভেন্টরি ক্রয়মূল্য (Cost Asset)</span>
                <p className="text-2xl font-black text-slate-900 mt-1">৳{valuation.totalCost.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-1">বর্তমান মোট পণ্যের ক্রয়মূল্য</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">সম্ভাব্য বিক্রয়মূল্য (Retail Value)</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">৳{valuation.totalRetail.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-1">পূর্ণ স্টক বিক্রয়ের সম্ভাব্য রেভিনিউ</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">প্রত্যাশিত মুনাফা (Unrealized Profit)</span>
                <p className="text-2xl font-black text-blue-600 mt-1">৳{valuation.potentialProfit.toLocaleString()}</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  মার্জিন: <span className="font-bold">{valuation.potentialMargin.toFixed(1)}%</span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">মোট ফিজিক্যাল স্টক</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{valuation.totalItems} পিস</p>
                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                  {lowStockProducts.length}টি পণ্যের স্টক কম
                </p>
              </div>
            </div>

            {/* Low stock alert banner */}
            {lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">লো-স্টক সতর্কতা ({lowStockProducts.length}টি পণ্য):</p>
                  <p className="text-amber-800 mt-0.5">
                    {lowStockProducts.map((p) => `${p.name} (${p.stock_quantity} পিস)`).join(', ')} - স্টক শেষ হওয়ার পূর্বেই সাপ্লায়ারের কাছে রিকুইজিশন পাঠান।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Purchases List */}
        {activeSubTab === 'purchases' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">সাম্প্রতিক ক্রয়ের ইতিহাস (Purchase Orders)</h3>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> ক্রয় এন্ট্রি
              </button>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                এখনো কোনো ক্রয় রেকর্ড করা হয়নি। "নতুন ক্রয়" বাটনে ক্লিক করে এন্ট্রি করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">তারিখ</th>
                      <th className="py-2.5">পণ্য</th>
                      <th className="py-2.5">সাপ্লায়ার</th>
                      <th className="py-2.5 text-right">পরিমাণ</th>
                      <th className="py-2.5 text-right">দর (৳)</th>
                      <th className="py-2.5 text-right">মোট (৳)</th>
                      <th className="py-2.5 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {purchases.map((p) => {
                      const prod = products.find((pr) => pr.id === p.product_id);
                      const sup = suppliers.find((s) => s.id === p.supplier_id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 text-slate-500 font-mono">{p.purchase_date}</td>
                          <td className="py-3 font-semibold text-slate-900">{prod?.name || 'অজানা পণ্য'}</td>
                          <td className="py-3 text-slate-600">{sup?.name || 'সরাসরি'}</td>
                          <td className="py-3 text-right font-bold text-slate-800">{p.quantity}</td>
                          <td className="py-3 text-right">৳{p.unit_price}</td>
                          <td className="py-3 text-right font-bold text-slate-900">৳{p.total_amount.toLocaleString()}</td>
                          <td className="py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {p.payment_status === 'paid' ? 'পরিশোধিত' : 'বকেয়া'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Adjustments List */}
        {activeSubTab === 'adjustments' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">স্টক সমন্বয় রেকর্ড (Stock Adjustments)</h3>
              <button
                onClick={() => setIsAdjModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> সমন্বয় করুন
              </button>
            </div>

            {stockAdjustments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                এখনো কোনো স্টক এডজাস্টমেন্ট করা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">তারিখ</th>
                      <th className="py-2.5">পণ্য</th>
                      <th className="py-2.5 text-right">আগের স্টক</th>
                      <th className="py-2.5 text-right">পরিবর্তন</th>
                      <th className="py-2.5 text-right">বর্তমান স্টক</th>
                      <th className="py-2.5">কারণ (Reason)</th>
                      <th className="py-2.5">নোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stockAdjustments.map((adj) => {
                      const prod = products.find((pr) => pr.id === adj.product_id);
                      return (
                        <tr key={adj.id} className="hover:bg-slate-50">
                          <td className="py-3 text-slate-500 font-mono">
                            {adj.created_at?.slice(0, 10) || 'আজ'}
                          </td>
                          <td className="py-3 font-semibold text-slate-900">{prod?.name || 'অজানা পণ্য'}</td>
                          <td className="py-3 text-right">{adj.previous_stock}</td>
                          <td className={`py-3 text-right font-bold ${adj.change_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {adj.change_amount > 0 ? `+${adj.change_amount}` : adj.change_amount}
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900">{adj.new_stock}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {adj.reason === 'damage' && 'নষ্ট / ড্যামেজ'}
                              {adj.reason === 'loss' && 'হারিয়ে গেছে'}
                              {adj.reason === 'audit_correction' && 'গণনা সমন্বয়'}
                              {adj.reason === 'return' && 'গ্রাহক ফেরত'}
                              {adj.reason === 'bonus' && 'সাপ্লায়ার বোনাস'}
                              {adj.reason === 'other' && 'অন্যান্য'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 italic max-w-xs truncate">{adj.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Product Profitability */}
        {activeSubTab === 'profitability' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">পণ্যভিত্তিক বিক্রয় ও মুনাফা বিশ্লেষণ</h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">পণ্য ও SKU</th>
                  <th className="py-2.5 text-right">বিক্রীত একক</th>
                  <th className="py-2.5 text-right">মোট বিক্রয় (৳)</th>
                  <th className="py-2.5 text-right">মোট ক্রয়ব্যয় (৳)</th>
                  <th className="py-2.5 text-right">গ্রস লাভ (৳)</th>
                  <th className="py-2.5 text-right">মার্জিন (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {productProfitability.map(({ product, unitsSold, totalRevenue, totalCost, profit, margin }) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="py-3">
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{product.sku || 'No SKU'}</p>
                    </td>
                    <td className="py-3 text-right font-medium">{unitsSold} পিস</td>
                    <td className="py-3 text-right font-semibold text-slate-900">৳{totalRevenue.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-500">৳{totalCost.toLocaleString()}</td>
                    <td className={`py-3 text-right font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ৳{profit.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">{margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: Movement Log */}
        {activeSubTab === 'movement' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">ইনভেন্টরি মুভমেন্ট ট্র্যাকার (Stock Audit Log)</h3>
            <div className="space-y-2">
              {movementLog.slice(0, 30).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        log.type === 'IN'
                          ? 'bg-emerald-100 text-emerald-700'
                          : log.type === 'OUT'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {log.type === 'IN' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{log.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        {log.label} • {log.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm ${
                        log.type === 'IN' ? 'text-emerald-600' : log.type === 'OUT' ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {log.type === 'IN' ? `+${log.qty}` : log.type === 'OUT' ? `-${log.qty}` : `${log.qty}`}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">পিস</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: New Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" /> নতুন ক্রয় রেকর্ড (Purchase)
              </h3>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পণ্য নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={purchaseProductId}
                  onChange={(e) => handleSelectPurchaseProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- পণ্য সিলেক্ট করুন --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (বর্তমান স্টক: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সাপ্লায়ার (ঐচ্ছিক)
                </label>
                <select
                  value={purchaseSupplierId}
                  onChange={(e) => setPurchaseSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- সরাসরি কেনা / নামহীন --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company || 'ব্যক্তি'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পরিমাণ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    একক ক্রয়মূল্য (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={purchaseUnitPrice}
                    onChange={(e) => setPurchaseUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট স্ট্যাটাস</label>
                  <select
                    value={purchaseStatus}
                    onChange={(e) => setPurchaseStatus(e.target.value as 'paid' | 'due')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="paid">নগদে পরিশোধিত (Paid)</option>
                    <option value="due">বকেয়া / বাকি (Due)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / ইনভয়েস নং</label>
                <input
                  type="text"
                  placeholder="যেমন: চালান নং #১২৩৪"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingPurchase}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingPurchase ? 'সংরক্ষণ হচ্ছে...' : 'ক্রয় সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-800" /> স্টক সমন্বয় (Stock Adjustment)
              </h3>
              <button
                onClick={() => setIsAdjModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পণ্য নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- পণ্য সিলেক্ট করুন --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (বর্তমান স্টক: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সমন্বয়ের ধরন</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as 'add' | 'subtract' | 'set')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="add">যোগ করুন (+ বৃদ্ধি)</option>
                    <option value="subtract">বাদ দিন (- ঘাটতি/নষ্ট)</option>
                    <option value="set">সরাসরি নতুন স্টক নির্ধারণ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পরিমাণ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">কারণ (Reason)</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as StockAdjustmentReason)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="audit_correction">ভৌত গণনা ও হিসাবের অমিল (Audit Correction)</option>
                  <option value="damage">পণ্য নষ্ট / মেয়াদোত্তীর্ণ (Damaged)</option>
                  <option value="loss">হারিয়ে যাওয়া বা চুরি (Lost / Theft)</option>
                  <option value="return">গ্রাহক ফেরত দিয়েছে (Customer Return)</option>
                  <option value="bonus">সাপ্লায়ার বোনাস / ফ্রি স্যাম্পল (Bonus)</option>
                  <option value="other">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মন্তব্য / বিবরণ</label>
                <input
                  type="text"
                  placeholder="এডজাস্টমেন্টের সংক্ষিপ্ত বিবরণ..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdj}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingAdj ? 'সমন্বয় হচ্ছে...' : 'স্টক আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProGate>
  );
};
