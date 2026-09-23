'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const TOGGLES = [
  { key: 'geofence', label: 'Auto Geofence Check-in', desc: 'Automatically check employees in when they enter the office geofence' },
  { key: 'autoCheckout', label: 'Auto Checkout', desc: 'Check employees out automatically when they leave the office radius' },
  { key: 'lateAlerts', label: 'Late Arrival Alerts', desc: 'Show late check-ins in Notifications' },
  { key: 'faceId', label: 'Face / Biometric Verification', desc: 'Require biometric verification on check-in (mobile setting)' },
  { key: 'weeklyReports', label: 'Weekly HR Report Email', desc: 'Email a weekly attendance summary to HR admins' },
];

const DEFAULTS: Record<string, any> = {
  geofence: true,
  autoCheckout: true,
  lateAlerts: true,
  faceId: false,
  weeklyReports: false,
  workHoursPerDay: 8,
  workDaysPerWeek: 6,
  overtimeMultiplier: 1.5,
  annualLeaveQuota: 14,
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
  graceMinutes: 15,
  lateThresholdMinutes: 15,
  earlyCheckoutMinutes: 30,
  minimumWorkingHours: 8,
  halfDayHours: 4,
  salesCommissionPct: 5,
  noSaleCutAmount: 0,
  noSaleCutRoles: 'Salesman,sales,Field Employee',
};

export default function HRSettingsPage() {
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
      toast.success('HR settings saved — next Salary build will use these rules');
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

  return (
    <HRPage>
      <HRPageHeader title="HR Settings" subtitle="Attendance · salary policy · statutory" backHref="/hr/dashboard" />
      <HRWorkflowNotice
        title="HR controls the full salary flow"
        detail="1) Set rules here (late / absent cuts). 2) Edit any day on the Attendance page. 3) Payroll → Calculate → Edit commission/cuts per employee → Approve / Mark paid. Employees do not approve — HR does."
        action={
          <Link href="/hr/payroll/dashboard" className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#014582]">
            Open payroll <ExternalLink className="w-3 h-3" />
          </Link>
        }
      />

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HRCard title="Attendance rules">
              <div className="divide-y divide-[#DDE4EE]/60">
                {TOGGLES.map((t) => (
                  <div key={t.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Settings className="w-4 h-4 text-[#014582] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[#1A1A2E]">{t.label}</p>
                        <p className="text-[10px] text-[#7A8FA6] font-medium mt-0.5">{t.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!enabled[t.key]}
                      onClick={() => setEnabled((p) => ({ ...p, [t.key]: !p[t.key] }))}
                      className={`w-10 h-6 rounded-full flex-shrink-0 transition-colors relative ${
                        enabled[t.key] ? 'bg-[#2ECC71]' : 'bg-[#DDE4EE]'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled[t.key] ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </HRCard>

            <HRCard title="Working time">
              <div className="space-y-4">
                {[
                  { label: 'Work Hours / Day', key: 'workHoursPerDay' },
                  { label: 'Work Days / Week', key: 'workDaysPerWeek' },
                  { label: 'Overtime Rate Multiplier', key: 'overtimeMultiplier' },
                  { label: 'Annual Leave Quota (days)', key: 'annualLeaveQuota' },
                  { label: 'Grace period (minutes)', key: 'graceMinutes' },
                  { label: 'Late threshold (minutes)', key: 'lateThresholdMinutes' },
                  { label: 'Early checkout (minutes)', key: 'earlyCheckoutMinutes' },
                  { label: 'Minimum working hours', key: 'minimumWorkingHours' },
                  { label: 'Half-day hours', key: 'halfDayHours' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                    {num(f.key)}
                  </div>
                ))}
              </div>
            </HRCard>
          </div>

          <HRCard title="Sales commission & no-sale cut">
            <p className="text-xs text-[#7A8FA6] mb-4">
              Sales for sales staff are added as commission on the payslip. If sales are zero, a no-sale cut can apply.
              Enter sales on the Bonuses page, or Calculate can pick totals from linked orders when a sales person is set.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Commission % of sales</label>
                {num('salesCommissionPct')}
                <p className="mt-1 text-[10px] text-[#7A8FA6]">e.g. 5 = Rs 5,000 on Rs 100,000 sales</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">No-sale cut (Rs)</label>
                {num('noSaleCutAmount')}
                <p className="mt-1 text-[10px] text-[#7A8FA6]">Applied when sales are 0 for matching roles</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Roles for no-sale cut</label>
                <input
                  type="text"
                  value={enabled.noSaleCutRoles ?? ''}
                  onChange={(e) => setEnabled((p) => ({ ...p, noSaleCutRoles: e.target.value }))}
                  className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE]"
                  placeholder="Salesman,sales,Field Employee"
                />
              </div>
            </div>
          </HRCard>

          <HRCard title="Salary deduction policy (auto on Calculate)">
            <p className="text-xs text-[#7A8FA6] mb-4">
              These amounts apply automatically when you <b>Calculate</b> payroll. After that, HR can still edit any cut on an employee payslip.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Late cut per day (Rs)</label>
                {num('lateDeductionPerDay')}
                <p className="mt-1 text-[10px] text-[#7A8FA6]">Each late day × this amount</p>
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
                <p className="mt-1 text-[10px] text-[#7A8FA6]">Sirf jab mode = Fixed</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Half-day present credit %</label>
                {num('halfDayDeductionPct')}
                <p className="mt-1 text-[10px] text-[#7A8FA6]">Half day = half present (default 50)</p>
              </div>
            </div>
          </HRCard>

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
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-5 bg-[#014582] hover:bg-[#014582]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </HRCard>
        </div>
      )}
    </HRPage>
  );
}
