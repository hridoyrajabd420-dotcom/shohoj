import { Sale, Product, Customer, UserProfile, BusinessSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';

interface GenerateInvoiceHtmlOptions {
  sale: Sale;
  product?: Product;
  customer?: Customer;
  profile?: UserProfile | null;
  businessSettings?: BusinessSettings | null;
}

export function generateInvoiceHtml({
  sale,
  product,
  customer,
  profile,
  businessSettings,
}: GenerateInvoiceHtmlOptions): string {
  const businessName =
    businessSettings?.business_name || profile?.business_name || 'সহজ ব্যবসা (Shohoj Bebsha)';
  const businessPhone =
    businessSettings?.phone || profile?.phone || '০১৭০০-০০০০০০';
  const businessAddress =
    businessSettings?.address || 'ঢাকা, বাংলাদেশ';
  const businessEmail =
    businessSettings?.email || profile?.email || '';
  const businessLogo = businessSettings?.logo_url || '';

  const customerName =
    customer?.name || (sale as any).customer_name || 'সরাসরি ক্রেতা (Walk-in Customer)';
  const customerPhone = customer?.phone || (sale as any).customer_phone || '-';
  const customerAddress = customer?.address || '-';

  const invoiceNumber = `INV-${sale.id.slice(0, 8).toUpperCase()}`;
  const saleDate = formatDate(sale.sale_date);

  const productName = product ? (product.product_name || product.name) : 'পণ্য';
  const productUnit = product?.unit || 'টি';
  const quantity = Number(sale.quantity) || 1;
  const unitPrice = Number(sale.selling_price) || 0;
  const subtotal =
    sale.subtotal !== undefined
      ? Number(sale.subtotal)
      : quantity * unitPrice;
  const discount = Number(sale.discount) || 0;
  const totalAmount =
    Number(sale.total_amount) || Math.max(0, subtotal - discount);
  const paidAmount =
    sale.paid_amount !== undefined
      ? Number(sale.paid_amount)
      : sale.payment_status === 'paid'
      ? totalAmount
      : 0;
  const dueAmount =
    sale.due_amount !== undefined
      ? Number(sale.due_amount)
      : sale.payment_status === 'due'
      ? totalAmount
      : Math.max(0, totalAmount - paidAmount);

  const isPaid = dueAmount <= 0 || sale.payment_status === 'paid';
  const statusLabel = isPaid ? 'পরিশোধিত (PAID)' : 'বকেয়া (DUE)';
  const statusColor = isPaid ? '#059669' : '#dc2626';

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hind Siliguri", sans-serif;
    }
    body {
      background: #f8fafc;
      color: #0f172a;
      padding: 32px;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      object-fit: contain;
      background: #ecfdf5;
      padding: 6px;
      border: 1px solid #a7f3d0;
    }
    .brand-text h1 {
      font-size: 24px;
      font-weight: 800;
      color: #047857;
      letter-spacing: -0.5px;
    }
    .brand-text p {
      font-size: 13px;
      color: #64748b;
      margin-top: 3px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      color: ${statusColor};
      background: ${isPaid ? '#ecfdf5' : '#fef2f2'};
      border: 1px solid ${isPaid ? '#a7f3d0' : '#fecaca'};
      margin-bottom: 8px;
    }
    .meta-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
    }
    .meta-line {
      font-size: 13px;
      color: #64748b;
      margin-top: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 18px;
    }
    .info-box h3 {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      color: #047857;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .info-box p {
      font-size: 14px;
      color: #334155;
      margin-top: 4px;
    }
    .info-box strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
    }
    th.text-right, td.text-right {
      text-align: right;
    }
    th.text-center, td.text-center {
      text-align: center;
    }
    td {
      padding: 16px;
      font-size: 14px;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
    }
    .table-prod-name {
      font-weight: 700;
      color: #0f172a;
    }
    .table-prod-sub {
      font-size: 11px;
      color: #94a3b8;
    }
    .calc-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .calc-box {
      width: 320px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: #475569;
    }
    .calc-row.total-row {
      border-top: 2px solid #e2e8f0;
      border-bottom: 2px solid #e2e8f0;
      padding: 10px 0;
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .calc-row.paid-row {
      color: #047857;
      font-weight: 700;
    }
    .calc-row.due-row {
      color: #dc2626;
      font-weight: 800;
    }
    .notes-box {
      background: #f8fafc;
      border-left: 4px solid #059669;
      padding: 14px 18px;
      border-radius: 0 10px 10px 0;
      font-size: 13px;
      color: #475569;
      margin-bottom: 32px;
    }
    .notes-box strong {
      display: block;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .signature-area {
      display: flex;
      justify-content: flex-end;
      margin-top: 40px;
      margin-bottom: 24px;
    }
    .signature-line {
      text-align: center;
      border-top: 1px solid #94a3b8;
      width: 180px;
      padding-top: 6px;
      font-size: 12px;
      color: #475569;
    }
    .action-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-print {
      background: #047857;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #065f46;
    }
    .btn-close {
      background: #e2e8f0;
      color: #334155;
    }
    .btn-close:hover {
      background: #cbd5e1;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .action-bar {
        display: none !important;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 20px 0;
      }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <button class="btn btn-print" onclick="window.print()">
      🖨️ প্রিন্ট / সেভ PDF (Print or Save as PDF)
    </button>
    <button class="btn btn-close" onclick="window.close()">
      ✕ বন্ধ করুন
    </button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div class="brand-section">
        ${
          businessLogo
            ? `<img src="${businessLogo}" alt="Logo" class="brand-logo" />`
            : `<div style="width: 50px; height: 50px; border-radius: 12px; background: #047857; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px;">সহ</div>`
        }
        <div class="brand-text">
          <h1>${businessName}</h1>
          <p>📞 ${businessPhone}</p>
          <p>📍 ${businessAddress}</p>
          ${businessEmail ? `<p>✉️ ${businessEmail}</p>` : ''}
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-badge">${statusLabel}</div>
        <div class="meta-title">ইনভয়েস / বিল</div>
        <div class="meta-line">নম্বর: <strong>${invoiceNumber}</strong></div>
        <div class="meta-line">তারিখ: <strong>${saleDate}</strong></div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-box">
        <h3>বিক্রেতার তথ্য (Sold By)</h3>
        <p><strong>${businessName}</strong></p>
        <p>ফোন: ${businessPhone}</p>
        <p>ঠিকানা: ${businessAddress}</p>
      </div>
      <div class="info-box">
        <h3>ক্রেতার তথ্য (Bill To)</h3>
        <p><strong>${customerName}</strong></p>
        <p>ফোন: ${customerPhone}</p>
        <p>ঠিকানা: ${customerAddress}</p>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>পণ্যের বিবরণ</th>
          <th class="text-center">পরিমাণ</th>
          <th class="text-right">একক দর</th>
          <th class="text-right">মোট টাকা</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>১</td>
          <td>
            <div class="table-prod-name">${productName}</div>
            ${product?.sku ? `<div class="table-prod-sub">SKU: ${product.sku}</div>` : ''}
          </td>
          <td class="text-center font-bold">${quantity} ${productUnit}</td>
          <td class="text-right">${formatCurrency(unitPrice)}</td>
          <td class="text-right font-bold">${formatCurrency(subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Calculation Summary -->
    <div class="calc-container">
      <div class="calc-box">
        <div class="calc-row">
          <span>সাব-টোটাল (Subtotal):</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${
          discount > 0
            ? `<div class="calc-row" style="color: #047857;">
                 <span>ছাড় (Discount):</span>
                 <span>-${formatCurrency(discount)}</span>
               </div>`
            : ''
        }
        <div class="calc-row total-row">
          <span>সর্বমোট বিল (Total):</span>
          <span>${formatCurrency(totalAmount)}</span>
        </div>
        <div class="calc-row paid-row">
          <span>পরিশোধিত (Paid):</span>
          <span>${formatCurrency(paidAmount)}</span>
        </div>
        <div class="calc-row due-row">
          <span>বকেয়া পাওনা (Due):</span>
          <span>${formatCurrency(dueAmount)}</span>
        </div>
      </div>
    </div>

    <!-- Notes if available -->
    ${
      sale.notes
        ? `<div class="notes-box">
             <strong>নোট / বিশেষ দ্রষ্টব্য:</strong>
             ${sale.notes}
           </div>`
        : `<div class="notes-box">
             <strong>ধন্যবাদ!</strong>
             আপনার ব্যবসার শুভকামনায় সহজ ব্যবসা (Shohoj Bebsha)। পণ্য বা সেবার যেকোনো তথ্যে আমাদের সাথে যোগাযোগ করুন।
           </div>`
    }

    <!-- Signature -->
    <div class="signature-area">
      <div class="signature-line">
        স্বাক্ষর / অনুমোদিত প্রতিনিধি
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>সহজ ব্যবসা ক্লাউড প্ল্যাটফর্ম দ্বারা প্রস্তুতকৃত • RLS সিকিউরড</span>
      <span>${saleDate}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Trigger download / print window for PDF Invoice
 */
export function openPdfInvoicePrint(options: GenerateInvoiceHtmlOptions): void {
  const html = generateInvoiceHtml(options);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
