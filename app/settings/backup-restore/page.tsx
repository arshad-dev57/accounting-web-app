'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCw,
  Trash2,
  RotateCcw,
  Plus,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AccessDenied from '@/components/AccessDenied';
import { usePermissions } from '@/lib/usePermissions';
import {
  backupApi,
  type BackupCompanyOption,
  type BackupJob,
} from '@/lib/backup-api';

function fmtBytes(bytes?: number | null): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

const STATUS_STYLE: Record<string, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
  RESTORING: 'bg-amber-50 text-amber-800',
};

export function BackupRestoreSettingsPage() {
  const { isAdmin, can, ready } = usePermissions();
  const canManage = isAdmin || can('settings.company.edit') || can('settings.users.view');

  const [companies, setCompanies] = useState<BackupCompanyOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [summary, setSummary] = useState<{
    totalBackups: number;
    totalSizeBytes: number;
    lastBackupAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restoreJob, setRestoreJob] = useState<BackupJob | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, lRes] = await Promise.all([backupApi.listCompanies(), backupApi.list()]);
      setCompanies(cRes.companies || []);
      setJobs(lRes.jobs || []);
      setSummary(lRes.summary || null);
      if ((cRes.companies || []).length === 1) {
        setSelected(new Set([cRes.companies[0].id]));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!canManage) return;
    void load();
    const t = setInterval(() => void load(), 10000);
    return () => clearInterval(t);
  }, [ready, canManage, load]);

  const selectedNames = useMemo(
    () => companies.filter((c) => selected.has(c.id)).map((c) => c.name),
    [companies, selected]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(companies.map((c) => c.id)));
  const deselectAll = () => setSelected(new Set());

  const onCreate = async () => {
    if (!selected.size) {
      toast.error('Select at least one company');
      return;
    }
    setCreating(true);
    try {
      const res = await backupApi.create([...selected]);
      toast.success('Backup queued — you can download it when status is Completed');
      if (res.job) setJobs((prev) => [res.job, ...prev.filter((j) => j.id !== res.job.id)]);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const onDownload = async (job: BackupJob) => {
    setBusyId(`dl-${job.id}`);
    try {
      await backupApi.downloadToComputer(job.id, job.fileName || undefined);
      toast.success('Download started — save to Downloads, Desktop, USB, or external drive');
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (job: BackupJob) => {
    if (!window.confirm(`Delete backup "${job.name}"?`)) return;
    setBusyId(`del-${job.id}`);
    try {
      await backupApi.remove(job.id);
      toast.success('Backup deleted');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const onRestoreConfirm = async () => {
    if (!restoreJob) return;
    setBusyId(`rs-${restoreJob.id}`);
    try {
      await backupApi.restore(restoreJob.id);
      toast.success('Restore completed (a pre-restore snapshot was created first)');
      setRestoreJob(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
    } finally {
      setBusyId(null);
    }
  };

  if (ready && !canManage) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#014582]" />
            Backup & Restore
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create company-wise ZIP backups and download them to your computer or external drive.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Last Backup Date</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{fmtDate(summary?.lastBackupAt)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Total Backup Size</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {fmtBytes(summary?.totalSizeBytes)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Total Backups</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{summary?.totalBackups ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h2 className="text-sm font-bold text-gray-900">Create New Backup</h2>
        <p className="mt-1 text-xs text-gray-500">
          Select companies you are authorized to manage. Multi-company selections are packed into
          one ZIP.
        </p>

        {loading && !companies.length ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading companies…</div>
        ) : !companies.length ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No companies available for backup. You need company admin/owner access.
          </div>
        ) : (
          <>
            {companies.length > 1 && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#014582]"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500"
                >
                  <Square className="w-3.5 h-3.5" /> Deselect All
                </button>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {companies.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                  />
                  <span className="text-sm font-medium text-gray-800">{c.name}</span>
                </label>
              ))}
            </div>
            {selectedNames.length > 0 && (
              <p className="mt-3 text-xs text-gray-600">
                Selected: <span className="font-medium">{selectedNames.join(', ')}</span>
              </p>
            )}
            <button
              type="button"
              disabled={creating || !selected.size}
              onClick={() => void onCreate()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#01366a] disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Backup
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-bold text-gray-900">Backup History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Backup Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Selected Companies</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 font-medium">File Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!jobs.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No backups yet
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{job.name}</div>
                      {job.status !== 'COMPLETED' && job.progressMessage && (
                        <div className="text-xs text-gray-500">
                          {job.progressPercent ?? 0}% — {job.progressMessage}
                        </div>
                      )}
                      {job.errorMessage && (
                        <div className="text-xs text-red-600">{job.errorMessage}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">Company</td>
                    <td className="px-4 py-3 text-gray-600">
                      {(job.companies || []).map((c) => c.companyName).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(job.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtBytes(job.fileSizeBytes)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[job.status] || STATUS_STYLE.QUEUED}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          title="Download to Computer"
                          disabled={job.status !== 'COMPLETED' || busyId === `dl-${job.id}`}
                          onClick={() => void onDownload(job)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#014582] hover:underline disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                          type="button"
                          title="Restore"
                          disabled={job.status !== 'COMPLETED'}
                          onClick={() => setRestoreJob(job)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline disabled:opacity-40"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          disabled={['QUEUED', 'PROCESSING', 'RESTORING'].includes(job.status)}
                          onClick={() => void onDelete(job)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {restoreJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-50 p-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm restore</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Restoring <strong>{restoreJob.name}</strong> can overwrite existing records for:
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                  {(restoreJob.companies || []).map((c) => (
                    <li key={c.companyId}>{c.companyName}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-gray-600">
                  A pre-restore snapshot will be created automatically before changes are applied.
                  Other companies will not be affected.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                onClick={() => setRestoreJob(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === `rs-${restoreJob.id}`}
                onClick={() => void onRestoreConfirm()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-60"
              >
                {busyId === `rs-${restoreJob.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BackupRestoreSettingsPageDefault() {
  return <BackupRestoreSettingsPage />;
}
