import { computed, ref } from 'vue';

const API_BASE_URL = 'http://localhost:3001/api/health';

// State
const healthData = ref({
    waterIntake: 0,
    vitamins: [],
    medications: [],
    toiletLogs: [],
    sleep: {
        hours: 0,
        quality: 'good',
        notes: ''
    },
    workouts: [],
    mood: 'okay',
    notes: '',
    supplements: []
});

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const isLoading = ref(false);
const error = ref(null);

// Common supplements list
const commonSupplements = ['D3', 'B12', 'C', 'Ω3', 'Mg', 'Zinc', 'Fe', 'Ca', 'PreBio', 'Creat', 'Prot', 'MultVt'];

// Common medications list
const commonMedications = ['Aspirin', 'Ibuprofen', 'Paracetamol', 'Antihistamine', 'Antibiotics', 'Med 1', 'Med 2'];

// API Functions
const apiCall = async (url, options = {}) => {
    try {
        isLoading.value = true;
        error.value = null;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        error.value = err.message;
        console.error('API Error:', err);
        throw err;
    } finally {
        isLoading.value = false;
    }
};

const loadHealthData = async (date) => {
    try {
        const data = await apiCall(`${API_BASE_URL}/${date}`);

        // Ensure all arrays and objects are properly initialized
        healthData.value = {
            waterIntake: data.waterIntake || 0,
            vitamins: Array.isArray(data.vitamins) ? data.vitamins : [],
            medications: Array.isArray(data.medications) ? data.medications : [],
            toiletLogs: Array.isArray(data.toiletLogs) ? data.toiletLogs : [],
            sleep: {
                hours: data.sleep?.hours || 0,
                quality: data.sleep?.quality || 'good',
                notes: data.sleep?.notes || ''
            },
            workouts: Array.isArray(data.workouts) ? data.workouts : [],
            mood: data.mood || 'okay',
            notes: data.notes || '',
            supplements: Array.isArray(data.supplements) ? data.supplements : []
        };
    } catch (err) {
        console.error('Failed to load health data:', err);
        // Initialize with defaults if API fails
        healthData.value = {
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
};

// Utility to convert camelCase to snake_case
function toSnakeCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase);
    } else if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (!Object.hasOwn(obj, key)) continue;
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newObj[snakeKey] = toSnakeCase(obj[key]);
        }
        return newObj;
    }
    return obj;
}

const saveHealthData = async (date) => {
    try {
        // Prepare data for backend: convert camelCase to snake_case and flatten toilet logs
        const dataToSave = JSON.parse(JSON.stringify(healthData.value));
        // Flatten toilet logs if needed
        if (Array.isArray(dataToSave.toiletLogs)) {
            dataToSave.toiletLogs = dataToSave.toiletLogs.map((log, idx) => {
                // If log.details exists, flatten it
                if (log.details) {
                    return {
                        id: log.id || idx,
                        type: log.type,
                        time: log.time,
                        date: log.date || date,
                        consistency: log.details.consistency ?? log.consistency,
                        color: log.details.color ?? log.color,
                        notes: log.details.notes ?? log.notes
                    };
                } else {
                    return {
                        id: log.id || idx,
                        type: log.type,
                        time: log.time,
                        date: log.date || date,
                        consistency: log.consistency,
                        color: log.color,
                        notes: log.notes
                    };
                }
            });
        }
        // Convert to snake_case for backend
        const snakeData = toSnakeCase({ ...dataToSave, date });
        console.log('[saveHealthData] POST /api/health/ with:', snakeData);
        await apiCall(`${API_BASE_URL}/`, {
            method: 'POST',
            body: JSON.stringify(snakeData)
        });
    } catch (err) {
        console.error('Failed to save health data:', err);
        throw err;
    }
};

// Actions
const addWater = () => {
    healthData.value.waterIntake++;
    saveHealthData(selectedDate.value);
};

const removeWater = () => {
    if (healthData.value.waterIntake > 0) {
        healthData.value.waterIntake--;
        saveHealthData(selectedDate.value);
    }
};

const addToiletLog = (type, details = {}) => {
    const log = {
        type,
        time: new Date().toLocaleTimeString(),
        details
    };
    healthData.value.toiletLogs.push(log);
    saveHealthData(selectedDate.value);
};

const removeToiletLog = (index) => {
    healthData.value.toiletLogs.splice(index, 1);
    saveHealthData(selectedDate.value);
};

const updateToiletLog = (index, updatedLog) => {
    try {
        healthData.value.toiletLogs[index] = updatedLog;
        saveHealthData(selectedDate.value);
    } catch (err) {
        console.error('Error in updateToiletLog:', err);
    }
};

const addVitamin = (vitamin) => {
    if (!healthData.value.vitamins.includes(vitamin)) {
        healthData.value.vitamins.push(vitamin);
        saveHealthData(selectedDate.value);
    }
};

const removeVitamin = (vitamin) => {
    const index = healthData.value.vitamins.indexOf(vitamin);
    if (index > -1) {
        healthData.value.vitamins.splice(index, 1);
        saveHealthData(selectedDate.value);
    }
};

const toggleVitamin = (vitamin) => {
    if (healthData.value.vitamins.includes(vitamin)) {
        removeVitamin(vitamin);
    } else {
        addVitamin(vitamin);
    }
};

const addMedication = (medication) => {
    if (!healthData.value.medications.includes(medication)) {
        healthData.value.medications.push(medication);
        saveHealthData(selectedDate.value);
    }
};

const removeMedication = (medication) => {
    const index = healthData.value.medications.indexOf(medication);
    if (index > -1) {
        healthData.value.medications.splice(index, 1);
        saveHealthData(selectedDate.value);
    }
};

const toggleMedication = (medication) => {
    if (healthData.value.medications.includes(medication)) {
        removeMedication(medication);
    } else {
        addMedication(medication);
    }
};

const updateSleep = (sleepData) => {
    healthData.value.sleep = { ...healthData.value.sleep, ...sleepData };
    saveHealthData(selectedDate.value);
};

const addWorkout = (workout) => {
    healthData.value.workouts.push(workout);
    saveHealthData(selectedDate.value);
};

const removeWorkout = (index) => {
    healthData.value.workouts.splice(index, 1);
    saveHealthData(selectedDate.value);
};

const updateMood = (mood) => {
    healthData.value.mood = mood;
    saveHealthData(selectedDate.value);
};

const updateNotes = (notes) => {
    healthData.value.notes = notes;
    saveHealthData(selectedDate.value);
};

const addSupplement = (supplement) => {
    if (!healthData.value.supplements.includes(supplement)) {
        healthData.value.supplements.push(supplement);
        saveHealthData(selectedDate.value);
    }
};

const removeSupplement = (supplement) => {
    const index = healthData.value.supplements.indexOf(supplement);
    if (index > -1) {
        healthData.value.supplements.splice(index, 1);
        saveHealthData(selectedDate.value);
    }
};

const toggleSupplement = (supplement) => {
    if (healthData.value.supplements.includes(supplement)) {
        removeSupplement(supplement);
    } else {
        addSupplement(supplement);
    }
};

const changeDate = async (date) => {
    selectedDate.value = date;
    await loadHealthData(date);
};

const goToPreviousDay = async () => {
    const currentDate = new Date(selectedDate.value);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = currentDate.toISOString().split('T')[0];
    await changeDate(newDate);
};

const goToNextDay = async () => {
    const currentDate = new Date(selectedDate.value);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toISOString().split('T')[0];
    await changeDate(newDate);
};

const goToToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    await changeDate(today);
};

// Computed
const waterProgress = computed(() => {
    const target = 8; // 8 glasses per day
    return Math.min((healthData.value.waterIntake / target) * 100, 100);
});

const sleepProgress = computed(() => {
    const target = 8; // 8 hours per day
    return Math.min((healthData.value.sleep.hours / target) * 100, 100);
});

const isToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate.value === today;
});

const formattedDate = computed(() => {
    const date = new Date(selectedDate.value);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Initialize
const initialize = async () => {
    await loadHealthData(selectedDate.value);
};

export function useHealthStore() {
    return {
        // State
        healthData,
        selectedDate,
        isLoading,
        error,
        commonSupplements,
        commonMedications,

        // Actions
        addWater,
        removeWater,
        addToiletLog,
        removeToiletLog,
        updateToiletLog,
        addVitamin,
        removeVitamin,
        toggleVitamin,
        addMedication,
        removeMedication,
        toggleMedication,
        updateSleep,
        addWorkout,
        removeWorkout,
        updateMood,
        updateNotes,
        addSupplement,
        removeSupplement,
        toggleSupplement,
        changeDate,
        goToPreviousDay,
        goToNextDay,
        goToToday,
        initialize,

        // Computed
        waterProgress,
        sleepProgress,
        isToday,
        formattedDate,

        // Utility
        saveHealthData
    };
}
