'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Save, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../../../ui';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import { hrOfficesService } from '@/lib/hr-offices-service';
import { hrShiftsService } from '@/lib/hr-shifts-service';
import { hrHcmService } from '@/lib/hr-hcm-service';

const inputCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all disabled:opacity-60';

const inputErrorCls =
  'w-full bg-white rounded-xl py-2.5 px-4 text-sm text-[#1A1A2E] border border-[#E74C3C] focus:outline-none focus:ring-2 focus:ring-[#E74C3C]/20 transition-all';

const STATUSES = ['Active', 'On Leave', 'Inactive'] as const;
const EMPLOYEE_TYPES = ['Office Employee', 'Field Employee', 'Salesman', 'Delivery Staff'];

const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Contract', 'Intern', 'Probation'] as const;

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
  employmentType: string;
  salary: string;
  payBasis: 'monthly' | 'hourly' | 'daily';
  // Enterprise fields stored in profile JSON
  probationEndDate: string;
  confirmationDate: string;
  contractEndDate: string;
  terminationDate: string;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  emergencyContact: string;
  emergencyPhone: string;
  payGrade: string;
};

function Field({
  label,
  required,
  error,
  action,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-xs font-bold text-[#7A8FA6]">
          {label} {required && <span className="text-[#E74C3C]">*</span>}
        </label>
        {action}
      </div>
      {children}
      {error && <p className="mt-1 text-[10px] font-semibold text-[#E74C3C]">{error}</p>}
    </div>
  );
}

function OrgLink({ label }: { label: string }) {
  return (
    <Link
      href="/hr/organization"
      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#014582] hover:underline shrink-0"
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </Link>
  );
}

export default function EditEmployeePage() {
  const params = useParams();
  const id = String(params.id || '');
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [offices, setOffices] = React.useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = React.useState<string[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [designations, setDesignations] = React.useState<string[]>([]);
  const [code, setCode] = React.useState('');
  const [form, setForm] = React.useState<FormState>({
    firstName: '', lastName: '', email: '', phone: '',
    designation: '', department: '', officeId: '', shift: '',
    joiningDate: '', status: 'Active',
    employeeType: 'Office Employee', employmentType: 'Full Time',
    salary: '', payBasis: 'monthly',
    probationEndDate: '', confirmationDate: '', contractEndDate: '',
    terminationDate: '', bankName: '', bankAccount: '', bankBranch: '',
    emergencyContact: '', emergencyPhone: '', payGrade: '',
  });

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const [emp, officeList, shiftList, deps, desigs] = await Promise.all([
          hrEmployeesService.get(id),
          hrOfficesService.list(),
          hrShiftsService.list().catch(() => []),
          hrHcmService.departments().catch(() => []),
          hrHcmService.designations().catch(() => []),
        ]);
        if (!mounted) return;
        const deptNames = deps.map((d: any) => String(d.name || '').trim()).filter(Boolean);
        const desigNames = desigs.map((d: any) => String(d.name || '').trim()).filter(Boolean);
        const shiftNames = shiftList.map((s: any) => s.name);
        const activeOffices = officeList.filter((o) => o.status === 'Active');
        setDepartments(deptNames);
        setDesignations(desigNames);
        setShifts(shiftNames);
        setOffices(activeOffices.map((o) => ({ id: o.id, name: o.name })));
        setCode(emp.employeeCode);
        const status = (STATUSES.includes(emp.status as any) ? emp.status : 'Active') as FormState['status'];
        const basis = (['monthly', 'hourly', 'daily'].includes(emp.payBasis || '')
          ? emp.payBasis : 'monthly') as FormState['payBasis'];
        const profile = (emp as any).profile || {};
        setForm({
          firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
          phone: emp.phone || '',
          designation: emp.designation || desigNames[0] || '',
          department: emp.department || deptNames[0] || '',
          officeId: emp.officeId || activeOffices[0]?.id || '',
          shift: emp.shift || shiftNames[0] || '',
          joiningDate: emp.joiningDate ? String(emp.joiningDate).slice(0, 10) : '',
          status,
          employeeType: emp.employeeType || 'Office Employee',
          employmentType: emp.employmentType || 'Full Time',
          salary: emp.salary > 0 ? String(emp.salary) : '',
          payBasis: basis,
          probationEndDate: profile.probationEndDate || '',
          confirmationDate: profile.confirmationDate || '',
          contractEndDate: profile.contractEndDate || '',
          terminationDate: profile.terminationDate || '',
          bankName: profile.bankName || '',
          bankAccount: profile.bankAccount || '',
          bankBranch: profile.bankBranch || '',
          emergencyContact: profile.emergencyContact || '',
          emergencyPhone: profile.emergencyPhone || '',
          payGrade: profile.payGrade || '',
        });
      } catch (e: any) {
        toast.error(e.message || 'Failed to load employee');
        router.push('/hr/employees');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'Required';
    if (!form.lastName.trim()) next.lastName = 'Required';
    if (!form.department) next.department = 'Select a department';
    if (!form.designation) next.designation = 'Select a designation';
    if (!form.officeId) next.officeId = 'Select an office';
    const salaryNum = Number(form.salary);
    if (!form.salary.trim() || !Number.isFinite(salaryNum) || salaryNum <= 0) {
      next.salary =
        form.payBasis === 'hourly'
          ? 'Enter hourly rate > 0'
          : form.payBasis === 'daily'
            ? 'Enter daily rate > 0'
            : 'Enter monthly package > 0';
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
      await hrEmployeesService.update(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone,
        designation: form.designation,
        department: form.department,
        officeId: form.officeId || null,
        shift: form.shift,
        joiningDate: form.joiningDate,
        status: form.status,
        employeeType: form.employeeType,
        employmentType: form.employmentType,
        salary: Number(form.salary),
        payBasis: form.payBasis,
        // Profile JSON fields
        probationEndDate: form.probationEndDate || null,
        confirmationDate: form.confirmationDate || null,
        contractEndDate: form.contractEndDate || null,
        terminationDate: form.terminationDate || null,
        bankName: form.bankName || null,
        bankAccount: form.bankAccount || null,
        bankBranch: form.bankBranch || null,
        emergencyContact: form.emergencyContact || null,
        emergencyPhone: form.emergencyPhone || null,
        payGrade: form.payGrade || null,
      } as any);
      toast.success('Employee updated');
      router.push(`/hr/employees/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <HRPage>
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#014582]" />
        </div>
      </HRPage>
    );
  }

  return (
    <HRPage>
      <HRPageHeader
        title="Edit Employee"
        subtitle={code ? `${code} · ${form.email}` : 'Update profile & package'}
        backHref={`/hr/employees/${id}`}
      />
      <HRWorkflowNotice
        title="Email / login stays the same"
        detail="Name, job details, salary and status update here. Login email cannot be changed from this screen."
      />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HRCard title="Personal">
            <div className="space-y-4">
              <Field label="First name" required error={errors.firstName}>
                <input className={errors.firstName ? inputErrorCls : inputCls} value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} disabled={saving} />
              </Field>
              <Field label="Last name" required error={errors.lastName}>
                <input className={errors.lastName ? inputErrorCls : inputCls} value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} disabled={saving} />
              </Field>
              <Field label="Email">
                <input className={`${inputCls} opacity-70`} value={form.email} disabled />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={form.phone} onChange={(e) => set('phone')(e.target.value)} disabled={saving} />
              </Field>
            </div>
          </HRCard>
          <HRCard title="Job details">
            <div className="space-y-4">
              <Field label="Department" required error={errors.department} action={<OrgLink label="Manage" />}>
                <select className={errors.department ? inputErrorCls : inputCls} value={form.department} onChange={(e) => set('department')(e.target.value)} disabled={saving}>
                  <option value="">Select</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  {form.department && !departments.includes(form.department) && <option value={form.department}>{form.department} (current)</option>}
                </select>
              </Field>
              <Field label="Designation" required error={errors.designation} action={<OrgLink label="Manage" />}>
                <select className={errors.designation ? inputErrorCls : inputCls} value={form.designation} onChange={(e) => set('designation')(e.target.value)} disabled={saving}>
                  <option value="">Select</option>
                  {designations.map((d) => <option key={d} value={d}>{d}</option>)}
                  {form.designation && !designations.includes(form.designation) && <option value={form.designation}>{form.designation} (current)</option>}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employee type">
                  <select className={inputCls} value={form.employeeType} onChange={(e) => set('employeeType')(e.target.value)} disabled={saving}>
                    {EMPLOYEE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Employment type">
                  <select className={inputCls} value={form.employmentType} onChange={(e) => set('employmentType')(e.target.value)} disabled={saving}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pay format" required>
                  <select className={inputCls} value={form.payBasis} onChange={(e) => set('payBasis')(e.target.value)} disabled={saving}>
                    <option value="monthly">Monthly package</option>
                    <option value="daily">Daily rate</option>
                    <option value="hourly">Hourly rate</option>
                  </select>
                </Field>
                <Field label={form.payBasis === 'hourly' ? 'Hourly rate (Rs)' : form.payBasis === 'daily' ? 'Daily rate (Rs)' : 'Monthly package (Rs)'} required error={errors.salary}>
                  <input type="number" min={1} className={errors.salary ? inputErrorCls : inputCls} value={form.salary} onChange={(e) => set('salary')(e.target.value)} disabled={saving} />
                </Field>
              </div>
              <Field label="Pay grade / band">
                <input className={inputCls} placeholder="e.g. G-7, BPS-17, Band-3" value={form.payGrade} onChange={(e) => set('payGrade')(e.target.value)} disabled={saving} />
              </Field>
              <Field label="Office" required error={errors.officeId}>
                <select className={errors.officeId ? inputErrorCls : inputCls} value={form.officeId} onChange={(e) => set('officeId')(e.target.value)} disabled={saving}>
                  <option value="">Select</option>
                  {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </Field>
              <Field label="Shift">
                <select className={inputCls} value={form.shift} onChange={(e) => set('shift')(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {shifts.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.shift && !shifts.includes(form.shift) && <option value={form.shift}>{form.shift}</option>}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Joining date">
                  <input type="date" className={inputCls} value={form.joiningDate} onChange={(e) => set('joiningDate')(e.target.value)} disabled={saving} />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.status} onChange={(e) => set('status')(e.target.value)} disabled={saving}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </HRCard>
        </div>

        {/* Lifecycle dates */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HRCard title="Employment lifecycle">
            <div className="space-y-4">
              <p className="text-xs text-[#7A8FA6]">Probation end date is used by payroll to waive PF and flag the slip. Termination date triggers final-settlement pro-rating.</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Probation end date">
                  <input type="date" className={inputCls} value={form.probationEndDate} onChange={(e) => set('probationEndDate')(e.target.value)} disabled={saving} />
                </Field>
                <Field label="Confirmation date">
                  <input type="date" className={inputCls} value={form.confirmationDate} onChange={(e) => set('confirmationDate')(e.target.value)} disabled={saving} />
                </Field>
                <Field label="Contract end date">
                  <input type="date" className={inputCls} value={form.contractEndDate} onChange={(e) => set('contractEndDate')(e.target.value)} disabled={saving} />
                </Field>
                <Field label="Termination / last working day">
                  <input type="date" className={inputCls} value={form.terminationDate} onChange={(e) => set('terminationDate')(e.target.value)} disabled={saving} />
                </Field>
              </div>
            </div>
          </HRCard>

          <HRCard title="Bank & emergency">
            <div className="space-y-4">
              <Field label="Bank name">
                <input className={inputCls} placeholder="e.g. HBL, UBL, Meezan" value={form.bankName} onChange={(e) => set('bankName')(e.target.value)} disabled={saving} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Account number / IBAN">
                  <input className={inputCls} placeholder="Account or IBAN" value={form.bankAccount} onChange={(e) => set('bankAccount')(e.target.value)} disabled={saving} />
                </Field>
                <Field label="Branch / IFSC">
                  <input className={inputCls} placeholder="Branch name or code" value={form.bankBranch} onChange={(e) => set('bankBranch')(e.target.value)} disabled={saving} />
                </Field>
              </div>
              <Field label="Emergency contact name">
                <input className={inputCls} placeholder="Next of kin" value={form.emergencyContact} onChange={(e) => set('emergencyContact')(e.target.value)} disabled={saving} />
              </Field>
              <Field label="Emergency contact phone">
                <input className={inputCls} placeholder="+92 3xx xxxxxxx" value={form.emergencyPhone} onChange={(e) => set('emergencyPhone')(e.target.value)} disabled={saving} />
              </Field>
            </div>
          </HRCard>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-[#014582] text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
          <Link href={`/hr/employees/${id}`} className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold border border-[#DDE4EE] text-[#7A8FA6]">
            Cancel
          </Link>
        </div>
      </form>
    </HRPage>
  );
}
