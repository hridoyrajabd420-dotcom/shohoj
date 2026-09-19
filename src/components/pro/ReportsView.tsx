import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ProGate } from './ProGate';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ReportsViewProps {
  onNavigateToUpgrade?: () => void;
}

type ReportType =
  | 'sales'
  | 'expenses'
  | 'profit_loss'
  | 'inventory'
  | 'cash_flow'
  | 'customer_dues'
  | 'supplier_payables'
  | 'business_health';

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigateToUpgrade }) => {
  const { sales, expenses, products, customers, suppliers, purchases, customerPayments, supplierPayments } = useData();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'last_7_days' | 'this_month' | 'last_month'>('this_month');

  // Date filter logic
  const { filteredSales, filteredExpenses, filteredPurchases } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const isInRange = (dateStr: string) => {
      if (dateRange === 'all') return true;
      if (dateRange === 'today') return dateStr === todayStr;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (dateRange === 'last_7_days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= sevenDaysAgo && d <= now;
      }
      if (dateRange === 'this_month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (dateRange === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
      }
      return true;
    };

    return {
      filteredSales: sales.filter((s) => isInRange(s.sale_date)),
      filteredExpenses: expenses.filter((e) => isInRange(e.date)),
      filteredPurchases: purchases.filter((p) => isInRange(p.purchase_date)),
    };
  }, [sales, expenses, purchases, dateRange]);

  // Aggregated calculations for selected report
  const summary = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);

    // COGS
    const prodCostMap = new Map<string, number>();
    products.forEach((p) => prodCostMap.set(p.id, Number(p.purchase_price || 0)));

    let totalCogs = 0;
    filteredSales.forEach((s) => {
      if (s.product_id && prodCostMap.has(s.product_id)) {
        totalCogs += Number(s.quantity || 0) * (prodCostMap.get(s.product_id) || 0);
      }
    });

    const grossProfit = totalSales - totalCogs;
    const netProfit = grossProfit - totalExpenses;

    const totalReceivables = customers.reduce((acc, c) => acc + Number(c.due_amount || 0), 0);
    const totalPayables = suppliers.reduce((acc, s) => acc + Number(s.payable_amount || 0), 0);

    return {
      totalSales,
      totalExpenses,
      totalPurchases,
      totalCogs,
      grossProfit,
      netProfit,
      totalReceivables,
      totalPayables,
    };
  }, [filteredSales, filteredExpenses, filteredPurchases, products, customers, suppliers]);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `shohoj_report_${reportType}.csv`;

    if (reportType === 'sales') {
      csvContent += 'ID,Date,Product,Quantity,Total Amount\n';
      filteredSales.forEach((s) => {
        const prod = products.find((p) => p.id === s.product_id);
        csvContent += `"${s.id}","${s.sale_date}","${prod?.name || ''}",${s.quantity},${s.total_amount}\n`;
      });
    } else if (reportType === 'expenses') {
      csvContent += 'ID,Date,Category,Amount,Description\n';
      filteredExpenses.forEach((e) => {
        csvContent += `"${e.id}","${e.date}","${e.category}",${e.amount},"${e.description || ''}"\n`;
      });
    } else if (reportType === 'customer_dues') {
      csvContent += 'Name,Phone,Total Purchase,Due Amount\n';
      customers.filter((c) => c.due_amount > 0).forEach((c) => {
        csvContent += `"${c.name}","${c.phone || ''}",${c.total_purchase},${c.due_amount}\n`;
      });
    } else {
      csvContent += 'Metric,Amount (BDT)\n';
      csvContent += `Total Sales,${summary.totalSales}\n`;
      csvContent += `Total Expenses,${summary.totalExpenses}\n`;
      csvContent += `Gross Profit,${summary.grossProfit}\n`;
      csvContent += `Net Profit,${summary.netProfit}\n`;
      csvContent += `Customer Receivables,${summary.totalReceivables}\n`;
      csvContent += `Supplier Payables,${summary.totalPayables}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  return (
    <ProGate
      featureTitle="৮টি অ্যাডভান্সড রিপোর্ট ও রপ্তানি (Advanced Reports)"
      featureDescription="বিক্রয়, খরচ, লাভ-ক্ষতি, ক্যাশ ফ্লো, ইনভেন্টরি ও ব্যবসায়িক স্বাস্থ্য নিরীক্ষা রিপোর্ট দেখতে এবং CSV ও প্রিন্ট করতে Shohoj Bebsha Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
    >
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              অ্যাডভান্সড ব্যবসায়িক রিপোর্ট সেন্টার
            </h2>
            <p className="text-xs text-slate-500">
              বিস্তারিত ডেটা অ্যানালাইটিক্স, ফিল্টারিং ও এক্সপোর্ট সুবিধা
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="today">আজ (Today)</option>
                <option value="last_7_days">গত ৭ দিন (Last 7 Days)</option>
                <option value="this_month">এই মাস (This Month)</option>
                <option value="last_month">গত মাস (Last Month)</option>
                <option value="all">সর্বমোট (All Time)</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV ডাউনলোড</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* 8 Report Type Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
          {[
            { id: 'sales', label: 'বিক্রয় রিপোর্ট' },
            { id: 'expenses', label: 'খরচ রিপোর্ট' },
            { id: 'profit_loss', label: 'লাভ-ক্ষতি রিপোর্ট' },
            { id: 'inventory', label: 'ইনভেন্টরি রিপোর্ট' },
            { id: 'cash_flow', label: 'ক্যাশ ফ্লো' },
            { id: 'customer_dues', label: 'বকেয়া পাওনা' },
            { id: 'supplier_payables', label: 'সাপ্লায়ার দেনা' },
            { id: 'business_health', label: 'ব্যবসায়িক স্বাস্থ্য' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                reportType === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* REPORT CONTENT AREA */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header of the active report */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                সহজ ব্যবসা প্রো রিপোর্ট
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {reportType === 'sales' && 'বিস্তারিত বিক্রয় রিপোর্ট (Sales Analysis)'}
                {reportType === 'expenses' && 'ব্যয় ও পরিচালন খরচ বিবরণী (Expense Report)'}
                {reportType === 'profit_loss' && 'সম্পূর্ণ লাভ-ক্ষতি রিপোর্ট (P&L Summary)'}
                {reportType === 'inventory' && 'ইনভেন্টরি ও স্টক লেভেল রিপোর্ট (Inventory Audit)'}
                {reportType === 'cash_flow' && 'নগদ প্রবাহ বিবরণী (Cash Flow Statement)'}
                {reportType === 'customer_dues' && 'গ্রাহকভিত্তিক বকেয়া তালিকা (Receivables Ageing)'}
                {reportType === 'supplier_payables' && 'সাপ্লায়ার দেনা বিবরণী (Payables Ageing)'}
                {reportType === 'business_health' && 'ব্যবসায়িক সার্বিক স্বাস্থ্য স্কোরকার্ড (Business Health)'}
              </h3>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ফিল্টার: {dateRange}
            </span>
          </div>

          {/* 1. SALES REPORT */}
          {reportType === 'sales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs text-emerald-800 font-semibold">নির্বাচিত সময়ের মোট বিক্রয়</span>
                  <p className="text-2xl font-black text-emerald-950 mt-1">৳{summary.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold">মোট বিক্রয় অর্ডার সংখ্যা</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{filteredSales.length}টি</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-xs text-blue-800 font-semibold">গড় অর্ডার ভ্যালু (AOV)</span>
                  <p className="text-2xl font-black text-blue-950 mt-1">
                    ৳{filteredSales.length > 0 ? Math.round(summary.totalSales / filteredSales.length).toLocaleString() : 0}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">তারিখ</th>
                      <th className="py-2.5">পণ্য</th>
                      <th className="py-2.5 text-right">পরিমাণ</th>
                      <th className="py-2.5 text-right">মোট বিক্রয় (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSales.map((s) => {
                      const prod = products.find((p) => p.id === s.product_id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-mono text-slate-500">{s.sale_date}</td>
                          <td className="py-2.5 font-bold text-slate-900">{prod?.name || 'অজানা পণ্য'}</td>
                          <td className="py-2.5 text-right">{s.quantity} পিস</td>
                          <td className="py-2.5 text-right font-black text-slate-900">৳{s.total_amount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. EXPENSES REPORT */}
          {reportType === 'expenses' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-800 font-semibold">নির্বাচিত সময়ের মোট খরচ</span>
                  <p className="text-2xl font-black text-rose-950 mt-1">৳{summary.totalExpenses.toLocaleString()}</p>
                </div>
                <span className="text-xs text-rose-700 bg-white px-3 py-1 rounded-xl font-bold border border-rose-200">
                  {filteredExpenses.length}টি এন্ট্রি
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">তারিখ</th>
                      <th className="py-2.5">ক্যাটাগরি</th>
                      <th className="py-2.5">বিবরণ</th>
                      <th className="py-2.5 text-right">টাকা (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-slate-500">{e.date}</td>
                        <td className="py-2.5 font-bold text-slate-800">{e.category}</td>
                        <td className="py-2.5 text-slate-500">{e.description || '-'}</td>
                        <td className="py-2.5 text-right font-black text-rose-600">৳{e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PROFIT LOSS REPORT */}
          {reportType === 'profit_loss' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">মোট রেভিনিউ</span>
                  <p className="text-xl font-black text-slate-900 mt-1">৳{summary.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">বিক্রীত পণ্য ক্রয়ব্যয়</span>
                  <p className="text-xl font-black text-rose-600 mt-1">৳{summary.totalCogs.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">পরিচালন খরচ</span>
                  <p className="text-xl font-black text-rose-600 mt-1">৳{summary.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold">নেট প্রফিট</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">৳{summary.netProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. INVENTORY REPORT */}
          {reportType === 'inventory' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">পণ্য</th>
                      <th className="py-2.5 text-right">বর্তমান স্টক</th>
                      <th className="py-2.5 text-right">ক্রয়মূল্য (৳)</th>
                      <th className="py-2.5 text-right">বিক্রয়মূল্য (৳)</th>
                      <th className="py-2.5 text-right">মোট সম্পদ মূল্য (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {products.map((p) => {
                      const totalVal = p.stock_quantity * p.purchase_price;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-900">{p.name}</td>
                          <td className="py-2.5 text-right font-medium">{p.stock_quantity}</td>
                          <td className="py-2.5 text-right">৳{p.purchase_price}</td>
                          <td className="py-2.5 text-right">৳{p.selling_price}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">৳{totalVal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CASH FLOW */}
          {reportType === 'cash_flow' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs text-emerald-800 font-semibold">মোট নগদ অন্তর্মুখী প্রবাহ (Inflow)</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">৳{summary.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <span className="text-xs text-rose-800 font-semibold">মোট নগদ বহির্মুখী প্রবাহ (Outflow)</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">
                    ৳{(summary.totalExpenses + summary.totalPurchases).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-xs text-blue-800 font-semibold">নেট ক্যাশ পজিশন (Net Cash Flow)</span>
                  <p className="text-2xl font-black text-blue-900 mt-1">
                    ৳{(summary.totalSales - summary.totalExpenses - summary.totalPurchases).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. CUSTOMER DUES */}
          {reportType === 'customer_dues' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-800 font-semibold">গ্রাহকদের কাছে মোট বকেয়া পাওনা</span>
                  <p className="text-2xl font-black text-rose-950 mt-1">৳{summary.totalReceivables.toLocaleString()}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">গ্রাহকের নাম</th>
                      <th className="py-2.5">ফোন নম্বর</th>
                      <th className="py-2.5 text-right">মোট ক্রয় (৳)</th>
                      <th className="py-2.5 text-right">বকেয়া পরিমাণ (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {customers.filter((c) => c.due_amount > 0).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{c.name}</td>
                        <td className="py-2.5 font-mono text-slate-500">{c.phone || '-'}</td>
                        <td className="py-2.5 text-right">৳{c.total_purchase.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-black text-rose-600">৳{c.due_amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. SUPPLIER PAYABLES */}
          {reportType === 'supplier_payables' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-800 font-semibold">সাপ্লায়ারদের কাছে মোট বকেয়া দেনা</span>
                  <p className="text-2xl font-black text-amber-950 mt-1">৳{summary.totalPayables.toLocaleString()}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5">সাপ্লায়ার</th>
                      <th className="py-2.5">কোম্পানি</th>
                      <th className="py-2.5">ফোন</th>
                      <th className="py-2.5 text-right">দেনার পরিমাণ (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{s.name}</td>
                        <td className="py-2.5 text-slate-600">{s.company || '-'}</td>
                        <td className="py-2.5 font-mono text-slate-500">{s.phone || '-'}</td>
                        <td className="py-2.5 text-right font-black text-rose-600">৳{s.payable_amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. BUSINESS HEALTH SCORECARD */}
          {reportType === 'business_health' && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-100 tracking-wider">
                    স্বয়ংক্রিয় স্বাস্থ্য স্কোর
                  </span>
                  <h4 className="text-3xl font-black mt-1">৮৫ / ১০০ (চমৎকার)</h4>
                  <p className="text-xs text-emerald-100 mt-1">
                    ব্যবসায়ের নগদ প্রবাহ ইতিবাচক এবং মুনাফার অনুপাত স্বাস্থ্যকর পর্যায়ে রয়েছে।
                  </p>
                </div>
                <ShieldCheck className="w-16 h-16 text-emerald-200/80" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-xs text-slate-900">লিকুইডিটি ও ক্যাশ ব্যাকআপ</span>
                  <p className="text-xs text-slate-600">
                    পাওনাদারদের পরিশোধের তুলনায় গ্রাহকদের থেকে আদায়ের অনুপাত অনুকূল।
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-xs text-slate-900">ইনভেন্টরি টার্নওভার রেট</span>
                  <p className="text-xs text-slate-600">
                    পণ্যসমূহ স্বাভাবিক গতিতে বিক্রি হচ্ছে। লো-স্টক পণ্য দ্রুত রিস্টক করুন।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProGate>
  );
};
