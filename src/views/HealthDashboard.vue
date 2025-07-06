<script setup>
import useHealthStore from '@/composables/useHealthStore';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import ProgressBar from 'primevue/progressbar';
import Slider from 'primevue/slider';
import Textarea from 'primevue/textarea';
import { computed, onMounted, ref } from 'vue';

const { data, load, save, addWaterIntake, logToilet, updateToiletLog, addSupplement, toggleSupplement, removeSupplementFromList, addMedication, addMedicationToList, logWorkout, selectedDate, goToPreviousDay, goToNextDay, goToToday } =
    useHealthStore();

// UI State
const showAddSupplementDialog = ref(false);
const showAddMedicationDialog = ref(false);
const showToiletDialog = ref(false);
const showToiletDetailsDialog = ref(false);
const showWorkoutDialog = ref(false);
const isEditMode = ref(false);
const newSupplement = ref('');
const newMedication = ref('');
const customWater = ref(0);
const medTime = ref('');
const selectedToiletEntry = ref(null);

// Form data for dialogs
const toiletForm = ref({
    type: 'pee',
    consistency: null,
    color: null,
    notes: ''
});

const workoutForm = ref({
    type: '',
    duration: 0,
    intensity: 'medium',
    notes: ''
});

// Options
const bristolScale = [
    {
        label: 'Type 1: Separate hard lumps',
        value: 1,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="4" cy="4" r="2" fill="#8B4513"/>
            <circle cx="12" cy="6" r="2" fill="#8B4513"/>
            <circle cx="8" cy="12" r="2" fill="#8B4513"/>
            <circle cx="16" cy="10" r="2" fill="#8B4513"/>
        </svg>`
    },
    {
        label: 'Type 2: Sausage-like but lumpy',
        value: 2,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <ellipse cx="10" cy="10" rx="8" ry="3" fill="#8B4513"/>
            <circle cx="4" cy="10" r="1.5" fill="#A0522D"/>
            <circle cx="16" cy="10" r="1.5" fill="#A0522D"/>
        </svg>`
    },
    {
        label: 'Type 3: Sausage-like with cracks',
        value: 3,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <ellipse cx="10" cy="10" rx="8" ry="3" fill="#8B4513"/>
            <path d="M6 8 L8 8 M12 8 L14 8 M6 12 L8 12 M12 12 L14 12" stroke="#654321" stroke-width="1"/>
        </svg>`
    },
    {
        label: 'Type 4: Smooth and soft',
        value: 4,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <ellipse cx="10" cy="10" rx="8" ry="3" fill="#228B22"/>
        </svg>`
    },
    {
        label: 'Type 5: Soft blobs with clear edges',
        value: 5,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <ellipse cx="7" cy="8" rx="3" ry="2" fill="#32CD32"/>
            <ellipse cx="13" cy="12" rx="3" ry="2" fill="#32CD32"/>
        </svg>`
    },
    {
        label: 'Type 6: Mushy consistency',
        value: 6,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 8 Q8 6 12 8 Q16 10 16 12 Q12 14 8 12 Q4 10 4 8" fill="#FFD700"/>
        </svg>`
    },
    {
        label: 'Type 7: Entirely liquid',
        value: 7,
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 6 L16 6 L16 14 L4 14 Z" fill="#FF6347" opacity="0.7"/>
            <path d="M6 8 L14 8 M6 10 L14 10 M6 12 L14 12" stroke="#FF4500" stroke-width="1"/>
        </svg>`
    }
];

const stoolColors = [
    { label: 'Brown', value: 'brown' },
    { label: 'Dark Brown', value: 'dark_brown' },
    { label: 'Light Brown', value: 'light_brown' },
    { label: 'Green', value: 'green' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Black', value: 'black' },
    { label: 'Red', value: 'red' }
];

const workoutTypes = ['Cardio', 'Weights', 'Yoga', 'Stretching', 'Walk', 'Run', 'Swimming', 'Cycling', 'HIIT', 'Pilates'];
const intensityLevels = ['Low', 'Medium', 'High'];

const moodOptions = [
    { label: '😊 Happy', value: 'happy' },
    { label: '😌 Calm', value: 'calm' },
    { label: '😐 Neutral', value: 'neutral' },
    { label: '😴 Tired', value: 'tired' },
    { label: '😰 Anxious', value: 'anxious' },
    { label: '😡 Angry', value: 'angry' },
    { label: '😢 Sad', value: 'sad' },
    { label: '🤔 Focused', value: 'focused' },
    { label: '😤 Stressed', value: 'stressed' },
    { label: '🤗 Grateful', value: 'grateful' }
];

const sleepQuality = [
    { label: '😴 Poor (1)', value: 1 },
    { label: '😐 Fair (2)', value: 2 },
    { label: '😊 Good (3)', value: 3 },
    { label: '😌 Very Good (4)', value: 4 },
    { label: '😍 Excellent (5)', value: 5 }
];

// Date navigation - using selectedDate from health store

// Computed properties for date display
const formattedDate = computed(() => {
    return new Date(selectedDate.value).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

const isToday = computed(() => {
    return selectedDate.value === new Date().toISOString().slice(0, 10);
});

// Date navigation functions - using functions from health store

// Functions
function addSupplementToList() {
    if (newSupplement.value.trim()) {
        const supplementName = newSupplement.value.trim();
        addSupplement(supplementName);
        newSupplement.value = '';
        showAddSupplementDialog.value = false;
    }
}

function addNewMedicationToList() {
    if (newMedication.value.trim()) {
        addMedicationToList(newMedication.value.trim());
        newMedication.value = '';
        showAddMedicationDialog.value = false;
    }
}

function submitToiletLog() {
    logToilet(toiletForm.value.type, {
        consistency: toiletForm.value.consistency,
        color: toiletForm.value.color,
        notes: toiletForm.value.notes
    });
    toiletForm.value = { type: 'pee', consistency: null, color: null, notes: '' };
    showToiletDialog.value = false;
}

function viewToiletDetails(entry) {
    // Safely copy the entry with only the properties we need
    selectedToiletEntry.value = {
        id: entry.id,
        type: entry.type || 'pee',
        time: entry.time,
        date: entry.date,
        consistency: entry.consistency,
        color: entry.color,
        notes: entry.notes
    };
    toiletForm.value = {
        type: entry.type || 'pee',
        consistency: entry.consistency || null,
        color: entry.color || null,
        notes: entry.notes || ''
    };
    showToiletDetailsDialog.value = true;
}

function updateToiletEntry() {
    if (selectedToiletEntry.value && selectedToiletEntry.value.id) {
        // Use the store's updateToiletLog function for safety
        updateToiletLog(selectedToiletEntry.value.id, {
            type: toiletForm.value.type,
            consistency: toiletForm.value.consistency,
            color: toiletForm.value.color,
            notes: toiletForm.value.notes
        });
    }
    showToiletDetailsDialog.value = false;
    selectedToiletEntry.value = null;
    toiletForm.value = { type: 'pee', consistency: null, color: null, notes: '' };
}

function deleteToiletEntry(entryId) {
    const logs = data.value.toilet_logs || [];
    const index = logs.findIndex((entry) => entry && entry.id === entryId);
    if (index !== -1) {
        logs.splice(index, 1);
        data.value.toilet_logs = logs;
        save();
    }
    showToiletDetailsDialog.value = false;
    selectedToiletEntry.value = null;
}

function submitWorkout() {
    logWorkout(workoutForm.value);
    workoutForm.value = { type: '', duration: 0, intensity: 'medium', notes: '' };
    showWorkoutDialog.value = false;
}

function isSupplementTaken(supplement) {
    const taken = (data.value.supplements_taken || []).includes(supplement);
    console.log('isSupplementTaken:', supplement, '=', taken);
    return taken;
}

function handleSupplementToggle(supplement, checked) {
    console.log('Toggling supplement:', supplement, 'to:', checked);
    console.log('Current supplements_taken:', data.value.supplements_taken);
    toggleSupplement(supplement, checked);
    console.log('After toggle supplements_taken:', data.value.supplements_taken);
}

function removeSupplement(supplement) {
    removeSupplementFromList(supplement);
}

onMounted(async () => {
    try {
        // Initialize the health store
        await load();
    } catch (err) {
        console.error('Error initializing health dashboard:', err);
    }
});
</script>

<template>
    <div class="p-6 space-y-8 max-w-4xl mx-auto">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">💪 Health Tracker</h1>

            <!-- Date Navigation -->
            <div class="flex items-center justify-center gap-4 mb-4">
                <Button icon="pi pi-chevron-left" @click="goToPreviousDay" severity="secondary" size="small" aria-label="Previous day" />
                <div class="flex items-center gap-2">
                    <span class="text-lg font-medium text-gray-800">{{ formattedDate }}</span>
                    <Button v-if="!isToday" label="Today" @click="goToToday" size="small" severity="info" />
                </div>
                <Button icon="pi pi-chevron-right" @click="goToNextDay" severity="secondary" size="small" aria-label="Next day" />
            </div>

            <p class="text-gray-600">
                {{ isToday ? "Today's Health Data" : 'Historical Health Data' }}
            </p>
        </div>

        <!-- Water Intake Tracker -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <span class="text-2xl">💧</span>
                Water Intake
            </h2>
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600">
                        {{ data.water_intake.ml }}ml / {{ data.water_intake.goal_ml }}ml
                        <span class="text-xs">({{ data.water_intake.glasses }} glasses)</span>
                    </div>
                    <div class="text-sm font-medium text-blue-600">{{ Math.round((data.water_intake.ml / data.water_intake.goal_ml) * 100) }}%</div>
                </div>
                <ProgressBar :value="(data.water_intake.ml / data.water_intake.goal_ml) * 100" class="h-3" />
                <div class="flex gap-2 flex-wrap">
                    <Button label="+250ml" @click="addWaterIntake(250)" size="small" />
                    <Button label="+500ml" @click="addWaterIntake(500)" size="small" />
                    <Button label="+1L" @click="addWaterIntake(1000)" size="small" />
                    <div class="flex items-center gap-2">
                        <InputNumber v-model="customWater" placeholder="Custom ml" :min="0" :max="5000" class="w-24" />
                        <Button label="Add" @click="addWaterIntake(customWater)" size="small" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Toilet Log -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <span class="text-2xl">🚽</span>
                Toilet Log
            </h2>
            <div class="flex gap-4 mb-4">
                <Button label="💦 Pee" @click="logToilet('pee')" severity="info" />
                <Button label="💩 Poop" @click="logToilet('poop')" severity="warning" />
                <Button label="Detailed Log" @click="showToiletDialog = true" severity="secondary" />
            </div>

            <div v-if="(data.toilet_logs || []).length > 0" class="space-y-2">
                <div v-for="entry in (data.toilet_logs || []).slice(-5)" :key="entry.id" class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">{{ entry.type === 'pee' ? '💦' : '💩' }}</span>
                            <div>
                                <div class="font-medium">{{ entry.type === 'pee' ? 'Pee' : 'Poop' }}</div>
                                <div class="text-sm text-gray-600">{{ entry.time }}</div>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <Button label="Edit" @click="viewToiletDetails(entry)" size="small" />
                        </div>
                    </div>

                    <!-- Details section -->
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <div v-if="entry.type === 'poop' && (entry.consistency || entry.color || entry.notes)" class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div v-if="entry.consistency" class="flex items-center gap-2">
                                <span class="font-medium text-gray-700">Consistency:</span>
                                <div class="flex items-center gap-1">
                                    <div v-html="bristolScale.find((option) => option.value === entry.consistency)?.icon" class="flex-shrink-0"></div>
                                    <span class="text-gray-600">Type {{ entry.consistency }}</span>
                                </div>
                            </div>
                            <div v-if="entry.color" class="flex items-center gap-2">
                                <span class="font-medium text-gray-700">Color:</span>
                                <span class="text-gray-600">{{ entry.color }}</span>
                            </div>
                            <div v-if="entry.notes" class="md:col-span-3">
                                <span class="font-medium text-gray-700">Notes:</span>
                                <span class="text-gray-600 ml-2">{{ entry.notes }}</span>
                            </div>
                        </div>
                        <div v-else class="text-sm text-gray-500 italic">
                            {{ entry.type === 'pee' ? 'No additional details' : 'No detailed information logged' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Vitamins/Supplements -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold flex items-center gap-2">
                    <span class="text-2xl">💊</span>
                    Vitamins & Supplements
                </h2>
                <div class="flex gap-2">
                    <Button :label="isEditMode ? 'Done' : 'Edit List'" @click="isEditMode = !isEditMode" :severity="isEditMode ? 'success' : 'secondary'" size="small" />
                    <Button label="Add New" @click="showAddSupplementDialog = true" size="small" />
                </div>
            </div>

            <!-- Supplements Grid -->
            <div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                <div
                    v-for="supplement in data.supplements_list || []"
                    :key="supplement"
                    @click="isEditMode ? removeSupplement(supplement) : handleSupplementToggle(supplement, !isSupplementTaken(supplement))"
                    class="px-4 py-2 border rounded transition-all duration-200 cursor-pointer hover:shadow-sm h-16 flex items-center justify-center"
                    :class="isEditMode ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : isSupplementTaken(supplement) ? 'bg-green-500 border-green-600 text-white shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'"
                >
                    <div class="text-center px-4">
                        <div class="font-medium leading-tigh px-4">
                            {{ supplement }}
                            <span v-if="isEditMode" class="block text-red-500 mt-0.5">Remove</span>
                        </div>
                    </div>
                </div>

                <div v-if="(data.supplements_list || []).length === 0" class="col-span-full text-center py-8 text-gray-500">No supplements added yet. Click "Add New" to get started.</div>
            </div>
        </div>

        <!-- Medication -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold flex items-center gap-2">
                    <span class="text-2xl">💉</span>
                    Medication
                </h2>
                <Button label="Add New" @click="showAddMedicationDialog = true" size="small" />
            </div>
            <div class="space-y-3">
                <div v-for="med in data.medications_list || []" :key="med" class="flex items-center justify-between p-3 border rounded-lg">
                    <span class="font-medium">{{ med }}</span>
                    <div class="flex items-center gap-2">
                        <InputText v-model="medTime" placeholder="Time" class="w-20 text-sm" />
                        <Button label="Take" @click="addMedication(med, medTime)" size="small" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Sleep Tracker -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <span class="text-2xl">💤</span>
                Sleep (Last Night)
            </h2>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Hours Slept</label>
                    <InputNumber v-model="data.sleep.hours" :min="0" :max="24" :step="0.5" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Sleep Quality</label>
                    <Dropdown v-model="data.sleep.quality" :options="sleepQuality" optionLabel="label" optionValue="value" placeholder="Select quality" class="w-full" />
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium mb-2">Notes (dreams, disturbances)</label>
                    <Textarea v-model="data.sleep.notes" rows="2" placeholder="How did you sleep? Any dreams or issues?" class="w-full" />
                </div>
            </div>
        </div>

        <!-- Workout Log -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold flex items-center gap-2">
                    <span class="text-2xl">🏋️‍♂️</span>
                    Workout Log
                </h2>
                <Button label="Log Workout" @click="showWorkoutDialog = true" />
            </div>

            <div v-if="(data.workouts || []).length > 0" class="space-y-3">
                <div v-for="workout in (data.workouts || []).slice(-3)" :key="workout.id" class="p-4 border rounded-lg bg-gray-50">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium">{{ workout.type }}</div>
                            <div class="text-sm text-gray-600">{{ workout.duration }}min • {{ workout.intensity }} intensity</div>
                        </div>
                        <div class="text-xs text-gray-500">{{ workout.time }}</div>
                    </div>
                    <div v-if="workout.notes" class="text-sm text-gray-600 mt-2">{{ workout.notes }}</div>
                </div>
            </div>
        </div>

        <!-- Mood Tracking -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <span class="text-2xl">🙂</span>
                Mood & Energy
            </h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Current Mood</label>
                    <Dropdown v-model="data.mood.current" :options="moodOptions" optionLabel="label" optionValue="value" placeholder="How are you feeling?" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Energy Level: {{ data.mood.energy_level }}/10</label>
                    <Slider v-model="data.mood.energy_level" :min="1" :max="10" :step="1" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes (context/reason)</label>
                    <Textarea v-model="data.mood.notes" rows="2" placeholder="What's affecting your mood today?" class="w-full" />
                </div>
            </div>
        </div>

        <!-- Dialogs -->
        <Dialog v-model:visible="showAddSupplementDialog" header="Add New Supplement" modal :style="{ width: '400px', maxWidth: '90vw' }">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Supplement Name</label>
                    <InputText v-model="newSupplement" placeholder="e.g., Vitamin D3, Magnesium, Omega-3" class="w-full" @keyup.enter="addSupplementToList" />
                </div>
                <div class="text-sm text-gray-600">
                    <p>Common supplements:</p>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <Button
                            v-for="common in ['Vitamin C', 'B12', 'Iron', 'Calcium', 'Probiotics']"
                            :key="common"
                            :label="common"
                            @click="
                                newSupplement = common;
                                addSupplementToList();
                            "
                            size="small"
                            severity="secondary"
                        />
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" @click="showAddSupplementDialog = false" severity="secondary" />
                    <Button label="Add" @click="addSupplementToList" :disabled="!newSupplement.trim()" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="showAddMedicationDialog" header="Add New Medication" modal>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Medication Name</label>
                    <InputText v-model="newMedication" placeholder="e.g., Ibuprofen" class="w-full" />
                </div>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" @click="showAddMedicationDialog = false" severity="secondary" />
                    <Button label="Add" @click="addNewMedicationToList" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="showToiletDialog" header="Detailed Toilet Log" modal :style="{ width: '500px', maxWidth: '90vw' }">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Type</label>
                    <Dropdown v-model="toiletForm.type" :options="['pee', 'poop']" class="w-full" />
                </div>
                <div v-if="toiletForm.type === 'poop'">
                    <label class="block text-sm font-medium mb-2">Consistency (Bristol Scale)</label>
                    <Dropdown v-model="toiletForm.consistency" :options="bristolScale" optionLabel="label" optionValue="value" placeholder="Select consistency" class="w-full">
                        <template #option="slotProps">
                            <div class="flex items-center gap-3">
                                <div v-html="slotProps.option.icon" class="flex-shrink-0"></div>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-3">
                                <div v-html="bristolScale.find((option) => option.value === slotProps.value)?.icon" class="flex-shrink-0"></div>
                                <span>{{ bristolScale.find((option) => option.value === slotProps.value)?.label }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>
                <div v-if="toiletForm.type === 'poop'">
                    <label class="block text-sm font-medium mb-2">Color</label>
                    <Dropdown v-model="toiletForm.color" :options="stoolColors" optionLabel="label" optionValue="value" placeholder="Select color" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes</label>
                    <Textarea v-model="toiletForm.notes" rows="2" placeholder="Any issues or observations?" class="w-full" />
                </div>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" @click="showToiletDialog = false" severity="secondary" />
                    <Button label="Log" @click="submitToiletLog" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="showToiletDetailsDialog" header="Edit Toilet Entry" modal :style="{ width: '500px', maxWidth: '90vw' }">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Type</label>
                    <Dropdown v-model="toiletForm.type" :options="['pee', 'poop']" class="w-full" />
                </div>
                <div v-if="toiletForm.type === 'poop'">
                    <label class="block text-sm font-medium mb-2">Consistency (Bristol Scale)</label>
                    <Dropdown v-model="toiletForm.consistency" :options="bristolScale" optionLabel="label" optionValue="value" placeholder="Select consistency" class="w-full">
                        <template #option="slotProps">
                            <div class="flex items-center gap-3">
                                <div v-html="slotProps.option.icon" class="flex-shrink-0"></div>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-3">
                                <div v-html="bristolScale.find((option) => option.value === slotProps.value)?.icon" class="flex-shrink-0"></div>
                                <span>{{ bristolScale.find((option) => option.value === slotProps.value)?.label }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>
                <div v-if="toiletForm.type === 'poop'">
                    <label class="block text-sm font-medium mb-2">Color</label>
                    <Dropdown v-model="toiletForm.color" :options="stoolColors" optionLabel="label" optionValue="value" placeholder="Select color" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes</label>
                    <Textarea v-model="toiletForm.notes" rows="2" placeholder="Any issues or observations?" class="w-full" />
                </div>
                <div class="flex justify-between">
                    <Button label="Delete" @click="deleteToiletEntry(selectedToiletEntry?.id)" severity="danger" />
                    <div class="flex gap-2">
                        <Button label="Cancel" @click="showToiletDetailsDialog = false" severity="secondary" />
                        <Button label="Update" @click="updateToiletEntry" />
                    </div>
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="showWorkoutDialog" header="Log Workout" modal>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Workout Type</label>
                    <Dropdown v-model="workoutForm.type" :options="workoutTypes" placeholder="Select type" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Duration (minutes)</label>
                    <InputNumber v-model="workoutForm.duration" :min="1" :max="300" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Intensity</label>
                    <Dropdown v-model="workoutForm.intensity" :options="intensityLevels" placeholder="Select intensity" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Notes</label>
                    <Textarea v-model="workoutForm.notes" rows="2" placeholder="How was your workout?" class="w-full" />
                </div>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" @click="showWorkoutDialog = false" severity="secondary" />
                    <Button label="Log Workout" @click="submitWorkout" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.p-progressbar-value {
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}
</style>
