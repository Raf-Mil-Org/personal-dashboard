# Transaction Analyzer Enhancements

## Overview

The Transaction Analyzer has been enhanced to support multiple file formats with advanced duplicate detection and automatic tag mapping functionality.

## New Features

### 1. Multi-Format Support

The system now supports both CSV and JSON transaction formats:

#### CSV Format

-   Standard European bank transaction exports
-   Semicolon or comma delimited
-   Automatic column detection and mapping

#### JSON Format

-   Structured transaction data with the following format:

```json
{
    "transactions": [
        {
            "id": "unique-transaction-id",
            "executionDate": "2025-08-03",
            "amount": {
                "currency": "EUR",
                "value": "-29.27"
            },
            "category": {
                "description": "Groceries & household"
            },
            "subCategory": {
                "description": "Groceries"
            },
            "subject": "Transaction description"
        }
    ]
}
```

### 2. Duplicate Detection

The system automatically detects and prevents duplicate transactions:

-   **JSON files**: Uses the transaction `id` field for duplicate detection
-   **CSV files**: Creates fingerprints from date, amount, and description
-   Duplicates are automatically filtered out during upload
-   No duplicate transactions are stored in local storage

### 3. Tag Mapping System

#### Structured Category Data

The system now uses a comprehensive, structured category system with predefined categories and subcategories:

-   **Fixed expenses**: Housing costs, Daycare, Insurance, Utilities, Loans, Other
-   **Free time**: Activities & events, Sport, Hobbies, Holidays, Books & magazines, Games, Music, Movies, Lottery, Other
-   **Groceries & household**: Groceries, House & garden, Pets, Other
-   **Health & Wellness**: Medical expenses, Pharmacy & drugstore, Wellness, Beauty & hair care, Other
-   **Other**: Cash withdrawal, Credit card, Transfers, Charity, Education, Fines, Taxes, Extra loan repayment, Extra mortgage repayment, Savings, Investment, Business expenses, Other
-   **Restaurants & bars**: Bars, Coffee bars, Snacks, Lunch, Restaurants, Other
-   **Shopping**: Clothes, Accessories, Software & electronics, Online shopping, Gifts, Other
-   **Transport & travel**: Car, Fuel, Parking, Public transport, Flight tickets, Taxi, Bicycle, Other
-   **Group this yourself**: Group this yourself
-   **To your accounts**: Savings, Joint account, Investment account, Other

#### Automatic Tag Assignment

-   If a transaction already has a tag, it will be preserved
-   If no tag exists, the system maps category/subcategory combinations to tags
-   Default mappings cover all structured categories with intelligent tag assignment:
    -   Groceries & household → Groceries
    -   Transport & travel → Transport
    -   Restaurants & bars → Dining
    -   Free time → Entertainment
    -   Fixed expenses → Housing/Utilities/Other
    -   Health & Wellness → Health
    -   Shopping → Shopping
    -   Other categories → Other

#### Enhanced Tag Mapping Manager

-   **Structured Selection**: Use PrimeVue dropdown components for category and subcategory selection
-   **Dynamic Subcategories**: Subcategory dropdown automatically updates based on selected category
-   **Validation**: Ensures only valid category/subcategory combinations can be mapped
-   **Custom Mappings**: Add custom mappings for specific category/subcategory combinations
-   **Export/Import**: Export and import mapping configurations
-   **Reset to Defaults**: Reset to default mappings if needed
-   **Test Functionality**: Built-in test component to verify mappings work correctly

### 4. Enhanced User Interface

#### File Upload

-   Updated to accept both `.csv` and `.json` files
-   Clear documentation of supported formats
-   Direct access to Tag Mapping Manager

#### Documentation

-   Comprehensive help dialog explaining all features
-   File format specifications
-   Usage instructions

## Usage Instructions

### 1. Uploading Files

1. Navigate to the Transaction Analyzer page
2. Click "Choose File" or drag and drop your transaction file
3. The system will automatically detect the format and parse accordingly
4. Duplicates will be automatically filtered out
5. Tags will be assigned based on category/subcategory mapping

### 2. Managing Tag Mappings

1. Click "Manage Tag Mappings" button
2. Add new mappings by specifying:
    - Category (e.g., "Groceries & household")
    - Subcategory (e.g., "Groceries")
    - Tag (e.g., "Groceries")
3. Remove unwanted mappings
4. Export/import mapping configurations

### 3. Manual Tag Editing

-   Use the dropdown in the "Category" column to manually assign tags
-   Changes are automatically saved to local storage

## Technical Implementation

### New Composables

#### `useMultiFormatParser.js`

-   Handles parsing of both CSV and JSON formats
-   Implements duplicate detection logic
-   Manages tag mapping system
-   Provides utility functions for transaction processing

### New Components

#### `TagMappingManager.vue`

-   User interface for managing tag mappings
-   Add/remove custom mappings
-   Export/import functionality
-   Reset to defaults option

### Enhanced Components

#### `TransactionAnalyzer.vue`

-   Updated to use the new multi-format parser
-   Enhanced file upload with format detection
-   Added documentation dialog
-   Improved user feedback for duplicate detection

## File Structure

```
src/
├── composables/
│   ├── useMultiFormatParser.js     # New multi-format parser
│   ├── useCSVParser.js            # Existing CSV parser (enhanced)
│   └── useTransactionStore.js     # Enhanced transaction store
├── components/
│   └── TagMappingManager.vue      # New tag mapping manager
└── views/
    └── TransactionAnalyzer.vue    # Enhanced transaction analyzer
```

## Sample Files

-   `sample-transactions.csv` - Sample CSV format
-   `sample-transactions.json` - Sample JSON format

## Browser Compatibility

-   Modern browsers with ES6+ support
-   Local storage for data persistence
-   File API for file uploads

## Future Enhancements

-   Backend integration for data persistence
-   Advanced analytics and reporting
-   Bulk tag editing
-   Transaction categorization learning
-   Export to various formats (Excel, PDF)
-   Multi-currency support
-   Transaction search and filtering
