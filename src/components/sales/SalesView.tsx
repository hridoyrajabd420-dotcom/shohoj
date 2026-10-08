import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Sale } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { generateInvoiceHtml } from '../../lib/pdfInvoiceGenerator';
import { DateRangePreset, getDateRangeFromPreset, isDateInRange, DATE_PRESETS } from '../../lib/dateRangeUtils';
import { DateRangeFilterBar } from '../common/DateRangeFilterBar';
import { DynamicProfitSummaryCards, DynamicProfitSummaryMetrics } from '../common/DynamicProfitSummaryCards';
import { PeriodClosingModal } from '../common/PeriodClosingModal';
import { SaleFormModal } from './SaleFormModal';
import { SaleDetailsModal } from './SaleDetailsModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Receipt,
  Download,
  FileCheck2,
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const { sales, expenses, products, customers, deleteSale, loading, businessSettings } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due'>('all');

  // Unified Date Filter
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const initialRange = useMemo(() => getDateRangeFromPreset('this_month'), []);
  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [saleForDetails, setSaleForDetails] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPeriodClosingModalOpen, setIsPeriodClosingModalOpen] = useState(false);

  // Filtered sales matching search, status filter, and unified date range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const prod = products.find((p) => p.id === s.product_id);
      const cust = customers.find((c) => c.id === s.customer_id);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (prod && (prod.product_name || prod.name).toLowerCase().includes(q)) ||
        (cust && cust.name.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = s.payment_status === statusFilter;
      }

      const matchesDate = isDateInRange(s.sale_date, startDate, endDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sales, products, customers, searchQuery, statusFilter, startDate, endDate]);

  // Product price map for COGS
  const productPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.id, Number(p.purchase_price || 0)));
    return map;
  }, [products]);

  // Filtered expenses in the same date range for dynamic net profit calculation
  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.expense_date || e.date, startDate, endDate));
  }, [expenses, startDate, endDate]);

  // Dynamic Metrics for summary cards & period closing
  const periodMetrics: DynamicProfitSummaryMetrics = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

    const cashReceived = filteredSales.reduce((acc, s) => {
      if (s.paid_amount !== undefined) return acc + Number(s.paid_amount);
      return acc + (s.payment_status === 'paid' ? Number(s.total_amount || 0) : 0);
    }, 0);

    const totalDue = filteredSales.reduce((acc, s) => {
      if (s.due_amount !== undefined) return acc + Number(s.due_amount);
      return acc + (s.payment_status === 'due' ? Number(s.total_amount || 0) : 0);
    }, 0);

    let cogs = 0;
    filteredSales.forEach((s) => {
      if (s.product_id && productPriceMap.has(s.product_id)) {
        cogs += Number(s.quantity || 0) * (productPriceMap.get(s.product_id) || 0);
      }
    });

    const totalExpenses = periodExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const recurringExpensesTotal = periodExpenses
      .filter((e) => e.is_recurring_auto || Boolean(e.recurring_expense_id))
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      totalSales,
      totalExpenses,
      cogs,
      grossProfit,
      netProfit,
      cashReceived,
      totalDue,
      salesCount: filteredSales.length,
      expensesCount: periodExpenses.length,
      recurringExpensesTotal,
    };
  }, [filteredSales, periodExpenses, productPriceMap]);

  const handleOpenEdit = (sale: Sale) => {
    setSaleToEdit(sale);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (sale: Sale) => {
    setSaleForDetails(sale);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteSale(saleToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('বিক্রয় রেকর্ড সফলভাবে মুছে ফেলা হয়েছে এবং স্টক পুনরুদ্ধার করা হয়েছে', 'success');
      setSaleToDelete(null);
    }
  };

  const handleDatePresetChange = (preset: DateRangePreset, start: string, end: string) => {
    setDatePreset(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    const range = getDateRangeFromPreset('this_month');
    setDatePreset('this_month');
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const periodLabelName = useMemo(() => {
    const found = DATE_PRESETS.find((p) => p.key === datePreset);
    return found ? `${found.labelBn} (${found.labelEn})` : 'নির্বাচিত সময়';
  }, [datePreset]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>বিক্রয় ও অর্ডার ব্যবস্থাপনা (Sales & Orders)</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {sales.length}টি ট্রানজ্যাকশন
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            গ্রাহকের কাছে পণ্য বিক্রয়, ক্যাশ মেমো, পরিশোধিত ও বকেয়া টাকার বিস্তারিত হিসাব
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSaleToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বিক্রয় রেকর্ড করুন (New Sale)</span>
        </button>
      </div>

      {/* Unified Date Range Filter Bar with Period Closing Button */}
      <DateRangeFilterBar
        preset={datePreset}
        startDate={startDate}
        endDate={endDate}
        onPresetChange={handleDatePresetChange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleResetFilters}
        extraRightAction={
          <button
            type="button"
            onClick={() => setIsPeriodClosingModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            title="নির্বাচিত সময়কালের সমাপ্তি হিসাব ও সমন্বিত লাভ-ক্ষতি ক্লোজ করুন"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>হিসাব ক্লোজ করুন (Close Period)</span>
          </button>
        }
      />

      {/* Dynamic Automated Summary Cards: Sales, COGS, Expenses, Net Profit, Cash Received & Due */}
      <DynamicProfitSummaryCards
        metrics={periodMetrics}
        periodLabel={periodLabelName}
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="পণ্য, গ্রাহক বা নোট দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সব ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            পরিশোধিত (Paid)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'due'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-700 hover:text-rose-800'
            }`}
          >
            বাকি (Due)
          </button>
        </div>
      </div>

      {/* Sales List Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">বিক্রয় তথ্য লোড হচ্ছে...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">কোনো বিক্রয় পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || startDate || endDate
              ? 'নির্বাচিত ফিল্টারের সাথে মিল রয়েছে এমন কোনো বিক্রয় মেলেনি।'
              : 'এখনো কোনো বিক্রয় রেকর্ড করা হয়নি। প্রথম বিক্রয় রেকর্ড করুন।'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSaleToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>বিক্রয় যোগ করুন</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">তারিখ</th>
                  <th className="px-4 py-3.5">পণ্য</th>
                  <th className="px-4 py-3.5">গ্রাহক</th>
                  <th className="px-4 py-3.5">পরিমাণ</th>
                  <th className="px-4 py-3.5">দর (৳)</th>
                  <th className="px-4 py-3.5">মোট মূল্য</th>
                  <th className="px-4 py-3.5">পেমেন্ট স্ট্যাটাস</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const prod = products.find((p) => p.id === sale.product_id);
                  const cust = customers.find((c) => c.id === sale.customer_id);

                  const dueVal = sale.due_amount !== undefined
                    ? Number(sale.due_amount)
                    : (sale.payment_status === 'due' ? Number(sale.total_amount) : 0);

                  const isPaid = dueVal <= 0 || sale.payment_status === 'paid';

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 max-w-[200px] truncate">
                        {prod ? prod.product_name || prod.name : 'Unknown Product'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {cust ? cust.name : <span className="text-slate-400 italic">সরাসরি ক্রেতা</span>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {sale.quantity} {prod?.unit || 'pcs'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {formatCurrency(sale.selling_price)}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>পরিশোধিত</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            <span>বকেয়া: {formatCurrency(dueVal)}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const html = generateInvoiceHtml({
                                sale,
                                product: prod,
                                customer: cust,
                                profile,
                                businessSettings,
                              });
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(html);
                                printWindow.document.close();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="ইনভয়েস ডাউনলোড / প্রিন্ট (Invoice)"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(sale)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="রসিদ ও বিস্তারিত দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sale)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="বিক্রয় এডিট করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSaleToDelete(sale)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="বিক্রয় রেকর্ড মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-bold">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-slate-600 text-right">
                    তালিকায় প্রদর্শিত মোট বিক্রয়:
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-black text-sm">
                    {formatCurrency(periodMetrics.totalSales)}
                  </td>
                  <td colSpan={2} className="px-5 py-3 text-slate-500">
                    আদায়: {formatCurrency(periodMetrics.cashReceived)} | বাকি: {formatCurrency(periodMetrics.totalDue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Sale Form Modal (Create / Edit) */}
      <SaleFormModal
        isOpen={isFormModalOpen}
        saleToEdit={saleToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setSaleToEdit(null);
        }}
      />

      {/* Sale Details & Receipt Modal */}
      <SaleDetailsModal
        isOpen={Boolean(saleForDetails)}
        sale={saleForDetails}
        product={products.find((p) => p.id === saleForDetails?.product_id)}
        customer={customers.find((c) => c.id === saleForDetails?.customer_id)}
        onEdit={(s) => {
          setSaleForDetails(null);
          handleOpenEdit(s);
        }}
        onDelete={(s) => {
          setSaleForDetails(null);
          setSaleToDelete(s);
        }}
        onClose={() => setSaleForDetails(null)}
      />

      {/* Accounting Period Closing Modal */}
      <PeriodClosingModal
        isOpen={isPeriodClosingModalOpen}
        onClose={() => setIsPeriodClosingModalOpen(false)}
        metrics={periodMetrics}
        startDate={startDate}
        endDate={endDate}
        periodName={periodLabelName}
      />

      {/* Delete Sale Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(saleToDelete)}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="বিক্রয় রেকর্ড মুছুন (Delete Sale)"
        message="আপনি কি নিশ্চিত যে এই বিক্রয় রেকর্ডটি মুছে ফেলতে চান? ডিলিট করলে পণ্যটির স্টক স্বয়ংক্রিয়ভাবে পুনরুদ্ধার হবে এবং গ্রাহকের বকেয়া সমন্বয় করা হবে।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
