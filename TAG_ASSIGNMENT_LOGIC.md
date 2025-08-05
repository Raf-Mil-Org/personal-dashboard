# Tag Assignment Logic Documentation

## Overview

The transaction analyzer implements a sophisticated tag assignment system that handles different data sources (CSV and JSON) with proper priority handling. This document explains the approach, logic flow, and implementation details.

## Tag Assignment Priority System

### Priority Hierarchy

The system follows a strict priority order when assigning tags to transactions:

1. **Priority 1: Existing Tag** (Highest Priority)

    - If a transaction already has a `tag` field with a value, use it
    - This preserves user-assigned tags and prevents overwriting

2. **Priority 2: Category/Subcategory Mapping** (Medium Priority)

    - If no existing tag, use the category/subcategory mapping system
    - Maps structured category data to predefined tags

3. **Priority 3: Category-Only Mapping** (Low Priority)

    - If no subcategory mapping exists, use category-level mapping
    - Uses the first available subcategory for the given category

4. **Priority 4: No Tag** (Lowest Priority)
    - If no mapping exists, leave tag as `null`
    - User can manually assign tags later

## Data Source Handling

### CSV Format

**Input Structure:**

```csv
Date,Amount,Description,Tag,Category,Subcategory
2025-01-01,-29.27,Lidl,Groceries,Food,Shopping
```

**Processing:**

1. Extract `Tag` field directly from CSV
2. If `Tag` exists and is not empty → **Use existing tag** (Priority 1)
3. If no `Tag` → Map from `Category`/`Subcategory` fields (Priority 2-3)

### JSON Format

**Input Structure:**

```json
{
    "transactions": [
        {
            "id": "123",
            "executionDate": "2025-01-01",
            "amount": { "value": "-29.27", "currency": "EUR" },
            "category": { "description": "Groceries & household" },
            "subCategory": { "description": "Groceries" }
        }
    ]
}
```

**Processing:**

1. JSON format typically doesn't have a `tag` field
2. Extract `category.description` and `subCategory.description`
3. Map category/subcategory combination to tag (Priority 2-3)

## Implementation Details

### Core Function: `determineTag()`

```javascript
const determineTag = (category, subcategory, existingTag = null) => {
    // Priority 1: Existing tag
    if (existingTag && existingTag.trim()) {
        return existingTag.trim();
    }

    // Priority 2: Category/subcategory mapping
    const tagMapping = getTagMapping();
    if (category && subcategory && tagMapping[category] && tagMapping[category][subcategory]) {
        return tagMapping[category][subcategory];
    }

    // Priority 3: Category-only mapping
    if (category && tagMapping[category]) {
        const firstSubcategory = Object.keys(tagMapping[category])[0];
        if (firstSubcategory) {
            return tagMapping[category][firstSubcategory];
        }
    }

    // Priority 4: No tag
    return null;
};
```

### Tag Mapping System

The system uses a hierarchical mapping structure:

```javascript
const defaultTagMapping = {
    'Groceries & household': {
        Groceries: 'Groceries',
        'House & garden': 'Groceries',
        Pets: 'Groceries'
    },
    'Transport & travel': {
        Car: 'Transport',
        Fuel: 'Transport',
        'Public transport': 'Transport'
    }
    // ... more mappings
};
```

### Intelligent Category Detection

When transactions don't have explicit category/subcategory fields, the system uses intelligent detection based on transaction descriptions:

```javascript
const detectCategoryFromDescription = (description) => {
    const desc = description.toLowerCase();

    // Groceries & household
    if (desc.includes('albert heijn') || desc.includes('lidl') || desc.includes('dirk')) {
        return { category: 'Groceries & household', subcategory: 'Groceries' };
    }

    // Restaurants & bars
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('bar')) {
        return { category: 'Restaurants & bars', subcategory: 'Restaurants' };
    }

    // Transport & travel
    if (desc.includes('oasa') || desc.includes('transavia') || desc.includes('uber')) {
        return { category: 'Transport & travel', subcategory: 'Public transport' };
    }

    // ... more detection rules
};
```

This ensures that even transactions without explicit category data get properly categorized and tagged.

### Processing Flow

#### For CSV Files:

1. **Parse CSV** → Extract all fields including `Tag`
2. **Map to Standard Format** → Convert to consistent structure
3. **Post-Processing** → Clean tags, detect categories from description if missing
4. **Tag Assignment** → `determineTag(category, subcategory, existingTag)`
5. **Result** → Tag assigned based on priority system

#### For JSON Files:

1. **Parse JSON** → Extract category/subcategory from nested structure
2. **Map to Standard Format** → Convert to consistent structure
3. **Post-Processing** → Detect categories from description if missing
4. **Tag Assignment** → `determineTag(category, subcategory, null)` (no existing tag)
5. **Result** → Tag mapped from category/subcategory

#### Post-Processing Steps:

1. **Tag Cleaning** → Remove `#` prefix from existing tags
2. **Category Detection** → Use intelligent detection from description if no category exists
3. **Tag Assignment** → Apply priority-based tag assignment
4. **Logging** → Comprehensive logging for debugging

## Examples

### Example 1: CSV with Existing Tag

```csv
Date,Amount,Description,Tag
2025-01-01,-29.27,Lidl,Groceries
```

**Result:** Tag = "Groceries" (Priority 1 - existing tag)

### Example 2: CSV without Tag but with Category

```csv
Date,Amount,Description,Category,Subcategory
2025-01-01,-29.27,Lidl,Groceries & household,Groceries
```

**Result:** Tag = "Groceries" (Priority 2 - category mapping)

### Example 3: JSON with Category/Subcategory

```json
{
    "category": { "description": "Transport & travel" },
    "subCategory": { "description": "Fuel" }
}
```

**Result:** Tag = "Transport" (Priority 2 - category mapping)

### Example 4: JSON with Unknown Category

```json
{
    "category": { "description": "Unknown Category" },
    "subCategory": { "description": "Unknown Subcategory" }
}
```

**Result:** Tag = null (Priority 4 - no mapping found)

## Benefits of This Approach

### 1. **Data Preservation**

-   Existing tags are never overwritten
-   User-assigned tags take highest priority

### 2. **Automatic Categorization**

-   JSON transactions get automatically tagged based on category mapping
-   Reduces manual work for structured data

### 3. **Flexibility**

-   Works with both tagged and untagged data
-   Handles missing category information gracefully

### 4. **Consistency**

-   Same logic applies to both CSV and JSON formats
-   Unified tag assignment regardless of source

### 5. **Extensibility**

-   Easy to add new category mappings
-   Custom mappings can be added through the Tag Mapping Manager

## User Experience

### For CSV Users:

-   If you have pre-tagged data → tags are preserved
-   If you have category data → tags are automatically assigned
-   If you have neither → manual tagging required

### For JSON Users:

-   Category/subcategory automatically maps to tags
-   Consistent tagging based on predefined rules
-   Manual override possible through Tag Mapping Manager

### For Mixed Data:

-   Both formats work seamlessly together
-   Consistent tag structure across all data
-   No conflicts between different source formats

## Configuration and Customization

### Default Mappings

The system comes with comprehensive default mappings covering:

-   Groceries & household
-   Transport & travel
-   Restaurants & bars
-   Health & Wellness
-   Shopping
-   Fixed expenses
-   Free time
-   Other categories

### Custom Mappings

Users can customize mappings through:

1. **Tag Mapping Manager** → Add/remove custom mappings
2. **Export/Import** → Share mapping configurations
3. **Reset to Defaults** → Restore original mappings

## Debugging and Logging

The system includes comprehensive logging for tag assignment:

```javascript
console.log('🔍 Determining tag for:', { category, subcategory, existingTag });
console.log('✅ Using existing tag:', existingTag.trim());
console.log('🏷️ Mapped tag from category/subcategory:', mappedTag);
console.log('❌ No tag mapping found');
```

This helps users understand how tags are being assigned and troubleshoot any issues.

## Future Enhancements

### Potential Improvements:

1. **Machine Learning** → Learn from user corrections
2. **Bulk Tag Editing** → Edit multiple transactions at once
3. **Tag Suggestions** → AI-powered tag recommendations
4. **Advanced Mapping** → Regex-based category matching
5. **Tag Hierarchies** → Parent/child tag relationships

### Backward Compatibility:

-   All existing functionality preserved
-   No breaking changes to current tag assignment
-   Gradual migration path for new features
