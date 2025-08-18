/**
 * Transaction State Management
 *
 * This composable handles only UI state and display logic:
 * - Filtering and search
 * - Column preferences
 * - UI state (loading, dialogs, etc.)
 * - Display formatting
 * - User preferences
 *
 * Architecture:
 * - Single responsibility: UI state management
 * - No business logic
 * - Clean separation from transaction processing
 */

import { ref, computed, watch } from 'vue';
import { getAllStandardColumns, DEFAULT_VISIBLE_COLUMNS } from '@/data/columnMapping';
import { calculateTransactionStatistics, formatStatistics } from '@/utils/transactionStatistics';

export function useTransactionState() {
    // ============================================================================
    // UI STATE
    // ============================================================================

    const isLoading = ref(false);
    const showTransactionDialog = ref(false);
    const showClearDataDialog = ref(false);
    const showDocumentation = ref(false);
    const selectedTransaction = ref(null);

    // ============================================================================
    // FILTERING STATE
    // ============================================================================

    const searchTerm = ref('');
    const selectedFilter = ref('all');
    const activeTransactionFilter = ref(null);
    const startDate = ref(null);
    const endDate = ref(null);

    // Filter options
    const filterOptions = [
        { label: 'All Transactions', value: 'all' },
        { label: 'Income', value: 'income' },
        { label: 'Expenses', value: 'expenses' },
        { label: 'Savings', value: 'savings' },
        { label: 'Investments', value: 'investments' },
        { label: 'Transfers', value: 'transfers' },
        { label: 'Other', value: 'other' },
        { label: 'Untagged', value: 'untagged' }
    ];

    // ============================================================================
    // COLUMN MANAGEMENT
    // ============================================================================

    const availableColumns = ref([]);
    const visibleColumns = ref([]);

    // ============================================================================
    // PERIOD SELECTION
    // ============================================================================

    const selectedPeriod = ref('total');
    const showAllPeriods = ref(false);

    // ============================================================================
    // DASHBOARD STATE
    // ============================================================================

    const showSavingsDashboard = ref(false);

    // ============================================================================
    // COMPUTED PROPERTIES
    // ============================================================================

    /**
     * Filter transactions based on current filter state
     */
    const filteredTransactions = computed(() => {
        return (transactions) => {
            if (!Array.isArray(transactions)) return [];

            let filtered = [...transactions];

            // Search filter
            if (searchTerm.value) {
                const term = searchTerm.value.toLowerCase();
                filtered = filtered.filter((transaction) => {
                    const description = (transaction.description || '').toLowerCase();
                    const category = (transaction.category || '').toLowerCase();
                    const subcategory = (transaction.subcategory || '').toLowerCase();
                    const counterparty = (transaction.counterparty || '').toLowerCase();

                    return description.includes(term) || category.includes(term) || subcategory.includes(term) || counterparty.includes(term);
                });
            }

            // Tag filter
            if (selectedFilter.value !== 'all') {
                filtered = filtered.filter((transaction) => {
                    const tag = transaction.tag || 'Untagged';
                    return tag.toLowerCase() === selectedFilter.value.toLowerCase();
                });
            }

            // Date filter
            if (startDate.value || endDate.value) {
                filtered = filtered.filter((transaction) => {
                    const date = transaction.date || transaction.transaction_date;
                    if (!date) return false;

                    const transactionDate = new Date(date);

                    if (startDate.value && transactionDate < startDate.value) {
                        return false;
                    }

                    if (endDate.value && transactionDate > endDate.value) {
                        return false;
                    }

                    return true;
                });
            }

            // Transaction type filter
            if (activeTransactionFilter.value) {
                filtered = filtered.filter((transaction) => {
                    const amount = parseInt(transaction.amount) || 0;
                    const tag = transaction.tag || 'Untagged';

                    switch (activeTransactionFilter.value) {
                        case 'income':
                            return amount > 0;
                        case 'expenses':
                            return amount < 0 && !['Savings', 'Investments'].includes(tag);
                        case 'savings':
                            return tag === 'Savings';
                        case 'investments':
                            return tag === 'Investments';
                        case 'transfers':
                            return tag === 'Transfers';
                        default:
                            return true;
                    }
                });
            }

            return filtered;
        };
    });

    /**
     * Get available periods for analysis
     */
    const availablePeriods = computed(() => {
        return (transactions) => {
            if (!Array.isArray(transactions) || transactions.length === 0) {
                return [];
            }

            const periods = new Set();

            transactions.forEach((transaction) => {
                const date = transaction.date || transaction.transaction_date;
                if (date) {
                    const dateObj = new Date(date);
                    const periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                    periods.add(periodKey);
                }
            });

            return Array.from(periods)
                .sort()
                .map((period) => ({
                    name: formatPeriodName(period),
                    value: period
                }));
        };
    });

    /**
     * Get visible periods (with show more/less logic)
     */
    const visiblePeriods = computed(() => {
        return (periods) => {
            if (!Array.isArray(periods)) return [];

            if (showAllPeriods.value || periods.length <= 6) {
                return periods;
            }

            return periods.slice(0, 6);
        };
    });

    /**
     * Calculate current period statistics
     */
    const currentPeriodStats = computed(() => {
        return (transactions, periodStats) => {
            if (!Array.isArray(transactions) || !Array.isArray(periodStats)) {
                return null;
            }

            if (selectedPeriod.value === 'total') {
                const stats = calculateTransactionStatistics(transactions);
                return formatStatistics(stats);
            }

            const periodData = periodStats.find((p) => p.period === selectedPeriod.value);
            return periodData ? formatStatistics(periodData) : null;
        };
    });

    /**
     * Get current period name for display
     */
    const currentPeriodName = computed(() => {
        if (selectedPeriod.value === 'total') {
            return 'Total';
        }
        return formatPeriodName(selectedPeriod.value);
    });

    // ============================================================================
    // METHODS
    // ============================================================================

    /**
     * Initialize column preferences
     */
    const initializeColumns = () => {
        availableColumns.value = getAllStandardColumns();
        loadColumnPreferences();
    };

    /**
     * Load column preferences from localStorage
     */
    const loadColumnPreferences = () => {
        try {
            const saved = localStorage.getItem('transaction_analyzer_column_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                visibleColumns.value = preferences.visibleColumns || DEFAULT_VISIBLE_COLUMNS;
            } else {
                visibleColumns.value = DEFAULT_VISIBLE_COLUMNS;
            }
        } catch (error) {
            console.error('Error loading column preferences:', error);
            visibleColumns.value = DEFAULT_VISIBLE_COLUMNS;
        }
    };

    /**
     * Save column preferences to localStorage
     */
    const saveColumnPreferences = () => {
        try {
            const preferences = {
                visibleColumns: visibleColumns.value,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('transaction_analyzer_column_preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving column preferences:', error);
        }
    };

    /**
     * Clear all filters
     */
    const clearFilters = () => {
        searchTerm.value = '';
        selectedFilter.value = 'all';
        activeTransactionFilter.value = null;
        startDate.value = null;
        endDate.value = null;
    };

    /**
     * Clear date filters
     */
    const clearDateFilters = () => {
        startDate.value = null;
        endDate.value = null;
    };

    /**
     * Toggle show all periods
     */
    const toggleShowAllPeriods = () => {
        showAllPeriods.value = !showAllPeriods.value;
    };

    /**
     * Handle period selection
     */
    const handlePeriodSelection = (period) => {
        selectedPeriod.value = period;
    };

    /**
     * Filter by transaction type
     */
    const filterByTransactionType = (type) => {
        activeTransactionFilter.value = activeTransactionFilter.value === type ? null : type;
    };

    /**
     * View transaction details
     */
    const viewTransactionDetails = (transaction) => {
        selectedTransaction.value = transaction;
        showTransactionDialog.value = true;
    };

    /**
     * Close transaction dialog
     */
    const closeTransactionDialog = () => {
        showTransactionDialog.value = false;
        selectedTransaction.value = null;
    };

    /**
     * Show clear data confirmation
     */
    const showClearDataConfirmation = () => {
        showClearDataDialog.value = true;
    };

    /**
     * Hide clear data confirmation
     */
    const hideClearDataConfirmation = () => {
        showClearDataDialog.value = false;
    };

    /**
     * Toggle documentation
     */
    const toggleDocumentation = () => {
        showDocumentation.value = !showDocumentation.value;
    };

    /**
     * Toggle savings dashboard
     */
    const toggleSavingsDashboard = () => {
        showSavingsDashboard.value = !showSavingsDashboard.value;
    };

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    /**
     * Format period name for display
     */
    const formatPeriodName = (period) => {
        if (!period) return 'Unknown';

        if (period === 'total') return 'Total';

        // Handle YYYY-MM format
        if (period.match(/^\d{4}-\d{2}$/)) {
            const [year, month] = period.split('-');
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        }

        // Handle YYYY-QN format
        if (period.match(/^\d{4}-Q\d$/)) {
            const [year, quarter] = period.split('-');
            return `Q${quarter} ${year}`;
        }

        // Handle YYYY format
        if (period.match(/^\d{4}$/)) {
            return period;
        }

        return period;
    };

    // ============================================================================
    // WATCHERS
    // ============================================================================

    // Save column preferences when they change
    watch(
        visibleColumns,
        () => {
            saveColumnPreferences();
        },
        { deep: true }
    );

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    const initialize = () => {
        initializeColumns();
    };

    // Initialize on import
    initialize();

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        // UI State
        isLoading,
        showTransactionDialog,
        showClearDataDialog,
        showDocumentation,
        selectedTransaction,
        showSavingsDashboard,

        // Filtering State
        searchTerm,
        selectedFilter,
        activeTransactionFilter,
        startDate,
        endDate,
        filterOptions,

        // Column Management
        availableColumns,
        visibleColumns,

        // Period Selection
        selectedPeriod,
        showAllPeriods,

        // Computed Properties
        filteredTransactions,
        availablePeriods,
        visiblePeriods,
        currentPeriodStats,
        currentPeriodName,

        // Methods
        initializeColumns,
        loadColumnPreferences,
        saveColumnPreferences,
        clearFilters,
        clearDateFilters,
        toggleShowAllPeriods,
        handlePeriodSelection,
        filterByTransactionType,
        viewTransactionDetails,
        closeTransactionDialog,
        showClearDataConfirmation,
        hideClearDataConfirmation,
        toggleDocumentation,
        toggleSavingsDashboard
    };
}
