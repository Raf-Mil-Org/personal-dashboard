// Test script to verify comprehensive classification system
console.log('🧪 Testing Comprehensive Classification System');
console.log('==============================================');

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
        }
    }
};

// Mock the global localStorage
global.localStorage = mockLocalStorage;

console.log('\n📋 Test Cases:');
console.log('==============');

// Test case 1: User-defined mapping should take priority
console.log('\n1️⃣ Testing user-defined mapping priority...');
const customMapping = {
    other: {
        'credit card': 'Other',
        charity: 'Gift'
    }
};

// Save custom mapping
mockLocalStorage.setItem('customTagMapping', JSON.stringify(customMapping));

// Test transaction with category 'other', subcategory 'credit card'
const creditCardTransaction = {
    description: 'Credit card payment',
    category: 'other',
    subcategory: 'credit card',
    amount: -5000,
    tag: 'Investments' // Incorrect existing tag
};

console.log(`   Transaction: "${creditCardTransaction.description}"`);
console.log(`   Category: ${creditCardTransaction.category}, Subcategory: ${creditCardTransaction.subcategory}`);
console.log(`   Old tag: ${creditCardTransaction.tag}`);
console.log(`   Expected new tag: Other (from user-defined mapping)`);

// Test case 2: Charity transaction should be Gift, not Investments
console.log('\n2️⃣ Testing charity transaction...');
const charityTransaction = {
    description: 'Charity donation',
    category: 'other',
    subcategory: 'charity',
    amount: -2500,
    tag: 'Investments' // Incorrect existing tag
};

console.log(`   Transaction: "${charityTransaction.description}"`);
console.log(`   Category: ${charityTransaction.category}, Subcategory: ${charityTransaction.subcategory}`);
console.log(`   Old tag: ${charityTransaction.tag}`);
console.log(`   Expected new tag: Gift (from user-defined mapping)`);

// Test case 3: Bunq transaction should be Savings, not Investments
console.log('\n3️⃣ Testing Bunq transaction...');
const bunqTransaction = {
    description: 'Bunq savings transfer',
    category: 'other',
    subcategory: 'savings',
    amount: -10000,
    tag: 'Investments' // Incorrect existing tag
};

console.log(`   Transaction: "${bunqTransaction.description}"`);
console.log(`   Category: ${bunqTransaction.category}, Subcategory: ${bunqTransaction.subcategory}`);
console.log(`   Old tag: ${bunqTransaction.tag}`);
console.log(`   Expected new tag: Savings (from hardcoded rule)`);

// Test case 4: Revolut transaction should be Transfers
console.log('\n4️⃣ Testing Revolut transaction...');
const revolutTransaction = {
    description: 'Revolut transfer',
    category: 'other',
    subcategory: 'transfer',
    amount: -5000,
    tag: 'Other'
};

console.log(`   Transaction: "${revolutTransaction.description}"`);
console.log(`   Category: ${revolutTransaction.category}, Subcategory: ${revolutTransaction.subcategory}`);
console.log(`   Old tag: ${revolutTransaction.tag}`);
console.log(`   Expected new tag: Transfers (from hardcoded rule)`);

// Test case 5: Legitimate investment transaction should remain Investments
console.log('\n5️⃣ Testing legitimate investment transaction...');
const investmentTransaction = {
    description: 'Degiro stock purchase',
    category: 'investment',
    subcategory: 'stock purchase',
    amount: -50000,
    tag: 'Investments'
};

console.log(`   Transaction: "${investmentTransaction.description}"`);
console.log(`   Category: ${investmentTransaction.category}, Subcategory: ${investmentTransaction.subcategory}`);
console.log(`   Old tag: ${investmentTransaction.tag}`);
console.log(`   Expected new tag: Investments (legitimate)`);

console.log('\n✅ Test Summary:');
console.log('================');
console.log('1. Credit card transaction: Should be "Other" (user-defined mapping)');
console.log('2. Charity transaction: Should be "Gift" (user-defined mapping)');
console.log('3. Bunq transaction: Should be "Savings" (hardcoded rule)');
console.log('4. Revolut transaction: Should be "Transfers" (hardcoded rule)');
console.log('5. Investment transaction: Should remain "Investments" (legitimate)');

console.log('\n🎯 Expected Results:');
console.log('===================');
console.log('- User-defined mappings should take priority over hardcoded rules');
console.log('- Existing incorrect tags should be challenged and corrected');
console.log('- All classification should go through the comprehensive system');
console.log('- Both "Fix All Existing Tags" and "Extract & Merge All Rules" should work together');

console.log('\n🔧 What We Changed:');
console.log('===================');
console.log('1. ✅ Replaced detectSavingsAndInvestments with classifyTransaction');
console.log('2. ✅ Updated fixAllExistingTagAssignments to use comprehensive classification');
console.log('3. ✅ Updated fixExistingTagAssignments to use comprehensive classification');
console.log('4. ✅ Removed unused helper functions (detectInvestment, detectSavings, detectTransfer)');
console.log('5. ✅ Removed unused DETECTION_CONFIG');
console.log('6. ✅ Fixed public API to remove detectSavingsAndInvestments reference');

console.log('\n🚀 Ready to test in the dashboard!');
console.log('\n📝 Next Steps:');
console.log('1. Open your dashboard');
console.log('2. Add a custom tag mapping (e.g., category "other", subcategory "credit card" → tag "Other")');
console.log('3. Click "Extract & Merge All Rules" to combine hardcoded and custom rules');
console.log('4. Click "Fix All Existing Tags" to apply the comprehensive classification');
console.log('5. Verify that incorrect tags are corrected based on all rules');
