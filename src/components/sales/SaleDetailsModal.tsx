import React from 'react';
import { Sale, Product, Customer } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../lib/formatters';
import {
  ShoppingCart,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Edit2,
  Trash2,
  FileText,
  Phone,
  MapPin,
  Tag,
  Package,
} from 'lucide-react';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  product?: Product;
  customer?: Customer;
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  isOpen,
  onClose,
  sale,
  product,
  customer,
  onEdit,
  onDelete,
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const qty = Number(sale.quantity) || 1;
  const price = Number(sale.selling_price) || 0;
  const subtotal = sale.subtotal !== undefined ? Number(sale.subtotal) : qty * price;
  const discount = Number(sale.discount) || 0;
  const totalAmount = Number(sale.total_amount) || Math.max(0, subtotal - discount);
  const paidAmount = sale.paid_amount !== undefined ? Number(sale.paid_amount) : (sale.payment_status === 'paid' ? totalAmount : 0);
  const dueAmount = sale.due_amount !== undefined ? Number(sale.due_amount) : (sale.payment_status === 'due' ? totalAmount : Math.max(0, totalAmount - paidAmount));
  const isPaid = dueAmount <= 0 || sale.payment_status === 'paid';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বিক্রয় রসিদ ও বিবরণ (Sale Details & Receipt)"
      subtitle={`বিক্রয় আইডি: ${sale.id.slice(0, 8)} • তারিখ: ${formatDate(sale.sale_date)}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 print:p-0">
        {/* Status & Date Bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">
              বিক্রয়ের তারিখ: <strong className="text-slate-900">{formatDate(sale.sale_date)}</strong>
            </span>
          </div>

          <div>
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>পরিশোধিত (Paid)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                <Clock className="w-3.5 h-3.5" />
                <span>বকেয়া (Due: {formatCurrency(dueAmount)})</span>
              </span>
            )}
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>ক্রেতার বিবরণ</span>
            </span>
            {customer && (
              <span className="text-emerald-700 font-semibold">নিবন্ধিত গ্রাহক</span>
            )}
          </div>

          {customer ? (
            <div className="pt-1">
              <h4 className="text-base font-black text-slate-900">{customer.name}</h4>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{customer.phone}</span>
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{customer.address}</span>
                  </span>
                )}
                <span className="font-semibold text-slate-700">
                  গ্রাহকের মোট বকেয়া: <span className={customer.due_amount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{formatCurrency(customer.due_amount)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-1 text-xs text-slate-600 italic">
              সরাসরি ক্রেতা (Cash / Walk-in Customer)
            </div>
          )}
        </div>

        {/* Product & Item Details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>পণ্যের বিবরণ</span>
            </span>
            <span>হিসাব</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {product ? (product.product_name || product.name) : 'অজানা পণ্য'}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  {product?.sku && <span>SKU: {product.sku}</span>}
                  {product?.category && <span>• শ্রেণী: {product.category}</span>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{qty} {product?.unit || 'টি'}</span>
                <span className="text-xs text-slate-400 block">@ {formatCurrency(price)}</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>সাবটোটাল ({qty} × {formatCurrency(price)})</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>ছাড় / ডিসকাউন্ট</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-100">
                <span>সর্বমোট বিল (Total)</span>
                <span className="text-emerald-800">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>নগদ পরিশোধিত (Paid)</span>
                <span className="font-bold text-emerald-700">{formatCurrency(paidAmount)}</span>
              </div>

              {dueAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-black text-xs pt-1 border-t border-dashed border-slate-200">
                  <span>বকেয়া (Due)</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes if any */}
        {sale.notes && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>মন্তব্য / নোট:</span>
            </span>
            <p className="text-xs text-slate-700">{sale.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 print:hidden">
          <div className="flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(sale);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>এডিট করুন</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(sale);
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>মুছুন</span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট রসিদ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
