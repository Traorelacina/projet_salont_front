import { dbOperations } from './db';
import syncService from './syncservice';
import { paiementsAPI } from './api';

// Wrapper offline-first pour l'API paiements
export const offlinePaiementsAPI = {
  // Récupérer tous les paiements
  async getAll(params = {}) {
    try {
      let localPaiements = await dbOperations.getAll('paiements');

      // Filtrer par date
      if (params.date) {
        localPaiements = localPaiements.filter(p => {
          const paiementDate = new Date(p.date_paiement).toISOString().split('T')[0];
          return paiementDate === params.date;
        });
      }

      // Filtrer par période
      if (params.date_debut && params.date_fin) {
        localPaiements = localPaiements.filter(p => {
          const paiementDate = new Date(p.date_paiement);
          return paiementDate >= new Date(params.date_debut) && 
                 paiementDate <= new Date(params.date_fin);
        });
      }

      // Filtrer par statut
      if (params.statut) {
        localPaiements = localPaiements.filter(p => p.statut === params.statut);
      }

      // Trier par date (plus récents en premier)
      localPaiements.sort((a, b) => 
        new Date(b.date_paiement) - new Date(a.date_paiement)
      );

      // Charger les relations (passage avec client et prestations)
      const paiementsWithRelations = await Promise.all(
        localPaiements.map(async (paiement) => {
          const passage = await dbOperations.get('passages', paiement.passage_id);
          let client = null;
          
          if (passage) {
            client = await dbOperations.get('clients', passage.client_id);
          }

          return {
            ...paiement,
            passage: passage ? {
              ...passage,
              client,
              prestations: passage.prestations || [],
            } : null,
          };
        })
      );

      // Si en ligne, essayer de synchroniser
      if (navigator.onLine) {
        try {
          const response = await paiementsAPI.getAll(params);
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
          data: paiementsWithRelations,
          total: paiementsWithRelations.length,
        },
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  },

  // Récupérer un paiement par ID
  async getOne(id) {
    try {
      const localPaiement = await dbOperations.get('paiements', id);
      
      if (!localPaiement) {
        throw new Error('Paiement introuvable');
      }

      // Charger les relations
      const passage = await dbOperations.get('passages', localPaiement.passage_id);
      let client = null;

      if (passage) {
        client = await dbOperations.get('clients', passage.client_id);
      }

      const paiementWithRelations = {
        ...localPaiement,
        passage: passage ? {
          ...passage,
          client,
          prestations: passage.prestations || [],
        } : null,
      };

      if (navigator.onLine) {
        try {
          const serverId = localPaiement.server_id || id;
          const response = await paiementsAPI.getOne(serverId);
          if (response.data.success) {
            await dbOperations.put('paiements', {
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
        data: paiementWithRelations,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du paiement:', error);
      throw error;
    }
  },

  // Créer un nouveau paiement
  async create(data) {
    try {
      const passage = await dbOperations.get('passages', data.passage_id);
      if (!passage) {
        throw new Error('Passage introuvable');
      }

      // Vérifier si un paiement existe déjà pour ce passage
      const existingPaiements = await dbOperations.getAllByIndex('paiements', 'passage_id', data.passage_id);
      if (existingPaiements.length > 0) {
        throw new Error('Un paiement existe déjà pour ce passage');
      }

      // Générer un numéro de reçu
      const allPaiements = await dbOperations.getAll('paiements');
      const numeroRecu = `REC-${Date.now()}-${allPaiements.length + 1}`;

      // Créer le paiement localement
      const localId = await dbOperations.put('paiements', {
        passage_id: data.passage_id,
        montant_total: passage.montant_total || 0,
        montant_paye: data.montant_paye,
        mode_paiement: data.mode_paiement,
        statut: 'valide',
        notes: data.notes || null,
        date_paiement: data.date_paiement || new Date().toISOString(),
        numero_recu: numeroRecu,
        created_at: new Date().toISOString(),
      });

      // Ajouter à la file de synchronisation
      await syncService.addToSyncQueue('paiements', 'create', {
        passage_id: passage.server_id || data.passage_id,
        montant_paye: data.montant_paye,
        mode_paiement: data.mode_paiement,
        notes: data.notes,
        date_paiement: data.date_paiement,
      }, localId);

      // Si en ligne, essayer de créer sur le serveur
      if (navigator.onLine) {
        try {
          const response = await paiementsAPI.create({
            passage_id: passage.server_id || data.passage_id,
            montant_paye: data.montant_paye,
            mode_paiement: data.mode_paiement,
            notes: data.notes,
            date_paiement: data.date_paiement,
          });
          
          if (response.data.success) {
            await dbOperations.markAsSynced('paiements', localId, response.data.data.id);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, paiement créé localement', error);
        }
      }

      // Retourner la version locale avec relations
      const paiement = await dbOperations.get('paiements', localId);
      const client = await dbOperations.get('clients', passage.client_id);

      return {
        success: true,
        data: {
          ...paiement,
          passage: {
            ...passage,
            client,
            prestations: passage.prestations || [],
          },
        },
        offline: true,
        message: 'Paiement enregistré localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      throw error;
    }
  },

  // Mettre à jour un paiement
  async update(id, data) {
    try {
      const paiement = await dbOperations.get('paiements', id);
      if (!paiement) {
        throw new Error('Paiement introuvable');
      }

      const updatedPaiement = {
        ...paiement,
        ...data,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await dbOperations.put('paiements', updatedPaiement);

      // Ajouter à la file de synchronisation
      const serverId = paiement.server_id || id;
      await syncService.addToSyncQueue('paiements', 'update', {
        server_id: serverId,
        ...data,
      }, id);

      // Si en ligne, essayer de mettre à jour sur le serveur
      if (navigator.onLine) {
        try {
          const response = await paiementsAPI.update(serverId, data);
          if (response.data.success) {
            await dbOperations.markAsSynced('paiements', id, serverId);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, mise à jour locale', error);
        }
      }

      return {
        success: true,
        data: updatedPaiement,
        offline: true,
        message: 'Paiement mis à jour localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      throw error;
    }
  },

  // Obtenir les données du reçu
  async getReceiptData(id) {
    try {
      const paiement = await dbOperations.get('paiements', id);
      if (!paiement) {
        throw new Error('Paiement introuvable');
      }

      const passage = await dbOperations.get('passages', paiement.passage_id);
      if (!passage) {
        throw new Error('Passage introuvable');
      }

      const client = await dbOperations.get('clients', passage.client_id);

      const receiptData = {
        numero_recu: paiement.numero_recu,
        date: new Date(paiement.date_paiement).toLocaleString('fr-FR'),
        client: {
          nom_complet: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
          telephone: client?.telephone || '',
        },
        prestations: (passage.prestations || []).map(p => ({
          libelle: p.libelle,
          quantite: p.quantite,
          prix_unitaire: p.prix_applique,
          prix_total: p.prix_applique * p.quantite,
        })),
        montant_total: paiement.montant_total,
        montant_paye: paiement.montant_paye,
        mode_paiement: paiement.mode_paiement,
        est_gratuit: passage.est_gratuit,
        numero_passage: passage.numero_passage,
        salon: {
          nom: 'Salon de Coiffure', // À configurer
          adresse: 'Abidjan, Côte d\'Ivoire',
          telephone: '+225 00 00 00 00',
        },
      };

      if (navigator.onLine && paiement.server_id) {
        try {
          const response = await paiementsAPI.getReceiptData(paiement.server_id);
          if (response.data.success) {
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, utilisation des données locales', error);
        }
      }

      return {
        success: true,
        data: receiptData,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données du reçu:', error);
      throw error;
    }
  },

  // Générer le reçu PDF (nécessite connexion serveur)
  async getReceipt(id) {
    if (!navigator.onLine) {
      throw new Error('La génération de PDF nécessite une connexion internet');
    }

    try {
      const paiement = await dbOperations.get('paiements', id);
      if (!paiement) {
        throw new Error('Paiement introuvable');
      }

      const serverId = paiement.server_id || id;
      return await paiementsAPI.getReceipt(serverId);
    } catch (error) {
      console.error('Erreur lors de la génération du reçu PDF:', error);
      throw error;
    }
  },

  // Annuler un paiement
  async cancel(id) {
    try {
      const paiement = await dbOperations.get('paiements', id);
      if (!paiement) {
        throw new Error('Paiement introuvable');
      }

      if (paiement.statut === 'annule') {
        throw new Error('Ce paiement est déjà annulé');
      }

      const updatedPaiement = {
        ...paiement,
        statut: 'annule',
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await dbOperations.put('paiements', updatedPaiement);

      // Ajouter à la file de synchronisation
      if (paiement.server_id) {
        await syncService.addToSyncQueue('paiements', 'update', {
          server_id: paiement.server_id,
          statut: 'annule',
        }, id);
      }

      // Si en ligne, essayer d'annuler sur le serveur
      if (navigator.onLine && paiement.server_id) {
        try {
          const response = await paiementsAPI.cancel(paiement.server_id);
          if (response.data.success) {
            await dbOperations.markAsSynced('paiements', id, paiement.server_id);
            return response.data;
          }
        } catch (error) {
          console.warn('Erreur serveur, annulation locale', error);
        }
      }

      return {
        success: true,
        data: updatedPaiement,
        offline: true,
        message: 'Paiement annulé localement, en attente de synchronisation',
      };
    } catch (error) {
      console.error('Erreur lors de l\'annulation du paiement:', error);
      throw error;
    }
  },
};

export default offlinePaiementsAPI;