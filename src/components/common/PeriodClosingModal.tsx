import React from 'react';
import { Modal } from '../common/Modal';
import { DynamicProfitSummaryMetrics } from '../common/DynamicProfitSummaryCards';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Download,
  Printer,
  CheckCircle,
  TrendingUp,
  Receipt,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
} from 'lucide-react';

interface PeriodClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DynamicProfitSummaryMetrics;
  startDate: string;
  endDate: string;
  periodName: string;
}

export const PeriodClosingModal: React.FC<PeriodClosingModalProps> = ({
  isOpen,
  onClose,
  metrics,
  startDate,
  endDate,
  periodName,
}) => {
  const { profile } = useAuth();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const businessName = profile?.business_name || 'সহজ ব্যবসা (Shohoj Bebsha)';
  const dateRangeDisplay = startDate && endDate
    ? `${formatDate(startDate)} থেকে ${formatDate(endDate)}`
    : (startDate ? `${formatDate(startDate)} হতে শুরু` : 'সকল সময়ের হিসাব');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['সহজ ব্যবসা - হিসাব ক্লোজিং বিবরণী (Accounting Period Closing)'],
      ['ব্যবসার নাম', businessName],
      ['সময়কাল', periodName],
      ['তারিখ রেঞ্জ', dateRangeDisplay],
      ['তারিখ প্রস্তুত', new Date().toLocaleString('bn-BD')],
      [''],
      ['বিবরণ (Item)', 'পরিমাণ (টাকা/সংখ্যা)'],
      ['মোট বিক্রয় (Total Sales)', metrics.totalSales],
      ['পণ্য কেনার মূল খরচ (COGS)', metrics.cogs],
      ['মোট ব্যবসায়িক খরচ (Total Operating Expenses)', metrics.totalExpenses],
      ['স্বয়ংক্রিয় নির্দিষ্ট খরচ (Recurring Expenses)', metrics.recurringExpensesTotal || 0],
      ['গ্রস লাভ (Gross Profit)', metrics.grossProfit],
      ['নিট লাভ / ক্ষতি (Net Profit/Loss)', metrics.netProfit],
      ['নগদ আদায় (Cash Received)', metrics.cashReceived],
      ['মোট বকেয়া (Total Due)', metrics.totalDue],
      ['বিক্রয় রসিদ সংখ্যা (Sales Count)', metrics.salesCount || 0],
      ['খরচের সংখ্যা (Expenses Count)', metrics.expensesCount || 0],
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Period_Closing_Report_${startDate || 'all'}_${endDate || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('হিসাব ক্লোজিং রিপোর্ট (CSV) সফলভাবে ডাউনলোড হয়েছে!', 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="হিসাব ক্লোজ ও চূড়ান্ত বিবরণী (Close Accounting Period)"
      subtitle="নির্বাচিত সময়কালের সমাপ্তি হিসাব ও সমন্বিত লাভ-ক্ষতির বিস্তারিত বিবরণ"
      maxWidth="max-w-xl"
    >
      <div className="p-6 space-y-6">
        {/* Header Summary Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {businessName}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ক্লোজিং সারসংক্ষেপ ({periodName})</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-900">{dateRangeDisplay}</span>
          </div>
        </div>

        {/* Detailed Financial Breakdown Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between p-3 bg-white">
            <span className="font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              মোট বিক্রয় ও আয় (Total Sales)
            </span>
            <span className="font-bold text-slate-900 text-sm">{formatCurrency(metrics.totalSales)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white">
            <span className="font-medium text-slate-600 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              পণ্য কেনার মূল খরচ (COGS)
            </span>
            <span className="font-semibold text-slate-700">{formatCurrency(metrics.cogs)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/70 font-semibold">
            <span className="text-slate-700">মোট লাভ (Gross Profit = Sales - COGS)</span>
            <span className="text-slate-900 font-bold">{formatCurrency(metrics.grossProfit)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white">
            <span className="font-medium text-slate-600 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              মোট ব্যবসায়িক খরচ (Total Expenses)
            </span>
            <span className="font-bold text-rose-600 text-sm">{formatCurrency(metrics.totalExpenses)}</span>
          </div>

          {metrics.recurringExpensesTotal && metrics.recurringExpensesTotal > 0 ? (
            <div className="flex items-center justify-between px-3 py-2 bg-purple-50/30 text-[11px] text-purple-700">
              <span className="pl-6 font-medium">• স্বয়ংক্রিয় নির্দিষ্ট খরচ অন্তর্ভুক্ত:</span>
              <span className="font-semibold">{formatCurrency(metrics.recurringExpensesTotal)}</span>
            </div>
          ) : null}

          {/* Highlighted Net Profit */}
          <div className={`flex items-center justify-between p-3.5 ${
            metrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'
          }`}>
            <span className="font-bold text-sm flex items-center gap-1.5">
              {metrics.netProfit >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              )}
              চূড়ান্ত নিট লাভ / ক্ষতি (Net Profit)
            </span>
            <span className={`font-black text-base ${
              metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatCurrency(metrics.netProfit)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white">
            <span className="font-medium text-slate-600">নগদ আদায় (Cash Collected)</span>
            <span className="font-bold text-emerald-700">{formatCurrency(metrics.cashReceived)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white">
            <span className="font-medium text-slate-600">বকেয়া বাকি (Due Outstanding)</span>
            <span className="font-bold text-amber-600">{formatCurrency(metrics.totalDue)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন (Print)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV রিপোর্ট ডাউনলোড (Export)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
