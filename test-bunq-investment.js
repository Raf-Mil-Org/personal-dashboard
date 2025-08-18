// Test script to verify Bunq transaction classification
// Run this in the browser console or Node.js environment

// Mock the TAG_RULES from useTransactionEngine.js
const TAG_RULES = {
    savings: {
        keywords: ['savings', 'bunq'],
        accountPatterns: [/bunq/i, /savings account/i],
        subcategories: ['savings account', 'emergency fund', 'goal savings'],
        tag: 'Savings',
        confidence: 0.9,
        reason: 'Savings indicators detected'
    },
    investments: {
        keywords: ['flatex', 'degiro'],
        accountPatterns: [/degiro/i, /flatex/i],
        subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds'],
        tag: 'Investments',
        confidence: 0.7,
        reason: 'Investment indicators detected',
        exclusions: {
            positiveAmounts: true,
            minimumAmount: 10,
            feeKeywords: ['fee', 'commission', 'charge', 'cost', 'expense'],
            withdrawalKeywords: ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale'],
            taxKeywords: ['tax', 'withholding', 'dividend tax', 'capital gains'],
            savingsKeywords: ['savings', 'emergency fund', 'bunq', 'deposit'],
            bunqExclusion: true
        }
    }
};

// Mock the detection functions
function isSavingsTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    const rules = TAG_RULES.savings;

    // Check keywords
    const hasKeyword = rules.keywords.some((keyword) => description.includes(keyword));
    if (hasKeyword) return true;

    // Check account patterns
    const hasAccountPattern = rules.accountPatterns.some((pattern) => pattern.test(description));
    if (hasAccountPattern) return true;

    // Check subcategories
    const hasSubcategory = rules.subcategories.some((sub) => subcategory.includes(sub));
    if (hasSubcategory) return true;

    // Check category
    const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account';
    if (isSavingsCategory) return true;

    return false;
}

function isInvestmentTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;
    const rules = TAG_RULES.investments;
    const exclusions = rules.exclusions;

    // FAIL-SAFE CHECKS (must pass ALL)

    // Check 1: Only negative amounts can be investments
    if (exclusions.positiveAmounts && amount >= 0) return false;

    // Check 2: Minimum amount threshold
    if (Math.abs(amount) / 100 < exclusions.minimumAmount) return false;

    // Check 3: Exclude fees
    const hasFeeKeyword = exclusions.feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) return false;

    // Check 4: Exclude withdrawals/sales
    const hasWithdrawalKeyword = exclusions.withdrawalKeywords.some((keyword) => description.includes(keyword));
    if (hasWithdrawalKeyword) return false;

    // Check 5: Exclude taxes
    const hasTaxKeyword = exclusions.taxKeywords.some((keyword) => description.includes(keyword));
    if (hasTaxKeyword) return false;

    // Check 6: Exclude savings
    const hasSavingsKeyword = exclusions.savingsKeywords.some((keyword) => description.includes(keyword));
    if (hasSavingsKeyword) return false;

    // Check 7: Exclude Bunq transactions
    if (exclusions.bunqExclusion && description.includes('bunq')) return false;

    // POSITIVE CHECKS (must pass at least one AND be very specific)

    // Check 1: Specific investment purchase keywords (most restrictive)
    const hasSpecificInvestmentKeyword = rules.keywords.some((keyword) => description.includes(keyword));
    if (hasSpecificInvestmentKeyword) return true;

    // Check 2: Investment account patterns with strict context validation
    const hasInvestmentAccount = rules.accountPatterns.some((pattern) => pattern.test(description));
    if (hasInvestmentAccount) {
        // Only classify as investment if the transaction contains specific purchase keywords
        const strictInvestmentKeywords = ['purchase', 'buy', 'investment purchase', 'stock purchase', 'etf purchase'];
        const hasStrictInvestmentKeyword = strictInvestmentKeywords.some((keyword) => description.includes(keyword));
        if (hasStrictInvestmentKeyword) {
            return true;
        }
    }

    // Check 3: Very specific investment subcategories only
    const validInvestmentSubcategories = ['investment purchase', 'stock purchase', 'etf purchase', 'bond purchase'];
    if (validInvestmentSubcategories.includes(subcategory)) {
        return true;
    }

    // If none of the positive checks pass, it's NOT an investment
    return false;
}

// Test transactions
const testTransactions = [
    {
        description: 'Bunq savings deposit',
        amount: -1000,
        category: '',
        subcategory: ''
    },
    {
        description: 'Bunq transfer to savings',
        amount: -500,
        category: '',
        subcategory: ''
    },
    {
        description: 'Bunq investment purchase',
        amount: -2000,
        category: '',
        subcategory: ''
    },
    {
        description: 'Bunq fee',
        amount: -5,
        category: '',
        subcategory: ''
    },
    {
        description: 'Bunq withdrawal',
        amount: 1000,
        category: '',
        subcategory: ''
    }
];

console.log('Testing Bunq transaction classification:');
console.log('=====================================');

testTransactions.forEach((transaction, index) => {
    console.log(`\nTest ${index + 1}: "${transaction.description}" (€${transaction.amount / 100})`);

    const isSavings = isSavingsTransaction(transaction);
    const isInvestment = isInvestmentTransaction(transaction);

    console.log(`  Is Savings: ${isSavings}`);
    console.log(`  Is Investment: ${isInvestment}`);

    if (isSavings) {
        console.log(`  → Should be tagged as: Savings`);
    } else if (isInvestment) {
        console.log(`  → Should be tagged as: Investments`);
    } else {
        console.log(`  → Should be tagged as: Other`);
    }
});

console.log('\nExpected behavior:');
console.log('- All Bunq transactions should be tagged as Savings, not Investments');
console.log('- The bunqExclusion should prevent any Bunq transaction from being classified as Investment');
