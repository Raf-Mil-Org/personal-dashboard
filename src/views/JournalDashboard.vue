<script setup>
import { addEntry, deleteEntry, journalEntries, updateEntry } from '@/composables/useJournalStore';
import { computed, ref } from 'vue';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Chips from 'primevue/chips';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';

const newText = ref('');
const newTags = ref([]);

function saveEntry() {
    if (newText.value.trim()) {
        addEntry(newText.value.trim(), newTags.value);
        newText.value = '';
        newTags.value = [];
    }
}

// Search & Filter
const searchQuery = ref('');
const filterTags = ref([]);

const filteredEntries = computed(() => journalEntries.value.filter((e) => e.text.toLowerCase().includes(searchQuery.value.toLowerCase()) && (filterTags.value.length === 0 || filterTags.value.every((t) => e.tags.includes(t)))));

// Edit Dialog
const showDialog = ref(false);
const editingId = ref(null);
const editText = ref('');
const editTags = ref([]);

function edit(entry) {
    editingId.value = entry.id;
    editText.value = entry.text;
    editTags.value = [...entry.tags];
    showDialog.value = true;
}

function confirmEdit() {
    updateEntry(editingId.value, editText.value, editTags.value);
    showDialog.value = false;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
</script>

<template>
    <div class="p-6 space-y-6">
        <h1 class="text-2xl font-bold">📓 Journal</h1>

        <!-- Add New Entry -->
        <Card>
            <template #title>New Entry</template>
            <template #content>
                <Textarea v-model="newText" rows="4" class="w-full mb-2" placeholder="Write your thoughts..." />
                <Chips v-model="newTags" placeholder="Tags" class="mb-2" />
                <Button label="Add" icon="pi pi-plus" @click="saveEntry" :disabled="!newText.trim()" />
            </template>
        </Card>

        <!-- Search and Filter -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <span class="p-input-icon-left w-full md:w-1/3">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Search..." class="w-full" />
            </span>
            <Chips v-model="filterTags" placeholder="Filter by tags" class="w-full md:w-1/3" />
        </div>

        <!-- Entry Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card v-for="entry in filteredEntries" :key="entry.id" class="relative">
                <template #title>{{ formatDate(entry.created_at) }}</template>
                <template #content>
                    <div class="text-sm whitespace-pre-line mb-3">{{ entry.text }}</div>
                    <div class="flex flex-wrap gap-2 text-xs">
                        <Tag v-for="tag in entry.tags" :key="tag" :value="tag" severity="info" />
                    </div>
                </template>
                <template #footer>
                    <div class="flex justify-end gap-2">
                        <Button icon="pi pi-pencil" class="p-button-text" @click="edit(entry)" />
                        <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="deleteEntry(entry.id)" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Edit Dialog -->
        <Dialog header="Edit Entry" v-model:visible="showDialog" modal class="w-[28rem]">
            <div class="space-y-3">
                <Textarea v-model="editText" rows="4" class="w-full" />
                <Chips v-model="editTags" class="w-full" />
                <Button label="Save" class="w-full" @click="confirmEdit" />
            </div>
        </Dialog>
    </div>
</template>
