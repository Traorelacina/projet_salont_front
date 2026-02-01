import { useState, useCallback } from 'react';
import { useSyncContext } from '../contexts/SyncContext';

/**
 * Hook personnalisé pour effectuer des requêtes API offline-first
 * @param {Function} apiFunction - Fonction API à appeler
 * @returns {Object} - État et fonctions pour gérer la requête
 */
export const useOfflineAPI = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateSyncStats } = useSyncContext();

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction(...args);
        
        if (response.success) {
          setData(response.data);
          
          // Mettre à jour les statistiques de synchronisation
          if (response.offline) {
            await updateSyncStats();
          }
          
          return response;
        } else {
          throw new Error(response.message || 'Erreur inconnue');
        }
      } catch (err) {
        console.error('Erreur API:', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, updateSyncStats]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Hook pour gérer une liste de données avec pagination
 */
export const useOfflineList = (apiFunction) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { updateSyncStats } = useSyncContext();

  const fetchItems = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction(params);
        
        if (response.success) {
          const newItems = Array.isArray(response.data) 
            ? response.data 
            : response.data.data || [];
          
          setItems(newItems);
          setHasMore(response.data.next_page_url != null);
          
          if (response.offline) {
            await updateSyncStats();
          }
          
          return response;
        } else {
          throw new Error(response.message || 'Erreur inconnue');
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la liste:', err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, updateSyncStats]
  );

  const addItem = useCallback((item) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const updateItem = useCallback((id, updatedItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item))
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setError(null);
    setLoading(false);
    setHasMore(true);
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
    reset,
  };
};

/**
 * Hook pour gérer un formulaire avec API offline
 */
export const useOfflineForm = (apiFunction) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { updateSyncStats } = useSyncContext();

  const submit = useCallback(
    async (data) => {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await apiFunction(data);
        
        if (response.success) {
          setSuccess(true);
          
          if (response.offline) {
            await updateSyncStats();
          }
          
          return response;
        } else {
          throw new Error(response.message || 'Erreur lors de la soumission');
        }
      } catch (err) {
        console.error('Erreur lors de la soumission:', err);
        setError(err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [apiFunction, updateSyncStats]
  );

  const reset = useCallback(() => {
    setSuccess(false);
    setError(null);
    setSubmitting(false);
  }, []);

  return {
    submitting,
    success,
    error,
    submit,
    reset,
  };
};

export default useOfflineAPI;