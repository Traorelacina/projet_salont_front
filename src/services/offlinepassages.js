import { dbOperations } from './db';
import syncService from './syncservice';
import { passagesAPI } from './api';

// Wrapper offline-first pour l'API passages
export const offlinePassagesAPI = {
  // Récupérer tous les passages
  async getAll(params = {}) {
    try {
      let localPassages = await dbOperations.getAll('passages');

      // Filtrer par client
      if (params.client_id) {
        localPassages = localPassages.filter(p => p.client_id === params.client_id);
      }

      // Filtrer par date
      if (params.date) {
        localPassages = localPassages.filter(p => {
          const passageDate = new Date(p.date_passage).toISOString().split('T')[0];
          return passageDate === params.date;
        });
      }

      // Filtrer par période
      if (params.date_debut && params.date_fin) {
        localPassages = localPassages.filter(p => {
          const passageDate = new Date(p.date_passage);
          return passageDate >= new Date(params.date_debut) && 
                 passageDate <= new Date(params.date_fin);
        });
      }

      // Filtrer les passages gratuits
      if (params.gratuit !== undefined) {
        localPassages = localPassages.filter(p => p.est_gratuit === params.gratuit);
      }

      // Trier par date (plus récents en premier)
      localPassages.sort((a, b) => 
        new Date(b.date_passage) - new Date(a.date_passage)
      );

      // Charger les relations (client, prestations, paiement)
      const passagesWithRelations = await Promise.all(
        localPassages.map(async (passage) => {
          const client = await dbOperations.get('clients', passage.client_id);
          const paiements = await dbOperations.getAllByIndex('paiements', 'passage_id', passage.id);
          const paiement = paiements[0] || null;

          return {
            ...passage,
            client,
            paiement,
            prestations: passage.prestations || [],
          };
        })
      );

      // Si en ligne, essayer de synchroniser
      if (navigator.onLine) {
        try {
          const response = await passagesAPI.getAll(params);
          if (response.data.success) {
            // Mettre à jour IndexedDB (simplifié)
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation des données locales', error);
        }
      }

      return {
        success: true,
        data: {
          data: passagesWithRelations,
          total: passagesWithRelations.length,
        },
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des passages:', error);
      throw error;
    }
  },

  // Récupérer un passage par ID
  async getOne(id) {
    try {
      const localPassage = await dbOperations.get('passages', id);
      
      if (!localPassage) {
        throw new Error('Passage introuvable');
      }

      // Charger les relations
      const client = await dbOperations.get('clients', localPassage.client_id);
      const paiements = await dbOperations.getAllByIndex('paiements', 'passage_id', id);
      const paiement = paiements[0] || null;

      const passageWithRelations = {
        ...localPassage,
        client,
        paiement,
        prestations: localPassage.prestations || [],
      };

      if (navigator.onLine) {
        try {
          const serverId = localPassage.server_id || id;
          const response = await passagesAPI.getOne(serverId);
          if (response.data.success) {
            await dbOperations.put('passages', {
              ...response.data.data,
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
        data: passageWithRelations,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du passage:', error);
      throw error;
    }
  },

  // Créer un nouveau passage
  async create(data) {
    try {
      const client = await dbOperations.get('clients', data.client_id);
      if (!client) {
        throw new Error('Client introuvable');
      }

      // Calculer le numéro de passage et vérifier si gratuit
      const clientPassages = await dbOperations.getAllByIndex('passages', 'client_id', data.client_id);
      const numeroPassage = clientPassages.length + 1;
      const passageGratuit = 10; // Configurable
      const estGratuit = numeroPassage % passageGratuit === 0;

      // Calculer le montant total
      let montantTotal = 0;
      const prestationsDetails = [];

      for (const prest of data.prestations) {
        const prestation = await dbOperations.get('prestations', prest.id);
        if (prestation) {
          const quantite = prest.quantite || 1;
          montantTotal += prestation.prix * quantite;
          prestationsDetails.push({
            id: prestation.id,
            libelle: prestation.libelle,
            prix_applique: prestation.prix,
            quantite: quantite,
          });
        }
      }

      // Créer le passage localement
      const localId = await dbOperations.put('passages', {
        client_id: data.client_id,
        numero_passage: numeroPassage,
        est_gratuit: estGratuit,
        notes: data.notes || null,
        date_passage: data.date_passage || new Date().toISOString(),
        prestations: prestationsDetails,
        montant_total: estGratuit ? 0 : montantTotal,
        montant_theorique: montantTotal,
        created_at: new Date().toISOString(),
      });

      // Mettre à jour le compteur du client
      await dbOperations.put('clients', {
        ...client,
        nombre_passages: clientPassages.length + 1,
        updated_at: new Date().toISOString(),
        synced: false,
      });

      // Ajouter à la file de synchronisation
      await syncService.addToSyncQueue('passages', 'create', {
        client_id: client.server_id || data.client_id,
        prestations: data.prestations.map(p => ({
          id: p.id,
          quantite: p.quantite || 1,
        })),
        notes: data.notes,
        date_passage: data.date_passage,
      }, localId);

      // Si en ligne, essayer de créer sur le serveur
      if (navigator.onLine) {
        try {
          const response = await passagesAPI.create({
            client_id: client.server_id || data.client_id,
            prestations: data.prestations,
            notes: data.notes,
            date_passage: data.date_passage,
          });
          
          if (response.data.success) {
            await dbOperations.markAsSynced('passages', localId, response.data.data.passage.id);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, passage créé localement', error);
        }
      }

      // Retourner la version locale avec relations
      const passage = await dbOperations.get('passages', localId);
      return {
        success: true,
        data: {
          passage: {
            ...passage,
            client,
            prestations: prestationsDetails,
          },
          est_gratuit: estGratuit,
          montant_total: estGratuit ? 0 : montantTotal,
          montant_theorique: montantTotal,
        },
        offline: true,
        message: 'Passage créé localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la création du passage:', error);
      throw error;
    }
  },

  // Mettre à jour un passage
  async update(id, data) {
    try {
      const passage = await dbOperations.get('passages', id);
      if (!passage) {
        throw new Error('Passage introuvable');
      }

      const updatedPassage = {
        ...passage,
        ...data,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await dbOperations.put('passages', updatedPassage);

      // Ajouter à la file de synchronisation
      const serverId = passage.server_id || id;
      await syncService.addToSyncQueue('passages', 'update', {
        server_id: serverId,
        ...data,
      }, id);

      // Si en ligne, essayer de mettre à jour sur le serveur
      if (navigator.onLine) {
        try {
          const response = await passagesAPI.update(serverId, data);
          if (response.data.success) {
            await dbOperations.markAsSynced('passages', id, serverId);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, mise à jour locale', error);
        }
      }

      return {
        success: true,
        data: updatedPassage,
        offline: true,
        message: 'Passage mis à jour localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du passage:', error);
      throw error;
    }
  },

  // Supprimer un passage
  async delete(id) {
    try {
      const passage = await dbOperations.get('passages', id);
      if (!passage) {
        throw new Error('Passage introuvable');
      }

      // Supprimer localement
      await dbOperations.delete('passages', id);

      // Mettre à jour le compteur du client
      const client = await dbOperations.get('clients', passage.client_id);
      if (client && client.nombre_passages > 0) {
        await dbOperations.put('clients', {
          ...client,
          nombre_passages: client.nombre_passages - 1,
          updated_at: new Date().toISOString(),
          synced: false,
        });
      }

      // Si le passage a un server_id, ajouter à la file de synchronisation
      if (passage.server_id) {
        await syncService.addToSyncQueue('passages', 'delete', {
          server_id: passage.server_id,
        }, id);
      }

      // Si en ligne, essayer de supprimer sur le serveur
      if (navigator.onLine && passage.server_id) {
        try {
          const response = await passagesAPI.delete(passage.server_id);
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
        message: 'Passage supprimé localement',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du passage:', error);
      throw error;
    }
  },

  // Récupérer les passages d'un client
  async getByClient(clientId) {
    try {
      const passages = await dbOperations.getAllByIndex('passages', 'client_id', clientId);

      // Charger les relations
      const passagesWithRelations = await Promise.all(
        passages.map(async (passage) => {
          const paiements = await dbOperations.getAllByIndex('paiements', 'passage_id', passage.id);
          const paiement = paiements[0] || null;

          return {
            ...passage,
            paiement,
            prestations: passage.prestations || [],
          };
        })
      );

      // Trier par date (plus récents en premier)
      passagesWithRelations.sort((a, b) => 
        new Date(b.date_passage) - new Date(a.date_passage)
      );

      if (navigator.onLine) {
        try {
          const client = await dbOperations.get('clients', clientId);
          const serverId = client?.server_id || clientId;
          const response = await passagesAPI.getByClient(serverId);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation des données locales', error);
        }
      }

      return {
        success: true,
        data: {
          data: passagesWithRelations,
          total: passagesWithRelations.length,
        },
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des passages du client:', error);
      throw error;
    }
  },

  // Vérifier si le prochain passage est gratuit
  async checkFidelity(clientId) {
    try {
      const client = await dbOperations.get('clients', clientId);
      if (!client) {
        throw new Error('Client introuvable');
      }

      const prochainNumero = client.nombre_passages + 1;
      const passageGratuit = 10; // Configurable
      const estGratuit = prochainNumero % passageGratuit === 0;
      const passagesRestants = estGratuit ? 0 : (passageGratuit - (prochainNumero % passageGratuit));

      const fidelityInfo = {
        client_id: client.id,
        nom_complet: `${client.prenom} ${client.nom}`,
        nombre_passages_actuel: client.nombre_passages,
        prochain_numero: prochainNumero,
        est_gratuit: estGratuit,
        passages_restants: passagesRestants,
      };

      if (navigator.onLine && client.server_id) {
        try {
          const response = await passagesAPI.checkFidelity(client.server_id);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, calcul local de la fidélité', error);
        }
      }

      return {
        success: true,
        data: fidelityInfo,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la fidélité:', error);
      throw error;
    }
  },
};

export default offlinePassagesAPI;