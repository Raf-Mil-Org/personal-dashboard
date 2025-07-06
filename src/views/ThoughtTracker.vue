<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 text-center">💡 Thought Tracker</h1>

        <!-- Button to Add New Thought -->
        <div class="mb-4 flex justify-center">
            <Button label="Add Thought" icon="pi pi-plus" class="p-button-outlined p-button-lg" @click="openNewThoughtDialog" />
        </div>

        <!-- Responsive Thought Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <Card v-for="thought in thoughts" :key="thought.id" class="w-full max-w-[18rem] shadow-md">
                <template #header>
                    <img alt="thought header" src="https://primefaces.org/cdn/primevue/images/card-vue.jpg" class="w-full h-32 object-cover" />
                </template>
                <template #title>
                    <InputText v-model="thought.title" class="w-full p-inputtext-sm font-semibold text-center" placeholder="Enter title" />
                </template>
                <template #subtitle>
                    <span class="italic text-gray-500">{{ formatDate(thought.dateAdded) }}</span>
                </template>
                <template #content>
                    <Textarea v-model="thought.content" class="w-full p-inputtext-sm" rows="2" placeholder="Write your thought..." />
                </template>
                <template #footer>
                    <div class="flex justify-between mt-2">
                        <Button label="Delete" icon="pi pi-trash" class="p-button-danger p-button-outlined p-button-sm" @click="deleteThought(thought.id)" />
                        <Button label="Save" icon="pi pi-save" class="p-button-success p-button-sm" @click="saveThoughts" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Dialog for New Thought -->
        <Dialog v-model:visible="isDialogVisible" header="New Thought" modal class="w-1/2">
            <div class="mb-4">
                <label class="block font-semibold">Title</label>
                <InputText v-model="newThought.title" class="w-full p-inputtext-lg" placeholder="Enter title" />
            </div>
            <div class="mb-4">
                <label class="block font-semibold">Thought</label>
                <Textarea v-model="newThought.content" class="w-full p-inputtext-lg" rows="3" placeholder="Write your thought..." />
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" class="p-button-text" @click="isDialogVisible = false" />
                <Button label="Add" class="p-button-primary" @click="addThought" />
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

interface Thought {
    id: number;
    title: string;
    content: string;
    dateAdded: string;
}

// Toast notifications
const toast = useToast();

// Reactive state
const thoughts = ref<Thought[]>(JSON.parse(localStorage.getItem('thoughts') || '[]'));
const isDialogVisible = ref(false);
const newThought = ref<Thought>({ id: Date.now(), title: '', content: '', dateAdded: new Date().toISOString() });

// Watch and save to localStorage
watch(
    thoughts,
    () => {
        localStorage.setItem('thoughts', JSON.stringify(thoughts.value));
    },
    { deep: true }
);

// Format date for display
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

// Open new thought dialog
const openNewThoughtDialog = () => {
    newThought.value = { id: Date.now(), title: '', content: '', dateAdded: new Date().toISOString() };
    isDialogVisible.value = true;
};

// Add a new thought
const addThought = () => {
    if (!newThought.value.title.trim()) {
        toast.add({ severity: 'error', summary: 'Missing Title', detail: 'Please enter a title for your thought.', life: 2000 });
        return;
    }
    thoughts.value.push({ ...newThought.value });
    toast.add({ severity: 'success', summary: 'Thought Added', detail: 'Your thought has been added.', life: 2000 });
    isDialogVisible.value = false;
};

// Delete a thought
const deleteThought = (id: number) => {
    thoughts.value = thoughts.value.filter((thought) => thought.id !== id);
    toast.add({ severity: 'warn', summary: 'Thought Deleted', detail: 'Your thought has been removed.', life: 2000 });
};

// Save thoughts to localStorage
const saveThoughts = () => {
    localStorage.setItem('thoughts', JSON.stringify(thoughts.value));
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Your thoughts have been saved.', life: 2000 });
};

// Load from localStorage on mount
onMounted(() => {
    localStorage.setItem('thoughts', JSON.stringify(thoughts.value));
});
</script>

<style scoped>
.p-card {
    transition: transform 0.2s ease-in-out;
}
.p-card:hover {
    transform: scale(1.02);
}
</style>
