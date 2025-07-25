<script setup>
import { ref } from 'vue';
import { useTransactionsAnalyser } from '@/composables/useTransactionsAnalyser';
import FileUpload from 'primevue/fileupload';

const transactions = ref([]);
const onUpload = async ({ files }) => {
    const file = files[0];
    const text = await file.text();
    const rawData = useTransactionsAnalyser().parseCSV(text);
    transactions.value = useTransactionsAnalyser().cleanBankTransactions(rawData);
};
</script>

<template>
    <div class="p-4">
        <FileUpload name="csv" accept=".csv" mode="advanced" dragDrop auto customUpload chooseLabel="Upload CSV" @uploader="onUpload" />
        <!-- <FileUpload ref="fileupload" mode="basic" name="demo[]" url="/api/upload" accept=".csv" :maxFileSize="1000000" @upload="onUpload" /> -->

        <p>{{ transactions.length }}</p>
        <div v-if="transactions.length" class="mt-4">
            <h3 class="font-semibold mb-2">Cleaned Transactions:</h3>
            <pre class="text-sm bg-gray-100 p-3 rounded max-h-[400px] overflow-auto">
        {{ JSON.stringify(transactions, null, 2) }}
      </pre
            >
        </div>
    </div>
</template>

<style scoped></style>
