'use client';

import React from 'react';
import {
  Wallet,
  Download,
  Loader2,
  Play,
  ShieldCheck,
  Banknote,
  Search,
  X,
  Printer,
  Pencil,
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

function downloadCsv(filename: string, header: string[], lines: string[]) {
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slipParts(row: any) {
  const b = row.breakdown || {};
  const earn = b.earnings || {};
  const ded = b.deductions || {};
  const basic = Number(earn.basic ?? row.base ?? 0);
  const allowances = Number(
    earn.allowances ??
      Number(earn.houseAllowance || 0) +
        Number(earn.transportAllowance || 0) +
        Number(earn.medicalAllowance || 0)
  );
  const commission = Number(earn.commission || 0);
  const overtime = Number(earn.overtime ?? row.overtime ?? 0);
  const bonus = Number(earn.bonus || 0);
  const attendanceCut = Number(
    ded.attendanceCut ?? Number(ded.unpaidLeave || 0) + Number(ded.late || 0)
  );
  const loan = Number(ded.loan || 0);
  const otherCut = Number(ded.otherCut || 0);
  const statutory =
    Number(ded.tax || 0) + Number(ded.eobi || 0) + Number(ded.providentFund || 0);
  return {
    b,
    earn,
    ded,
    basic,
    allowances,
    commission,
    overtime,
    bonus,
    additions: commission + overtime + bonus,
    attendanceCut,
    loan,
    otherCut,
    statutory,
    otherDeductions: loan + otherCut + statutory,
    gross: Number(earn.gross ?? basic + allowances + commission + overtime + bonus),
    net: Number(row.net || 0),
  };
}

export default function PayrollPage() {
  const [period, setPeriod] = React.useState(currentPeriod());
  const [rows, setRows] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({});
  const [periodLabel, setPeriodLabel] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
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
      toast.success('Har employee ki salary calculate ho gayi — ab commission / cuts adjust kar sakte ho');
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
      toast.success(status === 'Paid' ? 'Salaries marked paid' : `Moved to ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setBusy('');
    }
  };

  const exportPayments = () => {
    downloadCsv(
      `salary-${period}.csv`,
      ['Employee', 'Code', 'Basic', 'Commission', 'OT', 'Bonus', 'Attendance cut', 'Other cuts', 'Net', 'Status'],
      rows.map((r) => {
        const p = slipParts(r);
        return [
          r.employee,
          r.employeeCode,
          p.basic,
          p.commission,
          p.overtime,
          p.bonus,
          p.attendanceCut,
          p.otherDeductions,
          p.net,
          r.status,
        ].join(',');
      })
    );
  };

  const filtered = rows.filter((r) =>
    `${r.employee} ${r.employeeCode} ${r.department}`.toLowerCase().includes(query.toLowerCase())
  );
  const byStatus = summary.byStatus || {};

  return (
    <HRPage>
      <HRPageHeader
        title="Salary build"
        subtitle="Har employee ki is month ki salary — basic + commission − attendance cuts"
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
              Calculate all salaries
            </button>
          </div>
        }
      />

      <HRWorkflowNotice
        title="Simple salary formula"
        detail="Basic (employee profile) + Commission / sales + Overtime / bonus − Attendance cut (absent / late) − Loan & other cuts = Net pay. Pehle Calculate all dabao, phir kisi employee pe click karke commission add karo ya cut adjust karo, last mein Approve → Mark paid."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Employees" value={summary.headcount || 0} icon={Wallet} color={COLORS.primary} hint={periodLabel} />
        <HRStatCard label="Total additions" value={pkr((summary.statutory?.commission || 0) + (summary.statutory?.bonus || 0) + (summary.overtime || 0))} icon={Wallet} color={COLORS.success} />
        <HRStatCard label="Total cuts" value={pkr(summary.deductions || 0)} icon={Wallet} color={COLORS.danger} />
        <HRStatCard label="Net payable" value={pkr(summary.net || 0)} icon={Banknote} color={COLORS.success} />
      </div>

      <div className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[#7A8FA6] uppercase mr-2">Status</span>
          {['Draft', 'Review', 'Approved', 'Paid'].map((step) => (
            <div
              key={step}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                (byStatus[step] || 0) > 0
                  ? 'bg-[#014582] text-white border-[#014582]'
                  : 'bg-[#F0F4F8] text-[#7A8FA6] border-[#DDE4EE]'
              }`}
            >
              {step} · {byStatus[step] || 0}
            </div>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" disabled={!!busy || !rows.length} onClick={() => bulk('Review')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F39C12]/10 text-[#F39C12]">
              Send to review
            </button>
            <button type="button" disabled={!!busy || !rows.length} onClick={() => bulk('Approved')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#014582]/10 text-[#014582] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Approve
            </button>
            <button type="button" disabled={!!busy || !rows.length} onClick={() => bulk('Paid')} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71] flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" /> Mark paid
            </button>
            <button type="button" onClick={exportPayments} disabled={!rows.length} className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#014582] flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employee…"
          className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm border border-[#DDE4EE]"
        />
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
        </div>
      ) : (
        <HRCard
          title="Is month ki salaries"
          action={<span className="text-[10px] font-bold text-[#7A8FA6]">{filtered.length} employees</span>}
        >
          <HRTable
            columns={[
              'Employee',
              'Basic',
              '+ Commission',
              '+ OT / Bonus',
              '− Attendance cut',
              '− Other cuts',
              '= Net pay',
              'Status',
              '',
            ]}
          >
            {filtered.length === 0 && (
              <HRTableRow>
                <HRTableCell className="text-[#7A8FA6]">
                  Pehle upar se <b>Calculate all salaries</b> dabao — attendance aur salary profile se draft ban jayega.
                </HRTableCell>
              </HRTableRow>
            )}
            {filtered.map((row) => {
              const p = slipParts(row);
              return (
                <HRTableRow key={row.id}>
                  <HRTableCell className="font-bold">
                    <button type="button" onClick={() => setSelected(row)} className="flex items-center gap-2 text-left">
                      <HRAvatar name={row.employee} />
                      <span>
                        {row.employee}
                        <span className="block text-[10px] font-semibold text-[#7A8FA6]">
                          {row.employeeCode} · {row.department || '—'}
                        </span>
                        <span className="block text-[10px] text-[#7A8FA6]">
                          Present {p.b.presentDays ?? 0}/{p.b.workingDays ?? 0}
                          {(p.b.unpaidLeaveDays || 0) > 0 ? ` · Absent ${p.b.unpaidLeaveDays}` : ''}
                          {(p.b.lateDays || 0) > 0 ? ` · Late ${p.b.lateDays}` : ''}
                        </span>
                      </span>
                    </button>
                  </HRTableCell>
                  <HRTableCell>
                    <span className="font-bold">{pkr(p.basic)}</span>
                    {p.allowances > 0 && (
                      <span className="block text-[10px] text-[#7A8FA6]">+ {pkr(p.allowances)} allow.</span>
                    )}
                  </HRTableCell>
                  <HRTableCell className="text-[#2ECC71] font-bold">{pkr(p.commission)}</HRTableCell>
                  <HRTableCell className="text-[#2ECC71]">
                    {pkr(p.overtime + p.bonus)}
                    {(p.overtime > 0 || p.bonus > 0) && (
                      <span className="block text-[10px] text-[#7A8FA6]">
                        OT {pkr(p.overtime)} · Bonus {pkr(p.bonus)}
                      </span>
                    )}
                  </HRTableCell>
                  <HRTableCell className="text-[#E74C3C] font-bold">{pkr(p.attendanceCut)}</HRTableCell>
                  <HRTableCell className="text-[#E74C3C]">{pkr(p.otherDeductions)}</HRTableCell>
                  <HRTableCell className="font-extrabold text-[#014582]">{pkr(p.net)}</HRTableCell>
                  <HRTableCell>
                    <HRStatusBadge status={row.status} />
                  </HRTableCell>
                  <HRTableCell>
                    <button
                      type="button"
                      onClick={() => setSelected(row)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#014582]/10 text-[#014582]"
                    >
                      <Pencil className="w-3 h-3" /> Build
                    </button>
                  </HRTableCell>
                </HRTableRow>
              );
            })}
          </HRTable>
        </HRCard>
      )}

      {selected && (
        <BuildSalaryDrawer
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
  const p = slipParts(slip);
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
    <p class="muted">SALARY SLIP</p>
    <h1>${slip.periodLabel || slip.period}</h1>
    <p>${slip.employee} · ${slip.employeeCode || ''}</p>
    <p class="muted">Present ${p.b.presentDays || 0}/${p.b.workingDays || 0} · Absent ${p.b.unpaidLeaveDays || 0} · Late ${p.b.lateDays || 0}</p>
    <table>
      <tr><td>Basic</td><td style="text-align:right">${pkr(p.basic)}</td></tr>
      <tr><td>Allowances</td><td style="text-align:right">${pkr(p.allowances)}</td></tr>
      <tr><td>Commission / sales</td><td style="text-align:right">${pkr(p.commission)}</td></tr>
      <tr><td>Overtime</td><td style="text-align:right">${pkr(p.overtime)}</td></tr>
      <tr><td>Bonus</td><td style="text-align:right">${pkr(p.bonus)}</td></tr>
      <tr><td><b>Gross</b></td><td style="text-align:right"><b>${pkr(p.gross)}</b></td></tr>
      <tr><td>Attendance cut</td><td style="text-align:right">-${pkr(p.attendanceCut)}</td></tr>
      <tr><td>Loan / advance</td><td style="text-align:right">-${pkr(p.loan)}</td></tr>
      <tr><td>Other cut</td><td style="text-align:right">-${pkr(p.otherCut)}</td></tr>
      <tr><td>Tax / EOBI / PF</td><td style="text-align:right">-${pkr(p.statutory)}</td></tr>
    </table>
    <div class="net"><span>Net pay</span><b>${pkr(p.net)}</b></div>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

function BuildSalaryDrawer({
  slip,
  onClose,
  onSaved,
}: {
  slip: any;
  onClose: () => void;
  onSaved: (row: any) => void;
}) {
  const parts = slipParts(slip);
  const [commission, setCommission] = React.useState(String(parts.commission || 0));
  const [bonus, setBonus] = React.useState(String(parts.bonus || 0));
  const [attendanceCut, setAttendanceCut] = React.useState(String(parts.attendanceCut || 0));
  const [loan, setLoan] = React.useState(String(parts.loan || 0));
  const [otherCut, setOtherCut] = React.useState(String(parts.otherCut || 0));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const next = slipParts(slip);
    setCommission(String(next.commission || 0));
    setBonus(String(next.bonus || 0));
    setAttendanceCut(String(next.attendanceCut || 0));
    setLoan(String(next.loan || 0));
    setOtherCut(String(next.otherCut || 0));
  }, [slip.id, slip.updatedAt, slip.net]);

  const liveNet =
    parts.basic +
    parts.allowances +
    Number(commission || 0) +
    parts.overtime +
    Number(bonus || 0) -
    Number(attendanceCut || 0) -
    Number(loan || 0) -
    Number(otherCut || 0) -
    parts.statutory;

  const save = async () => {
    setSaving(true);
    try {
      const next = await hrWorkforceService.updatePayroll(slip.id, {
        commission: Number(commission || 0),
        bonus: Number(bonus || 0),
        attendanceCut: Number(attendanceCut || 0),
        loan: Number(loan || 0),
        otherCut: Number(otherCut || 0),
      });
      toast.success('Salary updated');
      onSaved(next);
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetAttendance = async () => {
    setSaving(true);
    try {
      const next = await hrWorkforceService.updatePayroll(slip.id, {
        commission: Number(commission || 0),
        bonus: Number(bonus || 0),
        loan: Number(loan || 0),
        otherCut: Number(otherCut || 0),
        resetAttendanceCut: true,
      });
      toast.success('Attendance cut auto se set ho gaya');
      onSaved(next);
    } catch (error: any) {
      toast.error(error.message || 'Reset failed');
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

  const locked = slip.status === 'Paid';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#F0F4F8] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#014582] px-5 py-4 flex items-start justify-between text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Build this salary</p>
            <h2 className="text-lg font-extrabold">{slip.employee}</h2>
            <p className="text-xs text-white/80">
              {slip.periodLabel || slip.period} · {slip.employeeCode}
            </p>
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
          <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] text-xs space-y-2">
            <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">Auto from system</p>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Basic (from profile)</span><b>{pkr(parts.basic)}</b></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Allowances</span><b>{pkr(parts.allowances)}</b></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Overtime (approved)</span><b className="text-[#2ECC71]">{pkr(parts.overtime)}</b></div>
            <div className="flex justify-between"><span className="text-[#7A8FA6]">Tax / EOBI / PF</span><b className="text-[#E74C3C]">−{pkr(parts.statutory)}</b></div>
            <div className="flex justify-between border-t border-[#F0F4F8] pt-2">
              <span className="text-[#7A8FA6]">Attendance this month</span>
              <b>
                Present {parts.b.presentDays ?? 0}/{parts.b.workingDays ?? 0}
                {(parts.b.unpaidLeaveDays || 0) > 0 ? ` · Absent ${parts.b.unpaidLeaveDays}` : ''}
                {(parts.b.lateDays || 0) > 0 ? ` · Late ${parts.b.lateDays}` : ''}
              </b>
            </div>
            {(parts.b.attendanceCutAuto != null || parts.b.attendanceCutManual) && (
              <p className="text-[10px] text-[#7A8FA6]">
                Auto attendance cut suggestion: {pkr(Number(parts.b.attendanceCutAuto || parts.attendanceCut))}
                {parts.b.attendanceCutManual ? ' · currently manual' : ''}
              </p>
            )}
          </div>

          {!locked && (
            <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] space-y-3">
              <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">HR adds / cuts</p>
              <label className="block text-xs font-bold text-[#7A8FA6]">
                + Commission / sales
                <input
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                />
              </label>
              <label className="block text-xs font-bold text-[#7A8FA6]">
                + Bonus / incentive
                <input
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                />
              </label>
              <label className="block text-xs font-bold text-[#7A8FA6]">
                − Attendance cut (absent / late)
                <input
                  value={attendanceCut}
                  onChange={(e) => setAttendanceCut(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                />
              </label>
              <button type="button" onClick={resetAttendance} disabled={saving} className="text-[11px] font-bold text-[#014582]">
                Reset attendance cut to auto
              </button>
              <label className="block text-xs font-bold text-[#7A8FA6]">
                − Loan / advance recovery
                <input
                  value={loan}
                  onChange={(e) => setLoan(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                />
              </label>
              <label className="block text-xs font-bold text-[#7A8FA6]">
                − Other cut (misc)
                <input
                  value={otherCut}
                  onChange={(e) => setOtherCut(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm text-[#1A1A2E]"
                />
              </label>
            </div>
          )}

          <div className="bg-[#014582] text-white rounded-2xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold opacity-80">Estimated net</span>
              <span className="text-2xl font-extrabold">{pkr(Math.max(0, liveNet))}</span>
            </div>
            <p className="text-[10px] text-white/70">
              Basic + allow + commission + OT + bonus − attendance − loan − other − statutory
            </p>
          </div>

          {!locked && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="w-full bg-[#014582] text-white rounded-xl py-3 text-sm font-bold"
              >
                {saving ? 'Saving…' : 'Save this salary'}
              </button>
              <div className="flex gap-2">
                {slip.status !== 'Approved' && (
                  <button type="button" onClick={() => setStatus('Approved')} className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#014582]/10 text-[#014582]">
                    Approve
                  </button>
                )}
                <button type="button" onClick={() => setStatus('Paid')} className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71]">
                  Mark paid
                </button>
              </div>
            </div>
          )}

          {locked && (
            <p className="text-center text-xs font-bold text-[#7A8FA6]">Paid — locked</p>
          )}
        </div>
      </div>
    </div>
  );
}
