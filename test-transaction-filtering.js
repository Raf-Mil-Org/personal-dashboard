/**
 * Test file for the transaction filtering functionality
 * This demonstrates how the transaction type filtering works
 */

// Simulate the transaction filtering logic
function simulateTransactionFiltering(transactions, filterType) {
    if (!filterType) return transactions;

    return transactions.filter((transaction) => {
        const amount = parseInt(transaction.amount) || 0;
        const tag = (transaction.tag || '').toLowerCase();
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();

        // Define keywords outside switch to avoid lexical declaration errors
        const incomeKeywords = [
            'salary',
            'payslip',
            'wage',
            'bonus',
            'commission',
            'dividend',
            'interest received',
            'compensation',
            'allowance',
            'grant',
            'award',
            'fee received',
            'business income',
            'freelance',
            'consulting',
            'rental income',
            'royalty'
        ];
        const savingsKeywords = [
            'bunq',
            'savings',
            'emergency fund',
            'savings account',
            'deposit',
            'save',
            'reserve',
            'backup',
            'nest egg',
            'rainy day fund',
            'savings deposit',
            'money market',
            'certificate of deposit',
            'cd',
            'spaarrekening',
            'X39367173'
        ];
        const investmentKeywords = [
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

        switch (filterType) {
            case 'income':
                // Income: positive amounts, specific income keywords
                if (amount <= 0) return false;
                return incomeKeywords.some((keyword) => description.includes(keyword)) || tag === 'income' || category === 'income' || subcategory === 'income';

            case 'expenses':
                // Expenses: negative amounts, excluding savings/investments
                if (amount >= 0) return false;
                if (tag === 'savings' || tag === 'investments' || description.includes('bunq') || description.includes('flatex')) return false;
                return true;

            case 'savings':
                // Savings: negative amounts with savings keywords or tags
                if (amount >= 0) return false;
                return savingsKeywords.some((keyword) => description.includes(keyword)) || tag === 'savings' || category === 'savings' || subcategory === 'savings';

            case 'investments':
                // Investments: negative amounts with investment keywords or tags, excluding fees
                if (amount >= 0) return false;

                // Exclude transactions that contain fee-related terms
                const feeKeywords = ['fee', 'commission', 'charge', 'cost', 'expense', 'management fee', 'transaction fee', 'custody fee', 'rebalancing fee'];
                const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
                if (hasFeeKeyword) return false;

                return (
                    investmentKeywords.some((keyword) => description.includes(keyword)) ||
                    tag === 'investments' ||
                    category === 'investment' ||
                    category === 'investments' ||
                    subcategory === 'investment' ||
                    subcategory === 'etf' ||
                    subcategory === 'stock' ||
                    subcategory === 'bond'
                );

            default:
                return true;
        }
    });
}

// Test transactions
const testTransactions = [
    {
        id: '1',
        amount: '250000', // 2500 EUR in cents
        description: 'Salary payment',
        tag: 'income',
        category: 'income',
        subcategory: 'salary'
    },
    {
        id: '2',
        amount: '-4500', // -45 EUR in cents
        description: 'Grocery shopping',
        tag: 'groceries',
        category: 'expense',
        subcategory: 'food'
    },
    {
        id: '3',
        amount: '-100000', // -1000 EUR in cents
        description: 'Transfer to Bunq savings',
        tag: 'savings',
        category: 'savings',
        subcategory: 'emergency fund'
    },
    {
        id: '4',
        amount: '-25000', // -250 EUR in cents
        description: 'Investment in Flatex ETF',
        tag: 'investments',
        category: 'investment',
        subcategory: 'etf'
    },
    {
        id: '5',
        amount: '15000', // 150 EUR in cents
        description: 'Bonus payment',
        tag: 'income',
        category: 'income',
        subcategory: 'bonus'
    },
    {
        id: '6',
        amount: '-1500', // -15 EUR in cents
        description: 'Trading fee for stock purchase',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '7',
        amount: '-2500', // -25 EUR in cents
        description: 'Portfolio management fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    },
    {
        id: '8',
        amount: '-500', // -5 EUR in cents
        description: 'Securities transaction fee',
        tag: 'fees',
        category: 'expense',
        subcategory: 'fees'
    }
];

console.log('🧪 Testing Transaction Filtering Functionality:');

// Test all transactions
console.log('\n📊 All Transactions:', testTransactions.length);
testTransactions.forEach((t) => console.log(`- ${t.description}: ${t.amount} cents (${t.tag})`));

// Test income filter
const incomeTransactions = simulateTransactionFiltering(testTransactions, 'income');
console.log('\n💰 Income Transactions:', incomeTransactions.length);
incomeTransactions.forEach((t) => console.log(`- ${t.description}: ${t.amount} cents`));

// Test expenses filter
const expenseTransactions = simulateTransactionFiltering(testTransactions, 'expenses');
console.log('\n💸 Expense Transactions:', expenseTransactions.length);
expenseTransactions.forEach((t) => console.log(`- ${t.description}: ${t.amount} cents`));

// Test savings filter
const savingsTransactions = simulateTransactionFiltering(testTransactions, 'savings');
console.log('\n🏦 Savings Transactions:', savingsTransactions.length);
savingsTransactions.forEach((t) => console.log(`- ${t.description}: ${t.amount} cents`));

// Test investments filter
const investmentTransactions = simulateTransactionFiltering(testTransactions, 'investments');
console.log('\n📈 Investment Transactions:', investmentTransactions.length);
investmentTransactions.forEach((t) => console.log(`- ${t.description}: ${t.amount} cents`));

// Test no filter (show all)
const allTransactions = simulateTransactionFiltering(testTransactions, null);
console.log('\n📋 No Filter (All):', allTransactions.length);
allTransactions.forEach((t) => console.log(`- ${t.description}: ${t.amount} cents`));

// Test button states
console.log('\n🔘 Button States:');
console.log('Income button active:', true ? 'bg-green-500 text-white' : 'text-green-600 bg-green-50');
console.log('Expenses button active:', false ? 'bg-red-500 text-white' : 'text-red-600 bg-red-50');
console.log('Savings button active:', false ? 'bg-emerald-500 text-white' : 'text-emerald-600 bg-emerald-50');
console.log('Investments button active:', false ? 'bg-amber-500 text-white' : 'text-amber-600 bg-amber-50');

// Test filter status display
const activeFilter = 'income';
console.log('\n📊 Filter Status Display:');
if (activeFilter) {
    console.log(`Showing only ${activeFilter} transactions`);
    console.log('Clear button: "Show All Transactions"');
} else {
    console.log('No active filter - showing all transactions');
}
