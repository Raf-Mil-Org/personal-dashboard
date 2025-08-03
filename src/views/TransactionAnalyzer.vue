<script setup>
import { useCSVParser } from '@/composables/useCSVParser';
import { useTransactionStore } from '@/composables/useTransactionStore';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import SelectButton from 'primevue/selectbutton';
import { computed, onMounted, ref, watch } from 'vue';

// Composables
const { parseCSV, generateTransactionId } = useCSVParser();
const {
    transactions,
    filteredTransactions,
    selectedFilter,
    filterOptions,
    availableColumns,
    visibleColumns,
    availableTags,
    isLoading,
    totalIncome,
    totalExpenses,
    netAmount,
    loadColumnPreferences,
    saveColumnPreferences,
    loadTags,
    updateTransactionTag,
    getTagStatistics,
    exportTaggedData,
    setTransactions,
    loadSavedTransactions,
    mergeTransactions,
    saveLastUploadInfo,
    getLastUploadInfo,
    clearAllData
} = useTransactionStore();

// Local state
const showTransactionDialog = ref(false);
const selectedTransaction = ref(null);
const showClearDataDialog = ref(false);

// Methods
const onFileSelect = async (event) => {
    const file = event.files[0];
    if (!file) return;

    try {
        isLoading.value = true;
        const text = await file.text();
        console.log('Raw CSV text:', text.substring(0, 200) + '...');

        const parsedData = parseCSV(text);
        console.log('Parsed data (first 2 rows):', parsedData.slice(0, 2));

        // Process transactions with IDs and tags
        const processedTransactions = parsedData.map((transaction) => ({
            ...transaction,
            id: generateTransactionId(transaction),
            tag: loadTags()[generateTransactionId(transaction)] || null
        }));

        // Check if we have existing transactions and merge them
        if (transactions.value.length > 0) {
            const result = mergeTransactions(processedTransactions);

            // Show user feedback about the merge (no alert)
            console.log(`Upload complete! Added: ${result.added} new transactions, Duplicates skipped: ${result.duplicates}, Total: ${result.total}`);
        } else {
            // First upload - set transactions directly
            setTransactions(processedTransactions);
            console.log(`Upload complete! Added: ${processedTransactions.length} transactions`);
        }

        // Save upload info
        saveLastUploadInfo(file.name, processedTransactions.length);

        // Debug: Log the state after setting transactions
        console.log('Available columns:', availableColumns.value);
        console.log('Visible columns:', visibleColumns.value);

        console.log('Successfully processed', processedTransactions.length, 'transactions');
        console.log('First transaction:', processedTransactions[0]);
    } catch (error) {
        console.error('Error parsing CSV:', error);
        console.error('Error parsing CSV: ' + error.message);
    } finally {
        isLoading.value = false;
    }
};

const updateTag = (transactionId, tag) => {
    updateTransactionTag(transactionId, tag);
};

const confirmClearData = () => {
    showClearDataDialog.value = true;
};

const handleClearData = () => {
    clearAllData();
    showClearDataDialog.value = false;
    console.log('All data has been cleared successfully!');
};

const viewTransactionDetails = (transaction) => {
    selectedTransaction.value = transaction;
    showTransactionDialog.value = true;
};

const formatDate = (date) => {
    if (!date || date === 'No Date') return 'No Date';
    // Handle YYYYMMDD format
    if (date.length === 8 && /^\d{8}$/.test(date)) {
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        return `${year}-${month}-${day}`;
    }
    return date;
};

const formatAmount = (amount) => {
    if (!amount || amount === 'No Amount') return 'No Amount';
    // Handle comma as decimal separator (European format)
    const cleanAmount = amount.toString().replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(num);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

const getColumnDisplayName = (column) => {
    const displayNames = {
        Date: 'Date',
        'Name / Description': 'Description',
        'Amount (EUR)': 'Amount',
        Counterparty: 'Counterparty',
        'Debit/credit': 'Type',
        'Transaction type': 'Transaction Type',
        Notifications: 'Notifications',
        'Resulting balance': 'Balance',
        Tag: 'Tag',
        Account: 'Account',
        Code: 'Code'
    };
    return displayNames[column] || column;
};

const formatFieldValue = (field, value) => {
    if (field === 'Date') return formatDate(value);
    if (field === 'Amount (EUR)' || field === 'Amount') return formatAmount(value);
    if (field === 'Resulting balance') return formatAmount(value);
    return value;
};

// Computed properties for statistics
const totalTransactions = computed(() => filteredTransactions.value.length);

const tagStatistics = computed(() => {
    return getTagStatistics();
});

// Lifecycle
onMounted(() => {
    console.log('TransactionAnalyzer mounted - starting to load data...');

    loadColumnPreferences();
    console.log('Column preferences loaded');

    // Try to load saved transactions from localStorage
    const hasSavedData = loadSavedTransactions();
    if (hasSavedData) {
        console.log('✅ Loaded saved transactions from localStorage');
        console.log('Transactions count:', transactions.value.length);
        console.log('Available columns:', availableColumns.value);
        console.log('Visible columns:', visibleColumns.value);

        // Show info about last upload if available
        const lastUpload = getLastUploadInfo();
        if (lastUpload) {
            console.log(`Last upload: ${lastUpload.filename} (${lastUpload.transactionCount} transactions) on ${new Date(lastUpload.timestamp).toLocaleDateString()}`);
        }
    } else {
        console.log('❌ No saved transactions found in localStorage');
    }
});

// Watch for filter changes
watch(selectedFilter, () => {
    // Filter logic is handled in the store
});

// Watch for column visibility changes to save preferences
watch(
    visibleColumns,
    () => {
        saveColumnPreferences();
    },
    { deep: true }
);
</script>

<template>
    <div class="transaction-analyzer p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Transaction Analyzer</h1>
            <p class="text-gray-600">Upload and analyze your bank transaction CSV files</p>
        </div>

        <!-- CSV Upload Section -->
        <div class="card mb-6">
            <h2 class="text-xl font-semibold mb-4">📥 Upload CSV File</h2>
            <FileUpload :multiple="false" accept=".csv" previewWidth :maxFileSize="10000000" @select="onFileSelect" chooseLabel="Choose CSV File" cancelLabel="Cancel" :auto="true" class="w-full">
                <template #empty>
                    <div class="flex flex-col items-center justify-center p-6 text-gray-500">
                        <i class="pi pi-file-excel text-4xl mb-2"></i>
                        <p>Drag and drop your CSV file here or click to browse</p>
                        <p class="text-sm mt-1">Supported format: European bank transaction CSV exports (semicolon-delimited)</p>
                    </div>
                </template>
            </FileUpload>
        </div>

        <!-- Summary Statistics -->
        <div class="card">
            <h3 class="text-lg font-semibold mb-4">📈 Summary Statistics</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ totalTransactions }}</div>
                    <div class="text-sm text-blue-800">Total Transactions</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ formatCurrency(totalIncome) }}</div>
                    <div class="text-sm text-green-800">Total Income</div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">{{ formatCurrency(totalExpenses) }}</div>
                    <div class="text-sm text-red-800">Total Expenses</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(netAmount) }}</div>
                    <div class="text-sm text-purple-800">Net Amount</div>
                </div>
            </div>
        </div>

        <!-- Tag Statistics -->
        <div class="card">
            <h3 class="text-lg font-semibold mb-4">🏷️ Category Breakdown</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="(stats, tag) in tagStatistics" :key="tag" class="bg-gray-50 p-3 rounded-lg">
                    <div class="font-medium text-gray-900">{{ tag || 'Untagged' }}</div>
                    <div class="text-sm text-gray-600">{{ stats.count }} transactions</div>
                    <div class="text-sm font-mono">{{ formatCurrency(stats.total) }}</div>
                </div>
            </div>
        </div>

        <!-- Controls Section (only show when data is loaded) -->
        <div v-if="transactions.length > 0" class="space-y-6">
            <!-- Column Visibility Control -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">✅ Column Visibility</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div v-for="column in availableColumns" :key="column" class="flex items-center space-x-2">
                        <Checkbox v-model="visibleColumns" :value="column" :inputId="`col-${column}`" />
                        <label :for="`col-${column}`" class="text-sm font-medium text-gray-700 cursor-pointer">
                            {{ getColumnDisplayName(column) }}
                        </label>
                    </div>
                </div>
            </div>

            <!-- Data Table -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">📊 Transaction Data</h3>
                <SelectButton v-model="selectedFilter" :options="filterOptions" optionLabel="label" optionValue="value" class="w-full md:w-auto" />
                <div class="mb-4 mt-3 flex justify-between items-center">
                    <div class="text-sm text-gray-600">Showing {{ filteredTransactions.length }} of {{ transactions.length }} transactions</div>
                    <div class="flex items-center gap-3">
                        <Button label="Export Tagged Data" icon="pi pi-download" @click="exportTaggedData" size="small" />
                        <Button label="Clear All Data" icon="pi pi-trash" severity="danger" size="small" @click="confirmClearData" v-tooltip.top="'This will remove all transactions and settings'" />
                    </div>
                </div>

                <DataTable
                    :value="filteredTransactions"
                    :paginator="true"
                    :rows="20"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions"
                    :loading="isLoading"
                    stripedRows
                    class="w-full"
                >
                    <!-- Dynamic columns based on CSV headers -->
                    <Column v-for="column in visibleColumns" :key="column" :field="column" :header="getColumnDisplayName(column)" :sortable="true" class="min-w-[120px]">
                        <template #body="{ data }">
                            <span v-if="column === 'Amount (EUR)' || column === 'Amount'" class="font-mono">
                                {{ formatAmount(data[column]) }}
                            </span>
                            <span v-else-if="column === 'Date'" class="font-mono">
                                {{ formatDate(data[column]) }}
                            </span>
                            <span v-else-if="column === 'Name / Description'" class="truncate max-w-[200px] block">
                                {{ data[column] }}
                            </span>
                            <span v-else class="truncate max-w-[200px] block">
                                {{ data[column] }}
                            </span>
                        </template>
                    </Column>

                    <!-- Tag Column -->
                    <Column field="tag" header="Category" :sortable="true" class="min-w-[150px]">
                        <template #body="{ data }">
                            <Dropdown v-model="data.tag" :options="availableTags" placeholder="Select Category" @change="updateTag(data.id, data.tag)" class="w-full" />
                        </template>
                    </Column>

                    <!-- Actions Column -->
                    <Column header="Actions" class="min-w-[100px]">
                        <template #body="{ data }">
                            <Button icon="pi pi-eye" size="small" text @click="viewTransactionDetails(data)" v-tooltip.top="'View Details'" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Transaction Details Dialog -->
        <Dialog v-model:visible="showTransactionDialog" modal header="Transaction Details" :style="{ width: '600px' }">
            <div v-if="selectedTransaction" class="space-y-4">
                <div v-for="(value, key) in selectedTransaction" :key="key" class="flex justify-between">
                    <span class="font-medium text-gray-700">{{ getColumnDisplayName(key) }}:</span>
                    <span class="text-gray-900">{{ formatFieldValue(key, value) }}</span>
                </div>
            </div>
        </Dialog>

        <!-- Clear Data Confirmation Dialog -->
        <Dialog v-model:visible="showClearDataDialog" modal header="Clear All Data" :style="{ width: '400px' }">
            <div class="space-y-4">
                <p class="text-gray-700">Are you sure you want to clear all transaction data? This action cannot be undone.</p>
                <p class="text-sm text-gray-500">This will remove all transactions, tags, and column preferences.</p>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <Button label="Cancel" @click="showClearDataDialog = false" text />
                    <Button label="Clear All Data" @click="handleClearData" severity="danger" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.transaction-analyzer {
    max-width: 1400px;
    margin: 0 auto;
}

.card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

:deep(.p-fileupload) {
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    transition: border-color 0.2s;
}

:deep(.p-fileupload:hover) {
    border-color: #3b82f6;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    font-weight: 600;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
    background-color: #f9fafb;
}

:deep(.p-dropdown) {
    min-width: 120px;
}

:deep(.p-selectbutton .p-button) {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
}
</style>
