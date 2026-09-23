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
  issueDate?: string;
  expiresAt?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  status: 'Uploaded' | 'Under Review' | 'Verified' | 'Rejected' | 'Expired' | string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  version?: number;
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

  updateDocumentStatus: async (
    documentId: string,
    status: 'Verified' | 'Rejected' | 'Under Review'
  ): Promise<HRDocumentItem> => {
    const res = await apiClient.patch(`/api/hr/documents/${documentId}/status`, { status });
    return res.data?.data || res.data;
  },
};
