'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BizEmptyState, BizPageHeader } from '../../../components/business-apps/BusinessAppShell';
import { BizCard, BizLoading, bizBtnPrimary } from '../../../components/business-apps/bizUi';
import { noticesApi } from '../../../lib/business-apps-api';

export default function NoticesSettingsPage() {
  const [requireApproval, setRequireApproval] = useState(false);
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    noticesApi
      .settings()
      .then((s) => {
        if (cancelled) return;
        setRequireApproval(Boolean(s.requireApproval));
        setNotifyOnPublish(s.notifyOnPublish === undefined ? true : Boolean(s.notifyOnPublish));
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
    setSaving(true);
    try {
      const s = await noticesApi.updateSettings({ requireApproval, notifyOnPublish });
      setRequireApproval(Boolean(s.requireApproval));
      setNotifyOnPublish(Boolean(s.notifyOnPublish));
      toast.success('Notice board settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader title="Notice Board Settings" description="Approval workflow and publishing notifications." />
      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load settings" description={error} />
      ) : (
        <form onSubmit={onSave} className="max-w-2xl space-y-4">
          <BizCard title="Publishing">
            <div className="space-y-4 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#014582]"
                />
                <span>
                  <span className="block font-medium text-gray-900">Require approval before publishing</span>
                  <span className="text-gray-500">
                    Notices go to pending approval and must be approved by a user with permission.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={notifyOnPublish}
                  onChange={(e) => setNotifyOnPublish(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#014582]"
                />
                <span>
                  <span className="block font-medium text-gray-900">Notify audience on publish</span>
                  <span className="text-gray-500">Send a notification when a notice is published.</span>
                </span>
              </label>
            </div>
          </BizCard>
          <button type="submit" disabled={saving} className={bizBtnPrimary}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}
    </div>
  );
}
