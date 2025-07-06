<script setup>
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { computed, ref } from 'vue';

const tasks = ref([
    {
        id: 1,
        title: 'Finish PrimeVue layout',
        completed: false,
        priority: 'High',
        category: 'Work',
        dueDate: '02/06/2025',
        notes: 'Refactor sidebar'
    },
    {
        id: 2,
        title: 'Buy groceries',
        completed: false,
        priority: 'Medium',
        category: 'Errand',
        dueDate: '01/06/2025',
        notes: ''
    }
]);

const filter = ref('all');
const editDialog = ref(false);
const selectedTask = ref(null);

const priorities = ['Low', 'Medium', 'High'];
const categories = ['Work', 'Personal', 'Errand'];

const filteredTasks = computed(() => {
    if (filter.value === 'active') return tasks.value.filter((t) => !t.completed);
    if (filter.value === 'done') return tasks.value.filter((t) => t.completed);
    return tasks.value;
});

function editTask(task) {
    selectedTask.value = { ...task }; // clone to avoid live binding
    editDialog.value = true;
}

function saveEditedTask() {
    const index = tasks.value.findIndex((t) => t.id === selectedTask.value.id);
    if (index !== -1) {
        tasks.value[index] = { ...selectedTask.value };
    }
    editDialog.value = false;
}
</script>
<template>
    <div>
        <!-- Task List -->
        <div v-for="task in filteredTasks" :key="task.id" class="bg-white p-4 rounded shadow-sm mb-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <Checkbox v-model="task.completed" />
                    <span :class="{ 'line-through text-gray-400': task.completed }" class="font-medium">
                        {{ task.title }}
                    </span>
                </div>
                <Button icon="pi pi-pencil" class="p-button-text" @click="editTask(task)" />
            </div>
            <div class="text-sm text-gray-500 mt-2">
                Priority: {{ task.priority }} | Category: {{ task.category }}<br />
                Due: {{ task.dueDate }}<br />
                <span v-if="task.notes">Notes: {{ task.notes }}</span>
            </div>
        </div>

        <!-- Edit Task Dialog -->
        <Dialog header="Edit Task" v-model:visible="editDialog" modal class="w-[28rem]">
            <div class="space-y-4">
                <InputText v-model="selectedTask.title" class="w-full" placeholder="Task title" />
                <Dropdown v-model="selectedTask.priority" :options="priorities" placeholder="Priority" class="w-full" />
                <Dropdown v-model="selectedTask.category" :options="categories" placeholder="Category" class="w-full" />
                <Calendar v-model="selectedTask.dueDate" showIcon class="w-full" />
                <Textarea v-model="selectedTask.notes" rows="3" class="w-full" placeholder="Notes" />
                <Button label="Save Changes" class="w-full" @click="saveEditedTask" />
            </div>
        </Dialog>
    </div>
</template>
