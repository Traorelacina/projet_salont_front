// pages/Settings.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Palette,
  Restore,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const themeOptions = [
  {
    value: 'light',
    label: 'Thème Clair',
    description: 'Interface lumineuse et moderne',
    icon: <Brightness7 />,
  },
  {
    value: 'dark',
    label: 'Thème Sombre',
    description: 'Réduit la fatigue oculaire',
    icon: <Brightness4 />,
  },
  {
    value: 'custom',
    label: 'Personnalisé',
    description: 'Couleurs personnalisées',
    icon: <Palette />,
  },
];

const Settings = () => {
  const { themeMode, changeTheme } = useTheme();
  const [savePreferences, setSavePreferences] = useState(true);

  const handleThemeChange = (event) => {
    changeTheme(event.target.value);
  };

  const handleReset = () => {
    changeTheme('light');
    setSavePreferences(true);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Paramètres
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Thème */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Palette />
                Apparence
              </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                  Thème de l'interface
                </FormLabel>
                <RadioGroup
                  value={themeMode}
                  onChange={handleThemeChange}
                >
                  <Grid container spacing={2}>
                    {themeOptions.map((option) => (
                      <Grid item xs={12} sm={6} key={option.value}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: themeMode === option.value ? '2px solid' : '1px solid',
                            borderColor: themeMode === option.value ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'primary.light',
                            },
                          }}
                          onClick={() => changeTheme(option.value)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Radio
                              value={option.value}
                              checked={themeMode === option.value}
                              onChange={handleThemeChange}
                              sx={{ mr: 1 }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {option.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {option.description}
                              </Typography>
                            </Box>
                            <Box sx={{ ml: 1, color: 'primary.main' }}>
                              {option.icon}
                            </Box>
                          </Box>
                          
                          {/* Aperçu miniature */}
                          <Box sx={{ 
                            mt: 1, 
                            display: 'flex', 
                            gap: 0.5,
                            opacity: themeMode === option.value ? 1 : 0.5 
                          }}>
                            {option.value === 'light' && (
                              <>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#2C3E50', borderRadius: 1 }} />
                                <Box sx={{ width: 20, height: 20, bgcolor: '#3498DB', borderRadius: 1 }} />
                                <Box sx={{ width: 20, height: 20, bgcolor: '#F5F6FA', borderRadius: 1, border: '1px solid #ddd' }} />
                              </>
                            )}
                            {option.value === 'dark' && (
                              <>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#3498DB', borderRadius: 1 }} />
                                <Box sx={{ width: 20, height: 20, bgcolor: '#121212', borderRadius: 1 }} />
                                <Box sx={{ width: 20, height: 20, bgcolor: '#1E1E1E', borderRadius: 1 }} />
                              </>
                            )}
                            {option.value === 'custom' && (
                              <>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#9C27B0', borderRadius: 1 }} />
                                <Box sx={{ width: 20, height: 20, bgcolor: '#FF9800', borderRadius: 1 }} />
                                <Box sx={{ width: 20, height: 20, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #ddd' }} />
                              </>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>

              <Divider sx={{ my: 3 }} />

              {/* Préférences supplémentaires */}
              <FormControlLabel
                control={
                  <Switch
                    checked={savePreferences}
                    onChange={(e) => setSavePreferences(e.target.checked)}
                    color="primary"
                  />
                }
                label="Sauvegarder mes préférences"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Votre thème sera sauvegardé pour vos prochaines visites
              </Typography>
            </CardContent>
          </Card>

          {/* Bouton de réinitialisation */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Restore />}
              onClick={handleReset}
            >
              Réinitialiser aux paramètres par défaut
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Aperçu en temps réel */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Aperçu
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Vous pouvez voir les changements en temps réel
              </Alert>

              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  bgcolor: 'background.paper',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Exemple de carte
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Contenu avec la couleur primaire
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contenu avec la couleur secondaire
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button variant="contained" size="small">
                  Bouton primaire
                </Button>
                <Button variant="outlined" size="small">
                  Bouton secondaire
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Thème actuel : <strong>{themeMode === 'light' ? 'Clair' : themeMode === 'dark' ? 'Sombre' : 'Personnalisé'}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;