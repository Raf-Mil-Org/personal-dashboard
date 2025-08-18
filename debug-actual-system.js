// Debug script to check the actual system state
// This will help identify why tag mappings aren't working in the real system

console.log('🔍 Debug: Actual System State');
console.log('============================');

// Check what's actually in localStorage
console.log('\n📋 CHECKING LOCALSTORAGE:');
try {
    const customTagMapping = localStorage.getItem('customTagMapping');
    console.log('customTagMapping:', customTagMapping);

    if (customTagMapping) {
        const parsed = JSON.parse(customTagMapping);
        console.log('Parsed customTagMapping:', JSON.stringify(parsed, null, 2));

        // Check if the credit card mapping exists
        if (parsed.other && parsed.other['credit card']) {
            console.log('✅ Credit card mapping found:', parsed.other['credit card']);
        } else {
            console.log('❌ Credit card mapping NOT found');
            console.log('Available categories:', Object.keys(parsed));
            if (parsed.other) {
                console.log('Available subcategories in "other":', Object.keys(parsed.other));
            }
        }
    } else {
        console.log('❌ No customTagMapping found in localStorage');
    }
} catch (error) {
    console.log('❌ Error reading localStorage:', error.message);
}

// Check other relevant localStorage items
console.log('\n📋 OTHER LOCALSTORAGE ITEMS:');
const relevantKeys = ['transaction_analyzer_csv_data', 'transaction_analyzer_tags', 'customTagMapping'];

relevantKeys.forEach((key) => {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            console.log(`${key}: ${data.substring(0, 200)}...`);
        } else {
            console.log(`${key}: not found`);
        }
    } catch (error) {
        console.log(`${key}: error reading - ${error.message}`);
    }
});

// Check if we're in a browser environment
console.log('\n📋 ENVIRONMENT CHECK:');
console.log('typeof window:', typeof window);
console.log('typeof localStorage:', typeof localStorage);

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    console.log('✅ Browser environment detected');

    // Try to access the actual transaction engine
    console.log('\n📋 CHECKING TRANSACTION ENGINE:');
    try {
        // This would work in the browser console
        console.log('To check the actual transaction engine, run this in the browser console:');
        console.log('1. Open browser console on your dashboard');
        console.log('2. Run: console.log(localStorage.getItem("customTagMapping"))');
        console.log('3. Run: console.log(JSON.parse(localStorage.getItem("customTagMapping")))');
    } catch (error) {
        console.log('❌ Cannot access transaction engine in Node.js environment');
    }
} else {
    console.log('❌ Not in browser environment - cannot access localStorage');
}

console.log('\n🔍 TROUBLESHOOTING STEPS:');
console.log('1. Open your browser console on the dashboard page');
console.log('2. Run: localStorage.getItem("customTagMapping")');
console.log('3. Check if the mapping exists:');
console.log('   - Should contain: {"other": {"credit card": "Other"}}');
console.log('4. If mapping exists, check if transactions have correct category/subcategory');
console.log('5. Run "Fix All Existing Tags" and check console logs');

console.log('\n💡 POSSIBLE ISSUES:');
console.log('1. Mapping not saved to localStorage');
console.log('2. Category/subcategory case sensitivity (Other vs other)');
console.log('3. Transaction structure different than expected');
console.log('4. Higher priority rule overriding the mapping');
console.log('5. Mapping saved with different key name');
