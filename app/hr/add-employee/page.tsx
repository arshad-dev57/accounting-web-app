'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, CircleCheck, Eye, EyeOff } from 'lucide-react';
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

const EMPLOYEE_TYPES = ['Office Employee', 'Field Employee', 'Salesman', 'Delivery Staff'];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  officeId: string;
  shift: string;
  joiningDate: string;
  status: (typeof STATUSES)[number];
  employeeType: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designation: '',
  department: 'IT',
  officeId: '',
  shift: '',
  joiningDate: new Date().toISOString().split('T')[0],
  status: 'Active',
  employeeType: 'Office Employee',
  password: '',
  confirmPassword: '',
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
  const [offices, setOffices] = React.useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = React.useState<string[]>([]);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    hrOfficesService
      .list()
      .then((data) => {
        if (!mounted) return;
        const active = data.filter((o) => o.status === 'Active');
        setOffices(active.map((o) => ({ id: o.id, name: o.name })));
        setForm((prev) => ({
          ...prev,
          officeId: active.some((o) => o.id === prev.officeId)
            ? prev.officeId
            : active[0]?.id || '',
        }));
      })
      .catch(() => {});
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
    if (!form.email.trim()) next.email = 'Email is required — this becomes their app login';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Invalid email address';
    }
    if (!form.officeId) next.officeId = 'Create and select an office first';
    if (!form.password.trim()) next.password = 'Set a password — HR will share this with the employee';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
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
      const result = await hrEmployeesService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        designation: form.designation,
        department: form.department,
        officeId: form.officeId,
        shift: form.shift,
        joiningDate: form.joiningDate,
        status: form.status,
        employeeType: form.employeeType,
        password: form.password,
      });
      toast.success(
        `${result.employee.employeeCode} created. Share the email and password you set — they will open the Employee Dashboard.`
      );
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
        subtitle="Creates a real app user. They log in and only see the Employee Dashboard."
        backHref="/hr/employees"
      />

      <HRWorkflowNotice
        tone="green"
        title="HR sets the login password"
        detail="Create the employee account, set a password here, and give them the email + password. They log in on the mobile app and only see the Employee Dashboard."
        action={
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold">
            <CircleCheck className="w-3.5 h-3.5" /> User + employee
          </span>
        }
      />

      <form onSubmit={handleSubmit}>
        <HRCard title="App login password" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <input
                  className={`${errors.password ? inputErrorCls : inputCls} pr-11`}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password')(e.target.value)}
                  placeholder="HR will share this with the employee"
                  autoComplete="new-password"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA6] hover:text-[#014582]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm password" required error={errors.confirmPassword}>
              <input
                className={errors.confirmPassword ? inputErrorCls : inputCls}
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword')(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                disabled={saving}
              />
            </Field>
          </div>
          <p className="mt-3 text-[11px] font-medium text-[#7A8FA6]">
            Minimum 6 characters. Give this password to the employee with their email.
          </p>
        </HRCard>

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
              <Field label="Email" required error={errors.email}>
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
              <Field label="Office" required error={errors.officeId}>
                <select
                  className={errors.officeId ? inputErrorCls : inputCls}
                  value={form.officeId}
                  onChange={(e) => set('officeId')(e.target.value)}
                  disabled={saving}
                >
                  {offices.length > 0 ? (
                    offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No offices yet — add one first</option>
                  )}
                </select>
              </Field>
              <Field label="Employee type">
                <select
                  className={inputCls}
                  value={form.employeeType}
                  onChange={(e) => set('employeeType')(e.target.value)}
                  disabled={saving}
                >
                  {EMPLOYEE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
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
