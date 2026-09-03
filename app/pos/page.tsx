'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Monitor,
  Settings,
  ArrowLeft,
  Store,
  Shield,
  Users,
  Pencil,
} from 'lucide-react';
import { MainHubSidebar } from '../../components/MainHubSidebar';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import { usePermissions } from '../../lib/usePermissions';
import { getDesktopDownloadUrl, hasDesktopDownload } from '../../lib/desktop-app-download';
import { fetchPosSettings } from '../../lib/pos-settings-service';
import { posModeLabel, type PosMode } from '../../lib/pos-roles';
import PosModePicker from './components/PosModePicker';
import {
  fetchSubscriptionCapacity,
  isPosOnlyTier,
  readCachedProductTier,
  readCachedSubscription,
} from '../../lib/subscription-service';

export default function POSLandingPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = usePermissions();
  const downloadUrl = getDesktopDownloadUrl();
  const canDownload = hasDesktopDownload();
  const cached = readCachedSubscription();
  const [posOnly, setPosOnly] = useState(() =>
    isPosOnlyTier(
      readCachedProductTier() || cached.productTier,
      cached.subscription.plan,
      cached.hasAccess
    )
  );

  const [posMode, setPosMode] = useState<PosMode>('retail');
  const [posModeConfigured, setPosModeConfigured] = useState<boolean | null>(null);
  const [editingMode, setEditingMode] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cap = await fetchSubscriptionCapacity();
        if (cancelled || !cap.success || !cap.data) return;
        setPosOnly(
          isPosOnlyTier(cap.data.productTier, cap.data.subscriptionPlan, true)
        );
      } catch {
        /* keep cached */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        setSettingsLoading(true);
        const settings = await fetchPosSettings();
        if (cancelled) return;
        setPosMode(settings.posMode);
        setPosModeConfigured(settings.posModeConfigured);
      } catch {
        if (!cancelled) {
          const fromUser = (user.company as { posMode?: string } | undefined)?.posMode
            || (user.posMode as string | undefined);
          setPosMode(fromUser === 'restaurant' ? 'restaurant' : 'retail');
          setPosModeConfigured(Boolean(user.posModeConfigured));
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleModeSaved = (mode: PosMode) => {
    setPosMode(mode);
    setPosModeConfigured(true);
    setEditingMode(false);
  };

  if (loading || !user || settingsLoading || posModeConfigured === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  const needsSetup = isAdmin && !posModeConfigured;
  const showMainContent = posModeConfigured && !editingMode;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/pos" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <TopBarBrand title="Point of Sale" />
          <ProfileDropdown />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <AppBreadcrumbs />

          <div className="max-w-3xl mx-auto mt-6 space-y-6">
            {(needsSetup || editingMode) && isAdmin && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <PosModePicker
                  initialMode={posMode}
                  onSaved={handleModeSaved}
                  compact={editingMode}
                />
                {editingMode && (
                  <button
                    type="button"
                    onClick={() => setEditingMode(false)}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {!posModeConfigured && !isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-900">
                Your administrator must choose a POS type (Retail or Restaurant) on this page before staff can use the desktop app.
              </div>
            )}

            {showMainContent && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-[#014582] to-[#023a6b] px-8 py-10 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Point of Sale</h1>
                      <p className="text-white/80 text-sm mt-1">
                        {posModeLabel(posMode)} — sell on the desktop app
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {isAdmin && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">POS type</p>
                        <p className="font-semibold text-gray-900">{posModeLabel(posMode)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingMode(true)}
                        className="inline-flex items-center gap-1.5 text-sm text-[#014582] hover:underline"
                      >
                        <Pencil className="w-4 h-4" />
                        Change
                      </button>
                    </div>
                  )}

                  <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <Monitor className="w-8 h-8 text-[#014582] flex-shrink-0 mt-0.5" />
                    <div>
                      <h2 className="font-semibold text-gray-900">POS runs on the desktop app</h2>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {posMode === 'restaurant' ? (
                          <>
                            Install the desktop app for kitchen and cashier. Waiters use the Order Pick mobile app.
                            Create <strong>waiter</strong>, <strong>kitchen</strong>, and <strong>cashier</strong> users under Users.
                          </>
                        ) : (
                          <>
                            Checkout, barcode scanning, receipts, and shift management are in the Bisonstechs POS desktop app.
                            Create <strong>cashier</strong> users under Users for register staff.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {canDownload && downloadUrl ? (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#014582] text-white font-semibold text-sm hover:bg-[#013566] transition-colors shadow-sm"
                      >
                        <Download className="w-5 h-5" />
                        Download desktop app
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                        <Download className="w-4 h-4 flex-shrink-0" />
                        Installer not published yet — ask your administrator for the desktop app file.
                      </div>
                    )}

                    {isAdmin && (
                      <>
                        <Link
                          href="/pos/management"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[#014582] text-[#014582] font-semibold text-sm hover:bg-[#014582]/5 transition-colors"
                        >
                          <Settings className="w-5 h-5" />
                          POS admin
                        </Link>
                        <Link
                          href="/users"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Users className="w-5 h-5" />
                          Manage users
                        </Link>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-900">
                      <Shield className="w-5 h-5 flex-shrink-0 text-[#014582]" />
                      <p>
                        Configure terminals, shifts, and receipts in <strong>POS admin</strong>. User roles available when
                        creating staff depend on your POS type ({posModeLabel(posMode)}).
                      </p>
                    </div>
                  )}

                  {!isAdmin && (
                    <p className="text-sm text-gray-500">
                      Need to sell? Install the desktop app and sign in with your account.
                    </p>
                  )}

                  {!posOnly && (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#014582] transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to dashboard
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
