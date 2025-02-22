<script setup>
import { computed, ref } from 'vue';

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

// const colors = ref([
//     documentStyle.getPropertyValue('--p-cyan-500'),
//     documentStyle.getPropertyValue('--p-orange-500'),
//     documentStyle.getPropertyValue('--p-red-500'),
//     documentStyle.getPropertyValue('--p-amber-500'),
//     documentStyle.getPropertyValue('--p-gray-500'),
//     documentStyle.getPropertyValue('--p-yellow-500'),
//     documentStyle.getPropertyValue('--p-emerald-500'),
//     documentStyle.getPropertyValue('--p-purple-500'),
//     documentStyle.getPropertyValue('--p-cyan-500'),
//     documentStyle.getPropertyValue('--p-indigo-500')
// ]).slice(0, props.data.length - 1);

const chartData = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement);

    const colors = ref(
        [
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
        ].slice(0, props.data.length - 1)
    );

    return {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: props.labels.map((item, idx) => {
            return {
                type: 'bar',
                label: item,
                backgroundColor: colors[idx],
                data: props.data[item]
            };
        })
        // datasets: [
        //     {
        //         type: 'bar',
        //         label: 'Dataset 1',
        //         backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
        //         data: [50, 25, 12, 48, 90, 76, 42]
        //     },
        //     {
        //         type: 'bar',
        //         label: 'Dataset 2',
        //         backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
        //         data: [21, 84, 24, 75, 37, 65, 34]
        //     },
        //     {
        //         type: 'bar',
        //         label: 'Dataset 3',
        //         backgroundColor: documentStyle.getPropertyValue('--p-orange-500'),
        //         data: [41, 52, 24, 74, 23, 21, 32]
        //     }
        // ]
    };
});

const chartOptions = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            tooltips: {
                mode: 'index',
                intersect: false
            },
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
});
</script>

<template>
    <p>{{ data }}</p>
    <div class="card">
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]" />
    </div>
</template>
