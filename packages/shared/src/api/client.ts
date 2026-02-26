import axios, { type AxiosError } from 'axios';

let projectId = '';

export function setProjectId(id: string) {
  projectId = id;
}

export function getProjectId(): string {
  return projectId || localStorage.getItem('airaie_project_id') || '';
}

export const apiClient = axios.create({
  baseURL: '/v0',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const pid = getProjectId();
  if (pid) {
    config.headers['X-Project-Id'] = pid;
  }
  return config;
});

export interface APIError {
  status: number;
  code: string;
  message: string;
}

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; message?: string }>) => {
    const apiErr: APIError = {
      status: err.response?.status ?? 0,
      code: err.code ?? 'UNKNOWN',
      message:
        err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        'An unknown error occurred',
    };
    return Promise.reject(apiErr);
  }
);
