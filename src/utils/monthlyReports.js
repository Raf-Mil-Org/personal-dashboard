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
    let totalSavings = 0;
    let totalInvestments = 0;
    let totalTransfers = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let savingsCount = 0;
    let investmentCount = 0;
    let transferCount = 0;

    periodTransactions.forEach((transaction) => {
        const amount = parseInt(transaction.amount) || 0; // Amount is now stored in cents
        const transactionTag = transaction.tag || '';
        const transactionDescription = transaction.description || '';

        // Use enhanced transaction type determination
        const transactionType = determineTransactionType(transaction);

        if (transactionType.isIncome) {
            // Check for specific exclusions in income
            if (!transactionDescription.toLowerCase().trim().includes('rmiliopoulosbunq') && !transactionDescription.toLowerCase().trim().includes('flatex')) {
                totalIncome += Math.abs(amount);
                incomeCount++;
            }
        } else {
            // Check if it's savings, investments, or transfers (not expenses)
            if (transactionTag.toLowerCase() === 'savings' || transactionDescription.toLowerCase().trim().includes('rmiliopoulosbunq')) {
                totalSavings += Math.abs(amount);
                savingsCount++;
            } else if (transactionTag.toLowerCase() === 'investments' || transactionDescription.toLowerCase().trim().includes('flatex')) {
                totalInvestments += Math.abs(amount);
                investmentCount++;
            } else if (transactionTag.toLowerCase() === 'transfers') {
                totalTransfers += Math.abs(amount);
                transferCount++;
            } else {
                // Only count as expense if it's not savings, investments, or transfers
                totalExpenses += Math.abs(amount);
                expenseCount++;
            }
        }
    });

    const netAmount = totalIncome - totalExpenses - totalSavings - totalInvestments - totalTransfers;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

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
            totalSavings,
            totalInvestments,
            totalTransfers,
            netAmount,
            savingsRate,
            incomeCount,
            expenseCount,
            savingsCount,
            investmentCount,
            transferCount,
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

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSavings = 0;
    let totalInvestments = 0;
    let totalTransfers = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let savingsCount = 0;
    let investmentCount = 0;
    let transferCount = 0;

    transactions.forEach((transaction) => {
        const amount = parseInt(transaction.amount) || 0; // Amount is now stored in cents
        const transactionTag = transaction.tag || '';
        const transactionDescription = transaction.description || '';

        // Use enhanced transaction type determination
        const transactionType = determineTransactionType(transaction);

        if (transactionType.isIncome) {
            // Check for specific exclusions in income
            if (!transactionDescription.toLowerCase().trim().includes('rmiliopoulosbunq') && !transactionDescription.toLowerCase().trim().includes('flatex')) {
                totalIncome += Math.abs(amount);
                incomeCount++;
            }
        } else {
            // Check if it's savings, investments, or transfers (not expenses)
            if (transactionTag.toLowerCase() === 'savings' || transactionDescription.toLowerCase().trim().includes('rmiliopoulosbunq')) {
                totalSavings += Math.abs(amount);
                savingsCount++;
            } else if (transactionTag.toLowerCase() === 'investments' || transactionDescription.toLowerCase().trim().includes('flatex')) {
                totalInvestments += Math.abs(amount);
                investmentCount++;
            } else if (transactionTag.toLowerCase() === 'transfers') {
                totalTransfers += Math.abs(amount);
                transferCount++;
            } else {
                // Only count as expense if it's not savings, investments, or transfers
                totalExpenses += Math.abs(amount);
                expenseCount++;
            }
        }
    });

    const netAmount = totalIncome - totalExpenses - totalSavings - totalInvestments - totalTransfers;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    return {
        period: {
            start: null,
            end: null,
            name: 'Total (All Periods)',
            formattedRange: 'All Available Data'
        },
        summary: {
            totalIncome,
            totalExpenses,
            totalSavings,
            totalInvestments,
            totalTransfers,
            netAmount,
            savingsRate,
            incomeCount,
            expenseCount,
            savingsCount,
            investmentCount,
            transferCount,
            totalTransactions: transactions.length
        },
        transactions: transactions
    };
}
