// Client for the Manufacturing document API served by the Express backend
// (/api/manufacturing/workspaces, /api/manufacturing/docs/*). Every screen in the Manufacturing module
// reads its navigation, fields and records from here so the UI can never drift
// away from what the backend actually validates.

import { apiClient } from './api-client';

export type MfgNavItem = {
  kind: 'home' | 'dashboard' | 'document' | 'page' | 'report' | 'tool' | 'settings' | 'section';
  label: string;
  href?: string | null;
  resource?: string;
  report?: string;
  doctype?: string;
  section?: string;
  available?: boolean;
  items?: MfgNavItem[];
};

export type MfgWorkspaceNav = {
  slug: string;
  label: string;
  icon?: string;
  items: MfgNavItem[];
  extraDocuments?: { label: string; resource: string; href?: string }[];
};

export type MfgNavPayload = {
  isManager: boolean;
  trackingLinks: { label: string; href: string }[];
  workspaces: MfgWorkspaceNav[];
};

export type MfgNumberCard = { label: string; value: number };
export type MfgChart = { label: string; points: { label: string; value: number; secondary?: number }[] } | null;

export type MfgDashboardChart = { label: string; chartType: 'bar' | 'line'; points: { label: string; value: number; secondary?: number }[] };

export type MfgDashboardPayload = {
  workspace: { slug: string; label: string; icon?: string; dashboard?: string | null };
  numberCards: MfgNumberCard[];
  chart: MfgChart;
  shortcuts: { label: string; resource: string; href: string; count: number }[];
  links: MfgNavItem[];
  trackingLinks: { label: string; href: string }[];
};

export type MfgFieldType =
  | 'data'
  | 'longText'
  | 'select'
  | 'multiSelect'
  | 'int'
  | 'float'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'time'
  | 'bool'
  | 'link'
  | 'employee'
  | 'multiEmployee'
  | 'userLink'
  | 'account'
  | 'currencyCode'
  | 'costCenter'
  | 'department'
  | 'designation'
  | 'office'
  | 'company'
  | 'holiday'
  | 'keyValue'
  | 'table'
  | string;

export type MfgFieldClause = {
  field?: string;
  equals?: string | number | boolean;
  notEquals?: string | number | boolean;
  in?: (string | number)[];
  truthy?: boolean;
  /** ERPNext `eval:a || b`: at least one of the nested clauses has to hold. */
  any?: MfgFieldClause[];
};

export type MfgField = {
  n: string;
  l: string;
  t: MfgFieldType;
  /** ERPNext Tab Break label (Overview / Billing / …). */
  tab?: string | null;
  /** ERPNext section heading the field sits under; consecutive fields group. */
  s?: string | null;
  r?: boolean;
  ro?: boolean;
  /** ERPNext `hidden`: kept out of the form entirely. */
  hidden?: boolean;
  d?: string | number | boolean | null;
  o?: string[] | string;
  hint?: string;
  min?: number;
  rows?: MfgField[];
  /** ERPNext `depends_on`: hidden unless every clause holds. */
  when?: MfgFieldClause[] | null;
  /** ERPNext `mandatory_depends_on`: required only while every clause holds. */
  reqWhen?: MfgFieldClause[] | null;
  /** ERPNext `fetch_from`: `<linkField>.<column>` copied from the linked record. */
  fetchFrom?: string | null;
  /** ERPNext Link `get_query` filters, e.g. parent department → is_group. */
  linkQuery?: Record<string, string | number | boolean> | null;
  /** Shown under the section heading when this field opens a new section. */
  sectionHint?: string | null;
};

/** ERPNext form buttons (get_weekly_off_dates, clear_table, …) that run server-side. */
export type MfgButton = { key: string; label: string };

export type MfgDescriptor = {
  resource: string;
  doctype: string;
  workspace: string;
  section: string | null;
  titleField: string | null;
  statuses: string[] | null;
  actions: { key: string; label: string; from: string[]; to: string[]; action?: string }[];
  buttons?: MfgButton[];
  columns: string[];
  search: string[];
  employeeScoped: boolean;
  selfScoped?: boolean;
  readOnly: boolean;
  kanban: boolean;
  filters: { dateField: string | null; status: boolean; department: boolean };
  fields: MfgField[];
};

export type MfgLinkOption = { id: string; label: string; disabled?: boolean };

export type MfgReportColumn = { key: string; label: string; type?: 'number' | 'currency' | 'date' };

export type MfgReportFilterKey = 'date' | 'employee' | 'department';

export type MfgReportFilterDef = {
  key: string;
  label: string;
  type: 'date' | 'select' | 'link' | 'data' | 'check' | 'company';
  options?: string[] | { value: string; label: string }[] | string;
  default?: string | number | boolean;
  required?: boolean;
  when?: Record<string, string | number | boolean>;
};

export type MfgReportResult = {
  report: string;
  doctype: string;
  columns: MfgReportColumn[];
  filterDefs?: MfgReportFilterDef[];
  requiresStandardWorkingHours?: boolean;
  filters: {
    available: MfgReportFilterKey[];
    values?: Record<string, unknown>;
    date: boolean;
    from: string | null;
    to: string | null;
    employeeId: string | null;
    department: string | null;
  };
  total: number;
  rows: Record<string, unknown>[];
};
export type MfgRow = Record<string, unknown> & { id: string; status?: string };

export type MfgListResult = {
  rows: MfgRow[];
  total: number;
  limit: number;
  offset: number;
  doctype: string;
};

export type MfgRecordMeta = {
  doctype: string;
  statuses: string[] | null;
  fields: MfgField[];
  actions: {
    key: string;
    label: string;
    from: string[];
    to: string[];
    action?: string;
    available?: boolean;
    allowed?: boolean;
  }[];
  buttons?: MfgButton[];
};

export type MfgFieldError = { field: string; message: string };

export class MfgApiError extends Error {
  status: number;
  errors: MfgFieldError[];
  data: Record<string, unknown> | null;
  constructor(
    message: string,
    status: number,
    errors: MfgFieldError[] = [],
    data: Record<string, unknown> | null = null
  ) {
    super(message);
    this.name = 'MfgApiError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

async function call<T>(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, body?: unknown): Promise<T> {
  const res =
    method === 'get'
      ? await apiClient.get(endpoint)
      : method === 'post'
        ? await apiClient.post(endpoint, body)
        : method === 'put'
          ? await apiClient.put(endpoint, body)
          : await apiClient.delete(endpoint);

  const payload = (res.data ?? {}) as {
    data?: T | Record<string, unknown>;
    message?: string;
    errors?: MfgFieldError[];
  };
  if (!res.success) {
    const nested =
      payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? (payload.data as Record<string, unknown>)
        : null;
    throw new MfgApiError(
      payload.message || res.message || `Manufacturing request failed (${res.statusCode})`,
      res.statusCode,
      payload.errors || [],
      nested
    );
  }
  return payload.data as T;
}

const DOCS = '/api/manufacturing/docs';

export function buildListQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const mfgWorkspaceService = {
  nav: () => call<MfgNavPayload>('get', '/api/manufacturing/workspaces'),
  dashboard: (slug: string) => call<MfgDashboardPayload>('get', `/api/manufacturing/workspaces/${slug}/dashboard`),
  charts: (slug: string) => call<MfgDashboardChart[]>('get', `/api/manufacturing/workspaces/${slug}/charts`),
  descriptors: (workspace?: string) =>
    call<{ workspaces: { slug: string; label: string }[]; descriptors: MfgDescriptor[] }>(
      'get',
      `${DOCS}${buildListQuery({ workspace })}`
    ),
  documentMeta: (resource: string) =>
    call<{ descriptor: MfgDescriptor; options: Record<string, MfgLinkOption[]> }>('get', `${DOCS}/${resource}/meta`),
  list: (resource: string, params: Record<string, string | number | undefined> = {}) =>
    call<MfgListResult>('get', `${DOCS}/${resource}${buildListQuery(params)}`),
  detail: (resource: string, id: string) =>
    call<{ row: MfgRow; meta: MfgRecordMeta }>('get', `${DOCS}/${resource}/${id}`),
  create: (resource: string, body: Record<string, unknown>) => call<MfgRow>('post', `${DOCS}/${resource}`, body),
  update: (resource: string, id: string, body: Record<string, unknown>) =>
    call<MfgRow>('put', `${DOCS}/${resource}/${id}`, body),
  remove: (resource: string, id: string) => call<{ id: string }>('delete', `${DOCS}/${resource}/${id}`),
  runAction: (resource: string, id: string, key: string, body: Record<string, unknown> = {}) =>
    call<MfgRow>('post', `${DOCS}/${resource}/${id}/action/${key}`, body),
  runButton: (resource: string, id: string, key: string, body: Record<string, unknown> = {}) =>
    call<MfgRow>('post', `${DOCS}/${resource}/${id}/button/${key}`, body),
  linkOptions: (target: string, search = '') => {
    // fieldOptionTarget may return "department?isGroup=true" — fold that into the query.
    const [base, qs = ''] = String(target || '').split('?');
    const params: Record<string, string | number | undefined> = {};
    for (const part of qs.split('&')) {
      if (!part) continue;
      const [k, v = ''] = part.split('=');
      if (k) params[k] = decodeURIComponent(v);
    }
    if (search) params.search = search;
    return call<MfgLinkOption[]>('get', `/api/manufacturing/link-options/${base}${buildListQuery(params)}`);
  },
  timeline: (resource: string, id: string) =>
    call<{
      comments: { id: string; detail: string; actorName: string; createdAt: string }[];
      activity: { id: string; action: string; detail: string; actorName: string; createdAt: string }[];
      createdAt: string | null;
      updatedAt: string | null;
    }>('get', `${DOCS}/${resource}/${id}/timeline`),
  addComment: (resource: string, id: string, comment: string) =>
    call<{
      comments: { id: string; detail: string; actorName: string; createdAt: string }[];
      activity: { id: string; action: string; detail: string; actorName: string; createdAt: string }[];
      createdAt: string | null;
      updatedAt: string | null;
    }>('post', `${DOCS}/${resource}/${id}/comment`, { comment }),
  report: (name: string, params: Record<string, string | number | undefined> = {}) =>
    call<MfgReportResult>('get', `/api/manufacturing/reports/${name}${buildListQuery(params)}`)
};

export const LINK_FIELD_TARGETS: Record<string, string> = {
  employee: 'employee',
  multiEmployee: 'employee',
  userLink: 'user',
  account: 'account',
  currencyCode: 'currency',
  costCenter: 'costCenter',
  department: 'department',
  designation: 'designation',
  office: 'office',
  company: 'company',
  holiday: 'holiday'
};

export function fieldOptionTarget(field: MfgField): string | null {
  const base = field.t === 'link' ? String(field.o || '') : LINK_FIELD_TARGETS[field.t] || null;
  if (!base) return null;
  const query = field.linkQuery;
  if (!query || !Object.keys(query).length) return base;
  const qs = Object.entries(query)
    .map(([k, v]) => `${k}=${v === true ? 'true' : v === false ? 'false' : String(v)}`)
    .join('&');
  return `${base}?${qs}`;
}

export function isComputedField(field: MfgField): boolean {
  return String(field.t).startsWith('computed');
}

export function defaultRowValue(field: MfgField): string | number | boolean | null {
  if (field.d !== undefined && field.d !== null) return field.d;
  if (field.t === 'bool') return false;
  if (['int', 'float', 'currency'].includes(String(field.t))) return 0;
  return '';
}
