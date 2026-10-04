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
  DollarSign,
  Boxes,
  Database,
  Copy,
  Check,
} from 'lucide-react';

interface ProductsViewProps {
  onOpenSaleModalWithProduct?: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = () => {
  const { products, deleteProduct, lowStockProducts, loading, isProductsTableMissing } = useData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Overall Inventory Value calculation (sum of purchase_price * stock_quantity)
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.purchase_price) || 0) * (Number(p.stock_quantity) || 0), 0);
  }, [products]);

  // Total stock items in inventory
  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const pName = (p.product_name || p.name || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();

      const matchesSearch = !q || pName.includes(q) || pSku.includes(q) || pCat.includes(q) || pDesc.includes(q);

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const threshold = p.low_stock_threshold ?? p.low_stock_level ?? 5;
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stock_quantity <= threshold && p.stock_quantity > 0;
      } else if (stockFilter === 'out') {
        matchesStock = p.stock_quantity === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

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

  const copyTableSql = () => {
    const sql = `-- Create products table for Shohoj Bebsha
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_name text not null,
  category text,
  sku text,
  purchase_price numeric not null default 0,
  selling_price numeric not null default 0,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  unit text default 'pcs',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Users can view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showToast('SQL স্ক্রিপ্ট কপি হয়েছে! Supabase SQL Editor এ রান করুন।', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Missing Products Table Setup Card if DB table is missing */}
      {isProductsTableMissing && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Supabase ডাটাবেজে &apos;products&apos; টেবিল সংযোগ প্রয়োজন (Table Setup Required)
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  আপনার Supabase প্রজেক্টে পণ্য ডাটাবেজ সক্রিয় করতে নিচের SQL স্ক্রিপ্টটি কপি করে Supabase SQL Editor এ রান করুন।
                </p>
              </div>
            </div>
            <button
              onClick={copyTableSql}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'কপি হয়েছে' : 'SQL কপি করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>পণ্য ও ইনভেন্টরি (Products & Inventory)</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {products.length}টি পণ্য
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            পণ্য যোগ, মূল্য নির্ধারণ, স্টক পর্যবেক্ষণ, ইনভেন্টরি মূল্য ও লো-স্টক সতর্কতা
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পণ্য যোগ করুন (Add Product)</span>
        </button>
      </div>

      {/* Inventory Value & Summary Cards (Requirement 10: Calculate Inventory Value) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inventory Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">মোট ইনভেন্টরি মূল্য (Inventory Value)</p>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {formatCurrency(totalInventoryValue)}
            </p>
            <p className="text-[10px] text-slate-400">ক্রয় মূল্য × স্টক পরিমাণ</p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">মোট পণ্য প্রকার (Total Items)</p>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {products.length}টি
            </p>
            <p className="text-[10px] text-slate-400">নিবন্ধিত অনন্য পণ্য</p>
          </div>
        </div>

        {/* Total Units in Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">মোট মজুদ একক (Units in Stock)</p>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {totalStockUnits.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">গুদামে মোট ইউনিট</p>
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">স্বল্প স্টক সতর্কতা (Low Stock)</p>
            <p className="text-base sm:text-lg font-black text-amber-600">
              {lowStockProducts.length}টি
            </p>
            <p className="text-[10px] text-slate-400">স্টক সতর্কতা সীমার নিচে</p>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any (Requirement 11) */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">
                সতর্কতা: {lowStockProducts.length}টি পণ্যের স্টক শেষ পর্যায়ে (স্টক পরিমাণ ≤ সতর্কতা সীমা)।
              </span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {lowStockProducts.slice(0, 3).map((p) => p.product_name || p.name).join(', ')}
                {lowStockProducts.length > 3 && ` এবং আরও ${lowStockProducts.length - 3}টি`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold transition-colors shrink-0 text-center"
          >
            {stockFilter === 'low' ? 'সব পণ্য দেখুন (Show All)' : 'শুধু স্বল্প স্টক দেখুন (View Low Stock)'}
          </button>
        </div>
      )}

      {/* Search Bar & Category Filter & Stock Filter (Requirements 5 & 6) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input (Requirement 5) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="পণ্যের নাম, SKU কোড, ক্যাটাগরি বা বিবরণ দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Category Filter Dropdown (Requirement 6) */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-slate-600 shrink-0">ক্যাটাগরি:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-slate-700"
            >
              <option value="all">সব ক্যাটাগরি (All Categories)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter Pills */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                stockFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সব ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                stockFilter === 'low'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
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
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              স্টক শেষ (০)
            </button>
          </div>
        </div>

        {/* Quick Category Pills if categories exist */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] text-slate-400 font-medium">ক্যাটাগরি ফিল্টার:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সব ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product List / Table (Requirements 4, 7, 8, 9, 10, 11) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">পণ্য তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">কোনো পণ্য পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'আপনার নির্বাচিত ফিল্টারের সাথে কোনো পণ্য মেলেনি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'
              : 'আপনার ইনভেন্টরি বর্তমানে খালি। প্রথম পণ্য যোগ করতে নিচে ক্লিক করুন।'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পণ্য যোগ করুন (Add Product)</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">পণ্যের নাম ও বিবরণ</th>
                  <th className="px-4 py-3.5">ক্যাটাগরি</th>
                  <th className="px-4 py-3.5">ক্রয় মূল্য</th>
                  <th className="px-4 py-3.5">বিক্রয় মূল্য</th>
                  <th className="px-4 py-3.5">ইউনিট লাভ</th>
                  <th className="px-4 py-3.5">বর্তমান স্টক</th>
                  <th className="px-4 py-3.5">ইনভেন্টরি মূল্য</th>
                  <th className="px-4 py-3.5">স্ট্যাটাস</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const pName = p.product_name || p.name || 'Unnamed Product';
                  const pPrice = Number(p.purchase_price) || 0;
                  const sPrice = Number(p.selling_price) || 0;
                  const stock = Number(p.stock_quantity) || 0;
                  const threshold = p.low_stock_threshold ?? p.low_stock_level ?? 5;
                  const unitProfit = sPrice - pPrice;
                  const inventoryVal = pPrice * stock; // Requirement 10: Inventory Value = purchase_price * stock_quantity
                  const isLow = stock <= threshold && stock > 0; // Requirement 11: Low Stock = stock_quantity <= low_stock_threshold
                  const isOut = stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name, SKU, Description */}
                      <td className="px-5 py-3.5 max-w-[220px]">
                        <div className="font-bold text-slate-900 break-words">{pName}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {p.sku && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              SKU: {p.sku}
                            </span>
                          )}
                          {p.description && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px]" title={p.description}>
                              {p.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        {p.category ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Purchase Price (Requirement 8) */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {formatCurrency(pPrice)}
                      </td>

                      {/* Selling Price (Requirement 9) */}
                      <td className="px-4 py-3.5 text-slate-900 font-bold">
                        {formatCurrency(sPrice)}
                      </td>

                      {/* Unit Profit */}
                      <td className="px-4 py-3.5">
                        <span className={`font-semibold ${unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatCurrency(unitProfit)}
                        </span>
                      </td>

                      {/* Stock Quantity & Unit (Requirement 7) */}
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
                            {stock} {p.unit || 'pcs'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">সতর্কতা সীমা: {threshold}</span>
                      </td>

                      {/* Inventory Value (Requirement 10) */}
                      <td className="px-4 py-3.5 text-slate-900 font-bold">
                        {formatCurrency(inventoryVal)}
                      </td>

                      {/* Status / Low Stock Warning (Requirement 11) */}
                      <td className="px-4 py-3.5">
                        {isOut ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            স্টক শেষ (Out of Stock)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>কম স্টক (Low Stock)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            পর্যাপ্ত (In Stock)
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit & Delete (Requirements 2 & 3) */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="সম্পাদনা করুন (Edit Product)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন (Delete Product)"
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

          {/* Table Footer with Filtered Stats */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 font-medium">
            <span>
              মোট প্রদর্শিত পণ্য: <strong>{filteredProducts.length}</strong> / {products.length}টি
            </span>
            <span>
              প্রদর্শিত ইনভেন্টরি মূল্য: <strong>
                {formatCurrency(
                  filteredProducts.reduce(
                    (acc, p) => acc + (Number(p.purchase_price) || 0) * (Number(p.stock_quantity) || 0),
                    0
                  )
                )}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Modal (Requirements 1 & 2) */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Delete Confirmation Dialog (Requirement 3) */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="পণ্য মুছে ফেলুন (Delete Product)"
        message={`আপনি কি নিশ্চিত যে "${productToDelete?.product_name || productToDelete?.name}" পণ্যটি ইনভেন্টরি থেকে মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
