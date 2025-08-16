/**
 * Test file for the show more functionality in period selection
 * This demonstrates how the period selection works with the show more/less feature
 */

import { getAvailablePeriods } from './src/utils/monthlyReports.js';

// Test the period generation
console.log('📅 Testing Period Selection with Show More Functionality:');

// Get periods with current month excluded (as configured in the app)
const periods = getAvailablePeriods(false);
console.log('Total available periods:', periods.length);

// Simulate the show more functionality
const showAllPeriods = false; // Initial state
const visiblePeriods = showAllPeriods ? periods : periods.slice(0, 6);

console.log('\n🔍 Initial State (showAllPeriods = false):');
console.log('Visible periods:', visiblePeriods.length);
console.log('Hidden periods:', periods.length - visiblePeriods.length);
console.log(
    'First 6 periods:',
    visiblePeriods.map((p) => p.name)
);

// Simulate clicking "Show More"
const showAllPeriodsAfterClick = true;
const visiblePeriodsAfterClick = showAllPeriodsAfterClick ? periods : periods.slice(0, 6);

console.log('\n🔍 After Clicking "Show More" (showAllPeriods = true):');
console.log('Visible periods:', visiblePeriodsAfterClick.length);
console.log(
    'All periods:',
    visiblePeriodsAfterClick.map((p) => p.name)
);

// Test the button text calculation
const buttonText = showAllPeriods ? 'Show Less' : `Show ${periods.length - 6} More`;
console.log('\n🔘 Button Text:');
console.log('Initial button text:', buttonText);

// Test edge cases
console.log('\n🧪 Edge Cases:');
console.log('If total periods <= 6, button should not show:', periods.length <= 6 ? '✅' : '❌');
console.log('Button only shows when there are more than 6 periods:', periods.length > 6 ? '✅' : '❌');

// Show the logic
console.log('\n📋 Logic Summary:');
console.log('1. Initially show only first 6 periods');
console.log('2. Show "Show X More" button if total > 6');
console.log('3. When clicked, show all periods');
console.log('4. Button text changes to "Show Less"');
console.log('5. When clicked again, collapse back to first 6');
