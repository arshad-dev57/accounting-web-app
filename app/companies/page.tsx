'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Loader2,
  Plus,
  Search,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  BadgeCheck,
  Layers,
} from 'lucide-react';
import { MainHubSidebar } from '../../components/MainHubSidebar';
import { TopBarBrand } from '../../components/BrandHeader';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import ProfileDropdown from '../../components/ProfileDropdown';
import CompanySwitcher from '../../components/CompanySwitcher';
import {
  useCompanyOptional,
  type CompanySummary,
} from '../../lib/company-context';

const BRAND = '#014582';

const EMPTY_FORM = {
  name: '',
  businessType: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  taxRegistrationNumber: '',
  fiscalYear: 'January - December',
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function CompaniesPage() {
  const companyCtx = useCompanyOptional();
  const companies = companyCtx?.companies ?? [];
  const activeCompanyId = companyCtx?.activeCompanyId ?? '';
  const loading = companyCtx?.loading ?? true;
  const ctxError = companyCtx?.error ?? '';

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!selectedId && companies.length) {
      setSelectedId(activeCompanyId || companies[0].id);
    }
  }, [companies, activeCompanyId, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.businessType || '').toLowerCase().includes(q) ||
        (c.subscriptionPlan || '').toLowerCase().includes(q)
    );
  }, [companies, query]);

  const selected =
    companies.find((c) => c.id === selectedId) ||
    (filtered.length ? filtered[0] : null);

  const onChange = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setCreateOpen(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCtx) return;
    if (!form.name.trim()) {
      setFormError('Company name is required');
      return;
    }
    setSaving(true);
    setFormError('');
    setActionMessage('');
    try {
      const created = await companyCtx.createCompany(form);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setSelectedId(created.id);
      setActionMessage(`Company "${created.name}" created and set as active.`);
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create company');
      setSaving(false);
    }
  };

  const setActive = async (company: CompanySummary) => {
    if (!companyCtx || company.id === activeCompanyId) return;
    setSwitching(true);
    setActionMessage('');
    companyCtx.setActiveCompanyId(company.id);
    setActionMessage(`Switched to "${company.name}". Reloading…`);
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/companies" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <TopBarBrand title="Companies" icon={<Building2 className="h-5 w-5 text-[#014582]" />} />
          <div className="flex items-center gap-3">
            <CompanySwitcher />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <AppBreadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Companies' },
            ]}
          />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Companies</h1>
              <p className="mt-1 text-sm text-zinc-500">
                View your companies, open details, or add a new one.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: BRAND }}
            >
              <Plus className="h-4 w-4" />
              Add Company
            </button>
          </div>

          {ctxError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ctxError}
            </div>
          )}
          {actionMessage && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionMessage}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* List */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-zinc-700">
                  {filtered.length} compan{filtered.length === 1 ? 'y' : 'ies'}
                </p>
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search companies…"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#014582] focus:bg-white"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading companies…
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-zinc-300" />
                  <p className="mt-3 text-sm font-medium text-zinc-700">
                    {companies.length === 0 ? 'No companies yet' : 'No matches'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {companies.length === 0
                      ? 'Create your first company to get started.'
                      : 'Try a different search.'}
                  </p>
                  {companies.length === 0 && (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Company
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => {
                        const isSelected = selected?.id === c.id;
                        const isActive = c.id === activeCompanyId;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedId(c.id)}
                            className={`cursor-pointer border-b border-zinc-50 transition-colors ${
                              isSelected ? 'bg-[#014582]/5' : 'hover:bg-zinc-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                                  style={{ backgroundColor: BRAND }}
                                >
                                  {c.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-zinc-900">
                                    {c.name}
                                    {isActive && (
                                      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                        Active
                                      </span>
                                    )}
                                  </p>
                                  <p className="truncate text-xs text-zinc-500">
                                    {c.businessType || c.email || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize text-zinc-700">
                              {c.subscriptionPlan || '—'}
                            </td>
                            <td className="px-4 py-3 text-zinc-600 capitalize">
                              {c.isOwner ? 'Owner' : c.membershipRole || '—'}
                              {c.isPrimary ? (
                                <span className="ml-1 text-[10px] text-zinc-400">(primary)</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                                  c.isActive !== false
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                    : 'bg-red-50 text-red-700 ring-red-200'
                                }`}
                              >
                                {c.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detail */}
            <aside className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden lg:sticky lg:top-6 lg:self-start">
              {!selected ? (
                <div className="px-6 py-16 text-center text-sm text-zinc-400">
                  Select a company to view details
                </div>
              ) : (
                <>
                  <div className="border-b border-zinc-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                          style={{ backgroundColor: BRAND }}
                        >
                          {selected.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-zinc-900">{selected.name}</h2>
                          <p className="mt-0.5 text-xs text-zinc-500 capitalize">
                            {selected.businessType || 'Business'} ·{' '}
                            {selected.subscriptionPlan || 'trial'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                        aria-label="Close detail"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {selected.id === activeCompanyId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <Check className="h-3 w-3" />
                          Currently active
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={switching}
                          onClick={() => void setActive(selected)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                          style={{ backgroundColor: BRAND }}
                        >
                          {switching ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Layers className="h-3.5 w-3.5" />
                          )}
                          Set as active
                        </button>
                      )}
                      {selected.isOwner && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                          <BadgeCheck className="h-3 w-3" />
                          Owner
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 p-5 text-sm">
                    <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={selected.email} />
                    <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={selected.phone} />
                    <DetailRow icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={selected.website} />
                    <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={selected.address} />
                    <DetailRow
                      icon={<Building2 className="h-3.5 w-3.5" />}
                      label="Tax / VAT / GST"
                      value={selected.taxRegistrationNumber}
                    />
                    <div className="border-t border-zinc-100 pt-4 space-y-3">
                      <MetaRow label="Membership" value={selected.isOwner ? 'Owner' : selected.membershipRole || '—'} />
                      <MetaRow label="Plan" value={selected.subscriptionPlan || '—'} />
                      <MetaRow label="Subscription status" value={selected.subscriptionStatus || '—'} />
                      <MetaRow label="Product" value={selected.productTier?.replace('_', ' + ') || '—'} />
                      <MetaRow label="Trial ends" value={fmtDate(selected.trialEndDate)} />
                      <MetaRow label="Subscription ends" value={fmtDate(selected.subscriptionEndDate)} />
                      <MetaRow label="Created" value={fmtDate(selected.createdAt)} />
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>
        </main>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close modal backdrop"
            onClick={() => !saving && setCreateOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Create company</h3>
                <p className="text-xs text-zinc-500">
                  Each company has its own accounting, sales, and inventory.
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="space-y-4 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <Field
                label="Company name *"
                value={form.name}
                onChange={(v) => onChange('name', v)}
                required
              />
              <Field
                label="Business type"
                value={form.businessType}
                onChange={(v) => onChange('businessType', v)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => onChange('email', v)}
                />
                <Field label="Phone" value={form.phone} onChange={(v) => onChange('phone', v)} />
              </div>
              <Field label="Website" value={form.website} onChange={(v) => onChange('website', v)} />
              <Field label="Address" value={form.address} onChange={(v) => onChange('address', v)} />
              <Field
                label="Tax / VAT / GST number"
                value={form.taxRegistrationNumber}
                onChange={(v) => onChange('taxRegistrationNumber', v)}
              />
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Fiscal year</span>
                <select
                  value={form.fiscalYear}
                  onChange={(e) => onChange('fiscalYear', e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#014582]"
                >
                  <option>January - December</option>
                  <option>April - March</option>
                  <option>July - June</option>
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: BRAND }}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-zinc-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
        <p className="mt-0.5 break-words text-zinc-800">{value?.trim() || '—'}</p>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium capitalize text-zinc-800">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#014582]"
      />
    </label>
  );
}
