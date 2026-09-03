'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  Check,
  ChevronDown,
  Globe,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  PenLine,
  Phone,
  User,
  X,
} from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { usePermissions } from '../lib/usePermissions';
import { saveUserToLocal } from '../lib/permission-service';
import { APP_LOGO_FALLBACK, APP_NAME, notifyCompanyBrandingUpdated } from './BrandHeader';
import { fetchProfileCached, invalidateProfileCache } from '../lib/profile-cache';
import { performLogout } from '../lib/auth-logout';
import SearchableSelect from './SearchableSelect';
import SignaturePadModal from './SignaturePadModal';
import {
  GEO_COUNTRIES,
  GEO_DIAL_OPTIONS,
  findCountryByName,
} from '../lib/geo-data';
import {
  BUSINESS_TYPE_OPTIONS,
  FISCAL_YEAR_OPTIONS,
  INDUSTRY_OPTIONS,
} from '../lib/business-options';

export type CompanyProfile = {
  id?: string;
  organizationName?: string;
  personName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  contactNo?: string;
  address?: string;
  websiteLink?: string;
  country?: string;
  businessDetails?: {
    logo?: string;
    signature?: string;
    fiscalYear?: string;
    taxRegistrationNumber?: string;
    industry?: string;
    businessType?: string;
  };
};

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

function initials(name?: string) {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
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
  return { phoneCountryCode: 'PK', phoneDial: '+92', phoneLocal: raw.replace(/[^\d\s]/g, '') };
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

type Props = {
  variant?: 'light' | 'dark';
  accentClassName?: string;
};

export default function ProfileDropdown({
  variant = 'light',
  accentClassName = 'bg-[#014582]',
}: Props) {
  const { user } = usePermissions();
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState('');
  const [signatureOpen, setSignatureOpen] = useState(false);

  const [form, setForm] = useState({
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
  });

  const isDark = variant === 'dark';
  const selectVariant = isDark ? 'dark' : 'light';

  const applyProfileToForm = useCallback((p: CompanyProfile) => {
    const phoneParts = splitPhone(p.contactNo || p.phone);
    setForm({
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
    });
    setLogoPreview(p.businessDetails?.logo || '');
    setSignaturePreview(p.businessDetails?.signature || '');
    setLogoFile(null);
    setSignatureFile(null);
  }, []);

  const loadProfile = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const p = (await fetchProfileCached(force)) as CompanyProfile | null;
      if (!p) throw new Error('Failed to load profile');
      setProfile(p);
      applyProfileToForm(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [applyProfileToForm]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (signatureOpen) return;
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [signatureOpen]);

  const displayName =
    profile?.organizationName ||
    profile?.personName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    user?.email ||
    'Profile';

  const personLabel =
    profile?.personName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'User';

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

  const cancelEdit = () => {
    setEditing(false);
    if (profile) applyProfileToForm(profile);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError('');
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
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save profile');

      const updated = data.data as CompanyProfile;
      setProfile(updated);
      applyProfileToForm(updated);
      setEditing(false);
      notifyCompanyBrandingUpdated({
        logo: updated.businessDetails?.logo || APP_LOGO_FALLBACK,
        organizationName: updated.organizationName || APP_NAME,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    void performLogout('/login');
  };

  const triggerCls = isDark
    ? 'flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all text-white'
    : 'flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all';

  const panelCls = isDark
    ? 'absolute right-0 mt-2 w-[400px] max-w-[94vw] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden'
    : 'absolute right-0 mt-2 w-[400px] max-w-[94vw] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden';

  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const inputCls = isDark
    ? 'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#f59e0b]'
    : 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#014582]';
  const labelCls = `text-[11px] mb-1 block ${muted}`;

  return (
    <div className="relative" ref={rootRef}>
      <button type="button" className={triggerCls} onClick={() => setOpen((v) => !v)}>
        <div
          className={`w-8 h-8 ${accentClassName} rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
        >
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(displayName)
          )}
        </div>
        {!isDark && (
          <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
            {displayName}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className={panelCls}>
          <div className={`px-4 py-4 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-start gap-3">
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold ${accentClassName}`}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(displayName)
                  )}
                </div>
                {editing && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                    title="Change logo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold truncate ${text}`}>{displayName}</p>
                <p className={`text-xs truncate ${muted}`}>{personLabel}</p>
                <p className={`text-[11px] truncate mt-0.5 ${muted}`}>{profile?.email || user?.email}</p>
              </div>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="Edit profile"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className={`max-h-[min(70vh,520px)] overflow-y-auto px-4 py-3 space-y-3 ${editing ? 'overflow-x-visible' : ''}`}>
            {loading && (
              <div className={`flex items-center gap-2 text-sm ${muted}`}>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading company profile...
              </div>
            )}
            {error && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {!loading && !editing && profile && (
              <>
                <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Organization" value={profile.organizationName} muted={muted} text={text} />
                <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Contact person" value={profile.personName} muted={muted} text={text} />
                <DetailRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={profile.email} muted={muted} text={text} />
                <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={profile.contactNo || profile.phone} muted={muted} text={text} />
                <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={[profile.address, profile.country].filter(Boolean).join(', ')} muted={muted} text={text} />
                <DetailRow icon={<Globe className="w-3.5 h-3.5" />} label="Website" value={profile.websiteLink} muted={muted} text={text} />
                <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Industry" value={profile.businessDetails?.industry} muted={muted} text={text} />
                <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Business type" value={profile.businessDetails?.businessType} muted={muted} text={text} />
                <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Tax / NTN" value={profile.businessDetails?.taxRegistrationNumber} muted={muted} text={text} />
                <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Fiscal year" value={profile.businessDetails?.fiscalYear} muted={muted} text={text} />
                {profile.businessDetails?.signature && (
                  <div>
                    <p className={`text-[10px] uppercase tracking-wide mb-1 ${muted}`}>Signature</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.businessDetails.signature}
                      alt="Signature"
                      className="h-12 max-w-full object-contain rounded border border-gray-200 bg-white p-1"
                    />
                  </div>
                )}
              </>
            )}

            {!loading && editing && (
              <div className="space-y-2.5">
                <Field label="Organization name" value={form.organizationName} onChange={(v) => setForm((f) => ({ ...f, organizationName: v }))} className={inputCls} labelClassName={labelCls} />
                <Field label="Contact person" value={form.personName} onChange={(v) => setForm((f) => ({ ...f, personName: v }))} className={inputCls} labelClassName={labelCls} />
                <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} className={inputCls} labelClassName={labelCls} />

                <div>
                  <span className={labelCls}>Country</span>
                  <SearchableSelect
                    options={COUNTRY_OPTIONS}
                    value={form.country}
                    onChange={onCountryChange}
                    placeholder="Search country…"
                    size="sm"
                    variant={selectVariant}
                  />
                </div>

                <div>
                  <span className={labelCls}>Phone</span>
                  <div className="flex gap-2">
                    <div className="w-[150px] shrink-0">
                      <SearchableSelect
                        options={DIAL_OPTIONS}
                        value={form.phoneCountryCode}
                        onChange={onDialChange}
                        placeholder="Code"
                        size="sm"
                        variant={selectVariant}
                      />
                    </div>
                    <input
                      className={inputCls}
                      placeholder="3001234567"
                      value={form.phoneLocal}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          phoneLocal: e.target.value.replace(/[^\d\s]/g, ''),
                        }))
                      }
                    />
                  </div>
                  <p className={`mt-1 text-[10px] ${muted}`}>{fullPhone}</p>
                </div>

                <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} className={inputCls} labelClassName={labelCls} />
                <Field label="Website" value={form.websiteLink} onChange={(v) => setForm((f) => ({ ...f, websiteLink: v }))} className={inputCls} labelClassName={labelCls} />

                <div>
                  <span className={labelCls}>Industry</span>
                  <SearchableSelect
                    options={industryOptions}
                    value={form.industry}
                    onChange={(v) => setForm((f) => ({ ...f, industry: v }))}
                    placeholder="Select industry…"
                    size="sm"
                    variant={selectVariant}
                  />
                </div>

                <div>
                  <span className={labelCls}>Business type</span>
                  <SearchableSelect
                    options={businessTypeOptions}
                    value={form.businessType}
                    onChange={(v) => setForm((f) => ({ ...f, businessType: v }))}
                    placeholder="Select business type…"
                    size="sm"
                    variant={selectVariant}
                  />
                </div>

                <div>
                  <span className={labelCls}>Fiscal year</span>
                  <SearchableSelect
                    options={fiscalYearOptions}
                    value={form.fiscalYear}
                    onChange={(v) => setForm((f) => ({ ...f, fiscalYear: v }))}
                    placeholder="Select fiscal year…"
                    size="sm"
                    variant={selectVariant}
                  />
                </div>

                <Field
                  label="Tax / NTN"
                  value={form.taxRegistrationNumber}
                  onChange={(v) => setForm((f) => ({ ...f, taxRegistrationNumber: v }))}
                  className={inputCls}
                  labelClassName={labelCls}
                />

                <div>
                  <span className={labelCls}>Signature</span>
                  <div
                    className={`rounded-xl border border-dashed p-3 ${
                      isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {signaturePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="mb-2 h-14 w-full object-contain rounded bg-white"
                      />
                    ) : (
                      <p className={`mb-2 text-xs ${muted}`}>No signature yet</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setSignatureOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1088dd]/10 px-3 py-2 text-xs font-semibold text-[#1088dd] hover:bg-[#1088dd]/15"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      {signaturePreview ? 'Change signature (draw / upload)' : 'Add signature (draw / upload)'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveProfile}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1088dd] hover:bg-[#0b6bb3] text-white text-sm font-semibold py-2.5 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save changes
                </button>
              </div>
            )}
          </div>

          <div className={`px-3 py-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <button
              type="button"
              onClick={logout}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      <SignaturePadModal
        open={signatureOpen}
        dark={isDark}
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

function DetailRow({
  icon,
  label,
  value,
  muted,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  muted: string;
  text: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-0.5 ${muted}`}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-[10px] uppercase tracking-wide ${muted}`}>{label}</p>
        <p className={`text-sm break-words ${text}`}>{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
  labelClassName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className: string;
  labelClassName: string;
}) {
  return (
    <label className="block">
      <span className={labelClassName}>{label}</span>
      <input className={className} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
