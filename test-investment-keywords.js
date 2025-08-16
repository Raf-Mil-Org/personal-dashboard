/**
 * Test file to identify problematic investment keywords
 * This will help us see which keywords are incorrectly classifying expenses as investments
 */

// Test transactions that should be expenses but might be caught by investment keywords
const testExpenseTransactions = [
    {
        id: '1',
        amount: '-1500',
        description: 'Trading fee for stock purchase',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '2',
        amount: '-2500',
        description: 'Portfolio management fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '3',
        amount: '-500',
        description: 'Securities transaction fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '4',
        amount: '-1000',
        description: 'Brokerage account fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '5',
        amount: '-750',
        description: 'Investment platform fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '6',
        amount: '-300',
        description: 'Trading commission',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '7',
        amount: '-2000',
        description: 'Portfolio rebalancing fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '8',
        amount: '-1200',
        description: 'Securities custody fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    }
];

// Current investment keywords (problematic ones)
const currentInvestmentKeywords = ['flatex', 'investment', 'stock', 'bond', 'etf', 'mutual fund', 'retirement', 'pension', 'portfolio', 'securities', 'trading', 'brokerage', '401k', 'ira', 'roth', 'index fund', 'dividend reinvestment'];

// Test which keywords are causing false positives
console.log('🔍 Testing Investment Keywords for False Positives:');
console.log('These transactions should be EXPENSES, not investments:');

testExpenseTransactions.forEach((transaction) => {
    const description = transaction.description.toLowerCase();
    const matchingKeywords = currentInvestmentKeywords.filter((keyword) => description.includes(keyword));

    console.log(`\n📄 "${transaction.description}"`);
    console.log(`   Amount: ${transaction.amount} cents`);
    console.log(`   Should be: EXPENSE`);
    console.log(`   Matching investment keywords: ${matchingKeywords.length > 0 ? matchingKeywords.join(', ') : 'None'}`);
    console.log(`   Status: ${matchingKeywords.length > 0 ? '❌ INCORRECTLY caught by investment keywords' : '✅ Correctly not caught'}`);
});

// Identify problematic keywords
console.log('\n🚨 PROBLEMATIC KEYWORDS:');
const problematicKeywords = [];
currentInvestmentKeywords.forEach((keyword) => {
    const transactionsWithKeyword = testExpenseTransactions.filter((t) => t.description.toLowerCase().includes(keyword));
    if (transactionsWithKeyword.length > 0) {
        problematicKeywords.push({
            keyword,
            count: transactionsWithKeyword.length,
            examples: transactionsWithKeyword.map((t) => t.description)
        });
    }
});

problematicKeywords.forEach((item) => {
    console.log(`\n❌ "${item.keyword}" - catches ${item.count} expense transactions:`);
    item.examples.forEach((example) => console.log(`   - "${example}"`));
});

// Suggest fixes
console.log('\n💡 SUGGESTED FIXES:');
console.log('1. Make keywords more specific by adding context');
console.log('2. Add negative lookahead for fee-related terms');
console.log('3. Prioritize expense keywords over investment keywords');

// Proposed improved keywords
const improvedInvestmentKeywords = [
    'flatex',
    'investment purchase',
    'stock purchase',
    'bond purchase',
    'etf purchase',
    'mutual fund purchase',
    'retirement contribution',
    'pension contribution',
    'portfolio purchase',
    'securities purchase',
    'trading purchase',
    'brokerage purchase',
    '401k contribution',
    'ira contribution',
    'roth contribution',
    'index fund purchase',
    'dividend reinvestment'
];

console.log('\n✅ IMPROVED KEYWORDS (more specific):');
improvedInvestmentKeywords.forEach((keyword) => console.log(`   - "${keyword}"`));

// Test improved keywords
console.log('\n🧪 Testing Improved Keywords:');
testExpenseTransactions.forEach((transaction) => {
    const description = transaction.description.toLowerCase();
    const matchingImprovedKeywords = improvedInvestmentKeywords.filter((keyword) => description.includes(keyword));

    console.log(`\n📄 "${transaction.description}"`);
    console.log(`   Matching improved keywords: ${matchingImprovedKeywords.length > 0 ? matchingImprovedKeywords.join(', ') : 'None'}`);
    console.log(`   Status: ${matchingImprovedKeywords.length > 0 ? '❌ Still caught' : '✅ Correctly not caught'}`);
});
