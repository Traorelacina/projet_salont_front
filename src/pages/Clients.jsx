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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Phone } from '@mui/icons-material';
import { clientsAPI } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
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
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    loadClients();
  }, [paginationModel]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll({
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
      });
      
      const paginatedData = response.data.data;
      const clientsData = paginatedData.data || [];
      
      setClients(clientsData);
      setRowCount(paginatedData.total || 0);
      setError('');
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Erreur lors du chargement des clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

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
    // Validation - seuls nom et prénom sont obligatoires
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      setError('Le nom et le prénom sont obligatoires');
      return;
    }

    try {
      // Préparer les données à envoyer (ne pas envoyer de chaîne vide pour le téléphone)
      const dataToSend = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
      };
      
      // Ajouter le téléphone seulement s'il n'est pas vide
      if (formData.telephone && formData.telephone.trim()) {
        dataToSend.telephone = formData.telephone.trim();
      }

      if (selectedClient) {
        // Mise à jour d'un client existant
        await clientsAPI.update(selectedClient.id, dataToSend);
      } else {
        // Création d'un nouveau client
        const response = await clientsAPI.create(dataToSend);
        
        // Vérifier que le code client a bien été généré
        if (!response.data.data.code_client) {
          setError('Erreur: Le code client n\'a pas pu être généré. Veuillez réessayer.');
          return;
        }
      }
      handleCloseDialog();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      
      // Gestion détaillée des erreurs
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (error.response?.data?.errors) {
        // Erreurs de validation Laravel
        errorMessage = Object.values(error.response.data.errors).flat().join(', ');
      } else if (error.response?.data?.message) {
        // Message d'erreur personnalisé du serveur
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Erreur réseau ou autre
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientsAPI.delete(id);
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        setError('Erreur lors de la suppression du client');
      }
    }
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
      field: 'actions',
      headerName: 'Actions',
      width: 150,
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
            onClick={() => handleDelete(params.row.id)} 
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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau client
        </Button>
      </Box>

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
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={rowCount}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Modifier le client' : 'Nouveau client'}
        </DialogTitle>
        <DialogContent>
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
    </Box>
  );
};

export default Clients;