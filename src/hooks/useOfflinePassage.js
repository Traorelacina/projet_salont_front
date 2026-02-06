// hooks/useOfflinePassage.js
// hooks/useOfflinePassage.js
import { useState, useEffect, useCallback } from 'react';
import { offlinePassages, offlineClients, offlinePaiements, offlinePrestations } from '../services/offlineStorage';
import { passagesAPI, paiementsAPI } from '../services/api';
import { networkManager } from '../services/networkManager';
import { syncService } from '../services/syncService';

export const useOfflinePassage = () => {
  const [isOnline, setIsOnline] = useState(networkManager.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = networkManager.subscribe((status) => {
      setIsOnline(status);
      
      if (status) {
        syncService.trySyncNow();
      }
    });

    return unsubscribe;
  }, []);

  // Valider les prestations
  const validatePrestations = async (prestations) => {
    if (!prestations || prestations.length === 0) {
      throw new Error('Au moins une prestation est requise');
    }

    const availablePrestations = await offlinePrestations.getAll();
    const availableIds = new Set(availablePrestations.map(p => p.id));

    for (const prestation of prestations) {
      if (!prestation.id && !prestation.prestation_id) {
        throw new Error('Chaque prestation doit avoir un ID');
      }

      const prestationId = prestation.id || prestation.prestation_id;

      if (!availableIds.has(prestationId)) {
        throw new Error(`La prestation ${prestationId} n'existe pas`);
      }

      if (!prestation.quantite || prestation.quantite < 1) {
        throw new Error('La quantité doit être au moins 1');
      }
      
      if (prestation.prix_unitaire === undefined || prestation.prix_unitaire < 0) {
        throw new Error('Le prix unitaire est invalide');
      }
    }

    return true;
  };

  // Créer un passage (en ligne ou hors ligne)
  const createPassage = useCallback(async (passageData) => {
    try {
      // Valider les prestations
      await validatePrestations(passageData.prestations);

      // Normaliser le format des prestations
      const normalizedPrestations = passageData.prestations.map(p => ({
        id: p.id || p.prestation_id,
        prestation_id: p.id || p.prestation_id,
        quantite: p.quantite,
        prix_unitaire: p.prix_unitaire,
        coiffeur_id: p.coiffeur_id || null,
      }));

      // ✅ CORRECTION : Normaliser aussi le paiement
      let normalizedPaiement = null;
      if (passageData.paiement && !passageData.est_gratuit) {
        normalizedPaiement = {
          // ✅ Utiliser 'montant_paye' au lieu de 'montant'
          montant_paye: passageData.paiement.montant || passageData.paiement.montant_paye,
          mode_paiement: passageData.paiement.mode_paiement,
          date_paiement: passageData.paiement.date_paiement || new Date().toISOString(),
          notes: passageData.paiement.notes || '',
        };
      }

      const normalizedPassageData = {
        ...passageData,
        prestations: normalizedPrestations,
        paiement: normalizedPaiement,
      };

      if (isOnline) {
        // Mode en ligne
        const response = await passagesAPI.create(normalizedPassageData);
        
        if (response.data.success) {
          const serverPassage = response.data.data;
          
          // Sauvegarder en local pour le cache
          await offlinePassages.create({
            ...serverPassage,
            synced: true,
            server_id: serverPassage.id,
          });
          
          // ✅ CORRECTION : Créer le paiement avec les bons champs
          if (normalizedPaiement) {
            try {
              const paiementResponse = await paiementsAPI.create({
                passage_id: serverPassage.id,
                montant_paye: normalizedPaiement.montant_paye,
                mode_paiement: normalizedPaiement.mode_paiement,
                date_paiement: normalizedPaiement.date_paiement,
                notes: normalizedPaiement.notes,
              });
              
              if (paiementResponse.data.success) {
                serverPassage.paiement = paiementResponse.data.data;
              }
            } catch (paiementError) {
              console.error('Erreur création paiement:', paiementError);
              // Ne pas bloquer si le paiement échoue, le passage est déjà créé
            }
          }
          
          return {
            success: true,
            data: serverPassage,
            offline: false,
          };
        }
      } else {
        // Mode hors ligne
        
        // Enrichir les prestations avec les données du cache
        const cachedPrestations = await offlinePrestations.getAll();
        const cachedPrestationsMap = new Map(cachedPrestations.map(p => [p.id, p]));

        const enrichedPrestations = normalizedPrestations.map(p => {
          const cachedPrestation = cachedPrestationsMap.get(p.id);
          return {
            ...p,
            libelle: cachedPrestation?.libelle || `Prestation ${p.id}`,
            prix: cachedPrestation?.prix || p.prix_unitaire,
          };
        });

        // Créer le passage localement
        const localPassage = await offlinePassages.create({
          ...normalizedPassageData,
          prestations: enrichedPrestations,
          paiement: null, // On attachera le paiement après
        });
        
        // Créer le paiement si nécessaire
        if (normalizedPaiement) {
          const localPaiement = await offlinePaiements.create({
            passage_id: localPassage.id,
            montant_total: normalizedPassageData.montant_total,
            montant_paye: normalizedPaiement.montant_paye,
            mode_paiement: normalizedPaiement.mode_paiement,
            date_paiement: normalizedPaiement.date_paiement,
            notes: normalizedPaiement.notes,
          });
          
          localPassage.paiement = localPaiement;
        }
        
        return {
          success: true,
          data: localPassage,
          offline: true,
          message: 'Passage créé hors ligne - sera synchronisé automatiquement',
        };
      }
    } catch (error) {
      console.error('Erreur création passage:', error);
      
      // Si erreur de validation, ne pas continuer
      if (error.message && error.message.includes('prestation')) {
        throw error;
      }

      // Fallback en mode hors ligne pour autres erreurs
      if (!isOnline || error.response?.status === 0) {
        try {
          await validatePrestations(passageData.prestations);

          const normalizedPrestations = passageData.prestations.map(p => ({
            id: p.id || p.prestation_id,
            prestation_id: p.id || p.prestation_id,
            quantite: p.quantite,
            prix_unitaire: p.prix_unitaire,
            coiffeur_id: p.coiffeur_id || null,
          }));

          // ✅ Normaliser le paiement
          let normalizedPaiement = null;
          if (passageData.paiement && !passageData.est_gratuit) {
            normalizedPaiement = {
              montant_paye: passageData.paiement.montant || passageData.paiement.montant_paye,
              mode_paiement: passageData.paiement.mode_paiement,
              date_paiement: passageData.paiement.date_paiement || new Date().toISOString(),
              notes: passageData.paiement.notes || '',
            };
          }

          const localPassage = await offlinePassages.create({
            ...passageData,
            prestations: normalizedPrestations,
            paiement: null,
          });
          
          if (normalizedPaiement) {
            const localPaiement = await offlinePaiements.create({
              passage_id: localPassage.id,
              montant_total: passageData.montant_total,
              montant_paye: normalizedPaiement.montant_paye,
              mode_paiement: normalizedPaiement.mode_paiement,
              date_paiement: normalizedPaiement.date_paiement,
              notes: normalizedPaiement.notes,
            });
            
            localPassage.paiement = localPaiement;
          }
          
          return {
            success: true,
            data: localPassage,
            offline: true,
            message: 'Passage créé hors ligne - sera synchronisé automatiquement',
          };
        } catch (offlineError) {
          console.error('Erreur création passage offline:', offlineError);
          throw offlineError;
        }
      }
      
      throw error;
    }
  }, [isOnline]);

  // Récupérer tous les passages
  const getAllPassages = useCallback(async (filters = {}) => {
    try {
      if (isOnline) {
        const response = await passagesAPI.getAll(filters);
        
        if (response.data.success) {
          return {
            success: true,
            data: response.data.data.data || response.data.data,
            offline: false,
          };
        }
      }
      
      const localPassages = await offlinePassages.getAll(filters);
      
      return {
        success: true,
        data: localPassages,
        offline: true,
      };
    } catch (error) {
      const localPassages = await offlinePassages.getAll(filters);
      
      return {
        success: true,
        data: localPassages,
        offline: true,
      };
    }
  }, [isOnline]);

  // Récupérer les passages d'un client
  const getPassagesByClient = useCallback(async (clientId) => {
    try {
      if (isOnline) {
        const response = await passagesAPI.byClient(clientId);
        
        if (response.data.success) {
          return {
            success: true,
            data: response.data.data,
            offline: false,
          };
        }
      }
      
      const localPassages = await offlinePassages.getByClientId(clientId);
      
      return {
        success: true,
        data: localPassages,
        offline: true,
      };
    } catch (error) {
      const localPassages = await offlinePassages.getByClientId(clientId);
      
      return {
        success: true,
        data: localPassages,
        offline: true,
      };
    }
  }, [isOnline]);

  // Récupérer un passage par ID
  const getPassageById = useCallback(async (id) => {
    try {
      if (isOnline) {
        const response = await passagesAPI.getOne(id);
        
        if (response.data.success) {
          return {
            success: true,
            data: response.data.data,
            offline: false,
          };
        }
      }
      
      const localPassage = await offlinePassages.getById(id);
      
      return {
        success: true,
        data: localPassage,
        offline: true,
      };
    } catch (error) {
      const localPassage = await offlinePassages.getById(id);
      
      return {
        success: localPassage != null,
        data: localPassage,
        offline: true,
      };
    }
  }, [isOnline]);

  // Mettre à jour un passage
  const updatePassage = useCallback(async (id, updates) => {
    try {
      if (isOnline) {
        const response = await passagesAPI.update(id, updates);
        
        if (response.data.success) {
          await offlinePassages.update(id, {
            ...updates,
            synced: true,
          });
          
          return {
            success: true,
            data: response.data.data,
            offline: false,
          };
        }
      } else {
        const updatedPassage = await offlinePassages.update(id, updates);
        
        return {
          success: true,
          data: updatedPassage,
          offline: true,
          message: 'Passage mis à jour hors ligne - sera synchronisé automatiquement',
        };
      }
    } catch (error) {
      const updatedPassage = await offlinePassages.update(id, updates);
      
      return {
        success: true,
        data: updatedPassage,
        offline: true,
        message: 'Passage mis à jour hors ligne - sera synchronisé automatiquement',
      };
    }
  }, [isOnline]);

  // Supprimer un passage
  const deletePassage = useCallback(async (id) => {
    try {
      if (isOnline) {
        const response = await passagesAPI.delete(id);
        
        if (response.data.success) {
          await offlinePassages.delete(id);
          
          return {
            success: true,
            offline: false,
          };
        }
      } else {
        await offlinePassages.delete(id);
        
        return {
          success: true,
          offline: true,
          message: 'Passage supprimé hors ligne - sera synchronisé automatiquement',
        };
      }
    } catch (error) {
      await offlinePassages.delete(id);
      
      return {
        success: true,
        offline: true,
        message: 'Passage supprimé hors ligne - sera synchronisé automatiquement',
      };
    }
  }, [isOnline]);

  // Vérifier la fidélité d'un client
  const checkFidelity = useCallback(async (clientId) => {
    try {
      if (isOnline) {
        const response = await passagesAPI.checkFidelity(clientId);
        
        if (response.data.success) {
          return response.data.data;
        }
      }
      
      // Mode hors ligne - calculer localement
      const client = await offlineClients.getById(clientId);
      const passages = await offlinePassages.getByClientId(clientId);
      
      if (!client) {
        throw new Error('Client non trouvé');
      }
      
      const nombrePassages = passages.length;
      const estGratuit = nombrePassages > 0 && nombrePassages % 10 === 0;
      const prochainGratuit = estGratuit ? 10 : (10 - (nombrePassages % 10));
      
      return {
        est_gratuit: estGratuit,
        nombre_passages: nombrePassages,
        prochain_gratuit: prochainGratuit,
        offline: true,
      };
    } catch (error) {
      console.error('Erreur vérification fidélité:', error);
      throw error;
    }
  }, [isOnline]);

  // Synchroniser manuellement
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return {
        success: false,
        message: 'Impossible de synchroniser - hors ligne',
      };
    }
    
    setIsSyncing(true);
    try {
      const result = await syncService.syncAll();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Obtenir le statut de synchronisation
  const getSyncStatus = useCallback(async () => {
    return await syncService.getSyncStatus();
  }, []);

  return {
    isOnline,
    isSyncing,
    createPassage,
    getAllPassages,
    getPassagesByClient,
    getPassageById,
    updatePassage,
    deletePassage,
    checkFidelity,
    syncNow,
    getSyncStatus,
  };
};

export default useOfflinePassage;