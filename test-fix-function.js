// Test script for the fixExistingTagAssignments function
console.log('🧪 Testing fixExistingTagAssignments Function\n');

// Mock the fix function logic
function fixExistingTagAssignments(transactions) {
    let fixedCount = 0;
    let investmentsToOther = 0;
    let investmentsToSavings = 0;
    let investmentsToExpenses = 0;

    console.log('🔧 Starting to fix existing incorrect tag assignments...');

    transactions.forEach((transaction) => {
        const oldTag = transaction.tag || 'Untagged';
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        let newTag = oldTag;
        let fixReason = '';

        // Fix 1: Transactions with category 'other' and subcategory 'savings' should NOT be investments
        if (oldTag === 'Investments' && category === 'other' && subcategory === 'savings') {
            newTag = 'Savings';
            fixReason = 'Category "other" with subcategory "savings" should be Savings, not Investments';
            investmentsToSavings++;
        }
        // Fix 2: Small transactions (< 10 EUR) tagged as investments should be expenses
        else if (oldTag === 'Investments' && Math.abs(amount) / 100 < 10) {
            newTag = 'Other';
            fixReason = 'Small transaction (< 10 EUR) should not be classified as investment';
            investmentsToOther++;
        }
        // Fix 3-6: Multiple checks for incorrect investment tags
        else if (oldTag === 'Investments') {
            // Fix 3: Fee-related transactions tagged as investments should be expenses
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
                newTag = 'Other';
                fixReason = 'Fee-related transaction should not be classified as investment';
                investmentsToExpenses++;
            }
            // Fix 4: Withdrawal/sale transactions tagged as investments should be expenses
            else {
                const withdrawalKeywords = ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out'];
                const hasWithdrawalKeyword = withdrawalKeywords.some((keyword) => description.includes(keyword));
                if (hasWithdrawalKeyword) {
                    newTag = 'Other';
                    fixReason = 'Withdrawal/sale transaction should not be classified as investment';
                    investmentsToExpenses++;
                }
                // Fix 5: Positive amounts (income) tagged as investments should be income
                else if (amount > 0) {
                    newTag = 'Other';
                    fixReason = 'Positive amount should not be classified as investment';
                    investmentsToOther++;
                }
                // Fix 6: Savings-related transactions tagged as investments should be savings
                else if (description.includes('savings') || description.includes('bunq') || description.includes('emergency fund')) {
                    newTag = 'Savings';
                    fixReason = 'Savings-related transaction should be classified as Savings, not Investments';
                    investmentsToSavings++;
                }
            }
        }

        // Apply the fix if needed
        if (newTag !== oldTag) {
            transaction.tag = newTag;
            fixedCount++;

            console.log(`🔧 Fixed: "${transaction.description}"`);
            console.log(`   From: ${oldTag} → To: ${newTag}`);
            console.log(`   Reason: ${fixReason}`);
            console.log('');
        }
    });

    console.log(`✅ Tag assignment fixes complete:`);
    console.log(`   📊 Total fixed: ${fixedCount}`);
    console.log(`   💰 Investments → Other: ${investmentsToOther}`);
    console.log(`   💰 Investments → Savings: ${investmentsToSavings}`);
    console.log(`   💰 Investments → Expenses: ${investmentsToExpenses}`);

    return {
        total: fixedCount,
        investmentsToOther,
        investmentsToSavings,
        investmentsToExpenses
    };
}

// Test cases
const testTransactions = [
    // Fix 1: Category 'other' with subcategory 'savings' should be Savings
    {
        id: '1',
        description: 'Transfer to savings account',
        amount: '-5000',
        tag: 'Investments',
        category: 'other',
        subcategory: 'savings'
    },
    // Fix 2: Small transaction should be Other
    {
        id: '2',
        description: 'Small trading fee',
        amount: '-500',
        tag: 'Investments',
        category: 'expense',
        subcategory: 'fees'
    },
    // Fix 3: Fee-related transaction should be Other
    {
        id: '3',
        description: 'Monthly account fee from Degiro',
        amount: '-1000',
        tag: 'Investments',
        category: 'expense',
        subcategory: 'fees'
    },
    // Fix 4: Withdrawal should be Other
    {
        id: '4',
        description: 'Withdrawal from investment account',
        amount: '-5000',
        tag: 'Investments',
        category: 'investment',
        subcategory: 'withdrawal'
    },
    // Fix 5: Positive amount should be Other
    {
        id: '5',
        description: 'Dividend payment',
        amount: '5000',
        tag: 'Investments',
        category: 'income',
        subcategory: 'dividend'
    },
    // Fix 6: Savings-related should be Savings
    {
        id: '6',
        description: 'Transfer to Bunq savings',
        amount: '-3000',
        tag: 'Investments',
        category: 'savings',
        subcategory: 'savings account'
    },
    // Should NOT be fixed (valid investment)
    {
        id: '7',
        description: 'Stock purchase AAPL',
        amount: '-15000',
        tag: 'Investments',
        category: 'investment',
        subcategory: 'stock'
    },
    // Should NOT be fixed (already correct)
    {
        id: '8',
        description: 'Grocery shopping',
        amount: '-4500',
        tag: 'Other',
        category: 'expense',
        subcategory: 'groceries'
    }
];

// Run the test
console.log('📋 Test Transactions:');
testTransactions.forEach((t, i) => {
    console.log(`${i + 1}. "${t.description}" (Tag: ${t.tag}, Amount: ${t.amount}, Category: ${t.category}, Subcategory: ${t.subcategory})`);
});
console.log('');

// Apply fixes
const results = fixExistingTagAssignments(testTransactions);

console.log('\n📊 Final Results:');
testTransactions.forEach((t, i) => {
    console.log(`${i + 1}. "${t.description}" → Tag: ${t.tag}`);
});

console.log('\n🎯 Expected Fixes:');
console.log('1. Transfer to savings account → Savings (category other + subcategory savings)');
console.log('2. Small trading fee → Other (amount < 10 EUR)');
console.log('3. Monthly account fee → Other (fee-related)');
console.log('4. Withdrawal from investment account → Other (withdrawal)');
console.log('5. Dividend payment → Other (positive amount)');
console.log('6. Transfer to Bunq savings → Savings (savings-related)');
console.log('7. Stock purchase AAPL → Investments (should remain unchanged)');
console.log('8. Grocery shopping → Other (should remain unchanged)');

console.log('\n✅ Test completed!');

