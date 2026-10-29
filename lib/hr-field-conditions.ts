// Mirrors account_backend/services/hrFieldConditions.js. The backend sends the
// normalized clauses in the descriptor and enforces the same rules on write, so
// a field that the browser hides is never demanded by the API and vice versa.

import type { HrField, HrFieldClause } from './hr-workspace-service';

export function truthy(value: unknown): boolean {
  if (value === undefined || value === null || value === '' || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function clauseHolds(clause: HrFieldClause, values: Record<string, unknown>): boolean {
  if (clause.any) return clause.any.some((nested) => clauseHolds(nested, values));
  const value = values[clause.field || ''];
  if (clause.in) return clause.in.some((option) => String(option) === String(value ?? ''));
  if (clause.equals !== undefined) {
    if (typeof clause.equals === 'boolean') return Boolean(value) === clause.equals;
    return String(value ?? '') === String(clause.equals);
  }
  if (clause.notEquals !== undefined) return String(value ?? '') !== String(clause.notEquals);
  return Boolean(clause.truthy) ? truthy(value) : !truthy(value);
}

export function isVisible(field: HrField, values: Record<string, unknown>): boolean {
  // ERPNext's `hidden` keeps a field out of the form but still writable through
  // the API, so the backend deliberately does not hide it.
  if (field.hidden) return false;
  const clauses = field.when;
  if (!clauses || !clauses.length) return true;
  return clauses.every((clause) => clauseHolds(clause, values));
}

export function isRequired(field: HrField, values: Record<string, unknown>): boolean {
  if (field.r) return true;
  const clauses = field.reqWhen;
  if (!clauses || !clauses.length) return false;
  return clauses.every((clause) => clauseHolds(clause, values));
}
