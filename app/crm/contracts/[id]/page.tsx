'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getContract, updateContract, deleteContract,
  CONTRACT_PARTY_TYPES, CONTRACT_STATUSES, type CrmContract,
} from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';

const FULFILMENT_STATUSES = ['N/A', 'Unfulfilled', 'Partially Fulfilled', 'Fulfilled', 'Lapsed'];

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [contract, setContract] = useState<CrmContract | null>(null);
  const [form, setForm] = useState({
    partyType: 'Customer',
    partyName: '',
    status: 'Unsigned',
    startDate: '',
    endDate: '',
    fulfilmentStatus: 'N/A',
    contractTerms: '',
    notes: '',
  });

  const load = useCallback(async () => {
    try {
      const data = await getContract(id);
      setContract(data);
      setForm({
        partyType: data.partyType || 'Customer',
        partyName: data.partyName || '',
        status: data.status || 'Unsigned',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
        fulfilmentStatus: data.fulfilmentStatus || 'N/A',
        contractTerms: data.contractTerms || '',
        notes: data.notes || '',
      });
      setDirty(false);
    } catch {
      router.push('/crm/contracts');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateContract(id, {
        partyName: form.partyName.trim(),
        partyType: form.partyType,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        fulfilmentStatus: form.fulfilmentStatus,
        contractTerms: form.contractTerms || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Contract updated');
      setDirty(false);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this contract?')) return;
    await deleteContract(id).catch(() => toast.error('Delete failed'));
    router.push('/crm/contracts');
  };

  if (loading || !contract) {
    return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To" />
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
          <DeskSideCard title="Actions">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-2 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </DeskSideCard>
        </>
      }
    >
      <DeskPageHeader
        title={contract.contractNumber || form.partyName || 'Contract'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/contracts')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-2">
        <DeskField label="Series">
          <input className={deskInput} value={contract.contractNumber || 'CRM-CT-.YYYY.-'} readOnly />
        </DeskField>
        <DeskField label="Party Type" required>
          <select className={deskSelect} value={form.partyType} onChange={set('partyType')}>
            {CONTRACT_PARTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </DeskField>
        <DeskField label="Party" required>
          <input className={deskInput} value={form.partyName} onChange={set('partyName')} />
        </DeskField>
        <DeskField label="Status" required>
          <select className={deskSelect} value={form.status} onChange={set('status')}>
            {CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <DeskField label="Start Date">
          <input type="date" className={deskInput} value={form.startDate} onChange={set('startDate')} />
        </DeskField>
        <DeskField label="End Date">
          <input type="date" className={deskInput} value={form.endDate} onChange={set('endDate')} />
        </DeskField>
      </div>

      <DeskSection title="Fulfilment">
        <DeskField label="Fulfilment Status">
          <select className={deskSelect} value={form.fulfilmentStatus} onChange={set('fulfilmentStatus')}>
            {FULFILMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
      </DeskSection>

      <DeskSection title="Contract Terms">
        <DeskField label="Contract Terms" className="md:col-span-3">
          <textarea rows={6} className={deskInput} value={form.contractTerms} onChange={set('contractTerms')} />
        </DeskField>
      </DeskSection>

      <DeskSection title="Notes">
        <DeskField label="Notes" className="md:col-span-3">
          <textarea rows={3} className={deskInput} value={form.notes} onChange={set('notes')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
