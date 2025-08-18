// Script to fix Bunq transactions incorrectly tagged as investments
// This demonstrates the issue and solution

console.log('🔍 Bunq Transaction Fix Script');
console.log('=============================');

// Mock transaction data (example of what might be in localStorage)
const mockTransactions = [
    {
        id: '1',
        description: 'Bunq savings deposit',
        amount: -1000,
        tag: 'Investments', // ❌ Incorrect - should be 'Savings'
        category: '',
        subcategory: ''
    },
    {
        id: '2',
        description: 'Bunq transfer to savings account',
        amount: -500,
        tag: 'Investments', // ❌ Incorrect - should be 'Savings'
        category: '',
        subcategory: ''
    },
    {
        id: '3',
        description: 'Bunq monthly fee',
        amount: -5,
        tag: 'Investments', // ❌ Incorrect - should be 'Savings'
        category: '',
        subcategory: ''
    },
    {
        id: '4',
        description: 'Degiro investment purchase',
        amount: -2000,
        tag: 'Investments', // ✅ Correct
        category: '',
        subcategory: ''
    }
];

console.log('📊 Current transaction tags:');
mockTransactions.forEach((t) => {
    console.log(`  "${t.description}" → ${t.tag}`);
});

console.log('\n🔧 Applying fix logic...');

// Mock the detection function from useTransactionStore.js
function detectSavingsAndInvestments(transaction) {
    const description = (transaction.description || '').toLowerCase();

    // PRIORITY 1: Savings detection (highest priority)
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));

    if (hasSavingsKeyword) {
        return 'Savings';
    }

    // PRIORITY 2: Investment detection (with Bunq exclusion)
    if (detectInvestment(transaction)) {
        return 'Investments';
    }

    return null;
}

function detectInvestment(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;

    // FAIL-SAFE CHECK: Exclude ALL Bunq transactions
    if (description.includes('bunq')) {
        return false;
    }

    // Other investment checks...
    if (amount >= 0) return false;
    if (Math.abs(amount) / 100 < 10) return false;

    // Check for investment keywords
    const investmentKeywords = ['degiro', 'flatex', 'investment purchase', 'stock purchase'];
    return investmentKeywords.some((keyword) => description.includes(keyword));
}

// Apply the fix
const fixedTransactions = mockTransactions.map((transaction) => {
    const oldTag = transaction.tag;
    const newTag = detectSavingsAndInvestments(transaction) || 'Other';

    return {
        ...transaction,
        tag: newTag,
        fixed: oldTag !== newTag
    };
});

console.log('\n✅ Fixed transaction tags:');
fixedTransactions.forEach((t) => {
    const status = t.fixed ? '🔧 FIXED' : '✅ Correct';
    console.log(`  ${status}: "${t.description}" → ${t.tag}`);
});

const fixedCount = fixedTransactions.filter((t) => t.fixed).length;
console.log(`\n📈 Summary: Fixed ${fixedCount} out of ${mockTransactions.length} transactions`);

console.log('\n💡 To fix your actual transactions:');
console.log('1. Go to the Transaction Analyzer page');
console.log('2. Click the "Fix All Existing Tags" button (red wrench icon)');
console.log('3. This will re-evaluate all transactions and fix Bunq transactions');
console.log('4. Check the console for detailed logs of what was fixed');
