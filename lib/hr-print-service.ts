import { apiClient } from '@/lib/api-client';

export interface HRSignatoryItem {
  id: string;
  settingId: string;
  companyId: string;
  label: string;
  name: string;
  designation: string;
  signatureUrl?: string;
  stampUrl?: string;
  alignment: 'left' | 'center' | 'right' | string;
  displayOrder: number;
  isActive: boolean;
}

export interface HRPrintSettingItem {
  id: string;
  companyId: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  registrationNo?: string;
  primaryLogo?: string;
  secondaryLogo?: string;
  officialStamp?: string;
  paperSize: 'A4' | 'Letter' | 'Legal' | string;
  orientation: 'portrait' | 'landscape' | string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontFamily: string;
  primaryColor: string;
  headerSubtitle?: string;
  footerText?: string;
  showLogo: boolean;
  showStamp: boolean;
  showPageNumbers: boolean;
  showFooter: boolean;
  payslipTitle: string;
  showEarningsBreakdown: boolean;
  showDeductionsBreakdown: boolean;
  showAttendanceSummary: boolean;
  showYtdTotals: boolean;
  payslipNotes?: string;
  offerPrefix?: string;
  offerSeq?: number;
  appointmentPrefix?: string;
  appointmentSeq?: number;
  salaryCertPrefix?: string;
  salaryCertSeq?: number;
  experiencePrefix?: string;
  experienceSeq?: number;
  signatories?: HRSignatoryItem[];
}

export interface HRDocumentTemplateItem {
  id: string;
  companyId: string;
  templateType: 'OfferLetter' | 'AppointmentLetter' | 'SalaryCertificate' | 'ExperienceLetter' | 'PromotionLetter' | 'TransferLetter' | 'WarningLetter' | 'TerminationLetter' | 'Payslip' | 'Report' | 'Custom' | string;
  name: string;
  description?: string;
  contentBody: string;
  headerHtml?: string;
  footerHtml?: string;
  isDefault: boolean;
  version: number;
  status: 'Draft' | 'Published' | 'Archived' | string;
  updatedAt?: string;
}

export interface HRGeneratedDocumentItem {
  id: string;
  companyId: string;
  employeeId?: string | null;
  templateId?: string | null;
  templateVersionNumber: number;
  documentType: string;
  documentNumber: string;
  title: string;
  snapshotDataJson: {
    generatedAt: string;
    generatedBy: string;
    documentNumber: string;
    documentType: string;
    title: string;
    employee: {
      id: string;
      code: string;
      name: string;
      email: string;
      phone: string;
      designation: string;
      department: string;
      office?: string;
      costCenter?: string;
      joiningDate?: string;
      salary?: number;
      currency?: string;
    };
    branding: {
      companyName: string;
      companyAddress: string;
      companyPhone: string;
      companyEmail: string;
      companyWebsite: string;
      registrationNo: string;
      primaryLogo: string;
      secondaryLogo: string;
      officialStamp: string;
      primaryColor: string;
      fontFamily: string;
      headerSubtitle: string;
      footerText: string;
    };
    template: {
      id?: string | null;
      name: string;
      version: number;
      contentBody: string;
      headerHtml?: string;
      footerHtml?: string;
    };
    signatories: HRSignatoryItem[];
  };
  renderedPdfUrl?: string;
  status: string;
  generatedBy?: string;
  generatedAt?: string;
}

export const hrPrintService = {
  getSettings: async (): Promise<HRPrintSettingItem> => {
    const res = await apiClient.get('/api/hr/print-settings');
    return res.data?.data || res.data;
  },

  updateSettings: async (payload: Partial<HRPrintSettingItem>): Promise<HRPrintSettingItem> => {
    const res = await apiClient.put('/api/hr/print-settings', payload);
    return res.data?.data || res.data;
  },

  uploadBrandingAssets: async (formData: FormData): Promise<HRPrintSettingItem> => {
    const res = await apiClient.post('/api/hr/print-settings/branding', formData);
    return res.data?.data || res.data;
  },

  removeBrandingAsset: async (assetKey: 'primaryLogo' | 'secondaryLogo' | 'officialStamp'): Promise<HRPrintSettingItem> => {
    const res = await apiClient.delete(`/api/hr/print-settings/branding/${assetKey}`);
    return res.data?.data || res.data;
  },

  createSignatory: async (formData: FormData): Promise<HRSignatoryItem> => {
    const res = await apiClient.post('/api/hr/print-settings/signatories', formData);
    return res.data?.data || res.data;
  },

  updateSignatory: async (id: string, formData: FormData): Promise<HRSignatoryItem> => {
    const res = await apiClient.patch(`/api/hr/print-settings/signatories/${id}`, formData);
    return res.data?.data || res.data;
  },

  deleteSignatory: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/hr/print-settings/signatories/${id}`);
  },

  listTemplates: async (templateType?: string, status?: string): Promise<HRDocumentTemplateItem[]> => {
    const params: any = {};
    if (templateType) params.templateType = templateType;
    if (status) params.status = status;
    const res = await apiClient.get('/api/hr/templates', { params });
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  },

  getTemplate: async (id: string): Promise<HRDocumentTemplateItem> => {
    const res = await apiClient.get(`/api/hr/templates/${id}`);
    return res.data?.data || res.data;
  },

  createTemplate: async (payload: Partial<HRDocumentTemplateItem>): Promise<HRDocumentTemplateItem> => {
    const res = await apiClient.post('/api/hr/templates', payload);
    return res.data?.data || res.data;
  },

  updateTemplate: async (id: string, payload: Partial<HRDocumentTemplateItem>): Promise<HRDocumentTemplateItem> => {
    const res = await apiClient.patch(`/api/hr/templates/${id}`, payload);
    return res.data?.data || res.data;
  },

  publishTemplate: async (id: string, changeSummary?: string): Promise<HRDocumentTemplateItem> => {
    const res = await apiClient.post(`/api/hr/templates/${id}/publish`, { changeSummary });
    return res.data?.data || res.data;
  },

  duplicateTemplate: async (id: string): Promise<HRDocumentTemplateItem> => {
    const res = await apiClient.post(`/api/hr/templates/${id}/duplicate`);
    return res.data?.data || res.data;
  },

  generateDocumentSnapshot: async (payload: {
    employeeId: string;
    templateId?: string;
    documentType?: string;
    customTitle?: string;
    notes?: string;
  }): Promise<HRGeneratedDocumentItem> => {
    const res = await apiClient.post('/api/hr/documents/generate', payload);
    return res.data?.data || res.data;
  },

  getGeneratedDocumentSnapshot: async (id: string): Promise<HRGeneratedDocumentItem> => {
    const res = await apiClient.get(`/api/hr/documents/generated/${id}`);
    return res.data?.data || res.data;
  }
};
