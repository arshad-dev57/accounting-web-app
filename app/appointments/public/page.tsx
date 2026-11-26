'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BizEmptyState, BizPageHeader } from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  BizLoading,
  BizNote,
  bizBtnPrimary,
  bizInput,
} from '../../../components/business-apps/bizUi';
import { appointmentsApi } from '../../../lib/business-apps-api';

export default function AppointmentsPublicPage() {
  const [slug, setSlug] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    appointmentsApi
      .settings()
      .then((s) => {
        if (cancelled) return;
        setSlug(s.publicSlug || '');
        setEnabled(!!s.publicEnabled);
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
      const updated = await appointmentsApi.updateSettings({
        publicSlug: slug.trim() || null,
        publicEnabled: enabled,
      });
      setSlug(updated.publicSlug || '');
      setEnabled(!!updated.publicEnabled);
      toast.success('Public booking settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader title="Public Booking Page" description="Let customers request appointments online." />
      {loading ? (
        <BizLoading height="h-40" />
      ) : error ? (
        <BizEmptyState title="Unable to load settings" description={error} />
      ) : (
        <div className="max-w-xl space-y-4">
          <BizNote>
            Shareable public page:{' '}
            {slug.trim()
              ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${slug.trim()}`
              : 'set a slug below'}
            . Customers can pick services and open slots without logging in.
          </BizNote>
          <form onSubmit={onSave}>
            <BizCard title="Public booking settings">
              <div className="space-y-4">
                <BizField label="Public URL slug">
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-company"
                    className={bizInput}
                  />
                </BizField>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Enable public booking
                </label>
                <button type="submit" disabled={saving} className={bizBtnPrimary}>
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
              </div>
            </BizCard>
          </form>
        </div>
      )}
    </div>
  );
}
