// Test script to verify investment detection fixes
// This script tests various transaction scenarios to ensure proper classification

// Mock transaction store functions for testing
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

    // Exclude transactions that contain fee-related terms
    const feeKeywords = ['fee', 'commission', 'charge', 'cost', 'expense', 'management fee', 'transaction fee', 'custody fee', 'rebalancing fee', 'trading fee', 'brokerage fee'];
    const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
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

    // Check account patterns
    if (DETECTION_CONFIG.investments.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty))) {
        return true;
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

    // Check if already tagged correctly
    if (tag === 'investments' || tag === 'savings' || tag === 'transfers') {
        return tag.charAt(0).toUpperCase() + tag.slice(1); // Capitalize first letter
    }

    // Investment detection (highest priority)
    if (detectInvestment(transaction)) {
        return 'Investments';
    }

    // Savings detection
    if (detectSavings(transaction)) {
        return 'Savings';
    }

    // Transfer detection
    if (detectTransfer(transaction)) {
        return 'Transfers';
    }

    return null; // No automatic detection
}

// Test transactions
const testTransactions = [
    // Should be classified as Investments
    {
        id: '1',
        description: 'Investment purchase in Vanguard ETF',
        tag: 'Other',
        category: 'investment',
        subcategory: 'etf'
    },
    {
        id: '2',
        description: 'Stock purchase AAPL via Degiro',
        tag: 'Other',
        category: 'investment',
        subcategory: 'stock'
    },
    {
        id: '3',
        description: 'ETF purchase VTI',
        tag: 'Other',
        category: 'investment',
        subcategory: 'etf'
    },

    // Should NOT be classified as Investments (fees)
    {
        id: '4',
        description: 'Trading fee for stock purchase',
        tag: 'Other',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '5',
        description: 'Brokerage fee from Degiro',
        tag: 'Other',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '6',
        description: 'Management fee for portfolio',
        tag: 'Other',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '7',
        description: 'Transaction fee from Flatex',
        tag: 'Other',
        category: 'expense',
        subcategory: 'fees'
    },

    // Should be classified as Savings
    {
        id: '8',
        description: 'Transfer to Bunq savings account',
        tag: 'Other',
        category: 'savings',
        subcategory: 'savings account'
    },
    {
        id: '9',
        description: 'Emergency fund deposit',
        tag: 'Other',
        category: 'savings',
        subcategory: 'emergency fund'
    },

    // Should NOT be classified as anything (regular expenses)
    {
        id: '10',
        description: 'Grocery shopping at Albert Heijn',
        tag: 'Other',
        category: 'expense',
        subcategory: 'groceries'
    },
    {
        id: '11',
        description: 'Restaurant payment',
        tag: 'Other',
        category: 'expense',
        subcategory: 'dining'
    },
    {
        id: '12',
        description: 'Transport ticket',
        tag: 'Other',
        category: 'expense',
        subcategory: 'transport'
    },

    // Edge cases that should NOT be investments
    {
        id: '13',
        description: 'Dividend tax payment',
        tag: 'Other',
        category: 'expense',
        subcategory: 'tax'
    },
    {
        id: '14',
        description: 'Portfolio management fee',
        tag: 'Other',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '15',
        description: 'Trading commission from broker',
        tag: 'Other',
        category: 'expense',
        subcategory: 'fees'
    }
];

// Run tests
console.log('🧪 Testing Investment Detection Fixes\n');

let correctClassifications = 0;
let totalTests = 0;

testTransactions.forEach((transaction, index) => {
    const result = detectSavingsAndInvestments(transaction);
    const expected = getExpectedClassification(transaction);

    console.log(`Test ${index + 1}: "${transaction.description}"`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Got: ${result || 'null'}`);

    if (result === expected) {
        console.log(`  ✅ PASS`);
        correctClassifications++;
    } else {
        console.log(`  ❌ FAIL`);
    }
    console.log('');

    totalTests++;
});

console.log(`📊 Results: ${correctClassifications}/${totalTests} tests passed (${Math.round((correctClassifications / totalTests) * 100)}%)`);

function getExpectedClassification(transaction) {
    const description = transaction.description.toLowerCase();

    // Should be Investments
    if (
        description.includes('investment purchase') ||
        description.includes('stock purchase') ||
        description.includes('etf purchase') ||
        (description.includes('degiro') && !description.includes('fee')) ||
        transaction.subcategory === 'etf' ||
        transaction.subcategory === 'stock'
    ) {
        return 'Investments';
    }

    // Should be Savings
    if (description.includes('savings') || description.includes('emergency fund') || description.includes('bunq') || transaction.subcategory === 'savings account' || transaction.subcategory === 'emergency fund') {
        return 'Savings';
    }

    // Should NOT be classified (fees, regular expenses)
    if (
        description.includes('fee') ||
        description.includes('commission') ||
        description.includes('charge') ||
        description.includes('tax') ||
        description.includes('grocery') ||
        description.includes('restaurant') ||
        description.includes('transport')
    ) {
        return null;
    }

    return null;
}

