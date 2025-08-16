/**
 * Transaction Classification System
 *
 * This system first determines if a transaction is incoming or outgoing,
 * then groups them into appropriate categories for better financial analysis.
 */

/**
 * Determine if a transaction is incoming or outgoing
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Classification result
 */
export function classifyTransactionDirection(transaction) {
    const debitCredit = transaction.debit_credit || '';
    const amount = parseInt(transaction.amount || '0'); // Amount is stored in cents
    const description = (transaction.description || '').toLowerCase();

    // Method 1: Check debit_credit field (CSV format) - High Confidence
    if (debitCredit.trim().toLowerCase() === 'credit') {
        return {
            direction: 'incoming',
            method: 'debit_credit_field',
            value: debitCredit,
            confidence: 'high'
        };
    }
    if (debitCredit.trim().toLowerCase() === 'debit') {
        return {
            direction: 'outgoing',
            method: 'debit_credit_field',
            value: debitCredit,
            confidence: 'high'
        };
    }

    // Method 2: Amount sign analysis (JSON format) - Medium Confidence
    if (amount > 0) {
        return {
            direction: 'incoming',
            method: 'amount_sign_positive',
            value: amount,
            confidence: 'medium'
        };
    }
    if (amount < 0) {
        return {
            direction: 'outgoing',
            method: 'amount_sign_negative',
            value: amount,
            confidence: 'medium'
        };
    }

    // Default: assume outgoing (most transactions are outgoing)
    return {
        direction: 'outgoing',
        method: 'default_assumption',
        value: 'assumed_outgoing',
        confidence: 'low'
    };
}

/**
 * Classify incoming transactions into groups
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Group classification
 */
export function classifyIncomingTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const tag = (transaction.tag || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // Check for refunds/reimbursements first
    const refundKeywords = ['refund', 'reimbursement', 'payback', 'repayment', 'settlement', 'cashback', 'credit back', 'adjustment', 'reversal', 'chargeback', 'return'];
    const hasRefundKeyword = refundKeywords.some((keyword) => description.includes(keyword));
    if (hasRefundKeyword) {
        return {
            group: 'refund',
            subgroup: 'general_refund',
            confidence: 'high'
        };
    }

    // Check for transfers from personal accounts
    const transferKeywords = ['transfer', 'bunq', 'flatex', 'account transfer', 'internal transfer'];
    const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
    if (hasTransferKeyword) {
        return {
            group: 'transfer',
            subgroup: 'personal_account',
            confidence: 'high'
        };
    }

    // Check for specific income sources (salary, business income, etc.)
    // Only transactions with these specific keywords are classified as income
    const incomeKeywords = ['salary', 'payslip', 'wage', 'bonus', 'commission', 'dividend', 'interest received', 'compensation', 'allowance', 'grant', 'award', 'fee received', 'business income', 'freelance', 'consulting', 'rental income', 'royalty'];
    const hasIncomeKeyword = incomeKeywords.some((keyword) => description.includes(keyword));
    if (hasIncomeKeyword) {
        return {
            group: 'income',
            subgroup: 'regular_income',
            confidence: 'high'
        };
    }

    // Smart logic: Check if this is money coming FROM a savings account
    // If so, classify as transfer (not income) since it's moving money between accounts
    const savingsAccountKeywords = ['bunq', 'savings', 'spaarrekening', 'X39367173', 'savings account', 'emergency fund'];
    const isFromSavingsAccount = savingsAccountKeywords.some((keyword) => description.includes(keyword));
    const isFromSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'emergency fund';
    const isFromSavingsTag = tag === 'savings';

    if (isFromSavingsAccount || isFromSavingsCategory || isFromSavingsTag) {
        return {
            group: 'transfer',
            subgroup: 'from_savings_account',
            confidence: 'high'
        };
    }

    // Smart logic: Check if this is money coming FROM an investment account
    // If so, classify as transfer (not income) since it's moving money between accounts
    const investmentAccountKeywords = ['flatex', 'investment', 'stock', 'bond', 'etf', 'mutual fund', 'portfolio', 'securities', 'trading', 'brokerage'];
    const isFromInvestmentAccount = investmentAccountKeywords.some((keyword) => description.includes(keyword));
    const isFromInvestmentCategory = category === 'investment' || category === 'investments' || subcategory === 'investment' || subcategory === 'etf' || subcategory === 'stock' || subcategory === 'bond';
    const isFromInvestmentTag = tag === 'investments';

    if (isFromInvestmentAccount || isFromInvestmentCategory || isFromInvestmentTag) {
        return {
            group: 'transfer',
            subgroup: 'from_investment_account',
            confidence: 'high'
        };
    }

    // Check by tag
    if (tag === 'income' || tag === 'salary' || tag === 'bonus') {
        return {
            group: 'income',
            subgroup: tag,
            confidence: 'medium'
        };
    }

    if (tag === 'transfer') {
        return {
            group: 'transfer',
            subgroup: 'tagged_transfer',
            confidence: 'medium'
        };
    }

    // Check by category/subcategory
    if (category === 'income' || subcategory === 'income') {
        return {
            group: 'income',
            subgroup: 'categorized_income',
            confidence: 'medium'
        };
    }

    // Default for incoming transactions - be conservative and classify as transfer if unclear
    return {
        group: 'transfer',
        subgroup: 'unknown_incoming',
        confidence: 'low'
    };
}

/**
 * Classify outgoing transactions into groups
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Group classification
 */
export function classifyOutgoingTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const tag = (transaction.tag || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // Check for savings first
    const savingsKeywords = [
        'bunq',
        'savings',
        'emergency fund',
        'savings account',
        'deposit',
        'save',
        'reserve',
        'backup',
        'nest egg',
        'rainy day fund',
        'savings deposit',
        'money market',
        'certificate of deposit',
        'cd',
        'spaarrekening', // Dutch for savings account
        'X39367173' // Specific account identifier
    ];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    if (hasSavingsKeyword || tag === 'savings') {
        return {
            group: 'savings',
            subgroup: 'general_savings',
            confidence: 'high'
        };
    }

    // Check by category/subcategory for savings
    if (category === 'savings' || subcategory === 'savings' || subcategory === 'emergency fund') {
        return {
            group: 'savings',
            subgroup: 'categorized_savings',
            confidence: 'medium'
        };
    }

    // Check for investments
    const investmentKeywords = ['flatex', 'investment', 'stock', 'bond', 'etf', 'mutual fund', 'retirement', 'pension', 'portfolio', 'securities', 'trading', 'brokerage', '401k', 'ira', 'roth', 'index fund', 'dividend reinvestment'];
    const hasInvestmentKeyword = investmentKeywords.some((keyword) => description.includes(keyword));
    if (hasInvestmentKeyword || tag === 'investments') {
        return {
            group: 'investments',
            subgroup: 'general_investment',
            confidence: 'high'
        };
    }

    // Check by category/subcategory for investments
    if (category === 'investment' || category === 'investments' || subcategory === 'investment' || subcategory === 'etf' || subcategory === 'stock' || subcategory === 'bond') {
        return {
            group: 'investments',
            subgroup: 'categorized_investment',
            confidence: 'medium'
        };
    }

    // Check for transfers
    if (tag === 'transfers') {
        return {
            group: 'transfers',
            subgroup: 'outgoing_transfer',
            confidence: 'medium'
        };
    }

    // Check for expense indicators
    const expenseKeywords = [
        'purchase',
        'payment',
        'debit',
        'withdrawal',
        'fee',
        'charge',
        'bill',
        'subscription',
        'rent',
        'mortgage',
        'loan payment',
        'tax',
        'insurance',
        'shopping',
        'dining',
        'transport',
        'fuel',
        'parking',
        'toll',
        'service charge'
    ];
    const hasExpenseKeyword = expenseKeywords.some((keyword) => description.includes(keyword));
    if (hasExpenseKeyword) {
        return {
            group: 'expenses',
            subgroup: 'general_expense',
            confidence: 'medium'
        };
    }

    // Default for outgoing transactions
    return {
        group: 'expenses',
        subgroup: 'other_expense',
        confidence: 'low'
    };
}

/**
 * Complete transaction classification
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Complete classification result
 */
export function classifyTransaction(transaction) {
    // First determine direction
    const directionResult = classifyTransactionDirection(transaction);

    // Then classify based on direction
    let groupResult;
    if (directionResult.direction === 'incoming') {
        groupResult = classifyIncomingTransaction(transaction);
    } else {
        groupResult = classifyOutgoingTransaction(transaction);
    }

    return {
        direction: directionResult.direction,
        group: groupResult.group,
        subgroup: groupResult.subgroup,
        method: directionResult.method,
        confidence: Math.min(directionResult.confidence === 'high' ? 3 : directionResult.confidence === 'medium' ? 2 : 1, groupResult.confidence === 'high' ? 3 : groupResult.confidence === 'medium' ? 2 : 1),
        amount: parseInt(transaction.amount || '0')
    };
}

/**
 * Get statistics for a collection of transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} - Statistics object with the following structure:
 * - totalIncoming: All incoming transactions (income + transfers + refunds)
 * - totalOutgoing: All outgoing transactions (expenses + savings + investments + transfers)
 * - totalIncome: Only actual income sources (salary, business income, etc.) - NOT transfers or refunds
 * - totalSavings: Net savings (deposits to savings - withdrawals from savings)
 * - incomingGroups: Breakdown of incoming transactions by type
 * - outgoingGroups: Breakdown of outgoing transactions by type
 * - counts: Transaction counts for each category
 */
export function getTransactionStatistics(transactions) {
    if (!transactions || transactions.length === 0) {
        return {
            totalIncoming: 0,
            totalOutgoing: 0,
            totalIncome: 0, // Only actual income sources (salary, business, etc.)
            totalSavings: 0, // Net savings (deposits - withdrawals)
            incomingGroups: {
                income: 0,
                transfer: 0,
                refund: 0
            },
            outgoingGroups: {
                expenses: 0,
                savings: 0,
                investments: 0,
                transfers: 0
            },
            counts: {
                total: 0,
                incoming: 0,
                outgoing: 0,
                income: 0,
                transfer: 0,
                refund: 0,
                expenses: 0,
                savings: 0,
                investments: 0,
                outgoingTransfers: 0
            }
        };
    }

    let totalIncoming = 0;
    let totalOutgoing = 0;
    let totalIncome = 0; // Only actual income sources (salary, business, etc.)
    let totalSavings = 0; // Net savings (deposits - withdrawals)
    const incomingGroups = { income: 0, transfer: 0, refund: 0 };
    const outgoingGroups = { expenses: 0, savings: 0, investments: 0, transfers: 0 };
    const counts = {
        total: transactions.length,
        incoming: 0,
        outgoing: 0,
        income: 0,
        transfer: 0,
        refund: 0,
        expenses: 0,
        savings: 0,
        investments: 0,
        outgoingTransfers: 0
    };

    transactions.forEach((transaction) => {
        const classification = classifyTransaction(transaction);
        const amount = Math.abs(classification.amount);

        if (classification.direction === 'incoming') {
            totalIncoming += amount;
            counts.incoming++;
            incomingGroups[classification.group] += amount;
            counts[classification.group]++;

            // Only count as income if it's specifically classified as income
            if (classification.group === 'income') {
                totalIncome += amount;
            }

            // Track money coming FROM savings accounts (withdrawals)
            if (classification.subgroup === 'from_savings_account') {
                totalSavings -= amount; // Subtract withdrawals from net savings
            }
        } else {
            totalOutgoing += amount;
            counts.outgoing++;

            if (classification.group === 'transfers') {
                outgoingGroups.transfers += amount;
                counts.outgoingTransfers++;
            } else {
                outgoingGroups[classification.group] += amount;
                counts[classification.group]++;
            }

            // Track money going TO savings accounts (deposits)
            if (classification.group === 'savings') {
                totalSavings += amount; // Add deposits to net savings
            }
        }
    });

    return {
        totalIncoming,
        totalOutgoing,
        totalIncome, // Only actual income sources (salary, business, etc.)
        totalSavings, // Net savings (deposits - withdrawals)
        incomingGroups,
        outgoingGroups,
        counts
    };
}
