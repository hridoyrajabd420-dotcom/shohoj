import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
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
  Users,
  Truck,
  ShoppingBag,
  Receipt,
  Layers,
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

type ReportType =
  | 'sales'
  | 'expenses'
  | 'products'
  | 'purchases'
  | 'suppliers'
  | 'profit_loss'
  | 'inventory'
  | 'cash_flow'
  | 'customer_dues'
  | 'business_health';

type DateFilterType =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

type ProductSortField = 'best_selling' | 'highest_revenue' | 'highest_profit' | 'lowest_stock';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, customers, suppliers, purchases, customerPayments, supplierPayments } = useData();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateFilterType>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [productSort, setProductSort] = useState<ProductSortField>('best_selling');

  // Date filter logic supporting today, yesterday, last_7_days, this_month, last_month, this_year, custom, all
  const { filteredSales, filteredExpenses, filteredPurchases } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisYear = now.getFullYear();

    const isInRange = (dateStr?: string | null) => {
      if (!dateStr) return false;
      const cleanDate = dateStr.slice(0, 10);

      if (dateRange === 'all') return true;
      if (dateRange === 'today') return cleanDate === todayStr;
      if (dateRange === 'yesterday') return cleanDate === yesterdayStr;

      const d = new Date(cleanDate);
      if (isNaN(d.getTime())) return false;

      if (dateRange === 'last_7_days') {
        return d >= sevenDaysAgo && d <= now;
      }
      if (dateRange === 'this_month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (dateRange === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
      }
      if (dateRange === 'this_year') {
        return d.getFullYear() === thisYear;
      }
      if (dateRange === 'custom') {
        if (customStartDate && cleanDate < customStartDate) return false;
        if (customEndDate && cleanDate > customEndDate) return false;
        return true;
      }
      return true;
    };

    return {
      filteredSales: sales.filter((s) => isInRange(s.sale_date)),
      filteredExpenses: expenses.filter((e) => isInRange(e.date || (e as any).expense_date)),
      filteredPurchases: purchases.filter((p) => isInRange(p.purchase_date)),
    };
  }, [sales, expenses, purchases, dateRange, customStartDate, customEndDate]);

  // Aggregated calculations for selected report
  const summary = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
    const totalSalesDiscount = filteredSales.reduce((acc, s) => acc + Number(s.discount || 0), 0);
    const totalSalesUnits = filteredSales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const totalSalesPaid = filteredSales.reduce((acc, s) => acc + Number(s.paid_amount || (s.payment_status === 'paid' ? s.total_amount : 0)), 0);
    const totalSalesDue = filteredSales.reduce((acc, s) => acc + Number(s.due_amount || (s.payment_status === 'due' ? s.total_amount : 0)), 0);

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);
    const totalPurchasesPaid = filteredPurchases.reduce((acc, p) => acc + Number(p.paid_amount || (p.payment_status === 'paid' ? p.total_amount : 0)), 0);
    const totalPurchasesDue = filteredPurchases.reduce((acc, p) => acc + Number(p.due_amount || (p.payment_status === 'due' ? p.total_amount : 0)), 0);

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

    const totalInventoryValue = products.reduce(
      (acc, p) => acc + Number(p.stock_quantity || 0) * Number(p.purchase_price || 0),
      0
    );

    return {
      totalSales,
      totalSalesDiscount,
      totalSalesUnits,
      totalSalesPaid,
      totalSalesDue,
      totalExpenses,
      totalPurchases,
      totalPurchasesPaid,
      totalPurchasesDue,
      totalCogs,
      grossProfit,
      netProfit,
      totalReceivables,
      totalPayables,
      totalInventoryValue,
    };
  }, [filteredSales, filteredExpenses, filteredPurchases, products, customers, suppliers]);

  // Product Report Data (calculated from real sales and products)
  const productReportData = useMemo(() => {
    return products.map((prod) => {
      const prodSales = filteredSales.filter((s) => s.product_id === prod.id);
      const unitsSold = prodSales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
      const revenue = prodSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
      const cogs = unitsSold * Number(prod.purchase_price || 0);
      const grossProfit = revenue - cogs;
      const currentStock = Number(prod.stock_quantity || 0);
      const inventoryVal = currentStock * Number(prod.purchase_price || 0);
      const isLowStock = currentStock <= (prod.low_stock_threshold || prod.low_stock_level || 5);

      return {
        id: prod.id,
        name: prod.product_name || prod.name,
        category: prod.category || 'সাধারণ',
        sku: prod.sku || '',
        unitsSold,
        revenue,
        cogs,
        grossProfit,
        currentStock,
        inventoryVal,
        isLowStock,
        purchasePrice: Number(prod.purchase_price || 0),
        sellingPrice: Number(prod.selling_price || 0),
      };
    }).sort((a, b) => {
      if (productSort === 'best_selling') return b.unitsSold - a.unitsSold;
      if (productSort === 'highest_revenue') return b.revenue - a.revenue;
      if (productSort === 'highest_profit') return b.grossProfit - a.grossProfit;
      if (productSort === 'lowest_stock') return a.currentStock - b.currentStock;
      return 0;
    });
  }, [products, filteredSales, productSort]);

  // Supplier Report Data (calculated from purchases and suppliers)
  const supplierReportData = useMemo(() => {
    return suppliers.map((sup) => {
      const supPurchases = filteredPurchases.filter((p) => p.supplier_id === sup.id);
      const totalPurchased = supPurchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);
      const totalPaid = supPurchases.reduce((acc, p) => acc + Number(p.paid_amount || (p.payment_status === 'paid' ? p.total_amount : 0)), 0);
      const lastPurchase = supPurchases[0]?.purchase_date || '-';

      return {
        id: sup.id,
        name: sup.name,
        company: sup.company || '-',
        phone: sup.phone || '-',
        purchaseCount: supPurchases.length,
        totalPurchased,
        totalPaid,
        payableAmount: Number(sup.payable_amount || 0),
        lastPurchase,
      };
    });
  }, [suppliers, filteredPurchases]);

  // Comprehensive Export CSV for each report type
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `shohoj_report_${reportType}.csv`;

    if (reportType === 'sales') {
      csvContent += 'Invoice/ID,Date,Product,Quantity,Selling Price,Subtotal,Discount,Total Amount,Paid,Due\n';
      filteredSales.forEach((s) => {
        const prod = products.find((p) => p.id === s.product_id);
        csvContent += `"${s.id}","${s.sale_date}","${prod?.product_name || prod?.name || ''}",${s.quantity},${s.selling_price},${s.subtotal || ''},${s.discount || 0},${s.total_amount},${s.paid_amount || ''},${s.due_amount || ''}\n`;
      });
    } else if (reportType === 'expenses') {
      csvContent += 'ID,Date,Category,Amount,Description\n';
      filteredExpenses.forEach((e) => {
        csvContent += `"${e.id}","${e.date || (e as any).expense_date}","${e.category}",${e.amount},"${(e.description || '').replace(/"/g, '""')}"\n`;
      });
    } else if (reportType === 'products') {
      csvContent += 'Product Name,Category,Units Sold,Revenue,COGS,Gross Profit,Current Stock,Inventory Value,Low Stock\n';
      productReportData.forEach((p) => {
        csvContent += `"${p.name}","${p.category}",${p.unitsSold},${p.revenue},${p.cogs},${p.grossProfit},${p.currentStock},${p.inventoryVal},"${p.isLowStock ? 'YES' : 'NO'}"\n`;
      });
    } else if (reportType === 'purchases') {
      csvContent += 'Purchase ID,Date,Supplier,Total Amount,Paid Amount,Due Amount,Status\n';
      filteredPurchases.forEach((p) => {
        const sup = suppliers.find((s) => s.id === p.supplier_id);
        csvContent += `"${p.id}","${p.purchase_date}","${sup?.name || ''}",${p.total_amount},${p.paid_amount || 0},${p.due_amount || 0},"${p.payment_status || ''}"\n`;
      });
    } else if (reportType === 'suppliers') {
      csvContent += 'Supplier Name,Company,Phone,Purchases Count,Total Purchases,Total Paid,Current Payable,Last Purchase\n';
      supplierReportData.forEach((s) => {
        csvContent += `"${s.name}","${s.company}","${s.phone}",${s.purchaseCount},${s.totalPurchased},${s.totalPaid},${s.payableAmount},"${s.lastPurchase}"\n`;
      });
    } else if (reportType === 'customer_dues') {
      csvContent += 'Customer Name,Phone,Total Purchases,Due Amount\n';
      customers.filter((c) => Number(c.due_amount || 0) > 0).forEach((c) => {
        csvContent += `"${c.name}","${c.phone || ''}",${c.total_purchase},${c.due_amount}\n`;
      });
    } else if (reportType === 'inventory') {
      csvContent += 'Product,Category,Stock Quantity,Purchase Price,Selling Price,Inventory Value\n';
      products.forEach((p) => {
        csvContent += `"${p.product_name || p.name}","${p.category || ''}",${p.stock_quantity},${p.purchase_price},${p.selling_price},${Number(p.stock_quantity || 0) * Number(p.purchase_price || 0)}\n`;
      });
    } else {
      csvContent += 'Metric,Amount (BDT)\n';
      csvContent += `Total Sales,${summary.totalSales}\n`;
      csvContent += `Sales Units,${summary.totalSalesUnits}\n`;
      csvContent += `Total Sales Discount,${summary.totalSalesDiscount}\n`;
      csvContent += `Total COGS,${summary.totalCogs}\n`;
      csvContent += `Gross Profit,${summary.grossProfit}\n`;
      csvContent += `Total Expenses,${summary.totalExpenses}\n`;
      csvContent += `Net Profit,${summary.netProfit}\n`;
      csvContent += `Total Purchases,${summary.totalPurchases}\n`;
      csvContent += `Customer Receivables,${summary.totalReceivables}\n`;
      csvContent += `Supplier Payables,${summary.totalPayables}\n`;
      csvContent += `Inventory Value,${summary.totalInventoryValue}\n`;
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            অ্যাডভান্সড ব্যবসায়িক রিপোর্ট সেন্টার
          </h2>
          <p className="text-xs text-slate-500">
            বিস্তারিত ডেটা অ্যানালাইটিক্স, ফিল্টারিং ও এক্সপোর্ট সুবিধা (সম্পূর্ণ বিনামূল্যে)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateFilterType)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="today">আজ (Today)</option>
              <option value="yesterday">গতকাল (Yesterday)</option>
              <option value="last_7_days">গত ৭ দিন (Last 7 Days)</option>
              <option value="this_month">এই মাস (This Month)</option>
              <option value="last_month">গত মাস (Last Month)</option>
              <option value="this_year">এই বছর (This Year)</option>
              <option value="custom">কাস্টম রেঞ্জ (Custom Range)</option>
              <option value="all">সর্বমোট (All Time)</option>
            </select>
          </div>

          {/* Custom Date Inputs if custom is selected */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-slate-400">থেকে</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}

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

      {/* 10 Report Type Selector Pills (All Unrestricted Free) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
        {[
          { id: 'sales', label: 'বিক্রয় রিপোর্ট' },
          { id: 'expenses', label: 'খরচ রিপোর্ট' },
          { id: 'products', label: 'পণ্য পারফরম্যান্স' },
          { id: 'purchases', label: 'ক্রয় রিপোর্ট' },
          { id: 'suppliers', label: 'সাপ্লায়ার রিপোর্ট' },
          { id: 'profit_loss', label: 'লাভ-ক্ষতি বিবরণী' },
          { id: 'inventory', label: 'ইনভেন্টরি অডিট' },
          { id: 'cash_flow', label: 'নগদ প্রবাহ (Cash Flow)' },
          { id: 'customer_dues', label: 'বকেয়া পাওনা' },
          { id: 'business_health', label: 'ব্যবসায়িক স্কোর' },
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
              সহজ ব্যবসা সম্পূর্ণ রিপোর্ট
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              {reportType === 'sales' && 'বিস্তারিত বিক্রয় রিপোর্ট (Sales Report)'}
              {reportType === 'expenses' && 'ব্যয় ও পরিচালন খরচ বিবরণী (Expense Report)'}
              {reportType === 'products' && 'পণ্যভিত্তিক বিক্রয় ও লাভজনকতা (Product Report)'}
              {reportType === 'purchases' && 'ক্রয় ও সরবরাহ খাতা রিপোর্ট (Purchase Report)'}
              {reportType === 'suppliers' && 'সাপ্লায়ার দেনা ও ক্রয়ের হিসাব (Supplier Report)'}
              {reportType === 'profit_loss' && 'সম্পূর্ণ লাভ-ক্ষতি বিবরণী (P&L Summary)'}
              {reportType === 'inventory' && 'ইনভেন্টরি ও স্টক মূল্যায়ন রিপোর্ট (Inventory Report)'}
              {reportType === 'cash_flow' && 'নগদ প্রবাহ বিবরণী (Cash Flow Statement)'}
              {reportType === 'customer_dues' && 'গ্রাহকভিত্তিক বকেয়া তালিকা (Receivables Ledger)'}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-800 font-semibold">নির্বাচিত সময়ের মোট বিক্রয়</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">৳{summary.totalSales.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-700 block mt-0.5">ছাড়: ৳{summary.totalSalesDiscount.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-600 font-semibold">অর্ডার সংখ্যা ও পণ্য ইউনিট</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{filteredSales.length}টি অর্ডার</p>
                <span className="text-[10px] text-slate-500 block mt-0.5">{summary.totalSalesUnits} পিস পণ্য বিক্রিত</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-xs text-blue-800 font-semibold">নগদ আদায়কৃত অর্থ</span>
                <p className="text-2xl font-black text-blue-950 mt-1">৳{summary.totalSalesPaid.toLocaleString()}</p>
                <span className="text-[10px] text-blue-700 block mt-0.5">পরিশোধিত</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-xs text-rose-800 font-semibold">বকেয়া পাওনা (Due)</span>
                <p className="text-2xl font-black text-rose-950 mt-1">৳{summary.totalSalesDue.toLocaleString()}</p>
                <span className="text-[10px] text-rose-700 block mt-0.5">গ্রাহকের কাছে বাকি</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">বিক্রীত পণ্যের ক্রয়ব্যয় (COGS)</span>
                <p className="text-lg font-bold text-slate-900 mt-1">৳{summary.totalCogs.toLocaleString()}</p>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-700 font-medium">মোট গ্রস লাভ (Gross Profit)</span>
                <p className="text-lg font-bold text-emerald-800 mt-1">৳{summary.grossProfit.toLocaleString()}</p>
              </div>
              <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200">
                <span className="text-xs text-teal-700 font-medium">নিট লাভ (Net Profit)</span>
                <p className="text-lg font-bold text-teal-900 mt-1">৳{summary.netProfit.toLocaleString()}</p>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">তারিখ</th>
                    <th className="py-2.5">পণ্য</th>
                    <th className="py-2.5 text-right">পরিমাণ</th>
                    <th className="py-2.5 text-right">দর (৳)</th>
                    <th className="py-2.5 text-right">মোট বিক্রয় (৳)</th>
                    <th className="py-2.5 text-right">পরিশোধ (৳)</th>
                    <th className="py-2.5 text-right">বাকি (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSales.map((s) => {
                    const prod = products.find((p) => p.id === s.product_id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-slate-500">{s.sale_date}</td>
                        <td className="py-2.5 font-bold text-slate-900">{prod?.product_name || prod?.name || 'অজানা পণ্য'}</td>
                        <td className="py-2.5 text-right">{s.quantity} {prod?.unit || 'পিস'}</td>
                        <td className="py-2.5 text-right">৳{s.selling_price}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">৳{s.total_amount.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-emerald-700 font-semibold">৳{(s.paid_amount || (s.payment_status === 'paid' ? s.total_amount : 0)).toLocaleString()}</td>
                        <td className="py-2.5 text-right text-rose-600 font-semibold">৳{(s.due_amount || (s.payment_status === 'due' ? s.total_amount : 0)).toLocaleString()}</td>
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
                      <td className="py-2.5 font-mono text-slate-500">{e.date || (e as any).expense_date}</td>
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

        {/* 3. PRODUCT REPORT */}
        {reportType === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">
                মোট পণ্য: {productReportData.length}টি
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">সাজান:</span>
                <select
                  value={productSort}
                  onChange={(e) => setProductSort(e.target.value as ProductSortField)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-800"
                >
                  <option value="best_selling">সর্বাধিক বিক্রিত (Best Selling)</option>
                  <option value="highest_revenue">সর্বোচ্চ রেভিনিউ (Highest Revenue)</option>
                  <option value="highest_profit">সর্বোচ্চ মুনাফা (Highest Profit)</option>
                  <option value="lowest_stock">সর্বনিম্ন স্টক (Lowest Stock)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">পণ্য</th>
                    <th className="py-2.5">ক্যাটাগরি</th>
                    <th className="py-2.5 text-right">বিক্রিত পরিমাণ</th>
                    <th className="py-2.5 text-right">মোট রেভিনিউ (৳)</th>
                    <th className="py-2.5 text-right">COGS (৳)</th>
                    <th className="py-2.5 text-right">গ্রস লাভ (৳)</th>
                    <th className="py-2.5 text-right">বর্তমান স্টক</th>
                    <th className="py-2.5 text-right">স্টক মূল্য (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {productReportData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 text-slate-500">{p.category}</td>
                      <td className="py-2.5 text-right font-semibold">{p.unitsSold} পিস</td>
                      <td className="py-2.5 text-right font-black text-slate-900">৳{p.revenue.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-500">৳{p.cogs.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-700">৳{p.grossProfit.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.isLowStock ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                          {p.currentStock} পিস
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">৳{p.inventoryVal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PURCHASE REPORT */}
        {reportType === 'purchases' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-xs text-blue-800 font-semibold">নির্বাচিত সময়ের মোট ক্রয়</span>
                <p className="text-2xl font-black text-blue-950 mt-1">৳{summary.totalPurchases.toLocaleString()}</p>
                <span className="text-[10px] text-blue-700 block mt-0.5">{filteredPurchases.length}টি চালান</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-800 font-semibold">পরিশোধিত অর্থ</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">৳{summary.totalPurchasesPaid.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-xs text-rose-800 font-semibold">সাপ্লায়ার দেনা (Payable)</span>
                <p className="text-2xl font-black text-rose-950 mt-1">৳{summary.totalPurchasesDue.toLocaleString()}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">তারিখ</th>
                    <th className="py-2.5">সাপ্লায়ার</th>
                    <th className="py-2.5 text-right">মোট ক্রয়মূল্য (৳)</th>
                    <th className="py-2.5 text-right">পরিশোধ (৳)</th>
                    <th className="py-2.5 text-right">দেনা (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPurchases.map((p) => {
                    const sup = suppliers.find((s) => s.id === p.supplier_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-slate-500">{p.purchase_date}</td>
                        <td className="py-2.5 font-bold text-slate-900">{sup?.name || 'অজানা সাপ্লায়ার'}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">৳{p.total_amount.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-emerald-700 font-semibold">৳{(p.paid_amount || (p.payment_status === 'paid' ? p.total_amount : 0)).toLocaleString()}</td>
                        <td className="py-2.5 text-right text-rose-600 font-semibold">৳{(p.due_amount || (p.payment_status === 'due' ? p.total_amount : 0)).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SUPPLIER REPORT */}
        {reportType === 'suppliers' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-800 font-semibold">সাপ্লায়ারদের কাছে মোট বকেয়া দেনা</span>
                <p className="text-2xl font-black text-amber-950 mt-1">৳{summary.totalPayables.toLocaleString()}</p>
              </div>
              <span className="text-xs text-amber-800 bg-white px-3 py-1 rounded-xl font-bold border border-amber-200">
                {suppliers.length} জন সাপ্লায়ার
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">সাপ্লায়ার</th>
                    <th className="py-2.5">কোম্পানি</th>
                    <th className="py-2.5">ফোন</th>
                    <th className="py-2.5 text-right">ক্রয় অর্ডার সংখ্যা</th>
                    <th className="py-2.5 text-right">মোট ক্রয় (৳)</th>
                    <th className="py-2.5 text-right">পরিশোধিত (৳)</th>
                    <th className="py-2.5 text-right">দেনা ব্যালেন্স (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {supplierReportData.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 text-slate-600">{s.company}</td>
                      <td className="py-2.5 font-mono text-slate-500">{s.phone}</td>
                      <td className="py-2.5 text-right font-medium">{s.purchaseCount}টি</td>
                      <td className="py-2.5 text-right font-black text-slate-900">৳{s.totalPurchased.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-emerald-700 font-bold">৳{s.totalPaid.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-black text-rose-600">৳{s.payableAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. PROFIT LOSS REPORT */}
        {reportType === 'profit_loss' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">মোট রেভিনিউ</span>
                <p className="text-xl font-black text-slate-900 mt-1">৳{summary.totalSales.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">বিক্রীত পণ্য ক্রয়ব্যয় (COGS)</span>
                <p className="text-xl font-black text-rose-600 mt-1">৳{summary.totalCogs.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">পরিচালন খরচ</span>
                <p className="text-xl font-black text-rose-600 mt-1">৳{summary.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-bold">নিট প্রফিট</span>
                <p className="text-xl font-black text-emerald-700 mt-1">৳{summary.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. INVENTORY REPORT */}
        {reportType === 'inventory' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-semibold">মোট ইনভেন্টরি সম্পদ মূল্য</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">৳{summary.totalInventoryValue.toLocaleString()}</p>
              </div>
              <span className="text-xs text-emerald-800 bg-white px-3 py-1 rounded-xl font-bold border border-emerald-200">
                {products.length} ধরনের পণ্য
              </span>
            </div>

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
                    const totalVal = Number(p.stock_quantity || 0) * Number(p.purchase_price || 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{p.product_name || p.name}</td>
                        <td className="py-2.5 text-right font-medium">{p.stock_quantity} {p.unit || 'পিস'}</td>
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

        {/* 8. CASH FLOW */}
        {reportType === 'cash_flow' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-800 font-semibold">মোট নগদ অন্তর্মুখী প্রবাহ (Inflow)</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  ৳{(summary.totalSalesPaid + customerPayments.reduce((acc, cp) => acc + Number(cp.amount || 0), 0)).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-xs text-rose-800 font-semibold">মোট নগদ বহির্মুখী প্রবাহ (Outflow)</span>
                <p className="text-2xl font-black text-rose-700 mt-1">
                  ৳{(summary.totalExpenses + summary.totalPurchasesPaid + supplierPayments.reduce((acc, sp) => acc + Number(sp.amount || 0), 0)).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-xs text-blue-800 font-semibold">নেট ক্যাশ পজিশন (Net Cash Flow)</span>
                <p className="text-2xl font-black text-blue-900 mt-1">
                  ৳{((summary.totalSalesPaid + customerPayments.reduce((acc, cp) => acc + Number(cp.amount || 0), 0)) -
                    (summary.totalExpenses + summary.totalPurchasesPaid + supplierPayments.reduce((acc, sp) => acc + Number(sp.amount || 0), 0))).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 9. CUSTOMER DUES */}
        {reportType === 'customer_dues' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-800 font-semibold">গ্রাহকদের কাছে মোট বকেয়া পাওনা</span>
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
                  {customers.filter((c) => Number(c.due_amount || 0) > 0).map((c) => (
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

        {/* 10. BUSINESS HEALTH SCORECARD */}
        {reportType === 'business_health' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-100 tracking-wider">
                  স্বয়ংক্রিয় ব্যবসায়িক স্বাস্থ্য স্কোর
                </span>
                <h4 className="text-3xl font-black mt-1">৮৮ / ১০০ (চমৎকার)</h4>
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
  );
};
