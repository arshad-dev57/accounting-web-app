/** Shared payroll slip parsing — single source for payslip/register figures (no recalculation). */

export type PayrollSlipRow = {
  id: string;
  employeeId: string;
  employee: string;
  employeeCode: string;
  department: string;
  designation: string;
  office?: string;
  status: string;
  paidAt?: string | null;
  period: string;
  periodLabel?: string;
  joiningDate?: string;
  notes?: string;
  net: number;
  deductions: number;
  breakdown?: Record<string, any>;
  bankName?: string;
  bankAccount?: string;
};

export const pkr = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

export function slipParts(row: PayrollSlipRow | any) {
  const b = row.breakdown || {};
  const earn = b.earnings || {};
  const ded = b.deductions || {};
  const basic = Number(earn.basic ?? row.base ?? 0);
  const houseAllowance = Number(earn.houseAllowance || 0);
  const transportAllowance = Number(earn.transportAllowance || 0);
  const medicalAllowance = Number(earn.medicalAllowance || 0);
  const allowances = Number(
    earn.allowances ??
      houseAllowance + transportAllowance + medicalAllowance
  );
  const otherAllowances = Math.max(0, allowances - houseAllowance - transportAllowance - medicalAllowance);
  const commission = Number(earn.commission || 0);
  const overtime = Number(earn.overtime ?? row.overtime ?? 0);
  const bonus = Number(earn.bonus || 0);
  const attendanceCut = Number(
    ded.attendanceCut ?? Number(ded.unpaidLeave || 0) + Number(ded.late || 0)
  );
  const loan = Number(ded.loan || 0);
  const otherCut = Number(ded.otherCut || 0);
  const noSaleCut = Number(ded.noSaleCut || b.noSaleCut || 0);
  const incomeTax = Number(ded.incomeTax ?? ded.tax ?? 0);
  const eobi = Number(ded.eobi || 0);
  const pf = Number(ded.providentFund || 0);
  const statutory = incomeTax + eobi + pf;
  const gross = earn.gross != null ? Number(earn.gross) : 0;
  const totalDeductions = row.deductions != null ? Number(row.deductions) : Number(ded.total ?? 0);
  const net = row.net != null ? Number(row.net) : Number(b.net ?? 0);
  return {
    b,
    earn,
    ded,
    basic,
    houseAllowance,
    transportAllowance,
    medicalAllowance,
    otherAllowances,
    allowances,
    commission,
    overtime,
    bonus,
    attendanceCut,
    loan,
    otherCut,
    noSaleCut,
    incomeTax,
    eobi,
    pf,
    statutory,
    otherDeductions: loan + otherCut + noSaleCut,
    salesAmount: Number(b.salesAmount || 0),
    salesCommissionPct: Number(b.salesCommissionPct || 0),
    gross,
    net,
    totalDeductions,
    isOnProbation: Boolean(b.isOnProbation),
    proRata: Number(b.proRata ?? 1),
  };
}

/** Maps existing payroll record status to ERP payroll lifecycle label. */
export function payrollStatusLabel(status: string, row?: PayrollSlipRow | any): string {
  const s = String(status || 'Draft');
  if (s === 'Paid') return 'Finalized';
  if (s === 'Review') return 'Reviewed';
  if (s === 'Approved') return 'Approved';
  if (s === 'Held') return 'Calculated';
  if (s === 'Draft') {
    const hasCalc = row?.breakdown?.earnings && Object.keys(row.breakdown.earnings).length > 0;
    return hasCalc ? 'Calculated' : 'Draft';
  }
  return s;
}

/** Payment status derived from existing payroll item status. */
export function paymentStatusLabel(status: string): string {
  const s = String(status || '');
  if (s === 'Paid') return 'Paid';
  if (s === 'Approved') return 'Pending';
  return 'Unpaid';
}

export function printPayslip(slip: PayrollSlipRow | any, payDate?: string, hrSettings?: any) {
  const p = slipParts(slip);
  const b = slip.breakdown || {};
  const win = window.open('', '_blank', 'width=900,height=1150');
  if (!win) return;
  const paid = slip.paidAt ? String(slip.paidAt).slice(0, 10) : payDate || 'Pending';

  const companyName = hrSettings?.companyName || 'Bisonstechs ERP';
  const companyAddress = hrSettings?.companyAddress || '';
  const primaryLogo = hrSettings?.showLogo && hrSettings?.primaryLogo ? hrSettings.primaryLogo : '';
  const secondaryLogo = hrSettings?.showLogo && hrSettings?.secondaryLogo ? hrSettings.secondaryLogo : '';
  const officialStamp = hrSettings?.showStamp && hrSettings?.officialStamp ? hrSettings.officialStamp : '';
  const accentColor = hrSettings?.primaryColor || '#014582';
  const fontFamily = hrSettings?.fontFamily || 'Segoe UI, Arial, sans-serif';
  const payslipTitle = hrSettings?.payslipTitle || 'PAYSLIP STATEMENT';

  const sigList = hrSettings?.signatories || [];

  const rows = (items: [string, string | number][]) =>
    items.map(([label, val]) =>
      `<tr><td>${label}</td><td style="text-align:right;font-weight:600">${typeof val === 'number' ? pkr(val) : val}</td></tr>`
    ).join('');

  const signatureHtml = sigList.length > 0
    ? `
      <div style="margin-top: 32px; border-top: 1px border-dashed #DDE4EE; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #1A1A2E;">
        ${sigList.map((sig: any) => `
          <div style="width: 22%; text-align: ${sig.alignment || 'left'};">
            <div style="height: 44px; display: flex; align-items: flex-end; justify-content: ${sig.alignment === 'right' ? 'flex-end' : sig.alignment === 'center' ? 'center' : 'flex-start'};">
              ${sig.signatureUrl ? `<img src="${sig.signatureUrl}" style="max-height: 38px; max-width: 120px; object-fit: contain;" />` : '<div style="border-bottom: 1px solid #CBD5E1; width: 100%; height: 28px;"></div>'}
              ${sig.stampUrl ? `<img src="${sig.stampUrl}" style="height: 24px; margin-left: 4px;" />` : ''}
            </div>
            <div style="border-top: 1px solid #CBD5E1; padding-top: 4px; font-weight: 800;">${sig.label}</div>
            ${sig.name ? `<div style="font-size: 10px; color: #475569;">${sig.name}</div>` : ''}
            ${sig.designation ? `<div style="font-size: 9px; color: #64748B;">${sig.designation}</div>` : ''}
          </div>
        `).join('')}

        ${officialStamp ? `
          <div style="text-align: right;">
            <img src="${officialStamp}" style="max-height: 55px; max-width: 85px; object-fit: contain;" />
            <div style="font-size: 9px; color: #94A3B8; margin-top: 2px;">Official Seal</div>
          </div>
        ` : ''}
      </div>
    `
    : '';

  win.document.write(`<!doctype html><html><head><title>${payslipTitle} · ${slip.employee} · ${slip.period}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:${fontFamily};color:#1A1A2E;background:#fff;padding:32px}
    .wrap{max-width:740px;margin:0 auto}
    .header{background:${accentColor};color:#fff;padding:20px 24px;border-radius:12px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
    .header h1{font-size:18px;font-weight:800;margin-bottom:2px}
    .header .sub{font-size:11px;opacity:0.85;text-transform:uppercase;letter-spacing:0.05em}
    .header .badge{background:rgba(255,255,255,0.15);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;text-align:center}
    .section{margin-bottom:16px}
    .section-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#7A8FA6;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #EEF2F7}
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
    .info-item label{font-size:10px;font-weight:700;color:#7A8FA6;display:block}
    .info-item span{font-size:13px;font-weight:600}
    table{width:100%;border-collapse:collapse}
    td{padding:9px 4px;border-bottom:1px solid #EEF2F7;font-size:13px}
    tr:last-child td{border-bottom:none}
    .subtotal td{font-weight:700;background:#F8FAFC;font-size:12px}
    .net-bar{background:${accentColor};color:#fff;padding:16px 20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}
    .net-bar .label{font-size:13px;font-weight:600;opacity:0.9}
    .net-bar .amount{font-size:24px;font-weight:800}
    @media print{body{padding:16px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.net-bar{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="wrap">
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      ${primaryLogo ? `<img src="${primaryLogo}" style="height:46px;max-width:130px;object-fit:contain" />` : ''}
      <div>
        <div class="sub">${payslipTitle}</div>
        <h1>${slip.employee}${p.isOnProbation ? ' <span style="font-size:12px;opacity:0.8">(Probation)</span>' : ''}</h1>
        <div class="sub">${slip.designation || ''} ${slip.department ? '· ' + slip.department : ''}</div>
        <div class="sub" style="margin-top:2px">${companyName} ${companyAddress ? '· ' + companyAddress : ''}</div>
      </div>
    </div>
    <div className="badge" style="text-align:right">
      ${secondaryLogo ? `<img src="${secondaryLogo}" style="height:28px;margin-bottom:4px" /><br/>` : ''}
      <div style="opacity:0.8;font-size:10px">Period: ${slip.periodLabel || slip.period}</div>
      <div style="margin-top:2px;opacity:0.8;font-size:10px">Pay date: ${paid}</div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-item"><label>Employee ID</label><span>${slip.employeeCode || '—'}</span></div>
    <div class="info-item"><label>Joining date</label><span>${slip.joiningDate ? String(slip.joiningDate).slice(0,10) : '—'}</span></div>
    <div class="info-item"><label>Pay basis</label><span style="text-transform:capitalize">${b.payBasis || 'Monthly'}</span></div>
    <div class="info-item"><label>Department</label><span>${slip.department || '—'}</span></div>
    <div class="info-item"><label>Working days</label><span>${b.workingDays ?? '—'} ${b.presentDays != null ? '/ Present ' + b.presentDays : ''}</span></div>
    <div class="info-item"><label>Status</label><span>${slip.status}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Earnings</div>
    <table>${rows([
      ['Basic salary', p.basic],
      ['House rent allowance', p.houseAllowance],
      ['Transport allowance', p.transportAllowance],
      ['Medical allowance', p.medicalAllowance],
      ...(p.overtime > 0 ? [['Overtime', p.overtime] as [string, number]] : []),
      ...(p.bonus > 0 ? [['Bonus', p.bonus] as [string, number]] : []),
      ...(p.commission > 0 ? [['Sales commission', p.commission] as [string, number]] : []),
    ])}<tr class="subtotal"><td>Gross earnings</td><td style="text-align:right">${pkr(p.gross)}</td></tr></table>
  </div>
  <div class="section">
    <div class="section-title">Deductions</div>
    <table>${rows([
      ...(p.attendanceCut > 0 ? [['Attendance / absent cut', -p.attendanceCut] as [string, number]] : []),
      ...(p.incomeTax > 0 ? [['Income tax (FBR slab)', -p.incomeTax] as [string, number]] : []),
      ...(p.eobi > 0 ? [['EOBI (employee)', -p.eobi] as [string, number]] : []),
      ...(p.pf > 0 ? [['Provident fund', -p.pf] as [string, number]] : []),
      ...(p.loan > 0 ? [['Loan installment', -p.loan] as [string, number]] : []),
      ...(p.noSaleCut > 0 ? [['No-sale cut', -p.noSaleCut] as [string, number]] : []),
      ...(p.otherCut > 0 ? [['Other deduction', -p.otherCut] as [string, number]] : []),
    ])}<tr class="subtotal"><td>Total deductions</td><td style="text-align:right">−${pkr(p.totalDeductions)}</td></tr></table>
  </div>
  <div class="net-bar">
    <div><div class="label">Net pay</div></div>
    <div class="amount">${pkr(p.net)}</div>
  </div>

  ${signatureHtml}

  ${hrSettings?.payslipNotes ? `
    <div style="margin-top:20px;font-size:10px;color:#7A8FA6;text-align:center;font-style:italic">
      ${hrSettings.payslipNotes}
    </div>
  ` : ''}
  </div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export type PayRegisterTotals = {
  count: number;
  basic: number;
  allowances: number;
  overtime: number;
  bonus: number;
  commission: number;
  gross: number;
  deductions: number;
  tax: number;
  net: number;
};

export function sumRegisterRows(rows: PayrollSlipRow[]): PayRegisterTotals {
  return rows.reduce(
    (acc, row) => {
      const p = slipParts(row);
      acc.count += 1;
      acc.basic += p.basic;
      acc.allowances += p.allowances;
      acc.overtime += p.overtime;
      acc.bonus += p.bonus;
      acc.commission += p.commission;
      acc.gross += p.gross;
      acc.deductions += p.totalDeductions;
      acc.tax += p.incomeTax;
      acc.net += p.net;
      return acc;
    },
    {
      count: 0,
      basic: 0,
      allowances: 0,
      overtime: 0,
      bonus: 0,
      commission: 0,
      gross: 0,
      deductions: 0,
      tax: 0,
      net: 0,
    }
  );
}

export function formatPayrollDate(val?: string | Date | null, fallback = 'N/A'): string {
  if (!val) return fallback;
  if (typeof val !== 'string') {
    try {
      val = (val as Date).toISOString();
    } catch {
      return fallback;
    }
  }
  const trimmed = val.trim();
  if (!trimmed || ['tbd', 'not specified', 'not set', 'n/a', 'none'].includes(trimmed.toLowerCase())) {
    return trimmed || fallback;
  }
  
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, y, m, d] = match;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(m, 10) - 1;
    const monthName = monthNames[monthIdx];
    if (monthName) {
      const dayNum = parseInt(d, 10);
      return `${monthName} ${dayNum}, ${y}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parsed.getUTCMonth()]} ${parsed.getUTCDate()}, ${parsed.getUTCFullYear()}`;
  }

  return trimmed;
}

export function formatPayrollRange(start?: string | Date | null, end?: string | Date | null, fallback = 'Monthly Period'): string {
  if (!start || !end) return fallback;
  const formattedStart = formatPayrollDate(start, '');
  const formattedEnd = formatPayrollDate(end, '');
  if (!formattedStart || !formattedEnd) return fallback;
  return `${formattedStart} – ${formattedEnd}`;
}

