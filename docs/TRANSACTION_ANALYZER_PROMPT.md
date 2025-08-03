# 🧠 Updated Prompt: Build a Vue 3 Financial Transaction Analyzer Component (No CSV Library)

You are a senior frontend developer with deep expertise in Vue 3, PrimeVue, TailwindCSS, and building data-driven financial dashboards. You're building a fully interactive component to parse and analyze transaction data from a .csv bank export.

## 📦 Component: TransactionAnalyzer.vue

You will build a Vue 3 component using Composition API with the following features:

## 📥 1. CSV Upload and Native Parsing

Use PrimeVue's `<FileUpload>` component to allow CSV file uploads.

**IMPORTANT FIXES TO IMPLEMENT:**

-   Do not use any third-party CSV parsing libraries
-   **Handle multiple delimiters**: Automatically detect semicolon (`;`) vs comma (`,`) delimiters
-   **Support European CSV format**: Handle comma as decimal separator (e.g., `26,25` → `€26.25`)
-   **Handle European date format**: Convert YYYYMMDD to YYYY-MM-DD (e.g., `20250730` → `2025-07-30`)

Parse the file using vanilla JavaScript:

-   Split the CSV by newline and detect delimiter
-   Extract headers from the first row
-   Sanitize quotes and whitespace
-   Convert each row into an object with header-value pairs

## 🔍 2. Transaction Type Filter

Add a PrimeVue `<SelectButton>` above the table to let the user choose:

-   "All Transactions"
-   "Expense Transactions" → rows where amount is negative (handle European format)
-   "Income Transactions" → rows where amount is positive (handle European format)

**IMPORTANT FIXES TO IMPLEMENT:**

-   **European amount parsing**: Use `amountStr.replace(',', '.')` before `parseFloat()`
-   **Multiple field support**: Check `Amount (EUR)`, `Amount`, `amount` fields
-   Update the DataTable view based on the selected filter

## 📊 3. PrimeVue DataTable Display

Use `<DataTable>` to show the parsed and filtered transactions.

**IMPORTANT FIXES TO IMPLEMENT:**

-   Table columns should dynamically match the CSV headers
-   **Proper field mapping**: Map `Name / Description` → `Description`, `Amount (EUR)` → `Amount`
-   **Format display**: Use proper formatting for dates and amounts
-   Each row represents a transaction and should include:
    -   All visible columns
    -   An editable Tag dropdown (PrimeVue `<Dropdown>`) for assigning a category

## ✅ 4. Column Visibility Control

Above the table, display a set of checkboxes (one for each column header).

**CRITICAL FIXES TO IMPLEMENT:**

-   **Use correct PrimeVue Checkbox pattern**: `v-model="visibleColumns" :value="column"`
-   **DO NOT use**: `:modelValue="visibleColumns.includes(column)"` or manual array manipulation
-   **Add watcher for persistence**: `watch(visibleColumns, () => saveColumnPreferences(), { deep: true })`
-   **Ensure array initialization**: Always initialize `visibleColumns` as an empty array
-   **Safe array operations**: Use `Array.isArray()` checks before operations

Toggling a checkbox shows/hides that column in the table
Persist the column visibility preferences in localStorage
Add a placeholder method `saveColumnPreferencesToBackend()` for future backend sync

## 🆔 5. Transaction ID Generation

Each transaction must have a unique, consistent ID across CSV imports.

**IMPORTANT FIXES TO IMPLEMENT:**

-   Generate an ID by hashing 2–3 stable fields (e.g., Date + Amount + Description)
-   **Handle European format**: Use original amount string before parsing for consistency
-   **Example function**:

```javascript
function generateTransactionId(transaction) {
    const date = transaction.Date || transaction.date || '';
    const amount = transaction['Amount (EUR)'] || transaction.Amount || transaction.amount || '';
    const description = transaction['Name / Description'] || transaction.Description || '';

    const hashString = `${date}-${amount}-${description}`;
    const hash = btoa(hashString)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 12);

    return hash || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

## 🏷️ 6. Tag Management

Provide a predefined static list of tags:

```javascript
['Groceries', 'Utilities', 'Dining', 'Transport', 'Health', 'Entertainment', 'Subscriptions', 'Housing', 'Other'];
```

**IMPORTANT FIXES TO IMPLEMENT:**

-   Show a dropdown for each row's tag (editable)
-   **Load existing tags**: Use `loadTags()[transactionId]` when processing transactions
-   Save the tag assignment per transaction ID to localStorage
-   Add a stub `saveTagsToBackend()` for future integration

## 💾 7. Storage & Architecture

Use localStorage to store:

-   Column visibility preferences
-   Tag selections per transaction ID

**CRITICAL FIXES TO IMPLEMENT:**

-   **Safe localStorage operations**: Always wrap in try-catch blocks
-   **Array validation**: Use `Array.isArray()` before saving/loading arrays
-   **Default values**: Provide fallbacks for corrupted data

Use Vue 3 Composition API (`<script setup>`)
Structure reusable logic into composables (`useTransactionStore`, `useCSVParser`)

**IMPORTANT COMPOSABLE STRUCTURE:**

```javascript
// useCSVParser.js
export function useCSVParser() {
    function parseCSV(csvText) {
        // Detect delimiter (semicolon vs comma)
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;
        const delimiter = semicolonCount >= commaCount ? ';' : ',';

        // Parse with detected delimiter
        // Handle European format amounts and dates
    }

    function generateTransactionId(transaction) {
        // Use original amount string for consistency
    }
}

// useTransactionStore.js
export function useTransactionStore() {
    const visibleColumns = ref([]); // Always initialize as array

    function loadColumnPreferences() {
        try {
            const saved = localStorage.getItem('key');
            if (saved) {
                const preferences = JSON.parse(saved);
                visibleColumns.value = Array.isArray(preferences.visibleColumns) ? preferences.visibleColumns : [];
            }
        } catch (error) {
            visibleColumns.value = [];
        }
    }

    function getTransactionStatistics(transactionList) {
        // Handle European amount format
        transactionList.forEach((transaction) => {
            const amountStr = transaction['Amount (EUR)'] || transaction.Amount || '0';
            const amount = parseFloat(amountStr.replace(',', '.'));
            // ... rest of logic
        });
    }
}
```

Prepare API methods for:

-   `saveColumnPreferencesToBackend()`
-   `saveTagsToBackend()`

Use TailwindCSS for layout and responsive design

## 🛠️ Tech Stack

-   Vue 3 Composition API
-   PrimeVue: FileUpload, DataTable, Dropdown, SelectButton, Checkbox
-   TailwindCSS: styling
-   Vanilla JS: for CSV parsing and ID generation
-   localStorage: for persistence

## ⚠️ CRITICAL IMPLEMENTATION NOTES

### **European CSV Format Support:**

-   **Delimiter**: Semicolon (`;`) instead of comma (`,`)
-   **Decimal separator**: Comma (`,`) instead of period (`.`)
-   **Date format**: YYYYMMDD instead of YYYY-MM-DD
-   **Amount field**: `Amount (EUR)` instead of `Amount`
-   **Description field**: `Name / Description` instead of `Description`

### **PrimeVue Checkbox Pattern:**

```vue
<!-- CORRECT -->
<Checkbox v-model="visibleColumns" :value="column" />

<!-- WRONG - Causes iteration errors -->
<Checkbox :modelValue="visibleColumns.includes(column)" @update:modelValue="toggleColumn(column)" />
```

### **Array Safety:**

```javascript
// Always check if array before operations
if (!Array.isArray(visibleColumns.value)) {
    visibleColumns.value = [];
}

// Safe localStorage loading
visibleColumns.value = Array.isArray(preferences.visibleColumns) ? preferences.visibleColumns : [];
```

### **European Amount Parsing:**

```javascript
// Handle comma as decimal separator
const amountStr = transaction['Amount (EUR)'] || transaction.Amount || '0';
const amount = parseFloat(amountStr.replace(',', '.'));
```

### **Date Format Conversion:**

```javascript
// Convert YYYYMMDD to YYYY-MM-DD
if (date.length === 8 && /^\d{8}$/.test(date)) {
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${year}-${month}-${day}`;
}
```

### **Data Persistence & Duplicate Detection:**

```javascript
// Storage keys for localStorage
const STORAGE_KEYS = {
    COLUMN_PREFERENCES: 'transaction_analyzer_column_preferences',
    TAGS: 'transaction_analyzer_tags',
    CSV_DATA: 'transaction_analyzer_csv_data',
    LAST_UPLOAD: 'transaction_analyzer_last_upload'
};

// Load saved transactions on component mount
function loadSavedTransactions() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
        if (saved) {
            const data = JSON.parse(saved);
            if (Array.isArray(data.transactions)) {
                transactions.value = data.transactions;
                return true;
            }
        }
    } catch (error) {
        console.error('Error loading saved transactions:', error);
    }
    return false;
}

// Merge new transactions with existing ones, detecting duplicates
function mergeTransactions(newTransactions) {
    const existingTransactions = transactions.value;
    const existingIds = new Set(existingTransactions.map((t) => t.id));

    const newUniqueTransactions = newTransactions.filter((t) => !existingIds.has(t.id));
    const duplicates = newTransactions.filter((t) => existingIds.has(t.id));

    if (newUniqueTransactions.length > 0) {
        const mergedTransactions = [...existingTransactions, ...newUniqueTransactions];
        transactions.value = mergedTransactions;
        saveTransactionsToStorage(mergedTransactions);
    }

    return {
        added: newUniqueTransactions.length,
        duplicates: duplicates.length,
        total: transactions.value.length
    };
}

// Save upload information
function saveLastUploadInfo(filename, transactionCount) {
    try {
        const info = {
            filename,
            transactionCount,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.LAST_UPLOAD, JSON.stringify(info));
    } catch (error) {
        console.error('Error saving last upload info:', error);
    }
}
```

## 📝 File Structure

```
src/
├── views/
│   └── TransactionAnalyzer.vue
├── composables/
│   ├── useTransactionStore.js
│   └── useCSVParser.js
└── router/
    └── index.js (add route)
```

## 🔄 Update History

-   **2024-01-XX**: Initial implementation with European CSV format support
-   **2024-01-XX**: Fixed PrimeVue Checkbox binding issues
-   **2024-01-XX**: Added array safety checks and localStorage error handling
-   **2024-01-XX**: Implemented proper European amount and date parsing
-   **2024-01-XX**: Added CSV data persistence and duplicate detection
-   **2024-01-XX**: Implemented automatic data loading on page reload
-   **2024-01-XX**: Added upload history tracking and clear data functionality

---

**Note**: This prompt should be updated every time changes are made to the TransactionAnalyzer component or related functionality. Always document new fixes, improvements, and lessons learned.
