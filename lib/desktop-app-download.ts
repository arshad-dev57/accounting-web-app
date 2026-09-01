/**
 * Resolve desktop POS installer URL for the current platform.
 * Set one or more in env:
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL  — fallback / any OS
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC  — macOS (.dmg / .zip)
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN  — Windows (.exe / .msi)
 */
export function getDesktopDownloadUrl(): string | null {
  const fallback = trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL);
  const mac = trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC);
  const win = trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN);

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
