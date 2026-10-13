'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Apple,
  Download,
  Monitor,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AuthSplitLayout from '../../../components/AuthSplitLayout';
import {
  getDesktopDownloadPageModel,
  type DesktopDownloadCard,
} from '../../../lib/desktop-app-download';

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M3 5.5 10.5 4.6V12H3V5.5zm0 13.1V13.5h7.5v8.9L3 18.6zM11.25 12V4.4L21 3v9h-9.75zm0 1.5H21v9l-9.75-1.4V13.5z" />
    </svg>
  );
}

function PlatformIcon({ id }: { id: DesktopDownloadCard['id'] }) {
  if (id === 'win') return <WindowsIcon className="w-8 h-8 text-[#014582]" />;
  return <Apple className="w-8 h-8 text-[#014582]" />;
}

function DownloadCard({
  card,
  recommended,
}: {
  card: DesktopDownloadCard;
  recommended: boolean;
}) {
  const ready = Boolean(card.url);

  return (
    <div
      className={[
        'rounded-2xl border p-6 flex flex-col gap-4 transition-shadow',
        recommended ? 'border-[#014582] ring-2 ring-[#014582]/20 shadow-md bg-white' : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#014582]/8 flex items-center justify-center flex-shrink-0">
          <PlatformIcon id={card.id} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{card.title}</h2>
            {recommended && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#014582] text-white">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{card.subtitle}</p>
          <p className="text-xs text-gray-400 mt-2 font-mono break-all">{card.fileLabel}</p>
        </div>
      </div>

      {ready ? (
        <a
          href={card.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#014582] text-white font-semibold text-sm hover:bg-[#013566] transition-colors"
        >
          <Download className="w-5 h-5" />
          Download
        </a>
      ) : (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            Installer not published yet for this platform. Publish a GitHub Release for this version or set the
            matching <code className="text-xs bg-amber-100/80 px-1 rounded">NEXT_PUBLIC_DESKTOP_DOWNLOAD_*</code> URL
            in Vercel.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PosDesktopDownloadPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const model = useMemo(() => getDesktopDownloadPageModel(), [mounted]);
  const anyReady = model.cards.some((c) => c.url);
  const versionLabel = model.version ? `v${model.version.replace(/^v/i, '')}` : null;

  return (
    <AuthSplitLayout
      title="Bisonstechs POS"
      subtitle="Native desktop app for checkout, shifts, offline sales, and restaurant kitchen flows."
    >
      <div className="w-full max-w-lg mx-auto space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#014582]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="flex items-center gap-3">
          <Image src="/bisontechs.png" alt="Bisonstechs" width={40} height={40} className="rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Download POS desktop</h1>
            {versionLabel ? (
              <p className="text-sm text-gray-500 mt-0.5">Current release {versionLabel}</p>
            ) : (
              <p className="text-sm text-amber-700 mt-0.5">Version not configured — set NEXT_PUBLIC_POS_DESKTOP_VERSION</p>
            )}
          </div>
        </div>

        {!anyReady && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              No download links are configured. After you publish a GitHub Release, set{' '}
              <code className="text-xs bg-white/80 px-1 rounded">NEXT_PUBLIC_POS_DESKTOP_GITHUB_REPO</code> and{' '}
              <code className="text-xs bg-white/80 px-1 rounded">NEXT_PUBLIC_POS_DESKTOP_VERSION</code> in Vercel, or
              set per-platform <code className="text-xs bg-white/80 px-1 rounded">NEXT_PUBLIC_DESKTOP_DOWNLOAD_*</code>{' '}
              URLs.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {model.cards.map((card) => (
            <DownloadCard
              key={card.id}
              card={card}
              recommended={mounted && model.recommendedId === card.id}
            />
          ))}
        </div>

        <section className="rounded-2xl border border-gray-200 bg-slate-50 p-5 text-sm text-gray-700 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Monitor className="w-5 h-5 text-[#014582]" />
            Installation
          </div>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>
              <strong>macOS:</strong> Open the <code className="text-xs">.dmg</code>, drag Bisonstechs POS to
              Applications, then launch from Applications. If macOS blocks the app, right-click → Open once (unsigned
              builds may require this until signed/notarized).
            </li>
            <li>
              <strong>Windows:</strong> Run the <code className="text-xs">.exe</code> installer, choose install
              location if prompted, then start Bisonstechs POS from the desktop or Start menu.
            </li>
            <li>Sign in with your Bisonstechs account. POS data syncs with your cloud company; local SQLite supports offline selling.</li>
          </ul>
          {anyReady && (
            <p className="flex items-start gap-2 text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              Links point to external release files (GitHub Releases or your CDN) — installers are not bundled in this
              Vercel deployment.
            </p>
          )}
        </section>
      </div>
    </AuthSplitLayout>
  );
}
