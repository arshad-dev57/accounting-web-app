'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  BizLoading,
  bizBtnPrimary,
  bizInput,
  bizSelect,
} from '../../../components/business-apps/bizUi';
import {
  asList,
  displayName,
  projectsApi,
  type PmMember,
  type PmProject,
} from '../../../lib/business-apps-api';

const ROLES = ['manager', 'member', 'viewer'];

export default function ProjectsTeamsPage() {
  const [projects, setProjects] = useState<PmProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [members, setMembers] = useState<PmMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);

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

  const loadMembers = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoadingMembers(true);
    try {
      const rows = await projectsApi.members(pid);
      setMembers(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load members');
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers(projectId);
  }, [projectId, loadMembers]);

  const project = projects.find((p) => p.id === projectId) || null;

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId || !userId.trim()) return;
    setSaving(true);
    try {
      await projectsApi.addMember(projectId, { userId: userId.trim(), role });
      toast.success('Member saved');
      setUserId('');
      await loadMembers(projectId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async (m: PmMember) => {
    if (!window.confirm(`Remove ${displayName(m.user)} from this project?`)) return;
    try {
      await projectsApi.removeMember(projectId, m.id);
      toast.success('Member removed');
      await loadMembers(projectId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  return (
    <div>
      <BizPageHeader
        title="Teams & Resources"
        description="Project members and their roles."
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
        <BizEmptyState title="Unable to load team" description={error} />
      ) : projects.length === 0 ? (
        <BizEmptyState
          title="No projects yet"
          description="Create a project to manage its team."
          action={
            <Link href="/projects/list?new=1" className="rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white">
              New project
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Project manager</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{displayName(project?.manager)}</p>
          </div>

          <BizCard title="Add or update member">
            <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
              <BizField label="User ID">
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Company user ID"
                  className={bizInput}
                  required
                />
              </BizField>
              <BizField label="Role">
                <select value={role} onChange={(e) => setRole(e.target.value)} className={`${bizSelect} w-full`}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </BizField>
              <button type="submit" disabled={saving} className={bizBtnPrimary}>
                {saving ? 'Saving…' : 'Save member'}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">
              Adding an existing member again updates their role.
            </p>
          </BizCard>

          {loadingMembers ? (
            <BizLoading height="h-32" />
          ) : members.length === 0 ? (
            <BizEmptyState
              title="No team members assigned"
              description="Members added to this project will be listed here."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{displayName(m.user)}</td>
                      <td className="px-4 py-3 text-gray-600">{m.user?.email || '—'}</td>
                      <td className="px-4 py-3">
                        <BizStatusBadge status={m.role || 'member'} tone="info" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void onRemove(m)}
                          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
