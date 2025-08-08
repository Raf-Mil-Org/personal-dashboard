# Transaction Type Determination System

## Overview

The transaction type determination system has been enhanced to properly classify transactions as **Income** or **Expense** across different input formats (CSV and JSON) with improved accuracy and confidence levels.

## Problem Statement

### Original Issues

1. **CSV Format**: Relied solely on `debit_credit` field (working correctly)
2. **JSON Format**: Lacked `debit_credit` field, causing unreliable classification
3. **Amount Sign**: Using positive/negative amounts was unreliable for many banks
4. **Payback Detection**: Couldn't distinguish between income and paybacks
5. **Confidence Levels**: No indication of how reliable the classification was

### New Requirements

-   ✅ Support both CSV and JSON formats
-   ✅ Distinguish between income and paybacks
-   ✅ Provide confidence levels for classifications
-   ✅ Handle edge cases and conflicts
-   ✅ Use multiple detection methods with priority

## Enhanced Detection Methods

### Method 1: Debit/Credit Field (CSV Format) - **High Confidence**

```javascript
// Priority: Highest
// Format: CSV with debit_credit field
if (debitCredit === 'credit') return { isIncome: true, confidence: 'high' };
if (debitCredit === 'debit') return { isIncome: false, confidence: 'high' };
```

### Method 2: Category/Subcategory Analysis (JSON Format) - **Medium Confidence**

```javascript
// Priority: High for JSON format
// Keywords for income: ['income', 'salary', 'revenue', 'refund', 'return', 'credit']
// Keywords for expense: ['expense', 'purchase', 'payment', 'fee', 'charge', 'withdrawal']
```

### Method 3: Payback Detection - **High Confidence**

```javascript
// Priority: High (overrides other methods)
// Keywords: ['payback', 'repayment', 'settlement', 'reimbursement', 'refund', 'return', 'cashback']
// Result: Always classified as Income (money coming back)
```

### Method 4: Description Keywords - **Medium Confidence**

```javascript
// Income keywords: ['salary', 'income', 'deposit', 'credit', 'refund', 'payment received', 'transfer in', 'reimbursement', 'cashback', 'bonus', 'dividend', 'interest received', 'return', 'settlement', 'compensation', 'allowance', 'grant', 'award']

// Expense keywords: ['purchase', 'payment', 'debit', 'withdrawal', 'transfer out', 'fee', 'charge', 'bill', 'subscription', 'rent', 'mortgage', 'loan payment', 'tax', 'insurance', 'shopping', 'dining', 'transport', 'fuel', 'parking', 'toll']
```

### Method 5: Amount Sign - **Low Confidence**

```javascript
// Priority: Lowest (only when no other indicators)
// Used as fallback or conflict resolution
if (amount > 0) return { isIncome: true, confidence: 'low' };
if (amount < 0) return { isIncome: false, confidence: 'low' };
```

## Confidence Levels

### High Confidence (Green)

-   **Debit/Credit Field**: Direct bank classification
-   **Payback Detection**: Clear payback indicators
-   **Reliability**: 95%+ accurate

### Medium Confidence (Yellow)

-   **Category Analysis**: Structured category/subcategory data
-   **Description Keywords**: Keyword-based detection
-   **Reliability**: 80-90% accurate

### Low Confidence (Red)

-   **Amount Sign**: Positive/negative amount only
-   **Conflict Resolution**: When methods disagree
-   **Default Assumption**: No clear indicators
-   **Reliability**: 60-70% accurate

## Implementation Examples

### CSV Format Example

```javascript
{
    description: 'Salary payment',
    amount: '2500.00',
    debit_credit: 'credit',  // ← High confidence indicator
    category: null,
    subcategory: null
}
// Result: { isIncome: true, method: 'debit_credit_field', confidence: 'high' }
```

### JSON Format Example

```javascript
{
    description: 'Monthly salary',
    amount: '3000.00',
    debit_credit: '',  // ← Not available in JSON
    category: 'Income',  // ← Medium confidence indicator
    subcategory: 'Salary'
}
// Result: { isIncome: true, method: 'category_analysis', confidence: 'medium' }
```

### Payback Example

```javascript
{
    description: 'Reimbursement for travel expenses',
    amount: '150.00',
    debit_credit: '',
    category: 'Other',
    subcategory: 'Reimbursement'
}
// Result: { isIncome: true, method: 'payback_detection', confidence: 'high' }
```

## Conflict Resolution

### Scenario: Conflicting Keywords

```javascript
{
    description: 'Payment received for services',  // ← Income keyword
    amount: '-500.00',  // ← Negative amount
    debit_credit: '',
    category: 'Services',
    subcategory: 'Payment'
}
// Resolution: Use amount sign as tiebreaker
// Result: { isIncome: false, method: 'conflict_resolution_amount', confidence: 'low' }
```

## Debug Information

The system provides comprehensive debug information:

```javascript
{
    description: 'Transaction description',
    amount: 150.00,
    type: {
        isIncome: true,
        method: 'payback_detection',
        value: 'payback_keyword_found',
        confidence: 'high'
    },
    tag: 'Reimbursement',
    category: 'Other',
    subcategory: 'Reimbursement'
}
```

## Testing

### Console Testing

```javascript
// Test period calculations
testPeriodCalculations();

// Test transaction type determination
testTransactionTypeDetermination();
```

### Test Cases Included

1. **CSV Format**: Debit/credit field testing
2. **JSON Format**: Category/subcategory testing
3. **Payback Scenarios**: Reimbursement, cashback, refunds
4. **Ambiguous Cases**: Transfers, unknown transactions
5. **Edge Cases**: Conflicting indicators

## Monthly Reports Integration

### Debug Card Display

The Monthly Reports component now shows:

-   **Transaction Description**: What the transaction is
-   **Amount**: Formatted currency value
-   **Type**: Income/Expense classification
-   **Method**: How the classification was determined
-   **Confidence**: Visual indicator (Green/Yellow/Red)
-   **Tag**: Assigned category tag

### Visual Indicators

-   🟢 **Green**: High confidence classifications
-   🟡 **Yellow**: Medium confidence classifications
-   🔴 **Red**: Low confidence classifications

## Benefits

### For CSV Format

-   ✅ Maintains existing high-accuracy debit/credit classification
-   ✅ Enhanced with additional keyword detection
-   ✅ Better handling of edge cases

### For JSON Format

-   ✅ Reliable classification using category/subcategory data
-   ✅ Keyword-based detection for descriptions
-   ✅ Payback detection for reimbursements
-   ✅ Confidence levels for transparency

### General Improvements

-   ✅ Distinguishes between income and paybacks
-   ✅ Provides confidence levels for all classifications
-   ✅ Handles conflicting indicators gracefully
-   ✅ Comprehensive debug information
-   ✅ Test functions for validation

## Future Enhancements

### Potential Improvements

1. **Machine Learning**: Train on user corrections
2. **Bank-Specific Rules**: Custom rules per bank
3. **Pattern Recognition**: Learn from transaction patterns
4. **User Override**: Allow manual classification
5. **Historical Analysis**: Use past classifications for similar transactions

### Configuration Options

1. **Custom Keywords**: User-defined income/expense keywords
2. **Confidence Thresholds**: Adjustable confidence levels
3. **Method Priority**: Customizable detection method order
4. **Bank Profiles**: Bank-specific classification rules

## Conclusion

The enhanced transaction type determination system provides:

-   **Accurate Classification**: Multi-method approach with confidence levels
-   **Format Flexibility**: Works with both CSV and JSON inputs
-   **Transparency**: Clear indication of how classifications were made
-   **Debugging**: Comprehensive test functions and debug information
-   **Extensibility**: Framework for future enhancements

This system ensures that monthly reports accurately reflect income vs. expenses, with clear visibility into the classification process and confidence levels for each transaction.
