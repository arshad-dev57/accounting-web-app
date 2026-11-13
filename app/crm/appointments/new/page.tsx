'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createAppointment, APPOINTMENT_STATUSES, APPOINTMENT_WITH } from '@/lib/crm-api';
import {
  DeskPageHeader, DeskFormShell, DeskSection, DeskField,
  deskInput, deskSelect, DeskSideCard,
} from '../../components/ErpDeskForm';

const emptyForm = {
  scheduledTime: '',
  status: 'Open',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  appointmentWith: 'Customer',
  details: '',
};

export default function NewAppointmentPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.scheduledTime) {
      toast.error('Scheduled Time is required');
      return;
    }
    if (!form.customerName.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    setSaving(true);
    try {
      const row = await createAppointment({
        scheduledTime: form.scheduledTime,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone || undefined,
        appointmentWith: form.appointmentWith || undefined,
        status: form.status,
        details: form.details || undefined,
      });
      setDirty(false);
      toast.success('Appointment created');
      router.push('/crm/appointments');
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
        title="New Appointment"
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.back()}
      />

      {/* Top grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-4">
        <DeskField label="Scheduled Time" required>
          <input type="datetime-local" className={deskInput} value={form.scheduledTime} onChange={set('scheduledTime')} />
        </DeskField>
        <DeskField label="Status" required>
          <select className={deskSelect} value={form.status} onChange={set('status')}>
            {APPOINTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <DeskField label="Appointment With">
          <select className={deskSelect} value={form.appointmentWith} onChange={set('appointmentWith')}>
            {APPOINTMENT_WITH.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
      </div>

      {/* Section: Customer */}
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

      {/* Notes */}
      <DeskSection title="Details">
        <DeskField label="Details" className="md:col-span-3">
          <textarea rows={4} className={deskInput} value={form.details} onChange={set('details')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
