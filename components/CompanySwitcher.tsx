'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronDown, Layers, Plus } from 'lucide-react';
import {
  ALL_COMPANIES_VALUE,
  useCompanyOptional,
} from '../lib/company-context';

const BRAND = '#014582';

export default function CompanySwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const ctx = useCompanyOptional();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-company-switcher', onOpen);
    return () => window.removeEventListener('open-company-switcher', onOpen);
  }, []);

  if (!ctx) return null;

  const { companies, activeCompanyId, activeCompany, isAllCompanies, loading, setActiveCompanyId } =
    ctx;

  const label = isAllCompanies
    ? 'All Companies'
    : activeCompany?.name || (loading ? 'Loading…' : 'Select company');

  const switchTo = (id: string) => {
    setActiveCompanyId(id);
    setOpen(false);
    // Hard navigation clears module caches / stale company data
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-left hover:bg-zinc-50 ${
          compact ? 'max-w-[180px]' : 'min-w-[200px] max-w-[260px]'
        }`}
        title="Switch company"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: BRAND }}
        >
          {isAllCompanies ? <Layers className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Company
          </span>
          <span className="block truncate text-sm font-semibold text-zinc-900">{label}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-[80] mt-1 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Your companies
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => switchTo(ALL_COMPANIES_VALUE)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
            >
              <Layers className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 font-medium text-zinc-800">All Companies</span>
              {isAllCompanies && <Check className="h-4 w-4" style={{ color: BRAND }} />}
            </button>
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => switchTo(c.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
              >
                <Building2 className="h-4 w-4 text-zinc-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-zinc-800">{c.name}</span>
                  {c.businessType && (
                    <span className="block truncate text-[11px] text-zinc-400">{c.businessType}</span>
                  )}
                </span>
                {activeCompanyId === c.id && (
                  <Check className="h-4 w-4" style={{ color: BRAND }} />
                )}
              </button>
            ))}
            {!companies.length && (
              <p className="px-3 py-4 text-center text-sm text-zinc-400">No companies yet</p>
            )}
          </div>
          <div className="border-t border-zinc-100 p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/companies/new');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-zinc-50"
              style={{ color: BRAND }}
            >
              <Plus className="h-4 w-4" />
              Create New Company
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
