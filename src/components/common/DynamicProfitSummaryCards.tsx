import React from 'react';
import { formatCurrency } from '../../lib/formatters';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';

export interface DynamicProfitSummaryMetrics {
  totalSales: number;
  totalExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  cashReceived: number;
  totalDue: number;
  salesCount?: number;
  expensesCount?: number;
  recurringExpensesTotal?: number;
}

interface DynamicProfitSummaryCardsProps {
  metrics: DynamicProfitSummaryMetrics;
  periodLabel?: string;
}

export const DynamicProfitSummaryCards: React.FC<DynamicProfitSummaryCardsProps> = ({
  metrics,
  periodLabel,
}) => {
  const isNetProfitPositive = metrics.netProfit >= 0;
  const netMargin = metrics.totalSales > 0 ? (metrics.netProfit / metrics.totalSales) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Sales */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            মোট বিক্রয় (Sales)
          </span>
          <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {formatCurrency(metrics.totalSales)}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>{metrics.salesCount ?? 0}টি বিক্রয় রসিদ</span>
          {periodLabel && <span className="text-emerald-700 font-medium truncate max-w-[80px]">{periodLabel}</span>}
        </div>
      </div>

      {/* 2. COGS (Cost of Goods Sold) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" title="বিক্রিত পণ্যের আসল ক্রয়মূল্য">
            পণ্য কেনার খরচ (COGS)
          </span>
          <span className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
            <ShoppingBag className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 text-lg sm:text-xl font-black text-slate-700 tracking-tight">
          {formatCurrency(metrics.cogs)}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>মোট বিক্রিত পণ্যের ক্রয়মূল্য</span>
        </div>
      </div>

      {/* 3. Total Expenses (including recurring) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            মোট খরচ (Expenses)
          </span>
          <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
            <Receipt className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 text-lg sm:text-xl font-black text-rose-600 tracking-tight">
          {formatCurrency(metrics.totalExpenses)}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>{metrics.expensesCount ?? 0}টি ব্যয়ের হিসাব</span>
          {metrics.recurringExpensesTotal && metrics.recurringExpensesTotal > 0 ? (
            <span className="text-[10px] text-purple-600 font-semibold">
              স্বয়ংক্রিয়: {formatCurrency(metrics.recurringExpensesTotal)}
            </span>
          ) : null}
        </div>
      </div>

      {/* 4. Net Profit / Loss */}
      <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
        isNetProfitPositive
          ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300'
          : 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            isNetProfitPositive ? 'text-emerald-800' : 'text-rose-800'
          }`}>
            নিট লাভ / ক্ষতি (Net Profit)
          </span>
          <span className={`p-1.5 rounded-xl ${
            isNetProfitPositive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            {isNetProfitPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </span>
        </div>
        <div className={`mt-2 text-lg sm:text-xl font-black tracking-tight ${
          isNetProfitPositive ? 'text-emerald-800' : 'text-rose-700'
        }`}>
          {formatCurrency(metrics.netProfit)}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-semibold">
            মার্জিন: {netMargin.toFixed(1)}%
          </span>
          <span className="text-[10px] opacity-75">বিক্রয় - COGS - খরচ</span>
        </div>
      </div>

      {/* 5. Cash Received & Due */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            আদায় ও বকেয়া (Cash / Due)
          </span>
          <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 text-base font-black text-slate-900 tracking-tight flex items-baseline gap-1">
          <span className="text-emerald-700 font-black">{formatCurrency(metrics.cashReceived)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
          <span className="text-slate-400">বকেয়া:</span>
          <span className={`font-bold ${metrics.totalDue > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {formatCurrency(metrics.totalDue)}
          </span>
        </div>
      </div>
    </div>
  );
};
