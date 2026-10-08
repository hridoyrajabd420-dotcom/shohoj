import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { FixedAsset, FixedAssetCategory } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  calculateAssetDepreciation,
  calculateFixedAssetsSummary,
  ASSET_CATEGORIES,
} from '../../lib/depreciationEngine';
import { AssetFormModal } from './AssetFormModal';
import { AssetDetailModal } from './AssetDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Boxes,
  PieChart,
} from 'lucide-react';

type AssetTab = 'register' | 'depreciation_report' | 'balance_sheet' | 'capex_guide';

export const FixedAssetsView: React.FC = () => {
  const { fixedAssets, fixedAssetsSummary, deleteFixedAsset, loading } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AssetTab>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<FixedAsset | null>(null);
  const [assetToView, setAssetToView] = useState<FixedAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<FixedAsset | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return fixedAssets.filter((asset) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        (asset.category && asset.category.toLowerCase().includes(q)) ||
        (asset.notes && asset.notes.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || asset.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [fixedAssets, searchQuery, categoryFilter]);

  // Asset list with calculated metrics
  const assetsWithMetrics = useMemo(() => {
    return filteredAssets.map((asset) => ({
      asset,
      metrics: calculateAssetDepreciation(asset),
    }));
  }, [filteredAssets]);

  // Category breakdown for Balance Sheet tab
  const categoryBreakdown = useMemo(() => {
    const map: Record<
      string,
      { gross: number; accumDep: number; net: number; count: number }
    > = {};

    fixedAssets.forEach((asset) => {
      const cat = asset.category || 'Other';
      const m = calculateAssetDepreciation(asset);
      if (!map[cat]) {
        map[cat] = { gross: 0, accumDep: 0, net: 0, count: 0 };
      }
      map[cat].gross += Number(asset.purchase_cost || 0);
      map[cat].accumDep += m.accumulatedDepreciation;
      map[cat].net += m.netBookValue;
      map[cat].count += 1;
    });

    return Object.entries(map).map(([catId, data]) => {
      const meta = ASSET_CATEGORIES.find((c) => c.id === catId);
      return {
        catId,
        nameBn: meta?.nameBn || catId,
        nameEn: meta?.nameEn || catId,
        ...data,
      };
    });
  }, [fixedAssets]);

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await deleteFixedAsset(assetToDelete.id);
      if (res.error) {
        showToast(`মুছে ফেলা যায়নি: ${res.error}`, 'error');
      } else {
        showToast('স্থায়ী সম্পদ সফলভাবে মুছে ফেলা হয়েছে!', 'success');
        setAssetToDelete(null);
      }
    } catch {
      showToast('মুছে ফেলতে ত্রুটি হয়েছে', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'সম্পদের নাম (Asset Name)',
      'ক্যাটাগরি (Category)',
      'ক্রয়ের তারিখ (Purchase Date)',
      'ক্রয়মূল্য (Purchase Cost)',
      'অবশিষ্ট মূল্য (Salvage Value)',
      'ব্যবহারযোগ্য মেয়াদ (Useful Life)',
      'মাসিক অবচয় (Monthly Depreciation)',
      'বাৎসরিক অবচয় (Annual Depreciation)',
      'পুঞ্জীভূত অবচয় (Accumulated Depreciation)',
      'বর্তমান পুস্তক মূল্য (Net Book Value)',
      'স্ট্যাটাস (Status)',
    ];

    const rows = fixedAssets.map((a) => {
      const m = calculateAssetDepreciation(a);
      return [
        a.name,
        a.category,
        a.purchase_date,
        a.purchase_cost,
        a.salvage_value,
        `${a.useful_life} ${a.useful_life_unit}`,
        m.monthlyDepreciation.toFixed(2),
        m.annualDepreciation.toFixed(2),
        m.accumulatedDepreciation.toFixed(2),
        m.netBookValue.toFixed(2),
        m.isFullyDepreciated ? 'Fully Depreciated' : 'Active',
      ];
    });

    const csvContent = [
      ['সহজ ব্যবসা - স্থায়ী সম্পদ ও অবচয় রেজিস্টার (Fixed Assets & Depreciation Report)'],
      [`প্রস্তুতকৃত তারিখ: ${new Date().toLocaleDateString('bn-BD')}`],
      [''],
      headers,
      ...rows,
      [''],
      [
        'মোট (Total)',
        '',
        '',
        fixedAssetsSummary.totalGrossAssets,
        fixedAssetsSummary.totalSalvageValue,
        '',
        fixedAssetsSummary.totalMonthlyDepreciation.toFixed(2),
        fixedAssetsSummary.totalAnnualDepreciation.toFixed(2),
        fixedAssetsSummary.totalAccumulatedDepreciation.toFixed(2),
        fixedAssetsSummary.totalNetBookValue.toFixed(2),
        '',
      ],
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fixed_Assets_Register_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('সম্পদ রেজিস্টার CSV ডাউনলোড সম্পন্ন হয়েছে!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Landmark className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              স্থায়ী সম্পদ ও অবচয় (Fixed Assets & CapEx)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ব্যবসায়ের দীর্ঘমেয়াদী মূলধনী সম্পদ (CapEx), সরলরৈখিক অবচয় হিসাব ও সম্পদ রেজিস্টার
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setAssetToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন স্থায়ী সম্পদ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Requirement 8: Top 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gross Fixed Assets */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              মোট স্থায়ী সম্পদ (Gross Fixed Assets)
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(fixedAssetsSummary.totalGrossAssets)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>মোট {fixedAssets.length}টি স্থায়ী সম্পদ</span>
            <span className="text-emerald-700 font-medium">মূল ক্রয়মূল্য</span>
          </div>
        </div>

        {/* Card 2: Accumulated Depreciation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              মোট পুঞ্জীভূত অবচয় (Accumulated Dep.)
            </span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600 tracking-tight">
            {formatCurrency(fixedAssetsSummary.totalAccumulatedDepreciation)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>আজ পর্যন্ত ক্ষয়প্রাপ্ত মূল্য</span>
            <span className="text-rose-600 font-semibold">বাদ যাবে</span>
          </div>
        </div>

        {/* Card 3: Net Fixed Assets / Net Book Value */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-xs bg-emerald-50/20 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              নিট স্থায়ী সম্পদ (Net Fixed Assets)
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-600 text-white">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-800 tracking-tight">
            {formatCurrency(fixedAssetsSummary.totalNetBookValue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>বর্তমান পুস্তক মূল্য (NBV)</span>
            <span className="text-emerald-700 font-semibold">ব্যালেন্স শীট ব্যালেন্স</span>
          </div>
        </div>

        {/* Card 4: Monthly Depreciation Expense */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              চলতি মাসিক অবচয় (Monthly Expense)
            </span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-blue-700 tracking-tight">
            {formatCurrency(fixedAssetsSummary.totalMonthlyDepreciation)}
            <span className="text-xs font-normal text-slate-400">/মাস</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>সক্রিয় সম্পদ: {fixedAssetsSummary.activeAssetsCount}টি</span>
            <span className="text-blue-700 font-medium">P&L খরচ</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'register'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>সম্পদ রেজিস্টার (Asset Register)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {fixedAssets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('depreciation_report')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'depreciation_report'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>অবচয় রিপোর্ট (Depreciation Report)</span>
        </button>

        <button
          onClick={() => setActiveTab('balance_sheet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'balance_sheet'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>ব্যালেন্স শীট অবস্থান (Balance Sheet)</span>
        </button>

        <button
          onClick={() => setActiveTab('capex_guide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'capex_guide'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>CapEx বনাম OpEx গাইড (Accounting Rules)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ASSET REGISTER (সম্পদ রেজিস্টার)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="সম্পদের নাম, ক্যাটাগরি বা নোট দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white font-medium"
              >
                <option value="all">সকল ক্যাটাগরি (All)</option>
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
                title="CSV এক্সপোর্ট করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
                title="প্রিন্ট করুন"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট</span>
              </button>
            </div>
          </div>

          {/* Asset Register Table */}
          {assetsWithMetrics.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">কোনো স্থায়ী সম্পদ পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                দোকান, জমি, গাড়ি, মেশিনারি, কম্পিউটার, সরঞ্জাম বা অন্যান্য মূলধনী সম্পদ যোগ করে রেজিস্টার তৈরি করুন।
              </p>
              <button
                onClick={() => {
                  setAssetToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ প্রথম স্থায়ী সম্পদ যোগ করুন</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">সম্পদ ও ক্যাটাগরি</th>
                      <th className="px-3 py-3">ক্রয়ের তারিখ</th>
                      <th className="px-3 py-3 text-right">ক্রয়মূল্য</th>
                      <th className="px-3 py-3 text-right">অবশিষ্ট মূল্য</th>
                      <th className="px-3 py-3">মেয়াদ / আয়ুষ্কাল</th>
                      <th className="px-3 py-3 text-right">মাসিক অবচয়</th>
                      <th className="px-3 py-3 text-right">পুঞ্জীভূত অবচয়</th>
                      <th className="px-3 py-3 text-right">নিট পুস্তক মূল্য</th>
                      <th className="px-3 py-3 text-center">স্ট্যাটাস</th>
                      <th className="px-4 py-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assetsWithMetrics.map(({ asset, metrics }) => {
                      const catMeta = ASSET_CATEGORIES.find((c) => c.id === asset.category);
                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{asset.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-medium text-slate-600">
                                {catMeta?.nameBn || asset.category}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                            {formatDate(asset.purchase_date)}
                          </td>

                          <td className="px-3 py-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(asset.purchase_cost)}
                          </td>

                          <td className="px-3 py-3.5 text-right text-slate-600 whitespace-nowrap">
                            {formatCurrency(asset.salvage_value)}
                          </td>

                          <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                            <div>
                              {asset.useful_life} {asset.useful_life_unit === 'years' ? 'বছর' : 'মাস'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              অবশিষ্ট {metrics.remainingMonths} মাস
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-right font-bold text-blue-700 whitespace-nowrap">
                            {formatCurrency(metrics.monthlyDepreciation)}
                          </td>

                          <td className="px-3 py-3.5 text-right font-bold text-rose-600 whitespace-nowrap">
                            {formatCurrency(metrics.accumulatedDepreciation)}
                          </td>

                          <td className="px-3 py-3.5 text-right font-black text-emerald-700 whitespace-nowrap">
                            {formatCurrency(metrics.netBookValue)}
                          </td>

                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                                metrics.isFullyDepreciated
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {metrics.isFullyDepreciated ? 'অবচয়িত' : 'সক্রিয়'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setAssetToView(asset)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                title="বিস্তারিত ও শিডিউল দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setAssetToEdit(asset);
                                  setIsFormModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                title="এডিট করুন"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setAssetToDelete(asset)}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEPRECIATION REPORT (অবচয় রিপোর্ট) (Requirement 9)                  */}
      {/* ========================================================================= */}
      {activeTab === 'depreciation_report' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                স্থায়ী সম্পদের অবচয় বিবরণী ও শিডিউল রিপোর্ট (Depreciation Report)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সরলরৈখিক পদ্ধতি (Straight-Line Method) অনুসারে মোট অবচয়, মাসিক ব্যয় ও পুস্তক মূল্য
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>রিপোর্ট এক্সপোর্ট (CSV)</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">সম্পদের নাম</th>
                    <th className="px-3 py-3">ক্যাটাগরি</th>
                    <th className="px-3 py-3 text-right">ক্রয়মূল্য</th>
                    <th className="px-3 py-3 text-right">অবশিষ্ট মূল্য</th>
                    <th className="px-3 py-3">মেয়াদ</th>
                    <th className="px-3 py-3 text-right">মাসিক অবচয়</th>
                    <th className="px-3 py-3 text-right">বাৎসরিক অবচয়</th>
                    <th className="px-3 py-3 text-right">পুঞ্জীভূত অবচয়</th>
                    <th className="px-3 py-3 text-right">নিট পুস্তক মূল্য</th>
                    <th className="px-4 py-3 text-center">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetsWithMetrics.map(({ asset, metrics }) => {
                    const catMeta = ASSET_CATEGORIES.find((c) => c.id === asset.category);
                    return (
                      <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">{asset.name}</td>
                        <td className="px-3 py-3 text-slate-600">{catMeta?.nameBn || asset.category}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-800">{formatCurrency(asset.purchase_cost)}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{formatCurrency(asset.salvage_value)}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {asset.useful_life} {asset.useful_life_unit === 'years' ? 'বছর' : 'মাস'}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-blue-700">{formatCurrency(metrics.monthlyDepreciation)}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-700">{formatCurrency(metrics.annualDepreciation)}</td>
                        <td className="px-3 py-3 text-right font-bold text-rose-600">{formatCurrency(metrics.accumulatedDepreciation)}</td>
                        <td className="px-3 py-3 text-right font-black text-emerald-700">{formatCurrency(metrics.netBookValue)}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              metrics.isFullyDepreciated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {metrics.isFullyDepreciated ? 'সম্পূর্ণ অবচয়িত' : 'সক্রিয়'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-slate-900" colSpan={2}>
                      সর্বমোট (Total) — {fixedAssets.length}টি সম্পদ
                    </td>
                    <td className="px-3 py-3 text-right text-slate-900">
                      {formatCurrency(fixedAssetsSummary.totalGrossAssets)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {formatCurrency(fixedAssetsSummary.totalSalvageValue)}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right text-blue-800">
                      {formatCurrency(fixedAssetsSummary.totalMonthlyDepreciation)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-800">
                      {formatCurrency(fixedAssetsSummary.totalAnnualDepreciation)}
                    </td>
                    <td className="px-3 py-3 text-right text-rose-700">
                      {formatCurrency(fixedAssetsSummary.totalAccumulatedDepreciation)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-800">
                      {formatCurrency(fixedAssetsSummary.totalNetBookValue)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BALANCE SHEET & FINANCIAL POSITION (Requirement 7)                 */}
      {/* ========================================================================= */}
      {activeTab === 'balance_sheet' && (
        <div className="space-y-5">
          {/* Main Statement Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs max-w-3xl">
            <div className="border-b border-slate-200/80 pb-3 mb-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                আর্থিক বিবরণী / ব্যালেন্স শীট অবস্থান (Financial Position)
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                স্থায়ী সম্পদ উপস্থাপন (Fixed Assets Presentation)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                আদর্শ হিসাববিজ্ঞান নীতি অনুসারে ব্যালেন্স শীটে স্থাবর সম্পদের হিসাব
              </p>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-700 font-sans font-medium">
                  মোট স্থাবর সম্পদ ক্রয়মূল্য (Gross Fixed Assets)
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(fixedAssetsSummary.totalGrossAssets)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-rose-600">
                <span className="font-sans font-medium">
                  বাদ: পুঞ্জীভূত অবচয় (Less: Accumulated Depreciation)
                </span>
                <span className="font-bold">
                  − {formatCurrency(fixedAssetsSummary.totalAccumulatedDepreciation)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 bg-emerald-50/80 px-3.5 rounded-xl text-emerald-900 border border-emerald-200">
                <span className="font-sans font-bold text-base">
                  নিট স্থায়ী সম্পদ / পুস্তক মূল্য (Net Fixed Assets)
                </span>
                <span className="font-black text-lg text-emerald-800">
                  {formatCurrency(fixedAssetsSummary.totalNetBookValue)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800">অ্যাকাউন্টিং নোট:</strong> মূলধনী ব্যয়ের (CapEx) মোট {formatCurrency(fixedAssetsSummary.totalGrossAssets)} টাকা ব্যালেন্স শীটে ব্যবসায়ের সম্পদ হিসেবে অন্তর্ভুক্ত রয়েছে। এর মধ্যে {formatCurrency(fixedAssetsSummary.totalAccumulatedDepreciation)} টাকা এ পর্যন্ত লাভ-ক্ষতি (P&L)-এ অবচয় খরচ হিসেবে দেখানো হয়েছে। ব্যবসায়ের অবশিষ্ট খাঁটি সম্পদ মূল্য হলো {formatCurrency(fixedAssetsSummary.totalNetBookValue)} টাকা।
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                ক্যাটাগরিভিত্তিক স্থায়ী সম্পদের বিভাজন (Category Breakdown)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">ক্যাটাগরি (Category)</th>
                    <th className="px-3 py-2.5 text-center">সংখ্যা</th>
                    <th className="px-3 py-2.5 text-right">মোট ক্রয়মূল্য (Gross)</th>
                    <th className="px-3 py-2.5 text-right">পুঞ্জীভূত অবচয় (Dep.)</th>
                    <th className="px-4 py-2.5 text-right">নিট মূল্য (Net NBV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryBreakdown.map((c) => (
                    <tr key={c.catId} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {c.nameBn} <span className="text-[10px] text-slate-400 font-normal">({c.nameEn})</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600">{c.count}টি</td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatCurrency(c.gross)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-rose-600">{formatCurrency(c.accumDep)}</td>
                      <td className="px-4 py-2.5 text-right font-black text-emerald-700">{formatCurrency(c.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CAPEX VS OPEX GUIDE (Requirement 2)                                */}
      {/* ========================================================================= */}
      {activeTab === 'capex_guide' && (
        <div className="space-y-4 max-w-4xl">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ব্যবসায়ের খরচ বিভাজন: OpEx (পরিচালন ব্যয়) বনাম CapEx (মূলধনী ব্যয়)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              সঠিক হিসাববিজ্ঞান নীতির অন্যতম ভিত্তি হলো পরিচালন ব্যয় ও মূলধনী ব্যয়ের মধ্যে পরিষ্কার পার্থক্য বজায় রাখা। ভুলভাবে মূলধনী ব্যয়কে তাৎক্ষণিক খরচ দেখালে ব্যবসায়ের চলতি মাসের মুনাফা কৃত্রিমভাবে অনেক কমে যায়।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpEx Card */}
            <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
                  OpEx — Operating Expense
                </span>
                <span className="text-xs font-semibold text-rose-700">পরিচালন ব্যয়</span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">দৈনন্দিন ব্যবসা পরিচালনার নিয়মিত খরচ</h4>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  <strong>বৈশিষ্ট্য:</strong> স্বল্পমেয়াদী খরচ যার সুবিধা চলতি মাসেই শেষ হয়ে যায়।
                </p>
                <p>
                  <strong>উদাহরণ:</strong> দোকান ভাড়া, কর্মচারীর বেতন, বিদ্যুৎ বিল, ইন্টারনেট বিল, বিজ্ঞাপন, যাতায়াত ভাড়া, সাধারণ রক্ষণাবেক্ষণ।
                </p>
                <p>
                  <strong>হিসাবরক্ষণ প্রভাব:</strong> যে মাসে খরচ হয়, সেই মাসের লাভ-ক্ষতি (Profit & Loss) থেকে সম্পূর্ণ টাকা তাৎক্ষণিকভাবে ব্যয় হিসেবে বিয়োগ হয়।
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 text-[11px] text-rose-800 font-medium">
                👉 খরচের হিসাবে (Expense Tracker) এন্ট্রি করা হয়।
              </div>
            </div>

            {/* CapEx Card */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                  CapEx — Capital Expenditure
                </span>
                <span className="text-xs font-semibold text-emerald-700">মূলধনী ব্যয়</span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">দীর্ঘমেয়াদী সম্পদ অর্জন ও বৃদ্ধির খরচ</h4>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  <strong>বৈশিষ্ট্য:</strong> দীর্ঘমেয়াদী সম্পদ যার সুফল ১ বছরের বেশি সময় ধরে ব্যবসাকে সুবিধা দেয়।
                </p>
                <p>
                  <strong>উদাহরণ:</strong> দোকান ঘর/জমি, কম্পিউটার, ডেলিভারি ভ্যান বা বাইক, কারখানা মেশিনারি, দোকানের ইন্টেরিয়র/ডেকোরেশন, স্থায়ী সরঞ্জাম।
                </p>
                <p>
                  <strong>হিসাবরক্ষণ প্রভাব:</strong> ক্রয়ের টাকা সরাসরি ব্যালেন্স শীটে <em>স্থায়ী সম্পদ (Asset)</em> হিসেবে জমা হয়। পুরো টাকা একবারে খরচ হয় না; বরং ব্যবহারযোগ্য মেয়াদ ধরে প্রতি মাসে সমান হারে <em>অবচয় (Depreciation)</em> হিসেবে লাভ-ক্ষতিতে ব্যয় বণ্টিত হয়।
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-medium">
                👉 স্থায়ী সম্পদ ও অবচয় (Fixed Assets) রেজিস্টারে এন্ট্রি করা হয়।
              </div>
            </div>
          </div>

          {/* Real Life Example Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              বাস্তব উদাহরণ: ৳১,২০,০০০ টাকার একটি কম্পিউটার ক্রয়
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-rose-400 font-bold block mb-1">ভুল পদ্ধতি (সাধারণ খরচ ধরলে):</span>
                <p className="leading-relaxed">
                  যদি পুরো ৳১,২০,০০০ টাকা চলতি মাসের খরচে দেখানো হয়, তবে ওই মাসে ব্যবসায়ের মুনাফা শূন্য বা বড় লোকসান দেখাবে, যা অবাস্তব। কারণ কম্পিউটারটি আগামী ৫ বছর ধরে ব্যবসা পরিচালনায় সাহায্য করবে।
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-emerald-500/40">
                <span className="text-emerald-400 font-bold block mb-1">সঠিক CapEx পদ্ধতি (সহজ ব্যবসায় যা হয়):</span>
                <p className="leading-relaxed">
                  কম্পিউটারটিকে ব্যালেন্স শীটে ৳১,২০,০০০ টাকার স্থায়ী সম্পদ হিসেবে রাখা হয়। যদি মেয়াদ ৫ বছর (৬০ মাস) এবং অবশিষ্ট মূল্য ৳২০,০০০ ধরা হয়, তবে প্রতি মাসে অবচয় খরচ হবে:
                  <span className="text-emerald-300 font-bold block mt-1">
                    (১,২০,০০০ − ২০,০০০) ÷ ৬০ = ৳১,৬৬৬.৬৭/মাস
                  </span>
                  চলতি মাসের লাভ থেকে কেবল এই ৳১,৬৬৬.৬৭ টাকা অবচয় খরচ কাটা যাবে!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Fixed Asset Modal */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setAssetToEdit(null);
        }}
        assetToEdit={assetToEdit}
      />

      {/* Asset Detail & Schedule Modal */}
      <AssetDetailModal
        isOpen={Boolean(assetToView)}
        onClose={() => setAssetToView(null)}
        asset={assetToView}
        onEdit={(asset) => {
          setAssetToEdit(asset);
          setIsFormModalOpen(true);
        }}
        onDelete={(asset) => {
          setAssetToDelete(asset);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(assetToDelete)}
        title="স্থায়ী সম্পদ মুছে ফেলার নিশ্চয়তা"
        message={
          assetToDelete
            ? `আপনি কি নিশ্চিতভাবে "${assetToDelete.name}" সম্পদটি মুছে ফেলতে চান? এর ফলে সংশ্লিষ্ট অবচয় হিসাব ও রেজিস্টার থেকেও এটি অপসারিত হবে।`
            : ''
        }
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        confirmVariant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setAssetToDelete(null)}
      />
    </div>
  );
};
