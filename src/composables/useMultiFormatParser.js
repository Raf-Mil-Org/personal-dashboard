import { ref } from 'vue';
import { useCSVParser } from './useCSVParser';
import { mapCSVToStandard, mapJSONToStandard, detectCategoryFromDescription } from '@/data/columnMapping';

export function useMultiFormatParser() {
    const { parseCSV, generateTransactionId } = useCSVParser();
    const parseError = ref(null);

    // Persistent storage keys for transaction counting
    const PERSISTENT_STORAGE_KEYS = {
        TOTAL_JSON_TRANSACTIONS: 'transaction_analyzer_persistent_total_json',
        TOTAL_CSV_TRANSACTIONS: 'transaction_analyzer_persistent_total_csv'
    };

    // Helper functions for persistent transaction counting
    const updatePersistentCount = (key, newCount) => {
        try {
            const currentCount = parseInt(localStorage.getItem(PERSISTENT_STORAGE_KEYS[key]) || '0', 10);
            const updatedCount = currentCount + newCount;
            localStorage.setItem(PERSISTENT_STORAGE_KEYS[key], updatedCount.toString());
            console.log(`📊 Updated persistent count for ${key}: ${currentCount} + ${newCount} = ${updatedCount}`);
            return updatedCount;
        } catch (error) {
            console.error(`Error updating persistent count for ${key}:`, error);
            return 0;
        }
    };

    // Default tag mapping for category/subcategory combinations based on structured data
    const defaultTagMapping = {
        'Fixed expenses': {
            'Housing costs': 'Housing',
            Daycare: 'Other',
            Insurance: 'Utilities',
            Utilities: 'Utilities',
            Loans: 'Other',
            Other: 'Other'
        },
        'Free time': {
            'Activities & events': 'Entertainment',
            Sport: 'Health',
            Hobbies: 'Entertainment',
            Holidays: 'Entertainment',
            'Books & magazines': 'Entertainment',
            Games: 'Entertainment',
            Music: 'Entertainment',
            Movies: 'Entertainment',
            Lottery: 'Entertainment',
            Other: 'Entertainment'
        },
        'Groceries & household': {
            Groceries: 'Groceries',
            'House & garden': 'Groceries',
            Pets: 'Groceries',
            Other: 'Groceries'
        },
        'Health & Wellness': {
            'Medical expenses': 'Health',
            'Pharmacy & drugstore': 'Health',
            Wellness: 'Health',
            'Beauty & hair care': 'Health',
            Other: 'Health'
        },
        Other: {
            'Cash withdrawal': 'Other',
            'Credit card': 'Other',
            Transfers: 'Other',
            Charity: 'Other',
            Education: 'Other',
            Fines: 'Other',
            Taxes: 'Other',
            'Extra loan repayment': 'Other',
            'Extra mortgage repayment': 'Other',
            'Business expenses': 'Other',
            Other: 'Other'
        },
        'Restaurants & bars': {
            Bars: 'Dining',
            'Coffee bars': 'Dining',
            Snacks: 'Dining',
            Lunch: 'Dining',
            Restaurants: 'Dining',
            Other: 'Dining'
        },
        Shopping: {
            Clothes: 'Shopping',
            Accessories: 'Shopping',
            'Software & electronics': 'Shopping',
            'Online shopping': 'Shopping',
            Gifts: 'Shopping',
            Other: 'Shopping'
        },
        'Transport & travel': {
            Car: 'Transport',
            Fuel: 'Transport',
            Parking: 'Transport',
            'Public transport': 'Transport',
            'Flight tickets': 'Transport',
            Taxi: 'Transport',
            Bicycle: 'Transport',
            Other: 'Transport'
        },
        'Group this yourself': {
            'Group this yourself': 'Other'
        },
        'To your accounts': {
            Savings: 'Savings',
            'Joint account': 'Transfers',
            'Investment account': 'Investments',
            Other: 'Transfers'
        },
        // New categories for savings and investments
        Savings: {
            'Savings account': 'Savings',
            'Emergency fund': 'Savings',
            'Goal savings': 'Savings',
            Other: 'Savings'
        },
        Investments: {
            Investment: 'Investments',
            'Investment account': 'Investments',
            'Stock market': 'Investments',
            Crypto: 'Investments',
            ETF: 'Investments',
            'Mutual funds': 'Investments',
            Other: 'Investments'
        },
        Transfers: {
            'Internal transfer': 'Transfers',
            'Account transfer': 'Transfers',
            'Between accounts': 'Transfers',
            Other: 'Transfers'
        }
    };

    // Load custom tag mapping from localStorage
    const loadCustomTagMapping = () => {
        try {
            const saved = localStorage.getItem('customTagMapping');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading custom tag mapping:', error);
            return {};
        }
    };

    // Save custom tag mapping to localStorage
    const saveCustomTagMapping = (mapping) => {
        try {
            localStorage.setItem('customTagMapping', JSON.stringify(mapping));
        } catch (error) {
            console.error('Error saving custom tag mapping:', error);
        }
    };

    // Get tag mapping (combines default and custom mappings)
    const getTagMapping = () => {
        const customMapping = loadCustomTagMapping();
        return { ...defaultTagMapping, ...customMapping };
    };

    // Update tag mapping
    const updateTagMapping = (category, subcategory, tag) => {
        const customMapping = loadCustomTagMapping();
        if (!customMapping[category]) {
            customMapping[category] = {};
        }
        customMapping[category][subcategory] = tag;
        saveCustomTagMapping(customMapping);
    };

    // Determine tag based on category and subcategory with proper priority
    const determineTag = (category, subcategory, existingTag = null) => {
        console.log('🔍 Determining tag for:', { category, subcategory, existingTag });

        // Priority 1: If there's already a tag, prioritize it
        if (existingTag && existingTag.trim()) {
            console.log('✅ Using existing tag:', existingTag.trim());
            return existingTag.trim();
        }

        // Priority 2: Try to map from category/subcategory combination
        const tagMapping = getTagMapping();

        if (category && subcategory && tagMapping[category] && tagMapping[category][subcategory]) {
            const mappedTag = tagMapping[category][subcategory];
            console.log('🏷️ Mapped tag from category/subcategory:', mappedTag);
            return mappedTag;
        }

        // Priority 3: Try to map from just category (use first available subcategory)
        if (category && tagMapping[category]) {
            const firstSubcategory = Object.keys(tagMapping[category])[0];
            if (firstSubcategory) {
                const mappedTag = tagMapping[category][firstSubcategory];
                console.log('🏷️ Mapped tag from category only:', mappedTag);
                return mappedTag;
            }
        }

        console.log('❌ No tag mapping found');
        return null;
    };

    // Parse JSON transaction format
    const parseJSONTransactions = (jsonText) => {
        try {
            parseError.value = null;

            const data = JSON.parse(jsonText);

            if (!data.transactions || !Array.isArray(data.transactions)) {
                throw new Error('Invalid JSON format: missing or invalid "transactions" array');
            }

            console.log('🔍 JSON parsing - Total transactions in array:', data.transactions.length);

            return data.transactions.map((transaction, index) => {
                // Debug: Log transaction details
                if (index < 5 || transaction.amount?.value === '7822.45' || transaction.amount?.value === '8548.11') {
                    console.log(`🔍 JSON Transaction ${index + 1}:`, {
                        id: transaction.id,
                        date: transaction.executionDate,
                        amount: transaction.amount?.value,
                        description: transaction.subject,
                        hasAmount: !!transaction.amount,
                        hasValue: !!transaction.amount?.value
                    });
                }

                // Map to standard format
                const standardTransaction = mapJSONToStandard(transaction);

                // Use the original JSON ID as the single source of truth
                standardTransaction.id = transaction.id;

                // Store original data for reference
                standardTransaction.originalData = transaction;

                return standardTransaction;
            });
        } catch (error) {
            parseError.value = error.message;
            console.error('JSON parsing error:', error);
            throw error;
        }
    };

    // Parse CSV transactions (enhanced version)
    const parseCSVTransactions = (csvText) => {
        try {
            parseError.value = null;
            const parsedData = parseCSV(csvText);

            const transactions = parsedData.map((transaction) => {
                // Map to standard format
                const standardTransaction = mapCSVToStandard(transaction);

                // Always generate a deterministic ID for consistency
                // This ensures the same transaction always gets the same ID
                standardTransaction.id = generateTransactionId(standardTransaction);

                // Store original data for reference
                standardTransaction.originalData = transaction;

                return standardTransaction;
            });

            return transactions;
        } catch (error) {
            parseError.value = error.message;
            console.error('CSV parsing error:', error);
            throw error;
        }
    };

    // Post-process transactions to assign tags and categories
    const postProcessTransactions = (transactions) => {
        console.log('🔄 Post-processing transactions for tag assignment...');

        return transactions.map((transaction) => {
            // Clean up tag field (remove # prefix if present)
            let existingTag = transaction.tag;
            if (existingTag && existingTag.startsWith('#')) {
                existingTag = existingTag.substring(1);
            }

            // If no category/subcategory detected, try to detect from description
            if (!transaction.category && !transaction.subcategory && transaction.description) {
                const detected = detectCategoryFromDescription(transaction.description);
                transaction.category = detected.category;
                transaction.subcategory = detected.subcategory;
                console.log(`🔍 Detected category for "${transaction.description}":`, detected);
            }

            // Determine tag with proper priority handling
            transaction.tag = determineTag(transaction.category, transaction.subcategory, existingTag);

            console.log(`🏷️ Final tag assignment for "${transaction.description}":`, {
                existingTag,
                category: transaction.category,
                subcategory: transaction.subcategory,
                finalTag: transaction.tag
            });

            return transaction;
        });
    };

    // Main parsing function that detects format and parses accordingly
    const parseTransactions = (fileContent, fileName) => {
        try {
            parseError.value = null;

            let transactions;

            // Try to detect if it's JSON
            if (fileName.toLowerCase().endsWith('.json') || fileContent.trim().startsWith('{')) {
                transactions = parseJSONTransactions(fileContent);
                // Save total JSON transactions count AFTER parsing
                updatePersistentCount('TOTAL_JSON_TRANSACTIONS', transactions.length);
            } else {
                // Default to CSV
                transactions = parseCSVTransactions(fileContent);
                // Save total CSV transactions count AFTER parsing
                updatePersistentCount('TOTAL_CSV_TRANSACTIONS', transactions.length);
            }

            // Post-process transactions for tag assignment
            return postProcessTransactions(transactions);
        } catch (error) {
            parseError.value = error.message;
            console.error('Transaction parsing error:', error);
            throw error;
        }
    };

    // Get all available categories from tag mapping
    const getAvailableCategories = () => {
        const tagMapping = getTagMapping();
        return Object.keys(tagMapping);
    };

    // Get subcategories for a given category
    const getSubcategoriesForCategory = (category) => {
        const tagMapping = getTagMapping();
        return category && tagMapping[category] ? Object.keys(tagMapping[category]) : [];
    };

    // Get available tags
    const getAvailableTags = () => {
        const tagMapping = getTagMapping();
        const tags = new Set();

        // Add tags from custom mappings
        Object.values(tagMapping).forEach((subcategories) => {
            Object.values(subcategories).forEach((tag) => {
                tags.add(tag);
            });
        });

        // Add default tags if not already present
        const defaultTags = ['Groceries', 'Transport', 'Dining', 'Entertainment', 'Utilities', 'Health', 'Shopping', 'Housing', 'Other'];

        defaultTags.forEach((tag) => tags.add(tag));

        // Add custom tags from localStorage
        try {
            const savedCustomTags = localStorage.getItem('customTags');
            if (savedCustomTags) {
                const customTags = JSON.parse(savedCustomTags);
                customTags.forEach((customTag) => {
                    tags.add(customTag.name);
                });
            }
        } catch (error) {
            console.error('Error loading custom tags for available tags:', error);
        }

        return Array.from(tags).sort();
    };

    return {
        parseTransactions,
        parseJSONTransactions,
        parseCSVTransactions,
        postProcessTransactions,
        determineTag,
        updateTagMapping,
        getTagMapping,
        getAvailableCategories,
        getSubcategoriesForCategory,
        getAvailableTags,
        parseError
    };
}
