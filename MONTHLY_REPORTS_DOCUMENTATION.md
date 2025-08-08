# Monthly Reports Documentation

## Overview

The Monthly Reports feature provides comprehensive financial analytics based on a **23rd-of-the-month cycle**. This unique period definition allows for more flexible financial reporting that doesn't strictly follow calendar months.

## Period Definition

### 23rd-of-the-Month Cycle

-   **Period Start**: 23rd of each month
-   **Period End**: 22nd of the next month
-   **Example**: January 23rd - February 22nd

### Benefits

-   Aligns with common billing cycles
-   Provides consistent period lengths
-   Allows for mid-month financial planning
-   Better reflects real-world financial patterns

## Features

### 1. Period Selection

-   Dropdown with available periods (last 12 months)
-   Automatic default to current period
-   Easy navigation between historical periods

### 2. Summary Cards

-   **Total Income**: Sum of all positive transactions
-   **Total Expenses**: Sum of all negative transactions
-   **Net Amount**: Income minus expenses
-   **Total Transactions**: Count of all transactions in period

### 3. Period Comparison

-   Compares current period with previous period
-   Shows absolute and percentage changes
-   Visual indicators (arrows) for trends
-   Color-coded for quick interpretation

### 4. Visual Analytics

-   **Expense Breakdown by Tag**: Doughnut chart showing expense distribution
-   **Income vs Expenses**: Pie chart comparing income and expenses
-   Interactive charts with hover tooltips
-   Color-coded categories

### 5. Category Analysis

-   **Top Expense Categories**: Ranked by amount spent
-   **Top Income Categories**: Ranked by amount received
-   Transaction counts per category
-   Color-coded category indicators

### 6. Transaction Table

-   Detailed view of all period transactions
-   Sortable columns (Date, Description, Amount, Tag, Category)
-   Pagination for large datasets
-   Color-coded amounts (green for income, red for expenses)

### 7. Export Functionality

-   Export period data as JSON
-   Includes summary statistics and transaction details
-   Automatic filename generation based on period

## Technical Implementation

### Core Functions (`monthlyReports.js`)

#### Period Calculations

```javascript
// Get current period start (23rd of current/previous month)
getCurrentPeriodStart();

// Get current period end (22nd of next month)
getCurrentPeriodEnd();

// Get specific period dates
getPeriodStart(year, month);
getPeriodEnd(year, month);

// Get period for a specific date
getPeriodForDate(date);
```

#### Statistics Calculation

```javascript
// Calculate comprehensive period statistics
calculateMonthlyStats(transactions, start, end);

// Compare two periods
comparePeriods(currentStats, previousStats);

// Filter transactions for period
filterTransactionsForPeriod(transactions, start, end);
```

#### Utility Functions

```javascript
// Format date ranges for display
formatDateRange(start, end);

// Get period names
getPeriodName(start, end);

// Get available periods
getAvailablePeriods();
```

### Component Structure (`MonthlyReports.vue`)

#### Reactive Data

-   `selectedPeriod`: Currently selected period
-   `currentPeriodStats`: Calculated statistics for current period
-   `periodComparison`: Comparison with previous period

#### Computed Properties

-   `hasTransactions`: Check if data is available
-   `availablePeriods`: List of selectable periods
-   `tagBreakdownData`: Chart data for expense breakdown
-   `incomeExpenseData`: Chart data for income vs expenses
-   `topExpenseCategories`: Top expense categories
-   `topIncomeCategories`: Top income categories

#### Methods

-   `loadPeriodStats()`: Calculate and load period statistics
-   `formatCurrency()`: Format amounts as currency
-   `formatDate()`: Format dates for display
-   `exportPeriodData()`: Export period data

## Use Cases

### 1. Monthly Financial Review

-   Review income and expenses for the current period
-   Compare with previous period performance
-   Identify spending patterns and trends

### 2. Budget Planning

-   Analyze category-based spending
-   Identify top expense categories
-   Plan budget allocations for next period

### 3. Income Analysis

-   Track income sources and patterns
-   Monitor income growth or decline
-   Identify seasonal income variations

### 4. Expense Management

-   Monitor spending by category
-   Identify areas for cost reduction
-   Track expense trends over time

### 5. Financial Reporting

-   Generate reports for stakeholders
-   Export data for external analysis
-   Maintain financial records

## UI/UX Design

### Visual Hierarchy

1. **Header**: Clear title and description
2. **Period Selection**: Prominent dropdown for period choice
3. **Summary Cards**: Key metrics at a glance
4. **Comparison Section**: Period-over-period analysis
5. **Charts**: Visual data representation
6. **Category Analysis**: Detailed breakdowns
7. **Transaction Table**: Detailed transaction list

### Color Scheme

-   **Green**: Income and positive trends
-   **Red**: Expenses and negative trends
-   **Blue**: Neutral information
-   **Gray**: Secondary information

### Responsive Design

-   Mobile-friendly layout
-   Adaptive grid system
-   Collapsible sections
-   Touch-friendly controls

## Integration

### Transaction Store

-   Integrates with existing transaction data
-   Uses same data structure as Transaction Analyzer
-   Maintains consistency across components

### Navigation

-   Added to main navigation menu
-   Accessible via `/monthly-reports` route
-   Consistent with application design

### Data Flow

1. Load transactions from store
2. Calculate available periods
3. Select period and calculate statistics
4. Update UI with results
5. Enable export functionality

## Future Enhancements

### Planned Features

1. **Custom Periods**: Allow user-defined period ranges
2. **Advanced Filtering**: Filter by tags, categories, or amounts
3. **Trend Analysis**: Long-term trend visualization
4. **Budget Tracking**: Compare actual vs. budgeted amounts
5. **Goal Setting**: Set and track financial goals
6. **Notifications**: Alert for budget overruns
7. **Multiple Export Formats**: CSV, PDF, Excel
8. **Email Reports**: Automated report delivery

### Technical Improvements

1. **Caching**: Cache calculated statistics
2. **Performance**: Optimize for large datasets
3. **Real-time Updates**: Live data updates
4. **Offline Support**: Work without internet connection
5. **Data Validation**: Enhanced error handling

## Best Practices

### Data Management

-   Always validate transaction data before calculations
-   Handle missing or invalid data gracefully
-   Provide clear error messages
-   Maintain data consistency

### Performance

-   Use computed properties for expensive calculations
-   Implement proper memoization
-   Optimize chart rendering
-   Lazy load large datasets

### User Experience

-   Provide loading states for calculations
-   Show meaningful error messages
-   Maintain responsive design
-   Ensure accessibility compliance

### Code Quality

-   Follow Vue.js best practices
-   Use TypeScript for type safety
-   Implement proper error handling
-   Write comprehensive tests

## Troubleshooting

### Common Issues

#### No Data Displayed

-   Check if transactions exist in store
-   Verify period selection is valid
-   Ensure data format is correct

#### Incorrect Calculations

-   Validate transaction amounts
-   Check date format consistency
-   Verify period boundaries

#### Performance Issues

-   Optimize computed properties
-   Implement pagination for large datasets
-   Use virtual scrolling for tables

#### Chart Display Issues

-   Check chart data format
-   Verify chart library integration
-   Ensure responsive chart sizing

### Debug Information

-   Console logs for period calculations
-   Transaction type determination logs
-   Performance metrics
-   Error tracking

## Conclusion

The Monthly Reports feature provides a comprehensive financial analysis tool that adapts to real-world financial cycles. With its flexible period definition, rich visualizations, and detailed analytics, it serves as a powerful tool for personal financial management and planning.
