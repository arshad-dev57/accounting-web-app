'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Plus, Trash2, Info, CheckCircle2,
  RefreshCw, Folder, ExternalLink, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCustomerGroup,
  getCustomerGroups,
  updateCustomerGroup,
  deleteCustomerGroup,
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
import NewCustomerGroupPage from '../new/page';

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

export default function CustomerGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;

  // Support ERPNext temporary docname pattern like 'new-customer-group-xxxx'
  if (groupId.startsWith('new-customer-group-')) {
    return <NewCustomerGroupPage />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [existingGroups, setExistingGroups] = useState<CustomerGroupRecord[]>([]);

  // Form State
  const [customerGroupName, setCustomerGroupName] = useState('');
  const [parentCustomerGroup, setParentCustomerGroup] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [defaultPriceList, setDefaultPriceList] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [defaultReceivableAccount, setDefaultReceivableAccount] = useState('');
  const [creditLimits, setCreditLimits] = useState<CreditLimitRow[]>([]);
  const [childGroups, setChildGroups] = useState<CustomerGroupRecord[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCustomerGroup(groupId).catch(() => null),
      getCustomerGroups().catch(() => []),
    ])
      .then(([current, all]) => {
        const list = Array.isArray(all) ? (all as unknown as CustomerGroupRecord[]) : [];
        setExistingGroups(list);

        if (current) {
          setCustomerGroupName(current.name || '');
          setIsGroup(Boolean(current.isGroup));
          setDefaultPriceList(current.defaultPriceList || '');
          setPaymentTerms(current.paymentTerms || '');
          setDefaultReceivableAccount(current.defaultReceivableAccount || '');

          if (current.parentCustomerGroup) {
            setParentCustomerGroup(current.parentCustomerGroup);
          } else if (current.parentId) {
            const p = list.find((x) => x.id === current.parentId);
            setParentCustomerGroup(p ? p.name : '');
          }

          if (Array.isArray(current.creditLimits)) {
            setCreditLimits(current.creditLimits);
          }

          const kids = list.filter(
            (g) => g.parentId === current.id || g.parentCustomerGroup === current.name
          );
          setChildGroups(kids);
          if (kids.length > 0) setIsGroup(true);
        } else {
          toast.error('Customer Group not found');
        }
      })
      .finally(() => setLoading(false));
  }, [groupId]);

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = customerGroupName.trim();
    if (!name) {
      toast.error('Customer Group Name is required');
      return;
    }

    let parentId: string | null = null;
    if (parentCustomerGroup) {
      const matched = existingGroups.find(
        (g) => g.name.toLowerCase() === parentCustomerGroup.toLowerCase()
      );
      if (matched && matched.id !== groupId) {
        parentId = matched.id;
      }
    }

    setSaving(true);
    try {
      await updateCustomerGroup(groupId, {
        name,
        parentId,
      } as any);

      toast.success('Customer Group updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${customerGroupName}"?`)) return;
    setDeleting(true);
    try {
      await deleteCustomerGroup(groupId);
      toast.success('Customer Group deleted');
      router.push('/crm/customer-group');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer group');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
        Loading customer group details…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── ERPNext Desk Header ───────────────────────── */}
      <DeskPageHeader
        title={customerGroupName || 'Customer Group'}
        dirty={false}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/customer-group')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/crm/customer-group/new?parent=${encodeURIComponent(customerGroupName)}`}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Child
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      />

      <form onSubmit={handleSave}>
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
                      <strong>Leaf Nodes:</strong> Are directly assigned to Customers.
                    </p>
                  </div>
                </div>
              </DeskSideCard>

              {childGroups.length > 0 && (
                <DeskSideCard title={`Child Groups (${childGroups.length})`}>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {childGroups.map((k) => (
                      <Link
                        key={k.id}
                        href={`/crm/customer-group/${k.id}`}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-100 text-gray-700"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3 h-3 text-[#014582]" />
                          {k.name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </DeskSideCard>
              )}

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
                      className={deskInput}
                    />
                  </DeskField>

                  <DeskField label="Parent Customer Group">
                    <select
                      value={parentCustomerGroup}
                      onChange={(e) => setParentCustomerGroup(e.target.value)}
                      className={deskSelect}
                    >
                      <option value="">No Parent (Root Customer Group)</option>
                      {existingGroups
                        .filter((g) => g.id !== groupId)
                        .map((g) => (
                          <option key={g.id} value={g.name}>
                            {g.name}
                          </option>
                        ))}
                    </select>
                  </DeskField>

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

