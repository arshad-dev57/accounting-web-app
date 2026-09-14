'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  Loader2,
  Play,
  ShieldCheck,
  Banknote,
  Search,
  Save,
  ExternalLink,
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
} from '../../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

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
  const attendanceCut = Number(
    ded.attendanceCut ?? Number(ded.unpaidLeave || 0) + Number(ded.late || 0)
  );
  const noSaleCut = Number(ded.noSaleCut || b.noSaleCut || 0);
  const other =
    Number(ded.loan || 0) +
    Number(ded.otherCut || 0) +
    Number(ded.tax || 0) +
    Number(ded.eobi || 0) +
    Number(ded.providentFund || 0);
  return {
    b,
    earn,
    ded,
    basic,
    allowances,
    package: Number(b.package ?? row.package ?? row.salary ?? 0),
    commission,
    salesAmount: Number(b.salesAmount || row.salesAmount || 0),
    salesCommissionPct: Number(b.salesCommissionPct || 5),
    attendanceCut,
    noSaleCut,
    otherCuts: other,
    net: Number(row.net || 0),
  };
}

export default function SalesPayrollPage() {
  const [period, setPeriod] = React.useState(currentPeriod());
  const [payDate, setPayDate] = React.useState('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [commissionPct, setCommissionPct] = React.useState(5);
  const [noSaleCutDefault, setNoSaleCutDefault] = React.useState(0);
  const [periodLabel, setPeriodLabel] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [draftSales, setDraftSales] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState('');

  const load = React.useCallback(async (p = period) => {
    setLoading(true);
    try {
      const [payroll, runData, settings] = await Promise.all([
        hrWorkforceService.payroll(p),
        hrWorkforceService.getPayrollRun(p).catch(() => ({})),
        hrWorkforceService.settings().catch(() => ({})),
      ]);
      const salesRows = (payroll.items || []).filter(
        (r: any) =>
          r.isSalesRole ||
          /sales|field/i.test(`${r.employeeType || ''} ${r.designation || ''}`)
      );
      setRows(salesRows);
      setPeriod(payroll.period || p);
      setPeriodLabel(payroll.periodLabel || '');
      if (runData?.payDate) setPayDate(runData.payDate);
      setCommissionPct(Number((settings as any).salesCommissionPct || 5));
      setNoSaleCutDefault(Number((settings as any).noSaleCutAmount || 0));
      const drafts: Record<string, string> = {};
      salesRows.forEach((r: any) => {
        drafts[r.id] = String(slipParts(r).salesAmount || '');
      });
      setDraftSales(drafts);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    void load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePeriod = async (next: string) => {
    setPeriod(next);
    await load(next);
  };

  const calculate = async () => {
    setBusy('generate');
    try {
      await hrWorkforceService.generatePayroll(period, 'sales');
      toast.success('Sales payroll calculated — enter sales amounts below');
      await load(period);
    } catch (e: any) {
      toast.error(e.message || 'Calculate failed');
    } finally {
      setBusy('');
    }
  };

  const saveSalesRow = async (row: any) => {
    const sales = Number(draftSales[row.id] || 0);
    const p = slipParts(row);
    const commission = Math.round(((sales * commissionPct) / 100) * 100) / 100;
    const noSaleCut = sales > 0 || commission > 0 ? 0 : noSaleCutDefault;
    // Keep basic from slip; if missing, use package / profile salary
    const basic =
      p.basic > 0 ? p.basic : p.package > 0 ? p.package : Number(row.salary || 0);
    // Preserve all existing deduction values from the slip (don't overwrite HR-set fields)
    const existingDed = p.ded;

    setSavingId(row.id);
    try {
      const next = await hrWorkforceService.updatePayroll(row.id, {
        manual: true,
        autoCommission: true,
        salesAmount: sales,
        commission,
        noSaleCut,
        basic,
        houseAllowance: Number(p.earn.houseAllowance || 0),
        transportAllowance: Number(p.earn.transportAllowance || 0),
        medicalAllowance: Number(p.earn.medicalAllowance || 0),
        allowances: p.allowances,
        overtime: Number(p.earn.overtime || 0),
        bonus: Number(p.earn.bonus || 0),
        attendanceCut: p.attendanceCut,
        loan: Number(existingDed.loan || 0),
        otherCut: Number(existingDed.otherCut || 0),
        // Preserve statutory — engine will recompute on recalc, but keep HR overrides
        incomeTax: Number(existingDed.incomeTax ?? existingDed.tax ?? 0),
        tax: Number(existingDed.incomeTax ?? existingDed.tax ?? 0),
        eobi: Number(existingDed.eobi || 0),
        providentFund: Number(existingDed.providentFund || 0),
        notes: sales > 0 ? `Sales Rs ${sales} → commission Rs ${commission} (${commissionPct}%)` : 'No sales this period',
      });
      setRows((list) => list.map((r) => (r.id === next.id ? next : r)));
      toast.success(`${row.employee}: commission saved`);
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingId('');
    }
  };

  const bulk = async (status: string) => {
    if (status === 'Paid' && !payDate) {
      toast.error('Select a pay date first');
      return;
    }
    setBusy(status);
    try {
      // mode='sales' ensures only sales staff are updated, not office staff
      await hrWorkforceService.bulkPayrollStatus(period, status, status === 'Paid' ? payDate : undefined, 'sales');
      toast.success(status === 'Paid' ? 'Paid & loan balances updated' : `Status → ${status}`);
      await load(period);
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
    } finally {
      setBusy('');
    }
  };

  const filtered = rows.filter((r) =>
    `${r.employee} ${r.employeeCode}`.toLowerCase().includes(query.toLowerCase())
  );
  const totalNet = filtered.reduce((s, r) => s + Number(r.net || 0), 0);
  const totalComm = filtered.reduce((s, r) => s + slipParts(r).commission, 0);
  const totalBasic = filtered.reduce((s, r) => s + slipParts(r).basic, 0);

  return (
    <HRPage>
      <HRPageHeader
        title="Sales payroll"
        subtitle={periodLabel ? `${periodLabel} · ${rows.length} sales staff` : 'Basic + sales commission'}
        backHref="/hr/payroll"
        actions={
          <Link
            href="/hr/payroll"
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
          >
            Office payroll <ExternalLink className="w-3 h-3" />
          </Link>
        }
      />

      <HRWorkflowNotice
        title="Sales staff flow (separate from office payroll)"
        detail={`1) Calculate sales payroll (loads basic salary from profile). 2) Enter sales amount on each row → Save (commission = ${commissionPct}% auto). 3) If sales = 0, no-sale cut can apply. 4) Approve → Mark paid.`}
      />

      <HRCard title="Month & calculate">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
            Pay date
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#DDE4EE] px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={calculate}
            disabled={!!busy}
            className="inline-flex items-center justify-center gap-2 bg-[#014582] text-white rounded-xl py-2.5 px-4 text-sm font-bold disabled:opacity-60"
          >
            {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {rows.length ? 'Recalculate basics' : 'Calculate sales payroll'}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-[#7A8FA6]">
          Commission rate: <b>{commissionPct}%</b> · No-sale cut default:{' '}
          <b>{pkr(noSaleCutDefault)}</b> · Change in{' '}
          <Link href="/hr/settings" className="text-[#014582] font-bold">
            HR Settings
          </Link>
        </p>
      </HRCard>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <HRStatCard label="Sales staff" value={filtered.length} icon={Wallet} color={COLORS.primary} />
            <HRStatCard label="Total basic" value={pkr(totalBasic)} icon={Wallet} color={COLORS.warning} />
            <HRStatCard label="Total commission" value={pkr(totalComm)} icon={Banknote} color={COLORS.success} />
            <HRStatCard label="Net payable" value={pkr(totalNet)} icon={Banknote} color={COLORS.primary} />
          </div>

          {rows.length > 0 && (
            <div className="bg-white border border-[#DDE4EE] rounded-2xl p-4 mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!busy}
                onClick={() => bulk('Approved')}
                className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#014582]/10 text-[#014582] inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Approve all
              </button>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => bulk('Paid')}
                className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#2ECC71]/10 text-[#2ECC71] inline-flex items-center gap-1"
              >
                <Banknote className="w-3.5 h-3.5" /> Mark paid
              </button>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search salesman…"
              className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm border border-[#DDE4EE]"
            />
          </div>

          <HRCard title="Sales staff — enter sales, save commission">
            {rows.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-[#1A1A2E]">No sales slips yet</p>
                <p className="text-xs text-[#7A8FA6] mt-1 mb-4">
                  Click <b>Calculate sales payroll</b> to load basic salary for Salesman / Field staff.
                </p>
                <button
                  type="button"
                  onClick={calculate}
                  className="inline-flex items-center gap-2 bg-[#014582] text-white px-4 py-2.5 rounded-xl text-sm font-bold"
                >
                  <Play className="w-4 h-4" /> Calculate now
                </button>
              </div>
            ) : (
              <HRTable
                columns={['Employee', 'Basic', 'Sales (enter)', 'Commission', 'No-sale cut', 'Net', 'Status', '']}
              >
                {filtered.map((row) => {
                  const p = slipParts(row);
                  const draft = draftSales[row.id] ?? String(p.salesAmount || '');
                  const liveComm = Math.round(((Number(draft || 0) * commissionPct) / 100) * 100) / 100;
                  const locked = row.status === 'Paid';
                  return (
                    <HRTableRow key={row.id}>
                      <HRTableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          <HRAvatar name={row.employee} />
                          <span>
                            {row.employee}
                            <span className="block text-[10px] font-semibold text-[#7A8FA6]">
                              {row.employeeCode} · {row.employeeType || 'Sales'}
                              {p.package > 0 ? ` · Package ${pkr(p.package)}` : ''}
                            </span>
                          </span>
                        </div>
                      </HRTableCell>
                      <HRTableCell className="font-bold text-[#014582]">
                        {pkr(p.basic > 0 ? p.basic : p.package || row.salary || 0)}
                      </HRTableCell>
                      <HRTableCell>
                        <input
                          type="number"
                          min={0}
                          disabled={locked}
                          value={draft}
                          onChange={(e) =>
                            setDraftSales((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          className="w-28 rounded-lg border border-[#DDE4EE] px-2 py-1.5 text-sm disabled:opacity-50"
                          placeholder="0"
                        />
                      </HRTableCell>
                      <HRTableCell className="text-[#2ECC71] font-bold">
                        {pkr(locked ? p.commission : liveComm)}
                        <span className="block text-[9px] text-[#7A8FA6] font-semibold">
                          {commissionPct}% of sales
                        </span>
                      </HRTableCell>
                      <HRTableCell className="text-[#E74C3C]">
                        {pkr(
                          locked
                            ? p.noSaleCut
                            : Number(draft || 0) > 0
                              ? 0
                              : noSaleCutDefault
                        )}
                      </HRTableCell>
                      <HRTableCell className="font-extrabold">{pkr(p.net)}</HRTableCell>
                      <HRTableCell>
                        <HRStatusBadge status={row.status} />
                      </HRTableCell>
                      <HRTableCell>
                        {!locked && (
                          <button
                            type="button"
                            disabled={savingId === row.id}
                            onClick={() => void saveSalesRow(row)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#014582] text-white inline-flex items-center gap-1 disabled:opacity-60"
                          >
                            {savingId === row.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Save
                          </button>
                        )}
                      </HRTableCell>
                    </HRTableRow>
                  );
                })}
              </HRTable>
            )}
          </HRCard>
        </>
      )}
    </HRPage>
  );
}
