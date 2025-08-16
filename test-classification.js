/**
 * Test file for the new transaction classification system
 * Run this in the browser console to test the classification logic
 */

import { classifyTransaction, getTransactionStatistics } from './src/utils/transactionClassification.js';

// Test transactions
const testTransactions = [
    // Incoming transactions
    {
        id: '1',
        amount: '250000', // 2500 EUR in cents
        debit_credit: 'credit',
        description: 'Salary payment',
        tag: 'income',
        category: 'income',
        subcategory: 'salary'
    },
    {
        id: '2',
        amount: '15000', // 150 EUR in cents
        debit_credit: '',
        description: 'Reimbursement for travel expenses',
        tag: 'refund',
        category: 'refund',
        subcategory: 'travel'
    },
    {
        id: '3',
        amount: '50000', // 500 EUR in cents
        debit_credit: 'credit',
        description: 'Transfer from Bunq account',
        tag: 'transfer',
        category: 'transfer',
        subcategory: 'personal'
    },
    {
        id: '8',
        amount: '100000', // 1000 EUR in cents
        debit_credit: 'credit',
        description: 'Transfer from spaarrekening X39367173',
        tag: 'savings',
        category: 'savings',
        subcategory: 'emergency fund'
    },
    {
        id: '9',
        amount: '75000', // 750 EUR in cents
        debit_credit: 'credit',
        description: 'Dividend from Flatex ETF portfolio',
        tag: 'investments',
        category: 'investment',
        subcategory: 'etf'
    },

    // Outgoing transactions
    {
        id: '4',
        amount: '-4500', // -45 EUR in cents
        debit_credit: 'debit',
        description: 'Grocery shopping',
        tag: 'groceries',
        category: 'expense',
        subcategory: 'food'
    },
    {
        id: '5',
        amount: '-100000', // -1000 EUR in cents
        debit_credit: '',
        description: 'Transfer to Bunq savings',
        tag: 'savings',
        category: 'savings',
        subcategory: 'emergency fund'
    },
    {
        id: '6',
        amount: '-25000', // -250 EUR in cents
        debit_credit: 'debit',
        description: 'Investment in Flatex ETF',
        tag: 'investments',
        category: 'investment',
        subcategory: 'etf'
    },
    {
        id: '7',
        amount: '-1500', // -15 EUR in cents
        debit_credit: '',
        description: 'Netflix subscription',
        tag: 'subscriptions',
        category: 'expense',
        subcategory: 'entertainment'
    }
];

// Test individual classification
console.log('🧪 Testing Individual Transaction Classification:');
testTransactions.forEach((transaction, index) => {
    const classification = classifyTransaction(transaction);
    console.log(`Transaction ${index + 1}:`, {
        description: transaction.description,
        amount: transaction.amount,
        classification: classification
    });
});

// Test statistics
console.log('\n📊 Testing Transaction Statistics:');
const stats = getTransactionStatistics(testTransactions);
console.log('Statistics:', stats);

// Test expected results
console.log('\n✅ Expected Results:');
console.log('Total Incoming:', stats.totalIncoming, 'cents (should be 490000)');
console.log('Total Outgoing:', stats.totalOutgoing, 'cents (should be 143000)');
console.log('Total Income:', stats.totalIncome, 'cents (should be 250000 - only salary)');
console.log('Total Savings (Net):', stats.totalSavings, 'cents (should be 0 - 1000 deposit - 1000 withdrawal)');
console.log('Income Count:', stats.counts.income, '(should be 1 - only salary)');
console.log('Refund Count:', stats.counts.refund, '(should be 1)');
console.log('Transfer Count:', stats.counts.transfer, '(should be 4 - bunq transfer + unknown incoming + from savings + from investments)');
console.log('Expenses Count:', stats.counts.expenses, '(should be 2)');
console.log('Savings Count:', stats.counts.savings, '(should be 1)');
console.log('Investments Count:', stats.counts.investments, '(should be 1)');

// Verify the classification is working correctly
const expectedIncoming = 490000; // 2500 + 150 + 500 + 1000 + 750 EUR in cents
const expectedOutgoing = 143000; // 45 + 1000 + 250 + 15 EUR in cents
const expectedIncome = 250000; // Only salary (2500 EUR in cents)
const expectedNetSavings = 0; // 1000 deposit - 1000 withdrawal = 0

console.log('\n🎯 Verification:');
console.log('Incoming transactions correct:', stats.totalIncoming === expectedIncoming ? '✅' : '❌');
console.log('Outgoing transactions correct:', stats.totalOutgoing === expectedOutgoing ? '✅' : '❌');
console.log('Income (salary only) correct:', stats.totalIncome === expectedIncome ? '✅' : '❌');
console.log('Net savings correct:', stats.totalSavings === expectedNetSavings ? '✅' : '❌');
console.log('Income properly classified:', stats.counts.income === 1 ? '✅' : '❌');
console.log('Transfer properly classified:', stats.counts.transfer === 4 ? '✅' : '❌');
console.log('Savings properly classified:', stats.counts.savings === 1 ? '✅' : '❌');
console.log('Investments properly classified:', stats.counts.investments === 1 ? '✅' : '❌');
console.log('Expenses properly classified:', stats.counts.expenses === 2 ? '✅' : '❌');

// Test specific savings transaction
const savingsTransaction = testTransactions.find((t) => t.id === '5');
if (savingsTransaction) {
    const savingsClassification = classifyTransaction(savingsTransaction);
    console.log('\n🔍 Savings Transaction Test:');
    console.log('Description:', savingsTransaction.description);
    console.log('Tag:', savingsTransaction.tag);
    console.log('Category:', savingsTransaction.category);
    console.log('Subcategory:', savingsTransaction.subcategory);
    console.log('Classification:', savingsClassification);
    console.log('Correctly classified as savings:', savingsClassification.group === 'savings' ? '✅' : '❌');
}

// Test specific investment transaction
const investmentTransaction = testTransactions.find((t) => t.id === '6');
if (investmentTransaction) {
    const investmentClassification = classifyTransaction(investmentTransaction);
    console.log('\n🔍 Investment Transaction Test:');
    console.log('Description:', investmentTransaction.description);
    console.log('Tag:', investmentTransaction.tag);
    console.log('Category:', investmentTransaction.category);
    console.log('Subcategory:', investmentTransaction.subcategory);
    console.log('Classification:', investmentClassification);
    console.log('Correctly classified as investments:', investmentClassification.group === 'investments' ? '✅' : '❌');
}

// Test incoming transaction from savings account (should be transfer, not income)
const incomingFromSavings = testTransactions.find((t) => t.id === '8');
if (incomingFromSavings) {
    const savingsIncomingClassification = classifyTransaction(incomingFromSavings);
    console.log('\n🔍 Incoming from Savings Test:');
    console.log('Description:', incomingFromSavings.description);
    console.log('Tag:', incomingFromSavings.tag);
    console.log('Category:', incomingFromSavings.category);
    console.log('Subcategory:', incomingFromSavings.subcategory);
    console.log('Classification:', savingsIncomingClassification);
    console.log('Correctly classified as transfer (not income):', savingsIncomingClassification.group === 'transfer' ? '✅' : '❌');
    console.log('Subgroup indicates from savings:', savingsIncomingClassification.subgroup === 'from_savings_account' ? '✅' : '❌');
}

// Test incoming transaction from investment account (should be transfer, not income)
const incomingFromInvestments = testTransactions.find((t) => t.id === '9');
if (incomingFromInvestments) {
    const investmentIncomingClassification = classifyTransaction(incomingFromInvestments);
    console.log('\n🔍 Incoming from Investments Test:');
    console.log('Description:', incomingFromInvestments.description);
    console.log('Tag:', incomingFromInvestments.tag);
    console.log('Category:', incomingFromInvestments.category);
    console.log('Subcategory:', incomingFromInvestments.subcategory);
    console.log('Classification:', investmentIncomingClassification);
    console.log('Correctly classified as transfer (not income):', investmentIncomingClassification.group === 'transfer' ? '✅' : '❌');
    console.log('Subgroup indicates from investments:', investmentIncomingClassification.subgroup === 'from_investment_account' ? '✅' : '❌');
}

// Test net savings calculation
console.log('\n💰 Net Savings Calculation Test:');
console.log('Savings deposit (outgoing):', testTransactions.find((t) => t.id === '5')?.amount, 'cents');
console.log('Savings withdrawal (incoming):', testTransactions.find((t) => t.id === '8')?.amount, 'cents');
console.log('Net savings calculated:', stats.totalSavings, 'cents');
console.log('Expected net savings: 0 cents (1000 - 1000)');
console.log('Net savings calculation correct:', stats.totalSavings === 0 ? '✅' : '❌');
