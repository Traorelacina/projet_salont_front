import { dbOperations } from './db';
import api from './api';

const DEVICE_ID = 'device_' + Math.random().toString(36).substr(2, 9);

// Classe pour gérer la synchronisation
class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.listeners = [];
  }

  // Ajouter un écouteur d'événements de synchronisation
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Notifier tous les écouteurs
  notifyListeners(event) {
    this.listeners.forEach(callback => callback(event));
  }

  // Ajouter une opération à la file d'attente de synchronisation
  async addToSyncQueue(entityType, action, data, localId = null) {
    const db = await import('./db').then(m => m.default());
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    
    await store.add({
      entity_type: entityType,
      action: action,
      data: data,
      local_id: localId,
      created_at: new Date().toISOString(),
      attempts: 0,
    });
    
    await tx.done;
  }

  // Enregistrer un log de synchronisation
  async logSync(status, message, details = null) {
    const db = await import('./db').then(m => m.default());
    const tx = db.transaction('sync_logs', 'readwrite');
    const store = tx.objectStore('sync_logs');
    
    await store.add({
      timestamp: new Date().toISOString(),
      status: status,
      message: message,
      details: details,
    });
    
    await tx.done;

    // Nettoyer les anciens logs périodiquement
    if (Math.random() < 0.1) { // 10% de chance
      await dbOperations.cleanOldLogs();
    }
  }

  // Vérifier la connectivité
  async checkConnectivity() {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const response = await api.get('/ping', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Synchronisation complète (push + pull)
  async sync() {
    if (this.isSyncing) {
      console.log('Synchronisation déjà en cours');
      return;
    }

    const isOnline = await this.checkConnectivity();
    if (!isOnline) {
      console.log('Mode hors ligne - synchronisation différée');
      this.notifyListeners({ type: 'offline' });
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync_start' });

    try {
      // 1. Pousser les modifications locales vers le serveur
      await this.pushLocalChanges();

      // 2. Récupérer les mises à jour du serveur
      await this.pullServerUpdates();

      await this.logSync('success', 'Synchronisation réussie');
      this.notifyListeners({ type: 'sync_success' });
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      await this.logSync('error', 'Erreur de synchronisation', error.message);
      this.notifyListeners({ type: 'sync_error', error });
    } finally {
      this.isSyncing = false;
      this.notifyListeners({ type: 'sync_end' });
    }
  }

  // Pousser les modifications locales vers le serveur
  async pushLocalChanges() {
    const db = await import('./db').then(m => m.default());
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const queue = await store.getAll();
    await tx.done;

    if (queue.length === 0) {
      console.log('Aucune modification locale à synchroniser');
      return;
    }

    // Regrouper les opérations par type d'entité
    const groupedOperations = {
      clients: [],
      prestations: [],
      passages: [],
      paiements: [],
    };

    for (const item of queue) {
      if (groupedOperations[item.entity_type]) {
        groupedOperations[item.entity_type].push({
          local_id: item.local_id,
          action: item.action,
          ...item.data,
        });
      }
    }

    // Envoyer les données au serveur via l'endpoint batch
    try {
      const response = await api.post('/sync/batch', {
        device_id: DEVICE_ID,
        data: groupedOperations,
      });

      if (response.data.success) {
        const results = response.data.data;

        // Traiter les résultats et mettre à jour IndexedDB
        await this.processServerResults(results, queue);

        // Nettoyer la file d'attente
        await this.clearSyncQueue(queue.map(item => item.id));

        console.log('Modifications locales envoyées avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des modifications:', error);
      throw error;
    }
  }

  // Traiter les résultats du serveur
  async processServerResults(results, queue) {
    for (const [entityType, items] of Object.entries(results)) {
      for (const item of items) {
        if (item.status === 'succes') {
          // Mettre à jour l'enregistrement local avec l'ID serveur
          if (item.local_id) {
            await dbOperations.markAsSynced(
              entityType,
              item.local_id,
              item.server_id
            );
          }
        } else if (item.status === 'conflit') {
          // Gérer les conflits (pour l'instant, on prend la version serveur)
          console.warn('Conflit détecté:', item);
          await this.logSync('warning', `Conflit pour ${entityType}`, item);
        } else if (item.status === 'echec') {
          console.error('Échec de synchronisation:', item);
          await this.logSync('error', `Échec pour ${entityType}`, item.message);
        }
      }
    }
  }

  // Nettoyer la file d'attente de synchronisation
  async clearSyncQueue(ids) {
    const db = await import('./db').then(m => m.default());
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');

    for (const id of ids) {
      await store.delete(id);
    }

    await tx.done;
  }

  // Récupérer les mises à jour du serveur
  async pullServerUpdates() {
    try {
      // Récupérer le timestamp de la dernière synchronisation
      const lastSync = localStorage.getItem('last_sync_timestamp') || new Date(0).toISOString();

      const response = await api.get('/sync/pull', {
        params: { timestamp: lastSync },
      });

      if (response.data.success) {
        const { clients, prestations, passages, paiements } = response.data.data;

        // Mettre à jour IndexedDB avec les données du serveur
        await this.updateLocalData('clients', clients);
        await this.updateLocalData('prestations', prestations);
        await this.updateLocalData('passages', passages);
        await this.updateLocalData('paiements', paiements);

        // Mettre à jour le timestamp de synchronisation
        localStorage.setItem('last_sync_timestamp', response.data.timestamp);

        console.log('Mises à jour serveur récupérées avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des mises à jour:', error);
      throw error;
    }
  }

  // Mettre à jour les données locales avec les données du serveur
  async updateLocalData(storeName, data) {
    if (!data || data.length === 0) {
      return;
    }

    for (const item of data) {
      // Vérifier si l'enregistrement existe déjà
      const existing = await dbOperations.get(storeName, item.id);

      if (existing) {
        // Comparer les timestamps pour éviter d'écraser des données plus récentes
        const serverTime = new Date(item.synced_at || item.updated_at);
        const localTime = new Date(existing.updated_at);

        if (serverTime > localTime) {
          await dbOperations.put(storeName, {
            ...item,
            synced: true,
            synced_at: item.synced_at,
          });
        }
      } else {
        // Nouvel enregistrement du serveur
        await dbOperations.put(storeName, {
          ...item,
          synced: true,
          synced_at: item.synced_at,
        });
      }
    }
  }

  // Démarrer la synchronisation automatique
  startAutoSync(intervalMinutes = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Synchroniser immédiatement
    this.sync();

    // Puis toutes les X minutes
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMinutes * 60 * 1000);

    // Synchroniser lors du retour de connexion
    window.addEventListener('online', () => {
      console.log('Connexion rétablie - synchronisation...');
      this.sync();
    });
  }

  // Arrêter la synchronisation automatique
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Obtenir les statistiques de synchronisation
  async getSyncStats() {
    const db = await import('./db').then(m => m.default());
    
    // Compter les enregistrements non synchronisés
    const unsyncedClients = await dbOperations.getUnsyncedRecords('clients');
    const unsyncedPrestations = await dbOperations.getUnsyncedRecords('prestations');
    const unsyncedPassages = await dbOperations.getUnsyncedRecords('passages');
    const unsyncedPaiements = await dbOperations.getUnsyncedRecords('paiements');

    // Récupérer la file d'attente
    const tx = db.transaction('sync_queue', 'readonly');
    const queue = await tx.objectStore('sync_queue').getAll();
    await tx.done;

    // Récupérer les derniers logs
    const logsTx = db.transaction('sync_logs', 'readonly');
    const logsIndex = logsTx.objectStore('sync_logs').index('timestamp');
    const logs = await logsIndex.getAll();
    await logsTx.done;

    const recentLogs = logs.slice(-10).reverse();

    return {
      unsynced: {
        clients: unsyncedClients.length,
        prestations: unsyncedPrestations.length,
        passages: unsyncedPassages.length,
        paiements: unsyncedPaiements.length,
        total: unsyncedClients.length + unsyncedPrestations.length + 
               unsyncedPassages.length + unsyncedPaiements.length,
      },
      queueSize: queue.length,
      lastSync: localStorage.getItem('last_sync_timestamp'),
      recentLogs: recentLogs,
    };
  }
}

// Instance singleton
const syncService = new SyncService();

export default syncService;