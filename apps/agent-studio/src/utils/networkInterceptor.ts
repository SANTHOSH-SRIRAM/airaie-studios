import { apiClient as client } from '@airaie/shared';
import { useExecutionStore } from '@store/executionStore';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

let interceptorsInstalled = false;

export function installNetworkInterceptor() {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  const store = useExecutionStore;

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    (config as any).__reqId = id;
    (config as any).__reqStart = performance.now();

    store.getState().addNetworkRequest({
      id,
      timestamp: new Date().toISOString(),
      method: (config.method ?? 'GET').toUpperCase(),
      url: `${config.baseURL ?? ''}${config.url ?? ''}`,
      requestSize: config.data ? JSON.stringify(config.data).length : 0,
    });

    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const id = (response.config as any).__reqId;
      const start = (response.config as any).__reqStart;
      if (id) {
        store.getState().updateNetworkRequest(id, {
          status: response.status,
          duration: start ? Math.round(performance.now() - start) : undefined,
          responseSize: response.data ? JSON.stringify(response.data).length : 0,
        });
      }
      return response;
    },
    (error: AxiosError) => {
      const id = (error.config as any)?.__reqId;
      const start = (error.config as any)?.__reqStart;
      if (id) {
        store.getState().updateNetworkRequest(id, {
          status: error.response?.status,
          duration: start ? Math.round(performance.now() - start) : undefined,
          error: error.message,
        });
      }
      return Promise.reject(error);
    }
  );
}
