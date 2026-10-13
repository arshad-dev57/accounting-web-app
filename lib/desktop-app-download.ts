/**
 * Desktop POS installer URLs for web download buttons.
 *
 * Recommended production setup (installers on GitHub Releases, not in git/Vercel):
 *   NEXT_PUBLIC_POS_DESKTOP_VERSION=1.0.0
 *   NEXT_PUBLIC_POS_DESKTOP_GITHUB_REPO=owner/accounting-desktop
 *
 * Optional overrides (full URL each):
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL  — fallback / any OS
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC  — Apple Silicon .dmg
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC_INTEL — Intel Mac .dmg
 *   NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN  — Windows .exe
 *
 * Legacy server paths (self-hosted file on disk):
 *   DESKTOP_APP_MAC_PATH / DESKTOP_APP_WIN_PATH with `/api/download/desktop?platform=...`
 */

const POS_PRODUCT_FILENAME = 'Bisonstechs POS';

export type DesktopOsHint = 'mac' | 'macIntel' | 'win' | 'other';

export type DesktopDownloadCard = {
  id: 'mac' | 'macIntel' | 'win';
  title: string;
  subtitle: string;
  fileLabel: string;
  url: string | null;
};

export type DesktopDownloadPageModel = {
  version: string | null;
  cards: DesktopDownloadCard[];
  recommendedId: DesktopDownloadCard['id'] | null;
};

function trimEnv(v?: string): string | null {
  const s = String(v || '').trim();
  return s || null;
}

export function getPosDesktopVersion(): string | null {
  return (
    trimEnv(process.env.NEXT_PUBLIC_POS_DESKTOP_VERSION) ||
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_APP_VERSION)
  );
}

function releaseTag(version: string): string {
  const v = version.replace(/^v/i, '');
  return `v${v}`;
}

function githubReleaseAssetUrl(repo: string, tag: string, filename: string): string {
  const base = repo.replace(/^\/+|\/+$/g, '');
  return `https://github.com/${base}/releases/download/${tag}/${encodeURIComponent(filename)}`;
}

function artifactFilename(version: string, os: string, arch: string, ext: string): string {
  const v = version.replace(/^v/i, '');
  return `${POS_PRODUCT_FILENAME}-${v}-${os}-${arch}.${ext}`;
}

function resolveGithubUrls(): {
  mac: string | null;
  macIntel: string | null;
  win: string | null;
} {
  const repo = trimEnv(process.env.NEXT_PUBLIC_POS_DESKTOP_GITHUB_REPO);
  const version = getPosDesktopVersion();
  if (!repo || !version) {
    return { mac: null, macIntel: null, win: null };
  }
  const tag = releaseTag(version);
  const v = version.replace(/^v/i, '');
  return {
    mac: githubReleaseAssetUrl(repo, tag, artifactFilename(v, 'mac', 'arm64', 'dmg')),
    macIntel: githubReleaseAssetUrl(repo, tag, artifactFilename(v, 'mac', 'x64', 'dmg')),
    win: githubReleaseAssetUrl(repo, tag, artifactFilename(v, 'win', 'x64', 'exe')),
  };
}

export function detectDesktopOsHint(): DesktopOsHint {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/Win/i.test(ua)) return 'win';
  if (/Mac/i.test(ua)) return 'mac';
  return 'other';
}

/** @deprecated Prefer getDesktopDownloadPageModel() on the download page. */
export function getDesktopDownloadUrl(): string | null {
  const model = getDesktopDownloadPageModel();
  const hint = typeof window !== 'undefined' ? detectDesktopOsHint() : 'other';
  const pick =
    hint === 'win'
      ? model.cards.find((c) => c.id === 'win')
      : hint === 'mac'
        ? model.cards.find((c) => c.id === 'mac') || model.cards.find((c) => c.id === 'macIntel')
        : null;
  if (pick?.url) return pick.url;
  const fallback =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_URL);
  return fallback || model.cards.find((c) => c.url)?.url || null;
}

export function hasDesktopDownload(): boolean {
  const model = getDesktopDownloadPageModel();
  return model.cards.some((c) => Boolean(c.url));
}

export function getDesktopDownloadPageModel(): DesktopDownloadPageModel {
  const version = getPosDesktopVersion();
  const gh = resolveGithubUrls();

  const mac =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_MAC) ||
    gh.mac;
  const macIntel =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC_INTEL) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_MAC_INTEL) ||
    gh.macIntel;
  const win =
    trimEnv(process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN) ||
    trimEnv(process.env.NEXT_DESKTOP_DOWNLOAD_WIN) ||
    gh.win;

  const cards: DesktopDownloadCard[] = [
    {
      id: 'mac',
      title: 'macOS (Apple Silicon)',
      subtitle: 'M1, M2, M3, and newer Macs',
      fileLabel: version ? `Bisonstechs POS ${version} — .dmg (arm64)` : 'macOS .dmg (arm64)',
      url: mac,
    },
    {
      id: 'macIntel',
      title: 'macOS (Intel)',
      subtitle: 'Older Intel-based Macs',
      fileLabel: version ? `Bisonstechs POS ${version} — .dmg (x64)` : 'macOS .dmg (x64)',
      url: macIntel,
    },
    {
      id: 'win',
      title: 'Windows',
      subtitle: 'Windows 10 / 11 (64-bit)',
      fileLabel: version ? `Bisonstechs POS ${version} — .exe (x64)` : 'Windows .exe (x64)',
      url: win,
    },
  ];

  const hint = detectDesktopOsHint();
  let recommendedId: DesktopDownloadCard['id'] | null = null;
  if (hint === 'win' && win) recommendedId = 'win';
  if (hint === 'mac' && mac) recommendedId = 'mac';
  if (hint === 'mac' && !mac && macIntel) recommendedId = 'macIntel';

  return { version, cards, recommendedId };
}
