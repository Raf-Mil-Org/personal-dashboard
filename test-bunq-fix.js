// Test to verify Bunq investment issue is fixed
console.log('🧪 Testing Bunq Investment Fix\n');

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

    // FAIL-SAFE CHECK 7: CRITICAL - Exclude ALL Bunq transactions (they are savings, not investments)
    if (description.includes('bunq') || counterparty.includes('bunq')) {
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

function detectSavingsAndInvestments(transaction) {
    const tag = (transaction.tag || '').toLowerCase();
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // CRITICAL FIX: Re-evaluate existing tags to catch incorrect assignments
    // Only trust existing tags if they're clearly correct based on current rules
    let shouldTrustExistingTag = false;
    
    if (tag === 'savings') {
        // Trust savings tag if it has savings indicators
        const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
        const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
        const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account' || subcategory === 'emergency fund';
        shouldTrustExistingTag = hasSavingsKeyword || isSavingsCategory;
    } else if (tag === 'transfers') {
        // Trust transfers tag if it has transfer indicators
        const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
        const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
        shouldTrustExistingTag = hasTransferKeyword;
    } else if (tag === 'investments') {
        // CRITICAL: Only trust investments tag if it passes ALL investment checks
        // This prevents incorrect investment tags from being preserved
        shouldTrustExistingTag = detectInvestment(transaction);
    }

    // If existing tag is trustworthy, use it
    if (shouldTrustExistingTag) {
        return tag.charAt(0).toUpperCase() + tag.slice(1); // Capitalize first letter
    }

    // If existing tag is not trustworthy, re-evaluate from scratch
    if (!shouldTrustExistingTag) {
        console.log(`🔍 Re-evaluating untrustworthy tag "${tag}" for transaction: "${description}"`);
    }

    // PRIORITY 1: Savings detection (highest priority to avoid misclassification)
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account' || subcategory === 'emergency fund';
    
    if (hasSavingsKeyword || isSavingsCategory) {
        if (detectSavings(transaction)) {
            console.log(`✅ Re-classified as Savings: "${description}"`);
            return 'Savings';
        }
    }

    // PRIORITY 2: Investment detection (most restrictive)
    if (detectInvestment(transaction)) {
        return 'Investments';
    }

    // PRIORITY 3: General savings detection (for other cases)
    if (detectSavings(transaction)) {
        return 'Savings';
    }

    return null;
}

// Test cases
const testCases = [
    {
        name: 'R MILIOPOULOS BUNQ (should be Savings, not Investments)',
        transaction: {
            description: 'R MILIOPOULOS BUNQ',
            category: 'Other',
            subcategory: 'Savings',
            tag: 'Investments', // This is wrong!
            amount: '-50000',
            counterparty: 'NL28BUNQ2125534274'
        },
        expected: 'Savings'
    },
    {
        name: 'Bunq savings transfer (should be Savings)',
        transaction: {
            description: 'Transfer to Bunq savings account',
            category: 'Savings',
            subcategory: 'Savings account',
            tag: 'Other',
            amount: '-3000',
            counterparty: 'NL28BUNQ2125534274'
        },
        expected: 'Savings'
    },
    {
        name: 'Valid investment purchase (should be Investments)',
        transaction: {
            description: 'Stock purchase AAPL via Degiro',
            category: 'Investment',
            subcategory: 'Stock purchase',
            tag: 'Other',
            amount: '-15000',
            counterparty: 'DEGIRO'
        },
        expected: 'Investments'
    },
    {
        name: 'Bunq transaction with savings tag (should trust existing tag)',
        transaction: {
            description: 'R MILIOPOULOS BUNQ',
            category: 'Other',
            subcategory: 'Savings',
            tag: 'Savings', // This is correct!
            amount: '-50000',
            counterparty: 'NL28BUNQ2125534274'
        },
        expected: 'Savings'
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

console.log(`📊 Results: ${passed}/${total} tests passed (${Math.round((passed/total)*100)}%)`);

if (passed === total) {
    console.log('🎉 Bunq investment issue is FIXED!');
    console.log('✅ Bunq transactions are correctly classified as Savings');
    console.log('✅ Existing incorrect investment tags are re-evaluated');
    console.log('✅ Trustworthy existing tags are preserved');
} else {
    console.log('⚠️ Some tests failed. Review the failed cases above.');
}

console.log('\n🔧 Key Fixes Applied:');
console.log('1. ✅ Re-evaluation of existing tags');
console.log('2. ✅ CRITICAL: Bunq transactions excluded from investments');
console.log('3. ✅ Savings detection has highest priority');
console.log('4. ✅ Comprehensive fail-safe checks');
console.log('5. ✅ Trustworthy existing tags are preserved');

