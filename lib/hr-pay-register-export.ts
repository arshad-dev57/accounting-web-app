import { loadPdfReportSettingsLocal, DEFAULT_PDF_REPORT_SETTINGS } from './pdf-report-settings';
import {
  pkr,
  slipParts,
  payrollStatusLabel,
  paymentStatusLabel,
  type PayrollSlipRow,
  type PayRegisterTotals,
} from './hr-payroll-slip-utils';

export type PayRegisterExportMeta = {
  period: string;
  periodLabel: string;
  payDate?: string;
  stage?: string;
};

function companyMeta() {
  const local = loadPdfReportSettingsLocal();
  return {
    name: local?.companyName || DEFAULT_PDF_REPORT_SETTINGS.companyName || 'Company',
    address: local?.companyAddress || DEFAULT_PDF_REPORT_SETTINGS.companyAddress || '',
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function csvEscape(v: unknown) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const EXPORT_COLUMNS = [
  { key: 'employeeCode', label: 'Employee ID' },
  { key: 'employee', label: 'Employee Name' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'office', label: 'Branch' },
  { key: 'basic', label: 'Basic Salary' },
  { key: 'house', label: 'House Rent' },
  { key: 'transport', label: 'Transport' },
  { key: 'medical', label: 'Medical' },
  { key: 'otherAllowances', label: 'Other Allowances' },
  { key: 'overtime', label: 'Overtime' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'commission', label: 'Commission' },
  { key: 'gross', label: 'Gross Salary' },
  { key: 'loan', label: 'Loans / Advances' },
  { key: 'otherDeductions', label: 'Other Deductions' },
  { key: 'tax', label: 'Tax' },
  { key: 'totalDeductions', label: 'Total Deductions' },
  { key: 'net', label: 'Net Salary' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'payrollStatus', label: 'Payroll Status' },
] as const;

function rowValues(row: PayrollSlipRow) {
  const p = slipParts(row);
  return {
    employeeCode: row.employeeCode,
    employee: row.employee,
    department: row.department || '—',
    designation: row.designation || '—',
    office: row.office || '—',
    basic: p.basic,
    house: p.houseAllowance,
    transport: p.transportAllowance,
    medical: p.medicalAllowance,
    otherAllowances: p.otherAllowances,
    overtime: p.overtime,
    bonus: p.bonus,
    commission: p.commission,
    gross: p.gross,
    loan: p.loan,
    otherDeductions: p.attendanceCut + p.otherDeductions + p.eobi + p.pf,
    tax: p.incomeTax,
    totalDeductions: p.totalDeductions,
    net: p.net,
    paymentStatus: paymentStatusLabel(row.status),
    payrollStatus: payrollStatusLabel(row.status, row),
  };
}

export function downloadPayRegisterCsv(
  rows: PayrollSlipRow[],
  meta: PayRegisterExportMeta,
  totals: PayRegisterTotals
) {
  const header = EXPORT_COLUMNS.map((c) => c.label);
  const lines = rows.map((row) => {
    const v = rowValues(row);
    return EXPORT_COLUMNS.map((c) => csvEscape(v[c.key as keyof typeof v])).join(',');
  });
  const totalLine = [
    'TOTALS',
    `${totals.count} employees`,
    '',
    '',
    '',
    totals.basic,
    '',
    '',
    '',
    totals.allowances,
    totals.overtime,
    totals.bonus,
    totals.commission,
    totals.gross,
    '',
    '',
    totals.tax,
    totals.deductions,
    totals.net,
    '',
    '',
  ].map(csvEscape).join(',');
  const blob = new Blob(
    [[`Pay Register — ${meta.periodLabel}`, header.join(','), ...lines, totalLine].join('\n')],
    { type: 'text/csv;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pay-register-${meta.period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildRegisterHtml(rows: PayrollSlipRow[], meta: PayRegisterExportMeta, totals: PayRegisterTotals) {
  const co = companyMeta();
  const head = EXPORT_COLUMNS.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = rows
    .map((row) => {
      const v = rowValues(row);
      const cells = EXPORT_COLUMNS.map((c) => {
        const val = v[c.key as keyof typeof v];
        const display = typeof val === 'number' ? pkr(val) : String(val ?? '—');
        return `<td>${escapeHtml(display)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const totalCells = `
    <td colspan="5"><strong>Period totals · ${totals.count} employees</strong></td>
    <td><strong>${pkr(totals.basic)}</strong></td>
    <td colspan="3"></td>
    <td><strong>${pkr(totals.allowances)}</strong></td>
    <td><strong>${pkr(totals.overtime)}</strong></td>
    <td><strong>${pkr(totals.bonus)}</strong></td>
    <td><strong>${pkr(totals.commission)}</strong></td>
    <td><strong>${pkr(totals.gross)}</strong></td>
    <td colspan="2"></td>
    <td><strong>${pkr(totals.tax)}</strong></td>
    <td><strong>${pkr(totals.deductions)}</strong></td>
    <td><strong>${pkr(totals.net)}</strong></td>
    <td colspan="2"></td>
  `;

  return `<!doctype html><html><head><meta charset="utf-8" />
  <title>Pay Register · ${escapeHtml(meta.periodLabel)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1A1A2E;margin:0;padding:24px;font-size:11px}
    .header{margin-bottom:16px}
    .company{font-size:16px;font-weight:800;color:#014582}
    .title{font-size:14px;font-weight:700;margin-top:4px}
    .meta{color:#7A8FA6;margin-top:6px;line-height:1.5}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #DDE4EE;padding:6px 8px;text-align:left;white-space:nowrap}
    th{background:#014582;color:#fff;font-size:9px;text-transform:uppercase;position:sticky;top:0}
    tr:nth-child(even) td{background:#F8FAFC}
    tfoot td{background:#EEF4FA;font-weight:700}
    @media print{body{padding:12px}@page{size:A4 landscape;margin:10mm}}
  </style></head><body>
  <div class="header">
    <div class="company">${escapeHtml(co.name)}</div>
    ${co.address ? `<div class="meta">${escapeHtml(co.address)}</div>` : ''}
    <div class="title">Pay Register</div>
    <div class="meta">
      Period: <strong>${escapeHtml(meta.periodLabel)}</strong>
      ${meta.payDate ? ` · Pay date: ${escapeHtml(meta.payDate)}` : ''}
      ${meta.stage ? ` · Stage: ${escapeHtml(meta.stage)}` : ''}
      · ${rows.length} employee(s)
    </div>
  </div>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body || `<tr><td colspan="${EXPORT_COLUMNS.length}">No records</td></tr>`}</tbody>
    <tfoot><tr>${totalCells}</tr></tfoot>
  </table>
  </body></html>`;
}

export function printPayRegister(rows: PayrollSlipRow[], meta: PayRegisterExportMeta, totals: PayRegisterTotals) {
  const html = buildRegisterHtml(rows, meta, totals);
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
  if (!win) throw new Error('Pop-up blocked. Allow pop-ups to print the pay register.');
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export async function downloadPayRegisterPdf(
  rows: PayrollSlipRow[],
  meta: PayRegisterExportMeta,
  totals: PayRegisterTotals
) {
  const { createBrandedReport } = await import('./pdf-branding');
  const autoTable = (await import('jspdf-autotable')).default;
  const { doc, margin, startY, accentHex, finalize } = await createBrandedReport({
    reportTitle: 'Pay Register',
    orientation: 'landscape',
  });

  let y = startY;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Period: ${meta.periodLabel}${meta.payDate ? ` · Pay date: ${meta.payDate}` : ''}`, margin, y);
  y += 5;
  if (meta.stage) {
    doc.text(`Payroll stage: ${meta.stage}`, margin, y);
    y += 5;
  }
  doc.text(`${rows.length} employee(s)`, margin, y);
  y += 8;

  const head = EXPORT_COLUMNS.map((c) => c.label);
  const body = rows.map((row) => {
    const v = rowValues(row);
    return EXPORT_COLUMNS.map((c) => {
      const val = v[c.key as keyof typeof v];
      return typeof val === 'number' ? pkr(val) : String(val ?? '—');
    });
  });

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    foot: [[
      'TOTALS',
      `${totals.count} employees`,
      '',
      '',
      '',
      pkr(totals.basic),
      '',
      '',
      '',
      pkr(totals.allowances),
      pkr(totals.overtime),
      pkr(totals.bonus),
      pkr(totals.commission),
      pkr(totals.gross),
      '',
      '',
      pkr(totals.tax),
      pkr(totals.deductions),
      pkr(totals.net),
      '',
      '',
    ]],
    theme: 'striped',
    headStyles: { fillColor: accentHex, textColor: '#ffffff', fontSize: 6 },
    footStyles: { fillColor: [238, 244, 250], textColor: '#1A1A2E', fontSize: 6, fontStyle: 'bold' },
    styles: { fontSize: 6, cellPadding: 1.5 },
    margin: { left: margin, right: margin },
  });

  finalize({ filename: `pay-register-${meta.period}.pdf` });
}
