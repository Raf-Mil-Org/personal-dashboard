<script setup>
import { computed } from 'vue';

const props = defineProps({
    labels: {
        type: Array,
        default: () => []
    },
    data: {
        type: [],
        default: () => []
    }
});

const chartData = computed(() => {
    const documentStyle = getComputedStyle(document.body);

    return {
        labels: props.labels,
        datasets: [
            {
                data: props.data,
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-cyan-500'),
                    documentStyle.getPropertyValue('--p-orange-500'),
                    documentStyle.getPropertyValue('--p-red-500'),
                    documentStyle.getPropertyValue('--p-amber-500'),
                    documentStyle.getPropertyValue('--p-gray-500'),
                    documentStyle.getPropertyValue('--p-yellow-500'),
                    documentStyle.getPropertyValue('--p-emerald-500'),
                    documentStyle.getPropertyValue('--p-purple-500'),
                    documentStyle.getPropertyValue('--p-cyan-500'),
                    documentStyle.getPropertyValue('--p-indigo-500')
                ].slice(0, props.data.length - 1),

                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--p-cyan-400'),
                    documentStyle.getPropertyValue('--p-orange-400'),
                    documentStyle.getPropertyValue('--p-red-400'),
                    documentStyle.getPropertyValue('--p-amber-400'),
                    documentStyle.getPropertyValue('--p-gray-400'),
                    documentStyle.getPropertyValue('--p-yellow-400'),
                    documentStyle.getPropertyValue('--p-emerald-400'),
                    documentStyle.getPropertyValue('--p-purple-400'),
                    documentStyle.getPropertyValue('--p-cyan-400'),
                    documentStyle.getPropertyValue('--p-indigo-400')
                ].slice(0, props.data.length - 1)
            }
        ]
    };
});

const chartOptions = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');

    return {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: textColor
                }
            }
        }
    };
});
</script>

<template>
    <div class="card flex justify-center">
        <Chart type="pie" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem]" />
    </div>
</template>
