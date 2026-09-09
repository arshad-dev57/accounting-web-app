'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, CircleCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../ui';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import { hrOfficesService } from '@/lib/hr-offices-service';
import { hrShiftsService } from '@/lib/hr-shifts-service';

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all disabled:opacity-60';

const inputErrorCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#E74C3C] focus:outline-none focus:ring-2 focus:ring-[#E74C3C]/20 transition-all';

const DEPARTMENTS = ['IT', 'Sales', 'HR', 'Finance', 'Operations', 'Marketing'];
const STATUSES = ['Active', 'On Leave', 'Inactive'] as const;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  office: string;
  shift: string;
  joiningDate: string;
  status: (typeof STATUSES)[number];
};

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designation: '',
  department: 'IT',
  office: 'Head Office',
  shift: 'Morning Shift',
  joiningDate: new Date().toISOString().split('T')[0],
  status: 'Active',
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#7A8FA6] mb-1.5">
        {label} {required && <span className="text-[#E74C3C]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{error}</p>}
    </div>
  );
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [offices, setOffices] = React.useState<string[]>([]);
  const [shifts, setShifts] = React.useState<string[]>([]);

  // Load offices from the HR offices API so new offices show up here
  React.useEffect(() => {
    let mounted = true;
    hrOfficesService
      .list()
      .then((data) => {
        if (!mounted) return;
        const names = data.filter((o) => o.status === 'Active').map((o) => o.name);
        setOffices(names);
        setForm((prev) => ({
          ...prev,
          office: names.includes(prev.office) ? prev.office : names[0] || '',
        }));
      })
      .catch(() => {
        // Fail silently — the office field is not required
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Load shifts from the HR shifts API so new shifts show up here
  React.useEffect(() => {
    let mounted = true;
    hrShiftsService
      .list()
      .then((data) => {
        if (!mounted) return;
        const names = data.map((s) => s.name);
        setShifts(names);
        setForm((prev) => ({
          ...prev,
          shift: names.includes(prev.shift) ? prev.shift : names[0] || '',
        }));
      })
      .catch(() => {
        // Fail silently — the shift field is not required
      });
    return () => {
      mounted = false;
    };
  }, []);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Invalid email address';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const employee = await hrEmployeesService.create({ ...form });
      toast.success(`Employee ${employee.employeeCode} created`);
      router.push('/hr/employees');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRPage>
      <HRPageHeader
        title="Add Employee"
        subtitle="Create a staff record — employees do not get ERP access unless linked to a user"
        backHref="/hr/employees"
      />

      <HRWorkflowNotice tone="green" title="Step 1 of employee setup" detail="This creates the core HR profile. The next UI stages will collect employment documents, bank/payroll details, onboarding tasks, and manager assignment." action={<span className="inline-flex items-center gap-1 text-[11px] font-extrabold"><CircleCheck className="w-3.5 h-3.5" /> Core profile</span>} />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HRCard title="Personal Information">
            <div className="space-y-4">
              <Field label="First Name" required error={errors.firstName}>
                <input
                  className={errors.firstName ? inputErrorCls : inputCls}
                  value={form.firstName}
                  onChange={(e) => set('firstName')(e.target.value)}
                  placeholder="e.g. Ahmed"
                  disabled={saving}
                />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <input
                  className={errors.lastName ? inputErrorCls : inputCls}
                  value={form.lastName}
                  onChange={(e) => set('lastName')(e.target.value)}
                  placeholder="e.g. Khan"
                  disabled={saving}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  className={errors.email ? inputErrorCls : inputCls}
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email')(e.target.value)}
                  placeholder="employee@bisonstechs.com"
                  disabled={saving}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => set('phone')(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  disabled={saving}
                />
              </Field>
            </div>
          </HRCard>

          <HRCard title="Job Details">
            <div className="space-y-4">
              <Field label="Designation">
                <input
                  className={inputCls}
                  value={form.designation}
                  onChange={(e) => set('designation')(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  disabled={saving}
                />
              </Field>
              <Field label="Department">
                <select
                  className={inputCls}
                  value={form.department}
                  onChange={(e) => set('department')(e.target.value)}
                  disabled={saving}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Office">
                <select
                  className={inputCls}
                  value={form.office}
                  onChange={(e) => set('office')(e.target.value)}
                  disabled={saving}
                >
                  {offices.length > 0 ? (
                    offices.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))
                  ) : (
                    <option value="">No offices available</option>
                  )}
                </select>
              </Field>
              <Field label="Shift">
                <select
                  className={inputCls}
                  value={form.shift}
                  onChange={(e) => set('shift')(e.target.value)}
                  disabled={saving}
                >
                  {shifts.length > 0 ? (
                    shifts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  ) : (
                    <option value="">No shifts available</option>
                  )}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Joining Date">
                  <input
                    className={inputCls}
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => set('joiningDate')(e.target.value)}
                    disabled={saving}
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={(e) => set('status')(e.target.value)}
                    disabled={saving}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </HRCard>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#014582] hover:bg-[#014582]/90 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Save Employee'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/hr/employees')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#7A8FA6] hover:text-[#1A1A2E] hover:bg-[#F0F4F8] transition-all"
          >
            Cancel
          </button>
          <p className="text-[10px] font-medium text-[#7A8FA6]">
            Employee code is generated automatically (EMP-001, EMP-002, …)
          </p>
        </div>
      </form>
    </HRPage>
  );
}
