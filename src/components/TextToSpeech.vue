<template>
    <div class="p-4">
        <textarea v-model="text" rows="4" class="w-full p-2 border rounded" placeholder="Enter text to speak..."></textarea>
        <button @click="speak" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">Speak</button>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const text = ref('');

const speak = () => {
    if (!text.value.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text.value);
    utterance.lang = 'en-US'; // or 'el-GR', 'fr-FR', etc.

    window.speechSynthesis.cancel(); // Optional: stop current speech
    window.speechSynthesis.speak(utterance);
};
</script>
