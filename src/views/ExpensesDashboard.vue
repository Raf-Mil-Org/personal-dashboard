<script setup>
import { useTransactionMetrics } from '@/composables/useTransactionMetrics';
import { useUtils } from '@/composables/useUtils';
import { computed, onMounted, ref } from 'vue';

const columns = ref([]); // Dynamic columns for PrimeVue datatable
const tableData = ref([]); // Data extracted from the CSV
const visibleColumns = ref([]); // Visibility state for selected columns

const loading = ref(false);

const getTableData = computed(() => {
    return showExpenses.value === 'Expenses' ? tableData.value.filter((item) => item.counterparty === '') : tableData.value.filter((item) => item.counterparty !== '');
});

const getExpenses = computed(() => {
    return tableData.value.filter((item) => item.counterparty === '');
});

const getIncome = computed(() => {
    return tableData.value.filter((item) => item.counterparty !== '');
});

const getExpensesTotal = computed(() => {
    return getExpenses.value.reduce((acc, item) => acc + parseFloat(item['Amount (EUR)']), 0);
});

const showExpenses = ref('Expenses');
const options = ref(['Expenses', 'Income']);

const newCategory = ref('');

const defaultExpenseCategories = ref([
    { name: 'Fixed expenses', key: 'fixed_expenses' },
    { name: 'Free time', key: 'free_time' },
    { name: 'Groceries & household', key: 'groceries_household' },
    { name: 'Health & Wellness', key: 'health_wellness' },
    { name: 'Medical', key: 'medical' },
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

const keyMapping = {
    Date: 'date',
    'Name / Description': 'description',
    Account: 'account',
    Counterparty: 'counterparty',
    Code: 'code',
    'Debit/credit': 'debit_credit',
    'Amount (EUR)': 'amount',
    'Transaction type': 'transaction_type',
    Notifications: 'notifications'
};

const parseCSV = (data) => {
    try {
        const rows = data.split('\n').map((row) => row.split(','));
        if (!rows.length) throw new Error('Empty CSV file.');

        const headers = rows[0].map((header) => header.trim().replace(/^"|"$/g, '').replace(/\n/g, ''));
        if (headers.length < 2) throw new Error('CSV file is missing required columns.');

        const mappedHeaders = headers.map((header) => keyMapping[header] || header);

        console.log('mappedHeaders');
        console.log(JSON.stringify(mappedHeaders));

        const parsedData = rows.slice(1).map((row) => {
            const obj = {};
            mappedHeaders.forEach((mappedHeader, index) => {
                let value = row[index]?.trim() || '';
                value = value.replace(/^"|"$/g, '').replace(/\n/g, '');

                // Format date fields
                if (mappedHeader === 'date' && /^\d{8}$/.test(value)) {
                    value = formatToDDMMYYYY(value);
                }

                // Parse amounts
                if (mappedHeader === 'amount') {
                    value = parseFloat(value) || 0;
                }

                obj[mappedHeader] = value;
            });

            // Assign category based on company name
            const matchingCompany = companiesWithCategories.value.find((company) => obj[mappedHeaders[1]]?.includes(company.name));
            obj.category = matchingCompany ? matchingCompany.category : { name: 'Other', key: 'other' };

            return obj;
        });

        return parsedData;
    } catch (error) {
        console.error('Error parsing CSV:', error.message);
    }
};

const generateTableData = (data) => {
    let tempColums = [];
    let tempTableData = [];
    let tempVisibleColums = [];

    if (data.length > 0) {
        tempColums = Object.keys(data[0]).map((key) => ({
            key: key,
            name: key.charAt(0).toUpperCase() + key.slice(1)
        }));
        tempTableData = data;

        const storedVisibleColumns = localStorage.getItem('visibleColumns');
        if (storedVisibleColumns) {
            tempVisibleColums = JSON.parse(storedVisibleColumns);
        } else {
            tempVisibleColums = tempColums.map((col) => col.key);
            updateVisibleColumnsLocalStorage();
        }
    }
    return { tempColums, tempTableData, tempVisibleColums };
};

const visibleColumnsArray = computed(() => {
    return columns.value.filter((col) => visibleColumns.value.includes(col.key));
});

const updateVisibleColumnsLocalStorage = () => {
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

// Transforms a string into a lowercase, snake_case format
function transformString(input) {
    return input.charAt(0).toLowerCase() + input.slice(1).replace(/\s+/g, '_');
}

const { formatToYYYYMMDD, formatToDDMMYYYY } = useUtils();

const updateExpenseCategory = (data) => {
    const companyName = data[columns.value[1]?.key];
    const existingCompanyIdx = companiesWithCategories.value.findIndex((company) => company.name === companyName);

    if (existingCompanyIdx) {
        companiesWithCategories.value[existingCompanyIdx].category = data.category;
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

    // const categCompanies = categorizeCompanies(getAllCompanies.value, expenseCategories.value, categoryKeywords);
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

// const totalExpenses = computed(() => {
//     return monthlyExpenses.value.reduce((total, month) => total + month, 0);
// });

function setLoadingState(isLoading) {
    loading.value = isLoading;
}

onMounted(async () => {
    setLoadingState(true);
    // await loadLocalCSV('../../data-folder/entire-year-0877-2024.csv');
    await loadLocalCSV('../../data-folder/entire-year-799-2024.csv');
    setLoadingState(false);
});

const { dateOfLatestTransaction, dateOfFirstTransaction, totalExpenses, totalIncome, netBalance, monthlyExpenses, monthlyIncome, expensesByCategory, monthlyExpensesByCategory } = useTransactionMetrics(tableData);

const loadLocalCSV = async (filePath) => {
    try {
        const response = await fetch(filePath);
        const csvData = await response.text();
        const parseData = parseCSV(csvData);
        const { tempColums, tempTableData, tempVisibleColums } = generateTableData(parseData);
        columns.value = tempColums;
        tableData.value = tempTableData;
        visibleColumns.value = tempVisibleColums;
        const allCompanies = tempTableData.map((item) => item['description']);
        const kal = categorizeCompanies(allCompanies, expenseCategories.value, categoryKeywords);
        const retre = kal;
    } catch (error) {
        console.error('Error loading local CSV file:', error);
    }
};

const categoryKeywords = {
    groceries_household: ['ALBERT HEIJN', 'DIRK', 'Lidl'],
    health_wellness: ['Hairstudio', 'Pharmacy', 'Health'],
    restaurants_food: ['Cafe', 'Restaurant', 'FLOCAFE', 'Bakery', 'Zero', 'Ramen', 'VIJFHUI'],
    bars: ['Bar', 'Pub', 'Radion'],
    shopping: ['SHOP', 'STORE', 'BOUTIQUE'],
    transport_travel: ['BOLT', 'Uber', 'Flight', 'Train'],
    free_time: ['Cinema', 'Theater', 'Entertainment'],
    medical: ['Hospital', 'Clinic', 'Doctor', 'Ntavas'],
    other: []
};

function categorizeCompanies(companies, categories, keywords) {
    const categorizedData = [];

    companies.forEach((company) => {
        let assignedCategory = { name: 'Other', key: 'other' };
        for (const [categoryKey, categoryKeywords] of Object.entries(keywords)) {
            const regex = new RegExp(categoryKeywords.join('|'), 'i');
            if (regex.test(company)) {
                assignedCategory = categories.find((cat) => cat.key === categoryKey) || assignedCategory;
                break;
            }
        }
        categorizedData.push({ name: company, category: assignedCategory });
    });

    const uniqueData = categorizedData.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
    localStorage.setItem('companiesWithCategories', JSON.stringify(uniqueData));
    return uniqueData;
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Expenses</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">${{ totalExpenses }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem"><i class="pi pi-dollar text-orange-500 !text-xl"></i></div>
                </div>
                <span class="text-primary font-medium">%52+ </span><span class="text-muted-color">since last week</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Income</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">${{ totalIncome }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem"><i class="pi pi-dollar text-orange-500 !text-xl"></i></div>
                </div>
                <span class="text-primary font-medium">%52+ </span><span class="text-muted-color">since last week</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Net Balance</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">${{ netBalance }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem"><i class="pi pi-dollar text-orange-500 !text-xl"></i></div>
                </div>
                <span class="text-primary font-medium">%52+ </span><span class="text-muted-color">since last week</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Monthly Expenses</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">${{ monthlyExpenses[11] }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem"><i class="pi pi-dollar text-orange-500 !text-xl"></i></div>
                </div>
                <span class="text-primary font-medium">%52+ </span><span class="text-muted-color">since last week</span>
            </div>
        </div>
    </div>

    <div class="my-2">
        <p>first transaction data: {{ dateOfFirstTransaction }}</p>
        <p>latest transaction data: {{ dateOfLatestTransaction }}</p>
    </div>

    <div>
        <h2>Upload and Display CSV</h2>
        <input type="file" @change="handleFileUpload" accept=".csv" />

        <!-- <PieChart :labels="Object.keys(expensesByCategory)" :data="Object.values(expensesByCategory)" /> -->

        <!-- <StackedChart :labels="Object.keys(monthlyExpensesByCategory)" :data="monthlyExpensesByCategory" /> -->

        <div class="card">
            <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]" />
        </div>

        <p>tableData</p>
        <p>{{ tableData[0] }}</p>
        <p>totalExpenses</p>
        <p>{{ totalExpenses }}</p>
        <p>totalIncome</p>
        <p>{{ totalIncome }}</p>
        <p>netBalance</p>
        <p>{{ netBalance }}</p>
        <p>monthlyExpenses</p>
        <p>{{ monthlyExpenses }}</p>
        <p>monthlyIncome</p>
        <p>{{ monthlyIncome }}</p>
        <p>expensesByCategory</p>
        <p>{{ expensesByCategory }}</p>
        <p>expensesByCategory</p>
        <p>{{ expensesByCategory }}</p>
        <p>monthlyExpensesByCategory</p>
        <p>{{ monthlyExpensesByCategory }}</p>

        <div class="my-3">
            <Accordion value="0">
                <AccordionPanel value="0">
                    <AccordionHeader>Edit Columns</AccordionHeader>
                    <AccordionContent>
                        <div v-if="columns.length" class="flex flex-wrap gap-4">
                            <div v-for="col in columns" :key="col.key" class="checkbox-item">
                                <Checkbox v-model="visibleColumns" :value="col.key" @change="updateVisibleColumnsLocalStorage" />
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

        <DataTable v-if="tableData.length" :value="getTableData" :responsiveLayout="'scroll'">
            <template v-slot:header>
                <h3>Financial Table</h3>
            </template>

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
                    <Select v-model="data.category" :options="expenseCategories" filter optionLabel="name" placeholder="Select a category" class="w-full md:w-56" @change="updateExpenseCategory(data)">
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
