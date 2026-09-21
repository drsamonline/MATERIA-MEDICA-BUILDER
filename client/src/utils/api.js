import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API service functions
export const remediesAPI = {
  getAll: () => api.get('/remedies').then(res => res.data),
  getById: (id) => api.get(`/remedies/${id}`).then(res => res.data),
  create: (data) => api.post('/remedies', data).then(res => res.data),
  update: (id, data) => api.put(`/remedies/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/remedies/${id}`).then(res => res.data),
};

export const symptomsAPI = {
  getAll: (remedyId) => {
    const url = remedyId ? `/symptoms?remedy_id=${remedyId}` : '/symptoms';
    return api.get(url).then(res => res.data);
  },
  getById: (id) => api.get(`/symptoms/${id}`).then(res => res.data),
  create: (data) => api.post('/symptoms', data).then(res => res.data),
  update: (id, data) => api.put(`/symptoms/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/symptoms/${id}`).then(res => res.data),
};

export const casesAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `/cases?${params}` : '/cases';
    return api.get(url).then(res => res.data);
  },
  getById: (id) => api.get(`/cases/${id}`).then(res => res.data),
  create: (data) => api.post('/cases', data).then(res => res.data),
  update: (id, data) => api.put(`/cases/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/cases/${id}`).then(res => res.data),
};

export const statsAPI = {
  getStats: () => api.get('/stats').then(res => res.data),
};

export default api;
