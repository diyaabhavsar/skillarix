import { env } from '@/config/env';
import { sessionService } from '@/services/sessionService';
import { toast } from 'sonner';

const BASE_URL = env.API_URL;
const TOKEN_KEY = env.TOKEN_KEY;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem {
    data: any;
    timestamp: number;
}

const cache: Map<string, CacheItem> = new Map();

interface WebSocketConfig {
    maxRetries?: number;
    retryDelay?: number;
    debug?: boolean;
    onOpen?: () => void;
    onError?: (error: Event) => void;
    onClose?: (event: CloseEvent) => void;
}

class ApiError extends Error {
  status?: number;
  detail?: string;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

const handleApiError = (error: unknown): never => {
  const apiError = error as ApiError;
  const message = apiError.detail || apiError.message || "An unexpected error occurred";
  
  // Check for session expiration
  if (apiError.status === 401) {
    // Clear auth data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
    // Redirect to auth page
    window.location.href = '/auth';
    toast.error("Session expired. Please login again.");
  } else {
    toast.error(message);
  }
  
  throw apiError;
};

export const api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  handleResponse: async <T>(response: Response): Promise<T> => {
    if (response.status === 401) {
      // Session expired or invalid token
      sessionService.endSession();
      throw new ApiError("Session expired. Please login again.", 401);
    }
    
    if (!response.ok) {
      const error = await response.json() as { detail?: string };
      throw new ApiError(error.detail || "API request failed", response.status);
    }
    
    return response.json() as Promise<T>;
  },

  get: async <T>(endpoint: string): Promise<T> => {
    try {
      const token = api.getToken();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return api.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        return handleApiError(error);
      }
      throw error;
    }
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
  upload: async (endpoint: string, file: File, subfolder: string) => {
    const token = api.getToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subfolder", subfolder);

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

  deleteFile: async (endpoint: string, fileUrl: string) => {
    const token = api.getToken();
    const formData = new FormData();
    formData.append("file_url", fileUrl);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Delete failed");
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
    console.log({token})
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
  getCached: async <T>(endpoint: string): Promise<T> => {
    const cachedItem = cache.get(endpoint);
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
      return cachedItem.data as T;
    }

    const data = await api.get<T>(endpoint);
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
  connectWebSocket: (endpoint: string, config: WebSocketConfig = {}) => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      debug = false,
      onOpen,
      onError,
      onClose
    } = config;

    const token = api.getToken();
    if (!token) {
      sessionService.endSession();
      throw new Error('No authentication token available');
    }

    let attempts = 0;
    let ws: WebSocket | null = null;
    let pingInterval: NodeJS.Timeout;

    const cleanup = () => {
      if (pingInterval) clearInterval(pingInterval);
      ws?.close();
    };

    const setupPing = () => {
      pingInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    const connect = () => {
      try {
        cleanup();
        ws = new WebSocket(`${env.WS_URL}${endpoint}?token=${token}`);

        ws.onopen = () => {
          if (debug) console.log('WebSocket connected successfully');
          attempts = 0;
          setupPing();
          onOpen?.();
        };

        ws.onclose = (event) => {
          cleanup();
          if (!event.wasClean && attempts < maxRetries) {
            attempts++;
            if (debug) console.log(`WebSocket reconnecting... Attempt ${attempts}/${maxRetries}`);
            setTimeout(connect, retryDelay * attempts);
          } else if (attempts >= maxRetries) {
            toast.error('Connection lost. Please refresh the page.');
          }
          onClose?.(event);
        };

        ws.onerror = (error) => {
          if (debug || process.env.NODE_ENV === 'development') {
            console.error('WebSocket error:', error);
          }
          onError?.(error);
          ws?.close();
        };

      } catch (error) {
        if (debug) console.error('WebSocket connection error:', error);
        setTimeout(connect, retryDelay * attempts);
      }

      return ws;
    };

    return connect();
  },
};
