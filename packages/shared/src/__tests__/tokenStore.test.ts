// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
  onTokenExpired,
  notifyTokenExpired,
} from '../auth/tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
  });

  it('stores and retrieves access token', () => {
    setAccessToken('test-access');
    expect(getAccessToken()).toBe('test-access');
  });

  it('stores and retrieves refresh token', () => {
    setRefreshToken('test-refresh');
    expect(getRefreshToken()).toBe('test-refresh');
  });

  it('setTokens sets both tokens', () => {
    setTokens('access-123', 'refresh-456');
    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');
  });

  it('clearTokens removes all tokens', () => {
    setTokens('a', 'r');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('isAuthenticated returns true when token exists', () => {
    expect(isAuthenticated()).toBe(false);
    setAccessToken('tok');
    expect(isAuthenticated()).toBe(true);
  });

  it('onTokenExpired fires callback and clears tokens', () => {
    const cb = vi.fn();
    const unsub = onTokenExpired(cb);
    setTokens('a', 'r');
    notifyTokenExpired();
    expect(cb).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
    unsub();
  });

  it('onTokenExpired unsubscribe prevents callback', () => {
    const cb = vi.fn();
    const unsub = onTokenExpired(cb);
    unsub();
    notifyTokenExpired();
    expect(cb).not.toHaveBeenCalled();
  });
});
