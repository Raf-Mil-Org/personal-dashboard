<!-- ChatGPTChat.vue -->
<script setup>
import { ref } from 'vue';
import axios from 'axios';

// REPLACE WITH YOUR OpenAI API key
const OPENAI_API_KEY = 'sk-...';

const input = ref('');
const messages = ref([
    { role: 'system', content: 'You are a helpful assistant.' } // Optional system prompt
]);

async function sendMessage() {
    if (!input.value.trim()) return;

    // Add user message to messages
    messages.value.push({ role: 'user', content: input.value });

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: messages.value
            },
            {
                headers: {
                    Authorization: `Bearer `,
                    'Content-Type': 'application/json'
                }
            }
        );

        const reply = response.data.choices[0].message;
        messages.value.push(reply);

        input.value = '';
    } catch (err) {
        console.error('Error:', err);
        messages.value.push({ role: 'assistant', content: '⚠️ Failed to get response from ChatGPT.' });
    }
}
</script>

<template>
    <div class="p-4 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-4">Ask ChatGPT</h2>

        <div class="space-y-4">
            <div v-for="(msg, index) in messages" :key="index" class="bg-gray-100 p-3 rounded">
                <p class="font-semibold">{{ msg.role === 'user' ? 'You' : 'ChatGPT' }}:</p>
                <p>{{ msg.content }}</p>
            </div>
        </div>

        <div class="mt-6 flex gap-2">
            <input v-model="input" @keydown.enter="sendMessage" placeholder="Ask anything..." class="emc-input flex-1" />
            <button @click="sendMessage" class="emc-button">Send</button>
        </div>
    </div>
</template>

<style scoped>
.emc-input {
    @apply border border-gray-300 rounded px-3 py-2;
}

.emc-button {
    @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
}
</style>
