import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ProGate } from './ProGate';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../types';
import {
  FileText,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Building2,
  Calendar,
} from 'lucide-react';

interface InvoicesViewProps {
  onNavigateToUpgrade?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onNavigateToUpgrade }) => {
  const { profile } = useAuth();
  const { invoices, customers, products, addInvoice, updateInvoiceStatus, businessSettings } = useData();
  const { showToast } = useToast();

  const [filterType, setFilterType] = useState<'all' | 'invoice' | 'quotation'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Create Invoice / Quotation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [docType, setDocType] = useState<'invoice' | 'quotation'>('invoice');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 'item-1', name: '', description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('পণ্য বা সেবার জন্য ধন্যবাদ। আপনার ভবিষ্যৎ ব্যবসায়িক সাফল্যে সহজ ব্যবসা পাশে আছে।');
  const [isSaving, setIsSaving] = useState(false);

  // Printable ref
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-fill customer details
  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || '');
      setCustomerAddress(c.address || '');
    }
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        current.name = prod.name;
        current.description = prod.name;
        current.unit_price = prod.selling_price;
      }
    } else if (field === 'description') {
      current.name = value;
      current.description = value;
    }

    current.total = Number(current.quantity || 0) * Number(current.unit_price || 0);
    newItems[index] = current;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, name: '', description: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations for Create Modal
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.total || 0), 0);
  }, [items]);

  const taxAmount = (subtotal * (taxPercent || 0)) / 100;
  const grandTotal = Math.max(0, subtotal - (discount || 0) + taxAmount);
  const dueCalculated = Math.max(0, grandTotal - (paidAmount || 0));

  // Handle Submit New Invoice / Quotation
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast('গ্রাহকের নাম আবশ্যক', 'error');
      return;
    }

    const validItems: InvoiceItem[] = items
      .filter((it) => (it.description?.trim() || it.name?.trim()) && it.quantity > 0)
      .map((it, idx) => ({
        id: it.id || `item-${Date.now()}-${idx}`,
        product_id: it.product_id,
        name: it.name || it.description || 'পণ্য',
        description: it.description || it.name || '',
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      }));

    if (validItems.length === 0) {
      showToast('কমপক্ষে একটি পণ্য বা বিবরণ যোগ করুন', 'error');
      return;
    }

    setIsSaving(true);
    let initialStatus: InvoiceStatus = 'due';
    if (docType === 'quotation') {
      initialStatus = 'draft';
    } else if (paidAmount >= grandTotal && grandTotal > 0) {
      initialStatus = 'paid';
    } else if (paidAmount > 0) {
      initialStatus = 'partially_paid';
    } else {
      initialStatus = 'due';
    }

    const res = await addInvoice({
      invoice_number: `${docType === 'quotation' ? 'QTN' : 'INV'}-${Date.now().toString().slice(-6)}`,
      type: docType,
      customer_id: customerId || null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_address: customerAddress.trim(),
      issue_date: issueDate,
      due_date: dueDate,
      items: validItems,
      subtotal,
      discount,
      discount_type: 'fixed',
      tax: taxAmount,
      vat_rate: taxPercent,
      vat_amount: taxAmount,
      total_amount: grandTotal,
      paid_amount: docType === 'invoice' ? paidAmount : 0,
      due_amount: docType === 'invoice' ? dueCalculated : 0,
      status: initialStatus,
      notes: notes.trim(),
    });

    setIsSaving(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(
        docType === 'invoice' ? 'ইনভয়েস সফলভাবে তৈরি হয়েছে!' : 'কোটেশন সফলভাবে সংরক্ষিত হয়েছে!',
        'success'
      );
      setIsCreateOpen(false);
      // Reset
      setItems([{ id: 'item-1', name: '', description: '', quantity: 1, unit_price: 0, total: 0 }]);
      setDiscount(0);
      setTaxPercent(0);
      setPaidAmount(0);
    }
  };

  // Filtered invoices
  const filteredList = useMemo(() => {
    return invoices
      .filter((inv) => (filterType === 'all' ? true : inv.type === filterType))
      .filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [invoices, filterType, searchTerm]);

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <ProGate
      featureTitle="প্রফেশনাল ইনভয়েস ও কোটেশন (Invoicing & Quotation)"
      featureDescription="ব্র্যান্ডেড ইনভয়েস জেনারেট, কোটেশন তৈরি, সরাসরি প্রিন্ট ও পিডিএফ ডাউনলোড এবং স্ট্যাটাস ট্র্যাকিংয়ের জন্য Shohoj Bebsha Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
    >
      <div className="space-y-6">
        {/* Header & Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm print:hidden">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              ইনভয়েস ও কোটেশন ব্যবস্থাপনা
            </h2>
            <p className="text-xs text-slate-500">
              কাস্টম বিল, চালান তৈরি, কোটেশন প্রেরণ ও সরাসরি গ্রাহক ইনভয়েস প্রিন্ট
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDocType('invoice');
                setIsCreateOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ইনভয়েস</span>
            </button>

            <button
              onClick={() => {
                setDocType('quotation');
                setIsCreateOpen(true);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>নতুন কোটেশন</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              সবগুলো ({invoices.length})
            </button>
            <button
              onClick={() => setFilterType('invoice')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'invoice'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ইনভয়েস ({invoices.filter((i) => i.type === 'invoice').length})
            </button>
            <button
              onClick={() => setFilterType('quotation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'quotation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              কোটেশন ({invoices.filter((i) => i.type === 'quotation').length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ইনভয়েস নং বা গ্রাহক নাম..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Invoice List Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-x-auto print:hidden">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              কোনো ইনভয়েস বা কোটেশন পাওয়া যায়নি। উপরের বাটন দিয়ে তৈরি করুন।
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">ডকুমেন্ট নং</th>
                  <th className="py-2.5">ধরন</th>
                  <th className="py-2.5">গ্রাহকের নাম</th>
                  <th className="py-2.5">তারিখ</th>
                  <th className="py-2.5 text-right">মোট টাকা (৳)</th>
                  <th className="py-2.5 text-right">বকেয়া (৳)</th>
                  <th className="py-2.5 text-center">স্ট্যাটাস</th>
                  <th className="py-2.5 text-center">ভিউ / প্রিন্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredList.map((inv) => {
                  const isInv = inv.type === 'invoice';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isInv
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isInv ? 'ইনভয়েস' : 'কোটেশন'}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{inv.customer_name}</td>
                      <td className="py-3 text-slate-500 font-mono">{inv.issue_date}</td>
                      <td className="py-3 text-right font-black text-slate-900">৳{inv.total_amount.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-rose-600">
                        {isInv ? `৳${inv.due_amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status === 'paid' && 'পরিশোধিত'}
                          {inv.status === 'partially_paid' && 'আংশিক বাকি'}
                          {inv.status === 'unpaid' && (isInv ? 'বকেয়া' : 'ড্রাফট')}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট ভিউ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PRINT / INVOICE PREVIEW MODAL */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Modal Top Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {selectedInvoice.type === 'invoice' ? 'ইনভয়েস ভিউ' : 'কোটেশন ভিউ'} ({selectedInvoice.invoice_number})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট / PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div ref={printRef} className="p-8 sm:p-10 bg-white text-slate-900 space-y-6">
                {/* Business Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <h1 className="text-2xl font-black text-emerald-700">
                      {profile?.business_name || 'সহজ ব্যবসা'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">{profile?.business_type || 'জেনারেল ট্রেডিং'}</p>
                    <p className="text-xs text-slate-500 font-mono">ফোন: {profile?.phone || '০১৭XXXXXXXX'}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black uppercase tracking-wider text-slate-800">
                      {selectedInvoice.type === 'invoice' ? 'INVOICE / বিল' : 'QUOTATION / কোটেশন'}
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                      #{selectedInvoice.invoice_number}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">তারিখ: {selectedInvoice.issue_date}</p>
                    {selectedInvoice.due_date && (
                      <p className="text-xs text-slate-500">মেয়াদ: {selectedInvoice.due_date}</p>
                    )}
                  </div>
                </div>

                {/* Customer Bill To */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">গ্রাহকের বিবরণ (Bill To):</span>
                    <p className="font-bold text-sm text-slate-900 mt-1">{selectedInvoice.customer_name}</p>
                    <p className="text-slate-600 font-mono">{selectedInvoice.customer_phone}</p>
                    <p className="text-slate-500">{selectedInvoice.customer_address}</p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">পেমেন্ট স্ট্যাটাস:</span>
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                          selectedInvoice.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedInvoice.status === 'partially_paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {selectedInvoice.status === 'paid' && 'পরিশোধিত (PAID)'}
                        {selectedInvoice.status === 'partially_paid' && 'আংশিক বাকি (PARTIAL)'}
                        {selectedInvoice.status === 'unpaid' && 'বকেয়া (UNPAID)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">ক্রম</th>
                        <th className="py-2.5 px-3">বিবরণ / পণ্যের নাম</th>
                        <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                        <th className="py-2.5 px-3 text-right">দর (৳)</th>
                        <th className="py-2.5 px-3 text-right">মোট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {item.description || item.name || 'পণ্য'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">৳{item.unit_price}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">৳{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>সাবটোটাল:</span>
                      <span>৳{selectedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>ছাড় / ডিসকাউন্ট:</span>
                        <span>-৳{selectedInvoice.discount.toLocaleString()}</span>
                      </div>
                    )}
                    {(selectedInvoice.tax ?? selectedInvoice.vat_amount ?? 0) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>ভ্যাট / ট্যাক্স:</span>
                        <span>+৳{(selectedInvoice.tax ?? selectedInvoice.vat_amount ?? 0).toLocaleString()}</span>
                      </div>
                    )}
                    <hr className="border-slate-200 my-1" />
                    <div className="flex justify-between font-black text-sm text-slate-900">
                      <span>সর্বমোট:</span>
                      <span>৳{selectedInvoice.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>পরিশোধিত:</span>
                      <span>৳{selectedInvoice.paid_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>বকেয়া পাওনা:</span>
                      <span>৳{selectedInvoice.due_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes & Footer */}
                <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-4">
                  <p className="italic">{selectedInvoice.notes || 'সহজ ব্যবসার মাধ্যমে প্রস্তুতকৃত।'}</p>
                  <div className="flex justify-between items-end pt-8">
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-300 mb-1" />
                      <span className="text-[10px]">গ্রাহকের স্বাক্ষর</span>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-300 mb-1" />
                      <span className="text-[10px]">কর্তৃপক্ষের স্বাক্ষর</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE INVOICE / QUOTATION MODAL */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  নতুন {docType === 'invoice' ? 'ইনভয়েস' : 'কোটেশন'} প্রস্তুত করুন
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="space-y-4">
                {/* Customer Section */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">গ্রাহকের তথ্য</span>
                    <select
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                    >
                      <option value="">-- বিদ্যমান গ্রাহক থেকে বাছাই করুন --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone || 'নম্বর নেই'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="গ্রাহকের নাম *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="ফোন নম্বর"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="ঠিকানা"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ইস্যুর তারিখ</label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">পরিশোধের শেষ তারিখ (Due Date)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">পণ্য বা সেবার তালিকা</span>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> সারি যোগ করুন
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={item.product_id || ''}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          className="w-40 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        >
                          <option value="">কাস্টম বিবরণ</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="বিবরণ *"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />

                        <input
                          type="number"
                          min="1"
                          placeholder="পরিমাণ"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="দর"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-right"
                        />

                        <span className="w-20 text-right font-bold text-xs text-slate-800">
                          ৳{(item.total || 0).toLocaleString()}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">সাবটোটাল (৳)</label>
                    <p className="font-bold text-xs text-slate-900">৳{subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ছাড় (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">ভ্যাট / ট্যাক্স (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">সর্বমোট (৳)</label>
                    <p className="font-black text-sm text-emerald-700">৳{grandTotal.toLocaleString()}</p>
                  </div>
                </div>

                {/* Paid amount (if invoice) */}
                {docType === 'invoice' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">পরিশোধিত নগদ টাকা (৳)</label>
                      <input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">বকেয়া পাওনা (Due ৳)</label>
                      <input
                        type="text"
                        disabled
                        value={`৳${dueCalculated.toLocaleString()}`}
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-rose-600"
                      />
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ইনভয়েস নোট / শুভেচ্ছা বার্তা</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {isSaving ? 'সংরক্ষণ হচ্ছে...' : docType === 'invoice' ? 'ইনভয়েস সংরক্ষণ করুন' : 'কোটেশন সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProGate>
  );
};
