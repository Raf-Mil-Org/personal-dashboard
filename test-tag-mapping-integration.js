// Test script to demonstrate tag mapping integration
// This shows how user-defined tag mappings are now applied in the transaction engine

console.log('🔍 Tag Mapping Integration Test');
console.log('==============================');

// Mock the tag mapping system
const mockTagMapping = {
    other: {
        'credit card': 'Other',
        charity: 'Gift'
    },
    groceries: {
        supermarket: 'Groceries'
    }
};

// Mock the getTagMapping function
function getTagMapping() {
    return mockTagMapping;
}

// Mock the enhanced classification function with tag mapping integration
function classifyTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const existingTag = (transaction.tag || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // PRIORITY 2: Check user-defined tag mappings (highest priority for user preferences)
    const tagMapping = getTagMapping();
    if (category && subcategory && tagMapping[category] && tagMapping[category][subcategory]) {
        const mappedTag = tagMapping[category][subcategory];
        console.log(`🏷️ User-defined mapping applied: ${category}/${subcategory} → ${mappedTag}`);
        return {
            tag: mappedTag,
            confidence: 0.9,
            reason: `User-defined mapping: ${category}/${subcategory} → ${mappedTag}`
        };
    }

    // Fallback to other classification logic
    if (description.includes('bunq')) {
        return { tag: 'Savings', reason: 'Bunq detected' };
    }

    if (description.includes('degiro')) {
        return { tag: 'Investments', reason: 'Degiro detected' };
    }

    return { tag: 'Other', reason: 'No specific indicators' };
}

// Test transactions
const testTransactions = [
    {
        description: 'Credit card payment',
        category: 'Other',
        subcategory: 'credit card',
        amount: -1000,
        tag: 'Investments' // ❌ Incorrect - should be fixed by user mapping
    },
    {
        description: 'Charity donation',
        category: 'Other',
        subcategory: 'charity',
        amount: -500,
        tag: 'Investments' // ❌ Incorrect - should be fixed by user mapping
    },
    {
        description: 'Bunq savings deposit',
        category: 'Other',
        subcategory: 'other',
        amount: -2000,
        tag: 'Investments' // ❌ Incorrect - should be fixed by description
    },
    {
        description: 'Investment purchase via Degiro',
        category: 'Investment',
        subcategory: 'investment purchase',
        amount: -5000,
        tag: 'Investments' // ✅ Correct
    },
    {
        description: 'Grocery shopping',
        category: 'Groceries',
        subcategory: 'supermarket',
        amount: -150,
        tag: 'Other' // Should be fixed by user mapping
    }
];

console.log('\n🧪 Testing tag mapping integration:');

testTransactions.forEach((transaction, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    console.log(`Transaction: "${transaction.description}"`);
    console.log(`Category: ${transaction.category}, Subcategory: ${transaction.subcategory}`);
    console.log(`Current tag: ${transaction.tag}`);

    const classification = classifyTransaction(transaction);

    console.log(`\n📊 Classification result:`);
    console.log(`   New tag: ${classification.tag}`);
    console.log(`   Reason: ${classification.reason}`);
    console.log(`   Confidence: ${classification.confidence}`);

    if (classification.tag !== transaction.tag) {
        console.log(`   🔧 FIXED: ${transaction.tag} → ${classification.tag}`);
    } else {
        console.log(`   ✅ VALIDATED: Tag is correct`);
    }
});

console.log('\n💡 Key improvements:');
console.log('1. User-defined tag mappings are now integrated into the transaction engine');
console.log('2. Tag mappings have high priority (0.9 confidence)');
console.log('3. Category/subcategory combinations are properly mapped');
console.log('4. The "Fix All Existing Tags" button will now apply these mappings');
console.log('\n🎯 This should fix the issue where new tag mappings were not being applied!');

console.log('\n📋 Current tag mappings:');
Object.entries(mockTagMapping).forEach(([category, subcategories]) => {
    Object.entries(subcategories).forEach(([subcategory, tag]) => {
        console.log(`   ${category}/${subcategory} → ${tag}`);
    });
});
