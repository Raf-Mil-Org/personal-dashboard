<template>
    <div class="p-4 bg-gray-900 text-white min-h-screen">
        <h1 class="text-2xl font-bold mb-4">TR-909 Drum Machine (Synth)</h1>

        <!-- BPM Control -->
        <div class="mb-4">
            <label for="bpm" class="mr-2">BPM:</label>
            <input type="range" id="bpm" v-model="bpm" min="60" max="180" />
            <span class="ml-2 font-mono">{{ bpm }} BPM</span>
        </div>

        <!-- Play / Stop -->
        <div class="mb-6">
            <button @click="togglePlay" class="px-4 py-2 bg-green-500 rounded text-black mr-2">
                {{ isPlaying ? 'Stop' : 'Play' }}
            </button>
        </div>

        <!-- Sequencer Grid -->
        <div class="overflow-auto">
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th class="p-1 text-left">Drum</th>
                        <th v-for="step in stepsPerPattern" :key="step" class="w-6 text-center">{{ step }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, drum) in sequencer" :key="drum">
                        <td class="pr-2 font-bold">{{ drum }}</td>
                        <td v-for="(active, step) in row" :key="step" class="border border-gray-700 text-center">
                            <button @click="toggleStep(drum, step)" :class="['w-6 h-6 block mx-auto rounded', active ? 'bg-yellow-400' : 'bg-gray-700', currentStep === step ? 'ring-2 ring-white' : '']"></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const bpm = ref(120);
const isPlaying = ref(false);
const currentStep = ref(0);
const stepsPerPattern = 128; // 8 bars * 16 steps per bar

const drumList = ['Kick', 'Snare', 'Clap', 'Hat Closed', 'Hat Open'];
const sequencer = reactive({});

// Initialize sequencer grid
drumList.forEach((drum) => {
    sequencer[drum] = Array(stepsPerPattern).fill(false);
});

let intervalId = null;

function toggleStep(drum, step) {
    sequencer[drum][step] = !sequencer[drum][step];
}

// Synthesis functions for each drum
function playKick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playSnare() {
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.2);
}

function playClap() {
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.1);
}

function playHat(type = 'closed') {
    const duration = type === 'open' ? 0.3 : 0.05;
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start();
    noise.stop(audioCtx.currentTime + duration);
}

// Playback logic
function playStep() {
    for (const drum in sequencer) {
        if (sequencer[drum][currentStep.value]) {
            switch (drum) {
                case 'Kick':
                    playKick();
                    break;
                case 'Snare':
                    playSnare();
                    break;
                case 'Clap':
                    playClap();
                    break;
                case 'Hat Closed':
                    playHat('closed');
                    break;
                case 'Hat Open':
                    playHat('open');
                    break;
            }
        }
    }
    currentStep.value = (currentStep.value + 1) % stepsPerPattern;
}

function startSequencer() {
    const interval = (60 / bpm.value / 4) * 1000; // 16th note
    intervalId = setInterval(playStep, interval);
}

function stopSequencer() {
    clearInterval(intervalId);
    intervalId = null;
    currentStep.value = 0;
}

function togglePlay() {
    if (isPlaying.value) {
        stopSequencer();
    } else {
        startSequencer();
    }
    isPlaying.value = !isPlaying.value;
}

onBeforeUnmount(() => stopSequencer());
</script>
