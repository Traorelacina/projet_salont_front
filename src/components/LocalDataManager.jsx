// components/LocalDataManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  DeleteForever,
  Storage,
  Warning,
  Info,
} from '@mui/icons-material';
import { 
  offlineClients, 
  offlinePassages, 
  offlinePaiements,
  syncQueue,
  getOfflineStats 
} from '../services/offlineStorage';

const LocalDataManager = ({ open, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (open) {
      loadStats();
    }
  }, [open]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const offlineStats = await getOfflineStats();
      setStats(offlineStats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des statistiques' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnsyncedClients = async () => {
    if (!window.confirm('Supprimer tous les clients non synchronisés ? Cette action est irréversible.')) {
      return;
    }

    try {
      setDeleting(true);
      const allClients = await offlineClients.getAll();
      const unsyncedClients = allClients.filter(c => !c.synced);
      
      let deleted = 0;
      let totalPassages = 0;
      
      // ✅ Supprimer chaque client individuellement
      for (const client of unsyncedClients) {
        try {
          const result = await offlineClients.delete(client.id);
          deleted++;
          totalPassages += result.passages_deleted || 0;
        } catch (err) {
          console.error(`Erreur suppression client ${client.id}:`, err);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `${deleted} client(s) et ${totalPassages} passage(s) supprimé(s)` 
      });
      
      await loadStats();
    } catch (error) {
      console.error('Erreur suppression clients:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression: ' + error.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteUnsyncedPassages = async () => {
    if (!window.confirm('Supprimer tous les passages non synchronisés ? Cette action est irréversible.')) {
      return;
    }

    try {
      setDeleting(true);
      const allPassages = await offlinePassages.getAll();
      const unsyncedPassages = allPassages.filter(p => !p.synced);
      
      let deleted = 0;
      
      // ✅ Supprimer chaque passage individuellement
      for (const passage of unsyncedPassages) {
        try {
          await offlinePassages.delete(passage.id);
          deleted++;
        } catch (err) {
          console.error(`Erreur suppression passage ${passage.id}:`, err);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `${deleted} passage(s) non synchronisé(s) supprimé(s)` 
      });
      
      await loadStats();
    } catch (error) {
      console.error('Erreur suppression passages:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression: ' + error.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleClearSyncQueue = async () => {
    if (!window.confirm('Vider la file de synchronisation ? Les données locales seront conservées mais ne seront plus synchronisées.')) {
      return;
    }

    try {
      setDeleting(true);
      await syncQueue.clear();
      
      setMessage({ 
        type: 'success', 
        text: 'File de synchronisation vidée' 
      });
      
      await loadStats();
    } catch (error) {
      console.error('Erreur vidage file:', error);
      setMessage({ type: 'error', text: 'Erreur lors du vidage' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllLocalData = async () => {
    if (!window.confirm('⚠️ ATTENTION ! Supprimer TOUTES les données locales ? Cette action est DÉFINITIVE et IRRÉVERSIBLE !')) {
      return;
    }

    if (!window.confirm('Êtes-vous VRAIMENT sûr ? Toutes vos données non synchronisées seront PERDUES !')) {
      return;
    }

    try {
      setDeleting(true);
      
      let totalClients = 0;
      let totalPassages = 0;
      
      // ✅ Supprimer tous les clients un par un
      const allClients = await offlineClients.getAll();
      for (const client of allClients) {
        try {
          const result = await offlineClients.delete(client.id);
          totalClients++;
          totalPassages += result.passages_deleted || 0;
        } catch (err) {
          console.error(`Erreur suppression client ${client.id}:`, err);
        }
      }
      
      // ✅ Supprimer tous les passages restants (au cas où)
      const remainingPassages = await offlinePassages.getAll();
      for (const passage of remainingPassages) {
        try {
          await offlinePassages.delete(passage.id);
        } catch (err) {
          console.error(`Erreur suppression passage ${passage.id}:`, err);
        }
      }
      
      // Vider la file de sync
      await syncQueue.clear();
      
      setMessage({ 
        type: 'success', 
        text: `Toutes les données ont été supprimées: ${totalClients} client(s), ${totalPassages} passage(s)` 
      });
      
      await loadStats();
    } catch (error) {
      console.error('Erreur suppression totale:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression totale: ' + error.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Storage />
        Gestion des données locales
      </DialogTitle>
      
      <DialogContent>
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Statistiques */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Clients stockés localement"
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={`Total: ${stats?.total_clients || 0}`}
                          size="small"
                          color="primary"
                        />
                        <Chip 
                          label={`Non synchronisés: ${stats?.clients_non_synced || 0}`}
                          size="small"
                          color="warning"
                        />
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Passages stockés localement"
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={`Total: ${stats?.total_passages || 0}`}
                          size="small"
                          color="primary"
                        />
                        <Chip 
                          label={`Non synchronisés: ${stats?.passages_non_synced || 0}`}
                          size="small"
                          color="warning"
                        />
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="File de synchronisation"
                    secondary={
                      <Chip 
                        label={`${stats?.pending_sync || 0} élément(s) en attente`}
                        size="small"
                        color={stats?.pending_sync > 0 ? "error" : "success"}
                      />
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Actions de nettoyage
              </Typography>
              
              <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
                Les données <strong>synchronisées</strong> ne seront pas supprimées, 
                elles restent sur le serveur.
              </Alert>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Supprimer les clients non synchronisés"
                    secondary={`${stats?.clients_non_synced || 0} client(s) concerné(s)`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Delete />}
                      onClick={handleDeleteUnsyncedClients}
                      disabled={deleting || !stats?.clients_non_synced}
                    >
                      Supprimer
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Supprimer les passages non synchronisés"
                    secondary={`${stats?.passages_non_synced || 0} passage(s) concerné(s)`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Delete />}
                      onClick={handleDeleteUnsyncedPassages}
                      disabled={deleting || !stats?.passages_non_synced}
                    >
                      Supprimer
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Vider la file de synchronisation"
                    secondary={`${stats?.pending_sync || 0} élément(s) en attente`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Delete />}
                      onClick={handleClearSyncQueue}
                      disabled={deleting || !stats?.pending_sync}
                    >
                      Vider
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Alert severity="error" icon={<Warning />} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ⚠️ DANGER - Action définitive
                </Typography>
                <Typography variant="caption">
                  Supprime TOUTES les données locales, synchronisées ou non.
                  Les données sur le serveur ne seront pas affectées.
                </Typography>
              </Alert>

              <Button
                variant="contained"
                color="error"
                fullWidth
                startIcon={<DeleteForever />}
                onClick={handleDeleteAllLocalData}
                disabled={deleting}
              >
                Supprimer TOUTES les données locales
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocalDataManager;