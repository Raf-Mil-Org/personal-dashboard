// Debug script to check case sensitivity issues
// This will help identify if the problem is with case matching

console.log('🔍 Debug: Category/Subcategory Case Sensitivity');
console.log('==============================================');

// Test different case variations
const testCases = [
    { category: 'Other', subcategory: 'credit card' },
    { category: 'other', subcategory: 'credit card' },
    { category: 'OTHER', subcategory: 'credit card' },
    { category: 'Other', subcategory: 'Credit Card' },
    { category: 'other', subcategory: 'Credit Card' },
    { category: 'Other', subcategory: 'CREDIT CARD' },
    { category: 'other', subcategory: 'CREDIT CARD' }
];

// Mock tag mapping (what should be in localStorage)
const tagMapping = {
    other: {
        'credit card': 'Other',
        charity: 'Gift'
    }
};

console.log('\n📋 Testing case sensitivity:');
console.log('Expected mapping structure:', JSON.stringify(tagMapping, null, 2));

testCases.forEach((testCase, index) => {
    const { category, subcategory } = testCase;
    const categoryLower = category.toLowerCase();
    const subcategoryLower = subcategory.toLowerCase();

    console.log(`\n--- Test ${index + 1} ---`);
    console.log(`Input: category="${category}", subcategory="${subcategory}"`);
    console.log(`Lowercase: category="${categoryLower}", subcategory="${subcategoryLower}"`);

    // Check if mapping exists with original case
    const hasMappingOriginal = tagMapping[category] && tagMapping[category][subcategory];
    console.log(`Mapping with original case: ${hasMappingOriginal ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // Check if mapping exists with lowercase
    const hasMappingLower = tagMapping[categoryLower] && tagMapping[categoryLower][subcategoryLower];
    console.log(`Mapping with lowercase: ${hasMappingLower ? '✅ FOUND' : '❌ NOT FOUND'}`);

    if (hasMappingLower) {
        const mappedTag = tagMapping[categoryLower][subcategoryLower];
        console.log(`✅ Would map to: ${mappedTag}`);
    } else {
        console.log(`❌ No mapping found`);
    }
});

console.log('\n💡 INSIGHTS:');
console.log('1. The mapping is stored with lowercase keys: "other" and "credit card"');
console.log('2. The classification logic converts category/subcategory to lowercase');
console.log('3. This should work correctly for case-insensitive matching');
console.log('\n🔍 NEXT STEPS:');
console.log('1. Check if the mapping is actually saved in localStorage');
console.log('2. Check if the transaction category/subcategory values are what you expect');
console.log('3. Run this in browser console:');
console.log('   localStorage.getItem("customTagMapping")');
console.log('4. Check the actual transaction data structure');
