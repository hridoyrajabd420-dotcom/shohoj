import React, { useState } from 'react';
import { Customer, CustomerPayment } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { RecordPaymentModal } from './RecordPaymentModal';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  CreditCard,
  Trash2,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { sales, products, customerPayments, deleteCustomerPayment, recalculateCustomerDue } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'payments'>('sales');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<CustomerPayment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  if (!customer) return null;

  // Filter sales for this customer
  const customerSales = sales.filter((s) => s.customer_id === customer.id);

  // Filter payment records for this customer
  const customerPaymentRecords = customerPayments.filter((p) => p.customer_id === customer.id);

  // Financial calculations
  const totalSalesAmount = customerSales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const totalPaidAtSales = customerSales.reduce((acc, s) => acc + Number(s.paid_amount || 0), 0);
  const totalCollectedViaPayments = customerPaymentRecords.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    const { error } = await recalculateCustomerDue(customer.id);
    setRecalcLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('গ্রাহকের বকেয়ার হিসাব সফলভাবে পুনর্গণনা করা হয়েছে', 'success');
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteCustomerPayment(paymentToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('পেমেন্ট রেকর্ড মুছে বকেয়া ব্যালেন্স পুনরায় যোগ করা হয়েছে', 'success');
      setPaymentToDelete(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${customer.name} - গ্রাহক বিবরণ ও খাতা`}
        subtitle="ক্রয়ের ইতিহাস, বকেয়া আদায়ের হিসাব এবং খাতার পূর্ণ তথ্য"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          {/* Customer Header Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                  {customer.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">{customer.name}</h4>
                  {customer.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">{customer.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-600">
                {customer.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.address}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions & Due Status */}
            <div className="flex sm:flex-col items-end gap-2 shrink-0">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-right w-full sm:w-auto">
                <span className="text-[10px] text-rose-500 font-bold block uppercase tracking-wider">
                  বর্তমান মোট বকেয়া পাওনা
                </span>
                <span className="text-lg font-black text-rose-600">
                  {formatCurrency(customer.due_amount)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {Number(customer.due_amount || 0) > 0 && (
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>বকেয়া আদায়</span>
                  </button>
                )}

                <button
                  onClick={handleRecalculate}
                  disabled={recalcLoading}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="প্রকৃত বিক্রয় ও আদায় থেকে বকেয়ার হিসাব পুনরায় মিলান"
                >
                  <RefreshCw className={`w-4 h-4 ${recalcLoading ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Dues & Financial Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">মোট ক্রয় বিল</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(totalSalesAmount || customer.total_purchase)}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">বিক্রয়কালীন পরিশোধ</span>
              <span className="text-sm font-black text-emerald-700">{formatCurrency(totalPaidAtSales)}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">পরবর্তী বকেয়া আদায়</span>
              <span className="text-sm font-black text-blue-700">{formatCurrency(totalCollectedViaPayments)}</span>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">অবশিষ্ট বকেয়া</span>
              <span className="text-sm font-black text-rose-600">{formatCurrency(customer.due_amount)}</span>
            </div>
          </div>

          {/* Tabs: Sales vs Payments */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('sales')}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sales'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ক্রয়ের ইতিহাস ({customerSales.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'payments'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>বকেয়া পরিশোধের ইতিহাস ({customerPaymentRecords.length})</span>
            </button>
          </div>

          {/* TAB 1: Sales Purchase History */}
          {activeTab === 'sales' && (
            <div className="space-y-2">
              {customerSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  এই গ্রাহকের জন্য কোনো রেকর্ডকৃত বিক্রয় পাওয়া যায়নি।
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-3 py-2.5">তারিখ</th>
                          <th className="px-3 py-2.5">পণ্য</th>
                          <th className="px-3 py-2.5 text-center">পরিমাণ</th>
                          <th className="px-3 py-2.5 text-right">মোট বিল</th>
                          <th className="px-3 py-2.5 text-right">পরিশোধ</th>
                          <th className="px-3 py-2.5 text-right">বকেয়া</th>
                          <th className="px-3 py-2.5 text-right">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerSales.map((sale) => {
                          const prod = products.find((p) => p.id === sale.product_id);
                          const due = Number(sale.due_amount || 0);
                          return (
                            <tr key={sale.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                                {formatDate(sale.sale_date)}
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-slate-800">
                                {prod ? (prod.product_name || prod.name) : 'অজানা পণ্য'}
                              </td>
                              <td className="px-3 py-2.5 text-center font-medium text-slate-600">
                                {sale.quantity}টি
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                                {formatCurrency(sale.total_amount)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                                {formatCurrency(sale.paid_amount || 0)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-rose-600">
                                {formatCurrency(due)}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                {sale.payment_status === 'paid' || due <= 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>পরিশোধিত</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    <Clock className="w-3 h-3" />
                                    <span>বাকি</span>
                                  </span>
                                )}
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

          {/* TAB 2: Payment History */}
          {activeTab === 'payments' && (
            <div className="space-y-2">
              {customerPaymentRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <p>এই গ্রাহকের কোনো বকেয়া পরিশোধের ইতিহাস নেই।</p>
                  {Number(customer.due_amount || 0) > 0 && (
                    <button
                      onClick={() => setIsRecordPaymentOpen(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>প্রথম বকেয়া আদায় রেকর্ড করুন</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-3 py-2.5">তারিখ</th>
                          <th className="px-3 py-2.5">মাধ্যম</th>
                          <th className="px-3 py-2.5">বিবরণ / নোট</th>
                          <th className="px-3 py-2.5 text-right">আদায়ের পরিমাণ</th>
                          <th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerPaymentRecords.map((pay) => {
                          const displayDate = pay.payment_date || pay.date || pay.created_at || '';
                          return (
                            <tr key={pay.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                                {formatDate(displayDate)}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {pay.payment_method}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">
                                {pay.notes || <span className="text-slate-400 italic">নোট নেই</span>}
                              </td>
                              <td className="px-3 py-2.5 text-right font-black text-emerald-700 text-sm">
                                {formatCurrency(pay.amount)}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  onClick={() => setPaymentToDelete(pay)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="এই পেমেন্ট রেকর্ডটি মুছুন (বকেয়া পুনরায় যোগ হবে)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right text-slate-600">
                            মোট সংগৃহীত বকেয়া:
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-700 text-sm">
                            {formatCurrency(totalCollectedViaPayments)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            {Number(customer.due_amount || 0) > 0 ? (
              <button
                type="button"
                onClick={() => setIsRecordPaymentOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>বকেয়া আদায় জমা দিন (Collect Due)</span>
              </button>
            ) : (
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>এই গ্রাহকের সমস্ত বকেয়া পরিশোধিত</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        customer={customer}
      />

      {/* Delete Payment Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="পেমেন্ট রেকর্ড মুছে ফেলুন"
        message={`আপনি কি নিশ্চিত যে এই ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''} আদায়ের রেকর্ডটি মুছে ফেলতে চান? এটি মুছে দিলে গ্রাহকের বকেয়া ব্যালেন্স পুনরায় বৃদ্ধি পাবে।`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </>
  );
};
