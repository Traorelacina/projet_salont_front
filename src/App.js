// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as AppThemeProvider, useTheme } from './contexts/ThemeContext'; // Renommage
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Prestations from './pages/Prestations';
import Passages from './pages/Passages';
import Paiements from './pages/Paiements';
import Statistiques from './pages/Statistiques';
import Settings from './pages/Settings';
import Users from './pages/Users'; // Nouvelle page de gestion des utilisateurs

// Components
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { theme } = useTheme();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Layout>
                  <Clients />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/prestations"
            element={
              <PrivateRoute>
                <Layout>
                  <Prestations />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/passages"
            element={
              <PrivateRoute>
                <Layout>
                  <Passages />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/paiements"
            element={
              <PrivateRoute>
                <Layout>
                  <Paiements />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/statistiques"
            element={
              <PrivateRoute>
                <Layout>
                  <Statistiques />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <Users />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;