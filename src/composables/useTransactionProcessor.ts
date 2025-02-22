import { useUtils } from '@/composables/useUtils';
import { ref } from 'vue';

export function useTransactionProcessor() {
    const { formatToDDMMYYYY } = useUtils();

    const defaultExpenseCategories = [
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
    ];

    const companiesWithCategories = ref(JSON.parse(localStorage.getItem('companiesWithCategories')) || []);

    const expenseCategories = ref(JSON.parse(localStorage.getItem('expenseCategories')) || defaultExpenseCategories.value);

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

    const updateExpenseCategory = (data, columns) => {
        const companyName = data[columns[1]?.key];
        const existingCompanyIdx = companiesWithCategories.value.findIndex((company) => company.name === companyName);

        if (existingCompanyIdx) {
            companiesWithCategories.value[existingCompanyIdx].category = data.category;
        } else {
            companiesWithCategories.value.push({ name: companyName, category: data.category });
        }

        localStorage.setItem('companiesWithCategories', JSON.stringify(companiesWithCategories.value));
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

    const parseCSV = (csvData) => {
        try {
            const rows = csvData.split('\n').map((row) => row.split(','));
            if (!rows.length) throw new Error('Empty CSV file.');

            const headers = rows[0].map((header) => header.trim().replace(/^"|"$/g, '').replace(/\n/g, ''));
            if (headers.length < 2) throw new Error('CSV file is missing required columns.');

            const mappedHeaders = headers.map((header) => keyMapping[header] || header);

            const parsedData = rows.slice(1).map((row) => {
                const obj = {};
                mappedHeaders.forEach((mappedHeader, index) => {
                    let value = row[index]?.trim() || '';
                    value = value.replace(/^"|"$/g, '').replace(/\n/g, '');

                    // Format date fields
                    // if (mappedHeader === 'date' && /^\d{8}$/.test(value)) {
                    //     value = formatToDDMMYYYY(value);
                    // }

                    // Parse amounts
                    if (mappedHeader === 'amount') {
                        value = parseFloat(value.replace(',', '.')) || 0;
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
            return [];
        }
    };

    const categorizeCompanies = (companies, categories = defaultExpenseCategories, keywords = categoryKeywords) => {
        const categorizedData = companies.map((company) => {
            let assignedCategory = { name: 'Other', key: 'other' };

            for (const [categoryKey, categoryKeywords] of Object.entries(keywords)) {
                const regex = new RegExp(categoryKeywords.join('|'), 'i');
                if (regex.test(company)) {
                    assignedCategory = categories.find((cat) => cat.key === categoryKey) || assignedCategory;
                    break;
                }
            }

            return { name: company, category: assignedCategory };
        });

        // Remove duplicates
        return categorizedData.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
    };

    const processTransactions = (csvData) => {
        const parsedTransactions = parseCSV(csvData);

        // Get unique company names
        const companies = [...new Set(parsedTransactions.map((t) => t.description))];

        // Categorize companies
        const categorizedCompanies = categorizeCompanies(companies);

        // Add categories to transactions
        const categorizedTransactions = parsedTransactions.map((transaction) => {
            const matchingCompany = categorizedCompanies.find((company) => transaction.description.includes(company.name));

            return {
                ...transaction,
                category: matchingCompany?.category || { name: 'Other', key: 'other' }
            };
        });

        return {
            transactions: categorizedTransactions,
            companiesWithCategories: categorizedCompanies
        };
    };

    const generateTableData = (data) => {
        if (!data || data.length === 0)
            return {
                tempColumns: [],
                tempTableData: [],
                tempVisibleColumns: []
            };

        const tempColumns = Object.keys(data[0]).map((key) => ({
            key: key,
            name: key.charAt(0).toUpperCase() + key.slice(1)
        }));

        const tempTableData = data;
        const tempVisibleColumns = tempColumns.map((col) => col.key);

        return { tempColumns, tempTableData, tempVisibleColumns };
    };

    // Function to check if a transaction is an expense
    const isExpense = (transaction) => transaction.counterparty === '';

    // Function to determine the month for a given date (custom month range)
    const getCustomMonth = (date) => {
        const parsedDate = new Date(date);
        const day = parsedDate.getDate();
        const month = parsedDate.getMonth();
        const year = parsedDate.getFullYear();

        // If the date is before the 25th, consider it part of the previous month
        if (day < 25) {
            return { month: month, year: year };
        } else {
            const nextMonth = (month + 1) % 12;
            const nextYear = month === 11 ? year + 1 : year;
            return { month: nextMonth, year: nextYear };
        }
    };

    // Function to calculate total and monthly expenses
    const calculateExpenses = (transactions) => {
        const totalExpenses = transactions.filter(isExpense).reduce((acc, transaction) => acc + transaction.amount, 0);

        const monthlyExpenses = {};

        transactions.forEach((transaction) => {
            if (isExpense(transaction)) {
                const { month, year } = getCustomMonth(transaction.date);
                const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // Format "YYYY-MM"

                if (!monthlyExpenses[monthKey]) {
                    monthlyExpenses[monthKey] = 0;
                }

                monthlyExpenses[monthKey] += transaction.amount;
            }
        });

        return { totalExpenses, monthlyExpenses };
    };

    return {
        parseCSV,
        categorizeCompanies,
        processTransactions,
        generateTableData,
        defaultExpenseCategories,
        categoryKeywords,
        expenseCategories,
        updateExpenseCategory,
        calculateExpenses
    };
}
