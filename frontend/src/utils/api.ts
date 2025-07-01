import { env } from "@/config/env";
import { toast } from "sonner";

const BASE_URL = env.API_URL;
const TOKEN_KEY = env.TOKEN_KEY;

const CACHE_DURATION = 300_000; // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

class ApiError extends Error {
  status?: number;
  detail?: string;
  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const handleApiError = (error: unknown) => {
  // Handle session expiration (401/403 status codes)
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    localStorage.clear();
    window.location.href = '/auth';
    throw new Error('Session expired. Please login again.');
  }
  
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    toast.error("Network error. Please check your connection.");
    throw error;
  }
  
  const message =
    (error as ApiError).detail ||
    (error as Error).message ||
    "An unexpected error occurred";
  toast.error(message);
  throw error;
};

export const api = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  handleResponse: async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      let errorData: any = { detail: "API request failed" };
      try {
        errorData = await response.json();
      } catch {}
      throw new ApiError(
        errorData.detail || "API request failed",
        response.status,
        errorData.detail
      );
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
      return handleApiError(error) as Promise<T>;
    }
  },

  post: async <T = any, R = any>(endpoint: string, data: T): Promise<R> => {
    try {
      const token = api.getToken();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return api.handleResponse<R>(response);
    } catch (error) {
      return handleApiError(error) as Promise<R>;
    }
  },

  put: async <T = any, R = any>(endpoint: string, data: T): Promise<R> => {
    try {
      const token = api.getToken();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return api.handleResponse<R>(response);
    } catch (error) {
      return handleApiError(error) as Promise<R>;
    }
  },

  patch: async <T = any, R = any>(endpoint: string, data: T): Promise<R> => {
    try {
      const token = api.getToken();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return api.handleResponse<R>(response);
    } catch (error) {
      return handleApiError(error) as Promise<R>;
    }
  },

  delete: async <R = any>(endpoint: string): Promise<R> => {
    try {
      const token = api.getToken();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return api.handleResponse<R>(response);
    } catch (error) {
      return handleApiError(error) as Promise<R>;
    }
  },

  // File upload method
  upload: async <R = any>(
    endpoint: string,
    file: File,
    subfolder: string
  ): Promise<R> => {
    const token = api.getToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subfolder", subfolder);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok)
      throw new Error((await response.json()).detail || "Upload failed");
    return response.json();
  },

  deleteFile: async <R = any>(
    endpoint: string,
    fileUrl: string
  ): Promise<R> => {
    const token = api.getToken();
    const formData = new FormData();
    formData.append("file_url", fileUrl);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      credentials: "include",
    });
    if (!response.ok)
      throw new Error((await response.json()).detail || "Delete failed");
    return response.json();
  },

  // Form data submission method
  submitForm: async <R = any>(
    endpoint: string,
    formData: FormData
  ): Promise<R> => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok)
      throw new Error(
        (await response.json()).detail || "Form submission failed"
      );
    return response.json();
  },

  // Add new method for URL-encoded form submissions
  submitUrlEncodedForm: async <R = any>(
    endpoint: string,
    formData: URLSearchParams
  ): Promise<R> => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
    if (!response.ok)
      throw new Error((await response.json()).detail || "API request failed");
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

  clearCache: () => cache.clear(),

  retryRequest: async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api.retryRequest(fn, retries - 1, delay * 2);
    }
  },
};
