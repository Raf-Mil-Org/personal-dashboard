# Frontend Documentation - Transaction Analyzer System

## Overview

The frontend has been significantly enhanced with a comprehensive **Transaction Analyzer** system that supports multiple file formats, intelligent tag assignment, and advanced data management capabilities.

## 🏗️ Architecture Overview

### Core Components

1. **TransactionAnalyzer.vue** - Main transaction analysis interface
2. **TagMappingManager.vue** - Tag mapping configuration interface
3. **TagAssignmentTest.vue** - Testing interface for tag assignment logic
4. **TagMappingTest.vue** - Testing interface for tag mappings

### Core Composables

1. **useMultiFormatParser.js** - Handles CSV and JSON parsing with duplicate detection
2. **useTransactionStore.js** - Manages transaction data, persistence, and statistics
3. **useCSVParser.js** - Legacy CSV parsing (now integrated into multi-format parser)

### Data Management

1. **columnMapping.js** - Standardizes column names across different formats
2. **categories.js** - Structured category and subcategory definitions

## 📁 File Structure

```
src/
├── views/
│   └── TransactionAnalyzer.vue          # Main transaction analysis interface
├── components/
│   ├── TagMappingManager.vue            # Tag mapping configuration
│   ├── TagAssignmentTest.vue            # Tag assignment testing
│   └── TagMappingTest.vue               # Tag mapping testing
├── composables/
│   ├── useMultiFormatParser.js          # Multi-format parsing logic
│   ├── useTransactionStore.js           # Transaction data management
│   └── useCSVParser.js                  # Legacy CSV parser
├── data/
│   ├── columnMapping.js                 # Column standardization
│   └── categories.js                    # Category definitions
└── router/
    └── index.js                         # Route definitions
```

## 🚀 Key Features

### 1. Multi-Format File Support

#### Supported Formats

**CSV Format:**

-   European bank transaction exports
-   Semicolon or comma delimited
-   Automatic column detection
-   Example: `Date;Amount;Description;Tag`

**JSON Format:**

-   Structured transaction data
-   Nested category/subcategory objects
-   Example: `{"transactions": [{"id": "123", "amount": {"value": "-29.27"}}]}`

#### File Upload Interface

```vue
<FileUpload :multiple="false" accept=".csv,.json" @select="onFileSelect" chooseLabel="Choose File" />
```

### 2. Intelligent Duplicate Detection

#### Detection Methods

**JSON Files:**

-   Uses transaction `id` field for exact matching
-   Prevents duplicate uploads based on unique identifiers

**CSV Files:**

-   Creates fingerprints from date, amount, and description
-   Generates unique transaction IDs for tracking

### 3. Global Search Functionality

#### Search Features

-   **Multi-field Search**: Searches across description, tag, category, subcategory, amount, date, account, and counterparty
-   **Case-insensitive**: Search is not case-sensitive for better user experience
-   **Real-time Filtering**: Results update as you type
-   **Clear Search**: Easy-to-use clear button when search is active
-   **Search Statistics**: Shows filtered vs total transaction counts

#### Implementation

```javascript
const searchFilteredTransactions = computed(() => {
    if (!searchTerm.value.trim()) {
        return filteredTransactions.value;
    }

    const searchLower = searchTerm.value.toLowerCase().trim();

    return filteredTransactions.value.filter((transaction) => {
        const searchableFields = [transaction.description, transaction.tag, transaction.category, transaction.subcategory, transaction.amount, transaction.date, transaction.account, transaction.counterparty]
            .filter((field) => field != null)
            .map((field) => field.toString().toLowerCase());

        return searchableFields.some((field) => field.includes(searchLower));
    });
});
```

#### User Interface

```vue
<span class="p-input-icon-left w-full">
    <i class="pi pi-search" />
    <InputText 
        v-model="searchTerm" 
        placeholder="Search transactions by description, tag, category, amount, date..." 
        class="w-full"
    />
</span>
```

#### Implementation

```javascript
const generateTransactionFingerprint = (transaction) => {
    const { date, amount, description } = transaction;
    return `${date}_${amount}_${description}`.toLowerCase().replace(/\s+/g, '_');
};
```

### 4. Advanced Tag Assignment System

#### Priority-Based Assignment

1. **Priority 1: Existing Tag** - Preserves user-assigned tags
2. **Priority 2: Category/Subcategory Mapping** - Maps structured data
3. **Priority 3: Category-Only Mapping** - Uses category-level mapping
4. **Priority 4: No Tag** - Leaves null for manual assignment

#### Intelligent Category Detection

When transactions lack explicit category data, the system automatically detects categories from descriptions:

```javascript
const detectCategoryFromDescription = (description) => {
    const desc = description.toLowerCase();

    if (desc.includes('albert heijn') || desc.includes('lidl')) {
        return { category: 'Groceries & household', subcategory: 'Groceries' };
    }
    // ... more detection rules
};
```

### 5. Interactive Tag Management

#### Real-Time Tag Updates

-   **Dropdown Selection**: Users can change tags directly in the data table
-   **Immediate Persistence**: Changes are saved to localStorage instantly
-   **Visual Feedback**: Success notifications and checkmark indicators
-   **Statistics Update**: All calculations update automatically

#### Tag Mapping Configuration

-   **Category/Subcategory Selection**: Strict dropdown selection with predefined options
-   **Custom Mappings**: Users can create custom category-to-tag mappings
-   **Export/Import**: Mappings can be exported and imported as JSON
-   **Reset Functionality**: Option to reset to default mappings

### 6. Data Visualization & Statistics

#### Summary Statistics

-   **Total Transactions**: Count of all loaded transactions
-   **Income/Expense Breakdown**: Automatic calculation based on debit/credit
-   **Net Amount**: Income minus expenses
-   **Category Breakdown**: Tag-based transaction grouping

### 7. Tag Component Visualization

#### Color-Coded Tags

The system uses PrimeVue's Tag component with semantic color coding:

-   **Green (Success)**: Groceries, Food, Restaurants, Income, Savings
-   **Blue (Info)**: Transport, Travel, Insurance, Subscriptions
-   **Purple (Help)**: Health, Wellness, Medical, Pharmacy
-   **Orange (Warning)**: Shopping, Clothes, Electronics
-   **Red (Danger)**: Entertainment, Leisure, Movies, Games
-   **Gray (Secondary)**: Housing, Utilities, Mortgage
-   **Blue (Primary)**: Default for other tags

#### Custom Tag Creation

Users can create their own custom tags with personalized colors:

-   **Tag Name Input**: Enter custom tag names (e.g., "Coffee", "Gym", "Books")
-   **Color Selection**: Choose from 7 predefined color options
-   **Live Preview**: See how the tag will look before creating it
-   **Duplicate Prevention**: System prevents duplicate tag names
-   **Persistent Storage**: Custom tags are saved to localStorage
-   **Integration**: Custom tags appear in all dropdowns and displays

#### Icon Mapping

Each tag type includes a relevant icon:

-   **Shopping Cart**: Groceries and food
-   **Car**: Transport and travel
-   **Heart**: Health and wellness
-   **Shopping Bag**: Shopping and retail
-   **Star**: Entertainment and leisure
-   **Home**: Housing and utilities
-   **Dollar**: Income and savings
-   **Shield**: Insurance and subscriptions
-   **Tag**: Default icon

#### Implementation

```javascript
// Tag color and icon mapping utility
export const getTagSeverity = (tag) => {
    const tagLower = tag.toLowerCase();

    if (tagLower.includes('grocery') || tagLower.includes('food')) {
        return 'success';
    }
    if (tagLower.includes('transport') || tagLower.includes('travel')) {
        return 'info';
    }
    // ... more mappings
    return 'primary';
};
```

#### Usage in Components

```vue
<Tag :value="getTagValue(tag)" :severity="getTagSeverity(tag, customTags)" :icon="getTagIcon(tag)" />
```

#### Custom Tag Management

```javascript
// Add custom tag
const addCustomTag = () => {
    const newTag = {
        name: tagName,
        color: selectedColor,
        createdAt: new Date().toISOString()
    };
    customTags.value.push(newTag);
    saveCustomTags();
};

// Remove custom tag
const removeCustomTag = (tagName) => {
    customTags.value = customTags.value.filter((tag) => tag.name !== tagName);
    saveCustomTags();
};
```

#### Interactive Data Table

-   **Column Visibility**: Users can show/hide columns
-   **Sorting**: All columns are sortable
-   **Filtering**: Filter by transaction type (income/expense)
-   **Search**: Global keyword search across multiple fields
-   **Tag Visualization**: Color-coded PrimeVue Tag components with icons
-   **Pagination**: Configurable rows per page

## 🔧 Technical Implementation

### 1. Reactive Data Management

#### Transaction Store

```javascript
// State management with Vue 3 Composition API
const transactions = ref([]);
const selectedFilter = ref('all');
const visibleColumns = ref([]);
const tags = ref({}); // Map of transaction ID to tag
```

#### Computed Properties

```javascript
const filteredTransactions = computed(() => {
    switch (selectedFilter.value) {
        case 'expenses':
            return transactions.value.filter((t) => t.debit_credit === 'Debit');
        case 'income':
            return transactions.value.filter((t) => t.debit_credit === 'Credit');
        default:
            return transactions.value;
    }
});
```

### 2. Column Standardization

#### Standard Column Names

```javascript
export const STANDARD_COLUMNS = {
    id: 'id',
    date: 'date',
    amount: 'amount',
    description: 'description',
    tag: 'tag',
    category: 'category',
    subcategory: 'subcategory'
    // ... more columns
};
```

#### Format Mapping

```javascript
export const mapCSVToStandard = (csvTransaction) => {
    return {
        date: csvTransaction.Date || csvTransaction.date,
        amount: csvTransaction['Amount (EUR)'] || csvTransaction.Amount,
        tag: csvTransaction.Tag || csvTransaction.tag
        // ... more mappings
    };
};
```

### 3. Post-Processing Pipeline

#### Tag Assignment Flow

1. **Parse File** → Extract raw data
2. **Map to Standard** → Convert to consistent format
3. **Post-Process** → Clean tags, detect categories
4. **Assign Tags** → Apply priority-based assignment
5. **Save Data** → Persist to localStorage

```javascript
const postProcessTransactions = (transactions) => {
    return transactions.map((transaction) => {
        // Clean up tag field
        let existingTag = transaction.tag;
        if (existingTag && existingTag.startsWith('#')) {
            existingTag = existingTag.substring(1);
        }

        // Detect categories if missing
        if (!transaction.category && transaction.description) {
            const detected = detectCategoryFromDescription(transaction.description);
            transaction.category = detected.category;
            transaction.subcategory = detected.subcategory;
        }

        // Assign tag with priority
        transaction.tag = determineTag(transaction.category, transaction.subcategory, existingTag);

        return transaction;
    });
};
```

## 🎨 User Interface Features

### 1. Transaction Analyzer Interface

#### File Upload Section

-   Drag-and-drop file upload
-   Support for CSV and JSON formats
-   File size validation (10MB limit)
-   Progress indicators

#### Statistics Dashboard

-   Real-time summary statistics
-   Category breakdown with transaction counts
-   Income/expense visualization
-   Net amount calculation

#### Data Table

-   Configurable column visibility
-   Sortable columns
-   Transaction type filtering
-   Global keyword search
-   Color-coded tag visualization
-   Pagination controls
-   Inline tag editing

### 2. Tag Mapping Manager

#### Add New Mappings

-   Category dropdown (populated from structured data)
-   Subcategory dropdown (dynamic based on category)
-   Tag dropdown (available tags)
-   Validation and error handling

#### Existing Mappings Display

-   Grouped by category
-   Clear category/subcategory/tag display
-   Remove mapping functionality
-   Mapping count summary

#### Management Actions

-   Reset to defaults
-   Export mappings (JSON)
-   Import mappings (JSON)
-   Test functionality links

### 3. Testing Interfaces

#### Tag Assignment Test

-   Predefined test scenarios
-   Interactive testing
-   Real-time result display
-   Comprehensive logging

#### Tag Mapping Test

-   Category/subcategory selection
-   Tag mapping verification
-   Sample transaction testing

## 🔄 Data Flow

### 1. File Upload Process

```
User Uploads File
    ↓
Parse File (CSV/JSON)
    ↓
Map to Standard Format
    ↓
Remove Duplicates
    ↓
Post-Process (Tag Assignment)
    ↓
Save to Store
    ↓
Update UI
```

### 2. Tag Update Process

```
User Changes Tag
    ↓
Update Transaction Store
    ↓
Save to LocalStorage
    ↓
Recalculate Statistics
    ↓
Force Table Re-render
    ↓
Show Success Notification
```

### 3. Data Persistence

#### LocalStorage Keys

-   `transaction_analyzer_csv_data` - Transaction data
-   `transaction_analyzer_tags` - Tag assignments
-   `transaction_analyzer_column_preferences` - UI preferences
-   `customTagMapping` - Custom tag mappings

## 🧪 Testing & Debugging

### 1. Console Logging

The system provides comprehensive logging for debugging:

```javascript
console.log('🔄 Post-processing transactions for tag assignment...');
console.log(`🔍 Detected category for "${description}":`, detected);
console.log(`🏷️ Final tag assignment:`, { existingTag, category, subcategory, finalTag });
```

### 2. Test Components

#### Tag Assignment Test

-   Tests the `determineTag()` function
-   Shows priority system in action
-   Interactive testing interface

#### Tag Mapping Test

-   Tests category/subcategory mappings
-   Verifies mapping configuration
-   Sample transaction testing

### 3. Error Handling

-   File parsing errors with user feedback
-   Invalid data format handling
-   Network error recovery
-   LocalStorage error handling

## 📊 Performance Considerations

### 1. Data Processing

-   Efficient duplicate detection algorithms
-   Optimized column mapping
-   Lazy loading for large datasets

### 2. UI Responsiveness

-   Debounced search and filtering
-   Virtual scrolling for large tables
-   Optimized re-rendering with reactive keys

### 3. Memory Management

-   Proper cleanup of file references
-   Efficient data structures
-   Minimal localStorage usage

## 🔮 Future Enhancements

### Planned Features

1. **Backend Integration** - API endpoints for data persistence
2. **Advanced Analytics** - Spending patterns and trends
3. **Export Options** - PDF reports and charts
4. **Bulk Operations** - Mass tag editing
5. **Machine Learning** - Intelligent category suggestions

### Technical Improvements

1. **TypeScript Migration** - Better type safety
2. **Unit Testing** - Comprehensive test coverage
3. **Performance Optimization** - Virtual scrolling for large datasets
4. **Accessibility** - WCAG compliance improvements

## 📚 Related Documentation

-   **[TAG_ASSIGNMENT_LOGIC.md](./TAG_ASSIGNMENT_LOGIC.md)** - Detailed tag assignment logic
-   **[TRANSACTION_ANALYZER_ENHANCEMENTS.md](./TRANSACTION_ANALYZER_ENHANCEMENTS.md)** - Feature enhancements overview
-   **[README.md](./README.md)** - Project overview and setup

## 🛠️ Development Setup

### Prerequisites

-   Node.js 16+
-   Vue 3
-   PrimeVue components
-   Tailwind CSS

### Installation

```bash
npm install
npm run dev
```

### Key Dependencies

-   `vue` - Core framework
-   `primevue` - UI component library
-   `@vueuse/core` - Composition utilities
-   `tailwindcss` - Styling framework

---

This documentation covers the comprehensive Transaction Analyzer system implemented in the frontend. For specific implementation details, refer to the individual component files and related documentation.
