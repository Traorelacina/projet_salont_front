import { openDB } from 'idb';

const DB_NAME = 'salon_db';
const DB_VERSION = 1;

// Initialisation de la base de données IndexedDB
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Store pour les clients
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        clientStore.createIndex('telephone', 'telephone', { unique: false });
        clientStore.createIndex('synced', 'synced', { unique: false });
        clientStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Store pour les prestations
      if (!db.objectStoreNames.contains('prestations')) {
        const prestationStore = db.createObjectStore('prestations', { keyPath: 'id', autoIncrement: true });
        clientStore.createIndex('actif', 'actif', { unique: false });
        prestationStore.createIndex('synced', 'synced', { unique: false });
        prestationStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Store pour les passages
      if (!db.objectStoreNames.contains('passages')) {
        const passageStore = db.createObjectStore('passages', { keyPath: 'id', autoIncrement: true });
        passageStore.createIndex('client_id', 'client_id', { unique: false });
        passageStore.createIndex('date_passage', 'date_passage', { unique: false });
        passageStore.createIndex('synced', 'synced', { unique: false });
        passageStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Store pour les paiements
      if (!db.objectStoreNames.contains('paiements')) {
        const paiementStore = db.createObjectStore('paiements', { keyPath: 'id', autoIncrement: true });
        paiementStore.createIndex('passage_id', 'passage_id', { unique: false });
        paiementStore.createIndex('date_paiement', 'date_paiement', { unique: false });
        paiementStore.createIndex('synced', 'synced', { unique: false });
        paiementStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Store pour les opérations en attente de synchronisation
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('entity_type', 'entity_type', { unique: false });
        syncStore.createIndex('action', 'action', { unique: false });
        syncStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Store pour les logs de synchronisation
      if (!db.objectStoreNames.contains('sync_logs')) {
        const logStore = db.createObjectStore('sync_logs', { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
        logStore.createIndex('status', 'status', { unique: false });
      }
    },
  });
};

// Fonctions utilitaires pour IndexedDB
export const dbOperations = {
  // Ajouter ou mettre à jour un enregistrement
  async put(storeName, data) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    const record = {
      ...data,
      updated_at: new Date().toISOString(),
      synced: false,
    };
    
    const id = await store.put(record);
    await tx.done;
    return id;
  },

  // Récupérer un enregistrement par ID
  async get(storeName, id) {
    const db = await initDB();
    return db.get(storeName, id);
  },

  // Récupérer tous les enregistrements
  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },

  // Récupérer les enregistrements par index
  async getAllByIndex(storeName, indexName, value) {
    const db = await initDB();
    return db.getAllFromIndex(storeName, indexName, value);
  },

  // Supprimer un enregistrement
  async delete(storeName, id) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(id);
    await tx.done;
  },

  // Récupérer les enregistrements non synchronisés
  async getUnsyncedRecords(storeName) {
    const db = await initDB();
    return db.getAllFromIndex(storeName, 'synced', false);
  },

  // Marquer un enregistrement comme synchronisé
  async markAsSynced(storeName, id, serverId = null) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    const record = await store.get(id);
    if (record) {
      record.synced = true;
      record.synced_at = new Date().toISOString();
      if (serverId) {
        record.server_id = serverId;
      }
      await store.put(record);
    }
    await tx.done;
  },

  // Nettoyer les anciens logs (garder les 1000 derniers)
  async cleanOldLogs() {
    const db = await initDB();
    const tx = db.transaction('sync_logs', 'readwrite');
    const store = tx.objectStore('sync_logs');
    const index = store.index('timestamp');
    
    const allLogs = await index.getAll();
    if (allLogs.length > 1000) {
      const toDelete = allLogs.slice(0, allLogs.length - 1000);
      for (const log of toDelete) {
        await store.delete(log.id);
      }
    }
    await tx.done;
  },
};

export default initDB;