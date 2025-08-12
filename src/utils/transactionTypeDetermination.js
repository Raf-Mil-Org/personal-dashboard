/**
 * Transaction Type Determination Utility
 * Determines whether a transaction is income or expense based on multiple criteria
 */

/**
 * Determine if a transaction is income or expense
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Object with isIncome boolean, method used, and confidence level
 */
export function determineTransactionType(transaction) {
    const debitCredit = transaction.debit_credit || '';
    const amount = parseFloat((transaction.amount || '0').toString().replace(',', '.'));
    const description = (transaction.description || '').toLowerCase();
    
    // Method 1: Check debit_credit field (CSV format) - High Confidence
    if (debitCredit.trim().toLowerCase() === 'credit') {
        return { 
            isIncome: true, 
            method: 'debit_credit_field', 
            value: debitCredit, 
            confidence: 'high' 
        };
    }
    if (debitCredit.trim().toLowerCase() === 'debit') {
        return { 
            isIncome: false, 
            method: 'debit_credit_field', 
            value: debitCredit, 
            confidence: 'high' 
        };
    }
    
    // Method 2: Check for payback indicators - High Confidence
    const paybackKeywords = [
        'payback', 'repayment', 'settlement', 'reimbursement', 'refund', 'return',
        'cashback', 'credit back', 'adjustment', 'reversal', 'chargeback'
    ];
    
    const hasPaybackKeyword = paybackKeywords.some(keyword => description.includes(keyword));
    if (hasPaybackKeyword) {
        return { 
            isIncome: true, 
            method: 'payback_detection', 
            value: 'payback_keyword_found', 
            confidence: 'high' 
        };
    }
    
    // Method 3: Check for income indicators - Medium Confidence
    const incomeKeywords = [
        'salary', 'income', 'deposit', 'credit', 'payment received', 'transfer in',
        'bonus', 'dividend', 'interest received', 'compensation', 'allowance', 
        'grant', 'award', 'commission', 'fee received'
    ];
    
    const hasIncomeKeyword = incomeKeywords.some(keyword => description.includes(keyword));
    if (hasIncomeKeyword) {
        return { 
            isIncome: true, 
            method: 'income_keywords', 
            value: 'income_keyword_found', 
            confidence: 'medium' 
        };
    }
    
    // Method 4: Check for expense indicators - Medium Confidence
    const expenseKeywords = [
        'purchase', 'payment', 'debit', 'withdrawal', 'transfer out', 'fee', 'charge',
        'bill', 'subscription', 'rent', 'mortgage', 'loan payment', 'tax', 'insurance',
        'shopping', 'dining', 'transport', 'fuel', 'parking', 'toll', 'service charge'
    ];
    
    const hasExpenseKeyword = expenseKeywords.some(keyword => description.includes(keyword));
    if (hasExpenseKeyword) {
        return { 
            isIncome: false, 
            method: 'expense_keywords', 
            value: 'expense_keyword_found', 
            confidence: 'medium' 
        };
    }
    
    // Method 5: Amount sign analysis (fallback) - Low Confidence
    // For JSON format where we don't have debit_credit field
    if (amount > 0) {
        return { 
            isIncome: true, 
            method: 'amount_sign_positive', 
            value: amount, 
            confidence: 'low' 
        };
    }
    if (amount < 0) {
        return { 
            isIncome: false, 
            method: 'amount_sign_negative', 
            value: amount, 
            confidence: 'low' 
        };
    }
    
    // Default: assume expense (most transactions are expenses)
    return { 
        isIncome: false, 
        method: 'default_assumption', 
        value: 'assumed_expense', 
        confidence: 'low' 
    };
}

/**
 * Format amount with proper sign and color class
 * @param {string|number} amount - Transaction amount
 * @param {Object} transaction - Full transaction object for type determination
 * @returns {Object} - Object with formatted amount and color class
 */
export function formatAmountWithType(amount, transaction) {
    if (!amount || amount === 'No Amount') {
        return { formatted: 'No Amount', colorClass: '' };
    }
    
    // Handle comma as decimal separator (European format)
    const cleanAmount = amount.toString().replace(',', '.');
    const num = parseFloat(cleanAmount);
    
    if (isNaN(num)) {
        return { formatted: amount, colorClass: '' };
    }
    
    // Determine transaction type
    const transactionType = determineTransactionType(transaction);
    
    // Format amount with proper sign
    const sign = transactionType.isIncome ? '+' : '';
    const absoluteValue = Math.abs(num);
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(absoluteValue);
    
    const formatted = `${sign}${formattedValue}`;
    const colorClass = transactionType.isIncome ? 'text-green-600 font-semibold' : 'text-black-600 font-semibold';
    
    return { formatted, colorClass, transactionType };
}

/**
 * Test function to verify transaction type determination
 * @returns {Array} - Array of test cases with results
 */
export function testTransactionTypeDetermination() {
    const testCases = [
        // CSV format with debit_credit field
        {
            description: 'Salary payment (CSV)',
            amount: '2500.00',
            debit_credit: 'credit',
            description: 'Salary payment',
            expected: { isIncome: true, confidence: 'high' }
        },
        {
            description: 'Grocery shopping (CSV)',
            amount: '45.67',
            debit_credit: 'debit',
            description: 'Grocery shopping',
            expected: { isIncome: false, confidence: 'high' }
        },
        // JSON format with amount sign
        {
            description: 'Restaurant payment (JSON)',
            amount: '-89.50',
            debit_credit: '',
            description: 'Restaurant payment',
            expected: { isIncome: false, confidence: 'low' }
        },
        {
            description: 'Salary deposit (JSON)',
            amount: '3000.00',
            debit_credit: '',
            description: 'Salary deposit',
            expected: { isIncome: true, confidence: 'low' }
        },
        // Payback scenarios
        {
            description: 'Reimbursement',
            amount: '150.00',
            debit_credit: '',
            description: 'Reimbursement for travel expenses',
            expected: { isIncome: true, confidence: 'high' }
        },
        {
            description: 'Cashback',
            amount: '25.30',
            debit_credit: '',
            description: 'Cashback from credit card',
            expected: { isIncome: true, confidence: 'high' }
        },
        // Income keywords
        {
            description: 'Bonus payment',
            amount: '500.00',
            debit_credit: '',
            description: 'Annual bonus payment',
            expected: { isIncome: true, confidence: 'medium' }
        },
        // Expense keywords
        {
            description: 'Insurance payment',
            amount: '-120.00',
            debit_credit: '',
            description: 'Monthly insurance payment',
            expected: { isIncome: false, confidence: 'medium' }
        }
    ];
    
    const results = testCases.map(testCase => {
        const result = determineTransactionType(testCase);
        const passed = result.isIncome === testCase.expected.isIncome && 
                      result.confidence === testCase.expected.confidence;
        
        return {
            ...testCase,
            result,
            passed,
            status: passed ? '✅ PASS' : '❌ FAIL'
        };
    });
    
    console.log('🧪 Transaction Type Determination Test Results:');
    results.forEach((test, index) => {
        console.log(`${test.status} Test ${index + 1}: ${test.description}`);
        console.log(`  Expected: ${test.expected.isIncome ? 'Income' : 'Expense'} (${test.expected.confidence} confidence)`);
        console.log(`  Got: ${test.result.isIncome ? 'Income' : 'Expense'} (${test.result.confidence} confidence) - ${test.result.method}`);
    });
    
    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n📊 Results: ${passedCount}/${results.length} tests passed`);
    
    return results;
} 