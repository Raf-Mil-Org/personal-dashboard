// Test script to demonstrate rule extraction and merging
// This shows how hardcoded rules are extracted and merged with custom mappings

console.log('🔍 Rule Extraction and Merging Test');
console.log('===================================');

// Mock the CATEGORY_RULES and TAG_RULES from useTransactionEngine.js
const CATEGORY_RULES = [
    {
        pattern: /(ALBERT HEIJN|DIRK|Lidl|JUMBO|AH|SUPERMARKET|GROCERY)/i,
        category: 'Groceries & Household',
        subcategory: 'Supermarket',
        confidence: 0.9
    },
    {
        pattern: /(Hairstudio|Pharmacy|Health|GYM|FITNESS|WELLNESS|SPA|MASSAGE)/i,
        category: 'Health & Wellness',
        subcategory: 'Personal Care',
        confidence: 0.8
    },
    {
        pattern: /(Cafe|Restaurant|FLOCAFE|Bakery|Zero|Ramen|VIJFHUI|FOOD|DINING|EAT)/i,
        category: 'Restaurants/Food',
        subcategory: 'Dining Out',
        confidence: 0.85
    }
];

const TAG_RULES = {
    savings: {
        keywords: ['savings', 'bunq'],
        accountPatterns: [/bunq/i, /savings account/i],
        subcategories: ['savings account', 'emergency fund', 'goal savings'],
        tag: 'Savings',
        confidence: 0.9,
        reason: 'Savings indicators detected'
    },
    transfers: {
        keywords: ['transfer'],
        accountPatterns: [/transfer to own account/i, /internal transfer/i, /between own accounts/i],
        subcategories: ['internal transfer', 'account transfer', 'between accounts'],
        tag: 'Transfers',
        confidence: 0.8,
        reason: 'Transfer indicators detected'
    },
    investments: {
        keywords: ['flatex', 'degiro'],
        accountPatterns: [/degiro/i, /flatex/i],
        subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds'],
        tag: 'Investments',
        confidence: 0.7,
        reason: 'Investment indicators detected'
    },
    income: {
        keywords: ['salary', 'wage', 'income', 'payment', 'refund', 'dividend', 'bonus', 'commission', 'revenue'],
        tag: 'Income',
        confidence: 0.8,
        reason: 'Income indicators detected',
        requirePositiveAmount: true
    }
};

// Mock localStorage
const mockLocalStorage = {
    customTagMapping: null,
    getItem: function (key) {
        if (key === 'customTagMapping') {
            return this.customTagMapping;
        }
        return null;
    },
    setItem: function (key, value) {
        if (key === 'customTagMapping') {
            this.customTagMapping = value;
            console.log('💾 Saved to localStorage:', value);
        }
    }
};

// Mock the extractAndMergeAllRules function
function extractAndMergeAllRules() {
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
}

function loadCustomTagMapping() {
    try {
        const saved = mockLocalStorage.getItem('customTagMapping');
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Error loading custom tag mapping:', error);
        return {};
    }
}

function saveCustomTagMapping(mapping) {
    try {
        mockLocalStorage.setItem('customTagMapping', JSON.stringify(mapping));
        console.log('💾 Custom tag mapping saved to localStorage');
    } catch (error) {
        console.error('Error saving custom tag mapping:', error);
    }
}

// Test scenarios
console.log('\n🧪 Testing rule extraction and merging:');

// Scenario 1: No existing custom mappings
console.log('\n--- Scenario 1: No existing custom mappings ---');
const result1 = extractAndMergeAllRules();
console.log('Result:', JSON.stringify(result1, null, 2));

// Scenario 2: With existing custom mappings
console.log('\n--- Scenario 2: With existing custom mappings ---');
// Add a custom mapping
saveCustomTagMapping({
    other: {
        'credit card': 'Other',
        charity: 'Gift'
    }
});

const result2 = extractAndMergeAllRules();
console.log('Result:', JSON.stringify(result2, null, 2));

// Test classification with merged rules
console.log('\n🧪 Testing classification with merged rules:');

function classifyWithMergedRules(transaction) {
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    const mergedRules = loadCustomTagMapping();

    if (category && subcategory && mergedRules[category] && mergedRules[category][subcategory]) {
        return mergedRules[category][subcategory];
    }

    return 'Other';
}

const testTransactions = [
    {
        description: 'Credit card payment',
        category: 'Other',
        subcategory: 'credit card'
    },
    {
        description: 'Grocery shopping',
        category: 'Groceries & Household',
        subcategory: 'supermarket'
    },
    {
        description: 'Bunq savings',
        category: 'Savings',
        subcategory: 'bunq'
    }
];

testTransactions.forEach((transaction, index) => {
    const tag = classifyWithMergedRules(transaction);
    console.log(`Transaction ${index + 1}: "${transaction.description}" → ${tag}`);
});

console.log('\n💡 Key benefits:');
console.log('1. All hardcoded rules are now available as tag mappings');
console.log('2. Custom mappings take precedence over hardcoded rules');
console.log('3. Rules are persisted in localStorage');
console.log('4. The "Fix All Existing Tags" button will use all rules');
console.log('\n🎯 This should solve the credit card → investments issue!');
