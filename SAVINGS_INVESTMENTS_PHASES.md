# Savings & Investments Tracking - Implementation Phases

## **PHASE 1: Category Enhancement** ✅ (COMPLETED)

-   [x] Add new categories: "Savings", "Investments", "Transfers"
-   [x] Update tag mapping to include these categories
-   [x] Modify statistics calculation to exclude savings/investments from expenses
-   [x] Add basic detection rules for savings and investments

## **PHASE 2: Smart Detection** ✅ (COMPLETED)

-   [x] Add keyword-based detection for savings/investments
-   [x] Create account pattern matching
-   [x] Implement automatic categorization based on user rules:
    -   **Investments**: subcategory 'Investment' or 'investment account' (case-insensitive) OR tag 'Investments'
    -   **Savings**: description contains 'bunq' OR tag 'Savings'
-   [x] Add manual override capabilities

## **PHASE 3: UI Enhancement** ✅ (COMPLETED)

-   [x] Show separate statistics for expenses vs savings
-   [x] Add savings/investment tracking dashboard
-   [x] Provide manual override capabilities
-   [x] Add savings rate calculation

## **PHASE 4: Advanced Features** ✅ (IN PROGRESS)

-   [x] Savings rate tracking over time
-   [ ] Investment performance tracking
-   [ ] Goal-based savings tracking
-   [ ] Export functionality for savings/investments

## **User Requirements:**

1. **Investment Detection**: subcategory 'Investment' or 'investment account' (case-insensitive) OR tag 'Investments'
2. **Savings Detection**: description contains 'bunq' OR tag 'Savings'
3. **Hybrid Approach**: Automatic detection + manual override flexibility
4. **Separate Tracking**: Track savings/investments separately and exclude from expenses
5. **Simple but Valuable**: Start simple, add complexity gradually

## **Technical Implementation:**

-   New transaction types: EXPENSE, SAVINGS, INVESTMENT, TRANSFER, INCOME
-   Enhanced statistics: totalExpenses, totalSavings, netCashFlow, savingsRate
-   Persistent tracking for savings/investments counts
-   Manual override system for categorization

---

**Last Updated**: [Current Date]
**Status**: Phase 3 completed, ready for Phase 4
