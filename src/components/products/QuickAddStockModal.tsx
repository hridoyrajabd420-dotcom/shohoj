import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { PlusCircle, Layers, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface QuickAddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const QuickAddStockModal: React.FC<QuickAddStockModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { updateProduct } = useData();
  const { showToast } = useToast();

  const [quantityToAdd, setQuantityToAdd] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantityToAdd('1');
      setError(null);
      setLoading(false);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const currentStock = Number(product.stock_quantity) || 0;
  const unit = product.unit || 'pcs';
  const purchasePrice = Number(product.purchase_price) || 0;
  const addCount = Number(quantityToAdd) || 0;
  const newTotalStock = currentStock + (addCount > 0 ? addCount : 0);
  const newInventoryValue = purchasePrice * newTotalStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantityToAdd);

    if (isNaN(qty) || qty <= 0 || !Number.isFinite(qty)) {
      setError('দয়া করে সঠিক স্টক সংখ্যা লিখুন (সংখ্যা ১ বা তার বেশি হতে হবে)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedStock = currentStock + qty;
      const res = await updateProduct(product.id, {
        stock_quantity: updatedStock,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      showToast(
        `"${product.product_name || product.name}" পণ্যে +${qty} ${unit} স্টক সফলভাবে যোগ করা হয়েছে! (নতুন মোট স্টক: ${updatedStock} ${unit})`,
        'success'
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'স্টক আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="স্টক যোগ করুন (Add Stock)"
      subtitle="দ্রুত পণ্যের বিদ্যমান স্টকে নতুন সংখ্যা যুক্ত করুন"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Information Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">পণ্যের নাম (Product Name)</p>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {product.product_name || product.name}
              </h4>
            </div>
            {product.category && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {product.category}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div>
              <p className="text-[11px] text-slate-500">বর্তমান স্টক (Current Stock)</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {currentStock} {unit}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">ক্রয় মূল্য (Purchase Price)</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {formatCurrency(purchasePrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Input for Quantity to Add */}
        <div className="space-y-1.5">
          <label htmlFor="quantity-to-add-input" className="block text-xs font-bold text-slate-700">
            নতুন স্টক সংখ্যা (Quantity to Add) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="quantity-to-add-input"
              type="number"
              min="1"
              step="any"
              autoFocus
              value={quantityToAdd}
              onChange={(e) => {
                setQuantityToAdd(e.target.value);
                if (error) setError(null);
              }}
              placeholder="যেমন: ১০"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              {unit}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            বর্তমান স্টকের সাথে এই সংখ্যাটি যোগ হবে ({currentStock} + {addCount > 0 ? addCount : 0} = {newTotalStock} {unit})
          </p>
        </div>

        {/* Calculation Preview */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              আপডেটের পর মোট স্টক:
            </span>
            <span className="font-bold text-emerald-800 text-sm">
              {newTotalStock} {unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-emerald-100/70">
            <span>আপডেটের পর ইনভেন্টরি মূল্য:</span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(newInventoryValue)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>আপডেট হচ্ছে...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>আপডেট করুন (Save)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
