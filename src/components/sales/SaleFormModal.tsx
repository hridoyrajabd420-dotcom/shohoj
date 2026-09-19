import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { Sale } from '../../types';
import { ShoppingCart, User, Calendar, Check, AlertCircle, Plus } from 'lucide-react';

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
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'due'>('paid');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // Quick inline add customer
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected product reference
  const selectedProduct = products.find((p) => p.id === productId);

  useEffect(() => {
    if (isOpen) {
      if (saleToEdit) {
        setProductId(saleToEdit.product_id || '');
        setCustomerId(saleToEdit.customer_id || '');
        setQuantity(saleToEdit.quantity);
        setSellingPrice(saleToEdit.selling_price);
        setPaymentStatus(saleToEdit.payment_status);
        setSaleDate(saleToEdit.sale_date);
      } else {
        const defaultProd = preselectedProductId
          ? products.find((p) => p.id === preselectedProductId)
          : products[0];

        if (defaultProd) {
          setProductId(defaultProd.id);
          setSellingPrice(defaultProd.selling_price);
        } else {
          setProductId('');
          setSellingPrice('');
        }

        setCustomerId('');
        setQuantity(1);
        setPaymentStatus('paid');
        setSaleDate(new Date().toISOString().split('T')[0]);
      }
      setIsAddingCustomer(false);
      setErrorMsg(null);
    }
  }, [isOpen, preselectedProductId, saleToEdit, products]);

  // Update selling price when product changes
  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      setSellingPrice(prod.selling_price);
    }
  };

  const qty = Number(quantity) || 0;
  const price = Number(sellingPrice) || 0;
  const totalAmount = qty * price;

  const handleCreateCustomerInline = async () => {
    if (!newCustName.trim()) {
      showToast('গ্রাহকের নাম দিন', 'error');
      return;
    }
    const { data, error } = await addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: '',
      address: '',
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
      showToast('নতুন গ্রাহক যুক্ত হয়েছে', 'success');
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
      setErrorMsg('পণ্য পাওয়া যায়নি');
      return;
    }

    if (qty <= 0) {
      setErrorMsg('বিক্রয় পরিমাণ কমপক্ষে ১ হতে হবে');
      return;
    }

    if (!saleToEdit && selectedProduct.stock_quantity < qty) {
      setErrorMsg(
        `পর্যাপ্ত স্টক নেই! এই পণ্যের বর্তমান মজুদ মাত্র ${selectedProduct.stock_quantity}টি।`
      );
      return;
    }

    setLoading(true);

    let res: { error: string | null };

    if (saleToEdit) {
      res = await updateSale(saleToEdit.id, {
        productId,
        customerId: customerId || null,
        quantity: qty,
        sellingPrice: price,
        paymentStatus,
        saleDate,
      });
    } else {
      res = await recordSale({
        productId,
        customerId: customerId || null,
        quantity: qty,
        sellingPrice: price,
        paymentStatus,
        saleDate,
      });
    }

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      showToast(
        saleToEdit
          ? 'বিক্রয় রেকর্ড সফলভাবে আপডেট করা হয়েছে!'
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
      subtitle="পণ্য বিক্রি করলে স্বয়ংক্রিয়ভাবে স্টক হ্রাস ও গ্রাহক খাতা আপডেট হবে"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
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
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="" disabled>
              -- পণ্য বেছে নিন --
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                {p.name} {p.sku ? `(${p.sku})` : ''} - স্টক: {p.stock_quantity}টি{' '}
                {p.stock_quantity <= 0 ? '(স্টক শেষ)' : ''}
              </option>
            ))}
          </select>
          {selectedProduct && (
            <p className="text-[11px] text-slate-500 mt-1">
              বর্তমান মজুদ:{' '}
              <strong className={selectedProduct.stock_quantity <= 5 ? 'text-rose-600' : 'text-emerald-700'}>
                {selectedProduct.stock_quantity}টি
              </strong>
              {' '}• নিয়মিত বিক্রয়মূল্য: {formatCurrency(selectedProduct.selling_price)}
            </p>
          )}
        </div>

        {/* Customer Selector with quick add */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              গ্রাহক / কাস্টমার (Customer)
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCustomer(!isAddingCustomer)}
              className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingCustomer ? 'তালিকা থেকে বাছুন' : 'নতুন গ্রাহক যোগ করুন'}</span>
            </button>
          </div>

          {isAddingCustomer ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <input
                type="text"
                placeholder="গ্রাহকের নাম *"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="tel"
                placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleCreateCustomerInline}
                className="w-full py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                গ্রাহক সংরক্ষণ করুন
              </button>
            </div>
          ) : (
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="">সরাসরি নগদ ক্রেতা (Cash Customer / Walk-in)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.due_amount > 0 ? `[বাকি: ${formatCurrency(c.due_amount)}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quantity & Selling Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পরিমাণ (Quantity) *
            </label>
            <input
              type="number"
              min="1"
              max={selectedProduct ? selectedProduct.stock_quantity : undefined}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
            />
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Total Calculation Display */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-semibold block">মোট বিল (Total Amount)</span>
            <span className="text-[11px] text-emerald-600">হিসাব: {qty} × {price}</span>
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {formatCurrency(totalAmount)}
          </div>
        </div>

        {/* Payment Status & Sale Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পরিশোধ স্ট্যাটাস (Payment Status) *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                পরিশোধিত (Paid)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('due')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  paymentStatus === 'due'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                বাকি (Due)
              </button>
            </div>
            {paymentStatus === 'due' && !customerId && (
              <p className="text-[10px] text-amber-600 mt-1">
                পরামর্শ: বাকি রাখার জন্য নির্দিষ্ট গ্রাহক নির্বাচন করা উত্তম।
              </p>
            )}
          </div>

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
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading || !productId || (selectedProduct ? selectedProduct.stock_quantity < qty : false)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>বিক্রয় সম্পন্ন করুন (Confirm Sale)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
