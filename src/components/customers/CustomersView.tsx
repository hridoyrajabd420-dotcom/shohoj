import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Eye,
  AlertCircle,
  Filter,
  DollarSign,
  CheckCircle,
  CreditCard,
} from 'lucide-react';

interface CustomersViewProps {
  onNavigateToUpgrade?: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onNavigateToUpgrade }) => {
  const { customers, sales, deleteCustomer, loading } = useData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerForDetails, setCustomerForDetails] = useState<Customer | null>(null);
  const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filtered customers (search by name, phone, or address)
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchesDue = filterDueOnly ? Number(c.due_amount || 0) > 0 : true;

      return matchesSearch && matchesDue;
    });
  }, [customers, searchQuery, filterDueOnly]);

  const totalDueSum = useMemo(() => {
    return customers.reduce((acc, c) => acc + Number(c.due_amount || 0), 0);
  }, [customers]);

  const totalPurchasesSum = useMemo(() => {
    return customers.reduce((acc, c) => acc + Number(c.total_purchase || 0), 0);
  }, [customers]);

  const dueCustomerCount = useMemo(() => {
    return customers.filter((c) => Number(c.due_amount || 0) > 0).length;
  }, [customers]);

  const handleEdit = (c: Customer) => {
    setCustomerToEdit(c);
    setIsFormModalOpen(true);
  };

  const handleOpenAdd = () => {
    setCustomerToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (c: Customer) => {
    // Check safety upfront
    const linkedSales = sales.filter((s) => s.customer_id === c.id);
    if (linkedSales.length > 0) {
      showToast(
        `সতর্কতা: "${c.name}"-এর সাথে ${linkedSales.length}টি বিক্রয় রেকর্ড যুক্ত রয়েছে। বিক্রয় বিদ্যমান থাকা অবস্থায় গ্রাহক মোছা সম্ভব নয়।`,
        'error'
      );
      return;
    }

    if (Number(c.due_amount || 0) > 0) {
      showToast(
        `সতর্কতা: "${c.name}"-এর কাছে এখনও ৳ ${c.due_amount} বকেয়া পাওনা রয়েছে। বকেয়া পরিশোধ না করে গ্রাহক মুছে ফেলা সম্ভব নয়।`,
        'error'
      );
      return;
    }

    setCustomerToDelete(c);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    const { error } = await deleteCustomer(customerToDelete.id);
    setDeleteLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('গ্রাহক রেকর্ড সফলভাবে মুছে ফেলা হয়েছে', 'success');
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>গ্রাহক ও বাকির খাতা (Customer Management)</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {customers.length} জন গ্রাহক
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            গ্রাহকের নাম, মোবাইল নম্বর, ক্রয়ের ইতিহাস ও বকেয়া আদায়ের হিসাব
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন গ্রাহক যোগ করুন (Add Customer)</span>
        </button>
      </div>

      {/* Due & Customer Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট নিবন্ধিত গ্রাহক</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {customers.length} জন
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">নিয়মিত ও বাকি খাতার গ্রাহক</p>
        </div>

        {/* Total Due Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">সর্বমোট বকেয়া পাওনা (Total Due)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600">
            {formatCurrency(totalDueSum)}
          </div>
          <p className="text-[11px] text-rose-700/80 mt-0.5 font-medium">
            {dueCustomerCount} জন গ্রাহকের কাছে পাওনা
          </p>
        </div>

        {/* Total Customer Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট বিক্রিত পণ্যের মূল্য</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatCurrency(totalPurchasesSum)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">গ্রাহকদের মোট লেনদেন</p>
        </div>
      </div>

      {/* Due Alert Notice Banner */}
      {dueCustomerCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>সতর্কতা:</strong> {dueCustomerCount} জন গ্রাহকের কাছে মোট <strong>{formatCurrency(totalDueSum)}</strong> বকেয়া পাওনা রয়েছে।
            </span>
          </div>
          <button
            onClick={() => setFilterDueOnly(!filterDueOnly)}
            className="text-xs font-bold text-rose-900 bg-white/80 px-3 py-1.5 rounded-lg border border-rose-300 hover:bg-white transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            {filterDueOnly ? 'সকল গ্রাহক দেখুন' : 'শুধুমাত্র বাকিদারদের দেখুন'}
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-medium shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          <button
            onClick={() => setFilterDueOnly(false)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              !filterDueOnly
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সকল গ্রাহক ({customers.length})
          </button>
          <button
            onClick={() => setFilterDueOnly(true)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              filterDueOnly
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-700 hover:text-rose-800'
            }`}
          >
            <span>বকেয়া পাওনা রয়েছে</span>
            {dueCustomerCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full font-bold">
                {dueCustomerCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">গ্রাহক তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">কোনো গ্রাহক পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || filterDueOnly
              ? 'অনুসন্ধানের শর্ত অনুযায়ী কোনো গ্রাহক মেলেনি। ফিল্টার রিসেট করুন।'
              : 'আপনার গ্রাহক তালিকা বর্তমানে খালি। প্রথম গ্রাহক যোগ করতে ক্লিক করুন।'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>গ্রাহক যোগ করুন</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">গ্রাহকের নাম</th>
                  <th className="px-4 py-3.5">মোবাইল নম্বর</th>
                  <th className="px-4 py-3.5">ঠিকানা ও নোট</th>
                  <th className="px-4 py-3.5 text-right">মোট ক্রয় (৳)</th>
                  <th className="px-4 py-3.5 text-right">বকেয়া পাওনা (৳)</th>
                  <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const hasDue = Number(c.due_amount || 0) > 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Initial Badge */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{c.name}</div>
                            {c.email && (
                              <div className="text-[11px] text-slate-400">{c.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {c.phone ? (
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">নম্বর নেই</span>
                        )}
                      </td>

                      {/* Address & Notes */}
                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px]">
                        {c.address ? (
                          <div className="flex items-center gap-1 truncate" title={c.address}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">ঠিকানা নেই</span>
                        )}
                        {c.notes && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5" title={c.notes}>
                            নোট: {c.notes}
                          </p>
                        )}
                      </td>

                      {/* Total Purchase */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(c.total_purchase)}
                      </td>

                      {/* Due Amount */}
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`font-black text-sm ${
                            hasDue
                              ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 inline-block'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatCurrency(c.due_amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Collect Due Button */}
                          {hasDue && (
                            <button
                              onClick={() => setCustomerForPayment(c)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="বকেয়া আদায় রেকর্ড করুন"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>আদায়</span>
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => setCustomerForDetails(c)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="ক্রয় ও পেমেন্ট ইতিহাস দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="গ্রাহকের তথ্য সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteRequest(c)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="গ্রাহক মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                <tr>
                  <td colSpan={3} className="px-5 py-3 text-right text-slate-600">
                    মোট তালিকাভুক্ত বকেয়া পাওনা:
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">
                    {formatCurrency(totalPurchasesSum)}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-600 text-sm">
                    {formatCurrency(totalDueSum)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
      />

      {/* Customer Purchase & Payment History Modal */}
      <CustomerDetailsModal
        isOpen={Boolean(customerForDetails)}
        onClose={() => setCustomerForDetails(null)}
        customer={customerForDetails}
        onNavigateToUpgrade={onNavigateToUpgrade}
      />

      {/* Quick Record Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(customerForPayment)}
        onClose={() => setCustomerForPayment(null)}
        customer={customerForPayment}
      />

      {/* Delete Customer Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="গ্রাহক মুছে ফেলুন (Delete Customer)"
        message={`আপনি কি নিশ্চিত যে "${customerToDelete?.name}" গ্রাহকের রেকর্ডটি মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
        cancelText="বাতিল"
        loading={deleteLoading}
      />
    </div>
  );
};
