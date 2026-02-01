import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Clients
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  searchByPhone: (phone) => api.get(`/clients/search/${phone}`),
  getHistory: (id, params) => api.get(`/clients/${id}/historique`, { params }),
};

// Prestations
export const prestationsAPI = {
  getAll: (params) => api.get('/prestations', { params }),
  getOne: (id) => api.get(`/prestations/${id}`),
  create: (data) => api.post('/prestations', data),
  update: (id, data) => api.put(`/prestations/${id}`, data),
  delete: (id) => api.delete(`/prestations/${id}`),
  toggleActive: (id) => api.post(`/prestations/${id}/toggle-actif`),
  getPopular: () => api.get('/prestations/stats/populaires'),
};

// Passages
export const passagesAPI = {
  getAll: (params) => api.get('/passages', { params }),
  getOne: (id) => api.get(`/passages/${id}`),
  create: (data) => api.post('/passages', data),
  update: (id, data) => api.put(`/passages/${id}`, data),
  delete: (id) => api.delete(`/passages/${id}`),
  getByClient: (clientId) => api.get(`/passages/client/${clientId}`),
  checkFidelity: (clientId) => api.get(`/passages/client/${clientId}/check-fidelite`),
};

// Paiements
export const paiementsAPI = {
  getAll: (params) => api.get('/paiements', { params }),
  getOne: (id) => api.get(`/paiements/${id}`),
  create: (data) => api.post('/paiements', data),
  update: (id, data) => api.put(`/paiements/${id}`, data),
  // Téléchargement du reçu PDF avec responseType blob
  getReceipt: (id) => api.get(`/paiements/${id}/recu`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf',
    }
  }),
  getReceiptData: (id) => api.get(`/paiements/${id}/recu/data`),
  delete: (id) => api.delete(`/paiements/${id}`),
  cancel: (id) => api.post(`/paiements/${id}/annuler`),
};

// Statistiques
export const statsAPI = {
  daily: (date) => api.get('/statistiques/journalier', { params: { date } }),
  period: (dateDebut, dateFin) => api.get('/statistiques/periode', { params: { date_debut: dateDebut, date_fin: dateFin } }),
  prestations: (params) => api.get('/statistiques/prestations', { params }),
  fidelity: (params) => api.get('/statistiques/fidelite', { params }),
  dashboard: () => api.get('/statistiques/dashboard'),
};

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.post(`/users/${id}/toggle-actif`),
};

export default api;