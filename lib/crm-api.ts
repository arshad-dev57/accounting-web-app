/**
 * CRM Lead Management API Service - Bisonstechs ERP
 */
import { apiClient } from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  leadNumber: string;
  companyId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  website?: string;
  companyName?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  source: string;
  sourceId?: string;
  status: string;
  stage?: string;
  priority: string;
  budget?: number;
  currency?: string;
  interest?: string;
  rating?: string;
  territory?: string;
  score?: number;
  expectedRevenue?: number;
  expectedClosingDate?: string;
  contactPerson?: string;
  assignedToId?: string;
  notes?: string;
  tags: string[];
  customFields: Record<string, any>;
  boardId?: string;
  boardOrder?: number;
  isDeleted: boolean;
  convertedAt?: string;
  convertedById?: string;
  convertedCustomerId?: string;
  title?: string;
  salutation?: string;
  middleName?: string;
  gender?: string;
  jobTitle?: string;
  phoneExt?: string;
  requestType?: string;
  leadType?: string;
  noOfEmployees?: string;
  annualRevenue?: number;
  marketSegment?: string;
  fax?: string;
  qualificationStatus?: string;
  qualifiedBy?: string;
  qualifiedOn?: string;
  campaignName?: string;
  language?: string;
  disabled?: boolean;
  unsubscribed?: boolean;
  blogSubscriber?: boolean;
  fromCustomerId?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string };
  creator?: { id: string; firstName: string; lastName: string; email: string };
  leadSource?: { id: string; name: string; color: string };
  _count?: { activities: number; followUps: number };
  activities?: LeadActivity[];
  followUps?: LeadFollowUp[];
  convertedCustomer?: { id: string; name: string; customerNumber: string };
}

export type CRMLead = Lead;

export interface LeadCustomField {
  id: string;
  companyId: string;
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  isRequired: boolean;
  isVisible: boolean;
  isSystem: boolean;
  sortOrder: number;
  options?: any[];
  width?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadBoard {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  color?: string;
  columns: LeadBoardColumn[];
  _count?: { leads: number };
}

export interface LeadBoardColumn {
  id: string;
  boardId: string;
  name: string;
  statusKey: string;
  color: string;
  sortOrder: number;
}

export interface LeadSource {
  id: string;
  companyId: string;
  name: string;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface LeadFollowUp {
  id: string;
  leadId: string;
  companyId: string;
  followUpDate: string;
  followUpTime?: string;
  type: string;
  status: string;
  notes?: string;
  assignedToId?: string;
  completedAt?: string;
  createdAt: string;
  assignedTo?: { id: string; firstName: string; lastName: string };
  lead?: { id: string; fullName: string; status: string; phone?: string; companyName?: string };
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  title: string;
  description?: string;
  metadata?: any;
  userId?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string };
}

export interface CRMDashboard {
  totals: {
    total: number; new: number; contacted: number; interested: number;
    followUp: number; negotiation: number; converted: number; lost: number;
    qualified?: number; unqualified?: number; nurturing?: number;
  };
  conversionRate: number | string;
  statusBreakdown: { status: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  recentActivity: LeadActivity[];
  upcomingFollowUps: LeadFollowUp[];
  addedOverTime: { date: string; count: number }[];
}

// ── Dashboard ────────────────────────────────────────────────────────────────

const EMPTY_CRM_DASHBOARD: CRMDashboard = {
  totals: {
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    followUp: 0,
    negotiation: 0,
    converted: 0,
    lost: 0,
  },
  conversionRate: 0,
  statusBreakdown: [],
  sourceBreakdown: [],
  recentActivity: [],
  upcomingFollowUps: [],
  addedOverTime: [],
};

export async function getCRMDashboard(params?: { dateFrom?: string; dateTo?: string }): Promise<CRMDashboard> {
  const res = await apiClient.get(`/api/crm/dashboard${toQuery(params)}`);
  const body = res.data;
  if (body && body.success === false) {
    throw new Error(body.message || 'Failed to load CRM dashboard');
  }
  const raw = body?.data ?? body;
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_CRM_DASHBOARD };
  }
  return {
    ...EMPTY_CRM_DASHBOARD,
    ...raw,
    totals: { ...EMPTY_CRM_DASHBOARD.totals, ...(raw.totals || {}) },
    statusBreakdown: Array.isArray(raw.statusBreakdown) ? raw.statusBreakdown : [],
    sourceBreakdown: Array.isArray(raw.sourceBreakdown) ? raw.sourceBreakdown : [],
    recentActivity: Array.isArray(raw.recentActivity) ? raw.recentActivity : [],
    upcomingFollowUps: Array.isArray(raw.upcomingFollowUps) ? raw.upcomingFollowUps : [],
    addedOverTime: Array.isArray(raw.addedOverTime) ? raw.addedOverTime : [],
  };
}

// ── Shared list unwrap (apiClient does not throw on 4xx) ───────────────────────

type Paginated<T> = T & { total: number; page: number; limit: number; pages: number };

function unwrapCrmPayload(res: { success?: boolean; data?: any; message?: string; statusCode?: number }) {
  // apiClient returns { statusCode, data: <axios body>, success, message }
  const body = res?.data;
  if (res?.success === false || body?.success === false) {
    throw new Error(body?.message || res?.message || 'CRM request failed');
  }
  return body?.data ?? body;
}

/** Build query string without serializing undefined/null/'' as literal "undefined". */
function toQuery(params?: Record<string, unknown> | object | null): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    const str = String(value);
    if (str === 'undefined' || str === 'null') continue;
    sp.set(key, str);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

function unwrapPaginatedList<K extends string>(
  res: { success?: boolean; data?: any; message?: string },
  listKey: K,
  fallbackLimit = 50
): Paginated<Record<K, any[]>> {
  const raw = unwrapCrmPayload(res) || {};
  const items = Array.isArray(raw?.[listKey])
    ? raw[listKey]
    : Array.isArray(raw)
      ? raw
      : [];
  const total = Number(raw?.total ?? items.length) || 0;
  const page = Number(raw?.page ?? 1) || 1;
  const limit = Number(raw?.limit ?? fallbackLimit) || fallbackLimit;
  const pages = Number(raw?.pages ?? Math.max(1, Math.ceil(total / limit))) || 1;
  return { [listKey]: items, total, page, limit, pages } as Paginated<Record<K, any[]>>;
}

/** Always return an array from CRM list endpoints (never a plain error object). */
function unwrapCrmArray(res: { success?: boolean; data?: any; message?: string }): any[] {
  try {
    const raw = unwrapCrmPayload(res);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      for (const key of ['items', 'rows', 'results', 'connections', 'sources', 'followUps', 'fields', 'boards', 'files', 'sheets', 'prospects', 'appointments', 'contracts', 'emailCampaigns', 'stages', 'funnel']) {
        if (Array.isArray((raw as any)[key])) return (raw as any)[key];
      }
    }
    return [];
  } catch {
    return [];
  }
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export interface LeadListParams {
  page?: number; limit?: number; status?: string; source?: string; assignedToId?: string;
  createdBy?: string; tags?: string; search?: string; boardId?: string; priority?: string;
  sortBy?: string; sortDir?: string; isDeleted?: string; dateFrom?: string; dateTo?: string;
}

export interface LeadFilterOptions {
  assignees: { id: string; label: string }[];
  creators: { id: string; label: string }[];
  tags: string[];
  unassignedCount: number;
}

export async function getLeads(params: LeadListParams = {}): Promise<{ leads: Lead[]; total: number; page: number; limit: number; pages: number }> {
  const res = await apiClient.get(`/api/crm/leads${toQuery(params)}`);
  return unwrapPaginatedList(res, 'leads', params.limit ?? 50);
}

export async function getLeadFilterOptions(): Promise<LeadFilterOptions> {
  try {
    const res = await apiClient.get('/api/crm/leads/filter-options');
    const raw = unwrapCrmPayload(res) || {};
    return {
      assignees: Array.isArray(raw.assignees) ? raw.assignees : [],
      creators: Array.isArray(raw.creators) ? raw.creators : [],
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      unassignedCount: Number(raw.unassignedCount) || 0,
    };
  } catch {
    return { assignees: [], creators: [], tags: [], unassignedCount: 0 };
  }
}

export async function getLeadById(id: string): Promise<Lead> {
  const res = await apiClient.get(`/api/crm/leads/${id}`);
  return res.data?.data ?? res.data;
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const res = await apiClient.post('/api/crm/leads', data);
  return res.data?.data ?? res.data;
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const res = await apiClient.put(`/api/crm/leads/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteLead(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/leads/${id}`);
}

export async function bulkUpdateLeads(ids: string[], updates: {
  status?: string;
  assignedToId?: string | null;
  priority?: string;
  tags?: string[];
}): Promise<void> {
  await apiClient.post('/api/crm/leads/bulk/update', { ids, ...updates });
}

export async function updateLeadBoardOrder(updates: { id: string; status?: string; boardOrder?: number; boardId?: string }[]): Promise<void> {
  await apiClient.post('/api/crm/leads/bulk/board-order', { updates });
}

export async function addLeadNote(id: string, note: string, type = 'note_added'): Promise<LeadActivity> {
  const res = await apiClient.post(`/api/crm/leads/${id}/note`, { note, type });
  return res.data?.data ?? res.data;
}

export async function convertLead(id: string, data: {
  createNewCustomer?: boolean;
  existingCustomerId?: string;
  customerData?: any;
  createContact?: boolean;
  createOpportunity?: boolean;
}): Promise<{ customerId: string }> {
  const res = await apiClient.post(`/api/crm/leads/${id}/convert`, data);
  return res.data?.data ?? res.data;
}

export async function exportLeads(data: { ids?: string[]; status?: string; format?: string }): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('active_company_id') : null;
  const { API_BASE_URL } = await import('@/lib/constants');
  const response = await fetch(`${API_BASE_URL}/api/crm/leads/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
    body: JSON.stringify(data),
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `leads-export-${Date.now()}.xlsx`; a.click();
  URL.revokeObjectURL(url);
}

// ── Custom Fields ─────────────────────────────────────────────────────────────

export async function getCustomFields(): Promise<LeadCustomField[]> {
  const res = await apiClient.get('/api/crm/custom-fields');
  return unwrapCrmArray(res);
}

export async function createCustomField(data: Partial<LeadCustomField>): Promise<LeadCustomField> {
  const res = await apiClient.post('/api/crm/custom-fields', data);
  return res.data?.data ?? res.data;
}

export async function updateCustomField(id: string, data: Partial<LeadCustomField>): Promise<LeadCustomField> {
  const res = await apiClient.put(`/api/crm/custom-fields/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteCustomField(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/custom-fields/${id}`);
}

export async function reorderCustomFields(orders: { id: string; sortOrder: number }[]): Promise<void> {
  await apiClient.put('/api/crm/custom-fields/reorder', { orders });
}

// ── Boards ────────────────────────────────────────────────────────────────────

export async function getBoards(): Promise<LeadBoard[]> {
  const res = await apiClient.get('/api/crm/boards');
  return unwrapCrmArray(res);
}

export async function createBoard(data: { name: string; description?: string; color?: string }): Promise<LeadBoard> {
  const res = await apiClient.post('/api/crm/boards', data);
  return res.data?.data ?? res.data;
}

export async function getDefaultBoard(): Promise<LeadBoard> {
  const res = await apiClient.get('/api/crm/boards/default');
  return res.data?.data ?? res.data;
}

// ── Sources ────────────────────────────────────────────────────────────────────

export async function getLeadSources(): Promise<LeadSource[]> {
  const res = await apiClient.get('/api/crm/sources');
  return unwrapCrmArray(res);
}

export async function createLeadSource(data: { name: string; color?: string; isActive?: boolean; isDefault?: boolean }): Promise<LeadSource> {
  const res = await apiClient.post('/api/crm/sources', data);
  return res.data?.data ?? res.data;
}

export async function initDefaultSources(): Promise<void> {
  await apiClient.post('/api/crm/sources/init-defaults', {});
}

// ── Follow-ups ─────────────────────────────────────────────────────────────────

export async function getFollowUps(params?: { status?: string; assignedToId?: string; leadId?: string; upcoming?: string }): Promise<LeadFollowUp[]> {
  const res = await apiClient.get(`/api/crm/follow-ups${toQuery(params)}`);
  return unwrapCrmArray(res);
}

export async function createFollowUp(data: { leadId: string; followUpDate: string; followUpTime?: string; type?: string; notes?: string; assignedToId?: string }): Promise<LeadFollowUp> {
  const res = await apiClient.post('/api/crm/follow-ups', data);
  return res.data?.data ?? res.data;
}

export async function completeFollowUp(id: string, notes?: string): Promise<void> {
  await apiClient.patch(`/api/crm/follow-ups/${id}/complete`, { notes });
}

// ── Google Sheets ──────────────────────────────────────────────────────────────

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await apiClient.get('/api/crm/google-sheets/auth-url');
  return (res.data?.data ?? res.data)?.authUrl;
}

export async function getGoogleConnections(): Promise<any[]> {
  const res = await apiClient.get('/api/crm/google-sheets/connections');
  return unwrapCrmArray(res);
}

export async function disconnectGoogleConnection(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/google-sheets/connections/${id}`);
}

export async function listSpreadsheets(connectionId: string): Promise<any[]> {
  const res = await apiClient.get(`/api/crm/google-sheets/connections/${connectionId}/spreadsheets`);
  return unwrapCrmArray(res);
}

export async function getSheetNames(connectionId: string, spreadsheetId: string): Promise<string[]> {
  const res = await apiClient.get(`/api/crm/google-sheets/connections/${connectionId}/sheets/${spreadsheetId}`);
  return unwrapCrmArray(res);
}

export async function previewGoogleSheet(connectionId: string, spreadsheetId: string, sheetName?: string): Promise<any> {
  const q = `?spreadsheetId=${spreadsheetId}${sheetName ? `&sheetName=${encodeURIComponent(sheetName)}` : ''}`;
  const res = await apiClient.get(`/api/crm/google-sheets/connections/${connectionId}/preview${q}`);
  return res.data?.data ?? res.data;
}

export async function updateConnectionConfig(id: string, config: any): Promise<void> {
  await apiClient.put(`/api/crm/google-sheets/connections/${id}/config`, config);
}

export async function syncGoogleSheet(id: string): Promise<any> {
  const res = await apiClient.post(`/api/crm/google-sheets/connections/${id}/sync`, {});
  return res.data?.data ?? res.data;
}

// ── Import ─────────────────────────────────────────────────────────────────────

export async function previewImportFile(file: File): Promise<any> {
  const fd = new FormData(); fd.append('file', file);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('active_company_id') : null;
  const { API_BASE_URL } = await import('@/lib/constants');
  const res = await fetch(`${API_BASE_URL}/api/crm/import/preview`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(companyId ? { 'X-Company-Id': companyId } : {}) },
    body: fd,
  });
  return res.json();
}

export async function importFromFile(file: File, mapping: Record<string, string>, duplicateAction = 'SKIP'): Promise<any> {
  const fd = new FormData(); fd.append('file', file);
  fd.append('mapping', JSON.stringify(mapping));
  fd.append('duplicateAction', duplicateAction);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('active_company_id') : null;
  const { API_BASE_URL } = await import('@/lib/constants');
  const res = await fetch(`${API_BASE_URL}/api/crm/import/execute`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(companyId ? { 'X-Company-Id': companyId } : {}) },
    body: fd,
  });
  return res.json();
}

export async function getImportJobs(): Promise<any[]> {
  const res = await apiClient.get('/api/crm/import/jobs');
  return unwrapCrmArray(res);
}

export async function getMappingTemplates(): Promise<any[]> {
  const res = await apiClient.get('/api/crm/import/mapping-templates');
  return unwrapCrmArray(res);
}

export async function saveMappingTemplate(data: { templateName: string; mapping: Record<string, string>; fileType?: string }): Promise<void> {
  await apiClient.post('/api/crm/import/mapping-templates', data);
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export interface ContactLink {
  id?: string;
  linkDoctype: string;
  linkName: string;
  linkTitle?: string;
}

export interface Contact {
  id: string;
  companyId: string;
  salutation?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  gender?: string;
  status?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  isPrimaryContact?: boolean;
  unsubscribed?: boolean;
  accountId?: string;
  leadId?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  links?: ContactLink[];
  customFields?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  account?: { id: string; name: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export interface ContactListParams {
  page?: number; limit?: number; search?: string; accountId?: string; assignedToId?: string;
  sortBy?: string; sortDir?: string;
}

export async function getContacts(params: ContactListParams = {}): Promise<{ contacts: Contact[]; total: number; page: number; limit: number; pages: number }> {
  const query: Record<string, string | number> = {};
  if (params.page != null) query.page = params.page;
  if (params.limit != null) query.limit = params.limit;
  if (params.search) query.search = params.search;
  if (params.assignedToId) query.assignedToId = params.assignedToId;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDir) query.sortDir = params.sortDir;
  // Backend filter is customerId (ERP Customer = CRM Account)
  if (params.accountId) query.customerId = params.accountId;
  const q = new URLSearchParams(query as any).toString();
  const res = await apiClient.get(`/api/crm/contacts?${q}`);
  return unwrapPaginatedList(res, 'contacts', params.limit ?? 50);
}

export async function getContactById(id: string): Promise<Contact> {
  const res = await apiClient.get(`/api/crm/contacts/${id}`);
  return res.data?.data ?? res.data;
}

export async function createContact(data: Partial<Contact>): Promise<Contact> {
  const res = await apiClient.post('/api/crm/contacts', data);
  return res.data?.data ?? res.data;
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
  const res = await apiClient.put(`/api/crm/contacts/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/contacts/${id}`);
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export interface CRMAccount {
  id: string;
  companyId: string;
  name: string;
  customerNumber?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  annualRevenue?: number;
  employeeCount?: number;
  type?: string;
  rating?: string;
  assignedToId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; firstName: string; lastName: string };
  _count?: { contacts: number; opportunities: number };
}

export async function getAccounts(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ accounts: CRMAccount[]; total: number; page: number; limit: number; pages: number }> {
  const res = await apiClient.get(`/api/crm/accounts${toQuery(params)}`);
  return unwrapPaginatedList(res, 'accounts', params.limit ?? 50);
}

export async function getAccountById(id: string): Promise<CRMAccount> {
  const res = await apiClient.get(`/api/crm/accounts/${id}`);
  return res.data?.data ?? res.data;
}

export async function createAccount(payload: {
  name: string;
  customerType?: string;
  customerGroup?: string;
  territory?: string;
  defaultCurrency?: string;
  language?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  industry?: string;
  marketSegment?: string;
  taxId?: string;
  notes?: string;
  fromLeadId?: string;
}): Promise<CRMAccount> {
  const res = await apiClient.post('/api/crm/accounts', payload);
  return res.data?.data ?? res.data;
}

export async function updateAccount(id: string, payload: Partial<{
  name: string;
  customerType: string;
  customerGroup: string;
  territory: string;
  defaultCurrency: string;
  language: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  industry: string;
  marketSegment: string;
  taxId: string;
  notes: string;
}>): Promise<CRMAccount> {
  const res = await apiClient.put(`/api/crm/accounts/${id}`, payload);
  return res.data?.data ?? res.data;
}

export async function deleteAccountById(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/accounts/${id}`);
}

// ── Opportunities ──────────────────────────────────────────────────────────────

/** ERPNext-aligned CRM Opportunity (maps customerId ↔ accountId for legacy UI). */
export interface CRMOpportunity {
  id: string;
  companyId: string;
  opportunityNumber?: string;
  name: string;
  stage: string;
  status?: string;
  opportunityFrom?: string;
  type?: string;
  expectedRevenue?: number;
  currency?: string;
  probability?: number;
  expectedClosingDate?: string;
  transactionDate?: string;
  contactId?: string;
  customerId?: string;
  leadId?: string;
  customerName?: string;
  source?: string;
  assignedToId?: string;
  salesTeam?: string;
  description?: string;
  competitors?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  lostReason?: string;
  wonReason?: string;
  noOfEmployees?: string;
  annualRevenue?: number;
  industry?: string;
  marketSegment?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  territory?: string;
  campaign?: string;
  contactPerson?: string;
  jobTitle?: string;
  contactEmail?: string;
  contactMobile?: string;
  whatsapp?: string;
  phone?: string;
  phoneExt?: string;
  quotationId?: string;
  salesOrderId?: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated use expectedRevenue */
  amount?: number;
  /** @deprecated use customerId */
  accountId?: string;
  /** @deprecated use expectedClosingDate */
  expectedCloseDate?: string;
  actualCloseDate?: string;
  priority?: string;
  isWon?: boolean;
  isLost?: boolean;
  contact?: { id: string; fullName?: string; firstName: string; lastName: string };
  account?: { id: string; name: string };
  customer?: { id: string; name: string; customerNumber?: string };
  lead?: { id: string; fullName: string; leadNumber?: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export type Opportunity = CRMOpportunity;

function mapOpportunityFromApi(raw: Record<string, any>): CRMOpportunity {
  if (!raw || typeof raw !== 'object') return raw as CRMOpportunity;
  return {
    ...raw,
    amount: raw.expectedRevenue ?? raw.amount,
    accountId: raw.customerId ?? raw.accountId,
    expectedCloseDate: raw.expectedClosingDate ?? raw.expectedCloseDate,
    account: raw.customer ?? raw.account,
  } as CRMOpportunity;
}

export interface OpportunityListParams {
  page?: number; limit?: number; search?: string; stage?: string; assignedToId?: string;
  accountId?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortDir?: string;
}

export async function getOpportunities(params: OpportunityListParams = {}): Promise<{ opportunities: Opportunity[]; total: number; page: number; limit: number; pages: number }> {
  const query: Record<string, string | number> = { ...(params as any) };
  if (params.accountId) {
    query.customerId = params.accountId;
    delete query.accountId;
  }
  const q = new URLSearchParams(query as any).toString();
  const res = await apiClient.get(`/api/crm/opportunities?${q}`);
  return unwrapPaginatedList(res, 'opportunities', params.limit ?? 50);
}

export async function getOpportunityById(id: string): Promise<CRMOpportunity> {
  const res = await apiClient.get(`/api/crm/opportunities/${id}`);
  return mapOpportunityFromApi(res.data?.data ?? res.data);
}

export type CreateOpportunityInput = Partial<CRMOpportunity> & {
  amount?: number;
  accountId?: string;
  expectedCloseDate?: string;
};

export async function createOpportunity(data: CreateOpportunityInput): Promise<CRMOpportunity> {
  const {
    amount,
    expectedRevenue,
    accountId,
    customerId,
    expectedCloseDate,
    expectedClosingDate,
  } = data;

  const payload: Record<string, unknown> = {
    name: data.name,
    stage: data.stage,
    status: data.status,
    opportunityFrom: data.opportunityFrom,
    type: data.type,
    source: data.source,
    currency: data.currency,
    transactionDate: data.transactionDate,
    assignedToId: data.assignedToId,
    salesTeam: data.salesTeam,
    description: data.description,
    competitors: data.competitors,
    notes: data.notes,
    tags: data.tags,
    customFields: data.customFields,
    leadId: data.leadId,
    contactId: data.contactId,
    customerId: customerId ?? accountId ?? undefined,
    customerName: data.customerName,
    expectedRevenue:
      expectedRevenue !== undefined && expectedRevenue !== null
        ? expectedRevenue
        : amount !== undefined && amount !== null
          ? amount
          : undefined,
    probability: data.probability,
    expectedClosingDate: expectedClosingDate ?? expectedCloseDate ?? undefined,
    noOfEmployees: data.noOfEmployees,
    annualRevenue: data.annualRevenue,
    industry: data.industry,
    marketSegment: data.marketSegment,
    website: data.website,
    city: data.city,
    state: data.state,
    country: data.country,
    territory: data.territory,
    campaign: data.campaign,
    contactPerson: data.contactPerson,
    jobTitle: data.jobTitle,
    contactEmail: data.contactEmail,
    contactMobile: data.contactMobile,
    whatsapp: data.whatsapp,
    phone: data.phone,
    phoneExt: data.phoneExt,
    lostReason: data.lostReason,
    wonReason: data.wonReason,
    quotationId: data.quotationId,
    salesOrderId: data.salesOrderId,
  };

  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined && v !== ''),
  );

  const res = await apiClient.post('/api/crm/opportunities', cleaned);
  return mapOpportunityFromApi(res.data?.data ?? res.data);
}

export async function updateOpportunity(id: string, data: CreateOpportunityInput): Promise<CRMOpportunity> {
  const {
    amount,
    expectedRevenue,
    accountId,
    customerId,
    expectedCloseDate,
    expectedClosingDate,
    account,
    customer,
    ...rest
  } = data;

  const payload: Record<string, unknown> = {
    ...rest,
    customerId: customerId ?? accountId,
    expectedRevenue: expectedRevenue ?? amount,
    expectedClosingDate: expectedClosingDate ?? expectedCloseDate,
  };
  delete payload.amount;
  delete payload.accountId;
  delete payload.expectedCloseDate;
  delete payload.account;
  delete payload.customer;

  const res = await apiClient.put(`/api/crm/opportunities/${id}`, payload);
  return mapOpportunityFromApi(res.data?.data ?? res.data);
}

export async function updateOpportunityStage(id: string, stage: string): Promise<CRMOpportunity> {
  const res = await apiClient.patch(`/api/crm/opportunities/${id}/stage`, { stage });
  return mapOpportunityFromApi(res.data?.data ?? res.data);
}

export async function deleteOpportunity(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/opportunities/${id}`);
}

// ── Activities ────────────────────────────────────────────────────────────────

export interface CRMActivity {
  id: string;
  companyId: string;
  type: string;
  subject: string;
  description?: string;
  status: string;
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  duration?: number;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;
  leadId?: string;
  assignedToId?: string;
  outcome?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contact?: { id: string; firstName: string; lastName: string };
  account?: { id: string; name: string };
  opportunity?: { id: string; name: string };
  lead?: { id: string; fullName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export interface ActivityListParams {
  page?: number; limit?: number; search?: string; type?: string; status?: string;
  assignedToId?: string; contactId?: string; accountId?: string; opportunityId?: string;
  leadId?: string; dateFrom?: string; dateTo?: string;
}

export async function getActivities(params: ActivityListParams = {}): Promise<{ activities: CRMActivity[]; total: number; page: number; limit: number; pages: number }> {
  const query: Record<string, string | number> = { ...(params as any) };
  if (params.accountId) {
    query.customerId = params.accountId;
    delete query.accountId;
  }
  const q = new URLSearchParams(query as any).toString();
  const res = await apiClient.get(`/api/crm/activities?${q}`);
  return unwrapPaginatedList(res, 'activities', params.limit ?? 50);
}

export async function createActivity(data: Partial<CRMActivity>): Promise<CRMActivity> {
  const res = await apiClient.post('/api/crm/activities', data);
  return res.data?.data ?? res.data;
}

export async function updateActivity(id: string, data: Partial<CRMActivity>): Promise<CRMActivity> {
  const res = await apiClient.put(`/api/crm/activities/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteActivity(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/activities/${id}`);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface CRMTask {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  completedAt?: string;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;
  leadId?: string;
  assignedToId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  contact?: { id: string; firstName: string; lastName: string };
  account?: { id: string; name: string };
  opportunity?: { id: string; name: string };
  lead?: { id: string; fullName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export interface TaskListParams {
  page?: number; limit?: number; search?: string; status?: string; priority?: string;
  assignedToId?: string; contactId?: string; opportunityId?: string; leadId?: string;
  dateFrom?: string; dateTo?: string;
}

export async function getTasks(params: TaskListParams = {}): Promise<{ tasks: CRMTask[]; total: number; page: number; limit: number; pages: number }> {
  const res = await apiClient.get(`/api/crm/tasks${toQuery(params)}`);
  return unwrapPaginatedList(res, 'tasks', params.limit ?? 50);
}

export async function createTask(data: Partial<CRMTask>): Promise<CRMTask> {
  const res = await apiClient.post('/api/crm/tasks', data);
  return res.data?.data ?? res.data;
}

export async function updateTask(id: string, data: Partial<CRMTask>): Promise<CRMTask> {
  const res = await apiClient.put(`/api/crm/tasks/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/tasks/${id}`);
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  type: 'activity' | 'task' | 'followup';
  title: string;
  date: string;
  time?: string;
  status: string;
  entityType?: string;
  entityId?: string;
  assignedTo?: { id: string; firstName: string; lastName: string };
}

export async function getCalendarEvents(params: { from: string; to: string; assignedToId?: string }): Promise<CalendarEvent[]> {
  const res = await apiClient.get(`/api/crm/calendar${toQuery(params)}`);
  const raw = unwrapCrmPayload(res);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.events)) return raw.events;
  return [];
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  actualCost?: number;
  expectedRevenue?: number;
  targetCount?: number;
  description?: string;
  assignedToId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; firstName: string; lastName: string };
  _count?: { leads: number };
}

export interface CampaignListParams {
  page?: number; limit?: number; search?: string; status?: string; type?: string;
}

export async function getCampaigns(params: CampaignListParams = {}): Promise<{ campaigns: Campaign[]; total: number; page: number; limit: number; pages: number }> {
  const res = await apiClient.get(`/api/crm/campaigns${toQuery(params)}`);
  return unwrapPaginatedList(res, 'campaigns', params.limit ?? 50);
}

export async function getCampaignById(id: string): Promise<Campaign> {
  const res = await apiClient.get(`/api/crm/campaigns/${id}`);
  return res.data?.data ?? res.data;
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const res = await apiClient.post('/api/crm/campaigns', data);
  return res.data?.data ?? res.data;
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  const res = await apiClient.put(`/api/crm/campaigns/${id}`, data);
  return res.data?.data ?? res.data;
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/campaigns/${id}`);
}

// ── ERPNext Masters ───────────────────────────────────────────────────────────

export interface CrmMasterRecord {
  id: string;
  companyId?: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  website?: string | null;
  parentId?: string | null;
}

function bindMasterCrud(basePath: string) {
  return {
    list: async (): Promise<CrmMasterRecord[]> => {
      const res = await apiClient.get(`/api/crm/${basePath}`);
      return unwrapCrmArray(res);
    },
    get: async (id: string): Promise<CrmMasterRecord | null> => {
      try {
        const res = await apiClient.get(`/api/crm/${basePath}/${id}`);
        return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
      } catch {
        const list = await unwrapCrmArray(await apiClient.get(`/api/crm/${basePath}`));
        return list.find((r) => r.id === id) || null;
      }
    },
    create: async (data: { name: string } & Partial<CrmMasterRecord>): Promise<CrmMasterRecord> => {
      const res = await apiClient.post(`/api/crm/${basePath}`, data);
      return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
    },
    update: async (id: string, data: Partial<CrmMasterRecord>): Promise<CrmMasterRecord> => {
      const res = await apiClient.put(`/api/crm/${basePath}/${id}`, data);
      return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
    },
    remove: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/crm/${basePath}/${id}`);
    },
  };
}

export interface SalesStageRecord extends CrmMasterRecord {
  sortOrder?: number;
}

const salesStagesApi = bindMasterCrud('sales-stages');
export const getSalesStages = salesStagesApi.list;
export const getSalesStage = async (id: string): Promise<SalesStageRecord | null> => {
  const item = await salesStagesApi.get(id);
  return (item as SalesStageRecord) || null;
};
export const createSalesStage = salesStagesApi.create;
export const updateSalesStage = salesStagesApi.update;
export const deleteSalesStage = salesStagesApi.remove;

export interface OpportunityTypeRecord extends CrmMasterRecord {
  description?: string;
}

const opportunityTypesApi = bindMasterCrud('opportunity-types');
export const getOpportunityTypes = opportunityTypesApi.list;
export const getOpportunityType = async (id: string): Promise<OpportunityTypeRecord | null> => {
  const item = await opportunityTypesApi.get(id);
  return (item as OpportunityTypeRecord) || null;
};
export const createOpportunityType = opportunityTypesApi.create;
export const updateOpportunityType = opportunityTypesApi.update;
export const deleteOpportunityType = opportunityTypesApi.remove;

export interface MarketSegmentRecord extends CrmMasterRecord {
  description?: string;
}

const marketSegmentsApi = bindMasterCrud('market-segments');
export const getMarketSegments = marketSegmentsApi.list;
export const getMarketSegment = async (id: string): Promise<MarketSegmentRecord | null> => {
  const item = await marketSegmentsApi.get(id);
  return (item as MarketSegmentRecord) || null;
};
export const createMarketSegment = marketSegmentsApi.create;
export const updateMarketSegment = marketSegmentsApi.update;
export const deleteMarketSegment = marketSegmentsApi.remove;

export interface TerritoryTarget {
  id?: string;
  itemGroup?: string;
  fiscalYear: string;
  targetQty?: number | string;
  targetAmount?: number | string;
  distributionId?: string;
}

export interface TerritoryRecord extends CrmMasterRecord {
  isGroup?: boolean;
  parentTerritory?: string | null;
  territoryManager?: string | null;
  targets?: TerritoryTarget[];
  children?: TerritoryRecord[];
}

const territoriesApi = bindMasterCrud('territories');
export const getTerritories = territoriesApi.list;
export const getTerritory = async (id: string): Promise<TerritoryRecord | null> => {
  const item = await territoriesApi.get(id);
  return (item as TerritoryRecord) || null;
};
export const createTerritory = territoriesApi.create;
export const updateTerritory = territoriesApi.update;
export const deleteTerritory = territoriesApi.remove;

export interface CreditLimitRow {
  id?: string;
  company?: string;
  creditLimit?: number | string;
  bypassCreditLimitCheck?: boolean;
}

export interface CustomerGroupRecord extends CrmMasterRecord {
  parentCustomerGroup?: string | null;
  isGroup?: boolean;
  defaultPriceList?: string | null;
  paymentTerms?: string | null;
  defaultReceivableAccount?: string | null;
  creditLimits?: CreditLimitRow[];
  children?: CustomerGroupRecord[];
}

const customerGroupsApi = bindMasterCrud('customer-groups');
export const getCustomerGroups = customerGroupsApi.list;
export const getCustomerGroup = async (id: string): Promise<CustomerGroupRecord | null> => {
  const item = await customerGroupsApi.get(id);
  return (item as CustomerGroupRecord) || null;
};
export const createCustomerGroup = customerGroupsApi.create;
export const updateCustomerGroup = customerGroupsApi.update;
export const deleteCustomerGroup = customerGroupsApi.remove;

export interface LostReasonRecord extends CrmMasterRecord {
  description?: string;
}

const lostReasonsApi = bindMasterCrud('lost-reasons');
export const getLostReasons = lostReasonsApi.list;
export const getLostReason = async (id: string): Promise<LostReasonRecord | null> => {
  const item = await lostReasonsApi.get(id);
  return (item as LostReasonRecord) || null;
};
export const createLostReason = lostReasonsApi.create;
export const updateLostReason = lostReasonsApi.update;
export const deleteLostReason = lostReasonsApi.remove;

export interface CompetitorRecord extends CrmMasterRecord {
  website?: string | null;
  description?: string;
}

const competitorsApi = bindMasterCrud('competitors');
export const getCompetitors = competitorsApi.list;
export const getCompetitor = async (id: string): Promise<CompetitorRecord | null> => {
  const item = await competitorsApi.get(id);
  return (item as CompetitorRecord) || null;
};
export const createCompetitor = competitorsApi.create;
export const updateCompetitor = competitorsApi.update;
export const deleteCompetitor = competitorsApi.remove;

export interface LeadSourceRecord extends CrmMasterRecord {
  color?: string;
  isDefault?: boolean;
}

const leadSourcesApi = bindMasterCrud('lead-sources');
export const getLeadSource = async (id: string): Promise<LeadSourceRecord | null> => {
  const item = await leadSourcesApi.get(id);
  return (item as LeadSourceRecord) || null;
};
export const updateLeadSource = async (id: string, data: Partial<LeadSourceRecord>): Promise<LeadSourceRecord> => {
  return (await leadSourcesApi.update(id, data as any)) as LeadSourceRecord;
};
export const deleteLeadSource = leadSourcesApi.remove;

export async function seedErpnextMasters(): Promise<{ message?: string }> {
  const res = await apiClient.post('/api/crm/masters/seed', {});
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

// ── ERPNext CRM Settings ─────────────────────────────────────────────────────

export interface CrmErpSettings {
  id: string;
  companyId: string;
  allowLeadDuplicationBasedOnEmail?: boolean;
  autoCreationOfContact?: boolean;
  closeOpportunityAfterDays?: number | null;
  defaultQuotationValidTillDays?: number | null;
  carryForwardCommunication?: boolean;
  campaignNamingBy?: string | null;
  enableOpportunityFromContactUs?: boolean;
  updateTimestampOnNewCommunication?: boolean;
}

export async function getCrmSettings(): Promise<CrmErpSettings> {
  const res = await apiClient.get('/api/crm/crm-settings');
  const raw = unwrapCrmPayload(res);
  return (raw && typeof raw === 'object' ? raw : {}) as CrmErpSettings;
}

export async function updateCrmSettings(data: Partial<CrmErpSettings>): Promise<CrmErpSettings> {
  const res = await apiClient.put('/api/crm/crm-settings', data);
  const raw = unwrapCrmPayload(res);
  return (raw && typeof raw === 'object' ? raw : {}) as CrmErpSettings;
}

// ── Prospects ─────────────────────────────────────────────────────────────────

export interface Prospect {
  id: string;
  companyId?: string;
  companyName: string;
  industry?: string | null;
  territory?: string | null;
  marketSegment?: string | null;
  customerGroup?: string | null;
  noOfEmployees?: string | null;
  annualRevenue?: number | null;
  website?: string | null;
  fax?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  prospectOwner?: { id: string; firstName: string; lastName: string; email?: string };
  _count?: { leads: number; opportunities: number };
  leads?: { id: string; leadId: string; lead: { id: string; leadNumber?: string; fullName: string; status: string; companyName?: string; email?: string } }[];
  opportunities?: { id: string; opportunityId: string; opportunity: { id: string; opportunityNumber?: string; name: string; stage: string; status?: string; expectedRevenue?: number } }[];
}

export async function getProspects(params?: { search?: string }): Promise<Prospect[]> {
  const q = params?.search ? `?${new URLSearchParams({ search: params.search }).toString()}` : '';
  const res = await apiClient.get(`/api/crm/prospects${q}`);
  return unwrapCrmArray(res);
}

export async function getProspect(id: string): Promise<Prospect> {
  const res = await apiClient.get(`/api/crm/prospects/${id}`);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function createProspect(data: Partial<Prospect>): Promise<Prospect> {
  const res = await apiClient.post('/api/crm/prospects', data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function updateProspect(id: string, data: Partial<Prospect>): Promise<Prospect> {
  const res = await apiClient.put(`/api/crm/prospects/${id}`, data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function deleteProspect(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/prospects/${id}`);
}

export async function addLeadToProspect(prospectId: string, leadId: string): Promise<void> {
  await apiClient.post(`/api/crm/prospects/${prospectId}/leads`, { leadId });
}

export async function makeOpportunityFromProspect(
  prospectId: string,
  data?: { name?: string; stage?: string; type?: string; source?: string },
): Promise<CRMOpportunity> {
  const res = await apiClient.post(`/api/crm/prospects/${prospectId}/make-opportunity`, data ?? {});
  return mapOpportunityFromApi(unwrapCrmPayload(res) ?? res.data?.data ?? res.data);
}

// ── Appointments ──────────────────────────────────────────────────────────────

export interface CrmAppointment {
  id: string;
  scheduledTime: string;
  status: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  details?: string | null;
  appointmentWith?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string };
  createdAt?: string;
}

export async function getAppointments(params?: { status?: string }): Promise<CrmAppointment[]> {
  const q = params?.status ? `?${new URLSearchParams({ status: params.status }).toString()}` : '';
  const res = await apiClient.get(`/api/crm/appointments${q}`);
  return unwrapCrmArray(res);
}

export async function getAppointment(id: string): Promise<CrmAppointment> {
  const res = await apiClient.get(`/api/crm/appointments/${id}`);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function createAppointment(data: Partial<CrmAppointment> & { scheduledTime: string; customerName: string }): Promise<CrmAppointment> {
  const res = await apiClient.post('/api/crm/appointments', data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function updateAppointment(id: string, data: Partial<CrmAppointment>): Promise<CrmAppointment> {
  const res = await apiClient.put(`/api/crm/appointments/${id}`, data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/appointments/${id}`);
}

// ── Contracts ─────────────────────────────────────────────────────────────────

export interface CrmContract {
  id: string;
  contractNumber?: string;
  partyName: string;
  partyType?: string;
  partyId?: string | null;
  status?: string;
  fulfilmentStatus?: string;
  startDate?: string | null;
  endDate?: string | null;
  contractTerms?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getContracts(params?: { status?: string }): Promise<CrmContract[]> {
  const q = params?.status ? `?${new URLSearchParams({ status: params.status }).toString()}` : '';
  const res = await apiClient.get(`/api/crm/contracts${q}`);
  return unwrapCrmArray(res);
}

export async function getContract(id: string): Promise<CrmContract> {
  const res = await apiClient.get(`/api/crm/contracts/${id}`);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function createContract(data: Partial<CrmContract> & { partyName: string }): Promise<CrmContract> {
  const res = await apiClient.post('/api/crm/contracts', data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function updateContract(id: string, data: Partial<CrmContract>): Promise<CrmContract> {
  const res = await apiClient.put(`/api/crm/contracts/${id}`, data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function deleteContract(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/contracts/${id}`);
}

// ── Email Campaigns ───────────────────────────────────────────────────────────

export interface EmailCampaign {
  id: string;
  name: string;
  campaignId?: string | null;
  emailCampaignFor?: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  notes?: string | null;
  createdAt?: string;
}

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  const res = await apiClient.get('/api/crm/email-campaigns');
  return unwrapCrmArray(res);
}

export async function createEmailCampaign(data: Partial<EmailCampaign> & { name: string; startDate: string }): Promise<EmailCampaign> {
  const res = await apiClient.post('/api/crm/email-campaigns', data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function updateEmailCampaign(id: string, data: Partial<EmailCampaign>): Promise<EmailCampaign> {
  const res = await apiClient.put(`/api/crm/email-campaigns/${id}`, data);
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function deleteEmailCampaign(id: string): Promise<void> {
  await apiClient.delete(`/api/crm/email-campaigns/${id}`);
}

// ── Quotation from CRM ────────────────────────────────────────────────────────

export interface CrmQuotationResult {
  id: string;
  quotationNumber: string;
  status?: string;
  customerId?: string;
}

export async function makeQuotationFromLead(leadId: string): Promise<CrmQuotationResult> {
  const res = await apiClient.post(`/api/crm/leads/${leadId}/make-quotation`, {});
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

export async function makeQuotationFromOpportunity(oppId: string): Promise<CrmQuotationResult> {
  const res = await apiClient.post(`/api/crm/opportunities/${oppId}/make-quotation`, {});
  return unwrapCrmPayload(res) ?? res.data?.data ?? res.data;
}

// ── ERPNext Reports ───────────────────────────────────────────────────────────

export const ERPNEXT_REPORT_TYPES = [
  'lead-details',
  'sales-pipeline-analytics',
  'opportunity-summary-by-sales-stage',
  'sales-funnel',
  'prospects-engaged-but-not-converted',
  'first-response-time-for-opportunity',
  'inactive-customers',
  'campaign-efficiency',
  'lead-owner-efficiency',
] as const;

export type ErpnextReportType = (typeof ERPNEXT_REPORT_TYPES)[number];

export const ERPNEXT_REPORT_LABELS: Record<ErpnextReportType, string> = {
  'lead-details': 'Lead Details',
  'sales-pipeline-analytics': 'Sales Pipeline Analytics',
  'opportunity-summary-by-sales-stage': 'Opportunity Summary by Sales Stage',
  'sales-funnel': 'Sales Funnel',
  'prospects-engaged-but-not-converted': 'Prospects Engaged But Not Converted',
  'first-response-time-for-opportunity': 'First Response Time for Opportunity',
  'inactive-customers': 'Inactive Customers',
  'campaign-efficiency': 'Campaign Efficiency',
  'lead-owner-efficiency': 'Lead Owner Efficiency',
};

export async function getErpnextReport(
  type: ErpnextReportType,
  params?: Record<string, string>,
): Promise<Record<string, unknown>> {
  const cleaned = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v != null && String(v).length > 0),
  );
  const q = Object.keys(cleaned).length
    ? `?${new URLSearchParams(cleaned).toString()}`
    : '';
  const res = await apiClient.get(`/api/crm/erpnext-reports/${type}${q}`);
  const raw = unwrapCrmPayload(res);
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

export const APPOINTMENT_STATUSES = ['Open', 'Unverified', 'Closed'] as const;
export const APPOINTMENT_WITH = ['Lead', 'Customer'] as const;
export const EMAIL_CAMPAIGN_FOR = ['Lead', 'Contact', 'Customer'] as const;
export const EMAIL_CAMPAIGN_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Unsubscribed'] as const;
export const CONTRACT_PARTY_TYPES = ['Customer', 'Supplier'] as const;
export const CONTRACT_STATUSES = ['Unsigned', 'Active', 'Inactive'] as const;


export async function getReport(type: string, params?: Record<string, string>): Promise<any> {
  const res = await apiClient.get(`/api/crm/reports/${type}${toQuery(params)}`);
  return res.data?.data ?? res.data;
}

// ── Enterprise Dashboard ──────────────────────────────────────────────────────

export interface EnterpriseDashboard extends CRMDashboard {
  opportunityTotals?: {
    total: number; totalValue: number; won: number; wonValue: number; lost: number; pipeline: number;
  };
  taskSummary?: { total: number; pending: number; overdue: number; completed: number };
  activitySummary?: { total: number; calls: number; meetings: number; emails: number };
  opportunitiesByStage?: { stage: string; count: number; value: number }[];
  topContacts?: { id: string; fullName?: string; firstName: string; lastName: string; email?: string; opportunityCount: number }[];
  recentOpportunities?: Opportunity[];
}

export async function getEnterpriseDashboard(params?: { dateFrom?: string; dateTo?: string; assignedToId?: string }): Promise<EnterpriseDashboard> {
  try {
    const res = await apiClient.get(`/api/crm/dashboard/enterprise${toQuery(params)}`);
    const raw = res.data?.data ?? res.data;
    return { ...EMPTY_CRM_DASHBOARD, ...(typeof raw === 'object' ? raw : {}) };
  } catch {
    // Fall back to base dashboard
    const base = await getCRMDashboard(params);
    return base as EnterpriseDashboard;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export const LEAD_STATUSES = [
  'Lead', 'Open', 'Replied', 'Opportunity', 'Quotation', 'Lost Quotation',
  'Interested', 'Converted', 'Do Not Contact',
];

export const LEAD_TYPES = ['', 'Client', 'Channel Partner', 'Consultant'];

export const REQUEST_TYPES = ['', 'Product Enquiry', 'Request for Information', 'Suggestions', 'Other'];

export const QUALIFICATION_STATUSES = ['Unqualified', 'In Process', 'Qualified'];

export const NO_OF_EMPLOYEES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export const SALUTATIONS = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Mx'];

export const GENDERS = ['Male', 'Female', 'Other'];

export const DEFAULT_LEAD_SOURCES = [
  'Existing Customer', 'Reference', 'Advertisement', 'Cold Calling', 'Exhibition',
  'Supplier Reference', 'Mass Mailing', "Customer's Vendor", 'Campaign', 'Walk In',
];

export const OPPORTUNITY_STAGES = [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Value Proposition',
  'Identifying Decision Makers',
  'Perception Analysis',
  'Proposal/Price Quote',
  'Negotiation/Review',
];

export const OPPORTUNITY_STATUSES = ['Open', 'Quotation', 'Converted', 'Lost', 'Replied', 'Closed'];

export const OPPORTUNITY_TYPES = ['Sales', 'Support', 'Maintenance'];

export const OPPORTUNITY_FROM = ['Lead', 'Customer', 'Prospect'];

export const ACTIVITY_TYPES = ['Call', 'Meeting', 'Email', 'Demo', 'Follow-up', 'Task', 'Note'];

export const TASK_STATUSES = ['Open', 'In Progress', 'Completed', 'Cancelled'];

export const CAMPAIGN_TYPES = ['Email', 'Social Media', 'Paid Ads', 'Content', 'Event', 'Referral', 'Other'];

export const CAMPAIGN_STATUSES = ['Draft', 'Active', 'Paused', 'Completed', 'Cancelled'];

export const STATUS_COLORS: Record<string, string> = {
  Lead: 'bg-slate-100 text-slate-700',
  Open: 'bg-blue-100 text-blue-700',
  Replied: 'bg-cyan-100 text-cyan-700',
  Opportunity: 'bg-indigo-100 text-indigo-700',
  Quotation: 'bg-violet-100 text-violet-700',
  'Lost Quotation': 'bg-orange-100 text-orange-700',
  Interested: 'bg-yellow-100 text-yellow-700',
  Converted: 'bg-green-100 text-green-700',
  'Do Not Contact': 'bg-red-100 text-red-700',
  // legacy
  New: 'bg-gray-100 text-gray-700',
  Contacted: 'bg-blue-100 text-blue-700',
  Qualified: 'bg-yellow-100 text-yellow-700',
  Unqualified: 'bg-orange-100 text-orange-700',
  Nurturing: 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-purple-100 text-purple-700',
  Negotiation: 'bg-orange-100 text-orange-700',
  Lost: 'bg-red-100 text-red-700',
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  Lead: '#64748b',
  Open: '#3b82f6',
  Replied: '#06b6d4',
  Opportunity: '#6366f1',
  Quotation: '#8b5cf6',
  'Lost Quotation': '#f97316',
  Interested: '#f59e0b',
  Converted: '#10b981',
  'Do Not Contact': '#ef4444',
  // legacy
  New: '#6b7280',
  Contacted: '#3b82f6',
  Qualified: '#f59e0b',
  Unqualified: '#f97316',
  Nurturing: '#8b5cf6',
  'Follow-up': '#8b5cf6',
  Negotiation: '#f97316',
  Lost: '#ef4444',
};

export const OPPORTUNITY_STAGE_COLORS: Record<string, string> = {
  Prospecting: 'bg-slate-100 text-slate-700',
  Qualification: 'bg-gray-100 text-gray-700',
  'Needs Analysis': 'bg-blue-100 text-blue-700',
  'Value Proposition': 'bg-indigo-100 text-indigo-700',
  'Identifying Decision Makers': 'bg-violet-100 text-violet-700',
  'Perception Analysis': 'bg-purple-100 text-purple-700',
  'Proposal/Price Quote': 'bg-yellow-100 text-yellow-700',
  'Negotiation/Review': 'bg-orange-100 text-orange-700',
  // legacy pipeline / closed stages
  Proposal: 'bg-yellow-100 text-yellow-700',
  Negotiation: 'bg-orange-100 text-orange-700',
  Won: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

export const OPPORTUNITY_STAGE_DOT_COLORS: Record<string, string> = {
  Prospecting: '#64748b',
  Qualification: '#6b7280',
  'Needs Analysis': '#3b82f6',
  'Value Proposition': '#6366f1',
  'Identifying Decision Makers': '#8b5cf6',
  'Perception Analysis': '#a855f7',
  'Proposal/Price Quote': '#f59e0b',
  'Negotiation/Review': '#f97316',
  Proposal: '#f59e0b',
  Negotiation: '#f97316',
  Won: '#10b981',
  Lost: '#ef4444',
};

export const PRIORITY_COLORS: Record<string, string> = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-100 text-blue-600',
  'High': 'bg-orange-100 text-orange-700',
  'Urgent': 'bg-red-100 text-red-700',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  'Open': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'currency', label: 'Currency' },
  { value: 'user', label: 'User Assignment' },
  { value: 'status', label: 'Status' },
  { value: 'country', label: 'Country' },
];

