// services/syncService.js
// services/syncService.js
import { api, clientsAPI, passagesAPI, paiementsAPI } from './api';
import { 
  offlineClients, 
  offlinePassages, 
  offlinePaiements,
  syncQueue 
} from './offlineStorage';
import { networkManager } from './networkManager';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
    this.errorListeners = [];
  }

  onSyncStart(callback) {
    this.syncListeners.push(callback);
  }

  onSyncError(callback) {
    this.errorListeners.push(callback);
  }

  notifySyncStart() {
    this.syncListeners.forEach(callback => callback());
  }

  notifySyncError(error) {
    this.errorListeners.forEach(callback => callback(error));
  }

  async needsSync() {
    const count = await syncQueue.getCount();
    return count > 0;
  }

  // Synchroniser un client
  async syncClient(queueItem) {
    const { action, data, temp_id, local_id, server_id } = queueItem;

    try {
      if (action === 'create') {
        const localClient = await offlineClients.getById(local_id);
        
        if (!localClient) {
          throw new Error(`Client local non trouvé (ID: ${local_id})`);
        }

        let existingClientId = null;
        
        if (localClient.code_client) {
          try {
            const searchResponse = await clientsAPI.getAll({ 
              search: localClient.code_client 
            });
            
            const existing = searchResponse.data?.data?.data?.find(
              client => client.code_client === localClient.code_client
            );
            
            if (existing) {
              console.log('✅ Client existe déjà sur serveur (par code_client):', existing.id);
              existingClientId = existing.id;
            }
          } catch (searchError) {
            console.log('ℹ️ Recherche par code_client échouée:', searchError);
          }
        }
        
        if (existingClientId) {
          try {
            const serverResponse = await clientsAPI.getById(existingClientId);
            const serverClient = serverResponse.data.data;
            
            await offlineClients.update(local_id, {
              server_id: serverClient.id,
              synced: true,
              offline_created: false,
              code_client: serverClient.code_client,
              updated_at: new Date().toISOString(),
            });
            
            return {
              success: true,
              local_id,
              server_id: existingClientId,
              warning: 'Client existant détecté - associé à l\'enregistrement existant',
              message: 'Client associé à un enregistrement existant sur le serveur',
            };
          } catch (updateError) {
            console.error('❌ Erreur mise à jour client local:', updateError);
          }
        }
        
        if (!data.nom || !data.prenom) {
          throw new Error('Nom et prénom requis');
        }

        const clientData = {
          nom: data.nom.trim(),
          prenom: data.prenom.trim(),
        };

        if (data.telephone && data.telephone.trim()) {
          clientData.telephone = data.telephone.trim();
        }

        console.log('📤 Synchronisation client:', clientData);
        const response = await clientsAPI.create(clientData);

        if (response.data.success) {
          const serverClient = response.data.data;
          console.log('✅ Client synchronisé sur serveur:', serverClient.id);
          
          await offlineClients.update(local_id, {
            server_id: serverClient.id,
            synced: true,
            offline_created: false,
            code_client: serverClient.code_client,
            updated_at: new Date().toISOString(),
          });
          
          return {
            success: true,
            local_id,
            server_id: serverClient.id,
            message: 'Client synchronisé avec succès',
          };
        }
      } else if (action === 'update') {
        const response = await clientsAPI.update(server_id, {
          nom: data.nom?.trim(),
          prenom: data.prenom?.trim(),
          telephone: data.telephone?.trim() || null,
        });

        if (response.data.success) {
          await offlineClients.update(local_id, {
            synced: true,
            offline_created: false,
            updated_at: new Date().toISOString(),
          });
          
          return {
            success: true,
            message: 'Client mis à jour avec succès',
          };
        }
      } else if (action === 'delete') {
        console.log('🗑️ Synchronisation suppression client:', server_id);
        
        try {
          const response = await clientsAPI.delete(server_id);
          
          if (response.data.success) {
            console.log('✅ Client supprimé sur serveur:', server_id);
            return {
              success: true,
              message: response.data.message || 'Client supprimé avec succès',
            };
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.log('⚠️ Client déjà supprimé sur le serveur');
            return {
              success: true,
              message: 'Client déjà supprimé sur le serveur',
            };
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation client:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        
        if (errors?.telephone) {
          console.warn('⚠️ Téléphone dupliqué');
          
          try {
            const clientData = {
              nom: data.nom?.trim(),
              prenom: data.prenom?.trim(),
            };
            
            const response = await clientsAPI.create(clientData);
            
            if (response.data.success) {
              const serverClient = response.data.data;
              
              await offlineClients.update(local_id, {
                server_id: serverClient.id,
                synced: true,
                offline_created: false,
                code_client: serverClient.code_client,
                updated_at: new Date().toISOString(),
              });
              
              return {
                success: true,
                local_id,
                server_id: serverClient.id,
                warning: 'Téléphone dupliqué - créé sans téléphone',
                message: 'Client synchronisé sans téléphone (dupliqué détecté)',
              };
            }
          } catch (retryError) {
            console.error('❌ Échec même sans téléphone:', retryError);
          }
        }
      }
      
      throw error;
    }
  }

  // ✅ SIMPLIFICATION : Synchroniser un passage - le paiement est créé automatiquement par le serveur
  async syncPassage(queueItem) {
    const { action, data, temp_id, local_id, server_id } = queueItem;

    try {
      if (action === 'create') {
        if (!data.client_id) {
          console.error('❌ client_id manquant dans les données de passage:', data);
          throw new Error('client_id est requis pour créer un passage');
        }

        const localClient = await offlineClients.getById(data.client_id);
        
        if (!localClient) {
          console.error('❌ Client local non trouvé:', data.client_id);
          throw new Error(`Client local ${data.client_id} non trouvé`);
        }

        const clientServerId = localClient.server_id;
        
        if (!clientServerId) {
          throw new Error('Le client n\'a pas encore été synchronisé avec le serveur');
        }

        if (!data.prestations || data.prestations.length === 0) {
          throw new Error('Au moins une prestation est requise');
        }

        const normalizedPrestations = data.prestations.map(p => {
          const prestationId = p.id || p.prestation_id;
          
          if (!prestationId) {
            throw new Error('Chaque prestation doit avoir un ID');
          }

          return {
            id: prestationId,
            prestation_id: prestationId,
            quantite: p.quantite || 1,
            prix_unitaire: p.prix_unitaire || p.prix_applique || 0,
            coiffeur_id: p.coiffeur_id || null,
          };
        });

        const passageData = {
          client_id: clientServerId,
          date_passage: data.date_passage || new Date().toISOString(),
          est_gratuit: data.est_gratuit || false,
          montant_total: data.montant_total || 0,
          prestations: normalizedPrestations,
          notes: data.notes || '',
        };

        console.log('📤 Synchronisation passage:', passageData);
        const response = await passagesAPI.create(passageData);

        if (response.data.success) {
          const serverPassage = response.data.data;
          console.log('✅ Passage créé sur serveur:', serverPassage.id);
          
          await offlinePassages.markAsSynced(local_id, serverPassage.id);
          
          // ✅ IMPORTANT : Le serveur crée automatiquement le paiement lors de la création du passage
          // Pas besoin de synchroniser un paiement séparé
          console.log('✅ Paiement créé automatiquement par le serveur pour le passage:', serverPassage.id);
          
          // ✅ Marquer le paiement local comme synchronisé si il existe
          try {
            const localPaiement = await offlinePaiements.getByPassageId(local_id);
            if (localPaiement) {
              // Le paiement a été créé automatiquement par le serveur, on le marque comme synchronisé
              // On n'a pas besoin du server_id car le paiement est lié au passage
              await offlinePaiements.markAsSynced(localPaiement.id, null, true);
              console.log('✅ Paiement local marqué comme synchronisé');
            }
          } catch (e) {
            console.log('ℹ️ Pas de paiement local à synchroniser');
          }
          
          return {
            success: true,
            local_id,
            server_id: serverPassage.id,
            message: 'Passage synchronisé avec succès (paiement créé automatiquement)',
          };
        }
      } else if (action === 'update') {
        const response = await passagesAPI.update(server_id, {
          date_passage: data.date_passage,
          est_gratuit: data.est_gratuit,
          montant_total: data.montant_total,
          prestations: data.prestations,
          notes: data.notes,
        });

        if (response.data.success) {
          await offlinePassages.markAsSynced(local_id, server_id);
          
          return {
            success: true,
            message: 'Passage mis à jour avec succès',
          };
        }
      } else if (action === 'delete') {
        console.log('🗑️ Synchronisation suppression passage:', server_id);
        
        const response = await passagesAPI.delete(server_id);
        
        if (response.data.success) {
          console.log('✅ Passage supprimé sur serveur:', server_id);
          
          return {
            success: true,
            message: 'Passage supprimé avec succès',
          };
        }
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation passage:', error);
      
      if (action === 'delete' && error.response?.status === 404) {
        console.log('⚠️ Passage déjà supprimé sur le serveur');
        return {
          success: true,
          message: 'Passage déjà supprimé sur le serveur',
        };
      }
      
      throw error;
    }
  }

  // ✅ SUPPRESSION de syncPaiement - Les paiements sont créés automatiquement par le serveur
  async syncPaiement(queueItem) {
    const { action, data, temp_id, local_id, server_id } = queueItem;

    console.log(`ℹ️ Synchronisation paiement ignorée - les paiements sont créés automatiquement par le serveur`);
    
    // ✅ Marquer directement comme synchronisé car le paiement est créé automatiquement
    try {
      const localPaiement = await offlinePaiements.getById(local_id);
      if (localPaiement) {
        await offlinePaiements.markAsSynced(local_id, null, true);
        console.log(`✅ Paiement ${local_id} marqué comme synchronisé (créé automatiquement par le serveur)`);
      }
    } catch (error) {
      console.log(`ℹ️ Paiement ${local_id} non trouvé localement`);
    }
    
    return {
      success: true,
      local_id,
      server_id: null,
      message: 'Paiement synchronisé (créé automatiquement par le serveur lors de la création du passage)',
    };
  }

  // Synchroniser un élément de la file
  async syncQueueItem(queueItem) {
    const { entity, action } = queueItem;

    await syncQueue.markAsProcessing(queueItem.id);

    try {
      let result;

      switch (entity) {
        case 'clients':
          result = await this.syncClient(queueItem);
          break;
        case 'passages':
          result = await this.syncPassage(queueItem);
          break;
        case 'paiements':
          result = await this.syncPaiement(queueItem); // Simple marquage comme synchronisé
          break;
        default:
          throw new Error(`Type d'entité non supporté: ${entity}`);
      }

      await syncQueue.markAsSynced(queueItem.id);

      return result;
    } catch (error) {
      await syncQueue.markAsFailed(queueItem.id, error.message);
      throw error;
    }
  }

  // Synchroniser toutes les données en attente
  async syncAll() {
    if (this.isSyncing) {
      console.log('⏳ Synchronisation déjà en cours');
      return {
        success: false,
        message: 'Synchronisation déjà en cours',
      };
    }

    if (!networkManager.getStatus()) {
      console.log('📵 Impossible de synchroniser - hors ligne');
      return {
        success: false,
        message: 'Pas de connexion internet',
      };
    }

    this.isSyncing = true;
    this.notifySyncStart();

    const results = {
      success: [],
      failed: [],
      total: 0,
    };

    try {
      const pendingItems = await syncQueue.getPending();
      results.total = pendingItems.length;

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return {
          success: true,
          message: 'Aucune donnée à synchroniser',
          results,
        };
      }

      console.log(`🔄 Synchronisation de ${pendingItems.length} élément(s)...`);

      // Trier pour synchroniser les clients d'abord, puis les passages
      const sortedItems = pendingItems.sort((a, b) => {
        const entityOrder = { clients: 1, passages: 2, paiements: 3 };
        const entityDiff = (entityOrder[a.entity] || 999) - (entityOrder[b.entity] || 999);
        
        if (entityDiff !== 0) return entityDiff;
        
        const actionOrder = { create: 1, update: 2, delete: 3 };
        return (actionOrder[a.action] || 999) - (actionOrder[b.action] || 999);
      });

      // Synchroniser chaque élément
      for (const item of sortedItems) {
        try {
          console.log(`🔄 Sync ${item.entity} - ${item.action}...`);
          
          const result = await this.syncQueueItem(item);
          
          results.success.push({
            id: item.id,
            entity: item.entity,
            action: item.action,
            result,
          });
          
          console.log(`✅ Synchronisé: ${item.entity} - ${item.action}`);
        } catch (error) {
          results.failed.push({
            id: item.id,
            entity: item.entity,
            action: item.action,
            error: error.message,
            details: error.response?.data,
          });
          
          console.error(`❌ Échec: ${item.entity} - ${item.action}`, error);
          
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('🔐 Erreur d\'authentification - arrêt de la synchronisation');
            break;
          }
        }
      }

      this.isSyncing = false;

      return {
        success: true,
        message: `Synchronisation terminée: ${results.success.length} réussie(s), ${results.failed.length} échouée(s)`,
        results,
      };
    } catch (error) {
      this.isSyncing = false;
      this.notifySyncError(error);
      
      console.error('❌ Erreur lors de la synchronisation:', error);
      
      return {
        success: false,
        message: 'Erreur lors de la synchronisation',
        error: error.message,
        results,
      };
    }
  }

  // Synchronisation automatique périodique
  startAutoSync(intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    const autoSyncInterval = setInterval(async () => {
      if (networkManager.getStatus() && await this.needsSync()) {
        console.log('🔄 Auto-synchronisation déclenchée...');
        await this.syncAll();
      }
    }, intervalMs);

    return () => clearInterval(autoSyncInterval);
  }

  // Synchroniser immédiatement si possible
  async trySyncNow() {
    if (networkManager.getStatus() && !this.isSyncing) {
      return await this.syncAll();
    }
    return {
      success: false,
      message: this.isSyncing ? 'Synchronisation en cours' : 'Hors ligne',
    };
  }

  // Obtenir le statut de synchronisation
  async getSyncStatus() {
    const pendingCount = await syncQueue.getCount();
    
    return {
      isSyncing: this.isSyncing,
      pendingCount,
      isOnline: networkManager.getStatus(),
    };
  }
}

// Instance singleton
export const syncService = new SyncService();

export default syncService;