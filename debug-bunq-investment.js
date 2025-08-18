// Debug script to identify why 'R MILIOPOULOS BUNQ' is tagged as 'Investments'
console.log('🔍 Debugging why "R MILIOPOULOS BUNQ" is tagged as "Investments"\n');

// Mock the transaction that's causing the issue
const problematicTransaction = {
    description: 'R MILIOPOULOS BUNQ',
    category: 'Other',
    subcategory: 'Savings',
    tag: 'Investments', // This is wrong!
    amount: '-50000', // 500 EUR in cents
    counterparty: 'NL28BUNQ2125534274'
};

console.log('📋 Problematic Transaction:');
console.log(JSON.stringify(problematicTransaction, null, 2));

// Check 1: Tag Mapping System
console.log('\n🔍 CHECK 1: Tag Mapping System');
const defaultTagMapping = {
    Other: {
        Savings: 'Savings', // This should map to Savings, not Investments!
        'Emergency fund': 'Savings',
        'Goal savings': 'Savings',
        Other: 'Other'
    },
    Savings: {
        'Savings account': 'Savings',
        'Emergency fund': 'Savings',
        'Goal savings': 'Savings',
        Other: 'Savings'
    },
    Investments: {
        // Only specific purchase transactions should be investments
        'Investment purchase': 'Investments',
        'Stock purchase': 'Investments',
        'Bond purchase': 'Investments',
        'ETF purchase': 'Investments',
        'Portfolio purchase': 'Investments',
        'Securities purchase': 'Investments',
        'Crypto purchase': 'Investments',
        'Mutual fund purchase': 'Investments',
        'Index fund purchase': 'Investments',
        // Generic categories should NOT automatically be investments
        Investment: 'Other',
        'Investment account': 'Other',
        'Stock market': 'Other',
        Crypto: 'Other',
        ETF: 'Other',
        'Mutual funds': 'Other',
        'Investment fee': 'Other',
        'Trading fee': 'Other',
        'Account fee': 'Other',
        'Withdrawal': 'Other',
        'Sale': 'Other',
        'Dividend': 'Other'
    }
};

// Simulate the determineTag function
function determineTag(category, subcategory, existingTag = null) {
    console.log('🔍 Determining tag for:', { category, subcategory, existingTag });

    // Priority 1: If there's already a tag, prioritize it
    if (existingTag && existingTag.trim()) {
        console.log('✅ Using existing tag:', existingTag.trim());
        return existingTag.trim();
    }

    // Priority 2: Try to map from category/subcategory combination
    if (category && subcategory && defaultTagMapping[category] && defaultTagMapping[category][subcategory]) {
        const mappedTag = defaultTagMapping[category][subcategory];
        console.log('🏷️ Mapped tag from category/subcategory:', mappedTag);
        return mappedTag;
    }

    // Priority 3: Try to map from just category (use first available subcategory)
    if (category && defaultTagMapping[category]) {
        const firstSubcategory = Object.keys(defaultTagMapping[category])[0];
        if (firstSubcategory) {
            const mappedTag = defaultTagMapping[category][firstSubcategory];
            console.log('🏷️ Mapped tag from category only:', mappedTag);
            return mappedTag;
        }
    }

    console.log('❌ No tag mapping found');
    return null;
}

console.log('\n🔍 Testing Tag Mapping:');
const mappedTag = determineTag(problematicTransaction.category, problematicTransaction.subcategory, problematicTransaction.tag);
console.log(`Result: ${mappedTag}`);

// Check 2: Auto-Detection System
console.log('\n🔍 CHECK 2: Auto-Detection System');

const DETECTION_CONFIG = {
    investments: {
        keywords: [
            'investment purchase', 'stock purchase', 'bond purchase', 'etf purchase',
            'mutual fund purchase', 'portfolio purchase', 'securities purchase',
            'trading purchase', 'brokerage purchase', '401k contribution',
            'ira contribution', 'roth contribution', 'index fund purchase',
            'dividend reinvestment'
        ],
        accountPatterns: [/degiro/i, /trading212/i, /etoro/i, /coinbase/i, /binance/i, /kraken/i, /interactive brokers/i, /fidelity/i, /vanguard/i, /schwab/i],
        subcategories: ['investment', 'investment account', 'stock market', 'crypto', 'etf', 'mutual funds']
    },
    savings: {
        keywords: ['savings', 'save', 'emergency fund', 'goal savings', 'deposit', 'contribution', 'reserve', 'nest egg', 'rainy day fund'],
        accountPatterns: [/bunq/i, /savings account/i, /emergency fund/i, /goal savings/i],
        subcategories: ['savings account', 'emergency fund', 'goal savings']
    }
};

function detectInvestment(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();
    const amount = parseInt(transaction.amount) || 0;

    console.log('🔍 Investment Detection Check:');
    console.log(`  Description: "${description}"`);
    console.log(`  Subcategory: "${subcategory}"`);
    console.log(`  Amount: ${amount} (${Math.abs(amount) / 100} EUR)`);
    console.log(`  Counterparty: "${counterparty}"`);

    // FAIL-SAFE CHECK 1: Only classify outgoing transactions as investments (negative amounts)
    if (amount >= 0) {
        console.log('  ❌ FAIL-SAFE 1: Positive amount - not investment');
        return false;
    }

    // FAIL-SAFE CHECK 2: Only classify transactions above a certain threshold as investments (to avoid small fees)
    const amountInEuros = Math.abs(amount) / 100;
    if (amountInEuros < 10) {
        console.log('  ❌ FAIL-SAFE 2: Small amount - not investment');
        return false;
    }

    // FAIL-SAFE CHECK 3: Comprehensive fee exclusion
    const feeKeywords = [
        'fee', 'commission', 'charge', 'cost', 'expense',
        'management fee', 'transaction fee', 'custody fee', 'rebalancing fee',
        'trading fee', 'brokerage fee', 'service charge', 'maintenance fee',
        'account fee', 'monthly fee', 'annual fee', 'withdrawal fee',
        'deposit fee', 'transfer fee', 'processing fee', 'handling fee',
        'custody', 'administration', 'platform fee', 'exchange fee'
    ];
    const hasFeeKeyword = feeKeywords.some((keyword) => description.includes(keyword));
    if (hasFeeKeyword) {
        console.log('  ❌ FAIL-SAFE 3: Fee-related - not investment');
        return false;
    }

    // FAIL-SAFE CHECK 4: Exclude withdrawals, sales, and transfers from investment accounts
    const withdrawalKeywords = [
        'withdrawal', 'withdraw', 'transfer out', 'sell', 'sale', 'redemption',
        'cash out', 'disposal', 'liquidation', 'exit', 'close position'
    ];
    const hasWithdrawalKeyword = withdrawalKeywords.some((keyword) => description.includes(keyword));
    if (hasWithdrawalKeyword) {
        console.log('  ❌ FAIL-SAFE 4: Withdrawal/sale - not investment');
        return false;
    }

    // FAIL-SAFE CHECK 5: Exclude tax-related transactions
    const taxKeywords = ['tax', 'withholding', 'dividend tax', 'capital gains'];
    const hasTaxKeyword = taxKeywords.some((keyword) => description.includes(keyword));
    if (hasTaxKeyword) {
        console.log('  ❌ FAIL-SAFE 5: Tax-related - not investment');
        return false;
    }

    // FAIL-SAFE CHECK 6: Exclude savings-related transactions
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    if (hasSavingsKeyword) {
        console.log('  ❌ FAIL-SAFE 6: Savings-related - not investment');
        return false;
    }

    // POSITIVE CHECK 1: Check for specific investment purchase keywords
    const investmentPurchaseKeywords = [
        'investment purchase', 'stock purchase', 'bond purchase', 'etf purchase',
        'mutual fund purchase', 'portfolio purchase', 'securities purchase',
        'trading purchase', 'brokerage purchase', '401k contribution',
        'ira contribution', 'roth contribution', 'index fund purchase',
        'dividend reinvestment', 'buy', 'purchase'
    ];
    const hasInvestmentPurchaseKeyword = investmentPurchaseKeywords.some((keyword) => description.includes(keyword));
    if (hasInvestmentPurchaseKeyword) {
        console.log('  ✅ POSITIVE 1: Investment purchase keyword found');
        return true;
    }

    // POSITIVE CHECK 2: Check subcategory (but only for specific purchase-related subcategories)
    const validInvestmentSubcategories = ['investment purchase', 'stock purchase', 'etf purchase', 'bond purchase'];
    if (validInvestmentSubcategories.includes(subcategory)) {
        console.log('  ✅ POSITIVE 2: Valid investment subcategory');
        return true;
    }

    // POSITIVE CHECK 3: Check account patterns with strict context validation
    const hasInvestmentAccount = DETECTION_CONFIG.investments.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty));
    if (hasInvestmentAccount) {
        console.log('  ⚠️ Investment account pattern found, but checking context...');
        // Only classify as investment if the transaction contains specific purchase keywords
        const strictInvestmentKeywords = ['purchase', 'buy', 'investment purchase', 'stock purchase', 'etf purchase'];
        const hasStrictInvestmentKeyword = strictInvestmentKeywords.some((keyword) => description.includes(keyword));
        if (hasStrictInvestmentKeyword) {
            console.log('  ✅ POSITIVE 3: Investment account + purchase keyword');
            return true;
        } else {
            console.log('  ❌ Investment account but no purchase keyword');
        }
    }

    console.log('  ❌ No investment criteria met');
    return false;
}

console.log('\n🔍 Testing Investment Detection:');
const isInvestment = detectInvestment(problematicTransaction);
console.log(`Investment Detection Result: ${isInvestment}`);

// Check 3: Savings Detection
console.log('\n🔍 CHECK 3: Savings Detection');

function detectSavings(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();
    const counterparty = (transaction.counterparty || '').toLowerCase();

    console.log('🔍 Savings Detection Check:');
    console.log(`  Description: "${description}"`);
    console.log(`  Subcategory: "${subcategory}"`);
    console.log(`  Counterparty: "${counterparty}"`);

    // Check subcategory first
    if (DETECTION_CONFIG.savings.subcategories.includes(subcategory)) {
        console.log('  ✅ Savings subcategory found');
        return true;
    }

    // Check keywords in description
    if (DETECTION_CONFIG.savings.keywords.some((keyword) => description.includes(keyword))) {
        console.log('  ✅ Savings keyword found');
        return true;
    }

    // Check account patterns
    if (DETECTION_CONFIG.savings.accountPatterns.some((pattern) => pattern.test(description) || pattern.test(counterparty))) {
        console.log('  ✅ Savings account pattern found');
        return true;
    }

    console.log('  ❌ No savings criteria met');
    return false;
}

const isSavings = detectSavings(problematicTransaction);
console.log(`Savings Detection Result: ${isSavings}`);

// Check 4: Priority System
console.log('\n🔍 CHECK 4: Priority System');

function detectSavingsAndInvestments(transaction) {
    const tag = (transaction.tag || '').toLowerCase();
    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category || '').toLowerCase();
    const subcategory = (transaction.subcategory || '').toLowerCase();

    console.log('🔍 Priority Detection Check:');
    console.log(`  Current tag: "${tag}"`);
    console.log(`  Description: "${description}"`);
    console.log(`  Category: "${category}"`);
    console.log(`  Subcategory: "${subcategory}"`);

    // Check if already tagged correctly
    if (tag === 'investments' || tag === 'savings' || tag === 'transfers') {
        console.log('  ✅ Already tagged correctly');
        return tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    // PRIORITY 1: Savings detection (highest priority to avoid misclassification)
    const savingsKeywords = ['savings', 'emergency fund', 'bunq', 'deposit', 'save', 'goal savings'];
    const hasSavingsKeyword = savingsKeywords.some((keyword) => description.includes(keyword));
    const isSavingsCategory = category === 'savings' || subcategory === 'savings' || subcategory === 'savings account' || subcategory === 'emergency fund';
    
    console.log(`  Savings keyword check: ${hasSavingsKeyword}`);
    console.log(`  Savings category check: ${isSavingsCategory}`);
    
    if (hasSavingsKeyword || isSavingsCategory) {
        if (detectSavings(transaction)) {
            console.log('  ✅ PRIORITY 1: Savings detected');
            return 'Savings';
        }
    }

    // PRIORITY 2: Transfer detection (before investments to avoid misclassification)
    const transferKeywords = ['transfer', 'internal transfer', 'account transfer', 'between accounts'];
    const hasTransferKeyword = transferKeywords.some((keyword) => description.includes(keyword));
    
    if (hasTransferKeyword && detectTransfer(transaction)) {
        console.log('  ✅ PRIORITY 2: Transfer detected');
        return 'Transfers';
    }

    // PRIORITY 3: Investment detection (most restrictive)
    if (detectInvestment(transaction)) {
        console.log('  ✅ PRIORITY 3: Investment detected');
        return 'Investments';
    }

    console.log('  ❌ No detection criteria met');
    return null;
}

function detectTransfer(transaction) {
    // Simplified transfer detection
    return false;
}

const priorityResult = detectSavingsAndInvestments(problematicTransaction);
console.log(`Priority Detection Result: ${priorityResult}`);

console.log('\n🎯 CONCLUSION:');
console.log('The transaction "R MILIOPOULOS BUNQ" should be detected as SAVINGS, not INVESTMENTS!');
console.log('The issue is likely in the priority system or a custom tag mapping override.');

