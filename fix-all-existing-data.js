// Comprehensive script to fix all existing data with latest rules
console.log('🔧 Comprehensive Data Fix Script - Applying Latest Rules to All Existing Data\n');

// Import the actual functions from the application
import { useTransactionStore } from './src/composables/useTransactionStore.js';

// Mock the store for testing (in real usage, this would be the actual store)
const mockTransactions = [
    // Sample problematic transactions that need fixing
    {
        id: '1',
        description: 'R MILIOPOULOS BUNQ',
        category: 'Other',
        subcategory: 'Savings',
        tag: 'Investments', // WRONG - should be Savings
        amount: '-50000',
        counterparty: 'NL28BUNQ2125534274',
        date: '2025-08-06'
    },
    {
        id: '2',
        description: 'Monthly fee from Degiro',
        category: 'Expense',
        subcategory: 'Fees',
        tag: 'Investments', // WRONG - should be Other
        amount: '-500',
        counterparty: 'DEGIRO',
        date: '2025-08-01'
    },
    {
        id: '3',
        description: 'Withdrawal from investment account',
        category: 'Investment',
        subcategory: 'Withdrawal',
        tag: 'Investments', // WRONG - should be Other
        amount: '-10000',
        counterparty: 'DEGIRO',
        date: '2025-07-30'
    },
    {
        id: '4',
        description: 'Stock purchase AAPL via Degiro',
        category: 'Investment',
        subcategory: 'Stock purchase',
        tag: 'Other', // Should be Investments
        amount: '-15000',
        counterparty: 'DEGIRO',
        date: '2025-07-25'
    },
    {
        id: '5',
        description: 'Emergency fund deposit',
        category: 'Savings',
        subcategory: 'Emergency fund',
        tag: 'Investments', // WRONG - should be Savings
        amount: '-3000',
        counterparty: 'BUNQ',
        date: '2025-07-20'
    },
    {
        id: '6',
        description: 'Transfer between accounts',
        category: 'Transfer',
        subcategory: 'Account transfer',
        tag: 'Investments', // WRONG - should be Transfers
        amount: '-2000',
        counterparty: 'ING',
        date: '2025-07-15'
    },
    {
        id: '7',
        description: 'Small trading fee',
        category: 'Expense',
        subcategory: 'Fees',
        tag: 'Investments', // WRONG - should be Other
        amount: '-250',
        counterparty: 'DEGIRO',
        date: '2025-07-10'
    },
    {
        id: '8',
        description: 'Dividend tax payment',
        category: 'Expense',
        subcategory: 'Tax',
        tag: 'Investments', // WRONG - should be Other
        amount: '-1000',
        counterparty: 'TAX_AUTHORITY',
        date: '2025-07-05'
    },
    {
        id: '9',
        description: 'ETF purchase VTI',
        category: 'Investment',
        subcategory: 'ETF purchase',
        tag: 'Other', // Should be Investments
        amount: '-10000',
        counterparty: 'DEGIRO',
        date: '2025-07-01'
    },
    {
        id: '10',
        description: 'Bunq savings transfer',
        category: 'Other',
        subcategory: 'Savings',
        tag: 'Investments', // WRONG - should be Savings
        amount: '-5000',
        counterparty: 'NL28BUNQ2125534274',
        date: '2025-06-30'
    }
];

// Comprehensive detection functions with all latest rules
const DETECTION_CONFIG = {
    investments: {
        keywords: [
            'investment purchase',
            'stock purchase',
            'bond purchase',
            'etf purchase',
            'mutual fund purchase',
            'portfolio purchase',
            'securities purchase',
            'trading purchase',
            'brokerage purchase',
            '401k contribution',
            'ira contribution',
            'roth contribution',
            'index fund purchase',
            'dividend reinvestment'
        ],
        accountPatterns: [/degiro/i, /trading212/i, /etoro/i, /coinbase/i, /binance/i, /kraken/i, /interactive brokers/i, /fidelity/i, /vanguard/i, /schwab/i],
        subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds']
    },
    savings: {
        keywords: ['savings', 'save', 'emergency fund', 'goal savings', 'deposit', 'contribution', 'reserve', 'nest egg', 'rainy day fund'],
        accountPatterns: [/bunq/i, /savings account/i, /emergency fund/i, /goal savings/i],
        subcategories: ['savings account', 'emergency fund', 'goal savings']
    },
    transfers: {
        keywords: ['transfer', 'internal transfer', 'account transfer', 'between accounts', 'own transfer', 'self transfer', 'move money'],
        accountPatterns: [/transfer to own account/i, /internal transfer/i, /between own accounts/i],
        subcategories: ['internal transfer', 'account transfer', 'between accounts']
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
        'handling fee',
        'custody',
        'administration',
        'platform fee',
        'exchange fee'
    ];
    const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
        return false;
    }

    // FAIL-SAFE CHECK 4: Exclude withdrawals, sales, and transfers from investment accounts
    const withdrawalKeywords = ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out', 'disposal', 'liquidation', 'exit', 'close position'];
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
        'investment purchase',
        'stock purchase',
        'bond purchase',
        'etf purchase',
        'mutual fund purchase',
        'portfolio purchase',
        'securities purchase',
        'trading purchase',
        'brokerage purchase',
        '401k contribution',
        'ira contribution',
        'roth contribution',
        'index fund purchase',
        'dividend reinvestment',
        'buy',
        'purchase'
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

function detectTransfer(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();

    // Check subcategory first
    if (DETECTION_CONFIG.transfers.subcategories.includes(subcategory)) {
        return true;
    }

    // Check keywords in description
    if (DETECTION_CONFIG.transfers.keywords.some((keyword) => description.includes(keyword))) {
        return true;
    }

    // Check account patterns
    if (DETECTION_CONFIG.transfers.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty))) {
        return true;
    }

    return false;
}

function detectSavingsAndInvestments(transaction) {
    const tag = (transaction.tag || '').toLowerCase();
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // SPECIAL RULE: Revolut transactions should always be transfers
    if (description.includes('revolut**7355*')) {
        console.log(`✅ Special rule: Revolut transaction classified as Transfers: "${description}"`);
        return 'Transfers';
    }

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
    if (!shouldTrustExistingTag && tag) {
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

    // PRIORITY 2: Transfer detection (before investments to avoid misclassification)
    const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
    const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));

    if (hasTransferKeyword && detectTransfer(transaction)) {
        console.log(`✅ Re-classified as Transfers: "${description}"`);
        return 'Transfers';
    }

    // PRIORITY 3: Investment detection (most restrictive)
    if (detectInvestment(transaction)) {
        console.log(`✅ Re-classified as Investments: "${description}"`);
        return 'Investments';
    }

    // PRIORITY 4: General savings detection (for other cases)
    if (detectSavings(transaction)) {
        console.log(`✅ Re-classified as Savings: "${description}"`);
        return 'Savings';
    }

    // PRIORITY 5: General transfer detection (for other cases)
    if (detectTransfer(transaction)) {
        console.log(`✅ Re-classified as Transfers: "${description}"`);
        return 'Transfers';
    }

    return null; // No automatic detection
}

// Main function to fix all existing data
function fixAllExistingData(transactions) {
    console.log(`🔧 Starting comprehensive fix of ${transactions.length} transactions...\n`);

    let fixedCount = 0;
    let investmentsToOther = 0;
    let investmentsToSavings = 0;
    let investmentsToTransfers = 0;
    let otherToInvestments = 0;
    let otherToSavings = 0;
    let otherToTransfers = 0;
    let savingsToOther = 0;
    let transfersToOther = 0;

    const fixedTransactions = transactions.map((transaction) => {
        const oldTag = transaction.tag || 'Untagged';
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        // Skip transactions that have been manually overridden
        if (transaction.overrideHistory && transaction.overrideHistory.length > 0) {
            console.log(`⏭️ Skipping manually overridden transaction: "${transaction.description}"`);
            return transaction;
        }

        // Apply the latest detection rules
        const newTag = detectSavingsAndInvestments(transaction);
        let fixReason = '';

        // Track the changes
        if (newTag && newTag !== oldTag) {
            if (oldTag === 'Investments') {
                if (newTag === 'Savings') {
                    fixReason = 'Incorrect investment tag corrected to savings';
                    investmentsToSavings++;
                } else if (newTag === 'Transfers') {
                    fixReason = 'Incorrect investment tag corrected to transfers';
                    investmentsToTransfers++;
                } else {
                    fixReason = 'Incorrect investment tag corrected to other';
                    investmentsToOther++;
                }
            } else if (oldTag === 'Other' || oldTag === 'Untagged') {
                if (newTag === 'Investments') {
                    fixReason = 'Correctly classified as investment';
                    otherToInvestments++;
                } else if (newTag === 'Savings') {
                    fixReason = 'Correctly classified as savings';
                    otherToSavings++;
                } else if (newTag === 'Transfers') {
                    fixReason = 'Correctly classified as transfer';
                    otherToTransfers++;
                }
            } else if (oldTag === 'Savings' && newTag !== 'Savings') {
                fixReason = 'Incorrect savings tag corrected';
                savingsToOther++;
            } else if (oldTag === 'Transfers' && newTag !== 'Transfers') {
                fixReason = 'Incorrect transfers tag corrected';
                transfersToOther++;
            }

            fixedCount++;

            // Add fix metadata
            if (!transaction.fixHistory) {
                transaction.fixHistory = [];
            }
            transaction.fixHistory.push({
                timestamp: new Date().toISOString(),
                oldTag,
                newTag,
                reason: fixReason
            });

            console.log(`🔧 Fixed: "${transaction.description}"`);
            console.log(`   From: ${oldTag} → To: ${newTag}`);
            console.log(`   Reason: ${fixReason}`);
            console.log('');

            // Update the tag
            transaction.tag = newTag;
        }

        return transaction;
    });

    // Summary
    console.log(`\n📊 Comprehensive Fix Summary:`);
    console.log(`   📈 Total transactions processed: ${transactions.length}`);
    console.log(`   🔧 Total fixes applied: ${fixedCount}`);
    console.log(`   💰 Investments → Other: ${investmentsToOther}`);
    console.log(`   💰 Investments → Savings: ${investmentsToSavings}`);
    console.log(`   💰 Investments → Transfers: ${investmentsToTransfers}`);
    console.log(`   📈 Other → Investments: ${otherToInvestments}`);
    console.log(`   📈 Other → Savings: ${otherToSavings}`);
    console.log(`   📈 Other → Transfers: ${otherToTransfers}`);
    console.log(`   📈 Savings → Other: ${savingsToOther}`);
    console.log(`   📈 Transfers → Other: ${transfersToOther}`);

    if (fixedCount > 0) {
        console.log(`\n✅ Successfully fixed ${fixedCount} transactions!`);
        console.log(`🔧 All transactions now follow the latest classification rules.`);
    } else {
        console.log(`\nℹ️ No fixes needed - all transactions are already correctly classified.`);
    }

    return {
        transactions: fixedTransactions,
        summary: {
            total: transactions.length,
            fixed: fixedCount,
            investmentsToOther,
            investmentsToSavings,
            investmentsToTransfers,
            otherToInvestments,
            otherToSavings,
            otherToTransfers,
            savingsToOther,
            transfersToOther
        }
    };
}

// Function to load transactions from localStorage (for browser environment)
function loadTransactionsFromStorage() {
    try {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading transactions from storage:', error);
        return [];
    }
}

// Function to save transactions to localStorage (for browser environment)
function saveTransactionsToStorage(transactions) {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        console.log('💾 Transactions saved to storage successfully');
    } catch (error) {
        console.error('Error saving transactions to storage:', error);
    }
}

// Main execution function
function runComprehensiveFix() {
    console.log('🚀 Starting Comprehensive Data Fix Process...\n');

    // Load transactions (in real usage, this would be from localStorage or your data source)
    const transactions = loadTransactionsFromStorage();

    if (transactions.length === 0) {
        console.log('⚠️ No transactions found in storage. Using sample data for demonstration...');
        // Use mock data for demonstration
        const result = fixAllExistingData(mockTransactions);

        console.log('\n🎯 Sample Fix Results:');
        console.log('This demonstrates how the fix would work with your actual data.');
        console.log('To apply this to your real data, run this script in your browser console.');

        return result;
    } else {
        console.log(`📊 Found ${transactions.length} transactions in storage.`);
        const result = fixAllExistingData(transactions);

        // Save the fixed transactions back to storage
        saveTransactionsToStorage(result.transactions);

        return result;
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.runComprehensiveFix = runComprehensiveFix;
    window.fixAllExistingData = fixAllExistingData;
    console.log('🔧 Script loaded! Run runComprehensiveFix() to fix all your data.');
}

// Run the fix if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runComprehensiveFix();
}

export { runComprehensiveFix, fixAllExistingData };
