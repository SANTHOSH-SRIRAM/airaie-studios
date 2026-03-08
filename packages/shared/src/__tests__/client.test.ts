// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import type { AxiosHeaders } from 'axios';

// We need to mock tokenStore BEFORE importing client
vi.mock('../auth/tokenStore', () => ({
  getAccessToken: vi.fn(() => null),
  getRefreshToken: vi.fn(() => null),
  setTokens: vi.fn(),
  notifyTokenExpired: vi.fn(),
}));

import { apiClient, setProjectId, getProjectId } from '../api/client';
import type { APIError } from '../api/client';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  notifyTokenExpired,
} from '../auth/tokenStore';

// Helper: mock adapter for apiClient
function mockAdapter(handler: (config: any) => Promise<any>) {
  apiClient.defaults.adapter = handler;
}

function successResponse(data: any, status = 200) {
  return (config: any) =>
    Promise.resolve({
      data,
      status,
      statusText: 'OK',
      headers: {},
      config,
    });
}

function errorResponse(status: number, data: any = {}, code = 'ERR_BAD_REQUEST') {
  return (config: any) => {
    const error = new axios.AxiosError(
      `Request failed with status code ${status}`,
      code,
      config,
      {},
      {
        data,
        status,
        statusText: status === 401 ? 'Unauthorized' : 'Error',
        headers: {} as AxiosHeaders,
        config,
      }
    );
    return Promise.reject(error);
  };
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setProjectId('');
    localStorage.clear();
    // Reset adapter
    apiClient.defaults.adapter = undefined;
  });

  afterEach(() => {
    apiClient.defaults.adapter = undefined;
  });

  // --- Project ID ---

  describe('setProjectId / getProjectId', () => {
    it('stores and retrieves project ID', () => {
      setProjectId('prj_123');
      expect(getProjectId()).toBe('prj_123');
    });

    it('falls back to localStorage when not set', () => {
      setProjectId('');
      localStorage.setItem('airaie_project_id', 'prj_ls');
      expect(getProjectId()).toBe('prj_ls');
    });

    it('returns empty string when nothing is set', () => {
      setProjectId('');
      expect(getProjectId()).toBe('');
    });
  });

  // --- Request interceptor ---

  describe('request interceptor', () => {
    it('injects X-Project-Id header when project ID is set', async () => {
      setProjectId('prj_test');
      let capturedHeaders: any;
      mockAdapter((config) => {
        capturedHeaders = config.headers;
        return successResponse({ ok: true })(config);
      });

      await apiClient.get('/test');
      expect(capturedHeaders['X-Project-Id']).toBe('prj_test');
    });

    it('does not inject X-Project-Id when not set', async () => {
      setProjectId('');
      let capturedHeaders: any;
      mockAdapter((config) => {
        capturedHeaders = config.headers;
        return successResponse({ ok: true })(config);
      });

      await apiClient.get('/test');
      expect(capturedHeaders['X-Project-Id']).toBeUndefined();
    });

    it('injects Authorization Bearer header when token exists', async () => {
      vi.mocked(getAccessToken).mockReturnValue('tok_abc');
      let capturedHeaders: any;
      mockAdapter((config) => {
        capturedHeaders = config.headers;
        return successResponse({ ok: true })(config);
      });

      await apiClient.get('/test');
      expect(capturedHeaders['Authorization']).toBe('Bearer tok_abc');
    });

    it('does not inject Authorization when no token', async () => {
      vi.mocked(getAccessToken).mockReturnValue(null);
      let capturedHeaders: any;
      mockAdapter((config) => {
        capturedHeaders = config.headers;
        return successResponse({ ok: true })(config);
      });

      await apiClient.get('/test');
      expect(capturedHeaders['Authorization']).toBeUndefined();
    });
  });

  // --- Response interceptor: APIError transform ---

  describe('error transformation', () => {
    it('transforms error response to APIError with structured body', async () => {
      mockAdapter(
        errorResponse(422, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name is required',
            field: 'name',
            details: { min_length: 1 },
          },
        })
      );

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiErr = err as APIError;
        expect(apiErr.status).toBe(422);
        expect(apiErr.code).toBe('VALIDATION_ERROR');
        expect(apiErr.message).toBe('Name is required');
        expect(apiErr.field).toBe('name');
        expect(apiErr.details).toEqual({ min_length: 1 });
      }
    });

    it('uses fallback message when no error body', async () => {
      mockAdapter(errorResponse(500, {}));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiErr = err as APIError;
        expect(apiErr.status).toBe(500);
        expect(apiErr.code).toBe('ERR_BAD_REQUEST');
        expect(apiErr.message).toBe('Request failed with status code 500');
      }
    });

    it('uses data.message when no error.message', async () => {
      mockAdapter(errorResponse(400, { message: 'Bad request body' }));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiErr = err as APIError;
        expect(apiErr.message).toBe('Bad request body');
      }
    });
  });

  // --- Response interceptor: 401 refresh ---

  describe('401 token refresh', () => {
    it('retries request after successful token refresh', async () => {
      vi.mocked(getRefreshToken).mockReturnValue('refresh_tok');
      vi.mocked(getAccessToken).mockReturnValue(null).mockReturnValueOnce(null).mockReturnValue('new_tok');

      let callCount = 0;
      // Mock the global axios.post for refresh endpoint
      const originalPost = axios.post;
      axios.post = vi.fn().mockResolvedValueOnce({
        data: { access_token: 'new_tok', refresh_token: 'new_refresh' },
      }) as any;

      mockAdapter((config) => {
        callCount++;
        if (callCount === 1) {
          // First call: 401
          return errorResponse(401, {})(config);
        }
        // Retry: success
        return successResponse({ result: 'ok' })(config);
      });

      const res = await apiClient.get('/test');
      expect(res.data).toEqual({ result: 'ok' });
      expect(vi.mocked(setTokens)).toHaveBeenCalledWith('new_tok', 'new_refresh');
      expect(callCount).toBe(2);

      axios.post = originalPost;
    });

    it('calls notifyTokenExpired when refresh fails', async () => {
      vi.mocked(getRefreshToken).mockReturnValue('refresh_tok');

      const originalPost = axios.post;
      axios.post = vi.fn().mockRejectedValueOnce(new Error('refresh failed')) as any;

      mockAdapter(errorResponse(401, {}));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(vi.mocked(notifyTokenExpired)).toHaveBeenCalled();
      }

      axios.post = originalPost;
    });

    it('does not attempt refresh when no refresh token', async () => {
      vi.mocked(getRefreshToken).mockReturnValue(null);

      mockAdapter(errorResponse(401, {}));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiErr = err as APIError;
        expect(apiErr.status).toBe(401);
        expect(vi.mocked(notifyTokenExpired)).not.toHaveBeenCalled();
      }
    });

    it('deduplicates concurrent refresh attempts', async () => {
      vi.mocked(getRefreshToken).mockReturnValue('refresh_tok');
      vi.mocked(getAccessToken).mockReturnValue('new_tok');

      let refreshCallCount = 0;
      const originalPost = axios.post;
      axios.post = vi.fn().mockImplementation(() => {
        refreshCallCount++;
        return Promise.resolve({
          data: { access_token: 'new_tok', refresh_token: 'new_refresh' },
        });
      }) as any;

      let adapterCallCount = 0;
      mockAdapter((config) => {
        adapterCallCount++;
        if (adapterCallCount <= 2) {
          return errorResponse(401, {})(config);
        }
        return successResponse({ ok: true })(config);
      });

      // Fire two concurrent requests that both get 401
      const [res1, res2] = await Promise.all([
        apiClient.get('/test1'),
        apiClient.get('/test2'),
      ]);

      // Only one refresh call should have been made
      expect(refreshCallCount).toBe(1);
      expect(res1.data).toEqual({ ok: true });
      expect(res2.data).toEqual({ ok: true });

      axios.post = originalPost;
    });

    it('does not retry more than once per request', async () => {
      vi.mocked(getRefreshToken).mockReturnValue('refresh_tok');
      vi.mocked(getAccessToken).mockReturnValue('new_tok');

      const originalPost = axios.post;
      axios.post = vi.fn().mockResolvedValue({
        data: { access_token: 'new_tok', refresh_token: 'new_refresh' },
      }) as any;

      // Always return 401
      mockAdapter(errorResponse(401, {}));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown');
      } catch (err) {
        // After one retry, it should give up and call notifyTokenExpired
        const apiErr = err as APIError;
        expect(apiErr.status).toBe(401);
      }

      axios.post = originalPost;
    });
  });

  // --- Base config ---

  describe('base config', () => {
    it('has /v0 baseURL', () => {
      expect(apiClient.defaults.baseURL).toBe('/v0');
    });

    it('has 30s timeout', () => {
      expect(apiClient.defaults.timeout).toBe(30_000);
    });

    it('has JSON content type', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });
});
