import React, { useMemo } from 'react';
import { FixedAsset } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  calculateAssetDepreciation,
  generateDepreciationSchedule,
  ASSET_CATEGORIES,
} from '../../lib/depreciationEngine';
import {
  Landmark,
  Calendar,
  Clock,
  DollarSign,
  TrendingDown,
  FileText,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FixedAsset | null;
  onEdit: (asset: FixedAsset) => void;
  onDelete: (asset: FixedAsset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !asset) return null;

  const metrics = useMemo(() => {
    return calculateAssetDepreciation(asset);
  }, [asset]);

  const schedule = useMemo(() => {
    return generateDepreciationSchedule(asset);
  }, [asset]);

  const categoryMeta = useMemo(() => {
    return ASSET_CATEGORIES.find((c) => c.id === asset.category);
  }, [asset.category]);

  const progressPercent = useMemo(() => {
    if (metrics.totalDepreciableAmount <= 0) return 0;
    return Math.min(100, Math.round((metrics.accumulatedDepreciation / metrics.totalDepreciableAmount) * 100));
  }, [metrics]);

  const usefulLifeText = `${asset.useful_life} ${
    asset.useful_life_unit === 'years' ? 'বছর' : 'মাস'
  } (${metrics.usefulLifeMonths} মাস)`;

  const remainingYears = (metrics.remainingMonths / 12).toFixed(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="স্থায়ী সম্পদের বিস্তারিত ও অবচয় বিবরণী"
      size="xl"
    >
      <div className="space-y-5">
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {categoryMeta?.nameBn || asset.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    metrics.isFullyDepreciated
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {metrics.isFullyDepreciated ? 'সম্পূর্ণ অবচয়িত (Fully Depreciated)' : 'সক্রিয় সম্পদ (Active Asset)'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">{asset.name}</h3>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span>ক্রয়: {formatDate(asset.purchase_date)}</span>
                <span>•</span>
                <span>অবচয় শুরু: {formatDate(asset.depreciation_start_date || asset.purchase_date)}</span>
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-[11px] text-slate-400 block font-medium">বর্তমান পুস্তক মূল্য (Net Book Value)</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {formatCurrency(metrics.netBookValue)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-4 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span>অবচয়ের অগ্রগতি ({progressPercent}%)</span>
              <span>
                {metrics.monthsElapsed} মাস অতিক্রান্ত / অবশিষ্ট {metrics.remainingMonths} মাস (~{remainingYears} বছর)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics.isFullyDepreciated ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 6 Key Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-semibold block">মূল ক্রয়মূল্য (Cost)</span>
            <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {formatCurrency(asset.purchase_cost)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">ব্যালেন্স শীট Gross Asset</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-semibold block">স্ক্র্যাপ/অবশিষ্ট মূল্য</span>
            <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {formatCurrency(asset.salvage_value)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">মেয়াদ শেষের প্রাক্কলিত মূল্য</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-semibold block">মোট অবচয়যোগ্য ভিত্তি</span>
            <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {formatCurrency(metrics.totalDepreciableAmount)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">ক্রয়মূল্য − অবশিষ্ট মূল্য</span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
            <span className="text-[11px] text-emerald-800 font-semibold block">মাসিক অবচয় ব্যয়</span>
            <span className="text-base sm:text-lg font-black text-emerald-800 mt-0.5 block">
              {formatCurrency(metrics.monthlyDepreciation)}
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">P&L-এ প্রতি মাসের খরচ</span>
          </div>

          <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/80">
            <span className="text-[11px] text-rose-800 font-semibold block">পুঞ্জীভূত অবচয় (Accum.)</span>
            <span className="text-base sm:text-lg font-black text-rose-700 mt-0.5 block">
              {formatCurrency(metrics.accumulatedDepreciation)}
            </span>
            <span className="text-[10px] text-rose-600 mt-0.5 block">আজ পর্যন্ত মোট অবচয়</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80">
            <span className="text-[11px] text-blue-800 font-semibold block">ব্যবহারযোগ্য মেয়াদ</span>
            <span className="text-base sm:text-lg font-black text-blue-900 mt-0.5 block">
              {usefulLifeText}
            </span>
            <span className="text-[10px] text-blue-700 mt-0.5 block">সরলরৈখিক (Straight-Line)</span>
          </div>
        </div>

        {/* CapEx Accounting Rules Note */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900">হিসাবরক্ষণ নীতি ও ব্যালেন্স শীট প্রভাব:</p>
            <p className="text-amber-800 leading-relaxed">
              এই {formatCurrency(asset.purchase_cost)} টাকার সম্পদটি সম্পূর্ণ মূলধনী ব্যয় (CapEx)। তাই ক্রয়কালীন পুরো অর্থ এককালীন খরচ হিসেবে গণ্য হয়নি। ব্যালেন্স শীটে এটি স্থাবর সম্পদ হিসেবে জমা রয়েছে এবং প্রতি মাসে শুধুমাত্র {formatCurrency(metrics.monthlyDepreciation)} টাকা হারে লাভ-ক্ষতি (P&L)-এ অবচয় খরচ হিসেবে দেখানো হচ্ছে।
            </p>
          </div>
        </div>

        {/* Notes if available */}
        {asset.notes && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-800 block mb-0.5">নোট বা মন্তব্য:</span>
            <p className="whitespace-pre-line text-slate-600">{asset.notes}</p>
          </div>
        )}

        {/* Depreciation Schedule Table (Year-by-Year) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              বাৎসরিক অবচয় শিডিউল (Depreciation Schedule)
            </h4>
            <span className="text-[11px] text-slate-500">
              সরলরৈখিক পদ্ধতি (Straight-Line)
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">সময়কাল (Period)</th>
                  <th className="px-3.5 py-2.5 text-right">প্রারম্ভিক মূল্য (Opening)</th>
                  <th className="px-3.5 py-2.5 text-right">বাৎসরিক অবচয় (Depreciation)</th>
                  <th className="px-3.5 py-2.5 text-right">পুঞ্জীভূত অবচয় (Accumulated)</th>
                  <th className="px-3.5 py-2.5 text-right">সমাপনী পুস্তক মূল্য (Ending NBV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {schedule.map((item) => (
                  <tr key={item.yearNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-2 font-medium text-slate-900">{item.periodLabel}</td>
                    <td className="px-3.5 py-2 text-right text-slate-600">{formatCurrency(item.beginningBookValue)}</td>
                    <td className="px-3.5 py-2 text-right font-semibold text-rose-600">{formatCurrency(item.depreciationExpense)}</td>
                    <td className="px-3.5 py-2 text-right text-slate-600">{formatCurrency(item.accumulatedDepreciation)}</td>
                    <td className="px-3.5 py-2 text-right font-black text-emerald-700">{formatCurrency(item.endingBookValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons: Edit, Delete, Close */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>এডিট করুন (Edit)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(asset);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছে ফেলুন (Delete)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </Modal>
  );
};
