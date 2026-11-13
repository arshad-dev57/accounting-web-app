'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createCampaign, CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Campaign Name is required');
      return;
    }
    setLoading(true);
    try {
      const campaign = await createCampaign({
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
      toast.success('Campaign saved');
      router.push(`/crm/campaigns/${campaign.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To" />
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
        </>
      }
    >
      <DeskPageHeader
        title="New Campaign"
        dirty
        saving={loading}
        onSave={handleSave}
        onCancel={() => router.push('/crm/campaigns')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-2">
        <DeskField label="Campaign Name" required className="md:col-span-2">
          <input className={deskInput} value={form.name} onChange={set('name')} placeholder="e.g. Q4 Lead Generation Drive" />
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
          <textarea rows={4} className={deskInput} value={form.description} onChange={set('description')}
            placeholder="Campaign goals, strategy, notes..." />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
