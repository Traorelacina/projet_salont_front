import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import syncService from '../services/syncService';
import { initDB } from '../services/db';

// Contexte de synchronisation
const SyncContext = createContext();

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext doit être utilisé dans un SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    unsynced: {
      clients: 0,
      prestations: 0,
      passages: 0,
      paiements: 0,
      total: 0,
    },
    queueSize: 0,
    lastSync: null,
    recentLogs: [],
  });
  const [lastSyncError, setLastSyncError] = useState(null);

  // Initialiser IndexedDB au démarrage
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        console.log('IndexedDB initialisée avec succès');
        await updateSyncStats();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation d\'IndexedDB:', error);
      }
    };

    initialize();
  }, []);

  // Mettre à jour les statistiques de synchronisation
  const updateSyncStats = useCallback(async () => {
    try {
      const stats = await syncService.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des stats de sync:', error);
    }
  }, []);

  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleSyncEvent = (event) => {
      switch (event.type) {
        case 'sync_start':
          setIsSyncing(true);
          setLastSyncError(null);
          break;
        case 'sync_end':
          setIsSyncing(false);
          updateSyncStats();
          break;
        case 'sync_success':
          setLastSyncError(null);
          break;
        case 'sync_error':
          setLastSyncError(event.error);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        default:
          break;
      }
    };

    syncService.addListener(handleSyncEvent);

    // Démarrer la synchronisation automatique
    syncService.startAutoSync(5); // Toutes les 5 minutes

    return () => {
      syncService.stopAutoSync();
    };
  }, [updateSyncStats]);

  // Écouter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connexion rétablie');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connexion perdue - mode hors ligne');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Forcer une synchronisation manuelle
  const forceSync = useCallback(async () => {
    try {
      await syncService.sync();
      await updateSyncStats();
    } catch (error) {
      console.error('Erreur lors de la synchronisation forcée:', error);
      setLastSyncError(error);
    }
  }, [updateSyncStats]);

  const value = {
    isOnline,
    isSyncing,
    syncStats,
    lastSyncError,
    forceSync,
    updateSyncStats,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export default SyncProvider;