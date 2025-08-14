<template>
    <div class="savings-investment-dashboard">
        <!-- Header -->
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">💰 Savings & Investment Dashboard</h2>
            <p class="text-gray-600">Track your savings rate and investment performance</p>
        </div>

        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Savings Rate -->
            <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-emerald-100 text-sm">Savings Rate</p>
                        <p class="text-3xl font-bold">{{ savingsRate.toFixed(1) }}%</p>
                    </div>
                    <div class="text-4xl opacity-20">
                        <i class="pi pi-chart-line"></i>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="flex justify-between text-sm">
                        <span>Target: 20%</span>
                        <span>{{ getSavingsRateStatus() }}</span>
                    </div>
                    <div class="w-full bg-emerald-200 rounded-full h-2 mt-2">
                        <div class="bg-white h-2 rounded-full" :style="{ width: Math.min(savingsRate, 100) + '%' }"></div>
                    </div>
                </div>
            </div>

            <!-- Total Savings -->
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm">Total Savings</p>
                        <p class="text-3xl font-bold">{{ formatCurrency(totalSavings) }}</p>
                    </div>
                    <div class="text-4xl opacity-20">
                        <i class="pi pi-wallet"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm">
                    <span>Emergency fund & goals</span>
                </div>
            </div>

            <!-- Total Investments -->
            <div class="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-amber-100 text-sm">Total Investments</p>
                        <p class="text-3xl font-bold">{{ formatCurrency(totalInvestments) }}</p>
                    </div>
                    <div class="text-4xl opacity-20">
                        <i class="pi pi-chart-bar"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm">
                    <span>Stocks, crypto & funds</span>
                </div>
            </div>

            <!-- Net Cash Flow -->
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-sm">Net Cash Flow</p>
                        <p class="text-3xl font-bold">{{ formatCurrency(netAmount) }}</p>
                    </div>
                    <div class="text-4xl opacity-20">
                        <i class="pi pi-arrow-right-arrow-left"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm">
                    <span>Income - Expenses - Savings</span>
                </div>
            </div>
        </div>

        <!-- Breakdown Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Income Breakdown -->
            <div class="bg-white p-6 rounded-lg shadow-sm border">
                <h3 class="text-lg font-semibold mb-4">📊 Income Breakdown</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Total Income</span>
                        <span class="font-semibold text-green-600">{{ formatCurrency(totalIncome) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Total Expenses</span>
                        <span class="font-semibold text-red-600">{{ formatCurrency(totalExpenses) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Total Savings</span>
                        <span class="font-semibold text-emerald-600">{{ formatCurrency(totalSavings) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Total Investments</span>
                        <span class="font-semibold text-amber-600">{{ formatCurrency(totalInvestments) }}</span>
                    </div>
                    <hr class="my-2" />
                    <div class="flex justify-between items-center font-bold">
                        <span>Net Cash Flow</span>
                        <span :class="netAmount >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatCurrency(netAmount) }}</span>
                    </div>
                </div>
            </div>

            <!-- Savings Rate Analysis -->
            <div class="bg-white p-6 rounded-lg shadow-sm border">
                <h3 class="text-lg font-semibold mb-4">📈 Savings Rate Analysis</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Current Rate</span>
                        <span class="font-semibold text-purple-600">{{ savingsRate.toFixed(1) }}%</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Recommended</span>
                        <span class="font-semibold text-gray-600">20%</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Status</span>
                        <span :class="getSavingsRateStatusClass()">{{ getSavingsRateStatus() }}</span>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm text-gray-500 mb-1">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="bg-purple-500 h-3 rounded-full transition-all duration-300" :style="{ width: Math.min(savingsRate, 100) + '%' }"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Poor</span>
                            <span>Good</span>
                            <span>Excellent</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white p-6 rounded-lg shadow-sm border">
            <h3 class="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button label="Auto-Detect Savings/Investments" icon="pi pi-search" @click="$emit('auto-detect')" class="bg-green-500 hover:bg-green-600" />
                <Button label="Export Savings Report" icon="pi pi-download" @click="$emit('export-report')" class="bg-blue-500 hover:bg-blue-600" />
                <Button label="View Detailed Analysis" icon="pi pi-chart-line" @click="$emit('detailed-analysis')" class="bg-purple-500 hover:bg-purple-600" />
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import { formatCurrency } from '@/utils/currencyUtils';

// Props
const props = defineProps({
    totalIncome: {
        type: Number,
        default: 0
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    totalInvestments: {
        type: Number,
        default: 0
    },
    netAmount: {
        type: Number,
        default: 0
    },
    savingsRate: {
        type: Number,
        default: 0
    }
});

// Emits
const emit = defineEmits(['auto-detect', 'export-report', 'detailed-analysis']);

// Methods
const getSavingsRateStatus = () => {
    if (props.savingsRate >= 20) return 'Excellent';
    if (props.savingsRate >= 15) return 'Good';
    if (props.savingsRate >= 10) return 'Fair';
    return 'Poor';
};

const getSavingsRateStatusClass = () => {
    const status = getSavingsRateStatus();
    switch (status) {
        case 'Excellent':
            return 'text-green-600 font-semibold';
        case 'Good':
            return 'text-blue-600 font-semibold';
        case 'Fair':
            return 'text-yellow-600 font-semibold';
        case 'Poor':
            return 'text-red-600 font-semibold';
        default:
            return 'text-gray-600 font-semibold';
    }
};
</script>

<style scoped>
.savings-investment-dashboard {
    @apply space-y-6;
}
</style>
