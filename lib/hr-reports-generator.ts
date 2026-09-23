import { pkr } from './hr-payroll-slip-utils';
import { HRPrintSettingItem, HRSignatoryItem } from './hr-print-service';

export interface HRReportFilter {
  dateFrom?: string;
  dateTo?: string;
  department?: string;
  branch?: string;
  status?: string;
}

export function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateCorporateReportPrintHtml({
  title,
  subtitle,
  filterSummary,
  columns,
  rows,
  summaryCards,
  includeSignature = true,
  hrSettings,
  signatories = [],
}: {
  title: string;
  subtitle?: string;
  filterSummary?: string;
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  rows: Record<string, any>[];
  summaryCards?: { label: string; value: string | number }[];
  includeSignature?: boolean;
  hrSettings?: HRPrintSettingItem | null;
  signatories?: HRSignatoryItem[];
}) {
  const companyName = hrSettings?.companyName || 'Bisonstechs ERP';
  const companyAddress = hrSettings?.companyAddress || '';
  const primaryLogo = hrSettings?.showLogo && hrSettings?.primaryLogo ? hrSettings.primaryLogo : '';
  const secondaryLogo = hrSettings?.showLogo && hrSettings?.secondaryLogo ? hrSettings.secondaryLogo : '';
  const officialStamp = hrSettings?.showStamp && hrSettings?.officialStamp ? hrSettings.officialStamp : '';
  const accentColor = hrSettings?.primaryColor || '#014582';
  const fontFamily = hrSettings?.fontFamily || 'Segoe UI, Arial, sans-serif';

  const sigList = signatories.length > 0 ? signatories : hrSettings?.signatories || [];

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const summaryHtml = summaryCards && summaryCards.length > 0
    ? `
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        ${summaryCards.map(c => `
          <div style="flex: 1; border: 1px solid #DDE4EE; padding: 12px; border-radius: 8px; background: #F8FAFC;">
            <div style="font-size: 10px; font-weight: 700; color: #7A8FA6; text-transform: uppercase;">${escapeHtml(c.label)}</div>
            <div style="font-size: 16px; font-weight: 800; color: ${accentColor}; margin-top: 4px;">${escapeHtml(String(c.value))}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const tableHeadHtml = columns.map(c => `<th style="text-align: ${c.align || 'left'}; background: ${accentColor};">${escapeHtml(c.label)}</th>`).join('');

  const tableBodyHtml = rows.length > 0
    ? rows.map(r => `
        <tr>
          ${columns.map(c => `<td style="text-align: ${c.align || 'left'};">${escapeHtml(String(r[c.key] ?? '—'))}</td>`).join('')}
        </tr>
      `).join('')
    : `<tr><td colspan="${columns.length}" style="text-align: center; padding: 24px; color: #7A8FA6;">No records found.</td></tr>`;

  const signatureHtml = includeSignature && sigList.length > 0
    ? `
      <div style="margin-top: 40px; border-top: 1px border-dashed #DDE4EE; padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #1A1A2E;">
        ${sigList.map(sig => `
          <div style="width: 22%; text-align: ${sig.alignment || 'left'}; space-y: 4px;">
            <div style="height: 48px; display: flex; align-items: flex-end; justify-content: ${sig.alignment === 'right' ? 'flex-end' : sig.alignment === 'center' ? 'center' : 'flex-start'};">
              ${sig.signatureUrl ? `<img src="${sig.signatureUrl}" style="max-height: 40px; max-width: 120px; object-fit: contain;" />` : '<div style="border-bottom: 1px solid #CBD5E1; width: 100%; height: 32px;"></div>'}
              ${sig.stampUrl ? `<img src="${sig.stampUrl}" style="height: 28px; margin-left: 4px;" />` : ''}
            </div>
            <div style="border-top: 1px solid #CBD5E1; padding-top: 4px; font-weight: 800;">${escapeHtml(sig.label)}</div>
            ${sig.name ? `<div style="font-size: 10px; color: #475569;">${escapeHtml(sig.name)}</div>` : ''}
            ${sig.designation ? `<div style="font-size: 9px; color: #64748B;">${escapeHtml(sig.designation)}</div>` : ''}
          </div>
        `).join('')}

        ${officialStamp ? `
          <div style="text-align: right;">
            <img src="${officialStamp}" style="max-height: 60px; max-width: 90px; object-fit: contain;" />
            <div style="font-size: 9px; color: #94A3B8; margin-top: 2px;">Official Seal</div>
          </div>
        ` : ''}
      </div>
    `
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} · ${escapeHtml(companyName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ${fontFamily}; color: #1A1A2E; margin: 0; padding: 24px; font-size: 11px; line-height: 1.4; }
    .header { margin-bottom: 24px; border-bottom: 2px solid ${accentColor}; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .company-title { font-size: 18px; font-weight: 800; color: ${accentColor}; }
    .report-title { font-size: 15px; font-weight: 700; margin-top: 4px; color: #1A1A2E; }
    .meta { font-size: 10px; color: #7A8FA6; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #DDE4EE; padding: 8px 10px; }
    th { color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    tr:nth-child(even) td { background: #F8FAFC; }
    @media print {
      body { padding: 12px; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; align-items: center; gap: 12px;">
      ${primaryLogo ? `<img src="${primaryLogo}" style="height: 48px; max-width: 140px; object-fit: contain;" />` : ''}
      <div>
        <div class="company-title">${escapeHtml(companyName)}</div>
        <div class="meta">${escapeHtml(companyAddress)}</div>
        <div class="report-title">${escapeHtml(title)}</div>
        ${subtitle ? `<div class="meta">${escapeHtml(subtitle)}</div>` : ''}
      </div>
    </div>
    <div style="text-align: right;" class="meta">
      ${secondaryLogo ? `<img src="${secondaryLogo}" style="height: 32px; margin-bottom: 4px;" /><br/>` : ''}
      <div>Generated Date: <strong>${dateStr}</strong></div>
      ${filterSummary ? `<div>Scope: <strong>${escapeHtml(filterSummary)}</strong></div>` : ''}
    </div>
  </div>

  ${summaryHtml}

  <table>
    <thead><tr>${tableHeadHtml}</tr></thead>
    <tbody>${tableBodyHtml}</tbody>
  </table>

  ${signatureHtml}

  ${hrSettings?.showFooter ? `
    <div style="margin-top: 24px; padding-top: 8px; border-top: 1px solid #F1F5F9; font-size: 9px; color: #94A3B8; display: flex; justify-content: space-between;">
      <div>${escapeHtml(hrSettings.footerText || 'Confidential HR Document')}</div>
      ${hrSettings.showPageNumbers ? '<div>Page 1 of 1</div>' : ''}
    </div>
  ` : ''}
</body>
</html>`;
}

export function openReportPrintPreview(params: Parameters<typeof generateCorporateReportPrintHtml>[0]) {
  const html = generateCorporateReportPrintHtml(params);
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
  if (!win) throw new Error('Pop-up blocked. Please allow pop-ups to view report print preview.');
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
