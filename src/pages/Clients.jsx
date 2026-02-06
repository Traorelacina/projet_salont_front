// pages/Clients.jsx 
import React, { useEffect, useState } from 'react';
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
  Snackbar,
  Slide,
  Fade,
  DialogContentText,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  Phone,
  CheckCircle,
  Error as ErrorIcon,
  CloudOff,
  CloudDone,
  WifiOff,
  Warning,
  Storage,
} from '@mui/icons-material';
import { useOfflineClient } from '../hooks/useOfflineClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import OfflineSyncIndicator from '../components/OfflineSyncIndicator';
import LocalDataManager from '../components/LocalDataManager';

const Clients = () => {
  const {
    isOnline,
    getAllClients,
    createClient,
    updateClient,
    deleteClient,
  } = useOfflineClient();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDataManager, setOpenDataManager] = useState(false); // ✅ NOUVEAU
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
  });
  const [error, setError] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [deleting, setDeleting] = useState(false);

  // Afficher une notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Charger les clients
  const loadClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();
      
      if (result.success) {
        setClients(result.data);
        
        if (result.offline) {
          showNotification('Données chargées en mode hors ligne', 'info');
        }
      }
      
      setError('');
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Erreur lors du chargement des clients');
      showNotification('Erreur lors du chargement des clients', 'error');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleOpenDialog = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        nom: client.nom,
        prenom: client.prenom,
        telephone: client.telephone || '',
      });
    } else {
      setSelectedClient(null);
      setFormData({ nom: '', prenom: '', telephone: '' });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
    setFormData({ nom: '', prenom: '', telephone: '' });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      setError('Le nom et le prénom sont obligatoires');
      return;
    }

    try {
      const dataToSend = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
      };
      
      if (formData.telephone && formData.telephone.trim()) {
        dataToSend.telephone = formData.telephone.trim();
      }

      let result;
      if (selectedClient) {
        result = await updateClient(selectedClient.id, dataToSend);
      } else {
        result = await createClient(dataToSend);
      }

      if (result.success) {
        const action = selectedClient ? 'mis à jour' : 'créé';
        const message = result.offline
          ? `Client ${action} hors ligne - sera synchronisé automatiquement`
          : `Client ${action} avec succès`;
        
        showNotification(message, result.offline ? 'info' : 'success');
        handleCloseDialog();
        loadClients();
      }
    } catch (error) {
      console.error('Error saving client:', error);
      
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (client) => {
    setClientToDelete(client);
    setOpenDeleteDialog(true);
  };

  // Fermer le dialogue de confirmation
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setClientToDelete(null);
  };

  // Confirmer et exécuter la suppression
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    setDeleting(true);
    try {
      console.log('🗑️ Suppression du client:', clientToDelete.id);
      
      const result = await deleteClient(clientToDelete.id);
      
      if (result.success) {
        const passagesInfo = result.data?.passages_deleted 
          ? ` (${result.data.passages_deleted} passage(s) supprimé(s))`
          : '';
        
        const message = result.message || `Client supprimé avec succès${passagesInfo}`;
        
        showNotification(message, result.offline ? 'info' : 'success');
        
        if (result.warning) {
          setTimeout(() => {
            showNotification(`Attention: ${result.warning}`, 'warning');
          }, 3000);
        }
        
        handleCloseDeleteDialog();
        loadClients();
      } else {
        throw new Error(result.message || 'Échec de la suppression');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      
      let errorMessage = 'Erreur lors de la suppression du client';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ✅ NOUVEAU : Gérer la fermeture du gestionnaire de données
  const handleCloseDataManager = () => {
    setOpenDataManager(false);
    loadClients(); // Recharger les données après modifications
  };

  const columns = [
    {
      field: 'code_client',
      headerName: 'Code',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color="secondary" 
          size="small"
          sx={{ fontWeight: 600, fontFamily: 'monospace' }}
        />
      ),
    },
    {
      field: 'prenom',
      headerName: 'Prénom',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'nom',
      headerName: 'Nom',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'telephone',
      headerName: 'Téléphone',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value ? (
            <>
              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
              {params.value}
            </>
          ) : (
            <Typography variant="body2" color="text.disabled" fontStyle="italic">
              Non renseigné
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'nombre_passages',
      headerName: 'Passages',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value || 0} 
          color="primary" 
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'derniere_visite',
      headerName: 'Dernière visite',
      width: 150,
      renderCell: (params) => 
        params.value ? format(new Date(params.value), 'dd MMM yyyy', { locale: fr }) : '-',
    },
    {
      field: 'synced',
      headerName: 'Statut',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const synced = params.row?.synced !== false;
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
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenDeleteDialog(params.row)}
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Gestion des clients
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <OfflineSyncIndicator />
          
          {/* ✅ NOUVEAU : Bouton Gérer les données locales */}
          <Button
            variant="outlined"
            startIcon={<Storage />}
            onClick={() => setOpenDataManager(true)}
            color="secondary"
          >
            Données locales
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Nouveau client
          </Button>
        </Box>
      </Box>

      {/* Alerte de mode hors ligne */}
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
              Les modifications seront automatiquement synchronisées une fois la connexion rétablie.
            </Typography>
          </Alert>
        </Fade>
      )}

      {error && !openDialog && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%', bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={clients}
          columns={columns}
          loading={loading}
          paginationMode="client"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableSelectionOnClick
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Box>

      {/* Dialogue d'édition/création */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Modifier le client' : 'Nouveau client'}
        </DialogTitle>
        <DialogContent>
          {!isOnline && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<WifiOff />}>
              Mode hors ligne : Les modifications seront synchronisées automatiquement.
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Prénom"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            required
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Téléphone (optionnel)"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="Ex: +225 01 02 03 04 05"
            helperText="Le numéro de téléphone est optionnel"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          {!isOnline && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<WifiOff />}>
              Mode hors ligne : La suppression sera synchronisée automatiquement une fois en ligne.
            </Alert>
          )}
          
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer <strong>définitivement</strong> le client{' '}
            <strong>
              {clientToDelete?.prenom} {clientToDelete?.nom}
            </strong>{' '}
            (Code: {clientToDelete?.code_client}) ?
          </DialogContentText>
          
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ⚠️ Attention : Cette action est irréversible !
            </Typography>
            <Typography variant="caption">
              Tous les passages et paiements associés à ce client seront également supprimés définitivement.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? null : <Delete />}
          >
            {deleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ NOUVEAU : Dialogue de gestion des données locales */}
      <LocalDataManager 
        open={openDataManager}
        onClose={handleCloseDataManager}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
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
            warning: <Warning />,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Clients;