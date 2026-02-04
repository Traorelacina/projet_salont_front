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
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  AvatarGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  Star,
  EmojiEvents,
  TrendingDown,
  Category,
  CheckCircle,
  Circle,
} from '@mui/icons-material';
import { statsAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Carte de statistique améliorée avec animation
const StatCard = ({ title, value, icon, color, subtitle, trend, delay = 0, onClick }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card 
        onClick={onClick}
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.15)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: onClick ? 'translateY(-4px)' : 'translateY(-2px)',
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
                sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}
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
                      <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} /> :
                      null
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        sx={{
          height: '100%',
          background: passage.est_gratuit 
            ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.15)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
          border: `1px solid ${passage.est_gratuit ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.divider, 0.5)}`,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            border: `1px solid ${passage.est_gratuit ? theme.palette.success.main : theme.palette.primary.main}`,
          }
        }}
      >
        <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* En-tête avec avatar centré */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: passage.est_gratuit ? 'success.main' : 'primary.main',
                width: 56,
                height: 56,
                fontWeight: 700,
                fontSize: '1.25rem',
                mb: 1.5,
              }}
            >
              {passage.client?.prenom?.charAt(0)}{passage.client?.nom?.charAt(0)}
            </Avatar>
            
            {/* Nom du client */}
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 700, 
                mb: 0.5, 
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {passage.client?.prenom} {passage.client?.nom}
            </Typography>

            {/* Montant ou Badge gratuit */}
            {passage.est_gratuit ? (
              <Chip 
                icon={<CardGiftcard sx={{ fontSize: 16 }} />}
                label="GRATUIT" 
                color="success" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 28,
                  mt: 0.5,
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800,
                    color: 'primary.main',
                    lineHeight: 1,
                  }}
                >
                  {new Intl.NumberFormat('fr-FR').format(passage.montant_total)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  FCFA
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Prestations - MODIFIÉ : Affichage en liste verticale */}
          <Box sx={{ mb: 2, flexGrow: 1 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 600, 
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                letterSpacing: 0.5,
                mb: 1.5,
                display: 'block',
              }}
            >
              Prestations
            </Typography>
            {passage.prestations && passage.prestations.length > 0 ? (
              <List dense sx={{ 
                p: 0, 
                maxHeight: 120,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: 4,
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.divider, 0.1),
                  borderRadius: 2,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 2,
                },
              }}>
                {passage.prestations.slice(0, 4).map((prestation, idx) => (
                  <ListItem 
                    key={idx}
                    sx={{ 
                      px: 0, 
                      py: 0.25,
                      display: 'flex',
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 20, mt: 0.25 }}>
                      <Circle sx={{ 
                        fontSize: 6, 
                        color: passage.est_gratuit ? 'success.main' : 'primary.main' 
                      }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.78rem',
                            lineHeight: 1.4,
                            color: 'text.primary',
                          }}
                        >
                          {prestation.libelle}
                        </Typography>
                      }
                      secondary={
                        prestation.coiffeur && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              display: 'block',
                              mt: 0.25,
                            }}
                          >
                            Par {prestation.coiffeur?.prenom} {prestation.coiffeur?.nom}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 2,
              }}>
                <ContentCut sx={{ 
                  fontSize: 32, 
                  color: 'text.disabled',
                  opacity: 0.5,
                  mb: 1,
                }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  Aucune prestation
                </Typography>
              </Box>
            )}
            {passage.prestations && passage.prestations.length > 4 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mt: 1,
                pt: 1,
                borderTop: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
              }}>
                <Typography 
                  variant="caption" 
                  color="primary.main"
                  sx={{ 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Circle sx={{ fontSize: 6 }} />
                  +{passage.prestations.length - 4} autre(s)
                </Typography>
              </Box>
            )}
          </Box>

          {/* Informations supplémentaires - Footer */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              pt: 1.5,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            {/* Date et heure */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Schedule sx={{ fontSize: 16, color: 'primary.main' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                  Date
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>
                  {new Date(passage.date_passage).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {new Date(passage.date_passage).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
            
            {/* Coiffeur principal */}
            {passage.prestations?.[0]?.coiffeur && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ContentCut sx={{ fontSize: 16, color: 'info.main' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                    Coiffeur principal
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>
                    {passage.prestations[0].coiffeur?.prenom} {passage.prestations[0].coiffeur?.nom}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Carte de classement des coiffeurs
const CoiffeurRankCard = ({ coiffeur, rank, index }) => {
  const theme = useTheme();
  const medalColors = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          mb: 1.5,
          borderRadius: 2,
          background: rank <= 3
            ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.main, 0.15)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
          border: `1px solid ${rank <= 3 ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.divider, 0.5)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateX(4px)',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
          }
        }}
      >
        {/* Rang */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: rank <= 3 ? medalColors[rank] : 'grey.300',
            color: rank <= 3 ? 'grey.900' : 'grey.700',
            fontWeight: 800,
            fontSize: '1.1rem',
            boxShadow: rank <= 3 ? `0 2px 8px ${alpha(medalColors[rank], 0.4)}` : 'none',
          }}
        >
          {rank <= 3 ? <EmojiEvents /> : rank}
        </Box>

        {/* Avatar et nom */}
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: 'primary.main',
            fontWeight: 700,
          }}
        >
          {coiffeur.nom?.charAt(0)}{coiffeur.prenom?.charAt(0)}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
            {coiffeur.prenom} {coiffeur.nom}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<ContentCut sx={{ fontSize: 14 }} />}
              label={`${coiffeur.total_passages || 0} passages`}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
            <Chip
              size="small"
              icon={<Category sx={{ fontSize: 14 }} />}
              label={`${coiffeur.nombre_prestations || 0} prestations`}
              color="info"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {new Intl.NumberFormat('fr-FR').format(coiffeur.ca_total || 0)} FCFA
            </Typography>
          </Box>
        </Box>

        {/* Badge performance */}
        {rank <= 3 && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(medalColors[rank], 0.2),
              border: `1px solid ${medalColors[rank]}`,
            }}
          >
            <Star sx={{ fontSize: 16, color: medalColors[rank] }} />
          </Box>
        )}
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

  // Préparer les données des coiffeurs pour le classement
  const topCoiffeurs = stats?.coiffeurs_stats?.slice(0, 5) || [];

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

        {/* Statistiques globales */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
                    Performance globale
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
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
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
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
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Statistiques du mois */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box 
                    sx={{ 
                      width: 4, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                    }} 
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Ce mois
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
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
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
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
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Top Coiffeurs */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box 
                    sx={{ 
                      width: 4, 
                      height: 32, 
                      bgcolor: 'warning.main',
                      borderRadius: 2,
                    }} 
                  />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Top Coiffeurs
                  </Typography>
                  <EmojiEvents sx={{ color: 'warning.main', ml: 'auto' }} />
                </Box>

                <Grid container spacing={2}>
                  {topCoiffeurs.length > 0 ? (
                    topCoiffeurs.map((coiffeur, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={2.4} key={coiffeur.id || index}>
                        <CoiffeurRankCard 
                          coiffeur={coiffeur} 
                          rank={index + 1}
                          index={index}
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <ContentCut sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Aucune donnée
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                          Les statistiques apparaîtront ici
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Section des derniers passages */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card 
              sx={{ 
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
                
                <Grid container spacing={2}>
                  <AnimatePresence>
                    {stats?.derniers_passages && stats.derniers_passages.length > 0 ? (
                      stats.derniers_passages.slice(0, 8).map((passage, index) => (
                        <Grid item xs={12} sm={6} lg={3} key={passage.id || index}>
                          <PassageCard passage={passage} index={index} />
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <ContentCut sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            Aucun passage récent
                          </Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                            Les passages apparaîtront ici
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </AnimatePresence>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  ); 
};

export default Dashboard;