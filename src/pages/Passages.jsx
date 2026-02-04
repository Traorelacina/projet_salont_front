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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  alpha,
  useTheme,
  useMediaQuery,
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
  Remove,
  PercentOutlined,
  ReceiptLong,
  Loyalty,
  ContentCut,
  Close,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { passagesAPI, clientsAPI, prestationsAPI, paiementsAPI, usersAPI } from '../services/api';
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
          {client.code_client && (
            <Chip 
              label={client.code_client} 
              size="small" 
              sx={{ ml: 1, fontWeight: 600 }}
              variant="outlined"
              color="primary"
            />
          )}
        </Typography>
      }
      secondary={
        <>
          <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            {client.telephone ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: 14 }} />
                <Typography variant="body2" component="span">
                  {client.telephone}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" component="span" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
                Pas de téléphone
              </Typography>
            )}
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

// Composant optimisé pour la ligne de prestation avec contrôle de quantité ET sélection de coiffeur
const PrestationRow = React.memo(({ 
  prestation, 
  selected, 
  selectedPrestation, 
  onToggle, 
  onQuantityChange,
  onCoiffeurChange,
  coiffeurs 
}) => {
  const handleClick = useCallback(() => {
    onToggle(prestation);
  }, [prestation, onToggle]);

  const handleIncrement = useCallback((e) => {
    e.stopPropagation();
    if (selected && selectedPrestation) {
      onQuantityChange(prestation.id, selectedPrestation.quantite + 1);
    }
  }, [selected, selectedPrestation, prestation.id, onQuantityChange]);

  const handleDecrement = useCallback((e) => {
    e.stopPropagation();
    if (selected && selectedPrestation && selectedPrestation.quantite > 1) {
      onQuantityChange(prestation.id, selectedPrestation.quantite - 1);
    }
  }, [selected, selectedPrestation, prestation.id, onQuantityChange]);

  const handleCoiffeurSelect = useCallback((e) => {
    e.stopPropagation();
    onCoiffeurChange(prestation.id, e.target.value);
  }, [prestation.id, onCoiffeurChange]);

  return (
    <TableRow 
      hover
      onClick={handleClick}
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        bgcolor: selected ? 'primary.lighter' : 'transparent',
        '&:hover': {
          bgcolor: selected ? 'primary.light' : 'action.hover',
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
      <TableCell align="center">
        {selected ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={handleDecrement}
              disabled={!selectedPrestation || selectedPrestation.quantite <= 1}
              sx={{ 
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'error.light', color: 'error.main' }
              }}
            >
              <Remove fontSize="small" />
            </IconButton>
            <Typography sx={{ 
              minWidth: 30, 
              textAlign: 'center', 
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'primary.main'
            }}>
              {selectedPrestation?.quantite || 1}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleIncrement}
              sx={{ 
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'success.light', color: 'success.main' }
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </TableCell>
      <TableCell align="center" sx={{ minWidth: 200 }}>
        {selected ? (
          <FormControl size="small" fullWidth onClick={(e) => e.stopPropagation()}>
            <Select
              value={selectedPrestation?.coiffeur_id || ''}
              onChange={handleCoiffeurSelect}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <ContentCut fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="">
                <em>Non assigné</em>
              </MenuItem>
              {coiffeurs.map((coiffeur) => (
                <MenuItem key={coiffeur.id} value={coiffeur.id}>
                  {coiffeur.prenom} {coiffeur.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
          {prestation.prix} FCFA
        </Typography>
      </TableCell>
      <TableCell align="right">
        {selected && selectedPrestation ? (
          <Typography sx={{ fontWeight: 700, color: 'success.main', fontSize: '1.1rem' }}>
            {prestation.prix * selectedPrestation.quantite} FCFA
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
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
                Ouverture de la fenêtre d'impression
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [passages, setPassages] = useState([]);
  const [prestations, setPrestations] = useState([]);
  const [coiffeurs, setCoiffeurs] = useState([]);
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

  // États pour la remise
  const [remiseType, setRemiseType] = useState('aucune');
  const [remiseValue, setRemiseValue] = useState('');

  // États pour le paiement
  const [modePaiement, setModePaiement] = useState('especes');

  // États pour les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // État pour l'animation de redirection
  const [showRedirectAnimation, setShowRedirectAnimation] = useState(false);
  
  // État pour le dialogue de félicitations
  const [showCongratulationsDialog, setShowCongratulationsDialog] = useState(false);

  // États pour les actions en cours
  const [creatingPassage, setCreatingPassage] = useState(false);

  // État pour le dialogue de confirmation de suppression
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    passageId: null,
    passageInfo: null,
  });

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

  // Chargement optimisé des données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [passagesRes, prestationsRes, coiffeursRes] = await Promise.all([
        passagesAPI.getAll({
          page: paginationModel.page + 1,
          per_page: paginationModel.pageSize,
        }),
        prestationsAPI.getAll({ actif: true }),
        usersAPI.getCoiffeurs({ with_prestations: false }),
      ]);

      const passagesData = passagesRes.data.data?.data || passagesRes.data.data || [];
      setPassages(passagesData);
      setRowCount(passagesRes.data.data?.total || 0);

      const prestationsData = prestationsRes.data.data?.data || prestationsRes.data.data || [];
      setPrestations(prestationsData);

      const coiffeursData = coiffeursRes.data.data?.data || coiffeursRes.data.data || [];
      setCoiffeurs(coiffeursData);

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

  // Recherche de clients optimisée
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
               (client.telephone && client.telephone.includes(query)) ||
               client.code_client?.toLowerCase().includes(searchLower);
      });
      
      setSearchResults(filteredClients);
    } catch (error) {
      console.error('Error searching client:', error);
      showNotification('Erreur lors de la recherche du client', 'error');
    } finally {
      setSearching(false);
    }
  }, [showNotification]);

  // Debounce de la recherche
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

  // Sélectionner un client
  const handleSelectClient = useCallback(async (client) => {
    setSelectedClient(client);
    setSearchResults([]);
    setSearchQuery('');
    setOpenDialog(true);
    
    // Charger les informations de fidélité
    passagesAPI.checkFidelity(client.id)
      .then(response => setFidelityInfo(response.data.data))
      .catch(error => {
        console.error('Error checking fidelity:', error);
        showNotification('Erreur lors de la vérification de la fidélité', 'error');
      });
  }, [showNotification]);

  // Créer un nouveau client
  const handleCreateClient = useCallback(async () => {
    if (!newClientData.nom || !newClientData.prenom) {
      setError('Le nom et le prénom sont obligatoires');
      return;
    }

    try {
      const dataToSend = {
        nom: newClientData.nom.trim(),
        prenom: newClientData.prenom.trim(),
      };
      
      if (newClientData.telephone && newClientData.telephone.trim()) {
        dataToSend.telephone = newClientData.telephone.trim();
      }

      const response = await clientsAPI.create(dataToSend);
      const newClient = response.data.data;
      
      setShowNewClientForm(false);
      setNewClientData({ nom: '', prenom: '', telephone: '' });
      setError('');
      
      showNotification(`Client ${newClient.prenom} ${newClient.nom} créé avec succès (${newClient.code_client})`);
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

  // Gérer la sélection des prestations
  const handleTogglePrestation = useCallback((prestation) => {
    setSelectedPrestations(prev => {
      const isSelected = prev.some(p => p.id === prestation.id);
      
      if (!isSelected) {
        return [...prev, {
          id: prestation.id,
          libelle: prestation.libelle || prestation.nom,
          prix: prestation.prix,
          quantite: 1,
          coiffeur_id: null,
        }];
      } else {
        return prev.filter(p => p.id !== prestation.id);
      }
    });
  }, []);

  // Gérer le changement de quantité
  const handleQuantityChange = useCallback((prestationId, newQuantity) => {
    setSelectedPrestations(prev => 
      prev.map(p => 
        p.id === prestationId 
          ? { ...p, quantite: Math.max(1, newQuantity) }
          : p
      )
    );
  }, []);

  // Gérer le changement de coiffeur
  const handleCoiffeurChange = useCallback((prestationId, coiffeurId) => {
    setSelectedPrestations(prev => 
      prev.map(p => 
        p.id === prestationId 
          ? { ...p, coiffeur_id: coiffeurId || null }
          : p
      )
    );
  }, []);

  // Vérifier si une prestation est sélectionnée
  const isPrestationSelected = useCallback((prestationId) => {
    return selectedPrestations.some(p => p.id === prestationId);
  }, [selectedPrestations]);

  // Obtenir la prestation sélectionnée
  const getSelectedPrestation = useCallback((prestationId) => {
    return selectedPrestations.find(p => p.id === prestationId);
  }, [selectedPrestations]);

  // Calculer le sous-total
  const calculateSubtotal = useMemo(() => {
    return selectedPrestations.reduce((total, p) => total + (p.prix * p.quantite), 0);
  }, [selectedPrestations]);

  // Calculer la remise
  const calculateRemise = useMemo(() => {
    if (remiseType === 'aucune' || !remiseValue || remiseValue === '') return 0;
    const numericValue = Number(remiseValue);
    if (isNaN(numericValue) || numericValue <= 0) return 0;
    
    if (remiseType === 'pourcentage') {
      return Math.round((calculateSubtotal * numericValue) / 100);
    }
    if (remiseType === 'montant') {
      return Math.min(numericValue, calculateSubtotal);
    }
    return 0;
  }, [remiseType, remiseValue, calculateSubtotal]);

  // Calculer le montant total
  const calculateTotal = useMemo(() => {
    if (fidelityInfo?.est_gratuit) return 0;
    return Math.max(0, calculateSubtotal - calculateRemise);
  }, [calculateSubtotal, calculateRemise, fidelityInfo]);

  // Fermer le dialogue
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedClient(null);
    setSelectedPrestations([]);
    setFidelityInfo(null);
    setRemiseType('aucune');
    setRemiseValue('');
    setModePaiement('especes');
    setError('');
  }, []);

  // Créer le passage ET le paiement
  const handleCreatePassageAndPayment = useCallback(async () => {
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
          coiffeur_id: p.coiffeur_id,
        })),
        notes: remiseType !== 'aucune' && remiseValue 
          ? `Remise appliquée: ${remiseType === 'pourcentage' ? `${remiseValue}%` : `${remiseValue} FCFA`}` 
          : '',
      };

      const passageResponse = await passagesAPI.create(passageData);
      const newPassage = passageResponse.data.data.passage;
      
      handleCloseDialog();
      
      if (newPassage.est_gratuit) {
        setShowCongratulationsDialog(true);
        showNotification(`Passage #${newPassage.id} créé - Passage gratuit offert !`, 'success');
        loadData();
        return;
      }

      const montantTotal = calculateTotal;
      
      const paymentResponse = await paiementsAPI.create({
        passage_id: newPassage.id,
        montant_paye: montantTotal,
        mode_paiement: modePaiement,
        date_paiement: new Date().toISOString(),
      });

      showNotification(`Passage #${newPassage.id} créé et paiement enregistré avec succès !`, 'success');
      
      setShowRedirectAnimation(true);
      
      setTimeout(async () => {
        try {
          const receiptResponse = await paiementsAPI.getReceipt(paymentResponse.data.data.id);
          
          // Créer un blob et ouvrir dans une nouvelle fenêtre pour impression
          const blob = new Blob([receiptResponse.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          
          // Ouvrir le PDF dans une nouvelle fenêtre
          const printWindow = window.open(url, '_blank');
          
          if (printWindow) {
            // Attendre que le PDF soit chargé avant de lancer l'impression
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
              }, 250);
            };
            
            showNotification('Fenêtre d\'impression du reçu ouverte !', 'success');
          } else {
            // Si le popup est bloqué, télécharger le fichier
            const link = document.createElement('a');
            link.href = url;
            link.download = `recu-${paymentResponse.data.data.numero_recu || paymentResponse.data.data.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Popup bloqué. Reçu téléchargé à la place.', 'info');
          }
          
          // Nettoyer l'URL après un délai
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 60000); // 1 minute
          
        } catch (error) {
          console.error('Error printing receipt:', error);
          showNotification('Paiement enregistré mais erreur lors de l\'impression du reçu', 'warning');
        }
        
        setTimeout(() => {
          setShowRedirectAnimation(false);
          loadData();
        }, 1000);
      }, 2000);
      
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
  }, [selectedClient, selectedPrestations, calculateTotal, modePaiement, remiseType, remiseValue, handleCloseDialog, loadData, showNotification]);

  // Gérer la confirmation des félicitations
  const handleCongratulationsConfirm = useCallback(async () => {
    setShowCongratulationsDialog(false);
    setShowRedirectAnimation(true);
    
    loadData();
    
    setTimeout(() => {
      setShowRedirectAnimation(false);
    }, 2500);
  }, [loadData]);

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = useCallback((passage) => {
    setDeleteDialog({
      open: true,
      passageId: passage.id,
      passageInfo: {
        numero: passage.numero_passage || passage.id,
        client: passage.client,
        date: passage.date_passage,
        est_gratuit: passage.est_gratuit,
      },
    });
  }, []);

  // Fermer le dialogue de suppression
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({
      open: false,
      passageId: null,
      passageInfo: null,
    });
  }, []);

  // Confirmer la suppression d'un passage
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialog.passageId) return;

    try {
      await passagesAPI.delete(deleteDialog.passageId);
      
      handleCloseDeleteDialog();
      loadData();
      
      showNotification('Passage supprimé avec succès. Le nombre de passages du client a été réduit.', 'success');
    } catch (error) {
      console.error('Error deleting passage:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du passage';
      showNotification(errorMessage, 'error');
    }
  }, [deleteDialog.passageId, handleCloseDeleteDialog, loadData, showNotification]);

  // Définition des colonnes
  const columns = useMemo(() => [
    {
      field: 'code_client',
      headerName: 'Code Client',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const client = params.row?.client;
        return client?.code_client ? (
          <Chip 
            label={client.code_client} 
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ) : '-';
      },
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => {
        const client = params.row?.client;
        return client ? (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {client.prenom} {client.nom}
            </Typography>
            {client.telephone ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {client.telephone}
                </Typography>
              </Box>
            ) : (
              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                Pas de téléphone
              </Typography>
            )}
          </Box>
        ) : 'N/A';
      },
    },
    {
      field: 'numero_passage',
      headerName: 'N° Passage',
      width: 130,
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
      field: 'date_passage',
      headerName: 'Date',
      width: 140,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => 
        params.value ? format(new Date(params.value), 'dd MMM yyyy', { locale: fr }) : '-',
    },
    {
      field: 'est_gratuit',
      headerName: 'Type',
      width: 120,
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
      width: 100,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          onClick={() => handleOpenDeleteDialog(params.row)} 
          color="error"
          sx={{
            '&:hover': {
              bgcolor: 'error.lighter',
            }
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      ),
    },
  ], [handleOpenDeleteDialog]);

  // Icônes de mode de paiement
  const paymentIcons = useMemo(() => ({
    especes: <AttachMoney />,
    mobile_money: <PhoneAndroid />,
    carte: <CreditCard />,
    autre: <Description />,
  }), []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Animation de redirection */}
      {showRedirectAnimation && <RedirectAnimation />}

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2,
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
          Gestion des passages
        </Typography>
      </Box>

      {error && !openDialog && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Barre de recherche client */}
      <Grow in={true} timeout={500}>
        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Rechercher un client par nom, prénom, téléphone ou code client..."
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
        <Paper elevation={2} sx={{ p: { xs: 1, md: 2 }, mb: 3 }}>
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
              getRowHeight={() => 'auto'}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-row': {
                  minHeight: '60px !important',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'grey.50',
                  minHeight: '56px !important',
                },
                '& .MuiDataGrid-columnHeader': {
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
        fullScreen={isMobile}
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd />
              Nouveau client
            </Box>
            {isMobile && (
              <IconButton onClick={() => setShowNewClientForm(false)} edge="end">
                <Close />
              </IconButton>
            )}
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
                label="Prénom"
                value={newClientData.prenom}
                onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })}
                required
              />
            </Grid>
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
                label="Téléphone (optionnel)"
                value={newClientData.telephone}
                onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })}
                placeholder="Ex: +225 01 02 03 04 05"
                helperText="Le numéro de téléphone est optionnel"
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
          {!isMobile && (
            <Button 
              onClick={() => {
                setShowNewClientForm(false);
                setNewClientData({ nom: '', prenom: '', telephone: '' });
                setError('');
              }}
            >
              Annuler
            </Button>
          )}
          <Button onClick={handleCreateClient} variant="contained" fullWidth={isMobile}>
            Créer et ajouter un passage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de sélection des prestations */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isTablet}
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCart />
              Sélectionner les prestations
            </Box>
            {isTablet && (
              <IconButton onClick={handleCloseDialog} edge="end">
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          {error && (
            <Fade in={true}>
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            </Fade>
          )}

          {selectedClient && (
            <Grow in={true}>
              <Card sx={{ 
                bgcolor: alpha('#1976d2', 0.06), 
                mb: 2,
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 1.5,
              }}>
                <CardContent sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5 
                  }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                      <Avatar
                        sx={{
                          width: { xs: 40, md: 48 },
                          height: { xs: 40, md: 48 },
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', md: '1.1rem' },
                        }}
                      >
                        {selectedClient.prenom?.charAt(0)}{selectedClient.nom?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          {selectedClient.prenom} {selectedClient.nom}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
                          {selectedClient.code_client && (
                            <Chip 
                              label={selectedClient.code_client} 
                              size="small"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 20,
                                fontWeight: 500,
                                bgcolor: 'white',
                                border: '1px solid',
                                borderColor: 'primary.light',
                              }}
                            />
                          )}
                          {selectedClient.telephone ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Phone fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                                {selectedClient.telephone}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled" fontStyle="italic" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                              Pas de téléphone
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Stack>
                    {fidelityInfo && fidelityInfo.est_gratuit && (
                      <Zoom in={true} timeout={500}>
                        <Chip 
                          icon={<CardGiftcard fontSize="small" />}
                          label="GRATUIT" 
                          color="success"
                          size="small"
                          sx={{ 
                            fontWeight: 700, 
                            height: 28, 
                            fontSize: '0.8rem',
                            '& .MuiChip-icon': { fontSize: 16 }
                          }}
                        />
                      </Zoom>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          )}

          {/* Layout responsive : Prestations et Résumé */}
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexDirection: { xs: 'column', md: 'row' },
          }}>
            {/* Liste des prestations */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 58%' }, minWidth: 0 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Prestations disponibles
              </Typography>

              <TableContainer sx={{ 
                maxHeight: { xs: 400, md: 500 }, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
              }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Prestation</TableCell>
                      <TableCell align="center" sx={{ width: { xs: 100, md: 150 } }}>Quantité</TableCell>
                      <TableCell align="center" sx={{ width: { xs: 150, md: 200 }, display: { xs: 'none', sm: 'table-cell' } }}>Coiffeur</TableCell>
                      <TableCell align="right">Prix unit.</TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prestations.map((prestation) => (
                      <PrestationRow
                        key={prestation.id}
                        prestation={prestation}
                        selected={isPrestationSelected(prestation.id)}
                        selectedPrestation={getSelectedPrestation(prestation.id)}
                        onToggle={handleTogglePrestation}
                        onQuantityChange={handleQuantityChange}
                        onCoiffeurChange={handleCoiffeurChange}
                        coiffeurs={coiffeurs}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Résumé de la commande */}
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 38%' }, 
              minWidth: 0,
            }}>
              <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', height: 'fit-content', position: { md: 'sticky' }, top: { md: 16 } }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  Résumé de la commande
                </Typography>
                
                {selectedPrestations.length === 0 ? (
                  <Alert severity="info">
                    Aucune prestation sélectionnée
                  </Alert>
                ) : (
                  <Box>
                    {/* Liste des prestations sélectionnées */}
                    <Box sx={{ mb: 2, maxHeight: 250, overflowY: 'auto', pr: 1 }}>
                      {selectedPrestations.map((p) => {
                        const coiffeur = coiffeurs.find(c => c.id === p.coiffeur_id);
                        return (
                          <Fade key={p.id} in={true}>
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              mb: 1.5,
                              pb: 1.5,
                              borderBottom: '1px solid',
                              borderColor: 'divider'
                            }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.875rem' } }} noWrap>
                                    {p.libelle}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                                    {p.quantite} x {p.prix} FCFA
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', flexShrink: 0, fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                                  {p.prix * p.quantite} FCFA
                                </Typography>
                              </Box>
                              {coiffeur && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  mt: 0.5,
                                  p: 0.5,
                                  bgcolor: 'success.lighter',
                                  borderRadius: 0.5
                                }}>
                                  <ContentCut sx={{ fontSize: { xs: 12, md: 14 }, color: 'success.main' }} />
                                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500, fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                                    {coiffeur.prenom} {coiffeur.nom}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Fade>
                        );
                      })}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Sous-total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>Sous-total</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        {calculateSubtotal} FCFA
                      </Typography>
                    </Box>

                    {/* Section Remise */}
                    {!fidelityInfo?.est_gratuit && (
                      <Box sx={{ mb: 2, p: { xs: 1.5, md: 2 }, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                          <PercentOutlined sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                          Remise
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Type de remise</InputLabel>
                            <Select
                              value={remiseType}
                              onChange={(e) => {
                                setRemiseType(e.target.value);
                                setRemiseValue('');
                              }}
                              label="Type de remise"
                            >
                              <MenuItem value="aucune">Aucune remise</MenuItem>
                              <MenuItem value="pourcentage">Pourcentage (%)</MenuItem>
                              <MenuItem value="montant">Montant fixe (FCFA)</MenuItem>
                            </Select>
                          </FormControl>

                          {remiseType !== 'aucune' && (
                            <TextField
                              fullWidth
                              size="small"
                              label={remiseType === 'pourcentage' ? 'Pourcentage' : 'Montant'}
                              type="number"
                              value={remiseValue}
                              onChange={(e) => setRemiseValue(e.target.value)}
                              placeholder={remiseType === 'pourcentage' ? '0-100' : '0'}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    {remiseType === 'pourcentage' ? '%' : 'FCFA'}
                                  </InputAdornment>
                                ),
                              }}
                            />
                          )}
                        </Box>

                        {remiseType !== 'aucune' && calculateRemise > 0 && (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'warning.main'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                              Remise appliquée
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                              - {calculateRemise} FCFA
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Montant après remise */}
                    {remiseType !== 'aucune' && calculateRemise > 0 && !fidelityInfo?.est_gratuit && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 2,
                        p: { xs: 1, md: 1.5 },
                        bgcolor: 'success.lighter',
                        borderRadius: 1
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          Montant après remise
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          {calculateTotal} FCFA
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Mode de paiement */}
                    {!fidelityInfo?.est_gratuit && (
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                          <InputLabel>Mode de paiement</InputLabel>
                          <Select
                            value={modePaiement}
                            onChange={(e) => setModePaiement(e.target.value)}
                            label="Mode de paiement"
                            startAdornment={
                              <InputAdornment position="start">
                                {paymentIcons[modePaiement]}
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="especes">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoney />
                                Espèces
                              </Box>
                            </MenuItem>
                            <MenuItem value="mobile_money">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneAndroid />
                                Mobile Money
                              </Box>
                            </MenuItem>
                            <MenuItem value="carte">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CreditCard />
                                Carte bancaire
                              </Box>
                            </MenuItem>
                            <MenuItem value="autre">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Description />
                                Autre
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          {!isTablet && (
            <Button onClick={handleCloseDialog} size="large">
              Annuler
            </Button>
          )}
          <Button 
            onClick={handleCreatePassageAndPayment} 
            variant="contained"
            disabled={selectedPrestations.length === 0 || creatingPassage}
            size="large"
            fullWidth={isMobile}
            startIcon={creatingPassage ? <CircularProgress size={20} color="inherit" /> : <Receipt />}
            sx={{
              minWidth: { sm: 250 },
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
          >
            {creatingPassage 
              ? 'Traitement en cours...' 
              : fidelityInfo?.est_gratuit 
                ? 'Valider le passage gratuit'
                : 'Confirmer et générer le reçu'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Zoom}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <Warning />
            Confirmer la suppression
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Attention : Cette action est irréversible !
            </Typography>
            <Typography variant="body2">
              La suppression d'un passage réduira automatiquement le nombre total de passages du client.
            </Typography>
          </Alert>

          {deleteDialog.passageInfo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Détails du passage :
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">N° Passage :</Typography>
                  <Chip label={`#${deleteDialog.passageInfo.numero}`} size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Client :</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {deleteDialog.passageInfo.client?.prenom} {deleteDialog.passageInfo.client?.nom}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Date :</Typography>
                  <Typography variant="body2">
                    {format(new Date(deleteDialog.passageInfo.date), 'dd MMM yyyy', { locale: fr })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Type :</Typography>
                  <Chip 
                    label={deleteDialog.passageInfo.est_gratuit ? "Gratuit" : "Payant"}
                    color={deleteDialog.passageInfo.est_gratuit ? "success" : "primary"}
                    size="small"
                  />
                </Box>
              </Stack>
            </Box>
          )}

          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Êtes-vous sûr de vouloir supprimer ce passage ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog} fullWidth={isMobile}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            fullWidth={isMobile}
            startIcon={<Delete />}
          >
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de félicitations pour passage gratuit */}
      <Dialog 
        open={showCongratulationsDialog} 
        onClose={() => {}} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            overflow: 'visible',
            borderRadius: { xs: 0, sm: 3 },
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: { xs: 4, md: 6 }, px: { xs: 2, md: 3 }, position: 'relative' }}>
          {/* Icône principale */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: -30, md: -40 },
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'white',
              borderRadius: '50%',
              width: { xs: 60, md: 80 },
              height: { xs: 60, md: 80 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <CheckCircle sx={{ fontSize: { xs: 40, md: 50 }, color: '#11998e' }} />
          </Box>

          <Zoom in={showCongratulationsDialog} timeout={600} style={{ transitionDelay: '200ms' }}>
            <Box sx={{ mt: { xs: 2, md: 4 } }}>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                Félicitations
              </Typography>
            </Box>
          </Zoom>

          <Fade in={showCongratulationsDialog} timeout={800} style={{ transitionDelay: '400ms' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, mb: 1 }}>
                {selectedClient?.prenom} {selectedClient?.nom}
              </Typography>
              {selectedClient?.code_client && (
                <Chip 
                  label={selectedClient.code_client}
                  sx={{ 
                    bgcolor: 'white',
                    color: '#11998e',
                    fontWeight: 600,
                    mb: 1,
                  }}
                />
              )}
              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', my: 2, mx: 'auto', width: '60%' }} />
            </Box>
          </Fade>

          <Fade in={showCongratulationsDialog} timeout={800} style={{ transitionDelay: '600ms' }}>
            <Box sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 2, 
              p: { xs: 2, md: 3 }, 
              mb: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <CardGiftcard sx={{ fontSize: { xs: 28, md: 32 }, color: 'white' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  Passage Gratuit
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                Votre fidélité est récompensée aujourd'hui
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', letterSpacing: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Ce passage ne vous sera pas facturé
              </Typography>
            </Box>
          </Fade>

          <Fade in={showCongratulationsDialog} timeout={800} style={{ transitionDelay: '800ms' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: { xs: 1.5, md: 2 },
            }}>
              <Loyalty sx={{ fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="body1" sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                Merci pour votre confiance continue
              </Typography>
            </Box>
          </Fade>

          <style>
            {`
              @keyframes pulse {
                0%, 100% { 
                  transform: translateX(-50%) scale(1);
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }
                50% { 
                  transform: translateX(-50%) scale(1.05);
                  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
                }
              }
            `}
          </style>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'center' }}>
          <Button 
            onClick={handleCongratulationsConfirm} 
            variant="contained"
            size="large"
            fullWidth={isMobile}
            sx={{
              bgcolor: 'white',
              color: '#11998e',
              fontWeight: 700,
              px: { xs: 4, md: 6 },
              py: 1.5,
              fontSize: '1rem',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                bgcolor: '#f8f8f8',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
              },
              transition: 'all 0.3s ease',
            }}
            startIcon={<ArrowForward />}
          >
            Continuer
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