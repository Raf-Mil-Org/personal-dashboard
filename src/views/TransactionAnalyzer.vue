<script setup>
import { useMultiFormatParser } from '@/composables/useMultiFormatParser';
import { useTransactionStore } from '@/composables/useTransactionStore';
import { getColumnDisplayName } from '@/data/columnMapping';
import { formatCentsAsEuro, centsToEuroString } from '@/utils/currencyUtils';
import { getTagSeverity, getTagValue, getTagIcon } from '@/utils/tagColors';
import { formatAmountWithType } from '@/utils/transactionTypeDetermination';
import SavingsInvestmentDashboard from '@/components/SavingsInvestmentDashboard.vue';
import { getAvailablePeriods, calculateMonthlyStats, comparePeriods, calculateTotalStats } from '@/utils/monthlyReports';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Chip from 'primevue/chip';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

// Composables
const { parseTransactions, parseError } = useMultiFormatParser();
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
    totalSavings,
    totalInvestments,
    totalTransfers,
    netAmount,
    savingsRate,
    loadColumnPreferences,
    saveColumnPreferences,
    loadTags,
    loadCustomTags,
    updateTransactionTag,

    exportTaggedData,
    setTransactions,
    loadSavedTransactions,
    enrichJsonWithCsvData,
    saveLastUploadInfo,
    getLastUploadInfo,
    clearAllData,
    debugCheckDuplicates,
    getPersistentCounts,
    resetPersistentCounts,
    applySavingsInvestmentsDetection,
    getDetectionStatistics,
    manuallyOverrideTransaction
} = useTransactionStore();

// Local state
const showTransactionDialog = ref(false);
const selectedTransaction = ref(null);
const showClearDataDialog = ref(false);
const showDocumentation = ref(false);
const searchTerm = ref(''); // Search term for filtering transactions
const customTags = ref([]); // Custom tags for color mapping

// Date filtering state
const startDate = ref(null);
const endDate = ref(null);

// JSON-first approach state
const jsonTransactions = ref([]);
const csvTransactions = ref([]);
const hasJsonUploaded = ref(false);
const hasCsvUploaded = ref(false);

// Dashboard state
const showSavingsDashboard = ref(false);

// Period selection state
const selectedPeriod = ref('total'); // Default to "Total" option
const currentPeriodStats = ref(null);
const periodComparison = ref(null);

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

        // Process transactions with existing tags using transaction IDs (now deterministic)
        const processedTransactionsWithTags = parsedData.map((transaction) => ({
            ...transaction,
            tag: loadTags()[transaction.id] || transaction.tag || null
        }));

        // JSON-first approach: Store transactions based on file type
        console.log(`📁 Processing ${file.name} (${file.name.toLowerCase().endsWith('.json') ? 'JSON' : 'CSV'})`);

        if (file.name.toLowerCase().endsWith('.json')) {
            jsonTransactions.value = processedTransactionsWithTags;
            hasJsonUploaded.value = true;
            console.log('📋 JSON transactions stored:', jsonTransactions.value.length);

            // If CSV is already uploaded, enrich JSON with CSV data
            if (hasCsvUploaded.value) {
                console.log('🔄 Enriching JSON with CSV data...');
                const enrichedTransactions = enrichJsonWithCsvData(jsonTransactions.value, csvTransactions.value);
                setTransactions(enrichedTransactions);
                console.log('✅ Enriched transactions set:', enrichedTransactions.length);
            } else {
                // Set JSON transactions as base
                setTransactions(jsonTransactions.value);
                console.log('✅ JSON transactions set as base:', jsonTransactions.value.length);
            }
        } else if (file.name.toLowerCase().endsWith('.csv')) {
            csvTransactions.value = processedTransactionsWithTags;
            hasCsvUploaded.value = true;
            console.log('📋 CSV transactions stored:', csvTransactions.value.length);

            // If JSON is already uploaded, enrich JSON with CSV data
            if (hasJsonUploaded.value) {
                console.log('🔄 Enriching JSON with CSV data...');
                console.log('📊 Before enrichment - JSON count:', jsonTransactions.value.length, 'CSV count:', csvTransactions.value.length);
                const enrichedTransactions = enrichJsonWithCsvData(jsonTransactions.value, csvTransactions.value);
                setTransactions(enrichedTransactions);
                console.log('✅ Enriched transactions set:', enrichedTransactions.length);
                console.log('📊 After enrichment - Total transactions:', transactions.value.length);
            } else {
                // Set CSV transactions as base (fallback)
                setTransactions(csvTransactions.value);
                console.log('⚠️ CSV transactions set as base (JSON not uploaded yet):', csvTransactions.value.length);
            }
        }

        // Save upload info
        saveLastUploadInfo(file.name, processedTransactionsWithTags.length);

        // Debug: Log the state after setting transactions
        console.log('Available columns:', availableColumns.value);
        console.log('Visible columns:', visibleColumns.value);

        console.log('Successfully processed', processedTransactionsWithTags.length, 'transactions');
        console.log('First transaction:', processedTransactionsWithTags[0]);
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

const clearDateFilters = () => {
    startDate.value = null;
    endDate.value = null;
    console.log('📅 Date filters cleared');
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
    // Clear JSON-first approach state
    jsonTransactions.value = [];
    csvTransactions.value = [];
    hasJsonUploaded.value = false;
    hasCsvUploaded.value = false;
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

    // Amount is now stored in cents
    const amountCents = parseInt(amount);
    if (isNaN(amountCents)) return amount;

    // Format with sign (+ for positive, - for negative)
    const sign = amountCents >= 0 ? '+' : '';
    const absoluteValue = Math.abs(amountCents);
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
    }).format(absoluteValue / 100);

    return `${sign}${formattedValue}`;
};

const formatCurrency = (amount) => {
    // Amount is now stored in cents, convert to euros for display
    return formatCentsAsEuro(amount);
};

// Using getColumnDisplayName from columnMapping module

const formatFieldValue = (field, value) => {
    if (field === 'date') return formatDate(value);
    if (field === 'amount') return formatAmount(value);
    if (field === 'balance') return formatAmount(value);
    return value;
};

// Computed properties for statistics

// Helper function to check if a date is within the selected range
const isDateInRange = (transactionDate) => {
    if (!startDate.value && !endDate.value) {
        return true; // No date filter applied
    }

    if (!transactionDate) {
        return false; // No date in transaction
    }

    // Convert transaction date to Date object
    let transactionDateObj;
    if (typeof transactionDate === 'string') {
        // Handle YYYYMMDD format
        if (transactionDate.match(/^\d{8}$/)) {
            const year = transactionDate.substring(0, 4);
            const month = transactionDate.substring(4, 6);
            const day = transactionDate.substring(6, 8);
            transactionDateObj = new Date(`${year}-${month}-${day}`);
        } else {
            transactionDateObj = new Date(transactionDate);
        }
    } else {
        transactionDateObj = new Date(transactionDate);
    }

    if (isNaN(transactionDateObj.getTime())) {
        return false; // Invalid date
    }

    // Check start date
    if (startDate.value) {
        const startDateObj = new Date(startDate.value);
        if (transactionDateObj < startDateObj) {
            return false;
        }
    }

    // Check end date
    if (endDate.value) {
        const endDateObj = new Date(endDate.value);
        endDateObj.setHours(23, 59, 59, 999); // Include the entire end date
        if (transactionDateObj > endDateObj) {
            return false;
        }
    }

    return true;
};

// Computed property for search and date filtered transactions
const searchFilteredTransactions = computed(() => {
    let filtered = filteredTransactions.value;

    // Apply date filtering first
    filtered = filtered.filter((transaction) => isDateInRange(transaction.date));

    // Apply search filtering
    if (searchTerm.value.trim()) {
        const searchLower = searchTerm.value.toLowerCase().trim();

        filtered = filtered.filter((transaction) => {
            // Search in multiple fields
            const searchableFields = [
                transaction.description,
                transaction.tag,
                transaction.category,
                transaction.subcategory,
                transaction.date,
                transaction.account,
                transaction.counterparty,
                // Convert cents to euros for search
                transaction.amount ? centsToEuroString(transaction.amount) : null
            ]
                .filter((field) => field != null)
                .map((field) => field.toString().toLowerCase());

            return searchableFields.some((field) => field.includes(searchLower));
        });
    }

    return filtered;
});

// Computed property for tag statistics based on date-filtered transactions
const tagStatistics = computed(() => {
    const tagStats = {};

    searchFilteredTransactions.value.forEach((transaction) => {
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
});

// Persistent counts display
const persistentCounts = computed(() => {
    return getPersistentCounts();
});

// Detection statistics display
const detectionStats = computed(() => {
    return getDetectionStatistics();
});

// Basic computed properties
const hasTransactions = computed(() => transactions.value.length > 0);

// Available periods for selection
const availablePeriods = computed(() => {
    const periods = getAvailablePeriods();

    // Add "Total" option that aggregates all periods
    const totalOption = {
        name: 'Total (All Periods)',
        value: 'total',
        start: null,
        end: null,
        formattedRange: 'All Available Data'
    };

    return [totalOption, ...periods];
});

// Current period display name
const currentPeriodName = computed(() => {
    if (!selectedPeriod.value) return 'No Period Selected';

    if (selectedPeriod.value === 'total') {
        return 'Total (All Periods)';
    }

    const periodObj = availablePeriods.value.find((p) => p.value === selectedPeriod.value);
    return periodObj ? periodObj.name : 'Unknown Period';
});

// Period-filtered transactions for display
const periodFilteredTransactions = computed(() => {
    // Apply period filtering if a specific period is selected (not total)
    if (selectedPeriod.value && selectedPeriod.value !== 'total') {
        const selectedPeriodObj = availablePeriods.value.find((p) => p.value === selectedPeriod.value);
        if (selectedPeriodObj && selectedPeriodObj.start && selectedPeriodObj.end) {
            return filteredTransactions.value.filter((transaction) => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= selectedPeriodObj.start && transactionDate <= selectedPeriodObj.end;
            });
        }
    }

    // Return all filtered transactions for total view
    return filteredTransactions.value;
});

// Chart data for period-specific analysis
const tagBreakdownData = computed(() => {
    if (!currentPeriodStats.value) return { labels: [], datasets: [] };

    const tagStats = {};
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];

    // Get transactions for current period
    const periodTransactions = periodFilteredTransactions.value.filter((t) => {
        const amount = parseInt(t.amount) || 0;
        const tag = t.tag || 'Untagged';
        const description = t.description || '';

        // Only include expense transactions (negative amounts)
        if (amount >= 0) return false;

        // Exclude savings, investments, and transfers
        if (tag.toLowerCase() === 'savings' || description.toLowerCase().includes('bunq')) return false;
        if (tag.toLowerCase() === 'investments' || description.toLowerCase().includes('flatex')) return false;
        if (tag.toLowerCase() === 'transfers') return false;

        return true;
    });

    periodTransactions.forEach((transaction) => {
        const tag = transaction.tag || 'Untagged';
        const amount = Math.abs(parseInt(transaction.amount) || 0);

        if (!tagStats[tag]) {
            tagStats[tag] = { amount: 0, count: 0 };
        }
        tagStats[tag].amount += amount;
        tagStats[tag].count++;
    });

    const sortedData = Object.entries(tagStats)
        .map(([tagName, data], index) => ({
            tagName,
            amount: data.amount,
            count: data.count,
            color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    return {
        labels: sortedData.map((item) => item.tagName),
        datasets: [
            {
                data: sortedData.map((item) => item.amount / 100), // Convert cents to euros
                backgroundColor: sortedData.map((item) => item.color),
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };
});

// Category breakdown for expense analysis
const categoryMap = computed(() => {
    if (!currentPeriodStats.value) return {};

    const categoryStats = {};

    const periodTransactions = periodFilteredTransactions.value.filter((t) => {
        const amount = parseInt(t.amount) || 0;
        const tag = t.tag || 'Untagged';
        const description = t.description || '';

        // Only include expense transactions (negative amounts)
        if (amount >= 0) return false;

        // Exclude savings, investments, and transfers
        if (tag.toLowerCase() === 'savings' || description.toLowerCase().includes('bunq')) return false;
        if (tag.toLowerCase() === 'investments' || description.toLowerCase().includes('flatex')) return false;
        if (tag.toLowerCase() === 'transfers') return false;

        return true;
    });

    periodTransactions.forEach((transaction) => {
        const tag = transaction.tag || 'Untagged';
        const amount = Math.abs(parseInt(transaction.amount) || 0);

        if (!categoryStats[tag]) {
            categoryStats[tag] = { amount: 0, count: 0 };
        }
        categoryStats[tag].amount += amount;
        categoryStats[tag].count++;
    });

    return categoryStats;
});

// Top expense categories for chart
const topExpenseCategories = computed(() => {
    if (!currentPeriodStats.value) return [];

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];

    return Object.entries(categoryMap.value)
        .map(([tag, data], index) => ({
            tag,
            amount: data.amount,
            count: data.count,
            color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
});

// Top income categories for chart
const topIncomeCategories = computed(() => {
    if (!currentPeriodStats.value) return [];

    const incomeStats = {};
    const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548'];

    const periodTransactions = periodFilteredTransactions.value.filter((t) => {
        const amount = parseInt(t.amount) || 0;
        const tag = t.tag || 'Untagged';
        const description = t.description || '';

        // Only include income transactions (positive amounts)
        if (amount <= 0) return false;

        // Exclude savings, investments, and transfers from income
        if (description.toLowerCase().includes('bunq') || description.toLowerCase().includes('flatex')) return false;

        return true;
    });

    periodTransactions.forEach((transaction) => {
        const tag = transaction.tag || 'Untagged';
        const amount = Math.abs(parseInt(transaction.amount) || 0);

        if (!incomeStats[tag]) {
            incomeStats[tag] = { amount: 0, count: 0 };
        }
        incomeStats[tag].amount += amount;
        incomeStats[tag].count++;
    });

    return Object.entries(incomeStats)
        .map(([tagName, data], index) => ({
            tag: tagName,
            amount: data.amount,
            count: data.count,
            color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
});

// Income vs Expenses vs Savings chart data
const incomeExpenseData = computed(() => {
    if (!currentPeriodStats.value) return { labels: [], datasets: [] };

    const { totalIncome, totalExpenses, totalSavings, totalInvestments, totalTransfers } = currentPeriodStats.value.summary;

    return {
        labels: ['Income', 'Expenses', 'Savings', 'Investments', 'Transfers'],
        datasets: [
            {
                data: [totalIncome / 100, totalExpenses / 100, totalSavings / 100, totalInvestments / 100, totalTransfers / 100], // Convert cents to euros for chart
                backgroundColor: ['#4CAF50', '#F44336', '#2196F3', '#FF9800', '#9C27B0'],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };
});

// Savings and investments breakdown
const savingsInvestmentsData = computed(() => {
    if (!currentPeriodStats.value) return { labels: [], datasets: [] };

    const { totalSavings, totalInvestments, totalTransfers } = currentPeriodStats.value.summary;

    return {
        labels: ['Savings', 'Investments', 'Transfers'],
        datasets: [
            {
                data: [totalSavings / 100, totalInvestments / 100, totalTransfers / 100], // Convert cents to euros for chart
                backgroundColor: ['#2196F3', '#FF9800', '#9C27B0'],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };
});

// Chart options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    }
};

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

    // Initialize period stats if transactions are available
    if (hasTransactions.value && transactions.value && transactions.value.length > 0) {
        console.log('📊 Initializing period stats for available transactions...');
        selectedPeriod.value = 'total';
        loadPeriodStats();
    }
});

// Watch for filter changes
watch(selectedFilter, () => {
    // Filter logic is handled in the store
});

// Period selection methods
const handlePeriodSelection = (periodValue) => {
    // Add a subtle animation effect
    const chip = event?.target?.closest('.p-chip');
    if (chip) {
        chip.style.transform = 'scale(0.95)';
        setTimeout(() => {
            chip.style.transform = '';
        }, 150);
    }

    selectedPeriod.value = periodValue;
};

const exportPeriodData = () => {
    if (!currentPeriodStats.value) return;

    const data = {
        period: currentPeriodStats.value.period,
        summary: currentPeriodStats.value.summary,
        transactions: currentPeriodStats.value.transactions,
        comparison: periodComparison.value,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${currentPeriodStats.value.period.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const loadPeriodStats = () => {
    if (!selectedPeriod.value || !hasTransactions.value) {
        currentPeriodStats.value = null;
        periodComparison.value = null;
        return;
    }

    // Handle "Total" option
    if (selectedPeriod.value === 'total') {
        // Calculate stats for all available data
        currentPeriodStats.value = calculateTotalStats(transactions.value);
        periodComparison.value = null; // No comparison for total
        return;
    }

    // Find the selected period object
    const selectedPeriodObj = availablePeriods.value.find((p) => p.value === selectedPeriod.value);
    if (!selectedPeriodObj) {
        currentPeriodStats.value = null;
        periodComparison.value = null;
        return;
    }

    const { start, end } = selectedPeriodObj;
    currentPeriodStats.value = calculateMonthlyStats(transactions.value, start, end);

    // Calculate comparison with previous period
    const currentIndex = availablePeriods.value.findIndex((p) => p.value === selectedPeriod.value);
    if (currentIndex < availablePeriods.value.length - 1) {
        const previousPeriod = availablePeriods.value[currentIndex + 1];
        // Skip comparison if previous period is also "total"
        if (previousPeriod.value !== 'total') {
            const previousStats = calculateMonthlyStats(transactions.value, previousPeriod.start, previousPeriod.end);
            periodComparison.value = comparePeriods(currentPeriodStats.value, previousStats);
        } else {
            periodComparison.value = null;
        }
    } else {
        periodComparison.value = null;
    }
};

// Watch for period changes
watch(
    selectedPeriod,
    () => {
        if (hasTransactions.value) {
            loadPeriodStats();
        }
    },
    { immediate: true }
);

// Watch for transactions changes to automatically load stats when data becomes available
watch(
    transactions,
    (newTransactions) => {
        if (newTransactions && newTransactions.length > 0 && hasTransactions.value) {
            // Ensure "Total" is selected and load stats
            selectedPeriod.value = 'total';
            loadPeriodStats();
        }
    },
    { immediate: true }
);

// Watch for hasTransactions changes to load stats when transactions become available
watch(
    hasTransactions,
    (hasData) => {
        if (hasData && transactions.value && transactions.value.length > 0) {
            // Ensure "Total" is selected and load stats
            selectedPeriod.value = 'total';
            loadPeriodStats();
        }
    },
    { immediate: true }
);

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
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                <i class="pi pi-chart-bar text-3xl text-blue-500 mr-2"></i>
                Transaction Analyzer
            </h1>
            <p class="text-gray-600">Upload and analyze your bank transaction CSV files</p>
        </div>

        <!-- File Upload Section -->
        <div class="card mb-6">
            <h2 class="text-xl font-semibold mb-4">📥 Upload Transaction File (JSON-First Approach)</h2>

            <!-- Upload Status -->
            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-2">
                        <i class="pi" :class="hasJsonUploaded ? 'pi-check-circle text-green-600' : 'pi-circle text-gray-400'"></i>
                        <span :class="hasJsonUploaded ? 'text-green-700' : 'text-gray-600'">JSON Base Data</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="pi" :class="hasCsvUploaded ? 'pi-check-circle text-green-600' : 'pi-circle text-gray-400'"></i>
                        <span :class="hasCsvUploaded ? 'text-green-700' : 'text-gray-600'">CSV Enrichment</span>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">Upload JSON first for best results, then CSV to enrich with additional details</p>
            </div>

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
                <Button label="Log Persistent Counts" icon="pi pi-chart-bar" @click="() => console.log('📊 Persistent Counts:', getPersistentCounts())" size="small" class="bg-yellow-500 hover:bg-yellow-600" />
                <Button label="Reset Persistent Counts" icon="pi pi-refresh" @click="resetPersistentCounts" size="small" class="bg-red-500 hover:bg-red-600" />
                <Button label="Auto-Detect Savings/Investments" icon="pi pi-search" @click="applySavingsInvestmentsDetection" size="small" class="bg-green-500 hover:bg-green-600" />
                <Button label="Show Detection Stats" icon="pi pi-info-circle" @click="() => console.log('🔍 Detection Stats:', detectionStats)" size="small" class="bg-blue-500 hover:bg-blue-600" />
                <Button
                    :label="showSavingsDashboard ? 'Hide Savings Dashboard' : 'Show Savings Dashboard'"
                    :icon="showSavingsDashboard ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    @click="showSavingsDashboard = !showSavingsDashboard"
                    size="small"
                    class="bg-indigo-500 hover:bg-indigo-600"
                />
                <Button
                    label="Manual Override Demo"
                    icon="pi pi-edit"
                    @click="() => manuallyOverrideTransaction(transactions[0]?.id, 'Savings', 'Demo override')"
                    size="small"
                    class="bg-orange-500 hover:bg-orange-600"
                    :disabled="!transactions.length"
                />
            </div>
        </div>

        <!-- Period Selection -->
        <div v-if="hasTransactions" class="card mb-6">
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">
                        <i class="pi pi-calendar text-xl text-blue-500 mr-2"></i>
                        Period Selection
                    </h3>
                    <Button @click="exportPeriodData" :disabled="!currentPeriodStats" label="Export Report" icon="pi pi-download" severity="success" />
                </div>
                <div v-if="currentPeriodStats" class="text-center">
                    <p class="text-sm text-gray-600">
                        Currently viewing: <span class="font-semibold text-blue-600">{{ currentPeriodName }}</span>
                    </p>
                </div>
                <div class="flex flex-col gap-3">
                    <label class="text-sm font-medium text-gray-700">Select Period:</label>
                    <div class="flex flex-wrap gap-3">
                        <Chip
                            v-for="period in availablePeriods"
                            :key="period.value"
                            :data-period="period.value"
                            :class="[
                                'cursor-pointer transition-all duration-300 hover:scale-105 border-2 font-medium',
                                selectedPeriod === period.value ? 'bg-blue-500 text-white border-blue-500 shadow-lg' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                            ]"
                            @click="handlePeriodSelection(period.value)"
                        >
                            <template #default>
                                <div class="flex items-center gap-2">
                                    <i :class="[selectedPeriod === period.value ? 'pi pi-check' : 'pi pi-calendar', 'text-sm']"></i>
                                    <span>{{ period.name }}</span>
                                </div>
                            </template>
                        </Chip>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reports Content -->
        <div v-if="currentPeriodStats" class="space-y-6 mb-6">
            <!-- Period Summary Cards -->
            <div class="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <!-- Total Income -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-arrow-up text-3xl text-green-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Income</h3>
                            <p class="text-2xl font-bold text-green-600">
                                {{ formatCurrency(currentPeriodStats.summary.totalIncome) }}
                            </p>
                            <p class="text-sm text-gray-500">{{ currentPeriodStats.summary.incomeCount }} transactions</p>
                        </div>
                    </template>
                </Card>

                <!-- Total Expenses -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-arrow-down text-3xl text-red-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Expenses</h3>
                            <p class="text-2xl font-bold text-red-600">
                                {{ formatCurrency(currentPeriodStats.summary.totalExpenses) }}
                            </p>
                            <p class="text-sm text-gray-500">{{ currentPeriodStats.summary.expenseCount }} transactions</p>
                        </div>
                    </template>
                </Card>

                <!-- Total Savings -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-wallet text-3xl text-emerald-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Savings</h3>
                            <p class="text-2xl font-bold text-emerald-600">
                                {{ formatCurrency(currentPeriodStats.summary.totalSavings) }}
                            </p>
                            <p class="text-sm text-gray-500">{{ currentPeriodStats.summary.savingsCount }} transactions</p>
                        </div>
                    </template>
                </Card>

                <!-- Total Investments -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-chart-bar text-3xl text-amber-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Investments</h3>
                            <p class="text-2xl font-bold text-amber-600">
                                {{ formatCurrency(currentPeriodStats.summary.totalInvestments) }}
                            </p>
                            <p class="text-sm text-gray-500">{{ currentPeriodStats.summary.investmentCount }} transactions</p>
                        </div>
                    </template>
                </Card>
                <!-- </div> -->

                <!-- Savings & Investments Summary -->
                <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> -->
                <!-- Total Transfers -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-exchange text-3xl text-slate-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Transfers</h3>
                            <p class="text-2xl font-bold text-slate-600">
                                {{ formatCurrency(currentPeriodStats.summary.totalTransfers) }}
                            </p>
                            <p class="text-sm text-gray-500">{{ currentPeriodStats.summary.transferCount }} transactions</p>
                        </div>
                    </template>
                </Card>

                <!-- Savings Rate -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-percentage text-3xl text-purple-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Savings Rate</h3>
                            <p class="text-2xl font-bold text-purple-600">{{ currentPeriodStats.summary.savingsRate.toFixed(1) }}%</p>
                            <p class="text-sm text-gray-500">Savings / Income</p>
                        </div>
                    </template>
                </Card>

                <!-- Net Amount -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-wallet text-3xl text-blue-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Net Amount</h3>
                            <p class="text-2xl font-bold" :class="currentPeriodStats.summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'">
                                {{ formatCurrency(currentPeriodStats.summary.netAmount) }}
                            </p>
                            <p class="text-sm text-gray-500">Income - Expenses - Savings</p>
                        </div>
                    </template>
                </Card>

                <!-- Total Transactions -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-list text-3xl text-purple-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Transactions</h3>
                            <p class="text-2xl font-bold text-purple-600">
                                {{ currentPeriodStats.summary.totalTransactions }}
                            </p>
                            <p class="text-sm text-gray-500">All transactions</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Legacy Summary Statistics (for backward compatibility) -->
        <div v-if="!currentPeriodStats" class="card">
            <h3 class="text-lg font-semibold mb-4">
                <i class="pi pi-chart-bar text-xl text-blue-500 mr-2"></i>
                Summary Statistics
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ transactions.length }}</div>
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

            <!-- Savings and Investments Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div class="bg-emerald-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-emerald-600">{{ formatCurrency(totalSavings) }}</div>
                    <div class="text-sm text-emerald-800">Total Savings</div>
                </div>
                <div class="bg-amber-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-amber-600">{{ formatCurrency(totalInvestments) }}</div>
                    <div class="text-sm text-amber-800">Total Investments</div>
                </div>
                <div class="bg-slate-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-slate-600">{{ formatCurrency(totalTransfers) }}</div>
                    <div class="text-sm text-slate-800">Total Transfers</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ savingsRate.toFixed(1) }}%</div>
                    <div class="text-sm text-purple-800">Savings Rate</div>
                </div>
            </div>
        </div>

        <!-- Period Comparison -->
        <div v-if="periodComparison" class="card">
            <h3 class="text-lg font-semibold mb-4">
                <i class="pi pi-chart-line text-xl text-blue-500 mr-2"></i>
                Period Comparison
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <!-- Income Comparison -->
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-green-800">Income</span>
                        <i class="pi" :class="periodComparison.income.change >= 0 ? 'pi-arrow-up text-green-600' : 'pi-arrow-down text-red-600'"></i>
                    </div>
                    <div class="text-lg font-bold text-green-600">
                        {{ formatCurrency(periodComparison.income.current) }}
                    </div>
                    <div class="text-sm text-green-700">
                        {{ periodComparison.income.change >= 0 ? '+' : '' }}{{ formatCurrency(periodComparison.income.change) }} ({{ periodComparison.income.changePercent >= 0 ? '+' : '' }}{{ periodComparison.income.changePercent.toFixed(1) }}%)
                    </div>
                </div>

                <!-- Expenses Comparison -->
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-red-800">Expenses</span>
                        <i class="pi" :class="periodComparison.expenses.change >= 0 ? 'pi-arrow-up text-red-600' : 'pi-arrow-down text-green-600'"></i>
                    </div>
                    <div class="text-lg font-bold text-red-600">
                        {{ formatCurrency(periodComparison.expenses.current) }}
                    </div>
                    <div class="text-sm text-red-700">
                        {{ periodComparison.expenses.change >= 0 ? '+' : '' }}{{ formatCurrency(periodComparison.expenses.change) }} ({{ periodComparison.expenses.changePercent >= 0 ? '+' : ''
                        }}{{ periodComparison.expenses.changePercent.toFixed(1) }}%)
                    </div>
                </div>

                <!-- Savings Comparison -->
                <div class="bg-emerald-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-emerald-800">Savings</span>
                        <i class="pi" :class="periodComparison.savings.change >= 0 ? 'pi-arrow-up text-emerald-600' : 'pi-arrow-down text-red-600'"></i>
                    </div>
                    <div class="text-lg font-bold text-emerald-600">
                        {{ formatCurrency(periodComparison.savings.current) }}
                    </div>
                    <div class="text-sm text-emerald-700">
                        {{ periodComparison.savings.change >= 0 ? '+' : '' }}{{ formatCurrency(periodComparison.savings.change) }} ({{ periodComparison.savings.changePercent >= 0 ? '+' : '' }}{{ periodComparison.savings.changePercent.toFixed(1) }}%)
                    </div>
                </div>

                <!-- Investments Comparison -->
                <div class="bg-amber-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-amber-800">Investments</span>
                        <i class="pi" :class="periodComparison.investments.change >= 0 ? 'pi-arrow-up text-amber-600' : 'pi-arrow-down text-red-600'"></i>
                    </div>
                    <div class="text-lg font-bold text-amber-600">
                        {{ formatCurrency(periodComparison.investments.current) }}
                    </div>
                    <div class="text-sm text-amber-700">
                        {{ periodComparison.investments.change >= 0 ? '+' : '' }}{{ formatCurrency(periodComparison.investments.change) }} ({{ periodComparison.investments.changePercent >= 0 ? '+' : ''
                        }}{{ periodComparison.investments.changePercent.toFixed(1) }}%)
                    </div>
                </div>

                <!-- Savings Rate Comparison -->
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-purple-800">Savings Rate</span>
                        <i class="pi" :class="periodComparison.savingsRate.change >= 0 ? 'pi-arrow-up text-purple-600' : 'pi-arrow-down text-red-600'"></i>
                    </div>
                    <div class="text-lg font-bold text-purple-600">{{ periodComparison.savingsRate.current.toFixed(1) }}%</div>
                    <div class="text-sm text-purple-700">
                        {{ periodComparison.savingsRate.change >= 0 ? '+' : '' }}{{ periodComparison.savingsRate.change.toFixed(1) }}% ({{ periodComparison.savingsRate.changePercent >= 0 ? '+' : ''
                        }}{{ periodComparison.savingsRate.changePercent.toFixed(1) }}%)
                    </div>
                </div>

                <!-- Net Comparison -->
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-blue-800">Net</span>
                        <i class="pi" :class="periodComparison.net.change >= 0 ? 'pi-arrow-up text-green-600' : 'pi-arrow-down text-red-600'"></i>
                    </div>
                    <div class="text-lg font-bold" :class="periodComparison.net.current >= 0 ? 'text-green-600' : 'text-red-600'">
                        {{ formatCurrency(periodComparison.net.current) }}
                    </div>
                    <div class="text-sm" :class="periodComparison.net.change >= 0 ? 'text-green-700' : 'text-red-700'">
                        {{ periodComparison.net.change >= 0 ? '+' : '' }}{{ formatCurrency(periodComparison.net.change) }} ({{ periodComparison.net.changePercent >= 0 ? '+' : '' }}{{ periodComparison.net.changePercent.toFixed(1) }}%)
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div v-if="currentPeriodStats" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Expense Breakdown by Tag -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="pi pi-chart-pie text-xl text-blue-500 mr-2"></i>
                    Expense Breakdown by Tag
                </h3>
                <div v-if="tagBreakdownData.length > 0" class="h-64">
                    <Chart type="doughnut" :data="tagBreakdownData" :options="chartOptions" />
                </div>
                <div v-else class="text-center py-8 text-gray-500">
                    <i class="pi pi-chart-pie text-4xl mb-2"></i>
                    <p>No tagged expenses in this period</p>
                </div>
            </div>

            <!-- Income vs Expenses vs Savings -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="pi pi-chart-bar text-xl text-blue-500 mr-2"></i>
                    Income vs Expenses vs Savings
                </h3>
                <div class="h-64">
                    <Chart type="pie" :data="incomeExpenseData" :options="chartOptions" />
                </div>
            </div>

            <!-- Savings & Investments Breakdown -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="pi pi-wallet text-xl text-blue-500 mr-2"></i>
                    Savings & Investments
                </h3>
                <div class="h-64">
                    <Chart type="doughnut" :data="savingsInvestmentsData" :options="chartOptions" />
                </div>
            </div>
        </div>

        <!-- Top Categories -->
        <div v-if="currentPeriodStats" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Top Expense Categories -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="pi pi-fire text-xl text-red-500 mr-2"></i>
                    Top Expense Categories
                </h3>
                <div v-if="topExpenseCategories.length > 0" class="space-y-3">
                    <div v-for="category in topExpenseCategories" :key="category.tag" class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: category.color }"></span>
                            <span class="font-medium">{{ category.tag || 'Untagged' }}</span>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold">{{ formatCurrency(category.amount) }}</div>
                            <div class="text-sm text-gray-500">{{ category.count }} transactions</div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-gray-500">
                    <p>No expenses in this period</p>
                </div>
            </div>

            <!-- Top Income Categories -->
            <div class="card">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="pi pi-dollar text-xl text-green-500 mr-2"></i>
                    Top Income Categories
                </h3>
                <div v-if="topIncomeCategories.length > 0" class="space-y-3">
                    <div v-for="category in topIncomeCategories" :key="category.tag" class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: category.color }"></span>
                            <span class="font-medium">{{ category.tag || 'Untagged' }}</span>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold">{{ formatCurrency(category.amount) }}</div>
                            <div class="text-sm text-gray-500">{{ category.count }} transactions</div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-gray-500">
                    <p>No income in this period</p>
                </div>
            </div>
        </div>

        <!-- Period Transactions Table -->
        <!-- <div v-if="currentPeriodStats" class="card">
            <h3 class="text-lg font-semibold mb-4">
                <i class="pi pi-list text-xl text-blue-500 mr-2"></i>
                Period Transactions
            </h3>
            <DataTable :value="currentPeriodStats.transactions" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows class="w-full">
                <Column field="date" header="Date" sortable>
                    <template #body="{ data }">
                        {{ formatDate(data.date) }}
                    </template>
                </Column>
                <Column field="description" header="Description" sortable>
                    <template #body="{ data }">
                        <span class="truncate max-w-[200px] block">{{ data.description || '-' }}</span>
                    </template>
                </Column>
                <Column field="amount" header="Amount" sortable>
                    <template #body="{ data }">
                        <span class="font-mono" :class="formatAmountWithType(data.amount, data).colorClass">
                            {{ formatAmountWithType(data.amount, data).formatted }}
                        </span>
                    </template>
                </Column>
                <Column field="tag" header="Tag" sortable>
                    <template #body="{ data }">
                        <Tag v-if="data.tag" :value="data.tag" severity="info" />
                        <span v-else class="text-gray-400 text-sm">No tag</span>
                    </template>
                </Column>
                <Column field="category" header="Category" sortable>
                    <template #body="{ data }">
                        {{ data.category || '-' }}
                    </template>
                </Column>
            </DataTable>
        </div> -->

        <div class="card">
            <!-- Persistent Transaction Counts -->
            <h3 class="text-lg font-semibold mb-4">📊 Persistent Transaction Counts</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-orange-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">{{ persistentCounts.totalJsonTransactions }}</div>
                    <div class="text-sm text-orange-800">Total JSON Transactions</div>
                </div>
                <div class="bg-teal-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-teal-600">{{ persistentCounts.totalCsvTransactions }}</div>
                    <div class="text-sm text-teal-800">Total CSV Transactions</div>
                </div>
                <div class="bg-indigo-50 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-indigo-600">{{ persistentCounts.totalDatatableTransactions }}</div>
                    <div class="text-sm text-indigo-800">Total Datatable Transactions</div>
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">These counts persist across data clearing and track unique transactions processed</p>
            <!-- Detection Statistics -->
            <h3 class="text-lg font-semibold mb-4 mt-4">🔍 Detection Statistics</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div class="bg-blue-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-blue-600">{{ detectionStats.total }}</div>
                    <div class="text-xs text-blue-800">Total</div>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-green-600">{{ detectionStats.income }}</div>
                    <div class="text-xs text-green-800">Income</div>
                </div>
                <div class="bg-red-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-red-600">{{ detectionStats.expenses }}</div>
                    <div class="text-xs text-red-800">Expenses</div>
                </div>
                <div class="bg-emerald-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-emerald-600">{{ detectionStats.savings }}</div>
                    <div class="text-xs text-emerald-800">Savings</div>
                </div>
                <div class="bg-amber-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-amber-600">{{ detectionStats.investments }}</div>
                    <div class="text-xs text-amber-800">Investments</div>
                </div>
                <div class="bg-slate-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-slate-600">{{ detectionStats.transfers }}</div>
                    <div class="text-xs text-slate-800">Transfers</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-lg font-bold text-gray-600">{{ detectionStats.untagged }}</div>
                    <div class="text-xs text-gray-800">Untagged</div>
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">Current categorization breakdown of all transactions</p>
        </div>

        <!-- Savings & Investment Dashboard -->
        <div v-if="showSavingsDashboard" class="card">
            <SavingsInvestmentDashboard
                :total-income="totalIncome"
                :total-expenses="totalExpenses"
                :total-savings="totalSavings"
                :total-investments="totalInvestments"
                :net-amount="netAmount"
                :savings-rate="savingsRate"
                @auto-detect="applySavingsInvestmentsDetection"
                @export-report="() => console.log('Export report clicked')"
                @detailed-analysis="() => console.log('Detailed analysis clicked')"
            />
        </div>

        <!-- Tag Statistics -->
        <div class="card">
            <h3 class="text-lg font-semibold mb-4">🏷️ Category Breakdown</h3>
            <div class="grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <div class="flex flex-col gap-4 mb-4">
                    <!-- Date Range Filter -->
                    <div class="flex flex-col md:flex-row gap-4 items-center">
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-medium text-gray-700">Date Range:</label>
                            <Calendar v-model="startDate" placeholder="Start Date" dateFormat="yy-mm-dd" :showIcon="true" class="w-40" />
                            <span class="text-gray-500">to</span>
                            <Calendar v-model="endDate" placeholder="End Date" dateFormat="yy-mm-dd" :showIcon="true" class="w-40" />
                            <Button v-if="startDate || endDate" @click="clearDateFilters" icon="pi pi-times" text size="small" v-tooltip.top="'Clear date filters'" class="text-red-500" />
                        </div>
                    </div>

                    <!-- Search and Tag Filter -->
                    <div class="flex flex-col md:flex-row gap-4 justify-between">
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
                </div>

                <div class="mb-4 flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        Showing {{ searchFilteredTransactions.length }} of {{ filteredTransactions.length }} filtered transactions ({{ transactions.length }} total)
                        <span v-if="startDate || endDate" class="text-blue-600"> • Date filtered: {{ startDate ? formatDate(startDate) : 'Any' }} to {{ endDate ? formatDate(endDate) : 'Any' }} </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <Button label="Debug Duplicates" icon="pi pi-search" @click="debugCheckDuplicates" size="small" v-tooltip.top="'Check for duplicates in current transactions'" />
                        <Button label="Export Tagged Data" icon="pi pi-download" @click="exportTaggedData" size="small" />
                        <Button label="Clear All Data" icon="pi pi-trash" severity="danger" size="small" @click="confirmClearData" v-tooltip.top="'This will remove all transactions and settings'" />
                    </div>
                </div>

                <!-- <p v-for="value in searchFilteredTransactions.map((transaction) => transaction.amount)" :key="value">{{ `${value}` }}</p> -->
                <!-- <p>{{ JSON.stringify(Object.keys(searchFilteredTransactions[0])) }}</p> -->
                <!-- <p v-for="value in Object.keys(searchFilteredTransactions[0])" :key="value">{{ `${value}: ${searchFilteredTransactions[0][value]}` }}</p> -->
                <DataTable
                    :key="`transactions-${tableKey}`"
                    :value="periodFilteredTransactions"
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

/* Custom styling for Chips */
:deep(.p-chip) {
    @apply border-2 font-medium transition-all duration-300;
}

:deep(.p-chip.selected) {
    @apply bg-blue-500 text-white border-blue-500 shadow-lg transform scale-105;
}

:deep(.p-chip:not(.selected)) {
    @apply bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400 hover:shadow-md;
}

/* Special styling for Total chip */
:deep(.p-chip[data-period='total']) {
    @apply bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500;
}

:deep(.p-chip[data-period='total']:not(.selected)) {
    @apply bg-gradient-to-r from-purple-400 to-blue-400 text-white border-purple-400 hover:from-purple-500 hover:to-blue-500;
}

/* Ensure PrimeIcons are visible */
.pi {
    font-family: 'PrimeIcons' !important;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
</style>
