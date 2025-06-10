import { env } from '@/config/env';
import { sessionService } from '@/services/sessionService';

const BASE_URL = env.API_URL;
const TOKEN_KEY = env.TOKEN_KEY;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem {
    data: any;
    timestamp: number;
}

const cache: Map<string, CacheItem> = new Map();

export const api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  handleResponse: async (response: Response) => {
    if (response.status === 401) {
      // Session expired or invalid token
      sessionService.endSession();
      throw new Error('Session expired. Please login again.');
    }
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "API request failed");
    }
    return response.json();
  },

  get: async (endpoint: string) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return api.handleResponse(response);
  },

  post: async (endpoint: string, data: any) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return api.handleResponse(response);
  },

  put: async (endpoint: string, data: any) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return api.handleResponse(response);
  },

  patch: async (endpoint: string, data: any) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return api.handleResponse(response);
  },

  delete: async (endpoint: string) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return api.handleResponse(response);
  },

  // File upload method
  upload: async (endpoint: string, file: File) => {
    const token = api.getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Upload failed");
    }
    return response.json();
  },

  // Form data submission method
  submitForm: async (endpoint: string, formData: FormData) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Form submission failed");
    }
    return response.json();
  },

  // Add new method for URL-encoded form submissions
  submitUrlEncodedForm: async (endpoint: string, formData: URLSearchParams) => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "API request failed");
    }
    return response.json();
  },

  // Caching layer
  getCached: async (endpoint: string) => {
    const cachedItem = cache.get(endpoint);
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      return cachedItem.data;
    }

    const data = await api.get(endpoint);
    cache.set(endpoint, { data, timestamp: Date.now() });
    return data;
  },

  clearCache: () => {
    cache.clear();
  },

  retryRequest: async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return api.retryRequest(fn, retries - 1, delay * 2);
    }
  },

  // Update WebSocket connections to use a more robust connection
  connectWebSocket: (endpoint: string) => {
    const token = api.getToken();
    const ws = new WebSocket(`${env.WS_URL}${endpoint}?token=${token}`);
    
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return ws;
  },
};
