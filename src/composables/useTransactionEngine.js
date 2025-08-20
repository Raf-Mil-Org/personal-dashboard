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
import { useMultiFormatParser } from './useMultiFormatParser';

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
    const { initializeLearning, learnFromAssignment, applyLearnedRules, clearLearnedData, exportLearnedRules, importLearnedRules, totalRules, totalAssignments } = useTransactionLearning();

    // Initialize tag mapping system
    const { getTagMapping: getOriginalTagMapping } = useMultiFormatParser();

    // Enhanced getTagMapping that includes both hardcoded and custom rules
    const getTagMapping = () => {
        // First try to get merged rules (if extractAndMergeAllRules was called)
        const mergedRules = loadCustomTagMapping();
        if (Object.keys(mergedRules).length > 0) {
            return mergedRules;
        }

        // Fallback to original mapping
        return getOriginalTagMapping();
    };

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
            // Add any special rules here if needed
        ],

        // Savings rules
        savings: {
            keywords: ['savings', 'bunq'],
            accountPatterns: [/bunq/i, /savings account/i],
            subcategories: ['savings account', 'emergency fund', 'goal savings'],
            tag: 'Savings',
            confidence: 0.9,
            reason: 'Savings indicators detected'
        },

        // Transfer rules
        transfers: {
            keywords: ['transfer'],
            accountPatterns: [/transfer to own account/i, /internal transfer/i, /between own accounts/i],
            subcategories: ['internal transfer', 'account transfer', 'between accounts'],
            tag: 'Transfers',
            confidence: 0.8,
            reason: 'Transfer indicators detected'
        },

        // Investment rules (most restrictive)
        investments: {
            keywords: ['flatex', 'degiro'],
            accountPatterns: [/degiro/i, /flatex/i],
            subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds'],
            tag: 'Investments',
            confidence: 0.7,
            reason: 'Investment indicators detected',

            // Investment exclusions (fail-safe checks)
            exclusions: {
                positiveAmounts: true, // Only negative amounts can be investments
                minimumAmount: 10, // Minimum €10 for investments
                feeKeywords: ['fee'],
                withdrawalKeywords: ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out', 'disposal', 'liquidation', 'exit', 'close position'],
                taxKeywords: ['tax', 'withholding', 'dividend tax', 'capital gains'],
                savingsKeywords: ['savings', 'emergency fund', 'bunq', 'deposit'],
                bunqExclusion: true // ALL Bunq transactions excluded
            }
        },

        // Income rules
        income: {
            keywords: ['salary', 'abn amro bank', 'wage', 'income', 'payment', 'refund'],
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
     * UNIFIED TRANSACTION CLASSIFICATION - Merged from determineTag() and classifyTransaction()
     *
     * Priority System:
     * 1. Learned rules (with validation)
     * 2. Category/subcategory → Tag mapping (user-defined)
     * 3. Validate existing tag against current rules
     * 4. Keyword-based tag assignment
     * 5. Category assignment + default tag
     *
     * NO SPECIAL RULES - All classification based on consistent patterns
     */
    const classifyTransaction = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const existingTag = (transaction.tag || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        console.log('🔍 Unified classification for:', { description, existingTag, category, subcategory, amount });

        // PRIORITY 1: Apply learned rules (with validation)
        const learnedResult = applyLearnedRules(transaction);
        if (learnedResult && learnedResult.confidence > 0.6) {
            // Validate learned result against current rules
            const isValidLearnedTag = validateTagAgainstRules(transaction, learnedResult.tag);
            if (isValidLearnedTag) {
                console.log(`✅ Learned rule applied: ${learnedResult.tag} (${learnedResult.confidence})`);
                return {
                    tag: learnedResult.tag,
                    confidence: learnedResult.confidence,
                    reason: `Learned rule: ${learnedResult.ruleId}`
                };
            } else {
                console.log(`⚠️ Invalidating learned rule for "${description}": ${learnedResult.tag} doesn't match current rules`);
            }
        }

        // PRIORITY 2: Category/subcategory → Tag mapping (user-defined)
        const tagMapping = getTagMapping();
        if (category && subcategory && tagMapping[category] && tagMapping[category][subcategory]) {
            const mappedTag = tagMapping[category][subcategory];
            console.log(`🏷️ Category mapping applied: ${category}/${subcategory} → ${mappedTag}`);
            return {
                tag: mappedTag,
                confidence: 0.9,
                reason: `Category mapping: ${category}/${subcategory} → ${mappedTag}`
            };
        }

        // PRIORITY 3: Validate existing tag against current rules
        if (existingTag && existingTag !== 'untagged' && existingTag !== 'other') {
            const isExistingTagValid = validateTagAgainstRules(transaction, existingTag);
            if (isExistingTagValid) {
                console.log(`✅ Existing tag validated: ${existingTag}`);
                return {
                    tag: existingTag.charAt(0).toUpperCase() + existingTag.slice(1), // Capitalize
                    confidence: 0.8,
                    reason: `Validated existing tag: ${existingTag}`
                };
            } else {
                console.log(`⚠️ Invalidating existing tag for "${description}": ${existingTag} doesn't match current rules`);
            }
        }

        // PRIORITY 4: Keyword-based tag assignment
        const keywordResult = assignTagByKeywords(transaction);
        if (keywordResult) {
            console.log(`🏷️ Keyword-based tag assigned: ${keywordResult.tag} (${keywordResult.confidence})`);
            return keywordResult;
        }

        // PRIORITY 5: Category assignment + default tag
        const categoryResult = assignCategory(transaction);
        console.log(`🏷️ Default classification: Other (${categoryResult.confidence})`);

        return {
            tag: 'Other',
            category: categoryResult.category || 'Other',
            subcategory: categoryResult.subcategory || 'other',
            confidence: Math.min(categoryResult.confidence || 0.5, 0.5),
            reason: 'No specific indicators detected - classified as Other'
        };
    };

    /**
     * Validate if an existing tag is correct based on current rules and category/subcategory
     */
    const validateTagAgainstRules = (transaction, tag) => {
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        const tagLower = tag.toLowerCase();

        // Validation rules based on tag type
        switch (tagLower) {
            case 'savings': {
                // Validate savings tag
                const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
                const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
                const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account' || subcategory === 'emergency fund';
                return hasSavingsKeyword || isSavingsCategory;
            }

            case 'transfers': {
                // Validate transfers tag
                const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
                const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
                const isTransferCategory = category === 'transfers' || subcategory === 'transfers' || subcategory === 'internal transfer';
                return hasTransferKeyword || isTransferCategory;
            }

            case 'investments': {
                // CRITICAL: Strict validation for investments using consolidated logic
                const investmentKeywords = ['flatex', 'degiro', 'stock purchase', 'etf purchase', 'investment purchase'];
                const investmentAccountPatterns = [/degiro/i, /flatex/i];
                const investmentSubcategories = ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds'];

                // FAIL-SAFE CHECKS (must pass ALL)
                const exclusions = {
                    positiveAmounts: true, // Only negative amounts can be investments
                    minimumAmount: 10, // Minimum €10 for investments
                    feeKeywords: ['fee', 'commission', 'charge', 'cost', 'expense', 'management fee', 'transaction fee'],
                    withdrawalKeywords: ['withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption', 'cash out'],
                    taxKeywords: ['tax', 'withholding', 'dividend tax', 'capital gains'],
                    savingsKeywords: ['savings', 'emergency fund', 'bunq', 'deposit']
                };

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
                const hasSavingsExclusionKeyword = exclusions.savingsKeywords.some((keyword) => description.includes(keyword));
                if (hasSavingsExclusionKeyword) return false;

                // POSITIVE CHECKS (must pass at least one AND be very specific)
                const hasInvestmentKeyword = investmentKeywords.some((keyword) => description.includes(keyword));
                const hasInvestmentAccount = investmentAccountPatterns.some((pattern) => pattern.test(description));
                const hasInvestmentSubcategory = investmentSubcategories.some((sub) => subcategory.includes(sub));
                const isInvestmentCategory = category === 'investment' || category === 'investments' || category === 'financial';

                if (hasInvestmentKeyword || (hasInvestmentAccount && hasInvestmentKeyword) || hasInvestmentSubcategory || isInvestmentCategory) {
                    return true;
                }

                return false;
            }

            case 'income': {
                // Validate income tag
                const incomeKeywords = ['salary', 'wage', 'income', 'payment', 'dividend', 'bonus', 'commission', 'revenue'];
                const hasIncomeKeyword = incomeKeywords.some((keyword) => description.includes(keyword));
                const isPositiveAmount = amount > 0;
                return hasIncomeKeyword && isPositiveAmount;
            }

            case 'gift': {
                // Validate gift tag
                const giftKeywords = ['gift', 'present', 'donation', 'charity'];
                const hasGiftKeyword = giftKeywords.some((keyword) => description.includes(keyword));
                const isGiftCategory = category === 'gift' || subcategory === 'charity' || subcategory === 'donation';
                return hasGiftKeyword || isGiftCategory;
            }

            case 'returns': {
                // Validate returns tag
                const returnKeywords = ['returns'];
                const hasReturnKeyword = returnKeywords.some((keyword) => description.includes(keyword));
                const isReturnCategory = category === 'returns' || subcategory === 'Payment requests';
                return hasReturnKeyword || isReturnCategory;
            }

            case 'other':
                // Other is always valid as a fallback
                return true;

            default:
                // Unknown tag - invalidate it
                console.log(`❌ Unknown tag "${tag}" - invalidating`);
                return false;
        }
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

        // Default category - ensure proper 'Other' classification
        return {
            category: 'Other',
            subcategory: 'other',
            confidence: 0.5
        };
    };

    /**
     * Assign tag based on keyword patterns (consolidated from all detection functions)
     */
    const assignTagByKeywords = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const amount = parseInt(transaction.amount) || 0;

        // SAVINGS DETECTION
        const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
        const savingsAccountPatterns = [/bunq/i, /savings account/i, /emergency fund/i, /goal savings/i];
        const savingsSubcategories = ['savings account', 'emergency fund', 'goal savings'];

        const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
        const hasSavingsAccount = savingsAccountPatterns.some((pattern) => pattern.test(description));
        const hasSavingsSubcategory = savingsSubcategories.some((sub) => subcategory.includes(sub));
        const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account';

        if (hasSavingsKeyword || hasSavingsAccount || hasSavingsSubcategory || isSavingsCategory) {
            return {
                tag: 'Savings',
                confidence: 0.9,
                reason: 'Savings indicators detected'
            };
        }

        // TRANSFER DETECTION
        const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
        const transferAccountPatterns = [/transfer to own account/i, /internal transfer/i, /between own accounts/i];
        const transferSubcategories = ['internal transfer', 'account transfer', 'between accounts'];

        const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
        const hasTransferAccount = transferAccountPatterns.some((pattern) => pattern.test(description));
        const hasTransferSubcategory = transferSubcategories.some((sub) => subcategory.includes(sub));
        const isTransferCategory = category === 'transfers' || subcategory === 'transfers' || subcategory === 'internal transfer';

        if (hasTransferKeyword || hasTransferAccount || hasTransferSubcategory || isTransferCategory) {
            return {
                tag: 'Transfers',
                confidence: 0.8,
                reason: 'Transfer indicators detected'
            };
        }

        // INVESTMENT DETECTION (most restrictive)
        const investmentKeywords = ['flatex', 'degiro', 'stock purchase', 'etf purchase', 'investment purchase'];
        const investmentAccountPatterns = [/degiro/i, /flatex/i];
        const investmentSubcategories = ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds'];

        // FAIL-SAFE CHECKS (must pass ALL)
        const exclusions = {
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
            savingsKeywords: ['savings', 'emergency fund', 'bunq', 'deposit']
        };

        // Check 1: Only negative amounts can be investments
        if (exclusions.positiveAmounts && amount >= 0) return null;

        // Check 2: Minimum amount threshold
        if (Math.abs(amount) / 100 < exclusions.minimumAmount) return null;

        // Check 3: Exclude fees
        const hasFeeKeyword = exclusions.feeKeywords.some((keyword) => description.includes(keyword));
        if (hasFeeKeyword) return null;

        // Check 4: Exclude withdrawals/sales
        const hasWithdrawalKeyword = exclusions.withdrawalKeywords.some((keyword) => description.includes(keyword));
        if (hasWithdrawalKeyword) return null;

        // Check 5: Exclude taxes
        const hasTaxKeyword = exclusions.taxKeywords.some((keyword) => description.includes(keyword));
        if (hasTaxKeyword) return null;

        // Check 6: Exclude savings
        const hasSavingsExclusionKeyword = exclusions.savingsKeywords.some((keyword) => description.includes(keyword));
        if (hasSavingsExclusionKeyword) return null;

        // POSITIVE CHECKS (must pass at least one AND be very specific)
        const hasInvestmentKeyword = investmentKeywords.some((keyword) => description.includes(keyword));
        const hasInvestmentAccount = investmentAccountPatterns.some((pattern) => pattern.test(description));
        const hasInvestmentSubcategory = investmentSubcategories.some((sub) => subcategory.includes(sub));
        const isInvestmentCategory = category === 'investment' || category === 'investments' || category === 'financial';

        if (hasInvestmentKeyword || (hasInvestmentAccount && hasInvestmentKeyword) || hasInvestmentSubcategory || isInvestmentCategory) {
            return {
                tag: 'Investments',
                confidence: 0.7,
                reason: 'Investment indicators detected'
            };
        }

        // INCOME DETECTION
        const incomeKeywords = ['salary', 'wage', 'income', 'payment', 'refund', 'dividend', 'bonus', 'commission', 'revenue'];
        const hasIncomeKeyword = incomeKeywords.some((keyword) => description.includes(keyword));
        const isPositiveAmount = amount > 0;

        if (hasIncomeKeyword && isPositiveAmount) {
            return {
                tag: 'Income',
                confidence: 0.8,
                reason: 'Income indicators detected'
            };
        }

        // GIFT DETECTION
        const giftKeywords = ['gift', 'present', 'donation', 'charity'];
        const hasGiftKeyword = giftKeywords.some((keyword) => description.includes(keyword));
        const isGiftCategory = category === 'gift' || subcategory === 'charity' || subcategory === 'donation';

        if (hasGiftKeyword || isGiftCategory) {
            return {
                tag: 'Gift',
                confidence: 0.8,
                reason: 'Gift indicators detected'
            };
        }

        return null; // No keyword-based tag assigned
    };

    // ============================================================================
    // DETECTION FUNCTIONS - REMOVED (consolidated into assignTagByKeywords)
    // ============================================================================

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
    // const applyTagsToTransactions = (transactionList) => {
    //     return transactionList.map((transaction) => {
    //         const classification = classifyTransaction(transaction);

    //         // Ensure every transaction has a proper classification
    //         const finalClassification = {
    //             tag: classification.tag || 'Other',
    //             category: classification.category || 'Other',
    //             subcategory: classification.subcategory || 'other',
    //             confidence: classification.confidence || 0.5,
    //             reason: classification.reason || 'No specific indicators detected - classified as Other'
    //         };

    //         // Log if a transaction is being classified as 'Other' for debugging
    //         if (finalClassification.tag === 'Other') {
    //             console.log(`🏷️ Transaction classified as Other: "${transaction.description}" - Reason: ${finalClassification.reason}`);
    //         }

    //         return {
    //             ...transaction,
    //             ...finalClassification
    //         };
    //     });
    // };

    /**
     * Update a single transaction's tag and learn from it
     */
    // const updateTransactionTag = (transactionId, newTag, reason = 'Manual update') => {
    //     const transaction = transactions.value.find((t) => t.id === transactionId);
    //     if (!transaction) {
    //         console.warn(`Transaction ${transactionId} not found`);
    //         return false;
    //     }

    //     const oldTag = transaction.tag;
    //     transaction.tag = newTag;

    //     // Learn from this assignment
    //     learnFromAssignment(transaction, newTag);

    //     // Add to override history
    //     if (!transaction.overrideHistory) {
    //         transaction.overrideHistory = [];
    //     }
    //     transaction.overrideHistory.push({
    //         timestamp: new Date().toISOString(),
    //         oldTag,
    //         newTag,
    //         reason
    //     });

    //     console.log(`🏷️ Updated transaction ${transactionId}: ${oldTag} → ${newTag} (${reason})`);
    //     return true;
    // };

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
     * Fix all existing tag assignments based on latest rules with enhanced validation
     */
    const fixAllTagAssignments = () => {
        console.log('🔧 Starting comprehensive tag fixing with enhanced validation...');

        let fixedCount = 0;
        let trustedCount = 0;
        let skippedCount = 0;

        const fixedTransactions = transactions.value.map((transaction) => {
            const oldTag = transaction.tag || 'Untagged';

            // Apply latest classification with enhanced validation
            const classification = classifyTransaction(transaction);
            const newTag = classification.tag;

            if (newTag !== oldTag) {
                // Track the fix
                if (!transaction.fixHistory) {
                    transaction.fixHistory = [];
                }
                transaction.fixHistory.push({
                    timestamp: new Date().toISOString(),
                    oldTag,
                    newTag,
                    reason: classification.reason || 'Enhanced validation fix'
                });

                transaction.tag = newTag;
                transaction.category = classification.category || transaction.category;
                transaction.subcategory = classification.subcategory || transaction.subcategory;
                transaction.classificationConfidence = classification.confidence;
                transaction.classificationReason = classification.reason;
                fixedCount++;

                console.log(`🔧 Fixed: "${transaction.description}" (${oldTag} → ${newTag}) - ${classification.reason}`);
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
    // RULE EXTRACTION AND MERGING
    // ============================================================================

    /**
     * Extract all hardcoded rules and merge with custom tag mappings
     * This ensures all rules (hardcoded + user-defined) are properly applied
     */
    const extractAndMergeAllRules = () => {
        console.log('🔧 Extracting and merging all rules...');

        // Get existing custom mappings
        const customMapping = loadCustomTagMapping();
        console.log('📋 Existing custom mappings:', customMapping);

        // Extract hardcoded rules from CATEGORY_RULES
        const hardcodedRules = {};

        CATEGORY_RULES.forEach((rule) => {
            if (rule.category && rule.subcategory) {
                const category = rule.category.toLowerCase();
                const subcategory = rule.subcategory.toLowerCase();

                if (!hardcodedRules[category]) {
                    hardcodedRules[category] = {};
                }

                // Map category to appropriate tag based on the category name
                let tag = 'Other';
                if (category.includes('groceries') || category.includes('household')) {
                    tag = 'Groceries';
                } else if (category.includes('health') || category.includes('wellness') || category.includes('medical')) {
                    tag = 'Health';
                } else if (category.includes('restaurant') || category.includes('food')) {
                    tag = 'Dining';
                } else if (category.includes('bar') || category.includes('entertainment')) {
                    tag = 'Entertainment';
                } else if (category.includes('shopping')) {
                    tag = 'Shopping';
                } else if (category.includes('transport') || category.includes('travel')) {
                    tag = 'Transport';
                } else if (category.includes('free time') || category.includes('entertainment')) {
                    tag = 'Entertainment';
                } else if (category.includes('fixed') || category.includes('expenses')) {
                    tag = 'Fixed Expenses';
                } else if (category.includes('gift')) {
                    tag = 'Gift';
                }

                hardcodedRules[category][subcategory] = tag;
                console.log(`📋 Hardcoded rule: ${category}/${subcategory} → ${tag}`);
            }
        });

        // Extract rules from TAG_RULES
        Object.entries(TAG_RULES).forEach(([ruleType, rule]) => {
            if (ruleType === 'savings') {
                // Add savings keywords as rules
                rule.keywords.forEach((keyword) => {
                    if (!hardcodedRules['savings']) {
                        hardcodedRules['savings'] = {};
                    }
                    hardcodedRules['savings'][keyword] = 'Savings';
                });

                // Add savings subcategories
                rule.subcategories.forEach((subcategory) => {
                    if (!hardcodedRules['savings']) {
                        hardcodedRules['savings'] = {};
                    }
                    hardcodedRules['savings'][subcategory] = 'Savings';
                });
            } else if (ruleType === 'transfers') {
                // Add transfer keywords as rules
                rule.keywords.forEach((keyword) => {
                    if (!hardcodedRules['transfers']) {
                        hardcodedRules['transfers'] = {};
                    }
                    hardcodedRules['transfers'][keyword] = 'Transfers';
                });

                // Add transfer subcategories
                rule.subcategories.forEach((subcategory) => {
                    if (!hardcodedRules['transfers']) {
                        hardcodedRules['transfers'] = {};
                    }
                    hardcodedRules['transfers'][subcategory] = 'Transfers';
                });
            } else if (ruleType === 'investments') {
                // Add investment keywords as rules
                rule.keywords.forEach((keyword) => {
                    if (!hardcodedRules['investment']) {
                        hardcodedRules['investment'] = {};
                    }
                    hardcodedRules['investment'][keyword] = 'Investments';
                });

                // Add investment subcategories
                rule.subcategories.forEach((subcategory) => {
                    if (!hardcodedRules['investment']) {
                        hardcodedRules['investment'] = {};
                    }
                    hardcodedRules['investment'][subcategory] = 'Investments';
                });
            } else if (ruleType === 'income') {
                // Add income keywords as rules
                rule.keywords.forEach((keyword) => {
                    if (!hardcodedRules['income']) {
                        hardcodedRules['income'] = {};
                    }
                    hardcodedRules['income'][keyword] = 'Income';
                });
            }
        });

        console.log('📋 Extracted hardcoded rules:', hardcodedRules);

        // Merge custom mappings with hardcoded rules
        // Custom mappings take precedence over hardcoded rules
        const mergedRules = { ...hardcodedRules, ...customMapping };

        // For overlapping categories, merge subcategories
        Object.keys(customMapping).forEach((category) => {
            if (hardcodedRules[category]) {
                mergedRules[category] = { ...hardcodedRules[category], ...customMapping[category] };
            }
        });

        console.log('📋 Merged rules:', mergedRules);

        // Save the merged rules back to localStorage
        saveCustomTagMapping(mergedRules);

        console.log('✅ All rules merged and saved to localStorage');

        return mergedRules;
    };

    /**
     * Load custom tag mapping from localStorage
     */
    const loadCustomTagMapping = () => {
        try {
            const saved = localStorage.getItem('customTagMapping');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading custom tag mapping:', error);
            return {};
        }
    };

    /**
     * Save custom tag mapping to localStorage
     */
    const saveCustomTagMapping = (mapping) => {
        try {
            localStorage.setItem('customTagMapping', JSON.stringify(mapping));
            console.log('💾 Custom tag mapping saved to localStorage');
        } catch (error) {
            console.error('Error saving custom tag mapping:', error);
        }
    };

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
        // applyTagsToTransactions,
        // updateTransactionTag,

        // Data fixing
        fixAllTagAssignments,
        forceReevaluateAllTransactions,

        // Storage
        saveTransactions,
        loadTransactions,
        clearTransactions,

        // Learning system
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
        TAG_RULES,

        // Tag mapping system
        getTagMapping,

        // New functions
        extractAndMergeAllRules,
        loadCustomTagMapping,
        saveCustomTagMapping
    };
}
