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
  Snackbar,
  Fade,
  Zoom,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  CheckCircle,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff,
  LockReset,
  Block,
  Email,
  Phone,
  Badge,
  AdminPanelSettings,
  ManageAccounts,
  Work,
} from '@mui/icons-material';
import { usersAPI } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    password_confirmation: '',
    role: 'caissier',
    actif: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [filterActif, setFilterActif] = useState('');

  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterActif]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterActif !== '') params.actif = filterActif === 'true';

      const response = await usersAPI.getAll(params);

      // Gérer les données
      const usersData = Array.isArray(response.data.data)
        ? response.data.data
        : (response.data.data?.data || []);

      setUsers(usersData);
      setError('');
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
      showNotification('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterActif, showNotification]);

  const handleOpenDialog = useCallback((user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone || '',
        password: '',
        password_confirmation: '',
        role: user.role,
        actif: user.actif,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        password: '',
        password_confirmation: '',
        role: 'caissier',
        actif: true,
      });
    }
    setOpenDialog(true);
    setError('');
    setShowPassword(false);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      password: '',
      password_confirmation: '',
      role: 'caissier',
      actif: true,
    });
    setError('');
    setShowPassword(false);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'actif' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      // Validation
      if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Validation du mot de passe pour les nouveaux utilisateurs
      if (!selectedUser && (!formData.password || formData.password.length < 6)) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      // Vérification de la confirmation du mot de passe
      if (formData.password && formData.password !== formData.password_confirmation) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      setSubmitting(true);

      const dataToSend = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        role: formData.role,
        actif: formData.actif,
      };

      // Ajouter le mot de passe uniquement s'il est rempli
      if (formData.password) {
        dataToSend.password = formData.password;
        dataToSend.password_confirmation = formData.password_confirmation;
      }

      if (selectedUser) {
        await usersAPI.update(selectedUser.id, dataToSend);
        showNotification('Utilisateur mis à jour avec succès');
      } else {
        await usersAPI.create(dataToSend);
        showNotification('Utilisateur créé avec succès');
      }

      handleCloseDialog();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [formData, selectedUser, handleCloseDialog, loadUsers, showNotification]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?\n\nAttention : Cette action est irréversible !')) {
      try {
        await usersAPI.delete(id);
        showNotification('Utilisateur supprimé avec succès');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  }, [loadUsers, showNotification]);

  const handleToggleActif = useCallback(async (id) => {
    try {
      await usersAPI.toggleActif(id);
      showNotification('Statut de l\'utilisateur mis à jour avec succès');
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  }, [loadUsers, showNotification]);

  const getRoleLabel = useCallback((role) => {
    const labels = {
      admin: 'Administrateur',
      manager: 'Manager',
      caissier: 'Caissier',
    };
    return labels[role] || role;
  }, []);

  const getRoleColor = useCallback((role) => {
    const colors = {
      admin: 'error',
      manager: 'warning',
      caissier: 'info',
    };
    return colors[role] || 'default';
  }, []);

  const getRoleIcon = useCallback((role) => {
    const icons = {
      admin: <AdminPanelSettings fontSize="small" />,
      manager: <ManageAccounts fontSize="small" />,
      caissier: <Work fontSize="small" />,
    };
    return icons[role] || <Badge fontSize="small" />;
  }, []);

  const columns = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'nom_complet',
      headerName: 'Nom complet',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography sx={{ fontWeight: 500 }}>
            {params.value || `${params.row.prenom} ${params.row.nom}`}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'telephone',
      headerName: 'Téléphone',
      width: 150,
      renderCell: (params) => params.value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
          {params.value}
        </Box>
      ) : '-',
    },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 160,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip
          icon={getRoleIcon(params.value)}
          label={getRoleLabel(params.value)}
          color={getRoleColor(params.value)}
          size="small"
          sx={{ fontWeight: 600 }}
        />
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
      field: 'created_at',
      headerName: 'Créé le',
      width: 150,
      renderCell: (params) => {
        try {
          return params.value ? format(new Date(params.value), 'dd MMM yyyy', { locale: fr }) : '-';
        } catch (e) {
          return '-';
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
            title="Modifier"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
       
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            color="error"
            title="Supprimer"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ], [getRoleLabel, getRoleColor, getRoleIcon, handleOpenDialog, handleToggleActif, handleDelete]);

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true} timeout={500}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Gestion des utilisateurs
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => handleOpenDialog()}
            sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              }
            }}
          >
            Nouvel utilisateur
          </Button>
        </Box>
      </Fade>

      {/* Filtres */}
      <Fade in={true} timeout={600}>
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrer par rôle</InputLabel>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  label="Filtrer par rôle"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings fontSize="small" />
                      Administrateur
                    </Box>
                  </MenuItem>
                  <MenuItem value="manager">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ManageAccounts fontSize="small" />
                      Manager
                    </Box>
                  </MenuItem>
                  <MenuItem value="caissier">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work fontSize="small" />
                      Caissier
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrer par statut</InputLabel>
                <Select
                  value={filterActif}
                  onChange={(e) => setFilterActif(e.target.value)}
                  label="Filtrer par statut"
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="true">Actif</MenuItem>
                  <MenuItem value="false">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

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
            rows={users}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
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
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
              },
            }}
          />
        </Paper>
      </Zoom>

      {/* Dialogue de création/modification d'utilisateur */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          {selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Ex: +225 01 02 03 04 05"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Rôle"
                >
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings fontSize="small" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Administrateur
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Accès complet
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="manager">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ManageAccounts fontSize="small" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Manager
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Gestion + Statistiques
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="caissier">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work fontSize="small" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Caissier
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Passages et paiements uniquement
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={selectedUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required={!selectedUser}
                helperText={selectedUser ? "Laisser vide pour ne pas changer" : "Minimum 6 caractères"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockReset fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirmer le mot de passe"
                name="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                value={formData.password_confirmation}
                onChange={handleChange}
                required={!selectedUser || formData.password}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actif}
                    onChange={handleChange}
                    name="actif"
                    color="success"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>
                      Compte actif
                    </Typography>
                    <Chip
                      label={formData.actif ? 'Actif' : 'Inactif'}
                      color={formData.actif ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                }
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
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
          >
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
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

export default Users;