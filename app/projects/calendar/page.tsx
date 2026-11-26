'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizLoading, dayKey } from '../../../components/business-apps/bizUi';
import {
  asList,
  projectsApi,
  type PmProject,
  type PmTask,
} from '../../../lib/business-apps-api';

type CalEntry = {
  id: string;
  kind: 'task' | 'project';
  title: string;
  status: string;
  href: string;
  sub?: string;
};

export default function ProjectsCalendarPage() {
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [tasks, setTasks] = useState<PmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = asList(await projectsApi.list({ limit: 100 }));
        const results = await Promise.allSettled(list.map((p) => projectsApi.listTasks(p.id)));
        const all: PmTask[] = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled') all.push(...asList(r.value));
        });
        if (cancelled) return;
        setProjects(list);
        setTasks(all);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load calendar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay = useMemo(() => {
    const names = new Map(projects.map((p) => [p.id, p.name]));
    const map = new Map<string, CalEntry[]>();
    const push = (key: string, entry: CalEntry) => {
      if (!key) return;
      map.set(key, [...(map.get(key) || []), entry]);
    };
    tasks.forEach((t) =>
      push(dayKey(t.dueDate), {
        id: `t-${t.id}`,
        kind: 'task',
        title: t.title,
        status: t.status,
        href: `/projects/${t.projectId}`,
        sub: names.get(t.projectId),
      })
    );
    projects.forEach((p) =>
      push(dayKey(p.endDate), {
        id: `p-${p.id}`,
        kind: 'project',
        title: `${p.name} (deadline)`,
        status: p.status,
        href: `/projects/${p.id}`,
        sub: p.projectCode,
      })
    );
    return map;
  }, [projects, tasks]);

  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  const days = useMemo(
    () =>
      Array.from(byDay.keys())
        .filter((k) => k.startsWith(monthPrefix))
        .sort(),
    [byDay, monthPrefix]
  );

  const shift = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div>
      <BizPageHeader
        title="Project Calendar"
        description="Task due dates and project deadlines by month."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-36 text-center text-sm font-semibold text-gray-900">
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load calendar" description={error} />
      ) : days.length === 0 ? (
        <BizEmptyState
          title="Nothing due this month"
          description="Tasks with due dates and projects with end dates will appear here."
        />
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const d = new Date(`${day}T00:00:00`);
            return (
              <div key={day} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                  {d.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <ul className="divide-y divide-gray-100">
                  {(byDay.get(day) || []).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div className="min-w-0">
                        <Link href={e.href} className="font-medium text-[#014582] hover:underline">
                          {e.title}
                        </Link>
                        {e.sub ? <p className="text-xs text-gray-500">{e.sub}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs capitalize text-gray-400">{e.kind}</span>
                        <BizStatusBadge status={e.status} tone={e.status === 'done' || e.status === 'completed' ? 'success' : 'info'} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
