'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell } from '../../ui';
import { hrCostCenterService, CostCenter } from '@/lib/hr-cost-center-service';
import { useCurrency } from '@/lib/currency-context';

export default function CostCenterReportsPage() {
  const { formatAmount } = useCurrency();
  const [centers, setCenters] = React.useState<CostCenter[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [selectedCc, setSelectedCc] = React.useState('');
  const [glRows, setGlRows] = React.useState<any[]>([]);

  React.useEffect(() => {
    hrCostCenterService.list({ includeInactive: true }).then(setCenters).catch(() => {});
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await hrCostCenterService.summaryReport({ period: period || undefined, from: from || undefined, to: to || undefined });
      setRows(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const loadGl = async () => {
    if (!selectedCc) return;
    try {
      const data = await hrCostCenterService.glReport({ costCenterId: selectedCc, from: from || undefined, to: to || undefined });
      setGlRows(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load GL report');
    }
  };

  React.useEffect(() => {
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, from, to]);

  React.useEffect(() => {
    void loadGl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCc, from, to]);

  return (
    <HRPage>
      <HRPageHeader title="Cost Center Reports" subtitle="Payroll and GL analytics by cost center" backHref="/hr/cost-centers" />

      <HRCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Payroll period (YYYY-MM)" className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
          <select value={selectedCc} onChange={(e) => setSelectedCc(e.target.value)} className="rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm">
            <option value="">GL detail: select cost center</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      </HRCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <HRCard title="Cost Center Summary">
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
          ) : (
            <HRTable columns={['Code', 'Employees', 'Payroll', 'GL Debit', 'GL Credit']}>
              {rows.map((r) => (
                <HRTableRow key={r.id}>
                  <HRTableCell className="font-bold">{r.code}</HRTableCell>
                  <HRTableCell>{r.employees}</HRTableCell>
                  <HRTableCell>{formatAmount(r.payrollCost)}</HRTableCell>
                  <HRTableCell>{formatAmount(r.glDebit)}</HRTableCell>
                  <HRTableCell>{formatAmount(r.glCredit)}</HRTableCell>
                </HRTableRow>
              ))}
            </HRTable>
          )}
        </HRCard>

        <HRCard title="Cost Center General Ledger">
          {!selectedCc ? (
            <p className="text-sm text-[#7A8FA6] py-6">Select a cost center to view posted journal lines.</p>
          ) : (
            <HRTable columns={['Date', 'Entry', 'Account', 'Debit', 'Credit', 'Balance']}>
              {glRows.map((r, i) => (
                <HRTableRow key={`${r.entryNumber}-${i}`}>
                  <HRTableCell>{new Date(r.date).toLocaleDateString()}</HRTableCell>
                  <HRTableCell className="font-mono text-xs">{r.entryNumber}</HRTableCell>
                  <HRTableCell>{r.accountName}</HRTableCell>
                  <HRTableCell>{formatAmount(r.debit)}</HRTableCell>
                  <HRTableCell>{formatAmount(r.credit)}</HRTableCell>
                  <HRTableCell>{formatAmount(r.balance)}</HRTableCell>
                </HRTableRow>
              ))}
            </HRTable>
          )}
        </HRCard>
      </div>
    </HRPage>
  );
}
