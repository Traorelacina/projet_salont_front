import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableHead, 
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
  Snackbar,
  Fade,
  Zoom,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Receipt, 
  Cancel, 
  Download, 
  Print, 
  Visibility,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  CloudOff,
  CloudDone,
  WifiOff,
  Close,
  CreditCard,
  Phone,
  AccountBalance,
  AttachMoney,
  MoreHoriz,
  CleaningServices,
  DeleteSweep,
} from '@mui/icons-material';
import { paiementsAPI, passagesAPI } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useOfflinePassage } from '../hooks/useOfflinePassage';
import { offlinePaiements, initDB } from '../services/offlineStorage';
import OfflineSyncIndicator from '../components/OfflineSyncIndicator';
import { networkManager } from '../services/networkManager';
import { syncService } from '../services/syncservice';

const Paiements = () => {
  const { isOnline } = useOfflinePassage();
  
  const [paiements, setPaiements] = useState([]);
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [formData, setFormData] = useState({
    passage_id: '',
    methode_paiement: 'especes',
    montant_paye: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Synchronisation automatique
  useEffect(() => {
    const unsubscribe = networkManager.subscribe((online) => {
      if (online) {
        setTimeout(() => {
          syncService.trySyncNow().catch(err => 
            console.log('ℹ️ Sync automatique échouée:', err)
          );
          // Recharger les données après la synchronisation
          setTimeout(() => {
            loadData();
          }, 3000);
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Afficher une notification
  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  // Fermer la notification
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // ✅ Fonction pour nettoyer les données locales orphelines
  const handleCleanLocalData = useCallback(async () => {
    if (!window.confirm(
      'Voulez-vous supprimer tous les paiements locaux qui n\'ont pas été synchronisés ?\n\n' +
      'Cela supprimera uniquement les paiements créés hors ligne qui ne sont pas encore sur le serveur.\n\n' +
      'Cette action est irréversible.'
    )) {
      return;
    }

    try {
      setCleaning(true);
      
      const db = await initDB();
      const tx = db.transaction('paiements', 'readwrite');
      const store = tx.objectStore('paiements');
      const allPaiements = await store.getAll();
      
      let deletedCount = 0;
      
      for (const paiement of allPaiements) {
        // Supprimer si non synchronisé OU si pas de server_id
        if (!paiement.synced || !paiement.server_id) {
          await store.delete(paiement.id);
          deletedCount++;
          console.log(`🗑️ Paiement local ${paiement.id} supprimé`);
        }
      }
      
      await tx.done;
      
      showNotification(`${deletedCount} paiement(s) local(aux) supprimé(s)`, 'success');
      
      // Recharger les données
      loadData();
    } catch (error) {
      console.error('❌ Erreur nettoyage données locales:', error);
      showNotification('Erreur lors du nettoyage des données locales', 'error');
    } finally {
      setCleaning(false);
    }
  }, [showNotification]);

  // ✅ CORRECTION PRINCIPALE : Chargement des données avec gestion correcte de la synchronisation
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      let allPaiements = [];
      let allPassages = [];
      
      // ✅ ÉTAPE 1 : Charger depuis le serveur en priorité si en ligne
      if (isOnline) {
        try {
          const [paiementsRes, passagesRes] = await Promise.all([
            paiementsAPI.getAll(),
            passagesAPI.getAll(),
          ]);
          
          const paiementsData = Array.isArray(paiementsRes.data.data) 
            ? paiementsRes.data.data 
            : (paiementsRes.data.data?.data || []);
          
          const passagesData = Array.isArray(passagesRes.data.data) 
            ? passagesRes.data.data 
            : (passagesRes.data.data?.data || []);
          
          allPassages = passagesData;
          
          console.log(`🌐 ${paiementsData.length} paiements récupérés du serveur`);
          
          // ✅ ÉTAPE 2 : Synchroniser avec IndexedDB
          const db = await initDB();
          const tx = db.transaction(['paiements', 'passages', 'clients'], 'readwrite');
          const paiementsStore = tx.objectStore('paiements');
          const passagesStore = tx.objectStore('passages');
          const clientsStore = tx.objectStore('clients');
          
          // Récupérer tous les paiements locaux
          const localPaiements = await paiementsStore.getAll();
          
          // IDs des paiements sur le serveur
          const serverPaiementIds = new Set(paiementsData.map(p => p.id));
          
          // ✅ ÉTAPE 3 : Supprimer localement les paiements qui n'existent plus sur le serveur
          let deletedCount = 0;
          for (const localPaiement of localPaiements) {
            // Si le paiement local a un server_id ET que ce server_id n'existe plus sur le serveur
            if (localPaiement.server_id && localPaiement.synced && !serverPaiementIds.has(localPaiement.server_id)) {
              console.log(`🗑️ Suppression locale du paiement ${localPaiement.id} (supprimé sur serveur)`);
              await paiementsStore.delete(localPaiement.id);
              deletedCount++;
            }
          }
          
          if (deletedCount > 0) {
            console.log(`✅ ${deletedCount} paiement(s) supprimé(s) localement (supprimés sur serveur)`);
          }
          
          // Récupérer à nouveau les paiements locaux après suppression
          const updatedLocalPaiements = await paiementsStore.getAll();
          
          // ✅ ÉTAPE 4 : Traiter chaque paiement du serveur
          for (const serverPaiement of paiementsData) {
            // Enrichir avec les infos du passage et du client
            let enrichedPaiement = {
              ...serverPaiement,
              synced: true,
              offline_created: false,
            };
            
            // Chercher le paiement local correspondant
            const localPaiement = updatedLocalPaiements.find(p => 
              p.server_id === serverPaiement.id || p.id === serverPaiement.id
            );
            
            if (localPaiement) {
              // Mettre à jour le paiement local avec les données du serveur
              enrichedPaiement = {
                ...localPaiement,
                ...serverPaiement,
                id: localPaiement.id, // Garder l'ID local
                server_id: serverPaiement.id,
                synced: true,
                offline_created: false,
                passage_id: localPaiement.passage_id, // Garder le passage_id local
              };
              
              await paiementsStore.put(enrichedPaiement);
              console.log(`✅ Paiement ${localPaiement.id} synchronisé avec serveur`);
            } else {
              // Nouveau paiement du serveur - l'ajouter localement
              const newLocalPaiement = {
                ...enrichedPaiement,
                server_id: serverPaiement.id,
              };
              delete newLocalPaiement.id;
              await paiementsStore.add(newLocalPaiement);
              console.log(`➕ Nouveau paiement du serveur ajouté localement`);
            }
            
            // Enrichir avec passage et client
            if (enrichedPaiement.passage_id) {
              const passage = await passagesStore.get(enrichedPaiement.passage_id);
              if (passage && passage.client_id) {
                const client = await clientsStore.get(passage.client_id);
                enrichedPaiement.passage = {
                  ...passage,
                  client: client || null,
                };
                enrichedPaiement.client = client || null;
              }
            }
            
            allPaiements.push(enrichedPaiement);
          }
          
          // ✅ ÉTAPE 5 : Ajouter les paiements locaux non synchronisés
          const finalLocalPaiements = await paiementsStore.getAll();
          for (const localPaiement of finalLocalPaiements) {
            if (!localPaiement.synced || !localPaiement.server_id) {
              // Enrichir avec passage et client
              if (localPaiement.passage_id) {
                const passage = await passagesStore.get(localPaiement.passage_id);
                if (passage && passage.client_id) {
                  const client = await clientsStore.get(passage.client_id);
                  localPaiement.passage = {
                    ...passage,
                    client: client || null,
                  };
                  localPaiement.client = client || null;
                }
              }
              
              allPaiements.push(localPaiement);
            }
          }
          
          await tx.done;
          
        } catch (serverError) {
          console.warn('⚠️ Impossible de charger depuis le serveur:', serverError);
          showNotification('Données chargées en mode hors ligne', 'info');
          
          // Fallback: charger uniquement les données locales
          const db = await initDB();
          const localPaiements = await db.getAll('paiements');
          
          for (const paiement of localPaiements) {
            if (paiement.passage_id) {
              const passage = await db.get('passages', paiement.passage_id);
              if (passage && passage.client_id) {
                const client = await db.get('clients', passage.client_id);
                paiement.passage = {
                  ...passage,
                  client: client || null,
                };
                paiement.client = client || null;
              }
            }
          }
          
          allPaiements = localPaiements;
        }
      } else {
        // ✅ MODE HORS LIGNE : Charger uniquement les données locales
        showNotification('Mode hors ligne activé', 'info');
        
        const db = await initDB();
        const localPaiements = await db.getAll('paiements');
        
        for (const paiement of localPaiements) {
          if (paiement.passage_id) {
            const passage = await db.get('passages', paiement.passage_id);
            if (passage && passage.client_id) {
              const client = await db.get('clients', passage.client_id);
              paiement.passage = {
                ...passage,
                client: client || null,
              };
              paiement.client = client || null;
            }
          }
        }
        
        allPaiements = localPaiements;
        console.log(`📱 ${allPaiements.length} paiements chargés localement`);
      }
      
      // Trier par date décroissante
      allPaiements.sort((a, b) => 
        new Date(b.date_paiement || b.created_at || 0) - new Date(a.date_paiement || a.created_at || 0)
      );
      
      setPaiements(allPaiements);
      setPassages(allPassages);
      setError('');
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [isOnline, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = useCallback(() => {
    setFormData({
      passage_id: '',
      methode_paiement: 'especes',
      montant_paye: '',
      notes: '',
    });
    setOpenDialog(true);
    setError('');
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setFormData({
      passage_id: '',
      methode_paiement: 'especes',
      montant_paye: '',
      notes: '',
    });
    setError('');
  }, []);

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // ✅ Créer un paiement avec support hors ligne
  const handleSubmit = useCallback(async () => {
    try {
      if (!formData.passage_id) {
        setError('Veuillez sélectionner un passage');
        return;
      }
      if (!formData.montant_paye || formData.montant_paye <= 0) {
        setError('Veuillez entrer un montant valide');
        return;
      }

      setSubmitting(true);
      
      const paiementData = {
        passage_id: formData.passage_id,
        montant_paye: parseFloat(formData.montant_paye),
        mode_paiement: formData.methode_paiement,
        date_paiement: new Date().toISOString(),
        notes: formData.notes || '',
      };

      let result;
      let offline = false;

      if (isOnline) {
        // MODE EN LIGNE
        try {
          const response = await paiementsAPI.create(paiementData);
          
          if (response.data.success) {
            const serverPaiement = response.data.data;
            
            // Sauvegarder localement aussi
            try {
              const db = await initDB();
              const tx = db.transaction('paiements', 'readwrite');
              
              const localPaiement = {
                ...serverPaiement,
                server_id: serverPaiement.id,
                synced: true,
                offline_created: false,
                created_at: new Date().toISOString(),
              };
              
              delete localPaiement.id;
              await tx.objectStore('paiements').add(localPaiement);
              await tx.done;
            } catch (localSaveError) {
              console.warn('⚠️ Impossible de sauvegarder localement:', localSaveError);
            }
            
            result = {
              success: true,
              data: serverPaiement,
              offline: false,
            };
          }
        } catch (serverError) {
          console.error('❌ Erreur serveur, basculement hors ligne:', serverError);
          offline = true;
        }
      } else {
        offline = true;
      }

      if (offline) {
        // MODE HORS LIGNE
        const localPaiement = await offlinePaiements.create({
          passage_id: formData.passage_id,
          montant_total: parseFloat(formData.montant_paye),
          montant_paye: parseFloat(formData.montant_paye),
          mode_paiement: formData.methode_paiement,
          date_paiement: new Date().toISOString(),
          notes: formData.notes || '',
        });
        
        result = {
          success: true,
          data: localPaiement,
          offline: true,
          message: 'Paiement créé hors ligne - sera synchronisé automatiquement',
        };
      }

      if (result.success) {
        handleCloseDialog();
        loadData();
        
        const message = result.offline
          ? 'Paiement enregistré hors ligne - sera synchronisé'
          : 'Paiement enregistré avec succès';
        
        showNotification(message, result.offline ? 'info' : 'success');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [formData, isOnline, handleCloseDialog, loadData, showNotification]);

  // ✅ CORRECTION : Annuler un paiement avec gestion ID local/serveur
  const handleCancel = useCallback(async (paiement) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce paiement ?')) {
      try {
        const serverId = paiement.server_id || paiement.id;
        const isSync = paiement.synced === true && paiement.server_id;
        
        if (!isSync) {
          showNotification('Ce paiement n\'est pas encore synchronisé. Veuillez attendre la synchronisation.', 'warning');
          return;
        }
        
        if (isOnline) {
          await paiementsAPI.cancel(serverId);
          showNotification('Paiement annulé avec succès');
          loadData();
        } else {
          showNotification('Impossible d\'annuler en mode hors ligne', 'error');
        }
      } catch (error) {
        console.error('Error canceling payment:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de l\'annulation du paiement';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  }, [isOnline, loadData, showNotification]);

  // ✅ CORRECTION : Supprimer un paiement avec gestion ID local/serveur
  const handleDelete = useCallback(async (paiement) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce paiement ?\n\nAttention : Cette action est irréversible !')) {
      try {
        const localId = paiement.id;
        const serverId = paiement.server_id;
        const isSync = paiement.synced === true && serverId;
        
        let serverDeleted = false;
        
        // ✅ ÉTAPE 1 : Supprimer sur le serveur si synchronisé
        if (isSync && isOnline) {
          try {
            console.log(`🌐 Suppression paiement sur serveur: ${serverId}`);
            await paiementsAPI.delete(serverId);
            serverDeleted = true;
            console.log(`✅ Paiement supprimé sur serveur: ${serverId}`);
          } catch (serverError) {
            console.error('❌ Erreur suppression serveur:', serverError);
            
            // Si 404, le paiement est déjà supprimé sur le serveur
            if (serverError.response?.status === 404) {
              console.log('ℹ️ Paiement déjà supprimé sur le serveur');
              serverDeleted = true;
            } else {
              throw serverError;
            }
          }
        } else if (isSync && !isOnline) {
          // Paiement synchronisé mais hors ligne - on ne peut pas le supprimer
          showNotification('Impossible de supprimer un paiement synchronisé en mode hors ligne', 'error');
          return;
        }
        
        // ✅ ÉTAPE 2 : Supprimer localement
        try {
          const db = await initDB();
          const tx = db.transaction('paiements', 'readwrite');
          await tx.objectStore('paiements').delete(localId);
          await tx.done;
          console.log(`✅ Paiement supprimé localement: ${localId}`);
        } catch (localError) {
          console.error('❌ Erreur suppression locale:', localError);
        }
        
        // ✅ ÉTAPE 3 : Recharger les données
        loadData();
        
        const message = serverDeleted
          ? 'Paiement supprimé du serveur et localement'
          : 'Paiement supprimé localement';
        
        showNotification(message, 'success');
      } catch (error) {
        console.error('Error deleting payment:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du paiement';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  }, [isOnline, loadData, showNotification]);

  // ✅ Supprimer un paiement local uniquement
  const handleDeleteLocal = useCallback(async (paiement) => {
    if (window.confirm('Voulez-vous supprimer ce paiement local ?\n\nCe paiement n\'a pas encore été synchronisé avec le serveur.')) {
      try {
        const db = await initDB();
        const tx = db.transaction('paiements', 'readwrite');
        await tx.objectStore('paiements').delete(paiement.id);
        await tx.done;
        
        console.log(`✅ Paiement local ${paiement.id} supprimé`);
        showNotification('Paiement local supprimé avec succès');
        loadData();
      } catch (error) {
        console.error('❌ Erreur suppression paiement local:', error);
        showNotification('Erreur lors de la suppression du paiement local', 'error');
      }
    }
  }, [loadData, showNotification]);

  // ✅ CORRECTION : Télécharger le reçu avec gestion ID local/serveur
  const handleDownloadReceipt = useCallback(async (paiement) => {
    try {
      const serverId = paiement.server_id || paiement.id;
      const isSync = paiement.synced === true && paiement.server_id;
      
      if (!isSync) {
        showNotification('Ce paiement n\'est pas encore synchronisé. Veuillez attendre la synchronisation.', 'warning');
        return;
      }
      
      if (!isOnline) {
        showNotification('Impossible de télécharger le reçu en mode hors ligne', 'error');
        return;
      }
      
      const response = await paiementsAPI.getReceipt(serverId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu-${serverId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('Reçu téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      const errorMessage = 'Erreur lors du téléchargement du reçu';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  }, [isOnline, showNotification]);

  // ✅ CORRECTION : Voir le reçu avec gestion ID local/serveur
  const handleViewReceipt = useCallback(async (paiement) => {
    try {
      const serverId = paiement.server_id || paiement.id;
      const isSync = paiement.synced === true && paiement.server_id;
      
      if (!isSync) {
        showNotification('Ce paiement n\'est pas encore synchronisé. Veuillez attendre la synchronisation.', 'warning');
        return;
      }
      
      if (!isOnline) {
        showNotification('Impossible de voir le reçu en mode hors ligne', 'error');
        return;
      }
      
      const response = await paiementsAPI.getReceiptData(serverId);
      setReceiptData(response.data.data);
      setOpenReceiptDialog(true);
    } catch (error) {
      console.error('Error loading receipt:', error);
      const errorMessage = 'Erreur lors du chargement du reçu';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  }, [isOnline, showNotification]);

  const handlePrintReceipt = useCallback(() => {
    window.print();
  }, []);

  // ✅ CORRECTION : Méthodes de paiement avec vraies icônes
  const getMethodeLabel = useCallback((methode) => {
    const labels = {
      especes: 'Espèces',
      carte: 'Carte bancaire',
      mobile: 'Paiement mobile',
      mobile_money: 'Mobile Money',
      cheque: 'Chèque',
      autre: 'Autre',
    };
    return labels[methode] || methode;
  }, []);

  const getMethodeIcon = useCallback((methode) => {
    const icons = {
      especes: <AttachMoney fontSize="small" />,
      carte: <CreditCard fontSize="small" />,
      mobile: <Phone fontSize="small" />,
      mobile_money: <Phone fontSize="small" />,
      cheque: <AccountBalance fontSize="small" />,
      autre: <MoreHoriz fontSize="small" />,
    };
    return icons[methode] || <MoreHoriz fontSize="small" />;
  }, []);

  const getStatutColor = useCallback((statut) => {
    const colors = {
      paye: 'success',
      valide: 'success',
      annule: 'error',
      partiel: 'warning',
      en_attente: 'warning',
    };
    return colors[statut] || 'default';
  }, []);

  // ✅ CORRECTION DES COLONNES avec bouton suppression locale
  const columns = useMemo(() => [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 80,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'numero_recu',
      headerName: 'N° Reçu',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value || `#${params.row.id}`}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params.row;
        let clientName = '-';
        
        if (row.client?.prenom && row.client?.nom) {
          clientName = `${row.client.prenom} ${row.client.nom}`;
        } else if (row.passage?.client?.prenom && row.passage?.client?.nom) {
          clientName = `${row.passage.client.prenom} ${row.passage.client.nom}`;
        } else if (row.nom_client) {
          clientName = row.nom_client;
        }
        
        return (
          <Typography sx={{ fontWeight: clientName === '-' ? 400 : 600 }}>
            {clientName}
          </Typography>
        );
      },
    },
    {
      field: 'montant_paye',
      headerName: 'Montant',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
          {params.value} FCFA
        </Typography>
      ),
    },
    {
      field: 'mode_paiement',
      headerName: 'Méthode',
      width: 150,
      renderCell: (params) => (
        <Chip 
          icon={getMethodeIcon(params.value)}
          label={getMethodeLabel(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const statut = params.value || 'paye';
        return (
          <Chip 
            label={statut}
            color={getStatutColor(statut)}
            size="small"
            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
          />
        );
      },
    },
    {
      field: 'synced',
      headerName: 'Sync',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const synced = params.row?.synced === true;
        return synced ? (
          <CloudDone color="success" fontSize="small" />
        ) : (
          <Chip 
            icon={<WifiOff />}
            label="Local" 
            color="warning"
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
        );
      },
    },
    {
      field: 'date_paiement',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => {
        try {
          const date = params.value || params.row.created_at;
          return date ? format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr }) : '-';
        } catch (e) {
          return '-';
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const synced = params.row?.synced === true;
        const serverId = params.row.server_id;
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {synced && serverId ? (
              // ✅ Paiement synchronisé - Actions normales
              <>
                <IconButton 
                  size="small" 
                  onClick={() => handleViewReceipt(params.row)}
                  color="info"
                  title="Voir le reçu"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleDownloadReceipt(params.row)}
                  color="primary"
                  title="Télécharger le reçu PDF"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Download fontSize="small" />
                </IconButton>
                {(params.row.statut === 'paye' || params.row.statut === 'valide' || !params.row.statut) && (
                  <IconButton 
                    size="small" 
                    onClick={() => handleCancel(params.row)} 
                    color="warning"
                    title="Annuler le paiement"
                    sx={{
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                )}
                <IconButton 
                  size="small" 
                  onClick={() => handleDelete(params.row)} 
                  color="error"
                  title="Supprimer le paiement"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </>
            ) : (
              // ✅ Paiement local - Bouton de suppression locale
              <Tooltip title="Supprimer ce paiement local">
                <IconButton 
                  size="small" 
                  onClick={() => handleDeleteLocal(params.row)} 
                  color="error"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  <DeleteSweep fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ], [getMethodeLabel, getMethodeIcon, getStatutColor, handleViewReceipt, handleDownloadReceipt, handleCancel, handleDelete, handleDeleteLocal]);

  // Filtrer les passages impayés - optimisé avec useMemo
  const unpaidPassages = useMemo(() => 
    Array.isArray(passages) 
      ? passages.filter(p => !p.paiement && !p.est_gratuit)
      : []
  , [passages]);

  // ✅ Compter les paiements locaux non synchronisés
  const localPaiementsCount = useMemo(() => 
    paiements.filter(p => !p.synced || !p.server_id).length
  , [paiements]);

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true} timeout={500}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Gestion des paiements
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <OfflineSyncIndicator />
            
            {/* ✅ Bouton de nettoyage des données locales */}
            {localPaiementsCount > 0 && (
              <Tooltip title="Supprimer tous les paiements locaux non synchronisés">
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={cleaning ? <CircularProgress size={20} /> : <CleaningServices />}
                  onClick={handleCleanLocalData}
                  disabled={cleaning}
                >
                  Nettoyer locaux ({localPaiementsCount})
                </Button>
              </Tooltip>
            )}
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
              Nouveau paiement
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Alerte mode hors ligne */}
      {!isOnline && (
        <Fade in={true}>
          <Alert 
            severity="warning" 
            icon={<CloudOff />}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Mode hors ligne activé
            </Typography>
            <Typography variant="caption">
              Les paiements seront synchronisés automatiquement une fois la connexion rétablie.
            </Typography>
          </Alert>
        </Fade>
      )}

      

      {error && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Fade>
      )}

      <Zoom in={true} timeout={600}>
        <Paper 
          elevation={2} 
          sx={{ 
            height: 600, 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DataGrid
            rows={paiements}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
              },
            }}
          />
        </Paper>
      </Zoom>

      {/* Dialogue de nouveau paiement */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt />
              Nouveau paiement
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {!isOnline && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<WifiOff />}>
              Mode hors ligne : Le paiement sera créé localement et synchronisé automatiquement.
            </Alert>
          )}
          
          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Passage</InputLabel>
                <Select
                  name="passage_id"
                  value={formData.passage_id}
                  onChange={handleChange}
                  label="Passage"
                >
                  {unpaidPassages.length === 0 ? (
                    <MenuItem disabled value="">
                      Aucun passage impayé disponible
                    </MenuItem>
                  ) : (
                    unpaidPassages.map((passage) => (
                      <MenuItem key={passage.id} value={passage.id}>
                        #{passage.numero_passage || passage.id} - {passage.client?.prenom} {passage.client?.nom} - {passage.montant_total} FCFA
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montant payé (FCFA)"
                name="montant_paye"
                type="number"
                value={formData.montant_paye}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Méthode de paiement</InputLabel>
                <Select
                  name="methode_paiement"
                  value={formData.methode_paiement}
                  onChange={handleChange}
                  label="Méthode de paiement"
                >
                  <MenuItem value="especes">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney fontSize="small" />
                      Espèces
                    </Box>
                  </MenuItem>
                  <MenuItem value="carte">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCard fontSize="small" />
                      Carte bancaire
                    </Box>
                  </MenuItem>
                  <MenuItem value="mobile_money">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" />
                      Mobile Money
                    </Box>
                  </MenuItem>
                  <MenuItem value="cheque">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalance fontSize="small" />
                      Chèque
                    </Box>
                  </MenuItem>
                  <MenuItem value="autre">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoreHoriz fontSize="small" />
                      Autre
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'affichage du reçu */}
      <Dialog 
        open={openReceiptDialog} 
        onClose={() => setOpenReceiptDialog(false)} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Reçu de paiement</Typography>
            <Box>
              <IconButton 
                onClick={handlePrintReceipt} 
                color="primary"
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <Print />
              </IconButton>
              <IconButton onClick={() => setOpenReceiptDialog(false)}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {receiptData && (
            <Fade in={true}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {receiptData.salon?.nom || 'Salon de Coiffure'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {receiptData.salon?.adresse || 'Abidjan, Côte d\'Ivoire'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {receiptData.salon?.telephone || 'Tél: +225 XX XX XX XX XX'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      N° Reçu
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {receiptData.numero_recu}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {receiptData.date}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Client
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {receiptData.client?.nom_complet}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {receiptData.client?.telephone}
                  </Typography>
                </Box>

                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Prestation</TableCell>
                        <TableCell align="center">Qté</TableCell>
                        <TableCell align="right">Prix unit.</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receiptData.prestations?.map((prestation, index) => (
                        <TableRow key={index}>
                          <TableCell>{prestation.libelle}</TableCell>
                          <TableCell align="center">{prestation.quantite}</TableCell>
                          <TableCell align="right">{prestation.prix_unitaire} FCFA</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {prestation.prix_total} FCFA
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Montant total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {receiptData.montant_total} FCFA
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Montant payé</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {receiptData.montant_paye} FCFA
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Mode de paiement</Typography>
                  <Chip 
                    icon={getMethodeIcon(receiptData.mode_paiement)}
                    label={getMethodeLabel(receiptData.mode_paiement)} 
                    size="small"
                    color="primary"
                  />
                </Box>

                {receiptData.est_gratuit && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Passage gratuit - Programme de fidélité
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ textAlign: 'center' }}
                >
                  Merci pour votre visite !
                </Typography>
              </Paper>
            </Fade>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenReceiptDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
          iconMapping={{
            success: <CheckCircle />,
            error: <ErrorIcon />,
            info: <CheckCircle />,
            warning: <ErrorIcon />,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Paiements;
