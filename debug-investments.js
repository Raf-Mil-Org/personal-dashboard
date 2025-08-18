// Debug script to investigate investment tag assignments
// This will help identify where the issue is coming from

console.log('🔍 Debugging Investment Tag Assignments\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
    console.log('Browser environment detected');

    // Check localStorage for custom tag mappings
    try {
        const customTagMapping = localStorage.getItem('customTagMapping');
        console.log('Custom tag mappings:', customTagMapping ? JSON.parse(customTagMapping) : 'None');
    } catch (error) {
        console.log('Error reading custom tag mappings:', error.message);
    }

    // Check for saved transactions
    try {
        const savedTransactions = localStorage.getItem('transaction_analyzer_csv_data');
        if (savedTransactions) {
            const data = JSON.parse(savedTransactions);
            console.log(`Found ${data.transactions?.length || 0} saved transactions`);

            // Analyze investment tags
            const investmentTransactions = data.transactions?.filter((t) => t.tag === 'Investments' || t.tag === 'investments') || [];

            console.log(`\n📊 Investment Analysis:`);
            console.log(`Total transactions: ${data.transactions?.length || 0}`);
            console.log(`Investment transactions: ${investmentTransactions.length}`);
            console.log(`Investment percentage: ${Math.round((investmentTransactions.length / (data.transactions?.length || 1)) * 100)}%`);

            // Show first 10 investment transactions
            console.log('\n🔍 First 10 Investment Transactions:');
            investmentTransactions.slice(0, 10).forEach((t, i) => {
                console.log(`${i + 1}. "${t.description}" (Tag: ${t.tag}, Category: ${t.category}, Subcategory: ${t.subcategory})`);
            });

            // Check for patterns in investment transactions
            const patterns = {};
            investmentTransactions.forEach((t) => {
                const desc = t.description.toLowerCase();
                if (desc.includes('fee')) patterns.fees = (patterns.fees || 0) + 1;
                if (desc.includes('commission')) patterns.commission = (patterns.commission || 0) + 1;
                if (desc.includes('charge')) patterns.charge = (patterns.charge || 0) + 1;
                if (desc.includes('tax')) patterns.tax = (patterns.tax || 0) + 1;
                if (desc.includes('bunq')) patterns.bunq = (patterns.bunq || 0) + 1;
                if (desc.includes('flatex')) patterns.flatex = (patterns.flatex || 0) + 1;
                if (desc.includes('degiro')) patterns.degiro = (patterns.degiro || 0) + 1;
            });

            console.log('\n🔍 Patterns in Investment Transactions:');
            Object.entries(patterns).forEach(([pattern, count]) => {
                console.log(`  ${pattern}: ${count} transactions`);
            });
        } else {
            console.log('No saved transactions found');
        }
    } catch (error) {
        console.log('Error reading saved transactions:', error.message);
    }
} else {
    console.log('Node.js environment detected');
    console.log('This script should be run in a browser to access localStorage');
}

// Show the current detection configuration
console.log('\n🔧 Current Detection Configuration:');
console.log('Investment keywords:', [
    'investment purchase',
    'stock purchase',
    'bond purchase',
    'etf purchase',
    'mutual fund purchase',
    'portfolio purchase',
    'securities purchase',
    'trading purchase',
    'brokerage purchase',
    '401k contribution',
    'ira contribution',
    'roth contribution',
    'index fund purchase',
    'dividend reinvestment'
]);

console.log('Fee keywords (should be excluded):', ['fee', 'commission', 'charge', 'cost', 'expense', 'management fee', 'transaction fee', 'custody fee', 'rebalancing fee', 'trading fee', 'brokerage fee']);

console.log('\n💡 Recommendations:');
console.log('1. Check if any transactions contain fee-related terms but are still tagged as investments');
console.log('2. Verify that the auto-detection is not running multiple times');
console.log('3. Check if there are any custom tag mappings that override the detection');
console.log('4. Look for transactions with investment-related keywords that should be expenses');

