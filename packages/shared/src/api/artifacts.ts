import { apiClient } from './client';
import { ENDPOINTS } from '../constants/api';
import type { KernelArtifact, KernelArtifactLineage } from '../types/kernel';

export async function listArtifacts(params?: { type?: string; limit?: number; offset?: number }) {
  const { data } = await apiClient.get<KernelArtifact[]>(ENDPOINTS.ARTIFACTS.LIST, { params });
  return data;
}

export async function getArtifact(id: string) {
  const { data } = await apiClient.get<KernelArtifact>(ENDPOINTS.ARTIFACTS.GET(id));
  return data;
}

export async function getUploadURL(body: { name: string; type: string; size_bytes: number }) {
  const { data } = await apiClient.post<{ upload_url: string; artifact_id: string }>(
    ENDPOINTS.ARTIFACTS.UPLOAD_URL,
    body
  );
  return data;
}

export async function finalizeArtifact(id: string) {
  const { data } = await apiClient.post(ENDPOINTS.ARTIFACTS.FINALIZE(id));
  return data;
}

export async function getDownloadURL(id: string) {
  const { data } = await apiClient.get<{ download_url: string }>(ENDPOINTS.ARTIFACTS.DOWNLOAD_URL(id));
  return data;
}

export async function getLineage(id: string) {
  const { data } = await apiClient.get<KernelArtifactLineage[]>(ENDPOINTS.ARTIFACTS.LINEAGE(id));
  return data;
}

export interface ConvertArtifactResponse {
  artifact_id: string;
  status: 'completed' | 'cached' | 'failed';
  download_url?: string;
  error?: string;
}

export async function convertArtifact(id: string, targetFormat: string = 'gltf') {
  const { data } = await apiClient.post<ConvertArtifactResponse>(
    ENDPOINTS.ARTIFACTS.CONVERT(id),
    { target_format: targetFormat },
  );
  return data;
}
