// composables/useTransactionStore.js
import { ref, watch } from 'vue';

// Default rules for first run
const defaultRules = [
    { match: 'ALBERT HEIJN', category: 'Groceries & household' },
    { match: 'BOLT', category: 'Transport & travel' },
    { match: 'Hairstudio', category: 'Health & Wellness' }
];

const RULES_KEY = 'finance_rules';
const TX_KEY = 'finance_transactions';

const storedRules = JSON.parse(localStorage.getItem(RULES_KEY)) || defaultRules;
const storedTransactions = JSON.parse(localStorage.getItem(TX_KEY)) || [];

export const rules = ref(storedRules);
export const transactions = ref(storedTransactions);

watch(
    rules,
    (val) => {
        localStorage.setItem(RULES_KEY, JSON.stringify(val));
    },
    { deep: true }
);

watch(
    transactions,
    (val) => {
        localStorage.setItem(TX_KEY, JSON.stringify(val));
    },
    { deep: true }
);

export function autoCategorize(description) {
    for (const rule of rules.value) {
        if (description.toLowerCase().includes(rule.match.toLowerCase())) {
            return rule.category;
        }
    }
    return 'Uncategorized';
}

// Initialize uncategorized ones with rule check
export function importTransactions(rawTxs) {
    const enriched = rawTxs.map((tx) => ({
        ...tx,
        category: autoCategorize(tx.description)
    }));
    transactions.value = enriched;
}
