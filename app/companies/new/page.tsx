'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { MainHubSidebar } from '../../../components/MainHubSidebar';
import { TopBarBrand } from '../../../components/BrandHeader';
import AppBreadcrumbs from '../../../components/AppBreadcrumbs';
import CompanySwitcher from '../../../components/CompanySwitcher';
import ProfileDropdown from '../../../components/ProfileDropdown';
import { useCompanyOptional } from '../../../lib/company-context';

const BRAND = '#014582';

export default function CreateCompanyPage() {
  const router = useRouter();
  const companyCtx = useCompanyOptional();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    businessType: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    taxRegistrationNumber: '',
    fiscalYear: 'January - December',
  });

  const onChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCtx) return;
    setSaving(true);
    setError('');
    try {
      const created = await companyCtx.createCompany(form);
      router.replace('/dashboard');
      // createCompany already switches active company; reload to refresh all scopes
      setTimeout(() => window.location.assign('/dashboard'), 100);
      void created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/companies/new" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <TopBarBrand title="Create Company" icon={<Building2 className="h-5 w-5 text-[#014582]" />} />
          <div className="flex items-center gap-3">
            <CompanySwitcher />
            <ProfileDropdown />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <AppBreadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Create Company' },
            ]}
          />
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-zinc-900">Create a new company</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Each company has its own accounting, sales, inventory and settings. No warehouse is
              created automatically.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Company name *" value={form.name} onChange={(v) => onChange('name', v)} required />
              <Field label="Business type" value={form.businessType} onChange={(v) => onChange('businessType', v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" type="email" value={form.email} onChange={(v) => onChange('email', v)} />
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
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option>January - December</option>
                  <option>April - March</option>
                  <option>July - June</option>
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
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
        </main>
      </div>
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
