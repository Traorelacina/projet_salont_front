// components/OfflineSyncIndicator.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  CloudOff,
  CloudDone,
  Sync,
  CloudQueue,
  CheckCircle,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';
import { networkManager } from '../services/networkManager';
import { syncService } from '../services/syncservice';
import { syncQueue, getOfflineStats } from '../services/offlineStorage';

const OfflineSyncIndicator = () => {
  const [isOnline, setIsOnline] = useState(networkManager.getStatus());
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    pendingCount: 0,
  });
  const [stats, setStats] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const offlineStats = await getOfflineStats();
      setStats(offlineStats);
      
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  useEffect(() => {
    // Écouter les changements de statut réseau
    const unsubscribeNetwork = networkManager.subscribe((status) => {
      setIsOnline(status);
      
      if (status) {
        setNotification({
          open: true,
          message: 'Connexion rétablie - Synchronisation automatique...',
          severity: 'success',
        });
      } else {
        setNotification({
          open: true,
          message: 'Mode hors ligne activé',
          severity: 'warning',
        });
      }
    });

    // Charger les stats initiales
    loadStats();

    // Rafraîchir les stats toutes les 10 secondes
    const statsInterval = setInterval(loadStats, 10000);

    // Démarrer la synchronisation automatique
    const stopAutoSync = syncService.startAutoSync(5); // Toutes les 5 minutes

    return () => {
      unsubscribeNetwork();
      clearInterval(statsInterval);
      stopAutoSync();
    };
  }, []);

  // Synchroniser manuellement
  const handleSyncNow = async () => {
    if (!isOnline) {
      setNotification({
        open: true,
        message: 'Impossible de synchroniser - Pas de connexion internet',
        severity: 'error',
      });
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      
      const result = await syncService.syncAll();
      
      if (result.success) {
        setNotification({
          open: true,
          message: result.message || 'Synchronisation réussie',
          severity: 'success',
        });
        
        await loadStats();
      } else {
        setNotification({
          open: true,
          message: result.message || 'Erreur lors de la synchronisation',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Erreur sync:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la synchronisation',
        severity: 'error',
      });
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenDetails = () => {
    setDetailsOpen(true);
    loadStats();
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  // Déterminer l'icône et la couleur en fonction du statut
  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <Sync sx={{ animation: 'spin 1s linear infinite' }} />;
    }
    if (!isOnline) {
      return <CloudOff />;
    }
    if (syncStatus.pendingCount > 0) {
      return <CloudQueue />;
    }
    return <CloudDone />;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'warning';
    if (syncStatus.pendingCount > 0) return 'info';
    return 'success';
  };

  const getStatusLabel = () => {
    if (syncStatus.isSyncing) return 'Synchronisation...';
    if (!isOnline) return 'Hors ligne';
    if (syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} en attente`;
    return 'Synchronisé';
  };

  return (
    <>
      {/* Indicateur principal */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={getStatusLabel()}>
          <Badge badgeContent={syncStatus.pendingCount} color="primary">
            <Chip
              icon={getStatusIcon()}
              label={getStatusLabel()}
              color={getStatusColor()}
              size="small"
              onClick={handleOpenDetails}
              sx={{ cursor: 'pointer' }}
            />
          </Badge>
        </Tooltip>

        {isOnline && syncStatus.pendingCount > 0 && (
          <Tooltip title="Synchroniser maintenant">
            <IconButton
              size="small"
              onClick={handleSyncNow}
              disabled={syncStatus.isSyncing}
              color="primary"
            >
              {syncStatus.isSyncing ? (
                <CircularProgress size={20} />
              ) : (
                <Sync />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Dialogue de détails */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            Statut de synchronisation
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {syncStatus.isSyncing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Synchronisation en cours...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          <List>
            <ListItem>
              <ListItemText
                primary="État de la connexion"
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {isOnline ? (
                      <>
                        <CheckCircle color="success" fontSize="small" />
                        <Typography variant="body2" color="success.main">
                          En ligne
                        </Typography>
                      </>
                    ) : (
                      <>
                        <ErrorIcon color="warning" fontSize="small" />
                        <Typography variant="body2" color="warning.main">
                          Hors ligne
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Données en attente de synchronisation"
                secondary={`${syncStatus.pendingCount} élément(s)`}
              />
            </ListItem>

            {stats && (
              <>
                <ListItem>
                  <ListItemText
                    primary="Clients locaux"
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Total: {stats.total_clients}
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          Non synchronisés: {stats.clients_non_synced}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Passages locaux"
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Total: {stats.total_passages}
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          Non synchronisés: {stats.passages_non_synced}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </>
            )}
          </List>

          {!isOnline && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Les données sont sauvegardées localement et seront automatiquement synchronisées 
              une fois la connexion rétablie.
            </Alert>
          )}

          {isOnline && syncStatus.pendingCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Vous avez {syncStatus.pendingCount} donnée(s) en attente de synchronisation.
              Cliquez sur "Synchroniser" pour les envoyer au serveur.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Fermer
          </Button>
          {isOnline && syncStatus.pendingCount > 0 && (
            <Button
              onClick={handleSyncNow}
              variant="contained"
              disabled={syncStatus.isSyncing}
              startIcon={syncStatus.isSyncing ? <CircularProgress size={20} /> : <Sync />}
            >
              Synchroniser maintenant
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
};

export default OfflineSyncIndicator;
