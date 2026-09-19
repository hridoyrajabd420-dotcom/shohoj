export function formatCurrency(amount: number): string {
  const num = isNaN(amount) ? 0 : amount;
  return `৳ ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export const EXPENSE_CATEGORIES = [
  { value: 'Rent', labelEn: 'Rent', labelBn: 'ভাড়া', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'Salary', labelEn: 'Salary', labelBn: 'বেতন', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Transport', labelEn: 'Transport', labelBn: 'পরিবহন / যাতায়াত', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Marketing', labelEn: 'Marketing', labelBn: 'মার্কেটিং ও বিজ্ঞাপন', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Electricity', labelEn: 'Electricity', labelBn: 'বিদ্যুৎ বিল', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'Internet', labelEn: 'Internet', labelBn: 'ইন্টারনেট ও ফোন', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'Other', labelEn: 'Other', labelBn: 'অন্যান্য খরচ', color: 'bg-slate-100 text-slate-700 border-slate-200' },
] as const;

export const BUSINESS_TYPES = [
  'Retail (খুচরা বিক্রয়)',
  'Wholesale (পাইকারি বিক্রয়)',
  'Grocery & Dept Store (মুদি ও ডিপার্টমেন্টাল)',
  'Clothing & Fashion (পোশাক ও ফ্যাশন)',
  'Electronics & Mobile (ইলেকট্রনিক্স ও মোবাইল)',
  'Pharmacy (ফার্মেসি)',
  'Hardware & Sanitary (হার্ডওয়্যার)',
  'Restaurant & Cafe (রেস্টুরেন্ট ও ক্যাফে)',
  'Services & Repair (সার্ভিস ও মেরামত)',
  'Other (অন্যান্য)',
];
