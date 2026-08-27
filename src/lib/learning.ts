import axios from 'axios';

const api = axios.create({
    baseURL: '/api/learning/',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const learningApi = {
    getDashboardStats: async () => {
        return (await api.get('dashboard/')).data;
    },

    getLearningRuns: async () => {
        return (await api.get('runs/')).data;
    },

    triggerLearningRun: async () => {
        return (await api.post('runs/trigger/')).data;
    },

    getSettings: async () => {
        return (await api.get('settings/')).data;
    },

    updateSettings: async (data: any) => {
        return (await api.patch('settings/', data)).data;
    },

    rollbackRun: async (runId: string) => {
        return (await api.post(`rollback/${runId}/`)).data;
    },

    uploadTrainingExample: async (data: { prompt: string; answer: string; category: string; source_description?: string; subcategory?: string }) => {
        return (await api.post('training/upload/', data)).data;
    },

    approveTrainingExample: async (exampleId: string) => {
        return (await api.post(`training/${exampleId}/approve/`)).data;
    },

    getKnowledgeItems: async (category?: string) => {
        return (await api.get('items/', { params: { category } })).data;
    },

    rejectKnowledgeItem: async (itemId: string, reason: string) => {
        return (await api.post(`items/${itemId}/reject/`, { reason })).data;
    },

    triggerBenchmark: async () => {
        return (await api.post('benchmark/latest/')).data;
    }
};
