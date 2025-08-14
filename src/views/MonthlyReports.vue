<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTransactionStore } from '@/composables/useTransactionStore';
import { getAvailablePeriods, calculateMonthlyStats, comparePeriods, calculateTotalStats } from '@/utils/monthlyReports';
import { formatAmountWithType } from '@/utils/transactionTypeDetermination';
import { formatCentsAsEuro } from '@/utils/currencyUtils';
import Card from 'primevue/card';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Chart from 'primevue/chart';

// Store
const { transactions, loadSavedTransactions } = useTransactionStore();

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

// Reactive data
const selectedPeriod = ref('total'); // Default to "Total" option
const currentPeriodStats = ref(null);
const periodComparison = ref(null);

// Computed properties
const hasTransactions = computed(() => transactions.value.length > 0);

// Set default period when periods are available
watch(
    availablePeriods,
    (periods) => {
        if (periods.length > 0 && !selectedPeriod.value) {
            selectedPeriod.value = 'total'; // Default to total
        }
    },
    { immediate: true }
);

// Chart data
const tagBreakdownData = computed(() => {
    if (!currentPeriodStats.value) return [];

    const expenses = currentPeriodStats.value.transactions.filter((t) => parseInt(t.amount) < 0);
    const tagMap = {};

    expenses.forEach((transaction) => {
        const tag = transaction.tag || 'Untagged';
        const amount = Math.abs(parseInt(transaction.amount)); // Amount in cents

        if (!tagMap[tag]) {
            tagMap[tag] = 0;
        }
        tagMap[tag] += amount;
    });

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    return {
        labels: Object.keys(tagMap),
        datasets: [
            {
                data: Object.values(tagMap).map((cents) => cents / 100), // Convert cents to euros for chart
                backgroundColor: colors.slice(0, Object.keys(tagMap).length),
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };
});

const incomeExpenseData = computed(() => {
    if (!currentPeriodStats.value) return [];

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

const topExpenseCategories = computed(() => {
    if (!currentPeriodStats.value) return [];

    const expenses = currentPeriodStats.value.transactions.filter((t) => parseInt(t.amount) < 0);
    const categoryMap = {};

    expenses.forEach((transaction) => {
        const tag = transaction.tag || 'Untagged';
        const amount = Math.abs(parseInt(transaction.amount)); // Amount in cents

        if (!categoryMap[tag]) {
            categoryMap[tag] = { amount: 0, count: 0 };
        }
        categoryMap[tag].amount += amount;
        categoryMap[tag].count++;
    });

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    return Object.entries(categoryMap)
        .map(([tag, data], index) => ({
            tag,
            amount: data.amount,
            count: data.count,
            color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
});

const topIncomeCategories = computed(() => {
    if (!currentPeriodStats.value) return [];

    const income = currentPeriodStats.value.transactions.filter((t) => parseInt(t.amount) > 0);
    const categoryMap = {};

    income.forEach((transaction) => {
        const tag = transaction.tag || 'Untagged';
        const amount = parseInt(transaction.amount); // Amount in cents

        if (!categoryMap[tag]) {
            categoryMap[tag] = { amount: 0, count: 0 };
        }
        categoryMap[tag].amount += amount;
        categoryMap[tag].count++;
    });

    const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FF9800'];

    return Object.entries(categoryMap)
        .map(([tag, data], index) => ({
            tag,
            amount: data.amount,
            count: data.count,
            color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
});

// Savings and investments breakdown
const savingsInvestmentsData = computed(() => {
    if (!currentPeriodStats.value) return [];

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

// Current period display name
const currentPeriodName = computed(() => {
    if (!selectedPeriod.value) return 'No Period Selected';

    if (selectedPeriod.value === 'total') {
        return 'Total (All Periods)';
    }

    const periodObj = availablePeriods.value.find((p) => p.value === selectedPeriod.value);
    return periodObj ? periodObj.name : 'Unknown Period';
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

// Methods
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

const formatCurrency = (amount) => {
    // Amount is now stored in cents, convert to euros for display
    return formatCentsAsEuro(amount);
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const exportPeriodData = () => {
    if (!currentPeriodStats.value) return;

    const data = {
        period: currentPeriodStats.value.period,
        summary: currentPeriodStats.value.summary,
        transactions: currentPeriodStats.value.transactions
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

// Watchers
watch(selectedPeriod, () => {
    loadPeriodStats();
});

// Watch for transactions changes to reload stats
watch(
    transactions,
    () => {
        if (transactions.value.length > 0) {
            console.log('📊 MonthlyReports: Transactions updated, reloading stats...');
            if (selectedPeriod.value) {
                loadPeriodStats();
            }
        }
    },
    { deep: true }
);

// Lifecycle
onMounted(() => {
    // Load saved transactions from localStorage first
    const hasData = loadSavedTransactions();
    console.log('📊 MonthlyReports: Loaded saved transactions:', hasData);

    if (hasTransactions.value && availablePeriods.value.length > 0) {
        // Set default to total if not already set
        if (!selectedPeriod.value) {
            selectedPeriod.value = 'total';
        }
        loadPeriodStats();
    }
});
</script>

<template>
    <div class="monthly-reports p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">📊 Monthly Reports</h1>
            <p class="text-gray-600">Financial analytics based on 23rd-of-the-month cycles</p>
        </div>

        <!-- Period Selection -->
        <div class="card mb-6">
            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">📅 Period Selection</h3>
                    <Button @click="exportPeriodData" :disabled="!currentPeriodStats" label="Export Report" icon="pi pi-download" severity="success" />
                </div>
                <div v-if="currentPeriodStats" class="text-center">
                    <p class="text-sm text-gray-600">
                        Currently viewing: <span class="font-semibold text-blue-600">{{ currentPeriodName }}</span>
                    </p>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700">Select Period:</label>
                    <SelectButton
                        v-model="selectedPeriod"
                        :options="availablePeriods"
                        optionLabel="name"
                        optionValue="value"
                        class="w-full"
                        :pt="{
                            button: { class: 'text-sm' }
                        }"
                    />
                </div>
            </div>
        </div>

        <!-- No Data Message -->
        <div v-if="!hasTransactions" class="text-center py-12">
            <i class="pi pi-chart-bar text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">No Transaction Data</h3>
            <p class="text-gray-500">Upload some transactions to see monthly reports</p>
        </div>

        <!-- Reports Content -->
        <div v-else-if="currentPeriodStats" class="space-y-6">
            <!-- Period Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Total Income -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-arrow-up-circle text-3xl text-green-500 mb-2"></i>
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
                            <i class="pi pi-arrow-down-circle text-3xl text-red-500 mb-2"></i>
                            <h3 class="text-lg font-semibold text-gray-700">Total Expenses</h3>
                            <p class="text-2xl font-bold text-red-600">
                                {{ formatCurrency(currentPeriodStats.summary.totalExpenses) }}
                            </p>
                            <p class="text-sm text-gray-500">{{ currentPeriodStats.summary.expenseCount }} transactions</p>
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

            <!-- Savings & Investments Summary -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <!-- Total Transfers -->
                <Card class="text-center">
                    <template #content>
                        <div class="flex flex-col items-center">
                            <i class="pi pi-arrow-right-arrow-left text-3xl text-slate-500 mb-2"></i>
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
            </div>

            <!-- Period Comparison -->
            <div v-if="periodComparison" class="card">
                <h3 class="text-lg font-semibold mb-4">📈 Period Comparison</h3>
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
                            {{ periodComparison.savings.change >= 0 ? '+' : '' }}{{ formatCurrency(periodComparison.savings.change) }} ({{ periodComparison.savings.changePercent >= 0 ? '+' : ''
                            }}{{ periodComparison.savings.changePercent.toFixed(1) }}%)
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
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Expense Breakdown by Tag -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">🏷️ Expense Breakdown by Tag</h3>
                    </template>
                    <template #content>
                        <div v-if="tagBreakdownData.length > 0" class="h-64">
                            <Chart type="doughnut" :data="tagBreakdownData" :options="chartOptions" />
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            <i class="pi pi-chart-pie text-4xl mb-2"></i>
                            <p>No tagged expenses in this period</p>
                        </div>
                    </template>
                </Card>

                <!-- Income vs Expenses vs Savings -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">📊 Income vs Expenses vs Savings</h3>
                    </template>
                    <template #content>
                        <div class="h-64">
                            <Chart type="pie" :data="incomeExpenseData" :options="chartOptions" />
                        </div>
                    </template>
                </Card>

                <!-- Savings & Investments Breakdown -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">💰 Savings & Investments</h3>
                    </template>
                    <template #content>
                        <div class="h-64">
                            <Chart type="doughnut" :data="savingsInvestmentsData" :options="chartOptions" />
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Top Categories -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Expense Categories -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">🔥 Top Expense Categories</h3>
                    </template>
                    <template #content>
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
                    </template>
                </Card>

                <!-- Top Income Categories -->
                <Card>
                    <template #title>
                        <h3 class="text-lg font-semibold">💰 Top Income Categories</h3>
                    </template>
                    <template #content>
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
                    </template>
                </Card>
            </div>

            <!-- Period Transactions Table -->
            <Card>
                <template #title>
                    <h3 class="text-lg font-semibold">📋 Period Transactions</h3>
                </template>
                <template #content>
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
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.monthly-reports {
    min-height: 100vh;
}

.card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}

/* Custom styling for SelectButton */
:deep(.p-selectbutton) {
    @apply w-full;
}

:deep(.p-selectbutton .p-button) {
    @apply flex-1 text-sm py-2 px-3;
}

:deep(.p-selectbutton .p-button.p-highlight) {
    @apply bg-blue-500 border-blue-500 text-white;
}

:deep(.p-selectbutton .p-button:not(.p-highlight)) {
    @apply bg-white border-gray-300 text-gray-700 hover:bg-gray-50;
}
</style>
