<template>
    <div class="tag-mapping-manager">
        <div class="card">
            <h3>Tag Mapping Manager</h3>
            <p class="text-sm text-gray-600 mb-4">Configure how categories and subcategories are mapped to tags for automatic tagging.</p>

            <!-- Add new mapping -->
            <div class="add-mapping-section mb-4 p-4 border rounded">
                <h4 class="text-lg font-semibold mb-3">Add New Mapping</h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Category</label>
                        <Dropdown v-model="newMapping.category" :options="categoryOptions" optionLabel="description" placeholder="Select a category" class="w-full" @change="onCategoryChange" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Subcategory</label>
                        <Dropdown v-model="newMapping.subcategory" :options="subcategoryOptions" optionLabel="description" placeholder="Select a subcategory" class="w-full" :disabled="!newMapping.category" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Tag</label>
                        <Dropdown v-model="newMapping.tag" :options="availableTags" placeholder="Select a tag" class="w-full" />
                    </div>
                    <!-- <p>{{ availableTags }}</p> -->
                    <div class="flex items-end">
                        <Button
                            @click="addMapping"
                            :disabled="!newMapping.category || !newMapping.subcategory || !newMapping.tag"
                            label="Add Mapping"
                            class="w-full"
                            :class="{ 'opacity-50 cursor-not-allowed': !newMapping.category || !newMapping.subcategory || !newMapping.tag }"
                        />
                    </div>
                </div>
            </div>

            <!-- Existing mappings -->
            <div class="existing-mappings">
                <h4 class="text-lg font-semibold mb-3">Existing Mappings</h4>

                <div v-if="Object.keys(tagMapping).length === 0" class="text-gray-500 text-center py-8">No custom mappings found. Default mappings will be used.</div>

                <div v-else class="space-y-4">
                    <div v-for="(subcategories, category) in tagMapping" :key="category" class="category-group border rounded p-4">
                        <h5 class="font-medium text-lg mb-2">{{ category }}</h5>
                        <div class="space-y-2">
                            <div v-for="(tag, subcategory) in subcategories" :key="`${category}-${subcategory}`" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div class="flex-1">
                                    <span class="font-medium">{{ subcategory }}</span>
                                    <span class="mx-2">→</span>
                                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{{ tag }}</span>
                                </div>
                                <Button @click="removeMapping(category, subcategory)" icon="pi pi-times" severity="danger" text size="small" title="Remove mapping" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="actions mt-6 flex gap-3">
                <Button @click="resetToDefaults" label="Reset to Defaults" severity="secondary" />
                <Button @click="exportMappings" label="Export Mappings" severity="success" />
                <Button @click="importMappings" label="Import Mappings" severity="info" />
                <Button @click="$router.push('/tag-mapping-test')" label="Test Mappings" severity="warning" />
                <Button @click="$router.push('/tag-assignment-test')" label="Test Tag Assignment" severity="help" />
            </div>

            <!-- Hidden file input for import -->
            <input ref="fileInput" type="file" accept=".json" @change="handleFileImport" style="display: none" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useMultiFormatParser } from '@/composables/useMultiFormatParser';
import { categories, getSubcategoryDescriptions } from '@/data/categories';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

const { getTagMapping, updateTagMapping, getAvailableTags, saveCustomTagMapping } = useMultiFormatParser();

// Reactive data
const tagMapping = ref({});
const availableTags = ref([]);
const newMapping = ref({
    category: null,
    subcategory: null,
    tag: null
});

const fileInput = ref(null);

// Computed properties
const categoryOptions = computed(() => categories);

const subcategoryOptions = computed(() => {
    if (!newMapping.value.category) return [];
    return newMapping.value.category.subCategories || [];
});

const hasCustomMappings = computed(() => {
    return Object.keys(tagMapping.value).length > 0;
});

// Methods
const loadMappings = () => {
    tagMapping.value = getTagMapping();
    availableTags.value = getAvailableTags();
};

const onCategoryChange = () => {
    // Reset subcategory when category changes
    newMapping.value.subcategory = null;
};

const addMapping = () => {
    if (!newMapping.value.category || !newMapping.value.subcategory || !newMapping.value.tag) {
        return;
    }

    const categoryDescription = newMapping.value.category.description;
    const subcategoryDescription = newMapping.value.subcategory.description;

    updateTagMapping(categoryDescription, subcategoryDescription, newMapping.value.tag);

    // Reset form
    newMapping.value = {
        category: null,
        subcategory: null,
        tag: null
    };

    // Reload mappings
    loadMappings();
};

const removeMapping = (category, subcategory) => {
    const customMapping = JSON.parse(localStorage.getItem('customTagMapping') || '{}');

    if (customMapping[category]) {
        delete customMapping[category][subcategory];

        // Remove category if empty
        if (Object.keys(customMapping[category]).length === 0) {
            delete customMapping[category];
        }

        saveCustomTagMapping(customMapping);
        loadMappings();
    }
};

const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all custom mappings to defaults?')) {
        localStorage.removeItem('customTagMapping');
        loadMappings();
    }
};

const exportMappings = () => {
    const mappings = getTagMapping();
    const dataStr = JSON.stringify(mappings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tag-mappings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
};

const importMappings = () => {
    fileInput.value.click();
};

const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const mappings = JSON.parse(e.target.result);

            if (typeof mappings === 'object' && mappings !== null) {
                saveCustomTagMapping(mappings);
                loadMappings();
                alert('Mappings imported successfully!');
            } else {
                throw new Error('Invalid format');
            }
        } catch (error) {
            alert('Error importing mappings: Invalid JSON format');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
};

// Lifecycle
onMounted(() => {
    loadMappings();
});
</script>

<style scoped>
.tag-mapping-manager {
    max-width: 1200px;
    margin: 0 auto;
}

.card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 24px;
}

.add-mapping-section {
    background: #f8f9fa;
    border-color: #e9ecef;
}

.category-group {
    background: white;
    border-color: #e9ecef;
}

.category-group:hover {
    border-color: #dee2e6;
}

.actions button {
    transition: all 0.2s ease;
}

.actions button:hover {
    transform: translateY(-1px);
}
</style>
