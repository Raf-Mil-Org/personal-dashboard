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
        medications: [], // Now array of { id, name, consumed }
        toiletLogs: [],
        sleep: { hours: 0, quality: 'good', notes: '' },
        workouts: [],
        mood: 'okay',
        notes: '',
        supplements: [] // Now array of { id, name, consumed }
    };
}

function generateSupplementId(name) {
    return name + '-' + Math.random().toString(36).substr(2, 9);
}

function migrateSupplements(supplements) {
    // If already objects, return as is
    if (supplements.length > 0 && typeof supplements[0] === 'object') return supplements;
    // Otherwise, convert string array to object array
    return supplements.map(name => ({ id: generateSupplementId(name), name, consumed: false }));
}

function toggleItem(list, item) {
    const index = list.indexOf(item);
    if (index === -1) list.push(item);
    else list.splice(index, 1);
}

function generateNumericId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function mapToiletLogs(logs) {
    return (logs || []).map(log => ({
        id: String(log.id || generateNumericId()),
        type: log.type,
        time: log.time || new Date().toLocaleTimeString(),
        date: log.date || selectedDate.value,
        consistency: log.consistency ?? undefined,
        color: log.color ?? undefined,
        notes: log.notes ?? ''
    }));
}

function mapWorkouts(workouts) {
    return (workouts || []).map(w => ({
        id: String(w.id || generateNumericId()),
        type: w.type,
        duration: w.duration,
        intensity: w.intensity || 'Medium',
        notes: w.notes || '',
        time: w.time || new Date().toLocaleTimeString(),
        date: w.date || selectedDate.value
    }));
}

function mapMedications(meds) {
    return (meds || []).map((m, idx) => ({
        id: m.id || idx + 1,
        name: m.name || m,
        time: m.time || '',
        taken: typeof m.taken === 'boolean' ? m.taken : true
    }));
}

async function initialize() {
    try {
        isLoading.value = true;
        const data = await loadHealthData(selectedDate.value);
        // Use supplements as array of objects directly
        let supplements = [];
        if (data?.supplements && Array.isArray(data.supplements)) {
            supplements = data.supplements;
        } else if (data?.supplements_list) {
            // Fallback for legacy data
            supplements = data.supplements_list.map(name => ({
                id: generateSupplementId(name),
                name,
                consumed: false
            }));
        }
        
        // Handle medications as array of objects
        let medications = [];
        if (data?.medications && Array.isArray(data.medications)) {
            medications = data.medications;
        } else if (data?.medications_list) {
            // Fallback for legacy data
            medications = data.medications_list.map(name => ({
                id: generateSupplementId(name),
                name,
                consumed: false
            }));
        }
        
        healthData.value = { ...createDefaultHealthData(), ...data, supplements, medications };

        // Sync dynamic lists
        const supplementSet = new Set([...supplements.map(s => s.name)]);
        commonSupplements.value = Array.from(supplementSet).map(name => {
            const found = supplements.find(s => s.name === name);
            return found ? { ...found } : { id: generateSupplementId(name), name, consumed: false };
        });
        commonSupplements.value.sort((a, b) => a.name.localeCompare(b.name));

        const medicationSet = new Set([...medications.map(m => m.name)]);
        commonMedications.value = Array.from(medicationSet).map(name => {
            const found = medications.find(m => m.name === name);
            return found ? { ...found } : { id: generateSupplementId(name), name, consumed: false };
        });
        commonMedications.value.sort((a, b) => a.name.localeCompare(b.name));
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
        // Validate supplements before sending
        const validSupplements = healthData.value.supplements.filter(supplement => 
            supplement && 
            typeof supplement === 'object' && 
            supplement.id && 
            supplement.name && 
            typeof supplement.consumed === 'boolean'
        );
        
        // Validate medications before sending
        const validMedications = healthData.value.medications.filter(medication => 
            medication && 
            typeof medication === 'object' && 
            medication.id && 
            medication.name && 
            typeof medication.consumed === 'boolean'
        );
        
        // Log what we're sending for debugging
        console.log('Sending supplements:', validSupplements);
        console.log('Sending medications:', validMedications);
        
        // Map frontend fields to backend schema and ensure all required fields
        const payload = {
            date: selectedDate.value,
            water_intake: {
                glasses: healthData.value.waterIntake,
                ml: healthData.value.waterIntake * 250,
                goal_ml: 2000 // You can adjust this as needed
            },
            toilet_logs: mapToiletLogs(healthData.value.toiletLogs),
            supplements: validSupplements, // Use validated supplements
            medications: validMedications, // Use validated medications
            workouts: mapWorkouts(healthData.value.workouts),
            sleep: healthData.value.sleep,
            mood: typeof healthData.value.mood === 'object' ? healthData.value.mood : {
                current: healthData.value.mood,
                energy_level: 5, // Default or map from your data if available
                notes: healthData.value.notes || ''
            }
        };
        
        console.log('Full payload being sent:', payload);
        await saveHealthData(selectedDate.value, payload);
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

function toggleSupplement(supplement) {
    // supplement is an object
    const idx = healthData.value.supplements.findIndex(s => s.id === supplement.id);
    if (idx !== -1) {
        healthData.value.supplements[idx].consumed = !healthData.value.supplements[idx].consumed;
    } else {
        // If not present, add as consumed
        healthData.value.supplements.push({ ...supplement, consumed: true });
    }
    persist();
}

function addSupplement(supplementName) {
    // Check if already exists in commonSupplements
    let existing = commonSupplements.value.find(s => s.name === supplementName);
    if (!existing) {
        existing = { id: generateSupplementId(supplementName), name: supplementName, consumed: false };
        commonSupplements.value.push(existing);
    }
    // Add to healthData if not present
    if (!healthData.value.supplements.some(s => s.name === supplementName)) {
        healthData.value.supplements.push({ ...existing });
        persist();
    }
}

function removeSupplement(supplement) {
    // supplement is an object or name
    let idx = -1;
    if (typeof supplement === 'object') {
        idx = healthData.value.supplements.findIndex(s => s.id === supplement.id);
    } else {
        idx = healthData.value.supplements.findIndex(s => s.name === supplement);
    }
    if (idx > -1) {
        healthData.value.supplements.splice(idx, 1);
        persist();
    }
}

function toggleMedication(medication) {
    // medication is an object
    const idx = healthData.value.medications.findIndex(m => m.id === medication.id);
    if (idx !== -1) {
        healthData.value.medications[idx].consumed = !healthData.value.medications[idx].consumed;
    } else {
        // If not present, add as consumed
        healthData.value.medications.push({ ...medication, consumed: true });
    }
    persist();
}

function addMedication(medicationName) {
    // Check if already exists in commonMedications
    let existing = commonMedications.value.find(m => m.name === medicationName);
    if (!existing) {
        existing = { id: generateSupplementId(medicationName), name: medicationName, consumed: false };
        commonMedications.value.push(existing);
    }
    // Add to healthData if not present
    if (!healthData.value.medications.some(m => m.name === medicationName)) {
        healthData.value.medications.push({ ...existing });
        persist();
    }
}

function removeMedication(medication) {
    // medication is an object or name
    let idx = -1;
    if (typeof medication === 'object') {
        idx = healthData.value.medications.findIndex(m => m.id === medication.id);
    } else {
        idx = healthData.value.medications.findIndex(m => m.name === medication);
    }
    if (idx > -1) {
        healthData.value.medications.splice(idx, 1);
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
