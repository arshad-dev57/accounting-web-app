'use client';

import React, { useEffect, useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { deskInput, deskSelect } from './ErpDeskForm';

export type QuickAddField =
  | { key: string; label: string; type?: 'text' | 'textarea' | 'select'; required?: boolean; placeholder?: string; options?: string[] };

interface QuickAddSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Modal title, e.g. "Add Customer Group" */
  addTitle: string;
  /** Extra fields shown in the add modal (name is always included) */
  extraFields?: QuickAddField[];
  /** Create handler — receives name + extra field values; should return created name */
  onCreate: (payload: { name: string } & Record<string, string>) => Promise<string>;
  className?: string;
}

export function QuickAddSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  disabled,
  addTitle,
  extraFields = [],
  onCreate,
  className = '',
}: QuickAddSelectProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [extras, setExtras] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName('');
    const initial: Record<string, string> = {};
    for (const f of extraFields) initial[f.key] = '';
    setExtras(initial);
    // intentionally only when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(`${label} name is required`);
      return;
    }
    for (const f of extraFields) {
      if (f.required && !(extras[f.key] || '').trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }

    setSaving(true);
    try {
      const createdName = await onCreate({
        name: trimmed,
        ...Object.fromEntries(
          Object.entries(extras).map(([k, v]) => [k, (v || '').trim()])
        ),
      });
      onChange(createdName || trimmed);
      toast.success(`${label} added`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to add ${label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <label className="block text-[12px] font-medium text-gray-600 mb-1">{label}</label>
          <select
            className={deskSelect}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{placeholder}</option>
            {(value && !options.includes(value) ? [value, ...options] : options).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-medium text-[#014582] bg-white border border-[#014582]/30 hover:bg-[#014582]/5 disabled:opacity-50"
          title={`Add ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/35"
            onClick={() => !saving && setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
              <h3 id={titleId} className="text-sm font-semibold text-gray-900">{addTitle}</h3>
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">
                  {label} Name <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  className={deskInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. New ${label}`}
                />
              </div>

              {extraFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1">
                    {field.label}
                    {field.required ? <span className="text-red-500 ml-0.5">*</span> : null}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      className={deskInput}
                      value={extras[field.key] || ''}
                      onChange={(e) => setExtras((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className={deskSelect}
                      value={extras[field.key] || ''}
                      onChange={(e) => setExtras((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      <option value="">{field.placeholder || `Select ${field.label}`}</option>
                      {(field.options || []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={deskInput}
                      value={extras[field.key] || ''}
                      onChange={(e) => setExtras((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const EMPLOYEE_OPTIONS_KEY = 'crm.noOfEmployees.options';

export function getEmployeeSizeOptions(defaults: string[]): string[] {
  try {
    const raw = localStorage.getItem(EMPLOYEE_OPTIONS_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(custom) ? custom.filter((x) => typeof x === 'string' && x.trim()) : [];
    return Array.from(new Set([...defaults, ...list]));
  } catch {
    return defaults;
  }
}

export function addEmployeeSizeOption(name: string, defaults: string[]): string[] {
  const next = Array.from(new Set([...getEmployeeSizeOptions(defaults), name.trim()].filter(Boolean)));
  localStorage.setItem(EMPLOYEE_OPTIONS_KEY, JSON.stringify(next.filter((n) => !defaults.includes(n))));
  return next;
}

const INDUSTRY_OPTIONS_KEY = 'crm.industry.options';

export function getIndustryOptions(defaults: string[]): string[] {
  try {
    const raw = localStorage.getItem(INDUSTRY_OPTIONS_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(custom) ? custom.filter((x) => typeof x === 'string' && x.trim()) : [];
    return Array.from(new Set([...defaults.filter(Boolean), ...list]));
  } catch {
    return defaults.filter(Boolean);
  }
}

export function addIndustryOption(name: string, defaults: string[]): string[] {
  const base = defaults.filter(Boolean);
  const next = Array.from(new Set([...getIndustryOptions(base), name.trim()].filter(Boolean)));
  localStorage.setItem(INDUSTRY_OPTIONS_KEY, JSON.stringify(next.filter((n) => !base.includes(n))));
  return next;
}
