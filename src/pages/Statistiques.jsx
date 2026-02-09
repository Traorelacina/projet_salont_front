import React, { useEffect, useState } from 'react';
import {
  Box,
  Card, 
  CardContent,
  Typography,
  Grid,
  Tab,
  Tabs,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp,
  People,
  AttachMoney,
  ContentCut,
  Assessment,
  CalendarToday,
  Refresh,
  FileDownload,
  ArrowUpward,
  ArrowDownward,
  AccountBalance,
  CreditCard,
  LocalAtm,
  CardGiftcard,
  Star,
  EmojiEvents,
  PersonAdd,
  WorkOutline,
} from '@mui/icons-material';
import { statsAPI } from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

// Carte de statistique améliorée avec animation
const StatCard = ({ title, value, subtitle, icon, color, trend, delay = 0 }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.15)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${alpha(theme.palette[color].main, 0.25)}`,
            border: `1px solid ${alpha(theme.palette[color].main, 0.3)}`,
          }
        }}
      >
        {/* Cercle décoratif en arrière-plan */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette[color].main, 0.2)} 0%, transparent 70%)`,
          }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                color="text.secondary" 
                variant="body2" 
                gutterBottom
                sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {title}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: `${color}.main` }}>
                {value}
              </Typography>
              {subtitle && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  {trend !== undefined && (
                    trend > 0 ? 
                      <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} /> : 
                      trend < 0 ? 
                      <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} /> : null
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {subtitle}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: `${color}.main`,
                boxShadow: `0 4px 14px ${alpha(theme.palette[color].main, 0.4)}`,
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Tableau amélioré avec animations
const AnimatedTable = ({ children, title, subtitle, exportable, exportData, exportTitle }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleExport = async () => {
    if (!exportData) {
      setSnackbar({
        open: true,
        message: 'Aucune donnée à exporter',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    
    try {
      exportToExcel(exportData, exportTitle || title);
      setSnackbar({
        open: true,
        message: 'Export Excel terminé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'exportation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data, fileName) => {
    // Convertir les données en format Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    
    // Générer le fichier Excel
    XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    width: 4, 
                    height: 32, 
                    bgcolor: 'primary.main',
                    borderRadius: 2,
                  }} 
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                      {subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {exportable && (
                <Tooltip title="Exporter en Excel">
                  <IconButton
                    onClick={handleExport}
                    disabled={loading}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : <FileDownload />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {children}
          </CardContent>
        </Card>
      </motion.div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

const Statistiques = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  
  // État pour les différents rapports
  const [rapportJournalier, setRapportJournalier] = useState(null);
  const [rapportPeriode, setRapportPeriode] = useState(null);
  const [rapportPrestations, setRapportPrestations] = useState(null);
  const [rapportFidelite, setRapportFidelite] = useState(null);
  const [rapportCoiffeurs, setRapportCoiffeurs] = useState(null);

  // Dates pour les filtres
  const [dateJournaliere, setDateJournaliere] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateDebut, setDateDebut] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await loadRapportJournalier();
  };

  const loadRapportJournalier = async (date = dateJournaliere) => {
    setLoading(true);
    setError('');
    try {
      const response = await statsAPI.daily(date);
      if (response.data.success) {
        setRapportJournalier(response.data.data);
      }
    } catch (error) {
      console.error('Error loading daily report:', error);
      setError('Erreur lors du chargement du rapport journalier');
    } finally {
      setLoading(false);
    }
  };

  const loadRapportPeriode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await statsAPI.period(dateDebut, dateFin);
      if (response.data.success) {
        setRapportPeriode(response.data.data);
      }
    } catch (error) {
      console.error('Error loading period report:', error);
      setError('Erreur lors du chargement du rapport de période');
    } finally {
      setLoading(false);
    }
  };

  const loadRapportPrestations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await statsAPI.prestations({ 
        date_debut: dateDebut, 
        date_fin: dateFin 
      });
      
      if (response.data.success) {
        setRapportPrestations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading services report:', error);
      setError('Erreur lors du chargement du rapport des prestations');
    } finally {
      setLoading(false);
    }
  };

  const loadRapportFidelite = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await statsAPI.fidelity();
      if (response.data.success) {
        setRapportFidelite(response.data.data);
      }
    } catch (error) {
      console.error('Error loading loyalty report:', error);
      setError('Erreur lors du chargement du rapport de fidélité');
    } finally {
      setLoading(false);
    }
  };

  const loadRapportCoiffeurs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await statsAPI.coiffeurs({
        date_debut: dateDebut,
        date_fin: dateFin
      });
      
      if (response.data.success) {
        setRapportCoiffeurs(response.data.data);
      }
    } catch (error) {
      console.error('Error loading barbers stats:', error);
      setError('Erreur lors du chargement des statistiques des coiffeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    
    switch (newValue) {
      case 0:
        if (!rapportJournalier) loadRapportJournalier();
        break;
      case 1:
        if (!rapportPeriode) loadRapportPeriode();
        break;
      case 2:
        if (!rapportPrestations) loadRapportPrestations();
        break;
      case 3:
        if (!rapportFidelite) loadRapportFidelite();
        break;
      case 4:
        if (!rapportCoiffeurs) loadRapportCoiffeurs();
        break;
      default:
        break;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Fonction d'exportation globale
  const handleExportGlobal = async () => {
    setExportLoading(true);
    try {
      let data = [];
      let title = '';
      
      switch (tabValue) {
        case 0: // Journalier
          if (rapportJournalier) {
            data = [
              { 'Statistique': 'Clients du jour', 'Valeur': rapportJournalier.resume?.nombre_clients || 0 },
              { 'Statistique': 'Chiffre d\'affaires', 'Valeur': `${formatCurrency(rapportJournalier.resume?.chiffre_affaires)} FCFA` },
              { 'Statistique': 'Passages gratuits', 'Valeur': rapportJournalier.resume?.nombre_passages_gratuits || 0 },
              { 'Statistique': 'CA Théorique', 'Valeur': `${formatCurrency(rapportJournalier.resume?.chiffre_affaires_theorique)} FCFA` },
              ...(rapportJournalier.repartition_prestations || []).map(item => ({
                'Prestation': item.libelle,
                'Nombre': item.nombre,
                'Montant': `${formatCurrency(item.montant)} FCFA`
              })),
              ...(rapportJournalier.repartition_paiements || []).map(item => ({
                'Mode de paiement': item.mode_paiement?.replace('_', ' '),
                'Montant': `${formatCurrency(item.total)} FCFA`
              }))
            ];
            title = `Rapport_Journalier_${dateJournaliere}`;
          }
          break;
          
        case 1: // Période
          if (rapportPeriode) {
            data = [
              { 'Statistique': 'Clients uniques', 'Valeur': rapportPeriode.resume?.nombre_clients_uniques || 0 },
              { 'Statistique': 'Total passages', 'Valeur': rapportPeriode.resume?.total_passages || 0 },
              { 'Statistique': 'CA Total', 'Valeur': `${formatCurrency(rapportPeriode.resume?.chiffre_affaires_total)} FCFA` },
              ...(rapportPeriode.evolution_ca || []).map(item => ({
                'Date': new Date(item.date).toLocaleDateString('fr-FR'),
                'Nombre paiements': item.nombre_paiements,
                'Montant': `${formatCurrency(item.montant)} FCFA`
              })),
              ...(rapportPeriode.top_clients || []).map((client, index) => ({
                'Rang': index + 1,
                'Client': client.nom_complet,
                'Téléphone': client.telephone,
                'Passages': client.nombre_passages,
                'Chiffre d\'affaires': `${formatCurrency(client.chiffre_affaires)} FCFA`
              }))
            ];
            title = `Rapport_Periode_${dateDebut}_${dateFin}`;
          }
          break;
          
        case 2: // Prestations
          if (rapportPrestations) {
            data = (rapportPrestations || []).map(prestation => ({
              'Prestation': prestation.libelle,
              'Prix actuel': `${formatCurrency(prestation.prix_actuel)} FCFA`,
              'Utilisations': prestation.nombre_utilisations,
              'Revenu total': `${formatCurrency(prestation.revenu_total)} FCFA`,
              'Revenu moyen': `${formatCurrency(prestation.revenu_moyen)} FCFA`
            }));
            title = `Statistiques_Prestations_${dateDebut}_${dateFin}`;
          }
          break;
          
        case 3: // Fidélité
          if (rapportFidelite) {
            data = [
              { 'Statistique': 'Total clients', 'Valeur': rapportFidelite.total_clients || 0 },
              { 'Statistique': 'Nouveaux (30j)', 'Valeur': rapportFidelite.nouveaux_clients_30j || 0 },
              { 'Statistique': 'Clients fidèles', 'Valeur': rapportFidelite.clients_fideles?.length || 0 },
              ...(rapportFidelite.repartition_passages || []).map(item => ({
                'Tranche': `${item.tranche} passages`,
                'Nombre de clients': item.nombre_clients
              })),
              ...(rapportFidelite.clients_fideles || []).map((client, index) => ({
                'Rang': index + 1,
                'Client': client.nom_complet,
                'Téléphone': client.telephone,
                'Passages': client.nombre_passages,
                'CA Total': `${formatCurrency(client.chiffre_affaires_total)} FCFA`,
                'Dernière visite': client.derniere_visite || 'N/A'
              }))
            ];
            const currentDate = new Date().toISOString().split('T')[0];
            title = `Rapport_Fidelite_${currentDate}`;
          }
          break;
          
        case 4: // Coiffeurs
          if (rapportCoiffeurs) {
            data = (rapportCoiffeurs || []).map(coiffeur => ({
              'Coiffeur': `${coiffeur.prenom} ${coiffeur.nom}`,
              'Prestations réalisées': coiffeur.nombre_prestations,
              'Clients uniques': coiffeur.nombre_clients_uniques,
              'CA généré': `${formatCurrency(coiffeur.chiffre_affaires_genere)} FCFA`,
              'CA moyen': `${formatCurrency(coiffeur.chiffre_affaires_moyen)} FCFA`
            }));
            title = `Statistiques_Coiffeurs_${dateDebut}_${dateFin}`;
          }
          break;
      }
      
      if (data.length > 0) {
        exportToExcel(data, title);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Erreur lors de l\'exportation des données');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = (data, fileName) => {
    // Convertir les données en format Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    
    // Générer le fichier Excel
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Onglet Rapport Journalier
  const renderRapportJournalier = () => (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          mb: 3, 
          p: 2.5, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <CalendarToday sx={{ color: 'primary.main' }} />
            <TextField
              type="date"
              label="Date"
              value={dateJournaliere}
              onChange={(e) => setDateJournaliere(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <Button 
              variant="contained" 
              onClick={() => loadRapportJournalier(dateJournaliere)}
              startIcon={<Assessment />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              Générer le rapport
            </Button>
          </Box>
          
          <Button 
            variant="outlined"
            onClick={handleExportGlobal}
            startIcon={<FileDownload />}
            disabled={!rapportJournalier || exportLoading}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {exportLoading ? <CircularProgress size={20} /> : 'Exporter en Excel'}
          </Button>
        </Box>
      </motion.div>

      {rapportJournalier && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clients du jour"
                value={rapportJournalier.resume?.nombre_clients || 0}
                icon={<People />}
                color="primary"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Chiffre d'affaires"
                value={`${formatCurrency(rapportJournalier.resume?.chiffre_affaires)}`}
                icon={<AttachMoney />}
                color="success"
                subtitle="FCFA Encaissé"
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Passages gratuits"
                value={rapportJournalier.resume?.nombre_passages_gratuits || 0}
                icon={<CardGiftcard />}
                color="warning"
                subtitle={`${formatCurrency(rapportJournalier.resume?.valeur_gratuites)} FCFA`}
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Théorique"
                value={`${formatCurrency(rapportJournalier.resume?.chiffre_affaires_theorique)}`}
                icon={<TrendingUp />}
                color="info"
                subtitle="FCFA Total + gratuits"
                delay={0.3}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <AnimatedTable 
                title="Répartition par prestation"
                exportable
                exportData={rapportJournalier.repartition_prestations?.map(item => ({
                  'Prestation': item.libelle,
                  'Nombre': item.nombre,
                  'Montant': `${formatCurrency(item.montant)} FCFA`
                }))}
                exportTitle={`Repartition_Prestations_${dateJournaliere}`}
              >
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Prestation</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Nombre</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Montant</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rapportJournalier.repartition_prestations?.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.libelle}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={item.nombre} 
                              size="small" 
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {formatCurrency(item.montant)} FCFA
                            </Typography>
                          </TableCell>
                        </motion.tr>
                      ))}
                      {!rapportJournalier.repartition_prestations?.length && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                            <ContentCut sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary">
                              Aucune prestation ce jour
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AnimatedTable>
            </Grid>

            <Grid item xs={12} md={6}>
              <AnimatedTable 
                title="Répartition par mode de paiement"
                exportable
                exportData={rapportJournalier.repartition_paiements?.map(item => ({
                  'Mode de paiement': item.mode_paiement?.replace('_', ' '),
                  'Montant': `${formatCurrency(item.total)} FCFA`
                }))}
                exportTitle={`Repartition_Paiements_${dateJournaliere}`}
              >
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Montant</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rapportJournalier.repartition_paiements?.map((item, index) => {
                        const icons = {
                          especes: <LocalAtm />,
                          mobile_money: <CreditCard />,
                          carte_bancaire: <AccountBalance />,
                        };
                        
                        return (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            component={TableRow}
                            sx={{
                              '&:hover': {
                                bgcolor: alpha(theme.palette.success.main, 0.05),
                              }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {icons[item.mode_paiement] || <CreditCard />}
                                <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                  {item.mode_paiement?.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {formatCurrency(item.total)} FCFA
                              </Typography>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                      {!rapportJournalier.repartition_paiements?.length && (
                        <TableRow>
                          <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                            <AttachMoney sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary">
                              Aucun paiement ce jour
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AnimatedTable>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  // Onglet Rapport de Période
  const renderRapportPeriode = () => (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          mb: 3, 
          p: 2.5, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <CalendarToday sx={{ color: 'primary.main' }} />
            <TextField
              type="date"
              label="Date début"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              type="date"
              label="Date fin"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <Button 
              variant="contained" 
              onClick={loadRapportPeriode}
              startIcon={<Assessment />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              Générer le rapport
            </Button>
          </Box>
          
          <Button 
            variant="outlined"
            onClick={handleExportGlobal}
            startIcon={<FileDownload />}
            disabled={!rapportPeriode || exportLoading}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {exportLoading ? <CircularProgress size={20} /> : 'Exporter en Excel'}
          </Button>
        </Box>
      </motion.div>

      {rapportPeriode && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clients uniques"
                value={rapportPeriode.resume?.nombre_clients_uniques || 0}
                icon={<People />}
                color="primary"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total passages"
                value={rapportPeriode.resume?.total_passages || 0}
                icon={<ContentCut />}
                color="info"
                subtitle={`${rapportPeriode.resume?.total_passages_gratuits || 0} gratuits`}
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Total"
                value={`${formatCurrency(rapportPeriode.resume?.chiffre_affaires_total)}`}
                icon={<AttachMoney />}
                color="success"
                subtitle="FCFA"
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Moyen/jour"
                value={`${formatCurrency(rapportPeriode.evolution_ca?.reduce((sum, item) => sum + parseFloat(item.montant || 0), 0) / (rapportPeriode.evolution_ca?.length || 1))}`}
                icon={<TrendingUp />}
                color="warning"
                subtitle="FCFA"
                delay={0.3}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <AnimatedTable 
                title="Évolution du CA" 
                subtitle="Par jour"
                exportable
                exportData={rapportPeriode.evolution_ca?.map(item => ({
                  'Date': format(new Date(item.date), 'dd/MM/yyyy', { locale: fr }),
                  'Nombre paiements': item.nombre_paiements,
                  'Montant': `${formatCurrency(item.montant)} FCFA`
                }))}
                exportTitle={`Evolution_CA_${dateDebut}_${dateFin}`}
              >
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Paiements</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Montant</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rapportPeriode.evolution_ca?.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.success.main, 0.05),
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {format(new Date(item.date), 'dd/MM/yyyy', { locale: fr })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={item.nombre_paiements} 
                              size="small" 
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {formatCurrency(item.montant)} FCFA
                            </Typography>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AnimatedTable>
            </Grid>

            <Grid item xs={12} md={6}>
              <AnimatedTable 
                title="Top 10 clients" 
                subtitle="Meilleurs clients de la période"
                exportable
                exportData={rapportPeriode.top_clients?.map((client, index) => ({
                  'Rang': index + 1,
                  'Client': client.nom_complet,
                  'Téléphone': client.telephone,
                  'Passages': client.nombre_passages,
                  'Chiffre d\'affaires': `${formatCurrency(client.chiffre_affaires)} FCFA`
                }))}
                exportTitle={`Top_Clients_${dateDebut}_${dateFin}`}
              >
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Passages</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>CA</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rapportPeriode.top_clients?.map((client, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                                  width: 36,
                                  height: 36,
                                  fontSize: '0.875rem',
                                  fontWeight: 700,
                                }}
                              >
                                {index < 3 ? <EmojiEvents sx={{ fontSize: 18 }} /> : `${client.nom_complet.charAt(0)}${client.nom_complet.split(' ')[1]?.charAt(0) || ''}`}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {client.nom_complet}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {client.telephone}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={client.nombre_passages} 
                              size="small" 
                              color={index < 3 ? "warning" : "default"}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {formatCurrency(client.chiffre_affaires)} FCFA
                            </Typography>
                          </TableCell>
                        </motion.tr>
                      ))}
                      {!rapportPeriode.top_clients?.length && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                            <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary">
                              Aucun client sur cette période
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AnimatedTable>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  // Onglet Prestations
  const renderRapportPrestations = () => (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          mb: 3, 
          p: 2.5, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <CalendarToday sx={{ color: 'primary.main' }} />
            <TextField
              type="date"
              label="Date début"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              type="date"
              label="Date fin"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <Button 
              variant="contained" 
              onClick={loadRapportPrestations}
              startIcon={<Assessment />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              Générer le rapport
            </Button>
          </Box>
          
          <Button 
            variant="outlined"
            onClick={handleExportGlobal}
            startIcon={<FileDownload />}
            disabled={!rapportPrestations || exportLoading}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {exportLoading ? <CircularProgress size={20} /> : 'Exporter en Excel'}
          </Button>
        </Box>
      </motion.div>

      {rapportPrestations && (
        <AnimatedTable 
          title="Statistiques des prestations" 
          subtitle={`${rapportPrestations.length} prestations`}
          exportable
          exportData={rapportPrestations.map(prestation => ({
            'Prestation': prestation.libelle,
            'Prix actuel': `${formatCurrency(prestation.prix_actuel)} FCFA`,
            'Utilisations': prestation.nombre_utilisations,
            'Revenu total': `${formatCurrency(prestation.revenu_total)} FCFA`,
            'Revenu moyen': `${formatCurrency(prestation.revenu_moyen)} FCFA`
          }))}
          exportTitle={`Statistiques_Prestations_${dateDebut}_${dateFin}`}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Prestation</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Prix actuel</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Utilisations</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Revenu total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Revenu moyen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rapportPrestations.map((prestation, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    component={TableRow}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'scale(1.01)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: prestation.nombre_utilisations > 50 ? 'success.main' : 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          <ContentCut />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {prestation.libelle}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${formatCurrency(prestation.prix_actuel)} FCFA`}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={prestation.nombre_utilisations} 
                        size="small" 
                        color={prestation.nombre_utilisations > 0 ? "primary" : "default"}
                        sx={{ fontWeight: 700, minWidth: 50 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(prestation.revenu_total)} FCFA
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(prestation.revenu_moyen)} FCFA
                      </Typography>
                    </TableCell>
                  </motion.tr>
                ))}
                {!rapportPrestations.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <ContentCut sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucune prestation trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AnimatedTable>
      )}
    </Box>
  );

  // Onglet Fidélité
  const renderRapportFidelite = () => (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Button 
            variant="contained" 
            onClick={loadRapportFidelite}
            startIcon={<Refresh />}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            Actualiser les données
          </Button>
          
          <Button 
            variant="outlined"
            onClick={handleExportGlobal}
            startIcon={<FileDownload />}
            disabled={!rapportFidelite || exportLoading}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {exportLoading ? <CircularProgress size={20} /> : 'Exporter en Excel'}
          </Button>
        </Box>
      </motion.div>

      {rapportFidelite && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total clients"
                value={rapportFidelite.total_clients || 0}
                icon={<People />}
                color="primary"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Nouveaux (30j)"
                value={rapportFidelite.nouveaux_clients_30j || 0}
                icon={<PersonAdd />}
                color="success"
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clients fidèles"
                value={rapportFidelite.clients_fideles?.length || 0}
                icon={<Star />}
                color="warning"
                subtitle="10+ passages"
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Actifs"
                value={rapportFidelite.repartition_passages?.reduce((sum, item) => sum + item.nombre_clients, 0) || 0}
                icon={<TrendingUp />}
                color="info"
                subtitle="Avec passages"
                delay={0.3}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <AnimatedTable 
                title="Répartition par nombre de passages"
                exportable
                exportData={rapportFidelite.repartition_passages?.map(item => ({
                  'Tranche': `${item.tranche} passages`,
                  'Nombre de clients': item.nombre_clients
                }))}
                exportTitle={`Repartition_Passages_${format(new Date(), 'yyyy-MM-dd')}`}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Tranche</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Nombre de clients</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rapportFidelite.repartition_passages?.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.success.main, 0.05),
                            }
                          }}
                        >
                          <TableCell>
                            <Chip 
                              label={`${item.tranche} passages`} 
                              size="medium"
                              color={item.tranche === '20+' ? 'success' : item.tranche === '10-19' ? 'warning' : 'default'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {item.nombre_clients}
                            </Typography>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AnimatedTable>
            </Grid>

            <Grid item xs={12} md={6}>
              <AnimatedTable 
                title="Top 20 clients fidèles" 
                subtitle="Meilleurs clients par passages"
                exportable
                exportData={rapportFidelite.clients_fideles?.map((client, index) => ({
                  'Rang': index + 1,
                  'Client': client.nom_complet,
                  'Téléphone': client.telephone,
                  'Passages': client.nombre_passages,
                  'CA Total': `${formatCurrency(client.chiffre_affaires_total)} FCFA`,
                  'Dernière visite': client.derniere_visite
                }))}
                exportTitle={`Top_Fideles_${format(new Date(), 'yyyy-MM-dd')}`}
              >
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Passages</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>CA Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rapportFidelite.clients_fideles?.map((client, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          component={TableRow}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                                  width: 40,
                                  height: 40,
                                  fontWeight: 700,
                                }}
                              >
                                {index < 3 ? (
                                  <EmojiEvents sx={{ fontSize: 20 }} />
                                ) : (
                                  `${client.nom_complet.charAt(0)}${client.nom_complet.split(' ')[1]?.charAt(0) || ''}`
                                )}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {client.nom_complet}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {client.telephone}
                                </Typography>
                                {client.derniere_visite && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Dernière: {client.derniere_visite}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={client.nombre_passages} 
                              size="small" 
                              color={index < 3 ? "warning" : "primary"}
                              sx={{ fontWeight: 700, minWidth: 50 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {formatCurrency(client.chiffre_affaires_total)} FCFA
                            </Typography>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AnimatedTable>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  // Onglet Coiffeurs
  const renderRapportCoiffeurs = () => (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ 
          mb: 3, 
          p: 2.5, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <CalendarToday sx={{ color: 'primary.main' }} />
            <TextField
              type="date"
              label="Date début"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              type="date"
              label="Date fin"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <Button 
              variant="contained" 
              onClick={loadRapportCoiffeurs}
              startIcon={<Assessment />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              Générer le rapport
            </Button>
          </Box>
          
          <Button 
            variant="outlined"
            onClick={handleExportGlobal}
            startIcon={<FileDownload />}
            disabled={!rapportCoiffeurs || exportLoading}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {exportLoading ? <CircularProgress size={20} /> : 'Exporter en Excel'}
          </Button>
        </Box>
      </motion.div>

      {rapportCoiffeurs && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Coiffeurs actifs"
                value={rapportCoiffeurs.filter(c => c.nombre_prestations > 0).length}
                icon={<WorkOutline />}
                color="primary"
                subtitle="Sur la période"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total prestations"
                value={rapportCoiffeurs.reduce((sum, c) => sum + c.nombre_prestations, 0)}
                icon={<ContentCut />}
                color="info"
                subtitle="Toutes prestations"
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Total"
                value={`${formatCurrency(rapportCoiffeurs.reduce((sum, c) => sum + c.chiffre_affaires_genere, 0))}`}
                icon={<AttachMoney />}
                color="success"
                subtitle="FCFA"
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Moyenne/coiffeur"
                value={`${formatCurrency(rapportCoiffeurs.reduce((sum, c) => sum + c.chiffre_affaires_genere, 0) / Math.max(rapportCoiffeurs.filter(c => c.nombre_prestations > 0).length, 1))}`}
                icon={<TrendingUp />}
                color="warning"
                subtitle="FCFA"
                delay={0.3}
              />
            </Grid>
          </Grid>

          <AnimatedTable 
            title="Statistiques par coiffeur" 
            subtitle={`Performance de ${rapportCoiffeurs.length} coiffeur(s)`}
            exportable
            exportData={rapportCoiffeurs
              .sort((a, b) => b.chiffre_affaires_genere - a.chiffre_affaires_genere)
              .map((coiffeur, index) => ({
                'Rang': index + 1,
                'Coiffeur': `${coiffeur.prenom} ${coiffeur.nom}`,
                'Prestations réalisées': coiffeur.nombre_prestations,
                'Clients uniques': coiffeur.nombre_clients_uniques,
                'CA généré': `${formatCurrency(coiffeur.chiffre_affaires_genere)} FCFA`,
                'CA moyen': `${formatCurrency(coiffeur.chiffre_affaires_moyen)} FCFA`
              }))}
            exportTitle={`Statistiques_Coiffeurs_${dateDebut}_${dateFin}`}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Coiffeur</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Prestations</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Clients uniques</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>CA généré</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>CA moyen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rapportCoiffeurs
                    .sort((a, b) => b.chiffre_affaires_genere - a.chiffre_affaires_genere)
                    .map((coiffeur, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        component={TableRow}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'scale(1.01)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'info.main' : index === 2 ? 'error.main' : 'primary.main',
                                width: 48,
                                height: 48,
                                fontWeight: 700,
                              }}
                            >
                              {index < 3 ? (
                                <EmojiEvents sx={{ fontSize: 24 }} />
                              ) : (
                                `${coiffeur.prenom.charAt(0)}${coiffeur.nom.charAt(0)}`
                              )}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {coiffeur.prenom} {coiffeur.nom}
                              </Typography>
                              {index < 3 && (
                                <Chip 
                                  label={index === 0 ? "🥇 Meilleur" : index === 1 ? "🥈 2ème" : "🥉 3ème"}
                                  size="small"
                                  color={index === 0 ? "warning" : index === 1 ? "info" : "error"}
                                  sx={{ fontWeight: 600, mt: 0.5 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={coiffeur.nombre_prestations} 
                            size="small" 
                            color={coiffeur.nombre_prestations > 0 ? "primary" : "default"}
                            sx={{ fontWeight: 700, minWidth: 60 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={coiffeur.nombre_clients_uniques} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 600, minWidth: 60 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {formatCurrency(coiffeur.chiffre_affaires_genere)} FCFA
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(coiffeur.chiffre_affaires_moyen)} FCFA
                          </Typography>
                        </TableCell>
                      </motion.tr>
                    ))}
                  {!rapportCoiffeurs.length && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <WorkOutline sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Aucun coiffeur trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </AnimatedTable>
        </>
      )}
    </Box>
  );

  return (
    <Box>
      {/* En-tête avec titre et date */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          pb: 2,
          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              Statistiques et Rapports
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Analyse détaillée de votre activité
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        </motion.div>
      )}

      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
        borderRadius: '8px 8px 0 0',
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              minHeight: 64,
            },
            '& .Mui-selected': {
              color: 'primary.main',
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Rapport Journalier" icon={<CalendarToday />} iconPosition="start" />
          <Tab label="Rapport de Période" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Prestations" icon={<ContentCut />} iconPosition="start" />
          <Tab label="Fidélité" icon={<Star />} iconPosition="start" />
          <Tab label="Coiffeurs" icon={<WorkOutline />} iconPosition="start" />
        </Tabs>
      </Box>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Chargement des données...
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key={tabValue}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tabValue === 0 && renderRapportJournalier()}
            {tabValue === 1 && renderRapportPeriode()}
            {tabValue === 2 && renderRapportPrestations()}
            {tabValue === 3 && renderRapportFidelite()}
            {tabValue === 4 && renderRapportCoiffeurs()}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Statistiques;
