<script setup>
import { computed, defineEmits, defineProps, ref, watch } from 'vue';

// Define props
const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    step: { type: Number, default: 1 },
    format: { type: Boolean, default: true },
    locale: { type: String, default: 'nl-NL' }, // Defaulting to Dutch locale
    currency: { type: String, default: null },
    useGrouping: { type: Boolean, default: true },
    minFractionDigits: { type: Number, default: 0 },
    maxFractionDigits: { type: Number, default: 5 },
    readonly: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    inputClass: { type: [String, Object], default: null },
    inputStyle: { type: Object, default: null },
    ariaLabel: { type: String, default: null },
    ariaLabelledby: { type: String, default: null }
});

// Define emits
const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

// Input reference
const inputRef = ref(null);

// ✅ Computed property for formatted value
const formattedValue = computed(() => {
    if (props.format && props.modelValue !== '') {
        return formatValue(props.modelValue);
    }
    return props.modelValue;
});

// ✅ Parse the input to a number
const parseValue = (value) => {
    if (typeof value === 'number') return value;

    let parsed = value.replace(/\s/g, '').replace(',', '.'); // Convert comma decimals
    parsed = parsed.replace(/[^0-9.\-]/g, ''); // Remove non-numeric characters

    let num = parseFloat(parsed);
    if (isNaN(num)) return null;

    // Ensure value is within min/max limits
    if (props.min !== null && num < props.min) num = props.min;
    if (props.max !== null && num > props.max) num = props.max;

    return num;
};

// ✅ Format a number using locale settings
const formatValue = (value) => {
    if (props.currency) {
        return new Intl.NumberFormat(props.locale, {
            style: 'currency',
            currency: props.currency,
            minimumFractionDigits: props.minFractionDigits,
            maximumFractionDigits: props.maxFractionDigits,
            useGrouping: props.useGrouping
        }).format(value);
    }

    return new Intl.NumberFormat(props.locale, {
        minimumFractionDigits: props.minFractionDigits,
        maximumFractionDigits: props.maxFractionDigits,
        useGrouping: props.useGrouping
    }).format(value);
};

// ✅ Handle user input
const handleInput = (event) => {
    let rawValue = event.target.value;
    let parsedValue = parseValue(rawValue);

    emit('update:modelValue', parsedValue);
};

// ✅ Handle focus event
const handleFocus = (event) => {
    emit('focus', event);
};

// ✅ Handle blur event (ensures formatting)
const handleBlur = (event) => {
    let parsedValue = parseValue(event.target.value);
    emit('update:modelValue', parsedValue);
    emit('blur', event);
};

// ✅ Watch for external changes in `modelValue`
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue !== null) {
            inputRef.value.value = formatValue(newValue);
        }
    }
);
</script>

<template>
    <input
        ref="inputRef"
        type="text"
        :value="formattedValue"
        :class="inputClass"
        :style="inputStyle"
        :placeholder="placeholder"
        :readonly="readonly"
        :disabled="disabled"
        :aria-labelledby="ariaLabelledby"
        :aria-label="ariaLabel"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
    />
</template>
