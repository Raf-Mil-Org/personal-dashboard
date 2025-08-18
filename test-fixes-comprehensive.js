// Comprehensive test for all investment detection fixes
console.log('🧪 Testing All Investment Detection Fixes\n');

// Mock the detection functions with our fixes
const DETECTION_CONFIG = {
    investments: {
        keywords: [
            'investment purchase',
            'stock purchase',
            'bond purchase',
            'etf purchase',
            'mutual fund purchase',
            'portfolio purchase',
            'securities purchase',
            'trading purchase',
            'brokerage purchase',
            '401k contribution',
            'ira contribution',
            'roth contribution',
            'index fund purchase',
            'dividend reinvestment'
        ],
        accountPatterns: [/degiro/i, /trading212/i, /etoro/i, /coinbase/i, /binance/i, /kraken/i, /interactive brokers/i, /fidelity/i, /vanguard/i, /schwab/i],
        subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds']
    },
    savings: {
        keywords: ['savings', 'save', 'emergency fund', 'goal savings', 'deposit', 'contribution', 'reserve', 'nest egg', 'rainy day fund'],
        accountPatterns: [/bunq/i, /savings account/i, /emergency fund/i, /goal savings/i],
        subcategories: ['savings account', 'emergency fund', 'goal savings']
    },
    transfers: {
        keywords: ['transfer', 'internal transfer', 'account transfer', 'between accounts', 'own transfer', 'self transfer', 'move money'],
        accountPatterns: [/transfer to own account/i, /internal transfer/i, /between own accounts/i],
        subcategories: ['internal transfer', 'account transfer', 'between accounts']
    }
};

function detectInvestment(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;

    // Fix 3: Only classify outgoing transactions as investments (negative amounts)
    if (amount >= 0) {
        return false;
    }

    // Fix 4: Only classify transactions above a certain threshold as investments (to avoid small fees)
    const amountInEuros = Math.abs(amount) / 100;
    if (amountInEuros < 10) {
        return false;
    }

    // Fix 2: Expanded fee exclusion
    const feeKeywords = [
        'fee',
        'commission',
        'charge',
        'cost',
        'expense',
        'management fee',
        'transaction fee',
        'custody fee',
        'rebalancing fee',
        'trading fee',
        'brokerage fee',
        'service charge',
        'maintenance fee',
        'account fee',
        'monthly fee',
        'annual fee',
        'withdrawal fee',
        'deposit fee',
        'transfer fee',
        'processing fee',
        'handling fee'
    ];
    const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
        return false;
    }

    // Fix 5: Exclude withdrawals and transfers from investment accounts
    const withdrawalKeywords = ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out'];
    const hasWithdrawalKeyword = withdrawalKeywords.some((keyword) => description.includes(keyword));
    if (hasWithdrawalKeyword) {
        return false;
    }

    // Check subcategory first
    if (DETECTION_CONFIG.investments.subcategories.includes(subcategory)) {
        return true;
    }

    // Check keywords in description
    if (DETECTION_CONFIG.investments.keywords.some((keyword) => description.includes(keyword))) {
        return true;
    }

    // Fix 1: Check account patterns - only if they contain investment-specific keywords
    const hasInvestmentAccount = DETECTION_CONFIG.investments.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty));
    if (hasInvestmentAccount) {
        const investmentKeywords = ['purchase', 'buy', 'investment', 'stock', 'etf', 'bond', 'crypto', 'portfolio', 'securities', 'contribution'];
        const hasInvestmentKeyword = investmentKeywords.some((keyword) => description.includes(keyword));
        if (hasInvestmentKeyword) {
            return true;
        }
    }

    return false;
}

function detectSavings(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();

    // Check subcategory first
    if (DETECTION_CONFIG.savings.subcategories.includes(subcategory)) {
        return true;
    }

    // Check keywords in description
    if (DETECTION_CONFIG.savings.keywords.some((keyword) => description.includes(keyword))) {
        return true;
    }

    // Check account patterns
    if (DETECTION_CONFIG.savings.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty))) {
        return true;
    }

    return false;
}

function detectTransfer(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();

    // Check subcategory first
    if (DETECTION_CONFIG.transfers.subcategories.includes(subcategory)) {
        return true;
    }

    // Check keywords in description
    if (DETECTION_CONFIG.transfers.keywords.some((keyword) => description.includes(keyword))) {
        return true;
    }

    // Check account patterns
    if (DETECTION_CONFIG.transfers.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty))) {
        return true;
    }

    return false;
}

function detectSavingsAndInvestments(transaction) {
    const tag = (transaction.tag || '').toLowerCase();
    const description = (transaction.description || '').toLowerCase();

    // Check if already tagged correctly
    if (tag === 'investments' || tag === 'savings' || tag === 'transfers') {
        return tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    // Fix 7: For transactions with savings-specific keywords, prioritize savings over investments
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));

    if (hasSavingsKeyword && detectSavings(transaction)) {
        return 'Savings';
    }

    // Investment detection
    if (detectInvestment(transaction)) {
        return 'Investments';
    }

    // Savings detection (for other cases)
    if (detectSavings(transaction)) {
        return 'Savings';
    }

    // Transfer detection
    if (detectTransfer(transaction)) {
        return 'Transfers';
    }

    return null;
}

// Test cases covering all fixes
const testCases = [
    // Fix 1: Contextual account pattern matching
    {
        name: 'Degiro fee (should NOT be investment)',
        transaction: { description: 'Monthly fee from Degiro', amount: '-500', tag: 'Other' },
        expected: null
    },
    {
        name: 'Degiro stock purchase (should be investment)',
        transaction: { description: 'Stock purchase AAPL via Degiro', amount: '-15000', tag: 'Other' },
        expected: 'Investments'
    },
    {
        name: 'Flatex withdrawal (should NOT be investment)',
        transaction: { description: 'Withdrawal from Flatex', amount: '-5000', tag: 'Other' },
        expected: null
    },

    // Fix 2: Expanded fee exclusion
    {
        name: 'Trading fee (should NOT be investment)',
        transaction: { description: 'Trading fee for stock purchase', amount: '-500', tag: 'Other' },
        expected: null
    },
    {
        name: 'Service charge (should NOT be investment)',
        transaction: { description: 'Service charge from broker', amount: '-250', tag: 'Other' },
        expected: null
    },
    {
        name: 'Monthly account fee (should NOT be investment)',
        transaction: { description: 'Monthly account fee', amount: '-1000', tag: 'Other' },
        expected: null
    },

    // Fix 3: Transaction direction check
    {
        name: 'Dividend income (should NOT be investment)',
        transaction: { description: 'Dividend payment', amount: '5000', tag: 'Other' },
        expected: null
    },

    // Fix 4: Amount threshold
    {
        name: 'Small fee (should NOT be investment)',
        transaction: { description: 'Small trading fee', amount: '-500', tag: 'Other' },
        expected: null
    },
    {
        name: 'Large investment (should be investment)',
        transaction: { description: 'ETF purchase VTI', amount: '-10000', tag: 'Other' },
        expected: 'Investments'
    },

    // Fix 5: Withdrawal exclusion
    {
        name: 'Investment withdrawal (should NOT be investment)',
        transaction: { description: 'Withdrawal from investment account', amount: '-5000', tag: 'Other' },
        expected: null
    },
    {
        name: 'Stock sale (should NOT be investment)',
        transaction: { description: 'Sale of AAPL stock', amount: '-15000', tag: 'Other' },
        expected: null
    },

    // Fix 7: Savings priority
    {
        name: 'Bunq savings (should be savings, not investment)',
        transaction: { description: 'Transfer to Bunq savings account', amount: '-5000', tag: 'Other' },
        expected: 'Savings'
    },
    {
        name: 'Emergency fund (should be savings, not investment)',
        transaction: { description: 'Emergency fund deposit', amount: '-3000', tag: 'Other' },
        expected: 'Savings'
    },

    // Regular expenses (should NOT be investments)
    {
        name: 'Grocery shopping (should NOT be investment)',
        transaction: { description: 'Grocery shopping at Albert Heijn', amount: '-4500', tag: 'Other' },
        expected: null
    },
    {
        name: 'Restaurant payment (should NOT be investment)',
        transaction: { description: 'Restaurant payment', amount: '-2500', tag: 'Other' },
        expected: null
    },

    // Valid investments (should be investments)
    {
        name: 'ETF purchase (should be investment)',
        transaction: { description: 'Investment purchase in Vanguard ETF', amount: '-10000', tag: 'Other' },
        expected: 'Investments'
    },
    {
        name: 'Stock purchase (should be investment)',
        transaction: { description: 'Stock purchase AAPL', amount: '-15000', tag: 'Other' },
        expected: 'Investments'
    }
];

// Run tests
let passed = 0;
let total = testCases.length;

console.log(`Running ${total} test cases...\n`);

testCases.forEach((testCase, index) => {
    const result = detectSavingsAndInvestments(testCase.transaction);
    const success = result === testCase.expected;

    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result || 'null'}`);
    console.log(`  ${success ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    if (success) passed++;
});

console.log(`📊 Results: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);

if (passed === total) {
    console.log('🎉 All fixes are working correctly!');
} else {
    console.log('⚠️ Some tests failed. Review the failed cases above.');
}

