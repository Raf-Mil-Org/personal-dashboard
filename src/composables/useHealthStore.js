import { computed, ref } from 'vue';

export default function useHealthStore() {
    const selectedDate = ref(new Date().toISOString().slice(0, 10));
    const loading = ref(false);
    const error = ref(null);

    // Health data state with safe defaults
    const data = ref({
        water_intake: {
            glasses: 0,
            ml: 0,
            goal_ml: 2500
        },
        toilet_logs: [],
        supplements_taken: [],
        supplements_list: ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina'],
        medications_taken: [],
        medications_list: [],
        sleep: {
            hours: 0,
            bedtime: '',
            wake_time: '',
            quality: null,
            notes: ''
        },
        workouts: [],
        mood: {
            current: null,
            energy_level: 5,
            notes: ''
        }
    });

    // Computed properties
    const waterProgress = computed(() => {
        try {
            return Math.min((data.value.water_intake.ml / data.value.water_intake.goal_ml) * 100, 100);
        } catch (err) {
            console.error('Error calculating water progress:', err);
            return 0;
        }
    });

    const waterPercentage = computed(() => {
        try {
            return Math.round(waterProgress.value);
        } catch (err) {
            console.error('Error calculating water percentage:', err);
            return 0;
        }
    });

    // Local Storage Methods
    const getStorageKey = (date) => `health_${date}`;

    // Helper function to ensure arrays are properly initialized
    const ensureArrays = (obj) => {
        // Ensure obj is an object
        if (!obj || typeof obj !== 'object') {
            obj = {};
        }

        // Ensure all required properties exist
        if (!obj.water_intake || typeof obj.water_intake !== 'object') {
            obj.water_intake = { glasses: 0, ml: 0, goal_ml: 2500 };
        }

        if (!obj.sleep || typeof obj.sleep !== 'object') {
            obj.sleep = { hours: 0, bedtime: '', wake_time: '', quality: null, notes: '' };
        }

        if (!obj.mood || typeof obj.mood !== 'object') {
            obj.mood = { current: null, energy_level: 5, notes: '' };
        }

        // Ensure arrays are arrays
        if (!Array.isArray(obj.toilet_logs)) obj.toilet_logs = [];
        if (!Array.isArray(obj.supplements_taken)) obj.supplements_taken = [];
        if (!Array.isArray(obj.supplements_list)) obj.supplements_list = ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina'];
        if (!Array.isArray(obj.medications_taken)) obj.medications_taken = [];
        if (!Array.isArray(obj.medications_list)) obj.medications_list = [];
        if (!Array.isArray(obj.workouts)) obj.workouts = [];

        return obj;
    };

    const load = async (date = selectedDate.value) => {
        try {
            loading.value = true;
            error.value = null;

            const key = getStorageKey(date);
            const stored = localStorage.getItem(key);

            if (stored) {
                try {
                    const parsedData = JSON.parse(stored);
                    data.value = ensureArrays(parsedData);
                } catch (parseError) {
                    console.error('Error parsing stored data:', parseError);
                    // If parsing fails, use default data
                    data.value = ensureArrays({
                        water_intake: { glasses: 0, ml: 0, goal_ml: 2500 },
                        toilet_logs: [],
                        supplements_taken: [],
                        supplements_list: ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina'],
                        medications_taken: [],
                        medications_list: [],
                        sleep: { hours: 0, bedtime: '', wake_time: '', quality: null, notes: '' },
                        workouts: [],
                        mood: { current: null, energy_level: 5, notes: '' }
                    });
                }
            } else {
                // Initialize with default data for new date
                data.value = ensureArrays({
                    water_intake: { glasses: 0, ml: 0, goal_ml: 2500 },
                    toilet_logs: [],
                    supplements_taken: [],
                    supplements_list: ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina'],
                    medications_taken: [],
                    medications_list: [],
                    sleep: { hours: 0, bedtime: '', wake_time: '', quality: null, notes: '' },
                    workouts: [],
                    mood: { current: null, energy_level: 5, notes: '' }
                });
            }
        } catch (err) {
            console.error('Error loading health data:', err);
            error.value = 'Failed to load health data';
            // Fallback to default data
            data.value = ensureArrays({
                water_intake: { glasses: 0, ml: 0, goal_ml: 2500 },
                toilet_logs: [],
                supplements_taken: [],
                supplements_list: ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina'],
                medications_taken: [],
                medications_list: [],
                sleep: { hours: 0, bedtime: '', wake_time: '', quality: null, notes: '' },
                workouts: [],
                mood: { current: null, energy_level: 5, notes: '' }
            });
        } finally {
            loading.value = false;
        }
    };

    const save = async () => {
        try {
            loading.value = true;
            error.value = null;

            const key = getStorageKey(selectedDate.value);
            localStorage.setItem(key, JSON.stringify(data.value));
        } catch (err) {
            console.error('Error saving health data:', err);
            error.value = 'Failed to save health data';
        } finally {
            loading.value = false;
        }
    };

    // Water Intake Methods
    const addWaterIntake = (amount, unit = 'ml') => {
        if (unit === 'glasses') {
            data.value.water_intake.glasses += amount;
            data.value.water_intake.ml += amount * 250; // Assuming 250ml per glass
        } else {
            data.value.water_intake.ml += amount;
            data.value.water_intake.glasses = Math.round(data.value.water_intake.ml / 250);
        }
        save();
    };

    const setWaterGoal = (goal) => {
        data.value.water_intake.goal_ml = goal;
        save();
    };

    // Toilet Log Methods
    const logToilet = (type, details = {}) => {
        // Ensure details is an object
        const safeDetails = details && typeof details === 'object' ? details : {};

        const newLog = {
            id: Date.now(),
            type: type || 'pee',
            time: new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            }),
            date: selectedDate.value,
            ...safeDetails
        };
        data.value.toilet_logs.push(newLog);
        save();
    };

    const updateToiletLog = (id, updates) => {
        const index = data.value.toilet_logs.findIndex((log) => log.id === id);
        if (index !== -1) {
            // Safely update the log entry
            const currentLog = data.value.toilet_logs[index];
            if (currentLog && typeof currentLog === 'object') {
                data.value.toilet_logs[index] = { ...currentLog, ...updates };
                save();
            }
        }
    };

    const deleteToiletLog = (id) => {
        data.value.toilet_logs = data.value.toilet_logs.filter((log) => log.id !== id);
        save();
    };

    // Supplements Methods
    const toggleSupplement = (supplement, checked) => {
        const index = data.value.supplements_taken.indexOf(supplement);
        if (checked && index === -1) {
            // Add if checked and not already in array
            data.value.supplements_taken.push(supplement);
        } else if (!checked && index > -1) {
            // Remove if unchecked and already in array
            data.value.supplements_taken.splice(index, 1);
        }
        save();
    };

    const addSupplement = (supplement) => {
        if (!data.value.supplements_list.includes(supplement)) {
            data.value.supplements_list.push(supplement);
            save();
        }
    };

    const removeSupplementFromList = (supplement) => {
        const index = data.value.supplements_list.indexOf(supplement);
        if (index > -1) {
            data.value.supplements_list.splice(index, 1);
            // Also remove from taken list
            const takenIndex = data.value.supplements_taken.indexOf(supplement);
            if (takenIndex > -1) {
                data.value.supplements_taken.splice(takenIndex, 1);
            }
            save();
        }
    };

    // Medications Methods
    const addMedication = (medication, time = '') => {
        const newMed = {
            id: Date.now(),
            name: medication,
            time:
                time ||
                new Date().toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            taken: true
        };
        data.value.medications_taken.push(newMed);
        save();
    };

    const toggleMedication = (id) => {
        const med = data.value.medications_taken.find((m) => m.id === id);
        if (med) {
            med.taken = !med.taken;
            save();
        }
    };

    const addMedicationToList = (medication) => {
        if (!data.value.medications_list.includes(medication)) {
            data.value.medications_list.push(medication);
            save();
        }
    };

    const removeMedicationFromList = (medication) => {
        const index = data.value.medications_list.indexOf(medication);
        if (index > -1) {
            data.value.medications_list.splice(index, 1);
            save();
        }
    };

    // Sleep Methods
    const updateSleep = (sleepData) => {
        // Ensure sleepData is an object
        const safeSleepData = sleepData && typeof sleepData === 'object' ? sleepData : {};
        // Ensure current sleep data is an object
        const currentSleep = data.value.sleep && typeof data.value.sleep === 'object' ? data.value.sleep : {};
        data.value.sleep = { ...currentSleep, ...safeSleepData };
        save();
    };

    // Workout Methods
    const logWorkout = (workout) => {
        // Ensure workout is an object
        const safeWorkout = workout && typeof workout === 'object' ? workout : {};

        const newWorkout = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            }),
            date: selectedDate.value,
            ...safeWorkout
        };
        data.value.workouts.push(newWorkout);
        save();
    };

    const deleteWorkout = (id) => {
        data.value.workouts = data.value.workouts.filter((w) => w.id !== id);
        save();
    };

    // Mood Methods
    const updateMood = (moodData) => {
        // Ensure moodData is an object
        const safeMoodData = moodData && typeof moodData === 'object' ? moodData : {};
        // Ensure current mood data is an object
        const currentMood = data.value.mood && typeof data.value.mood === 'object' ? data.value.mood : {};
        data.value.mood = { ...currentMood, ...safeMoodData };
        save();
    };

    // Date Navigation
    const setDate = (date) => {
        selectedDate.value = date;
        load(date);
    };

    const goToPreviousDay = () => {
        const currentDate = new Date(selectedDate.value);
        currentDate.setDate(currentDate.getDate() - 1);
        setDate(currentDate.toISOString().slice(0, 10));
    };

    const goToNextDay = () => {
        const currentDate = new Date(selectedDate.value);
        currentDate.setDate(currentDate.getDate() + 1);
        setDate(currentDate.toISOString().slice(0, 10));
    };

    const goToToday = () => {
        setDate(new Date().toISOString().slice(0, 10));
    };

    // Initialize data for current date
    const initialize = async () => {
        await load();
    };

    return {
        // State
        selectedDate,
        data,
        loading,
        error,

        // Computed
        waterProgress,
        waterPercentage,

        // Storage Methods
        load,
        save,

        // Water Methods
        addWaterIntake,
        setWaterGoal,

        // Toilet Methods
        logToilet,
        updateToiletLog,
        deleteToiletLog,

        // Supplement Methods
        toggleSupplement,
        addSupplement,
        removeSupplementFromList,

        // Medication Methods
        addMedication,
        toggleMedication,
        addMedicationToList,
        removeMedicationFromList,

        // Sleep Methods
        updateSleep,

        // Workout Methods
        logWorkout,
        deleteWorkout,

        // Mood Methods
        updateMood,

        // Date Navigation
        setDate,
        goToPreviousDay,
        goToNextDay,
        goToToday,

        // Initialization
        initialize
    };
}
