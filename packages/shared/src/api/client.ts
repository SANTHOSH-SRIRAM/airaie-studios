import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, notifyTokenExpired } from '../auth/tokenStore';

let projectId = '';

export function setProjectId(id: string) {
  projectId = id;
}

export function getProjectId(): string {
  return projectId || localStorage.getItem('airaie_project_id') || '';
}

// --- API Error type ---

export interface APIError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

// --- Axios instance ---

export const apiClient = axios.create({
  baseURL: '/v0',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// --- Request interceptor: inject project ID + JWT ---

apiClient.interceptors.request.use((config) => {
  const pid = getProjectId();
  if (pid) {
    config.headers['X-Project-Id'] = pid;
  }

  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// --- Response interceptor: error transform + 401 refresh ---

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await axios.post('/v0/auth/refresh', { refresh_token: refreshToken });
    const { access_token, refresh_token } = res.data;
    setTokens(access_token, refresh_token);
    return true;
  } catch {
    return false;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ error?: { code?: string; message?: string; field?: string; details?: Record<string, unknown> }; message?: string }>) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Attempt token refresh on 401 (once per request)
    if (err.response?.status === 401 && !originalRequest._retry && getRefreshToken()) {
      originalRequest._retry = true;

      // Deduplicate concurrent refresh attempts
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        // Retry the original request with new token
        const token = getAccessToken();
        if (token) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      }

      // Refresh failed — notify and reject
      notifyTokenExpired();
    }

    // Transform to structured APIError
    const errorBody = err.response?.data?.error;
    const apiErr: APIError = {
      status: err.response?.status ?? 0,
      code: errorBody?.code ?? err.code ?? 'UNKNOWN',
      message:
        errorBody?.message ??
        err.response?.data?.message ??
        err.message ??
        'An unknown error occurred',
      details: errorBody?.details,
      field: errorBody?.field,
    };
    return Promise.reject(apiErr);
  }
);
