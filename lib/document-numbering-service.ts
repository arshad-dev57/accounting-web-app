import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export type DocumentNumberSeries = {
  id?: string;
  documentType: string;
  label: string;
  prefix: string;
  nextNumber: number;
  padLength: number;
  sortOrder?: number;
  isActive?: boolean;
  preview?: string;
};

export type DocumentNumberingSettings = {
  id?: string;
  companyId?: string;
  allowManualInvoiceNumber: boolean;
  series: DocumentNumberSeries[];
  updatedAt?: string;
};

async function parseJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

export const documentNumberingService = {
  getSettings: async (): Promise<DocumentNumberingSettings> => {
    const response = await fetch('/api/settings/document-numbering', {
      headers: browserCompanyAuthHeaders(),
      cache: 'no-store',
    });
    const result = await parseJson(response);
    return result.data as DocumentNumberingSettings;
  },

  saveSettings: async (payload: {
    allowManualInvoiceNumber: boolean;
    series: Array<{
      documentType: string;
      label?: string;
      prefix: string;
      nextNumber: number;
      padLength?: number;
      sortOrder?: number;
      isActive?: boolean;
    }>;
  }): Promise<DocumentNumberingSettings> => {
    const response = await fetch('/api/settings/document-numbering', {
      method: 'PUT',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseJson(response);
    return result.data as DocumentNumberingSettings;
  },
};
