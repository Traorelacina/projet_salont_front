// contexts/ThemeContext.js
import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

// Thème clair (actuel) - basé sur votre configuration existante
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2C3E50',
      light: '#34495E',
      dark: '#1A252F',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3498DB',
      light: '#5DADE2',
      dark: '#2874A6',
      contrastText: '#ffffff',
    },
    success: {
      main: '#27AE60',
      light: '#2ECC71',
      dark: '#1E8449',
    },
    error: {
      main: '#E74C3C',
      light: '#EC7063',
      dark: '#C0392B',
    },
    warning: {
      main: '#F39C12',
      light: '#F8C471',
      dark: '#D68910',
    },
    info: {
      main: '#3498DB',
      light: '#5DADE2',
      dark: '#2874A6',
    },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#2C3E50',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#2C3E50',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#2C3E50',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#2C3E50',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#2C3E50',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#2C3E50',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 6px 12px rgba(0,0,0,0.1)',
    '0px 8px 16px rgba(0,0,0,0.12)',
    '0px 10px 20px rgba(0,0,0,0.14)',
    '0px 12px 24px rgba(0,0,0,0.16)',
    '0px 14px 28px rgba(0,0,0,0.18)',
    '0px 16px 32px rgba(0,0,0,0.20)',
    '0px 18px 36px rgba(0,0,0,0.22)',
    '0px 20px 40px rgba(0,0,0,0.24)',
    '0px 22px 44px rgba(0,0,0,0.26)',
    '0px 24px 48px rgba(0,0,0,0.28)',
    '0px 26px 52px rgba(0,0,0,0.30)',
    '0px 28px 56px rgba(0,0,0,0.32)',
    '0px 30px 60px rgba(0,0,0,0.34)',
    '0px 32px 64px rgba(0,0,0,0.36)',
    '0px 34px 68px rgba(0,0,0,0.38)',
    '0px 36px 72px rgba(0,0,0,0.40)',
    '0px 38px 76px rgba(0,0,0,0.42)',
    '0px 40px 80px rgba(0,0,0,0.44)',
    '0px 42px 84px rgba(0,0,0,0.46)',
    '0px 44px 88px rgba(0,0,0,0.48)',
    '0px 46px 92px rgba(0,0,0,0.50)',
    '0px 48px 96px rgba(0,0,0,0.52)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

// Thème sombre
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3498DB',
      light: '#5DADE2',
      dark: '#2874A6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9B59B6',
      light: '#AF7AC5',
      dark: '#884EA0',
      contrastText: '#ffffff',
    },
    success: {
      main: '#27AE60',
      light: '#2ECC71',
      dark: '#1E8449',
    },
    error: {
      main: '#E74C3C',
      light: '#EC7063',
      dark: '#C0392B',
    },
    warning: {
      main: '#F39C12',
      light: '#F8C471',
      dark: '#D68910',
    },
    info: {
      main: '#3498DB',
      light: '#5DADE2',
      dark: '#2874A6',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#FFFFFF',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#FFFFFF',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#FFFFFF',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#FFFFFF',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#FFFFFF',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#FFFFFF',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.3)',
    '0px 4px 8px rgba(0,0,0,0.35)',
    '0px 6px 12px rgba(0,0,0,0.4)',
    '0px 8px 16px rgba(0,0,0,0.45)',
    '0px 10px 20px rgba(0,0,0,0.5)',
    '0px 12px 24px rgba(0,0,0,0.55)',
    '0px 14px 28px rgba(0,0,0,0.6)',
    '0px 16px 32px rgba(0,0,0,0.65)',
    '0px 18px 36px rgba(0,0,0,0.7)',
    '0px 20px 40px rgba(0,0,0,0.75)',
    '0px 22px 44px rgba(0,0,0,0.8)',
    '0px 24px 48px rgba(0,0,0,0.85)',
    '0px 26px 52px rgba(0,0,0,0.9)',
    '0px 28px 56px rgba(0,0,0,0.95)',
    '0px 30px 60px rgba(0,0,0,1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#2D2D2D',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          boxShadow: '0px 2px 8px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
  },
});

// Thème personnalisé (violet/orange)
const customTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9C27B0', // Violet
      light: '#BA68C8',
      dark: '#7B1FA2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF9800', // Orange
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    warning: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    background: {
      default: '#F9F7FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    divider: '#E1BEE7',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#9C27B0',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#9C27B0',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#9C27B0',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#9C27B0',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#9C27B0',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#9C27B0',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(156, 39, 176, 0.1)',
    '0px 4px 8px rgba(156, 39, 176, 0.12)',
    '0px 6px 12px rgba(156, 39, 176, 0.15)',
    '0px 8px 16px rgba(156, 39, 176, 0.18)',
    '0px 10px 20px rgba(156, 39, 176, 0.2)',
    '0px 12px 24px rgba(156, 39, 176, 0.22)',
    '0px 14px 28px rgba(156, 39, 176, 0.25)',
    '0px 16px 32px rgba(156, 39, 176, 0.28)',
    '0px 18px 36px rgba(156, 39, 176, 0.3)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(156, 39, 176, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #7B1FA2 30%, #9C27B0 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 12px rgba(156, 39, 176, 0.15)',
          border: '1px solid #E1BEE7',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': {
              borderColor: '#BA68C8',
            },
          },
        },
      },
    },
  },
});

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Récupérer le thème sauvegardé ou utiliser le thème clair par défaut
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('salon-manager-theme');
    return savedTheme || 'light';
  });

  // Sauvegarder le thème dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('salon-manager-theme', themeMode);
  }, [themeMode]);

  // Mémoriser le thème pour éviter les recalculs
  const theme = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return darkTheme;
      case 'custom':
        return customTheme;
      case 'light':
      default:
        return lightTheme;
    }
  }, [themeMode]);

  // Toggle entre clair et sombre
  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Changer vers un thème spécifique
  const changeTheme = (mode) => {
    if (['light', 'dark', 'custom'].includes(mode)) {
      setThemeMode(mode);
    }
  };

  // Réinitialiser au thème par défaut
  const resetTheme = () => {
    setThemeMode('light');
  };

  // Obtenir le nom du thème en français
  const getThemeName = () => {
    const names = {
      light: 'Thème Clair',
      dark: 'Thème Sombre',
      custom: 'Thème Personnalisé'
    };
    return names[themeMode] || 'Thème Clair';
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode, 
      toggleTheme, 
      changeTheme, 
      resetTheme,
      getThemeName 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};