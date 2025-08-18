// Test script to investigate charity transaction classification
// This will help identify why a charity transaction might be tagged as investments

console.log('🔍 Charity Transaction Classification Test');
console.log('========================================');

// Mock the TAG_RULES from useTransactionEngine.js
const TAG_RULES = {
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
function isInvestmentTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;
    const rules = TAG_RULES.investments;
    const exclusions = rules.exclusions;

    console.log(`\n🔍 Analyzing transaction: "${transaction.description}"`);
    console.log(`   Category: ${transaction.category}`);
    console.log(`   Subcategory: ${transaction.subcategory}`);
    console.log(`   Amount: €${amount / 100}`);

    // FAIL-SAFE CHECKS (must pass ALL)

    // Check 1: Only negative amounts can be investments
    if (exclusions.positiveAmounts && amount >= 0) {
        console.log(`   ❌ FAIL-SAFE 1: Positive amount (€${amount / 100}) - not an investment`);
        return false;
    }

    // Check 2: Minimum amount threshold
    if (Math.abs(amount) / 100 < exclusions.minimumAmount) {
        console.log(`   ❌ FAIL-SAFE 2: Amount too small (€${Math.abs(amount) / 100}) - not an investment`);
        return false;
    }

    // Check 3: Exclude fees
    const hasFeeKeyword = exclusions.feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
        console.log(`   ❌ FAIL-SAFE 3: Contains fee keyword - not an investment`);
        return false;
    }

    // Check 4: Exclude withdrawals/sales
    const hasWithdrawalKeyword = exclusions.withdrawalKeywords.some((keyword) => description.includes(keyword));
    if (hasWithdrawalKeyword) {
        console.log(`   ❌ FAIL-SAFE 4: Contains withdrawal keyword - not an investment`);
        return false;
    }

    // Check 5: Exclude taxes
    const hasTaxKeyword = exclusions.taxKeywords.some((keyword) => description.includes(keyword));
    if (hasTaxKeyword) {
        console.log(`   ❌ FAIL-SAFE 5: Contains tax keyword - not an investment`);
        return false;
    }

    // Check 6: Exclude savings
    const hasSavingsKeyword = exclusions.savingsKeywords.some((keyword) => description.includes(keyword));
    if (hasSavingsKeyword) {
        console.log(`   ❌ FAIL-SAFE 6: Contains savings keyword - not an investment`);
        return false;
    }

    // Check 7: Exclude Bunq transactions
    if (exclusions.bunqExclusion && description.includes('bunq')) {
        console.log(`   ❌ FAIL-SAFE 7: Contains 'bunq' - not an investment`);
        return false;
    }

    console.log(`   ✅ All fail-safe checks passed`);

    // POSITIVE CHECKS (must pass at least one AND be very specific)

    // Check 1: Specific investment purchase keywords (most restrictive)
    const hasSpecificInvestmentKeyword = rules.keywords.some((keyword) => description.includes(keyword));
    if (hasSpecificInvestmentKeyword) {
        console.log(`   ✅ POSITIVE 1: Contains investment keyword`);
        return true;
    }

    // Check 2: Investment account patterns with strict context validation
    const hasInvestmentAccount = rules.accountPatterns.some((pattern) => pattern.test(description));
    if (hasInvestmentAccount) {
        // Only classify as investment if the transaction contains specific purchase keywords
        const strictInvestmentKeywords = ['purchase', 'buy', 'investment purchase', 'stock purchase', 'etf purchase'];
        const hasStrictInvestmentKeyword = strictInvestmentKeywords.some((keyword) => description.includes(keyword));
        if (hasStrictInvestmentKeyword) {
            console.log(`   ✅ POSITIVE 2: Investment account + purchase keyword`);
            return true;
        }
    }

    // Check 3: Very specific investment subcategories only
    const validInvestmentSubcategories = ['investment purchase', 'stock purchase', 'etf purchase', 'bond purchase'];
    if (validInvestmentSubcategories.includes(subcategory)) {
        console.log(`   ✅ POSITIVE 3: Valid investment subcategory`);
        return true;
    }

    console.log(`   ❌ No positive investment indicators found`);
    return false;
}

// Test transactions
const testTransactions = [
    {
        description: 'Charity donation to Red Cross',
        category: 'Other',
        subcategory: 'charity',
        amount: -5000
    },
    {
        description: 'Donation to UNICEF',
        category: 'Other',
        subcategory: 'charity',
        amount: -2500
    },
    {
        description: 'Investment purchase via Degiro',
        category: 'Other',
        subcategory: 'investment',
        amount: -10000
    },
    {
        description: 'Charity donation with investment-like description',
        category: 'Other',
        subcategory: 'charity',
        amount: -1500
    }
];

console.log('\n🧪 Testing transaction classification:');

testTransactions.forEach((transaction, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    const isInvestment = isInvestmentTransaction(transaction);
    console.log(`\n📊 Result: ${isInvestment ? 'INVESTMENT' : 'NOT INVESTMENT'}`);

    if (isInvestment) {
        console.log(`   ⚠️  This transaction was classified as INVESTMENT`);
        console.log(`   💡 This might be the issue you're experiencing`);
    } else {
        console.log(`   ✅ This transaction was correctly NOT classified as investment`);
    }
});

console.log('\n🔍 Possible reasons for charity being tagged as investment:');
console.log('1. The transaction description contains investment-related keywords');
console.log('2. The transaction was manually overridden in the past');
console.log('3. There might be learned rules that are incorrectly classifying it');
console.log('4. The transaction might have been processed before the current rules were in place');
console.log('\n💡 To debug further, check:');
console.log('- The exact transaction description');
console.log('- Whether the transaction has any override history');
console.log('- The browser console for classification logs');
