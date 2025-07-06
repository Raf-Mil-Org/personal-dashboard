<!-- <script setup lang="ts">
import { customerService } from '@/service/customerService';
import { Column } from 'primevue/column';
import { DataTable } from 'primevue/datatable';
import { Dropdown } from 'primevue/dropdown';
import { InputText } from 'primevue/inputtext';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const customers = ref([]);
const assignees = ref([]);
const filters = ref({
    search: route.query.search || '',
    assignee: route.query.assignee || ''
});

const loadCustomers = async () => {
    try {
        customers.value = await customerService.getCustomers(filters.value);
    } catch (error) {
        console.error('Failed to load customers', error);
    }
};

const loadAssignees = async () => {
    try {
        assignees.value = await customerService.fetchAssignees();
    } catch (error) {
        console.error('Failed to load assignees', error);
    }
};

watch(
    filters,
    (newFilters) => {
        router.push({ query: newFilters });
        loadCustomers();
    },
    { deep: true }
);

onMounted(async () => {
    await loadAssignees();
    await loadCustomers();
});
</script>

<template>
    <div class="p-4">
        <div class="flex gap-4 mb-4">
            <InputText v-model="filters.search" placeholder="Search customers" class="p-inputtext-lg" />
            <Dropdown v-model="filters.assignee" :options="assignees" optionLabel="name" optionValue="id" placeholder="Select Assignee" class="p-dropdown-lg" />
        </div>
        <DataTable :value="customers" responsiveLayout="scroll" class="p-datatable-sm">
            <Column field="firstname" header="First Name" />
            <Column field="lastname" header="Last Name" />
            <Column field="email" header="Email" />
            <Column field="status" header="Status" />
            <Column header="Assignee">
                <template #body="{ data }">
                    <Dropdown v-model="data.assignee" :options="assignees" optionLabel="name" optionValue="id" />
                </template>
            </Column>
        </DataTable>
    </div>
</template> -->
