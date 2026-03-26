import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api.js';

/**
 * Data-fetching hook backed by apiClient (Axios).
 * Authentication is handled automatically by the apiClient request interceptor
 * (reads the JWT from localStorage), so no token needs to be passed here.
 * @param {string} url  - API path to GET
 * @param {object} axiosConfig - Optional Axios request config (params, headers, etc.)
 */
export function useFetch(url, axiosConfig = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(url, axiosConfig);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
