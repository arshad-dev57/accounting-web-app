import { loadPdfReportSettingsLocal, DEFAULT_PDF_REPORT_SETTINGS } from './pdf-report-settings';
import { pkr } from './hr-payroll-slip-utils';

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
}: {
  title: string;
  subtitle?: string;
  filterSummary?: string;
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  rows: Record<string, any>[];
  summaryCards?: { label: string; value: string | number }[];
  includeSignature?: boolean;
}) {
  const localSettings = loadPdfReportSettingsLocal();
  const companyName = localSettings?.companyName || DEFAULT_PDF_REPORT_SETTINGS.companyName || 'Bisonstechs Enterprise';
  const companyAddress = localSettings?.companyAddress || DEFAULT_PDF_REPORT_SETTINGS.companyAddress || 'Head Office, Islamabad';

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const summaryHtml = summaryCards && summaryCards.length > 0
    ? `
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        ${summaryCards.map(c => `
          <div style="flex: 1; border: 1px solid #DDE4EE; padding: 12px; border-radius: 8px; background: #F8FAFC;">
            <div style="font-size: 10px; font-weight: 700; color: #7A8FA6; text-transform: uppercase;">${escapeHtml(c.label)}</div>
            <div style="font-size: 16px; font-weight: 800; color: #014582; margin-top: 4px;">${escapeHtml(String(c.value))}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const tableHeadHtml = columns.map(c => `<th style="text-align: ${c.align || 'left'};">${escapeHtml(c.label)}</th>`).join('');

  const tableBodyHtml = rows.length > 0
    ? rows.map(r => `
        <tr>
          ${columns.map(c => `<td style="text-align: ${c.align || 'left'};">${escapeHtml(String(r[c.key] ?? '—'))}</td>`).join('')}
        </tr>
      `).join('')
    : `<tr><td colspan="${columns.length}" style="text-align: center; padding: 24px; color: #7A8FA6;">No records found.</td></tr>`;

  const signatureHtml = includeSignature
    ? `
      <div style="margin-top: 40px; border-t: 1px border-dashed #DDE4EE; padding-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #7A8FA6;">
        <div style="width: 30%; text-align: center;">
          <div style="border-bottom: 1px solid #CBD5E1; height: 32px; margin-bottom: 6px;"></div>
          <strong>Prepared By</strong>
        </div>
        <div style="width: 30%; text-align: center;">
          <div style="border-bottom: 1px solid #CBD5E1; height: 32px; margin-bottom: 6px;"></div>
          <strong>Checked By</strong>
        </div>
        <div style="width: 30%; text-align: center;">
          <div style="border-bottom: 1px solid #CBD5E1; height: 32px; margin-bottom: 6px;"></div>
          <strong>Approved By</strong>
        </div>
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
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1A1A2E; margin: 0; padding: 32px; font-size: 11px; line-height: 1.4; }
    .header { margin-bottom: 24px; border-b: 2px solid #014582; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .company-title { font-size: 18px; font-weight: 800; color: #014582; }
    .report-title { font-size: 15px; font-weight: 700; margin-top: 4px; color: #1A1A2E; }
    .meta { font-size: 10px; color: #7A8FA6; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #DDE4EE; padding: 8px 10px; }
    th { background: #014582; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    tr:nth-child(even) td { background: #F8FAFC; }
    @media print {
      body { padding: 16px; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">${escapeHtml(companyName)}</div>
      <div class="meta">${escapeHtml(companyAddress)}</div>
      <div class="report-title">${escapeHtml(title)}</div>
      ${subtitle ? `<div class="meta">${escapeHtml(subtitle)}</div>` : ''}
    </div>
    <div style="text-align: right;" class="meta">
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
