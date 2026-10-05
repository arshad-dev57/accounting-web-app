/**
 * Resolve desktop POS installer URL for the current platform.
 *
 * Prefer NEXT_PUBLIC_* so the client bundle can see the URL (browser download button).
 * Fallbacks without NEXT_PUBLIC_ still work if next.config env-maps them.
 *
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL  — fallback / any OS
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC  — macOS (.dmg / .zip / local API)
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN  — Windows (.exe / .msi)
 *
 * Local/self-hosted: point MAC/WIN at `/api/download/desktop?platform=mac|win`
 * and set DESKTOP_APP_MAC_PATH / DESKTOP_APP_WIN_PATH to the installer file.
 */
export function getDesktopDownloadUrl(): string | null {
  const fallback =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_URL);
  const mac =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_MAC);
  const win =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_WIN);

  if (typeof window === 'undefined') {
    return fallback || mac || win || null;
  }

  const ua = navigator.userAgent || '';
  if (/Win/i.test(ua) && win) return win;
  if (/Mac|iPhone|iPad/i.test(ua) && mac) return mac;
  return fallback || mac || win || null;
}

export function hasDesktopDownload(): boolean {
  return !!getDesktopDownloadUrl();
}

function trimEnv(v?: string): string | null {
  const s = String(v || '').trim();
  return s || null;
}
