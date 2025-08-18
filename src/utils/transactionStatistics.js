/**
 * Transaction Statistics Utility
 *
 * Consolidated statistics calculation for transactions:
 * - Financial metrics (income, expenses, savings, investments)
 * - Tag breakdowns and analysis
 * - Period-based calculations
 * - Performance metrics
 */

import { formatCentsAsEuro } from './currencyUtils';

/**
 * Calculate comprehensive transaction statistics
 */
export function calculateTransactionStatistics(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return getEmptyStatistics();
    }

    const stats = {
        // Basic counts
        totalTransactions: transactions.length,
        taggedTransactions: 0,
        untaggedTransactions: 0,

        // Financial totals (in cents)
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        totalInvestments: 0,
        totalTransfers: 0,
        totalOther: 0,

        // Tag breakdown
        tagBreakdown: {},
        tagAmounts: {},

        // Performance metrics
        savingsRate: 0,
        investmentRate: 0,
        netAmount: 0,

        // Period analysis
        dateRange: null,
        averageTransactionAmount: 0,

        // Category analysis
        categoryBreakdown: {},
        subcategoryBreakdown: {},

        // Confidence metrics
        averageConfidence: 0,
        lowConfidenceCount: 0
    };

    let totalAmount = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    let minDate = null;
    let maxDate = null;

    transactions.forEach((transaction) => {
        const amount = parseInt(transaction.amount) || 0;
        const tag = transaction.tag || 'Untagged';
        const category = transaction.category || 'Unknown';
        const subcategory = transaction.subcategory || 'Unknown';
        const confidence = transaction.classificationConfidence || 0;

        // Update counts
        if (tag === 'Untagged') {
            stats.untaggedTransactions++;
        } else {
            stats.taggedTransactions++;
        }

        // Update financial totals
        totalAmount += amount;

        if (amount > 0) {
            stats.totalIncome += amount;
        } else {
            stats.totalExpenses += Math.abs(amount);
        }

        // Update tag-specific totals
        switch (tag) {
            case 'Savings':
                stats.totalSavings += Math.abs(amount);
                break;
            case 'Investments':
                stats.totalInvestments += Math.abs(amount);
                break;
            case 'Transfers':
                stats.totalTransfers += Math.abs(amount);
                break;
            case 'Other':
                stats.totalOther += Math.abs(amount);
                break;
        }

        // Update tag breakdown
        stats.tagBreakdown[tag] = (stats.tagBreakdown[tag] || 0) + 1;
        stats.tagAmounts[tag] = (stats.tagAmounts[tag] || 0) + Math.abs(amount);

        // Update category breakdown
        stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
        stats.subcategoryBreakdown[subcategory] = (stats.subcategoryBreakdown[subcategory] || 0) + 1;

        // Update confidence metrics
        if (confidence > 0) {
            totalConfidence += confidence;
            confidenceCount++;
        }
        if (confidence < 0.6) {
            stats.lowConfidenceCount++;
        }

        // Update date range
        const date = transaction.date || transaction.transaction_date;
        if (date) {
            const dateObj = new Date(date);
            if (!minDate || dateObj < minDate) minDate = dateObj;
            if (!maxDate || dateObj > maxDate) maxDate = dateObj;
        }
    });

    // Calculate derived metrics
    stats.netAmount = stats.totalIncome - stats.totalExpenses;
    stats.averageTransactionAmount = totalAmount / transactions.length;
    stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    // Calculate rates
    if (stats.totalIncome > 0) {
        stats.savingsRate = (stats.totalSavings / stats.totalIncome) * 100;
        stats.investmentRate = (stats.totalInvestments / stats.totalIncome) * 100;
    }

    // Set date range
    if (minDate && maxDate) {
        stats.dateRange = {
            start: minDate.toISOString().split('T')[0],
            end: maxDate.toISOString().split('T')[0],
            days: Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))
        };
    }

    return stats;
}

/**
 * Calculate period-based statistics
 */
export function calculatePeriodStatistics(transactions, period = 'month') {
    const periodStats = {};

    transactions.forEach((transaction) => {
        const date = transaction.date || transaction.transaction_date;
        if (!date) return;

        const dateObj = new Date(date);
        let periodKey;

        switch (period) {
            case 'day':
                periodKey = dateObj.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(dateObj);
                weekStart.setDate(dateObj.getDate() - dateObj.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'quarter':
                const quarter = Math.floor(dateObj.getMonth() / 3) + 1;
                periodKey = `${dateObj.getFullYear()}-Q${quarter}`;
                break;
            case 'year':
                periodKey = dateObj.getFullYear().toString();
                break;
            default:
                periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!periodStats[periodKey]) {
            periodStats[periodKey] = {
                period: periodKey,
                transactions: [],
                totalIncome: 0,
                totalExpenses: 0,
                totalSavings: 0,
                totalInvestments: 0,
                totalTransfers: 0,
                netAmount: 0,
                transactionCount: 0
            };
        }

        const amount = parseInt(transaction.amount) || 0;
        const tag = transaction.tag || 'Untagged';

        periodStats[periodKey].transactions.push(transaction);
        periodStats[periodKey].transactionCount++;

        if (amount > 0) {
            periodStats[periodKey].totalIncome += amount;
        } else {
            periodStats[periodKey].totalExpenses += Math.abs(amount);
        }

        switch (tag) {
            case 'Savings':
                periodStats[periodKey].totalSavings += Math.abs(amount);
                break;
            case 'Investments':
                periodStats[periodKey].totalInvestments += Math.abs(amount);
                break;
            case 'Transfers':
                periodStats[periodKey].totalTransfers += Math.abs(amount);
                break;
        }

        periodStats[periodKey].netAmount = periodStats[periodKey].totalIncome - periodStats[periodKey].totalExpenses;
    });

    return Object.values(periodStats).sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Calculate tag-specific statistics
 */
export function calculateTagStatistics(transactions, tag) {
    const tagTransactions = transactions.filter((t) => t.tag === tag);

    if (tagTransactions.length === 0) {
        return {
            tag,
            count: 0,
            totalAmount: 0,
            averageAmount: 0,
            percentage: 0,
            transactions: []
        };
    }

    const totalAmount = tagTransactions.reduce((sum, t) => sum + Math.abs(parseInt(t.amount) || 0), 0);
    const averageAmount = totalAmount / tagTransactions.length;
    const percentage = (tagTransactions.length / transactions.length) * 100;

    return {
        tag,
        count: tagTransactions.length,
        totalAmount,
        averageAmount,
        percentage,
        transactions: tagTransactions
    };
}

/**
 * Calculate confidence analysis
 */
export function calculateConfidenceAnalysis(transactions) {
    const analysis = {
        highConfidence: 0, // > 0.8
        mediumConfidence: 0, // 0.6 - 0.8
        lowConfidence: 0, // < 0.6
        noConfidence: 0, // no confidence data
        averageConfidence: 0,
        confidenceBreakdown: {}
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    transactions.forEach((transaction) => {
        const confidence = transaction.classificationConfidence || 0;

        if (confidence === 0) {
            analysis.noConfidence++;
        } else if (confidence > 0.8) {
            analysis.highConfidence++;
        } else if (confidence > 0.6) {
            analysis.mediumConfidence++;
        } else {
            analysis.lowConfidence++;
        }

        if (confidence > 0) {
            totalConfidence += confidence;
            confidenceCount++;
        }

        // Confidence breakdown by tag
        const tag = transaction.tag || 'Untagged';
        if (!analysis.confidenceBreakdown[tag]) {
            analysis.confidenceBreakdown[tag] = {
                count: 0,
                totalConfidence: 0,
                averageConfidence: 0
            };
        }
        analysis.confidenceBreakdown[tag].count++;
        analysis.confidenceBreakdown[tag].totalConfidence += confidence;
    });

    // Calculate averages
    analysis.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    Object.values(analysis.confidenceBreakdown).forEach((breakdown) => {
        breakdown.averageConfidence = breakdown.count > 0 ? breakdown.totalConfidence / breakdown.count : 0;
    });

    return analysis;
}

/**
 * Generate formatted statistics for display
 */
export function formatStatistics(stats) {
    return {
        ...stats,
        // Format monetary values
        formattedTotalIncome: formatCentsAsEuro(stats.totalIncome),
        formattedTotalExpenses: formatCentsAsEuro(stats.totalExpenses),
        formattedTotalSavings: formatCentsAsEuro(stats.totalSavings),
        formattedTotalInvestments: formatCentsAsEuro(stats.totalInvestments),
        formattedTotalTransfers: formatCentsAsEuro(stats.totalTransfers),
        formattedNetAmount: formatCentsAsEuro(stats.netAmount),
        formattedAverageTransaction: formatCentsAsEuro(stats.averageTransactionAmount),

        // Format percentages
        formattedSavingsRate: `${stats.savingsRate.toFixed(1)}%`,
        formattedInvestmentRate: `${stats.investmentRate.toFixed(1)}%`,

        // Format confidence
        formattedAverageConfidence: `${(stats.averageConfidence * 100).toFixed(1)}%`
    };
}

/**
 * Get empty statistics object
 */
function getEmptyStatistics() {
    return {
        totalTransactions: 0,
        taggedTransactions: 0,
        untaggedTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        totalInvestments: 0,
        totalTransfers: 0,
        totalOther: 0,
        tagBreakdown: {},
        tagAmounts: {},
        savingsRate: 0,
        investmentRate: 0,
        netAmount: 0,
        dateRange: null,
        averageTransactionAmount: 0,
        categoryBreakdown: {},
        subcategoryBreakdown: {},
        averageConfidence: 0,
        lowConfidenceCount: 0
    };
}

/**
 * Export statistics to various formats
 */
export function exportStatistics(stats, format = 'json') {
    switch (format.toLowerCase()) {
        case 'json':
            return JSON.stringify(stats, null, 2);
        case 'csv':
            return convertToCSV(stats);
        case 'summary':
            return generateSummary(stats);
        default:
            return JSON.stringify(stats, null, 2);
    }
}

/**
 * Convert statistics to CSV format
 */
function convertToCSV(stats) {
    const lines = [];

    // Header
    lines.push('Metric,Value');

    // Basic metrics
    lines.push(`Total Transactions,${stats.totalTransactions}`);
    lines.push(`Total Income,${formatCentsAsEuro(stats.totalIncome)}`);
    lines.push(`Total Expenses,${formatCentsAsEuro(stats.totalExpenses)}`);
    lines.push(`Net Amount,${formatCentsAsEuro(stats.netAmount)}`);
    lines.push(`Savings Rate,${stats.savingsRate.toFixed(1)}%`);
    lines.push(`Investment Rate,${stats.investmentRate.toFixed(1)}%`);

    // Tag breakdown
    lines.push('');
    lines.push('Tag Breakdown');
    Object.entries(stats.tagBreakdown).forEach(([tag, count]) => {
        lines.push(`${tag},${count}`);
    });

    return lines.join('\n');
}

/**
 * Generate human-readable summary
 */
function generateSummary(stats) {
    return `
Transaction Analysis Summary
============================

Overview:
- Total Transactions: ${stats.totalTransactions}
- Date Range: ${stats.dateRange ? `${stats.dateRange.start} to ${stats.dateRange.end} (${stats.dateRange.days} days)` : 'Unknown'}

Financial Summary:
- Total Income: ${formatCentsAsEuro(stats.totalIncome)}
- Total Expenses: ${formatCentsAsEuro(stats.totalExpenses)}
- Net Amount: ${formatCentsAsEuro(stats.netAmount)}
- Average Transaction: ${formatCentsAsEuro(stats.averageTransactionAmount)}

Savings & Investments:
- Total Savings: ${formatCentsAsEuro(stats.totalSavings)} (${stats.savingsRate.toFixed(1)}% of income)
- Total Investments: ${formatCentsAsEuro(stats.totalInvestments)} (${stats.investmentRate.toFixed(1)}% of income)
- Total Transfers: ${formatCentsAsEuro(stats.totalTransfers)}

Tag Distribution:
${Object.entries(stats.tagBreakdown)
    .map(([tag, count]) => `- ${tag}: ${count} transactions (${((count / stats.totalTransactions) * 100).toFixed(1)}%)`)
    .join('\n')}

Quality Metrics:
- Tagged Transactions: ${stats.taggedTransactions} (${((stats.taggedTransactions / stats.totalTransactions) * 100).toFixed(1)}%)
- Average Classification Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%
- Low Confidence Transactions: ${stats.lowConfidenceCount}
`;
}
