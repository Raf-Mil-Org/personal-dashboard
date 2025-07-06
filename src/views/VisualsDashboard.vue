<script setup>
import { onMounted, ref, watch } from 'vue';
import ParticlesComponent from './ParticlesComponent.vue';

const frequency = ref(10);
const amplitude = ref(50);
const speed = ref(2);
const canvas = ref(null);

const draw = (ctx, width, height, time) => {
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.cos((x + time) * frequency.value * 0.01) * amplitude.value;
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 2;
    ctx.stroke();
};

onMounted(() => {
    // const ctx = canvas.value.getContext('2d');
    // canvas.value.width = 600;
    // canvas.value.height = 300;
    // let time = 20;
    // const animate = () => {
    //     draw(ctx, canvas.value.width, canvas.value.height, time);
    //     time -= speed.value;
    //     requestAnimationFrame(animate);
    // };
    // animate();
});

watch([frequency, amplitude, speed], () => {
    // Redraw on slider changes is handled by the animate loop
});
</script>

<template>
    <!-- <div class="p-6 text-center">
        <h1 class="text-2xl font-bold mb-4">Visual Playground</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
                <div>
                    <label for="frequency">Frequency: {{ frequency }}</label>
                    <input type="range" id="frequency" min="1" max="20" v-model="frequency" />
                </div>
                <div>
                    <label for="amplitude">Amplitude: {{ amplitude }}</label>
                    <input type="range" id="amplitude" min="10" max="100" v-model="amplitude" />
                </div>
                <div>
                    <label for="speed">Speed: {{ speed }}</label>
                    <input type="range" id="speed" min="0.1" max="5" step="0.1" v-model="speed" />
                </div>
            </div>
        </div>
        <div class="flex">
            <canvas ref="canvas" class="border rounded-lg"></canvas>
        </div>
    </div> -->
    <ParticlesComponent />
</template>
