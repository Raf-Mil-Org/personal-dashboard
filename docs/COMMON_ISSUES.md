# 🐛 Common Issues & Solutions

This document captures common problems encountered during development and their solutions.

## 🔧 PrimeVue Component Issues

### Checkbox Array Binding Error

**Problem**: `In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`

**Root Cause**: Incorrect PrimeVue Checkbox binding pattern for managing arrays of selected values.

**Symptoms**:

-   Error occurs when clicking checkboxes
-   Column visibility not working correctly
-   Checkboxes show wrong state (visible but unchecked)

**Solution**:

```vue
<!-- CORRECT - Use v-model with :value -->
<Checkbox v-model="visibleColumns" :value="column" />

<!-- WRONG - Don't use manual array manipulation -->
<Checkbox :modelValue="visibleColumns.includes(column)" @update:modelValue="toggleColumn(column)" />
```

**Prevention**:

-   Always initialize arrays properly: `const visibleColumns = ref([])`
-   Use PrimeVue's standard array binding pattern
-   Add array safety checks: `Array.isArray(visibleColumns.value)`

### FileUpload 404 Error

**Problem**: `http://localhost:5173/null 404 (Not Found)` when uploading files.

**Root Cause**: PrimeVue FileUpload component attempting POST request to null URL.

**Solution**:

```vue
<!-- CORRECT - Handle file selection directly -->
<FileUpload :auto="true" @select="onFileSelect" accept=".csv" :maxFileSize="1000000" />

<!-- WRONG - Don't use @upload without proper URL -->
<FileUpload @upload="onFileUpload" url="null" />
```

**Prevention**:

-   Use `:auto="true"` for client-side file handling
-   Handle file parsing in `@select` event
-   Don't use `@upload` unless you have a proper backend endpoint

## 📊 CSV Parsing Issues

### European Format Support

**Problem**: CSV with semicolon delimiters and comma decimal separators not parsed correctly.

**Root Cause**: Hardcoded comma delimiter and standard number parsing.

**Solution**:

```javascript
// Detect delimiter automatically
function detectDelimiter(firstLine) {
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    return semicolonCount >= commaCount ? ';' : ',';
}

// Handle European amount format
function parseEuropeanAmount(amountStr) {
    return parseFloat(amountStr.replace(',', '.'));
}
```

**Prevention**:

-   Always detect CSV format dynamically
-   Support multiple delimiter types
-   Handle different number formats

### Field Mapping Issues

**Problem**: "No Date, No Description, No Amount" displayed for all rows.

**Root Cause**: Hardcoded field names that don't match actual CSV headers.

**Solution**:

```javascript
// Support multiple field name variations
const date = transaction.Date || transaction.date || '';
const amount = transaction['Amount (EUR)'] || transaction.Amount || transaction.amount || '';
const description = transaction['Name / Description'] || transaction.Description || '';
```

**Prevention**:

-   Use dynamic field mapping
-   Support multiple header name variations
-   Test with actual CSV files

## 💾 localStorage Issues

### Array Corruption

**Problem**: `visibleColumns` becomes non-array, causing iteration errors.

**Root Cause**: localStorage data corruption or improper initialization.

**Solution**:

```javascript
function loadColumnPreferences() {
    try {
        const saved = localStorage.getItem('COLUMN_PREFERENCES');
        if (saved) {
            const preferences = JSON.parse(saved);
            // Always ensure it's an array
            visibleColumns.value = Array.isArray(preferences.visibleColumns) ? preferences.visibleColumns : [];
        }
    } catch (error) {
        // Fallback to empty array
        visibleColumns.value = [];
    }
}
```

**Prevention**:

-   Always wrap localStorage operations in try-catch
-   Validate data types before use
-   Provide fallback values

### Persistence Issues

**Problem**: Column preferences not saved when checkboxes are toggled.

**Root Cause**: Missing watchers or incorrect event handling.

**Solution**:

```javascript
// Add watcher for automatic persistence
watch(
    visibleColumns,
    () => {
        saveColumnPreferences();
    },
    { deep: true }
);
```

**Prevention**:

-   Use Vue watchers for reactive data
-   Test persistence functionality
-   Add error handling for save operations

## 🎨 UI/UX Issues

### Column Visibility State Mismatch

**Problem**: Column visible in table but checkbox not checked.

**Root Cause**: Incorrect checkbox binding or state management.

**Solution**:

-   Use correct PrimeVue Checkbox pattern
-   Ensure state synchronization
-   Add proper watchers

**Prevention**:

-   Follow PrimeVue documentation
-   Test checkbox state consistency
-   Use reactive data properly

## 🔍 Debugging Tips

### Console Debugging

```javascript
// Debug array issues
console.log('visibleColumns:', visibleColumns.value);
console.log('Array.isArray:', Array.isArray(visibleColumns.value));

// Debug CSV parsing
console.log('CSV headers:', headers);
console.log('Parsed transactions:', transactions);

// Debug localStorage
console.log('Saved preferences:', localStorage.getItem('COLUMN_PREFERENCES'));
```

### Vue DevTools

-   Check reactive data state
-   Monitor component props
-   Verify watcher behavior

## 📋 Prevention Checklist

### Before Implementing New Features

-   [ ] Check existing documentation for similar patterns
-   [ ] Review PrimeVue component documentation
-   [ ] Test with actual data formats
-   [ ] Add error handling and fallbacks

### Before Deploying

-   [ ] Test all user interactions
-   [ ] Verify data persistence
-   [ ] Check console for errors
-   [ ] Test with different data formats

### After Fixing Issues

-   [ ] Document the problem and solution
-   [ ] Update relevant documentation
-   [ ] Add prevention measures
-   [ ] Test similar scenarios

## 🔄 Update History

-   **2024-01-XX**: Initial documentation of common issues
-   **2024-01-XX**: Added PrimeVue Checkbox binding solutions
-   **2024-01-XX**: Added CSV parsing and European format support
-   **2024-01-XX**: Added localStorage and persistence solutions

---

**Note**: This document should be updated whenever new issues are encountered and resolved. Always include the problem description, root cause analysis, solution, and prevention measures.
