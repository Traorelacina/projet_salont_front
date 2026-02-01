import { dbOperations } from './db';
import syncService from './syncservice';
import { prestationsAPI } from './api';

// Wrapper offline-first pour l'API prestations
export const offlinePrestationsAPI = {
  // Récupérer toutes les prestations
  async getAll(params = {}) {
    try {
      let localPrestations = await dbOperations.getAll('prestations');

      // Filtrer par statut actif si demandé
      if (params.actif !== undefined) {
        localPrestations = localPrestations.filter(p => p.actif === params.actif);
      }

      // Trier par ordre si demandé
      if (params.ordered) {
        localPrestations.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      } else {
        localPrestations.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      }

      // Si en ligne, essayer de synchroniser
      if (navigator.onLine) {
        try {
          const response = await prestationsAPI.getAll(params);
          if (response.data.success) {
            // Mettre à jour IndexedDB
            for (const prestation of response.data.data) {
              await dbOperations.put('prestations', {
                ...prestation,
                synced: true,
                synced_at: new Date().toISOString(),
              });
            }
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation des données locales', error);
        }
      }

      return {
        success: true,
        data: localPrestations,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des prestations:', error);
      throw error;
    }
  },

  // Récupérer une prestation par ID
  async getOne(id) {
    try {
      const localPrestation = await dbOperations.get('prestations', id);

      if (navigator.onLine) {
        try {
          const serverId = localPrestation?.server_id || id;
          const response = await prestationsAPI.getOne(serverId);
          if (response.data.success) {
            await dbOperations.put('prestations', {
              ...response.data.data.prestation,
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
        data: { prestation: localPrestation },
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la prestation:', error);
      throw error;
    }
  },

  // Créer une nouvelle prestation
  async create(data) {
    try {
      // Créer localement
      const localId = await dbOperations.put('prestations', {
        ...data,
        actif: data.actif !== undefined ? data.actif : true,
        ordre: data.ordre || 0,
        created_at: new Date().toISOString(),
      });

      // Ajouter à la file de synchronisation
      await syncService.addToSyncQueue('prestations', 'create', data, localId);

      // Si en ligne, essayer de créer sur le serveur
      if (navigator.onLine) {
        try {
          const response = await prestationsAPI.create(data);
          if (response.data.success) {
            await dbOperations.markAsSynced('prestations', localId, response.data.data.id);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, prestation créée localement', error);
        }
      }

      const prestation = await dbOperations.get('prestations', localId);
      return {
        success: true,
        data: prestation,
        offline: true,
        message: 'Prestation créée localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la création de la prestation:', error);
      throw error;
    }
  },

  // Mettre à jour une prestation
  async update(id, data) {
    try {
      const prestation = await dbOperations.get('prestations', id);
      if (!prestation) {
        throw new Error('Prestation introuvable');
      }

      const updatedPrestation = {
        ...prestation,
        ...data,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await dbOperations.put('prestations', updatedPrestation);

      // Ajouter à la file de synchronisation
      const serverId = prestation.server_id || id;
      await syncService.addToSyncQueue('prestations', 'update', {
        server_id: serverId,
        ...data,
      }, id);

      // Si en ligne, essayer de mettre à jour sur le serveur
      if (navigator.onLine) {
        try {
          const response = await prestationsAPI.update(serverId, data);
          if (response.data.success) {
            await dbOperations.markAsSynced('prestations', id, serverId);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, mise à jour locale', error);
        }
      }

      return {
        success: true,
        data: updatedPrestation,
        offline: true,
        message: 'Prestation mise à jour localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la prestation:', error);
      throw error;
    }
  },

  // Supprimer une prestation
  async delete(id) {
    try {
      const prestation = await dbOperations.get('prestations', id);
      if (!prestation) {
        throw new Error('Prestation introuvable');
      }

      // Supprimer localement
      await dbOperations.delete('prestations', id);

      // Si la prestation a un server_id, ajouter à la file de synchronisation
      if (prestation.server_id) {
        await syncService.addToSyncQueue('prestations', 'delete', {
          server_id: prestation.server_id,
        }, id);
      }

      // Si en ligne, essayer de supprimer sur le serveur
      if (navigator.onLine && prestation.server_id) {
        try {
          const response = await prestationsAPI.delete(prestation.server_id);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, suppression locale', error);
        }
      }

      return {
        success: true,
        offline: !navigator.onLine,
        message: 'Prestation supprimée localement',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de la prestation:', error);
      throw error;
    }
  },

  // Activer/Désactiver une prestation
  async toggleActive(id) {
    try {
      const prestation = await dbOperations.get('prestations', id);
      if (!prestation) {
        throw new Error('Prestation introuvable');
      }

      const updatedPrestation = {
        ...prestation,
        actif: !prestation.actif,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await dbOperations.put('prestations', updatedPrestation);

      // Ajouter à la file de synchronisation
      const serverId = prestation.server_id || id;
      await syncService.addToSyncQueue('prestations', 'update', {
        server_id: serverId,
        actif: updatedPrestation.actif,
      }, id);

      // Si en ligne, essayer de basculer sur le serveur
      if (navigator.onLine && prestation.server_id) {
        try {
          const response = await prestationsAPI.toggleActive(prestation.server_id);
          if (response.data.success) {
            await dbOperations.markAsSynced('prestations', id, serverId);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, modification locale', error);
        }
      }

      return {
        success: true,
        data: updatedPrestation,
        offline: true,
        message: prestation.actif ? 'Prestation désactivée localement' : 'Prestation activée localement',
      };
    } catch (error) {
      console.error('Erreur lors du basculement de la prestation:', error);
      throw error;
    }
  },

  // Obtenir les prestations populaires
  async getPopular() {
    try {
      // Pour les statistiques, on privilégie les données serveur
      if (navigator.onLine) {
        try {
          const response = await prestationsAPI.getPopular();
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur pour les prestations populaires', error);
        }
      }

      // Fallback : calculer localement (simplifié)
      const prestations = await dbOperations.getAll('prestations');
      const passages = await dbOperations.getAll('passages');

      // Compter les utilisations (simplifié, sans les relations many-to-many)
      const prestationCounts = {};
      
      prestations.forEach(p => {
        prestationCounts[p.id] = {
          ...p,
          passages_count: 0,
        };
      });

      const sorted = Object.values(prestationCounts)
        .sort((a, b) => b.passages_count - a.passages_count)
        .slice(0, 10);

      return {
        success: true,
        data: sorted,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des prestations populaires:', error);
      throw error;
    }
  },
};

export default offlinePrestationsAPI;