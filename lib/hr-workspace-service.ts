// Client for the ERPNext-shaped HR document API served by the Express backend
// (/api/hr/workspaces, /api/hr/docs/*). Every screen in the rebuilt HR module
// reads its navigation, fields and records from here so the UI can never drift
// away from what the backend actually validates.

import { apiClient } from './api-client';

export type HrNavItem = {
  kind: 'home' | 'dashboard' | 'document' | 'page' | 'report' | 'tool' | 'settings' | 'section';
  label: string;
  href?: string | null;
  resource?: string;
  report?: string;
  doctype?: string;
  section?: string;
  available?: boolean;
  items?: HrNavItem[];
};

export type HrWorkspaceNav = {
  slug: string;
  label: string;
  icon?: string;
  items: HrNavItem[];
  extraDocuments?: { label: string; resource: string; href?: string }[];
};

export type HrNavPayload = {
  isManager: boolean;
  trackingLinks: { label: string; href: string }[];
  workspaces: HrWorkspaceNav[];
};

export type HrNumberCard = { label: string; value: number };
export type HrChart = { label: string; points: { label: string; value: number; secondary?: number }[] } | null;

export type HrDashboardChart = { label: string; chartType: 'bar' | 'line'; points: { label: string; value: number; secondary?: number }[] };

export type HrDashboardPayload = {
  workspace: { slug: string; label: string; icon?: string; dashboard?: string | null };
  numberCards: HrNumberCard[];
  chart: HrChart;
  shortcuts: { label: string; resource: string; href: string; count: number }[];
  links: HrNavItem[];
  trackingLinks: { label: string; href: string }[];
};

export type HrFieldType =
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

export type HrFieldClause = {
  field?: string;
  equals?: string | number | boolean;
  notEquals?: string | number | boolean;
  in?: (string | number)[];
  truthy?: boolean;
  /** ERPNext `eval:a || b`: at least one of the nested clauses has to hold. */
  any?: HrFieldClause[];
};

export type HrField = {
  n: string;
  l: string;
  t: HrFieldType;
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
  rows?: HrField[];
  /** ERPNext `depends_on`: hidden unless every clause holds. */
  when?: HrFieldClause[] | null;
  /** ERPNext `mandatory_depends_on`: required only while every clause holds. */
  reqWhen?: HrFieldClause[] | null;
  /** ERPNext `fetch_from`: `<linkField>.<column>` copied from the linked record. */
  fetchFrom?: string | null;
  /** ERPNext Link `get_query` filters, e.g. parent department → is_group. */
  linkQuery?: Record<string, string | number | boolean> | null;
  /** Shown under the section heading when this field opens a new section. */
  sectionHint?: string | null;
};

/** ERPNext form buttons (get_weekly_off_dates, clear_table, …) that run server-side. */
export type HrButton = { key: string; label: string };

export type HrDescriptor = {
  resource: string;
  doctype: string;
  workspace: string;
  section: string | null;
  titleField: string | null;
  statuses: string[] | null;
  actions: { key: string; label: string; from: string[]; to: string[]; action?: string }[];
  buttons?: HrButton[];
  columns: string[];
  search: string[];
  employeeScoped: boolean;
  selfScoped?: boolean;
  readOnly: boolean;
  kanban: boolean;
  filters: { dateField: string | null; status: boolean; department: boolean };
  fields: HrField[];
};

export type HrLinkOption = { id: string; label: string; disabled?: boolean };

export type HrReportColumn = { key: string; label: string; type?: 'number' | 'currency' | 'date' };

export type HrReportFilterKey = 'date' | 'employee' | 'department';

export type HrReportFilterDef = {
  key: string;
  label: string;
  type: 'date' | 'select' | 'link' | 'data' | 'check' | 'company';
  options?: string[] | { value: string; label: string }[] | string;
  default?: string | number | boolean;
  required?: boolean;
  when?: Record<string, string | number | boolean>;
};

export type HrReportResult = {
  report: string;
  doctype: string;
  columns: HrReportColumn[];
  filterDefs?: HrReportFilterDef[];
  requiresStandardWorkingHours?: boolean;
  filters: {
    available: HrReportFilterKey[];
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
export type HrRow = Record<string, unknown> & { id: string; status?: string };

export type HrListResult = {
  rows: HrRow[];
  total: number;
  limit: number;
  offset: number;
  doctype: string;
};

export type HrRecordMeta = {
  doctype: string;
  statuses: string[] | null;
  fields: HrField[];
  actions: {
    key: string;
    label: string;
    from: string[];
    to: string[];
    action?: string;
    available?: boolean;
    allowed?: boolean;
  }[];
  buttons?: HrButton[];
};

export type HrFieldError = { field: string; message: string };

export class HrApiError extends Error {
  status: number;
  errors: HrFieldError[];
  data: Record<string, unknown> | null;
  constructor(
    message: string,
    status: number,
    errors: HrFieldError[] = [],
    data: Record<string, unknown> | null = null
  ) {
    super(message);
    this.name = 'HrApiError';
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
    errors?: HrFieldError[];
  };
  if (!res.success) {
    const nested =
      payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? (payload.data as Record<string, unknown>)
        : null;
    throw new HrApiError(
      payload.message || res.message || `HR request failed (${res.statusCode})`,
      res.statusCode,
      payload.errors || [],
      nested
    );
  }
  return payload.data as T;
}

const DOCS = '/api/hr/docs';

export function buildListQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const hrWorkspaceService = {
  nav: () => call<HrNavPayload>('get', '/api/hr/workspaces'),
  dashboard: (slug: string) => call<HrDashboardPayload>('get', `/api/hr/workspaces/${slug}/dashboard`),
  charts: (slug: string) => call<HrDashboardChart[]>('get', `/api/hr/workspaces/${slug}/charts`),
  descriptors: (workspace?: string) =>
    call<{ workspaces: { slug: string; label: string }[]; descriptors: HrDescriptor[] }>(
      'get',
      `${DOCS}${buildListQuery({ workspace })}`
    ),
  documentMeta: (resource: string) =>
    call<{ descriptor: HrDescriptor; options: Record<string, HrLinkOption[]> }>('get', `${DOCS}/${resource}/meta`),
  list: (resource: string, params: Record<string, string | number | undefined> = {}) =>
    call<HrListResult>('get', `${DOCS}/${resource}${buildListQuery(params)}`),
  detail: (resource: string, id: string) =>
    call<{ row: HrRow; meta: HrRecordMeta }>('get', `${DOCS}/${resource}/${id}`),
  create: (resource: string, body: Record<string, unknown>) => call<HrRow>('post', `${DOCS}/${resource}`, body),
  update: (resource: string, id: string, body: Record<string, unknown>) =>
    call<HrRow>('put', `${DOCS}/${resource}/${id}`, body),
  remove: (resource: string, id: string) => call<{ id: string }>('delete', `${DOCS}/${resource}/${id}`),
  runAction: (resource: string, id: string, key: string, body: Record<string, unknown> = {}) =>
    call<HrRow>('post', `${DOCS}/${resource}/${id}/action/${key}`, body),
  runButton: (resource: string, id: string, key: string, body: Record<string, unknown> = {}) =>
    call<HrRow>('post', `${DOCS}/${resource}/${id}/button/${key}`, body),
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
    return call<HrLinkOption[]>('get', `/api/hr/link-options/${base}${buildListQuery(params)}`);
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
    call<HrReportResult>('get', `/api/hr/reports/${name}${buildListQuery(params)}`)
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

export function fieldOptionTarget(field: HrField): string | null {
  const base = field.t === 'link' ? String(field.o || '') : LINK_FIELD_TARGETS[field.t] || null;
  if (!base) return null;
  const query = field.linkQuery;
  if (!query || !Object.keys(query).length) return base;
  const qs = Object.entries(query)
    .map(([k, v]) => `${k}=${v === true ? 'true' : v === false ? 'false' : String(v)}`)
    .join('&');
  return `${base}?${qs}`;
}

export function isComputedField(field: HrField): boolean {
  return String(field.t).startsWith('computed');
}

export function defaultRowValue(field: HrField): string | number | boolean | null {
  if (field.d !== undefined && field.d !== null) return field.d;
  if (field.t === 'bool') return false;
  if (['int', 'float', 'currency'].includes(String(field.t))) return 0;
  return '';
}
