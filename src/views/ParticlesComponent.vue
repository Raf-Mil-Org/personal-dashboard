<script setup>
import { onMounted, ref, watch } from 'vue';

const particleCount = ref(250);
const speed = ref(2);
const connectionDistance = ref(100);
const canvas = ref(null);

class Particle {
    constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * speed.value;
        this.vy = (Math.random() - 0.5) * speed.value;
    }

    move(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= 0 || this.x >= width) this.vx *= -1;
        if (this.y <= 0 || this.y >= height) this.vy *= -1;
    }
}

const drawParticles = (ctx, particles) => {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    particles.forEach((p) => {
        p.move(canvas.value.width, canvas.value.height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        // ctx.fillStyle = `#${Math.random(0, 6)}3${Math.random(0, 6)}${Math.random(0, 6)}F1`;
        ctx.fillStyle = `#FF0000`;
        ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < connectionDistance.value) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                // ctx.strokeStyle = `rgba(${Math.random(0, 255)}, ${Math.random(0, 255)}, ${Math.random(0, 255)}, ${1 - distance / connectionDistance.value})`;
                ctx.strokeStyle = `#FF0000`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
};

// Canvas View Mode
const canvasClass = ref('w-full h-[400px]'); // Default Landscape

const setLandscapeView = () => {
    canvasClass.value = 'w-full h-[400px]'; // Wider Canvas
};

const setPortraitView = () => {
    canvasClass.value = 'w-[400px] h-[600px]'; // Taller Canvas
};

onMounted(() => {
    const ctx = canvas.value.getContext('2d');
    canvas.value.width = 600;
    canvas.value.height = 400;

    let particles = Array.from({ length: particleCount.value }, () => new Particle(canvas.value.width, canvas.value.height));

    const animate = () => {
        drawParticles(ctx, particles);
        requestAnimationFrame(animate);
    };

    animate();

    watch([particleCount, speed, connectionDistance], () => {
        particles = Array.from({ length: particleCount.value }, () => new Particle(canvas.value.width, canvas.value.height));
    });
});
</script>

<template>
    <div class="p-6 text-center">
        <h1 class="text-2xl font-bold mb-6">Advanced Visual Playground</h1>
        <!-- View Toggle Buttons -->
        <div class="mb-4 flex justify-center gap-4">
            <button @click="setLandscapeView" class="p-2 px-4 bg-blue-500 text-white rounded">Landscape View</button>
            <button @click="setPortraitView" class="p-2 px-4 bg-green-500 text-white rounded">Portrait View</button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div class="space-y-4">
                <div>
                    <label for="particleCount">Particle Count: {{ particleCount }}</label>
                    <input type="range" id="particleCount" min="50" max="500" step="10" v-model="particleCount" />
                </div>
                <div>
                    <label for="speed">Speed: {{ speed }}</label>
                    <input type="range" id="speed" min="0.5" max="5" step="0.1" v-model="speed" />
                </div>
                <div>
                    <label for="connectionDistance">Connection Distance: {{ connectionDistance }}</label>
                    <input type="range" id="connectionDistance" min="50" max="200" v-model="connectionDistance" />
                </div>
            </div>
            <!-- Canvas - Takes up more space -->
            <div class="col-span-5 flex">
                <canvas ref="canvas" :class="canvasClass" class="border rounded-lg"></canvas>
            </div>
        </div>
    </div>
</template>

<style>
body {
    font-family: Arial, sans-serif;
    background-color: #f9fafb;
}
input[type='range'] {
    width: 100%;
}
canvas {
    width: 100%;
    height: auto;
    background-color: #ffffff;
}
</style>
