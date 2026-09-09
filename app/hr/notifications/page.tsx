'use client';

import React from 'react';
import { Bell, PlaneTakeoff, Fingerprint, Wallet, UserPlus, Timer } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRFilterChips, HRWorkflowNotice } from '../ui';
import { NOTIFICATIONS } from '../data';

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  Leave: { icon: PlaneTakeoff, color: '#F39C12' },
  Attendance: { icon: Fingerprint, color: '#014582' },
  Payroll: { icon: Wallet, color: '#2ECC71' },
  Employee: { icon: UserPlus, color: '#0FA3E0' },
  Overtime: { icon: Timer, color: '#8E44AD' },
};

const FILTERS = ['All', 'Leave', 'Attendance', 'Payroll', 'Overtime'];

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState('All');
  const filtered = NOTIFICATIONS.filter(
    (n) => filter === 'All' || n.type === filter
  );

  return (
    <HRPage>
      <HRPageHeader
        title="Notifications Center"
        subtitle={`${filtered.length} notifications`}
        backHref="/hr/dashboard"
      />

      <HRWorkflowNotice title="Actionable notifications" detail="In the finished flow, every alert links to its request or exception and remains visible until the responsible person takes action." />

      <div className="mb-4">
        <HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <HRCard title="Updates requiring your attention" action={<button className="text-[10px] font-bold text-[#014582]">Mark all read</button>}>
        <div className="divide-y divide-[#DDE4EE]/60">
          {filtered.map((n) => {
            const cfg = TYPE_ICONS[n.type] || { icon: Bell, color: '#7A8FA6' };
            const Icon = cfg.icon;
            return (
              <div key={n.title + n.time} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cfg.color}1A` }}
                >
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold text-[#1A1A2E]">{n.title}</p>
                    <span className="text-[10px] font-semibold text-[#7A8FA6] flex-shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-[#7A8FA6] font-medium mt-0.5">{n.body}</p>
                  <button className="mt-2 text-[10px] font-extrabold text-[#014582] hover:underline">Open record →</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-[#7A8FA6]">No notifications</p>
          )}
        </div>
      </HRCard>
    </HRPage>
  );
}
