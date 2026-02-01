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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, ToggleOn, ToggleOff } from '@mui/icons-material';
import { prestationsAPI } from '../services/api';

const Prestations = () => {
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [formData, setFormData] = useState({
    libelle: '',
    prix: '',
    description: '',
    actif: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrestations();
  }, []);

  const loadPrestations = async () => {
    try {
      setLoading(true);
      const response = await prestationsAPI.getAll();
      // Les prestations ne sont pas paginées selon le backend
      const prestationsData = response.data.data || [];
      setPrestations(prestationsData);
      setError('');
    } catch (error) {
      console.error('Error loading prestations:', error);
      setError('Erreur lors du chargement des prestations');
      setPrestations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prestation = null) => {
    if (prestation) {
      setSelectedPrestation(prestation);
      setFormData({
        libelle: prestation.libelle || '',
        prix: prestation.prix || '',
        description: prestation.description || '',
        actif: prestation.actif !== undefined ? prestation.actif : true,
      });
    } else {
      setSelectedPrestation(null);
      setFormData({ libelle: '', prix: '', description: '', actif: true });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrestation(null);
    setFormData({ libelle: '', prix: '', description: '', actif: true });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'actif' ? checked : value 
    });
  };

  const handleSubmit = async () => {
    // Validation basique
    if (!formData.libelle.trim()) {
      setError('Le nom de la prestation est obligatoire');
      return;
    }
    if (!formData.prix || parseFloat(formData.prix) < 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    try {
      const dataToSend = {
        libelle: formData.libelle,
        prix: parseFloat(formData.prix),
        description: formData.description || '',
        actif: formData.actif,
      };

      if (selectedPrestation) {
        await prestationsAPI.update(selectedPrestation.id, dataToSend);
      } else {
        await prestationsAPI.create(dataToSend);
      }
      handleCloseDialog();
      loadPrestations();
    } catch (error) {
      console.error('Error saving prestation:', error);
      const errorMessage = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      try {
        await prestationsAPI.delete(id);
        loadPrestations();
      } catch (error) {
        console.error('Error deleting prestation:', error);
        setError('Erreur lors de la suppression de la prestation');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await prestationsAPI.toggleActive(id);
      loadPrestations();
    } catch (error) {
      console.error('Error toggling prestation:', error);
      setError('Erreur lors du changement de statut');
    }
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 80,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'libelle',
      headerName: 'Nom de la prestation',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'prix',
      headerName: 'Prix',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
          {params.value || 0} FCFA
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'actif',
      headerName: 'Statut',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Actif' : 'Inactif'}
          color={params.value ? 'success' : 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => handleToggleActive(params.row.id)}
            color={params.row.actif ? 'success' : 'default'}
            title={params.row.actif ? 'Désactiver' : 'Activer'}
          >
            {params.row.actif ? <ToggleOn /> : <ToggleOff />}
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
            title="Modifier"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDelete(params.row.id)} 
            color="error"
            title="Supprimer"
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
          Gestion des prestations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle prestation
        </Button>
      </Box>

      {error && !openDialog && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%', bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={prestations}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
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
          {selectedPrestation ? 'Modifier la prestation' : 'Nouvelle prestation'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nom de la prestation"
            name="libelle"
            value={formData.libelle}
            onChange={handleChange}
            required
            sx={{ mt: 2, mb: 2 }}
            placeholder="Ex: Coupe cheveux"
          />
          <TextField
            fullWidth
            label="Prix (FCFA)"
            name="prix"
            type="number"
            value={formData.prix}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            placeholder="Ex: 2000"
            inputProps={{ min: 0, step: 100 }}
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="Description optionnelle..."
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.actif}
                onChange={handleChange}
                name="actif"
                color="success"
              />
            }
            label="Prestation active"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Prestations;