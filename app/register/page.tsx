'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import {
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  Mail,
  MapPin,
  PenLine,
  Phone,
  User,
} from 'lucide-react';
import { apiClient } from '../lib/api-client';
import {
  saveCurrencyLocal,
  saveUserToLocal,
} from '../../lib/permission-service';
import SearchableSelect from '../../components/SearchableSelect';
import SignaturePadModal from '../../components/SignaturePadModal';
import {
  GEO_COUNTRIES,
  GEO_CURRENCIES,
  GEO_DIAL_OPTIONS,
  findCountryByName,
  findCurrency,
} from '../../lib/geo-data';
import {
  BUSINESS_TYPE_OPTIONS,
  FISCAL_YEAR_OPTIONS,
  INDUSTRY_OPTIONS,
  calculateFiscalYearDates,
} from '../../lib/business-options';

const STEPS = ['Personal', 'Contact', 'Business', 'Password', 'Done'] as const;

const COUNTRY_OPTIONS = GEO_COUNTRIES.map((c) => ({
  value: c.name,
  label: c.name,
  searchText: `${c.code} ${c.dial} ${c.currency}`,
}));

const CURRENCY_OPTIONS = GEO_CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} — ${c.name} (${c.symbol})`,
  searchText: `${c.code} ${c.name} ${c.symbol}`,
}));

const DIAL_OPTIONS = GEO_DIAL_OPTIONS.map((d) => ({
  value: d.countryCode,
  label: d.label,
  searchText: `${d.dial} ${d.countryName} ${d.countryCode}`,
}));

type FormState = {
  firstName: string;
  lastName: string;
  country: string;
  currencyCode: string;
  phoneCountryCode: string;
  phoneDial: string;
  phone: string;
  email: string;
  address: string;
  agreeToTerms: boolean;
  organizationName: string;
  industry: string;
  businessType: string;
  fiscalYear: string;
  taxRegistrationNumber: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  firstName: '',
  lastName: '',
  country: '',
  currencyCode: 'PKR',
  phoneCountryCode: 'PK',
  phoneDial: '+92',
  phone: '',
  email: '',
  address: '',
  agreeToTerms: false,
  organizationName: '',
  industry: '',
  businessType: '',
  fiscalYear: '',
  taxRegistrationNumber: '',
  password: '',
  confirmPassword: '',
};

function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const selectedCurrency = findCurrency(form.currencyCode) || GEO_CURRENCIES[0];

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const onCountryChange = (countryName: string) => {
    const country = findCountryByName(countryName);
    setForm((prev) => ({
      ...prev,
      country: countryName,
      phoneCountryCode: country?.code || prev.phoneCountryCode,
      phoneDial: country?.dial || prev.phoneDial,
      currencyCode: country?.currency || prev.currencyCode,
    }));
    setError('');
  };

  const onDialCountryChange = (countryCode: string) => {
    const dial = GEO_DIAL_OPTIONS.find((d) => d.countryCode === countryCode);
    setForm((prev) => ({
      ...prev,
      phoneCountryCode: countryCode,
      phoneDial: dial?.dial || prev.phoneDial,
    }));
    setError('');
  };

  const onPickLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('Please enter first and last name');
        return false;
      }
      if (!form.country) {
        setError('Please select a country');
        return false;
      }
      if (!form.currencyCode) {
        setError('Please select a currency');
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!form.phone.trim()) {
        setError('Please enter a valid phone number');
        return false;
      }
      if (!form.email.trim() || !form.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
      if (!form.agreeToTerms) {
        setError('Please agree to terms and conditions');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!form.organizationName.trim()) {
        setError('Please enter your organization / company name');
        return false;
      }
      if (!form.fiscalYear) {
        setError('Please select a fiscal year period');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      return true;
    }

    return true;
  };

  const submitRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      const phone = `${form.phoneDial}${form.phone.replace(/\s+/g, '')}`;
      const fd = new FormData();
      fd.append('firstName', form.firstName.trim());
      fd.append('lastName', form.lastName.trim());
      fd.append('email', form.email.trim());
      fd.append('password', form.password);
      fd.append('country', form.country);
      fd.append('phone', phone);
      fd.append('address', form.address.trim());
      fd.append('organizationName', form.organizationName.trim());
      fd.append('fiscalYear', form.fiscalYear);
      if (form.fiscalYear) {
        const fy = calculateFiscalYearDates(form.fiscalYear);
        fd.append('fiscalYearStartDate', fy.startDate);
        fd.append('fiscalYearEndDate', fy.endDate);
        fd.append('fiscalYearName', fy.name);
        fd.append('fiscalYearPeriodType', form.fiscalYear);
      }
      fd.append('taxRegistrationNumber', form.taxRegistrationNumber.trim());
      fd.append('industry', form.industry.trim());
      fd.append('businessType', form.businessType);
      fd.append('websiteLink', '');
      fd.append('contactNo', phone);

      if (logoFile) fd.append('logo', logoFile);
      if (signatureFile) fd.append('signature', signatureFile);

      const response = await fetch('/api/register', {
        method: 'POST',
        body: fd,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.token) {
        apiClient.setTokens(data.token, data.refreshToken || '');
        const { setMarketingLoggedInFlag } = await import('../../lib/marketing-session');
        setMarketingLoggedInFlag();
      }

      const currency = selectedCurrency || GEO_CURRENCIES[0];
      const userPayload = {
        ...(data.user || {}),
        role: data.user?.role || 'admin',
        permissions: data.user?.permissions || [],
        businessDetails: {
          ...(data.user?.businessDetails || {}),
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
          fiscalYear: form.fiscalYear,
          industry: form.industry.trim(),
          businessType: form.businessType,
          taxRegistrationNumber: form.taxRegistrationNumber.trim(),
        },
      };

      saveUserToLocal(userPayload);
      saveCurrencyLocal(currency.code, currency.symbol, currency.name);

      try {
        const { hydrateCompanyPrefsFromApi } = await import('../../lib/company-prefs');
        await hydrateCompanyPrefsFromApi();
      } catch {
        /* cache fills on first dropdown load */
      }

      try {
        await apiClient.put(
          '/api/users/currency',
          { currencyCode: currency.code, currencySymbol: currency.symbol },
          true
        );
      } catch {
        // Local currency already saved; backend sync is best-effort
      }

      try {
        const { fetchSubscriptionStatus } = await import('../../lib/subscription-service');
        await fetchSubscriptionStatus(data.token);
      } catch {
        /* continue — gate on Continue button */
      }

      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!validateStep()) return;
    if (step === 3) {
      await submitRegister();
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20';

  return (
    <AuthSplitLayout
      title="Create your workspace"
      subtitle="Register once — inventory, sales, purchases, and accounting stay connected."
    >
        <div className="w-full max-w-lg">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            {step < 4 && (
              <span className="text-xs font-medium text-gray-400">
                Step {step + 1} of 4
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {step === 4 ? 'Account activated' : 'Create account'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 4
              ? `Welcome, ${form.firstName}! Your free trial is ready.`
              : 'Same multi-step flow as the mobile app.'}
          </p>

          {/* Step indicators */}
          <div className="mt-6 mb-8 flex flex-wrap gap-2">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      done || active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 text-transparent'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : null}
                  </div>
                  <span
                    className={`text-[11px] ${
                      done || active ? 'font-semibold text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 0 — Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    placeholder="Enter your first name"
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                  />
                </div>
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    placeholder="Enter your last name"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Country</label>
                <SearchableSelect
                  options={COUNTRY_OPTIONS}
                  value={form.country}
                  onChange={onCountryChange}
                  placeholder="Search country…"
                />
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">Currency</label>
                <p className="mb-2 text-[11px] text-gray-400">
                  Auto-selected from country — change anytime ({GEO_CURRENCIES.length} currencies)
                </p>
                <SearchableSelect
                  options={CURRENCY_OPTIONS}
                  value={form.currencyCode}
                  onChange={(code) => update('currencyCode', code)}
                  placeholder="Search currency…"
                />
              </div>
            </div>
          )}

          {/* Step 1 — Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Phone Number</label>
                <div className="flex gap-2">
                  <div className="w-[210px] shrink-0">
                    <SearchableSelect
                      options={DIAL_OPTIONS}
                      value={form.phoneCountryCode}
                      onChange={onDialCountryChange}
                      placeholder="Code"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      className={`${inputClass} pl-10`}
                      placeholder="3001234567"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value.replace(/[^\d\s]/g, ''))}
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Selected code: {form.phoneDial}
                </p>
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className={`${inputClass} pl-10`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Address (Optional)
                </p>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    className={`${inputClass} min-h-[72px] pl-10`}
                    placeholder="Street, City, Postal Code"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300"
                  checked={form.agreeToTerms}
                  onChange={(e) => update('agreeToTerms', e.target.checked)}
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
            </div>
          )}

          {/* Step 2 — Business */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    placeholder="e.g., ABC Traders"
                    value={form.organizationName}
                    onChange={(e) => update('organizationName', e.target.value)}
                  />
                </div>
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">Industry</label>
                <SearchableSelect
                  options={[...INDUSTRY_OPTIONS]}
                  value={form.industry}
                  onChange={(v) => update('industry', v)}
                  placeholder="Select industry…"
                />
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">Business Type</label>
                <SearchableSelect
                  options={[...BUSINESS_TYPE_OPTIONS]}
                  value={form.businessType}
                  onChange={(v) => update('businessType', v)}
                  placeholder="Select business type…"
                />
                <label className="mb-1.5 mt-4 block text-xs font-semibold text-gray-600">
                  Fiscal Year <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={[...FISCAL_YEAR_OPTIONS]}
                  value={form.fiscalYear}
                  onChange={(v) => update('fiscalYear', v)}
                  placeholder="Select fiscal year period…"
                />
                {form.fiscalYear && (() => {
                  const fy = calculateFiscalYearDates(form.fiscalYear);
                  return (
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      Books will open as{' '}
                      <span className="font-semibold text-gray-700">{fy.name}</span>{' '}
                      ({fy.startDate} → {fy.endDate}). This is the year used across
                      accounting, sales and purchases.
                    </p>
                  );
                })()}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Registration & Tax Info
                </p>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Tax Registration Number
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g., NTN, GST, VAT Number"
                  value={form.taxRegistrationNumber}
                  onChange={(e) => update('taxRegistrationNumber', e.target.value)}
                />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Branding (Optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center hover:border-blue-400">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded object-contain" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-gray-400" />
                    )}
                    <span className="text-xs font-medium text-gray-600">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickLogo(e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSignatureOpen(true)}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center hover:border-blue-400"
                  >
                    {signaturePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="h-16 w-full rounded object-contain"
                      />
                    ) : (
                      <PenLine className="h-6 w-6 text-gray-400" />
                    )}
                    <span className="text-xs font-medium text-gray-600">
                      {signaturePreview ? 'Change Signature' : 'Draw / Upload Signature'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Password */}
          {step === 3 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < strength
                            ? strength <= 1
                              ? 'bg-red-400'
                              : strength === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Success */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
                  <Check className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-sm text-gray-700 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Account Summary
                </p>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Name</span>
                  <span className="font-medium text-right">
                    {form.firstName} {form.lastName}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Country</span>
                  <span className="font-medium text-right">{form.country}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Currency</span>
                  <span className="font-medium text-right">
                    {form.currencyCode}
                    {selectedCurrency ? ` — ${selectedCurrency.name}` : ''}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Phone</span>
                  <span className="font-medium text-right">
                    {form.phoneDial}
                    {form.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Email</span>
                  <span className="font-medium text-right break-all">{form.email}</span>
                </div>
                {form.organizationName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Company</span>
                    <span className="font-medium text-right">{form.organizationName}</span>
                  </div>
                )}
                {form.fiscalYear && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Fiscal Year</span>
                    <span className="font-medium text-right">{form.fiscalYear}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step < 4 && (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleContinue}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : step === 3 ? (
                'Create Account'
              ) : (
                'Continue'
              )}
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={async () => {
                const { resolvePostAuthDestination } = await import('../../lib/subscription-service');
                const destination = await resolvePostAuthDestination();
                window.location.replace(destination);
              }}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
            >
              Continue
            </button>
          )}

          {step < 4 && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign In
              </Link>
            </p>
          )}
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
    </AuthSplitLayout>
  );
}
