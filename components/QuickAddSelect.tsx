'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { settingService } from '../app/api/settings/route';
import { categoryService } from '../app/api/category/route';
import { supplierService } from '../app/api/supplier/route';

export type QuickAddOption = {
  value: string;
  label: string;
};

type QuickAddKind = 'setting' | 'category' | 'subcategory' | 'supplier' | 'local';

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: QuickAddOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  kind: QuickAddKind;
  /** setting category key, e.g. productType, stockUnit */
  settingCategory?: string;
  /** required when kind=subcategory */
  parentCategoryId?: string;
  title?: string;
  onCreated?: (option: QuickAddOption, raw?: unknown) => void;
};

function settingId(item: any) {
  return String(item?.id || item?._id || '');
}

export default function QuickAddSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required,
  disabled,
  className = '',
  kind,
  settingCategory,
  parentCategoryId,
  title,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setError('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setName('');
      setExtra('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const canOpen =
    !disabled &&
    (kind !== 'subcategory' || !!parentCategoryId) &&
    (kind !== 'setting' || !!settingCategory);

  const handleOpen = () => {
    if (!canOpen) {
      if (kind === 'subcategory' && !parentCategoryId) {
        setError('Select a category first');
        setOpen(true);
      }
      return;
    }
    setOpen((v) => !v);
  };

  const handleSave = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (kind === 'subcategory' && !parentCategoryId) {
      setError('Select a category first');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let option: QuickAddOption = { value: trimmed, label: trimmed };
      let raw: unknown;

      if (kind === 'setting' && settingCategory) {
        const payload: Record<string, unknown> = {
          category: settingCategory,
          name: trimmed,
        };
        if (settingCategory === 'rackLocation' && extra.trim()) {
          payload.zone = extra.trim();
        }
        if (settingCategory === 'currency') {
          payload.code = trimmed;
          if (extra.trim()) payload.symbol = extra.trim();
        }
        const created = await settingService.createSetting(payload);
        raw = created;
        const label = created?.name || trimmed;
        option = { value: label, label };
      } else if (kind === 'category') {
        const created = await categoryService.createCategory({ name: trimmed });
        raw = created;
        const id = String(created?.id || (created as any)?._id || '');
        if (!id) throw new Error('Category created but id missing');
        option = { value: id, label: created.name || trimmed };
      } else if (kind === 'subcategory') {
        const created = await categoryService.createCategory({
          name: trimmed,
          parentId: parentCategoryId,
        });
        raw = created;
        const id = String(created?.id || (created as any)?._id || '');
        if (!id) throw new Error('Sub-category created but id missing');
        option = { value: id, label: created.name || trimmed };
      } else if (kind === 'supplier') {
        const created = await supplierService.createSupplier({
          name: trimmed,
          phone: extra.trim() || undefined,
          status: 'active',
        });
        raw = created;
        const data = (created as any)?.data || created;
        const id = String(data?.id || data?._id || '');
        if (!id) throw new Error('Supplier created but id missing');
        option = { value: id, label: data?.name || trimmed };
      } else {
        // local-only (e.g. currency fallback)
        option = { value: trimmed, label: trimmed };
      }

      onCreated?.(option, raw);
      onChange(option.value);
      setOpen(false);
      setName('');
      setExtra('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const onFieldKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from submitting the outer product <form>
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!saving) void handleSave();
    }
  };

  const heading =
    title ||
    (kind === 'category'
      ? 'Add category'
      : kind === 'subcategory'
        ? 'Add sub-category'
        : kind === 'supplier'
          ? 'Add supplier'
          : settingCategory === 'rackLocation'
            ? 'Add rack location'
            : 'Add new');

  const mergedOptions =
    value && !options.some((o) => o.value === value)
      ? [...options, { value, label: value }]
      : options;

  return (
    <div ref={wrapRef} className={`relative flex gap-2 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="flex-1 px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {mergedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || (kind === 'subcategory' && !parentCategoryId)}
        title={
          kind === 'subcategory' && !parentCategoryId
            ? 'Select a category first'
            : heading
        }
        className="p-2 md:p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all group flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 group-hover:text-[#014582]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-[min(100%,280px)] bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-800">{heading}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div
            className="space-y-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onFieldKeyDown}
              placeholder="Name *"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#014582]/30 bg-gray-50"
            />
            {kind === 'setting' && settingCategory === 'rackLocation' && (
              <input
                type="text"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                onKeyDown={onFieldKeyDown}
                placeholder="Zone (optional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#014582]/30 bg-gray-50"
              />
            )}
            {kind === 'setting' && settingCategory === 'currency' && (
              <input
                type="text"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                onKeyDown={onFieldKeyDown}
                placeholder="Symbol (e.g. Rs)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#014582]/30 bg-gray-50"
              />
            )}
            {kind === 'supplier' && (
              <input
                type="text"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                onKeyDown={onFieldKeyDown}
                placeholder="Phone (optional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#014582]/30 bg-gray-50"
              />
            )}
            {error && (
              <p className="text-[11px] text-red-600">{error}</p>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleSave(e);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#014582] text-white rounded-lg text-xs font-semibold hover:bg-[#01366a] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add & select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { settingId };
