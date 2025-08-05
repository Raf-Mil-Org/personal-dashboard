// Standard column mapping for consistent data table rendering
export const STANDARD_COLUMNS = {
    // Core transaction fields
    id: 'id',
    date: 'date',
    amount: 'amount',
    currency: 'currency',
    description: 'description',
    type: 'type',
    category: 'category',
    subcategory: 'subcategory',
    tag: 'tag',
    
    // Additional fields that might be available
    account: 'account',
    counterparty: 'counterparty',
    code: 'code',
    debit_credit: 'debit_credit',
    transaction_type: 'transaction_type',
    notifications: 'notifications',
    balance: 'balance',
    
    // JSON-specific fields
    execution_date: 'executionDate',
    amount_value: 'amount.value',
    amount_currency: 'amount.currency',
    type_description: 'type.description',
    counter_account_name: 'counterAccount.name',
    subject: 'subject',
    sub_category: 'subCategory.description',
    
    // CSV-specific fields
    'Name / Description': 'description',
    'Amount (EUR)': 'amount',
    'Debit/credit': 'debit_credit',
    'Transaction type': 'transaction_type',
    'Resulting balance': 'balance'
};

// Column display names for the UI
export const COLUMN_DISPLAY_NAMES = {
    id: 'ID',
    date: 'Date',
    amount: 'Amount',
    currency: 'Currency',
    description: 'Description',
    type: 'Type',
    category: 'Category',
    subcategory: 'Subcategory',
    tag: 'Tag',
    account: 'Account',
    counterparty: 'Counterparty',
    code: 'Code',
    debit_credit: 'Type',
    transaction_type: 'Transaction Type',
    notifications: 'Notifications',
    balance: 'Balance'
};

// Default visible columns for the data table
export const DEFAULT_VISIBLE_COLUMNS = [
    'date',
    'description',
    'amount',
    'category',
    'subcategory',
    'tag'
];

// Column mapping functions for different formats
export const mapCSVToStandard = (csvTransaction) => {
    return {
        id: csvTransaction.id || null,
        date: csvTransaction.Date || csvTransaction.date || null,
        amount: csvTransaction['Amount (EUR)'] || csvTransaction.Amount || csvTransaction.amount || null,
        currency: csvTransaction.currency || 'EUR',
        description: csvTransaction['Name / Description'] || csvTransaction.Description || csvTransaction.description || null,
        type: csvTransaction.type || null,
        category: csvTransaction.category || null,
        subcategory: csvTransaction.subcategory || null,
        tag: csvTransaction.Tag || csvTransaction.tag || null, // Extract Tag column properly
        account: csvTransaction.Account || csvTransaction.account || null,
        counterparty: csvTransaction.Counterparty || csvTransaction.counterparty || null,
        code: csvTransaction.Code || csvTransaction.code || null,
        debit_credit: csvTransaction['Debit/credit'] || csvTransaction.debit_credit || null,
        transaction_type: csvTransaction['Transaction type'] || csvTransaction.transaction_type || null,
        notifications: csvTransaction.Notifications || csvTransaction.notifications || null,
        balance: csvTransaction['Resulting balance'] || csvTransaction.balance || null
    };
};

export const mapJSONToStandard = (jsonTransaction) => {
    return {
        id: jsonTransaction.id || null,
        date: jsonTransaction.executionDate || jsonTransaction.date || null,
        amount: jsonTransaction.amount?.value || jsonTransaction.amount || null,
        currency: jsonTransaction.amount?.currency || jsonTransaction.currency || 'EUR',
        description: jsonTransaction.subject || jsonTransaction.counterAccount?.name || jsonTransaction.description || null,
        type: jsonTransaction.type?.description || jsonTransaction.type || null,
        category: jsonTransaction.category?.description || jsonTransaction.category || null,
        subcategory: jsonTransaction.subCategory?.description || jsonTransaction.subcategory || null,
        tag: jsonTransaction.tag || null,
        account: jsonTransaction.account || null,
        counterparty: jsonTransaction.counterparty || null,
        code: jsonTransaction.code || null,
        debit_credit: jsonTransaction.debit_credit || null,
        transaction_type: jsonTransaction.transaction_type || null,
        notifications: jsonTransaction.notifications || null,
        balance: jsonTransaction.balance || null
    };
};

// Get all available standard columns
export const getAllStandardColumns = () => {
    return Object.keys(COLUMN_DISPLAY_NAMES);
};

// Get display name for a column
export const getColumnDisplayName = (column) => {
    return COLUMN_DISPLAY_NAMES[column] || column;
};

// Check if a column should be visible by default
export const isDefaultVisibleColumn = (column) => {
    return DEFAULT_VISIBLE_COLUMNS.includes(column);
};

// Intelligent category detection based on transaction description
export const detectCategoryFromDescription = (description) => {
    if (!description) return { category: null, subcategory: null };
    
    const desc = description.toLowerCase();
    
    // Groceries & household
    if (desc.includes('albert heijn') || desc.includes('lidl') || desc.includes('dirk') || 
        desc.includes('jumbo') || desc.includes('ah') || desc.includes('supermarket') ||
        desc.includes('pantopoleio') || desc.includes('bazaar')) {
        return { category: 'Groceries & household', subcategory: 'Groceries' };
    }
    
    // Restaurants & bars
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('bar') ||
        desc.includes('taverna') || desc.includes('kafeneio') || desc.includes('mezedopoleio') ||
        desc.includes('tsimbi') || desc.includes('koulouri') || desc.includes('yolo beach') ||
        desc.includes('kardaras') || desc.includes('patarlas') || desc.includes('agorastou') ||
        desc.includes('to limani') || desc.includes('mitropoulou') || desc.includes('anastasia') ||
        desc.includes('s mylonas') || desc.includes('kalamaki') || desc.includes('de tox') ||
        desc.includes('mentousa') || desc.includes('rodostalis') || desc.includes('project coffee') ||
        desc.includes('kipotheatro') || desc.includes('venetis') || desc.includes('boothuis') ||
        desc.includes('sensemilla') || desc.includes('monk') || desc.includes('psarrou') ||
        desc.includes('potsios') || desc.includes('hosein') || desc.includes('tsakmaki') ||
        desc.includes('kalogerakis') || desc.includes('papakrivopoulos') || desc.includes('coeo')) {
        return { category: 'Restaurants & bars', subcategory: 'Restaurants' };
    }
    
    // Transport & travel
    if (desc.includes('oasa') || desc.includes('eticket') || desc.includes('transport') ||
        desc.includes('metro') || desc.includes('bus') || desc.includes('train') ||
        desc.includes('transavia') || desc.includes('flight') || desc.includes('airport') ||
        desc.includes('uber') || desc.includes('taxi') || desc.includes('revolut') ||
        desc.includes('eko') || desc.includes('gas') || desc.includes('fuel')) {
        return { category: 'Transport & travel', subcategory: 'Public transport' };
    }
    
    // Health & Wellness
    if (desc.includes('farmacie') || desc.includes('pharmacy') || desc.includes('drugstore') ||
        desc.includes('wellness') || desc.includes('fitness') || desc.includes('sportcity') ||
        desc.includes('trikkalid') || desc.includes('beauty') || desc.includes('hair')) {
        return { category: 'Health & Wellness', subcategory: 'Pharmacy & drugstore' };
    }
    
    // Shopping
    if (desc.includes('shopping') || desc.includes('store') || desc.includes('shop') ||
        desc.includes('hondos') || desc.includes('duty free') || desc.includes('media') ||
        desc.includes('bol.com') || desc.includes('amazon') || desc.includes('danika') ||
        desc.includes('whsmith') || desc.includes('artisan')) {
        return { category: 'Shopping', subcategory: 'Clothes' };
    }
    
    // Fixed expenses
    if (desc.includes('mortgage') || desc.includes('insurance') || desc.includes('unive') ||
        desc.includes('zilveren kruis') || desc.includes('nn schadeverzekering') ||
        desc.includes('artsen zonder grenzen') || desc.includes('amazon eu') ||
        desc.includes('mediamarkt') || desc.includes('belastingdienst') ||
        desc.includes('kosten oranjepakket')) {
        return { category: 'Fixed expenses', subcategory: 'Insurance' };
    }
    
    // Other
    if (desc.includes('income') || desc.includes('salary') || desc.includes('salaris') ||
        desc.includes('abn amro bank')) {
        return { category: 'Other', subcategory: 'Income' };
    }
    
    // Savings & investments
    if (desc.includes('savings') || desc.includes('spaarrekening') || desc.includes('flatex') ||
        desc.includes('investment') || desc.includes('cash order')) {
        return { category: 'Other', subcategory: 'Savings' };
    }
    
    return { category: null, subcategory: null };
}; 