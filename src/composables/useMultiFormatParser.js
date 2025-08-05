import { ref } from 'vue';
import { useCSVParser } from './useCSVParser';
import { categories } from '@/data/categories';
import { mapCSVToStandard, mapJSONToStandard, detectCategoryFromDescription } from '@/data/columnMapping';

export function useMultiFormatParser() {
    const { parseCSV, generateTransactionId } = useCSVParser();
    const parseError = ref(null);

    // Default tag mapping for category/subcategory combinations based on structured data
    const defaultTagMapping = {
        'Fixed expenses': {
            'Housing costs': 'Housing',
            'Daycare': 'Other',
            'Insurance': 'Utilities',
            'Utilities': 'Utilities',
            'Loans': 'Other',
            'Other': 'Other'
        },
        'Free time': {
            'Activities & events': 'Entertainment',
            'Sport': 'Health',
            'Hobbies': 'Entertainment',
            'Holidays': 'Entertainment',
            'Books & magazines': 'Entertainment',
            'Games': 'Entertainment',
            'Music': 'Entertainment',
            'Movies': 'Entertainment',
            'Lottery': 'Entertainment',
            'Other': 'Entertainment'
        },
        'Groceries & household': {
            'Groceries': 'Groceries',
            'House & garden': 'Groceries',
            'Pets': 'Groceries',
            'Other': 'Groceries'
        },
        'Health & Wellness': {
            'Medical expenses': 'Health',
            'Pharmacy & drugstore': 'Health',
            'Wellness': 'Health',
            'Beauty & hair care': 'Health',
            'Other': 'Health'
        },
        'Other': {
            'Cash withdrawal': 'Other',
            'Credit card': 'Other',
            'Transfers': 'Other',
            'Charity': 'Other',
            'Education': 'Other',
            'Fines': 'Other',
            'Taxes': 'Other',
            'Extra loan repayment': 'Other',
            'Extra mortgage repayment': 'Other',
            'Savings': 'Other',
            'Investment': 'Other',
            'Business expenses': 'Other',
            'Other': 'Other'
        },
        'Restaurants & bars': {
            'Bars': 'Dining',
            'Coffee bars': 'Dining',
            'Snacks': 'Dining',
            'Lunch': 'Dining',
            'Restaurants': 'Dining',
            'Other': 'Dining'
        },
        'Shopping': {
            'Clothes': 'Shopping',
            'Accessories': 'Shopping',
            'Software & electronics': 'Shopping',
            'Online shopping': 'Shopping',
            'Gifts': 'Shopping',
            'Other': 'Shopping'
        },
        'Transport & travel': {
            'Car': 'Transport',
            'Fuel': 'Transport',
            'Parking': 'Transport',
            'Public transport': 'Transport',
            'Flight tickets': 'Transport',
            'Taxi': 'Transport',
            'Bicycle': 'Transport',
            'Other': 'Transport'
        },
        'Group this yourself': {
            'Group this yourself': 'Other'
        },
        'To your accounts': {
            'Savings': 'Other',
            'Joint account': 'Other',
            'Investment account': 'Other',
            'Other': 'Other'
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

    // Generate a unique fingerprint for duplicate detection
    const generateTransactionFingerprint = (transaction) => {
        // For JSON format
        if (transaction.id) {
            return transaction.id;
        }

        // For CSV format or fallback
        const date = transaction.Date || transaction.date || transaction.executionDate || '';
        const amount = transaction.Amount || transaction.amount || (transaction.amount?.value || '');
        const description = transaction.Description || transaction.description || transaction.subject || '';

        const hashString = `${date}-${amount}-${description}`;
        return btoa(hashString)
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 12);
    };

    // Parse JSON transaction format
    const parseJSONTransactions = (jsonText) => {
        try {
            parseError.value = null;
            
            const data = JSON.parse(jsonText);
            
            if (!data.transactions || !Array.isArray(data.transactions)) {
                throw new Error('Invalid JSON format: missing or invalid "transactions" array');
            }

            return data.transactions.map(transaction => {
                // Map to standard format
                const standardTransaction = mapJSONToStandard(transaction);
                
                // Add generated ID if not present
                if (!standardTransaction.id) {
                    standardTransaction.id = generateTransactionFingerprint(transaction);
                }
                
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
            
            return parsedData.map(transaction => {
                // Map to standard format
                const standardTransaction = mapCSVToStandard(transaction);
                
                // Add generated ID if not present
                if (!standardTransaction.id) {
                    standardTransaction.id = generateTransactionId(transaction);
                }
                
                // Store original data for reference
                standardTransaction.originalData = transaction;

                return standardTransaction;
            });
        } catch (error) {
            parseError.value = error.message;
            console.error('CSV parsing error:', error);
            throw error;
        }
    };

    // Post-process transactions to assign tags and categories
    const postProcessTransactions = (transactions) => {
        console.log('🔄 Post-processing transactions for tag assignment...');
        
        return transactions.map(transaction => {
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
            transaction.tag = determineTag(
                transaction.category,
                transaction.subcategory,
                existingTag
            );
            
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
            } else {
                // Default to CSV
                transactions = parseCSVTransactions(fileContent);
            }
            
            // Post-process transactions for tag assignment
            return postProcessTransactions(transactions);
        } catch (error) {
            parseError.value = error.message;
            console.error('Transaction parsing error:', error);
            throw error;
        }
    };

    // Remove duplicates from transactions
    const removeDuplicates = (transactions) => {
        const seen = new Set();
        const unique = [];
        const duplicates = [];

        transactions.forEach(transaction => {
            const fingerprint = generateTransactionFingerprint(transaction);
            
            if (seen.has(fingerprint)) {
                duplicates.push(transaction);
            } else {
                seen.add(fingerprint);
                unique.push(transaction);
            }
        });

        return {
            unique,
            duplicates,
            duplicateCount: duplicates.length
        };
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
        Object.values(tagMapping).forEach(subcategories => {
            Object.values(subcategories).forEach(tag => {
                tags.add(tag);
            });
        });
        
        // Add default tags if not already present
        const defaultTags = [
            'Groceries',
            'Transport',
            'Dining',
            'Entertainment',
            'Utilities',
            'Health',
            'Shopping',
            'Housing',
            'Other'
        ];
        
        defaultTags.forEach(tag => tags.add(tag));
        
        return Array.from(tags).sort();
    };

    return {
        parseTransactions,
        parseJSONTransactions,
        parseCSVTransactions,
        postProcessTransactions,
        removeDuplicates,
        generateTransactionFingerprint,
        determineTag,
        updateTagMapping,
        getTagMapping,
        getAvailableCategories,
        getSubcategoriesForCategory,
        getAvailableTags,
        parseError
    };
} 