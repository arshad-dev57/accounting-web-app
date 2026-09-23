'use client';

import React from 'react';
import Link from 'next/link';
import {
  Award,
  Wallet,
  Loader2,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRStatusBadge,
  HRWorkflowNotice,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRAvatar,
} from '../../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import { pkr } from '@/lib/hr-payroll-slip-utils';

function currentPeriodKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CommissionManagementPage() {
  const [period, setPeriod] = React.useState(currentPeriodKey());
  const [bonuses, setBonuses] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    employeeId: '',
    salesAmount: '',
    commissionPct: '5',
    notes: '',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [bList, eList] = await Promise.all([
        hrHcmService.bonuses().catch(() => []),
        hrEmployeesService.list().catch(() => []),
      ]);
      setBonuses(Array.isArray(bList) ? bList.filter((b: any) => b.kind === 'sales' || b.kind === 'commission') : []);
      setEmployees(eList);
    } catch (err: any) {
      toast.error(err.message || 'Failed loading commission records');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.salesAmount) {
      toast.error('Select sales employee and enter total sales volume');
      return;
    }
    const salesVolume = Number(form.salesAmount);
    const pct = Number(form.commissionPct || 5);
    const calculatedCommission = Math.round(((salesVolume * pct) / 100) * 100) / 100;

    setSaving(true);
    try {
      await hrHcmService.saveBonus({
        employeeId: form.employeeId,
        kind: 'sales',
        salesAmount: salesVolume,
        amount: calculatedCommission,
        period,
        reason: form.notes || `Sales Commission (${pct}%)`,
      });
      toast.success(`Commission of ${pkr(calculatedCommission)} recorded for ${period}`);
      setForm({ employeeId: '', salesAmount: '', commissionPct: '5', notes: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed recording commission');
    } finally {
      setSaving(false);
    }
  };

  const totalCommissionRecorded = bonuses.reduce((s, b) => s + Number(b.amount || 0), 0);

  return (
    <HRPage>
      <HRPageHeader
        title="Sales Commission Management"
        subtitle="Record and calculate sales commission compensation inputs for unified payroll processing."
        backHref="/hr/payroll/dashboard"
        actions={
          <Link
            href="/hr/payroll/run"
            className="px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-extrabold shadow-md hover:bg-white/90 transition-all flex items-center gap-1.5"
          >
            Unified Payroll Processing <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <HRWorkflowNotice
        title="Unified Payroll Integration"
        detail="Sales staff use the exact same canonical payroll process (/hr/payroll/run). Commission entries recorded here flow directly into employee gross earnings during payroll calculation, eliminating duplicate payroll runs."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Entry Form */}
        <HRCard title="Record Sales Commission Input">
          <form onSubmit={handleRecordCommission} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Pay Period</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Sales Employee</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                required
              >
                <option value="">Select Sales Employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.employeeCode} ({emp.department || 'Sales'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Sales Total (PKR)</label>
                <input
                  type="number"
                  value={form.salesAmount}
                  onChange={(e) => setForm({ ...form, salesAmount: e.target.value })}
                  placeholder="e.g. 500000"
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Commission %</label>
                <input
                  type="number"
                  value={form.commissionPct}
                  onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
                  placeholder="5"
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  required
                />
              </div>
            </div>

            {Number(form.salesAmount) > 0 && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-extrabold text-[#014582] flex justify-between">
                <span>Calculated Commission:</span>
                <span>{pkr(Math.round(((Number(form.salesAmount) * Number(form.commissionPct || 5)) / 100) * 100) / 100)}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Notes / Target Details</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Monthly sales target bonus..."
                className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[#014582] text-white font-extrabold text-xs shadow-md hover:bg-[#013a6b] transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Record Commission Input
            </button>
          </form>
        </HRCard>

        {/* Commission Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <HRStatCard label="Commission Entries" value={bonuses.length} icon={Award} color="#014582" />
            <HRStatCard label="Total Commission Payable" value={pkr(totalCommissionRecorded)} icon={Wallet} color="#2ECC71" />
          </div>

          <HRCard title="Active Sales Commission Inputs for Payroll">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
            ) : bonuses.length === 0 ? (
              <p className="py-12 text-center text-xs text-[#7A8FA6]">No sales commission records for this period.</p>
            ) : (
              <HRTable columns={['Sales Employee', 'Period', 'Commission Amount', 'Status']}>
                {bonuses.map((b, idx) => (
                  <HRTableRow key={b.id || idx}>
                    <HRTableCell><span className="font-extrabold text-[#1A1A2E]">{b.employee || 'Staff'}</span></HRTableCell>
                    <HRTableCell><span className="text-xs text-[#7A8FA6]">{b.period || period}</span></HRTableCell>
                    <HRTableCell><span className="font-extrabold text-[#2ECC71]">{pkr(b.amount || 0)}</span></HRTableCell>
                    <HRTableCell><HRStatusBadge status={b.status || 'Pending'} /></HRTableCell>
                  </HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      </div>
    </HRPage>
  );
}
