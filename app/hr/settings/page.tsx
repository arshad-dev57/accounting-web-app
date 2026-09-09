'use client';

import React from 'react';
import { Settings, ShieldCheck } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice, HRActionButton } from '../ui';

const TOGGLES = [
  { key: 'geofence', label: 'Auto Geofence Check-in', desc: 'Automatically check employees in when they enter the office geofence' },
  { key: 'autoCheckout', label: 'Auto Checkout', desc: 'Check employees out automatically at shift end' },
  { key: 'lateAlerts', label: 'Late Arrival Alerts', desc: 'Notify HR when an employee checks in late' },
  { key: 'faceId', label: 'Face / Biometric Verification', desc: 'Require biometric verification on check-in' },
  { key: 'weeklyReports', label: 'Weekly HR Report Email', desc: 'Email a weekly attendance summary to HR admins' },
];

export default function HRSettingsPage() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({
    geofence: true,
    autoCheckout: true,
    lateAlerts: true,
    faceId: false,
    weeklyReports: false,
  });

  return (
    <HRPage>
      <HRPageHeader
        title="HR Settings"
        subtitle="Module configuration"
        backHref="/hr/dashboard"
      />
      <HRWorkflowNotice tone="amber" title="Configuration is shown as UI only" detail="When connected later, every policy change should have an effective date, scope, approver, and audit history—especially attendance and payroll rules." action={<HRActionButton variant="ghost" icon={ShieldCheck}>Policy history</HRActionButton>} />

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
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      enabled[t.key] ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </HRCard>

        <HRCard title="General">
          <div className="space-y-4">
            {[
              { label: 'Work Hours / Day', value: '8' },
              { label: 'Work Days / Week', value: '6' },
              { label: 'Overtime Rate Multiplier', value: '1.5' },
              { label: 'Annual Leave Quota (days)', value: '14' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">{f.label}</label>
                <input
                  type="text"
                  defaultValue={f.value}
                  className="w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all"
                />
              </div>
            ))}
            <button
              type="button"
              className="bg-[#014582] hover:bg-[#014582]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            >
              Save Settings
            </button>
          </div>
        </HRCard>
      </div>
    </HRPage>
  );
}
