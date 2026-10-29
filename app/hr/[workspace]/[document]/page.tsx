'use client';

// ERPNext list view for any HR DocType: the columns, the search fields and the
// status filter all come from the descriptor the backend serves, so adding a
// document to the registry gives it a working screen without new frontend code.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Layers, Plus } from 'lucide-react';
import { HRActionButton, HRCard, HRPage, HRSearchInput, HRStatusBadge, HRTable, HRTableCell, HRTableRow, HRToolbar } from '../../ui';
import { HrFilterBar } from '../../components/hr-filter-bar';
import {
  hrWorkspaceService,
  type HrDescriptor,
  type HrLinkOption,
  type HrRow
} from '../../../../lib/hr-workspace-service';
import { useHrNav } from '../../../../lib/hr-nav-context';

const PAGE_SIZE = 25;

function displayValue(row: HrRow, column: string, descriptor: HrDescriptor, options: Record<string, HrLinkOption[]>): string {
  const field = descriptor.fields.find((f) => f.n === column);
  const raw = row[column];
  if (raw === null || raw === undefined || raw === '') return '—';

  if (field) {
    if (field.t === 'bool') return raw ? 'Yes' : 'No';
    if (String(field.t).startsWith('link') || ['employee', 'userLink', 'department', 'designation', 'office', 'costCenter', 'account', 'currencyCode', 'company', 'holiday'].includes(String(field.t))) {
      const label = row[`${column}Label`];
      if (typeof label === 'string' && label) return label;
      const list = options[String(field.o || field.t)] || [];
      const match = list.find((o) => o.id === String(raw));
      if (match) return match.label;
    }
    if (field.t === 'select' || field.t === 'data' || field.t === 'longText') return String(raw);
    if (['currency', 'float', 'int'].includes(String(field.t))) {
      const num = Number(raw);
      return Number.isFinite(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(raw);
    }
    if (field.t === 'date') return String(raw).slice(0, 10);
    if (field.t === 'datetime') return String(raw).slice(0, 16).replace('T', ' ');
    if (field.t === 'multiSelect' || field.t === 'multiEmployee') return Array.isArray(raw) ? `${raw.length} selected` : String(raw);
    if (field.t === 'table') return `${Array.isArray(raw) ? raw.length : 0} rows`;
    if (field.t === 'keyValue') return Object.keys((raw as object) || {}).length ? String(Object.keys((raw as object) || {}).length) : '—';
  }
  if (column === 'status') return String(raw);
  return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
}

export default function HrDocumentListPage() {
  const params = useParams<{ workspace: string; document: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceSlug = params?.workspace || '';
  const resource = params?.document || '';
  const { workspace } = useHrNav();

  const ws = useMemo(() => workspace(workspaceSlug), [workspace, workspaceSlug]);

  const [descriptor, setDescriptor] = useState<HrDescriptor | null>(null);
  const [options, setOptions] = useState<Record<string, HrLinkOption[]>>({});
  const [rows, setRows] = useState<HrRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [department, setDepartment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const meta = await hrWorkspaceService.documentMeta(resource);
      setDescriptor(meta.descriptor);
      setOptions(meta.options || {});
      const data = await hrWorkspaceService.list(resource, {
        search: search || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        department: department || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      });
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this list');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [resource, search, status, from, to, department, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [resource, search, status, from, to, department]);

  if (!descriptor) {
    return (
      <HRPage>
        <HRCard title={resource || 'Document'}>
          {loading ? (
            <p className="text-sm text-[#7A8FA6]">Loading…</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#1A1A2E]">{error || 'This HR document is not available.'}</p>
              {ws && (
                <Link href={`/hr/${ws.slug}`} className="text-xs font-bold text-[#014582] hover:underline">
                  Back to {ws.label}
                </Link>
              )}
            </div>
          )}
        </HRCard>
      </HRPage>
    );
  }

  const columns = descriptor.columns.length ? descriptor.columns : ['id'];
  const columnLabels = columns.map(
    (column) =>
      descriptor.fields.find((field) => field.n === column)?.l ||
      column.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  );

  return (
    <HRPage>
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-[#e2e2e2] pb-3">
        <div>
          <p className="text-[11px] text-[#7c7c7c]">{ws?.label || descriptor.workspace}</p>
          <h1 className="flex items-center gap-2 text-[18px] font-semibold text-[#171717]">
            <Layers className="h-4 w-4 text-[#525252]" />
            {descriptor.doctype}
          </h1>
          <p className="mt-0.5 text-[12px] text-[#7c7c7c]">
            {total.toLocaleString()} record{total === 1 ? '' : 's'}
          </p>
        </div>
        {!descriptor.readOnly && (
          <HRActionButton href={`${pathname}/new`} icon={Plus}>
            Add {descriptor.doctype}
          </HRActionButton>
        )}
      </div>

      <HRToolbar search={search} setSearch={setSearch} placeholder={`Filter by ${descriptor.search.join(', ') || 'name'}…`} />

      {descriptor.filters && (
        <HrFilterBar
          descriptor={descriptor}
          options={options}
          status={status}
          setStatus={setStatus}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          department={department}
          setDepartment={setDepartment}
        />
      )}

      {error && (
        <div className="mb-3 rounded border border-[#f5c2c2] bg-[#fff5f5] px-3 py-2 text-[12px] font-medium text-[#e24c4c]">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded border border-[#e2e2e2] bg-white">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-[12px] text-[#7c7c7c]">
            {loading ? 'Loading…' : `No ${descriptor.doctype} found`}
          </p>
        ) : (
          <HRTable columns={columnLabels}>
            {rows.map((row) => (
              <HRTableRow key={row.id}>
                {columns.map((column, index) => (
                  <HRTableCell key={column}>
                    {index === 0 ? (
                      <Link href={`${pathname}/${row.id}`} className="font-medium text-[#0289f7] hover:underline">
                        {displayValue(row, column, descriptor, options)}
                      </Link>
                    ) : column === 'status' ? (
                      <HRStatusBadge status={String(row.status || '')} />
                    ) : (
                      displayValue(row, column, descriptor, options)
                    )}
                  </HRTableCell>
                ))}
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[#52677E]">
            Showing {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} of {total}
          </p>
          <div className="flex gap-2">
            <HRActionButton variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} className={page === 0 ? 'opacity-40 pointer-events-none' : ''}>
              Previous
            </HRActionButton>
            <HRActionButton
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              className={(page + 1) * PAGE_SIZE >= total ? 'opacity-40 pointer-events-none' : ''}
            >
              Next
            </HRActionButton>
          </div>
        </div>
      )}
    </HRPage>
  );
}
