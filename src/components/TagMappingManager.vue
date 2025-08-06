<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMultiFormatParser } from '@/composables/useMultiFormatParser';
import { categories } from '@/data/categories';
import { getTagSeverity, getTagValue, getTagIcon } from '@/utils/tagColors';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

const { getTagMapping, updateTagMapping, getAvailableTags, saveCustomTagMapping } = useMultiFormatParser();

// Reactive data
const tagMapping = ref({});
const availableTags = ref([]);
const newMapping = ref({
    category: null,
    subcategory: null,
    tag: null
});

// Custom tag functionality
const newTagName = ref('');
const newTagColor = ref(null);
const customTags = ref([]);

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

// Tag color options for custom tags
const tagColorOptions = computed(() => [
    { label: 'Green (Success)', value: 'success' },
    { label: 'Blue (Info)', value: 'info' },
    { label: 'Purple (Help)', value: 'help' },
    { label: 'Orange (Warning)', value: 'warning' },
    { label: 'Red (Danger)', value: 'danger' },
    { label: 'Gray (Secondary)', value: 'secondary' },
    { label: 'Blue (Primary)', value: 'primary' }
]);

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

            // Custom tag methods
            const loadCustomTags = () => {
                try {
                    const saved = localStorage.getItem('customTags');
                    if (saved) {
                        customTags.value = JSON.parse(saved);
                    }
                } catch (error) {
                    console.error('Error loading custom tags:', error);
                    customTags.value = [];
                }
            };

            const saveCustomTags = () => {
                try {
                    localStorage.setItem('customTags', JSON.stringify(customTags.value));
                } catch (error) {
                    console.error('Error saving custom tags:', error);
                }
            };

            const addCustomTag = () => {
                if (!newTagName.value.trim() || !newTagColor.value) {
                    return;
                }

                const tagName = newTagName.value.trim();

                // Check if tag already exists
                const existingTag = customTags.value.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());
                if (existingTag) {
                    alert('A tag with this name already exists!');
                    return;
                }

                // Check if it's a default tag
                const isDefaultTag = availableTags.value.includes(tagName);
                if (isDefaultTag) {
                    alert('This tag name already exists as a default tag!');
                    return;
                }

                // Add new custom tag
                const newTag = {
                    name: tagName,
                    color: newTagColor.value,
                    createdAt: new Date().toISOString()
                };

                customTags.value.push(newTag);
                saveCustomTags();

                // Add to available tags for dropdown
                availableTags.value.push(tagName);

                // Reset form
                newTagName.value = '';
                newTagColor.value = null;

                console.log(`✅ Added custom tag: ${tagName} with color: ${newTagColor.value}`);
            };

            const removeCustomTag = (tagName) => {
                if (confirm(`Are you sure you want to remove the custom tag "${tagName}"?`)) {
                    // Remove from custom tags
                    customTags.value = customTags.value.filter((tag) => tag.name !== tagName);
                    saveCustomTags();

                    // Remove from available tags
                    const index = availableTags.value.indexOf(tagName);
                    if (index > -1) {
                        availableTags.value.splice(index, 1);
                    }

                    console.log(`🗑️ Removed custom tag: ${tagName}`);
                }
            };

            if (typeof mappings === 'object' && mappings !== null) {
                saveCustomTagMapping(mappings);
                loadMappings();
                alert('Mappings imported successfully!');
            } else {
                alert('Invalid file format. Please select a valid JSON file.');
            }
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file. Please check the file format.');
        }
    };
    reader.readAsText(file);
};

// Custom tag methods
const loadCustomTags = () => {
    try {
        const saved = localStorage.getItem('customTags');
        if (saved) {
            customTags.value = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading custom tags:', error);
        customTags.value = [];
    }
};

const saveCustomTags = () => {
    try {
        localStorage.setItem('customTags', JSON.stringify(customTags.value));
    } catch (error) {
        console.error('Error saving custom tags:', error);
    }
};

const addCustomTag = () => {
    if (!newTagName.value.trim() || !newTagColor.value) {
        return;
    }

    const tagName = newTagName.value.trim();

    // Check if tag already exists
    const existingTag = customTags.value.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());
    if (existingTag) {
        alert('A tag with this name already exists!');
        return;
    }

    // Check if it's a default tag
    const isDefaultTag = availableTags.value.includes(tagName);
    if (isDefaultTag) {
        alert('This tag name already exists as a default tag!');
        return;
    }

    // Add new custom tag
    const newTag = {
        name: tagName,
        color: newTagColor.value,
        createdAt: new Date().toISOString()
    };

    customTags.value.push(newTag);
    saveCustomTags();

    // Add to available tags for dropdown
    availableTags.value.push(tagName);

    // Reset form
    newTagName.value = '';
    newTagColor.value = null;

    console.log(`✅ Added custom tag: ${tagName} with color: ${newTagColor.value}`);
};

const removeCustomTag = (tagName) => {
    if (confirm(`Are you sure you want to remove the custom tag "${tagName}"?`)) {
        // Remove from custom tags
        customTags.value = customTags.value.filter((tag) => tag.name !== tagName);
        saveCustomTags();

        // Remove from available tags
        const index = availableTags.value.indexOf(tagName);
        if (index > -1) {
            availableTags.value.splice(index, 1);
        }

        console.log(`🗑️ Removed custom tag: ${tagName}`);
    }
};

// Lifecycle
onMounted(() => {
    loadMappings();
    loadCustomTags();
});
</script>

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
                        <div class="space-y-2">
                            <Dropdown v-model="newMapping.tag" :options="availableTags" placeholder="Select a tag" class="w-full" />
                            <Tag v-if="newMapping.tag" :value="getTagValue(newMapping.tag)" :severity="getTagSeverity(newMapping.tag)" :icon="getTagIcon(newMapping.tag)" class="w-fit" />
                        </div>
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

            <!-- Add Custom Tags -->
            <div class="add-custom-tags mb-6 p-4 border rounded">
                <h4 class="text-lg font-semibold mb-3">Add Custom Tags</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">New Tag Name</label>
                        <InputText v-model="newTagName" placeholder="Enter tag name (e.g., 'Coffee', 'Gym')" class="w-full" @keyup.enter="addCustomTag" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Tag Color</label>
                        <Dropdown v-model="newTagColor" :options="tagColorOptions" optionLabel="label" optionValue="value" placeholder="Select color" class="w-full" />
                    </div>
                    <div class="flex items-end">
                        <Button @click="addCustomTag" :disabled="!newTagName || !newTagColor" label="Add Custom Tag" icon="pi pi-plus" class="w-full" :class="{ 'opacity-50 cursor-not-allowed': !newTagName || !newTagColor }" />
                    </div>
                </div>

                <!-- Preview of new tag -->
                <div v-if="newTagName && newTagColor" class="mt-3 p-3 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600 mr-2">Preview:</span>
                    <Tag :value="newTagName" :severity="newTagColor" icon="pi pi-tag" class="w-fit" />
                </div>
            </div>

            <!-- Custom Tags List -->
            <div class="custom-tags mb-6">
                <h4 class="text-lg font-semibold mb-3">Custom Tags</h4>
                <div v-if="customTags.length === 0" class="text-gray-500 text-center py-4">No custom tags created yet.</div>
                <div v-else class="flex flex-wrap gap-2">
                    <div v-for="tag in customTags" :key="tag.name" class="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <Tag :value="tag.name" :severity="tag.color" icon="pi pi-tag" />
                        <Button @click="removeCustomTag(tag.name)" icon="pi pi-times" severity="danger" text size="small" title="Remove custom tag" />
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
                                <div class="flex-1 flex items-center gap-2">
                                    <span class="font-medium">{{ subcategory }}</span>
                                    <span class="mx-2">→</span>
                                    <Tag :value="getTagValue(tag)" :severity="getTagSeverity(tag, customTags)" :icon="getTagIcon(tag)" />
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
