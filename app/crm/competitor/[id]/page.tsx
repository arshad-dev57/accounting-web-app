'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Swords, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCompetitor,
  updateCompetitor,
  deleteCompetitor,
  type CompetitorRecord,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
} from '../../components/ErpDeskForm';
import NewCompetitorPage from '../new/page';

export default function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const competitorId = resolvedParams.id;

  // Support ERPNext temporary docname pattern like 'new-competitor-xxxx'
  if (competitorId.startsWith('new-competitor-')) {
    return <NewCompetitorPage />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form State
  const [competitorName, setCompetitorName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCompetitor(competitorId)
      .then((data) => {
        if (data) {
          setCompetitorName(data.name || '');
          setWebsite(data.website || '');
          setDescription((data as any).description || '');
          setIsActive(data.isActive !== false);
          setDirty(false);
        } else {
          toast.error('Competitor not found');
          router.push('/crm/competitor');
        }
      })
      .catch(() => {
        toast.error('Failed to load competitor');
        router.push('/crm/competitor');
      })
      .finally(() => setLoading(false));
  }, [competitorId, router]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = competitorName.trim();
    if (!name) {
      toast.error('Competitor Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateCompetitor(competitorId, {
        name,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      } as any);

      toast.success('Competitor updated');
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete competitor "${competitorName}"?`)) return;
    setDeleting(true);
    try {
      await deleteCompetitor(competitorId);
      toast.success('Competitor deleted');
      router.push('/crm/competitor');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
        Loading competitor…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── ERPNext Desk Header ───────────────────────── */}
      <DeskPageHeader
        title={competitorName || 'Competitor'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/competitor')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/competitor/new"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              + New
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      />

      <form onSubmit={handleSave}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Competitor Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Competitive Intelligence:</strong> Track competitors across active deals to measure head-to-head win/loss rates.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Active Status:</strong> Inactive competitors will not appear in the Opportunity competitor picker.
                    </p>
                  </div>
                </div>
              </DeskSideCard>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#014582]" />
                Competitor Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DeskField label="Competitor Name" required>
                  <input
                    type="text"
                    required
                    value={competitorName}
                    onChange={(e) => {
                      setCompetitorName(e.target.value);
                      setDirty(true);
                    }}
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Website">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="https://example.com"
                    className={deskInput}
                  />
                </DeskField>

                <div className="md:col-span-2">
                  <DeskField label="Description / Intel">
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Notes on competitor pricing, strengths, weaknesses, or market segment focus…"
                      className={deskInput}
                    />
                  </DeskField>
                </div>

                <div className="pt-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => {
                        setIsActive(e.target.checked);
                        setDirty(true);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      Is Active
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

