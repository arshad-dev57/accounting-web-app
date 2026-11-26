'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatCard,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import { BizCard, BizLoading, bizBtnPrimary, bizInput, bizSelect, fmtDate } from '../../../components/business-apps/bizUi';
import {
  asList,
  projectsApi,
  type PmDashboard,
  type PmMilestone,
  type PmProject,
} from '../../../lib/business-apps-api';

export default function ProjectsMilestonesPage() {
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [milestones, setMilestones] = useState<PmMilestone[]>([]);
  const [dash, setDash] = useState<PmDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, d] = await Promise.all([
          projectsApi.list({ limit: 100 }),
          projectsApi.dashboard().catch(() => null),
        ]);
        if (cancelled) return;
        const rows = asList(list);
        setProjects(rows);
        setDash(d);
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

  const loadMilestones = async (pid: string) => {
    if (!pid) return;
    try {
      const rows = await projectsApi.milestones(pid);
      setMilestones(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load milestones');
      setMilestones([]);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    void loadMilestones(projectId);
  }, [projectId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    setSaving(true);
    try {
      await projectsApi.createMilestone(projectId, {
        title: title.trim(),
        targetDate: targetDate || undefined,
        status: 'pending',
      });
      setTitle('');
      setTargetDate('');
      toast.success('Milestone created');
      await loadMilestones(projectId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const complete = async (id: string) => {
    try {
      await projectsApi.updateMilestone(id, { status: 'completed' });
      toast.success('Milestone completed');
      await loadMilestones(projectId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Milestones"
        description="Key delivery checkpoints per project."
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

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load milestones" description={error} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <BizStatCard label="Upcoming milestones" value={dash?.milestones.upcoming ?? 0} />
            <BizStatCard label="Overdue milestones" value={dash?.milestones.overdue ?? 0} accent="bg-red-500" />
          </div>

          {projects.length === 0 ? (
            <BizEmptyState
              title="No projects yet"
              description="Create a project to start tracking milestones."
              action={
                <Link href="/projects/list?new=1" className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
                  New project
                </Link>
              }
            />
          ) : (
            <>
              <form
                onSubmit={onCreate}
                className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-600">Milestone</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Delivery checkpoint"
                      className={bizInput}
                      required
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-gray-600">Target date</span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className={bizInput}
                    />
                  </label>
                  <button type="submit" disabled={saving} className={bizBtnPrimary}>
                    {saving ? 'Saving…' : 'Add'}
                  </button>
                </div>
              </form>

              {milestones.length === 0 ? (
                <BizEmptyState
                  title="No milestones for this project"
                  description="Add a target date and track completion for key deliverables."
                />
              ) : (
                <BizCard title="Milestones">
                  <ul className="divide-y divide-gray-100">
                    {milestones.map((m) => (
                      <li key={m.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{m.title}</p>
                          <p className="text-xs text-gray-500">Target {fmtDate(m.targetDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BizStatusBadge
                            status={m.status || 'pending'}
                            tone={m.status === 'completed' ? 'success' : 'info'}
                          />
                          {m.status !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => void complete(m.id)}
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Mark complete
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </BizCard>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
