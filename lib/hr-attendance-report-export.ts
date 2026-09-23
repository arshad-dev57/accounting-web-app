import { loadPdfReportSettingsLocal, DEFAULT_PDF_REPORT_SETTINGS } from './pdf-report-settings';

export type AttendanceReportRow = {
  date: string;
  dayName: string;
  employeeId: string;
  employeeCode: string;
  employee: string;
  department: string;
  designation: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number;
  source: string | null;
};

export type AttendanceReportData = {
  from: string;
  to: string;
  dayCount: number;
  employeeCount: number;
  employee: { id: string; employeeCode: string; name: string; department: string } | null;
  summary: {
    totalDays: number;
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    onLeave: number;
    holiday: number;
    weekend: number;
    missingCheckout: number;
    totalWorkingMinutes: number;
    avgWorkingMinutes: number;
  };
  rows: AttendanceReportRow[];
};

export function fmtTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function fmtHours(minutes?: number) {
  const m = Number(minutes || 0);
  if (m <= 0) return '—';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h}h ${String(rest).padStart(2, '0')}m`;
}

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

function buildTableHead(singleEmployee: boolean) {
  if (singleEmployee) {
    return ['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Worked', 'Source'];
  }
  return ['Date', 'Code', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Worked'];
}

function buildTableBody(rows: AttendanceReportRow[], singleEmployee: boolean) {
  if (singleEmployee) {
    return rows.map((r) => [
      r.date,
      r.dayName,
      r.status,
      fmtTime(r.checkIn),
      fmtTime(r.checkOut),
      fmtHours(r.workingMinutes),
      r.source || '—',
    ]);
  }
  return rows.map((r) => [
    r.date,
    r.employeeCode,
    r.employee,
    r.department || '—',
    r.status,
    fmtTime(r.checkIn),
    fmtTime(r.checkOut),
    fmtHours(r.workingMinutes),
  ]);
}

export function buildAttendanceReportHtml(
  report: AttendanceReportData,
  rows: AttendanceReportRow[],
  singleEmployee: boolean
) {
  const co = companyMeta();
  const s = report.summary;
  const generatedAt = new Date().toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const scope = report.employee
    ? `${report.employee.name} (${report.employee.employeeCode}) · ${report.employee.department || '—'}`
    : `All employees (${report.employeeCount})`;

  const head = buildTableHead(singleEmployee);
  const bodyRows = buildTableBody(rows, singleEmployee);

  const tableHead = head.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const tableBody = bodyRows
    .map(
      (cells) =>
        `<tr>${cells
          .map((c, i) => {
            const align = i >= (singleEmployee ? 5 : 6) ? 'right' : 'left';
            return `<td style="text-align:${align}">${escapeHtml(String(c))}</td>`;
          })
          .join('')}</tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Attendance Report ${escapeHtml(report.from)} – ${escapeHtml(report.to)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1a1a2e;
      margin: 0;
      padding: 24px 28px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 3px solid #014582;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .company { font-size: 18px; font-weight: 800; color: #014582; }
    .address { font-size: 10px; color: #64748b; margin-top: 4px; }
    .title { font-size: 15px; font-weight: 700; margin-top: 12px; }
    .meta { font-size: 10px; color: #475569; margin-top: 6px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin: 16px 0 20px;
    }
    .stat {
      border: 1px solid #dde4ee;
      border-radius: 8px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .stat label { display: block; font-size: 9px; font-weight: 700; color: #7a8fa6; text-transform: uppercase; }
    .stat span { font-size: 16px; font-weight: 800; color: #014582; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    thead th {
      background: #014582;
      color: #fff;
      padding: 8px 6px;
      text-align: left;
      font-weight: 700;
    }
    tbody td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #dde4ee;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 12mm 14mm; }
      @page { size: A4 ${singleEmployee ? 'portrait' : 'landscape'}; margin: 12mm; }
      .no-print { display: none !important; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">${escapeHtml(co.name)}</div>
    ${co.address ? `<div class="address">${escapeHtml(co.address)}</div>` : ''}
    <div class="title">Employee Attendance Report</div>
    <div class="meta">
      Period: <strong>${escapeHtml(report.from)}</strong> to <strong>${escapeHtml(report.to)}</strong>
      · ${report.dayCount} day(s)<br />
      Scope: ${escapeHtml(scope)}<br />
      Generated: ${escapeHtml(generatedAt)}
    </div>
  </div>

  <div class="summary">
    <div class="stat"><label>Present</label><span>${s.present}</span></div>
    <div class="stat"><label>Late</label><span>${s.late}</span></div>
    <div class="stat"><label>Absent</label><span>${s.absent}</span></div>
    <div class="stat"><label>On leave</label><span>${s.onLeave}</span></div>
    <div class="stat"><label>Half day</label><span>${s.halfDay}</span></div>
    <div class="stat"><label>Holiday / Weekend</label><span>${s.holiday + s.weekend}</span></div>
    <div class="stat"><label>Total hours</label><span>${escapeHtml(fmtHours(s.totalWorkingMinutes))}</span></div>
    <div class="stat"><label>Avg / day</label><span>${escapeHtml(fmtHours(s.avgWorkingMinutes))}</span></div>
  </div>

  <table>
    <thead><tr>${tableHead}</tr></thead>
    <tbody>${tableBody || '<tr><td colspan="' + head.length + '">No records</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <span>HR Attendance Register · Confidential</span>
    <span>${rows.length} record(s)</span>
  </div>
</body>
</html>`;
}

export function printAttendanceReport(
  report: AttendanceReportData,
  rows: AttendanceReportRow[],
  singleEmployee: boolean
) {
  const html = buildAttendanceReportHtml(report, rows, singleEmployee);
  const win = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
  if (!win) {
    throw new Error('Pop-up blocked. Allow pop-ups for this site to print the report.');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  const trigger = () => {
    try {
      win.print();
    } catch {
      /* user may close early */
    }
  };
  if (win.document.readyState === 'complete') {
    setTimeout(trigger, 350);
  } else {
    win.onload = () => setTimeout(trigger, 350);
  }
}

export async function downloadAttendanceReportPdf(
  report: AttendanceReportData,
  rows: AttendanceReportRow[],
  singleEmployee: boolean
) {
  const { createBrandedReport } = await import('./pdf-branding');
  const autoTable = (await import('jspdf-autotable')).default;

  const { doc, margin, startY, accentHex, finalize } = await createBrandedReport({
    reportTitle: 'Attendance Report',
    orientation: singleEmployee ? 'portrait' : 'landscape',
  });

  let y = startY;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  const scope = report.employee
    ? `${report.employee.name} (${report.employee.employeeCode})`
    : `All employees (${report.employeeCount})`;
  doc.text(`Period: ${report.from} to ${report.to} (${report.dayCount} days)`, margin, y);
  y += 5;
  doc.text(`Scope: ${scope}`, margin, y);
  y += 5;
  const s = report.summary;
  doc.text(
    `Summary: Present ${s.present} · Late ${s.late} · Absent ${s.absent} · Leave ${s.onLeave} · Hours ${fmtHours(s.totalWorkingMinutes)}`,
    margin,
    y
  );
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [buildTableHead(singleEmployee)],
    body: buildTableBody(rows, singleEmployee),
    theme: 'striped',
    headStyles: { fillColor: accentHex, textColor: '#ffffff', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      if (data.pageNumber > 1 && data.cursor) {
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`${report.from} – ${report.to}`, margin, 10);
      }
    },
  });

  const label = report.employee
    ? `${report.employee.employeeCode}_${report.from}_${report.to}`
    : `all_${report.from}_${report.to}`;

  finalize({ filename: `attendance-report-${label}.pdf` });
}
