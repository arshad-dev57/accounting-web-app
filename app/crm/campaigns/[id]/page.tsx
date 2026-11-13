'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getCampaignById, updateCampaign, deleteCampaign,
  CAMPAIGN_TYPES, CAMPAIGN_STATUSES, type Campaign,
} from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'Email',
    status: 'Draft',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'PKR',
    expectedRevenue: '',
    targetCount: '',
    description: '',
  });

  const fetchCampaign = useCallback(async () => {
    try {
      const data = await getCampaignById(id);
      setCampaign(data);
      setForm({
        name: data.name || '',
        type: data.type || 'Email',
        status: data.status || 'Draft',
        startDate: data.startDate ? String(data.startDate).slice(0, 10) : '',
        endDate: data.endDate ? String(data.endDate).slice(0, 10) : '',
        budget: data.budget != null ? String(data.budget) : '',
        currency: data.currency || 'PKR',
        expectedRevenue: data.expectedRevenue != null ? String(data.expectedRevenue) : '',
        targetCount: data.targetCount != null ? String(data.targetCount) : '',
        description: data.description || '',
      });
      setDirty(false);
    } catch {
      router.push('/crm/campaigns');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!campaign) return;
    if (!form.name.trim()) {
      toast.error('Campaign Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateCampaign(campaign.id, {
        name: form.name.trim(),
        type: form.type,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        currency: form.currency,
        expectedRevenue: form.expectedRevenue ? parseFloat(form.expectedRevenue) : undefined,
        targetCount: form.targetCount ? parseInt(form.targetCount, 10) : undefined,
        description: form.description || undefined,
      });
      toast.success('Campaign updated');
      setDirty(false);
      fetchCampaign();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !confirm('Delete this campaign?')) return;
    await deleteCampaign(campaign.id).catch(() => {});
    router.push('/crm/campaigns');
  };

  if (loading || !campaign) {
    return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To">
            {campaign.assignedTo ? (
              <p className="text-sm text-gray-700">{campaign.assignedTo.firstName} {campaign.assignedTo.lastName}</p>
            ) : undefined}
          </DeskSideCard>
          <DeskSideCard title="Stats">
            <p className="text-xs text-gray-500">{campaign._count?.leads ?? 0} linked leads</p>
          </DeskSideCard>
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
          <DeskSideCard title="Actions">
            <button type="button" onClick={handleDelete}
              className="w-full px-2 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50">
              Delete
            </button>
          </DeskSideCard>
        </>
      }
    >
      <DeskPageHeader
        title={campaign.name}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/campaigns')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-2">
        <DeskField label="Campaign Name" required className="md:col-span-2">
          <input className={deskInput} value={form.name} onChange={set('name')} />
        </DeskField>
        <DeskField label="Status">
          <select className={deskSelect} value={form.status} onChange={set('status')}>
            {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <DeskField label="Campaign Type">
          <select className={deskSelect} value={form.type} onChange={set('type')}>
            {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </DeskField>
        <DeskField label="Start Date">
          <input type="date" className={deskInput} value={form.startDate} onChange={set('startDate')} />
        </DeskField>
        <DeskField label="End Date">
          <input type="date" className={deskInput} value={form.endDate} onChange={set('endDate')} />
        </DeskField>
      </div>

      <DeskSection title="Budget & Targets">
        <DeskField label="Currency">
          <select className={deskSelect} value={form.currency} onChange={set('currency')}>
            {['PKR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </DeskField>
        <DeskField label="Budget">
          <input type="number" className={deskInput} value={form.budget} onChange={set('budget')} />
        </DeskField>
        <DeskField label="Expected Revenue">
          <input type="number" className={deskInput} value={form.expectedRevenue} onChange={set('expectedRevenue')} />
        </DeskField>
        <DeskField label="Target Count">
          <input type="number" className={deskInput} value={form.targetCount} onChange={set('targetCount')} />
        </DeskField>
      </DeskSection>

      <DeskSection title="Description">
        <DeskField label="Description" className="md:col-span-3">
          <textarea rows={4} className={deskInput} value={form.description} onChange={set('description')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
