<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 text-center">📝 Task Planner</h1>

        <!-- Buttons for Adding Task and Category -->
        <div class="mb-4 flex justify-center gap-4">
            <Button label="Add Task" icon="pi pi-plus" class="p-button-outlined p-button-lg" @click="openNewTaskDialog" />
            <Button label="Add Category" icon="pi pi-tags" class="p-button-outlined p-button-lg" @click="openNewCategoryDialog" />
        </div>

        <!-- Task Grid -->
        <DataTable :value="sortedTasks" class="p-datatable-sm shadow-md rounded-lg">
            <Column field="name" header="Task Name" class="font-medium" />

            <!-- Editable Category Dropdown -->
            <Column header="Category">
                <template #body="slotProps">
                    <Dropdown v-model="slotProps.data.category" :options="categories" editable class="w-40" @change="updateCategory(slotProps.data.id, slotProps.data.category)" />
                </template>
            </Column>

            <Column field="dateAdded" header="Date Added" />
            <Column field="note" header="Note" />

            <!-- Status Dropdown -->
            <Column header="Status">
                <template #body="slotProps">
                    <Dropdown v-model="slotProps.data.status" :options="statusOptions" class="w-36" @change="updateStatus(slotProps.data.id, slotProps.data.status)" />
                </template>
            </Column>

            <!-- Actions -->
            <Column header="Actions">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-download" class="p-button-rounded p-button-success" @click="downloadTask(slotProps.data.name)" />
                        <Button icon="pi pi-check" class="p-button-rounded p-button-primary" @click="updateStatus(slotProps.data.id, 'Done')" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDelete(slotProps.data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Task Dialog -->
        <Dialog v-model:visible="isTaskDialogVisible" header="New Task" modal class="w-1/2">
            <div class="mb-4">
                <label class="font-semibold block mb-1">Task Name</label>
                <InputText v-model="newTask.name" class="w-full p-inputtext-lg" placeholder="Enter title" />
            </div>
            <div class="mb-4">
                <label class="font-semibold block mb-1">Category</label>
                <Dropdown v-model="newTask.category" :options="categories" class="w-full p-inputtext-lg" />
            </div>
            <div class="mb-4">
                <label class="font-semibold block mb-1">Note</label>
                <Textarea v-model="newTask.note" class="w-full p-inputtext-lg" rows="3" placeholder="Write task details..." />
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" class="p-button-text" @click="isTaskDialogVisible = false" />
                <Button label="Add Task" class="p-button-primary" @click="addTask" />
            </div>
        </Dialog>

        <!-- Category Dialog -->
        <Dialog v-model:visible="isCategoryDialogVisible" header="Add Category" modal class="w-1/3">
            <div class="mb-4">
                <label class="font-semibold block mb-1">Category Name</label>
                <InputText v-model="newCategory" class="w-full p-inputtext-lg" placeholder="Enter category name" />
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" class="p-button-text" @click="isCategoryDialogVisible = false" />
                <Button label="Add Category" class="p-button-primary" @click="addCategory" />
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

interface Task {
    id: number;
    name: string;
    category: string;
    dateAdded: string;
    status: 'Done' | 'Doing' | 'Cancelled';
    note: string;
}

// Toast notifications
const toast = useToast();

// Default categories
const defaultCategories = ['house', 'planning', 'wellness', 'music'];
const categories = ref<string[]>(JSON.parse(localStorage.getItem('categories') || JSON.stringify(defaultCategories)));

// Tasks
const tasks = ref<Task[]>(JSON.parse(localStorage.getItem('tasks') || '[]'));
const statusOptions: Task['status'][] = ['Done', 'Doing', 'Cancelled'];

// New Task / Category states
const isTaskDialogVisible = ref(false);
const isCategoryDialogVisible = ref(false);
const newTask = ref<Task>({ id: Date.now(), name: '', category: categories.value[0], dateAdded: new Date().toISOString(), status: 'Doing', note: '' });
const newCategory = ref('');

// Watch and save to localStorage
watch(tasks, () => localStorage.setItem('tasks', JSON.stringify(tasks.value)), { deep: true });
watch(categories, () => localStorage.setItem('categories', JSON.stringify(categories.value)), { deep: true });

// Sort tasks by date
const sortedTasks = computed(() => [...tasks.value].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()));

// Open dialogs
const openNewTaskDialog = () => {
    newTask.value = { id: Date.now(), name: '', category: categories.value[0], dateAdded: new Date().toISOString(), status: 'Doing', note: '' };
    isTaskDialogVisible.value = true;
};
const openNewCategoryDialog = () => {
    newCategory.value = '';
    isCategoryDialogVisible.value = true;
};

// Add Task
const addTask = () => {
    if (!newTask.value.name.trim()) {
        toast.add({ severity: 'error', summary: 'Missing Fields', detail: 'Task name is required.', life: 2000 });
        return;
    }
    tasks.value.push({ ...newTask.value });
    toast.add({ severity: 'success', summary: 'Task Added', detail: 'Your task has been added.', life: 2000 });
    isTaskDialogVisible.value = false;
};

// Add Category
const addCategory = () => {
    if (!newCategory.value.trim() || categories.value.includes(newCategory.value)) {
        toast.add({ severity: 'error', summary: 'Invalid Category', detail: 'Category must be unique and not empty.', life: 2000 });
        return;
    }
    categories.value.push(newCategory.value);
    toast.add({ severity: 'success', summary: 'Category Added', detail: 'New category has been added.', life: 2000 });
    isCategoryDialogVisible.value = false;
};

// Update Task Category
const updateCategory = (taskId: number, category: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) task.category = category;
    toast.add({ severity: 'info', summary: 'Category Updated', detail: `Task category set to ${category}`, life: 2000 });
};

// LocalStorage on mount
onMounted(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks.value));
    localStorage.setItem('categories', JSON.stringify(categories.value));
});
</script>
