// Monthly Reports Utilities
// Based on 23rd-of-the-month cycle (period starts on 23rd and ends on 22nd of next month)

import { determineTransactionType } from '@/utils/transactionTypeDetermination';
import { formatCentsAsEuro } from '@/utils/currencyUtils';

/**
 * Get the start date of the current period (23rd of current month)
 */
export function getCurrentPeriodStart() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // If we're past the 23rd of the current month, start from 23rd of current month
    // If we're before the 23rd, start from 23rd of previous month
    if (now.getDate() >= 23) {
        return new Date(currentYear, currentMonth, 23);
    } else {
        // Go to previous month
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return new Date(prevYear, prevMonth, 23);
    }
}

/**
 * Get the end date of the current period (22nd of next month)
 */
export function getCurrentPeriodEnd() {
    const start = getCurrentPeriodStart();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(22);
    return end;
}

/**
 * Get the start date of a specific period
 */
export function getPeriodStart(year, month) {
    return new Date(year, month, 23);
}

/**
 * Get the end date of a specific period
 */
export function getPeriodEnd(year, month) {
    const start = getPeriodStart(year, month);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(22);
    return end;
}

/**
 * Get the period for a specific date
 */
export function getPeriodForDate(date) {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    if (targetDate.getDate() >= 23) {
        // Date is in the period starting on 23rd of current month
        return {
            start: getPeriodStart(year, month),
            end: getPeriodEnd(year, month)
        };
    } else {
        // Date is in the period starting on 23rd of previous month
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        return {
            start: getPeriodStart(prevYear, prevMonth),
            end: getPeriodEnd(prevYear, prevMonth)
        };
    }
}

/**
 * Format date range for display
 */
export function formatDateRange(start, end) {
    const startStr = start.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const endStr = end.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    return `${startStr} - ${endStr}`;
}

/**
 * Get period name for display
 */
export function getPeriodName(start, end) {
    const startMonth = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return startMonth;
    }

    return `${startMonth} - ${endMonth}`;
}

/**
 * Filter transactions for a specific period
 */
export function filterTransactionsForPeriod(transactions, start, end) {
    return transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= start && transactionDate <= end;
    });
}

/**
 * Calculate monthly statistics for a period
 */
export function calculateMonthlyStats(transactions, start, end) {
    const periodTransactions = filterTransactionsForPeriod(transactions, start, end);

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    periodTransactions.forEach((transaction) => {
        const amount = parseInt(transaction.amount) || 0; // Amount is now stored in cents

        // Use enhanced transaction type determination
        const transactionType = determineTransactionType(transaction);

        if (transactionType.isIncome) {
            totalIncome += Math.abs(amount);
            incomeCount++;
        } else {
            totalExpenses += Math.abs(amount);
            expenseCount++;
        }
    });

    const netAmount = totalIncome - totalExpenses;

    return {
        period: {
            start,
            end,
            name: getPeriodName(start, end),
            formattedRange: formatDateRange(start, end)
        },
        summary: {
            totalIncome,
            totalExpenses,
            netAmount,
            incomeCount,
            expenseCount,
            totalTransactions: periodTransactions.length
        },
        transactions: periodTransactions
    };
}

/**
 * Get available periods for the last 12 months
 */
export function getAvailablePeriods() {
    const periods = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
        const periodDate = new Date(now);
        periodDate.setMonth(periodDate.getMonth() - i);

        const year = periodDate.getFullYear();
        const month = periodDate.getMonth();

        const start = getPeriodStart(year, month);
        const end = getPeriodEnd(year, month);

        periods.push({
            start,
            end,
            name: getPeriodName(start, end),
            formattedRange: formatDateRange(start, end),
            value: `${year}-${month.toString().padStart(2, '0')}`
        });
    }

    return periods;
}

/**
 * Compare two periods
 */
export function comparePeriods(currentStats, previousStats) {
    if (!currentStats || !previousStats) {
        return null;
    }

    const current = currentStats.summary;
    const previous = previousStats.summary;

    const incomeChange = current.totalIncome - previous.totalIncome;
    const expenseChange = current.totalExpenses - previous.totalExpenses;
    const netChange = current.netAmount - previous.netAmount;

    return {
        income: {
            current: current.totalIncome,
            previous: previous.totalIncome,
            change: incomeChange,
            changePercent: previous.totalIncome > 0 ? (incomeChange / previous.totalIncome) * 100 : 0
        },
        expenses: {
            current: current.totalExpenses,
            previous: previous.totalExpenses,
            change: expenseChange,
            changePercent: previous.totalExpenses > 0 ? (expenseChange / previous.totalExpenses) * 100 : 0
        },
        net: {
            current: current.netAmount,
            previous: previous.netAmount,
            change: netChange,
            changePercent: previous.netAmount !== 0 ? (netChange / Math.abs(previous.netAmount)) * 100 : 0
        }
    };
}
