'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
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
} from '../../../components/business-apps/bizUi';
import { projectsApi } from '../../../lib/business-apps-api';

const toList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const parseList = (s: string) => [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))];

export default function ProjectsSettingsPage() {
  const [statuses, setStatuses] = useState('');
  const [priorities, setPriorities] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .settings()
      .then((s) => {
        if (cancelled) return;
        setStatuses(toList(s.defaultStatuses).join(', '));
        setPriorities(toList(s.defaultPriorities).join(', '));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load settings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const defaultStatuses = parseList(statuses);
    const defaultPriorities = parseList(priorities);
    if (!defaultStatuses.length || !defaultPriorities.length) {
      toast.error('Statuses and priorities cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const s = await projectsApi.updateSettings({ defaultStatuses, defaultPriorities });
      setStatuses(toList(s.defaultStatuses).join(', '));
      setPriorities(toList(s.defaultPriorities).join(', '));
      toast.success('Project settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader title="Project Settings" description="Default statuses and priorities used across projects." />
      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load settings" description={error} />
      ) : (
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <BizCard title="Default statuses">
              <BizField label="Comma-separated list">
                <input value={statuses} onChange={(e) => setStatuses(e.target.value)} className={bizInput} />
              </BizField>
              <div className="mt-3 flex flex-wrap gap-2">
                {parseList(statuses).map((s) => (
                  <BizStatusBadge key={s} status={s} tone="info" />
                ))}
              </div>
            </BizCard>
            <BizCard title="Default priorities">
              <BizField label="Comma-separated list">
                <input value={priorities} onChange={(e) => setPriorities(e.target.value)} className={bizInput} />
              </BizField>
              <div className="mt-3 flex flex-wrap gap-2">
                {parseList(priorities).map((s) => (
                  <BizStatusBadge key={s} status={s} tone="neutral" />
                ))}
              </div>
            </BizCard>
          </div>
          <button type="submit" disabled={saving} className={bizBtnPrimary}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}
    </div>
  );
}
