import { useCallback } from 'react';
import { clientsAPI } from '../services/api';
import { 
  offlineClients, 
  syncQueue,
  offlinePassages,
  offlinePaiements,
  initDB  // ✅ AJOUTER cet import
} from '../services/offlineStorage';
import { networkManager } from '../services/networkManager';
import { syncService } from '../services/syncService';

export const useOfflineClient = () => {
  const isOnline = networkManager.getStatus();

  // ✅ CORRECTION : Créer un client avec synchronisation immédiate en ligne
  const createClient = useCallback(async (clientData) => {
    try {
      const dataToSend = {
        nom: clientData.nom?.trim(),
        prenom: clientData.prenom?.trim(),
      };
      
      if (clientData.telephone?.trim()) {
        dataToSend.telephone = clientData.telephone.trim();
      }

      let result;
      let offline = false;

      if (isOnline) {
        // MODE EN LIGNE : Créer sur le serveur
        try {
          console.log('🌐 Création client en ligne:', dataToSend);
          const response = await clientsAPI.create(dataToSend);
          
          if (response.data.success) {
            const serverClient = response.data.data;
            console.log('✅ Client créé sur serveur:', serverClient.id);
            
            // ✅ SIMPLE : Créer un client local avec les données du serveur
            const localClient = {
              ...serverClient,
              server_id: serverClient.id,
              synced: true,
              offline_created: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            // Ajouter à la base locale (sans ID pour que IndexedDB génère son propre ID)
            delete localClient.id;
            
            try {
              // ✅ CORRECTION : Utiliser initDB importé
              const db = await initDB();
              const tx = db.transaction('clients', 'readwrite');
              const store = tx.objectStore('clients');
              
              const localId = await store.add(localClient);
              await tx.done;
              
              console.log('📱 Client enregistré localement, ID local:', localId);
              
              // Récupérer le client complet
              const completeClient = await store.get(localId);
              
              result = {
                success: true,
                data: {
                  ...serverClient,
                  id: localId, // ID local pour l'affichage
                  local_id: localId,
                },
                offline: false,
              };
            } catch (localError) {
              console.warn('⚠️ Impossible d\'enregistrer localement:', localError);
              // Retourner quand même le client serveur
              result = {
                success: true,
                data: serverClient,
                offline: false,
                warning: 'Client non enregistré localement',
              };
            }
          }
        } catch (serverError) {
          console.error('❌ Erreur création serveur:', serverError);
          // Basculer en mode hors ligne
          offline = true;
        }
      } else {
        offline = true;
      }

      if (offline || !result) {
        // MODE HORS LIGNE : Créer localement
        console.log('📱 Création client hors ligne');
        const localResult = await offlineClients.create(dataToSend);
        
        result = {
          success: true,
          data: localResult,
          offline: true,
          message: 'Client créé hors ligne - sera synchronisé automatiquement',
        };
      }

      return result;
    } catch (error) {
      console.error('Erreur création client:', error);
      throw error;
    }
  }, [isOnline]);

  // ✅ CORRECTION : Récupérer tous les clients avec fusion intelligente
  const getAllClients = useCallback(async (filters = {}) => {
    try {
      const allClients = [];
      
      // Récupérer les clients locaux
      const localClients = await offlineClients.getAll();
      
      // Copier les clients locaux
      allClients.push(...localClients);

      if (isOnline) {
        try {
          // Récupérer les clients du serveur
          const response = await clientsAPI.getAll(filters);
          let serverClients = [];
          
          if (response.data.data?.data) {
            serverClients = response.data.data.data;
          } else if (response.data.data) {
            serverClients = response.data.data;
          }
          
          console.log(`🌐 ${serverClients.length} clients récupérés du serveur`);
          
          // ✅ FUSION INTELLIGENTE : Associer plutôt que dupliquer
          for (const serverClient of serverClients) {
            // Chercher par server_id d'abord
            const existingByServerId = allClients.find(c => c.server_id === serverClient.id);
            
            // Chercher par code_client ensuite
            const existingByCode = allClients.find(c => 
              c.code_client && c.code_client === serverClient.code_client
            );
            
            const existingClient = existingByServerId || existingByCode;
            
            if (!existingClient) {
              // Nouveau client serveur - l'ajouter localement
              const localClient = {
                ...serverClient,
                server_id: serverClient.id,
                synced: true,
                offline_created: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              
              delete localClient.id; // IndexedDB générera son propre ID
              
              try {
                // ✅ CORRECTION : Utiliser initDB importé
                const db = await initDB();
                const tx = db.transaction('clients', 'readwrite');
                const store = tx.objectStore('clients');
                const localId = await store.add(localClient);
                await tx.done;
                
                // Ajouter avec l'ID local
                allClients.push({ ...localClient, id: localId });
              } catch (addError) {
                console.warn('⚠️ Impossible d\'ajouter client serveur en local:', addError);
                allClients.push(serverClient);
              }
            } else {
              // Client existe - mettre à jour
              const updatedClient = {
                ...existingClient,
                ...serverClient,
                id: existingClient.id, // Garder l'ID local
                server_id: serverClient.id,
                synced: true,
                offline_created: false,
                updated_at: new Date().toISOString(),
              };
              
              // Mettre à jour dans IndexedDB
              try {
                // ✅ CORRECTION : Utiliser initDB importé
                const db = await initDB();
                const tx = db.transaction('clients', 'readwrite');
                await tx.objectStore('clients').put(updatedClient);
                await tx.done;
                
                // Remplacer dans la liste
                const index = allClients.findIndex(c => c.id === existingClient.id);
                if (index !== -1) {
                  allClients[index] = updatedClient;
                }
              } catch (updateError) {
                console.warn('⚠️ Impossible de mettre à jour client local:', updateError);
              }
            }
          }
          
          // Vérifier s'il y a des clients locaux non synchronisés
          const unsyncedClients = localClients.filter(c => !c.synced);
          if (unsyncedClients.length > 0) {
            console.log(`🔄 ${unsyncedClients.length} client(s) local(ux) à synchroniser`);
            
            // Synchroniser en arrière-plan
            setTimeout(() => {
              syncService.trySyncNow().catch(err => 
                console.log('ℹ️ Sync automatique échouée:', err)
              );
            }, 2000);
          }
        } catch (serverError) {
          console.warn('⚠️ Impossible de récupérer les clients serveur:', serverError);
          // Utiliser seulement les clients locaux
        }
      }
      
      // Trier par date de création décroissante
      allClients.sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      
      // ✅ Éliminer les doublons basés sur server_id
      const uniqueClients = [];
      const seenServerIds = new Set();
      
      for (const client of allClients) {
        const key = client.server_id || client.temp_id || client.id;
        if (!seenServerIds.has(key)) {
          seenServerIds.add(key);
          uniqueClients.push(client);
        }
      }
      
      return {
        success: true,
        data: uniqueClients,
        offline: !isOnline,
      };
    } catch (error) {
      console.error('Erreur récupération clients:', error);
      return {
        success: false,
        data: [],
        offline: !isOnline,
        error: error.message,
      };
    }
  }, [isOnline]);

  // Mettre à jour un client
  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      const dataToSend = {
        nom: clientData.nom?.trim(),
        prenom: clientData.prenom?.trim(),
      };
      
      if (clientData.telephone?.trim()) {
        dataToSend.telephone = clientData.telephone.trim();
      }

      let result;
      const localClient = await offlineClients.getById(clientId);
      
      if (!localClient) {
        throw new Error('Client non trouvé');
      }

      if (isOnline && localClient.server_id) {
        // MODE EN LIGNE : Mettre à jour sur le serveur
        try {
          const response = await clientsAPI.update(localClient.server_id, dataToSend);
          
          if (response.data.success) {
            const updatedServerClient = response.data.data;
            
            // Mettre à jour localement
            const updatedLocalClient = {
              ...localClient,
              ...updatedServerClient,
              id: localClient.id,
              server_id: updatedServerClient.id,
              synced: true,
              updated_at: new Date().toISOString(),
            };
            
            // ✅ CORRECTION : Utiliser initDB importé
            const db = await initDB();
            const tx = db.transaction('clients', 'readwrite');
            await tx.objectStore('clients').put(updatedLocalClient);
            await tx.done;
            
            result = {
              success: true,
              data: updatedLocalClient,
              offline: false,
            };
          }
        } catch (serverError) {
          console.error('❌ Erreur mise à jour serveur, tentative locale:', serverError);
          // Basculer en mode hors ligne
        }
      }

      if (!result) {
        // MODE HORS LIGNE : Mettre à jour localement seulement
        const updatedClient = await offlineClients.update(clientId, dataToSend);
        
        result = {
          success: true,
          data: updatedClient,
          offline: true,
          message: 'Modification enregistrée localement - sera synchronisée automatiquement',
        };
      }

      return result;
    } catch (error) {
      console.error('Erreur mise à jour client:', error);
      throw error;
    }
  }, [isOnline]);

  // ✅ CORRECTION : Supprimer un client (local + serveur)
  const deleteClient = useCallback(async (clientId) => {
    try {
      // Récupérer le client local
      const localClient = await offlineClients.getById(clientId);
      
      if (!localClient) {
        console.warn('⚠️ Client non trouvé en local, ID:', clientId);
        return {
          success: true,
          message: 'Client non trouvé en local',
          offline: !isOnline,
        };
      }
      
      let serverDeleted = false;
      let serverError = null;
      
      if (isOnline && localClient.server_id) {
        try {
          // Supprimer sur le serveur
          console.log(`🌐 Suppression client sur serveur:`, localClient.server_id);
          await clientsAPI.delete(localClient.server_id);
          serverDeleted = true;
        } catch (error) {
          console.error('❌ Erreur suppression serveur:', error);
          serverError = error;
          
          if (error.response?.status === 404) {
            console.log('ℹ️ Client déjà supprimé sur le serveur');
            serverDeleted = true;
          } else {
            // Marquer pour suppression hors ligne
            await syncQueue.add({
              type: 'client_delete',
              entity: 'clients',
              action: 'delete',
              server_id: localClient.server_id,
              local_id: clientId,
            });
          }
        }
      } else if (localClient.synced && localClient.server_id) {
        // Client synchronisé mais hors ligne - ajouter à la file
        await syncQueue.add({
          type: 'client_delete',
          entity: 'clients',
          action: 'delete',
          server_id: localClient.server_id,
          local_id: clientId,
        });
      }
      
      // Supprimer localement
      const deleteResult = await offlineClients.delete(clientId);
      
      return {
        success: true,
        data: deleteResult,
        offline: !serverDeleted,
        message: serverDeleted 
          ? 'Client supprimé du serveur et localement'
          : serverError
          ? 'Client supprimé localement - erreur serveur, sera retenté'
          : 'Client supprimé localement - sera supprimé du serveur lors de la synchronisation',
      };
    } catch (error) {
      console.error('Erreur suppression client:', error);
      throw error;
    }
  }, [isOnline]);

  // Rechercher des clients
  const searchClients = useCallback(async (query) => {
    try {
      const result = await offlineClients.search(query);
      
      return {
        success: true,
        data: result,
        offline: !isOnline,
      };
    } catch (error) {
      console.error('Erreur recherche client:', error);
      throw error;
    }
  }, [isOnline]);

  return {
    isOnline,
    createClient,
    getAllClients,
    updateClient,
    deleteClient,
    searchClients,
  };
};