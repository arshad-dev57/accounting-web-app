'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Plus, Trash2, Info, CheckCircle2,
  DollarSign, ShieldCheck, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createCustomerGroup,
  getCustomerGroups,
  type CustomerGroupRecord,
  type CreditLimitRow,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';
import { QuickAddSelect } from '../../components/QuickAddSelect';

const PRICE_LIST_OPTIONS = [
  '',
  'Standard Selling',
  'Retail',
  'Wholesale',
  'Distributor',
  'Corporate Preferred',
];

const PAYMENT_TERMS_OPTIONS = [
  '',
  'Net 30',
  'Net 15',
  'Net 60',
  'Due on Receipt',
  '50-50 on Order and Delivery',
  'Immediate Payment',
];

function NewCustomerGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillParent = searchParams.get('parent') || '';

  const [saving, setSaving] = useState(false);
  const [existingGroups, setExistingGroups] = useState<CustomerGroupRecord[]>([]);

  // Form State
  const [customerGroupName, setCustomerGroupName] = useState('');
  const [parentCustomerGroup, setParentCustomerGroup] = useState(prefillParent);
  const [isGroup, setIsGroup] = useState(false);
  const [defaultPriceList, setDefaultPriceList] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [defaultReceivableAccount, setDefaultReceivableAccount] = useState('');

  // Credit Limits table
  const [creditLimits, setCreditLimits] = useState<CreditLimitRow[]>([]);

  useEffect(() => {
    getCustomerGroups()
      .then((data) => {
        const list = Array.isArray(data) ? (data as unknown as CustomerGroupRecord[]) : [];
        setExistingGroups(list);

        if (!prefillParent) {
          const root = list.find((g) => g.name.toLowerCase() === 'all customer groups');
          if (root) setParentCustomerGroup(root.name);
        }
      })
      .catch(() => {});
  }, [prefillParent]);

  const handleAddCreditLimit = () => {
    setCreditLimits((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        company: 'Default Company',
        creditLimit: '',
        bypassCreditLimitCheck: false,
      },
    ]);
  };

  const handleUpdateCreditLimit = (index: number, field: keyof CreditLimitRow, value: any) => {
    setCreditLimits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveCreditLimit = (index: number) => {
    setCreditLimits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = customerGroupName.trim();
    if (!name) {
      toast.error('Customer Group Name is required');
      return;
    }

    let parentId: string | undefined = undefined;
    if (parentCustomerGroup) {
      const matched = existingGroups.find(
        (g) => g.name.toLowerCase() === parentCustomerGroup.toLowerCase()
      );
      if (matched) parentId = matched.id;
    }

    setSaving(true);
    try {
      await createCustomerGroup({
        name,
        parentId,
      } as any);

      toast.success(`Customer Group "${name}" created successfully`);
      router.push('/crm/customer-group');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title="New Customer Group"
        dirty={true}
        saving={saving}
        onSave={handleSubmit}
        onCancel={() => router.push('/crm/customer-group')}
        actions={
          <Link
            href="/crm/customer-group"
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
              <DeskSideCard title="Hierarchy Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Group Nodes:</strong> Can contain child customer groups.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Leaf Nodes:</strong> Are assigned directly to Customers. Only leaf nodes can be selected on transactions.
                    </p>
                  </div>
                </div>
              </DeskSideCard>

              {parentCustomerGroup ? (
                <DeskSideCard title="Parent Group">
                  <p className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#014582]" />
                    {parentCustomerGroup}
                  </p>
                </DeskSideCard>
              ) : null}

              {(defaultPriceList || paymentTerms) && (
                <DeskSideCard title="Defaults Cascade">
                  <div className="space-y-1.5 text-xs text-gray-600">
                    {defaultPriceList && (
                      <div>
                        <span className="text-gray-400">Price List:</span>
                        <p className="font-semibold text-gray-800">{defaultPriceList}</p>
                      </div>
                    )}
                    {paymentTerms && (
                      <div>
                        <span className="text-gray-400">Terms:</span>
                        <p className="font-semibold text-gray-800">{paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </DeskSideCard>
              )}
            </div>
          }
        >
          {/* ── Section: Details ───────────────────────── */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#014582]" />
                Customer Group Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  <DeskField label="Customer Group Name" required>
                    <input
                      type="text"
                      required
                      value={customerGroupName}
                      onChange={(e) => setCustomerGroupName(e.target.value)}
                      placeholder="e.g. Commercial, VIP Corporate, Individual"
                      className={deskInput}
                      autoFocus
                    />
                  </DeskField>

                  <QuickAddSelect
                    label="Parent Customer Group"
                    value={parentCustomerGroup}
                    options={existingGroups.map((x) => x.name)}
                    onChange={setParentCustomerGroup}
                    placeholder="No Parent (Root Customer Group)"
                    addTitle="Add Customer Group"
                    onCreate={async ({ name }) => {
                      const row = await createCustomerGroup({ name });
                      const created = row?.name || name;
                      setExistingGroups((prev) =>
                        prev.some((x) => x.name === created) ? prev : [...prev, (row ?? { id: created, name: created }) as CustomerGroupRecord]
                      );
                      return created;
                    }}
                  />

                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isGroup}
                        onChange={(e) => setIsGroup(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                      />
                      <div>
                        <span className="text-xs font-semibold text-gray-800">Is Group</span>
                        <p className="text-[11px] text-gray-500 leading-normal mt-0.5">
                          Only leaf nodes are allowed in transactions. Check this if this group will contain sub-groups.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <DeskField label="Default Price List">
                    <select
                      value={defaultPriceList}
                      onChange={(e) => setDefaultPriceList(e.target.value)}
                      className={deskSelect}
                    >
                      {PRICE_LIST_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt || 'None (Default)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Customers in this group will automatically adopt this price list.
                    </p>
                  </DeskField>

                  <DeskField label="Default Payment Terms Template">
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className={deskSelect}
                    >
                      {PAYMENT_TERMS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt || 'None (Default)'}
                        </option>
                      ))}
                    </select>
                  </DeskField>

                  <DeskField label="Default Receivable Account">
                    <input
                      type="text"
                      value={defaultReceivableAccount}
                      onChange={(e) => setDefaultReceivableAccount(e.target.value)}
                      placeholder="e.g. 1100 - Accounts Receivable"
                      className={deskInput}
                    />
                  </DeskField>
                </div>
              </div>
            </div>

            {/* ── Section Break: Credit Limits ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#014582]" />
                    Credit & Overdue Limits
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Set company-wise maximum credit limits and checkout policies for this customer group.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCreditLimit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f6] hover:bg-gray-200 text-gray-800 rounded-md text-xs font-medium border border-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              {/* Credit Limits Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Company</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Credit Limit</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Bypass Credit Limit Check at Sales Order</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {creditLimits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No company-specific credit limits defined. Click &quot;Add Row&quot; to configure limits.
                          </td>
                        </tr>
                      ) : (
                        creditLimits.map((row, index) => (
                          <tr key={row.id || index} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 text-center text-gray-400 font-mono">
                              {index + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.company || ''}
                                onChange={(e) =>
                                  handleUpdateCreditLimit(index, 'company', e.target.value)
                                }
                                placeholder="Company Name"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.creditLimit || ''}
                                onChange={(e) =>
                                  handleUpdateCreditLimit(index, 'creditLimit', e.target.value)
                                }
                                placeholder="0.00"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs text-right font-mono focus:bg-white focus:border-[#014582]/40"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(row.bypassCreditLimitCheck)}
                                onChange={(e) =>
                                  handleUpdateCreditLimit(
                                    index,
                                    'bypassCreditLimitCheck',
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCreditLimit(index)}
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

                <div className="p-2.5 bg-[#f8f9fa] border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddCreditLimit}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

export default function NewCustomerGroupPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-gray-500">
          Loading New Customer Group form…
        </div>
      }
    >
      <NewCustomerGroupForm />
    </Suspense>
  );
}

