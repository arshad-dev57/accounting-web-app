'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Camera,
  Check,
  CreditCard,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  PenLine,
  Phone,
  User,
  X,
} from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { MainHubSidebar } from '../../../components/MainHubSidebar';
import { TopBarBrand, notifyCompanyBrandingUpdated } from '../../../components/BrandHeader';
import AppBreadcrumbs from '../../../components/AppBreadcrumbs';
import ProfileDropdown, { type CompanyProfile } from '../../../components/ProfileDropdown';
import NotificationDropdown from '../../../components/NotificationDropdown';
import CompanySwitcher from '../../../components/CompanySwitcher';
import SearchableSelect from '../../../components/SearchableSelect';
import SignaturePadModal from '../../../components/SignaturePadModal';
import BusinessConfigSection from '../../../components/BusinessConfigSection';
import { useCompanyOptional } from '../../../lib/company-context';
import { fetchProfileCached, invalidateProfileCache } from '../../../lib/profile-cache';
import { saveUserToLocal } from '../../../lib/permission-service';
import { usePermissions } from '../../../lib/usePermissions';
import {
  GEO_COUNTRIES,
  GEO_DIAL_OPTIONS,
  findCountryByName,
} from '../../../lib/geo-data';
import {
  BUSINESS_TYPE_OPTIONS,
  FISCAL_YEAR_OPTIONS,
  INDUSTRY_OPTIONS,
} from '../../../lib/business-options';

function authToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('auth_token') ||
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('auth_token='))
      ?.split('=')[1] ||
    ''
  );
}

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

function titleCaseLabel(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .replace(/\bVat\b/g, 'VAT')
    .replace(/\bNtn\b/g, 'NTN')
    .replace(/\bGst\b/g, 'GST');
}

function displayPersonName(
  profile: CompanyProfile | null,
  user?: { firstName?: string; lastName?: string; email?: string } | null
) {
  const fromProfile = String(profile?.personName || '').trim();
  const fromUser = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const emailLocal = String(user?.email || profile?.email || '')
    .split('@')[0]
    ?.replace(/[._-]+/g, ' ')
    .trim();

  // Prefer a real person name; avoid email-local junk like "Info Marcell"
  if (fromUser && !looksLikeEmailLocalName(fromUser, emailLocal)) return fromUser;
  if (fromProfile && !looksLikeEmailLocalName(fromProfile, emailLocal)) return fromProfile;
  if (fromUser) return fromUser;
  if (fromProfile) return fromProfile;
  return '';
}

function looksLikeEmailLocalName(name: string, emailLocal?: string) {
  if (!name?.trim()) return true;
  const n = name.trim().toLowerCase();
  const local = String(emailLocal || '').toLowerCase();
  if (local && (n === local || n.startsWith(`${local} `))) return true;
  // "Info …" from info@… registrations
  if (/^info(\s|$)/i.test(name.trim())) return true;
  return false;
}

function splitPhone(raw?: string) {
  if (!raw?.trim()) {
    return { phoneCountryCode: 'PK', phoneDial: '+92', phoneLocal: '' };
  }
  try {
    const parsed = parsePhoneNumberFromString(raw.trim());
    if (parsed?.isValid() || parsed?.countryCallingCode) {
      return {
        phoneCountryCode: parsed.country || 'PK',
        phoneDial: `+${parsed.countryCallingCode}`,
        phoneLocal: String(parsed.nationalNumber || ''),
      };
    }
  } catch {
    /* ignore */
  }
  const m = raw.trim().match(/^(\+\d{1,4})\s*(.*)$/);
  if (m) {
    const dial = m[1];
    const match = GEO_DIAL_OPTIONS.find((d) => d.dial === dial);
    return {
      phoneCountryCode: match?.countryCode || 'PK',
      phoneDial: dial,
      phoneLocal: (m[2] || '').replace(/[^\d\s]/g, ''),
    };
  }
  return {
    phoneCountryCode: 'PK',
    phoneDial: '+92',
    phoneLocal: raw.replace(/[^\d\s]/g, ''),
  };
}

const COUNTRY_OPTIONS = GEO_COUNTRIES.map((c) => ({
  value: c.name,
  label: c.name,
  searchText: `${c.code} ${c.dial}`,
}));

const DIAL_OPTIONS = GEO_DIAL_OPTIONS.map((d) => ({
  value: d.countryCode,
  label: d.label,
  searchText: `${d.dial} ${d.countryName} ${d.countryCode}`,
}));

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex gap-3 min-w-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#014582]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-zinc-900 break-words">{value?.trim() || '—'}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[#014582] focus:ring-2 focus:ring-[#014582]/15"
      />
    </label>
  );
}

type FormState = {
  organizationName: string;
  personName: string;
  email: string;
  phoneCountryCode: string;
  phoneDial: string;
  phoneLocal: string;
  address: string;
  websiteLink: string;
  country: string;
  taxRegistrationNumber: string;
  industry: string;
  businessType: string;
  fiscalYear: string;
};

function emptyForm(): FormState {
  return {
    organizationName: '',
    personName: '',
    email: '',
    phoneCountryCode: 'PK',
    phoneDial: '+92',
    phoneLocal: '',
    address: '',
    websiteLink: '',
    country: '',
    taxRegistrationNumber: '',
    industry: '',
    businessType: '',
    fiscalYear: '',
  };
}

function profileToForm(p: CompanyProfile): FormState {
  const phoneParts = splitPhone(p.contactNo || p.phone);
  return {
    organizationName: p.organizationName || '',
    personName: p.personName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
    email: p.email || '',
    phoneCountryCode: phoneParts.phoneCountryCode,
    phoneDial: phoneParts.phoneDial,
    phoneLocal: phoneParts.phoneLocal,
    address: p.address || '',
    websiteLink: p.websiteLink || '',
    country: p.country || '',
    taxRegistrationNumber: p.businessDetails?.taxRegistrationNumber || '',
    industry: p.businessDetails?.industry || '',
    businessType: p.businessDetails?.businessType || '',
    fiscalYear: p.businessDetails?.fiscalYear || '',
  };
}

export default function CompanyProfilePage() {
  const companyCtx = useCompanyOptional();
  const { user } = usePermissions();
  const router = useRouter();
  const active = companyCtx?.activeCompany || null;
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState('');
  const [signatureOpen, setSignatureOpen] = useState(false);

  const applyProfile = useCallback(
    (p: CompanyProfile) => {
      setProfile(p);
      const next = profileToForm(p);
      const nicer = displayPersonName(p, user);
      if (nicer && looksLikeEmailLocalName(next.personName, p.email?.split('@')[0])) {
        next.personName = nicer;
      }
      setForm(next);
      setLogoPreview(p.businessDetails?.logo || '');
      setSignaturePreview(p.businessDetails?.signature || '');
      setLogoFile(null);
      setSignatureFile(null);
    },
    [user]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      invalidateProfileCache();
      const p = (await fetchProfileCached(true)) as CompanyProfile | null;
      if (!p) throw new Error('Failed to load company profile');
      applyProfile(p);
      notifyCompanyBrandingUpdated({
        logo: active?.logo || p.businessDetails?.logo || '',
        organizationName: active?.name || p.organizationName || '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [active?.logo, active?.name, applyProfile]);

  useEffect(() => {
    void load();
  }, [load, companyCtx?.activeCompanyId]);

  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener('active-company-changed', onChanged);
    return () => window.removeEventListener('active-company-changed', onChanged);
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === '1') setEditing(true);
  }, []);

  useEffect(() => {
    const onEdit = () => setEditing(true);
    window.addEventListener('edit-company-profile', onEdit);
    return () => window.removeEventListener('edit-company-profile', onEdit);
  }, []);

  const name = active?.name || profile?.organizationName || 'Company';
  const logo = logoPreview || active?.logo || profile?.businessDetails?.logo || '';
  const email = active?.email || profile?.email || '';
  const phone = active?.phone || profile?.contactNo || profile?.phone || '';
  const address = [active?.address || profile?.address, profile?.country]
    .filter(Boolean)
    .join(', ');
  const website = active?.website || profile?.websiteLink || '';
  const businessType =
    active?.businessType || profile?.businessDetails?.businessType || '';
  const industry = profile?.businessDetails?.industry || '';
  const tax =
    active?.taxRegistrationNumber ||
    profile?.businessDetails?.taxRegistrationNumber ||
    '';
  const fiscalYear = titleCaseLabel(profile?.businessDetails?.fiscalYear || '');
  const person = displayPersonName(profile, user);

  const fullPhone = useMemo(
    () => `${form.phoneDial}${form.phoneLocal.replace(/\s+/g, '')}`,
    [form.phoneDial, form.phoneLocal]
  );

  const industryOptions = useMemo(() => {
    if (form.industry && !INDUSTRY_OPTIONS.some((o) => o.value === form.industry)) {
      return [{ value: form.industry, label: form.industry }, ...INDUSTRY_OPTIONS];
    }
    return [...INDUSTRY_OPTIONS];
  }, [form.industry]);

  const businessTypeOptions = useMemo(() => {
    if (form.businessType && !BUSINESS_TYPE_OPTIONS.some((o) => o.value === form.businessType)) {
      return [{ value: form.businessType, label: form.businessType }, ...BUSINESS_TYPE_OPTIONS];
    }
    return [...BUSINESS_TYPE_OPTIONS];
  }, [form.businessType]);

  const fiscalYearOptions = useMemo(() => {
    if (form.fiscalYear && !FISCAL_YEAR_OPTIONS.some((o) => o.value === form.fiscalYear)) {
      return [{ value: form.fiscalYear, label: form.fiscalYear }, ...FISCAL_YEAR_OPTIONS];
    }
    return [...FISCAL_YEAR_OPTIONS];
  }, [form.fiscalYear]);

  const startEdit = () => {
    if (profile) applyProfile(profile);
    setSaveError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    if (profile) applyProfile(profile);
    setSaveError('');
    setEditing(false);
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('edit') === '1') {
      router.replace('/companies/profile');
    }
  };

  const onPickLogo = (file?: File | null) => {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onCountryChange = (countryName: string) => {
    const country = findCountryByName(countryName);
    setForm((prev) => ({
      ...prev,
      country: countryName,
      phoneCountryCode: country?.code || prev.phoneCountryCode,
      phoneDial: country?.dial || prev.phoneDial,
    }));
  };

  const onDialChange = (countryCode: string) => {
    const dial = GEO_DIAL_OPTIONS.find((d) => d.countryCode === countryCode);
    setForm((prev) => ({
      ...prev,
      phoneCountryCode: countryCode,
      phoneDial: dial?.dial || prev.phoneDial,
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const fd = new FormData();
      fd.append('organizationName', form.organizationName);
      fd.append('personName', form.personName);
      fd.append('email', form.email);
      fd.append('phone', fullPhone);
      fd.append('contactNo', fullPhone);
      fd.append('address', form.address);
      fd.append('websiteLink', form.websiteLink);
      fd.append('country', form.country);
      fd.append('taxRegistrationNumber', form.taxRegistrationNumber);
      fd.append('industry', form.industry);
      fd.append('businessType', form.businessType);
      fd.append('fiscalYear', form.fiscalYear);
      if (logoFile) fd.append('logo', logoFile);
      if (signatureFile) fd.append('signature', signatureFile);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save profile');
      }

      const updated = data.data as CompanyProfile;
      applyProfile(updated);
      setEditing(false);
      notifyCompanyBrandingUpdated({
        logo: updated.businessDetails?.logo || '',
        organizationName: updated.organizationName || '',
      });
      invalidateProfileCache();

      if (user) {
        const parts = (form.personName || '').trim().split(/\s+/);
        saveUserToLocal({
          ...user,
          firstName: parts[0] || user.firstName,
          lastName: parts.slice(1).join(' ') || user.lastName,
          email: form.email || user.email,
          organizationName: form.organizationName || user.organizationName,
          address: form.address || user.address,
          country: form.country || user.country,
          phone: fullPhone,
        });
      }

      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('edit') === '1') {
        router.replace('/companies/profile');
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/companies" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <TopBarBrand title="Company Profile" icon={<Building2 className="h-5 w-5 text-[#014582]" />} />
          <div className="flex items-center gap-3">
            <CompanySwitcher />
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <AppBreadcrumbs
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Companies', href: '/companies' },
                { label: 'Profile' },
              ]}
            />

            <div className="mt-4 mb-6">
              <Link
                href="/companies"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#014582] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to companies
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-24 text-sm text-zinc-500 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-[#014582]" />
                Loading company profile…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="h-28 bg-gradient-to-br from-[#00274d] via-[#014582] to-blue-700 sm:h-32" />
                  <div className="relative px-5 pb-6 sm:px-8">
                    {/* Logo overlaps banner; title stays fully on white so it never clashes */}
                    <div className="relative -mt-12 mb-4 w-fit sm:-mt-14">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md ring-1 ring-zinc-200 sm:h-28 sm:w-28">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logo}
                            alt={editing ? form.organizationName || name : name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-[#014582] text-2xl font-bold text-white">
                            {(editing ? form.organizationName || name : name)
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      {editing ? (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#014582] text-white shadow-md hover:bg-[#01366a]"
                          title="Change logo"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      ) : null}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickLogo(e.target.files?.[0])}
                      />
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-2xl font-bold leading-tight text-zinc-900 break-words">
                            {editing ? form.organizationName || name : name}
                          </h1>
                          {active?.isOwner && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                              <BadgeCheck className="h-3 w-3" />
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {[
                            titleCaseLabel(
                              (editing ? form.businessType : businessType) || 'Business'
                            ),
                            titleCaseLabel(editing ? form.industry : industry),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {(editing ? form.email : email) ? (
                          <p className="mt-1 truncate text-sm text-zinc-600">
                            {editing ? form.email : email}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveProfile()}
                              disabled={saving}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#01366a] disabled:opacity-60"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Save changes
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={startEdit}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#01366a]"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {saveError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {saveError}
                  </div>
                ) : null}

                {editing ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Contact">
                      <div className="space-y-4">
                        <FormField
                          label="Contact person"
                          value={form.personName}
                          onChange={(v) => setForm((f) => ({ ...f, personName: v }))}
                        />
                        <FormField
                          label="Email"
                          type="email"
                          value={form.email}
                          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                        />
                        <div>
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Country
                          </span>
                          <SearchableSelect
                            options={COUNTRY_OPTIONS}
                            value={form.country}
                            onChange={onCountryChange}
                            placeholder="Search country…"
                            size="sm"
                          />
                        </div>
                        <div>
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Phone
                          </span>
                          <div className="flex gap-2">
                            <div className="w-[150px] shrink-0">
                              <SearchableSelect
                                options={DIAL_OPTIONS}
                                value={form.phoneCountryCode}
                                onChange={onDialChange}
                                placeholder="Code"
                                size="sm"
                              />
                            </div>
                            <input
                              value={form.phoneLocal}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  phoneLocal: e.target.value.replace(/[^\d\s]/g, ''),
                                }))
                              }
                              placeholder="3001234567"
                              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[#014582] focus:ring-2 focus:ring-[#014582]/15"
                            />
                          </div>
                          <p className="mt-1 text-xs text-zinc-400">{fullPhone}</p>
                        </div>
                        <FormField
                          label="Address"
                          value={form.address}
                          onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                        />
                        <FormField
                          label="Website"
                          value={form.websiteLink}
                          onChange={(v) => setForm((f) => ({ ...f, websiteLink: v }))}
                        />
                      </div>
                    </Section>

                    <Section title="Business details">
                      <div className="space-y-4">
                        <FormField
                          label="Organization"
                          value={form.organizationName}
                          onChange={(v) => setForm((f) => ({ ...f, organizationName: v }))}
                        />
                        <div>
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Legal structure
                          </span>
                          <SearchableSelect
                            options={businessTypeOptions}
                            value={form.businessType}
                            onChange={(v) => setForm((f) => ({ ...f, businessType: v }))}
                            placeholder="Select business type…"
                            size="sm"
                          />
                        </div>
                        <div>
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Industry
                          </span>
                          <SearchableSelect
                            options={industryOptions}
                            value={form.industry}
                            onChange={(v) => setForm((f) => ({ ...f, industry: v }))}
                            placeholder="Select industry…"
                            size="sm"
                          />
                        </div>
                        <FormField
                          label="Tax / NTN / VAT"
                          value={form.taxRegistrationNumber}
                          onChange={(v) =>
                            setForm((f) => ({ ...f, taxRegistrationNumber: v }))
                          }
                        />
                        <div>
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Fiscal year
                          </span>
                          <SearchableSelect
                            options={fiscalYearOptions}
                            value={form.fiscalYear}
                            onChange={(v) => setForm((f) => ({ ...f, fiscalYear: v }))}
                            placeholder="Select fiscal year…"
                            size="sm"
                          />
                        </div>
                        <div>
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            Signature
                          </span>
                          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                            {signaturePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={signaturePreview}
                                alt="Signature"
                                className="mb-3 h-16 w-full rounded-lg border border-zinc-200 bg-white object-contain p-2"
                              />
                            ) : (
                              <p className="mb-3 text-sm text-zinc-500">No signature yet</p>
                            )}
                            <button
                              type="button"
                              onClick={() => setSignatureOpen(true)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#014582]/10 px-3 py-2.5 text-sm font-semibold text-[#014582] hover:bg-[#014582]/15"
                            >
                              <PenLine className="h-4 w-4" />
                              {signaturePreview
                                ? 'Change signature (draw / upload)'
                                : 'Add signature (draw / upload)'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Section>

                    <div className="lg:col-span-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveProfile()}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#014582] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#01366a] disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Contact">
                      <div className="space-y-4">
                        <Field icon={<User className="h-4 w-4" />} label="Contact person" value={person} />
                        <Field icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
                        <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={phone} />
                        <Field icon={<MapPin className="h-4 w-4" />} label="Address" value={address} />
                        <Field icon={<Globe className="h-4 w-4" />} label="Website" value={website} />
                      </div>
                    </Section>

                    <Section title="Business details">
                      <div className="space-y-4">
                        <Field
                          icon={<Building2 className="h-4 w-4" />}
                          label="Organization"
                          value={name}
                        />
                        <Field
                          icon={<Building2 className="h-4 w-4" />}
                          label="Legal structure"
                          value={businessType}
                        />
                        <Field
                          icon={<Building2 className="h-4 w-4" />}
                          label="Industry"
                          value={industry}
                        />
                        <Field
                          icon={<Building2 className="h-4 w-4" />}
                          label="Tax / NTN / VAT"
                          value={tax}
                        />
                        <Field
                          icon={<Calendar className="h-4 w-4" />}
                          label="Fiscal year"
                          value={fiscalYear}
                        />
                      </div>
                    </Section>

                    <div className="lg:col-span-2">
                      <Section title="Business Configuration">
                        <BusinessConfigSection canEdit />
                      </Section>
                    </div>

                    <Section title="Subscription">
                      <div className="space-y-4">
                        <Field
                          icon={<CreditCard className="h-4 w-4" />}
                          label="Plan"
                          value={active?.subscriptionPlan}
                        />
                        <Field
                          icon={<CreditCard className="h-4 w-4" />}
                          label="Status"
                          value={active?.subscriptionStatus}
                        />
                        <Field
                          icon={<Building2 className="h-4 w-4" />}
                          label="Product"
                          value={active?.productTier?.replace(/_/g, ' + ')}
                        />
                        <Field
                          icon={<Calendar className="h-4 w-4" />}
                          label="Trial ends"
                          value={fmtDate(active?.trialEndDate)}
                        />
                        <Field
                          icon={<Calendar className="h-4 w-4" />}
                          label="Subscription ends"
                          value={fmtDate(active?.subscriptionEndDate)}
                        />
                      </div>
                    </Section>

                    <Section title="Membership">
                      <div className="space-y-4">
                        <Field
                          icon={<BadgeCheck className="h-4 w-4" />}
                          label="Role"
                          value={active?.isOwner ? 'Owner' : active?.membershipRole}
                        />
                        <Field
                          icon={<Calendar className="h-4 w-4" />}
                          label="Company created"
                          value={fmtDate(active?.createdAt)}
                        />
                        {profile?.businessDetails?.signature ? (
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                              Signature
                            </p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={profile.businessDetails.signature}
                              alt="Signature"
                              className="h-16 max-w-full rounded-lg border border-zinc-200 bg-white object-contain p-2"
                            />
                          </div>
                        ) : null}
                      </div>
                    </Section>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <SignaturePadModal
        open={signatureOpen}
        initialPreview={signaturePreview}
        onClose={() => setSignatureOpen(false)}
        onSave={(file, previewUrl) => {
          setSignatureFile(file);
          setSignaturePreview(previewUrl);
        }}
      />
    </div>
  );
}
