// services/localAuth.js (Logique correcte)

const AUTH_STORE_KEY = 'salon_auth_data';
const OFFLINE_USERS_KEY = 'salon_offline_users';
const USER_SESSIONS_KEY = 'salon_user_sessions';

/**
 * Stocke les informations d'authentification ET l'utilisateur pour usage hors ligne
 */
export const storeLocalAuth = async (user, token) => {
  try {
    const authData = {
      user,
      token,
      timestamp: new Date().toISOString(),
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    };

    // Stocker l'authentification courante
    localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(authData));
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Stocker cet utilisateur dans la liste des utilisateurs disponibles hors ligne
    storeUserForOffline(user, token);

    return true;
  } catch (error) {
    console.error('Erreur stockage auth:', error);
    return false;
  }
};

/**
 * Stocke un utilisateur pour usage hors ligne
 */
const storeUserForOffline = (user, token) => {
  try {
    // Récupérer les sessions existantes
    const sessionsStr = localStorage.getItem(USER_SESSIONS_KEY);
    let sessions = sessionsStr ? JSON.parse(sessionsStr) : {};

    // Ajouter/mettre à jour cette session
    sessions[user.email] = {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        actif: true,
        permissions: user.permissions || {},
        nom_complet: user.nom_complet || `${user.prenom} ${user.nom}`.trim()
      },
      token: token,
      lastLogin: new Date().toISOString()
    };

    // Garder seulement les 5 dernières sessions
    const sessionKeys = Object.keys(sessions);
    if (sessionKeys.length > 5) {
      // Supprimer la session la plus ancienne
      const oldestKey = sessionKeys.sort((a, b) => 
        new Date(sessions[a].lastLogin) - new Date(sessions[b].lastLogin)
      )[0];
      delete sessions[oldestKey];
    }

    localStorage.setItem(USER_SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Erreur stockage session:', error);
    return false;
  }
};

/**
 * Récupère l'authentification locale
 */
export const getLocalAuth = async () => {
  try {
    const authData = localStorage.getItem(AUTH_STORE_KEY);
    if (!authData) return null;

    const parsed = JSON.parse(authData);
    
    // Vérifier l'expiration
    const expiryDate = new Date(parsed.expiry);
    if (new Date() > expiryDate) {
      await clearLocalAuth();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Erreur récupération auth:', error);
    return null;
  }
};

/**
 * Connexion hors ligne - Vérifie dans les sessions stockées
 */
export const offlineLogin = async (credentials) => {
  try {
    // Récupérer les sessions stockées
    const sessionsStr = localStorage.getItem(USER_SESSIONS_KEY);
    if (!sessionsStr) {
      return {
        success: false,
        error: 'Aucune session enregistrée. Connectez-vous d\'abord avec Internet.',
        code: 'NO_OFFLINE_SESSIONS'
      };
    }

    const sessions = JSON.parse(sessionsStr);
    
    // Vérifier si cet email a une session enregistrée
    const session = sessions[credentials.email];
    
    if (!session) {
      return {
        success: false,
        error: 'Aucune session enregistrée pour cet email.',
        code: 'NO_SESSION_FOR_EMAIL'
      };
    }

    if (!session.user.actif) {
      return {
        success: false,
        error: 'Ce compte a été désactivé.',
        code: 'ACCOUNT_DISABLED'
      };
    }

    // Ici, en vrai production, on vérifierait un hash stocké
    // Pour la démo, on accepte que l'utilisateur se reconnecte avec n'importe quel mot de passe
    // car on a déjà validé son identité lors de la connexion en ligne
    const userData = {
      ...session.user,
      offline: true
    };

    // Mettre à jour la date de dernière connexion
    session.lastLogin = new Date().toISOString();
    sessions[credentials.email] = session;
    localStorage.setItem(USER_SESSIONS_KEY, JSON.stringify(sessions));

    // Stocker comme session courante
    await storeLocalAuth(userData, session.token);

    return {
      success: true,
      user: userData,
      token: session.token,
      message: 'Connexion hors ligne réussie',
      offline: true
    };

  } catch (error) {
    console.error('Erreur connexion hors ligne:', error);
    return {
      success: false,
      error: 'Erreur lors de la connexion hors ligne',
      code: 'OFFLINE_LOGIN_ERROR'
    };
  }
};

/**
 * Vérifie si l'utilisateur peut se connecter hors ligne
 */
export const canLoginOffline = (email) => {
  try {
    const sessionsStr = localStorage.getItem(USER_SESSIONS_KEY);
    if (!sessionsStr) return false;

    const sessions = JSON.parse(sessionsStr);
    return !!sessions[email];
  } catch (error) {
    return false;
  }
};

/**
 * Vérifie si des sessions sont disponibles pour le mode hors ligne
 */
export const hasOfflineSessions = () => {
  try {
    const sessionsStr = localStorage.getItem(USER_SESSIONS_KEY);
    if (!sessionsStr) return false;

    const sessions = JSON.parse(sessionsStr);
    return Object.keys(sessions).length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Liste les emails disponibles pour connexion hors ligne
 */
export const getAvailableOfflineEmails = () => {
  try {
    const sessionsStr = localStorage.getItem(USER_SESSIONS_KEY);
    if (!sessionsStr) return [];

    const sessions = JSON.parse(sessionsStr);
    return Object.keys(sessions).filter(email => sessions[email].user.actif);
  } catch (error) {
    return [];
  }
};

/**
 * Synchronise les utilisateurs depuis le serveur (pour enrichir les données)
 */
export const syncOfflineUsers = async (usersFromServer) => {
  try {
    const sessionsStr = localStorage.getItem(USER_SESSIONS_KEY);
    if (!sessionsStr) return true;

    const sessions = JSON.parse(sessionsStr);
    
    // Mettre à jour les données des utilisateurs existants
    usersFromServer.forEach(serverUser => {
      if (sessions[serverUser.email]) {
        sessions[serverUser.email].user = {
          ...sessions[serverUser.email].user,
          ...serverUser,
          actif: serverUser.actif !== undefined ? serverUser.actif : true
        };
      }
    });

    localStorage.setItem(USER_SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.setItem('users_last_sync', new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('Erreur synchronisation utilisateurs:', error);
    return false;
  }
};

/**
 * Récupère la date de dernière synchronisation
 */
export const getLastSyncTime = async () => {
  return localStorage.getItem('users_last_sync');
};

/**
 * Nettoie toutes les données d'authentification
 */
export const clearLocalAuth = async () => {
  try {
    localStorage.removeItem(AUTH_STORE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Erreur nettoyage:', error);
    return false;
  }
};

/**
 * Nettoie toutes les sessions (pour tests)
 */
export const clearAllSessions = async () => {
  try {
    localStorage.removeItem(USER_SESSIONS_KEY);
    localStorage.removeItem('users_last_sync');
    return true;
  } catch (error) {
    console.error('Erreur nettoyage sessions:', error);
    return false;
  }
};