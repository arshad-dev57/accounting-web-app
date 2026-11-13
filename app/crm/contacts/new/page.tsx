'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Plus, Trash2, Mail, Phone, Building2,
  Info, CheckCircle2, ShieldCheck, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createContact,
  getAccounts,
  SALUTATIONS,
  GENDERS,
  type Contact,
  type ContactLink,
  type CRMAccount,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';

const STATUS_OPTIONS = ['Passive', 'Open', 'Replied'];

const DEPARTMENT_OPTIONS = [
  '',
  'Sales',
  'Marketing',
  'Customer Support',
  'Finance & Accounting',
  'Management',
  'Procurement',
  'Legal',
  'Human Resources',
  'Engineering / IT',
];

const LINK_DOCTYPES = ['Customer', 'Supplier', 'Lead', 'Prospect'];

function NewContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillAccountId = searchParams.get('accountId') || '';
  const prefillAccountName = searchParams.get('accountName') || '';

  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<CRMAccount[]>([]);

  // Form State
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('Passive');
  const [accountId, setAccountId] = useState(prefillAccountId);

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);

  const [links, setLinks] = useState<ContactLink[]>(
    prefillAccountName
      ? [
          {
            id: '1',
            linkDoctype: 'Customer',
            linkName: prefillAccountName,
            linkTitle: prefillAccountName,
          },
        ]
      : []
  );

  const [notes, setNotes] = useState('');

  useEffect(() => {
    getAccounts({ limit: 200 })
      .then((r) => {
        const list = r.accounts ?? [];
        setAccounts(list);
        if (prefillAccountId && !links.length) {
          const acc = list.find((a) => a.id === prefillAccountId);
          if (acc) {
            setLinks([
              {
                id: '1',
                linkDoctype: 'Customer',
                linkName: acc.name,
                linkTitle: acc.name,
              },
            ]);
          }
        }
      })
      .catch(() => {});
  }, [prefillAccountId, links.length]);

  const handleAddLink = () => {
    setLinks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        linkDoctype: 'Customer',
        linkName: '',
        linkTitle: '',
      },
    ]);
  };

  const handleUpdateLink = (index: number, field: keyof ContactLink, value: any) => {
    setLinks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!firstName.trim()) {
      toast.error('First Name is required');
      return;
    }

    setSaving(true);
    try {
      const fullName = [salutation, firstName, middleName, lastName]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ');

      const contact = await createContact({
        salutation: salutation || undefined,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        fullName: fullName || firstName.trim(),
        title: designation.trim() || undefined,
        gender: gender || undefined,
        status: status || 'Passive',
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        phone: phone.trim() || undefined,
        department: department || undefined,
        isPrimaryContact,
        unsubscribed,
        accountId: accountId || undefined,
        links: links.filter((l) => l.linkName.trim()),
        notes: notes.trim() || undefined,
      } as any);

      toast.success('Contact created successfully');
      router.push(`/crm/contacts/${contact.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="space-y-4 pb-16">
      {/* ── ERPNext Desk Header ───────────────────────── */}
      <DeskPageHeader
        title="New Contact"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/contacts')}
        actions={
          <Link
            href="/crm/contacts"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Contact Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Shared Contacts:</strong> Contacts represent individuals at Customers, Suppliers, or Leads.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Primary Contact:</strong> Designates this person as the default recipient for invoices and quotation emails.
                    </p>
                  </div>
                </div>
              </DeskSideCard>

              {selectedAccount && (
                <DeskSideCard title="Linked Account">
                  <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#014582]" />
                    {selectedAccount.name}
                  </p>
                  {selectedAccount.type && (
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Type: {selectedAccount.type}
                    </span>
                  )}
                </DeskSideCard>
              )}

              {isPrimaryContact && (
                <DeskSideCard title="Primary Status">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block text-center">
                    ✓ Primary Contact
                  </span>
                </DeskSideCard>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* ── Section: Person Details ───────────────────────── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-[#014582]" />
                Person Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <DeskField label="Salutation">
                  <select
                    value={salutation}
                    onChange={(e) => setSalutation(e.target.value)}
                    className={deskSelect}
                  >
                    <option value="">None</option>
                    {SALUTATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="First Name" required>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className={deskInput}
                    autoFocus
                  />
                </DeskField>

                <DeskField label="Middle Name">
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Last Name">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Designation (Job Title)">
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Procurement Manager"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Gender">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={deskSelect}
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={deskSelect}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <DeskField label="Company / Customer Account" className="md:col-span-2">
                  <select
                    value={accountId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setAccountId(id);
                      const acc = accounts.find((a) => a.id === id);
                      if (acc) {
                        setLinks([
                          {
                            id: '1',
                            linkDoctype: 'Customer',
                            linkName: acc.name,
                            linkTitle: acc.name,
                          },
                        ]);
                      }
                    }}
                    className={deskSelect}
                  >
                    <option value="">Select Organization / Customer</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </DeskField>
              </div>
            </div>

            {/* ── Section: Contact Details ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#014582]" />
                Contact Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <DeskField label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Mobile No">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+92 300 1234567"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Phone (Landline)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 42 1234567"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Department">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={deskSelect}
                  >
                    {DEPARTMENT_OPTIONS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep || 'Select Department'}
                      </option>
                    ))}
                  </select>
                </DeskField>

                <div className="flex items-center gap-6 md:col-span-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPrimaryContact}
                      onChange={(e) => setIsPrimaryContact(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                    />
                    <span className="text-xs font-semibold text-gray-800">
                      Is Primary Contact
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={unsubscribed}
                      onChange={(e) => setUnsubscribed(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-500 focus:ring-gray-400"
                    />
                    <span className="text-xs text-gray-600">Unsubscribed</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Section: Reference / Dynamic Links ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#014582]" />
                    Reference Links
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Link this contact to Customers, Suppliers, Leads, or Prospects.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f6] hover:bg-gray-200 text-gray-800 rounded-md text-xs font-medium border border-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Link Document Type</th>
                        <th className="py-2.5 px-3 min-w-[240px]">Link Name / Organization</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Link Title</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {links.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400">
                            No links added. Click &quot;Add Row&quot; to connect this contact to accounts or entities.
                          </td>
                        </tr>
                      ) : (
                        links.map((row, index) => (
                          <tr key={row.id || index} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 text-center text-gray-400 font-mono">
                              {index + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.linkDoctype}
                                onChange={(e) =>
                                  handleUpdateLink(index, 'linkDoctype', e.target.value)
                                }
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              >
                                {LINK_DOCTYPES.map((dt) => (
                                  <option key={dt} value={dt}>
                                    {dt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.linkName}
                                onChange={(e) =>
                                  handleUpdateLink(index, 'linkName', e.target.value)
                                }
                                placeholder="Organization or Entity Name"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.linkTitle || ''}
                                onChange={(e) =>
                                  handleUpdateLink(index, 'linkTitle', e.target.value)
                                }
                                placeholder="Optional Title or Role"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLink(index)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-[#f8f9fa] border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </button>
                </div>
              </div>
            </div>

            {/* ── Section: More Information & Notes ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                More Information & Internal Notes
              </h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional background, meeting notes, or preferred communication channels…"
                className="w-full px-3 py-2 bg-[#f4f5f6] border border-transparent rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#014582]/40 focus:ring-2 focus:ring-[#014582]/15"
              />
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

export default function NewContactPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Contact form…
        </div>
      }
    >
      <NewContactForm />
    </Suspense>
  );
}
