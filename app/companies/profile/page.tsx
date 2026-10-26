'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CreditCard,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from 'lucide-react';
import { MainHubSidebar } from '../../../components/MainHubSidebar';
import { TopBarBrand, notifyCompanyBrandingUpdated } from '../../../components/BrandHeader';
import AppBreadcrumbs from '../../../components/AppBreadcrumbs';
import ProfileDropdown, { type CompanyProfile } from '../../../components/ProfileDropdown';
import NotificationDropdown from '../../../components/NotificationDropdown';
import CompanySwitcher from '../../../components/CompanySwitcher';
import { useCompanyOptional } from '../../../lib/company-context';
import { fetchProfileCached, invalidateProfileCache } from '../../../lib/profile-cache';
import BusinessConfigSection from '../../../components/BusinessConfigSection';

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

export default function CompanyProfilePage() {
  const companyCtx = useCompanyOptional();
  const active = companyCtx?.activeCompany || null;
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      invalidateProfileCache();
      const p = (await fetchProfileCached(true)) as CompanyProfile | null;
      if (!p) throw new Error('Failed to load company profile');
      setProfile(p);
      notifyCompanyBrandingUpdated({
        logo: active?.logo || p.businessDetails?.logo || '',
        organizationName: active?.name || p.organizationName || '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [active?.logo, active?.name]);

  useEffect(() => {
    void load();
  }, [load, companyCtx?.activeCompanyId]);

  useEffect(() => {
    const onChanged = () => void load();
    window.addEventListener('active-company-changed', onChanged);
    return () => window.removeEventListener('active-company-changed', onChanged);
  }, [load]);

  const name = active?.name || profile?.organizationName || 'Company';
  const logo = active?.logo || profile?.businessDetails?.logo || '';
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
  const fiscalYear = profile?.businessDetails?.fiscalYear || '';
  const person = profile?.personName || '';

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
                {/* Profile cover + identity */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <div className="h-32 bg-gradient-to-br from-[#00274d] via-[#014582] to-blue-700 sm:h-40" />
                  <div className="relative px-5 pb-6 sm:px-8">
                    <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md ring-1 ring-zinc-200 sm:h-28 sm:w-28">
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logo}
                              alt={name}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-[#014582] text-2xl font-bold text-white">
                              {name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-zinc-900 truncate">{name}</h1>
                            {active?.isOwner && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                <BadgeCheck className="h-3 w-3" />
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-zinc-500 capitalize">
                            {[businessType || 'Business', industry].filter(Boolean).join(' · ')}
                          </p>
                          {email ? (
                            <p className="mt-1 text-sm text-zinc-600 truncate">{email}</p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          window.dispatchEvent(new Event('open-profile-dropdown'))
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#01366a]"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit profile
                      </button>
                    </div>
                  </div>
                </div>

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
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
