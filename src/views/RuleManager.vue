<script setup>
import { rules } from '@/composables/useTransactionStore';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

import { ref } from 'vue';

// const rules = ref([
//     { match: 'ALBERT HEIJN', category: 'Groceries & household' },
//     { match: 'BOLT', category: 'Transport & travel' },
//     { match: 'Hairstudio', category: 'Health & Wellness' }
// ]);

const categories = ['Groceries & household', 'Transport & travel', 'Health & Wellness', 'Shopping', 'Other', 'Uncategorized'];

const newMatch = ref('');
const newCategory = ref(null);

function addRule() {
    rules.value.push({ match: newMatch.value, category: newCategory.value });
    newMatch.value = '';
    newCategory.value = null;
}

function removeRule(index) {
    rules.value.splice(index, 1);
}
</script>

<template>
    <div class="p-4 bg-white rounded shadow space-y-4">
        <h2 class="text-lg font-semibold">⚙️ Categorization Rules</h2>

        <ul class="space-y-1 text-sm">
            <li v-for="(rule, i) in rules" :key="i" class="flex justify-between items-center">
                <span
                    ><code>{{ rule.match }}</code> → <strong>{{ rule.category }}</strong></span
                >
                <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="removeRule(i)" />
            </li>
        </ul>

        <div class="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <InputText v-model="newMatch" placeholder="Match text (e.g., BOLT)" class="w-full" />
            <Dropdown v-model="newCategory" :options="categories" placeholder="Select category" class="w-full" />
            <Button label="Add Rule" icon="pi pi-plus" @click="addRule" :disabled="!newMatch || !newCategory" />
        </div>
    </div>
</template>
