<script setup>
import { transactions } from '@/composables/useTransactionStore';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { default as Dropdown, default as DropdownEditor } from 'primevue/dropdown';
import ProgressBar from 'primevue/progressbar';
import { computed, h, ref } from 'vue';

const budget = 2000;
const allCategories = ['Groceries & household', 'Transport & travel', 'Health & Wellness', 'Shopping', 'Other', 'Uncategorized'];

// Month logic
const selectedMonth = ref(null);

const availableMonths = computed(() => {
    const set = new Set(transactions.value.map((t) => new Date(t.date).toISOString().slice(0, 7)));
    return Array.from(set).map((m) => ({ label: m, value: m }));
});

if (!selectedMonth.value && availableMonths.value.length) {
    selectedMonth.value = availableMonths.value[0].value;
}

const filteredTransactions = computed(() => transactions.value.filter((t) => new Date(t.date).toISOString().startsWith(selectedMonth.value)));

const income = computed(() => filteredTransactions.value.filter((t) => t.debit_credit === 'Credit').reduce((sum, t) => sum + t.amount, 0));

const expenses = computed(() => filteredTransactions.value.filter((t) => t.debit_credit === 'Debit').reduce((sum, t) => sum + t.amount, 0));

const savings = computed(() => income.value - expenses.value);

const totalsByCategory = computed(() => {
    const out = {};
    filteredTransactions.value.forEach((tx) => {
        if (tx.debit_credit === 'Debit') {
            const key = tx.category || 'Uncategorized';
            out[key] = (out[key] || 0) + tx.amount;
        }
    });
    return out;
});

const chartData = computed(() => {
    const categories = Object.keys(totalsByCategory.value);
    const values = Object.values(totalsByCategory.value);

    const colors = [
        '#3B82F6', // blue
        '#10B981', // emerald
        '#F59E0B', // amber
        '#EF4444', // red
        '#6366F1', // indigo
        '#F472B6' // pink
    ];

    return {
        labels: categories,
        datasets: [
            {
                label: 'Transactions',
                data: values,
                backgroundColor: categories.map((_, i) => colors[i % colors.length]),
                borderRadius: 4
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                usePointStyle: true,
                boxWidth: 8,
                padding: 20
            }
        },
        title: {
            display: false
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 10,
                callback: (value) => `€${value}`
            }
        }
    }
};

function editCategory(rowData) {
    return h(DropdownEditor, {
        modelValue: rowData.category,
        options: allCategories,
        onChange: (e) => (rowData.category = e.value),
        class: 'w-full'
    });
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB');
}
</script>

<template>
    <div class="p-6 space-y-6">
        <h1 class="text-2xl font-bold">📊 Financial Insights</h1>

        <!-- Month Filter -->
        <div class="mb-4">
            <Dropdown v-model="selectedMonth" :options="availableMonths" optionLabel="label" placeholder="Select Month" class="w-full md:w-60" />
        </div>

        <!-- Totals Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-white rounded shadow">
                <h2 class="font-semibold">Savings</h2>
                <p>
                    This Month: <strong>€{{ savings }}</strong>
                </p>
                <p>Income: €{{ income }}</p>
                <p>Expenses: €{{ expenses }}</p>
            </div>
            <div class="p-4 bg-white rounded shadow">
                <h2 class="font-semibold mb-1">Monthly Budget</h2>
                <p class="text-sm">Budget: €{{ budget }}</p>
                <ProgressBar :value="(expenses / budget) * 100" class="mt-2" />
                <p class="text-sm mt-2">Remaining: €{{ budget - expenses }}</p>
            </div>
        </div>

        <!-- Category Totals Chart -->
        <div class="bg-white p-4 rounded shadow">
            <h2 class="font-semibold mb-2">Spending Breakdown</h2>
            <Chart type="bar" :data="chartData" :options="chartOptions" class="w-full h-64" />
        </div>

        <!-- Transactions Table -->
        <div class="bg-white p-4 rounded shadow">
            <h2 class="font-semibold mb-2">Transactions</h2>
            <DataTable :value="filteredTransactions" responsiveLayout="scroll">
                <Column field="date" header="Date" :body="(d) => formatDate(d.date)" />
                <Column field="description" header="Description" />
                <Column field="amount" header="Amount" :body="(d) => `€${d.amount}`" />
                <Column header="Category" :body="editCategory" />
            </DataTable>
        </div>
    </div>
</template>
