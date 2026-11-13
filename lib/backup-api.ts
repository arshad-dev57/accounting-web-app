/**
 * Customer Backup & Restore API client.
 */
import { apiClient } from '@/lib/api-client';

function unwrap<T>(res: any, fallbackMsg = 'Request failed'): T {
  if (!res || res.success === false) {
    const msg =
      res?.message ||
      res?.data?.message ||
      (typeof res?.data === 'string' ? res.data : null) ||
      fallbackMsg;
    const err: any = new Error(msg);
    err.response = { data: { message: msg, code: res?.code }, status: res?.statusCode || 400 };
    throw err;
  }
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export interface BackupCompanyOption {
  id: string;
  name: string;
  role?: string;
  isOwner?: boolean;
}

export interface BackupJob {
  id: string;
  backupType: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RESTORING' | string;
  name: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  checksumSha256?: string | null;
  progressPercent?: number;
  progressMessage?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  expiresAt?: string | null;
  companies?: { companyId: string; companyName: string }[];
  isPreRestoreSnapshot?: boolean;
}

export interface BackupListResult {
  jobs: BackupJob[];
  summary: {
    totalBackups: number;
    totalSizeBytes: number;
    lastBackupAt: string | null;
    lastBackupId: string | null;
  };
}

export const backupApi = {
  async listCompanies(): Promise<{ companies: BackupCompanyOption[] }> {
    const res = await apiClient.get('/api/backups/companies');
    return unwrap(res);
  },

  async list(): Promise<BackupListResult> {
    const res = await apiClient.get('/api/backups');
    return unwrap(res);
  },

  async create(companyIds: string[], name?: string): Promise<{ job: BackupJob }> {
    const res = await apiClient.post('/api/backups', { companyIds, name });
    return unwrap(res);
  },

  async get(id: string): Promise<{ job: BackupJob }> {
    const res = await apiClient.get(`/api/backups/${id}`);
    return unwrap(res);
  },

  async remove(id: string): Promise<void> {
    const res = await apiClient.delete(`/api/backups/${id}`);
    unwrap(res, 'Delete failed');
  },

  async restore(id: string, opts?: { companyIds?: string[] }): Promise<any> {
    const res = await apiClient.post(`/api/backups/${id}/restore`, {
      confirm: true,
      companyIds: opts?.companyIds,
    });
    return unwrap(res);
  },

  async validate(id: string): Promise<any> {
    const res = await apiClient.post(`/api/backups/${id}/validate`, {});
    return unwrap(res);
  },

  /**
   * Download backup ZIP to the user's computer via browser download.
   * Uses Content-Disposition from the API; optionally File System Access API when available.
   */
  async downloadToComputer(id: string, fileName?: string): Promise<void> {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('accessToken')
        : null;
    const companyId =
      typeof window !== 'undefined'
        ? localStorage.getItem('bisonstechs_active_company_id') ||
          localStorage.getItem('active_company_id')
        : null;

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token.replace(/^"|"$/g, '')}`;
    if (companyId && companyId !== '__all__') headers['X-Company-Id'] = companyId;

    const res = await fetch(`/api/backups/${id}/download`, { headers });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.message || `Download failed (${res.status})`);
    }

    const blob = await res.blob();
    const suggested =
      fileName ||
      res.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] ||
      `Bisonstechs_Backup_${id.slice(0, 8)}.zip`;

    // Optional: File System Access API (Chromium) — lets user pick folder/drive
    const w = window as any;
    if (typeof w.showSaveFilePicker === 'function') {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: suggested,
          types: [
            {
              description: 'Bisonstechs Backup ZIP',
              accept: { 'application/zip': ['.zip'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // user cancelled picker
        // fall through to classic download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggested;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
