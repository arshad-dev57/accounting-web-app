'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRCard } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const DEFAULTS: Record<string, any> = {
  basicPct: 60,
  housePct: 25,
  transportPct: 10,
  medicalPct: 5,
  taxPct: 0,
  eobiPct: 1,
  pfPct: 0,
  lateDeductionPerDay: 500,
  absentDeductionMode: 'daily_rate',
  absentDeductionPerDay: 0,
  halfDayDeductionPct: 50,
  salesCommissionPct: 5,
  noSaleCutAmount: 0,
  noSaleCutRoles: 'Salesman,sales,Field Employee',
};

export type PayrollSettingsSection = 'all' | 'salary-structure' | 'deductions' | 'commission';

export function PayrollSettingsPanel({
  section = 'all',
  showSave = true,
}: {
  section?: PayrollSettingsSection;
  showSave?: boolean;
}) {
  const [enabled, setEnabled] = React.useState<Record<string, any>>(DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    hrWorkforceService
      .settings()
      .then((data) => setEnabled((p) => ({ ...p, ...data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const data = await hrWorkforceService.saveSettings(enabled);
      setEnabled((p) => ({ ...p, ...data }));
      toast.success('Payroll settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const num = (key: string) => (
    <input
      type="number"
      value={enabled[key] ?? ''}
      onChange={(e) => setEnabled((p) => ({ ...p, [key]: Number(e.target.value) }))}
      className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
    />
  );

  if (loading) {
    return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>;
  }

  const showCommission = section === 'all' || section === 'commission';
  const showDeductions = section === 'all' || section === 'deductions';
  const showSalaryStructure = section === 'all' || section === 'salary-structure';

  return (
    <div className="space-y-6">
      {showCommission && (
        <HRCard title="Sales commission & no-sale cut">
          <p className="text-xs text-[#7A8FA6] mb-4">
            Sales for sales staff are added as commission on the payslip. If sales are zero, a no-sale cut can apply.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Commission % of sales</label>
              {num('salesCommissionPct')}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">No-sale cut (Rs)</label>
              {num('noSaleCutAmount')}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Roles for no-sale cut</label>
              <input
                type="text"
                value={enabled.noSaleCutRoles ?? ''}
                onChange={(e) => setEnabled((p) => ({ ...p, noSaleCutRoles: e.target.value }))}
                className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE]"
              />
            </div>
          </div>
        </HRCard>
      )}

      {showDeductions && (
        <HRCard title="Salary deduction policy (auto on Calculate)">
          <p className="text-xs text-[#7A8FA6] mb-4">
            These amounts apply automatically when you Calculate payroll. HR can still edit cuts per payslip.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Late cut per day (Rs)</label>
              {num('lateDeductionPerDay')}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Absent / unpaid cut mode</label>
              <select
                value={enabled.absentDeductionMode || 'daily_rate'}
                onChange={(e) => setEnabled((p) => ({ ...p, absentDeductionMode: e.target.value }))}
                className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE]"
              >
                <option value="daily_rate">Daily rate (package ÷ working days)</option>
                <option value="fixed">Fixed Rs per absent day</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Fixed absent cut (Rs / day)</label>
              {num('absentDeductionPerDay')}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Half-day present credit %</label>
              {num('halfDayDeductionPct')}
            </div>
          </div>
        </HRCard>
      )}

      {showSalaryStructure && (
        <HRCard title="Salary structure & statutory">
          <p className="text-xs text-[#7A8FA6] mb-4">
            Employee package (profile salary) is split by these percentages. Tax / EOBI / PF apply on basic.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Basic % of package', key: 'basicPct' },
              { label: 'House rent allowance %', key: 'housePct' },
              { label: 'Transport allowance %', key: 'transportPct' },
              { label: 'Medical allowance %', key: 'medicalPct' },
              { label: 'Income tax % of basic', key: 'taxPct' },
              { label: 'EOBI % of basic', key: 'eobiPct' },
              { label: 'Provident fund % of basic', key: 'pfPct' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                {num(f.key)}
              </div>
            ))}
          </div>
        </HRCard>
      )}

      {showSave && (
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="bg-[#014582] hover:bg-[#014582]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save payroll settings'}
        </button>
      )}
    </div>
  );
}
