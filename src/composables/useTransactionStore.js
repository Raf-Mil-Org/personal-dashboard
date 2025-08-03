// composables/useTransactionStore.js
import { computed, ref, watch } from 'vue';

// Storage keys
const STORAGE_KEYS = {
    COLUMN_PREFERENCES: 'transaction_analyzer_column_preferences',
    TAGS: 'transaction_analyzer_tags',
    FILTER_PREFERENCES: 'transaction_analyzer_filter_preferences',
    CSV_DATA: 'transaction_analyzer_csv_data',
    LAST_UPLOAD: 'transaction_analyzer_last_upload'
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
        { label: 'Income Transactions', value: 'income' }
    ];

    // Available tags for dropdown
    const availableTags = ref([...DEFAULT_TAGS]);

    // Computed properties
    const filteredTransactions = computed(() => {
        if (!transactions.value.length) return [];

        switch (selectedFilter.value) {
            case 'expenses':
                return transactions.value.filter((t) => {
                    // Expenses: transactions with 'Debit' value
                    const debitCredit = t['Debit/credit'] || t['debit/credit'] || t.debitCredit || '';
                    return debitCredit.trim().toLowerCase() === 'debit';
                });
            case 'income':
                return transactions.value.filter((t) => {
                    // Income: transactions with 'Credit' value
                    const debitCredit = t['Debit/credit'] || t['debit/credit'] || t.debitCredit || '';
                    return debitCredit.trim().toLowerCase() === 'credit';
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
        if (tag) {
            tags.value[transactionId] = tag;
        } else {
            delete tags.value[transactionId];
        }
        saveTags();

        // Update the transaction in the list
        const transaction = transactions.value.find((t) => t.id === transactionId);
        if (transaction) {
            transaction.tag = tag;
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
        console.log('📊 Calculating statistics for', transactions.value.length, 'transactions');

        let income = 0;
        let expenses = 0;

        transactions.value.forEach((transaction, index) => {
            // Handle European format amount with comma decimal separator
            const amountStr = transaction['Amount (EUR)'] || transaction.Amount || transaction.amount || '0';
            const amount = parseFloat(amountStr.replace(',', '.'));

            // Use 'Debit/credit' field to determine if it's income or expense
            const debitCredit = transaction['Debit/credit'] || transaction['debit/credit'] || transaction.debitCredit || '';
            const isIncome = debitCredit.trim().toLowerCase() === 'credit';

            console.log(`Transaction ${index + 1}:`, {
                amount: amountStr,
                parsedAmount: amount,
                isNaN: isNaN(amount),
                debitCredit: debitCredit,
                isIncome: isIncome,
                description: transaction['Name / Description'] || transaction.Description || 'No description',
                allKeys: Object.keys(transaction)
            });

            if (isNaN(amount)) {
                console.log(`  ⚠️ Skipping transaction with invalid amount: ${amountStr}`);
                return;
            }

            if (isIncome) {
                income += Math.abs(amount); // Use absolute value for consistency
                console.log(`  → Added to income: ${Math.abs(amount)} (Total income now: ${income})`);
            } else {
                expenses += Math.abs(amount); // Use absolute value for consistency
                console.log(`  → Added to expenses: ${Math.abs(amount)} (Total expenses now: ${expenses})`);
            }
        });

        // Update reactive values
        totalIncome.value = income;
        totalExpenses.value = expenses;
        netAmount.value = income - expenses;

        console.log('📈 Final totals:', {
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
            // Handle European format amount with comma decimal separator
            const amountStr = transaction['Amount (EUR)'] || transaction.Amount || transaction.amount || '0';
            const amount = parseFloat(amountStr.replace(',', '.'));
            tagStats[tag].total += amount;
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

    function setTransactions(newTransactions) {
        console.log('🔄 Setting transactions:', newTransactions.length);
        transactions.value = newTransactions;

        // Extract available columns from the first transaction
        if (newTransactions.length > 0) {
            const firstTransaction = newTransactions[0];
            const columns = Object.keys(firstTransaction).filter((key) => key !== 'id' && key !== 'tag');
            availableColumns.value = columns;

            // Set default visible columns if none are set
            if (visibleColumns.value.length === 0) {
                visibleColumns.value = [...columns];
            }
        }

        // Load existing tags for these transactions
        loadTags();

        // Save transactions to localStorage for persistence
        saveTransactionsToStorage(newTransactions);

        // Calculate statistics
        calculateStatistics();
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

                    // Extract available columns from the first transaction
                    if (data.transactions.length > 0) {
                        const firstTransaction = data.transactions[0];
                        const columns = Object.keys(firstTransaction).filter((key) => key !== 'id' && key !== 'tag');
                        availableColumns.value = columns;
                        console.log('📋 Available columns:', columns);

                        // Only set visible columns if no preferences were loaded
                        // This preserves user's saved column visibility preferences
                        if (visibleColumns.value.length === 0) {
                            visibleColumns.value = [...columns];
                            console.log('👁️ No saved preferences found, setting all columns visible:', visibleColumns.value);
                        } else {
                            console.log('👁️ Preserving saved column preferences:', visibleColumns.value);
                        }
                    }

                    // Load existing tags
                    loadTags();
                    console.log('🏷️ Tags loaded');

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

    function mergeTransactions(newTransactions) {
        const existingTransactions = transactions.value;
        const existingIds = new Set(existingTransactions.map((t) => t.id));

        const newUniqueTransactions = newTransactions.filter((t) => !existingIds.has(t.id));
        const duplicates = newTransactions.filter((t) => existingIds.has(t.id));

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate transactions, skipping them`);
        }

        if (newUniqueTransactions.length > 0) {
            const mergedTransactions = [...existingTransactions, ...newUniqueTransactions];
            transactions.value = mergedTransactions;
            saveTransactionsToStorage(mergedTransactions);

            // Update available columns if new transactions have different structure
            if (newUniqueTransactions.length > 0) {
                const allColumns = new Set();
                mergedTransactions.forEach((t) => {
                    Object.keys(t).forEach((key) => {
                        if (key !== 'id' && key !== 'tag') {
                            allColumns.add(key);
                        }
                    });
                });
                availableColumns.value = Array.from(allColumns);

                // Update visible columns to include new columns
                const newColumns = availableColumns.value.filter((col) => !visibleColumns.value.includes(col));
                if (newColumns.length > 0) {
                    visibleColumns.value = [...visibleColumns.value, ...newColumns];
                }
            }

            console.log(`Added ${newUniqueTransactions.length} new transactions`);

            // Calculate statistics after merging
            calculateStatistics();

            return {
                added: newUniqueTransactions.length,
                duplicates: duplicates.length,
                total: mergedTransactions.length
            };
        }

        return {
            added: 0,
            duplicates: duplicates.length,
            total: existingTransactions.length
        };
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
        mergeTransactions,
        getLastUploadInfo,
        saveLastUploadInfo,
        loadColumnPreferences,
        saveColumnPreferences,
        loadTags,
        saveTags,
        updateTransactionTag,
        addCustomTag,
        removeCustomTag,
        calculateStatistics,
        getTransactionsByTag,
        getTagStatistics,
        exportTaggedData,
        clearAllData,

        // API stubs
        saveColumnPreferencesToBackend,
        saveTagsToBackend
    };
}
