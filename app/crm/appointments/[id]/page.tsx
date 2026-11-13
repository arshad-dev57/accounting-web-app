'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getAppointment, updateAppointment, deleteAppointment,
  APPOINTMENT_STATUSES, APPOINTMENT_WITH,
} from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    scheduledTime: '',
    status: 'Open',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    appointmentWith: 'Customer',
    details: '',
  });

  const load = useCallback(async () => {
    try {
      const data = await getAppointment(id);
      setForm({
        scheduledTime: toLocalInput(data.scheduledTime),
        status: data.status || 'Open',
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || '',
        customerPhone: data.customerPhone || '',
        appointmentWith: data.appointmentWith || 'Customer',
        details: data.details || '',
      });
      setDirty(false);
    } catch {
      router.push('/crm/appointments');
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
    if (!form.scheduledTime || !form.customerName.trim()) {
      toast.error('Scheduled Time and Customer Name are required');
      return;
    }
    setSaving(true);
    try {
      await updateAppointment(id, {
        scheduledTime: new Date(form.scheduledTime).toISOString(),
        status: form.status,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone || undefined,
        appointmentWith: form.appointmentWith || undefined,
        details: form.details || undefined,
      });
      toast.success('Appointment updated');
      setDirty(false);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this appointment?')) return;
    await deleteAppointment(id).catch(() => toast.error('Delete failed'));
    router.push('/crm/appointments');
  };

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To" />
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
        title={form.customerName || 'Appointment'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/appointments')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-2">
        <DeskField label="Scheduled Time" required>
          <input type="datetime-local" className={deskInput} value={form.scheduledTime} onChange={set('scheduledTime')} />
        </DeskField>
        <DeskField label="Status" required>
          <select className={deskSelect} value={form.status} onChange={set('status')}>
            {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <DeskField label="Appointment With">
          <select className={deskSelect} value={form.appointmentWith} onChange={set('appointmentWith')}>
            {APPOINTMENT_WITH.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
      </div>

      <DeskSection title="Customer Details">
        <DeskField label="Customer Name" required>
          <input className={deskInput} value={form.customerName} onChange={set('customerName')} />
        </DeskField>
        <DeskField label="Customer Email">
          <input type="email" className={deskInput} value={form.customerEmail} onChange={set('customerEmail')} />
        </DeskField>
        <DeskField label="Customer Phone">
          <input className={deskInput} value={form.customerPhone} onChange={set('customerPhone')} />
        </DeskField>
      </DeskSection>

      <DeskSection title="Details">
        <DeskField label="Details" className="md:col-span-3">
          <textarea rows={4} className={deskInput} value={form.details} onChange={set('details')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
