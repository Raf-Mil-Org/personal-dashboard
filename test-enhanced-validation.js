// Test script to demonstrate enhanced tag validation
// This shows how existing tags are now challenged and corrected based on category/subcategory

console.log('🔍 Enhanced Tag Validation Test');
console.log('==============================');

// Mock the enhanced classification function
function classifyTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const existingTag = (transaction.tag || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // Validate existing tag against current rules and category/subcategory
    if (existingTag && existingTag !== 'untagged' && existingTag !== 'other') {
        const isExistingTagValid = validateTagAgainstRules(transaction, existingTag);
        if (isExistingTagValid) {
            return {
                tag: existingTag.charAt(0).toUpperCase() + existingTag.slice(1),
                confidence: 0.8,
                reason: `Validated existing tag: ${existingTag}`
            };
        } else {
            console.log(`⚠️ Invalidating existing tag for "${description}": ${existingTag} doesn't match current rules or category/subcategory`);
        }
    }

    // Apply new classification rules
    return assignTagBasedOnRules(transaction);
}

function validateTagAgainstRules(transaction, tag) {
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;

    const tagLower = tag.toLowerCase();

    switch (tagLower) {
        case 'savings': {
            const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
            const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
            const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account' || subcategory === 'emergency fund';
            return hasSavingsKeyword || isSavingsCategory;
        }

        case 'transfers': {
            const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
            const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
            const isTransferCategory = category === 'transfers' || subcategory === 'transfers' || subcategory === 'internal transfer';
            return hasTransferKeyword || isTransferCategory;
        }

        case 'investments': {
            // CRITICAL: Strict validation for investments
            if (!isInvestmentTransaction(transaction)) {
                return false;
            }

            // Additional category/subcategory validation for investments
            const validInvestmentCategories = ['investment', 'investments', 'financial'];
            const validInvestmentSubcategories = ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds', 'investment purchase', 'stock purchase', 'etf purchase', 'bond purchase'];

            const hasValidCategory = validInvestmentCategories.includes(category);
            const hasValidSubcategory = validInvestmentSubcategories.includes(subcategory);

            // If category/subcategory is explicitly set, it should match
            if (category && category !== 'other' && !hasValidCategory) {
                console.log(`❌ Investment tag invalid: category "${category}" doesn't match investment criteria`);
                return false;
            }

            if (subcategory && subcategory !== 'other' && !hasValidSubcategory) {
                console.log(`❌ Investment tag invalid: subcategory "${subcategory}" doesn't match investment criteria`);
                return false;
            }

            return true;
        }

        case 'gift': {
            const giftKeywords = ['gift', 'present', 'donation', 'charity'];
            const hasGiftKeyword = giftKeywords.some((keyword) => description.includes(keyword));
            const isGiftCategory = category === 'gift' || subcategory === 'charity' || subcategory === 'donation';
            return hasGiftKeyword || isGiftCategory;
        }

        case 'other':
            return true;

        default:
            console.log(`❌ Unknown tag "${tag}" - invalidating`);
            return false;
    }
}

function isInvestmentTransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;

    // Basic investment checks
    if (amount >= 0) return false;
    if (Math.abs(amount) / 100 < 10) return false;

    // Check for investment keywords
    const investmentKeywords = ['degiro', 'flatex', 'investment purchase', 'stock purchase'];
    return investmentKeywords.some((keyword) => description.includes(keyword));
}

function assignTagBasedOnRules(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    // Check for savings
    if (description.includes('bunq') || description.includes('savings')) {
        return { tag: 'Savings', reason: 'Savings indicators detected' };
    }

    // Check for charity/gift
    if (subcategory === 'charity' || description.includes('charity') || description.includes('donation')) {
        return { tag: 'Gift', reason: 'Charity/donation indicators detected' };
    }

    // Check for investments
    if (isInvestmentTransaction(transaction)) {
        return { tag: 'Investments', reason: 'Investment indicators detected' };
    }

    return { tag: 'Other', reason: 'No specific indicators detected' };
}

// Test transactions with existing tags that should be challenged
const testTransactions = [
    {
        description: 'Charity donation to Red Cross',
        category: 'Other',
        subcategory: 'charity',
        amount: -5000,
        tag: 'Investments' // ❌ Incorrect - should be challenged
    },
    {
        description: 'Bunq savings deposit',
        category: 'Other',
        subcategory: 'other',
        amount: -1000,
        tag: 'Investments' // ❌ Incorrect - should be challenged
    },
    {
        description: 'Donation to UNICEF',
        category: 'Gift',
        subcategory: 'charity',
        amount: -2500,
        tag: 'Investments' // ❌ Incorrect - should be challenged
    },
    {
        description: 'Investment purchase via Degiro',
        category: 'Investment',
        subcategory: 'investment purchase',
        amount: -10000,
        tag: 'Investments' // ✅ Correct - should be validated
    },
    {
        description: 'Regular grocery shopping',
        category: 'Groceries',
        subcategory: 'supermarket',
        amount: -500,
        tag: 'Investments' // ❌ Incorrect - should be challenged
    }
];

console.log('\n🧪 Testing enhanced tag validation:');

testTransactions.forEach((transaction, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    console.log(`Transaction: "${transaction.description}"`);
    console.log(`Category: ${transaction.category}, Subcategory: ${transaction.subcategory}`);
    console.log(`Current tag: ${transaction.tag}`);

    const classification = classifyTransaction(transaction);

    console.log(`\n📊 Classification result:`);
    console.log(`   New tag: ${classification.tag}`);
    console.log(`   Reason: ${classification.reason}`);

    if (classification.tag !== transaction.tag) {
        console.log(`   🔧 FIXED: ${transaction.tag} → ${classification.tag}`);
    } else {
        console.log(`   ✅ VALIDATED: Tag is correct`);
    }
});

console.log('\n💡 Key improvements:');
console.log('1. Existing tags are now validated against current rules');
console.log('2. Category/subcategory are used as validation criteria');
console.log('3. Investment tags are strictly validated');
console.log('4. Charity transactions with "charity" subcategory are properly tagged as Gift');
console.log('5. Bunq transactions are properly tagged as Savings');
console.log('\n🎯 This should fix the charity transaction issue you mentioned!');
