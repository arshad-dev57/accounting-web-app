'use client';

import React from 'react';
import Link from 'next/link';
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
  CalendarDays,
  Plus,
  UserPlus,
  ExternalLink,
  AlertTriangle,
  Info,
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
import { hrEmployeesService } from '@/lib/hr-employees-service';

const COLORS = { success: '#2ECC71', warning: '#F39C12', danger: '#E74C3C', primary: '#014582' };
const pkr = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  const noSaleCut = Number(ded.noSaleCut || b.noSaleCut || 0);
  const incomeTax = Number(ded.incomeTax ?? ded.tax ?? 0);
  const eobi = Number(ded.eobi || 0);
  const pf = Number(ded.providentFund || 0);
  const statutory = incomeTax + eobi + pf;
  return {
    b,
    earn,
    ded,
    basic,
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
    otherDeductions: loan + otherCut + noSaleCut + statutory,
    salesAmount: Number(b.salesAmount || 0),
    salesCommissionPct: Number(b.salesCommissionPct || 0),
    gross: Number(earn.gross ?? basic + allowances + commission + overtime + bonus),
    net: Number(row.net || 0),
    isOnProbation: Boolean(b.isOnProbation),
    proRata: Number(b.proRata ?? 1),
  };
}

function isSalesLike(row: any) {
  return row.isSalesRole || /sales|salesman/i.test(`${row.employeeType || ''} ${row.designation || ''}`);
}

export default function PayrollPage() {
  const [period, setPeriod] = React.useState(currentPeriod());
  const [payDate, setPayDate] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState<any>({});
  const [periodLabel, setPeriodLabel] = React.useState('');
  const [settings, setSettings] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<any | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [empOptions, setEmpOptions] = React.useState<any[]>([]);
  const [addId, setAddId] = React.useState('');
  const [addBlank, setAddBlank] = React.useState(false);
  const [recalcWarn, setRecalcWarn] = React.useState(false);

  const load = React.useCallback(async (p = period) => {
    setLoading(true);
    try {
      const [payroll, runData, cfg] = await Promise.all([
        hrWorkforceService.payroll(p),
        hrWorkforceService.getPayrollRun(p).catch(() => ({})),
        hrWorkforceService.settings().catch(() => ({})),
      ]);
      setRows((payroll.items || []).filter((r: any) => !isSalesLike(r)));
      setPeriod(payroll.period || p);
      setPeriodLabel(payroll.periodLabel || '');
      setSummary(payroll.summary || {});
      setSettings(cfg);
      if ((runData as any)?.payDate) setPayDate((runData as any).payDate);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => { void load(period); }, []); 

  const changePeriod = async (next: string) => {
    setPeriod(next);
    await load(next);
  };

  const savePayDate = async () => {
    setBusy('payDate');
    try {
      await hrWorkforceService.savePayrollRun({ period, payDate: payDate || undefined });
      toast.success(payDate ? 'Pay date saved' : 'Month saved');
    } catch (e: any) { toast.error(e.message || 'Could not save'); }
    finally { setBusy(''); }
  };

  const doGenerate = async () => {
    setBusy('generate');
    try {
      const result = await hrWorkforceService.generatePayroll(period, 'office');
      const officeItems = (result.items || []).filter((r: any) => !isSalesLike(r));
      setRows(officeItems);
      setPeriod(result.period || period);
      setPeriodLabel(result.periodLabel || '');
      setSummary(result.summary || {});
      toast.success(`${officeItems.length} office slips ready`);
      setRecalcWarn(false);
      await load(period);
    } catch (error: any) { toast.error(error.message || 'Calculate failed'); }
    finally { setBusy(''); }
  };

  const generate = async () => {
    const hasApproved = rows.some((r) => ['Approved', 'Paid'].includes(r.status));
    if (hasApproved && !recalcWarn) {
      setRecalcWarn(true);
      toast('Some slips are Approved/Paid — click Recalculate again to confirm override', { icon: '⚠️' });
      return;
    }
    await doGenerate();
  };

  const bulk = async (status: string) => {
    if (status === 'Paid' && !payDate) { toast.error('Select a pay date first'); return; }
    setBusy(status);
    try {
      const result = await hrWorkforceService.bulkPayrollStatus(period, status, status === 'Paid' ? payDate : undefined, 'office');
      setRows((result.items || []).filter((r: any) => !isSalesLike(r)));
      setSummary(result.summary || {});
      toast.success(status === 'Paid' ? `Paid & loan balances updated` : `Status → ${status}`);
      await load(period);
    } catch (error: any) { toast.error(error.message || 'Update failed'); }
    finally { setBusy(''); }
  };

  const openAdd = async () => {
    setShowAdd(true);
    setAddId('');
    try {
      const list = await hrEmployeesService.list();
      const have = new Set(rows.map((r) => r.employeeId));
      setEmpOptions(
        list.filter(
          (e) =>
            !['terminated', 'inactive'].includes(String(e.status).toLowerCase()) &&
            !have.has(e.id)
        )
      );
    } catch { setEmpOptions([]); }
  };

  const createSlip = async () => {
    if (!addId) { toast.error('Select an employee'); return; }
    setBusy('create');
    try {
      const next = await hrWorkforceService.createPayrollItem({ employeeId: addId, period, blank: addBlank });
      toast.success('Payslip created');
      setShowAdd(false);
      await load(period);
      setSelected(next);
    } catch (e: any) { toast.error(e.message || 'Create failed'); }
    finally { setBusy(''); }
  };

  const exportCsv = () => {
    const header = [
      'Employee', 'Code', 'Department', 'Designation', 'Pay Basis',
      'Package', 'Basic', 'Allowances', 'OT', 'Bonus', 'Commission',
      'Gross', 'Attendance Cut', 'Loan', 'Tax (FBR)', 'EOBI', 'PF',
      'Other Cut', 'Total Deductions', 'Net', 'Status', 'Probation', 'Pay Date'
    ];
    const lines = rows.map((r) => {
      const p = slipParts(r);
      const b = r.breakdown || {};
      return [
        `"${r.employee}"`, r.employeeCode, `"${r.department || ''}"`, `"${r.designation || ''}"`,
        b.payBasis || 'monthly',
        p.b.package ?? r.salary ?? 0, p.basic, p.allowances, p.overtime, p.bonus, p.commission,
        p.gross,
        p.attendanceCut, p.loan, p.incomeTax, p.eobi, p.pf,
        p.otherCut, p.attendanceCut + p.otherDeductions, p.net,
        r.status, p.isOnProbation ? 'Yes' : 'No', payDate || ''
      ].join(',');
    });
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `payroll-office-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rows.filter((r) =>
    `${r.employee} ${r.employeeCode} ${r.department || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const hasApproved = rows.some((r) => r.status === 'Approved');
  const allPaid = rows.length > 0 && rows.every((r) => r.status === 'Paid');

  return (
    <HRPage>
      <HRPageHeader
        title="Office payroll"
        subtitle={periodLabel ? `${periodLabel} · ${rows.length} staff` : 'Office / non-sales staff salary'}
        backHref="/hr/dashboard"
        actions={
          <Link
            href="/hr/payroll/sales"
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
          >
            Sales payroll <ExternalLink className="w-3 h-3" />
          </Link>
        }
      />

      <HRWorkflowNotice
        title="Office staff payroll"
        detail="This page covers office, delivery, and non-sales staff. Sales and field staff → use Sales payroll. Tax is computed via FBR income-tax slabs. EOBI = Rs. 370/month. Loan balances auto-deduct and reduce on Mark Paid."
      />

      <HRCard title="Month & controls">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <label className="block text-xs font-bold text-[#7A8FA6]">
            Salary month
            <input
              type="month"
              value={period}
              onChange={(e) => void changePeriod(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-xs font-bold text-[#7A8FA6]">
            Pay date (optional)
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              onBlur={() => void savePayDate()}
              className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={!!busy}
            className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold disabled:opacity-60 ${recalcWarn ? 'bg-[#F39C12] text-white' : 'bg-[#014582] text-white'}`}
          >
            {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : recalcWarn ? <AlertTriangle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {recalcWarn ? 'Confirm recalculate' : rows.length ? 'Recalculate' : 'Calculate payroll'}
          </button>
          <button
            type="button"
            onClick={() => void openAdd()}
            disabled={!!busy}
            className="inline-flex items-center justify-center gap-2 border border-[#014582] text-[#014582] rounded-xl py-2.5 px-4 text-sm font-bold"
          >
            <UserPlus className="w-4 h-4" /> Add employee slip
          </button>
        </div>
        {settings?.taxMode !== 'flat' && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-[#7A8FA6]">
            <Info className="w-3.5 h-3.5" />
            Tax: FBR income-tax slabs (2024-25) · EOBI: Rs. {settings?.eobiAmount ?? 370}/month fixed ·
            PF: {settings?.pfPct ?? 0}% of basic
          </p>
        )}
      </HRCard>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <HRStatCard label="Employees" value={summary.headcount || rows.length} icon={Wallet} color={COLORS.primary} hint={periodLabel} />
            <HRStatCard label="Net payable" value={pkr(summary.net || 0)} icon={Banknote} color={COLORS.success} />
            <HRStatCard label="Total deductions" value={pkr(summary.deductions || 0)} icon={Wallet} color={COLORS.danger} />
            <HRStatCard label="Pay date" value={payDate || '—'} icon={CalendarDays} color={COLORS.warning} />
          </div>

          {rows.length > 0 && (
            <div className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-4 flex flex-wrap gap-2 items-center">
              <button
                type="button"
                disabled={!!busy || allPaid}
                onClick={() => bulk('Approved')}
                className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#014582]/10 text-[#014582] inline-flex items-center gap-1 disabled:opacity-40"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Approve all
              </button>
              <button
                type="button"
                disabled={!!busy || allPaid || !hasApproved}
                onClick={() => bulk('Paid')}
                className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71] inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Banknote className="w-3.5 h-3.5" /> Mark paid
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#014582] inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => rows.forEach((r, i) => window.setTimeout(() => printPayslip(r, payDate, settings), i * 500))}
                className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#014582] inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print all
              </button>
              {allPaid && (
                <span className="ml-auto text-[10px] font-bold text-[#2ECC71] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> All paid — period locked
                </span>
              )}
            </div>
          )}

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee…"
              className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm border border-[#DDE4EE]"
            />
          </div>

          <HRCard
            title="Salary sheet"
            action={<span className="text-[10px] font-bold text-[#7A8FA6]">{filtered.length} employees</span>}
          >
            {rows.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-[#1A1A2E]">No payslips yet</p>
                <p className="text-xs text-[#7A8FA6] mt-1 mb-4">Click Calculate to generate slips from attendance, leave, and loan data.</p>
                <button type="button" onClick={generate} disabled={!!busy}
                  className="inline-flex items-center gap-2 bg-[#014582] text-white px-4 py-2.5 rounded-xl text-sm font-bold">
                  <Play className="w-4 h-4" /> Calculate now
                </button>
              </div>
            ) : (
              <HRTable columns={['Employee', 'Basic', 'Gross', 'Deductions', 'Net', 'Status', 'Actions']}>
                {filtered.map((row) => {
                  const p = slipParts(row);
                  return (
                    <HRTableRow key={row.id}>
                      <HRTableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          <HRAvatar name={row.employee} />
                          <span>
                            {row.employee}
                            <span className="block text-[10px] font-semibold text-[#7A8FA6]">
                              {row.employeeCode}
                              {row.department ? ` · ${row.department}` : ''}
                              {p.isOnProbation ? ' · 🔶 Probation' : ''}
                              {p.proRata < 1 ? ` · ${Math.round(p.proRata * 100)}% pro-rata` : ''}
                              {p.b.hrManual ? ' · HR edited' : ''}
                            </span>
                          </span>
                        </div>
                      </HRTableCell>
                      <HRTableCell className="font-bold">{pkr(p.basic)}</HRTableCell>
                      <HRTableCell>{pkr(p.gross)}</HRTableCell>
                      <HRTableCell className="text-[#E74C3C]">
                        <span>{pkr(p.attendanceCut + p.otherDeductions)}</span>
                        {p.incomeTax > 0 && (
                          <span className="block text-[9px] text-[#7A8FA6]">Tax {pkr(p.incomeTax)}</span>
                        )}
                      </HRTableCell>
                      <HRTableCell className="font-extrabold text-[#014582]">{pkr(p.net)}</HRTableCell>
                      <HRTableCell><HRStatusBadge status={row.status} /></HRTableCell>
                      <HRTableCell>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setSelected(row)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#014582] text-white inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            {row.status === 'Paid' ? 'View' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => printPayslip(row, payDate, settings)}
                            className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#F0F4F8] text-[#014582]"
                            title="Print payslip"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </HRTableCell>
                    </HRTableRow>
                  );
                })}
              </HRTable>
            )}
          </HRCard>
        </>
      )}

      {selected && (
        <BuildSalaryDrawer
          slip={selected}
          payDate={payDate}
          settings={settings}
          onClose={() => setSelected(null)}
          onSaved={(next) => {
            setSelected(next);
            setRows((list) => list.map((r) => (r.id === next.id ? next : r)));
          }}
        />
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-extrabold text-[#1A1A2E] mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#014582]" /> Add employee salary
            </h3>
            <p className="text-xs text-[#7A8FA6] mb-4">Create a payslip for an employee in {period}.</p>
            <select
              className="w-full rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm mb-3"
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
            >
              <option value="">Select employee…</option>
              {empOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs font-bold text-[#1A1A2E] mb-4">
              <input type="checkbox" checked={addBlank} onChange={(e) => setAddBlank(e.target.checked)} />
              Blank slip (HR enters all amounts manually)
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6]">Cancel</button>
              <button
                type="button"
                onClick={() => void createSlip()}
                disabled={!!busy || !addId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#014582] text-white disabled:opacity-60"
              >
                {busy === 'create' ? '…' : 'Create & open'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFESSIONAL PAYSLIP PRINT (popup)
// ─────────────────────────────────────────────────────────────
function printPayslip(slip: any, payDate?: string, settings?: any) {
  const p = slipParts(slip);
  const b = slip.breakdown || {};
  const win = window.open('', '_blank', 'width=860,height=1150');
  if (!win) return;
  const paid = slip.paidAt ? String(slip.paidAt).slice(0, 10) : payDate || 'Pending';
  const rows = (items: [string, string | number][]) =>
    items.map(([label, val]) =>
      `<tr><td>${label}</td><td style="text-align:right;font-weight:600">${typeof val === 'number' ? pkr(val) : val}</td></tr>`
    ).join('');

  win.document.write(`<!doctype html><html><head><title>Payslip · ${slip.employee} · ${slip.period}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1A1A2E;background:#fff;padding:40px}
    .wrap{max-width:720px;margin:0 auto}
    .header{background:#014582;color:#fff;padding:20px 24px;border-radius:12px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
    .header h1{font-size:18px;font-weight:800;margin-bottom:2px}
    .header .sub{font-size:12px;opacity:0.8}
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
    .net-bar{background:#014582;color:#fff;padding:16px 20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}
    .net-bar .label{font-size:13px;font-weight:600;opacity:0.9}
    .net-bar .amount{font-size:26px;font-weight:800}
    .statutory{font-size:10px;color:#7A8FA6;margin-top:14px;text-align:center}
    .footer{margin-top:28px;border-top:1px solid #EEF2F7;padding-top:16px;display:flex;justify-content:space-between}
    .footer .sig{width:180px;border-top:1px solid #1A1A2E;padding-top:6px;font-size:10px;color:#7A8FA6;text-align:center}
    .flag{display:inline-block;background:#FFF3CD;color:#B7791F;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin-left:4px}
    @media print{body{padding:20px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.net-bar{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="wrap">
  <div class="header">
    <div>
      <div class="sub">SALARY PAYSLIP</div>
      <h1>${slip.employee}${p.isOnProbation ? ' <span style="font-size:12px;opacity:0.8">(Probation)</span>' : ''}</h1>
      <div class="sub">${slip.designation || ''} ${slip.department ? '· ' + slip.department : ''}</div>
      <div class="sub" style="margin-top:4px">${slip.employeeCode || ''} ${slip.office ? '· ' + slip.office : ''}</div>
    </div>
    <div class="badge">
      <div style="opacity:0.8;font-size:10px">Period</div>
      <div>${slip.periodLabel || slip.period}</div>
      <div style="margin-top:4px;opacity:0.8;font-size:10px">Pay date</div>
      <div>${paid}</div>
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
      ['House rent allowance', p.earn.houseAllowance || 0],
      ['Transport allowance', p.earn.transportAllowance || 0],
      ['Medical allowance', p.earn.medicalAllowance || 0],
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
    ])}<tr class="subtotal"><td>Total deductions</td><td style="text-align:right">−${pkr(p.attendanceCut + p.otherDeductions)}</td></tr></table>
  </div>

  <div class="net-bar">
    <div>
      <div class="label">Net pay${p.proRata < 1 ? ' (pro-rated ' + Math.round(p.proRata*100) + '%)' : ''}</div>
      ${slip.bankAccount ? `<div style="font-size:11px;opacity:0.7;margin-top:2px">${slip.bankName || 'Bank'} · ${slip.bankAccount}</div>` : ''}
    </div>
    <div class="amount">${pkr(p.net)}</div>
  </div>

  ${p.isOnProbation ? '<div class="statutory">⚠️ Employee on probation — Provident Fund waived</div>' : ''}
  ${p.incomeTax > 0 ? `<div class="statutory">Income tax calculated on FBR graduated slabs (2024-25) · Monthly gross Rs. ${pkr(p.gross)} → annualized</div>` : ''}
  ${p.eobi > 0 ? `<div class="statutory">EOBI employee contribution Rs. ${p.eobi} · Employer contribution Rs. ${p.b.provisions?.eobiEmployer ?? 1110} (employer liability)</div>` : ''}

  <div class="footer">
    <div class="sig">Employee signature</div>
    <div class="sig">HR / Finance officer</div>
    <div class="sig">Authorized by</div>
  </div>
  ${slip.notes ? `<p style="margin-top:16px;font-size:11px;color:#7A8FA6">Notes: ${slip.notes}</p>` : ''}
  </div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ─────────────────────────────────────────────────────────────
// EDIT SALARY DRAWER
// ─────────────────────────────────────────────────────────────
function BuildSalaryDrawer({
  slip,
  payDate,
  settings,
  onClose,
  onSaved,
}: {
  slip: any;
  payDate?: string;
  settings?: any;
  onClose: () => void;
  onSaved: (row: any) => void;
}) {
  const parts = slipParts(slip);
  const [basic, setBasic] = React.useState(String(parts.basic || 0));
  const [houseAllowance, setHouseAllowance] = React.useState(String(parts.earn.houseAllowance || 0));
  const [transportAllowance, setTransportAllowance] = React.useState(String(parts.earn.transportAllowance || 0));
  const [medicalAllowance, setMedicalAllowance] = React.useState(String(parts.earn.medicalAllowance || 0));
  const [overtime, setOvertime] = React.useState(String(parts.overtime || 0));
  const [commission, setCommission] = React.useState(String(parts.commission || 0));
  const [bonus, setBonus] = React.useState(String(parts.bonus || 0));
  const [salesAmount, setSalesAmount] = React.useState(String(parts.salesAmount || 0));
  const [attendanceCut, setAttendanceCut] = React.useState(String(parts.attendanceCut || 0));
  const [loan, setLoan] = React.useState(String(parts.loan || 0));
  const [otherCut, setOtherCut] = React.useState(String(parts.otherCut || 0));
  const [noSaleCut, setNoSaleCut] = React.useState(String(parts.noSaleCut || 0));
  const [incomeTax, setIncomeTax] = React.useState(String(parts.incomeTax || 0));
  const [eobi, setEobi] = React.useState(String(parts.eobi || 0));
  const [pf, setPf] = React.useState(String(parts.pf || 0));
  const [notes, setNotes] = React.useState(String(slip.notes || ''));
  const [saving, setSaving] = React.useState(false);
  const [approvingPaid, setApprovingPaid] = React.useState<'Approved' | 'Paid' | ''>('');
  const [commissionPct, setCommissionPct] = React.useState(Number(parts.salesCommissionPct || settings?.salesCommissionPct || 5));

  React.useEffect(() => {
    const p = slipParts(slip);
    setBasic(String(p.basic || 0));
    setHouseAllowance(String(p.earn.houseAllowance || 0));
    setTransportAllowance(String(p.earn.transportAllowance || 0));
    setMedicalAllowance(String(p.earn.medicalAllowance || 0));
    setOvertime(String(p.overtime || 0));
    setCommission(String(p.commission || 0));
    setBonus(String(p.bonus || 0));
    setSalesAmount(String(p.salesAmount || 0));
    setAttendanceCut(String(p.attendanceCut || 0));
    setLoan(String(p.loan || 0));
    setOtherCut(String(p.otherCut || 0));
    setNoSaleCut(String(p.noSaleCut || 0));
    setIncomeTax(String(p.incomeTax || 0));
    setEobi(String(p.eobi || 0));
    setPf(String(p.pf || 0));
    setNotes(String(slip.notes || ''));
    setCommissionPct(Number(p.salesCommissionPct || settings?.salesCommissionPct || 5));
  }, [slip.id, slip.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const n = (v: string) => Number(v || 0);
  const totalAllowances = n(houseAllowance) + n(transportAllowance) + n(medicalAllowance);
  const liveGross = n(basic) + totalAllowances + n(overtime) + n(commission) + n(bonus);
  const liveCuts = n(attendanceCut) + n(loan) + n(otherCut) + n(noSaleCut) + n(incomeTax) + n(eobi) + n(pf);
  const liveNet = Math.max(0, liveGross - liveCuts);
  const locked = slip.status === 'Paid';

  const applySalesAuto = () => {
    const sales = n(salesAmount);
    const comm = Math.round(((sales * commissionPct) / 100) * 100) / 100;
    setCommission(String(comm));
    setNoSaleCut(sales > 0 || comm > 0 ? '0' : String(parts.noSaleCut || 0));
  };

  const buildPayload = () => ({
    manual: true,
    autoCommission: true,
    basic: n(basic),
    houseAllowance: n(houseAllowance),
    transportAllowance: n(transportAllowance),
    medicalAllowance: n(medicalAllowance),
    allowances: totalAllowances,
    overtime: n(overtime),
    commission: n(commission),
    bonus: n(bonus),
    salesAmount: n(salesAmount),
    attendanceCut: n(attendanceCut),
    loan: n(loan),
    otherCut: n(otherCut),
    noSaleCut: n(noSaleCut),
    incomeTax: n(incomeTax),
    tax: n(incomeTax), // backward compat
    eobi: n(eobi),
    providentFund: n(pf),
    notes,
  });

  const save = async (extraStatus?: string) => {
    setSaving(true);
    try {
      const payload = buildPayload();
      if (extraStatus) (payload as any).status = extraStatus;
      const next = await hrWorkforceService.updatePayroll(slip.id, payload);
      toast.success(extraStatus ? `Saved & ${extraStatus}` : 'Saved');
      onSaved(next);
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
      setApprovingPaid('');
    }
  };

  const field = (label: string, val: string, setVal: (v: string) => void, tone?: 'plus' | 'minus', hint?: string) => (
    <label className="block text-xs font-bold text-[#7A8FA6]">
      <span className={tone === 'plus' ? 'text-[#2ECC71]' : tone === 'minus' ? 'text-[#E74C3C]' : ''}>{label}</span>
      {hint && <span className="ml-1 font-normal normal-case text-[10px]">{hint}</span>}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        inputMode="decimal"
        disabled={locked}
        className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#F0F4F8] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#014582] px-5 py-4 flex items-start justify-between text-white sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Edit salary slip</p>
            <h2 className="text-lg font-extrabold">{slip.employee}</h2>
            <p className="text-xs text-white/80">
              {slip.periodLabel || slip.period} · {slip.designation || ''} {slip.department ? `· ${slip.department}` : ''}
            </p>
            {parts.isOnProbation && (
              <p className="text-[10px] mt-1 bg-yellow-400/20 text-yellow-200 rounded px-2 py-0.5 inline-block">On probation — PF waived</p>
            )}
            {parts.proRata < 1 && (
              <p className="text-[10px] mt-1 bg-orange-400/20 text-orange-200 rounded px-2 py-0.5 inline-block">
                {Math.round(parts.proRata * 100)}% pro-rated
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!locked && (
            <>
              {/* Earnings */}
              <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] space-y-3">
                <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">+ Earnings</p>
                {field('+ Basic salary', basic, setBasic, 'plus')}
                {field('+ House rent allowance', houseAllowance, setHouseAllowance, 'plus')}
                {field('+ Transport allowance', transportAllowance, setTransportAllowance, 'plus')}
                {field('+ Medical allowance', medicalAllowance, setMedicalAllowance, 'plus')}
                {field('+ Overtime', overtime, setOvertime, 'plus')}
                {field('+ Bonus', bonus, setBonus, 'plus')}
              </div>

              {/* Sales commission */}
              <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] space-y-3">
                <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">Sales / Commission (optional)</p>
                {field('Sales amount', salesAmount, setSalesAmount)}
                <button type="button" onClick={applySalesAuto} className="text-[11px] font-bold text-[#014582]">
                  Auto commission = sales × {commissionPct}%
                </button>
                {field('+ Commission', commission, setCommission, 'plus')}
                {field('− No-sale cut', noSaleCut, setNoSaleCut, 'minus')}
              </div>

              {/* Deductions */}
              <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">− Deductions</p>
                  <button
                    type="button"
                    className="text-[10px] font-bold text-[#E74C3C]"
                    onClick={() => { setAttendanceCut('0'); setLoan('0'); setOtherCut('0'); setNoSaleCut('0'); }}
                  >
                    Clear non-statutory
                  </button>
                </div>
                {field('− Attendance cut', attendanceCut, setAttendanceCut, 'minus',
                  `(auto: Rs ${parts.b.attendanceCutAuto ?? 0})`)}
                <button type="button" className="text-[11px] font-bold text-[#014582]"
                  onClick={() => setAttendanceCut('0')}>Reset attendance cut to 0</button>
                {field('− Loan installment', loan, setLoan, 'minus')}
                {field('− Other deduction', otherCut, setOtherCut, 'minus')}
              </div>

              {/* Statutory */}
              <div className="bg-white rounded-2xl p-4 border border-[#DDE4EE] space-y-3">
                <p className="text-[10px] font-bold text-[#7A8FA6] uppercase">Statutory (auto-computed — override only if needed)</p>
                {field('− Income tax (FBR slab)', incomeTax, setIncomeTax, 'minus', '(auto from gross)')}
                {field('− EOBI employee', eobi, setEobi, 'minus', `(default Rs ${settings?.eobiAmount ?? 370})`)}
                {field('− Provident fund', pf, setPf, 'minus', `(${settings?.pfPct ?? 0}% of basic)`)}
              </div>

              {/* Notes */}
              <label className="block text-xs font-bold text-[#7A8FA6] bg-white rounded-2xl p-4 border border-[#DDE4EE]">
                Notes
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
              </label>
            </>
          )}

          {/* Net summary */}
          <div className="bg-[#014582] text-white rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-2 text-xs opacity-80 mb-2">
              <span>Gross {pkr(liveGross)}</span>
              <span className="text-center">Cuts −{pkr(liveCuts)}</span>
              <span className="text-right">Tax {pkr(n(incomeTax))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">Net pay</span>
              <span className="text-2xl font-extrabold">{pkr(liveNet)}</span>
            </div>
          </div>

          {/* Action buttons */}
          {!locked ? (
            <div className="space-y-2 pb-6">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="w-full bg-[#014582] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
              >
                {saving && !approvingPaid ? 'Saving…' : 'Save changes'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => { setApprovingPaid('Approved'); await save('Approved'); }}
                  className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#014582]/10 text-[#014582] disabled:opacity-60"
                >
                  {saving && approvingPaid === 'Approved' ? '…' : 'Save & Approve'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => { setApprovingPaid('Paid'); await save('Paid'); onClose(); }}
                  className="flex-1 rounded-xl py-2 text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71] disabled:opacity-60"
                >
                  {saving && approvingPaid === 'Paid' ? '…' : 'Save & Mark Paid'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => printPayslip(slip, payDate, settings)}
                className="w-full rounded-xl py-2 text-[11px] font-bold bg-[#F0F4F8] text-[#014582] flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print payslip
              </button>
            </div>
          ) : (
            <div className="pb-6 space-y-2">
              <p className="text-center text-xs font-bold text-[#7A8FA6]">Paid — slip is locked</p>
              <button
                type="button"
                onClick={() => printPayslip(slip, payDate, settings)}
                className="w-full rounded-xl py-2 text-[11px] font-bold bg-[#F0F4F8] text-[#014582] flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print payslip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
