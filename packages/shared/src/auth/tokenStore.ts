// =============================================================
// Auth Token Storage — localStorage with memory fallback
// =============================================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'airaie_access_token',
  REFRESH_TOKEN: 'airaie_refresh_token',
} as const;

type TokenExpiredCallback = () => void;

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let tokenExpiredCallback: TokenExpiredCallback | null = null;

function canUseLocalStorage(): boolean {
  try {
    const key = '__airaie_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const useLocalStorage = canUseLocalStorage();

// --- Access Token ---

export function getAccessToken(): string | null {
  if (useLocalStorage) {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }
  return memoryAccessToken;
}

export function setAccessToken(token: string): void {
  memoryAccessToken = token;
  if (useLocalStorage) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }
}

// --- Refresh Token ---

export function getRefreshToken(): string | null {
  if (useLocalStorage) {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
  return memoryRefreshToken;
}

export function setRefreshToken(token: string): void {
  memoryRefreshToken = token;
  if (useLocalStorage) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }
}

// --- Set both tokens at once (after login/refresh) ---

export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

// --- Clear all tokens (logout) ---

export function clearTokens(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  if (useLocalStorage) {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

// --- Token expired callback ---

export function onTokenExpired(callback: TokenExpiredCallback): () => void {
  tokenExpiredCallback = callback;
  return () => {
    tokenExpiredCallback = null;
  };
}

export function notifyTokenExpired(): void {
  clearTokens();
  tokenExpiredCallback?.();
}

// --- Helper: check if we have tokens ---

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
