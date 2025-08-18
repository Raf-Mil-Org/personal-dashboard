/**
 * Unified Transaction Engine
 *
 * This composable consolidates all transaction processing logic:
 * - File parsing (CSV, JSON)
 * - Transaction classification and tagging
 * - Category and subcategory assignment
 * - Investment/savings detection
 * - Learning system integration
 *
 * Architecture:
 * - Single responsibility: Transaction processing
 * - Clean separation of concerns
 * - Consistent API
 * - Comprehensive error handling
 */

import { ref, computed } from 'vue';
import { useTransactionLearning } from './useTransactionLearning';

// Storage keys
const STORAGE_KEYS = {
    COLUMN_PREFERENCES: 'transaction_analyzer_column_preferences',
    TAGS: 'transaction_analyzer_tags',
    FILTER_PREFERENCES: 'transaction_analyzer_filter_preferences',
    CSV_DATA: 'transaction_analyzer_csv_data',
    LAST_UPLOAD: 'transaction_analyzer_last_upload'
};

export function useTransactionEngine() {
    // Initialize learning system
    const { initializeLearning, learnFromAssignment, applyLearnedRules, getLearningStatistics, clearLearnedData, exportLearnedRules, importLearnedRules, totalRules, totalAssignments } = useTransactionLearning();

    // State
    const transactions = ref([]);
    const isLoading = ref(false);
    const parseError = ref(null);

    // ============================================================================
    // COMPREHENSIVE CLASSIFICATION RULES
    // ============================================================================

    /**
     * ALL CLASSIFICATION RULES IN ONE PLACE
     *
     * This section contains all rules for:
     * - Category assignment
     * - Subcategory assignment
     * - Tag assignment
     * - Investment detection
     * - Savings detection
     * - Transfer detection
     * - Income detection
     */

    // ============================================================================
    // CATEGORY RULES
    // ============================================================================

    const CATEGORY_RULES = [
        // Groceries & Household
        {
            pattern: /(ALBERT HEIJN|DIRK|Lidl|JUMBO|AH|SUPERMARKET|GROCERY)/i,
            category: 'Groceries & Household',
            subcategory: 'Supermarket',
            confidence: 0.9
        },

        // Health & Wellness
        {
            pattern: /(Hairstudio|Pharmacy|Health|GYM|FITNESS|WELLNESS|SPA|MASSAGE)/i,
            category: 'Health & Wellness',
            subcategory: 'Personal Care',
            confidence: 0.8
        },

        // Restaurants & Food
        {
            pattern: /(Cafe|Restaurant|FLOCAFE|Bakery|Zero|Ramen|VIJFHUI|FOOD|DINING|EAT)/i,
            category: 'Restaurants/Food',
            subcategory: 'Dining Out',
            confidence: 0.85
        },

        // Bars & Entertainment
        {
            pattern: /(Bar|Pub|Radion|CLUB|NIGHTLIFE|ENTERTAINMENT)/i,
            category: 'Bars',
            subcategory: 'Nightlife',
            confidence: 0.8
        },

        // Shopping
        {
            pattern: /(SHOP|STORE|BOUTIQUE|RETAIL|PURCHASE|BUY)/i,
            category: 'Shopping',
            subcategory: 'Retail',
            confidence: 0.7
        },

        // Transport & Travel
        {
            pattern: /(BOLT|Uber|Flight|Train|TRANSPORT|TRAVEL|COMMUTE|PARKING)/i,
            category: 'Transport & Travel',
            subcategory: 'Transportation',
            confidence: 0.8
        },

        // Free Time & Entertainment
        {
            pattern: /(Cinema|Theater|Entertainment|MOVIE|SHOW|EVENT|ACTIVITY)/i,
            category: 'Free Time',
            subcategory: 'Entertainment',
            confidence: 0.75
        },

        // Medical
        {
            pattern: /(Hospital|Clinic|Doctor|Ntavas|MEDICAL|HEALTHCARE|DENTIST)/i,
            category: 'Medical',
            subcategory: 'Healthcare',
            confidence: 0.9
        },

        // Fixed Expenses
        {
            pattern: /(RENT|MORTGAGE|UTILITIES|ELECTRICITY|GAS|WATER|INTERNET|PHONE|INSURANCE)/i,
            category: 'Fixed Expenses',
            subcategory: 'Housing & Utilities',
            confidence: 0.85
        },

        // Gifts
        {
            pattern: /(GIFT|PRESENT|DONATION|CHARITY)/i,
            category: 'Gift',
            subcategory: 'Personal Gifts',
            confidence: 0.8
        }
    ];

    // ============================================================================
    // TAG CLASSIFICATION RULES
    // ============================================================================

    const TAG_RULES = {
        // Special rules (highest priority)
        special: [
            {
                pattern: /revolut\*\*7355\*/i,
                tag: 'Transfers',
                category: 'Other',
                subcategory: 'Transfers',
                confidence: 1.0,
                reason: 'Special rule: Revolut transactions'
            }
        ],

        // Savings rules
        savings: {
            keywords: ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings', 'reserve', 'nest egg', 'rainy day fund'],
            accountPatterns: [/bunq/i, /savings account/i, /emergency fund/i, /goal savings/i],
            subcategories: ['savings account', 'emergency fund', 'goal savings'],
            tag: 'Savings',
            confidence: 0.9,
            reason: 'Savings indicators detected'
        },

        // Transfer rules
        transfers: {
            keywords: ['transfer', 'internal transfer', 'account transfer', 'between accounts', 'own transfer', 'self transfer', 'move money'],
            accountPatterns: [/transfer to own account/i, /internal transfer/i, /between own accounts/i],
            subcategories: ['internal transfer', 'account transfer', 'between accounts'],
            tag: 'Transfers',
            confidence: 0.8,
            reason: 'Transfer indicators detected'
        },

        // Investment rules (most restrictive)
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
                'dividend reinvestment',
                'buy',
                'purchase'
            ],
            accountPatterns: [/degiro/i, /trading212/i, /etoro/i, /coinbase/i, /binance/i, /kraken/i, /interactive brokers/i, /fidelity/i, /vanguard/i, /schwab/i],
            subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds'],
            tag: 'Investments',
            confidence: 0.7,
            reason: 'Investment indicators detected',

            // Investment exclusions (fail-safe checks)
            exclusions: {
                positiveAmounts: true, // Only negative amounts can be investments
                minimumAmount: 10, // Minimum €10 for investments
                feeKeywords: [
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
                ],
                withdrawalKeywords: ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out', 'disposal', 'liquidation', 'exit', 'close position'],
                taxKeywords: ['tax', 'withholding', 'dividend tax', 'capital gains'],
                savingsKeywords: ['savings', 'emergency fund', 'bunq', 'deposit'],
                bunqExclusion: true // ALL Bunq transactions excluded
            }
        },

        // Income rules
        income: {
            keywords: ['salary', 'wage', 'income', 'payment', 'refund', 'dividend', 'bonus', 'commission', 'revenue'],
            tag: 'Income',
            confidence: 0.8,
            reason: 'Income indicators detected',
            requirePositiveAmount: true // Income must be positive
        }
    };

    // ============================================================================
    // COMPREHENSIVE CLASSIFICATION FUNCTION
    // ============================================================================

    /**
     * Comprehensive transaction classification with ALL rules
     */
    const classifyTransaction = (transaction) => {
        const description = (transaction.description || '').toLowerCase();

        // PRIORITY 0: Special rules (highest priority)
        for (const rule of TAG_RULES.special) {
            if (rule.pattern.test(description)) {
                return {
                    tag: rule.tag,
                    category: rule.category,
                    subcategory: rule.subcategory,
                    confidence: rule.confidence,
                    reason: rule.reason
                };
            }
        }

        // PRIORITY 1: Apply learned rules
        const learnedResult = applyLearnedRules(transaction);
        if (learnedResult && learnedResult.confidence > 0.6) {
            return {
                tag: learnedResult.tag,
                confidence: learnedResult.confidence,
                reason: `Learned rule: ${learnedResult.ruleId}`
            };
        }

        // PRIORITY 2: Category assignment
        const categoryResult = assignCategory(transaction);

        // PRIORITY 3: Tag assignment based on comprehensive rules
        const tagResult = assignTag(transaction);

        // Combine results
        return {
            tag: tagResult.tag,
            category: categoryResult.category || transaction.category,
            subcategory: categoryResult.subcategory || transaction.subcategory,
            confidence: Math.min(tagResult.confidence, categoryResult.confidence),
            reason: tagResult.reason
        };
    };

    /**
     * Assign category and subcategory based on rules
     */
    const assignCategory = (transaction) => {
        const description = transaction.description || '';

        for (const rule of CATEGORY_RULES) {
            if (rule.pattern.test(description)) {
                return {
                    category: rule.category,
                    subcategory: rule.subcategory,
                    confidence: rule.confidence
                };
            }
        }

        // Default category
        return {
            category: 'Other',
            subcategory: 'Uncategorized',
            confidence: 0.5
        };
    };

    /**
     * Assign tag based on comprehensive rules
     */
    const assignTag = (transaction) => {
        // Check savings
        if (isSavingsTransaction(transaction)) {
            return {
                tag: TAG_RULES.savings.tag,
                confidence: TAG_RULES.savings.confidence,
                reason: TAG_RULES.savings.reason
            };
        }

        // Check transfers
        if (isTransferTransaction(transaction)) {
            return {
                tag: TAG_RULES.transfers.tag,
                confidence: TAG_RULES.transfers.confidence,
                reason: TAG_RULES.transfers.reason
            };
        }

        // Check investments (most restrictive)
        if (isInvestmentTransaction(transaction)) {
            return {
                tag: TAG_RULES.investments.tag,
                confidence: TAG_RULES.investments.confidence,
                reason: TAG_RULES.investments.reason
            };
        }

        // Check income
        if (isIncomeTransaction(transaction)) {
            return {
                tag: TAG_RULES.income.tag,
                confidence: TAG_RULES.income.confidence,
                reason: TAG_RULES.income.reason
            };
        }

        // Default: Other
        return {
            tag: 'Other',
            confidence: 0.5,
            reason: 'No specific indicators detected'
        };
    };

    // ============================================================================
    // DETECTION FUNCTIONS
    // ============================================================================

    /**
     * Check if transaction is a savings transaction
     */
    const isSavingsTransaction = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();

        const rules = TAG_RULES.savings;

        // Check keywords
        const hasKeyword = rules.keywords.some((keyword) => description.includes(keyword));
        if (hasKeyword) return true;

        // Check account patterns
        const hasAccountPattern = rules.accountPatterns.some((pattern) => pattern.test(description));
        if (hasAccountPattern) return true;

        // Check subcategories
        const hasSubcategory = rules.subcategories.some((sub) => subcategory.includes(sub));
        if (hasSubcategory) return true;

        // Check category
        const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account';
        if (isSavingsCategory) return true;

        return false;
    };

    /**
     * Check if transaction is a transfer transaction
     */
    const isTransferTransaction = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();

        const rules = TAG_RULES.transfers;

        // Check keywords
        const hasKeyword = rules.keywords.some((keyword) => description.includes(keyword));
        if (hasKeyword) return true;

        // Check account patterns
        const hasAccountPattern = rules.accountPatterns.some((pattern) => pattern.test(description));
        if (hasAccountPattern) return true;

        // Check subcategories
        const hasSubcategory = rules.subcategories.some((sub) => subcategory.includes(sub));
        if (hasSubcategory) return true;

        // Check category
        const isTransferCategory = category === 'transfers' || subcategory === 'transfers' || subcategory === 'internal transfer';
        if (isTransferCategory) return true;

        return false;
    };

    /**
     * Check if transaction is an investment transaction (with comprehensive checks)
     */
    const isInvestmentTransaction = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;
        const rules = TAG_RULES.investments;
        const exclusions = rules.exclusions;

        // FAIL-SAFE CHECKS (must pass ALL)

        // Check 1: Only negative amounts can be investments
        if (exclusions.positiveAmounts && amount >= 0) return false;

        // Check 2: Minimum amount threshold
        if (Math.abs(amount) / 100 < exclusions.minimumAmount) return false;

        // Check 3: Exclude fees
        const hasFeeKeyword = exclusions.feeKeywords.some((keyword) => description.includes(keyword));
        if (hasFeeKeyword) return false;

        // Check 4: Exclude withdrawals/sales
        const hasWithdrawalKeyword = exclusions.withdrawalKeywords.some((keyword) => description.includes(keyword));
        if (hasWithdrawalKeyword) return false;

        // Check 5: Exclude taxes
        const hasTaxKeyword = exclusions.taxKeywords.some((keyword) => description.includes(keyword));
        if (hasTaxKeyword) return false;

        // Check 6: Exclude savings
        const hasSavingsKeyword = exclusions.savingsKeywords.some((keyword) => description.includes(keyword));
        if (hasSavingsKeyword) return false;

        // Check 7: Exclude Bunq transactions
        if (exclusions.bunqExclusion && description.includes('bunq')) return false;

        // POSITIVE CHECKS (must pass at least one)

        // Check keywords
        const hasKeyword = rules.keywords.some((keyword) => description.includes(keyword));
        if (hasKeyword) return true;

        // Check account patterns
        const hasAccountPattern = rules.accountPatterns.some((pattern) => pattern.test(description));
        if (hasAccountPattern) return true;

        // Check subcategories
        const hasSubcategory = rules.subcategories.some((sub) => subcategory.includes(sub));
        if (hasSubcategory) return true;

        return false;
    };

    /**
     * Check if transaction is an income transaction
     */
    const isIncomeTransaction = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        const rules = TAG_RULES.income;

        // Income is typically positive
        if (rules.requirePositiveAmount && amount <= 0) return false;

        // Check keywords
        const hasKeyword = rules.keywords.some((keyword) => description.includes(keyword));
        return hasKeyword;
    };

    // ============================================================================
    // FILE PARSING SECTION
    // ============================================================================

    /**
     * Parse CSV data with comprehensive error handling
     */
    const parseCSV = (csvText) => {
        try {
            parseError.value = null;
            isLoading.value = true;

            const lines = csvText.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV file must have at least a header and one data row');
            }

            const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
            const parsedTransactions = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = parseCSVLine(line);
                if (values.length !== headers.length) {
                    console.warn(`Line ${i + 1}: Skipping malformed row with ${values.length} values (expected ${headers.length})`);
                    continue;
                }

                const transaction = createTransactionFromValues(headers, values, i);
                if (transaction) {
                    parsedTransactions.push(transaction);
                }
            }

            console.log(`✅ Parsed ${parsedTransactions.length} transactions from CSV`);
            return parsedTransactions;
        } catch (error) {
            parseError.value = `CSV parsing failed: ${error.message}`;
            console.error('CSV parsing error:', error);
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Parse JSON data with comprehensive error handling
     */
    const parseJSON = (jsonText) => {
        try {
            parseError.value = null;
            isLoading.value = true;

            const data = JSON.parse(jsonText);

            if (!Array.isArray(data)) {
                throw new Error('JSON data must be an array of transactions');
            }

            const parsedTransactions = data
                .map((item, index) => {
                    return createTransactionFromJSON(item, index);
                })
                .filter(Boolean);

            console.log(`✅ Parsed ${parsedTransactions.length} transactions from JSON`);
            return parsedTransactions;
        } catch (error) {
            parseError.value = `JSON parsing failed: ${error.message}`;
            console.error('JSON parsing error:', error);
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Unified file parser that detects format and routes to appropriate parser
     */
    const parseFile = (fileContent, filename) => {
        const content = typeof fileContent === 'string' ? fileContent : fileContent.toString();

        // Detect format
        if (filename.toLowerCase().endsWith('.json') || content.trim().startsWith('[')) {
            return parseJSON(content, filename);
        } else if (filename.toLowerCase().endsWith('.csv') || content.includes(',')) {
            return parseCSV(content, filename);
        } else {
            parseError.value = 'Unsupported file format. Please use CSV or JSON files.';
            return [];
        }
    };

    // ============================================================================
    // TAG ASSIGNMENT SECTION
    // ============================================================================

    /**
     * Apply tags to all transactions with proper re-evaluation of existing tags
     */
    const applyTagsToTransactions = (transactionList) => {
        return transactionList.map((transaction) => {
            const existingTag = transaction.tag;
            const classification = classifyTransaction(transaction);
            const newTag = classification.tag;

            // Always apply the new classification to ensure latest rules are followed
            // This is especially important for special rules like Revolut transactions
            const updatedTransaction = {
                ...transaction,
                tag: newTag,
                category: classification.category || transaction.category,
                subcategory: classification.subcategory || transaction.subcategory,
                classificationConfidence: classification.confidence,
                classificationReason: classification.reason
            };

            // Log if tag changed (for debugging)
            if (existingTag && existingTag !== newTag) {
                console.log(`🔄 Re-evaluated tag: "${transaction.description}" (${existingTag} → ${newTag})`);
            }

            return updatedTransaction;
        });
    };

    /**
     * Update a single transaction's tag and learn from it
     */
    const updateTransactionTag = (transactionId, newTag, reason = 'Manual update') => {
        const transaction = transactions.value.find((t) => t.id === transactionId);
        if (!transaction) {
            console.warn(`Transaction ${transactionId} not found`);
            return false;
        }

        const oldTag = transaction.tag;
        transaction.tag = newTag;

        // Learn from this assignment
        learnFromAssignment(transaction, newTag);

        // Add to override history
        if (!transaction.overrideHistory) {
            transaction.overrideHistory = [];
        }
        transaction.overrideHistory.push({
            timestamp: new Date().toISOString(),
            oldTag,
            newTag,
            reason
        });

        console.log(`🏷️ Updated transaction ${transactionId}: ${oldTag} → ${newTag} (${reason})`);
        return true;
    };

    // ============================================================================
    // DATA FIXING SECTION
    // ============================================================================

    /**
     * Force re-evaluation of all transactions with latest rules
     * This is especially useful for fixing issues like Revolut transactions being tagged as investments
     */
    const forceReevaluateAllTransactions = () => {
        console.log('🔄 Force re-evaluating all transactions with latest rules...');

        let fixedCount = 0;
        let unchangedCount = 0;

        const reevaluatedTransactions = transactions.value.map((transaction) => {
            const oldTag = transaction.tag || 'Untagged';
            const classification = classifyTransaction(transaction);
            const newTag = classification.tag;

            const updatedTransaction = {
                ...transaction,
                tag: newTag,
                category: classification.category || transaction.category,
                subcategory: classification.subcategory || transaction.subcategory,
                classificationConfidence: classification.confidence,
                classificationReason: classification.reason
            };

            if (oldTag !== newTag) {
                fixedCount++;
                console.log(`🔧 Fixed: "${transaction.description}" (${oldTag} → ${newTag})`);
            } else {
                unchangedCount++;
            }

            return updatedTransaction;
        });

        transactions.value = reevaluatedTransactions;

        const result = {
            total: transactions.value.length,
            fixed: fixedCount,
            unchanged: unchangedCount
        };

        console.log(`✅ Re-evaluation complete:`, result);
        return result;
    };

    /**
     * Fix all existing tag assignments based on latest rules
     */
    const fixAllTagAssignments = () => {
        console.log('🔧 Starting comprehensive tag fixing...');

        let fixedCount = 0;
        let trustedCount = 0;
        let skippedCount = 0;

        const fixedTransactions = transactions.value.map((transaction) => {
            const oldTag = transaction.tag || 'Untagged';

            // Skip manually overridden transactions
            if (transaction.overrideHistory && transaction.overrideHistory.length > 0) {
                skippedCount++;
                return transaction;
            }

            // Apply latest classification
            const classification = classifyTransaction(transaction);
            const newTag = classification.tag;

            if (newTag !== oldTag) {
                transaction.tag = newTag;
                transaction.category = classification.category || transaction.category;
                transaction.subcategory = classification.subcategory || transaction.subcategory;
                transaction.classificationConfidence = classification.confidence;
                transaction.classificationReason = classification.reason;
                fixedCount++;

                console.log(`🔧 Fixed: "${transaction.description}" (${oldTag} → ${newTag})`);
            } else {
                trustedCount++;
            }

            return transaction;
        });

        transactions.value = fixedTransactions;

        const result = {
            total: transactions.value.length,
            fixed: fixedCount,
            trusted: trustedCount,
            skipped: skippedCount
        };

        console.log(`✅ Tag fixing complete:`, result);
        return result;
    };

    // ============================================================================
    // STORAGE SECTION
    // ============================================================================

    /**
     * Save transactions to localStorage
     */
    const saveTransactions = () => {
        try {
            localStorage.setItem(STORAGE_KEYS.CSV_DATA, JSON.stringify(transactions.value));

            // Save tags separately for backward compatibility
            const tags = {};
            transactions.value.forEach((transaction) => {
                if (transaction.tag) {
                    tags[transaction.id] = transaction.tag;
                }
            });
            localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));

            console.log(`💾 Saved ${transactions.value.length} transactions to localStorage`);
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    };

    /**
     * Load transactions from localStorage
     */
    const loadTransactions = () => {
        try {
            const csvData = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
            if (csvData) {
                const parsed = JSON.parse(csvData);
                if (Array.isArray(parsed)) {
                    transactions.value = parsed;
                    console.log(`📊 Loaded ${parsed.length} transactions from localStorage`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error loading transactions:', error);
            return false;
        }
    };

    /**
     * Clear all transaction data
     */
    const clearTransactions = () => {
        transactions.value = [];
        Object.values(STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key);
        });
        console.log('🗑️ Cleared all transaction data');
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Parse a single CSV line with proper quote handling
     */
    const parseCSVLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    };

    /**
     * Create transaction object from CSV values
     */
    const createTransactionFromValues = (headers, values, rowIndex) => {
        try {
            const transaction = {
                id: `csv_${rowIndex}_${Date.now()}`,
                rowIndex: rowIndex
            };

            headers.forEach((header, index) => {
                const value = values[index] || '';
                transaction[header.toLowerCase().replace(/\s+/g, '_')] = value;
            });

            // Ensure required fields
            if (!transaction.description && transaction.description_1) {
                transaction.description = transaction.description_1;
            }

            return transaction;
        } catch (error) {
            console.warn(`Error creating transaction from row ${rowIndex}:`, error);
            return null;
        }
    };

    /**
     * Create transaction object from JSON data
     */
    const createTransactionFromJSON = (item, index) => {
        try {
            return {
                id: item.id || `json_${index}_${Date.now()}`,
                ...item
            };
        } catch (error) {
            console.warn(`Error creating transaction from JSON item ${index}:`, error);
            return null;
        }
    };

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    const transactionCount = computed(() => transactions.value.length);

    const tagBreakdown = computed(() => {
        const breakdown = {};
        transactions.value.forEach((transaction) => {
            const tag = transaction.tag || 'Untagged';
            breakdown[tag] = (breakdown[tag] || 0) + 1;
        });
        return breakdown;
    });

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    const initialize = () => {
        initializeLearning();
        loadTransactions();
    };

    // Initialize on import
    initialize();

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        // State
        transactions,
        isLoading,
        parseError,

        // File parsing
        parseFile,
        parseCSV,
        parseJSON,

        // Classification
        classifyTransaction,
        applyTagsToTransactions,
        updateTransactionTag,

        // Data fixing
        fixAllTagAssignments,
        forceReevaluateAllTransactions,

        // Storage
        saveTransactions,
        loadTransactions,
        clearTransactions,

        // Learning system
        getLearningStatistics,
        clearLearnedData,
        exportLearnedRules,
        importLearnedRules,

        // Computed
        transactionCount,
        tagBreakdown,

        // Statistics
        totalRules,
        totalAssignments,

        // Rules (for debugging and modification)
        CATEGORY_RULES,
        TAG_RULES
    };
}
