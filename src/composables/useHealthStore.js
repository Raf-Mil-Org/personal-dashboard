// composables/useHealthStore.js
import { loadHealthData, saveHealthData } from '@/api/health';
import { computed, ref } from 'vue';

const healthData = ref(createDefaultHealthData());
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const isLoading = ref(false);
const error = ref(null);

const commonSupplements = ref([]);
const commonMedications = ref([]);

function createDefaultHealthData() {
    return {
        waterIntake: 0,
        vitamins: [],
        medications: [],
        toiletLogs: [],
        sleep: { hours: 0, quality: 'good', notes: '' },
        workouts: [],
        mood: 'okay',
        notes: '',
        supplements: []
    };
}

function toggleItem(list, item) {
    const index = list.indexOf(item);
    if (index === -1) list.push(item);
    else list.splice(index, 1);
}

async function initialize() {
    try {
        isLoading.value = true;
        const data = await loadHealthData(selectedDate.value);
        healthData.value = { ...createDefaultHealthData(), ...data };

        // Sync dynamic lists
        const supplementSet = new Set([...createDefaultHealthData().supplements, ...(data?.supplements || [])]);
        commonSupplements.value = Array.from(supplementSet).sort();

        const medSet = new Set([...createDefaultHealthData().medications, ...(data?.medications || [])]);
        commonMedications.value = Array.from(medSet).sort();
    } catch (err) {
        console.error('Error loading data:', err);
        error.value = err.message;
        healthData.value = createDefaultHealthData();
    } finally {
        isLoading.value = false;
    }
}

async function persist() {
    try {
        await saveHealthData(selectedDate.value, { ...healthData.value, date: selectedDate.value });
    } catch (err) {
        console.error('Error saving data:', err);
    }
}

// Action handlers
function updateSleep(payload) {
    healthData.value.sleep = { ...healthData.value.sleep, ...payload };
    persist();
}

function updateMood(mood) {
    healthData.value.mood = mood;
    persist();
}

function updateNotes(notes) {
    healthData.value.notes = notes;
    persist();
}

function addWater() {
    healthData.value.waterIntake++;
    persist();
}

function removeWater() {
    if (healthData.value.waterIntake > 0) {
        healthData.value.waterIntake--;
        persist();
    }
}

function toggleSupplement(s) {
    toggleItem(healthData.value.supplements, s);
    persist();
}

function addSupplement(supplement) {
    if (!healthData.value.supplements.includes(supplement)) {
        healthData.value.supplements.push(supplement);
        if (!commonSupplements.value.includes(supplement)) {
            commonSupplements.value.push(supplement);
        }
        persist();
    }
}

function removeSupplement(supplement) {
    const index = healthData.value.supplements.indexOf(supplement);
    if (index > -1) {
        healthData.value.supplements.splice(index, 1);
        persist();
    }
}

function toggleMedication(m) {
    toggleItem(healthData.value.medications, m);
    persist();
}

function addMedication(medication) {
    if (!healthData.value.medications.includes(medication)) {
        healthData.value.medications.push(medication);
        if (!commonMedications.value.includes(medication)) {
            commonMedications.value.push(medication);
        }
        persist();
    }
}

function removeMedication(medication) {
    const index = healthData.value.medications.indexOf(medication);
    if (index > -1) {
        healthData.value.medications.splice(index, 1);
        persist();
    }
}

function addWorkout(w) {
    healthData.value.workouts.push(w);
    persist();
}

function addToiletLog(type, details = {}) {
    const log = { type, time: new Date().toLocaleTimeString(), date: selectedDate.value, ...details };
    healthData.value.toiletLogs.push(log);
    persist();
}

function updateToiletLog(index, updated) {
    healthData.value.toiletLogs[index] = { ...healthData.value.toiletLogs[index], ...updated };
    persist();
}

function removeToiletLog(index) {
    healthData.value.toiletLogs.splice(index, 1);
    persist();
}

function goToPreviousDay() {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() - 1);
    selectedDate.value = d.toISOString().split('T')[0];
    initialize();
}

function goToNextDay() {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 1);
    selectedDate.value = d.toISOString().split('T')[0];
    initialize();
}

function goToToday() {
    selectedDate.value = new Date().toISOString().split('T')[0];
    initialize();
}

const waterProgress = computed(() => Math.min((healthData.value.waterIntake / 8) * 100, 100));
const sleepProgress = computed(() => Math.min((healthData.value.sleep.hours / 8) * 100, 100));
const isToday = computed(() => selectedDate.value === new Date().toISOString().split('T')[0]);
const formattedDate = computed(() => {
    return new Date(selectedDate.value).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

export function useHealthStore() {
    return {
        healthData,
        selectedDate,
        isLoading,
        error,
        commonSupplements,
        commonMedications,

        addWater,
        removeWater,
        updateSleep,
        updateMood,
        updateNotes,
        toggleSupplement,
        addSupplement,
        removeSupplement,
        toggleMedication,
        addMedication,
        removeMedication,
        addWorkout,
        addToiletLog,
        updateToiletLog,
        removeToiletLog,

        goToPreviousDay,
        goToNextDay,
        goToToday,
        initialize,

        waterProgress,
        sleepProgress,
        isToday,
        formattedDate
    };
}
