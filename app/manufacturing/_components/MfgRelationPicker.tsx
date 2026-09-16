'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Boxes,
  ClipboardList,
  Factory,
  Search,
  Truck,
  Warehouse,
  Wrench,
  X,
} from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { MfgButton, MfgEmpty, MfgLoading, MfgPagination } from '../ui';
import {
  listRelations,
  relationMeta,
  rowToPicked,
  type MfgRelationKind,
  type PickedRelation,
} from './mfg-relations';

export type { MfgRelationKind, PickedRelation };

const ICONS: Record<MfgRelationKind, React.ComponentType<{ className?: string }>> = {
  workCenter: Factory,
  machine: Wrench,
  productionOrder: ClipboardList,
  warehouse: Warehouse,
  vendor: Truck,
  bom: Boxes,
};

export function MfgRelationPicker({
  kind,
  selected = [],
  onChange,
  multiple = true,
  placeholder,
  filters,
}: {
  kind: MfgRelationKind;
  selected?: PickedRelation[];
  onChange: (items: PickedRelation[]) => void;
  multiple?: boolean;
  placeholder?: string;
  filters?: { productId?: string };
}) {
  const meta = relationMeta(kind);
  const Icon = ICONS[kind];
  const { locationIdForApi } = useLocation();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PickedRelation[]>(selected);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(draftSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [draftSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRelations(kind, {
        page,
        limit: 15,
        search: search || undefined,
        locationId: kind === 'bom' || kind === 'workCenter' || kind === 'machine'
          ? undefined
          : locationIdForApi || undefined,
        productId: filters?.productId,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [kind, page, search, locationIdForApi, filters?.productId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const openModal = () => {
    setDraft(selected);
    setDraftSearch('');
    setSearch('');
    setPage(1);
    setOpen(true);
  };

  const selectedIds = useMemo(() => new Set(draft.map((item) => item.id)), [draft]);

  const toggle = (row: any) => {
    const picked = rowToPicked(kind, row);
    if (!picked?.id) return;
    setDraft((prev) => {
      if (prev.some((item) => item.id === picked.id)) {
        return prev.filter((item) => item.id !== picked.id);
      }
      if (!multiple) return [picked];
      return [...prev, picked];
    });
  };

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  const removeChip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item.id !== id));
  };

  const label =
    selected.length === 0
      ? placeholder || `Select ${meta.noun}…`
      : multiple
        ? `${selected.length} ${selected.length === 1 ? meta.noun : meta.nounPlural} selected`
        : selected[0].name;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openModal}
        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-left border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all flex items-center justify-between gap-2"
      >
        <span className={selected.length ? 'text-[#1A1A2E] font-medium truncate' : 'text-[#A9B7C9]'}>
          {label}
        </span>
        <Search className="w-4 h-4 text-[#7A8FA6] shrink-0" />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#014582]/8 text-[11px] font-semibold text-[#014582]"
            >
              {item.name}
              {item.code ? <span className="text-[#7A8FA6] font-medium">({item.code})</span> : null}
              <button type="button" onClick={(e) => removeChip(item.id, e)} className="ml-0.5 hover:text-[#E74C3C]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE4EE]">
              <div>
                <h3 className="text-sm font-extrabold text-[#1A1A2E]">
                  {multiple ? meta.titlePlural : meta.title}
                </h3>
                <p className="text-[11px] text-[#7A8FA6] mt-0.5">
                  {multiple
                    ? 'Tick one or more rows, then press Add. Selection stays as you change pages.'
                    : 'Search and pick one row from the list.'}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-[#DDE4EE]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  placeholder={meta.searchPlaceholder}
                  className="w-full bg-[#F4F7FB] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#1A1A2E] placeholder-[#7A8FA6] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                />
              </div>
              {draft.length > 0 && (
                <p className="text-[11px] font-semibold text-[#014582] mt-2">{draft.length} selected</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <MfgLoading label={`Loading ${meta.nounPlural}…`} />
              ) : rows.length === 0 ? (
                <MfgEmpty title={`No ${meta.nounPlural}`} message={meta.empty} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-3 w-10 border-b border-[#DDE4EE]" />
                      {meta.columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6] border-b border-[#DDE4EE]"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const picked = rowToPicked(kind, row);
                      const id = picked?.id || `row-${index}`;
                      const active = picked ? selectedIds.has(picked.id) : false;
                      return (
                        <tr
                          key={id}
                          onClick={() => toggle(row)}
                          className={`cursor-pointer border-b border-[#DDE4EE]/60 last:border-0 ${active ? 'bg-[#014582]/6' : 'hover:bg-[#F0F4F8]/60'}`}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggle(row)}
                              className="w-4 h-4 rounded border-[#C6D2E3] text-[#014582] focus:ring-[#014582]/30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-[#014582] shrink-0" />
                              <span className="font-semibold text-[#1A1A2E]">{picked?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#7A8FA6]">{picked?.code || '—'}</td>
                          <td className="px-4 py-3 text-[#7A8FA6]">{picked?.extra || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <MfgPagination page={page} total={total} limit={15} onPage={setPage} />

            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-[#DDE4EE]">
              <p className="text-[11px] font-semibold text-[#014582]">{draft.length} selected</p>
              <div className="flex items-center gap-2">
                <MfgButton variant="secondary" onClick={() => setOpen(false)}>Cancel</MfgButton>
                <MfgButton onClick={confirm} disabled={draft.length === 0}>
                  {multiple
                    ? `Add ${draft.length || ''} ${draft.length === 1 ? meta.noun : meta.nounPlural}`.trim()
                    : `Select ${meta.noun}`}
                </MfgButton>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
