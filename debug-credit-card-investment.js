// Debug script to investigate credit card → investments issue
// This will trace through the exact classification logic

console.log('🔍 Debug: Credit Card → Investments Issue');
console.log('========================================');

// Mock the actual classification logic from useTransactionEngine.js
function classifyTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const existingTag = (transaction.tag || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    console.log(`\n🔍 CLASSIFYING: "${transaction.description}"`);
    console.log(`   Category: "${category}", Subcategory: "${subcategory}"`);
    console.log(`   Existing tag: "${existingTag}"`);

    // PRIORITY 0: Special rules (highest priority)
    console.log(`\n📋 PRIORITY 0: Special rules`);
    // No special rules defined, skipping...

    // PRIORITY 1: Apply learned rules (but validate against current rules)
    console.log(`\n📋 PRIORITY 1: Learned rules`);
    // Mock learned rules - assume none for this test
    console.log(`   No learned rules applied`);

    // PRIORITY 2: Check user-defined tag mappings (highest priority for user preferences)
    console.log(`\n📋 PRIORITY 2: User-defined tag mappings`);
    const tagMapping = getTagMapping();
    console.log(`   Available mappings:`, JSON.stringify(tagMapping, null, 2));

    if (category && subcategory && tagMapping[category] && tagMapping[category][subcategory]) {
        const mappedTag = tagMapping[category][subcategory];
        console.log(`   ✅ MAPPING FOUND: ${category}/${subcategory} → ${mappedTag}`);
        return {
            tag: mappedTag,
            confidence: 0.9,
            reason: `User-defined mapping: ${category}/${subcategory} → ${mappedTag}`
        };
    } else {
        console.log(`   ❌ NO MAPPING FOUND for ${category}/${subcategory}`);
        console.log(`   Available categories: ${Object.keys(tagMapping).join(', ')}`);
        if (tagMapping[category]) {
            console.log(`   Available subcategories for "${category}": ${Object.keys(tagMapping[category]).join(', ')}`);
        }
    }

    // PRIORITY 3: Validate existing tag against current rules and category/subcategory
    console.log(`\n📋 PRIORITY 3: Validate existing tag`);
    if (existingTag && existingTag !== 'untagged' && existingTag !== 'other') {
        const isExistingTagValid = validateTagAgainstRules(transaction, existingTag);
        if (isExistingTagValid) {
            console.log(`   ✅ Existing tag "${existingTag}" is valid`);
            return {
                tag: existingTag.charAt(0).toUpperCase() + existingTag.slice(1),
                confidence: 0.8,
                reason: `Validated existing tag: ${existingTag}`
            };
        } else {
            console.log(`   ❌ Existing tag "${existingTag}" is INVALID - will be changed`);
        }
    } else {
        console.log(`   No existing tag to validate`);
    }

    // PRIORITY 4: Category assignment
    console.log(`\n📋 PRIORITY 4: Category assignment`);
    const categoryResult = assignCategory(transaction);
    console.log(`   Category result: ${categoryResult.category}/${categoryResult.subcategory}`);

    // PRIORITY 5: Tag assignment based on comprehensive rules
    console.log(`\n📋 PRIORITY 5: Tag assignment`);
    const tagResult = assignTag(transaction);
    console.log(`   Tag result: ${tagResult.tag} (${tagResult.reason})`);

    return {
        tag: tagResult.tag || 'Other',
        category: categoryResult.category || 'Other',
        subcategory: categoryResult.subcategory || 'other',
        confidence: Math.min(tagResult.confidence || 0.5, categoryResult.confidence || 0.5),
        reason: tagResult.reason || 'No specific indicators detected - classified as Other'
    };
}

// Mock the tag mapping system
function getTagMapping() {
    // This should match what's in localStorage
    return {
        other: {
            'credit card': 'Other',
            charity: 'Gift'
        },
        groceries: {
            supermarket: 'Groceries'
        }
    };
}

// Mock validation function
function validateTagAgainstRules(transaction, tag) {
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    console.log(`   Validating tag "${tag}" for category "${category}", subcategory "${subcategory}"`);

    if (tag === 'investments') {
        // Check if this should actually be an investment
        if (category === 'other' && subcategory === 'credit card') {
            console.log(`   ❌ Investment tag invalid: credit card transactions should not be investments`);
            return false;
        }
        // Add other investment validation logic here
    }

    return true; // For this debug, assume other tags are valid
}

// Mock category assignment
function assignCategory(transaction) {
    return {
        category: transaction.category || 'Other',
        subcategory: transaction.subcategory || 'other',
        confidence: 0.5
    };
}

// Mock tag assignment
function assignTag(transaction) {
    const description = (transaction.description || '').toLowerCase();

    // Check for savings
    if (description.includes('bunq')) {
        return { tag: 'Savings', confidence: 0.9, reason: 'Bunq detected' };
    }

    // Check for investments
    if (description.includes('degiro') || description.includes('flatex')) {
        return { tag: 'Investments', confidence: 0.8, reason: 'Investment platform detected' };
    }

    // Check for charity
    if (description.includes('charity') || description.includes('donation')) {
        return { tag: 'Gift', confidence: 0.8, reason: 'Charity detected' };
    }

    return { tag: 'Other', confidence: 0.5, reason: 'No specific indicators detected' };
}

// Test the problematic transaction
const testTransaction = {
    description: 'Credit card payment',
    category: 'Other',
    subcategory: 'credit card',
    amount: -1000,
    tag: 'Investments' // This should be changed to 'Other'
};

console.log('\n🧪 Testing the problematic transaction:');
const result = classifyTransaction(testTransaction);

console.log(`\n📊 FINAL RESULT:`);
console.log(`   Input tag: ${testTransaction.tag}`);
console.log(`   Output tag: ${result.tag}`);
console.log(`   Reason: ${result.reason}`);
console.log(`   Confidence: ${result.confidence}`);

if (result.tag !== testTransaction.tag) {
    console.log(`   ✅ FIXED: ${testTransaction.tag} → ${result.tag}`);
} else {
    console.log(`   ❌ NOT FIXED: Still ${result.tag}`);
}

console.log('\n🔍 Debugging questions:');
console.log('1. Is the tag mapping being loaded correctly?');
console.log('2. Is the category/subcategory matching exactly?');
console.log('3. Is there a higher priority rule overriding the mapping?');
console.log('4. Is the mapping being saved to localStorage correctly?');
