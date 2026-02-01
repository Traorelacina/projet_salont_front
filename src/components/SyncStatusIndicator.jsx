import React from 'react';
import { useSyncContext } from '../contexts/SyncContext';
import { 
  CloudOff, 
  Cloud, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

const SyncStatusIndicator = () => {
  const { isOnline, isSyncing, syncStats, lastSyncError, forceSync } = useSyncContext();

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-500';
    if (isSyncing) return 'bg-blue-500';
    if (lastSyncError) return 'bg-red-500';
    if (syncStats.unsynced.total > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Hors ligne';
    if (isSyncing) return 'Synchronisation...';
    if (lastSyncError) return 'Erreur de sync';
    if (syncStats.unsynced.total > 0) return `${syncStats.unsynced.total} en attente`;
    return 'Synchronisé';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff className="w-4 h-4" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (lastSyncError) return <AlertCircle className="w-4 h-4" />;
    if (syncStats.unsynced.total > 0) return <Cloud className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
        {/* Statut principal */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`${getStatusColor()} rounded-full p-2 text-white`}>
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{getStatusText()}</div>
            <div className="text-xs text-gray-500">
              Dernière sync: {formatDate(syncStats.lastSync)}
            </div>
          </div>
          {isOnline && !isSyncing && (
            <button
              onClick={forceSync}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Synchroniser maintenant"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Détails des données non synchronisées */}
        {syncStats.unsynced.total > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="text-sm font-medium text-gray-700">En attente de synchronisation:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {syncStats.unsynced.clients > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Clients:</span>
                  <span className="font-semibold text-gray-900">{syncStats.unsynced.clients}</span>
                </div>
              )}
              {syncStats.unsynced.prestations > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Prestations:</span>
                  <span className="font-semibold text-gray-900">{syncStats.unsynced.prestations}</span>
                </div>
              )}
              {syncStats.unsynced.passages > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Passages:</span>
                  <span className="font-semibold text-gray-900">{syncStats.unsynced.passages}</span>
                </div>
              )}
              {syncStats.unsynced.paiements > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paiements:</span>
                  <span className="font-semibold text-gray-900">{syncStats.unsynced.paiements}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Erreur de synchronisation */}
        {lastSyncError && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-600">
                {lastSyncError.message || 'Erreur de synchronisation'}
              </div>
            </div>
          </div>
        )}

        {/* Mode hors ligne */}
        {!isOnline && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-start gap-2">
              <CloudOff className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                Mode hors ligne activé. Vos modifications seront synchronisées lors du retour de connexion.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;