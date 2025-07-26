// api/health.js
const API_BASE_URL = 'http://localhost:3001/api/health';
// const API_BASE_URL = 'https://personal-dashboard-backend-0a64.onrender.com/api/health';

export async function apiCall(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
}

export async function loadHealthData(date) {
    return await apiCall(`${API_BASE_URL}/${date}`);
}

export async function saveHealthData(date, data) {
    return await apiCall(`${API_BASE_URL}/${date}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}
