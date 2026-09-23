'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Loader2, ExternalLink, Clock, DollarSign, Percent, Award, BookOpen, Save } from 'lucide-react';
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
  salaryExpenseAccount: '6100',
  salariesPayableAccount: '2200',
  autoPostJournalOnFinalize: true,
};

export default function HRSettingsPage() {
  const [activeTab, setActiveTab] = React.useState<'attendance' | 'compensation' | 'deductions' | 'commissions' | 'accounting'>('attendance');
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
      toast.success('HR & Payroll settings updated successfully');
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
      className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 font-mono font-medium"
    />
  );

  return (
    <HRPage>
      <HRPageHeader title="HR & Payroll Settings" subtitle="Attendance · Package breakdown · Statutory rules · Accounting integration" backHref="/hr/dashboard" />
      <HRWorkflowNotice
        title="Enterprise HR Rules Engine"
        detail="Changes made here immediately govern the next payroll calculation cycle. Rules apply deterministically; manual HR overrides are logged in the pay register audit trail."
        action={
          <Link href="/hr/payroll/dashboard" className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#014582] hover:underline">
            Open Payroll Engine <ExternalLink className="w-3 h-3" />
          </Link>
        }
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-[#DDE4EE] gap-2 overflow-x-auto scrollbar-none pb-px mb-6">
        {[
          { id: 'attendance', label: 'Attendance & Time', icon: Clock },
          { id: 'compensation', label: 'Compensation & Package', icon: DollarSign },
          { id: 'deductions', label: 'Deductions & Statutory', icon: Percent },
          { id: 'commissions', label: 'Sales & Commissions', icon: Award },
          { id: 'accounting', label: 'Accounting Integration', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${
                isActive
                  ? 'border-[#014582] text-[#014582] bg-[#014582]/5 rounded-t-lg'
                  : 'border-transparent text-[#7A8FA6] hover:text-[#1A1A2E] hover:border-[#DDE4EE]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div>
      ) : (
        <div className="space-y-6">
          {/* Tab 1: Attendance */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HRCard title="Attendance Toggles & Alerts">
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

              <HRCard title="Work Schedule & Tolerances">
                <div className="space-y-4">
                  {[
                    { label: 'Standard Work Hours / Day', key: 'workHoursPerDay' },
                    { label: 'Work Days / Week', key: 'workDaysPerWeek' },
                    { label: 'Overtime Rate Multiplier', key: 'overtimeMultiplier' },
                    { label: 'Annual Paid Leave Quota (days)', key: 'annualLeaveQuota' },
                    { label: 'Grace Period Threshold (minutes)', key: 'graceMinutes' },
                    { label: 'Late Arrival Threshold (minutes)', key: 'lateThresholdMinutes' },
                    { label: 'Early Departure Threshold (minutes)', key: 'earlyCheckoutMinutes' },
                    { label: 'Minimum Full-Day Working Hours', key: 'minimumWorkingHours' },
                    { label: 'Minimum Half-Day Working Hours', key: 'halfDayHours' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                      {num(f.key)}
                    </div>
                  ))}
                </div>
              </HRCard>
            </div>
          )}

          {/* Tab 2: Compensation */}
          {activeTab === 'compensation' && (
            <HRCard title="Salary Package Breakdown Structure">
              <p className="text-xs text-[#7A8FA6] mb-4">
                When an employee gross package is assigned in their profile, it is split into allowances according to these percentages:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Basic Salary % of package', key: 'basicPct' },
                  { label: 'House Rent Allowance %', key: 'housePct' },
                  { label: 'Transport Allowance %', key: 'transportPct' },
                  { label: 'Medical Allowance %', key: 'medicalPct' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                    {num(f.key)}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[#F8FAFC] border border-[#DDE4EE] rounded-xl text-xs text-[#7A8FA6]">
                Total Percentage Sum: <span className="font-bold text-[#1A1A2E]">{Number(enabled.basicPct || 0) + Number(enabled.housePct || 0) + Number(enabled.transportPct || 0) + Number(enabled.medicalPct || 0)}%</span>
              </div>
            </HRCard>
          )}

          {/* Tab 3: Deductions */}
          {activeTab === 'deductions' && (
            <div className="space-y-6">
              <HRCard title="Automated Attendance Deductions">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Late cut per day (Rs)</label>
                    {num('lateDeductionPerDay')}
                    <p className="mt-1 text-[10px] text-[#7A8FA6]">Charged for each day employee checks in late</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Absent / Unpaid Cut Mode</label>
                    <select
                      value={enabled.absentDeductionMode || 'daily_rate'}
                      onChange={(e) => setEnabled((p) => ({ ...p, absentDeductionMode: e.target.value }))}
                      className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE]"
                    >
                      <option value="daily_rate">Pro-rata daily rate (Monthly Salary ÷ Working Days)</option>
                      <option value="fixed">Fixed Rs per absent day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Fixed Absent Cut Rate (Rs/day)</label>
                    {num('absentDeductionPerDay')}
                    <p className="mt-1 text-[10px] text-[#7A8FA6]">Used only when mode is set to Fixed</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Half-Day Attendance Credit %</label>
                    {num('halfDayDeductionPct')}
                    <p className="mt-1 text-[10px] text-[#7A8FA6]">Default 50% credit for half-day work</p>
                  </div>
                </div>
              </HRCard>

              <HRCard title="Statutory Taxes & Funds">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Income Tax % (of Basic)', key: 'taxPct' },
                    { label: 'EOBI Contribution % (of Basic)', key: 'eobiPct' },
                    { label: 'Provident Fund % (of Basic)', key: 'pfPct' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                      {num(f.key)}
                    </div>
                  ))}
                </div>
              </HRCard>
            </div>
          )}

          {/* Tab 4: Commissions */}
          {activeTab === 'commissions' && (
            <HRCard title="Sales Incentives & Performance Adjustments">
              <p className="text-xs text-[#7A8FA6] mb-4">
                Sales generated by field/sales staff are retrieved during payroll calculation and added as commission bonuses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Sales Commission Rate (%)</label>
                  {num('salesCommissionPct')}
                  <p className="mt-1 text-[10px] text-[#7A8FA6]">e.g. 5 = Rs 5,000 on Rs 100,000 sales volume</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Zero-Sales Cut Amount (Rs)</label>
                  {num('noSaleCutAmount')}
                  <p className="mt-1 text-[10px] text-[#7A8FA6]">Penalty cut applied when sales total 0 for matching roles</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Target Sales Roles</label>
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
          )}

          {/* Tab 5: Accounting */}
          {activeTab === 'accounting' && (
            <HRCard title="Chart of Accounts & Cost Center Posting">
              <p className="text-xs text-[#7A8FA6] mb-4">
                When a payroll period is Finalized, the system generates an automatic Journal Entry. Cost centers attached to employees are debited proportionally.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Salaries Expense Account Code</label>
                  <input
                    type="text"
                    value={enabled.salaryExpenseAccount || '6100'}
                    onChange={(e) => setEnabled((p) => ({ ...p, salaryExpenseAccount: e.target.value }))}
                    className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] font-mono"
                    placeholder="6100"
                  />
                  <p className="mt-1 text-[10px] text-[#7A8FA6]">Default: 6100 (Salaries & Allowances Expense)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">Salaries Payable Account Code</label>
                  <input
                    type="text"
                    value={enabled.salariesPayableAccount || '2200'}
                    onChange={(e) => setEnabled((p) => ({ ...p, salariesPayableAccount: e.target.value }))}
                    className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] font-mono"
                    placeholder="2200"
                  />
                  <p className="mt-1 text-[10px] text-[#7A8FA6]">Default: 2200 (Salaries Payable Liability)</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#DDE4EE]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#1A1A2E]">Auto-post Journal Entry on Period Finalization</p>
                    <p className="text-[10px] text-[#7A8FA6]">Automatically post journal entries to General Ledger without requiring manual accounting action.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!enabled.autoPostJournalOnFinalize}
                    onClick={() => setEnabled((p) => ({ ...p, autoPostJournalOnFinalize: !p.autoPostJournalOnFinalize }))}
                    className={`w-10 h-6 rounded-full flex-shrink-0 transition-colors relative ${
                      enabled.autoPostJournalOnFinalize ? 'bg-[#2ECC71]' : 'bg-[#DDE4EE]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled.autoPostJournalOnFinalize ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </HRCard>
          )}

          {/* Action Footer */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#014582] hover:bg-[#014582]/90 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Settings…' : 'Save All Settings'}
            </button>
          </div>
        </div>
      )}
    </HRPage>
  );
}

