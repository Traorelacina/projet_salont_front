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
} from '@mui/material';
import {
  TrendingUp,
  People,
  AttachMoney,
  ContentCut,
  Assessment,
} from '@mui/icons-material';
import { statsAPI } from '../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.lighter`,
          }}
        >
          {React.cloneElement(icon, {
            sx: { fontSize: 28, color: `${color}.main` },
          })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Statistiques = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // État pour les différents rapports
  const [rapportJournalier, setRapportJournalier] = useState(null);
  const [rapportPeriode, setRapportPeriode] = useState(null);
  const [rapportPrestations, setRapportPrestations] = useState(null);
  const [rapportFidelite, setRapportFidelite] = useState(null);

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
      // CORRECTION : Passer un objet avec les paramètres
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    
    // Charger les données selon l'onglet
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

  // Onglet Rapport Journalier
  const renderRapportJournalier = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          type="date"
          label="Date"
          value={dateJournaliere}
          onChange={(e) => setDateJournaliere(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={() => loadRapportJournalier(dateJournaliere)}>
          Générer le rapport
        </Button>
      </Box>

      {rapportJournalier && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clients du jour"
                value={rapportJournalier.resume?.nombre_clients || 0}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Chiffre d'affaires"
                value={`${formatCurrency(rapportJournalier.resume?.chiffre_affaires)} FCFA`}
                icon={<AttachMoney />}
                color="success"
                subtitle="Encaissé"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Passages gratuits"
                value={rapportJournalier.resume?.nombre_passages_gratuits || 0}
                icon={<ContentCut />}
                color="warning"
                subtitle={`${formatCurrency(rapportJournalier.resume?.valeur_gratuites)} FCFA`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Théorique"
                value={`${formatCurrency(rapportJournalier.resume?.chiffre_affaires_theorique)} FCFA`}
                icon={<TrendingUp />}
                color="info"
                subtitle="Total + gratuits"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Répartition par prestation
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Prestation</TableCell>
                          <TableCell align="center">Nombre</TableCell>
                          <TableCell align="right">Montant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rapportJournalier.repartition_prestations?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.libelle}</TableCell>
                            <TableCell align="center">{item.nombre}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.montant)} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                        {!rapportJournalier.repartition_prestations?.length && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              Aucune prestation ce jour
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Répartition par mode de paiement
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mode</TableCell>
                          <TableCell align="right">Montant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rapportJournalier.repartition_paiements?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ textTransform: 'capitalize' }}>
                              {item.mode_paiement?.replace('_', ' ')}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.total)} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                        {!rapportJournalier.repartition_paiements?.length && (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              Aucun paiement ce jour
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  // Onglet Rapport de Période
  const renderRapportPeriode = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          type="date"
          label="Date début"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="Date fin"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={loadRapportPeriode}>
          Générer le rapport
        </Button>
      </Box>

      {rapportPeriode && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clients uniques"
                value={rapportPeriode.resume?.nombre_clients_uniques || 0}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total passages"
                value={rapportPeriode.resume?.total_passages || 0}
                icon={<ContentCut />}
                color="info"
                subtitle={`${rapportPeriode.resume?.total_passages_gratuits || 0} gratuits`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Total"
                value={`${formatCurrency(rapportPeriode.resume?.chiffre_affaires_total)} FCFA`}
                icon={<AttachMoney />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="CA Moyen/jour"
                value={`${formatCurrency(rapportPeriode.evolution_ca?.reduce((sum, item) => sum + parseFloat(item.montant || 0), 0) / (rapportPeriode.evolution_ca?.length || 1))} FCFA`}
                icon={<TrendingUp />}
                color="warning"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Évolution du CA
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="center">Paiements</TableCell>
                          <TableCell align="right">Montant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rapportPeriode.evolution_ca?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {format(new Date(item.date), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell align="center">{item.nombre_paiements}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {formatCurrency(item.montant)} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Top 10 clients
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Client</TableCell>
                          <TableCell align="center">Passages</TableCell>
                          <TableCell align="right">CA</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rapportPeriode.top_clients?.map((client, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {client.nom_complet}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {client.telephone}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">{client.nombre_passages}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {formatCurrency(client.chiffre_affaires)} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                        {!rapportPeriode.top_clients?.length && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              Aucun client sur cette période
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  // Onglet Prestations
  const renderRapportPrestations = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          type="date"
          label="Date début"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="Date fin"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={loadRapportPrestations}>
          Générer le rapport
        </Button>
      </Box>

      {rapportPrestations && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Statistiques des prestations
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Prestation</TableCell>
                    <TableCell align="center">Prix actuel</TableCell>
                    <TableCell align="center">Utilisations</TableCell>
                    <TableCell align="right">Revenu total</TableCell>
                    <TableCell align="right">Revenu moyen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rapportPrestations.map((prestation, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {prestation.libelle}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(prestation.prix_actuel)} FCFA
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={prestation.nombre_utilisations} 
                          size="small" 
                          color={prestation.nombre_utilisations > 0 ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(prestation.revenu_total)} FCFA
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(prestation.revenu_moyen)} FCFA
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rapportPrestations.length && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aucune prestation trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Onglet Fidélité
  const renderRapportFidelite = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" onClick={loadRapportFidelite}>
          Actualiser les données
        </Button>
      </Box>

      {rapportFidelite && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total clients"
                value={rapportFidelite.total_clients || 0}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Nouveaux (30j)"
                value={rapportFidelite.nouveaux_clients_30j || 0}
                icon={<People />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clients fidèles"
                value={rapportFidelite.clients_fideles?.length || 0}
                icon={<TrendingUp />}
                color="warning"
                subtitle="10+ passages"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Actifs"
                value={rapportFidelite.repartition_passages?.reduce((sum, item) => sum + item.nombre_clients, 0) || 0}
                icon={<Assessment />}
                color="info"
                subtitle="Avec passages"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Répartition par nombre de passages
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tranche</TableCell>
                          <TableCell align="right">Nombre de clients</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rapportFidelite.repartition_passages?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={`${item.tranche} passages`} 
                                size="small"
                                color={item.tranche === '20+' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {item.nombre_clients}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Top 20 clients fidèles
                  </Typography>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Client</TableCell>
                          <TableCell align="center">Passages</TableCell>
                          <TableCell align="right">CA Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rapportFidelite.clients_fideles?.map((client, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {client.nom_complet}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {client.telephone}
                              </Typography>
                              {client.derniere_visite && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Dernière visite: {client.derniere_visite}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={client.nombre_passages} 
                                size="small" 
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {formatCurrency(client.chiffre_affaires_total)} FCFA
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Statistiques et Rapports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Rapport Journalier" />
          <Tab label="Rapport de Période" />
          <Tab label="Prestations" />
          <Tab label="Fidélité" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && renderRapportJournalier()}
          {tabValue === 1 && renderRapportPeriode()}
          {tabValue === 2 && renderRapportPrestations()}
          {tabValue === 3 && renderRapportFidelite()}
        </>
      )}
    </Box>
  );
};

export default Statistiques;