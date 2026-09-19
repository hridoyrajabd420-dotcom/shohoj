import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  Filter,
} from 'lucide-react';

interface ProductsViewProps {
  onOpenSaleModalWithProduct?: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = () => {
  const { products, deleteProduct, lowStockProducts, loading } = useData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stock_quantity <= p.low_stock_level && p.stock_quantity > 0;
      } else if (stockFilter === 'out') {
        matchesStock = p.stock_quantity === 0;
      }

      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteProduct(productToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে (Product deleted)', 'success');
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>পণ্য ও ইনভেন্টরি তালিকা</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {products.length}টি পণ্য
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            পণ্য যোগ, মূল্য নির্ধারণ, স্টক পর্যবেক্ষণ ও লো-স্টক সতর্কতা
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পণ্য যোগ করুন (Add Product)</span>
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{lowStockProducts.length}টি পণ্যের স্টক শেষ পর্যায়ে</strong> (নির্ধারিত সতর্কতা সীমার নিচে)।
            </span>
          </div>
          <button
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
            className="text-amber-900 underline font-semibold hover:text-amber-700 shrink-0"
          >
            {stockFilter === 'low' ? 'সব পণ্য দেখুন' : 'শুধু লো-স্টক পণ্য দেখুন'}
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="পণ্যের নাম বা SKU কোড দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Stock Filter Pills */}
        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              stockFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সব ({products.length})
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              stockFilter === 'low'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-700 hover:text-amber-800'
            }`}
          >
            <span>স্বল্প স্টক</span>
            {lowStockProducts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
                {lowStockProducts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              stockFilter === 'out'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            স্টক শেষ (০)
          </button>
        </div>
      </div>

      {/* Products Table / Card Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">পণ্য লোড হচ্ছে...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">কোনো পণ্য পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'আপনার অনুসন্ধানের সাথে কোনো পণ্য মেলেনি।'
              : 'আপনার ইনভেন্টরি বর্তমানে খালি। প্রথম পণ্য যোগ করতে নিচে ক্লিক করুন।'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>পণ্য যোগ করুন</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">পণ্যের নাম ও SKU</th>
                  <th className="px-4 py-3.5">ক্রয় মূল্য</th>
                  <th className="px-4 py-3.5">বিক্রয় মূল্য</th>
                  <th className="px-4 py-3.5">ইউনিট লাভ</th>
                  <th className="px-4 py-3.5">বর্তমান স্টক</th>
                  <th className="px-4 py-3.5">স্ট্যাটাস</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const unitProfit = p.selling_price - p.purchase_price;
                  const isLow = p.stock_quantity <= p.low_stock_level && p.stock_quantity > 0;
                  const isOut = p.stock_quantity === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.sku && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            SKU: {p.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {formatCurrency(p.purchase_price)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-900 font-bold">
                        {formatCurrency(p.selling_price)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`font-semibold ${unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatCurrency(unitProfit)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            className={
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }
                          >
                            {p.stock_quantity}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">সীমা: {p.low_stock_level}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isOut ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            স্টক শেষ (Out of Stock)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>কম স্টক (Low Stock)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            পর্যাপ্ত (In Stock)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="পণ্য মুছে ফেলুন (Delete Product)"
        message={`আপনি কি নিশ্চিত যে "${productToDelete?.name}" পণ্যটি ইনভেন্টরি থেকে মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
