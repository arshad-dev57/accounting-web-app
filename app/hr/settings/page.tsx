'use client';

import React from 'react';
import { Settings, Loader2 } from 'lucide-react';
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

export default function HRSettingsPage() {
  const [enabled, setEnabled] = React.useState<Record<string, any>>({
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
    lateDeductionPerDay: 0,
    graceMinutes: 15,
    lateThresholdMinutes: 15,
    earlyCheckoutMinutes: 30,
    minimumWorkingHours: 8,
    halfDayHours: 4,
  });
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
      toast.success('HR settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader title="HR Settings" subtitle="Module configuration" backHref="/hr/dashboard" />
      <HRWorkflowNotice title="Company HR policy" detail="Attendance rules, working time and salary structure apply to every pay run. Change statutory percentages here before processing payroll." />

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HRCard title="Attendance Rules">
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
                  <input
                    type="number"
                    value={enabled[f.key] ?? ''}
                    onChange={(e) => setEnabled((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                  />
                </div>
              ))}
            </div>
          </HRCard>
        </div>
      )}

      {!loading && (
        <div className="mt-6">
          <HRCard title="Salary structure & statutory">
            <p className="text-xs text-[#7A8FA6] mb-4">
              Package on the employee profile is split into basic and allowances. Tax, EOBI and PF apply on basic. These rates drive every pay run and official payslip.
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
                { label: 'Late deduction per day (Rs)', key: 'lateDeductionPerDay' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                  <input
                    type="number"
                    value={enabled[f.key] ?? ''}
                    onChange={(e) => setEnabled((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                  />
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
