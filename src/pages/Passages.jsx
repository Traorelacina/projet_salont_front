import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  Grid,
  Card,
  CardContent,
  List,
  ListItemText,
  ListItemButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Fade,
  Zoom,
  Slide,
  Grow,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Delete, 
  CardGiftcard, 
  Search,
  PersonAdd,
  Phone,
  ShoppingCart,
  Payment,
  Person,
  AttachMoney,
  CreditCard,
  PhoneAndroid,
  Description,
  CheckCircle,
  Error as ErrorIcon,
  ArrowForward,
  Download,
  Receipt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { passagesAPI, clientsAPI, prestationsAPI, paiementsAPI } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant optimisé pour la ligne de résultat de recherche client
const ClientSearchItem = React.memo(({ client, onSelect }) => (
  <ListItemButton 
    onClick={() => onSelect(client)}
    sx={{
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'primary.lighter',
        transform: 'translateX(8px)',
      },
    }}
  >
    <Person sx={{ mr: 2, color: 'primary.main' }} />
    <ListItemText
      primary={
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {client.prenom} {client.nom}
        </Typography>
      }
      secondary={
        <>
          <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Phone sx={{ fontSize: 14 }} />
              <Typography variant="body2" component="span">
                {client.telephone}
              </Typography>
            </Box>
            <Typography variant="body2" component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {client.nombre_passages || 0} passage(s)
            </Typography>
          </Box>
        </>
      }
    />
    <ShoppingCart sx={{ color: 'primary.main' }} />
  </ListItemButton>
));

ClientSearchItem.displayName = 'ClientSearchItem';

// Composant optimisé pour la ligne de prestation
const PrestationRow = React.memo(({ prestation, selected, onToggle }) => {
  const handleClick = useCallback(() => {
    onToggle(prestation);
  }, [prestation, onToggle]);

  return (
    <TableRow 
      hover
      onClick={handleClick}
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
          transform: 'scale(1.01)',
        },
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        />
      </TableCell>
      <TableCell>{prestation.libelle || prestation.nom}</TableCell>
      <TableCell align="right">
        <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
          {prestation.prix} FCFA
        </Typography>
      </TableCell>
    </TableRow>
  );
});

PrestationRow.displayName = 'PrestationRow';

// Composant pour l'animation de redirection améliorée
const RedirectAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1000);
    const timer3 = setTimeout(() => setStep(3), 1500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <Zoom in={true} timeout={500}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
            <CircularProgress 
              size={80} 
              thickness={4} 
              sx={{ color: 'primary.main' }} 
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </Box>

          <Fade in={step >= 0} timeout={600}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Paiement enregistré !
            </Typography>
          </Fade>

          <Fade in={step >= 1} timeout={600}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Préparation du reçu en cours...
            </Typography>
          </Fade>

          <Fade in={step >= 2} timeout={600}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Receipt sx={{ color: 'primary.main', animation: 'bounce 1s infinite' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Génération du reçu
              </Typography>
            </Box>
          </Fade>

          <Fade in={step >= 3} timeout={600}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <ArrowForward sx={{ animation: 'slideRight 1.5s infinite' }} />
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                Redirection vers la page paiements
              </Typography>
            </Box>
          </Fade>
        </Box>
      </Zoom>
      
      <style>
        {`
          @keyframes slideRight {
            0% { transform: translateX(-10px); opacity: 0.5; }
            50% { transform: translateX(10px); opacity: 1; }
            100% { transform: translateX(-10px); opacity: 0.5; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </Box>
  );
};

const Passages = () => {
  const navigate = useNavigate();
  const [passages, setPassages] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  // États pour la recherche et sélection de client
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // États pour le nouveau client
  const [newClientData, setNewClientData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
  });

  // États pour les prestations sélectionnées
  const [selectedPrestations, setSelectedPrestations] = useState([]);
  const [fidelityInfo, setFidelityInfo] = useState(null);

  // États pour le paiement
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    montant_paye: 0,
    mode_paiement: 'especes',
  });
  const [currentPassage, setCurrentPassage] = useState(null);

  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // État pour l'animation de redirection
  const [showRedirectAnimation, setShowRedirectAnimation] = useState(false);

  // États pour les actions en cours
  const [creatingPassage, setCreatingPassage] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  // Ref pour le debounce
  const searchTimeoutRef = useRef(null);

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

  // Chargement optimisé des données avec useCallback
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [passagesRes, prestationsRes] = await Promise.all([
        passagesAPI.getAll({
          page: paginationModel.page + 1,
          per_page: paginationModel.pageSize,
        }),
        prestationsAPI.getAll({ actif: true }),
      ]);

      const passagesData = passagesRes.data.data?.data || passagesRes.data.data || [];
      setPassages(passagesData);
      setRowCount(passagesRes.data.data?.total || 0);

      const prestationsData = prestationsRes.data.data?.data || prestationsRes.data.data || [];
      setPrestations(prestationsData);

      setError('');
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recherche de clients optimisée avec debounce manuel
  const handleSearchClient = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await clientsAPI.getAll({ search: query });
      
      const clientsData = response.data.data?.data || response.data.data || [];
      
      const filteredClients = clientsData.filter(client => {
        const fullName = `${client.prenom} ${client.nom}`.toLowerCase();
        const searchLower = query.toLowerCase();
        
        return fullName.includes(searchLower) ||
               client.nom.toLowerCase().includes(searchLower) ||
               client.prenom.toLowerCase().includes(searchLower) ||
               client.telephone.includes(query);
      });
      
      setSearchResults(filteredClients);
    } catch (error) {
      console.error('Error searching client:', error);
      showNotification('Erreur lors de la recherche du client', 'error');
    } finally {
      setSearching(false);
    }
  }, [showNotification]);

  // Debounce optimisé de la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchClient(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, handleSearchClient]);

  // Sélectionner un client existant et ouvrir le dialogue de passage
  const handleSelectClient = useCallback(async (client) => {
    setSelectedClient(client);
    setSearchResults([]);
    setSearchQuery('');
    setOpenDialog(true);
    
    // Charger les informations de fidélité en arrière-plan
    passagesAPI.checkFidelity(client.id)
      .then(response => setFidelityInfo(response.data.data))
      .catch(error => {
        console.error('Error checking fidelity:', error);
        showNotification('Erreur lors de la vérification de la fidélité', 'error');
      });
  }, [showNotification]);

  // Créer un nouveau client avec useCallback
  const handleCreateClient = useCallback(async () => {
    if (!newClientData.nom || !newClientData.prenom || !newClientData.telephone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await clientsAPI.create(newClientData);
      const newClient = response.data.data;
      
      setShowNewClientForm(false);
      setNewClientData({ nom: '', prenom: '', telephone: '' });
      setError('');
      
      showNotification(`Client ${newClient.prenom} ${newClient.nom} créé avec succès`);
      handleSelectClient(newClient);
    } catch (error) {
      console.error('Error creating client:', error);
      const errorMessage = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || 'Erreur lors de la création du client';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  }, [newClientData, handleSelectClient, showNotification]);

  // Gérer la sélection des prestations (optimisé)
  const handleTogglePrestation = useCallback((prestation) => {
    setSelectedPrestations(prev => {
      const isSelected = prev.some(p => p.id === prestation.id);
      
      if (!isSelected) {
        return [...prev, {
          id: prestation.id,
          libelle: prestation.libelle || prestation.nom,
          prix: prestation.prix,
          quantite: 1,
        }];
      } else {
        return prev.filter(p => p.id !== prestation.id);
      }
    });
  }, []);

  // Vérifier si une prestation est sélectionnée (mémorisé)
  const isPrestationSelected = useCallback((prestationId) => {
    return selectedPrestations.some(p => p.id === prestationId);
  }, [selectedPrestations]);

  // Calculer le montant total avec useMemo
  const calculateTotal = useMemo(() => {
    if (fidelityInfo?.est_gratuit) return 0;
    return selectedPrestations.reduce((total, p) => total + (p.prix * p.quantite), 0);
  }, [selectedPrestations, fidelityInfo]);

  // Fermer le dialogue avec useCallback
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedClient(null);
    setSelectedPrestations([]);
    setFidelityInfo(null);
    setError('');
  }, []);

  // Créer le passage avec useCallback (optimisé)
  const handleCreatePassage = useCallback(async () => {
    if (!selectedClient) {
      setError('Veuillez sélectionner un client');
      return;
    }
    if (selectedPrestations.length === 0) {
      setError('Veuillez sélectionner au moins une prestation');
      return;
    }

    setCreatingPassage(true);

    try {
      const passageData = {
        client_id: selectedClient.id,
        date_passage: new Date().toISOString(),
        prestations: selectedPrestations.map(p => ({
          id: p.id,
          quantite: p.quantite,
        })),
        notes: '',
      };

      const response = await passagesAPI.create(passageData);
      const newPassage = response.data.data.passage;
      
      setCurrentPassage(newPassage);
      handleCloseDialog();
      
      showNotification(`Passage #${newPassage.id} créé avec succès`);
      
      if (newPassage.est_gratuit) {
        loadData();
      } else {
        const montantTotal = newPassage.montant_total || calculateTotal;
        setPaymentData({
          montant_paye: montantTotal,
          mode_paiement: 'especes',
        });
        setShowPaymentDialog(true);
        showNotification(`Veuillez procéder au paiement de ${montantTotal} FCFA`, 'info');
      }
    } catch (error) {
      console.error('Error creating passage:', error);
      const errorMessage = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || 'Erreur lors de la création du passage';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setCreatingPassage(false);
    }
  }, [selectedClient, selectedPrestations, handleCloseDialog, calculateTotal, loadData, showNotification]);

  // Enregistrer le paiement avec useCallback (optimisé)
  const handleCreatePayment = useCallback(async () => {
    if (!currentPassage) return;

    setCreatingPayment(true);

    try {
      const paymentResponse = await paiementsAPI.create({
        passage_id: currentPassage.id,
        montant_paye: paymentData.montant_paye,
        mode_paiement: paymentData.mode_paiement,
        date_paiement: new Date().toISOString(),
      });

      setShowPaymentDialog(false);
      setCurrentPassage(null);
      setPaymentData({
        montant_paye: 0,
        mode_paiement: 'especes',
      });
      
      showNotification(`Paiement de ${paymentData.montant_paye} FCFA enregistré avec succès`, 'success');
      
      setShowRedirectAnimation(true);
      
      setTimeout(() => {
        navigate('/paiements', { 
          state: { 
            showReceipt: true,
            paymentId: paymentResponse.data.data.id,
            passageId: currentPassage.id
          } 
        });
      }, 2500);
      
      loadData();
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Erreur lors de l\'enregistrement du paiement');
      showNotification('Erreur lors de l\'enregistrement du paiement', 'error');
    } finally {
      setCreatingPayment(false);
    }
  }, [currentPassage, paymentData, navigate, loadData, showNotification]);

  // Supprimer un passage avec useCallback
  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce passage ?')) {
      try {
        await passagesAPI.delete(id);
        loadData();
        showNotification('Passage supprimé avec succès');
      } catch (error) {
        console.error('Error deleting passage:', error);
        setError('Erreur lors de la suppression du passage');
        showNotification('Erreur lors de la suppression du passage', 'error');
      }
    }
  }, [loadData, showNotification]);

  // Définition des colonnes avec useMemo
  const columns = useMemo(() => [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 80,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'numero_passage',
      headerName: 'N° Passage',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip 
          label={`#${params.value || params.row.id}`} 
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
        const client = params.row?.client;
        return client ? (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {client.prenom} {client.nom}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Phone sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {client.telephone}
              </Typography>
            </Box>
          </Box>
        ) : 'N/A';
      },
    },
    {
      field: 'date_passage',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => 
        params.value ? format(new Date(params.value), 'dd MMM yyyy', { locale: fr }) : '-',
    },
    
    {
      field: 'est_gratuit',
      headerName: 'Type',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        params.value ? (
          <Chip 
            icon={<CardGiftcard />}
            label="Gratuit" 
            color="success"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Chip 
            label="Payant" 
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box>
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
  ], [handleDelete]);

  // Icônes de mode de paiement
  const paymentIcons = useMemo(() => ({
    especes: <AttachMoney />,
    mobile_money: <PhoneAndroid />,
    carte: <CreditCard />,
    autre: <Description />,
  }), []);

  return (
    <Box>
      {/* Animation de redirection */}
      {showRedirectAnimation && <RedirectAnimation />}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Gestion des passages
        </Typography>
      </Box>

      {error && !openDialog && !showPaymentDialog && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Barre de recherche client en haut */}
      <Grow in={true} timeout={500}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Rechercher un client par nom complet (ex: 'Jean Dupont'), prénom, nom ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searching ? <CircularProgress size={20} /> : <Search />}
                    </InputAdornment>
                  ),
                }}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={() => setShowNewClientForm(true)}
                size="large"
              >
                Nouveau client
              </Button>
            </Grid>
          </Grid>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <Slide direction="down" in={true} mountOnEnter unmountOnExit>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  {searchResults.length} client(s) trouvé(s) - Cliquez sur un client pour ajouter un passage
                </Typography>
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {searchResults.map((client, index) => (
                    <React.Fragment key={client.id}>
                      {index > 0 && <Divider />}
                      <Fade in={true} timeout={300 + index * 50}>
                        <div>
                          <ClientSearchItem client={client} onSelect={handleSelectClient} />
                        </div>
                      </Fade>
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </Slide>
          )}

          {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
            <Fade in={true}>
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucun client trouvé. Voulez-vous créer un nouveau client ?
              </Alert>
            </Fade>
          )}
        </Paper>
      </Grow>

      {/* Liste des passages */}
      <Grow in={true} timeout={700}>
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={passages}
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
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'grey.50',
                },
              }}
            />
          </Box>
        </Paper>
      </Grow>

      {/* Dialogue de création de nouveau client */}
      <Dialog 
        open={showNewClientForm} 
        onClose={() => setShowNewClientForm(false)} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd />
            Nouveau client
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            </Fade>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom"
                value={newClientData.nom}
                onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Prénom"
                value={newClientData.prenom}
                onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Téléphone"
                value={newClientData.telephone}
                onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              setShowNewClientForm(false);
              setNewClientData({ nom: '', prenom: '', telephone: '' });
              setError('');
            }}
          >
            Annuler
          </Button>
          <Button onClick={handleCreateClient} variant="contained">
            Créer et ajouter un passage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de sélection des prestations */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart />
            Sélectionner les prestations
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            </Fade>
          )}

          {selectedClient && (
            <Grow in={true}>
              <Card sx={{ bgcolor: 'primary.lighter', mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedClient.prenom} {selectedClient.nom}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {selectedClient.telephone}
                        </Typography>
                      </Box>
                    </Box>
                    {fidelityInfo && fidelityInfo.est_gratuit && (
                      <Zoom in={true} timeout={500}>
                        <Chip 
                          icon={<CardGiftcard />}
                          label="PASSAGE GRATUIT" 
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                      </Zoom>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          )}

          <Typography variant="h6" sx={{ mb: 2 }}>
            Prestations disponibles
          </Typography>

          <TableContainer sx={{ maxHeight: 400, mb: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Prestation</TableCell>
                  <TableCell align="right">Prix</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prestations.map((prestation) => (
                  <PrestationRow
                    key={prestation.id}
                    prestation={prestation}
                    selected={isPrestationSelected(prestation.id)}
                    onToggle={handleTogglePrestation}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Résumé de la commande
            </Typography>
            
            {selectedPrestations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucune prestation sélectionnée
              </Typography>
            ) : (
              <Box>
                {selectedPrestations.map((p) => (
                  <Fade key={p.id} in={true}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{p.libelle}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.prix} FCFA
                      </Typography>
                    </Box>
                  </Fade>
                ))}
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    TOTAL
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      color: fidelityInfo?.est_gratuit ? 'success.main' : 'primary.main' 
                    }}
                  >
                    {fidelityInfo?.est_gratuit ? (
                      <Chip label="GRATUIT" color="success" />
                    ) : (
                      `${calculateTotal} FCFA`
                    )}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} size="large">
            Annuler
          </Button>
          <Button 
            onClick={handleCreatePassage} 
            variant="contained"
            disabled={selectedPrestations.length === 0 || creatingPassage}
            size="large"
            startIcon={creatingPassage ? <CircularProgress size={20} color="inherit" /> : <ShoppingCart />}
          >
            {creatingPassage ? 'Création...' : 'Valider le passage'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de paiement */}
      <Dialog 
        open={showPaymentDialog} 
        onClose={() => setShowPaymentDialog(false)} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment />
            Enregistrer le paiement
          </Box>
        </DialogTitle>
        <DialogContent>
          <Fade in={true}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Veuillez enregistrer le paiement avant de procéder au téléchargement du reçu.
            </Alert>
          </Fade>
          
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Grow in={true}>
                <Card sx={{ bgcolor: 'primary.lighter' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Montant à payer
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {paymentData.montant_paye} FCFA
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Mode de paiement"
                value={paymentData.mode_paiement}
                onChange={(e) => setPaymentData({ ...paymentData, mode_paiement: e.target.value })}
                SelectProps={{ native: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {paymentIcons[paymentData.mode_paiement]}
                    </InputAdornment>
                  ),
                }}
              >
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="carte">Carte bancaire</option>
                <option value="autre">Autre</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowPaymentDialog(false)} size="large">
            Annuler
          </Button>
          <Button 
            onClick={handleCreatePayment} 
            variant="contained"
            size="large"
            disabled={creatingPayment}
            startIcon={creatingPayment ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            {creatingPayment ? 'Traitement en cours...' : 'Confirmer et télécharger le reçu'}
          </Button>
        </DialogActions>
      </Dialog>

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
            warning: <ErrorIcon />,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Passages;