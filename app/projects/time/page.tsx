'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
} from '../../../components/business-apps/BusinessAppShell';
import { BizCard, BizLoading, bizBtnPrimary, bizInput, bizSelect, fmtDateTime } from '../../../components/business-apps/bizUi';
import {
  asList,
  displayName,
  projectsApi,
  type PmDashboard,
  type PmProject,
  type PmTimeEntry,
} from '../../../lib/business-apps-api';

export default function ProjectsTimePage() {
  const [dash, setDash] = useState<PmDashboard | null>(null);
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [entries, setEntries] = useState<PmTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('60');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, list] = await Promise.all([
          projectsApi.dashboard(),
          projectsApi.list({ limit: 100 }),
        ]);
        if (cancelled) return;
        setDash(d);
        const rows = asList(list);
        setProjects(rows);
        if (rows[0]) setProjectId(rows[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadEntries = async (pid: string) => {
    if (!pid) return;
    try {
      const data = await projectsApi.timeEntries(pid, { limit: 50 });
      setEntries(asList(data));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load time entries');
      setEntries([]);
    }
  };

  useEffect(() => {
    if (projectId) void loadEntries(projectId);
  }, [projectId]);

  const startTimer = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await projectsApi.createTimeEntry(projectId, {
        isRunning: true,
        description: description || undefined,
        startedAt: new Date().toISOString(),
      });
      toast.success('Timer started');
      setDescription('');
      await loadEntries(projectId);
      setDash(await projectsApi.dashboard().catch(() => dash));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start timer');
    } finally {
      setSaving(false);
    }
  };

  const stopTimer = async (id: string) => {
    try {
      await projectsApi.stopTimeEntry(id);
      toast.success('Timer stopped');
      await loadEntries(projectId);
      setDash(await projectsApi.dashboard().catch(() => dash));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not stop timer');
    }
  };

  const addManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const mins = parseInt(minutes, 10);
    if (!Number.isFinite(mins) || mins <= 0) {
      toast.error('Enter valid minutes');
      return;
    }
    setSaving(true);
    try {
      const endedAt = new Date();
      const startedAt = new Date(endedAt.getTime() - mins * 60000);
      await projectsApi.createTimeEntry(projectId, {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes: mins,
        description: description || undefined,
        source: 'manual',
      });
      toast.success('Time entry added');
      setDescription('');
      await loadEntries(projectId);
      setDash(await projectsApi.dashboard().catch(() => dash));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <BizLoading height="h-40" />;
  if (error) return <BizEmptyState title="Unable to load time tracking" description={error} />;

  return (
    <div>
      <BizPageHeader
        title="Time Tracking"
        description="Start timers or log manual hours against a project."
        actions={
          projects.length > 0 ? (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={bizSelect}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <BizStatCard label="Hours (last 7 days)" value={Number(dash?.time.hoursLast7Days || 0).toFixed(1)} />
        <BizStatCard
          label="My running timers"
          value={dash?.time.myRunningTimers ?? 0}
          accent="bg-emerald-500"
        />
      </div>

      {projects.length === 0 ? (
        <BizEmptyState title="No projects yet" description="Create a project before logging time." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <BizCard title="Timer">
              <div className="space-y-3">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className={bizInput}
                />
                <button type="button" disabled={saving} onClick={() => void startTimer()} className={bizBtnPrimary}>
                  Start timer
                </button>
              </div>
            </BizCard>
            <BizCard title="Manual entry">
              <form onSubmit={addManual} className="space-y-3">
                <input
                  type="number"
                  min="1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className={bizInput}
                  placeholder="Minutes"
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className={bizInput}
                />
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  Add time
                </button>
              </form>
            </BizCard>
          </div>

          <BizCard title="Recent entries">
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">No time logged for this project yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {displayName(entry.user)} ·{' '}
                        {entry.isRunning
                          ? 'Running'
                          : `${entry.durationMinutes || 0} min`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fmtDateTime(entry.startedAt)}
                        {entry.description ? ` · ${entry.description}` : ''}
                      </p>
                    </div>
                    {entry.isRunning ? (
                      <button
                        type="button"
                        onClick={() => void stopTimer(entry.id)}
                        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Stop
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </BizCard>
        </>
      )}
    </div>
  );
}
