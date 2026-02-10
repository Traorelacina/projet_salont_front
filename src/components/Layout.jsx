import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  ContentCut,
  Receipt,
  TrendingUp,
  Person,
  Logout,
  Settings,
  Category,
  ManageAccounts,
  History,
  PointOfSale,
  ListAlt,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Menu items avec gestion des permissions - Nouvel ordre plus cohérent
  const menuItems = [
    // Tableau de bord (vue d'ensemble)
    { 
      text: 'Tableau de bord', 
      icon: <Dashboard />, 
      path: '/dashboard',
      section: 'Analyse'
    },
    
    // Section Clients
    { 
      text: 'Clients', 
      icon: <People />, 
      path: '/clients',
      section: 'Gestion'
    },
    { 
      text: 'Nouveau passage', 
      icon: <History />, 
      path: '/passages',
      section: 'Opérations'
    },
    { 
      text: 'Paiements', 
      icon: <Receipt />, 
      path: '/paiements',
      section: 'Opérations'
    },
    
    
    // Section Analyse
    { 
      text: 'Statistiques', 
      icon: <TrendingUp />, 
      path: '/statistiques',
      section: 'Analyse'
    },
    
    // Section Configuration (à la fin)
    { 
      text: 'Types de prestations', 
      icon: <Category />, 
      path: '/prestations',
      section: 'Configuration',
      description: 'Gérer les catégories de services'
    },
    { 
      text: 'Utilisateurs', 
      icon: <ManageAccounts />, 
      path: '/users',
      adminOnly: true,
      section: 'Configuration',
      description: 'Gérer les accès'
    },
  ];

  // Grouper les items par section
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (item.adminOnly && user?.role !== 'admin') {
      return acc;
    }
    
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  const sections = ['Analyse', 'Gestion', 'Opérations', 'Configuration'];

  // Filtrer les sections vides
  const filteredSections = sections.filter(section => 
    groupedMenuItems[section] && groupedMenuItems[section].length > 0
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: { label: 'Administrateur', emoji: '👑', color: 'error' },
      manager: { label: 'Manager', emoji: '📊', color: 'warning' },
      caissier: { label: 'Caissier', emoji: '💼', color: 'info' },
      coiffeur: { label: 'Coiffeur', emoji: '✂️', color: 'success' },
      estheticien: { label: 'Esthéticien', emoji: '💆', color: 'secondary' },
    };
    return roles[role] || { label: 'Employé', emoji: '👤', color: 'default' };
  };

  const roleInfo = getRoleLabel(user?.role);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, py: 3 }}>
        <ContentCut sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
            Salon Manager
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Gestion de salon de beauté
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      <List sx={{ px: 1.5, py: 2, flex: 1, overflow: 'auto' }}>
        {filteredSections.map((section, sectionIndex) => (
          <React.Fragment key={section}>
            {/* En-tête de section */}
            {sectionIndex > 0 && (
              <Divider sx={{ my: 2, opacity: 0.5 }} />
            )}
            
            <ListItem disablePadding sx={{ mb: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 2, 
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.7rem',
                }}
              >
                {section}
              </Typography>
            </ListItem>
            
            {/* Items de la section */}
            {groupedMenuItems[section].map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/passages' && location.pathname.startsWith('/passages')) ||
                (item.path === '/paiements' && location.pathname.startsWith('/paiements'));
              
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 1.5,
                      backgroundColor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'white' : 'text.primary',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      },
                      py: 1.25,
                      pl: 2,
                      pr: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <ListItemIcon sx={{ 
                        color: isActive ? 'white' : 'text.secondary', 
                        minWidth: 36,
                        mr: 1.5 
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.9rem',
                          noWrap: true
                        }} 
                        sx={{ flex: 1 }}
                      />
                      {item.adminOnly && (
                        <Chip 
                          label="Admin" 
                          size="small" 
                          sx={{ 
                            height: 18,
                            fontSize: '0.6rem',
                            bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'error.main',
                            color: 'white',
                            fontWeight: 600,
                          }} 
                        />
                      )}
                    </Box>
                    
                    {/* Description sous le titre */}
                    {item.description && (
                      <Typography 
                        variant="caption" 
                        sx={{
                          mt: 0.5,
                          ml: 5, // Aligné avec le texte principal
                          color: isActive ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                          fontSize: '0.75rem',
                          display: 'block',
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </React.Fragment>
        ))}
      </List>
      
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            mr: 1.5, 
            bgcolor: 'primary.main',
            fontSize: '0.9rem',
            fontWeight: 600 
          }}>
            {user?.nom?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
              {user?.prenom} {user?.nom}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {roleInfo.emoji}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                noWrap: true,
                fontSize: '0.75rem'
              }}>
                {roleInfo.label}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'text.primary'
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap sx={{ 
              fontWeight: 600,
              fontSize: '1.1rem',
              color: 'text.primary'
            }}>
              {menuItems.find(item => {
                if (item.path === '/passages' && location.pathname === '/passages/new') {
                  return false;
                }
                return item.path === location.pathname || 
                  (item.path === '/passages' && location.pathname.startsWith('/passages') && location.pathname !== '/passages/new');
              })?.text || 'Salon Management'}
            </Typography>
            
            {location.pathname === '/passages/new' && (
              <Chip 
                label="Nouveau"
                color="primary"
                size="small"
                sx={{ 
                  ml: 2,
                  fontWeight: 600,
                  height: 24
                }}
              />
            )}
          </Box>
          
          <Chip 
            label={`${roleInfo.emoji} ${roleInfo.label}`}
            color={roleInfo.color}
            size="small"
            sx={{ 
              mr: 2,
              fontWeight: 600,
              height: 28,
              display: { xs: 'none', md: 'flex' }
            }}
          />

          <IconButton 
            onClick={handleMenuOpen} 
            sx={{ 
              ml: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <Avatar sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: 'primary.main',
              fontSize: '0.9rem',
              fontWeight: 600 
            }}>
              {user?.nom?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 8,
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: 2,
                overflow: 'hidden',
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.25,
                  fontSize: '0.9rem',
                },
              },
            }}
          >
            <Box sx={{ 
              px: 2, 
              py: 2, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'grey.50'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {user?.email}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Chip 
                  label={`${roleInfo.emoji} ${roleInfo.label}`}
                  color={roleInfo.color}
                  size="small"
                  sx={{ 
                    fontWeight: 600,
                    height: 24,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
            </Box>

            
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Paramètres" />
            </MenuItem>
            
            <MenuItem onClick={() => { navigate('/prestations'); handleMenuClose(); }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Category fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Types de prestations" />
            </MenuItem>
            
            {user?.role === 'admin' && (
              <MenuItem onClick={() => { navigate('/users'); handleMenuClose(); }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ManageAccounts fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Utilisateurs" />
              </MenuItem>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
