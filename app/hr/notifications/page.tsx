'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, PlaneTakeoff, Fingerprint, Wallet, UserPlus, Timer, Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRFilterChips, HRWorkflowNotice } from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  Leave: { icon: PlaneTakeoff, color: '#F39C12' },
  Attendance: { icon: Fingerprint, color: '#014582' },
  Payroll: { icon: Wallet, color: '#2ECC71' },
  Employee: { icon: UserPlus, color: '#0FA3E0' },
  Overtime: { icon: Timer, color: '#8E44AD' },
};

const FILTERS = ['All', 'Leave', 'Attendance', 'Payroll', 'Overtime', 'Employee'];

function timeAgo(value: string) {
  const then = new Date(value).getTime();
  if (!then) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState('All');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    hrWorkforceService
      .notifications()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((n) => filter === 'All' || n.type === filter);

  return (
    <HRPage>
      <HRPageHeader
        title="Notifications Center"
        subtitle={`${filtered.length} alerts from live HR activity`}
        backHref="/hr/dashboard"
      />

      <HRWorkflowNotice title="Actionable notifications" detail="Pending leaves, overtime, late check-ins, and new employees appear here automatically." />

      <div className="mb-4">
        <HRFilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <HRCard title="Updates requiring your attention">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#014582]" /></div>
        ) : (
          <div className="divide-y divide-[#DDE4EE]/60">
            {filtered.map((n, i) => {
              const cfg = TYPE_ICONS[n.type] || { icon: Bell, color: '#7A8FA6' };
              const Icon = cfg.icon;
              return (
                <div key={`${n.title}-${i}`} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}1A` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-[#1A1A2E]">{n.title}</p>
                      <span className="text-[10px] font-semibold text-[#7A8FA6] flex-shrink-0">{timeAgo(n.time)}</span>
                    </div>
                    <p className="text-[11px] text-[#7A8FA6] font-medium mt-0.5">{n.body}</p>
                    {n.href && (
                      <Link href={n.href} className="mt-2 inline-block text-[10px] font-extrabold text-[#014582] hover:underline">
                        Open record →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-[#7A8FA6]">No notifications yet</p>
            )}
          </div>
        )}
      </HRCard>
    </HRPage>
  );
}
