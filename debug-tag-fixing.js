// Debug script for tag fixing
console.log('🔍 Debugging Tag Fixing Issues\n');

// Test a specific Bunq transaction
const bunqTransaction = {
    id: '1',
    description: 'R MILIOPOULOS BUNQ',
    category: 'Other',
    subcategory: 'Savings',
    tag: 'Investments', // WRONG - should be Savings
    amount: '-50000',
    counterparty: 'NL28BUNQ2125534274',
    date: '2025-08-06'
};

function debugDetection(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;

    console.log('🔍 Debugging transaction:', transaction.description);
    console.log('   Description:', description);
    console.log('   Category:', category);
    console.log('   Subcategory:', subcategory);
    console.log('   Counterparty:', counterparty);
    console.log('   Amount:', amount);

    // SPECIAL RULE: Revolut transactions should always be transfers
    if (description.includes('revolut**7355*')) {
        console.log('   ✅ Revolut rule applied → Transfers');
        return 'Transfers';
    }

    // FAIL-SAFE CHECKS for investments
    if (amount >= 0) {
        console.log('   ❌ Positive amount → not investments');
        return 'Other';
    }
    
    if (Math.abs(amount) / 100 < 10) {
        console.log('   ❌ Small amount → not investments');
        return 'Other';
    }
    
    // Fee exclusions
    const feeKeywords = ['fee', 'commission', 'charge', 'cost', 'expense'];
    const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
        console.log('   ❌ Fee transaction → not investments');
        return 'Other';
    }

    // Withdrawal exclusions
    const withdrawalKeywords = ['withdrawal', 'withdraw', 'sell', 'sale'];
    const hasWithdrawalKeyword = withdrawalKeywords.some((keyword) => description.includes(keyword));
    if (hasWithdrawalKeyword) {
        console.log('   ❌ Withdrawal transaction → not investments');
        return 'Other';
    }

    // Tax exclusions
    const taxKeywords = ['tax', 'withholding', 'dividend tax'];
    const hasTaxKeyword = taxKeywords.some((keyword) => description.includes(keyword));
    if (hasTaxKeyword) {
        console.log('   ❌ Tax transaction → not investments');
        return 'Other';
    }

    // Savings exclusions
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    if (hasSavingsKeyword) {
        console.log('   ❌ Savings-related transaction → not investments');
        return 'Other';
    }

    // CRITICAL: Exclude ALL Bunq transactions
    if (description.includes('bunq') || counterparty.includes('bunq')) {
        console.log('   ❌ Bunq transaction → not investments');
        return 'Other';
    }

    // POSITIVE CHECKS
    // Investment purchases
    const investmentKeywords = ['stock purchase', 'etf purchase', 'investment purchase', 'buy'];
    const hasInvestmentKeyword = investmentKeywords.some((keyword) => description.includes(keyword));
    if (hasInvestmentKeyword) {
        console.log('   ✅ Investment purchase → Investments');
        return 'Investments';
    }

    // Savings
    if (description.includes('savings') || description.includes('emergency fund') || description.includes('bunq')) {
        console.log('   ✅ Savings transaction → Savings');
        return 'Savings';
    }

    // Transfers
    if (description.includes('transfer') || description.includes('between accounts')) {
        console.log('   ✅ Transfer transaction → Transfers');
        return 'Transfers';
    }

    // If we reach here, it should be Other
    console.log('   ➡️ Default → Other');
    return 'Other';
}

console.log('🚀 Debugging Bunq transaction...\n');
const result = debugDetection(bunqTransaction);
console.log(`\n🎯 Final result: ${result}`);

console.log('\n🔍 The issue is that Bunq transactions are being excluded from investments but not classified as Savings!');
console.log('The logic should be:');
console.log('1. Check if it\'s Bunq → exclude from investments');
console.log('2. Check if it\'s savings-related → classify as Savings');
console.log('3. Otherwise → classify as Other');
