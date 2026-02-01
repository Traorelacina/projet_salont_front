import { dbOperations } from './db';
import syncService from './syncService';
import { clientsAPI } from './api';

// Wrapper offline-first pour l'API clients
export const offlineClientsAPI = {
  // Récupérer tous les clients (d'abord local, puis serveur si en ligne)
  async getAll(params = {}) {
    try {
      // Toujours retourner les données locales en premier
      const localClients = await dbOperations.getAll('clients');
      
      // Si en ligne, essayer de synchroniser
      if (navigator.onLine) {
        try {
          const response = await clientsAPI.getAll(params);
          if (response.data.success) {
            // Mettre à jour IndexedDB avec les données du serveur
            for (const client of response.data.data.data || response.data.data) {
              await dbOperations.put('clients', {
                ...client,
                synced: true,
                synced_at: new Date().toISOString(),
              });
            }
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur lors de la récupération serveur, utilisation des données locales', error);
        }
      }

      // Retourner les données locales
      return {
        success: true,
        data: localClients,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Récupérer un client par ID
  async getOne(id) {
    try {
      // Chercher d'abord en local
      const localClient = await dbOperations.get('clients', id);
      
      if (navigator.onLine) {
        try {
          const serverId = localClient?.server_id || id;
          const response = await clientsAPI.getOne(serverId);
          if (response.data.success) {
            // Mettre à jour local
            await dbOperations.put('clients', {
              ...response.data.data.client,
              synced: true,
              synced_at: new Date().toISOString(),
            });
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation des données locales', error);
        }
      }

      return {
        success: true,
        data: { client: localClient },
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
      throw error;
    }
  },

  // Créer un nouveau client
  async create(data) {
    try {
      // Créer localement d'abord
      const localId = await dbOperations.put('clients', {
        ...data,
        nombre_passages: 0,
        created_at: new Date().toISOString(),
      });

      // Ajouter à la file de synchronisation
      await syncService.addToSyncQueue('clients', 'create', data, localId);

      // Si en ligne, essayer de créer sur le serveur immédiatement
      if (navigator.onLine) {
        try {
          const response = await clientsAPI.create(data);
          if (response.data.success) {
            // Mettre à jour avec l'ID serveur
            await dbOperations.markAsSynced('clients', localId, response.data.data.id);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, client créé localement en attente de sync', error);
        }
      }

      // Retourner la version locale
      const client = await dbOperations.get('clients', localId);
      return {
        success: true,
        data: client,
        offline: true,
        message: 'Client créé localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },

  // Mettre à jour un client
  async update(id, data) {
    try {
      // Mettre à jour localement
      const client = await dbOperations.get('clients', id);
      if (!client) {
        throw new Error('Client introuvable');
      }

      const updatedClient = {
        ...client,
        ...data,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await dbOperations.put('clients', updatedClient);

      // Ajouter à la file de synchronisation
      const serverId = client.server_id || id;
      await syncService.addToSyncQueue('clients', 'update', {
        server_id: serverId,
        ...data,
      }, id);

      // Si en ligne, essayer de mettre à jour sur le serveur
      if (navigator.onLine) {
        try {
          const response = await clientsAPI.update(serverId, data);
          if (response.data.success) {
            await dbOperations.markAsSynced('clients', id, serverId);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, mise à jour locale en attente de sync', error);
        }
      }

      return {
        success: true,
        data: updatedClient,
        offline: true,
        message: 'Client mis à jour localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  },

  // Supprimer un client
  async delete(id) {
    try {
      const client = await dbOperations.get('clients', id);
      if (!client) {
        throw new Error('Client introuvable');
      }

      // Supprimer localement
      await dbOperations.delete('clients', id);

      // Si le client a un server_id, ajouter à la file de synchronisation
      if (client.server_id) {
        await syncService.addToSyncQueue('clients', 'delete', {
          server_id: client.server_id,
        }, id);
      }

      // Si en ligne, essayer de supprimer sur le serveur
      if (navigator.onLine && client.server_id) {
        try {
          const response = await clientsAPI.delete(client.server_id);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, suppression locale en attente de sync', error);
        }
      }

      return {
        success: true,
        offline: !navigator.onLine,
        message: 'Client supprimé localement',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      throw error;
    }
  },

  // Rechercher un client par téléphone
  async searchByPhone(phone) {
    try {
      const allClients = await dbOperations.getAll('clients');
      const localResults = allClients.filter(client => 
        client.telephone && client.telephone.includes(phone)
      );

      if (navigator.onLine) {
        try {
          const response = await clientsAPI.searchByPhone(phone);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation des résultats locaux', error);
        }
      }

      return {
        success: true,
        data: localResults,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  },

  // Obtenir l'historique d'un client
  async getHistory(id, params = {}) {
    try {
      const client = await dbOperations.get('clients', id);
      if (!client) {
        throw new Error('Client introuvable');
      }

      // Récupérer les passages locaux du client
      const passages = await dbOperations.getAllByIndex('passages', 'client_id', id);

      // Récupérer les prestations et paiements pour chaque passage
      const passagesWithDetails = await Promise.all(
        passages.map(async (passage) => {
          // Récupérer le paiement
          const paiements = await dbOperations.getAllByIndex('paiements', 'passage_id', passage.id);
          const paiement = paiements[0] || null;

          return {
            ...passage,
            paiement,
          };
        })
      );

      if (navigator.onLine && client.server_id) {
        try {
          const response = await clientsAPI.getHistory(client.server_id, params);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation de l\'historique local', error);
        }
      }

      return {
        success: true,
        data: {
          client,
          passages: {
            data: passagesWithDetails.sort((a, b) => 
              new Date(b.date_passage) - new Date(a.date_passage)
            ),
          },
        },
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  },
};

export default offlineClientsAPI;