export type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Returns YYYY-MM-DD for a given Date object in local time
 */
export function formatToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates start and end dates based on a preset
 */
export function getDateRangeFromPreset(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = formatToYMD(now);

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === 'this_week') {
    // Current week starting from Saturday or Sunday (Bangladesh work week / standard)
    // Let's take current week Sunday to Saturday or Monday to Sunday.
    // Sunday as start of week:
    const day = now.getDay(); // 0 is Sunday
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: formatToYMD(start),
      endDate: formatToYMD(end),
    };
  }

  if (preset === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: formatToYMD(start),
      endDate: formatToYMD(end),
    };
  }

  if (preset === 'this_year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return {
      startDate: formatToYMD(start),
      endDate: formatToYMD(end),
    };
  }

  if (preset === 'all') {
    return { startDate: '', endDate: '' };
  }

  return { startDate: todayStr, endDate: todayStr };
}

/**
 * Checks if a target date string (YYYY-MM-DD) falls within the range
 */
export function isDateInRange(targetDate: string | undefined | null, startDate: string, endDate: string): boolean {
  if (!targetDate) return false;
  const d = targetDate.slice(0, 10);
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
}

/**
 * Human-readable label for a preset in Bengali + English
 */
export const DATE_PRESETS: { key: DateRangePreset; labelBn: string; labelEn: string }[] = [
  { key: 'today', labelBn: 'আজকের দিন', labelEn: 'Today' },
  { key: 'this_week', labelBn: 'চলতি সপ্তাহ', labelEn: 'This Week' },
  { key: 'this_month', labelBn: 'চলতি মাস', labelEn: 'This Month' },
  { key: 'this_year', labelBn: 'চলতি বছর', labelEn: 'This Year' },
  { key: 'custom', labelBn: 'কাস্টম তারিখ', labelEn: 'Custom' },
  { key: 'all', labelBn: 'সব তারিখ', labelEn: 'All Time' },
];
