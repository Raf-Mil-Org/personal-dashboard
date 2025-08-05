<template>
    <div class="tag-mapping-test p-4">
        <h3 class="text-lg font-semibold mb-4">Tag Mapping Test</h3>

        <div class="space-y-4">
            <div class="test-section">
                <h4 class="font-medium mb-2">Test Category Selection</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Category</label>
                        <Dropdown v-model="testCategory" :options="categories" optionLabel="description" placeholder="Select a category" class="w-full" @change="onTestCategoryChange" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Subcategory</label>
                        <Dropdown v-model="testSubcategory" :options="testSubcategoryOptions" optionLabel="description" placeholder="Select a subcategory" class="w-full" :disabled="!testCategory" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Mapped Tag</label>
                        <div class="p-2 bg-gray-100 rounded">
                            {{ mappedTag || 'No mapping found' }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="test-section">
                <h4 class="font-medium mb-2">Sample Transaction Test</h4>
                <div class="bg-gray-50 p-3 rounded">
                    <p class="text-sm"><strong>Category:</strong> {{ sampleTransaction.category?.description }}</p>
                    <p class="text-sm"><strong>Subcategory:</strong> {{ sampleTransaction.subCategory?.description }}</p>
                    <p class="text-sm"><strong>Mapped Tag:</strong> {{ sampleMappedTag }}</p>
                </div>
            </div>

            <div class="test-section">
                <h4 class="font-medium mb-2">Available Categories</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div v-for="category in categories" :key="category.code" class="text-sm p-2 bg-blue-50 rounded">
                        {{ category.description }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { categories } from '@/data/categories';
import { useMultiFormatParser } from '@/composables/useMultiFormatParser';
import Dropdown from 'primevue/dropdown';

const { determineTag } = useMultiFormatParser();

// Test data
const testCategory = ref(null);
const testSubcategory = ref(null);

// Sample transaction for testing
const sampleTransaction = ref({
    category: {
        description: 'Groceries & household'
    },
    subCategory: {
        description: 'Groceries'
    }
});

// Computed properties
const testSubcategoryOptions = computed(() => {
    if (!testCategory.value) return [];
    return testCategory.value.subCategories || [];
});

const mappedTag = computed(() => {
    if (!testCategory.value || !testSubcategory.value) return null;
    return determineTag(testCategory.value.description, testSubcategory.value.description);
});

const sampleMappedTag = computed(() => {
    return determineTag(sampleTransaction.value.category?.description, sampleTransaction.value.subCategory?.description);
});

// Methods
const onTestCategoryChange = () => {
    testSubcategory.value = null;
};
</script>

<style scoped>
.tag-mapping-test {
    max-width: 800px;
    margin: 0 auto;
}

.test-section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: white;
}
</style>
