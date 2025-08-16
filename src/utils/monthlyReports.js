// Monthly Reports Utilities
// Based on 23rd-of-the-month cycle (period starts on 23rd and ends on 22nd of next month)

import { getTransactionStatistics } from '@/utils/transactionClassification';

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

    // Use the new transaction classification system
    const stats = getTransactionStatistics(periodTransactions);

    // Calculate net amount and savings rate
    const netAmount = stats.totalIncome - stats.outgoingGroups.expenses - stats.totalSavings - stats.outgoingGroups.investments - stats.outgoingGroups.transfers;
    const savingsRate = stats.totalIncome > 0 ? (stats.totalSavings / stats.totalIncome) * 100 : 0;

    return {
        period: {
            start,
            end,
            name: getPeriodName(start, end),
            formattedRange: formatDateRange(start, end)
        },
        summary: {
            totalIncome: stats.totalIncome,
            totalExpenses: stats.outgoingGroups.expenses,
            totalSavings: stats.totalSavings, // Use net savings instead of outgoing savings
            totalInvestments: stats.outgoingGroups.investments,
            totalTransfers: stats.outgoingGroups.transfers,
            netAmount,
            savingsRate,
            incomeCount: stats.counts.income,
            expenseCount: stats.counts.expenses,
            savingsCount: stats.counts.savings,
            investmentCount: stats.counts.investments,
            transferCount: stats.counts.outgoingTransfers,
            totalTransactions: periodTransactions.length
        },
        transactions: periodTransactions
    };
}

/**
 * Get available periods for the last 12 months
 * @param {boolean} includeCurrentMonth - Whether to include the current month (default: true)
 * @returns {Array} Array of period objects
 */
export function getAvailablePeriods(includeCurrentMonth = true) {
    const periods = [];
    const now = new Date();

    // Determine the starting offset
    // If includeCurrentMonth is false, start from the previous month
    const startOffset = includeCurrentMonth ? 0 : 1;

    for (let i = startOffset; i < 12 + startOffset; i++) {
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
    const savingsChange = current.totalSavings - previous.totalSavings;
    const investmentChange = current.totalInvestments - previous.totalInvestments;
    const transferChange = current.totalTransfers - previous.totalTransfers;
    const netChange = current.netAmount - previous.netAmount;
    const savingsRateChange = current.savingsRate - previous.savingsRate;

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
        savings: {
            current: current.totalSavings,
            previous: previous.totalSavings,
            change: savingsChange,
            changePercent: previous.totalSavings > 0 ? (savingsChange / previous.totalSavings) * 100 : 0
        },
        investments: {
            current: current.totalInvestments,
            previous: previous.totalInvestments,
            change: investmentChange,
            changePercent: previous.totalInvestments > 0 ? (investmentChange / previous.totalInvestments) * 100 : 0
        },
        transfers: {
            current: current.totalTransfers,
            previous: previous.totalTransfers,
            change: transferChange,
            changePercent: previous.totalTransfers > 0 ? (transferChange / previous.totalTransfers) * 100 : 0
        },
        savingsRate: {
            current: current.savingsRate,
            previous: previous.savingsRate,
            change: savingsRateChange,
            changePercent: previous.savingsRate > 0 ? (savingsRateChange / previous.savingsRate) * 100 : 0
        },
        net: {
            current: current.netAmount,
            previous: previous.netAmount,
            change: netChange,
            changePercent: previous.netAmount !== 0 ? (netChange / Math.abs(previous.netAmount)) * 100 : 0
        }
    };
}

/**
 * Calculate total statistics for all available data
 */
export function calculateTotalStats(transactions) {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    // Use the new transaction classification system
    const stats = getTransactionStatistics(transactions);

    // Calculate net amount and savings rate
    const netAmount = stats.totalIncome - stats.outgoingGroups.expenses - stats.totalSavings - stats.outgoingGroups.investments - stats.outgoingGroups.transfers;
    const savingsRate = stats.totalIncome > 0 ? (stats.totalSavings / stats.totalIncome) * 100 : 0;

    return {
        period: {
            start: null,
            end: null,
            name: 'Total (All Periods)',
            formattedRange: 'All Available Data'
        },
        summary: {
            totalIncome: stats.totalIncome,
            totalExpenses: stats.outgoingGroups.expenses,
            totalSavings: stats.totalSavings, // Use net savings instead of outgoing savings
            totalInvestments: stats.outgoingGroups.investments,
            totalTransfers: stats.outgoingGroups.transfers,
            netAmount,
            savingsRate,
            incomeCount: stats.counts.income,
            expenseCount: stats.counts.expenses,
            savingsCount: stats.counts.savings,
            investmentCount: stats.counts.investments,
            transferCount: stats.counts.outgoingTransfers,
            totalTransactions: transactions.length
        },
        transactions: transactions
    };
}
