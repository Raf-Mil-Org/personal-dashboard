<script setup>
import { useMultiFormatParser } from '@/composables/useMultiFormatParser';
import { useTransactionStore } from '@/composables/useTransactionStore';
import { getColumnDisplayName } from '@/data/columnMapping';
import { getTagSeverity, getTagValue, getTagIcon } from '@/utils/tagColors';
import { formatAmountWithType } from '@/utils/transactionTypeDetermination';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

// Composables
const { parseTransactions, removeDuplicates, parseError } = useMultiFormatParser();
const toast = useToast();
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
    loadCustomTags,
    updateTransactionTag,
    getTagStatistics,
    exportTaggedData,
    setTransactions,
    loadSavedTransactions,
    mergeTransactions,
    saveLastUploadInfo,
    getLastUploadInfo,
    clearAllData,
    debugCheckDuplicates
} = useTransactionStore();

// Local state
const showTransactionDialog = ref(false);
const selectedTransaction = ref(null);
const showClearDataDialog = ref(false);
const showDocumentation = ref(false);
const searchTerm = ref(''); // Search term for filtering transactions
const customTags = ref([]); // Custom tags for color mapping

const netAmount2 = computed(() => {
    return incomes.value - expenses.value;
});

const transactionsNumber = computed(() => {
    return searchFilteredTransactions.value.length;
});

const expenses = computed(() => {
    let sum = 0;
    const temp = searchFilteredTransactions.value.filter((transaction) => transaction.debit_credit === 'debit').map((transaction) => transaction.amount);
    temp.forEach((amount) => {
        const amount2 = amount.replace('-', '');
        sum += parseFloat(amount2);
    });
    return sum;
});

const incomes = computed(() => {
    let sum = 0;
    const temp = searchFilteredTransactions.value.filter((transaction) => transaction.debit_credit === 'credit').map((transaction) => transaction.amount);
    temp.forEach((amount) => {
        const amount2 = amount.replace('-', '');
        sum += parseFloat(amount2);
    });

    // const kalerer = searchFilteredTransactions.value.find((transaction) => transaction.description === 'ABN AMRO BANK');
    const kalerer = searchFilteredTransactions.value.findIndex((transaction) => transaction.description === 'ABN AMRO BANK');
    console.log(kalerer);
    console.log(kalerer);
    const previousBalance = searchFilteredTransactions.value[kalerer];
    // return previousBalance;
    return sum;
});

// Methods
const onFileSelect = async (event) => {
    const file = event.files[0];
    if (!file) return;

    try {
        isLoading.value = true;
        const text = await file.text();
        console.log('Raw file text:', text.substring(0, 200) + '...');

        // Parse transactions using the multi-format parser
        const parsedData = parseTransactions(text, file.name);
        console.log('Parsed data (first 2 rows):', parsedData.slice(0, 2));

        // Remove duplicates from the parsed data
        const { unique, duplicateCount } = removeDuplicates(parsedData);

        if (duplicateCount > 0) {
            console.log(`Found ${duplicateCount} duplicates in uploaded file`);
        }

        // Process transactions with existing tags using transaction IDs (now deterministic)
        const processedTransactions = unique.map((transaction) => ({
            ...transaction,
            tag: loadTags()[transaction.id] || transaction.tag || null
        }));

        // Check if we have existing transactions and merge them
        if (transactions.value.length > 0) {
            const result = mergeTransactions(processedTransactions);

            // Show user feedback about the merge
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
        console.error('Error parsing file:', error);
        console.error('Error parsing file: ' + error.message);

        // Show parse error if available
        if (parseError.value) {
            console.error('Parse error details:', parseError.value);
        }
    } finally {
        isLoading.value = false;
    }
};

// Reactive key for DataTable to force re-render when data changes
const tableKey = ref(0);

const updateTag = (transactionId, tag) => {
    console.log(`🏷️ TransactionAnalyzer: Updating tag for transaction ${transactionId} to: ${tag}`);
    updateTransactionTag(transactionId, tag);
    // Force table re-render
    tableKey.value++;

    // Show success message
    toast.add({
        severity: 'success',
        summary: 'Tag Updated',
        detail: `Transaction tagged as "${tag}"`,
        life: 3000
    });

    console.log(`✅ TransactionAnalyzer: Tag update completed for transaction ${transactionId}`);
};

const clearSearch = () => {
    searchTerm.value = '';
    console.log('🔍 Search cleared');
};

const loadCustomTagsForColors = () => {
    try {
        const saved = localStorage.getItem('customTags');
        if (saved) {
            customTags.value = JSON.parse(saved);
            console.log('✅ Loaded custom tags for colors:', customTags.value.length);
        }
    } catch (error) {
        console.error('Error loading custom tags for colors:', error);
        customTags.value = [];
    }
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

    // Format with sign (+ for positive, - for negative)
    const sign = num >= 0 ? '+' : '';
    const absoluteValue = Math.abs(num);
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(absoluteValue);

    return `${sign}${formattedValue}`;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

// Using getColumnDisplayName from columnMapping module

const formatFieldValue = (field, value) => {
    if (field === 'date') return formatDate(value);
    if (field === 'amount') return formatAmount(value);
    if (field === 'balance') return formatAmount(value);
    return value;
};

// Computed properties for statistics
const totalTransactions = computed(() => filteredTransactions.value.length);

// Computed property for search-filtered transactions
const searchFilteredTransactions = computed(() => {
    if (!searchTerm.value.trim()) {
        return filteredTransactions.value;
    }

    const searchLower = searchTerm.value.toLowerCase().trim();

    return filteredTransactions.value.filter((transaction) => {
        // Search in multiple fields
        const searchableFields = [transaction.description, transaction.tag, transaction.category, transaction.subcategory, transaction.amount, transaction.date, transaction.account, transaction.counterparty]
            .filter((field) => field != null)
            .map((field) => field.toString().toLowerCase());

        return searchableFields.some((field) => field.includes(searchLower));
    });
});

const tagStatistics = computed(() => {
    return getTagStatistics();
});

// Lifecycle
onMounted(() => {
    console.log('TransactionAnalyzer mounted - starting to load data...');

    loadColumnPreferences();
    console.log('Column preferences loaded');

    // Load custom tags for color mapping
    loadCustomTagsForColors();

    // Load custom tags into available tags dropdown
    loadCustomTags();

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
        <Toast />
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Transaction Analyzer</h1>
            <p class="text-gray-600">Upload and analyze your bank transaction CSV files</p>
        </div>

        <!-- File Upload Section -->
        <div class="card mb-6">
            <h2 class="text-xl font-semibold mb-4">📥 Upload Transaction File</h2>
            <div class="mb-4">
                <p class="text-gray-600 mb-2">Supported formats:</p>
                <ul class="text-sm text-gray-600 list-disc list-inside mb-4">
                    <li>CSV files (European bank transaction exports)</li>
                    <li>JSON files (with transaction data structure)</li>
                </ul>
            </div>
            <FileUpload :multiple="false" accept=".csv,.json" previewWidth :maxFileSize="10000000" @select="onFileSelect" chooseLabel="Choose File" cancelLabel="Cancel" :auto="true" class="w-full">
                <template #empty>
                    <div class="flex flex-col items-center justify-center p-6 text-gray-500">
                        <i class="pi pi-file-excel text-4xl mb-2"></i>
                        <p>Drag and drop your transaction file here or click to browse</p>
                        <p class="text-sm mt-1">Supports CSV and JSON formats</p>
                    </div>
                </template>
            </FileUpload>
            <div class="mt-4 flex gap-3">
                <Button label="Manage Tag Mappings" icon="pi pi-cog" @click="$router.push('/tag-mapping-manager')" size="small" class="bg-blue-500 hover:bg-blue-600" />
                <Button label="View Documentation" icon="pi pi-info-circle" @click="showDocumentation = true" size="small" class="bg-gray-500 hover:bg-gray-600" />
            </div>
        </div>

        <!-- Summary Statistics -->
        <div class="card">
            <h3 class="text-lg font-semibold mb-4">📈 Summary Statistics</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ transactionsNumber }}</div>
                    <div class="text-sm text-blue-800">Total Transactions</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ formatCurrency(incomes) }}</div>
                    <div class="text-sm text-green-800">Total Income</div>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">{{ formatCurrency(expenses) }}</div>
                    <div class="text-sm text-red-800">Total Expenses</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(netAmount2) }}</div>
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

                <!-- Search and Filter Controls -->
                <div class="flex flex-col md:flex-row gap-4 mb-4">
                    <div class="flex items-center gap-3">
                        <SelectButton v-model="selectedFilter" :options="filterOptions" optionLabel="label" optionValue="value" />
                        <Button v-if="searchTerm" @click="clearSearch" icon="pi pi-times" text size="small" v-tooltip.top="'Clear search'" />
                    </div>
                    <div class="flex justify-end">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="searchTerm" placeholder="Keyword Search" />
                        </IconField>
                    </div>
                </div>

                <div class="mb-4 flex justify-between items-center">
                    <div class="text-sm text-gray-600">Showing {{ searchFilteredTransactions.length }} of {{ filteredTransactions.length }} filtered transactions ({{ transactions.length }} total)</div>
                    <div class="flex items-center gap-3">
                        <Button label="Debug Duplicates" icon="pi pi-search" @click="debugCheckDuplicates" size="small" v-tooltip.top="'Check for duplicates in current transactions'" />
                        <Button label="Export Tagged Data" icon="pi pi-download" @click="exportTaggedData" size="small" />
                        <Button label="Clear All Data" icon="pi pi-trash" severity="danger" size="small" @click="confirmClearData" v-tooltip.top="'This will remove all transactions and settings'" />
                    </div>
                </div>

                <!-- <p>{{ JSON.stringify(transactions) }}</p> -->
                <p>Expenses: {{ expenses }}</p>
                <p>Incomes: {{ incomes }}</p>
                <!-- <p>{{ searchFilteredTransactions.filter((transaction) => transaction.debit_credit === 'debit').map((transaction) => transaction.amount) }}</p> -->
                <DataTable
                    :key="`transactions-${tableKey}`"
                    :value="searchFilteredTransactions"
                    :paginator="true"
                    :rows="20"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions"
                    :loading="isLoading"
                    stripedRows
                    class="w-full"
                >
                    <!-- Dynamic columns based on standard structure -->
                    <Column v-for="column in visibleColumns" :key="column" :field="column" :header="getColumnDisplayName(column)" :sortable="true" class="min-w-[120px]">
                        <template #body="{ data }">
                            <span v-if="column === 'amount'" class="font-mono" :class="formatAmountWithType(data[column], data).colorClass">
                                {{ formatAmountWithType(data[column], data).formatted }}
                            </span>
                            <span v-else-if="column === 'date'" class="font-mono">
                                {{ formatDate(data[column]) }}
                            </span>
                            <span v-else-if="column === 'tag'" class="flex items-center gap-2">
                                <Tag v-if="data[column]" :value="getTagValue(data[column])" :severity="getTagSeverity(data[column], customTags)" :icon="getTagIcon(data[column])" />
                                <span v-else class="text-gray-400 text-sm">No tag</span>
                            </span>
                            <span v-else-if="column === 'description'" class="truncate max-w-[200px] block">
                                {{ data[column] || '-' }}
                            </span>
                            <span v-else class="truncate max-w-[200px] block">
                                {{ data[column] || '-' }}
                            </span>
                        </template>
                    </Column>

                    <!-- Select Tag Column -->
                    <Column field="tag" header="Select Tag" :sortable="true" class="min-w-[150px]">
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <!-- <div class="flex-1">
                                    <Tag v-if="data.tag" :value="getTagValue(data.tag)" :severity="getTagSeverity(data.tag)" :icon="getTagIcon(data.tag)" class="cursor-pointer" @click="showTagDropdown(data)" />
                                    <span v-else class="text-gray-400 text-sm">No tag</span>
                                </div> -->
                                <Dropdown v-model="data.tag" :options="availableTags" placeholder="Select Category" @change="updateTag(data.id, data.tag)" class="w-32" />
                            </div>
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
                    <span v-if="key === 'tag'" class="text-gray-900">
                        <Tag v-if="value" :value="getTagValue(value)" :severity="getTagSeverity(value, customTags)" :icon="getTagIcon(value)" />
                        <span v-else class="text-gray-400">No tag assigned</span>
                    </span>
                    <span v-else class="text-gray-900">{{ formatFieldValue(key, value) }}</span>
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

        <!-- Documentation Dialog -->
        <Dialog v-model:visible="showDocumentation" modal header="Transaction Analyzer Documentation" :style="{ width: '800px' }">
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold mb-2">📁 Supported File Formats</h3>
                    <div class="space-y-3">
                        <div class="bg-gray-50 p-3 rounded">
                            <h4 class="font-medium">CSV Format</h4>
                            <p class="text-sm text-gray-600">Standard European bank transaction exports with columns like Date, Amount, Description, etc.</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <h4 class="font-medium">JSON Format</h4>
                            <p class="text-sm text-gray-600">Transaction data with structure including id, executionDate, amount, category, subcategory, etc.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">🏷️ Tag Mapping System</h3>
                    <p class="text-sm text-gray-600 mb-3">The system automatically assigns tags to transactions based on category and subcategory information:</p>
                    <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                        <li>If a transaction already has a tag, it will be preserved</li>
                        <li>If no tag exists, the system will map category/subcategory combinations to tags</li>
                        <li>You can customize these mappings in the Tag Mapping Manager</li>
                        <li>Default mappings cover common categories like Groceries, Transport, Dining, etc.</li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">🔄 Duplicate Detection</h3>
                    <p class="text-sm text-gray-600 mb-3">The system automatically detects and prevents duplicate transactions:</p>
                    <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                        <li>Uses transaction ID for JSON files</li>
                        <li>Creates fingerprints from date, amount, and description for CSV files</li>
                        <li>Duplicates are automatically filtered out during upload</li>
                        <li>No duplicate transactions are stored in local storage</li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-2">📊 Features</h3>
                    <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                        <li>Automatic tag assignment based on category/subcategory</li>
                        <li>Manual tag editing for individual transactions</li>
                        <li>Column visibility controls</li>
                        <li>Filtering by transaction type (income/expense)</li>
                        <li>Export functionality for tagged data</li>
                        <li>Statistics and category breakdown</li>
                    </ul>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end">
                    <Button label="Close" @click="showDocumentation = false" />
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
