// hooks/useOfflinePassage.js
import { useState, useEffect, useCallback } from 'react';
import { offlinePassages, offlineClients, offlinePaiements, offlinePrestations, initDB } from '../services/offlineStorage';
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

  // ✅ CORRECTION PRINCIPALE : Créer un passage en utilisant server_id pour le client
  const createPassage = useCallback(async (passageData) => {
    try {
      // Valider les prestations
      await validatePrestations(passageData.prestations);

      // ✅ ÉTAPE 1 : Récupérer le client local pour avoir son server_id
      const localClient = await offlineClients.getById(passageData.client_id);
      
      if (!localClient) {
        throw new Error(`Client ${passageData.client_id} non trouvé`);
      }

      // Normaliser le format des prestations
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

      if (isOnline) {
        // ✅ ÉTAPE 2 : En mode en ligne, utiliser le server_id du client
        const clientServerId = localClient.server_id || localClient.id;
        
        // Si le client n'a pas de server_id, il faut le synchroniser d'abord
        if (!localClient.server_id && localClient.offline_created) {
          throw new Error('Le client doit être synchronisé avant de créer un passage en ligne. Veuillez patienter ou vérifier votre connexion.');
        }

        const normalizedPassageData = {
          ...passageData,
          client_id: clientServerId, // ✅ Utiliser le server_id
          prestations: normalizedPrestations,
          paiement: normalizedPaiement,
        };

        console.log('📤 Création passage en ligne:', normalizedPassageData);
        
        // Mode en ligne - envoyer au serveur
        const response = await passagesAPI.create(normalizedPassageData);
        
        console.log('📥 Réponse serveur complète:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
          // ✅ IMPORTANT : Le serveur retourne les données dans response.data.data.passage
          const responseData = response.data.data;
          const serverPassage = responseData.passage || responseData.data || responseData;
          
          console.log('📦 Données passage serveur:', JSON.stringify(serverPassage, null, 2));
          console.log('🔑 ID du passage:', serverPassage?.id);
          
          // ✅ Vérifier que serverPassage.id existe
          if (!serverPassage || !serverPassage.id) {
            console.error('❌ Réponse serveur invalide - ID manquant');
            console.error('Structure complète de la réponse:', response.data);
            throw new Error('Le serveur n\'a pas retourné d\'ID pour le passage créé');
          }
          
          // ✅ Enrichir serverPassage avec les données de responseData
          const enrichedServerPassage = {
            ...serverPassage,
            est_gratuit: responseData.est_gratuit || serverPassage.est_gratuit || false,
            montant_total: responseData.montant_total || serverPassage.montant_total || 0,
            montant_theorique: responseData.montant_theorique,
          };
          
          console.log('✅ Passage enrichi créé sur serveur:', enrichedServerPassage.id);
          
          // ✅ ÉTAPE 1 : Enrichir les prestations AVANT d'ouvrir la transaction
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

          // ✅ ÉTAPE 2 : Préparer les données AVANT d'ouvrir la transaction
          const localPassageData = {
            server_id: enrichedServerPassage.id,
            client_id: localClient.id, // ✅ ID local du client
            date_passage: enrichedServerPassage.date_passage || new Date().toISOString(),
            est_gratuit: enrichedServerPassage.est_gratuit || false,
            montant_total: enrichedServerPassage.montant_total || 0,
            notes: enrichedServerPassage.notes || '',
            prestations: enrichedPrestations, // ✅ IMPORTANT : Inclure les prestations enrichies
            synced: true,
            offline_created: false,
            created_at: enrichedServerPassage.created_at || new Date().toISOString(),
            updated_at: enrichedServerPassage.updated_at || new Date().toISOString(),
          };

          // ✅ ÉTAPE 3 : Ouvrir la transaction et faire TOUTES les opérations de manière synchrone
          const db = await initDB();
          const tx = db.transaction(['passages', 'clients'], 'readwrite');
          const passagesStore = tx.objectStore('passages');
          const clientsStore = tx.objectStore('clients');
          
          // Ajouter le passage (sans temp_id car déjà synchronisé)
          const localId = await passagesStore.add(localPassageData);
          
          // Mettre à jour le nombre de passages du client
          const clientToUpdate = await clientsStore.get(localClient.id);
          if (clientToUpdate) {
            clientToUpdate.nombre_passages = (clientToUpdate.nombre_passages || 0) + 1;
            clientToUpdate.derniere_visite = localPassageData.date_passage;
            await clientsStore.put(clientToUpdate);
          }
          
          await tx.done;
          
          console.log('✅ Passage sauvegardé en local (ID local:', localId, ', ID serveur:', enrichedServerPassage.id, ')');
          
          // ✅ Créer le paiement avec les bons champs
          if (normalizedPaiement) {
            try {
              console.log('📤 Création paiement en ligne...');
              
              const paiementResponse = await paiementsAPI.create({
                passage_id: enrichedServerPassage.id,
                montant_paye: normalizedPaiement.montant_paye,
                mode_paiement: normalizedPaiement.mode_paiement,
                date_paiement: normalizedPaiement.date_paiement,
                notes: normalizedPaiement.notes,
              });
              
              if (paiementResponse.data.success) {
                const serverPaiement = paiementResponse.data.data;
                enrichedServerPassage.paiement = serverPaiement;
                
                console.log('✅ Paiement créé sur serveur:', serverPaiement.id);
                
                // ✅ Préparer les données du paiement AVANT d'ouvrir la transaction
                const localPaiementData = {
                  server_id: serverPaiement.id,
                  passage_id: localId, // ✅ ID local du passage
                  montant_total: normalizedPaiement.montant_paye,
                  montant_paye: normalizedPaiement.montant_paye,
                  mode_paiement: normalizedPaiement.mode_paiement,
                  date_paiement: normalizedPaiement.date_paiement,
                  notes: normalizedPaiement.notes,
                  synced: true,
                  offline_created: false,
                  created_at: serverPaiement.created_at || new Date().toISOString(),
                };

                // ✅ Sauvegarder le paiement en local - nouvelle transaction
                const txPaiement = db.transaction('paiements', 'readwrite');
                const paiementsStore = txPaiement.objectStore('paiements');
                await paiementsStore.add(localPaiementData);
                await txPaiement.done;
                
                console.log('✅ Paiement sauvegardé en local');
              }
            } catch (paiementError) {
              console.error('❌ Erreur création paiement:', paiementError);
              // Ne pas bloquer si le paiement échoue, le passage est déjà créé
            }
          }
          
          // ✅ Enrichir serverPassage avec les infos locales pour l'affichage
          enrichedServerPassage.client = localClient;
          enrichedServerPassage.local_id = localId;
          
          return {
            success: true,
            data: enrichedServerPassage,
            offline: false,
          };
        }
      } else {
        // Mode hors ligne
        console.log('📵 Création passage en mode hors ligne');
        
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
          ...passageData,
          client_id: localClient.id, // ✅ Utiliser l'ID local
          prestations: enrichedPrestations,
          paiement: null, // On attachera le paiement après
        });
        
        // Créer le paiement si nécessaire
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
        
        console.log('✅ Passage créé en mode hors ligne (ID local:', localPassage.id, ')');
        
        return {
          success: true,
          data: localPassage,
          offline: true,
          message: 'Passage créé hors ligne - sera synchronisé automatiquement',
        };
      }
    } catch (error) {
      console.error('❌ Erreur création passage:', error);
      
      // Si erreur de validation, ne pas continuer
      if (error.message && error.message.includes('prestation')) {
        throw error;
      }

      // Si erreur liée au client non synchronisé
      if (error.message && error.message.includes('synchronisé')) {
        throw error;
      }

      // Fallback en mode hors ligne pour autres erreurs
      if (!isOnline || error.response?.status === 0) {
        try {
          console.log('⚠️ Erreur en ligne, basculement en mode hors ligne');
          
          await validatePrestations(passageData.prestations);

          const localClient = await offlineClients.getById(passageData.client_id);
          
          if (!localClient) {
            throw new Error(`Client ${passageData.client_id} non trouvé`);
          }

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

          // Enrichir les prestations
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

          const localPassage = await offlinePassages.create({
            ...passageData,
            client_id: localClient.id,
            prestations: enrichedPrestations,
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

  // ✅ CORRECTION : Vérifier la fidélité avec le server_id
  const checkFidelity = useCallback(async (clientId) => {
    try {
      // ✅ ÉTAPE 1 : Récupérer le client local pour avoir le server_id
      const localClient = await offlineClients.getById(clientId);
      
      if (!localClient) {
        throw new Error('Client non trouvé');
      }

      if (isOnline) {
        // ✅ ÉTAPE 2 : Utiliser le server_id si disponible, sinon l'id local
        const serverClientId = localClient.server_id || localClient.id;
        
        try {
          const response = await passagesAPI.checkFidelity(serverClientId);
          
          if (response.data.success) {
            return response.data.data;
          }
        } catch (error) {
          // Si erreur 404, calculer localement
          if (error.response?.status === 404) {
            console.warn('⚠️ Client non trouvé sur serveur, calcul local de fidélité');
          } else {
            throw error;
          }
        }
      }
      
      // Mode hors ligne OU fallback - calculer localement
      const passages = await offlinePassages.getByClientId(clientId);
      
      const nombrePassages = passages.length;
      const estGratuit = nombrePassages > 0 && nombrePassages % 10 === 0;
      const prochainGratuit = estGratuit ? 10 : (10 - (nombrePassages % 10));
      
      return {
        est_gratuit: estGratuit,
        nombre_passages: nombrePassages,
        prochain_gratuit: prochainGratuit,
        offline: !isOnline,
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