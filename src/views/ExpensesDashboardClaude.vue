<script setup>
import { useTransactionProcessor } from '@/composables/useTransactionProcessor';
import { computed, onMounted, ref } from 'vue';

const columns = ref([]); // Dynamic columns for PrimeVue datatable
const tableData = ref([]); // Data extracted from the CSV
const visibleColumns = ref([]); // Visibility state for selected columns

const { processTransactions, generateTableData, expenseCategories, updateExpenseCategory, calculateExpenses } = useTransactionProcessor();

// Example usage
const loadLocalCSV = async (filePath) => {
    try {
        loading.value = true;
        const response = await fetch(filePath);
        const csvData = await response.text();

        // Process transactions and get categorized data
        const { transactions, companiesWithCategories } = processTransactions(csvData);

        // Generate table data
        const { tempColumns, tempTableData, tempVisibleColumns } = generateTableData(transactions);

        // Set your component's reactive variables
        columns.value = tempColumns;
        tableData.value = tempTableData;
        visibleColumns.value = tempVisibleColumns;
        loading.value = false;
    } catch (error) {
        console.error('Error loading CSV:', error);
    }
};

const expenseItems = computed(() => tableData.value.filter((transaction) => !transaction.counterparty));

const totalExpenses = computed(() => {
    return calculateExpenses(expenseItems.value);
});

const monthlyExpenses = computed(() => {
    return calculateExpenses(expenseItems.value);
});

const loading = ref(true);

onMounted(async () => {
    loading.value = true;
    await loadLocalCSV('../../data-folder/entire-year-799-2024.csv');
    loading.value = false;
});

const getTableData = computed(() => tableData.value);

const visibleColumnsArray = computed(() => {
    return columns.value.filter((col) => visibleColumns.value.includes(col.key));
});

const kal = ref(3);
</script>

<template>
    <div>
        <InputNumberCustom v-model="kal" placeholder="Enter amount" :min="0" :max="10000" currency="EUR" />
        <h2>Upload and Display CSV</h2>
        <input type="file" @change="handleFileUpload" accept=".csv" />
        <div class="card">
            <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]" />
        </div>

        <!-- <p>{{ expenseItems }}</p> -->
        <!-- <p>{{ totalExpenses }}</p> -->
        <p>{{ monthlyExpenses }}</p>

        <DataTable v-if="tableData.length" :value="getTableData" :responsiveLayout="'scroll'" :loading="getTableData.length === 0">
            <template v-slot:header>
                <h3>Financial Table</h3>
            </template>

            <template #loading> <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="transparent" animationDuration=".5s" aria-label="Custom ProgressSpinner" /> </template>

            <template v-for="col in visibleColumnsArray" :key="col.key" v-slot:[`header-${col.key}`]>
                {{ col.name }}
            </template>

            <Column v-for="col in visibleColumnsArray" :key="col.key" :field="col.key" :header="col.name">
                <template #body="{ data }">
                    <span v-if="col.key === 'amount'"> <i class="pi pi-euro"></i> {{ parseFloat(data[col.key]).toFixed(2) }} </span>
                    <span v-else>
                        {{ data[col.key] }}
                    </span>
                </template>
            </Column>

            <Column :header="'Category'">
                <template #body="{ data }">
                    <Select v-model="data.category" :options="expenseCategories" filter optionLabel="name" placeholder="Select a category" class="w-full md:w-56" @change="updateExpenseCategory(data, columns)">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center">
                                <div class="">{{ slotProps.value.name }}</div>
                            </div>
                            <span v-else>
                                {{ slotProps.placeholder }}
                            </span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <div>{{ slotProps.option.name }}</div>
                            </div>
                        </template>
                    </Select>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style></style>
