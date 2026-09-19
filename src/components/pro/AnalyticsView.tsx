import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ProGate } from './ProGate';
import {
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Lightbulb,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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

interface AnalyticsViewProps {
  onNavigateToUpgrade?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigateToUpgrade }) => {
  const { sales, expenses, products, customers } = useData();

  // Weekly / Monthly Trend Data for Area Chart
  const trendData = useMemo(() => {
    const days: { [date: string]: { date: string; displayDate: string; revenue: number; expense: number } } = {};
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
      days[dateStr] = { date: dateStr, displayDate, revenue: 0, expense: 0 };
    }

    sales.forEach((s) => {
      if (days[s.sale_date]) {
        days[s.sale_date].revenue += Number(s.total_amount || 0);
      }
    });

    expenses.forEach((e) => {
      if (days[e.date]) {
        days[e.date].expense += Number(e.amount || 0);
      }
    });

    return Object.values(days);
  }, [sales, expenses]);

  // Category Expense Distribution
  const expenseCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Automated Business Insights Generation
  const insights = useMemo(() => {
    const list: { type: 'success' | 'warning' | 'info'; title: string; desc: string; icon: any }[] = [];

    // 1. Month-over-month sales comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let thisMonthSales = 0;
    let lastMonthSales = 0;

    sales.forEach((s) => {
      const d = new Date(s.sale_date);
      if (!isNaN(d.getTime())) {
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          thisMonthSales += Number(s.total_amount || 0);
        } else if (
          (currentMonth === 0 && d.getFullYear() === currentYear - 1 && d.getMonth() === 11) ||
          (d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1)
        ) {
          lastMonthSales += Number(s.total_amount || 0);
        }
      }
    });

    if (lastMonthSales > 0) {
      const growth = ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;
      if (growth >= 0) {
        list.push({
          type: 'success',
          title: `বিক্রয় বৃদ্ধি পেয়েছে (+${growth.toFixed(1)}%)`,
          desc: `গত মাসের তুলনায় এই মাসে বিক্রয় ৳${lastMonthSales.toLocaleString()} থেকে বৃদ্ধি পেয়ে ৳${thisMonthSales.toLocaleString()} হয়েছে।`,
          icon: ArrowUpRight,
        });
      } else {
        list.push({
          type: 'warning',
          title: `বিক্রয় কিছুটা কমেছে (${growth.toFixed(1)}%)`,
          desc: `গত মাসের (৳${lastMonthSales.toLocaleString()}) তুলনায় এই মাসে বিক্রয় ৳${thisMonthSales.toLocaleString()}। নতুন অফার বা কাস্টমার ফলো-আপ দিতে পারেন।`,
          icon: ArrowDownRight,
        });
      }
    } else if (thisMonthSales > 0) {
      list.push({
        type: 'info',
        title: 'নতুন মাসের বিক্রয় গতিশীল',
        desc: `এই মাসে ইতিমধ্যে মোট ৳${thisMonthSales.toLocaleString()} বিক্রয় অর্জিত হয়েছে।`,
        icon: TrendingUp,
      });
    }

    // 2. Best-selling product
    const productSalesMap = new Map<string, { name: string; totalRevenue: number; qty: number }>();
    sales.forEach((s) => {
      if (!s.product_id) return;
      const current = productSalesMap.get(s.product_id) || {
        name: products.find((p) => p.id === s.product_id)?.name || 'পণ্য',
        totalRevenue: 0,
        qty: 0,
      };
      productSalesMap.set(s.product_id, {
        name: current.name,
        totalRevenue: current.totalRevenue + Number(s.total_amount || 0),
        qty: current.qty + Number(s.quantity || 0),
      });
    });

    const topProduct = Array.from(productSalesMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    if (topProduct && topProduct.totalRevenue > 0) {
      const totalAllSales = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
      const share = totalAllSales > 0 ? ((topProduct.totalRevenue / totalAllSales) * 100).toFixed(1) : '০';
      list.push({
        type: 'success',
        title: `সেরা বিক্রিত পণ্য: ${topProduct.name}`,
        desc: `এই পণ্যটি মোট বিক্রয়ের ${share}% রেভিনিউ তৈরি করেছে (মোট বিক্রয় ৳${topProduct.totalRevenue.toLocaleString()})। এর পর্যাপ্ত স্টক রাখা নিশ্চিত করুন।`,
        icon: Award,
      });
    }

    // 3. Top expense category
    if (expenseCategoryData.length > 0) {
      const topExpense = [...expenseCategoryData].sort((a, b) => b.value - a.value)[0];
      const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
      const expShare = totalExp > 0 ? ((topExpense.value / totalExp) * 100).toFixed(1) : '০';
      list.push({
        type: 'warning',
        title: `সর্বোচ্চ ব্যয় খাত: ${topExpense.name} (${expShare}%)`,
        desc: `ব্যবসায়ের মোট ব্যয়ের ${expShare}% টাকা খরচ হয়েছে "${topExpense.name}" খাতে (৳${topExpense.value.toLocaleString()})। এটি অপটিমাইজ করার সুযোগ রয়েছে।`,
        icon: AlertCircle,
      });
    }

    // 4. Receivables risk
    const customersWithDue = customers.filter((c) => c.due_amount > 0);
    const totalDue = customersWithDue.reduce((acc, c) => acc + Number(c.due_amount || 0), 0);
    if (customersWithDue.length > 0) {
      list.push({
        type: 'info',
        title: `বাকি আদায়ের সুযোগ: ${customersWithDue.length} জন গ্রাহক`,
        desc: `মোট ৳${totalDue.toLocaleString()} বকেয়া বাকি রয়েছে। দ্রুত এসএমএস বা কল দিয়ে তাগাদা পাঠিয়ে ক্যাশ ফ্লো বাড়ান।`,
        icon: Lightbulb,
      });
    }

    return list;
  }, [sales, expenses, products, customers, expenseCategoryData]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <ProGate
      featureTitle="স্মার্ট বিজনেস অ্যানালিটিক্স ও ইনসাইটস (Business Insights)"
      featureDescription="গত ১৪ দিনের ট্রেন্ড, ব্যয় ক্যাটাগরি পাই-চার্ট, স্বয়ংক্রিয় ডেটা ইনসাইটস এবং গ্রোথ রিকমেন্ডেশন দেখতে Pro-তে আপগ্রেড করুন।"
      onNavigateToUpgrade={onNavigateToUpgrade}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              ব্যবসায়িক অ্যানালিটিক্স ও এআই ইনসাইটস
            </h2>
            <p className="text-xs text-slate-500">
              ডেটা নির্ভর ব্যবসায়িক সিদ্ধান্ত গ্রহণে সাহায্যকারী ভিজ্যুয়াল গ্রাফ ও স্বয়ংক্রিয় পর্যবেক্ষণ
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> রিয়েল-টাইম পর্যবেক্ষণ
          </span>
        </div>

        {/* AUTOMATED INSIGHTS CARDS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            স্বয়ংক্রিয় ব্যবসায়িক ইনসাইটস ও অ্যাকশনেবল টিপস
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, i) => {
              const Icon = ins.icon;
              return (
                <div
                  key={i}
                  className={`p-5 rounded-3xl border transition-all ${
                    ins.type === 'success'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : ins.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-blue-50/70 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 ${
                        ins.type === 'success'
                          ? 'bg-emerald-200 text-emerald-800'
                          : ins.type === 'warning'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{ins.title}</h4>
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">{ins.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 14-Day Revenue vs Expense Trend Area Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                গত ১৪ দিনের বিক্রয় ও ব্যয়ের গতিপ্রকৃতি (Daily Trends)
              </h3>
              <p className="text-xs text-slate-500">নগদ রেভিনিউ প্রবাহ বনাম দৈনিক খরচের ভিজ্যুয়াল ট্রেন্ড</p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: unknown) => [`৳${Number(val || 0).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="বিক্রয় (Revenue)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="ব্যয় (Expense)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                ক্যাটাগরিভিত্তিক ব্যয়ের অনুপাত (Expense Distribution)
              </h3>
              <p className="text-xs text-slate-500">কোন খাতে ব্যবসার কত শতাংশ অর্থ খরচ হচ্ছে</p>
            </div>
          </div>

          {expenseCategoryData.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">এখনো কোনো ব্যয়ের এন্ট্রি নেই</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => [`৳${Number(val || 0).toLocaleString()}`, 'পরিমাণ']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </ProGate>
  );
};
