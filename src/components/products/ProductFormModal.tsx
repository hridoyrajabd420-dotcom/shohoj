import React, { useState, useEffect } from 'react';
import { Product, ProductInput } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { Package, Tag, Layers, AlertTriangle, ArrowRight, Folder, FileText, Scale } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const COMMON_CATEGORIES = [
  'মুদি (Grocery)',
  'পোশাক (Clothing)',
  'ইলেকট্রনিক্স (Electronics)',
  'খাদ্য ও পানীয় (Food & Beverage)',
  'প্রসাধনী (Cosmetics)',
  'ঔষধ ও স্বাস্থ্য (Pharmacy)',
  'স্টেশনারি (Stationery)',
  'হার্ডওয়্যার (Hardware)',
  'অন্যান্য (Other)',
];

const COMMON_UNITS = [
  { value: 'pcs', label: 'পিস (pcs)' },
  { value: 'kg', label: 'কেজি (kg)' },
  { value: 'ltr', label: 'লিটার (ltr)' },
  { value: 'gm', label: 'গ্রাম (gm)' },
  { value: 'pkt', label: 'প্যাকেট (pkt)' },
  { value: 'box', label: 'বক্স (box)' },
  { value: 'dozen', label: 'ডজন (dozen)' },
  { value: 'meter', label: 'মিটার (meter)' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct } = useData();
  const { showToast } = useToast();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(5);
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setProductName(productToEdit.product_name || productToEdit.name || '');
      setCategory(productToEdit.category || '');
      setSku(productToEdit.sku || '');
      setPurchasePrice(productToEdit.purchase_price ?? '');
      setSellingPrice(productToEdit.selling_price ?? '');
      setStockQuantity(productToEdit.stock_quantity ?? 0);
      setLowStockThreshold(productToEdit.low_stock_threshold ?? productToEdit.low_stock_level ?? 5);
      setUnit(productToEdit.unit || 'pcs');
      setDescription(productToEdit.description || '');
    } else {
      setProductName('');
      setCategory('');
      setSku('');
      setPurchasePrice('');
      setSellingPrice('');
      setStockQuantity(10);
      setLowStockThreshold(5);
      setUnit('pcs');
      setDescription('');
    }
    setErrorMsg(null);
  }, [productToEdit, isOpen]);

  const pPrice = Number(purchasePrice) || 0;
  const sPrice = Number(sellingPrice) || 0;
  const stock = Number(stockQuantity) || 0;
  const unitProfit = sPrice - pPrice;
  const profitMargin = sPrice > 0 ? ((unitProfit / sPrice) * 100).toFixed(1) : '0';
  const itemInventoryValue = pPrice * stock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!productName.trim()) {
      setErrorMsg('পণ্যের নাম আবশ্যক (Product name is required)');
      return;
    }

    if (purchasePrice === '' || pPrice < 0) {
      setErrorMsg('সঠিক ক্রয় মূল্য দিন (Valid purchase price is required, 0 or greater)');
      return;
    }

    if (sellingPrice === '' || sPrice < 0) {
      setErrorMsg('সঠিক বিক্রয় মূল্য দিন (Valid selling price is required, 0 or greater)');
      return;
    }

    if (stockQuantity === '' || stock < 0) {
      setErrorMsg('স্টক পরিমাণ শূন্য বা তার বেশি হতে হবে (Stock quantity must be 0 or greater)');
      return;
    }

    const threshold = lowStockThreshold === '' ? 5 : Number(lowStockThreshold);
    if (threshold < 0) {
      setErrorMsg('লো-স্টক সতর্কতা সীমা ঋণাত্মক হতে পারে না (Low stock threshold cannot be negative)');
      return;
    }

    setLoading(true);

    const payload: ProductInput = {
      product_name: productName.trim(),
      name: productName.trim(),
      category: category.trim(),
      sku: sku.trim(),
      purchase_price: pPrice,
      selling_price: sPrice,
      stock_quantity: stock,
      low_stock_threshold: threshold,
      low_stock_level: threshold,
      unit: unit.trim() || 'pcs',
      description: description.trim(),
    };

    if (productToEdit) {
      const { error } = await updateProduct(productToEdit.id, payload as Partial<Product>);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        showToast('পণ্য সফলভাবে আপডেট করা হয়েছে (Product updated successfully)', 'success');
        onClose();
      }
    } else {
      const { error } = await addProduct(payload);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        showToast('নতুন পণ্য ইনভেন্টরিতে যোগ করা হয়েছে (Product added successfully)', 'success');
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'পণ্য সংশোধন করুন (Edit Product)' : 'নতুন পণ্য যোগ করুন (Add Product)'}
      subtitle="ইনভেন্টরি, সঠিক স্টক ও লাভের হিসাব নিশ্চিত করতে পণ্যের পূর্ণ বিবরণ দিন"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            পণ্যের নাম (Product Name) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="যেমন: তীর সয়াবিন তেল ১ লিটার / সুতি পাঞ্জাবি"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Category & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্যাটাগরি (Category)
            </label>
            <div className="relative">
              <Folder className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                list="category-suggestions"
                placeholder="ক্যাটাগরি নির্বাচন বা টাইপ করুন"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SKU বা কোড (SKU / Barcode)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="যেমন: OIL-001 / BCD-9982"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রয় মূল্য (Purchase Price ৳) <span className="text-rose-500">*</span>
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
              বিক্রয় মূল্য (Selling Price ৳) <span className="text-rose-500">*</span>
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

        {/* Profit margin & inventory value live indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">প্রতি ইউনিটে লাভ:</span>
            <span className={`font-bold ${unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(unitProfit)} {sPrice > 0 && `(${profitMargin}%)`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">ইনভেন্টরি মূল্য (মোট ক্রয়):</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(itemInventoryValue)}
            </span>
          </div>
        </div>

        {/* Stock, Unit & Low Stock Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              স্টক পরিমাণ (Stock) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                min="0"
                step="any"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              একক (Unit)
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              লো-স্টক সতর্কতা সীমা <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
              <input
                type="number"
                min="0"
                required
                placeholder="5"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            বিবরণ / নোট (Description / Notes - ঐচ্ছিক)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              placeholder="পণ্যের আকার, রঙ, ব্র‍্যান্ড বা অতিরিক্ত বিবরণ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
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
                <span>{productToEdit ? 'সংরক্ষণ করুন (Save Changes)' : 'পণ্য যোগ করুন (Add Product)'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
