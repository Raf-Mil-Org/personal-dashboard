// composables/useJournalStore.js
import { ref, watch } from 'vue';

const STORAGE_KEY = 'journal_entries';

const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
export const journalEntries = ref(stored);

watch(
    journalEntries,
    (val) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    },
    { deep: true }
);

export function addEntry(text, tags = []) {
    journalEntries.value.unshift({
        id: Date.now().toString(),
        text,
        created_at: new Date().toISOString(),
        tags
    });
}

export function deleteEntry(id) {
    journalEntries.value = journalEntries.value.filter((e) => e.id !== id);
}

export function updateEntry(id, newText, newTags) {
    const entry = journalEntries.value.find((e) => e.id === id);
    if (entry) {
        entry.text = newText;
        entry.tags = newTags;
    }
}
