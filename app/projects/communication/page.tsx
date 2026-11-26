'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BizEmptyState,
  BizPageHeader,
} from '../../../components/business-apps/BusinessAppShell';
import { BizCard, BizLoading, bizSelect, fmtDateTime } from '../../../components/business-apps/bizUi';
import {
  asList,
  displayName,
  projectsApi,
  type PmActivity,
  type PmProject,
} from '../../../lib/business-apps-api';

export default function ProjectsCommunicationPage() {
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [activity, setActivity] = useState<PmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = asList(await projectsApi.list({ limit: 100 }));
        if (cancelled) return;
        setProjects(rows);
        if (rows[0]) setProjectId(rows[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoadingActivity(true);
    setError(null);
    projectsApi
      .activities(projectId)
      .then((rows) => {
        if (!cancelled) setActivity(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load activity');
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div>
      <BizPageHeader
        title="Communication"
        description="Project activity feed."
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

      {loading || loadingActivity ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load activity" description={error} />
      ) : projects.length === 0 ? (
        <BizEmptyState
          title="No projects yet"
          description="Create a project to see its activity here."
          action={
            <Link href="/projects/list?new=1" className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
              New project
            </Link>
          }
        />
      ) : activity.length === 0 ? (
        <BizEmptyState
          title="No activity yet"
          description="Project updates, task changes and comments will be listed here."
        />
      ) : (
        <BizCard title="Recent activity">
          <ul className="divide-y divide-gray-100">
            {activity.map((row, idx) => {
              const task = (row as PmActivity & { task?: { id: string; title: string } | null }).task;
              return (
                <li key={row.id || idx} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="text-gray-700">
                    <p>{row.message || row.action || 'Activity'}</p>
                    <p className="text-xs text-gray-500">
                      {displayName(row.user)}
                      {task?.title ? ` · ${task.title}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{fmtDateTime(row.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        </BizCard>
      )}
    </div>
  );
}
