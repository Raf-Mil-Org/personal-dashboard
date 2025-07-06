import axios from 'axios';
import { ref } from 'vue';

export default function useStorageSource(key) {
    const items = ref([]);

    async function load() {
        try {
            const res = await axios.get(`/api/${key}`);
            items.value = res.data;
        } catch (err) {
            const local = localStorage.getItem(key);
            if (local) items.value = JSON.parse(local);
        }
    }

    function save() {
        localStorage.setItem(key, JSON.stringify(items.value));
        axios.post(`/api/${key}`, items.value).catch(() => {});
    }

    return { items, load, save };
}
