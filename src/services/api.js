// services/api.js
import axios from 'axios';
import { networkManager } from './networkManager';
import { getLocalAuth } from './localAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configuration axios principale
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Cache pour les requêtes hors ligne
const requestQueue = {
  pending: [],
  retryQueue: [],
  
  add(request) {
    this.pending.push(request);
    this.saveQueue();
  },
  
  remove(id) {
    this.pending = this.pending.filter(req => req.id !== id);
    this.saveQueue();
  },
  
  getAll() {
    return this.pending;
  },
  
  saveQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.pending));
    } catch (error) {
      console.error('Erreur sauvegarde file:', error);
    }
  },
  
  loadQueue() {
    try {
      const saved = localStorage.getItem('offline_queue');
      if (saved) {
        this.pending = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur chargement file:', error);
    }
  }
};

// Charger la file d'attente au démarrage
requestQueue.loadQueue();

// Intercepteur pour ajouter le token et gérer le mode hors ligne
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Si hors ligne et requête POST/PUT/DELETE, mettre en file d'attente
    if (!networkManager.getStatus() && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
      const offlineRequest = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        method: config.method,
        url: config.url,
        data: config.data,
        headers: config.headers,
        timestamp: new Date().toISOString()
      };
      
      requestQueue.add(offlineRequest);
      
      // Pour les créations, retourner une réponse simulée avec ID temporaire
      if (config.method === 'post') {
        return Promise.resolve({
          data: {
            success: true,
            offline: true,
            message: 'Requête enregistrée pour synchronisation',
            tempId: offlineRequest.id,
            timestamp: new Date().toISOString()
          },
          status: 202,
          statusText: 'Accepted (offline)'
        });
      }
      
      // Pour les autres méthodes, lancer une erreur spécifique
      return Promise.reject({
        response: {
          status: 0,
          data: {
            success: false,
            offline: true,
            message: 'Mode hors ligne - requête mise en attente',
            tempId: offlineRequest.id
          }
        }
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    // Si réponse de succès hors ligne, la traiter
    if (response.data && response.data.offline) {
      return {
        ...response,
        offline: true
      };
    }
    return response;
  },
  async (error) => {
    // Erreur réseau (hors ligne)
    if (!error.response && !networkManager.getStatus()) {
      // Vérifier si on a une authentification locale valide
      const localAuth = await getLocalAuth();
      if (localAuth && window.location.pathname !== '/login') {
        // On est hors ligne mais authentifié localement
        // On laisse passer certaines erreurs pour permettre le fonctionnement hors ligne
        if (error.config.url.includes('/auth/')) {
          return Promise.reject({
            ...error,
            offline: true,
            message: 'Mode hors ligne - authentification locale active'
          });
        }
      }
      
      // Pour les GET, on peut essayer de retourner des données locales
      if (error.config.method === 'get') {
        return Promise.reject({
          ...error,
          offline: true,
          config: error.config,
          message: 'Impossible de récupérer les données - mode hors ligne'
        });
      }
    }
    
    // Erreur 401 - Non autorisé
    if (error.response?.status === 401) {
      // Ne pas déconnecter si on est hors ligne
      if (networkManager.getStatus()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_timestamp');
        
        // Rediriger vers login seulement si on n'y est pas déjà
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Service pour synchroniser les requêtes en attente
const syncOfflineRequests = async () => {
  if (!networkManager.getStatus()) {
    console.log('Impossible de synchroniser - hors ligne');
    return { success: false, message: 'Hors ligne' };
  }
  
  const pendingRequests = requestQueue.getAll();
  if (pendingRequests.length === 0) {
    return { success: true, message: 'Rien à synchroniser' };
  }
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const request of pendingRequests) {
    try {
      // Reconstruire la requête
      const response = await api({
        method: request.method,
        url: request.url,
        data: request.data,
        headers: {
          ...request.headers,
          'X-Offline-Sync': 'true',
          'X-Original-Timestamp': request.timestamp
        }
      });
      
      results.success.push({
        id: request.id,
        response: response.data
      });
      
      // Retirer de la file
      requestQueue.remove(request.id);
      
    } catch (error) {
      console.error(`Erreur synchronisation requête ${request.id}:`, error);
      results.failed.push({
        id: request.id,
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    synced: results.success.length,
    failed: results.failed.length,
    details: results
  };
};

// Fonction pour vérifier périodiquement la connexion
const startSyncService = (interval = 30000) => {
  const intervalId = setInterval(async () => {
    if (networkManager.getStatus()) {
      await syncOfflineRequests();
    }
  }, interval);
  
  return () => clearInterval(intervalId);
};

// Auth API avec gestion hors ligne
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  getOfflineUsers: () => api.get('/auth/offline-users'),
  refresh: () => api.post('/auth/refresh'),
};

// services/api.js (ajouter ces méthodes dans clientsAPI)
export const clientsAPI = {
  // ... méthodes existantes ...
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  searchByPhone: (phone) => api.get(`/clients/search/${phone}`),
  getHistory: (id, params) => api.get(`/clients/${id}/historique`, { params }),
  
  // Nouvelles méthodes
  archive: (id) => api.post(`/clients/${id}/archive`),
  restore: (id) => api.post(`/clients/${id}/restore`),
  getArchived: (params) => api.get('/clients/archived/list', { params }),
  generateCode: () => api.get('/clients/generate-code'),
};

export const prestationsAPI = {
  getAll: (params) => api.get('/prestations', { params }),
  getOne: (id) => api.get(`/prestations/${id}`),
  create: (data) => api.post('/prestations', data),
  update: (id, data) => api.put(`/prestations/${id}`, data),
  delete: (id) => api.delete(`/prestations/${id}`),
  toggleActive: (id) => api.post(`/prestations/${id}/toggle-actif`),
  getPopular: () => api.get('/prestations/stats/populaires'),
};

export const passagesAPI = {
  getAll: (params) => api.get('/passages', { params }),
  getOne: (id) => api.get(`/passages/${id}`),
  create: (data) => api.post('/passages', data),
  update: (id, data) => api.put(`/passages/${id}`, data),
  delete: (id) => api.delete(`/passages/${id}`),
  getByClient: (clientId) => api.get(`/passages/client/${clientId}`),
  checkFidelity: (clientId) => api.get(`/passages/client/${clientId}/check-fidelite`),
  byClient: (clientId) => api.get(`/passages/par-client/${clientId}`),
  byCoiffeur: (coiffeurId, params) => api.get(`/passages/par-coiffeur/${coiffeurId}`, { params }),
};

export const paiementsAPI = {
  getAll: (params) => api.get('/paiements', { params }),
  getOne: (id) => api.get(`/paiements/${id}`),
  create: (data) => api.post('/paiements', data),
  update: (id, data) => api.put(`/paiements/${id}`, data),
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

export const statsAPI = {
  daily: (date) => api.get('/statistiques/journalier', { params: { date } }),
  period: (dateDebut, dateFin) => api.get('/statistiques/periode', { params: { date_debut: dateDebut, date_fin: dateFin } }),
  prestations: (params) => api.get('/statistiques/prestations', { params }),
  fidelity: (params) => api.get('/statistiques/fidelite', { params }),
  dashboard: () => api.get('/statistiques/dashboard'),
  coiffeurs: (params = {}) => api.get('/statistiques/coiffeurs', { params }),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.post(`/users/${id}/toggle-actif`),
  getCoiffeurs: (params) => api.get('/users/coiffeurs/liste', { params }),
  getCoiffeurStats: (id, params) => api.get(`/users/coiffeurs/${id}/statistiques`, { params }),
  associerPrestation: (id, data) => api.post(`/users/coiffeurs/${id}/prestations`, data),
  detacherPrestation: (coiffeurId, prestationId) => 
    api.delete(`/users/coiffeurs/${coiffeurId}/prestations/${prestationId}`),
};
// API de synchronisation
export const syncAPI = {
  sync: (data) => api.post('/sync', data),
  syncStats: () => api.get('/sync/stats'),
};

export { api };
export {  syncOfflineRequests, startSyncService };