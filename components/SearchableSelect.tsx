'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
};

type Props = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** compact = smaller padding for profile forms */
  size?: 'md' | 'sm';
  variant?: 'light' | 'dark';
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className = '',
  disabled = false,
  size = 'md',
  variant = 'light',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value);
  const isDark = variant === 'dark';
  const pad = size === 'sm' ? 'px-3 py-2' : 'px-3 py-3';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.searchText || ''} ${o.value}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const triggerCls = isDark
    ? `w-full rounded-lg border border-white/15 bg-white/5 ${pad} text-left text-sm text-white outline-none focus:border-[#f59e0b] disabled:opacity-60 flex items-center justify-between gap-2`
    : `w-full rounded-xl border border-gray-200 bg-gray-50 ${pad} text-left text-sm text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 flex items-center justify-between gap-2`;

  const menuCls = isDark
    ? 'absolute z-[80] mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#12122a] shadow-2xl'
    : 'absolute z-[80] mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl';

  const optionActive = isDark
    ? 'bg-white/10 text-[#fbbf24] font-medium'
    : 'bg-blue-50 text-blue-700 font-medium';
  const optionIdle = isDark
    ? 'text-gray-200 hover:bg-white/5'
    : 'text-gray-700 hover:bg-blue-50';

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
      >
        <span
          className={`truncate ${
            selected
              ? isDark
                ? 'text-white'
                : 'text-gray-800'
              : isDark
                ? 'text-gray-500'
                : 'text-gray-400'
          }`}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className={menuCls}>
          <div
            className={`flex items-center gap-2 border-b px-3 py-2 ${
              isDark ? 'border-white/10' : 'border-gray-100'
            }`}
          >
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className={`w-full bg-transparent text-sm outline-none placeholder:text-gray-400 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">No matches</p>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                      active ? optionActive : optionIdle
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
