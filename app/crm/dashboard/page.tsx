'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle,
  CheckSquare,
  Clock,
  Contact2,
  FileSignature,
  Kanban,
  Megaphone,
  Phone,
  Plus,
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
  meta,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  meta?: string;
}) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium text-gray-700">{label}</span>
          <span className="shrink-0 tabular-nums text-gray-500">
            {count}
            {meta ? <span className="text-gray-400"> · {meta}</span> : null}
          </span>
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
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-[#fafbfc] px-4 py-2.5">
        <h2 className="text-[13px] font-semibold tracking-wide text-gray-800">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
      {children}
    </h3>
  );
}

function LinkList({
  items,
}: {
  items: { href: string; label: string; count?: number | string }[];
}) {
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.href + item.label}>
          <Link
            href={item.href}
            className="flex items-center justify-between gap-3 px-1 py-2 text-sm text-[#014582] transition-colors hover:bg-[#014582]/[0.04] hover:text-[#01366a]"
          >
            <span className="font-medium">{item.label}</span>
            {item.count !== undefined ? (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600">
                {item.count}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AppTile({
  href,
  label,
  sub,
  icon: Icon,
  accent = '#014582',
}: {
  href: string;
  label: string;
  sub: string;
  icon: typeof Users;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
    >
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}12`, color: accent }}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#014582]">{label}</p>
      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
    </Link>
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

  const sourceColors = useMemo(
    () => ['#014582', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#0ea5e9', '#8b5cf6'],
    []
  );

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-100 bg-white py-24 text-center shadow-sm">
        <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
        <p className="font-semibold text-red-600">Failed to load CRM dashboard</p>
        <p className="mt-1 max-w-md text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#01366a]"
        >
          <RefreshCw className="h-4 w-4" />
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
  const accountTotal = data.accountTotal ?? 0;
  const winRate =
    opp.won + opp.lost > 0 ? Math.round((opp.won / (opp.won + opp.lost)) * 1000) / 10 : 0;

  const secondaryKpis =
    statusBreakdown.length > 0
      ? statusBreakdown.slice(0, 6).map((row) => ({
          label: row.status,
          value: row.count,
          color: STATUS_DOT_COLORS[row.status] || '#6b7280',
        }))
      : [
          { label: 'New', value: totals.new, color: '#3b82f6' },
          { label: 'Contacted', value: totals.contacted, color: '#0ea5e9' },
          { label: 'Interested', value: totals.interested, color: '#8b5cf6' },
          { label: 'Negotiation', value: totals.negotiation, color: '#f59e0b' },
          { label: 'Won Deals', value: opp.won, color: '#10b981' },
          { label: 'Lost', value: totals.lost + opp.lost, color: '#ef4444' },
        ];

  const apps = [
    { href: '/crm/leads', label: 'Leads', sub: `${totals.total} open`, icon: Users, accent: '#014582' },
    { href: '/crm/opportunities', label: 'Opportunities', sub: `${opp.total} deals`, icon: Target, accent: '#0ea5e9' },
    { href: '/crm/pipeline', label: 'Pipeline', sub: 'Kanban view', icon: Kanban, accent: '#8b5cf6' },
    { href: '/crm/accounts', label: 'Customers', sub: String(accountTotal), icon: Building2, accent: '#10b981' },
    { href: '/crm/contacts', label: 'Contacts', sub: 'People', icon: Contact2, accent: '#64748b' },
    { href: '/crm/tasks', label: 'Tasks', sub: `${taskSummary.pending} pending`, icon: CheckSquare, accent: '#f59e0b' },
    { href: '/crm/follow-ups', label: 'Follow-ups', sub: `${upcomingFollowUps.length} upcoming`, icon: Phone, accent: '#ef4444' },
    { href: '/crm/calendar', label: 'Calendar', sub: 'Schedule', icon: CalendarDays, accent: '#014582' },
  ];

  return (
    <div className="w-full space-y-6">
      {/* SAP-style page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
            Sales · CRM
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-gray-900">
            CRM Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Pipeline health, lead conversion and team activity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From"
            className={`${deskInput} !h-9 !w-auto min-w-[9.5rem] !rounded-md`}
          />
          <span className="text-xs font-medium text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To"
            className={`${deskInput} !h-9 !w-auto min-w-[9.5rem] !rounded-md`}
          />
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Apply
          </button>
          <Link
            href="/crm/leads/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#014582] px-4 text-sm font-semibold text-white hover:bg-[#01366a]"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* Odoo-style app launcher */}
      <div className="space-y-2.5">
        <SectionLabel>Applications</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {apps.map((app) => (
            <AppTile key={app.href} {...app} />
          ))}
        </div>
      </div>

      {/* KPI strip — Fiori number tiles */}
      <div className="space-y-2.5">
        <SectionLabel>Key Performance</SectionLabel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Leads"
            value={totals.total}
            icon={Users}
            href="/crm/leads"
            accent="#014582"
            sub={`${totals.new} new · ${totals.converted} converted`}
          />
          <StatCard
            label="Pipeline Value"
            value={opp.totalValue}
            icon={TrendingUp}
            format="currency"
            href="/crm/pipeline"
            accent="#0ea5e9"
            sub={`${opp.pipeline} open opportunities`}
          />
          <StatCard
            label="Conversion Rate"
            value={data.conversionRate ?? 0}
            icon={BarChart3}
            format="percent"
            accent="#10b981"
            sub={`Win rate ${winRate}%`}
          />
          <StatCard
            label="Tasks Overdue"
            value={taskSummary.overdue}
            icon={CheckSquare}
            href="/crm/tasks"
            accent="#ef4444"
            sub={`${taskSummary.pending} pending · ${taskSummary.completed} done`}
          />
        </div>
      </div>

      {/* Secondary operational KPIs — driven by live status breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {secondaryKpis.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {item.label}
              </p>
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900">
              {Number(item.value || 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics panels */}
      <div className="space-y-2.5">
        <SectionLabel>Analytics</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Lead Pipeline"
            action={
              <Link href="/crm/leads" className="text-xs font-semibold text-[#014582] hover:underline">
                Open
              </Link>
            }
          >
            <div className="space-y-3.5">
              {statusBreakdown.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No Data</p>
              ) : (
                statusBreakdown.map(({ status, count }) => (
                  <SimpleBar
                    key={status}
                    label={status}
                    count={count}
                    total={totals.total || 1}
                    color={STATUS_DOT_COLORS[status] || '#6b7280'}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Opportunity Stages"
            action={
              <Link href="/crm/opportunities" className="text-xs font-semibold text-[#014582] hover:underline">
                Open
              </Link>
            }
          >
            <div className="space-y-3.5">
              {opportunitiesByStage.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No Data</p>
              ) : (
                opportunitiesByStage.map(({ stage, count, value }) => (
                  <SimpleBar
                    key={stage}
                    label={stage}
                    count={count}
                    total={opp.total || 1}
                    color={OPPORTUNITY_STAGE_DOT_COLORS[stage] || '#6b7280'}
                    meta={value > 0 ? `PKR ${value.toLocaleString()}` : undefined}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Lead Sources"
            action={
              <Link href="/crm/lead-source" className="text-xs font-semibold text-[#014582] hover:underline">
                Masters
              </Link>
            }
          >
            <div className="space-y-3.5">
              {sourceBreakdown.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No Data</p>
              ) : (
                sourceBreakdown.slice(0, 8).map(({ source, count }, i) => (
                  <SimpleBar
                    key={source}
                    label={source}
                    count={count}
                    total={totals.total || 1}
                    color={sourceColors[i % sourceColors.length]}
                  />
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Worklists + navigation */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel
          title="Upcoming Follow-ups"
          className="xl:col-span-4"
          action={
            <Link href="/crm/follow-ups" className="text-xs font-semibold text-[#014582] hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-2">
            {upcomingFollowUps.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">No upcoming follow-ups</p>
            ) : (
              upcomingFollowUps.slice(0, 7).map((fu) => (
                <div
                  key={fu.id}
                  className="flex gap-3 rounded-md border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#014582]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {fu.lead?.fullName || 'Lead'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {fu.type} · {new Date(fu.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Recent Activity"
          className="xl:col-span-5"
          action={
            <Link href="/crm/activities" className="text-xs font-semibold text-[#014582] hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-1">
            {recentActivity.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">No activity yet</p>
            ) : (
              recentActivity.slice(0, 8).map((act) => {
                const Icon = ACTIVITY_ICONS[act.type] || RefreshCw;
                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#014582]/10 text-[#014582]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{act.title}</p>
                      {act.description ? (
                        <p className="truncate text-xs text-gray-500">{act.description}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <div className="space-y-4 xl:col-span-3">
          <Panel title="Sales Pipeline">
            <LinkList
              items={[
                { href: '/crm/leads', label: 'Leads', count: totals.total },
                { href: '/crm/opportunities', label: 'Opportunities', count: opp.total },
                { href: '/crm/accounts', label: 'Customers', count: accountTotal },
                { href: '/crm/contracts', label: 'Contracts' },
                { href: '/crm/appointments', label: 'Appointments' },
              ]}
            />
          </Panel>
          <Panel title="More">
            <LinkList
              items={[
                { href: '/crm/campaigns', label: 'Campaigns' },
                { href: '/crm/email-campaigns', label: 'Email Campaigns' },
                { href: '/crm/prospects', label: 'Prospects' },
                { href: '/crm/reports', label: 'Reports' },
                { href: '/crm/masters', label: 'Masters' },
              ]}
            />
          </Panel>
        </div>
      </div>

      {/* Quick create / common ops */}
      <div className="space-y-2.5">
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { href: '/crm/leads/new', label: 'Create Lead', icon: Plus },
            { href: '/crm/opportunities', label: 'Opportunities', icon: Target },
            { href: '/crm/pipeline', label: 'Open Pipeline', icon: Kanban },
            { href: '/crm/tasks', label: 'My Tasks', icon: CheckSquare },
            { href: '/crm/campaigns', label: 'Campaigns', icon: Megaphone },
            { href: '/crm/contracts', label: 'Contracts', icon: FileSignature },
            { href: '/crm/prospects', label: 'Prospects', icon: Briefcase },
            { href: '/crm/activities', label: 'Communications', icon: Activity },
            { href: '/crm/reports/sales-funnel', label: 'Sales Funnel', icon: BarChart3 },
            { href: '/crm/follow-ups', label: 'Follow-ups', icon: Phone },
            { href: '/crm/calendar', label: 'Calendar', icon: CalendarDays },
            { href: '/crm/accounts', label: 'Customers', icon: Building2 },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href + label}
              href={href}
              className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-[#014582]/30 hover:text-[#014582]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#014582]/10 text-[#014582]">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
