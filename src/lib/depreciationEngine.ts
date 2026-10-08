import { FixedAsset, FixedAssetCategory, CalculatedAssetMetrics, FixedAssetsSummary } from '../types';

export interface CategoryMeta {
  id: FixedAssetCategory;
  nameBn: string;
  nameEn: string;
  defaultUsefulLifeYears: number;
  descriptionBn: string;
  isCapEx: boolean;
}

export const ASSET_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Shop',
    nameBn: 'দোকান / বাণিজ্যিক স্থান',
    nameEn: 'Shop / Real Estate',
    defaultUsefulLifeYears: 20,
    descriptionBn: 'দোকানের নিজস্ব স্পেস, ভবন বা স্থায়ী অবকাঠামো',
    isCapEx: true,
  },
  {
    id: 'Land',
    nameBn: 'জমি (Land)',
    nameEn: 'Land',
    defaultUsefulLifeYears: 50,
    descriptionBn: 'ব্যবসায়িক প্রয়োজনে কেনা জমি (সাধারণত অবচয় প্রযোজ্য নয় বা সীমিত)',
    isCapEx: true,
  },
  {
    id: 'Vehicle',
    nameBn: 'গাড়ি / পরিবহন বাহন',
    nameEn: 'Vehicle / Transport',
    defaultUsefulLifeYears: 5,
    descriptionBn: 'পণ্য ডেলিভারি ভ্যান, মোটরসাইকেল, পিকআপ ইত্যাদি',
    isCapEx: true,
  },
  {
    id: 'Machinery',
    nameBn: 'মেশিনারি / ভারী কারখানা সরঞ্জাম',
    nameEn: 'Machinery',
    defaultUsefulLifeYears: 7,
    descriptionBn: 'উৎপাদন ও প্রক্রিয়াজাতকরণ মেশিনারি',
    isCapEx: true,
  },
  {
    id: 'Computer',
    nameBn: 'কম্পিউটার ও আইটি হার্ডওয়্যার',
    nameEn: 'Computer & IT Hardware',
    defaultUsefulLifeYears: 3,
    descriptionBn: 'ডেস্কটপ, ল্যাপটপ, সার্ভার, পিওএস টার্মিনাল, প্রিন্টার',
    isCapEx: true,
  },
  {
    id: 'Equipment',
    nameBn: 'ব্যবসায়িক সরঞ্জাম ও যন্ত্রপাতি',
    nameEn: 'Commercial Equipment',
    defaultUsefulLifeYears: 5,
    descriptionBn: 'ওজন মাপার স্কেল, সিসিটিভি ক্যামেরা, বারকোড স্ক্যানার, জেনারেটর',
    isCapEx: true,
  },
  {
    id: 'Furniture',
    nameBn: 'আসবাবপত্র ও ডেকোরেশন',
    nameEn: 'Furniture & Fixtures',
    defaultUsefulLifeYears: 5,
    descriptionBn: 'টেবিল, চেয়ার, ক্যাশ কাউন্টার, ডিসপ্লে র‍্যাক, শো-কেস',
    isCapEx: true,
  },
  {
    id: 'Shop Interior',
    nameBn: 'দোকানের ইন্টেরিয়র ও সাজসজ্জা',
    nameEn: 'Shop Interior & Setup',
    defaultUsefulLifeYears: 4,
    descriptionBn: 'ফলস সিলিং, লাইটিং, গ্লাস পার্টিশন, এসি ডাক্টিং, ব্র্যান্ডিং সেটআপ',
    isCapEx: true,
  },
  {
    id: 'Other',
    nameBn: 'অন্যান্য স্থায়ী সম্পদ',
    nameEn: 'Other Fixed Assets',
    defaultUsefulLifeYears: 3,
    descriptionBn: 'অন্যান্য দীর্ঘমেয়াদী মূলধনী সম্পদ',
    isCapEx: true,
  },
];

/**
 * Calculates straight-line depreciation for a given asset as of a target date.
 *
 * Formula:
 * Total Depreciable Amount = Purchase Cost - Salvage Value
 * Monthly Depreciation = Total Depreciable Amount / Useful Life in Months
 * Annual Depreciation = Monthly Depreciation * 12
 * Net Book Value = Purchase Cost - Accumulated Depreciation
 * (Net Book Value never falls below Salvage Value)
 */
export function calculateAssetDepreciation(
  asset: FixedAsset,
  asOfDate?: Date | string
): CalculatedAssetMetrics {
  const purchaseCost = Math.max(0, Number(asset.purchase_cost) || 0);
  const salvageValue = Math.max(0, Number(asset.salvage_value) || 0);

  // Useful life in months
  const rawLife = Math.max(0.1, Number(asset.useful_life) || 1);
  const isYears = asset.useful_life_unit === 'years';
  const usefulLifeMonths = Math.max(1, Math.round(isYears ? rawLife * 12 : rawLife));

  // Depreciable base
  const totalDepreciableAmount = Math.max(0, purchaseCost - salvageValue);

  // Monthly and annual depreciation
  const monthlyDepreciation = usefulLifeMonths > 0 ? totalDepreciableAmount / usefulLifeMonths : 0;
  const annualDepreciation = monthlyDepreciation * 12;

  // Start date
  const startStr = asset.depreciation_start_date || asset.purchase_date;
  const startDate = startStr ? new Date(startStr) : new Date();
  const targetDate = asOfDate ? (typeof asOfDate === 'string' ? new Date(asOfDate) : asOfDate) : new Date();

  // Calculate elapsed months between start date and target date
  let monthsElapsed = 0;
  if (!isNaN(startDate.getTime()) && !isNaN(targetDate.getTime()) && targetDate >= startDate) {
    const startY = startDate.getFullYear();
    const startM = startDate.getMonth();
    const startD = startDate.getDate();

    const targetY = targetDate.getFullYear();
    const targetM = targetDate.getMonth();
    const targetD = targetDate.getDate();

    monthsElapsed = (targetY - startY) * 12 + (targetM - startM);
    // If the target day of month has reached or passed the start day, consider current month included
    if (targetD >= startD) {
      monthsElapsed += 1;
    }
    monthsElapsed = Math.max(0, monthsElapsed);
  }

  // Cap effective months to useful life
  const effectiveMonths = Math.min(monthsElapsed, usefulLifeMonths);

  // Accumulated depreciation
  let accumulatedDepreciation = 0;
  if (effectiveMonths >= usefulLifeMonths) {
    accumulatedDepreciation = totalDepreciableAmount;
  } else {
    accumulatedDepreciation = Math.min(totalDepreciableAmount, effectiveMonths * monthlyDepreciation);
  }

  // Net book value: never below salvage value
  const netBookValue = Math.max(salvageValue, purchaseCost - accumulatedDepreciation);

  // Remaining life
  const remainingMonths = Math.max(0, usefulLifeMonths - effectiveMonths);

  const isFullyDepreciated = effectiveMonths >= usefulLifeMonths || netBookValue <= salvageValue;

  return {
    usefulLifeMonths,
    totalDepreciableAmount,
    monthlyDepreciation,
    annualDepreciation,
    monthsElapsed,
    remainingMonths,
    accumulatedDepreciation,
    netBookValue,
    isFullyDepreciated,
    status: isFullyDepreciated ? 'fully_depreciated' : 'active',
  };
}

/**
 * Calculates high-level summary across all assets
 */
export function calculateFixedAssetsSummary(
  assets: FixedAsset[],
  asOfDate?: Date | string
): FixedAssetsSummary {
  let totalGrossAssets = 0;
  let totalSalvageValue = 0;
  let totalAccumulatedDepreciation = 0;
  let totalNetBookValue = 0;
  let totalMonthlyDepreciation = 0;
  let totalAnnualDepreciation = 0;
  let activeAssetsCount = 0;
  let fullyDepreciatedCount = 0;

  for (const asset of assets) {
    const cost = Math.max(0, Number(asset.purchase_cost) || 0);
    const salvage = Math.max(0, Number(asset.salvage_value) || 0);
    const metrics = calculateAssetDepreciation(asset, asOfDate);

    totalGrossAssets += cost;
    totalSalvageValue += salvage;
    totalAccumulatedDepreciation += metrics.accumulatedDepreciation;
    totalNetBookValue += metrics.netBookValue;

    if (!metrics.isFullyDepreciated) {
      totalMonthlyDepreciation += metrics.monthlyDepreciation;
      totalAnnualDepreciation += metrics.annualDepreciation;
      activeAssetsCount++;
    } else {
      fullyDepreciatedCount++;
    }
  }

  return {
    totalGrossAssets,
    totalSalvageValue,
    totalAccumulatedDepreciation,
    totalNetBookValue,
    totalMonthlyDepreciation,
    totalAnnualDepreciation,
    activeAssetsCount,
    fullyDepreciatedCount,
  };
}

/**
 * Calculates depreciation expense for a specific date range (e.g. this month, this year, or custom)
 * Ensures standard accounting matching: only depreciation for the active months within that period is charged to P&L.
 */
export function calculateDepreciationExpenseForPeriod(
  assets: FixedAsset[],
  startDateStr?: string,
  endDateStr?: string
): number {
  if (!assets || assets.length === 0) return 0;

  const now = new Date();
  const start = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  let totalPeriodDepreciation = 0;

  for (const asset of assets) {
    const cost = Math.max(0, Number(asset.purchase_cost) || 0);
    const salvage = Math.max(0, Number(asset.salvage_value) || 0);
    const depreciableBase = Math.max(0, cost - salvage);
    if (depreciableBase <= 0) continue;

    const rawLife = Math.max(0.1, Number(asset.useful_life) || 1);
    const usefulLifeMonths = Math.max(1, Math.round(asset.useful_life_unit === 'years' ? rawLife * 12 : rawLife));
    const monthlyDep = depreciableBase / usefulLifeMonths;

    const assetStartStr = asset.depreciation_start_date || asset.purchase_date;
    const assetStartDate = assetStartStr ? new Date(assetStartStr) : new Date();
    if (isNaN(assetStartDate.getTime())) continue;

    // Asset useful life end date
    const assetEndDate = new Date(assetStartDate);
    assetEndDate.setMonth(assetEndDate.getMonth() + usefulLifeMonths);

    // Overlap window between [start, end] and [assetStartDate, assetEndDate]
    const windowStart = new Date(Math.max(start.getTime(), assetStartDate.getTime()));
    const windowEnd = new Date(Math.min(end.getTime(), assetEndDate.getTime()));

    if (windowEnd >= windowStart) {
      // Calculate months in window
      let monthsInWindow =
        (windowEnd.getFullYear() - windowStart.getFullYear()) * 12 +
        (windowEnd.getMonth() - windowStart.getMonth()) +
        1;
      monthsInWindow = Math.max(0, Math.min(usefulLifeMonths, monthsInWindow));
      totalPeriodDepreciation += monthsInWindow * monthlyDep;
    }
  }

  return totalPeriodDepreciation;
}

export interface DepreciationScheduleItem {
  yearNumber: number;
  periodLabel: string;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

/**
 * Generates annual depreciation schedule for an asset
 */
export function generateDepreciationSchedule(asset: FixedAsset): DepreciationScheduleItem[] {
  const purchaseCost = Math.max(0, Number(asset.purchase_cost) || 0);
  const salvageValue = Math.max(0, Number(asset.salvage_value) || 0);
  const rawLife = Math.max(0.1, Number(asset.useful_life) || 1);
  const usefulLifeMonths = Math.max(1, Math.round(asset.useful_life_unit === 'years' ? rawLife * 12 : rawLife));
  const totalDepreciable = Math.max(0, purchaseCost - salvageValue);
  const monthlyDep = usefulLifeMonths > 0 ? totalDepreciable / usefulLifeMonths : 0;

  const startStr = asset.depreciation_start_date || asset.purchase_date;
  const startDate = startStr ? new Date(startStr) : new Date();
  const startYear = isNaN(startDate.getTime()) ? new Date().getFullYear() : startDate.getFullYear();

  const totalYears = Math.ceil(usefulLifeMonths / 12);
  const schedule: DepreciationScheduleItem[] = [];

  let currentBookValue = purchaseCost;
  let cumDepreciation = 0;
  let remainingMonths = usefulLifeMonths;

  for (let year = 1; year <= totalYears; year++) {
    const monthsThisYear = Math.min(12, remainingMonths);
    const depThisYear = Math.min(totalDepreciable - cumDepreciation, monthsThisYear * monthlyDep);

    const beginning = currentBookValue;
    cumDepreciation += depThisYear;
    currentBookValue = Math.max(salvageValue, purchaseCost - cumDepreciation);
    remainingMonths -= monthsThisYear;

    schedule.push({
      yearNumber: year,
      periodLabel: `বছর ${year} (${startYear + year - 1})`,
      beginningBookValue: beginning,
      depreciationExpense: depThisYear,
      accumulatedDepreciation: cumDepreciation,
      endingBookValue: currentBookValue,
    });

    if (cumDepreciation >= totalDepreciable) break;
  }

  return schedule;
}
