<template>
    <div class="tag-assignment-test p-4">
        <h3 class="text-lg font-semibold mb-4">Tag Assignment Logic Test</h3>

        <div class="space-y-6">
            <!-- Test Scenarios -->
            <div class="test-section">
                <h4 class="font-medium mb-3">Test Scenarios</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(scenario, index) in testScenarios" :key="index" class="bg-gray-50 p-3 rounded">
                        <h5 class="font-medium text-sm mb-2">{{ scenario.name }}</h5>
                        <div class="text-xs space-y-1">
                            <p><strong>Category:</strong> {{ scenario.category || 'null' }}</p>
                            <p><strong>Subcategory:</strong> {{ scenario.subcategory || 'null' }}</p>
                            <p><strong>Existing Tag:</strong> {{ scenario.existingTag || 'null' }}</p>
                            <p>
                                <strong>Result:</strong>
                                <span class="font-medium" :class="getResultClass(scenario.result)">
                                    {{ scenario.result || 'null' }}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Interactive Test -->
            <div class="test-section">
                <h4 class="font-medium mb-3">Interactive Test</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Category</label>
                        <input v-model="testInput.category" type="text" placeholder="e.g., Groceries & household" class="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Subcategory</label>
                        <input v-model="testInput.subcategory" type="text" placeholder="e.g., Groceries" class="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Existing Tag</label>
                        <input v-model="testInput.existingTag" type="text" placeholder="e.g., Custom Tag" class="w-full p-2 border rounded text-sm" />
                    </div>
                </div>
                <div class="mt-3 p-3 bg-blue-50 rounded">
                    <p class="text-sm">
                        <strong>Assigned Tag:</strong>
                        <span class="font-medium text-blue-800">{{ interactiveResult || 'null' }}</span>
                    </p>
                </div>
            </div>

            <!-- Sample Transactions Test -->
            <div class="test-section">
                <h4 class="font-medium mb-3">Sample Transactions Test</h4>
                <div class="space-y-2">
                    <div v-for="(transaction, index) in sampleTransactions" :key="index" class="bg-gray-50 p-3 rounded">
                        <div class="flex justify-between items-start">
                            <div class="text-sm">
                                <p><strong>Description:</strong> {{ transaction.description }}</p>
                                <p><strong>Category:</strong> {{ transaction.category || 'null' }}</p>
                                <p><strong>Subcategory:</strong> {{ transaction.subcategory || 'null' }}</p>
                                <p><strong>Original Tag:</strong> {{ transaction.originalTag || 'null' }}</p>
                                <p>
                                    <strong>Assigned Tag:</strong>
                                    <span class="font-medium" :class="getResultClass(transaction.assignedTag)">
                                        {{ transaction.assignedTag || 'null' }}
                                    </span>
                                </p>
                            </div>
                            <div class="text-xs text-gray-500">
                                {{ transaction.format }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMultiFormatParser } from '@/composables/useMultiFormatParser';

const { determineTag } = useMultiFormatParser();

// Test input
const testInput = ref({
    category: '',
    subcategory: '',
    existingTag: ''
});

// Interactive result
const interactiveResult = computed(() => {
    return determineTag(testInput.value.category || null, testInput.value.subcategory || null, testInput.value.existingTag || null);
});

// Test scenarios
const testScenarios = ref([
    {
        name: 'CSV with Existing Tag',
        category: 'Groceries & household',
        subcategory: 'Groceries',
        existingTag: 'Custom Groceries',
        result: 'Custom Groceries'
    },
    {
        name: 'JSON with Category Mapping',
        category: 'Transport & travel',
        subcategory: 'Fuel',
        existingTag: null,
        result: 'Transport'
    },
    {
        name: 'Unknown Category',
        category: 'Unknown Category',
        subcategory: 'Unknown Subcategory',
        existingTag: null,
        result: null
    },
    {
        name: 'Category Only (No Subcategory)',
        category: 'Groceries & household',
        subcategory: null,
        existingTag: null,
        result: 'Groceries'
    }
]);

// Sample transactions
const sampleTransactions = ref([
    {
        description: 'Lidl 707 Amsterdam',
        category: 'Groceries & household',
        subcategory: 'Groceries',
        originalTag: null,
        assignedTag: 'Groceries',
        format: 'JSON'
    },
    {
        description: "McDonald's Amsterdam",
        category: 'Restaurants & bars',
        subcategory: 'Snacks',
        originalTag: null,
        assignedTag: 'Dining',
        format: 'JSON'
    },
    {
        description: 'Shell Gas Station',
        category: 'Transport & travel',
        subcategory: 'Fuel',
        originalTag: null,
        assignedTag: 'Transport',
        format: 'JSON'
    },
    {
        description: 'Coffee Shop',
        category: 'Restaurants & bars',
        subcategory: 'Coffee bars',
        originalTag: null,
        assignedTag: 'Dining',
        format: 'JSON'
    },
    {
        description: 'Custom Transaction',
        category: 'Groceries & household',
        subcategory: 'Groceries',
        originalTag: 'My Custom Tag',
        assignedTag: 'My Custom Tag',
        format: 'CSV'
    }
]);

// Helper function to get result class
const getResultClass = (result) => {
    if (result) {
        return 'text-green-600';
    }
    return 'text-gray-500';
};

// Initialize test scenarios with actual results
testScenarios.value.forEach((scenario) => {
    scenario.result = determineTag(scenario.category, scenario.subcategory, scenario.existingTag);
});

// Initialize sample transactions with actual results
sampleTransactions.value.forEach((transaction) => {
    transaction.assignedTag = determineTag(transaction.category, transaction.subcategory, transaction.originalTag);
});
</script>

<style scoped>
.tag-assignment-test {
    max-width: 1000px;
    margin: 0 auto;
}

.test-section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: white;
}
</style>
