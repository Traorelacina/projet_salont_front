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
  CircularProgress,
  Snackbar,
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
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [existingLibelles, setExistingLibelles] = useState(new Set());

  useEffect(() => {
    loadPrestations();
  }, []);

  const loadPrestations = async () => {
    try {
      setLoading(true);
      const response = await prestationsAPI.getAll();
      const prestationsData = response.data.data || [];
      setPrestations(prestationsData);
      
      // Créer un Set des libellés existants pour validation côté client
      const libelles = new Set(prestationsData.map(p => p.libelle?.toLowerCase().trim()));
      setExistingLibelles(libelles);
      
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
    setSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'actif' ? checked : value 
    });
    // Effacer l'erreur quand l'utilisateur modifie
    if (error) setError('');
  };

  const isLibelleUnique = (libelle) => {
    if (!libelle || !libelle.trim()) return true;
    
    const normalizedLibelle = libelle.toLowerCase().trim();
    
    if (selectedPrestation) {
      const currentLibelle = selectedPrestation.libelle?.toLowerCase().trim();
      if (currentLibelle === normalizedLibelle) return true;
    }
    
    return !existingLibelles.has(normalizedLibelle);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.libelle.trim()) {
      setError('Le nom de la prestation est obligatoire');
      return;
    }

    if (!isLibelleUnique(formData.libelle)) {
      setError('Ce nom de prestation existe déjà. Veuillez en choisir un autre.');
      return;
    }

    if (!formData.prix || parseFloat(formData.prix) < 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const dataToSend = {
        libelle: formData.libelle.trim(),
        prix: parseFloat(formData.prix),
        description: formData.description.trim() || '',
        actif: formData.actif,
      };

      if (selectedPrestation) {
        await prestationsAPI.update(selectedPrestation.id, dataToSend);
        showSnackbar('Prestation modifiée avec succès', 'success');
      } else {
        await prestationsAPI.create(dataToSend);
        showSnackbar('Prestation créée avec succès', 'success');
      }
      
      handleCloseDialog();
      loadPrestations();
    } catch (error) {
      console.error('Error saving prestation:', error);
      
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors?.libelle) {
          errorMessage = errors.libelle[0] || 'Ce nom de prestation existe déjà.';
        } else {
          errorMessage = Object.values(errors).flat().join(', ');
        }
      } else if (error.response?.status === 409) {
        errorMessage = 'Ce nom de prestation existe déjà. Veuillez en choisir un autre.';
      } else {
        errorMessage = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      }
      
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
      try {
        await prestationsAPI.delete(id);
        showSnackbar('Prestation supprimée avec succès', 'success');
        loadPrestations();
      } catch (error) {
        console.error('Error deleting prestation:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression de la prestation';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await prestationsAPI.toggleActive(id);
      showSnackbar('Statut modifié avec succès', 'success');
      loadPrestations();
    } catch (error) {
      console.error('Error toggling prestation:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de statut';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
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

      <Dialog open={openDialog} onClose={!submitting ? handleCloseDialog : undefined} maxWidth="sm" fullWidth>
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
            label="Nom de la prestation *"
            name="libelle"
            value={formData.libelle}
            onChange={handleChange}
            required
            sx={{ mt: 2, mb: 2 }}
            placeholder="Ex: Coupe cheveux"
            disabled={submitting}
            error={error && error.includes('nom de prestation')}
            helperText={!isLibelleUnique(formData.libelle) && formData.libelle.trim() ? "Ce nom existe déjà" : ""}
          />
          <TextField
            fullWidth
            label="Prix (FCFA) *"
            name="prix"
            type="number"
            value={formData.prix}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            placeholder="Ex: 2000"
            inputProps={{ min: 0, step: 100 }}
            disabled={submitting}
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
            disabled={submitting}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.actif}
                onChange={handleChange}
                name="actif"
                color="success"
                disabled={submitting}
              />
            }
            label="Prestation active"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Prestations;