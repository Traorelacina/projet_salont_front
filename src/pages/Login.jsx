// pages/Login.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Snackbar,
  Chip,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  AccountCircle,
  Lock,
  WifiOff, 
  Wifi, 
  CloudSync,
  Store 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAvailableOfflineEmails, hasOfflineSessions } from '../services/localAuth';

// Gestionnaire réseau simple
const networkManager = {
  getStatus: () => navigator.onLine,
  addListener: (callback) => {
    window.addEventListener('online', () => callback('online'));
    window.addEventListener('offline', () => callback('offline'));
    return () => {
      window.removeEventListener('online', () => callback('online'));
      window.removeEventListener('offline', () => callback('offline'));
    };
  }
};

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(networkManager.getStatus());
  const [offlineAvailable, setOfflineAvailable] = useState(false);
  const [availableEmails, setAvailableEmails] = useState([]);
  const [showSyncNotification, setShowSyncNotification] = useState(false);
  const navigate = useNavigate();
  const { login, syncStatus } = useAuth();

  // Surveiller la connexion et vérifier les sessions disponibles
  useEffect(() => {
    const handleNetworkChange = () => {
      const online = networkManager.getStatus();
      setIsOnline(online);
      
      if (online) {
        setShowSyncNotification(true);
        setTimeout(() => setShowSyncNotification(false), 5000);
      }
    };

    const unsubscribe = networkManager.addListener(handleNetworkChange);
    
    // Vérifier les sessions disponibles
    const checkSessions = () => {
      const hasSessions = hasOfflineSessions();
      setOfflineAvailable(hasSessions);
      
      if (hasSessions) {
        const emails = getAvailableOfflineEmails();
        setAvailableEmails(emails);
      }
    };
    
    checkSessions();
    
    return unsubscribe;
  }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError('');
  };

  const handleEmailSelect = (email) => {
    setCredentials({ ...credentials, email });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.email.trim() || !credentials.password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(credentials);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Erreur de connexion');
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        p: 2,
      }}
    >
      {/* Indicateur réseau discret */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Chip
          icon={isOnline ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
          label={isOnline ? "En ligne" : "Hors ligne"}
          size="small"
          color={isOnline ? "success" : "warning"}
          variant="outlined"
          sx={{
            borderRadius: 2,
            borderWidth: 1,
            fontWeight: 500,
          }}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          maxWidth: 420,
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* En-tête */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '12px',
              backgroundColor: 'primary.main',
              mb: 3,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
            }}
          >
            <Store sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            mb: 1,
            color: 'text.primary',
            letterSpacing: '-0.5px'
          }}>
            Salon Pro
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mb: 2
          }}>
            Gestion complète de salon de coiffure
          </Typography>
          
          {/* Indicateur mode hors ligne discret */}
          {!isOnline && (
            <Chip
              icon={<WifiOff fontSize="small" />}
              label="Mode hors ligne"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Messages d'information */}
        {!isOnline && offlineAvailable && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'info.light',
              backgroundColor: 'info.50',
            }}
            icon={<CloudSync />}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Sessions locales disponibles
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Utilisez un compte précédemment connecté
            </Typography>
          </Alert>
        )}

        {!isOnline && !offlineAvailable && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'warning.light',
              backgroundColor: 'warning.50',
            }}
            icon={<WifiOff />}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Aucune session locale
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Connectez-vous d'abord avec Internet
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {/* Comptes disponibles */}
        {offlineAvailable && availableEmails.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 2 }}>
                COMPTES DISPONIBLES
              </Typography>
            </Divider>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {availableEmails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  size="small"
                  onClick={() => handleEmailSelect(email)}
                  variant={credentials.email === email ? "filled" : "outlined"}
                  sx={{ 
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Adresse email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleChange}
            required
            sx={{ mb: 2.5 }}
            autoComplete="email"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
            }}
            size="medium"
          />
          
          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={credentials.password}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
            autoComplete="current-password"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="medium"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || (!isOnline && !offlineAvailable)}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : !isOnline ? (
              'Connexion hors ligne'
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        {/* Pied de page */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ 
            color: 'text.secondary',
            display: 'block',
            textAlign: 'center'
          }}>
            Système offline-first • v1.0.0
          </Typography>
          <Typography variant="caption" sx={{ 
            color: 'text.disabled',
            display: 'block',
            textAlign: 'center',
            mt: 0.5
          }}>
            Connectez-vous une fois en ligne pour activer le mode hors ligne
          </Typography>
          <Typography variant="caption" sx={{ 
            color: 'text.disabled',
            display: 'block',
            textAlign: 'center',
            mt: 1
          }}>
            © {new Date().getFullYear()} Salon Pro. Tous droits réservés.
          </Typography>
        </Box>
      </Paper>

      {/* Notification de synchronisation */}
      <Snackbar
        open={showSyncNotification}
        autoHideDuration={4000}
        onClose={() => setShowSyncNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          icon={<CloudSync />}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Connexion rétablie
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Synchronisation des données en cours...
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;