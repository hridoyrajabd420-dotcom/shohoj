import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { Sale } from '../../types';
import {
  ShoppingCart,
  User,
  Calendar,
  Check,
  AlertCircle,
  Plus,
  Percent,
  CreditCard,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
  saleToEdit?: Sale | null;
}

export const SaleFormModal: React.FC<SaleFormModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
  saleToEdit,
}) => {
  const { products, customers, recordSale, updateSale, addCustomer } = useData();
  const { showToast } = useToast();

  const [productId, setProductId] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Quick inline add customer
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected product reference
  const selectedProduct = products.find((p) => p.id === productId);

  // Available stock calculation considering edit mode
  const availableStock = useMemo(() => {
    if (!selectedProduct) return 0;
    if (saleToEdit && saleToEdit.product_id === productId) {
      return (selectedProduct.stock_quantity || 0) + (saleToEdit.quantity || 0);
    }
    return selectedProduct.stock_quantity || 0;
  }, [selectedProduct, saleToEdit, productId]);

  // Numeric calculated values
  const qty = Number(quantity) || 0;
  const price = Number(sellingPrice) || 0;
  const subtotal = Math.round(qty * price * 100) / 100;
  const disc = Number(discount) || 0;
  const totalAmount = Math.max(0, Math.round((subtotal - disc) * 100) / 100);

  // Paid amount and Due amount
  const paid = paidAmount === '' ? totalAmount : Math.min(totalAmount, Math.max(0, Number(paidAmount)));
  const dueAmount = Math.max(0, Math.round((totalAmount - paid) * 100) / 100);
  const paymentStatus: 'paid' | 'due' = dueAmount <= 0 ? 'paid' : 'due';

  const isStockExceeded = qty > availableStock;

  useEffect(() => {
    if (isOpen) {
      if (saleToEdit) {
        setProductId(saleToEdit.product_id || '');
        setCustomerId(saleToEdit.customer_id || '');
        setQuantity(saleToEdit.quantity);
        setSellingPrice(saleToEdit.selling_price);
        setDiscount(saleToEdit.discount || 0);
        setPaidAmount(saleToEdit.paid_amount !== undefined ? saleToEdit.paid_amount : (saleToEdit.payment_status === 'paid' ? saleToEdit.total_amount : 0));
        setSaleDate(saleToEdit.sale_date);
        setNotes(saleToEdit.notes || '');
      } else {
        const defaultProd = preselectedProductId
          ? products.find((p) => p.id === preselectedProductId)
          : products.find((p) => p.stock_quantity > 0) || products[0];

        if (defaultProd) {
          setProductId(defaultProd.id);
          setSellingPrice(defaultProd.selling_price);
        } else {
          setProductId('');
          setSellingPrice('');
        }

        setCustomerId('');
        setQuantity(1);
        setDiscount(0);
        setPaidAmount('');
        setSaleDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }
      setIsAddingCustomer(false);
      setErrorMsg(null);
    }
  }, [isOpen, preselectedProductId, saleToEdit, products]);

  // Update selling price and reset paid amount when product changes
  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      setSellingPrice(prod.selling_price);
      if (paidAmount === '' || !saleToEdit) {
        setPaidAmount('');
      }
    }
  };

  const handleFullPayment = () => {
    setPaidAmount(totalAmount);
  };

  const handleFullDue = () => {
    setPaidAmount(0);
  };

  const handleCreateCustomerInline = async () => {
    if (!newCustName.trim()) {
      showToast('গ্রাহকের নাম দিন (Customer name is required)', 'error');
      return;
    }
    const { data, error } = await addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: '',
      address: newCustAddress.trim(),
      total_purchase: 0,
      due_amount: 0,
    });

    if (error) {
      showToast(error, 'error');
    } else if (data) {
      setCustomerId(data.id);
      setIsAddingCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      showToast('নতুন গ্রাহক সফলভাবে যুক্ত হয়েছে', 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!productId) {
      setErrorMsg('অনুগ্রহ করে একটি পণ্য নির্বাচন করুন (Select a product)');
      return;
    }

    if (!selectedProduct) {
      setErrorMsg('পণ্য পাওয়া যায়নি (Product not found)');
      return;
    }

    if (qty <= 0) {
      setErrorMsg('বিক্রয় পরিমাণ কমপক্ষে ১ বা তার বেশি হতে হবে (Quantity must be at least 1)');
      return;
    }

    if (qty > availableStock) {
      setErrorMsg(`পর্যাপ্ত স্টক নেই! এই পণ্যের বর্তমান উপলব্ধ মজুদ মাত্র ${availableStock}টি।`);
      return;
    }

    if (price < 0) {
      setErrorMsg('বিক্রয়মূল্য ০ বা তার বেশি হতে হবে (Selling price cannot be negative)');
      return;
    }

    if (disc < 0 || disc > subtotal) {
      setErrorMsg('ছাড়ের পরিমাণ সাবটোটালের চেয়ে বেশি বা ঋণাত্মক হতে পারে না (Invalid discount)');
      return;
    }

    setLoading(true);

    const salePayload = {
      productId,
      customerId: customerId || null,
      quantity: qty,
      sellingPrice: price,
      subtotal,
      discount: disc,
      totalAmount,
      paidAmount: paid,
      dueAmount,
      paymentStatus,
      saleDate,
      notes: notes.trim() || undefined,
    };

    let res: { error: string | null };

    if (saleToEdit) {
      res = await updateSale(saleToEdit.id, salePayload);
    } else {
      res = await recordSale(salePayload);
    }

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      showToast(
        saleToEdit
          ? 'বিক্রয় রেকর্ড ও স্টক সফলভাবে আপডেট করা হয়েছে!'
          : 'বিক্রয় সফলভাবে সম্পন্ন হয়েছে! স্টক হালনাগাদ করা হয়েছে।',
        'success'
      );
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={saleToEdit ? 'বিক্রয় রেকর্ড এডিট করুন (Edit Sale)' : 'নতুন বিক্রয় রেকর্ড করুন (Record New Sale)'}
      subtitle="পণ্য বিক্রি করলে স্বয়ংক্রিয়ভাবে স্টক হ্রাস ও গ্রাহকের হিসাব হালনাগাদ হবে"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Product Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            পণ্য নির্বাচন করুন (Select Product) *
          </label>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="" disabled>
              -- পণ্য বেছে নিন --
            </option>
            {products.map((p) => {
              const isSelected = p.id === productId;
              const effectiveStock = (saleToEdit && saleToEdit.product_id === p.id)
                ? (p.stock_quantity || 0) + (saleToEdit.quantity || 0)
                : p.stock_quantity;
              const isOutOfStock = effectiveStock <= 0;

              return (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={isOutOfStock && !isSelected}
                >
                  {p.product_name || p.name} {p.sku ? `(SKU: ${p.sku})` : ''} — স্টক: {effectiveStock} {p.unit || 'টি'} — {formatCurrency(p.selling_price)} {isOutOfStock ? '[স্টক শেষ]' : ''}
                </option>
              );
            })}
          </select>

          {selectedProduct && (
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500">
                বর্তমান উপলব্ধ স্টক:{' '}
                <strong className={availableStock <= 5 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                  {availableStock} {selectedProduct.unit || 'টি'}
                </strong>
                {saleToEdit && saleToEdit.product_id === productId && (
                  <span className="text-slate-400 ml-1">
                    (মজুদ {selectedProduct.stock_quantity} + পূর্বের বিক্রয় {saleToEdit.quantity})
                  </span>
                )}
              </span>
              <span className="text-slate-500">
                নিয়মিত দর: <strong>{formatCurrency(selectedProduct.selling_price)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Customer Selector with inline quick add */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              গ্রাহক / কাস্টমার (Customer)
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCustomer(!isAddingCustomer)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingCustomer ? 'তালিকা থেকে বাছুন' : 'নতুন গ্রাহক যোগ করুন'}</span>
            </button>
          </div>

          {isAddingCustomer ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 block">নতুন গ্রাহকের তথ্য</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="গ্রাহকের নাম *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="tel"
                  placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <input
                type="text"
                placeholder="ঠিকানা (ঐচ্ছিক)"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCustomerInline}
                  className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  গ্রাহক সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">সরাসরি নগদ ক্রেতা (Cash Customer / Walk-in)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.due_amount > 0 ? `[বকেয়া: ${formatCurrency(c.due_amount)}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quantity & Unit Selling Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পরিমাণ (Quantity) *
            </label>
            <input
              type="number"
              min="1"
              max={availableStock > 0 ? availableStock : 1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 font-bold ${
                isStockExceeded
                  ? 'border-rose-300 focus:ring-rose-500 text-rose-700 bg-rose-50/50'
                  : 'border-slate-200 focus:ring-emerald-500 text-slate-900 focus:bg-white'
              }`}
            />
            {isStockExceeded && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>মজুদের চেয়ে বেশি! উপলব্ধ: {availableStock}টি</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              একক বিক্রয়মূল্য (Unit Price ৳) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Subtotal, Discount & Total Amount Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সাবটোটাল (Subtotal ৳)
            </label>
            <div className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
              {formatCurrency(subtotal)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ছাড় / ডিসকাউন্ট (Discount ৳)
            </label>
            <div className="relative">
              <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                min="0"
                max={subtotal}
                step="any"
                value={discount}
                onChange={(e) => setDiscount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Grand Total Highlight Card */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-emerald-800 font-bold block">মোট প্রদেয় মূল্য (Total Amount)</span>
            <span className="text-[11px] text-emerald-600">
              হিসাব: {qty} × {price} {disc > 0 ? `- ৳${disc} ছাড়` : ''}
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-900 tracking-tight">
            {formatCurrency(totalAmount)}
          </div>
        </div>

        {/* Paid Amount and Due Amount Calculation */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>পরিশোধিত টাকা (Paid Amount ৳)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFullPayment}
                className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
              >
                সম্পূর্ণ পরিশোধ
              </button>
              <button
                type="button"
                onClick={handleFullDue}
                className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors cursor-pointer"
              >
                সম্পূর্ণ বাকি
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                max={totalAmount}
                step="any"
                value={paidAmount === '' ? totalAmount : paidAmount}
                onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">বকেয়া (Due)</span>
                <span className={`text-sm font-black ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrency(dueAmount)}
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                dueAmount <= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {dueAmount <= 0 ? 'পরিশোধিত (Paid)' : 'বাকি (Due)'}
              </span>
            </div>
          </div>

          {dueAmount > 0 && !customerId && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>পরামর্শ: বাকি রাখার ক্ষেত্রে ওপরের অপশন থেকে গ্রাহক নির্বাচন করুন।</span>
            </p>
          )}
        </div>

        {/* Sale Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিক্রয়ের তারিখ (Sale Date)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              নোট / মন্তব্য (Notes - ঐচ্ছিক)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="যেমন: রসিদ নং বা বিশেষ মন্তব্য"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading || !productId || isStockExceeded || qty <= 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {saleToEdit
                    ? 'পরিবর্তন সংরক্ষণ করুন (Save Changes)'
                    : 'বিক্রয় সম্পন্ন করুন (Confirm Sale)'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
