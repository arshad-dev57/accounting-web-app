'use client';

import React from 'react';
import {
  Wallet,
  Download,
  Loader2,
  Play,
  ShieldCheck,
  Banknote,
  AlertTriangle,
  Search,
  X,
  Printer,
  PauseCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRStatusBadge,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRWorkflowNotice,
  HRAvatar,
} from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const COLORS = { success: '#2ECC71', warning: '#F39C12', danger: '#E74C3C', primary: '#014582' };
const pkr = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const STEPS = ['Draft', 'Review', 'Approved', 'Paid'] as const;
type PayrollTab = 'run' | 'register' | 'cost' | 'statutory' | 'payments' | 'variance';

function downloadCsv(filename: string, header: string[], lines: string[]) {
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PayrollPage() {
  const [period, setPeriod] = React.useState(currentPeriod());
  const [rows, setRows] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({});
  const [periodLabel, setPeriodLabel] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  const [tab, setTab] = React.useState<PayrollTab>('run');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<any | null>(null);

  const apply = (data: { items: any[]; period?: string; periodLabel?: string; summary?: any }) => {
    setRows(data.items || []);
    if (data.period) setPeriod(data.period);
    if (data.periodLabel) setPeriodLabel(data.periodLabel);
    setSummary(data.summary || {});
  };

  const load = React.useCallback(async (p = period) => {
    setLoading(true);
    try {
      apply(await hrWorkforceService.payroll(p));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    setBusy('generate');
    try {
      apply(await hrWorkforceService.generatePayroll(period));
      toast.success('Pay run calculated from attendance, leave, overtime and salary structure');
    } catch (error: any) {
      toast.error(error.message || 'Generate failed');
    } finally {
      setBusy('');
    }
  };

  const bulk = async (status: string) => {
    setBusy(status);
    try {
      apply(await hrWorkforceService.bulkPayrollStatus(period, status));
      toast.success(`Pay run moved to ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setBusy('');
    }
  };

  const exportRegister = () => {
    downloadCsv(
      `payroll-register-${period}.csv`,
      ['Employee', 'Code', 'Department', 'Present', 'Working days', 'Basic', 'Allowances', 'OT', 'Gross', 'Tax', 'EOBI', 'PF', 'Other deductions', 'Net', 'Status'],
      rows.map((r) => {
        const b = r.breakdown || {};
        const earn = b.earnings || {};
        const ded = b.deductions || {};
        const allowances = Number(earn.houseAllowance || 0) + Number(earn.transportAllowance || 0) + Number(earn.medicalAllowance || 0);
        const other = Number(ded.unpaidLeave || 0) + Number(ded.late || 0) + Number(ded.loan || 0);
        return [
          r.employee,
          r.employeeCode,
          r.department,
          b.presentDays ?? '',
          b.workingDays ?? '',
          earn.basic ?? r.base,
          allowances,
          r.overtime,
          earn.gross ?? r.base,
          ded.tax || 0,
          ded.eobi || 0,
          ded.providentFund || 0,
          other,
          r.net,
          r.status,
        ].join(',');
      })
    );
  };

  const exportPayments = () => {
    downloadCsv(
      `salary-payment-file-${period}.csv`,
      ['Employee code', 'Employee name', 'Department', 'Designation', 'Net payable', 'Period', 'Status'],
      rows.map((r) => [r.employeeCode, r.employee, r.department, r.designation, r.net, period, r.status].join(','))
    );
  };

  const filtered = rows.filter((r) =>
    `${r.employee} ${r.employeeCode} ${r.department}`.toLowerCase().includes(query.toLowerCase())
  );
  const exceptions = filtered.filter((r) => (r.breakdown?.exceptions || []).length);
  const byStatus = summary.byStatus || {};
  const statutory = summary.statutory || {};

  return (
    <HRPage>
      <HRPageHeader
        title="Payroll"
        subtitle="Monthly pay run · salary structure · attendance · statutory deductions"
        backHref="/hr/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => {
                const next = e.target.value;
                setPeriod(next);
                load(next);
              }}
              className="bg-white/15 text-white rounded-lg px-2 py-2 text-xs font-bold border border-white/20"
            />
            <button
              type="button"
              onClick={generate}
              disabled={!!busy}
              className="flex items-center gap-2 bg-white text-[#014582] px-3 py-2 rounded-lg text-xs font-bold"
            >
              {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Process pay run
            </button>
          </div>
        }
      />

      <HRWorkflowNotice
        title="Standard payroll cycle"
        detail="Process run → Review exceptions → Approve → Mark paid. Gross splits into basic, house, transport and medical from HR Settings. Unpaid days, late, EOBI, tax, PF and overtime are applied automatically. Approved and paid slips stay locked. Employees only see Approved or Paid payslips."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <HRStatCard label="Employees on run" value={summary.headcount || 0} icon={Wallet} color={COLORS.primary} hint={periodLabel} />
        <HRStatCard label="Gross payroll" value={pkr(summary.gross || 0)} icon={Wallet} color={COLORS.primary} />
        <HRStatCard label="Deductions" value={pkr(summary.deductions || 0)} icon={Wallet} color={COLORS.danger} />
        <HRStatCard label="Net payable" value={pkr(summary.net || 0)} icon={Banknote} color={COLORS.success} />
        <HRStatCard label="Vs last month" value={pkr(summary.variance || 0)} icon={AlertTriangle} color={COLORS.warning} hint="Net variance" />
      </div>

      <div className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-6">
        <p className="text-[10px] font-bold text-[#7A8FA6] uppercase tracking-wider mb-3">Pay run workflow</p>
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                (byStatus[step] || 0) > 0 ? 'bg-[#014582] text-white border-[#014582]' : 'bg-[#F0F4F8] text-[#7A8FA6] border-[#DDE4EE]'
              }`}>
                {step} · {byStatus[step] || 0}
              </div>
              {i < STEPS.length - 1 && <span className="text-[#DDE4EE]">→</span>}
            </React.Fragment>
          ))}
          {(byStatus.Held || 0) > 0 && (
            <div className="px-3 py-2 rounded-xl text-xs font-bold border bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/30">
              Held · {byStatus.Held}
            </div>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" disabled={!!busy} onClick={() => bulk('Review')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F39C12]/10 text-[#F39C12]">Send to review</button>
            <button type="button" disabled={!!busy} onClick={() => bulk('Approved')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#014582]/10 text-[#014582] flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Approve run</button>
            <button type="button" disabled={!!busy} onClick={() => bulk('Paid')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71] flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Mark paid</button>
            <button type="button" disabled={!!busy} onClick={() => bulk('Held')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#7A8FA6] flex items-center gap-1"><PauseCircle className="w-3.5 h-3.5" /> Hold drafts</button>
            <button type="button" onClick={exportRegister} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#014582] flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Register CSV</button>
            <button type="button" onClick={exportPayments} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#014582] flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Payment file</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'run', label: 'Pay run' },
          { id: 'register', label: 'Payroll register' },
          { id: 'cost', label: 'Department cost' },
          { id: 'statutory', label: 'Statutory' },
          { id: 'payments', label: 'Salary payment' },
          { id: 'variance', label: 'Period variance' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as PayrollTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === t.id ? 'bg-[#014582] text-white' : 'bg-white border border-[#DDE4EE] text-[#7A8FA6]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'cost' && tab !== 'statutory' && tab !== 'variance' && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee, code or department"
            className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm border border-[#DDE4EE]"
          />
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : tab === 'cost' ? (
        <HRCard title="Department payroll cost" action={<span className="text-[10px] font-bold text-[#7A8FA6]">{periodLabel}</span>}>
          <HRTable columns={['Department', 'Headcount', 'Gross', 'Overtime', 'Deductions', 'Net cost']}>
            {(summary.byDepartment || []).length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">Process a pay run first</HRTableCell></HRTableRow>
            )}
            {(summary.byDepartment || []).map((d: any) => (
              <HRTableRow key={d.department}>
                <HRTableCell className="font-bold">{d.department}</HRTableCell>
                <HRTableCell>{d.headcount}</HRTableCell>
                <HRTableCell>{pkr(d.gross)}</HRTableCell>
                <HRTableCell>{pkr(d.overtime)}</HRTableCell>
                <HRTableCell className="text-[#E74C3C]">{pkr(d.deductions)}</HRTableCell>
                <HRTableCell className="font-bold text-[#2ECC71]">{pkr(d.net)}</HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      ) : tab === 'statutory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HRCard title="Statutory & recovery totals">
            <div className="space-y-3">
              {[
                ['Income tax', statutory.tax],
                ['EOBI', statutory.eobi],
                ['Provident fund', statutory.providentFund],
                ['Unpaid / absent days', statutory.unpaidLeave],
                ['Late arrival', statutory.late],
                ['Loan / advance recovery', statutory.loan],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-sm border-b border-[#F0F4F8] pb-2">
                  <span className="text-[#7A8FA6] font-semibold">{label}</span>
                  <span className="font-extrabold text-[#1A1A2E]">{pkr(Number(value || 0))}</span>
                </div>
              ))}
            </div>
          </HRCard>
          <HRCard title="Earnings additions">
            <div className="space-y-3">
              {[
                ['Overtime', statutory.overtime],
                ['Bonus / incentive', statutory.bonus],
                ['Gross payroll', summary.gross],
                ['Total deductions', summary.deductions],
                ['Net payable', summary.net],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-sm border-b border-[#F0F4F8] pb-2">
                  <span className="text-[#7A8FA6] font-semibold">{label}</span>
                  <span className="font-extrabold text-[#1A1A2E]">{pkr(Number(value || 0))}</span>
                </div>
              ))}
            </div>
          </HRCard>
        </div>
      ) : tab === 'variance' ? (
        <HRCard title="Period comparison" action={<span className="text-[10px] font-bold text-[#7A8FA6]">{summary.previousPeriod || 'Previous month'}</span>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl border border-[#DDE4EE] p-4">
              <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">This period net</p>
              <p className="text-xl font-extrabold mt-1">{pkr(summary.net || 0)}</p>
            </div>
            <div className="rounded-xl border border-[#DDE4EE] p-4">
              <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">Previous net</p>
              <p className="text-xl font-extrabold mt-1">{pkr(summary.previousNet || 0)}</p>
            </div>
            <div className="rounded-xl border border-[#DDE4EE] p-4">
              <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">Variance</p>
              <p className={`text-xl font-extrabold mt-1 ${(summary.variance || 0) >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                {pkr(summary.variance || 0)}
              </p>
            </div>
          </div>
          <p className="text-xs text-[#7A8FA6]">
            Variance is net payable this month minus last month. Process both periods to compare a full cycle. Exceptions this run: {summary.exceptions || 0}.
          </p>
        </HRCard>
      ) : tab === 'payments' ? (
        <HRCard
          title="Salary payment register"
          action={
            <button type="button" onClick={exportPayments} className="text-[10px] font-bold text-[#014582]">
              Download bank file
            </button>
          }
        >
          <HRTable columns={['Employee', 'Code', 'Department', 'Net payable', 'Status']}>
            {filtered.length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No payment rows</HRTableCell></HRTableRow>
            )}
            {filtered.map((p) => (
              <HRTableRow key={p.id}>
                <HRTableCell className="font-bold">
                  <button type="button" onClick={() => setSelected(p)} className="flex items-center gap-2 text-left">
                    <HRAvatar name={p.employee} />
                    {p.employee}
                  </button>
                </HRTableCell>
                <HRTableCell>{p.employeeCode}</HRTableCell>
                <HRTableCell>{p.department || '—'}</HRTableCell>
                <HRTableCell className="font-bold text-[#2ECC71]">{pkr(p.net)}</HRTableCell>
                <HRTableCell><HRStatusBadge status={p.status} /></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      ) : (
        <HRCard
          title={tab === 'register' ? 'Statutory payroll register' : 'Employee pay run'}
          action={<span className="text-[10px] font-bold text-[#7A8FA6]">{filtered.length} records</span>}
        >
          <HRTable
            columns={
              tab === 'register'
                ? ['Employee', 'Dept', 'Present / Work', 'Basic', 'Allowances', 'OT', 'Gross', 'Deductions', 'Net', 'Status']
                : ['Employee', 'Department', 'Gross', 'OT', 'Deductions', 'Net pay', 'Flags', 'Status']
            }
          >
            {filtered.length === 0 && (
              <HRTableRow><HRTableCell className="text-[#7A8FA6]">No payslips — process the pay run for this period</HRTableCell></HRTableRow>
            )}
            {filtered.map((p) => {
              const b = p.breakdown || {};
              const earn = b.earnings || {};
              const allowances = Number(earn.houseAllowance || 0) + Number(earn.transportAllowance || 0) + Number(earn.medicalAllowance || 0);
              return (
                <HRTableRow key={p.id}>
                  <HRTableCell className="font-bold">
                    <button type="button" onClick={() => setSelected(p)} className="flex items-center gap-2 text-left">
                      <HRAvatar name={p.employee} />
                      <span>
                        {p.employee}
                        <span className="block text-[10px] font-semibold text-[#7A8FA6]">{p.employeeCode} · {p.designation}</span>
                      </span>
                    </button>
                  </HRTableCell>
                  {tab === 'register' ? (
                    <>
                      <HRTableCell>{p.department || '—'}</HRTableCell>
                      <HRTableCell>{b.presentDays ?? '—'}/{b.workingDays ?? '—'}</HRTableCell>
                      <HRTableCell>{pkr(earn.basic ?? p.base)}</HRTableCell>
                      <HRTableCell>{pkr(allowances)}</HRTableCell>
                      <HRTableCell>{pkr(p.overtime)}</HRTableCell>
                      <HRTableCell>{pkr(earn.gross ?? p.base)}</HRTableCell>
                      <HRTableCell className="text-[#E74C3C]">{pkr(p.deductions)}</HRTableCell>
                      <HRTableCell className="font-bold">{pkr(p.net)}</HRTableCell>
                      <HRTableCell><HRStatusBadge status={p.status} /></HRTableCell>
                    </>
                  ) : (
                    <>
                      <HRTableCell>{p.department || '—'}</HRTableCell>
                      <HRTableCell>{pkr(earn.gross ?? p.base)}</HRTableCell>
                      <HRTableCell>{pkr(p.overtime)}</HRTableCell>
                      <HRTableCell className="text-[#E74C3C]">{pkr(p.deductions)}</HRTableCell>
                      <HRTableCell className="font-bold text-[#2ECC71]">{pkr(p.net)}</HRTableCell>
                      <HRTableCell>
                        {(b.exceptions || []).length ? (
                          <span className="text-[10px] font-bold text-[#F39C12]">{b.exceptions[0]}</span>
                        ) : (
                          <span className="text-[10px] text-[#7A8FA6]">Clear</span>
                        )}
                      </HRTableCell>
                      <HRTableCell><HRStatusBadge status={p.status} /></HRTableCell>
                    </>
                  )}
                </HRTableRow>
              );
            })}
          </HRTable>
        </HRCard>
      )}

      {exceptions.length > 0 && tab === 'run' && (
        <div className="mt-4">
          <HRCard title="Exceptions to review" action={<span className="text-[10px] font-bold text-[#F39C12]">{exceptions.length}</span>}>
            <div className="space-y-2">
              {exceptions.map((p) => (
                <button key={p.id} type="button" onClick={() => setSelected(p)} className="w-full text-left flex items-center justify-between bg-[#F39C12]/8 rounded-xl px-3 py-2">
                  <span className="text-xs font-bold">{p.employee}</span>
                  <span className="text-[10px] text-[#F39C12] font-semibold">{(p.breakdown?.exceptions || []).join(' · ')}</span>
                </button>
              ))}
            </div>
          </HRCard>
        </div>
      )}

      {selected && (
        <PayslipDrawer
          slip={selected}
          onClose={() => setSelected(null)}
          onSaved={(next) => {
            setSelected(next);
            setRows((list) => list.map((r) => (r.id === next.id ? next : r)));
          }}
        />
      )}
    </HRPage>
  );
}

function printPayslip(slip: any) {
  const b = slip.breakdown || {};
  const earn = b.earnings || {};
  const ded = b.deductions || {};
  const win = window.open('', '_blank', 'width=800,height=1000');
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>Payslip ${slip.period}</title>
    <style>
      body{font-family:Segoe UI,Arial,sans-serif;padding:32px;color:#1A1A2E}
      h1{margin:0;font-size:22px} .muted{color:#7A8FA6;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      td{padding:8px 0;border-bottom:1px solid #EEF2F7;font-size:13px}
      .net{background:#014582;color:#fff;padding:16px;border-radius:12px;display:flex;justify-content:space-between;margin-top:20px}
    </style></head><body>
    <p class="muted">OFFICIAL PAYSLIP</p>
    <h1>${slip.periodLabel || slip.period}</h1>
    <p>${slip.employee} · ${slip.employeeCode || ''} · ${slip.department || ''} · ${slip.designation || ''}</p>
    <p class="muted">Attendance ${b.presentDays || 0}/${b.workingDays || 0} · Paid leave ${b.paidLeaveDays || 0} · Unpaid ${b.unpaidLeaveDays || 0}</p>
    <table>
      <tr><td>Basic salary</td><td style="text-align:right">${pkr(earn.basic || slip.base)}</td></tr>
      <tr><td>House rent allowance</td><td style="text-align:right">${pkr(earn.houseAllowance || 0)}</td></tr>
      <tr><td>Transport allowance</td><td style="text-align:right">${pkr(earn.transportAllowance || 0)}</td></tr>
      <tr><td>Medical allowance</td><td style="text-align:right">${pkr(earn.medicalAllowance || 0)}</td></tr>
      <tr><td>Overtime</td><td style="text-align:right">${pkr(earn.overtime || slip.overtime)}</td></tr>
      <tr><td>Bonus / incentive</td><td style="text-align:right">${pkr(earn.bonus || 0)}</td></tr>
      <tr><td><b>Gross earnings</b></td><td style="text-align:right"><b>${pkr(earn.gross || slip.base)}</b></td></tr>
      <tr><td>Unpaid / absent</td><td style="text-align:right">-${pkr(ded.unpaidLeave || 0)}</td></tr>
      <tr><td>Late arrival</td><td style="text-align:right">-${pkr(ded.late || 0)}</td></tr>
      <tr><td>Income tax</td><td style="text-align:right">-${pkr(ded.tax || 0)}</td></tr>
      <tr><td>EOBI</td><td style="text-align:right">-${pkr(ded.eobi || 0)}</td></tr>
      <tr><td>Provident fund</td><td style="text-align:right">-${pkr(ded.providentFund || 0)}</td></tr>
      <tr><td>Loan / advance</td><td style="text-align:right">-${pkr(ded.loan || 0)}</td></tr>
    </table>
    <div class="net"><span>Net take-home</span><b>${pkr(slip.net)}</b></div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

function PayslipDrawer({
  slip,
  onClose,
  onSaved,
}: {
  slip: any;
  onClose: () => void;
  onSaved: (row: any) => void;
}) {
  const b = slip.breakdown || {};
  const earn = b.earnings || {};
  const ded = b.deductions || {};
  const [bonus, setBonus] = React.useState(String(earn.bonus || 0));
  const [loan, setLoan] = React.useState(String(ded.loan || 0));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setBonus(String(earn.bonus || 0));
    setLoan(String(ded.loan || 0));
  }, [slip.id, earn.bonus, ded.loan]);

  const saveAdj = async () => {
    setSaving(true);
    try {
      const next = await hrWorkforceService.updatePayroll(slip.id, {
        bonus: Number(bonus || 0),
        loan: Number(loan || 0),
      });
      toast.success('Payslip recalculated');
      onSaved(next);
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: string) => {
    try {
      const next = await hrWorkforceService.updatePayroll(slip.id, { status });
      onSaved(next);
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    }
  };

  const line = (label: string, value: number, tone?: 'add' | 'sub') => (
    <div className="flex justify-between text-xs py-1.5 border-b border-[#F0F4F8]">
      <span className="text-[#7A8FA6]">{label}</span>
      <span className={`font-bold ${tone === 'sub' ? 'text-[#E74C3C]' : tone === 'add' ? 'text-[#2ECC71]' : 'text-[#1A1A2E]'}`}>
        {tone === 'sub' ? '-' : ''}{pkr(value)}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#F0F4F8] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#014582] px-5 py-4 flex items-start justify-between text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Official payslip</p>
            <h2 className="text-lg font-extrabold">{slip.periodLabel || slip.period}</h2>
            <p className="text-xs text-white/80">{slip.employee} · {slip.employeeCode}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => printPayslip(slip)} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] grid grid-cols-2 gap-2 text-xs">
            <p><span className="text-[#7A8FA6]">Department</span><br /><b>{slip.department || '—'}</b></p>
            <p><span className="text-[#7A8FA6]">Designation</span><br /><b>{slip.designation || '—'}</b></p>
            <p><span className="text-[#7A8FA6]">Attendance</span><br /><b>{b.presentDays || 0}/{b.workingDays || 0} days</b></p>
            <p><span className="text-[#7A8FA6]">Paid leave / Unpaid</span><br /><b>{b.paidLeaveDays || 0} / {b.unpaidLeaveDays || 0}</b></p>
            <p><span className="text-[#7A8FA6]">Late days</span><br /><b>{b.lateDays || 0}</b></p>
            <p><span className="text-[#7A8FA6]">Status</span><br /><b>{slip.status}</b></p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE]">
            <p className="text-[10px] font-bold text-[#7A8FA6] uppercase mb-2">Earnings</p>
            {line('Basic salary', earn.basic || slip.base)}
            {line('House rent allowance', earn.houseAllowance || 0)}
            {line('Transport allowance', earn.transportAllowance || 0)}
            {line('Medical allowance', earn.medicalAllowance || 0)}
            {line('Overtime', earn.overtime || slip.overtime, 'add')}
            {line('Bonus / incentive', earn.bonus || 0, 'add')}
            {line('Gross earnings', earn.gross || slip.base)}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE]">
            <p className="text-[10px] font-bold text-[#7A8FA6] uppercase mb-2">Deductions</p>
            {line('Unpaid / absent days', ded.unpaidLeave || 0, 'sub')}
            {line('Late arrival', ded.late || 0, 'sub')}
            {line('Income tax', ded.tax || 0, 'sub')}
            {line('EOBI', ded.eobi || 0, 'sub')}
            {line('Provident fund', ded.providentFund || 0, 'sub')}
            {line('Loan / advance', ded.loan || 0, 'sub')}
            {line('Total deductions', ded.total || slip.deductions, 'sub')}
          </div>

          <div className="bg-[#014582] text-white rounded-2xl p-4 flex justify-between items-center">
            <span className="text-xs font-bold">Net take-home</span>
            <span className="text-xl font-extrabold">{pkr(slip.net)}</span>
          </div>

          {(b.exceptions || []).length > 0 && (
            <div className="bg-[#F39C12]/10 rounded-2xl p-3 text-[11px] text-[#F39C12] font-semibold">
              {(b.exceptions || []).map((e: string) => <p key={e}>• {e}</p>)}
            </div>
          )}

          {slip.status !== 'Paid' && (
            <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] space-y-3">
              <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">Adjustments</p>
              <label className="block text-xs font-bold text-[#7A8FA6]">Bonus / incentive
                <input value={bonus} onChange={(e) => setBonus(e.target.value)} className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
              </label>
              <label className="block text-xs font-bold text-[#7A8FA6]">Loan / advance recovery
                <input value={loan} onChange={(e) => setLoan(e.target.value)} className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
              </label>
              <button type="button" onClick={saveAdj} disabled={saving} className="w-full bg-[#014582] text-white rounded-xl py-2.5 text-sm font-bold">
                {saving ? 'Saving…' : 'Recalculate payslip'}
              </button>
              <div className="flex gap-2">
                {slip.status === 'Held' && (
                  <button type="button" onClick={() => setStatus('Draft')} className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#F0F4F8] text-[#014582]">Release hold</button>
                )}
                {slip.status !== 'Held' && slip.status !== 'Approved' && (
                  <button type="button" onClick={() => setStatus('Held')} className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#F39C12]/10 text-[#F39C12]">Hold</button>
                )}
                {slip.status !== 'Approved' && (
                  <button type="button" onClick={() => setStatus('Approved')} className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#014582]/10 text-[#014582]">Approve</button>
                )}
                <button type="button" onClick={() => setStatus('Paid')} className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71]">Mark paid</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
