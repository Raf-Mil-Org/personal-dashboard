# 🎨 PrimeVue Patterns & Best Practices

This document captures correct usage patterns for PrimeVue components based on lessons learned from the project.

## 📋 Component Patterns

### Checkbox with Array Binding

**Use Case**: Managing multiple selected values (e.g., column visibility)

**Correct Pattern**:

```vue
<template>
    <div class="column-controls">
        <div v-for="column in availableColumns" :key="column" class="column-checkbox">
            <Checkbox v-model="visibleColumns" :value="column" :binary="false" />
            <label>{{ getColumnDisplayName(column) }}</label>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const visibleColumns = ref([]); // Always initialize as array

// Add watcher for automatic persistence
watch(
    visibleColumns,
    () => {
        saveColumnPreferences();
    },
    { deep: true }
);
</script>
```

**Key Points**:

-   Use `v-model="visibleColumns"` with `:value="column"`
-   Set `:binary="false"` for array mode
-   Always initialize as empty array
-   Add watchers for persistence

**Wrong Patterns**:

```vue
<!-- DON'T: Manual array manipulation -->
<Checkbox :modelValue="visibleColumns.includes(column)" @update:modelValue="toggleColumn(column)" />

<!-- DON'T: Missing binary prop -->
<Checkbox v-model="visibleColumns" :value="column" />
```

### FileUpload for Client-Side Processing

**Use Case**: CSV file upload and parsing

**Correct Pattern**:

```vue
<template>
    <FileUpload :auto="true" @select="onFileSelect" accept=".csv" :maxFileSize="1000000" chooseLabel="Choose CSV File" cancelLabel="Cancel" :showCancelButton="false" :multiple="false" />
</template>

<script setup>
const onFileSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            const transactions = parseCSV(csvText);
            // Process transactions
        };
        reader.readAsText(file);
    }
};
</script>
```

**Key Points**:

-   Use `:auto="true"` for client-side handling
-   Handle file in `@select` event
-   Don't use `@upload` unless you have a backend endpoint
-   Set appropriate file size limits

**Wrong Patterns**:

```vue
<!-- DON'T: Using upload without proper URL -->
<FileUpload @upload="onFileUpload" url="null" />

<!-- DON'T: Missing auto prop -->
<FileUpload @select="onFileSelect" />
```

### DataTable with Dynamic Columns

**Use Case**: Displaying CSV data with configurable columns

**Correct Pattern**:

```vue
<template>
    <DataTable
        :value="filteredTransactions"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions"
        :loading="loading"
        stripedRows
        showGridlines
        responsiveLayout="scroll"
    >
        <!-- Dynamic columns based on visibleColumns -->
        <Column v-for="column in visibleColumns" :key="column" :field="column" :header="getColumnDisplayName(column)" :sortable="true">
            <template #body="{ data }">
                <span v-html="formatFieldValue(data[column], column)"></span>
            </template>
        </Column>

        <!-- Tag column -->
        <Column field="tag" header="Tag" :sortable="false" style="width: 150px">
            <template #body="{ data }">
                <Dropdown v-model="tags[data.id]" :options="availableTags" placeholder="Select Tag" @change="updateTransactionTag(data.id, $event.value)" />
            </template>
        </Column>
    </DataTable>
</template>
```

**Key Points**:

-   Use `v-for` with `visibleColumns` for dynamic columns
-   Provide proper templates for custom formatting
-   Handle missing data gracefully
-   Use appropriate column widths

### SelectButton for Filters

**Use Case**: Transaction type filtering

**Correct Pattern**:

```vue
<template>
    <div class="filter-controls">
        <SelectButton v-model="selectedFilter" :options="filterOptions" optionLabel="label" optionValue="value" class="mb-3" />
    </div>
</template>

<script setup>
const filterOptions = [
    { label: 'All Transactions', value: 'all' },
    { label: 'Expenses', value: 'expense' },
    { label: 'Income', value: 'income' }
];

const selectedFilter = ref('all');
</script>
```

**Key Points**:

-   Use `optionLabel` and `optionValue` for object arrays
-   Provide clear, descriptive labels
-   Use reactive data for selection

### Dropdown for Tag Selection

**Use Case**: Assigning tags to transactions

**Correct Pattern**:

```vue
<template>
    <Dropdown v-model="selectedTag" :options="availableTags" placeholder="Select Tag" :editable="true" @change="onTagChange" class="w-full" />
</template>

<script setup>
const availableTags = ref(['Groceries', 'Utilities', 'Dining', 'Transport', 'Health', 'Entertainment', 'Subscriptions', 'Housing', 'Other']);

const selectedTag = ref(null);

const onTagChange = (event) => {
    // Handle tag selection
    console.log('Selected tag:', event.value);
};
</script>
```

**Key Points**:

-   Use `:editable="true"` for custom tag input
-   Provide placeholder text
-   Handle change events properly
-   Use appropriate styling classes

## 🎯 Best Practices

### Reactive Data Management

```javascript
// Always initialize reactive data properly
const visibleColumns = ref([]);
const selectedFilter = ref('all');
const tags = ref({});

// Use watchers for side effects
watch(
    visibleColumns,
    () => {
        saveColumnPreferences();
    },
    { deep: true }
);

// Provide fallback values
const getFieldValue = (data, field) => {
    return data[field] || data[field.toLowerCase()] || '';
};
```

### Error Handling

```javascript
// Wrap localStorage operations
function loadPreferences() {
    try {
        const saved = localStorage.getItem('PREFERENCES');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
    return getDefaultPreferences();
}

// Validate data before use
function validateTransaction(transaction) {
    return transaction && typeof transaction === 'object' && transaction.id;
}
```

### Performance Optimization

```javascript
// Use computed properties for expensive operations
const filteredTransactions = computed(() => {
    return transactions.value.filter((transaction) => {
        // Filtering logic
    });
});

// Debounce expensive operations
const debouncedSave = debounce(() => {
    saveToLocalStorage();
}, 300);
```

## ⚠️ Common Pitfalls

### Array Binding Issues

-   **Problem**: Using manual array manipulation with Checkbox
-   **Solution**: Use PrimeVue's built-in array binding
-   **Prevention**: Always use `v-model` with `:value`

### File Upload Issues

-   **Problem**: Using `@upload` without proper backend
-   **Solution**: Use `:auto="true"` with `@select`
-   **Prevention**: Understand component behavior before implementation

### Reactive Data Issues

-   **Problem**: Not initializing reactive data properly
-   **Solution**: Always provide initial values
-   **Prevention**: Use TypeScript or JSDoc for type safety

## 🔄 Update History

-   **2024-01-XX**: Initial documentation of PrimeVue patterns
-   **2024-01-XX**: Added Checkbox array binding patterns
-   **2024-01-XX**: Added FileUpload client-side patterns
-   **2024-01-XX**: Added DataTable dynamic column patterns

---

**Note**: This document should be updated whenever new PrimeVue patterns are discovered or when existing patterns are improved. Always test patterns before documenting them.
