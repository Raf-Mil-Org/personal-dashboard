/**
 * Test file for the getAvailablePeriods function with includeCurrentMonth parameter
 * Run this in the browser console to test the period generation
 */

import { getAvailablePeriods } from './src/utils/monthlyReports.js';

// Test with current month included (default behavior)
console.log('📅 Testing getAvailablePeriods with current month INCLUDED:');
const periodsWithCurrent = getAvailablePeriods(true);
console.log(
    'Periods with current month:',
    periodsWithCurrent.map((p) => p.name)
);
console.log('Total periods:', periodsWithCurrent.length);

// Test with current month excluded
console.log('\n📅 Testing getAvailablePeriods with current month EXCLUDED:');
const periodsWithoutCurrent = getAvailablePeriods(false);
console.log(
    'Periods without current month:',
    periodsWithoutCurrent.map((p) => p.name)
);
console.log('Total periods:', periodsWithoutCurrent.length);

// Show the difference
console.log('\n🔍 Comparison:');
console.log('With current month:', periodsWithCurrent.length, 'periods');
console.log('Without current month:', periodsWithoutCurrent.length, 'periods');
console.log('Difference:', periodsWithCurrent.length - periodsWithoutCurrent.length, 'period(s)');

// Show first period in each case
console.log('\n📊 First period in each case:');
console.log('With current month - First period:', periodsWithCurrent[0]?.name);
console.log('Without current month - First period:', periodsWithoutCurrent[0]?.name);

// Test default parameter (should be same as true)
console.log('\n📅 Testing getAvailablePeriods with DEFAULT parameter:');
const periodsDefault = getAvailablePeriods();
console.log('Default behavior (should match "with current month"):', periodsDefault.length === periodsWithCurrent.length ? '✅' : '❌');
