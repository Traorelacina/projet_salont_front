// services/offlineStorage.js

import { openDB } from 'idb';

const DB_NAME = 'salon_offline_db';
const DB_VERSION = 1;

// Initialiser la base de données IndexedDB
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Store pour les clients
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        clientStore.createIndex('code_client', 'code_client', { unique: false });
        clientStore.createIndex('telephone', 'telephone', { unique: false });
        clientStore.createIndex('temp_id', 'temp_id', { unique: false });
        clientStore.createIndex('synced', 'synced', { unique: false });
        clientStore.createIndex('server_id', 'server_id', { unique: false });
      }

      // Store pour les passages
      if (!db.objectStoreNames.contains('passages')) {
        const passageStore = db.createObjectStore('passages', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        passageStore.createIndex('client_id', 'client_id', { unique: false });
        passageStore.createIndex('temp_id', 'temp_id', { unique: false });
        passageStore.createIndex('synced', 'synced', { unique: false });
        passageStore.createIndex('date_passage', 'date_passage', { unique: false });
      }

      // Store pour les prestations (cache)
      if (!db.objectStoreNames.contains('prestations')) {
        const prestationStore = db.createObjectStore('prestations', { 
          keyPath: 'id' 
        });
        prestationStore.createIndex('actif', 'actif', { unique: false });
      }

      // Store pour les coiffeurs (cache)
      if (!db.objectStoreNames.contains('coiffeurs')) {
        db.createObjectStore('coiffeurs', { keyPath: 'id' });
      }

      // Store pour les paiements
      if (!db.objectStoreNames.contains('paiements')) {
        const paiementStore = db.createObjectStore('paiements', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        paiementStore.createIndex('passage_id', 'passage_id', { unique: false });
        paiementStore.createIndex('temp_id', 'temp_id', { unique: false });
        paiementStore.createIndex('synced', 'synced', { unique: false });
      }

      // Store pour la file d'attente de synchronisation
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('created_at', 'created_at', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    },
  });
};

// Générer un ID temporaire unique
const generateTempId = (prefix = 'temp') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ✅ NOUVEAU : Générer un numéro de reçu offline au format REC-YYYYMMDD-XXXXXX
const generateOfflineNumeroRecu = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Générer un ID unique de 6 caractères (alphanumérique majuscule)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uniqueId = '';
  for (let i = 0; i < 6; i++) {
    uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `REC-${year}${month}${day}-${uniqueId}`;
};

// Générer un code client hors ligne
const generateOfflineClientCode = async () => {
  const db = await initDB();
  const year = new Date().getFullYear().toString().slice(-2);
  
  const allClients = await db.getAll('clients');
  
  const codeNumbers = allClients
    .map(client => {
      if (client.code_client && client.code_client.match(/^C(\d{3})-\d{2}$/)) {
        return parseInt(client.code_client.match(/^C(\d{3})-\d{2}$/)[1]);
      }
      return 0;
    })
    .filter(num => num > 0);
  
  const maxNumber = codeNumbers.length > 0 ? Math.max(...codeNumbers) : 0;
  const nextNumber = maxNumber + 1;
  
  return `C${nextNumber.toString().padStart(3, '0')}-${year}`;
};

// Fonction helper pour ajouter à la file
const addToSyncQueue = async (item) => {
  await syncQueue.add(item);
};

// CLIENTS - Opérations hors ligne
export const offlineClients = {
  // Créer un client hors ligne
  async create(clientData) {
    try {
      const db = await initDB();
      
      const tempId = generateTempId('client');
      const codeClient = await generateOfflineClientCode();
      
      const client = {
        ...clientData,
        temp_id: tempId,
        code_client: codeClient,
        nombre_passages: 0,
        synced: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        offline_created: true,
      };
      
      delete client.id;
      
      const tx = db.transaction('clients', 'readwrite');
      const store = tx.objectStore('clients');
      const id = await store.add(client);
      await tx.done;
      
      await addToSyncQueue({
        type: 'client_create',
        entity: 'clients',
        action: 'create',
        data: client,
        temp_id: tempId,
        local_id: id,
      });
      
      return { ...client, id };
    } catch (error) {
      console.error('Erreur création client offline:', error);
      throw error;
    }
  },

  // Mettre à jour un client
  async update(id, updates) {
    try {
      const db = await initDB();
      
      const client = await db.get('clients', id);
      if (!client) throw new Error('Client non trouvé');
      
      const updatedClient = {
        ...client,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      // Si on ajoute un server_id, on marque comme synchronisé
      if (updates.server_id && !client.synced) {
        updatedClient.synced = true;
        updatedClient.offline_created = false;
      } else if (!updates.server_id) {
        // Si ce n'est pas une mise à jour de sync, marquer comme non synchronisé
        updatedClient.synced = false;
      }
      
      const tx = db.transaction('clients', 'readwrite');
      await tx.objectStore('clients').put(updatedClient);
      await tx.done;
      
      // Si le client était déjà synchronisé et on le met à jour (pas une sync)
      if (client.synced && !client.offline_created && !updates.server_id) {
        await addToSyncQueue({
          type: 'client_update',
          entity: 'clients',
          action: 'update',
          data: updatedClient,
          server_id: client.server_id || client.id,
          local_id: id,
        });
      }
      
      return updatedClient;
    } catch (error) {
      console.error('Erreur mise à jour client offline:', error);
      throw error;
    }
  },

  // Marquer comme synchronisé AVEC récupération du code client
  async markAsSynced(localId, serverId) {
    try {
      const db = await initDB();
      const client = await db.get('clients', localId);
      
      if (client) {
        // Récupérer les données du serveur pour avoir le code_client correct
        try {
          const { clientsAPI } = await import('./api');
          const response = await clientsAPI.getById(serverId);
          
          if (response.data.success) {
            const serverClient = response.data.data;
            client.code_client = serverClient.code_client;
            client.nom = serverClient.nom;
            client.prenom = serverClient.prenom;
            client.telephone = serverClient.telephone;
            client.nombre_passages = serverClient.nombre_passages || 0;
            client.derniere_visite = serverClient.derniere_visite;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de récupérer le code client du serveur:', error);
        }
        
        client.synced = true;
        client.server_id = serverId;
        client.offline_created = false;
        client.updated_at = new Date().toISOString();
        
        const tx = db.transaction('clients', 'readwrite');
        await tx.objectStore('clients').put(client);
        await tx.done;
      }
    } catch (error) {
      console.error('Erreur markAsSynced:', error);
      throw error;
    }
  },

  // Récupérer tous les clients
  async getAll() {
    const db = await initDB();
    return db.getAll('clients');
  },

  // Récupérer un client par ID
  async getById(id) {
    const db = await initDB();
    return db.get('clients', id);
  },

  // Récupérer un client par server_id
  async getByServerId(serverId) {
    const db = await initDB();
    const allClients = await db.getAll('clients');
    return allClients.find(c => c.server_id === serverId);
  },

  // Récupérer un client par temp_id
  async getByTempId(tempId) {
    const db = await initDB();
    const allClients = await db.getAll('clients');
    return allClients.find(c => c.temp_id === tempId);
  },

  // Supprimer un client avec transaction unique
  async delete(id) {
    try {
      const db = await initDB();
      
      // Récupérer le client (peut ne pas exister)
      const client = await db.get('clients', id);
      
      if (!client) {
        console.log('⚠️ Client non trouvé en local, ID:', id);
        
        return {
          success: true,
          client_id: id,
          passages_deleted: 0,
          paiements_deleted: 0,
          message: 'Client non trouvé en local (peut-être déjà supprimé ou jamais créé localement)',
          not_found: true,
        };
      }

      // Créer une seule transaction pour toutes les opérations
      const tx = db.transaction(['clients', 'passages', 'paiements'], 'readwrite');
      const clientsStore = tx.objectStore('clients');
      const passagesStore = tx.objectStore('passages');
      const paiementsStore = tx.objectStore('paiements');

      // Récupérer tous les passages du client AVANT de commencer les suppressions
      const passagesIndex = passagesStore.index('client_id');
      const clientPassages = await passagesIndex.getAll(id);
      const passagesIds = clientPassages.map(p => p.id);

      // Supprimer les paiements associés aux passages
      let paiementsDeleted = 0;
      for (const passageId of passagesIds) {
        const paiementsIndex = paiementsStore.index('passage_id');
        const paiementsToDelete = await paiementsIndex.getAll(passageId);
        
        for (const paiement of paiementsToDelete) {
          await paiementsStore.delete(paiement.id);
          paiementsDeleted++;
        }
      }

      // Supprimer les passages
      for (const passageId of passagesIds) {
        await passagesStore.delete(passageId);
      }

      // Supprimer le client
      await clientsStore.delete(id);
      
      // Attendre la fin de la transaction
      await tx.done;

      // Ajouter à la file de synchronisation si le client était synchronisé
      if (client.synced && client.server_id) {
        await addToSyncQueue({
          type: 'client_delete',
          entity: 'clients',
          action: 'delete',
          server_id: client.server_id,
          local_id: id,
        });
      }

      return {
        success: true,
        client_id: id,
        passages_deleted: clientPassages.length,
        paiements_deleted: paiementsDeleted,
        message: `Client supprimé avec ${clientPassages.length} passage(s) et ${paiementsDeleted} paiement(s) associé(s)`,
        not_found: false,
      };
    } catch (error) {
      console.error('Erreur suppression client offline:', error);
      throw error;
    }
  },

  // Rechercher des clients
  async search(query) {
    const db = await initDB();
    const allClients = await db.getAll('clients');
    
    if (!query) return allClients;
    
    const searchTerm = query.toLowerCase();
    return allClients.filter(client => {
      const fullName = `${client.prenom} ${client.nom}`.toLowerCase();
      const telephone = client.telephone?.toLowerCase() || '';
      const code = client.code_client?.toLowerCase() || '';
      
      return fullName.includes(searchTerm) || 
             telephone.includes(searchTerm) || 
             code.includes(searchTerm);
    });
  },
  
  // Synchroniser les clients depuis le serveur
  async syncFromServer(serverClients) {
    const db = await initDB();
    const tx = db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');
    
    for (const serverClient of serverClients) {
      const existingClients = await db.getAll('clients');
      const existingClient = existingClients.find(c => c.server_id === serverClient.id);
      
      if (existingClient) {
        const updatedClient = {
          ...existingClient,
          ...serverClient,
          id: existingClient.id,
          server_id: serverClient.id,
          synced: true,
          offline_created: false,
        };
        await store.put(updatedClient);
      } else {
        const newClient = {
          ...serverClient,
          server_id: serverClient.id,
          synced: true,
          offline_created: false,
        };
        delete newClient.id;
        await store.add(newClient);
      }
    }
    
    await tx.done;
  },
};

// PASSAGES - Opérations hors ligne
export const offlinePassages = {
  // Créer un passage hors ligne
  async create(passageData) {
    try {
      const db = await initDB();
      
      const tempId = generateTempId('passage');
      
      const passage = {
        ...passageData,
        temp_id: tempId,
        synced: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        offline_created: true,
      };
      
      delete passage.id;
      
      const tx = db.transaction(['passages', 'clients'], 'readwrite');
      const passagesStore = tx.objectStore('passages');
      const clientsStore = tx.objectStore('clients');
      
      const id = await passagesStore.add(passage);
      
      if (passageData.client_id) {
        const client = await clientsStore.get(passageData.client_id);
        if (client) {
          client.nombre_passages = (client.nombre_passages || 0) + 1;
          client.derniere_visite = passage.date_passage || new Date().toISOString();
          await clientsStore.put(client);
        }
      }
      
      await tx.done;
      
      await addToSyncQueue({
        type: 'passage_create',
        entity: 'passages',
        action: 'create',
        data: passage,
        temp_id: tempId,
        local_id: id,
      });
      
      return { ...passage, id };
    } catch (error) {
      console.error('Erreur création passage offline:', error);
      throw error;
    }
  },

  // Marquer un passage comme synchronisé
  async markAsSynced(localId, serverId = null, autoCreated = false) {
    const db = await initDB();
    
    try {
      const tx = db.transaction('paiements', 'readwrite');
      const store = tx.objectStore('paiements');
      
      const paiement = await store.get(localId);
      
      if (!paiement) {
        console.warn(`⚠️ Paiement ${localId} non trouvé pour marquage`);
        return null;
      }
      
      // Si le paiement a été créé automatiquement par le serveur,
      // on doit récupérer le paiement depuis le serveur pour obtenir son ID
      if (autoCreated && paiement.passage_id) {
        console.log(`🔍 Recherche du paiement serveur pour le passage ${paiement.passage_id}`);
        
        // Chercher le passage qui a le server_id
        const passageTx = db.transaction('passages', 'readonly');
        const passageStore = passageTx.objectStore('passages');
        const passage = await passageStore.get(paiement.passage_id);
        await passageTx.done;
        
        if (passage && passage.server_id) {
          // Le passage a été synchronisé, on peut maintenant récupérer le paiement du serveur
          try {
            const paiementsAPI = require('./api').paiementsAPI;
            const response = await paiementsAPI.getByPassage(passage.server_id);
            
            if (response.data && response.data.data) {
              const serverPaiement = Array.isArray(response.data.data) 
                ? response.data.data[0] 
                : response.data.data;
              
              if (serverPaiement && serverPaiement.id) {
                console.log(`✅ Paiement serveur trouvé: ID ${serverPaiement.id}`);
                serverId = serverPaiement.id;
              }
            }
          } catch (error) {
            console.warn('⚠️ Impossible de récupérer le paiement serveur:', error);
          }
        }
      }
      
      const updatedPaiement = {
        ...paiement,
        synced: true,
        offline_created: false,
        updated_at: new Date().toISOString(),
      };
      
      // Ajouter le server_id si disponible
      if (serverId) {
        updatedPaiement.server_id = serverId;
      }
      
      await store.put(updatedPaiement);
      await tx.done;
      
      console.log(`✅ Paiement ${localId} marqué comme synchronisé${serverId ? ` (server_id: ${serverId})` : ''}`);
      
      return updatedPaiement;
    } catch (error) {
      console.error(`❌ Erreur marquage paiement ${localId}:`, error);
      throw error;
    }
  },
  
  // Récupérer le paiement par passage_id
  async getByPassageId(passageId) {
    const db = await initDB();
    const tx = db.transaction('paiements', 'readonly');
    const store = tx.objectStore('paiements');
    const allPaiements = await store.getAll();
    await tx.done;
    
    return allPaiements.find(p => p.passage_id === passageId);
  },

  // Récupérer tous les passages
  async getAll(filters = {}) {
    const db = await initDB();
    let passages = await db.getAll('passages');
    
    const clients = await db.getAll('clients');
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    
    passages = passages.map(p => ({
      ...p,
      client: clientsMap.get(p.client_id),
    }));
    
    if (filters.client_id) {
      passages = passages.filter(p => p.client_id === filters.client_id);
    }
    
    if (filters.date_debut) {
      passages = passages.filter(p => p.date_passage >= filters.date_debut);
    }
    
    if (filters.date_fin) {
      passages = passages.filter(p => p.date_passage <= filters.date_fin);
    }
    
    passages.sort((a, b) => new Date(b.date_passage) - new Date(a.date_passage));
    
    return passages;
  },

  // Récupérer un passage par ID
  async getById(id) {
    const db = await initDB();
    const passage = await db.get('passages', id);
    
    if (passage && passage.client_id) {
      const client = await db.get('clients', passage.client_id);
      passage.client = client;
    }
    
    return passage;
  },

  // Récupérer passages d'un client
  async getByClientId(clientId) {
    const db = await initDB();
    const allPassages = await db.getAll('passages');
    const passages = allPassages.filter(p => p.client_id === clientId);
    
    return passages.sort((a, b) => new Date(b.date_passage) - new Date(a.date_passage));
  },

  // Mettre à jour un passage
  async update(id, updates) {
    try {
      const db = await initDB();
      const passage = await db.get('passages', id);
      
      if (!passage) throw new Error('Passage non trouvé');
      
      const updatedPassage = {
        ...passage,
        ...updates,
        updated_at: new Date().toISOString(),
        synced: false,
      };
      
      const tx = db.transaction('passages', 'readwrite');
      await tx.objectStore('passages').put(updatedPassage);
      await tx.done;
      
      if (passage.synced && !passage.offline_created) {
        await addToSyncQueue({
          type: 'passage_update',
          entity: 'passages',
          action: 'update',
          data: updatedPassage,
          server_id: passage.server_id || passage.id,
          local_id: id,
        });
      }
      
      return updatedPassage;
    } catch (error) {
      console.error('Erreur mise à jour passage offline:', error);
      throw error;
    }
  },

  // Supprimer un passage avec transaction unique
  async delete(id) {
    try {
      const db = await initDB();
      
      const passage = await db.get('passages', id);
      if (!passage) throw new Error('Passage non trouvé');
      
      // Transaction unique
      const tx = db.transaction(['passages', 'clients', 'paiements'], 'readwrite');
      const passagesStore = tx.objectStore('passages');
      const clientsStore = tx.objectStore('clients');
      const paiementsStore = tx.objectStore('paiements');
      
      // Supprimer les paiements associés
      const paiementsIndex = paiementsStore.index('passage_id');
      const paiements = await paiementsIndex.getAll(id);
      
      for (const paiement of paiements) {
        await paiementsStore.delete(paiement.id);
      }
      
      // Mettre à jour le client
      if (passage.client_id) {
        const client = await clientsStore.get(passage.client_id);
        if (client && client.nombre_passages > 0) {
          client.nombre_passages -= 1;
          await clientsStore.put(client);
        }
      }
      
      // Supprimer le passage
      await passagesStore.delete(id);
      
      await tx.done;
      
      if (passage.synced && !passage.offline_created) {
        await addToSyncQueue({
          type: 'passage_delete',
          entity: 'passages',
          action: 'delete',
          server_id: passage.server_id || passage.id,
          local_id: id,
        });
      }
      
      return {
        success: true,
        passage_id: id,
        paiements_deleted: paiements.length,
      };
    } catch (error) {
      console.error('Erreur suppression passage offline:', error);
      throw error;
    }
  },

  // Marquer comme synchronisé
  async markAsSynced(localId, serverId) {
    const db = await initDB();
    const passage = await db.get('passages', localId);
    
    if (passage) {
      passage.synced = true;
      passage.server_id = serverId;
      passage.offline_created = false;
      
      const tx = db.transaction('passages', 'readwrite');
      await tx.objectStore('passages').put(passage);
      await tx.done;
    }
  },
};

// PRESTATIONS - Cache local
export const offlinePrestations = {
  async cacheAll(prestations) {
    const db = await initDB();
    const tx = db.transaction('prestations', 'readwrite');
    const store = tx.objectStore('prestations');
    
    await store.clear();
    
    for (const prestation of prestations) {
      await store.put(prestation);
    }
    
    await tx.done;
  },

  async getAll() {
    const db = await initDB();
    return db.getAll('prestations');
  },

  async getActive() {
    const db = await initDB();
    const allPrestations = await db.getAll('prestations');
    return allPrestations.filter(p => p.actif === true || p.actif === 1);
  },
};

// COIFFEURS - Cache local
export const offlineCoiffeurs = {
  async cacheAll(coiffeurs) {
    const db = await initDB();
    const tx = db.transaction('coiffeurs', 'readwrite');
    const store = tx.objectStore('coiffeurs');
    
    await store.clear();
    
    for (const coiffeur of coiffeurs) {
      await store.put(coiffeur);
    }
    
    await tx.done;
  },

  async getAll() {
    const db = await initDB();
    return db.getAll('coiffeurs');
  },
};

// ✅ PAIEMENTS - Opérations hors ligne avec génération du numero_recu
export const offlinePaiements = {
  async create(paiementData) {
    try {
      const db = await initDB();
      
      const tempId = generateTempId('paiement');
      // ✅ Générer le numéro de reçu offline
      const numeroRecu = generateOfflineNumeroRecu();
      
      const paiement = {
        ...paiementData,
        temp_id: tempId,
        numero_recu: numeroRecu, // ✅ AJOUT du numéro de reçu
        synced: false,
        created_at: new Date().toISOString(),
        offline_created: true,
      };
      
      delete paiement.id;
      
      const tx = db.transaction('paiements', 'readwrite');
      const id = await tx.objectStore('paiements').add(paiement);
      await tx.done;
      
      await addToSyncQueue({
        type: 'paiement_create',
        entity: 'paiements',
        action: 'create',
        data: paiement,
        temp_id: tempId,
        local_id: id,
      });
      
      console.log(`✅ Paiement créé hors ligne avec numéro de reçu: ${numeroRecu}`);
      
      return { ...paiement, id };
    } catch (error) {
      console.error('Erreur création paiement offline:', error);
      throw error;
    }
  },

  async getByPassageId(passageId) {
    const db = await initDB();
    const paiementsIndex = await db.transaction('paiements').objectStore('paiements').index('passage_id');
    const paiements = await paiementsIndex.getAll(passageId);
    return paiements.length > 0 ? paiements[0] : null;
  },

  async markAsSynced(localId, serverId) {
    const db = await initDB();
    const paiement = await db.get('paiements', localId);
    
    if (paiement) {
      // ✅ Récupérer le numero_recu du serveur si disponible
      try {
        const { paiementsAPI } = await import('./api');
        const response = await paiementsAPI.getOne(serverId);
        
        if (response.data.success && response.data.data.numero_recu) {
          paiement.numero_recu = response.data.data.numero_recu;
          console.log(`✅ Numéro de reçu mis à jour depuis le serveur: ${paiement.numero_recu}`);
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer le numéro de reçu du serveur:', error);
      }
      
      paiement.synced = true;
      paiement.server_id = serverId;
      paiement.offline_created = false;
      
      const tx = db.transaction('paiements', 'readwrite');
      await tx.objectStore('paiements').put(paiement);
      await tx.done;
    }
  },
  
  async getById(id) {
    const db = await initDB();
    return db.get('paiements', id);
  },
};

// FILE DE SYNCHRONISATION
export const syncQueue = {
  async add(item) {
    try {
      const db = await initDB();
      
      const queueItem = {
        ...item,
        created_at: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        last_attempt: null,
        error: null,
      };
      
      const tx = db.transaction('sync_queue', 'readwrite');
      await tx.objectStore('sync_queue').add(queueItem);
      await tx.done;
    } catch (error) {
      console.error('Erreur ajout à la file de sync:', error);
    }
  },

  async getPending() {
    const db = await initDB();
    const allItems = await db.getAll('sync_queue');
    return allItems.filter(item => item.status === 'pending');
  },

  async markAsProcessing(id) {
    const db = await initDB();
    const item = await db.get('sync_queue', id);
    
    if (item) {
      item.status = 'processing';
      item.last_attempt = new Date().toISOString();
      item.attempts += 1;
      
      const tx = db.transaction('sync_queue', 'readwrite');
      await tx.objectStore('sync_queue').put(item);
      await tx.done;
    }
  },

  async markAsSynced(id) {
    const db = await initDB();
    await db.delete('sync_queue', id);
  },

  async markAsFailed(id, error) {
    const db = await initDB();
    const item = await db.get('sync_queue', id);
    
    if (item) {
      item.status = item.attempts >= 3 ? 'failed' : 'pending';
      item.error = error;
      
      const tx = db.transaction('sync_queue', 'readwrite');
      await tx.objectStore('sync_queue').put(item);
      await tx.done;
    }
  },

  async getCount() {
    const pending = await this.getPending();
    return pending.length;
  },

  async clear() {
    const db = await initDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    await tx.objectStore('sync_queue').clear();
    await tx.done;
  },
};

// Nettoyer les données synchronisées
export const cleanupSyncedData = async (daysToKeep = 30) => {
  const db = await initDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const clients = await db.getAll('clients');
  const passages = await db.getAll('passages');
  
  const tx = db.transaction(['clients', 'passages'], 'readwrite');
  const clientsStore = tx.objectStore('clients');
  const passagesStore = tx.objectStore('passages');
  
  for (const client of clients) {
    if (client.synced && new Date(client.updated_at) < cutoffDate) {
      await clientsStore.delete(client.id);
    }
  }
  
  for (const passage of passages) {
    if (passage.synced && new Date(passage.updated_at) < cutoffDate) {
      await passagesStore.delete(passage.id);
    }
  }
  
  await tx.done;
};

// Statistiques hors ligne
export const getOfflineStats = async () => {
  const db = await initDB();
  
  const clients = await db.getAll('clients');
  const passages = await db.getAll('passages');
  const pending = await syncQueue.getPending();
  
  return {
    total_clients: clients.length,
    clients_non_synced: clients.filter(c => !c.synced).length,
    total_passages: passages.length,
    passages_non_synced: passages.filter(p => !p.synced).length,
    pending_sync: pending.length,
  };
};