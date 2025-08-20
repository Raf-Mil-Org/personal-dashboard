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

// Storage keys (for backward compatibility)
// Note: These are kept for backward compatibility but not actively used in the new validation system

export function useTransactionEngine() {
    // Initialize learning system
    const { initializeLearning, applyLearnedRules } = useTransactionLearning();

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

    /**
     * Check if a rule is applicable to a transaction
     */
    const isRuleApplicable = (rule, transaction) => {
        const { description, category, subcategory, amount } = transaction;
        const descLower = (description || '').toLowerCase();
        const catLower = (category || '').toLowerCase();
        const subcatLower = (subcategory || '').toLowerCase();

        // Check category conditions
        if (rule.category && rule.category.toLowerCase() !== catLower) return false;

        // Check subcategory conditions
        if (rule.subcategory && rule.subcategory.toLowerCase() !== subcatLower) return false;

        // Check keyword conditions
        if (rule.keywords && !rule.keywords.some((keyword) => descLower.includes(keyword.toLowerCase()))) return false;

        // Check exclusions
        if (rule.exclusions) {
            // Check exclusion keywords
            if (rule.exclusions.keywords && rule.exclusions.keywords.some((keyword) => descLower.includes(keyword.toLowerCase()))) return false;

            // Check amount conditions
            if (rule.exclusions.amount_conditions) {
                const { min_amount, must_be_negative } = rule.exclusions.amount_conditions;
                if (must_be_negative && amount >= 0) return false;
                if (min_amount && Math.abs(amount) / 100 < min_amount) return false;
            }
        }

        return true;
    };

    /**
     * Update rule usage statistics
     */
    const updateRuleUsage = (rule) => {
        if (rule.source === 'user_defined') {
            // Update user rule usage
            const userRules = getUserRules();
            const ruleIndex = userRules.findIndex((r) => r.id === rule.id);
            if (ruleIndex !== -1) {
                userRules[ruleIndex].usage_count = (userRules[ruleIndex].usage_count || 0) + 1;
                userRules[ruleIndex].last_used = new Date().toISOString();
                saveUserRules(userRules);
            }
        }
        // Note: System rules and learned rules are handled by their respective systems
    };

    // ============================================================================
    // ERROR HANDLING & RECOVERY SYSTEM
    // ============================================================================

    /**
     * ERROR TYPES AND SEVERITY LEVELS
     */
    const ERROR_TYPES = {
        VALIDATION: 'validation',
        PARSING: 'parsing',
        STORAGE: 'storage',
        CLASSIFICATION: 'classification',
        NETWORK: 'network',
        UNKNOWN: 'unknown'
    };

    const ERROR_SEVERITY = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    /**
     * ERROR LOGGING AND TRACKING
     */
    const errorLog = ref([]);
    const errorCount = ref(0);
    const lastError = ref(null);

    const logError = (error, context = {}, severity = ERROR_SEVERITY.MEDIUM) => {
        const errorEntry = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: error.type || ERROR_TYPES.UNKNOWN,
            severity,
            message: error.message,
            stack: error.stack,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        errorLog.value.push(errorEntry);
        errorCount.value++;
        lastError.value = errorEntry;

        // Log to console for debugging
        console.error(`🚨 [${severity.toUpperCase()}] ${error.message}`, {
            error,
            context,
            errorId: errorEntry.id
        });

        // Store errors in localStorage (limited to last 50)
        try {
            const storedErrors = JSON.parse(localStorage.getItem('transactionEngineErrors') || '[]');
            storedErrors.push(errorEntry);
            if (storedErrors.length > 50) {
                storedErrors.splice(0, storedErrors.length - 50);
            }
            localStorage.setItem('transactionEngineErrors', JSON.stringify(storedErrors));
        } catch (storageError) {
            console.warn('Failed to store error log:', storageError);
        }

        return errorEntry;
    };

    /**
     * RETRY MECHANISM WITH EXPONENTIAL BACKOFF
     */
    const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.warn(`Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);

                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    };

    /**
     * GRACEFUL DEGRADATION HELPERS
     */
    const safeJSONParse = (jsonString, fallback = null) => {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            logError(
                error,
                {
                    operation: 'JSON.parse',
                    inputLength: jsonString?.length
                },
                ERROR_SEVERITY.LOW
            );
            return fallback;
        }
    };

    const safeLocalStorageGet = (key, fallback = null) => {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch (error) {
            logError(
                error,
                {
                    operation: 'localStorage.getItem',
                    key
                },
                ERROR_SEVERITY.MEDIUM
            );
            return fallback;
        }
    };

    const safeLocalStorageSet = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            logError(
                error,
                {
                    operation: 'localStorage.setItem',
                    key,
                    valueSize: JSON.stringify(value)?.length
                },
                ERROR_SEVERITY.MEDIUM
            );
            return false;
        }
    };

    /**
     * ERROR RECOVERY STRATEGIES
     */
    const recoverFromStorageError = async () => {
        console.log('🔄 Attempting to recover from storage error...');

        try {
            // Try to clear corrupted data
            localStorage.removeItem('transactions');
            localStorage.removeItem('userDefinedRules');

            // Reset state
            transactions.value = [];
            isLoading.value = false;
            parseError.value = null;

            console.log('✅ Storage recovery completed');
            return true;
        } catch (error) {
            logError(error, { operation: 'storageRecovery' }, ERROR_SEVERITY.HIGH);
            return false;
        }
    };

    const recoverFromClassificationError = async () => {
        console.log('🔄 Attempting to recover from classification error...');

        try {
            // Fallback to basic classification
            const basicRules = getDefaultSystemRules().slice(0, 5); // Only use first 5 basic rules

            for (const transaction of transactions.value) {
                if (!transaction.tag || transaction.tag === 'untagged') {
                    // Apply basic keyword matching
                    const basicTag = applyBasicClassification(transaction, basicRules);
                    transaction.tag = basicTag || 'Other';
                }
            }

            console.log('✅ Classification recovery completed');
            return true;
        } catch (error) {
            logError(error, { operation: 'classificationRecovery' }, ERROR_SEVERITY.HIGH);
            return false;
        }
    };

    /**
     * BASIC CLASSIFICATION FALLBACK
     */
    const applyBasicClassification = (transaction, basicRules) => {
        const description = (transaction.description || '').toLowerCase();

        for (const rule of basicRules) {
            if (rule.keywords && rule.keywords.some((keyword) => description.includes(keyword.toLowerCase()))) {
                return rule.tag || 'Other';
            }
        }

        return 'Other';
    };

    /**
     * ERROR BOUNDARY FOR COMPONENTS
     */
    const createErrorBoundary = (componentName) => {
        return {
            error: ref(null),
            hasError: ref(false),

            captureError: (error, errorInfo) => {
                const errorEntry = logError(
                    error,
                    {
                        component: componentName,
                        errorInfo
                    },
                    ERROR_SEVERITY.HIGH
                );

                this.error.value = errorEntry;
                this.hasError.value = true;

                return false; // Prevent error propagation
            },

            resetError: () => {
                this.error.value = null;
                this.hasError.value = false;
            }
        };
    };

    /**
     * ENHANCED ERROR HANDLING FOR EXISTING FUNCTIONS
     */
    const enhancedLoadAllRules = async () => {
        try {
            return await retryOperation(async () => {
                const systemRules = getDefaultSystemRules();
                const userRules = safeJSONParse(safeLocalStorageGet('userDefinedRules'), []);

                const { learnedRules } = useTransactionLearning();
                const learnedRulesData = learnedRules.value || [];

                const allRules = [...systemRules, ...userRules, ...learnedRulesData];
                allRules.sort((a, b) => a.tier - b.tier);

                console.log(`📋 Loaded ${allRules.length} rules: ${systemRules.length} system, ${userRules.length} user-defined, ${learnedRulesData.length} learned`);

                return allRules;
            });
        } catch (error) {
            logError(error, { operation: 'loadAllRules' }, ERROR_SEVERITY.HIGH);

            // Fallback to system rules only
            console.warn('⚠️ Falling back to system rules only');
            return getDefaultSystemRules();
        }
    };

    const enhancedSaveUserRules = async (rules) => {
        try {
            await retryOperation(async () => {
                const success = safeLocalStorageSet('userDefinedRules', rules);
                if (!success) {
                    throw new Error('Failed to save user rules to localStorage');
                }
                console.log(`💾 Saved ${rules.length} user-defined rules`);
            });
        } catch (error) {
            logError(
                error,
                {
                    operation: 'saveUserRules',
                    ruleCount: rules.length
                },
                ERROR_SEVERITY.HIGH
            );

            // Try recovery
            await recoverFromStorageError();
            throw error;
        }
    };

    const enhancedClassifyTransaction = async (transaction) => {
        try {
            return await retryOperation(async () => {
                const { description, category, subcategory, amount, existingTag } = transaction;

                console.log('🔍 Enhanced classification for:', { description, existingTag, category, subcategory, amount });

                const allRules = await enhancedLoadAllRules();

                // Apply classification with error handling
                const result = await applyClassificationWithErrorHandling(transaction, allRules);

                return result;
            });
        } catch (error) {
            logError(
                error,
                {
                    operation: 'classifyTransaction',
                    transactionId: transaction.id
                },
                ERROR_SEVERITY.MEDIUM
            );

            // Return safe fallback
            return {
                tag: 'Other',
                category: transaction.category || 'Other',
                subcategory: transaction.subcategory || 'other',
                confidence: 0.1,
                reason: 'Classification failed - using fallback'
            };
        }
    };

    const applyClassificationWithErrorHandling = async (transaction, allRules) => {
        try {
            // STEP 1: Apply category/subcategory assignment rules (if needed)
            let updatedTransaction = { ...transaction };
            if (!transaction.category || !transaction.subcategory) {
                const categoryResult = await applyCategoryRulesWithErrorHandling(transaction.description, allRules);
                updatedTransaction.category = categoryResult.category;
                updatedTransaction.subcategory = categoryResult.subcategory;
                console.log(`📂 Category assigned: ${categoryResult.category}/${categoryResult.subcategory}`);
            }

            // STEP 2: Apply tag assignment rules
            const tagResult = await applyTagRulesWithErrorHandling(updatedTransaction, allRules);

            return {
                tag: tagResult.tag,
                category: updatedTransaction.category,
                subcategory: updatedTransaction.subcategory,
                confidence: tagResult.confidence,
                reason: tagResult.reason
            };
        } catch (error) {
            logError(
                error,
                {
                    operation: 'applyClassificationWithErrorHandling',
                    transactionId: transaction.id
                },
                ERROR_SEVERITY.MEDIUM
            );

            throw error;
        }
    };

    const applyCategoryRulesWithErrorHandling = async (description, allRules) => {
        try {
            const categoryRules = allRules.filter((rule) => rule.type === RULE_TYPES.CATEGORY_ASSIGNMENT);

            for (const rule of categoryRules) {
                if (isRuleApplicable(rule, { description })) {
                    return {
                        category: rule.category_result,
                        subcategory: rule.subcategory_result,
                        confidence: rule.confidence,
                        reason: `Applied category rule: ${rule.description}`
                    };
                }
            }

            // Default category
            return {
                category: 'Other',
                subcategory: 'other',
                confidence: 0.5,
                reason: 'No category rules matched'
            };
        } catch (error) {
            logError(
                error,
                {
                    operation: 'applyCategoryRulesWithErrorHandling',
                    description
                },
                ERROR_SEVERITY.LOW
            );

            // Safe fallback
            return {
                category: 'Other',
                subcategory: 'other',
                confidence: 0.1,
                reason: 'Category assignment failed - using fallback'
            };
        }
    };

    const applyTagRulesWithErrorHandling = async (transaction, allRules) => {
        try {
            const tagRules = allRules.filter((rule) => rule.type === RULE_TYPES.CATEGORY_MAPPING || rule.type === RULE_TYPES.KEYWORD_MAPPING || rule.type === RULE_TYPES.CATEGORY_KEYWORD_MAPPING);

            for (const rule of tagRules) {
                if (isRuleApplicable(rule, transaction)) {
                    // Update rule usage statistics
                    updateRuleUsage(rule);

                    return {
                        tag: rule.tag,
                        confidence: rule.confidence,
                        reason: `Applied ${rule.type} rule: ${rule.description}`
                    };
                }
            }

            // Default fallback
            return {
                tag: 'Other',
                confidence: 0.5,
                reason: 'No tag rules matched'
            };
        } catch (error) {
            logError(
                error,
                {
                    operation: 'applyTagRulesWithErrorHandling',
                    transactionId: transaction.id
                },
                ERROR_SEVERITY.LOW
            );

            // Safe fallback
            return {
                tag: 'Other',
                confidence: 0.1,
                reason: 'Tag assignment failed - using fallback'
            };
        }
    };

    // ============================================================================
    // UNIFIED RULE SYSTEM
    // ============================================================================

    /**
     * UNIFIED RULE TYPES
     *
     * This system replaces the complex 5-tier priority system with a simplified
     * unified rule approach where all rules follow the same structure.
     */

    const RULE_TYPES = {
        CATEGORY_MAPPING: 'category_mapping',
        KEYWORD_MAPPING: 'keyword_mapping',
        CATEGORY_KEYWORD_MAPPING: 'category_keyword_mapping',
        CATEGORY_ASSIGNMENT: 'category_assignment',
        EXCLUSION_RULE: 'exclusion_rule'
    };

    const RULE_TIERS = {
        TIER_1: 1, // Highest priority - User-defined mappings, critical rules
        TIER_2: 2, // High priority - Learned rules, important patterns
        TIER_3: 3, // Medium priority - System rules, general patterns
        TIER_4: 4, // Low priority - Fallback rules, default assignments
        TIER_5: 5 // Lowest priority - Default fallback
    };

    /**
     * UNIFIED RULE STRUCTURE
     *
     * All rules follow this structure for consistency and simplicity
     */
    const createRule = (type, conditions, result, metadata = {}) => {
        return {
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            tier: metadata.tier || RULE_TIERS.TIER_3,

            // Rule conditions
            category: conditions.category || null,
            subcategory: conditions.subcategory || null,
            keywords: conditions.keywords || null,
            exclusions: conditions.exclusions || null,

            // Rule result
            tag: result.tag || null,
            category_result: result.category || null,
            subcategory_result: result.subcategory || null,

            // Metadata
            confidence: metadata.confidence || 0.8,
            source: metadata.source || 'system', // 'system', 'user_defined', 'learned'
            created_at: metadata.created_at || new Date().toISOString(),
            usage_count: metadata.usage_count || 0,
            last_used: metadata.last_used || null,
            description: metadata.description || ''
        };
    };

    /**
     * DEFAULT SYSTEM RULES
     *
     * These are the core rules that come with the system
     */
    const getDefaultSystemRules = () => {
        return [
            // Category Assignment Rules (TIER_1 - High priority)
            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['albert heijn', 'dirk', 'lidl', 'jumbo', 'ah', 'supermarket', 'grocery']
                },
                {
                    category: 'Groceries & Household',
                    subcategory: 'Supermarket'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.9,
                    source: 'system',
                    description: 'Assign grocery category for supermarket transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['hairstudio', 'pharmacy', 'health', 'gym', 'fitness', 'wellness', 'spa', 'massage']
                },
                {
                    category: 'Health & Wellness',
                    subcategory: 'Personal Care'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign health category for personal care transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['cafe', 'restaurant', 'flocafe', 'bakery', 'zero', 'ramen', 'vijfhui', 'food', 'dining', 'eat']
                },
                {
                    category: 'Restaurants/Food',
                    subcategory: 'Dining Out'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.85,
                    source: 'system',
                    description: 'Assign restaurant category for dining transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['bar', 'pub', 'radion', 'club', 'nightlife', 'entertainment']
                },
                {
                    category: 'Bars',
                    subcategory: 'Nightlife'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign bar category for nightlife transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['shop', 'store', 'boutique', 'retail', 'purchase', 'buy']
                },
                {
                    category: 'Shopping',
                    subcategory: 'Retail'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.7,
                    source: 'system',
                    description: 'Assign shopping category for retail transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['bolt', 'uber', 'flight', 'train', 'transport', 'travel', 'commute', 'parking']
                },
                {
                    category: 'Transport & Travel',
                    subcategory: 'Transportation'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign transport category for travel transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['cinema', 'theater', 'entertainment', 'movie', 'show', 'event', 'activity']
                },
                {
                    category: 'Free Time',
                    subcategory: 'Entertainment'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.75,
                    source: 'system',
                    description: 'Assign free time category for entertainment transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['hospital', 'clinic', 'doctor', 'ntavas', 'medical', 'healthcare', 'dentist']
                },
                {
                    category: 'Medical',
                    subcategory: 'Healthcare'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.9,
                    source: 'system',
                    description: 'Assign medical category for healthcare transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['rent', 'mortgage', 'utilities', 'electricity', 'gas', 'water', 'internet', 'phone', 'insurance']
                },
                {
                    category: 'Fixed Expenses',
                    subcategory: 'Housing & Utilities'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.85,
                    source: 'system',
                    description: 'Assign fixed expenses category for housing transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_ASSIGNMENT,
                {
                    keywords: ['gift', 'present', 'donation', 'charity']
                },
                {
                    category: 'Gift',
                    subcategory: 'Personal Gifts'
                },
                {
                    tier: RULE_TIERS.TIER_1,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign gift category for donation transactions'
                }
            ),

            // Tag Assignment Rules (TIER_2 - Medium priority)
            createRule(
                RULE_TYPES.KEYWORD_MAPPING,
                {
                    keywords: ['bunq', 'savings', 'emergency fund', 'deposit', 'save', 'goal savings'],
                    exclusions: {
                        keywords: ['anthi'],
                        amount_conditions: {
                            must_be_negative: true
                        }
                    }
                },
                {
                    tag: 'Savings'
                },
                {
                    tier: RULE_TIERS.TIER_2,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign Savings tag for savings-related transactions'
                }
            ),

            createRule(
                RULE_TYPES.KEYWORD_MAPPING,
                {
                    keywords: ['transfer', 'internal transfer', 'account transfer', 'between accounts']
                },
                {
                    tag: 'Transfers'
                },
                {
                    tier: RULE_TIERS.TIER_2,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign Transfers tag for transfer transactions'
                }
            ),

            createRule(
                RULE_TYPES.CATEGORY_KEYWORD_MAPPING,
                {
                    category: 'investment',
                    keywords: ['flatex', 'degiro', 'stock purchase', 'etf purchase', 'investment purchase'],
                    exclusions: {
                        keywords: ['fee'],
                        amount_conditions: {
                            min_amount: 10,
                            must_be_negative: true
                        }
                    }
                },
                {
                    tag: 'Investments'
                },
                {
                    tier: RULE_TIERS.TIER_2,
                    confidence: 0.7,
                    source: 'system',
                    description: 'Assign Investments tag for investment transactions with exclusions'
                }
            ),

            createRule(
                RULE_TYPES.KEYWORD_MAPPING,
                {
                    keywords: ['salary', 'wage', 'income', 'payment', 'refund', 'dividend', 'bonus', 'commission', 'revenue']
                },
                {
                    tag: 'Income'
                },
                {
                    tier: RULE_TIERS.TIER_2,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign Income tag for income transactions'
                }
            ),

            createRule(
                RULE_TYPES.KEYWORD_MAPPING,
                {
                    keywords: ['gift', 'present', 'donation', 'charity']
                },
                {
                    tag: 'Gift'
                },
                {
                    tier: RULE_TIERS.TIER_2,
                    confidence: 0.8,
                    source: 'system',
                    description: 'Assign Gift tag for gift transactions'
                }
            ),

            // Default fallback rule (TIER_5 - Lowest priority)
            createRule(
                RULE_TYPES.CATEGORY_MAPPING,
                {},
                {
                    tag: 'Other',
                    category: 'Other',
                    subcategory: 'other'
                },
                {
                    tier: RULE_TIERS.TIER_5,
                    confidence: 0.5,
                    source: 'system',
                    description: 'Default fallback rule for unclassified transactions'
                }
            )
        ];
    };

    // Load all rules (system + user-defined + learned)
    const loadAllRules = () => {
        try {
            // Load system rules
            const systemRules = getDefaultSystemRules();

            // Load user-defined rules from localStorage
            const userRules = JSON.parse(localStorage.getItem('userDefinedRules') || '[]');

            // Load learned rules from learning system
            const { learnedRules } = useTransactionLearning();
            const learnedRulesData = learnedRules.value || [];

            // Combine all rules and sort by tier
            const allRules = [...systemRules, ...userRules, ...learnedRulesData];
            allRules.sort((a, b) => a.tier - b.tier);

            console.log(`📋 Loaded ${allRules.length} rules: ${systemRules.length} system, ${userRules.length} user-defined, ${learnedRulesData.length} learned`);

            return allRules;
        } catch (error) {
            console.error('Error loading rules:', error);
            return getDefaultSystemRules();
        }
    };

    // Save user-defined rules to localStorage
    const saveUserRules = (rules) => {
        try {
            localStorage.setItem('userDefinedRules', JSON.stringify(rules));
            console.log(`💾 Saved ${rules.length} user-defined rules`);
        } catch (error) {
            console.error('Error saving user rules:', error);
        }
    };

    // Add a new user-defined rule
    const addUserRule = (rule) => {
        try {
            const userRules = JSON.parse(localStorage.getItem('userDefinedRules') || '[]');
            userRules.push(rule);
            saveUserRules(userRules);
            console.log(`✅ Added new user rule: ${rule.description}`);
            return true;
        } catch (error) {
            console.error('Error adding user rule:', error);
            return false;
        }
    };

    // Update an existing user-defined rule
    const updateUserRule = (ruleId, updatedRule) => {
        try {
            const userRules = JSON.parse(localStorage.getItem('userDefinedRules') || '[]');
            const index = userRules.findIndex((rule) => rule.id === ruleId);
            if (index !== -1) {
                userRules[index] = { ...userRules[index], ...updatedRule };
                saveUserRules(userRules);
                console.log(`🔄 Updated user rule: ${ruleId}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating user rule:', error);
            return false;
        }
    };

    // Delete a user-defined rule
    const deleteUserRule = (ruleId) => {
        try {
            const userRules = JSON.parse(localStorage.getItem('userDefinedRules') || '[]');
            const filteredRules = userRules.filter((rule) => rule.id !== ruleId);
            saveUserRules(filteredRules);
            console.log(`🗑️ Deleted user rule: ${ruleId}`);
            return true;
        } catch (error) {
            console.error('Error deleting user rule:', error);
            return false;
        }
    };

    // Get all user-defined rules
    const getUserRules = () => {
        try {
            return JSON.parse(localStorage.getItem('userDefinedRules') || '[]');
        } catch (error) {
            console.error('Error getting user rules:', error);
            return [];
        }
    };

    // ============================================================================
    // UNIFIED CLASSIFICATION SYSTEM
    // ============================================================================

    // ============================================================================
    // LEGACY SUPPORT (for backward compatibility)
    // ============================================================================

    /**
     * Add a new category/subcategory to tag mapping
     */
    const addMapping = (category, subcategory, tag) => {
        try {
            const mapping = getTagMapping();
            if (!mapping[category]) {
                mapping[category] = {};
            }
            mapping[category][subcategory] = tag;
            localStorage.setItem('customTagMapping', JSON.stringify(mapping));
            console.log(`✅ Added mapping: ${category}/${subcategory} → ${tag}`);
            return true;
        } catch (error) {
            console.error('Error adding mapping:', error);
            return false;
        }
    };

    /**
     * Remove a category/subcategory to tag mapping
     */
    const removeMapping = (category, subcategory) => {
        try {
            const mapping = getTagMapping();
            if (mapping[category] && mapping[category][subcategory]) {
                delete mapping[category][subcategory];
                if (Object.keys(mapping[category]).length === 0) {
                    delete mapping[category];
                }
                localStorage.setItem('customTagMapping', JSON.stringify(mapping));
                console.log(`🗑️ Removed mapping: ${category}/${subcategory}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing mapping:', error);
            return false;
        }
    };

    /**
     * Determine tag for backward compatibility
     */
    const determineTag = (category, subcategory, existingTag, description) => {
        // Create a transaction object for unified classification
        const transaction = { category, subcategory, tag: existingTag, description };
        const classification = classifyTransaction(transaction);
        return classification.tag;
    };

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
                savingsKeywords: ['savings', 'emergency fund', 'bunq', 'deposit']
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
            feeKeywords: ['fee'],
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
    // DATA VALIDATION & INTEGRITY SYSTEM
    // ============================================================================

    /**
     * DATA SCHEMAS AND VALIDATION RULES
     */
    const TRANSACTION_SCHEMA = {
        id: { type: 'string', required: true, pattern: /^[a-zA-Z0-9_-]+$/ },
        description: { type: 'string', required: true, minLength: 1, maxLength: 500 },
        amount: { type: 'number', required: true, min: -999999999, max: 999999999 },
        date: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        category: { type: 'string', required: false, maxLength: 100 },
        subcategory: { type: 'string', required: false, maxLength: 100 },
        tag: { type: 'string', required: false, maxLength: 50 },
        confidence: { type: 'number', required: false, min: 0, max: 1 },
        reason: { type: 'string', required: false, maxLength: 200 },
        counterparty: { type: 'string', required: false, maxLength: 100 },
        account: { type: 'string', required: false, maxLength: 100 },
        createdAt: { type: 'string', required: false, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ },
        updatedAt: { type: 'string', required: false, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ }
    };

    const RULE_SCHEMA = {
        id: { type: 'string', required: true, pattern: /^rule_[a-zA-Z0-9_-]+$/ },
        type: { type: 'string', required: true, enum: Object.values(RULE_TYPES) },
        tier: { type: 'number', required: true, min: 1, max: 5 },
        description: { type: 'string', required: true, minLength: 1, maxLength: 200 },
        confidence: { type: 'number', required: true, min: 0, max: 1 },
        source: { type: 'string', required: true, enum: ['system', 'user_defined', 'learned'] },
        category: { type: 'string', required: false, maxLength: 100 },
        subcategory: { type: 'string', required: false, maxLength: 100 },
        keywords: { type: 'array', required: false, items: { type: 'string', maxLength: 50 } },
        exclusions: { type: 'object', required: false },
        tag: { type: 'string', required: false, maxLength: 50 },
        category_result: { type: 'string', required: false, maxLength: 100 },
        subcategory_result: { type: 'string', required: false, maxLength: 100 },
        created_at: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ },
        usage_count: { type: 'number', required: false, min: 0 },
        last_used: { type: 'string', required: false, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ }
    };

    /**
     * VALIDATION FUNCTIONS
     */
    const validateSchema = (data, schema) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            // Check required fields
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            // Skip validation for optional fields that are not present
            if (!rules.required && (value === undefined || value === null)) {
                continue;
            }

            // Type validation
            if (rules.type === 'string' && typeof value !== 'string') {
                errors.push(`${field} must be a string`);
            } else if (rules.type === 'number' && typeof value !== 'number') {
                errors.push(`${field} must be a number`);
            } else if (rules.type === 'array' && !Array.isArray(value)) {
                errors.push(`${field} must be an array`);
            } else if (rules.type === 'object' && typeof value !== 'object') {
                errors.push(`${field} must be an object`);
            }

            // String validations
            if (rules.type === 'string' && typeof value === 'string') {
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push(`${field} must be at least ${rules.minLength} characters`);
                }
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push(`${field} must be at most ${rules.maxLength} characters`);
                }
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push(`${field} format is invalid`);
                }
                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
                }
            }

            // Number validations
            if (rules.type === 'number' && typeof value === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`${field} must be at least ${rules.min}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`${field} must be at most ${rules.max}`);
                }
            }

            // Array validations
            if (rules.type === 'array' && Array.isArray(value)) {
                if (rules.items) {
                    for (let i = 0; i < value.length; i++) {
                        const itemErrors = validateSchema({ [field]: value[i] }, { [field]: rules.items });
                        if (itemErrors.length > 0) {
                            errors.push(`${field}[${i}]: ${itemErrors.join(', ')}`);
                        }
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    const validateTransaction = (transaction) => {
        return validateSchema(transaction, TRANSACTION_SCHEMA);
    };

    const validateRule = (rule) => {
        return validateSchema(rule, RULE_SCHEMA);
    };

    const validateTransactionArray = (transactions) => {
        const errors = [];
        const validTransactions = [];

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            const validation = validateTransaction(transaction);

            if (!validation.isValid) {
                errors.push(`Transaction ${i}: ${validation.errors.join(', ')}`);
            } else {
                validTransactions.push(transaction);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            validTransactions,
            invalidCount: errors.length,
            validCount: validTransactions.length
        };
    };

    /**
     * DATA INTEGRITY CHECKS
     */
    const checkDataIntegrity = (transactions) => {
        const issues = [];

        // Check for duplicate IDs
        const ids = new Set();
        const duplicates = [];
        transactions.forEach((transaction, index) => {
            if (ids.has(transaction.id)) {
                duplicates.push({ index, id: transaction.id });
            } else {
                ids.add(transaction.id);
            }
        });

        if (duplicates.length > 0) {
            issues.push({
                type: 'duplicate_ids',
                message: `Found ${duplicates.length} duplicate transaction IDs`,
                details: duplicates
            });
        }

        // Check for invalid amounts
        const invalidAmounts = transactions.filter((t) => typeof t.amount !== 'number' || isNaN(t.amount) || !isFinite(t.amount)).map((t, index) => ({ index, amount: t.amount }));

        if (invalidAmounts.length > 0) {
            issues.push({
                type: 'invalid_amounts',
                message: `Found ${invalidAmounts.length} transactions with invalid amounts`,
                details: invalidAmounts
            });
        }

        // Check for missing required fields
        const missingRequired = transactions
            .filter((t) => !t.description || !t.amount || !t.date)
            .map((t, index) => ({
                index,
                missing: ['description', 'amount', 'date'].filter((field) => !t[field])
            }));

        if (missingRequired.length > 0) {
            issues.push({
                type: 'missing_required',
                message: `Found ${missingRequired.length} transactions with missing required fields`,
                details: missingRequired
            });
        }

        // Check for date consistency
        const invalidDates = transactions
            .filter((t) => {
                const date = new Date(t.date);
                return isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100;
            })
            .map((t, index) => ({ index, date: t.date }));

        if (invalidDates.length > 0) {
            issues.push({
                type: 'invalid_dates',
                message: `Found ${invalidDates.length} transactions with invalid dates`,
                details: invalidDates
            });
        }

        return {
            isValid: issues.length === 0,
            issues,
            summary: {
                total: transactions.length,
                valid: transactions.length - issues.reduce((sum, issue) => sum + issue.details.length, 0),
                issues: issues.length
            }
        };
    };

    /**
     * DATA CLEANING AND NORMALIZATION
     */
    const cleanTransaction = (transaction) => {
        const cleaned = { ...transaction };

        // Normalize strings
        if (cleaned.description) {
            cleaned.description = cleaned.description.trim();
        }
        if (cleaned.category) {
            cleaned.category = cleaned.category.trim();
        }
        if (cleaned.subcategory) {
            cleaned.subcategory = cleaned.subcategory.trim();
        }
        if (cleaned.tag) {
            cleaned.tag = cleaned.tag.trim();
        }

        // Ensure amount is a number
        if (typeof cleaned.amount === 'string') {
            cleaned.amount = parseFloat(cleaned.amount);
        }

        // Normalize date format
        if (cleaned.date) {
            const date = new Date(cleaned.date);
            if (!isNaN(date.getTime())) {
                cleaned.date = date.toISOString().split('T')[0];
            }
        }

        // Generate ID if missing
        if (!cleaned.id) {
            cleaned.id = generateTransactionId(cleaned);
        }

        // Add timestamps
        if (!cleaned.createdAt) {
            cleaned.createdAt = new Date().toISOString();
        }
        cleaned.updatedAt = new Date().toISOString();

        return cleaned;
    };

    const cleanTransactionArray = (transactions) => {
        return transactions.map(cleanTransaction);
    };

    /**
     * DATA MIGRATION AND VERSIONING
     */
    const DATA_VERSION = '1.0.0';

    const migrateTransactionData = (data, fromVersion) => {
        console.log(`🔄 Migrating transaction data from ${fromVersion} to ${DATA_VERSION}`);

        let migratedData = data;

        // Migration logic for different versions
        if (fromVersion === '0.9.0') {
            // Add missing fields
            migratedData = migratedData.map((transaction) => ({
                ...transaction,
                confidence: transaction.confidence || 0.5,
                reason: transaction.reason || 'Legacy transaction'
            }));
        }

        // Validate migrated data
        const validation = validateTransactionArray(migratedData);
        if (!validation.isValid) {
            console.warn('⚠️ Migrated data has validation issues:', validation.errors);
        }

        return migratedData;
    };

    const migrateRuleData = (data, fromVersion) => {
        console.log(`🔄 Migrating rule data from ${fromVersion} to ${DATA_VERSION}`);

        let migratedData = data;

        // Migration logic for different versions
        if (fromVersion === '0.9.0') {
            // Add missing fields
            migratedData = migratedData.map((rule) => ({
                ...rule,
                usage_count: rule.usage_count || 0,
                last_used: rule.last_used || null
            }));
        }

        return migratedData;
    };

    /**
     * ENHANCED STORAGE WITH VALIDATION
     */
    const validatedSetTransactions = (transactions) => {
        try {
            // Clean and validate data
            const cleanedTransactions = cleanTransactionArray(transactions);
            const validation = validateTransactionArray(cleanedTransactions);
            const integrity = checkDataIntegrity(cleanedTransactions);

            if (!validation.isValid) {
                logError(
                    new Error(`Transaction validation failed: ${validation.errors.join(', ')}`),
                    {
                        operation: 'setTransactions',
                        validationErrors: validation.errors
                    },
                    ERROR_SEVERITY.HIGH
                );

                // Use only valid transactions
                console.warn(`⚠️ Using only ${validation.validCount} valid transactions out of ${transactions.length}`);
            }

            if (!integrity.isValid) {
                logError(
                    new Error(`Data integrity issues found: ${integrity.issues.map((i) => i.message).join(', ')}`),
                    {
                        operation: 'setTransactions',
                        integrityIssues: integrity.issues
                    },
                    ERROR_SEVERITY.MEDIUM
                );
            }

            // Store with version info
            const dataPackage = {
                version: DATA_VERSION,
                timestamp: new Date().toISOString(),
                count: cleanedTransactions.length,
                validation: {
                    isValid: validation.isValid,
                    errorCount: validation.errors.length
                },
                integrity: {
                    isValid: integrity.isValid,
                    issueCount: integrity.issues.length
                },
                data: cleanedTransactions
            };

            const success = safeLocalStorageSet('transactions', dataPackage);
            if (success) {
                transactions.value = cleanedTransactions;
                console.log(`✅ Stored ${cleanedTransactions.length} validated transactions`);
                return true;
            } else {
                throw new Error('Failed to store transactions');
            }
        } catch (error) {
            logError(error, { operation: 'setTransactions' }, ERROR_SEVERITY.HIGH);
            return false;
        }
    };

    const validatedGetTransactions = () => {
        try {
            const stored = safeLocalStorageGet('transactions');
            if (!stored) return [];

            const data = safeJSONParse(stored, null);
            if (!data) return [];

            // Handle version migration
            if (data.version !== DATA_VERSION) {
                console.log(`🔄 Migrating data from version ${data.version} to ${DATA_VERSION}`);
                const migratedData = migrateTransactionData(data.data, data.version);
                validatedSetTransactions(migratedData);
                return migratedData;
            }

            // Validate current data
            const validation = validateTransactionArray(data.data);
            const integrity = checkDataIntegrity(data.data);

            if (!validation.isValid || !integrity.isValid) {
                console.warn('⚠️ Stored data has issues, attempting repair...');

                // Try to repair data
                const repairedData = data.data.filter((transaction) => {
                    const singleValidation = validateTransaction(transaction);
                    return singleValidation.isValid;
                });

                if (repairedData.length > 0) {
                    validatedSetTransactions(repairedData);
                    return repairedData;
                } else {
                    console.error('❌ All stored transactions are invalid, clearing data');
                    localStorage.removeItem('transactions');
                    return [];
                }
            }

            return data.data;
        } catch (error) {
            logError(error, { operation: 'getTransactions' }, ERROR_SEVERITY.HIGH);
            return [];
        }
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
            localStorage.setItem('transactions', JSON.stringify(transactions.value));

            // Save tags separately for backward compatibility
            const tags = {};
            transactions.value.forEach((transaction) => {
                if (transaction.tag) {
                    tags[transaction.id] = transaction.tag;
                }
            });
            localStorage.setItem('tags', JSON.stringify(tags));

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
            const csvData = localStorage.getItem('transactions');
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
        localStorage.removeItem('transactions');
        localStorage.removeItem('tags');
        console.log('🗑️ Cleared all transaction data');
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Generate a deterministic ID for a transaction
     */
    const generateTransactionId = (transaction) => {
        const { description, amount, date } = transaction;
        const hashInput = `${description}_${amount}_${date}`;

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return `tx_${Math.abs(hash).toString(36)}`;
    };

    // ============================================================================
    // FILE PARSING SECTION
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
    // CODE ORGANIZATION IMPROVEMENTS
    // ============================================================================

    /**
     * CONFIGURATION AND CONSTANTS
     */
    const CONFIG = {
        // Classification settings
        DEFAULT_CONFIDENCE: 0.5,
        MIN_CONFIDENCE_THRESHOLD: 0.1,
        MAX_RETRY_ATTEMPTS: 3,
        RETRY_BASE_DELAY: 1000,

        // Validation settings
        MAX_DESCRIPTION_LENGTH: 500,
        MAX_CATEGORY_LENGTH: 100,
        MAX_TAG_LENGTH: 50,
        MIN_AMOUNT: -999999999,
        MAX_AMOUNT: 999999999,

        // Storage settings
        MAX_ERROR_LOG_SIZE: 50,
        DATA_VERSION: '1.0.0',

        // Performance settings
        BATCH_SIZE: 100,
        DEBOUNCE_DELAY: 300
    };

    /**
     * UTILITY FUNCTIONS
     */
    const utils = {
        /**
         * Debounce function for performance optimization
         */
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Memoization helper for expensive operations
         */
        memoize: (fn) => {
            const cache = new Map();
            return (...args) => {
                const key = JSON.stringify(args);
                if (cache.has(key)) {
                    return cache.get(key);
                }
                const result = fn(...args);
                cache.set(key, result);
                return result;
            };
        },

        /**
         * Batch processing for large datasets
         */
        processBatch: async (items, processor, batchSize = CONFIG.BATCH_SIZE) => {
            const results = [];
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(processor));
                results.push(...batchResults);
            }
            return results;
        },

        /**
         * Deep clone with error handling
         */
        deepClone: (obj) => {
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch (error) {
                logError(error, { operation: 'deepClone' }, ERROR_SEVERITY.LOW);
                return { ...obj }; // Fallback to shallow clone
            }
        },

        /**
         * Safe number parsing
         */
        safeParseNumber: (value, fallback = 0) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const parsed = parseFloat(value);
                return isNaN(parsed) ? fallback : parsed;
            }
            return fallback;
        },

        /**
         * Safe date parsing
         */
        safeParseDate: (value) => {
            if (!value) return null;
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        },

        /**
         * Generate unique ID
         */
        generateId: (prefix = 'id') => {
            return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    };

    /**
     * ENHANCED CLASSIFICATION ENGINE WITH BETTER ORGANIZATION
     */
    const classificationEngine = {
        /**
         * Main classification orchestrator
         */
        classify: async (transaction) => {
            try {
                // Step 1: Pre-process transaction
                const preprocessed = await classificationEngine.preprocess(transaction);

                // Step 2: Apply classification rules
                const result = await classificationEngine.applyRules(preprocessed);

                // Step 3: Post-process result
                const finalResult = await classificationEngine.postprocess(result, transaction);

                return finalResult;
            } catch (error) {
                logError(
                    error,
                    {
                        operation: 'classificationEngine.classify',
                        transactionId: transaction.id
                    },
                    ERROR_SEVERITY.MEDIUM
                );

                return classificationEngine.getFallbackResult(transaction);
            }
        },

        /**
         * Pre-process transaction for classification
         */
        preprocess: async (transaction) => {
            const processed = { ...transaction };

            // Normalize description
            if (processed.description) {
                processed.description = processed.description.trim().toLowerCase();
            }

            // Ensure amount is a number
            processed.amount = utils.safeParseNumber(processed.amount);

            // Normalize date
            const date = utils.safeParseDate(processed.date);
            if (date) {
                processed.date = date.toISOString().split('T')[0];
            }

            // Generate ID if missing
            if (!processed.id) {
                processed.id = generateTransactionId(processed);
            }

            return processed;
        },

        /**
         * Apply classification rules
         */
        applyRules: async (transaction) => {
            const allRules = await enhancedLoadAllRules();

            // Apply rules in order of priority
            for (const rule of allRules) {
                if (isRuleApplicable(rule, transaction)) {
                    const result = await classificationEngine.applyRule(rule, transaction);
                    if (result) {
                        return result;
                    }
                }
            }

            // No rules matched
            return {
                tag: 'Other',
                confidence: CONFIG.MIN_CONFIDENCE_THRESHOLD,
                reason: 'No classification rules matched'
            };
        },

        /**
         * Apply a single rule
         */
        applyRule: async (rule, transaction) => {
            try {
                // Update usage statistics
                updateRuleUsage(rule);

                // Determine result based on rule type
                switch (rule.type) {
                    case RULE_TYPES.CATEGORY_MAPPING:
                        return {
                            tag: rule.tag,
                            confidence: rule.confidence,
                            reason: `Applied category mapping: ${rule.description}`
                        };

                    case RULE_TYPES.KEYWORD_MAPPING:
                        return {
                            tag: rule.tag,
                            confidence: rule.confidence,
                            reason: `Applied keyword mapping: ${rule.description}`
                        };

                    case RULE_TYPES.CATEGORY_KEYWORD_MAPPING:
                        return {
                            tag: rule.tag,
                            confidence: rule.confidence,
                            reason: `Applied category-keyword mapping: ${rule.description}`
                        };

                    case RULE_TYPES.CATEGORY_ASSIGNMENT:
                        return {
                            category: rule.category_result,
                            subcategory: rule.subcategory_result,
                            confidence: rule.confidence,
                            reason: `Applied category assignment: ${rule.description}`
                        };

                    default:
                        return null;
                }
            } catch (error) {
                logError(
                    error,
                    {
                        operation: 'applyRule',
                        ruleId: rule.id
                    },
                    ERROR_SEVERITY.LOW
                );
                return null;
            }
        },

        /**
         * Post-process classification result
         */
        postprocess: async (result, originalTransaction) => {
            const processed = { ...result };

            // Ensure confidence is within bounds
            processed.confidence = Math.max(CONFIG.MIN_CONFIDENCE_THRESHOLD, Math.min(1, processed.confidence || CONFIG.DEFAULT_CONFIDENCE));

            // Preserve original category/subcategory if not overridden
            if (!processed.category) {
                processed.category = originalTransaction.category || 'Other';
            }
            if (!processed.subcategory) {
                processed.subcategory = originalTransaction.subcategory || 'other';
            }

            // Ensure tag is present
            if (!processed.tag) {
                processed.tag = 'Other';
            }

            return processed;
        },

        /**
         * Get fallback result when classification fails
         */
        getFallbackResult: (transaction) => {
            return {
                tag: 'Other',
                category: transaction.category || 'Other',
                subcategory: transaction.subcategory || 'other',
                confidence: CONFIG.MIN_CONFIDENCE_THRESHOLD,
                reason: 'Classification failed - using fallback'
            };
        }
    };

    /**
     * ENHANCED STORAGE MANAGER WITH BETTER ORGANIZATION
     */
    const storageManager = {
        /**
         * Save data with validation and error handling
         */
        save: async (key, data, options = {}) => {
            try {
                const { validate = true, version = CONFIG.DATA_VERSION } = options;

                let dataToStore = data;

                // Validate data if requested
                if (validate) {
                    const validation = storageManager.validateData(data, key);
                    if (!validation.isValid) {
                        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }
                }

                // Create data package
                const dataPackage = {
                    version,
                    timestamp: new Date().toISOString(),
                    data: dataToStore,
                    metadata: {
                        size: JSON.stringify(dataToStore).length,
                        itemCount: Array.isArray(dataToStore) ? dataToStore.length : 1
                    }
                };

                // Store data
                const success = safeLocalStorageSet(key, dataPackage);
                if (!success) {
                    throw new Error(`Failed to store data for key: ${key}`);
                }

                console.log(`✅ Stored ${dataPackage.metadata.itemCount} items for key: ${key}`);
                return true;
            } catch (error) {
                logError(
                    error,
                    {
                        operation: 'storageManager.save',
                        key
                    },
                    ERROR_SEVERITY.HIGH
                );
                return false;
            }
        },

        /**
         * Load data with validation and migration
         */
        load: async (key, options = {}) => {
            try {
                const { validate = true, migrate = true, fallback = null } = options;

                // Get stored data
                const stored = safeLocalStorageGet(key);
                if (!stored) return options.fallback || null;

                const dataPackage = safeJSONParse(stored, null);
                if (!dataPackage) return options.fallback || null;

                let data = dataPackage.data;

                // Handle migration
                if (migrate && dataPackage.version !== CONFIG.DATA_VERSION) {
                    console.log(`🔄 Migrating data from ${dataPackage.version} to ${CONFIG.DATA_VERSION}`);
                    data = await storageManager.migrateData(data, dataPackage.version, key);
                }

                // Validate data if requested
                if (validate) {
                    const validation = storageManager.validateData(data, key);
                    if (!validation.isValid) {
                        console.warn(`⚠️ Data validation failed for ${key}:`, validation.errors);
                        return options.fallback || null;
                    }
                }

                console.log(`📊 Loaded ${dataPackage.metadata?.itemCount || 'unknown'} items for key: ${key}`);
                return data;
            } catch (error) {
                logError(
                    error,
                    {
                        operation: 'storageManager.load',
                        key
                    },
                    ERROR_SEVERITY.HIGH
                );
                return fallback;
            }
        },

        /**
         * Validate data based on key type
         */
        validateData: (data, key) => {
            switch (key) {
                case 'transactions':
                    return validateTransactionArray(data);
                case 'userDefinedRules':
                    return validateRuleArray(data);
                default:
                    return { isValid: true, errors: [] };
            }
        },

        /**
         * Migrate data between versions
         */
        migrateData: async (data, fromVersion, key) => {
            switch (key) {
                case 'transactions':
                    return migrateTransactionData(data, fromVersion);
                case 'userDefinedRules':
                    return migrateRuleData(data, fromVersion);
                default:
                    return data;
            }
        },

        /**
         * Clear specific data
         */
        clear: (key) => {
            try {
                localStorage.removeItem(key);
                console.log(`🗑️ Cleared data for key: ${key}`);
                return true;
            } catch (error) {
                logError(
                    error,
                    {
                        operation: 'storageManager.clear',
                        key
                    },
                    ERROR_SEVERITY.MEDIUM
                );
                return false;
            }
        },

        /**
         * Get storage statistics
         */
        getStats: () => {
            const stats = {
                totalKeys: 0,
                totalSize: 0,
                keys: []
            };

            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('transaction')) {
                        const value = localStorage.getItem(key);
                        stats.totalKeys++;
                        stats.totalSize += value ? value.length : 0;
                        stats.keys.push(key);
                    }
                }
            } catch (error) {
                logError(error, { operation: 'storageManager.getStats' }, ERROR_SEVERITY.LOW);
            }

            return stats;
        }
    };

    /**
     * Validate rule array
     */
    const validateRuleArray = (rules) => {
        const errors = [];
        const validRules = [];

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const validation = validateRule(rule);

            if (!validation.isValid) {
                errors.push(`Rule ${i}: ${validation.errors.join(', ')}`);
            } else {
                validRules.push(rule);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            validRules,
            invalidCount: errors.length,
            validCount: validRules.length
        };
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
        determineTag,

        // Data fixing
        fixAllTagAssignments,
        forceReevaluateAllTransactions,

        // Storage
        saveTransactions,
        loadTransactions,
        clearTransactions,

        // Computed
        transactionCount,
        tagBreakdown,

        // Tag mapping system
        getTagMapping,
        addMapping,
        removeMapping,

        // Unified Rule System
        RULE_TYPES,
        RULE_TIERS,
        createRule,
        getDefaultSystemRules,
        loadAllRules,
        saveUserRules,
        addUserRule,
        updateUserRule,
        deleteUserRule,
        getUserRules,

        // Error Handling & Recovery
        ERROR_TYPES,
        ERROR_SEVERITY,
        errorLog,
        errorCount,
        lastError,
        logError,
        retryOperation,
        safeJSONParse,
        safeLocalStorageGet,
        safeLocalStorageSet,
        recoverFromStorageError,
        recoverFromClassificationError,
        createErrorBoundary,
        enhancedLoadAllRules,
        enhancedSaveUserRules,
        enhancedClassifyTransaction,

        // Legacy functions
        extractAndMergeAllRules,
        loadCustomTagMapping,
        saveCustomTagMapping,

        // Data Validation & Integrity
        validateSchema,
        validateTransaction,
        validateRule,
        validateTransactionArray,
        checkDataIntegrity,
        cleanTransaction,
        cleanTransactionArray,
        migrateTransactionData,
        migrateRuleData,
        DATA_VERSION,
        validatedSetTransactions,
        validatedGetTransactions,

        // Code Organization Improvements
        CONFIG,
        utils,
        classificationEngine,
        storageManager,
        validateRuleArray
    };
}
