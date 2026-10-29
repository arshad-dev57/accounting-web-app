'use client';

// Renders an HR document form straight from the descriptor the backend
// validates against: same fields, same types, same required flags. Nothing here
// is a decorative control — every value that is sent is a column the backend
// writes, and every rejected value comes back as a per-field error.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  fieldOptionTarget,
  isComputedField,
  HrApiError,
  type HrDescriptor,
  type HrField,
  type HrFieldError,
  type HrLinkOption,
  type HrRow
} from '../../../lib/hr-workspace-service';
import { useDocWorkspace } from '../../../lib/doc-workspace-context';
import { isVisible, isRequired } from '../../../lib/hr-field-conditions';

const NUMBER_TYPES = ['int', 'float', 'currency'];
const LINK_TYPES = ['link', 'employee', 'multiEmployee', 'userLink', 'account', 'currencyCode', 'costCenter', 'department', 'designation', 'office', 'company', 'holiday'];

const inputClass =
  'h-8 w-full rounded border border-[#c7c7c7] bg-white px-2.5 text-[12.5px] text-[#171717] outline-none focus:border-[#014582] disabled:bg-[#f3f3f3] disabled:text-[#7c7c7c]';

function initialFieldValue(field: HrField, row?: HrRow | null): unknown {
  const existing = row ? row[field.n] : undefined;
  if (existing !== undefined && existing !== null && existing !== '') {
    if (field.t === 'datetime' && typeof existing === 'string') return existing.slice(0, 16);
    if (field.t === 'time' && typeof existing === 'string') return existing.slice(0, 5);
    return existing;
  }
  if (field.t === 'table') return [];
  if (field.t === 'keyValue') return {};
  if (['multiSelect', 'multiEmployee'].includes(String(field.t))) return [];
  if (field.t === 'bool') return Boolean(field.d);
  if (field.d !== undefined && field.d !== null && field.d !== 'today') return field.d;
  if (NUMBER_TYPES.includes(String(field.t))) return '';
  return '';
}

export function useFormValues(descriptor: HrDescriptor, row?: HrRow | null, isNew = false) {  const build = useCallback(() => {
    const out: Record<string, unknown> = { __islocal: isNew };
    for (const field of descriptor.fields) out[field.n] = initialFieldValue(field, row);
    return out;
  }, [descriptor, row, isNew]);

  const [values, setValues] = useState<Record<string, unknown>>(build);

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(build());
  }, [build]);

  return { values, setValue, setValues, reset };
}

function linkTargetOf(field: HrField): string | null {
  if (field.t === 'employee' || field.t === 'multiEmployee') return 'employee';
  return typeof field.o === 'string' ? field.o : null;
}

/**
 * Wraps setValue with ERPNext's fetch_from: choosing a link copies the mapped
 * columns from the linked record so the form shows what the save will store.
 */
export function useFetchFrom(
  descriptor: HrDescriptor,
  setValue: (name: string, value: unknown) => void
) {
  const api = useDocWorkspace();
  return useCallback(
    async (name: string, value: unknown) => {
      setValue(name, value);
      const source = descriptor.fields.find((field) => field.n === name);
      const targets = descriptor.fields.filter((field) => field.fetchFrom?.split('.')[0] === name);
      if (!source || !targets.length) return;
      const target = linkTargetOf(source);
      if (!target) return;
      if (value === undefined || value === null || value === '') {
        for (const field of targets) setValue(field.n, '');
        return;
      }
      try {
        const { row: linked } = await api.detail(target, String(value));
        for (const field of targets) {
          const column = String(field.fetchFrom).split('.')[1];
          const fetched = (linked as Record<string, unknown>)[column];
          setValue(field.n, fetched === undefined || fetched === null ? '' : fetched);
        }
      } catch {
        // the backend repeats the same lookup on save
      }
    },
    [api, descriptor, setValue]
  );
}

const NO_QUICK_CREATE = new Set(['company', 'currency', 'account', 'costCenter', 'user', 'holiday']);

const QUICK_CREATE_LABELS: Record<string, string> = {
  employee: 'Add Employee',
  'shift-type': 'Add Shift',
  'salary-structure': 'Create a new Salary Structure',
  department: 'Create a new Department',
  designation: 'Create a new Designation',
  'leave-block-list': 'Create a new Leave Block List',
  'salary-component': 'Create a new Salary Component',
  'overtime-type': 'Create a new Overtime Type'
};

function creatableResourceOf(field: HrField): string | null {
  if (field.t === 'employee' || field.t === 'multiEmployee') return 'employee';
  if (field.t === 'link' && typeof field.o === 'string') return field.o;
  if (field.t === 'department') return 'department';
  if (field.t === 'designation') return 'designation';
  if (field.t === 'office') return 'office';
  if (field.t === 'holiday') return null;
  return null;
}

function quickCreateLabel(resource: string, doctype?: string): string {
  return QUICK_CREATE_LABELS[resource] || `Create a new ${doctype || resource}`;
}

/**
 * ERPNext Link control: typeahead with "Begin typing for results." plus a
 * footer action to create the linked DocType (Add Employee / Add Shift / …).
 */
function LinkSelect({
  field,
  value,
  options,
  onChange,
  disabled,
  allowQuickCreate = true
}: {
  field: HrField;
  value: unknown;
  options: HrLinkOption[];
  onChange: (value: unknown) => void;
  disabled?: boolean;
  allowQuickCreate?: boolean;
}) {
  const api = useDocWorkspace();
  const multiple = field.t === 'multiEmployee';
  const selected: string[] = multiple ? (Array.isArray(value) ? (value as string[]) : []) : [];
  const single = String(value ?? '');
  const target = fieldOptionTarget(field) || '';
  const createResource = creatableResourceOf(field);
  const canCreate =
    allowQuickCreate && Boolean(createResource) && !NO_QUICK_CREATE.has(String(createResource));
  const selectedOption = options.find((o) => o.id === single);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<HrLinkOption[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setQuery(selectedOption?.label || '');
  }, [selectedOption?.label, open, single]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open || !target || multiple) return;
    const q = query.trim();
    if (!q || (selectedOption && q === selectedOption.label)) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void api
        .linkOptions(target, q)
        .then((rows) => {
          if (!cancelled) setRemote(rows);
        })
        .catch(() => {
          if (!cancelled) setRemote(null);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open, target, multiple, selectedOption]);

  const pool = remote || options;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || (selectedOption && query === selectedOption.label)) return pool.slice(0, 40);
    return pool.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 40);
  }, [pool, query, selectedOption]);

  if (multiple) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1.5">
          {options.slice(0, 60).map((option) => {
            const on = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange(on ? selected.filter((id) => id !== option.id) : [...selected, option.id])
                }
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  on
                    ? 'bg-[#014582] text-white border-[#014582]'
                    : 'bg-white text-[#52677E] border-[#DDE4EE] hover:border-[#014582]/40'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          disabled={disabled}
          value={open ? query : selectedOption?.label || query}
          placeholder="Begin typing for results."
          autoComplete="off"
          onFocus={() => {
            setOpen(true);
            setQuery(selectedOption?.label || '');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value) onChange('');
          }}
          className={inputClass}
        />
        {single && !disabled ? (
          <button
            type="button"
            title="Clear"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9c9c9c] hover:bg-[#f3f3f3] hover:text-[#171717]"
            onClick={() => {
              onChange('');
              setQuery('');
              setRemote(null);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {open && !disabled ? (
        <div className="absolute z-30 mt-0.5 max-h-64 w-full overflow-auto rounded border border-[#c7c7c7] bg-white shadow-md">
          {searching && filtered.length === 0 ? (
            <p className="px-2.5 py-2 text-[12px] text-[#9c9c9c]">Searching…</p>
          ) : filtered.length === 0 ? (
            <p className="px-2.5 py-2 text-[12px] text-[#9c9c9c]">No results</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={option.disabled}
                className={`block w-full px-2.5 py-1.5 text-left text-[12.5px] hover:bg-[#f3f3f3] ${
                  option.id === single ? 'bg-[#f0f4f8] font-medium' : 'text-[#171717]'
                } ${option.disabled ? 'opacity-50' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.id);
                  setQuery(option.label);
                  setOpen(false);
                  setRemote(null);
                }}
              >
                {option.label}
                {option.disabled ? ' (inactive)' : ''}
              </button>
            ))
          )}
          {canCreate && createResource ? (
            <button
              type="button"
              className="sticky bottom-0 block w-full border-t border-[#e2e2e2] bg-[#fafafa] px-2.5 py-2 text-left text-[12.5px] font-medium text-[#171717] hover:bg-[#f0f0f0]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
            >
              + {quickCreateLabel(createResource)}
            </button>
          ) : null}
        </div>
      ) : null}
      {creating && createResource ? (
        <LinkQuickCreate
          resource={createResource}
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            onChange(created.id);
            setQuery(created.label);
            setCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}

function LinkQuickCreate({
  resource,
  onClose,
  onCreated
}: {
  resource: string;
  onClose: () => void;
  onCreated: (created: { id: string; label: string }) => void;
}) {
  const api = useDocWorkspace();
  const [descriptor, setDescriptor] = useState<HrDescriptor | null>(null);
  const [optionsByTarget, setOptionsByTarget] = useState<Record<string, HrLinkOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { values, setValue, reset } = useFormValues(
    descriptor || ({ fields: [], resource: '' } as unknown as HrDescriptor),
    null,
    true
  );
  const changeField = useFetchFrom(descriptor || ({ fields: [], resource: '' } as unknown as HrDescriptor), setValue);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .documentMeta(resource)
      .then((meta) => {
        if (cancelled) return;
        setDescriptor(meta.descriptor);
        setOptionsByTarget(meta.options || {});
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load form');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resource]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!descriptor) return;
    const companyField = descriptor.fields.find((field) => field.t === 'company');
    if (!companyField) return;
    const companyOptions = optionsByTarget.company || [];
    if (companyOptions[0]) setValue(companyField.n, companyOptions[0].id);
  }, [descriptor, optionsByTarget, setValue]);

  const save = async () => {
    if (!descriptor) return;
    setSaving(true);
    setFieldErrors({});
    setError('');
    try {
      const payload: Record<string, unknown> = {};
      for (const field of descriptor.fields) {
        if (field.ro || String(field.t).startsWith('computed')) continue;
        if (field.n === 'status' && descriptor.statuses) continue;
        if (!isVisible(field, values)) continue;
        if (values[field.n] === '' && !isRequired(field, values)) continue;
        payload[field.n] = values[field.n];
      }
      const created = await api.create(resource, payload);
      const titleField = descriptor.titleField;
      const label =
        (titleField && created[titleField] != null ? String(created[titleField]) : '') ||
        String(created.name || created.employeeName || created.id);
      onCreated({ id: String(created.id), label });
    } catch (err) {
      if (err instanceof HrApiError) {
        setFieldErrors(errorsByField(err.errors));
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Could not create');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="relative my-4 w-full max-w-3xl rounded border border-[#c7c7c7] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e2e2] px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7c7c7c]">
              {descriptor?.doctype || resource}
            </p>
            <h2 className="text-[15px] font-semibold text-[#171717]">
              {descriptor ? `New ${descriptor.doctype}` : 'New'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-[#7c7c7c] hover:bg-[#f3f3f3] hover:text-[#171717]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-[12.5px] text-[#7c7c7c]">Loading…</p>
          ) : descriptor ? (
            <HrDocumentFields
              descriptor={descriptor}
              values={values}
              setValue={changeField}
              optionsByTarget={optionsByTarget}
              errors={fieldErrors}
              disabled={saving}
              columns={1}
              allowQuickCreate={false}
            />
          ) : (
            <p className="text-[12.5px] text-[#e24c4c]">{error || 'Form unavailable'}</p>
          )}
          {error && descriptor ? <p className="mt-3 text-[12px] font-semibold text-[#e24c4c]">{error}</p> : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#e2e2e2] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#c7c7c7] bg-white px-3 py-1.5 text-[12.5px] text-[#171717] hover:bg-[#f3f3f3]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || loading || !descriptor}
            onClick={() => void save()}
            className="rounded bg-[#014582] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#01366a] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TableEditor({
  field,
  value,
  optionsByTarget,
  onChange,
  disabled
}: {
  field: HrField;
  value: unknown;
  optionsByTarget: Record<string, HrLinkOption[]>;
  onChange: (rows: Record<string, unknown>[]) => void;
  disabled?: boolean;
}) {
  const api = useDocWorkspace();
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const columns = (field.rows || []).filter((child) => !isComputedField(child));

  const fillFromLink = async (index: number, child: HrField, next: Record<string, unknown>[]) => {
    const targets = columns.filter((column) => column.fetchFrom?.split('.')[0] === child.n);
    if (!targets.length) return;
    const target = linkTargetOf(child);
    const selected = next[index]?.[child.n];
    if (!target || !selected) {
      onChange(
        next.map((row, i) =>
          i === index ? { ...row, ...Object.fromEntries(targets.map((t) => [t.n, ''])) } : row
        )
      );
      return;
    }
    try {
      const { row: linked } = await api.detail(target, String(selected));
      onChange(
        next.map((row, i) =>
          i === index
            ? {
                ...row,
                ...Object.fromEntries(
                  targets.map((t) => [
                    t.n,
                    (linked as Record<string, unknown>)[String(t.fetchFrom).split('.')[1]] ?? ''
                  ])
                )
              }
            : row
        )
      );
    } catch {
      // the backend repeats the same lookup on save
    }
  };

  // ERPNext editable grid: always show header (No. + columns), empty "No rows", Add row.
  return (
    <div className="overflow-hidden rounded border border-[#e2e2e2] bg-[#f8f8f8]">
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-[#e2e2e2] text-left text-[12px] text-[#525252]">
              <th className="w-10 px-3 py-2 font-normal" />
              <th className="w-12 px-2 py-2 font-normal">No.</th>
              {columns.map((child) => (
                <th key={child.n} className="whitespace-nowrap px-3 py-2 font-normal">
                  {child.l}
                  {child.r ? <span className="text-[#e24c4c]"> *</span> : null}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="px-3 py-6 text-center text-[12.5px] text-[#9c9c9c]">
                  No rows
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-[#f0f0f0]">
                  <td className="px-3 py-1.5" />
                  <td className="px-2 py-1.5 text-[#7c7c7c]">{index + 1}</td>
                  {columns.map((child) => (
                    <td key={child.n} className="min-w-[12rem] px-2 py-1.5 align-top">
                      <FieldControl
                        field={child}
                        value={row[child.n]}
                        optionsByTarget={optionsByTarget}
                        disabled={disabled}
                        onChange={(next) => {
                          const updated = rows.map((r, i) => (i === index ? { ...r, [child.n]: next } : r));
                          onChange(updated);
                          void fillFromLink(index, child, updated);
                        }}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right">
                    {!disabled && (
                      <button
                        type="button"
                        title="Remove row"
                        onClick={() => onChange(rows.filter((_, i) => i !== index))}
                        className="rounded p-1.5 text-[#e24c4c] hover:bg-[#fff5f5]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...rows, Object.fromEntries(columns.map((c) => [c.n, c.d ?? '']))])}
          className="border-t border-[#e2e2e2] px-3 py-2 text-left text-[12.5px] text-[#525252] hover:bg-[#f3f3f3]"
        >
          Add row
        </button>
      )}
    </div>
  );
}

function KeyValueEditor({
  field,
  value,
  onChange,
  disabled
}: {
  field: HrField;
  value: unknown;
  onChange: (next: Record<string, string>) => void;
  disabled?: boolean;
}) {
  const entries = useMemo(() => Object.entries((value || {}) as Record<string, string>), [value]);

  const write = (next: [string, string][]) => onChange(Object.fromEntries(next.filter(([k]) => k)));

  return (
    <div className="space-y-2">
      {entries.map(([key, amount], index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            disabled={disabled}
            className={`${inputClass} flex-1`}
            value={key}
            placeholder="Label"
            onChange={(event) => {
              const copy = [...entries] as [string, string][];
              copy[index] = [event.target.value, copy[index][1]];
              write(copy);
            }}
          />
          <input
            disabled={disabled}
            className={`${inputClass} w-32`}
            type="number"
            step="0.01"
            value={amount}
            placeholder="Value"
            onChange={(event) => {
              const copy = [...entries] as [string, string][];
              copy[index] = [copy[index][0], event.target.value];
              write(copy);
            }}
          />
          {!disabled && (
            <button
              type="button"
              title="Remove"
              onClick={() => write(entries.filter((_, i) => i !== index) as [string, string][])}
              className="p-1.5 rounded-lg text-[#E74C3C] hover:bg-[#E74C3C]/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={() => write([...entries, ['', '']] as [string, string][])}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[#014582] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add {field.l} entry
        </button>
      )}
    </div>
  );
}

export function FieldControl({
  field,
  value,
  optionsByTarget,
  onChange,
  disabled,
  error,
  allowQuickCreate = true
}: {
  field: HrField;
  value: unknown;
  optionsByTarget: Record<string, HrLinkOption[]>;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  error?: string;
  allowQuickCreate?: boolean;
}) {
  const type = String(field.t);
  const readonly = disabled || field.ro || isComputedField(field);

  if (type === 'table') {
    return (
      <TableEditor
        field={field}
        value={value}
        optionsByTarget={optionsByTarget}
        onChange={onChange}
        disabled={readonly}
      />
    );
  }

  if (type === 'keyValue') {
    return <KeyValueEditor field={field} value={value} onChange={onChange} disabled={readonly} />;
  }

  if (LINK_TYPES.includes(type)) {
    const target = fieldOptionTarget(field) || '';
    return (
      <LinkSelect
        field={field}
        value={value}
        options={optionsByTarget[target] || []}
        onChange={onChange}
        disabled={readonly}
        allowQuickCreate={allowQuickCreate}
      />
    );
  }

  if (type === 'bool') {
    // ERPNext Check: checkbox then label on one line (parent skips the field label).
    return (
      <label className="inline-flex items-center gap-2 text-[12.5px] text-[#171717]">
        <input
          type="checkbox"
          disabled={readonly}
          checked={value === true || value === 1 || value === 'true'}
          onChange={(event) => onChange(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-[#c7c7c7]"
        />
        <span>{field.l}</span>
      </label>
    );
  }

  if (type === 'select') {
    const choices = Array.isArray(field.o) ? field.o : [];
    return (
      <select
        disabled={readonly}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="">—</option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'multiSelect') {
    const choices = Array.isArray(field.o) ? field.o : [];
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {choices.map((choice) => {
          const on = selected.includes(choice);
          return (
            <button
              key={choice}
              type="button"
              disabled={readonly}
              onClick={() => onChange(on ? selected.filter((c) => c !== choice) : [...selected, choice])}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                on
                  ? 'bg-[#014582] text-white border-[#014582]'
                  : 'bg-white text-[#52677E] border-[#DDE4EE] hover:border-[#014582]/40'
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'longText') {
    return (
      <textarea
        disabled={readonly}
        rows={3}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  }

  const inputType =
    type === 'date'
      ? 'date'
      : type === 'datetime'
        ? 'datetime-local'
        : type === 'time'
          ? 'time'
          : NUMBER_TYPES.includes(type)
            ? 'number'
            : 'text';

  return (
    <input
      type={inputType}
      disabled={readonly}
      value={value === undefined || value === null ? '' : String(value)}
      step={type === 'currency' || type === 'float' ? '0.01' : type === 'int' ? '1' : undefined}
      min={field.min !== undefined ? field.min : undefined}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
      style={error ? { borderColor: '#E74C3C' } : undefined}
    />
  );
}

function FieldGrid({
  fields,
  values,
  setValue,
  optionsByTarget,
  errors,
  disabled,
  columns,
  allowQuickCreate
}: {
  fields: HrField[];
  values: Record<string, unknown>;
  setValue: (name: string, value: unknown) => void;
  optionsByTarget: Record<string, HrLinkOption[]>;
  errors: Record<string, string>;
  disabled?: boolean;
  columns: 1 | 2;
  allowQuickCreate?: boolean;
}) {
  let lastSection: string | null = null;
  return (
    <div className={columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
      {fields.map((field) => {
        const wide = ['table', 'keyValue', 'longText', 'multiSelect', 'multiEmployee'].includes(String(field.t));
        const error = errors[field.n];
        const section = field.s || null;
        const heading = section && section !== lastSection ? section : null;
        lastSection = section;
        return (
          <React.Fragment key={field.n}>
            {heading && (
              <div className={`${columns === 2 ? 'md:col-span-2' : ''} space-y-1 border-t border-[#e2e2e2] pt-4`}>
                <h3 className="text-[13px] font-semibold text-[#171717]">{heading}</h3>
                {field.sectionHint ? <p className="text-[12px] text-[#7c7c7c]">{field.sectionHint}</p> : null}
              </div>
            )}
            <div className={wide ? (columns === 2 ? 'md:col-span-2' : '') : ''}>
              {String(field.t) !== 'bool' ? (
                <label className="mb-1.5 block text-[12px] font-medium text-[#525252]">
                  {field.l}
                  {isRequired(field, values) ? <span className="text-[#e24c4c]"> *</span> : null}
                </label>
              ) : null}
              <FieldControl
                field={field}
                value={values[field.n]}
                optionsByTarget={optionsByTarget}
                onChange={(next) => setValue(field.n, next)}
                disabled={disabled}
                error={error}
                allowQuickCreate={allowQuickCreate}
              />
              {error && <p className="mt-1 text-[11px] font-semibold text-[#e24c4c]">{error}</p>}
              {field.hint && !error && <p className="mt-1 text-[12px] text-[#7c7c7c]">{field.hint}</p>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function HrDocumentFields({
  descriptor,
  values,
  setValue,
  optionsByTarget,
  errors,
  disabled,
  columns = 2,
  allowQuickCreate = true
}: {
  descriptor: HrDescriptor;
  values: Record<string, unknown>;
  setValue: (name: string, value: unknown) => void;
  optionsByTarget: Record<string, HrLinkOption[]>;
  errors: Record<string, string>;
  disabled?: boolean;
  columns?: 1 | 2;
  allowQuickCreate?: boolean;
}) {
  const visible = descriptor.fields.filter(
    (field) =>
      !field.hidden &&
      !(field.n === 'status' && descriptor.statuses) &&
      !(descriptor.readOnly && field.ro) &&
      isVisible(field, values)
  );

  // ERPNext: fields before the first Tab Break stay above the tab bar
  // (e.g. Job Card header). Fields with `tab` render inside their tab.
  const headerFields = useMemo(
    () => visible.filter((field) => !field.tab),
    [visible]
  );
  const tabs = useMemo(() => {
    const names: string[] = [];
    for (const field of visible) {
      const tab = field.tab || '';
      if (tab && !names.includes(tab)) names.push(tab);
    }
    return names;
  }, [visible]);

  const [activeTab, setActiveTab] = useState(tabs[0] || '');

  useEffect(() => {
    if (tabs.length && !tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  // No Tab Breaks → show every field. Mixed header+tabs (Job Card) → header
  // above the bar, active tab body below. All-tab docs (BOM) → tab body only.
  const fieldsForTab = tabs.length
    ? visible.filter((field) => field.tab === activeTab)
    : visible;

  return (
    <div className="space-y-4">
      {headerFields.length > 0 && tabs.length > 0 ? (
        <FieldGrid
          fields={headerFields}
          values={values}
          setValue={setValue}
          optionsByTarget={optionsByTarget}
          errors={errors}
          disabled={disabled}
          columns={columns}
          allowQuickCreate={allowQuickCreate}
        />
      ) : null}
      {tabs.length > 1 || (tabs.length === 1 && headerFields.length > 0) ? (
        <div className="flex flex-wrap gap-1 border-b border-[#e2e2e2]">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[12.5px] font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-[#014582] text-[#014582]'
                  : 'text-[#7c7c7c] hover:text-[#171717]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}
      <FieldGrid
        fields={fieldsForTab}
        values={values}
        setValue={setValue}
        optionsByTarget={optionsByTarget}
        errors={errors}
        disabled={disabled}
        columns={columns}
        allowQuickCreate={allowQuickCreate}
      />
    </div>
  );
}

export function errorsByField(fieldErrors: HrFieldError[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const error of fieldErrors) out[error.field] = error.message;
  return out;
}
