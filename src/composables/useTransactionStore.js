// composables/useTransactionStore.js
import { computed, ref, watch } from 'vue';
import { getAllStandardColumns, DEFAULT_VISIBLE_COLUMNS } from '@/data/columnMapping';
import { getTransactionStatistics } from '@/utils/transactionClassification';
import { useTransactionLearning } from './useTransactionLearning';
import { useTransactionEngine } from './useTransactionEngine';

// Storage keys
const STORAGE_KEYS = {
    COLUMN_PREFERENCES: 'transaction_analyzer_column_preferences',
    TAGS: 'transaction_analyzer_tags',
    FILTER_PREFERENCES: 'transaction_analyzer_filter_preferences',
    CSV_DATA: 'transaction_analyzer_csv_data',
    LAST_UPLOAD: 'transaction_analyzer_last_upload'
};

// Persistent storage keys (never deleted)
const PERSISTENT_STORAGE_KEYS = {
    TOTAL_JSON_TRANSACTIONS: 'transaction_analyzer_persistent_total_json',
    TOTAL_CSV_TRANSACTIONS: 'transaction_analyzer_persistent_total_csv',
    TOTAL_DATATABLE_TRANSACTIONS: 'transaction_analyzer_persistent_total_datatable'
};

// Predefined tags
const DEFAULT_TAGS = ['Groceries', 'Utilities', 'Dining', 'Transport', 'Health', 'Entertainment', 'Subscriptions', 'Housing', 'Savings', 'Investments', 'Transfers', 'Other'];

export function useTransactionStore() {
    // Initialize learning system
    const { initializeLearning, learnFromAssignment, applyLearnedRules, getLearningStatistics, clearLearnedData, exportLearnedRules, importLearnedRules, totalRules, totalAssignments } = useTransactionLearning();

    // State
    const transactions = ref([]);
    const selectedFilter = ref('all');
    const visibleColumns = ref([]);
    const availableColumns = ref([]);
    const isLoading = ref(false);
    const tags = ref({}); // Map of transaction ID to tag

    // Statistics state
    const totalIncome = ref(0);
    const totalExpenses = ref(0);
    const totalSavings = ref(0);
    const totalInvestments = ref(0);
    const totalTransfers = ref(0);
    const netAmount = ref(0);
    const savingsRate = ref(0);

    // Filter options
    const filterOptions = [
        { label: 'All Transactions', value: 'all' },
        { label: 'Expense Transactions', value: 'expenses' },
        { label: 'Income Transactions', value: 'income' },
        { label: 'Untagged Transactions', value: 'untagged' }
    ];

    // Available tags for dropdown
    const availableTags = ref([...DEFAULT_TAGS]);

    // Persistent transaction count tracking functions
    function getPersistentCount(key) {
        try {
            const saved = localStorage.getItem(PERSISTENT_STORAGE_KEYS[key]);
            return saved ? parseInt(saved, 10) : 0;
        } catch (error) {
            console.error(`Error loading persistent count for ${key}:`, error);
            return 0;
        }
    }

    function updatePersistentCount(key, newCount) {
        try {
            const currentCount = getPersistentCount(key);
            const updatedCount = currentCount + newCount;
            localStorage.setItem(PERSISTENT_STORAGE_KEYS[key], updatedCount.toString());
            console.log(`📊 Updated persistent count for ${key}: ${currentCount} + ${newCount} = ${updatedCount}`);
            return updatedCount;
        } catch (error) {
            console.error(`Error updating persistent count for ${key}:`, error);
            return 0;
        }
    }

    function getPersistentCounts() {
        return {
            totalJsonTransactions: getPersistentCount('TOTAL_JSON_TRANSACTIONS'),
            totalCsvTransactions: getPersistentCount('TOTAL_CSV_TRANSACTIONS'),
            totalDatatableTransactions: getPersistentCount('TOTAL_DATATABLE_TRANSACTIONS')
        };
    }

    function logPersistentCounts() {
        const counts = getPersistentCounts();
        console.log('📊 Persistent Transaction Counts:', counts);
        return counts;
    }

    // Enhanced detection configuration
    const DETECTION_CONFIG = {
        // Investment keywords and patterns
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
        // Savings keywords and patterns
        savings: {
            keywords: ['savings', 'save', 'emergency fund', 'goal savings', 'deposit', 'contribution', 'reserve', 'nest egg', 'rainy day fund'],
            accountPatterns: [/bunq/i, /savings account/i, /emergency fund/i, /goal savings/i],
            subcategories: ['savings account', 'emergency fund', 'goal savings']
        },
        // Transfer keywords and patterns
        transfers: {
            keywords: ['transfer', 'internal transfer', 'account transfer', 'between accounts', 'own transfer', 'self transfer', 'move money'],
            accountPatterns: [/transfer to own account/i, /internal transfer/i, /between own accounts/i],
            subcategories: ['internal transfer', 'account transfer', 'between accounts']
        }
    };

    // Function to detect savings and investments based on enhanced rules with proper priorities
    function detectSavingsAndInvestments(transaction) {
        const tag = (transaction.tag || '').toLowerCase();
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();

        // SPECIAL RULE: Revolut transactions should always be transfers
        if (description.includes('revolut**7355*')) {
            return 'Transfers';
        }

        // PRIORITY 0: Apply learned rules (highest priority for user preferences)
        const learnedResult = applyLearnedRules(transaction);
        if (learnedResult) {
            return learnedResult.tag;
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
            // Trust transfers tag if it has transfer indicators OR is a Revolut transaction
            const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
            const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
            const isRevolutTransaction = description.includes('revolut**7355*');
            shouldTrustExistingTag = hasTransferKeyword || isRevolutTransaction;
        } else if (tag === 'investments') {
            // CRITICAL: Only trust investments tag if it passes ALL investment checks
            // This prevents incorrect investment tags from being preserved
            // SPECIAL CHECK: Revolut transactions should NEVER be trusted as investments
            if (description.includes('revolut**7355*')) {
                shouldTrustExistingTag = false;
            } else {
                shouldTrustExistingTag = detectInvestment(transaction);
            }
        }

        // If existing tag is trustworthy, use it
        if (shouldTrustExistingTag) {
            return tag.charAt(0).toUpperCase() + tag.slice(1); // Capitalize first letter
        }

        // If existing tag is not trustworthy, re-evaluate from scratch
        if (!shouldTrustExistingTag) {
            console.log(`🔍 Re-evaluating untrustworthy tag "${tag}" for transaction: "${description}"`);
        }

        // PRIORITY 1: Savings detection (highest priority to avoid misclassification)
        // Check for savings-specific keywords and patterns first
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
            return 'Transfers';
        }

        // PRIORITY 3: Investment detection (most restrictive)
        if (detectInvestment(transaction)) {
            return 'Investments';
        }

        // PRIORITY 4: General savings detection (for other cases)
        if (detectSavings(transaction)) {
            return 'Savings';
        }

        // PRIORITY 5: General transfer detection (for other cases)
        if (detectTransfer(transaction)) {
            return 'Transfers';
        }

        return null; // No automatic detection
    }

    // Helper function to detect investments with comprehensive fail-safe checks
    function detectInvestment(transaction) {
        const description = (transaction.description || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const counterparty = (transaction.counterparty || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        // FAIL-SAFE CHECK 0: CRITICAL - Revolut transactions should NEVER be investments
        if (description.includes('revolut**7355*')) {
            return false;
        }

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

    // Helper function to detect savings
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

    // Helper function to detect transfers
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

    // Function to apply automatic savings/investments detection to transactions
    function applySavingsInvestmentsDetection() {
        let updatedCount = 0;
        let investmentsCount = 0;
        let savingsCount = 0;
        let transfersCount = 0;

        console.log('🔍 Starting enhanced savings/investments detection...');

        transactions.value.forEach((transaction) => {
            // Skip transactions that have been manually overridden
            if (transaction.overrideHistory && transaction.overrideHistory.length > 0) {
                console.log(`⏭️ Skipping manually overridden transaction: "${transaction.description}"`);
                return;
            }

            const detectedType = detectSavingsAndInvestments(transaction);
            if (detectedType && (!transaction.tag || transaction.tag === 'Other')) {
                const oldTag = transaction.tag || 'Untagged';
                transaction.tag = detectedType;
                updatedCount++;

                // Track counts by type
                if (detectedType === 'Investments') investmentsCount++;
                else if (detectedType === 'Savings') savingsCount++;
                else if (detectedType === 'Transfers') transfersCount++;

                console.log(`🏷️ Auto-detected ${detectedType} for: "${transaction.description}" (was: ${oldTag})`);
            }
        });

        if (updatedCount > 0) {
            console.log(`✅ Enhanced detection complete:`);
            console.log(`   📊 Total updated: ${updatedCount}`);
            console.log(`   💰 Investments: ${investmentsCount}`);
            console.log(`   🏦 Savings: ${savingsCount}`);
            console.log(`   🔄 Transfers: ${transfersCount}`);
            calculateStatistics(); // Recalculate statistics
        } else {
            console.log('ℹ️ No new transactions detected for auto-categorization');
        }

        return {
            total: updatedCount,
            investments: investmentsCount,
            savings: savingsCount,
            transfers: transfersCount
        };
    }

    // Function to comprehensively re-evaluate and fix ALL existing tag assignments
    function fixAllExistingTagAssignments() {
        console.log('🔧 Starting comprehensive re-evaluation of ALL existing tag assignments...');

        let fixedCount = 0;
        let reEvaluatedCount = 0;
        let trustedCount = 0;

        transactions.value.forEach((transaction) => {
            const oldTag = transaction.tag || 'Untagged';

            // Skip transactions that have been manually overridden
            if (transaction.overrideHistory && transaction.overrideHistory.length > 0) {
                console.log(`⏭️ Skipping manually overridden transaction: "${transaction.description}"`);
                return;
            }

            // Apply the latest detection rules (including learned rules)
            const newTag = detectSavingsAndInvestments(transaction);

            if (newTag && newTag !== oldTag) {
                // Update the tag
                transaction.tag = newTag;
                fixedCount++;

                // Add fix metadata
                if (!transaction.fixHistory) {
                    transaction.fixHistory = [];
                }
                transaction.fixHistory.push({
                    timestamp: new Date().toISOString(),
                    oldTag,
                    newTag,
                    reason: 'Comprehensive re-evaluation'
                });

                console.log(`🔧 Fixed: "${transaction.description}"`);
                console.log(`   From: ${oldTag} → To: ${newTag}`);
                console.log('');
            } else if (newTag === oldTag) {
                trustedCount++;
            } else {
                reEvaluatedCount++;
            }
        });

        if (fixedCount > 0) {
            console.log(`✅ Comprehensive tag re-evaluation complete:`);
            console.log(`   🔧 Total fixes applied: ${fixedCount}`);
            console.log(`   ✅ Trusted existing tags: ${trustedCount}`);
            console.log(`   🔍 Re-evaluated but unchanged: ${reEvaluatedCount}`);

            // Recalculate statistics
            calculateStatistics();

            // Save the updated transactions
            saveTransactionsToStorage(transactions.value);
        } else {
            console.log('ℹ️ No incorrect tag assignments found to fix');
        }

        return {
            total: transactions.value.length,
            fixed: fixedCount,
            trusted: trustedCount,
            reEvaluated: reEvaluatedCount
        };
    }

    // Function to fix existing incorrect tag assignments based on comprehensive new rules
    function fixExistingTagAssignments() {
        let fixedCount = 0;
        let investmentsToOther = 0;
        let investmentsToSavings = 0;
        let investmentsToExpenses = 0;
        let otherFixes = 0;

        console.log('🔧 Starting comprehensive fix of existing incorrect tag assignments...');

        transactions.value.forEach((transaction) => {
            const oldTag = transaction.tag || 'Untagged';
            const description = (transaction.description || '').toLowerCase();
            const category = (transaction.category || '').toLowerCase();
            const subcategory = (transaction.subcategory || '').toLowerCase();
            const amount = parseInt(transaction.amount) || 0;

            // Skip transactions that have been manually overridden
            if (transaction.overrideHistory && transaction.overrideHistory.length > 0) {
                return;
            }

            let newTag = oldTag;
            let fixReason = '';

            // SPECIAL RULE: Revolut transactions should always be Transfers
            if (description.includes('revolut')) {
                newTag = 'Transfers';
                fixReason = 'Special rule: Revolut transactions are always transfers';
                if (oldTag === 'Investments') {
                    investmentsToOther++;
                } else if (oldTag === 'Other' || oldTag === 'Untagged') {
                    otherFixes++;
                }
            }
            // COMPREHENSIVE FIX CHECKS FOR INVESTMENT TAGS
            else if (oldTag === 'Investments') {
                // Fix 1: Transactions with category 'other' and subcategory 'savings' should be Savings
                if (category === 'other' && subcategory === 'savings') {
                    newTag = 'Savings';
                    fixReason = 'Category "other" with subcategory "savings" should be Savings, not Investments';
                    investmentsToSavings++;
                }
                // Fix 1.5: CRITICAL FIX for Bunq transactions - any transaction with 'bunq' in description should NOT be investments
                else if (description.includes('bunq')) {
                    newTag = 'Savings';
                    fixReason = 'Bunq transactions should be Savings, not Investments';
                    investmentsToSavings++;
                }
                // Fix 2: Small transactions (< 10 EUR) should be Other
                else if (Math.abs(amount) / 100 < 10) {
                    newTag = 'Other';
                    fixReason = 'Small transaction (< 10 EUR) should not be classified as investment';
                    investmentsToOther++;
                }
                // Fix 3: Positive amounts should be Other
                else if (amount > 0) {
                    newTag = 'Other';
                    fixReason = 'Positive amount should not be classified as investment';
                    investmentsToOther++;
                }
                // Fix 4: Fee-related transactions should be Other
                else {
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
                        newTag = 'Other';
                        fixReason = 'Fee-related transaction should not be classified as investment';
                        investmentsToExpenses++;
                    }
                    // Fix 5: Withdrawal/sale transactions should be Other
                    else {
                        const withdrawalKeywords = ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out', 'disposal', 'liquidation', 'exit', 'close position'];
                        const hasWithdrawalKeyword = withdrawalKeywords.some((keyword) => description.includes(keyword));
                        if (hasWithdrawalKeyword) {
                            newTag = 'Other';
                            fixReason = 'Withdrawal/sale transaction should not be classified as investment';
                            investmentsToExpenses++;
                        }
                        // Fix 6: Tax-related transactions should be Other
                        else {
                            const taxKeywords = ['tax', 'withholding', 'dividend tax', 'capital gains'];
                            const hasTaxKeyword = taxKeywords.some((keyword) => description.includes(keyword));
                            if (hasTaxKeyword) {
                                newTag = 'Other';
                                fixReason = 'Tax-related transaction should not be classified as investment';
                                investmentsToExpenses++;
                            }
                            // Fix 7: Savings-related transactions should be Savings
                            else if (description.includes('savings') || description.includes('bunq') || description.includes('emergency fund') || description.includes('deposit')) {
                                newTag = 'Savings';
                                fixReason = 'Savings-related transaction should be classified as Savings, not Investments';
                                investmentsToSavings++;
                            }
                            // Fix 8: Transfer-related transactions should be Transfers
                            else if (description.includes('transfer') || description.includes('between accounts')) {
                                newTag = 'Transfers';
                                fixReason = 'Transfer-related transaction should be classified as Transfers, not Investments';
                                otherFixes++;
                            }
                        }
                    }
                }
            }

            // Apply the fix if needed
            if (newTag !== oldTag) {
                transaction.tag = newTag;
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
            }
        });

        if (fixedCount > 0) {
            console.log(`✅ Comprehensive tag assignment fixes complete:`);
            console.log(`   📊 Total fixed: ${fixedCount}`);
            console.log(`   💰 Investments → Other: ${investmentsToOther}`);
            console.log(`   💰 Investments → Savings: ${investmentsToSavings}`);
            console.log(`   💰 Investments → Expenses: ${investmentsToExpenses}`);
            console.log(`   🔄 Other fixes: ${otherFixes}`);

            // Recalculate statistics
            calculateStatistics();

            // Save the updated transactions
            saveTransactionsToStorage(transactions.value);
        } else {
            console.log('ℹ️ No incorrect tag assignments found to fix');
        }

        return {
            total: fixedCount,
            investmentsToOther,
            investmentsToSavings,
            investmentsToExpenses,
            otherFixes
        };
    }

    // Function to get current detection statistics
    function getDetectionStatistics() {
        const stats = {
            total: transactions.value.length,
            investments: 0,
            savings: 0,
            transfers: 0,
            expenses: 0,
            income: 0,
            untagged: 0
        };

        transactions.value.forEach((transaction) => {
            const tag = transaction.tag || 'Untagged';
            const debitCredit = transaction.debit_credit || '';
            const isIncome = debitCredit.trim().toLowerCase() === 'credit';

            if (isIncome) {
                stats.income++;
            } else {
                switch (tag.toLowerCase()) {
                    case 'investments':
                        stats.investments++;
                        break;
                    case 'savings':
                        stats.savings++;
                        break;
                    case 'transfers':
                        stats.transfers++;
                        break;
                    case 'untagged':
                        stats.untagged++;
                        break;
                    default:
                        stats.expenses++;
                        break;
                }
            }
        });

        return stats;
    }

    // Function to manually override transaction categorization
    function manuallyOverrideTransaction(transactionId, newTag, reason = 'Manual override') {
        const transactionIndex = transactions.value.findIndex((t) => t.id === transactionId);
        if (transactionIndex !== -1) {
            const transaction = transactions.value[transactionIndex];
            const oldTag = transaction.tag;
            transaction.tag = newTag;

            // Add override metadata
            if (!transaction.overrideHistory) {
                transaction.overrideHistory = [];
            }
            transaction.overrideHistory.push({
                timestamp: new Date().toISOString(),
                oldTag,
                newTag,
                reason
            });

            console.log(`🔄 Manual override: Transaction "${transaction.description}" changed from "${oldTag}" to "${newTag}" (${reason})`);

            // Learn from this manual assignment
            if (newTag && newTag !== oldTag) {
                learnFromAssignment(transaction, newTag);
            }

            // Recalculate statistics
            calculateStatistics();

            return true;
        }
        return false;
    }

    // Initialize learning system on startup
    function initializeTransactionStore() {
        initializeLearning();
        console.log('🧠 Transaction learning system initialized');
    }

    // Load custom tags and update available tags
    function loadCustomTags() {
        try {
            const saved = localStorage.getItem('customTags');
            if (saved) {
                const customTags = JSON.parse(saved);
                const customTagNames = customTags.map((tag) => tag.name);

                // Add custom tags to available tags if not already present
                customTagNames.forEach((tagName) => {
                    if (!availableTags.value.includes(tagName)) {
                        availableTags.value.push(tagName);
                    }
                });

                console.log('✅ Loaded custom tags into available tags:', customTagNames);
            }
        } catch (error) {
            console.error('Error loading custom tags:', error);
        }
    }

    // Watch for changes in transactions and recalculate statistics
    watch(
        transactions.value,
        () => {
            console.log('🔄 Transactions changed, recalculating statistics...');
            calculateStatistics();
        },
        { deep: true }
    );

    // Computed properties
    const filteredTransactions = computed(() => {
        if (!transactions.value.length) return [];

        switch (selectedFilter.value) {
            case 'expenses':
                return transactions.value.filter((t) => {
                    // Expenses: transactions with 'Debit' value
                    const debitCredit = t.debit_credit || '';
                    return debitCredit.trim().toLowerCase() === 'debit';
                });
            case 'income':
                return transactions.value.filter((t) => {
                    // Income: transactions with 'Credit' value
                    const debitCredit = t.debit_credit || '';
                    return debitCredit.trim().toLowerCase() === 'credit';
                });
            case 'untagged':
                return transactions.value.filter((t) => {
                    return t.tag === null || t.tag === '';
                });
            default:
                return transactions.value;
        }
    });

    // Methods
    function loadColumnPreferences() {
        try {
            console.log('🔍 Loading column preferences...');
            const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_PREFERENCES);
            console.log('Saved column preferences:', saved ? 'Found' : 'Not found');

            if (saved) {
                const preferences = JSON.parse(saved);
                console.log('Parsed preferences:', preferences);

                // Ensure visibleColumns is always an array
                visibleColumns.value = Array.isArray(preferences.visibleColumns) ? preferences.visibleColumns : [];
                console.log('✅ Loaded visible columns:', visibleColumns.value);
            } else {
                console.log('❌ No saved column preferences found');
            }
        } catch (error) {
            console.error('❌ Error loading column preferences:', error);
            visibleColumns.value = [];
        }
    }

    function saveColumnPreferences() {
        try {
            console.log('💾 Saving column preferences...');
            console.log('Visible columns to save:', visibleColumns.value);

            const preferences = {
                visibleColumns: visibleColumns.value,
                timestamp: Date.now()
            };

            const jsonData = JSON.stringify(preferences);
            console.log('JSON data to save:', jsonData);

            localStorage.setItem(STORAGE_KEYS.COLUMN_PREFERENCES, jsonData);

            // Verify the save worked
            const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_PREFERENCES);
            console.log('Verification - saved preferences exist:', !!saved);
            console.log('✅ Successfully saved column preferences');
        } catch (error) {
            console.error('❌ Error saving column preferences:', error);
        }
    }

    function loadTags() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
            if (saved) {
                tags.value = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading tags:', error);
            tags.value = {};
        }
        return tags.value;
    }

    function saveTags() {
        try {
            localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags.value));
        } catch (error) {
            console.error('Error saving tags:', error);
        }
    }

    function updateTransactionTag(transactionId, tag) {
        console.log(`🔄 Updating tag for transaction ${transactionId} to: ${tag}`);

        // Find the transaction
        const transactionIndex = transactions.value.findIndex((t) => t.id === transactionId);
        if (transactionIndex === -1) {
            console.warn(`⚠️ Transaction with ID ${transactionId} not found`);
            return;
        }

        const transaction = transactions.value[transactionIndex];
        const oldTag = transaction.tag;

        // Update tags object using transaction ID as key (now deterministic)
        if (tag) {
            tags.value[transactionId] = tag;
        } else {
            delete tags.value[transactionId];
        }
        saveTags();

        // Create a new transaction object to ensure reactivity
        const updatedTransaction = { ...transaction, tag };
        transactions.value[transactionIndex] = updatedTransaction;

        console.log(`✅ Updated transaction at index ${transactionIndex}:`, {
            id: transactionId,
            oldTag: oldTag,
            newTag: tag,
            description: updatedTransaction.description
        });

        // Learn from this manual assignment if it's a new tag
        if (tag && tag !== oldTag) {
            learnFromAssignment(transaction, tag);
        }

        // Recalculate statistics after tag update
        calculateStatistics();
    }

    function addCustomTag(tagName) {
        if (!availableTags.value.includes(tagName)) {
            availableTags.value.push(tagName);
        }
    }

    function removeCustomTag(tagName) {
        if (DEFAULT_TAGS.includes(tagName)) {
            console.warn('Cannot remove default tag:', tagName);
            return;
        }

        const index = availableTags.value.indexOf(tagName);
        if (index > -1) {
            availableTags.value.splice(index, 1);
        }
    }

    function calculateStatistics() {
        // Use the new transaction classification system
        const stats = getTransactionStatistics(filteredTransactions.value);

        // Update reactive values (store in cents)
        totalIncome.value = stats.totalIncome;
        totalExpenses.value = stats.outgoingGroups.expenses;
        totalSavings.value = stats.totalSavings; // Use net savings instead of outgoing savings
        totalInvestments.value = stats.outgoingGroups.investments;
        totalTransfers.value = stats.outgoingGroups.transfers;
        netAmount.value = stats.totalIncome - stats.outgoingGroups.expenses - stats.totalSavings - stats.outgoingGroups.investments - stats.outgoingGroups.transfers;
        savingsRate.value = stats.totalIncome > 0 ? (stats.totalSavings / stats.totalIncome) * 100 : 0;

        console.log('📈 Final totals (in cents):', {
            totalIncome: totalIncome.value,
            totalExpenses: totalExpenses.value,
            totalSavings: totalSavings.value,
            totalInvestments: totalInvestments.value,
            totalTransfers: totalTransfers.value,
            savingsRate: savingsRate.value.toFixed(2) + '%',
            totalTransactions: transactions.value.length,
            netAmount: netAmount.value
        });
    }

    function getTransactionsByTag(tag) {
        return filteredTransactions.value.filter((transaction) => transaction.tag === tag);
    }

    function getTagStatistics() {
        const tagStats = {};

        filteredTransactions.value.forEach((transaction) => {
            const tag = transaction.tag || 'Untagged';
            if (!tagStats[tag]) {
                tagStats[tag] = { count: 0, total: 0 };
            }
            tagStats[tag].count++;
            // Amount is now stored in cents
            const amountCents = transaction.amount || 0;
            tagStats[tag].total += amountCents;
        });

        return tagStats;
    }

    function exportTaggedData() {
        const dataToExport = filteredTransactions.value.map((transaction) => ({
            ...transaction,
            tag: transaction.tag || 'Untagged'
        }));

        const csvContent = convertToCSV(dataToExport);
        downloadCSV(csvContent, `tagged-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    }

    function convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Escape quotes and wrap in quotes if contains comma or quote
                        const escaped = String(value).replace(/"/g, '""');
                        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') ? `"${escaped}"` : escaped;
                    })
                    .join(',')
            )
        ];

        return csvRows.join('\n');
    }

    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function clearAllData() {
        transactions.value = [];
        visibleColumns.value = [];
        availableColumns.value = [];
        tags.value = {};
        selectedFilter.value = 'all';

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.COLUMN_PREFERENCES);
        localStorage.removeItem(STORAGE_KEYS.TAGS);
        localStorage.removeItem(STORAGE_KEYS.FILTER_PREFERENCES);
        localStorage.removeItem(STORAGE_KEYS.CSV_DATA);
        localStorage.removeItem(STORAGE_KEYS.LAST_UPLOAD);
    }

    // Debug function to check for duplicates in current transactions
    function debugCheckDuplicates() {
        console.log('🔍 Debug: Checking for duplicates in current transactions...');
        const ids = new Map();
        const duplicates = [];

        transactions.value.forEach((transaction, index) => {
            if (ids.has(transaction.id)) {
                const original = ids.get(transaction.id);
                duplicates.push({
                    original: { index: original.index, transaction: original.transaction },
                    duplicate: { index, transaction },
                    id: transaction.id
                });
            } else {
                ids.set(transaction.id, { index, transaction });
            }
        });

        if (duplicates.length > 0) {
            console.log(`🚨 Found ${duplicates.length} duplicate pairs:`, duplicates);
        } else {
            console.log('✅ No duplicates found in current transactions');
        }

        return duplicates;
    }

    function setTransactions(newTransactions) {
        console.log('🔄 Setting transactions:', newTransactions.length);

        // Track new datatable transactions (avoid duplicates)
        const existingTransactionIds = new Set(transactions.value.map((t) => t.id));

        // Count only truly new transactions
        const newUniqueTransactions = newTransactions.filter((t) => !existingTransactionIds.has(t.id));
        const newCount = newUniqueTransactions.length;

        if (newCount > 0) {
            updatePersistentCount('TOTAL_DATATABLE_TRANSACTIONS', newCount);
            console.log(`📊 Added ${newCount} new unique transactions to datatable`);
        }

        transactions.value = newTransactions;

        // Use standard columns for consistent data table
        availableColumns.value = getAllStandardColumns();

        // Set default visible columns if none are set
        if (visibleColumns.value.length === 0) {
            visibleColumns.value = [...DEFAULT_VISIBLE_COLUMNS];
        }

        // Load existing tags for these transactions
        loadTags();

        // Save transactions to localStorage for persistence
        saveTransactionsToStorage(newTransactions);

        // Calculate statistics
        calculateStatistics();

        // Auto-detect savings and investments for new transactions
        if (newCount > 0) {
            console.log('🔍 Auto-running savings/investments detection for new transactions...');
            applySavingsInvestmentsDetection();
        }

        // Log current persistent counts
        logPersistentCounts();
    }

    function loadSavedTransactions() {
        try {
            console.log('🔍 Attempting to load saved transactions...');
            const saved = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
            console.log('Saved data from localStorage:', saved ? 'Found' : 'Not found');

            if (saved) {
                const data = JSON.parse(saved);
                console.log('Parsed data:', data);

                if (Array.isArray(data.transactions)) {
                    console.log(`📊 Found ${data.transactions.length} transactions to load`);
                    transactions.value = data.transactions;

                    // Use standard columns for consistent data table
                    availableColumns.value = getAllStandardColumns();
                    console.log('📋 Available columns:', availableColumns.value);

                    // Only set visible columns if no preferences were loaded
                    // This preserves user's saved column visibility preferences
                    if (visibleColumns.value.length === 0) {
                        visibleColumns.value = [...DEFAULT_VISIBLE_COLUMNS];
                        console.log('👁️ No saved preferences found, setting default columns visible:', visibleColumns.value);
                    } else {
                        console.log('👁️ Preserving saved column preferences:', visibleColumns.value);
                    }

                    // Load existing tags
                    loadTags();
                    console.log('🏷️ Tags loaded');

                    // Apply saved tags to transactions using transaction IDs (now deterministic)
                    const savedTags = tags.value;
                    transactions.value = transactions.value.map((transaction) => ({
                        ...transaction,
                        tag: savedTags[transaction.id] || transaction.tag || null
                    }));
                    console.log('🏷️ Applied saved tags to transactions using transaction IDs');

                    // Calculate statistics
                    calculateStatistics();

                    console.log(`✅ Successfully loaded ${data.transactions.length} saved transactions`);
                    return true;
                } else {
                    console.log('❌ Data.transactions is not an array:', data.transactions);
                }
            } else {
                console.log('❌ No saved data found in localStorage');
            }
        } catch (error) {
            console.error('❌ Error loading saved transactions:', error);
        }
        return false;
    }

    function saveTransactionsToStorage(newTransactions) {
        try {
            console.log('💾 Saving transactions to localStorage...');
            console.log('Transactions to save:', newTransactions.length);

            const data = {
                transactions: newTransactions,
                timestamp: Date.now(),
                count: newTransactions.length
            };

            const jsonData = JSON.stringify(data);
            console.log('JSON data to save:', jsonData.substring(0, 200) + '...');

            localStorage.setItem(STORAGE_KEYS.CSV_DATA, jsonData);

            // Verify the save worked
            const saved = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
            console.log('Verification - saved data exists:', !!saved);
            console.log(`✅ Successfully saved ${newTransactions.length} transactions to localStorage`);
        } catch (error) {
            console.error('❌ Error saving transactions to localStorage:', error);
        }
    }

    // Simplified JSON-first approach: iterate through JSON and enrich with CSV data
    function enrichJsonWithCsvData(jsonTransactions, csvTransactions) {
        console.log(`🔄 Enriching ${jsonTransactions.length} JSON transactions with ${csvTransactions.length} CSV transactions`);

        function isFirstWordInSecond(str1, str2) {
            if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;

            // Check if strings are exactly the same
            if (str1 === str2) return true;

            // Extract substring before the first space (or the full string if no space)
            const firstWord = str1.split(' ')[0];

            // Check if it's included in the second string
            return str2.includes(firstWord);
        }

        // Simple matching function using amount, date, and description
        function findMatchingCsvTransaction(jsonTransaction, csvTransactions) {
            const jsonAmount = jsonTransaction.amount; // Already in cents
            const jsonDate = jsonTransaction.date;
            const jsonDescription = jsonTransaction.description?.toLowerCase().trim();

            return csvTransactions.find((csvTransaction) => {
                const csvAmount = csvTransaction.amount; // Already in cents
                const csvDate = csvTransaction.date;
                const csvDescription = csvTransaction.description?.toLowerCase().trim();

                // Match on amount, date, and description
                const result = jsonAmount === csvAmount && jsonDate === csvDate && isFirstWordInSecond(jsonDescription, csvDescription);
                return result;
            });
        }

        // Debug: Check what fields are available in CSV transactions
        if (csvTransactions.length > 0) {
            console.log(`🔍 CSV transaction sample fields:`, Object.keys(csvTransactions[0]));
            console.log(`🔍 CSV transaction sample:`, csvTransactions[0]);
        }

        // Enrich each JSON transaction
        const enrichedTransactions = jsonTransactions.map((jsonTransaction) => {
            const matchingCsvTransaction = findMatchingCsvTransaction(jsonTransaction, csvTransactions);

            if (matchingCsvTransaction) {
                console.log(`✅ Found CSV match for: ${jsonTransaction.description} (${jsonTransaction.amount})`);
                console.log(`📊 CSV balance field:`, matchingCsvTransaction.balance);

                // Create enriched transaction starting with JSON data
                const enriched = { ...jsonTransaction };

                // Add CSV-specific fields that don't exist in JSON
                if (matchingCsvTransaction.account && !enriched.account) {
                    enriched.account = matchingCsvTransaction.account;
                }
                if (matchingCsvTransaction.counterparty && !enriched.counterparty) {
                    enriched.counterparty = matchingCsvTransaction.counterparty;
                }
                if (matchingCsvTransaction.code && !enriched.code) {
                    enriched.code = matchingCsvTransaction.code;
                }
                if (matchingCsvTransaction.transaction_type && !enriched.transaction_type) {
                    enriched.transaction_type = matchingCsvTransaction.transaction_type;
                }
                if (matchingCsvTransaction.notifications && !enriched.notifications) {
                    enriched.notifications = matchingCsvTransaction.notifications;
                }

                // Always add balance from CSV if it exists (overwrite null values)
                if (matchingCsvTransaction.balance) {
                    enriched.balance = matchingCsvTransaction.balance;
                    console.log(`💰 Added balance ${matchingCsvTransaction.balance} for: ${jsonTransaction.description}`);
                }

                // Store original data sources
                enriched.originalData = {
                    json: jsonTransaction.originalData || jsonTransaction,
                    csv: matchingCsvTransaction.originalData || matchingCsvTransaction
                };
                return enriched;
            } else {
                console.log(`⚠️ No CSV match found for: ${jsonTransaction.description} (${jsonTransaction.amount})`);
                // Keep JSON transaction as is
                if (!jsonTransaction.originalData) {
                    jsonTransaction.originalData = { json: jsonTransaction };
                }
                return jsonTransaction;
            }
        });

        const matchedCount = enrichedTransactions.filter((t) => t.originalData && t.originalData.csv).length;
        console.log(`📊 Enrichment complete: ${matchedCount} matched, ${enrichedTransactions.length - matchedCount} unmatched`);

        return enrichedTransactions;
    }

    function getLastUploadInfo() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.LAST_UPLOAD);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading last upload info:', error);
        }
        return null;
    }

    function saveLastUploadInfo(filename, transactionCount) {
        try {
            const info = {
                filename,
                transactionCount,
                timestamp: Date.now(),
                date: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.LAST_UPLOAD, JSON.stringify(info));
        } catch (error) {
            console.error('Error saving last upload info:', error);
        }
    }

    // API stubs for future backend integration
    async function saveColumnPreferencesToBackend() {
        try {
            // TODO: Implement backend API call
            console.log('Saving column preferences to backend...');
            const response = await fetch('/api/preferences/columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferences: {
                        visibleColumns: visibleColumns.value,
                        timestamp: Date.now()
                    }
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving column preferences to backend:', error);
            return false;
        }
    }

    async function saveTagsToBackend() {
        try {
            // TODO: Implement backend API call
            console.log('Saving tags to backend...');
            const response = await fetch('/api/transactions/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tags: tags.value,
                    timestamp: Date.now()
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving tags to backend:', error);
            return false;
        }
    }

    // Watchers
    watch(
        visibleColumns,
        () => {
            saveColumnPreferences();
        },
        { deep: true }
    );

    watch(
        tags,
        () => {
            saveTags();
        },
        { deep: true }
    );

    // Initialize custom tags when store is created
    loadCustomTags();

    // Initialize learning system
    initializeTransactionStore();

    // Rule extraction and merging function
    const extractAndMergeAllRules = () => {
        console.log('🔧 Extracting and merging all rules from transaction store...');

        try {
            // Get the function from useTransactionEngine
            const { extractAndMergeAllRules: engineExtractRules } = useTransactionEngine();

            // Call the actual implementation
            const result = engineExtractRules();

            console.log('✅ Rules extracted and merged successfully');

            // Show success message
            return {
                message: `Successfully extracted and merged ${Object.keys(result).length} rule categories`,
                status: 'success',
                result
            };
        } catch (error) {
            console.error('❌ Error extracting and merging rules:', error);
            return {
                message: 'Error extracting and merging rules: ' + error.message,
                status: 'error'
            };
        }
    };

    return {
        // State
        transactions,
        selectedFilter,
        visibleColumns,
        availableColumns,
        availableTags,
        isLoading,
        totalIncome,
        totalExpenses,
        totalSavings,
        totalInvestments,
        totalTransfers,
        netAmount,
        savingsRate,

        // Computed
        filteredTransactions,
        filterOptions,

        // Methods
        setTransactions,
        loadSavedTransactions,
        saveTransactionsToStorage,
        enrichJsonWithCsvData,
        getLastUploadInfo,
        saveLastUploadInfo,
        loadColumnPreferences,
        saveColumnPreferences,
        loadTags,
        saveTags,
        loadCustomTags,
        updateTransactionTag,
        addCustomTag,
        removeCustomTag,
        calculateStatistics,
        getTransactionsByTag,
        getTagStatistics,
        exportTaggedData,
        clearAllData,
        debugCheckDuplicates,
        fixExistingTagAssignments,

        // API stubs
        saveColumnPreferencesToBackend,
        saveTagsToBackend,

        // Persistent tracking functions
        getPersistentCounts,

        // Savings and investments detection
        detectSavingsAndInvestments,
        applySavingsInvestmentsDetection,
        getDetectionStatistics,

        // Manual override
        manuallyOverrideTransaction,

        // Comprehensive tag fixing
        fixAllExistingTagAssignments,

        // Learning system functions
        getLearningStatistics,
        clearLearnedData,
        exportLearnedRules,
        importLearnedRules,
        totalRules,
        totalAssignments,

        // Rule extraction and merging
        extractAndMergeAllRules
    };
}
