import { RecurringExpense, Expense } from '../types';

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Checks if a recurring expense is due up to `todayStr`.
 * If it is due, generates all missing expense items between its schedule and today.
 */
export function getDueExpensesForRecurring(
  rec: RecurringExpense,
  todayStr: string,
  existingExpenses: Expense[]
): {
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  recurring_expense_id: string;
  is_recurring_auto: boolean;
}[] {
  if (!rec.is_active) return [];

  const createdDateStr = rec.created_at ? rec.created_at.slice(0, 10) : rec.execution_date || todayStr;
  const startDateStr = rec.execution_date || createdDateStr;

  const dueList: {
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    description: string;
    recurring_expense_id: string;
    is_recurring_auto: boolean;
  }[] = [];

  const now = new Date();
  const today = new Date(todayStr + 'T00:00:00');

  // Look back up to past 3 months / 90 days to avoid runaway loops while catching up
  if (rec.frequency === 'monthly') {
    const dayOfMonth = rec.day_of_month || 1;
    // Iterate from current month and up to 2 past months
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const maxDaysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(dayOfMonth, maxDaysInMonth);
      targetDate.setDate(actualDay);

      const dateStr = formatYMD(targetDate);
      if (dateStr >= startDateStr && dateStr <= todayStr) {
        // Check if an expense with this recurring_expense_id and dateStr already exists
        const alreadyExists = existingExpenses.some((e) => {
          const d = (e.expense_date || e.date || '').slice(0, 10);
          return (
            (e.recurring_expense_id === rec.id && d === dateStr) ||
            // Fallback match: same title & same category & same date
            (e.title === rec.title && e.category === rec.category && d === dateStr)
          );
        });

        if (!alreadyExists) {
          dueList.push({
            title: rec.title,
            category: rec.category,
            amount: rec.amount,
            expense_date: dateStr,
            description: rec.notes
              ? `${rec.notes} (স্বয়ংক্রিয় মাসিক খরচ)`
              : `স্বয়ংক্রিয় মাসিক নির্দিষ্ট খরচ (${rec.title})`,
            recurring_expense_id: rec.id,
            is_recurring_auto: true,
          });
        }
      }
    }
  } else if (rec.frequency === 'daily') {
    // Up to last 7 days for daily
    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      const dateStr = formatYMD(targetDate);

      if (dateStr >= startDateStr && dateStr <= todayStr) {
        const alreadyExists = existingExpenses.some((e) => {
          const d = (e.expense_date || e.date || '').slice(0, 10);
          return (
            (e.recurring_expense_id === rec.id && d === dateStr) ||
            (e.title === rec.title && e.category === rec.category && d === dateStr)
          );
        });

        if (!alreadyExists) {
          dueList.push({
            title: rec.title,
            category: rec.category,
            amount: rec.amount,
            expense_date: dateStr,
            description: rec.notes
              ? `${rec.notes} (স্বয়ংক্রিয় দৈনিক খরচ)`
              : `স্বয়ংক্রিয় দৈনিক খরচ (${rec.title})`,
            recurring_expense_id: rec.id,
            is_recurring_auto: true,
          });
        }
      }
    }
  } else if (rec.frequency === 'weekly') {
    const targetDayOfWeek = rec.day_of_week ?? 0; // 0=Sunday
    // Check past 4 weeks
    for (let daysAgo = 28; daysAgo >= 0; daysAgo--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      if (targetDate.getDay() === targetDayOfWeek) {
        const dateStr = formatYMD(targetDate);
        if (dateStr >= startDateStr && dateStr <= todayStr) {
          const alreadyExists = existingExpenses.some((e) => {
            const d = (e.expense_date || e.date || '').slice(0, 10);
            return (
              (e.recurring_expense_id === rec.id && d === dateStr) ||
              (e.title === rec.title && e.category === rec.category && d === dateStr)
            );
          });

          if (!alreadyExists) {
            dueList.push({
              title: rec.title,
              category: rec.category,
              amount: rec.amount,
              expense_date: dateStr,
              description: rec.notes
                ? `${rec.notes} (স্বয়ংক্রিয় সাপ্তাহিক খরচ)`
                : `স্বয়ংক্রিয় সাপ্তাহিক খরচ (${rec.title})`,
              recurring_expense_id: rec.id,
              is_recurring_auto: true,
            });
          }
        }
      }
    }
  } else if (rec.frequency === 'yearly') {
    // Current year check
    const currentYear = now.getFullYear();
    const [execY, execM, execD] = (rec.execution_date || todayStr).split('-').map(Number);
    const targetDate = new Date(currentYear, (execM || 1) - 1, execD || 1);
    const dateStr = formatYMD(targetDate);

    if (dateStr >= startDateStr && dateStr <= todayStr) {
      const alreadyExists = existingExpenses.some((e) => {
        const d = (e.expense_date || e.date || '').slice(0, 10);
        return (
          (e.recurring_expense_id === rec.id && d === dateStr) ||
          (e.title === rec.title && e.category === rec.category && d === dateStr)
        );
      });

      if (!alreadyExists) {
        dueList.push({
          title: rec.title,
          category: rec.category,
          amount: rec.amount,
          expense_date: dateStr,
          description: rec.notes
            ? `${rec.notes} (স্বয়ংক্রিয় বাৎসরিক খরচ)`
            : `স্বয়ংক্রিয় বাৎসরিক খরচ (${rec.title})`,
          recurring_expense_id: rec.id,
          is_recurring_auto: true,
        });
      }
    }
  }

  return dueList;
}
