// services/networkManager.js
// services/networkManager.js

class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.init();
  }

  init() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
    console.log('🟢 Connexion Internet rétablie');
  }

  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
    console.log('🔴 Mode hors ligne');
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Méthode subscribe pour compatibilité avec les hooks
  subscribe(callback) {
    // Créer un wrapper qui adapte le format du callback
    const wrapper = (event, isOnline) => {
      callback(isOnline);
    };
    
    // Stocker la référence pour pouvoir se désabonner
    wrapper.original = callback;
    
    this.listeners.add(wrapper);
    
    // Retourner la fonction de désabonnement
    return () => {
      this.listeners.delete(wrapper);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event, this.isOnline);
      } catch (error) {
        console.error('Erreur dans listener:', error);
      }
    });
  }

  getStatus() {
    return this.isOnline;
  }

  async checkConnection() {
    if (!this.isOnline) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      // Notifier si le statut a changé
      if (wasOnline !== this.isOnline) {
        this.notifyListeners(this.isOnline ? 'online' : 'offline');
      }
      
      return response.ok;
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline) {
        this.notifyListeners('offline');
      }
      
      return false;
    }
  }

  async waitForConnection(timeout = 30000, interval = 1000) {
    return new Promise((resolve, reject) => {
      if (this.isOnline) {
        resolve(true);
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.isOnline) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout attente connexion'));
        }
      }, interval);
    });
  }
}

export const networkManager = new NetworkManager();
export default NetworkManager;