// lib/pdf-branding.ts
// Mirrors Flutter PdfBrandingBundle for jsPDF exports

import type jsPDF from 'jspdf';
import {
  DEFAULT_PDF_REPORT_SETTINGS,
  loadPdfReportSettingsLocal,
  suggestFromUserProfile,
  type PdfReportSettings,
} from './pdf-report-settings';

export type PdfBranding = PdfReportSettings & {
  logoDataUrl?: string;
  signatureDataUrl?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return [1, 69, 130];
  const n = parseInt(cleaned, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function resolveImageUrl(path: string): string {
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('/')
  ) {
    return path;
  }
  const apiBase = process.env.API_URL || '';
  if (apiBase) {
    return `${apiBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  return path;
}

async function fetchImageAsDataUrl(path: string): Promise<string | undefined> {
  if (!path || typeof window === 'undefined') return undefined;
  try {
    if (path.startsWith('data:')) return path;
    const url = resolveImageUrl(path);
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || '') || undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function loadPdfBranding(): Promise<PdfBranding> {
  const local = loadPdfReportSettingsLocal();
  const suggested = suggestFromUserProfile();

  const settings: PdfReportSettings = {
    ...DEFAULT_PDF_REPORT_SETTINGS,
    ...suggested,
    ...(local || {}),
    companyName:
      local?.companyName ||
      suggested.companyName ||
      DEFAULT_PDF_REPORT_SETTINGS.companyName,
    companyAddress:
      local?.companyAddress ||
      suggested.companyAddress ||
      DEFAULT_PDF_REPORT_SETTINGS.companyAddress,
    logo: local?.logo || suggested.logo || '',
    signature: local?.signature || suggested.signature || '',
  };

  const [logoDataUrl, signatureDataUrl] = await Promise.all([
    settings.showLogo && settings.logo
      ? fetchImageAsDataUrl(settings.logo)
      : Promise.resolve(undefined),
    settings.showSignature && settings.signature
      ? fetchImageAsDataUrl(settings.signature)
      : Promise.resolve(undefined),
  ]);

  return {
    ...settings,
    logoDataUrl,
    signatureDataUrl,
  };
}

export function getBrandingAccentRgb(branding: PdfBranding): [number, number, number] {
  return hexToRgb(branding.accentColor || '#014582');
}

export function getDisplayCompanyName(branding: PdfBranding): string {
  return branding.companyName?.trim() || 'BisonsTechs';
}

/**
 * Draws Flutter-style header. Returns Y position after header.
 */
export function drawBrandedHeader(
  doc: jsPDF,
  branding: PdfBranding,
  reportTitle: string,
  margin = 14
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const accent = getBrandingAccentRgb(branding);
  const generated = `Generated: ${new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  let y = margin;
  const contentLeft = margin;
  const contentRight = pageWidth - margin;

  const drawLogo = (x: number, yPos: number, align: 'left' | 'center' | 'right' = 'left') => {
    if (!branding.showLogo || !branding.logoDataUrl) return 0;
    try {
      const w = 18;
      const h = 18;
      let drawX = x;
      if (align === 'center') drawX = x - w / 2;
      if (align === 'right') drawX = x - w;
      doc.addImage(branding.logoDataUrl, 'PNG', drawX, yPos, w, h);
      return h;
    } catch {
      return 0;
    }
  };

  const companyLines: string[] = [];
  if (branding.showCompanyName) companyLines.push(getDisplayCompanyName(branding));
  if (branding.showAddress && branding.companyAddress.trim()) {
    companyLines.push(...doc.splitTextToSize(branding.companyAddress.trim(), 80));
  }
  if (branding.headerSubtitle.trim()) companyLines.push(branding.headerSubtitle.trim());

  const drawCompanyBlock = (
    x: number,
    yPos: number,
    align: 'left' | 'center' | 'right'
  ) => {
    let cy = yPos;
    doc.setTextColor(accent[0], accent[1], accent[2]);
    companyLines.forEach((line, idx) => {
      if (idx === 0 && branding.showCompanyName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100);
      }
      doc.text(line, x, cy, { align });
      cy += idx === 0 ? 5 : 3.5;
      doc.setTextColor(accent[0], accent[1], accent[2]);
    });
    return cy - yPos;
  };

  const drawTitleBlock = (x: number, yPos: number, align: 'left' | 'right' | 'center') => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(reportTitle, x, yPos, { align });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(generated, x, yPos + 5, { align });
    return 10;
  };

  let headerBottom = y;

  if (branding.layout === 'modern') {
    // Soft accent band
    doc.setFillColor(accent[0], accent[1], accent[2]);
    // light band via white overlay approximation
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(margin - 2, y - 2, pageWidth - margin * 2 + 4, 36, 3, 3, 'F');
  }

  if (branding.logoPosition === 'center') {
    const logoH = drawLogo(pageWidth / 2, y, 'center');
    let cy = y + (logoH ? logoH + 3 : 0);
    const companyH = drawCompanyBlock(pageWidth / 2, cy + 4, 'center');
    cy += companyH + 6;
    const titleH = drawTitleBlock(pageWidth / 2, cy + 4, 'center');
    headerBottom = cy + titleH + 4;
  } else if (branding.logoPosition === 'right') {
    const titleH = drawTitleBlock(contentLeft, y + 5, 'left');
    const logoH = drawLogo(contentRight, y, 'right');
    const companyX = branding.showLogo && branding.logoDataUrl ? contentRight - 22 : contentRight;
    const companyH = drawCompanyBlock(companyX, y + 5, 'right');
    headerBottom = y + Math.max(titleH, logoH, companyH) + 8;
  } else {
    // left (classic default)
    let leftX = contentLeft;
    const logoH = drawLogo(leftX, y, 'left');
    if (logoH) leftX += 22;
    const companyH = drawCompanyBlock(leftX, y + 5, 'left');
    const titleH = drawTitleBlock(contentRight, y + 5, 'right');
    headerBottom = y + Math.max(logoH, companyH, titleH) + 8;
  }

  if (branding.layout !== 'minimal') {
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(branding.layout === 'modern' ? 0.8 : 1.2);
    doc.line(margin, headerBottom, pageWidth - margin, headerBottom);
    headerBottom += 6;
  } else {
    headerBottom += 2;
  }

  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  return headerBottom;
}

export function drawBrandedSignature(
  doc: jsPDF,
  branding: PdfBranding,
  y: number,
  margin = 14
): number {
  if (!branding.showSignature) return y;

  const pageWidth = doc.internal.pageSize.getWidth();
  const x = pageWidth - margin;
  let cy = y + 10;

  if (branding.signatureDataUrl) {
    try {
      doc.addImage(branding.signatureDataUrl, 'PNG', x - 40, cy, 40, 14);
      cy += 16;
    } catch {
      doc.setDrawColor(180);
      doc.line(x - 40, cy + 10, x, cy + 10);
      cy += 14;
    }
  } else {
    doc.setDrawColor(180);
    doc.line(x - 40, cy + 8, x, cy + 8);
    cy += 12;
  }

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(branding.signatureLabel || 'Authorized Signature', x, cy, {
    align: 'right',
  });
  doc.setTextColor(0);
  return cy + 4;
}

/** Apply footer to every page (Flutter buildFooter). */
export function applyBrandedFooters(doc: jsPDF, branding: PdfBranding, margin = 14): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const y = pageHeight - 10;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.setFont('helvetica', 'normal');
    doc.text(branding.footerText || DEFAULT_PDF_REPORT_SETTINGS.footerText, margin, y, {
      maxWidth: pageWidth - margin * 2 - 40,
    });

    if (branding.showPageNumbers) {
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, y, { align: 'right' });
    }
  }
  doc.setTextColor(0);
}

export type BrandedReportContext = {
  doc: jsPDF;
  branding: PdfBranding;
  accentRgb: [number, number, number];
  accentHex: string;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  startY: number;
  finalize: (opts?: { signatureY?: number; filename?: string }) => void;
};

/** Create a branded jsPDF report shell (header already drawn). */
export async function createBrandedReport(options: {
  reportTitle: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}): Promise<BrandedReportContext> {
  const { default: JsPDF } = await import('jspdf');
  const branding = await loadPdfBranding();
  const margin = options.margin ?? 14;
  const doc = new JsPDF(options.orientation || 'portrait', 'mm', 'a4');
  const startY = drawBrandedHeader(doc, branding, options.reportTitle, margin);
  const accentRgb = getBrandingAccentRgb(branding);

  return {
    doc,
    branding,
    accentRgb,
    accentHex: branding.accentColor || '#014582',
    margin,
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    startY,
    finalize: ({ signatureY, filename } = {}) => {
      const y =
        signatureY ??
        Math.max(
          (doc as any).lastAutoTable?.finalY
            ? (doc as any).lastAutoTable.finalY + 8
            : startY,
          startY
        );
      drawBrandedSignature(doc, branding, y, margin);
      applyBrandedFooters(doc, branding, margin);
      if (filename) doc.save(filename);
    },
  };
}

/** Merge branding into document company fields for invoice-style PDFs. */
export async function applyBrandingToCompanyInfo(company?: {
  name?: string;
  address?: string;
  logo?: string;
  phone?: string;
  email?: string;
}) {
  const branding = await loadPdfBranding();
  return {
    branding,
    company: {
      name: branding.showCompanyName
        ? getDisplayCompanyName(branding)
        : company?.name || getDisplayCompanyName(branding),
      address: branding.showAddress
        ? branding.companyAddress || company?.address
        : company?.address,
      logo: branding.showLogo
        ? branding.logoDataUrl || branding.logo || company?.logo
        : undefined,
      phone: company?.phone,
      email: company?.email,
      headerSubtitle: branding.headerSubtitle,
      accentColor: branding.accentColor,
    },
  };
}
