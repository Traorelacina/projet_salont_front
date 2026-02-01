import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  AttachMoney,
  TrendingUp,
  ContentCut,
} from '@mui/icons-material';
import { statsAPI } from '../services/api';

const StatCard = ({ title, value, icon, color, subtitle }) => (
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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await statsAPI.dashboard();
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Erreur lors du chargement des données');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Tableau de bord
      </Typography>

      <Grid container spacing={3}>
        {/* Statistiques principales */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clients Total"
            value={stats?.global?.total_clients || 0}
            icon={<People />}
            color="primary"
            subtitle={`+${stats?.mois?.nouveaux_clients || 0} ce mois`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CA du jour"
            value={`${formatCurrency(stats?.aujourdhui?.ca)} FCFA`}
            icon={<AttachMoney />}
            color="success"
            subtitle={`${stats?.aujourdhui?.clients || 0} clients`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Passages du jour"
            value={stats?.aujourdhui?.passages || 0}
            icon={<ContentCut />}
            color="info"
            subtitle={`${stats?.mois?.passages || 0} ce mois`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CA du mois"
            value={`${formatCurrency(stats?.mois?.ca)} FCFA`}
            icon={<TrendingUp />}
            color="warning"
            subtitle="Mois en cours"
          />
        </Grid>

        {/* Derniers passages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Derniers passages
              </Typography>
              {stats?.derniers_passages && stats.derniers_passages.length > 0 ? (
                stats.derniers_passages.slice(0, 5).map((passage, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {passage.client?.prenom} {passage.client?.nom}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {passage.prestations?.map(p => p.libelle).join(', ') || 'Sans prestation'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(passage.date_passage).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography 
                        variant="h6" 
                        color={passage.est_gratuit ? "success.main" : "primary.main"} 
                        sx={{ fontWeight: 700 }}
                      >
                        {passage.est_gratuit ? 'GRATUIT' : `${formatCurrency(passage.montant_total)} FCFA`}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Aucun passage récent
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques globales */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Statistiques globales
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total clients
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats?.global?.total_clients || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total prestations
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats?.global?.total_prestations || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    CA total
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }} color="success.main">
                    {formatCurrency(stats?.global?.ca_total)} FCFA
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Ce mois
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nouveaux clients
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats?.mois?.nouveaux_clients || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Passages
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats?.mois?.passages || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Chiffre d'affaires
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }} color="primary.main">
                    {formatCurrency(stats?.mois?.ca)} FCFA
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;