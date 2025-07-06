import axios from 'axios';
import { computed, ref } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000
});

export const useAuth = () => {
    const user = ref(null);
    const token = ref(localStorage.getItem('authToken'));
    const loading = ref(false);
    const error = ref(null);

    const isAuthenticated = computed(() => !!token.value);

    const login = async (email, password) => {
        try {
            loading.value = true;
            error.value = null;

            const response = await API.post('/auth/login', { email, password });

            token.value = response.data.token;
            user.value = response.data.user;

            localStorage.setItem('authToken', token.value);
            localStorage.setItem('user', JSON.stringify(user.value));

            return response.data;
        } catch (err) {
            error.value = err.response?.data?.error || 'Login failed';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const register = async (name, email, password) => {
        try {
            loading.value = true;
            error.value = null;

            const response = await API.post('/auth/register', { name, email, password });

            token.value = response.data.token;
            user.value = response.data.user;

            localStorage.setItem('authToken', token.value);
            localStorage.setItem('user', JSON.stringify(user.value));

            return response.data;
        } catch (err) {
            error.value = err.response?.data?.error || 'Registration failed';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    };

    const checkAuth = async () => {
        if (!token.value) return false;

        try {
            const response = await API.get('/auth/me', {
                headers: { Authorization: `Bearer ${token.value}` }
            });
            user.value = response.data;
            return true;
        } catch (err) {
            logout();
            return false;
        }
    };

    const updateProfile = async (updates) => {
        try {
            loading.value = true;
            error.value = null;

            const response = await API.put('/auth/me', updates, {
                headers: { Authorization: `Bearer ${token.value}` }
            });

            user.value = response.data;
            localStorage.setItem('user', JSON.stringify(user.value));

            return response.data;
        } catch (err) {
            error.value = err.response?.data?.error || 'Profile update failed';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            loading.value = true;
            error.value = null;

            await API.put(
                '/auth/password',
                { currentPassword, newPassword },
                {
                    headers: { Authorization: `Bearer ${token.value}` }
                }
            );
        } catch (err) {
            error.value = err.response?.data?.error || 'Password change failed';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Initialize auth state from localStorage
    const initialize = () => {
        const savedUser = localStorage.getItem('user');
        if (savedUser && token.value) {
            user.value = JSON.parse(savedUser);
        }
    };

    return {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        checkAuth,
        updateProfile,
        changePassword,
        initialize
    };
};
