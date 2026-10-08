import React, { useState, useEffect, useMemo } from 'react';
import { FixedAsset, FixedAssetInput, FixedAssetCategory } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { ASSET_CATEGORIES } from '../../lib/depreciationEngine';
import {
  Landmark,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Info,
  CheckCircle2,
  Sparkles,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: FixedAsset | null;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  assetToEdit,
}) => {
  const { addFixedAsset, updateFixedAsset } = useData();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FixedAssetCategory | string>('Computer');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [usefulLife, setUsefulLife] = useState('');
  const [usefulLifeUnit, setUsefulLifeUnit] = useState<'months' | 'years'>('years');
  const [salvageValue, setSalvageValue] = useState('');
  const [depreciationMethod, setDepreciationMethod] = useState('straight_line');
  const [depreciationStartDate, setDepreciationStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name || '');
      setCategory(assetToEdit.category || 'Computer');
      setPurchaseDate(assetToEdit.purchase_date || todayStr);
      setPurchaseCost(String(assetToEdit.purchase_cost || ''));
      setUsefulLife(String(assetToEdit.useful_life || ''));
      setUsefulLifeUnit(assetToEdit.useful_life_unit || 'years');
      setSalvageValue(String(assetToEdit.salvage_value || '0'));
      setDepreciationMethod(assetToEdit.depreciation_method || 'straight_line');
      setDepreciationStartDate(assetToEdit.depreciation_start_date || assetToEdit.purchase_date || todayStr);
      setNotes(assetToEdit.notes || '');
    } else {
      setName('');
      setCategory('Computer');
      setPurchaseDate(todayStr);
      setPurchaseCost('');
      setUsefulLife('3');
      setUsefulLifeUnit('years');
      setSalvageValue('0');
      setDepreciationMethod('straight_line');
      setDepreciationStartDate(todayStr);
      setNotes('');
    }
    setError(null);
  }, [assetToEdit, isOpen, todayStr]);

  // Handle category change: suggest default useful life
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!assetToEdit) {
      const meta = ASSET_CATEGORIES.find((c) => c.id === newCat);
      if (meta) {
        setUsefulLife(String(meta.defaultUsefulLifeYears));
        setUsefulLifeUnit('years');
      }
    }
  };

  // Live calculations for preview
  const preview = useMemo(() => {
    const cost = Math.max(0, parseFloat(purchaseCost) || 0);
    const salvage = Math.max(0, parseFloat(salvageValue) || 0);
    const lifeVal = Math.max(0.1, parseFloat(usefulLife) || 1);
    const lifeMonths = usefulLifeUnit === 'years' ? Math.round(lifeVal * 12) : Math.round(lifeVal);

    const depreciableAmount = Math.max(0, cost - salvage);
    const monthlyDep = lifeMonths > 0 ? depreciableAmount / lifeMonths : 0;
    const annualDep = monthlyDep * 12;

    return {
      cost,
      salvage,
      lifeMonths,
      depreciableAmount,
      monthlyDep,
      annualDep,
    };
  }, [purchaseCost, salvageValue, usefulLife, usefulLifeUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('স্থায়ী সম্পদের নাম প্রদান করুন (Asset name is required)');
      return;
    }

    const costNum = parseFloat(purchaseCost);
    if (isNaN(costNum) || costNum <= 0) {
      setError('সঠিক ক্রয়মূল্য উল্লেখ করুন (Purchase cost must be greater than 0)');
      return;
    }

    const salvageNum = salvageValue === '' ? 0 : parseFloat(salvageValue);
    if (isNaN(salvageNum) || salvageNum < 0) {
      setError('অবশিষ্ট মূল্য (Salvage value) ০ বা তার বেশি হতে হবে');
      return;
    }

    if (salvageNum >= costNum) {
      setError('অবশিষ্ট মূল্য (Salvage value) ক্রয়মূল্যের চেয়ে কম হতে হবে');
      return;
    }

    const lifeNum = parseFloat(usefulLife);
    if (isNaN(lifeNum) || lifeNum <= 0) {
      setError('সঠিক ব্যবহারযোগ্য মেয়াদ বা আয়ুষ্কাল উল্লেখ করুন (Useful life must be > 0)');
      return;
    }

    const effectiveDate = purchaseDate || todayStr;
    const effectiveStart = depreciationStartDate || effectiveDate;

    setLoading(true);

    const assetPayload: FixedAssetInput = {
      name: name.trim(),
      category,
      purchase_date: effectiveDate,
      purchase_cost: costNum,
      useful_life: lifeNum,
      useful_life_unit: usefulLifeUnit,
      salvage_value: salvageNum,
      depreciation_method: depreciationMethod,
      depreciation_start_date: effectiveStart,
      notes: notes.trim(),
    };

    try {
      if (assetToEdit) {
        const res = await updateFixedAsset(assetToEdit.id, assetPayload);
        if (res.error) {
          setError(res.error);
        } else {
          showToast('স্থায়ী সম্পদ সফলভাবে আপডেট করা হয়েছে!', 'success');
          onClose();
        }
      } else {
        const res = await addFixedAsset(assetPayload);
        if (res.error) {
          setError(res.error);
        } else {
          showToast('নতুন স্থায়ী সম্পদ রেজিস্টারে যুক্ত করা হয়েছে!', 'success');
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'সম্পদ সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assetToEdit ? 'স্থায়ী সম্পদ এডিট করুন (Edit Fixed Asset)' : 'নতুন স্থায়ী সম্পদ যোগ করুন (Add Fixed Asset)'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* CapEx Accounting Principle Info Banner */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-emerald-800">মূলধনী ব্যয় (CapEx) নিয়ম:</strong> স্থায়ী সম্পদ ক্রয়ের টাকা এককালীন বর্তমান মাসের লাভ-ক্ষতি (P&L) থেকে বাদ যাবে না। এটি ব্যালেন্স শীটে সম্পদ হিসেবে জমা হবে এবং মেয়াদানুসারে মাসিক সরলরৈখিক অবচয় হিসেবে ব্যয় বণ্টিত হবে।
          </div>
        </div>

        {/* Asset Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              স্থায়ী সম্পদের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="উদাঃ ডেল ডেস্কটপ পিসি, দোকানের এসি, ডেলিভারি বাইক"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সম্পদের ক্যাটাগরি (Category) <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
            >
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameBn} ({cat.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Purchase Date & Purchase Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রয়ের তারিখ (Purchase Date) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => {
                  setPurchaseDate(e.target.value);
                  if (!depreciationStartDate || depreciationStartDate === purchaseDate) {
                    setDepreciationStartDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রয়মূল্য (Purchase Cost - ৳) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                required
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                placeholder="যেমনঃ 120000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Useful Life & Unit + Salvage Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ব্যবহারযোগ্য মেয়াদ / আয়ুষ্কাল (Useful Life) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={usefulLife}
                onChange={(e) => setUsefulLife(e.target.value)}
                placeholder="যেমনঃ 5 বা 60"
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
              <select
                value={usefulLifeUnit}
                onChange={(e) => setUsefulLifeUnit(e.target.value as 'months' | 'years')}
                className="w-32 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white font-medium"
              >
                <option value="years">বছর (Years)</option>
                <option value="months">মাস (Months)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              অবশিষ্ট মূল্য (Salvage Value - ৳)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={salvageValue}
              onChange={(e) => setSalvageValue(e.target.value)}
              placeholder="0 (স্ক্র্যাপ/অবশিষ্ট মূল্য)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
            />
          </div>
        </div>

        {/* Depreciation Method & Depreciation Start Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              অবচয় পদ্ধতি (Depreciation Method)
            </label>
            <select
              value={depreciationMethod}
              onChange={(e) => setDepreciationMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
            >
              <option value="straight_line">সরলরৈখিক পদ্ধতি (Straight-Line Method - ডিফল্ট)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              প্রতি মাসে সমান হারে অবচয় হিসাব হবে
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              অবচয় শুরুর তারিখ (Depreciation Start Date)
            </label>
            <input
              type="date"
              value={depreciationStartDate}
              onChange={(e) => setDepreciationStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              সাধারণত ক্রয় বা ব্যবহারের শুরুর তারিখ
            </span>
          </div>
        </div>

        {/* Real-time Calculation Summary Box */}
        {preview.cost > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200/80 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                স্বয়ংক্রিয় অবচয় প্রাক-গণনা (Real-Time Depreciation Calculation)
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                মেয়াদ: {preview.lifeMonths} মাস
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">মোট ক্রয়মূল্য</span>
                <span className="font-bold text-slate-800">{formatCurrency(preview.cost)}</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">অবচয়যোগ্য মূল্য</span>
                <span className="font-bold text-slate-800">{formatCurrency(preview.depreciableAmount)}</span>
              </div>

              <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-emerald-700 block font-medium">মাসিক অবচয় (Monthly)</span>
                <span className="font-black text-emerald-800">{formatCurrency(preview.monthlyDep)}/মাস</span>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">বাৎসরিক অবচয় (Annual)</span>
                <span className="font-bold text-slate-800">{formatCurrency(preview.annualDep)}/বছর</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              সূত্র: ({formatCurrency(preview.cost)} ক্রয়মূল্য − {formatCurrency(preview.salvage)} অবশিষ্ট) ÷ {preview.lifeMonths} মাস = প্রতি মাসে {formatCurrency(preview.monthlyDep)} অবচয় ব্যয়
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            নোট বা বিবরণ (Notes)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="সরবরাহকারীর নাম, ওয়ারেন্টি মেয়াদ, ইনভয়েস নম্বর বা অবস্থান..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {loading ? (
              <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{assetToEdit ? 'আপডেট করুন (Save Changes)' : 'সংরক্ষণ করুন (Add Asset)'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
