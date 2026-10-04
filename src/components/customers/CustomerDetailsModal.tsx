import React from 'react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { User, Phone, Mail, MapPin, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react';

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
  const { sales, products } = useData();

  if (!customer) return null;

  // Find all sales associated with this customer
  const customerSales = sales.filter((s) => s.customer_id === customer.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${customer.name} - গ্রাহক বিবরণ ও খাতা`}
      subtitle="ক্রয়ের ইতিহাস ও বকেয়া সংক্রান্ত পূর্ণ তথ্য"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Customer Header Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <h4 className="text-base font-bold text-slate-900">{customer.name}</h4>
            </div>
            {customer.phone && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone}</span>
              </p>
            )}
            {customer.email && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.email}</span>
              </p>
            )}
            {customer.address && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.address}</span>
              </p>
            )}
          </div>

          <div className="flex sm:flex-col gap-3 text-right">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">মোট ক্রয়</span>
              <span className="text-sm font-black text-slate-900">
                {formatCurrency(customer.total_purchase)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-rose-500 font-semibold block uppercase">বর্তমান বকেয়া</span>
              <span className="text-sm font-black text-rose-600">
                {formatCurrency(customer.due_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>ক্রয়ের ইতিহাস (Purchase History) - {customerSales.length}টি বিক্রয়</span>
          </h5>

          {customerSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              এই গ্রাহকের জন্য কোনো রেকর্ডকৃত বিক্রয় পাওয়া যায়নি।
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">তারিখ</th>
                    <th className="px-3 py-2.5">পণ্য</th>
                    <th className="px-3 py-2.5">পরিমাণ</th>
                    <th className="px-3 py-2.5">মোট বিল</th>
                    <th className="px-3 py-2.5 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerSales.map((sale) => {
                    const prod = products.find((p) => p.id === sale.product_id);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-medium text-slate-600">
                          {formatDate(sale.sale_date)}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {prod ? (prod.product_name || prod.name) : 'অজানা পণ্য'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-600">
                          {sale.quantity}টি
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {sale.payment_status === 'paid' ? (
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
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </Modal>
  );
};
