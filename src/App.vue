<script setup>
// Simple app component without authentication
</script>

<template>
    <div id="app">
        <router-view />
    </div>
</template>

<style>
#app {
    font-family:
        'Inter',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Global styles for health tracker */
.health-card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.health-section {
    @apply mb-6;
}

.health-section-title {
    @apply text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2;
}

.health-button {
    @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
}

.health-button-secondary {
    @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors;
}

.health-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.health-select {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.health-progress {
    @apply w-full bg-gray-200 rounded-full h-2.5;
}

.health-progress-bar {
    @apply bg-blue-600 h-2.5 rounded-full transition-all duration-300;
}

.health-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.health-badge-success {
    @apply bg-green-100 text-green-800;
}

.health-badge-warning {
    @apply bg-yellow-100 text-yellow-800;
}

.health-badge-danger {
    @apply bg-red-100 text-red-800;
}

.health-badge-info {
    @apply bg-blue-100 text-blue-800;
}
</style>
