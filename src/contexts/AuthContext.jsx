// contexts/AuthContext.jsx (correction ligne 92)
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { 
  storeLocalAuth, 
  getLocalAuth, 
  offlineLogin, 
  syncOfflineUsers, 
  hasOfflineSessions, // CORRIGÉ ICI
  getLastSyncTime,
  clearLocalAuth,
  canLoginOffline 
} from '../services/localAuth';

// Gestionnaire réseau simplifié
const networkManager = {
  getStatus: () => navigator.onLine,
  addListener: (callback) => {
    const onlineHandler = () => callback('online', true);
    const offlineHandler = () => callback('offline', false);
    
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(networkManager.getStatus());
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  // Surveiller la connexion réseau
  useEffect(() => {
    const handleNetworkChange = (event, status) => {
      setIsOnline(status);
      
      if (status && user) {
        synchronizeOfflineData();
      }
    };

    const unsubscribe = networkManager.addListener(handleNetworkChange);
    return unsubscribe;
  }, [user]);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (isOnline) {
        // Essayer de valider avec le serveur
        try {
          const response = await authAPI.me();
          const userData = response.data.data;
          
          // Stocker pour usage hors ligne
          await storeLocalAuth(userData, token);
          setUser(userData);
          setOfflineMode(false);
          
          // Synchroniser les utilisateurs pour le mode hors ligne
          await syncUsersForOffline();
        } catch (serverError) {
          // Si le serveur échoue, utiliser l'authentification locale
          console.log('Serveur inaccessible, utilisation des données locales...');
          const localAuth = await getLocalAuth();
          if (localAuth && localAuth.token === token) {
            setUser({ ...localAuth.user, offline: true });
            setOfflineMode(true);
          } else {
            await clearLocalAuth();
          }
        }
      } else {
        // Mode hors ligne - utiliser l'authentification locale
        const localAuth = await getLocalAuth();
        if (localAuth && localAuth.token === token) {
          setUser({ ...localAuth.user, offline: true });
          setOfflineMode(true);
        } else {
          await clearLocalAuth();
        }
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      await clearLocalAuth();
    } finally {
      setLoading(false);
    }
  };

  const syncUsersForOffline = async () => {
    try {
      if (!isOnline) return;
      
      const hasSessions = hasOfflineSessions(); // CORRIGÉ ICI
      const lastSync = await getLastSyncTime();
      
      // Synchroniser seulement si jamais fait ou si > 24h
      if (!hasSessions || (lastSync && (Date.now() - new Date(lastSync).getTime()) > 24 * 60 * 60 * 1000)) {
        try {
          const response = await authAPI.getOfflineUsers();
          await syncOfflineUsers(response.data.data);
          console.log('Utilisateurs synchronisés pour mode hors ligne');
        } catch (syncError) {
          console.warn('Impossible de synchroniser les utilisateurs, utilisation des sessions locales');
        }
      }
    } catch (error) {
      console.error('Erreur synchronisation utilisateurs:', error);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    
    try {
      if (isOnline) {
        // Connexion normale
        try {
          const response = await authAPI.login(credentials);
          const { token, user: userData } = response.data.data;
          
          // Stocker pour usage hors ligne
          await storeLocalAuth(userData, token);
          
          setUser(userData);
          setOfflineMode(false);
          
          return { 
            success: true, 
            message: 'Connexion réussie',
            offline: false
          };
        } catch (onlineError) {
          // Si la connexion en ligne échoue, vérifier si on peut se connecter hors ligne
          if (canLoginOffline(credentials.email)) {
            console.log('Serveur inaccessible, tentative de connexion hors ligne...');
            const result = await offlineLogin(credentials);
            
            if (result.success) {
              setUser(result.user);
              setOfflineMode(true);
            }
            
            return result;
          } else {
            return {
              success: false,
              error: 'Serveur inaccessible et aucune session locale trouvée',
              code: 'SERVER_UNAVAILABLE'
            };
          }
        }
      } else {
        // Mode hors ligne - utiliser les sessions locales
        const result = await offlineLogin(credentials);
        
        if (result.success) {
          setUser(result.user);
          setOfflineMode(true);
        }
        
        return result;
      }
      
    } catch (error) {
      console.error('Erreur login:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur de connexion',
        code: 'LOGIN_ERROR'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isOnline && !offlineMode) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      await clearLocalAuth();
      setUser(null);
      setOfflineMode(false);
    }
  };

  const synchronizeOfflineData = useCallback(async () => {
    if (!isOnline || !user) return;
    
    setSyncStatus('syncing');
    try {
      await syncUsersForOffline();
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      setSyncStatus('error');
    }
  }, [isOnline, user]);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isOnline,
    offlineMode,
    syncStatus,
    synchronizeOfflineData,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};