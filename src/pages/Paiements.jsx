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
} from '@mui/icons-material';
import { paiementsAPI, passagesAPI } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Paiements = () => {
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
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [paiementsRes, passagesRes] = await Promise.all([
        paiementsAPI.getAll(),
        passagesAPI.getAll(),
      ]);
      
      // Gérer les données paginées de Laravel
      const paiementsData = Array.isArray(paiementsRes.data.data) 
        ? paiementsRes.data.data 
        : (paiementsRes.data.data?.data || []);
      
      const passagesData = Array.isArray(passagesRes.data.data) 
        ? passagesRes.data.data 
        : (passagesRes.data.data?.data || []);
      
      setPaiements(paiementsData);
      setPassages(passagesData);
      setError('');
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

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
      await paiementsAPI.create(formData);
      handleCloseDialog();
      showNotification('Paiement enregistré avec succès');
      loadData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [formData, handleCloseDialog, loadData, showNotification]);

  const handleCancel = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce paiement ?')) {
      try {
        await paiementsAPI.cancel(id);
        showNotification('Paiement annulé avec succès');
        loadData();
      } catch (error) {
        console.error('Error canceling payment:', error);
        const errorMessage = 'Erreur lors de l\'annulation du paiement';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  }, [loadData, showNotification]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce paiement ?\n\nAttention : Cette action est irréversible !')) {
      try {
        await paiementsAPI.delete(id);
        showNotification('Paiement supprimé avec succès');
        loadData();
      } catch (error) {
        console.error('Error deleting payment:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du paiement';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    }
  }, [loadData, showNotification]);

  const handleDownloadReceipt = useCallback(async (id) => {
    try {
      const response = await paiementsAPI.getReceipt(id);
      
      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('Reçu téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      const errorMessage = 'Erreur lors du téléchargement du reçu';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  }, [showNotification]);

  const handleViewReceipt = useCallback(async (id) => {
    try {
      const response = await paiementsAPI.getReceiptData(id);
      setReceiptData(response.data.data);
      setOpenReceiptDialog(true);
    } catch (error) {
      console.error('Error loading receipt:', error);
      const errorMessage = 'Erreur lors du chargement du reçu';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  }, [showNotification]);

  const handlePrintReceipt = useCallback(() => {
    window.print();
  }, []);

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
        
        // Essayer différentes structures
        if (row.passage?.client?.prenom && row.passage?.client?.nom) {
          clientName = `${row.passage.client.prenom} ${row.passage.client.nom}`;
        } else if (row.client?.prenom && row.client?.nom) {
          clientName = `${row.client.prenom} ${row.client.nom}`;
        } else if (row.nom_client) {
          clientName = row.nom_client;
        }
        
        return <Typography>{clientName}</Typography>;
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
      renderCell: (params) => (
        <Chip 
          label={params.value}
          color={getStatutColor(params.value)}
          size="small"
          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'date_paiement',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => {
        try {
          return format(new Date(params.value), 'dd MMM yyyy HH:mm', { locale: fr });
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
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => handleViewReceipt(params.row.id)}
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
            onClick={() => handleDownloadReceipt(params.row.id)}
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
          {(params.row.statut === 'paye' || params.row.statut === 'valide') && (
            <IconButton 
              size="small" 
              onClick={() => handleCancel(params.row.id)} 
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
            onClick={() => handleDelete(params.row.id)} 
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
        </Box>
      ),
    },
  ], [getMethodeLabel, getStatutColor, handleViewReceipt, handleDownloadReceipt, handleCancel, handleDelete]);

  // Filter unpaid passages - optimisé avec useMemo
  const unpaidPassages = useMemo(() => 
    Array.isArray(passages) 
      ? passages.filter(p => !p.paiement && !p.est_gratuit)
      : []
  , [passages]);

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true} timeout={500}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Gestion des paiements
          </Typography>
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
          Nouveau paiement
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
                        #{passage.numero_passage} - {passage.client?.prenom} {passage.client?.nom} - {passage.montant_total} FCFA
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
                  <MenuItem value="especes">💵 Espèces</MenuItem>
                  <MenuItem value="carte">💳 Carte bancaire</MenuItem>
                  <MenuItem value="mobile_money">📱 Mobile Money</MenuItem>
                  <MenuItem value="cheque">📝 Chèque</MenuItem>
                  <MenuItem value="autre">📋 Autre</MenuItem>
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
              <IconButton 
                onClick={() => handleDownloadReceipt(receiptData?.numero_recu)}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <Download />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {receiptData && (
            <Fade in={true}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                {/* En-tête du salon */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {receiptData.salon?.nom}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {receiptData.salon?.adresse}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {receiptData.salon?.telephone}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Informations du reçu */}
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

                {/* Informations client */}
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

                {/* Prestations */}
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

                {/* Total */}
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