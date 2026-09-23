import { apiClient } from '@/lib/api-client';

export type HRDocumentCategory =
  | 'Identity'
  | 'Employment'
  | 'Payroll / Financial'
  | 'Compliance'
  | 'Education'
  | 'Other';

export interface HRDocumentItem {
  id: string;
  companyId: string;
  employeeId?: string | null;
  employee?: string;
  title: string;
  category: HRDocumentCategory | string;
  reference?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  cloudinaryPublicId?: string;
  issueDate?: string;
  expiresAt?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  status: 'Uploaded' | 'Under Review' | 'Verified' | 'Rejected' | 'Expired' | 'Superseded' | string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  version?: number;
  previousVersionId?: string | null;
  createdAt?: string;
}

export function getExpiryStatus(expiresAt?: string): { label: string; tone: 'green' | 'amber' | 'red' } {
  if (!expiresAt) return { label: 'No Expiry', tone: 'green' };
  const d = new Date(expiresAt);
  if (isNaN(d.getTime())) return { label: 'Valid', tone: 'green' };
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', tone: 'red' };
  if (diffDays <= 7) return { label: `Expires in ${diffDays}d`, tone: 'red' };
  if (diffDays <= 30) return { label: `Expires in ${diffDays}d`, tone: 'amber' };
  return { label: 'Valid', tone: 'green' };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const hrDocumentsService = {
  listDocuments: async (employeeId?: string): Promise<HRDocumentItem[]> => {
    const qs = employeeId ? `?employeeId=${employeeId}` : '';
    const res = await apiClient.get(`/api/hr/documents${qs}`);
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  },

  saveDocument: async (payload: {
    employeeId?: string;
    title: string;
    category?: string;
    reference?: string;
    fileUrl?: string;
    issueDate?: string;
    expiresAt?: string;
    documentNumber?: string;
    issuingAuthority?: string;
    notes?: string;
  }): Promise<HRDocumentItem> => {
    const res = await apiClient.post('/api/hr/documents', payload);
    return res.data?.data || res.data;
  },

  uploadDocument: async (formData: FormData): Promise<HRDocumentItem> => {
    const res = await apiClient.post('/api/hr/documents/upload', formData);
    return res.data?.data || res.data;
  },

  replaceDocument: async (documentId: string, formData: FormData): Promise<HRDocumentItem> => {
    const res = await apiClient.post(`/api/hr/documents/${documentId}/replace`, formData);
    return res.data?.data || res.data;
  },

  getDocumentVersions: async (documentId: string): Promise<HRDocumentItem[]> => {
    const res = await apiClient.get(`/api/hr/documents/${documentId}/versions`);
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  },

  downloadDocument: async (documentId: string): Promise<{ fileUrl: string; fileName: string }> => {
    const res = await apiClient.get(`/api/hr/documents/${documentId}/download`);
    return res.data?.data || res.data;
  },

  updateDocumentStatus: async (
    documentId: string,
    status: 'Verified' | 'Rejected' | 'Under Review'
  ): Promise<HRDocumentItem> => {
    const res = await apiClient.patch(`/api/hr/documents/${documentId}/status`, { status });
    return res.data?.data || res.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/api/hr/documents/${documentId}`);
  }
};

