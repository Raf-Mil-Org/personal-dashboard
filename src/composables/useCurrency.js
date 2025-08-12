import { computed, ref } from 'vue';
import { 
    parseCurrency, 
    formatCurrency, 
    formatAmount, 
    addAmounts, 
    subtractAmounts, 
    multiplyAmount,
    getAmountType,
    isValidAmount,
    roundAmount
} from '@/utils/currencyUtils';

/**
 * Vue composable for currency handling
 * Provides reactive currency formatting and calculations
 */
export function useCurrency(options = {}) {
    const {
        currency = 'EUR',
        locale = 'en-US',
        defaultAmount = 0
    } = options;

    // Reactive amount storage
    const amount = ref(defaultAmount);
    
    // Computed formatted values
    const formattedAmount = computed(() => {
        return formatCurrency(amount.value, { currency, locale });
    });
    
    const formattedAmountNoSymbol = computed(() => {
        return formatAmount(amount.value, { locale });
    });
    
    const amountType = computed(() => {
        return getAmountType(amount.value);
    });
    
    const isPositive = computed(() => amountType.value === 'positive');
    const isNegative = computed(() => amountType.value === 'negative');
    const isZero = computed(() => amountType.value === 'zero');
    
    // Methods
    const setAmount = (value) => {
        amount.value = parseCurrency(value);
    };
    
    const add = (value) => {
        amount.value = addAmounts(amount.value, value);
    };
    
    const subtract = (value) => {
        amount.value = subtractAmounts(amount.value, value);
    };
    
    const multiply = (multiplier) => {
        amount.value = multiplyAmount(amount.value, multiplier);
    };
    
    const round = (decimals = 2) => {
        amount.value = roundAmount(amount.value, decimals);
    };
    
    const validate = (value) => {
        return isValidAmount(value);
    };
    
    return {
        // Reactive values
        amount: computed(() => amount.value),
        formattedAmount,
        formattedAmountNoSymbol,
        amountType,
        isPositive,
        isNegative,
        isZero,
        
        // Methods
        setAmount,
        add,
        subtract,
        multiply,
        round,
        validate,
        
        // Utility functions
        parseCurrency,
        formatCurrency: (value) => formatCurrency(value, { currency, locale }),
        formatAmount: (value) => formatAmount(value, { locale })
    };
}

/**
 * Composable for handling multiple currency amounts
 */
export function useCurrencyList(options = {}) {
    const amounts = ref([]);
    
    const total = computed(() => {
        return addAmounts(...amounts.value);
    });
    
    const formattedTotal = computed(() => {
        return formatCurrency(total.value, options);
    });
    
    const addAmount = (value) => {
        amounts.value.push(parseCurrency(value));
    };
    
    const removeAmount = (index) => {
        amounts.value.splice(index, 1);
    };
    
    const clearAmounts = () => {
        amounts.value = [];
    };
    
    const setAmounts = (newAmounts) => {
        amounts.value = newAmounts.map(parseCurrency);
    };
    
    return {
        amounts: computed(() => amounts.value),
        total,
        formattedTotal,
        addAmount,
        removeAmount,
        clearAmounts,
        setAmounts
    };
}
