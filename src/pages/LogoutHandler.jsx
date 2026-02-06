// pages/LogoutHandler.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clearLocalAuth } from '../services/localAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

const LogoutHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';

  useEffect(() => {
    const handleLogout = async () => {
      // Attendre un peu pour que l'utilisateur voie le message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Garder les sessions hors ligne si c'est juste une expiration
      if (sessionExpired) {
        const sessionsStr = localStorage.getItem('salon_user_sessions');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('salon_auth_data');
        
        if (sessionsStr) {
          localStorage.setItem('salon_user_sessions', sessionsStr);
        }
      } else {
        // Déconnexion normale - tout nettoyer
        await clearLocalAuth();
        localStorage.removeItem('salon_user_sessions');
        localStorage.removeItem('offline_queue');
        localStorage.removeItem('users_last_sync');
      }
      
      // Rediriger vers login
      navigate('/login', { replace: true });
    };

    handleLogout();
  }, [navigate, sessionExpired]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
        {sessionExpired ? 'Session expirée' : 'Déconnexion'}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Redirection vers la page de connexion...
      </Typography>
    </Box>
  );
};

export default LogoutHandler;