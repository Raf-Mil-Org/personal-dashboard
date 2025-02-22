<script setup>
import { computed, onMounted, ref } from 'vue';

const columns = ref([]); // Dynamic columns for PrimeVue datatable
const tableData = ref([]); // Data extracted from the CSV
const visibleColumns = ref([]); // Visibility state for selected columns

const loading = ref(false);

const getTableData = computed(() => {
    return showExpenses.value === 'Expenses' ? tableData.value.filter((item) => item.Counterparty === '') : tableData.value.filter((item) => item.Counterparty !== '');
});

const showExpenses = ref('Expenses');
const options = ref(['Expenses', 'Income']);

const newCategory = ref('');

const defaultExpenseCategories = ref([
    { name: 'Fixed expenses', key: 'fixed_expenses' },
    { name: 'Free time', key: 'free_time' },
    { name: 'Groceries & household', key: 'groceries_household' },
    { name: 'Health & Wellness', key: 'health_wellness' },
    { name: 'Other', key: 'other' },
    { name: 'Restaurants/Food', key: 'restaurants_food' },
    { name: 'Bars', key: 'bars' },
    { name: 'Shopping', key: 'shopping' },
    { name: 'Transport & travel', key: 'transport_travel' },
    { name: 'Group this yourself', key: 'group_yourself' },
    { name: 'Gift', key: 'gift' }
]);

const companiesWithCategories = ref(JSON.parse(localStorage.getItem('companiesWithCategories')) || []);
const expenseCategories = ref(JSON.parse(localStorage.getItem('expenseCategories')) || defaultExpenseCategories.value);

localStorage.setItem('expenseCategories', JSON.stringify(defaultExpenseCategories.value));

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const csvData = e.target.result;
        parseCSV(csvData);
    };
    reader.readAsText(file);
};

const parseCSV = (data) => {
    const rows = data.split('\n').map((row) => row.split(','));
    const headers = rows[0].map((header) => header.trim().replace(/^"|"$/g, '').replace(/\n/g, ''));
    const parsedData = rows.slice(1).map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
            let value = row[index]?.trim() || '';
            value = value.replace(/^"|"$/g, '').replace(/\n/g, '');

            if (/^\d{8}$/.test(value)) {
                value = formatToDDMMYYYY(value);
            }

            obj[header] = value;
        });

        const matchingCompany = companiesWithCategories.value.find((company) => obj[headers[1]]?.includes(company.name));
        obj.category = matchingCompany ? matchingCompany.category : { name: 'Other', key: 'other' };

        return obj;
    });
    generateTable(parsedData);
};

const generateTable = (data) => {
    if (data.length > 0) {
        columns.value = Object.keys(data[0]).map((key) => ({
            key: key,
            name: key.charAt(0).toUpperCase() + key.slice(1)
        }));
        tableData.value = data;

        const storedVisibleColumns = localStorage.getItem('visibleColumns');
        if (storedVisibleColumns) {
            visibleColumns.value = JSON.parse(storedVisibleColumns);
        } else {
            visibleColumns.value = columns.value.map((col) => col.key);
            updateLocalStorage();
        }
    } else {
        columns.value = [];
        tableData.value = [];
        visibleColumns.value = [];
    }
};

const visibleColumnsArray = computed(() => {
    return columns.value.filter((col) => visibleColumns.value.includes(col.key));
});

const updateLocalStorage = () => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns.value));
};

const addCategory = (category) => {
    const obj = { name: category, key: transformString(category) };
    if (!includesObject(expenseCategories.value, obj)) {
        expenseCategories.value.push({ name: category, key: transformString(category) });
    }
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories.value));
};

function includesObject(array, objectToFind) {
    return array.some((item) => item.name === objectToFind.name && item.key === objectToFind.key);
}

function transformString(input) {
    return input.charAt(0).toLowerCase() + input.slice(1).replace(/\s+/g, '_');
}

function formatToDDMMYYYY(date) {
    if (!/^\d{8}$/.test(date)) {
        throw new Error("Invalid date format. Expected 'YYYYMMDD'.");
    }
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);
    return `${day}/${month}/${year}`;
}

function formatToYYYYMMDD(date) {
    const parts = date.split('/');
    if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
        throw new Error("Invalid date format. Expected 'dd/mm/yyyy'.");
    }
    const [day, month, year] = parts;
    return `${year}${month}${day}`;
}

const updateCategory = (data) => {
    const companyName = data[columns.value[1]?.key];
    const existingCompany = companiesWithCategories.value.find((company) => company.name === companyName);

    if (existingCompany) {
        existingCompany.category = data.category;
    } else {
        companiesWithCategories.value.push({ name: companyName, category: data.category });
    }

    localStorage.setItem('companiesWithCategories', JSON.stringify(companiesWithCategories.value));
};

const expensesByCategoryPerMonth = computed(() => {
    return (category) => {
        monthlyExpenses.value.filter((item) => item.Category === category);
    };
});

const chartData = ref();
const chartOptions = ref();

onMounted(() => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [
            {
                label: 'Expenses',
                backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
                borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
                // data: monthlyExpenses.value //[65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56, 55, 40]
                data: [810, 1267, 2081, 2085, 2069, 2346, 2745, 2211, 1521, 2383, 2676, 4876]
            }
            // {
            //     label: 'My Second dataset',
            //     backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
            //     borderColor: documentStyle.getPropertyValue('--p-gray-500'),
            //     data: [28, 48, 40, 19, 86, 27, 90]
            // }
        ]
    };
};
const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
};

const monthlyExpenses = computed(() => {
    const expensesByMonth = Array(12).fill(0);

    tableData.value.forEach((item) => {
        const date = item.Date ? formatToYYYYMMDD(item.Date) : '';
        if (date && /^\d{8}$/.test(date)) {
            const year = parseInt(date.slice(0, 4), 10);
            const month = parseInt(date.slice(4, 6), 10) - 1;

            if (year === 2024) {
                const amount = parseFloat(item['Amount (EUR)']);
                if (!isNaN(amount)) {
                    expensesByMonth[month] += amount;
                }
            }
        }
    });

    return expensesByMonth;
});

const expensesByCategory = computed(() => {
    const categoryExpenses = {};

    expenseCategories.value.forEach((category) => {
        const categoryExpensesArray = tableData.value.filter((item) => item.category.key === category.key);
        const amountPerCategory = categoryExpensesArray.map((item) => parseFloat(item['Amount (EUR)']));
        const temp = amountPerCategory.reduce((sum, current) => sum + current, 0);
        categoryExpenses[category.key] = temp;
    });

    return categoryExpenses;
    // return tableData.value.filter(item => item.Category ===)
});

const monthlyExpensesByCategory = computed(() => {
    const categoryExpenses = {};

    expenseCategories.value.forEach((category) => {
        categoryExpenses[category.key] = Array(12).fill(0);
    });

    tableData.value.forEach((item) => {
        const date = item.Date ? formatToYYYYMMDD(item.Date) : '';
        if (date && /^\d{8}$/.test(date)) {
            const year = parseInt(date.slice(0, 4), 10);
            const month = parseInt(date.slice(4, 6), 10) - 1;

            if (year === 2024) {
                const amount = parseFloat(item['Amount (EUR)']);
                const categoryKey = item.category?.key || 'other';

                if (!isNaN(amount)) {
                    categoryExpenses[categoryKey][month] += amount;
                }
            }
        }
    });

    return categoryExpenses;
});

const totalExpenses = computed(() => {
    return monthlyExpenses.value.reduce((total, month) => total + month, 0);
});

onMounted(async () => {
    loading.value = true;
    await loadLocalCSV('../../data-folder/entire-year-2024.csv');
    loading.value = false;
});

const loadLocalCSV = async (filePath) => {
    try {
        const response = await fetch(filePath);
        const csvData = await response.text();
        parseCSV(csvData);
    } catch (error) {
        console.error('Error loading local CSV file:', error);
    }
};
</script>

<template>
    <div>
        <h2>Upload and Display CSV</h2>
        <input type="file" @change="handleFileUpload" accept=".csv" />

        <div class="my-3">
            <Accordion value="0">
                <AccordionPanel value="0">
                    <AccordionHeader>Edit Columns</AccordionHeader>
                    <AccordionContent>
                        <div v-if="columns.length" class="flex flex-wrap gap-4">
                            <div v-for="col in columns" :key="col.key" class="checkbox-item">
                                <Checkbox v-model="visibleColumns" :value="col.key" @change="updateLocalStorage" />
                                <label>{{ col.name }}</label>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>
        </div>

        <div class="flex justify-between">
            <SelectButton v-model="showExpenses" :options="options" />
            <div class="">
                <InputGroup>
                    <InputText v-model="newCategory" placeholder="Category" />
                    <InputGroupAddon>
                        <Button icon="pi pi-plus" severity="secondary" @click="addCategory(newCategory)" />
                    </InputGroupAddon>
                </InputGroup>
            </div>
        </div>

        <p>'expensesByCategory'</p>
        <p>{{ expensesByCategory }}</p>

        <p>{{}}</p>

        <div class="card">
            <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]" />
        </div>

        <DataTable v-if="tableData.length" :value="getTableData" :responsiveLayout="'scroll'">
            <template v-slot:header>
                <h3>Financial Table</h3>
            </template>

            <template v-for="col in visibleColumnsArray" :key="col.key" v-slot:[`header-${col.key}`]>
                {{ col.name }}
            </template>

            <Column v-for="col in visibleColumnsArray" :key="col.key" :field="col.key" :header="col.name">
                <template #body="{ data }">
                    <span v-if="col.key === 'Amount (EUR)'"> <i class="pi pi-euro"></i> {{ parseFloat(data[col.key]).toFixed(2) }} </span>
                    <span v-else>
                        {{ data[col.key] }}
                    </span>
                </template>
            </Column>

            <Column :header="'Category'">
                <template #body="{ data }">
                    <Select v-model="data.category" :options="expenseCategories" filter optionLabel="name" placeholder="Select a category" class="w-full md:w-56" @change="updateCategory(data)">
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

<style>
input[type='file'] {
    margin-bottom: 20px;
}

.checkbox-group {
    margin: 20px 0;
}

.checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
}
</style>
