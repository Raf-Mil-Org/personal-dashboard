// Test script for Revolut rule
console.log('🧪 Testing Revolut Rule\n');

// Test transactions
const testTransactions = [
    {
        id: '1',
        description: 'Revolut**7355*1234567890',
        category: 'Other',
        subcategory: 'Other',
        tag: 'Other', // Should be Transfers
        amount: '-1500',
        counterparty: 'REVOLUT',
        date: '2025-06-25'
    },
    {
        id: '2',
        description: 'Revolut**7355*9876543210',
        category: 'Other',
        subcategory: 'Other',
        tag: 'Investments', // WRONG - should be Transfers
        amount: '-2500',
        counterparty: 'REVOLUT',
        date: '2025-06-20'
    },
    {
        id: '3',
        description: 'Regular transaction',
        category: 'Other',
        subcategory: 'Other',
        tag: 'Other', // Should stay Other
        amount: '-1000',
        counterparty: 'REGULAR',
        date: '2025-06-15'
    }
];

// Simplified detection function with Revolut rule
function detectSavingsAndInvestments(transaction) {
    const description = (transaction.description || '').toLowerCase();

    // SPECIAL RULE: Revolut transactions should always be transfers
    if (description.includes('revolut**7355*')) {
        console.log(`✅ Special rule: Revolut transaction classified as Transfers: "${transaction.description}"`);
        return 'Transfers';
    }

    return null; // No automatic detection for other transactions
}

// Test the rule
console.log('🔍 Testing Revolut transactions...\n');

testTransactions.forEach((transaction, index) => {
    const oldTag = transaction.tag;
    const newTag = detectSavingsAndInvestments(transaction);

    if (newTag && newTag !== oldTag) {
        console.log(`🔧 Fixed: "${transaction.description}"`);
        console.log(`   From: ${oldTag} → To: ${newTag}`);
        console.log(`   Reason: Special rule: Revolut transactions are always transfers`);
        console.log('');
    } else if (newTag === oldTag) {
        console.log(`✅ Correct: "${transaction.description}" already has correct tag: ${oldTag}`);
        console.log('');
    } else {
        console.log(`ℹ️ No change: "${transaction.description}" remains as ${oldTag}`);
        console.log('');
    }
});

console.log('🎉 Revolut rule test complete!');
console.log('✅ Revolut transactions with "Revolut**7355*" pattern are correctly classified as Transfers');
