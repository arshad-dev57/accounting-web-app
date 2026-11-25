'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle,
  CheckSquare,
  Clock,
  Database,
  FileSignature,
  LayoutDashboard,
  Megaphone,
  Phone,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  getEnterpriseDashboard,
  OPPORTUNITY_STAGE_DOT_COLORS,
  STATUS_DOT_COLORS,
  type EnterpriseDashboard,
} from '@/lib/crm-api';
import { StatCard } from '../components/StatCard';
import { deskInput } from '../components/ErpDeskForm';

function SimpleBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex justify-between text-sm">
          <span className="truncate text-gray-700">{label}</span>
          <span className="ml-2 font-medium tabular-nums text-gray-500">{count}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, typeof Users> = {
  created: Users,
  status_changed: RefreshCw,
  assigned: Users,
  note_added: AlertCircle,
  followup_scheduled: Clock,
  followup_completed: CheckCircle,
  imported: TrendingUp,
  converted: CheckCircle,
  call_logged: Phone,
};

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function LinkGroup({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <Panel title={title}>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className="flex items-center rounded-md px-2 py-1.5 text-sm text-[#014582] hover:bg-[#014582]/5"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function CRMDashboardPage() {
  const [data, setData] = useState<EnterpriseDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getEnterpriseDashboard({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
        <p className="font-medium text-red-600">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-4 rounded-md bg-[#014582] px-4 py-2 text-sm text-white hover:bg-[#01366a]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totals = data.totals || {
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    followUp: 0,
    negotiation: 0,
    converted: 0,
    lost: 0,
  };
  const opp = data.opportunityTotals || {
    total: 0,
    totalValue: 0,
    won: 0,
    wonValue: 0,
    lost: 0,
    pipeline: 0,
  };
  const taskSummary = data.taskSummary || {
    total: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
  };
  const statusBreakdown = data.statusBreakdown || [];
  const sourceBreakdown = data.sourceBreakdown || [];
  const upcomingFollowUps = data.upcomingFollowUps || [];
  const recentActivity = data.recentActivity || [];
  const opportunitiesByStage = data.opportunitiesByStage || [];
  const accountTotal = (data as { accountTotal?: number }).accountTotal ?? 0;
  const sourceColors = [
    '#014582',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#64748b',
    '#0ea5e9',
    '#6b7280',
  ];

  const shortcuts = [
    {
      href: '/crm/dashboard',
      label: 'Dashboard',
      sub: 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/crm/leads',
      label: 'Lead',
      sub: `${totals.total} Open`,
      icon: Users,
    },
    {
      href: '/crm/opportunities',
      label: 'Opportunity',
      sub: `${opp.total} Assigned`,
      icon: Target,
    },
    {
      href: '/crm/accounts',
      label: 'Customer',
      sub: String(accountTotal),
      icon: Building2,
    },
    {
      href: '/crm/reports/sales-funnel',
      label: 'Sales Analytics',
      sub: 'Reports',
      icon: BarChart3,
    },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Workspace header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">CRM</h1>
          <p className="mt-0.5 text-sm text-gray-500">Sales pipeline workspace</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From"
            className={`${deskInput} !w-auto min-w-[9.5rem]`}
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To"
            className={`${deskInput} !w-auto min-w-[9.5rem]`}
          />
          <button
            type="button"
            onClick={fetchData}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Apply
          </button>
          <Link
            href="/crm/leads/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#01366a]"
          >
            New
          </Link>
        </div>
      </div>

      {/* Shortcut widgets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#014582]/30 hover:shadow-sm"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#014582]/10 text-[#014582]">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{s.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{s.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={totals.total}
          icon={Users}
          href="/crm/leads"
          accent="#014582"
        />
        <StatCard
          label="Pipeline Value"
          value={opp.totalValue}
          icon={TrendingUp}
          format="currency"
          href="/crm/pipeline"
          accent="#0ea5e9"
        />
        <StatCard
          label="Conversion Rate"
          value={data.conversionRate ?? 0}
          icon={BarChart3}
          format="percent"
          accent="#10b981"
        />
        <StatCard
          label="Tasks Overdue"
          value={taskSummary.overdue}
          icon={CheckSquare}
          href="/crm/tasks"
          accent="#ef4444"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Lead Pipeline">
          <div className="space-y-3.5">
            {statusBreakdown.map(({ status, count }) => (
              <SimpleBar
                key={status}
                label={status}
                count={count}
                total={totals.total || 1}
                color={STATUS_DOT_COLORS[status] || '#6b7280'}
              />
            ))}
            {statusBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Opportunity Stages">
          <div className="space-y-3.5">
            {opportunitiesByStage.map(({ stage, count, value }) => (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: OPPORTUNITY_STAGE_DOT_COLORS[stage] || '#6b7280',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span className="truncate text-gray-700">{stage}</span>
                    <span className="ml-2 font-medium tabular-nums text-gray-500">
                      {count}
                    </span>
                  </div>
                  {value > 0 ? (
                    <p className="text-xs text-gray-400">
                      PKR {value.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {opportunitiesByStage.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Lead Sources">
          <div className="space-y-3.5">
            {sourceBreakdown.slice(0, 7).map(({ source, count }, i) => (
              <SimpleBar
                key={source}
                label={source}
                count={count}
                total={totals.total || 1}
                color={sourceColors[i % sourceColors.length]}
              />
            ))}
            {sourceBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No Data</p>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* Link widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LinkGroup
          title="Sales Pipeline"
          items={[
            { href: '/crm/leads', label: 'Lead' },
            { href: '/crm/opportunities', label: 'Opportunity' },
            { href: '/crm/accounts', label: 'Customer' },
            { href: '/crm/contracts', label: 'Contract' },
            { href: '/crm/appointments', label: 'Appointment' },
            { href: '/crm/activities', label: 'Communication' },
          ]}
        />
        <LinkGroup
          title="Masters"
          items={[
            { href: '/crm/territory', label: 'Territory' },
            { href: '/crm/customer-group', label: 'Customer Group' },
            { href: '/crm/contacts', label: 'Contact' },
            { href: '/crm/prospects', label: 'Prospect' },
            { href: '/crm/sales-stage', label: 'Sales Stage' },
            { href: '/crm/lead-source', label: 'Lead Source' },
          ]}
        />
        <LinkGroup
          title="Reports"
          items={[
            { href: '/crm/reports/lead-details', label: 'Lead Details' },
            {
              href: '/crm/reports/sales-pipeline-analytics',
              label: 'Sales Pipeline Analytics',
            },
            { href: '/crm/reports/sales-funnel', label: 'Sales Funnel' },
            {
              href: '/crm/reports/lead-owner-efficiency',
              label: 'Lead Owner Efficiency',
            },
            {
              href: '/crm/reports/campaign-efficiency',
              label: 'Campaign Efficiency',
            },
          ]}
        />
        <LinkGroup
          title="Campaign"
          items={[
            { href: '/crm/campaigns', label: 'Campaign' },
            { href: '/crm/email-campaigns', label: 'Email Campaign' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Upcoming Follow-ups"
          action={
            <Link
              href="/crm/follow-ups"
              className="text-xs font-medium text-[#014582] hover:underline"
            >
              View all
            </Link>
          }
        >
          <div className="space-y-2">
            {upcomingFollowUps.slice(0, 6).map((fu) => (
              <div
                key={fu.id}
                className="flex gap-3 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#014582]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {fu.lead?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fu.type} · {new Date(fu.followUpDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {upcomingFollowUps.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No upcoming follow-ups
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Recent Activity"
          action={
            <Link
              href="/crm/activities"
              className="text-xs font-medium text-[#014582] hover:underline"
            >
              View all
            </Link>
          }
        >
          <div className="space-y-1">
            {recentActivity.slice(0, 8).map((act) => {
              const Icon = ACTIVITY_ICONS[act.type] || RefreshCw;
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#014582]/10 text-[#014582]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{act.title}</p>
                    {act.description ? (
                      <p className="truncate text-xs text-gray-500">
                        {act.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
            {recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No activity yet</p>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* Compact utility links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/crm/pipeline', label: 'Sales Pipeline', icon: Target },
          { href: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
          { href: '/crm/follow-ups', label: 'Follow-ups', icon: Phone },
          { href: '/crm/prospects', label: 'Prospects', icon: Briefcase },
          { href: '/crm/contracts', label: 'Contracts', icon: FileSignature },
          { href: '/crm/campaigns', label: 'Campaigns', icon: Megaphone },
          { href: '/crm/masters', label: 'Masters', icon: Database },
          { href: '/crm/activities', label: 'Communication', icon: Activity },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#014582]/25 hover:text-[#014582]"
          >
            <Icon className="h-4 w-4 text-[#014582]" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
