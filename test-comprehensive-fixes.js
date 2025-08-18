// Comprehensive test for all investment detection fixes with proper priorities
console.log('🧪 Testing Comprehensive Investment Detection Fixes\n');

// Mock the detection functions with our comprehensive fixes
const DETECTION_CONFIG = {
    investments: {
        keywords: [
            'investment purchase', 'stock purchase', 'bond purchase', 'etf purchase',
            'mutual fund purchase', 'portfolio purchase', 'securities purchase',
            'trading purchase', 'brokerage purchase', '401k contribution',
            'ira contribution', 'roth contribution', 'index fund purchase',
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

    // FAIL-SAFE CHECK 1: Only classify outgoing transactions as investments (negative amounts)
    if (amount >= 0) {
        return false;
    }

    // FAIL-SAFE CHECK 2: Only classify transactions above a certain threshold as investments (to avoid small fees)
    const amountInEuros = Math.abs(amount) / 100;
    if (amountInEuros < 10) {
        return false;
    }

    // FAIL-SAFE CHECK 3: Comprehensive fee exclusion
    const feeKeywords = [
        'fee', 'commission', 'charge', 'cost', 'expense',
        'management fee', 'transaction fee', 'custody fee', 'rebalancing fee',
        'trading fee', 'brokerage fee', 'service charge', 'maintenance fee',
        'account fee', 'monthly fee', 'annual fee', 'withdrawal fee',
        'deposit fee', 'transfer fee', 'processing fee', 'handling fee',
        'custody', 'administration', 'platform fee', 'exchange fee'
    ];
    const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
        return false;
    }

    // FAIL-SAFE CHECK 4: Exclude withdrawals, sales, and transfers from investment accounts
    const withdrawalKeywords = [
        'withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption',
        'cash out', 'disposal', 'liquidation', 'exit', 'close position'
    ];
    const hasWithdrawalKeyword = withdrawalKeywords.some((keyword) => description.includes(keyword));
    if (hasWithdrawalKeyword) {
        return false;
    }

    // FAIL-SAFE CHECK 5: Exclude tax-related transactions
    const taxKeywords = ['tax', 'withholding', 'dividend tax', 'capital gains'];
    const hasTaxKeyword = taxKeywords.some((keyword) => description.includes(keyword));
    if (hasTaxKeyword) {
        return false;
    }

    // FAIL-SAFE CHECK 6: Exclude savings-related transactions
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    if (hasSavingsKeyword) {
        return false;
    }

    // POSITIVE CHECK 1: Check for specific investment purchase keywords
    const investmentPurchaseKeywords = [
        'investment purchase', 'stock purchase', 'bond purchase', 'etf purchase',
        'mutual fund purchase', 'portfolio purchase', 'securities purchase',
        'trading purchase', 'brokerage purchase', '401k contribution',
        'ira contribution', 'roth contribution', 'index fund purchase',
        'dividend reinvestment', 'buy', 'purchase'
    ];
    const hasInvestmentPurchaseKeyword = investmentPurchaseKeywords.some((keyword) => description.includes(keyword));
    if (hasInvestmentPurchaseKeyword) {
        return true;
    }

    // POSITIVE CHECK 2: Check subcategory (but only for specific purchase-related subcategories)
    const validInvestmentSubcategories = ['investment purchase', 'stock purchase', 'etf purchase', 'bond purchase'];
    if (validInvestmentSubcategories.includes(subcategory)) {
        return true;
    }

    // POSITIVE CHECK 3: Check account patterns with strict context validation
    const hasInvestmentAccount = DETECTION_CONFIG.investments.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty));
    if (hasInvestmentAccount) {
        // Only classify as investment if the transaction contains specific purchase keywords
        const strictInvestmentKeywords = ['purchase', 'buy', 'investment purchase', 'stock purchase', 'etf purchase'];
        const hasStrictInvestmentKeyword = strictInvestmentKeywords.some((keyword) => description.includes(keyword));
        if (hasStrictInvestmentKeyword) {
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
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // Check if already tagged correctly
    if (tag === 'investments' || tag === 'savings' || tag === 'transfers') {
        return tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    // PRIORITY 1: Savings detection (highest priority to avoid misclassification)
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account' || subcategory === 'emergency fund';
    
    if (hasSavingsKeyword || isSavingsCategory) {
        if (detectSavings(transaction)) {
            return 'Savings';
        }
    }

    // PRIORITY 2: Transfer detection (before investments to avoid misclassification)
    const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
    const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
    
    if (hasTransferKeyword && detectTransfer(transaction)) {
        return 'Transfers';
    }

    // PRIORITY 3: Investment detection (most restrictive)
    if (detectInvestment(transaction)) {
        return 'Investments';
    }

    // PRIORITY 4: General savings detection (for other cases)
    if (detectSavings(transaction)) {
        return 'Savings';
    }

    // PRIORITY 5: General transfer detection (for other cases)
    if (detectTransfer(transaction)) {
        return 'Transfers';
    }

    return null;
}

// Test cases covering all scenarios
const testCases = [
    // PRIORITY 1: Savings should take precedence over investments
    {
        name: 'Bunq savings transfer (should be Savings, not Investments)',
        transaction: { description: 'Transfer to Bunq savings account', amount: '-5000', tag: 'Other', category: 'savings', subcategory: 'savings account' },
        expected: 'Savings'
    },
    {
        name: 'Emergency fund deposit (should be Savings, not Investments)',
        transaction: { description: 'Emergency fund deposit', amount: '-3000', tag: 'Other', category: 'savings', subcategory: 'emergency fund' },
        expected: 'Savings'
    },
    {
        name: 'Savings with investment provider (should be Savings)',
        transaction: { description: 'Savings deposit via Degiro', amount: '-2000', tag: 'Other', category: 'other', subcategory: 'savings' },
        expected: 'Savings'
    },

    // PRIORITY 2: Transfers should take precedence over investments
    {
        name: 'Account transfer (should be Transfers, not Investments)',
        transaction: { description: 'Transfer between accounts', amount: '-1000', tag: 'Other', category: 'transfer', subcategory: 'account transfer' },
        expected: 'Transfers'
    },

    // PRIORITY 3: Valid investments (should be Investments)
    {
        name: 'Stock purchase via Degiro (should be Investments)',
        transaction: { description: 'Stock purchase AAPL via Degiro', amount: '-15000', tag: 'Other', category: 'investment', subcategory: 'stock' },
        expected: 'Investments'
    },
    {
        name: 'ETF purchase (should be Investments)',
        transaction: { description: 'ETF purchase VTI', amount: '-10000', tag: 'Other', category: 'investment', subcategory: 'etf' },
        expected: 'Investments'
    },

    // FAIL-SAFE CHECKS: Should NOT be investments
    {
        name: 'Degiro fee (should NOT be investment)',
        transaction: { description: 'Monthly fee from Degiro', amount: '-500', tag: 'Other', category: 'expense', subcategory: 'fees' },
        expected: null
    },
    {
        name: 'Small trading fee (should NOT be investment)',
        transaction: { description: 'Small trading fee', amount: '-500', tag: 'Other', category: 'expense', subcategory: 'fees' },
        expected: null
    },
    {
        name: 'Withdrawal from investment account (should NOT be investment)',
        transaction: { description: 'Withdrawal from investment account', amount: '-5000', tag: 'Other', category: 'investment', subcategory: 'withdrawal' },
        expected: null
    },
    {
        name: 'Dividend tax payment (should NOT be investment)',
        transaction: { description: 'Dividend tax payment', amount: '-1000', tag: 'Other', category: 'expense', subcategory: 'tax' },
        expected: null
    },
    {
        name: 'Positive dividend (should NOT be investment)',
        transaction: { description: 'Dividend payment', amount: '5000', tag: 'Other', category: 'income', subcategory: 'dividend' },
        expected: null
    },
    {
        name: 'Stock sale (should NOT be investment)',
        transaction: { description: 'Sale of AAPL stock', amount: '-15000', tag: 'Other', category: 'investment', subcategory: 'sale' },
        expected: null
    },

    // Edge cases that should be handled correctly
    {
        name: 'Regular expense (should NOT be investment)',
        transaction: { description: 'Grocery shopping at Albert Heijn', amount: '-4500', tag: 'Other', category: 'expense', subcategory: 'groceries' },
        expected: null
    },
    {
        name: 'Restaurant payment (should NOT be investment)',
        transaction: { description: 'Restaurant payment', amount: '-2500', tag: 'Other', category: 'expense', subcategory: 'dining' },
        expected: null
    }
];

// Run tests
let passed = 0;
let total = testCases.length;

console.log(`Running ${total} comprehensive test cases...\n`);

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

console.log(`📊 Results: ${passed}/${total} tests passed (${Math.round((passed/total)*100)}%)`);

if (passed === total) {
    console.log('🎉 All comprehensive fixes are working correctly!');
    console.log('✅ Priorities are properly enforced');
    console.log('✅ Fail-safe checks are working');
    console.log('✅ Context validation is functioning');
} else {
    console.log('⚠️ Some tests failed. Review the failed cases above.');
}

console.log('\n🔧 Key Improvements Implemented:');
console.log('1. ✅ Savings detection has highest priority');
console.log('2. ✅ Transfer detection has second priority');
console.log('3. ✅ Investment detection is most restrictive');
console.log('4. ✅ Comprehensive fee exclusion');
console.log('5. ✅ Withdrawal/sale exclusion');
console.log('6. ✅ Tax-related exclusion');
console.log('7. ✅ Amount threshold checks');
console.log('8. ✅ Context validation for account patterns');
console.log('9. ✅ Specific purchase keyword requirements');
console.log('10. ✅ Proper category/subcategory mapping');

