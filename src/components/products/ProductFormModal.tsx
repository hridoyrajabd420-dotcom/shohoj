import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { Package, Tag, Layers, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct } = useData();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);
  const [lowStockLevel, setLowStockLevel] = useState<number | ''>(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku || '');
      setPurchasePrice(productToEdit.purchase_price);
      setSellingPrice(productToEdit.selling_price);
      setStockQuantity(productToEdit.stock_quantity);
      setLowStockLevel(productToEdit.low_stock_level);
    } else {
      setName('');
      setSku('');
      setPurchasePrice('');
      setSellingPrice('');
      setStockQuantity(10);
      setLowStockLevel(5);
    }
    setErrorMsg(null);
  }, [productToEdit, isOpen]);

  const pPrice = Number(purchasePrice) || 0;
  const sPrice = Number(sellingPrice) || 0;
  const unitProfit = sPrice - pPrice;
  const profitMargin = sPrice > 0 ? ((unitProfit / sPrice) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('পণ্যের নাম আবশ্যক (Product name is required)');
      return;
    }

    if (pPrice < 0 || sPrice < 0) {
      setErrorMsg('মূল্য ঋণাত্মক হতে পারে না (Prices cannot be negative)');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      purchase_price: pPrice,
      selling_price: sPrice,
      stock_quantity: Number(stockQuantity) || 0,
      low_stock_level: Number(lowStockLevel) || 5,
    };

    if (productToEdit) {
      const { error } = await updateProduct(productToEdit.id, payload);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        showToast('পণ্য সফলভাবে আপডেট করা হয়েছে (Product updated)', 'success');
        onClose();
      }
    } else {
      const { error } = await addProduct(payload);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        showToast('নতুন পণ্য ইনভেন্টরিতে যোগ করা হয়েছে (Product added)', 'success');
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'পণ্য সংশোধন করুন (Edit Product)' : 'নতুন পণ্য যোগ করুন (Add Product)'}
      subtitle="ইনভেন্টরি ও স্টকের সঠিক হিসাব রাখতে পণ্যের বিবরণ দিন"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            পণ্যের নাম (Product Name) *
          </label>
          <div className="relative">
            <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="যেমন: চিনি ১ কেজি / টি-শার্ট কটন"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            SKU বা কোড (ঐচ্ছিক / Optional)
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="যেমন: PRD-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-xs"
            />
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রয় মূল্য (Purchase Price ৳) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিক্রয় মূল্য (Selling Price ৳) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Profit margin live feedback */}
        {sPrice > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
            <div>
              <span className="font-semibold">প্রতি ইউনিটে লাভ: </span>
              <span className="font-bold">{formatCurrency(unitProfit)}</span>
            </div>
            <div>
              <span className="font-semibold">লাভের হার: </span>
              <span className="font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">
                {profitMargin}%
              </span>
            </div>
          </div>
        )}

        {/* Stock & Low Stock Threshold */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              স্টক পরিমাণ (Stock Quantity) *
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              লো-স্টক সতর্কতা সীমা (Low Stock Level)
            </label>
            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                min="0"
                required
                value={lowStockLevel}
                onChange={(e) => setLowStockLevel(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{productToEdit ? 'সংরক্ষণ করুন' : 'পণ্য যোগ করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
