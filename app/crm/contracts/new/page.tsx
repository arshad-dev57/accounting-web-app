'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createContract, CONTRACT_PARTY_TYPES, CONTRACT_STATUSES } from '@/lib/crm-api';
import {
  DeskPageHeader, DeskFormShell, DeskSection, DeskField,
  deskInput, deskSelect, DeskSideCard,
} from '../../components/ErpDeskForm';

const FULFILMENT_STATUSES = ['N/A', 'Unfulfilled', 'Partially Fulfilled', 'Fulfilled', 'Lapsed'];
const SERIES_DEFAULT = 'CRM-CT-.YYYY.-';

const emptyForm = {
  series: SERIES_DEFAULT,
  partyType: 'Customer',
  partyName: '',
  partyId: '',
  status: 'Unsigned',
  startDate: '',
  endDate: '',
  signedOn: '',
  signedByCompany: '',
  signedByParty: '',
  fulfilmentStatus: 'N/A',
  fulfilmentDeadline: '',
  ipOwnership: '',
  contractTerms: '',
  notes: '',
};

export default function NewContractPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    setSaving(true);
    try {
      const row = await createContract({
        partyName: form.partyName.trim(),
        partyType: form.partyType,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        contractTerms: form.contractTerms || undefined,
        notes: form.notes || undefined,
      });
      setDirty(false);
      toast.success('Contract created');
      router.push(`/crm/contracts/${row.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
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
        title="New Contract"
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.back()}
      />

      {/* Top grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-4">
        <DeskField label="Series">
          <input className={deskInput} value={form.series} onChange={set('series')} />
        </DeskField>
        <DeskField label="Party Type" required>
          <select className={deskSelect} value={form.partyType} onChange={set('partyType')}>
            {CONTRACT_PARTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </DeskField>
        <DeskField label="Party" required>
          <input className={deskInput} value={form.partyName} onChange={set('partyName')} placeholder="Party Name" />
        </DeskField>

        <DeskField label="Status" required>
          <select className={deskSelect} value={form.status} onChange={set('status')}>
            {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <DeskField label="Start Date">
          <input type="date" className={deskInput} value={form.startDate} onChange={set('startDate')} />
        </DeskField>
        <DeskField label="End Date">
          <input type="date" className={deskInput} value={form.endDate} onChange={set('endDate')} />
        </DeskField>
      </div>

      {/* Section: Signed By */}
      <DeskSection title="Signed By">
        <DeskField label="Signed On">
          <input type="date" className={deskInput} value={form.signedOn} onChange={set('signedOn')} />
        </DeskField>
        <DeskField label="Signed By (Company)">
          <input className={deskInput} value={form.signedByCompany} onChange={set('signedByCompany')} />
        </DeskField>
        <DeskField label="Signed By (Party)">
          <input className={deskInput} value={form.signedByParty} onChange={set('signedByParty')} />
        </DeskField>
      </DeskSection>

      {/* Section: Fulfilment */}
      <DeskSection title="Fulfilment">
        <DeskField label="Fulfilment Status">
          <select className={deskSelect} value={form.fulfilmentStatus} onChange={set('fulfilmentStatus')}>
            {FULFILMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <DeskField label="Fulfilment Deadline">
          <input type="date" className={deskInput} value={form.fulfilmentDeadline} onChange={set('fulfilmentDeadline')} />
        </DeskField>
        <DeskField label="IP Ownership">
          <input className={deskInput} value={form.ipOwnership} onChange={set('ipOwnership')} />
        </DeskField>
      </DeskSection>

      {/* Contract Terms */}
      <DeskSection title="Contract Terms">
        <DeskField label="Contract Terms" className="md:col-span-3">
          <textarea rows={6} className={deskInput} value={form.contractTerms} onChange={set('contractTerms')} placeholder="Enter contract terms..." />
        </DeskField>
      </DeskSection>

      {/* Notes */}
      <DeskSection title="Notes">
        <DeskField label="Notes" className="md:col-span-3">
          <textarea rows={3} className={deskInput} value={form.notes} onChange={set('notes')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
