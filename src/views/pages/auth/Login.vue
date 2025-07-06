<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useAuth } from '@/composables/useAuth';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { login, register, loading, error } = useAuth();

const isLogin = ref(true);

const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
});

const handleSubmit = async () => {
    try {
        if (isLogin.value) {
            await login(form.email, form.password);
        } else {
            if (form.password !== form.confirmPassword) {
                error.value = 'Passwords do not match';
                return;
            }
            await register(form.name, form.email, form.password);
        }

        // Redirect to health dashboard
        router.push('/health-dashboard');
    } catch (err) {
        // Error is handled by the composable
        console.error('Auth error:', err);
    }
};

const toggleMode = () => {
    isLogin.value = !isLogin.value;
    // Clear form
    Object.keys(form).forEach((key) => {
        form[key] = '';
    });
    error.value = null;
};
</script>

<template>
    <FloatingConfigurator />
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Health Tracker</h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    {{ isLogin ? 'Sign in to your account' : 'Create your account' }}
                </p>
            </div>

            <div class="bg-white py-8 px-6 shadow rounded-lg">
                <form class="space-y-6" @submit.prevent="handleSubmit">
                    <div v-if="!isLogin">
                        <label for="name" class="block text-sm font-medium text-gray-700"> Full Name </label>
                        <input
                            id="name"
                            v-model="form.name"
                            type="text"
                            required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
                        <input
                            id="password"
                            v-model="form.password"
                            type="password"
                            required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            :placeholder="isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'"
                        />
                    </div>

                    <div v-if="!isLogin">
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700"> Confirm Password </label>
                        <input
                            id="confirmPassword"
                            v-model="form.confirmPassword"
                            type="password"
                            required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Confirm your password"
                        />
                    </div>

                    <div v-if="error" class="text-red-600 text-sm text-center">
                        {{ error }}
                    </div>

                    <div>
                        <button
                            type="submit"
                            :disabled="loading"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                            {{ loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account' }}
                        </button>
                    </div>
                </form>

                <div class="mt-6">
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300" />
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-white text-gray-500">
                                {{ isLogin ? 'New to Health Tracker?' : 'Already have an account?' }}
                            </span>
                        </div>
                    </div>

                    <div class="mt-6">
                        <button
                            @click="toggleMode"
                            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {{ isLogin ? 'Create new account' : 'Sign in to existing account' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
