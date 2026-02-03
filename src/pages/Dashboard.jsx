import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  People,
  AttachMoney,
  TrendingUp,
  ContentCut,
  ArrowUpward,
  ArrowDownward,
  Schedule,
  LocalAtm,
  CardGiftcard,
  PersonAdd,
  Refresh,
  CalendarToday,
} from '@mui/icons-material';
import { statsAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Carte de statistique améliorée avec animation
const StatCard = ({ title, value, icon, color, subtitle, trend, delay = 0 }) => {
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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
                  {trend && (
                    trend > 0 ? 
                      <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} /> : 
                      <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />
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

// Carte de passage avec design amélioré
const PassageCard = ({ passage, index }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          p: 2.5,
          borderRadius: 2,
          background: passage.est_gratuit 
            ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.15)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
          border: `1px solid ${passage.est_gratuit ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.divider, 0.5)}`,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateX(8px)',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
            border: `1px solid ${passage.est_gratuit ? theme.palette.success.main : theme.palette.primary.main}`,
          }
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              bgcolor: passage.est_gratuit ? 'success.main' : 'primary.main',
              width: 48,
              height: 48,
              fontWeight: 700,
            }}
          >
            {passage.client?.prenom?.charAt(0)}{passage.client?.nom?.charAt(0)}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {passage.client?.prenom} {passage.client?.nom}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {passage.prestations?.map(p => p.libelle).join(', ') || 'Sans prestation'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {new Date(passage.date_passage).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ textAlign: 'right' }}>
          {passage.est_gratuit ? (
            <Chip 
              icon={<CardGiftcard />}
              label="GRATUIT" 
              color="success" 
              sx={{ 
                fontWeight: 700,
                fontSize: '0.875rem',
                height: 36,
              }}
            />
          ) : (
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800,
                color: 'primary.main',
                textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              {new Intl.NumberFormat('fr-FR').format(passage.montant_total)} <span style={{ fontSize: '0.7em' }}>FCFA</span>
            </Typography>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
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
      setRefreshing(false);
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
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Chargement du tableau de bord...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête avec titre et actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
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
              Tableau de bord
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Actualiser les données">
            <IconButton 
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Refresh sx={{ 
                color: 'primary.main',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Statistiques principales avec animations décalées */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Clients Total"
            value={stats?.global?.total_clients || 0}
            icon={<People />}
            color="primary"
            subtitle={`+${stats?.mois?.nouveaux_clients || 0} ce mois`}
            trend={1}
            delay={0}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="CA du jour"
            value={`${formatCurrency(stats?.aujourdhui?.ca)}`}
            icon={<AttachMoney />}
            color="success"
            subtitle={`${stats?.aujourdhui?.clients || 0} clients servis`}
            trend={1}
            delay={0.1}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Passages du jour"
            value={stats?.aujourdhui?.passages || 0}
            icon={<ContentCut />}
            color="info"
            subtitle={`${stats?.mois?.passages || 0} ce mois`}
            trend={1}
            delay={0.2}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="CA du mois"
            value={`${formatCurrency(stats?.mois?.ca)}`}
            icon={<TrendingUp />}
            color="warning"
            subtitle="Mois en cours"
            delay={0.3}
          />
        </Grid>

        {/* Section des derniers passages */}
        <Grid item xs={12} lg={7}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Derniers passages
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${stats?.derniers_passages?.length || 0} récents`}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                
                <AnimatePresence>
                  {stats?.derniers_passages && stats.derniers_passages.length > 0 ? (
                    stats.derniers_passages.slice(0, 5).map((passage, index) => (
                      <PassageCard key={index} passage={passage} index={index} />
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <ContentCut sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucun passage récent
                      </Typography>
                      <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                        Les passages apparaîtront ici
                      </Typography>
                    </Box>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Statistiques détaillées */}
        <Grid item xs={12} lg={5}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box 
                    sx={{ 
                      width: 4, 
                      height: 32, 
                      bgcolor: 'secondary.main',
                      borderRadius: 2,
                    }} 
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Vue d'ensemble
                  </Typography>
                </Box>
                
                {/* Statistiques globales */}
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Performance globale
                  </Typography>
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Total clients
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {stats?.global?.total_clients || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ContentCut sx={{ fontSize: 20, color: 'info.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Total prestations
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {stats?.global?.total_prestations || 0}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalAtm sx={{ fontSize: 20, color: 'success.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          CA total
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrency(stats?.global?.ca_total)} FCFA
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Statistiques du mois */}
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Ce mois
                  </Typography>
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonAdd sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Nouveaux clients
                        </Typography>
                      </Box>
                      <Chip 
                        label={stats?.mois?.nouveaux_clients || 0}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ContentCut sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Passages
                        </Typography>
                      </Box>
                      <Chip 
                        label={stats?.mois?.passages || 0}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2, borderColor: alpha(theme.palette.primary.main, 0.2) }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Chiffre d'affaires
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatCurrency(stats?.mois?.ca)} FCFA
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  ); 
};

export default Dashboard;