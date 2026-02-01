// Services offline-first
export { default as offlineClientsAPI } from './offlineclients';
export { default as offlinePrestationsAPI } from './offlinePrestations';
export { default as offlinePassagesAPI } from './offlinePassages';
export { default as offlinePaiementsAPI } from './offlinePaiements';
export { default as syncService } from './syncservice';
export { dbOperations, initDB } from './db';

// Regroupement des API offline
export const offlineAPI = {
  clients: require('./offlineClient').default,
  prestations: require('./offlinePrestations').default,
  passages: require('./offlinePassages').default,
  paiements: require('./offlinePaiements').default,
};