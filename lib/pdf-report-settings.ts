// lib/pdf-report-settings.ts
// Mirrors Flutter PdfReportSettingsController local cache (prefsKey: pdf_report_settings)

export const PDF_REPORT_SETTINGS_KEY = 'pdf_report_settings';

export type PdfReportSettings = {
  id?: string;
  companyName: string;
  companyAddress: string;
  logo: string;
  signature: string;
  showLogo: boolean;
  showSignature: boolean;
  showCompanyName: boolean;
  showAddress: boolean;
  showPageNumbers: boolean;
  layout: 'classic' | 'modern' | 'minimal' | string;
  logoPosition: 'left' | 'center' | 'right' | string;
  headerSubtitle: string;
  footerText: string;
  accentColor: string;
  signatureLabel: string;
  updatedAt?: string;
};

export const DEFAULT_PDF_REPORT_SETTINGS: PdfReportSettings = {
  companyName: '',
  companyAddress: '',
  logo: '',
  signature: '',
  showLogo: true,
  showSignature: true,
  showCompanyName: true,
  showAddress: true,
  showPageNumbers: true,
  layout: 'classic',
  logoPosition: 'left',
  headerSubtitle: '',
  footerText: 'Confidential - For Internal Use Only',
  accentColor: '#014582',
  signatureLabel: 'Authorized Signature',
};

export function normalizePdfReportSettings(
  raw: Partial<PdfReportSettings> | Record<string, unknown> | null | undefined
): PdfReportSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PDF_REPORT_SETTINGS };
  }

  const asRecord = raw as Record<string, unknown>;
  const nested =
    asRecord.pdfReport && typeof asRecord.pdfReport === 'object'
      ? (asRecord.pdfReport as Record<string, unknown>)
      : {};

  const src = { ...asRecord, ...nested };

  const layouts = ['classic', 'modern', 'minimal'];
  const positions = ['left', 'center', 'right'];
  const layout = String(src.layout || 'classic');
  const logoPosition = String(src.logoPosition || 'left');
  const accent = String(src.accentColor || '#014582');

  return {
    id: src.id ? String(src.id) : undefined,
    companyName: String(src.companyName ?? ''),
    companyAddress: String(src.companyAddress ?? ''),
    logo: String(src.logo ?? ''),
    signature: String(src.signature ?? ''),
    showLogo: src.showLogo !== false,
    showSignature: src.showSignature !== false,
    showCompanyName: src.showCompanyName !== false,
    showAddress: src.showAddress !== false,
    showPageNumbers: src.showPageNumbers !== false,
    layout: layouts.includes(layout) ? layout : 'classic',
    logoPosition: positions.includes(logoPosition) ? logoPosition : 'left',
    headerSubtitle: String(src.headerSubtitle ?? ''),
    footerText:
      String(src.footerText || '').trim() ||
      DEFAULT_PDF_REPORT_SETTINGS.footerText,
    accentColor: /^#[0-9A-Fa-f]{6}$/.test(accent) ? accent : '#014582',
    signatureLabel:
      String(src.signatureLabel || '').trim() ||
      DEFAULT_PDF_REPORT_SETTINGS.signatureLabel,
    updatedAt: src.updatedAt ? String(src.updatedAt) : undefined,
  };
}

/** Same as Flutter persistFromLogin — cache after OTP/login. */
export function persistPdfReportSettingsFromLogin(raw: unknown): void {
  if (typeof window === 'undefined' || raw == null) return;
  try {
    if (typeof raw !== 'object') return;
    const map = raw as Record<string, unknown>;
    if (Object.keys(map).length === 0) return;

    const normalized = normalizePdfReportSettings(map);
    localStorage.setItem(
      PDF_REPORT_SETTINGS_KEY,
      JSON.stringify({
        ...normalized,
        updatedAt: normalized.updatedAt || new Date().toISOString(),
      })
    );
    console.log('✅ PDF report settings cached from login');
  } catch (e) {
    console.error('PDF settings login cache error:', e);
  }
}

export function loadPdfReportSettingsLocal(): PdfReportSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PDF_REPORT_SETTINGS_KEY);
    if (!raw) return null;
    return normalizePdfReportSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Suggest from user profile when PDF settings were never saved. */
export function suggestFromUserProfile(): Partial<PdfReportSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return {};
    const user = JSON.parse(userRaw);
    const bd = user?.businessDetails || {};
    return {
      companyName: user?.organizationName || '',
      companyAddress: user?.address || '',
      logo: bd?.logo || '',
      signature: bd?.signature || '',
    };
  } catch {
    return {};
  }
}

export function savePdfReportSettingsLocal(settings: PdfReportSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    PDF_REPORT_SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function clearPdfReportSettingsLocal(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PDF_REPORT_SETTINGS_KEY);
}
