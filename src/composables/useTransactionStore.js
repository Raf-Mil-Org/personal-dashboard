// composables/useTransactionStore.js
import { computed, ref, watch } from 'vue';
import { getAllStandardColumns, DEFAULT_VISIBLE_COLUMNS } from '@/data/columnMapping';

// Storage keys
const STORAGE_KEYS = {
    COLUMN_PREFERENCES: 'transaction_analyzer_column_preferences',
    TAGS: 'transaction_analyzer_tags',
    FILTER_PREFERENCES: 'transaction_analyzer_filter_preferences',
    CSV_DATA: 'transaction_analyzer_csv_data',
    LAST_UPLOAD: 'transaction_analyzer_last_upload'
};

// Persistent storage keys (never deleted)
const PERSISTENT_STORAGE_KEYS = {
    TOTAL_JSON_TRANSACTIONS: 'transaction_analyzer_persistent_total_json',
    TOTAL_CSV_TRANSACTIONS: 'transaction_analyzer_persistent_total_csv',
    TOTAL_DATATABLE_TRANSACTIONS: 'transaction_analyzer_persistent_total_datatable'
};

// Predefined tags
const DEFAULT_TAGS = ['Groceries', 'Utilities', 'Dining', 'Transport', 'Health', 'Entertainment', 'Subscriptions', 'Housing', 'Other'];

export function useTransactionStore() {
    // State
    const transactions = ref([]);
    const selectedFilter = ref('all');
    const visibleColumns = ref([]);
    const availableColumns = ref([]);
    const isLoading = ref(false);
    const tags = ref({}); // Map of transaction ID to tag

    // Statistics state
    const totalIncome = ref(0);
    const totalExpenses = ref(0);
    const netAmount = ref(0);

    // Filter options
    const filterOptions = [
        { label: 'All Transactions', value: 'all' },
        { label: 'Expense Transactions', value: 'expenses' },
        { label: 'Income Transactions', value: 'income' },
        { label: 'Untagged Transactions', value: 'untagged' }
    ];

    // Available tags for dropdown
    const availableTags = ref([...DEFAULT_TAGS]);

    // Persistent transaction count tracking functions
    function getPersistentCount(key) {
        try {
            const saved = localStorage.getItem(PERSISTENT_STORAGE_KEYS[key]);
            return saved ? parseInt(saved, 10) : 0;
        } catch (error) {
            console.error(`Error loading persistent count for ${key}:`, error);
            return 0;
        }
    }

    function updatePersistentCount(key, newCount) {
        try {
            const currentCount = getPersistentCount(key);
            const updatedCount = currentCount + newCount;
            localStorage.setItem(PERSISTENT_STORAGE_KEYS[key], updatedCount.toString());
            console.log(`📊 Updated persistent count for ${key}: ${currentCount} + ${newCount} = ${updatedCount}`);
            return updatedCount;
        } catch (error) {
            console.error(`Error updating persistent count for ${key}:`, error);
            return 0;
        }
    }

    function getPersistentCounts() {
        return {
            totalJsonTransactions: getPersistentCount('TOTAL_JSON_TRANSACTIONS'),
            totalCsvTransactions: getPersistentCount('TOTAL_CSV_TRANSACTIONS'),
            totalDatatableTransactions: getPersistentCount('TOTAL_DATATABLE_TRANSACTIONS')
        };
    }

    function logPersistentCounts() {
        const counts = getPersistentCounts();
        console.log('📊 Persistent Transaction Counts:', counts);
        return counts;
    }

    function resetPersistentCounts() {
        try {
            localStorage.removeItem(PERSISTENT_STORAGE_KEYS.TOTAL_JSON_TRANSACTIONS);
            localStorage.removeItem(PERSISTENT_STORAGE_KEYS.TOTAL_CSV_TRANSACTIONS);
            localStorage.removeItem(PERSISTENT_STORAGE_KEYS.TOTAL_DATATABLE_TRANSACTIONS);
            console.log('🔄 Reset all persistent transaction counts');
        } catch (error) {
            console.error('Error resetting persistent counts:', error);
        }
    }

    // Load custom tags and update available tags
    function loadCustomTags() {
        try {
            const saved = localStorage.getItem('customTags');
            if (saved) {
                const customTags = JSON.parse(saved);
                const customTagNames = customTags.map((tag) => tag.name);

                // Add custom tags to available tags if not already present
                customTagNames.forEach((tagName) => {
                    if (!availableTags.value.includes(tagName)) {
                        availableTags.value.push(tagName);
                    }
                });

                console.log('✅ Loaded custom tags into available tags:', customTagNames);
            }
        } catch (error) {
            console.error('Error loading custom tags:', error);
        }
    }

    // Watch for changes in transactions and recalculate statistics
    watch(
        transactions.value,
        () => {
            console.log('🔄 Transactions changed, recalculating statistics...');
            calculateStatistics();
        },
        { deep: true }
    );

    // Computed properties
    const filteredTransactions = computed(() => {
        if (!transactions.value.length) return [];

        switch (selectedFilter.value) {
            case 'expenses':
                return transactions.value.filter((t) => {
                    // Expenses: transactions with 'Debit' value
                    const debitCredit = t.debit_credit || '';
                    return debitCredit.trim().toLowerCase() === 'debit';
                });
            case 'income':
                return transactions.value.filter((t) => {
                    // Income: transactions with 'Credit' value
                    const debitCredit = t.debit_credit || '';
                    return debitCredit.trim().toLowerCase() === 'credit';
                });
            case 'untagged':
                return transactions.value.filter((t) => {
                    return t.tag === null || t.tag === '';
                });
            default:
                return transactions.value;
        }
    });

    // Methods
    function loadColumnPreferences() {
        try {
            console.log('🔍 Loading column preferences...');
            const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_PREFERENCES);
            console.log('Saved column preferences:', saved ? 'Found' : 'Not found');

            if (saved) {
                const preferences = JSON.parse(saved);
                console.log('Parsed preferences:', preferences);

                // Ensure visibleColumns is always an array
                visibleColumns.value = Array.isArray(preferences.visibleColumns) ? preferences.visibleColumns : [];
                console.log('✅ Loaded visible columns:', visibleColumns.value);
            } else {
                console.log('❌ No saved column preferences found');
            }
        } catch (error) {
            console.error('❌ Error loading column preferences:', error);
            visibleColumns.value = [];
        }
    }

    function saveColumnPreferences() {
        try {
            console.log('💾 Saving column preferences...');
            console.log('Visible columns to save:', visibleColumns.value);

            const preferences = {
                visibleColumns: visibleColumns.value,
                timestamp: Date.now()
            };

            const jsonData = JSON.stringify(preferences);
            console.log('JSON data to save:', jsonData);

            localStorage.setItem(STORAGE_KEYS.COLUMN_PREFERENCES, jsonData);

            // Verify the save worked
            const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_PREFERENCES);
            console.log('Verification - saved preferences exist:', !!saved);
            console.log('✅ Successfully saved column preferences');
        } catch (error) {
            console.error('❌ Error saving column preferences:', error);
        }
    }

    function loadTags() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
            if (saved) {
                tags.value = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading tags:', error);
            tags.value = {};
        }
        return tags.value;
    }

    function saveTags() {
        try {
            localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags.value));
        } catch (error) {
            console.error('Error saving tags:', error);
        }
    }

    function updateTransactionTag(transactionId, tag) {
        console.log(`🔄 Updating tag for transaction ${transactionId} to: ${tag}`);

        // Update tags object using transaction ID as key (now deterministic)
        if (tag) {
            tags.value[transactionId] = tag;
        } else {
            delete tags.value[transactionId];
        }
        saveTags();

        // Update the transaction in the list with proper reactivity
        const transactionIndex = transactions.value.findIndex((t) => t.id === transactionId);
        if (transactionIndex !== -1) {
            // Create a new transaction object to ensure reactivity
            const updatedTransaction = { ...transactions.value[transactionIndex], tag };
            transactions.value[transactionIndex] = updatedTransaction;

            console.log(`✅ Updated transaction at index ${transactionIndex}:`, {
                id: transactionId,
                oldTag: transactions.value[transactionIndex].tag,
                newTag: tag,
                description: updatedTransaction.description
            });

            // Recalculate statistics after tag update
            calculateStatistics();
        } else {
            console.warn(`⚠️ Transaction with ID ${transactionId} not found`);
        }
    }

    function addCustomTag(tagName) {
        if (!availableTags.value.includes(tagName)) {
            availableTags.value.push(tagName);
        }
    }

    function removeCustomTag(tagName) {
        if (DEFAULT_TAGS.includes(tagName)) {
            console.warn('Cannot remove default tag:', tagName);
            return;
        }

        const index = availableTags.value.indexOf(tagName);
        if (index > -1) {
            availableTags.value.splice(index, 1);
        }
    }

    function calculateStatistics() {
        let incomeCents = 0;
        let expensesCents = 0;

        filteredTransactions.value.forEach((transaction) => {
            // Amount is now stored in cents
            const amountCents = transaction.amount || 0;

            // Use 'debit_credit' field to determine if it's income or expense
            const debitCredit = transaction.debit_credit || '';
            const isIncome = debitCredit.trim().toLowerCase() === 'credit';

            if (isIncome) {
                incomeCents += Math.abs(amountCents); // Use absolute value for consistency
            } else {
                expensesCents += Math.abs(amountCents); // Use absolute value for consistency
            }
        });

        // Update reactive values (store in cents)
        totalIncome.value = incomeCents;
        totalExpenses.value = expensesCents;
        netAmount.value = incomeCents - expensesCents;

        console.log('📈 Final totals (in cents):', {
            totalIncome: totalIncome.value,
            totalExpenses: totalExpenses.value,
            totalTransactions: transactions.value.length,
            netAmount: netAmount.value
        });
    }

    function getTransactionsByTag(tag) {
        return filteredTransactions.value.filter((transaction) => transaction.tag === tag);
    }

    function getTagStatistics() {
        const tagStats = {};

        filteredTransactions.value.forEach((transaction) => {
            const tag = transaction.tag || 'Untagged';
            if (!tagStats[tag]) {
                tagStats[tag] = { count: 0, total: 0 };
            }
            tagStats[tag].count++;
            // Amount is now stored in cents
            const amountCents = transaction.amount || 0;
            tagStats[tag].total += amountCents;
        });

        return tagStats;
    }

    function exportTaggedData() {
        const dataToExport = filteredTransactions.value.map((transaction) => ({
            ...transaction,
            tag: transaction.tag || 'Untagged'
        }));

        const csvContent = convertToCSV(dataToExport);
        downloadCSV(csvContent, `tagged-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    }

    function convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Escape quotes and wrap in quotes if contains comma or quote
                        const escaped = String(value).replace(/"/g, '""');
                        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') ? `"${escaped}"` : escaped;
                    })
                    .join(',')
            )
        ];

        return csvRows.join('\n');
    }

    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function clearAllData() {
        transactions.value = [];
        visibleColumns.value = [];
        availableColumns.value = [];
        tags.value = {};
        selectedFilter.value = 'all';

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.COLUMN_PREFERENCES);
        localStorage.removeItem(STORAGE_KEYS.TAGS);
        localStorage.removeItem(STORAGE_KEYS.FILTER_PREFERENCES);
        localStorage.removeItem(STORAGE_KEYS.CSV_DATA);
        localStorage.removeItem(STORAGE_KEYS.LAST_UPLOAD);
    }

    // Debug function to check for duplicates in current transactions
    function debugCheckDuplicates() {
        console.log('🔍 Debug: Checking for duplicates in current transactions...');
        const ids = new Map();
        const duplicates = [];

        transactions.value.forEach((transaction, index) => {
            if (ids.has(transaction.id)) {
                const original = ids.get(transaction.id);
                duplicates.push({
                    original: { index: original.index, transaction: original.transaction },
                    duplicate: { index, transaction },
                    id: transaction.id
                });
            } else {
                ids.set(transaction.id, { index, transaction });
            }
        });

        if (duplicates.length > 0) {
            console.log(`🚨 Found ${duplicates.length} duplicate pairs:`, duplicates);
        } else {
            console.log('✅ No duplicates found in current transactions');
        }

        return duplicates;
    }

    function setTransactions(newTransactions) {
        console.log('🔄 Setting transactions:', newTransactions.length);

        // Track new datatable transactions (avoid duplicates)
        const existingTransactionIds = new Set(transactions.value.map((t) => t.id));

        // Count only truly new transactions
        const newUniqueTransactions = newTransactions.filter((t) => !existingTransactionIds.has(t.id));
        const newCount = newUniqueTransactions.length;

        if (newCount > 0) {
            updatePersistentCount('TOTAL_DATATABLE_TRANSACTIONS', newCount);
            console.log(`📊 Added ${newCount} new unique transactions to datatable`);
        }

        transactions.value = newTransactions;

        // Use standard columns for consistent data table
        availableColumns.value = getAllStandardColumns();

        // Set default visible columns if none are set
        if (visibleColumns.value.length === 0) {
            visibleColumns.value = [...DEFAULT_VISIBLE_COLUMNS];
        }

        // Load existing tags for these transactions
        loadTags();

        // Save transactions to localStorage for persistence
        saveTransactionsToStorage(newTransactions);

        // Calculate statistics
        calculateStatistics();

        // Log current persistent counts
        logPersistentCounts();
    }

    function loadSavedTransactions() {
        try {
            console.log('🔍 Attempting to load saved transactions...');
            const saved = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
            console.log('Saved data from localStorage:', saved ? 'Found' : 'Not found');

            if (saved) {
                const data = JSON.parse(saved);
                console.log('Parsed data:', data);

                if (Array.isArray(data.transactions)) {
                    console.log(`📊 Found ${data.transactions.length} transactions to load`);
                    transactions.value = data.transactions;

                    // Use standard columns for consistent data table
                    availableColumns.value = getAllStandardColumns();
                    console.log('📋 Available columns:', availableColumns.value);

                    // Only set visible columns if no preferences were loaded
                    // This preserves user's saved column visibility preferences
                    if (visibleColumns.value.length === 0) {
                        visibleColumns.value = [...DEFAULT_VISIBLE_COLUMNS];
                        console.log('👁️ No saved preferences found, setting default columns visible:', visibleColumns.value);
                    } else {
                        console.log('👁️ Preserving saved column preferences:', visibleColumns.value);
                    }

                    // Load existing tags
                    loadTags();
                    console.log('🏷️ Tags loaded');

                    // Apply saved tags to transactions using transaction IDs (now deterministic)
                    const savedTags = tags.value;
                    transactions.value = transactions.value.map((transaction) => ({
                        ...transaction,
                        tag: savedTags[transaction.id] || transaction.tag || null
                    }));
                    console.log('🏷️ Applied saved tags to transactions using transaction IDs');

                    // Calculate statistics
                    calculateStatistics();

                    console.log(`✅ Successfully loaded ${data.transactions.length} saved transactions`);
                    return true;
                } else {
                    console.log('❌ Data.transactions is not an array:', data.transactions);
                }
            } else {
                console.log('❌ No saved data found in localStorage');
            }
        } catch (error) {
            console.error('❌ Error loading saved transactions:', error);
        }
        return false;
    }

    function saveTransactionsToStorage(newTransactions) {
        try {
            console.log('💾 Saving transactions to localStorage...');
            console.log('Transactions to save:', newTransactions.length);

            const data = {
                transactions: newTransactions,
                timestamp: Date.now(),
                count: newTransactions.length
            };

            const jsonData = JSON.stringify(data);
            console.log('JSON data to save:', jsonData.substring(0, 200) + '...');

            localStorage.setItem(STORAGE_KEYS.CSV_DATA, jsonData);

            // Verify the save worked
            const saved = localStorage.getItem(STORAGE_KEYS.CSV_DATA);
            console.log('Verification - saved data exists:', !!saved);
            console.log(`✅ Successfully saved ${newTransactions.length} transactions to localStorage`);
        } catch (error) {
            console.error('❌ Error saving transactions to localStorage:', error);
        }
    }

    // Simplified JSON-first approach: iterate through JSON and enrich with CSV data
    function enrichJsonWithCsvData(jsonTransactions, csvTransactions) {
        console.log(`🔄 Enriching ${jsonTransactions.length} JSON transactions with ${csvTransactions.length} CSV transactions`);

        function isFirstWordInSecond(str1, str2) {
            if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;

            // Check if strings are exactly the same
            if (str1 === str2) return true;

            // Extract substring before the first space (or the full string if no space)
            const firstWord = str1.split(' ')[0];

            // Check if it's included in the second string
            return str2.includes(firstWord);
        }

        // Simple matching function using amount, date, and description
        function findMatchingCsvTransaction(jsonTransaction, csvTransactions) {
            const jsonAmount = jsonTransaction.amount; // Already in cents
            const jsonDate = jsonTransaction.date;
            const jsonDescription = jsonTransaction.description?.toLowerCase().trim();

            return csvTransactions.find((csvTransaction) => {
                const csvAmount = csvTransaction.amount; // Already in cents
                const csvDate = csvTransaction.date;
                const csvDescription = csvTransaction.description?.toLowerCase().trim();

                // Match on amount, date, and description
                const result = jsonAmount === csvAmount && jsonDate === csvDate && isFirstWordInSecond(jsonDescription, csvDescription);
                return result;
            });
        }

        // Debug: Check what fields are available in CSV transactions
        if (csvTransactions.length > 0) {
            console.log(`🔍 CSV transaction sample fields:`, Object.keys(csvTransactions[0]));
            console.log(`🔍 CSV transaction sample:`, csvTransactions[0]);
        }

        // Enrich each JSON transaction
        const enrichedTransactions = jsonTransactions.map((jsonTransaction) => {
            const matchingCsvTransaction = findMatchingCsvTransaction(jsonTransaction, csvTransactions);

            if (matchingCsvTransaction) {
                console.log(`✅ Found CSV match for: ${jsonTransaction.description} (${jsonTransaction.amount})`);
                console.log(`📊 CSV balance field:`, matchingCsvTransaction.balance);

                // Create enriched transaction starting with JSON data
                const enriched = { ...jsonTransaction };

                // Add CSV-specific fields that don't exist in JSON
                if (matchingCsvTransaction.account && !enriched.account) {
                    enriched.account = matchingCsvTransaction.account;
                }
                if (matchingCsvTransaction.counterparty && !enriched.counterparty) {
                    enriched.counterparty = matchingCsvTransaction.counterparty;
                }
                if (matchingCsvTransaction.code && !enriched.code) {
                    enriched.code = matchingCsvTransaction.code;
                }
                if (matchingCsvTransaction.transaction_type && !enriched.transaction_type) {
                    enriched.transaction_type = matchingCsvTransaction.transaction_type;
                }
                if (matchingCsvTransaction.notifications && !enriched.notifications) {
                    enriched.notifications = matchingCsvTransaction.notifications;
                }

                // Always add balance from CSV if it exists (overwrite null values)
                if (matchingCsvTransaction.balance) {
                    enriched.balance = matchingCsvTransaction.balance;
                    console.log(`💰 Added balance ${matchingCsvTransaction.balance} for: ${jsonTransaction.description}`);
                }

                // Store original data sources
                enriched.originalData = {
                    json: jsonTransaction.originalData || jsonTransaction,
                    csv: matchingCsvTransaction.originalData || matchingCsvTransaction
                };
                return enriched;
            } else {
                console.log(`⚠️ No CSV match found for: ${jsonTransaction.description} (${jsonTransaction.amount})`);
                // Keep JSON transaction as is
                if (!jsonTransaction.originalData) {
                    jsonTransaction.originalData = { json: jsonTransaction };
                }
                return jsonTransaction;
            }
        });

        const matchedCount = enrichedTransactions.filter((t) => t.originalData && t.originalData.csv).length;
        console.log(`📊 Enrichment complete: ${matchedCount} matched, ${enrichedTransactions.length - matchedCount} unmatched`);

        return enrichedTransactions;
    }

    function getLastUploadInfo() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.LAST_UPLOAD);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading last upload info:', error);
        }
        return null;
    }

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

    // API stubs for future backend integration
    async function saveColumnPreferencesToBackend() {
        try {
            // TODO: Implement backend API call
            console.log('Saving column preferences to backend...');
            const response = await fetch('/api/preferences/columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferences: {
                        visibleColumns: visibleColumns.value,
                        timestamp: Date.now()
                    }
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving column preferences to backend:', error);
            return false;
        }
    }

    async function saveTagsToBackend() {
        try {
            // TODO: Implement backend API call
            console.log('Saving tags to backend...');
            const response = await fetch('/api/transactions/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tags: tags.value,
                    timestamp: Date.now()
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving tags to backend:', error);
            return false;
        }
    }

    // Watchers
    watch(
        visibleColumns,
        () => {
            saveColumnPreferences();
        },
        { deep: true }
    );

    watch(
        tags,
        () => {
            saveTags();
        },
        { deep: true }
    );

    // Initialize custom tags when store is created
    loadCustomTags();

    return {
        // State
        transactions,
        selectedFilter,
        visibleColumns,
        availableColumns,
        availableTags,
        isLoading,
        totalIncome,
        totalExpenses,
        netAmount,

        // Computed
        filteredTransactions,
        filterOptions,

        // Methods
        setTransactions,
        loadSavedTransactions,
        saveTransactionsToStorage,
        enrichJsonWithCsvData,
        getLastUploadInfo,
        saveLastUploadInfo,
        loadColumnPreferences,
        saveColumnPreferences,
        loadTags,
        saveTags,
        loadCustomTags,
        updateTransactionTag,
        addCustomTag,
        removeCustomTag,
        calculateStatistics,
        getTransactionsByTag,
        getTagStatistics,
        exportTaggedData,
        clearAllData,
        debugCheckDuplicates,

        // API stubs
        saveColumnPreferencesToBackend,
        saveTagsToBackend,

        // Persistent tracking functions
        getPersistentCounts,
        resetPersistentCounts
    };
}
