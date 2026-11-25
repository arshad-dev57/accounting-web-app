'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Users, Target, Info, CheckCircle2,
  Globe, Phone, DollarSign, Plus, Trash2, ExternalLink, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getProspect,
  updateProspect,
  deleteProspect,
  addLeadToProspect,
  makeOpportunityFromProspect,
  createTerritory,
  createMarketSegment,
  createCustomerGroup,
  getTerritories,
  getMarketSegments,
  getCustomerGroups,
  getLeads,
  NO_OF_EMPLOYEES,
  type Prospect,
  type CRMLead,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';
import {
  QuickAddSelect,
  getEmployeeSizeOptions,
  addEmployeeSizeOption,
  getIndustryOptions,
  addIndustryOption,
} from '../../components/QuickAddSelect';
import NewProspectPage from '../new/page';

const INDUSTRIES = [
  'Advertising', 'Agriculture', 'Automotive', 'Banking', 'Chemical',
  'Commercial', 'Communications', 'Construction', 'Consumer Goods',
  'Education', 'Electronics', 'Energy', 'Entertainment', 'Finance',
  'Government', 'Healthcare', 'Hospitality', 'Information Technology',
  'Insurance', 'Journalism', 'Legal', 'Manufacturing', 'Marketing',
  'Media', 'Mining', 'Non Profit', 'Oil & Gas', 'Other', 'Pharmaceuticals',
  'Real Estate', 'Retail', 'Services', 'Technology', 'Telecommunication',
  'Transportation', 'Utility', 'Wholesale',
];

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const prospectId = resolvedParams.id;

  // Support temporary new-record docname pattern like 'new-prospect-xxxx'
  if (prospectId.startsWith('new-prospect-')) {
    return <NewProspectPage />;
  }

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [makingOpportunity, setMakingOpportunity] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Lookups
  const [territories, setTerritories] = useState<string[]>([]);
  const [marketSegments, setMarketSegments] = useState<string[]>([]);
  const [customerGroups, setCustomerGroups] = useState<string[]>([]);
  const [employeeSizes, setEmployeeSizes] = useState<string[]>(NO_OF_EMPLOYEES);
  const [industries, setIndustries] = useState<string[]>(INDUSTRIES);
  const [allLeads, setAllLeads] = useState<CRMLead[]>([]);
  const [selectedLeadToAdd, setSelectedLeadToAdd] = useState('');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [customerGroup, setCustomerGroup] = useState('');
  const [marketSegment, setMarketSegment] = useState('');
  const [industry, setIndustry] = useState('');
  const [territory, setTerritory] = useState('');
  const [noOfEmployees, setNoOfEmployees] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [website, setWebsite] = useState('');
  const [fax, setFax] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProspect(prospectId);
      if (data) {
        setProspect(data);
        setCompanyName(data.companyName || '');
        setCustomerGroup(data.customerGroup || '');
        setMarketSegment(data.marketSegment || '');
        setIndustry(data.industry || '');
        setTerritory(data.territory || '');
        setNoOfEmployees(data.noOfEmployees || '');
        setAnnualRevenue(data.annualRevenue != null ? String(data.annualRevenue) : '');
        setWebsite(data.website || '');
        setFax(data.fax || '');
        setNotes(data.notes || '');
        setDirty(false);
      }
    } catch {
      toast.error('Prospect not found');
      router.push('/crm/prospects');
    } finally {
      setLoading(false);
    }
  }, [prospectId, router]);

  useEffect(() => {
    load();
    setEmployeeSizes(getEmployeeSizeOptions(NO_OF_EMPLOYEES));
    setIndustries(getIndustryOptions(INDUSTRIES));
    Promise.all([
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
      getCustomerGroups().catch(() => []),
      getLeads({ limit: 150 }).catch(() => ({ leads: [] })),
    ]).then(([tList, mList, gList, lRes]) => {
      setTerritories(Array.isArray(tList) ? tList.map((x) => x.name) : []);
      setMarketSegments(Array.isArray(mList) ? mList.map((x) => x.name) : []);
      setCustomerGroups(Array.isArray(gList) ? gList.map((x) => x.name) : []);
      setAllLeads(lRes.leads || []);
    });
  }, [load]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = companyName.trim();
    if (!name) {
      toast.error('Organization Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateProspect(prospectId, {
        companyName: name,
        customerGroup: customerGroup || undefined,
        marketSegment: marketSegment || undefined,
        industry: industry || undefined,
        territory: territory || undefined,
        noOfEmployees: noOfEmployees || undefined,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        website: website.trim() || undefined,
        fax: fax.trim() || undefined,
        notes: notes.trim() || undefined,
      } as any);

      toast.success('Prospect updated');
      setDirty(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${companyName}"?`)) return;
    setDeleting(true);
    try {
      await deleteProspect(prospectId);
      toast.success('Prospect deleted');
      router.push('/crm/prospects');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleMakeOpportunity = async () => {
    setMakingOpportunity(true);
    try {
      const opp = await makeOpportunityFromProspect(prospectId);
      toast.success('Opportunity created');
      router.push(`/crm/opportunities/${opp.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create opportunity');
    } finally {
      setMakingOpportunity(false);
    }
  };

  const handleAddLead = async () => {
    if (!selectedLeadToAdd) {
      toast.error('Please select a lead');
      return;
    }
    try {
      await addLeadToProspect(prospectId, selectedLeadToAdd);
      toast.success('Lead linked to prospect');
      setSelectedLeadToAdd('');
      setShowAddLeadModal(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link lead');
    }
  };

  const leadsList = prospect?.leads || [];
  const opportunitiesList = prospect?.opportunities || [];

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
        Loading prospect details…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title={companyName || 'Prospect'}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/prospects')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMakeOpportunity}
              disabled={makingOpportunity}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Target className="w-3.5 h-3.5" />
              {makingOpportunity ? 'Creating…' : 'Make Opportunity'}
            </button>
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
              <DeskSideCard title="Prospect Overview">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Linked Leads:</span>
                    <span className="font-semibold text-gray-900">{leadsList.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opportunities:</span>
                    <span className="font-semibold text-gray-900">{opportunitiesList.length}</span>
                  </div>
                  {prospect?.prospectOwner && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-gray-400 block">Owner:</span>
                      <p className="font-semibold text-gray-800">
                        {prospect.prospectOwner.firstName} {prospect.prospectOwner.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </DeskSideCard>

              {customerGroup && (
                <DeskSideCard title="Customer Group">
                  <span className="text-xs font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 block text-center">
                    {customerGroup}
                  </span>
                </DeskSideCard>
              )}

              {territory && (
                <DeskSideCard title="Territory">
                  <span className="text-xs font-semibold text-[#014582] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block text-center">
                    {territory}
                  </span>
                </DeskSideCard>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* ── Section: Organization Overview ───────────────────────── */}
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#014582]" />
                Organization Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <DeskField label="Organization / Company Name" required className="md:col-span-2">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setDirty(true);
                    }}
                    className={deskInput}
                  />
                </DeskField>

                <QuickAddSelect
                  label="Customer Group"
                  value={customerGroup}
                  options={customerGroups}
                  onChange={(v) => { setCustomerGroup(v); setDirty(true); }}
                  placeholder="Select Customer Group"
                  addTitle="Add Customer Group"
                  extraFields={[
                    {
                      key: 'parentCustomerGroup',
                      label: 'Parent Customer Group',
                      type: 'select',
                      options: customerGroups,
                      placeholder: 'No Parent (Root)',
                    },
                  ]}
                  onCreate={async ({ name, parentCustomerGroup }) => {
                    const row = await createCustomerGroup({
                      name,
                      parentCustomerGroup: parentCustomerGroup || undefined,
                    } as any);
                    const created = row?.name || name;
                    setCustomerGroups((prev) => Array.from(new Set([...prev, created])));
                    return created;
                  }}
                />

                <QuickAddSelect
                  label="Industry"
                  value={industry}
                  options={industries}
                  onChange={(v) => { setIndustry(v); setDirty(true); }}
                  placeholder="Select Industry"
                  addTitle="Add Industry"
                  onCreate={async ({ name }) => {
                    const next = addIndustryOption(name, INDUSTRIES);
                    setIndustries(next);
                    return name;
                  }}
                />

                <QuickAddSelect
                  label="Market Segment"
                  value={marketSegment}
                  options={marketSegments}
                  onChange={(v) => { setMarketSegment(v); setDirty(true); }}
                  placeholder="Select Market Segment"
                  addTitle="Add Market Segment"
                  extraFields={[
                    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional notes' },
                  ]}
                  onCreate={async ({ name, description }) => {
                    const row = await createMarketSegment({
                      name,
                      description: description || undefined,
                    } as any);
                    const created = row?.name || name;
                    setMarketSegments((prev) => Array.from(new Set([...prev, created])));
                    return created;
                  }}
                />

                <QuickAddSelect
                  label="Territory"
                  value={territory}
                  options={territories}
                  onChange={(v) => { setTerritory(v); setDirty(true); }}
                  placeholder="Select Territory"
                  addTitle="Add Territory"
                  extraFields={[
                    {
                      key: 'parentTerritory',
                      label: 'Parent Territory',
                      type: 'select',
                      options: territories,
                      placeholder: 'No Parent (Root)',
                    },
                  ]}
                  onCreate={async ({ name, parentTerritory }) => {
                    const row = await createTerritory({
                      name,
                      parentTerritory: parentTerritory || undefined,
                    } as any);
                    const created = row?.name || name;
                    setTerritories((prev) => Array.from(new Set([...prev, created])));
                    return created;
                  }}
                />

                <QuickAddSelect
                  label="No. of Employees"
                  value={noOfEmployees}
                  options={employeeSizes}
                  onChange={(v) => { setNoOfEmployees(v); setDirty(true); }}
                  placeholder="Select Size"
                  addTitle="Add Employee Size"
                  onCreate={async ({ name }) => {
                    const next = addEmployeeSizeOption(name, NO_OF_EMPLOYEES);
                    setEmployeeSizes(next);
                    return name;
                  }}
                />

                <DeskField label="Annual Revenue">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={annualRevenue}
                    onChange={(e) => {
                      setAnnualRevenue(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="0.00"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Website">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="https://example.com"
                    className={deskInput}
                  />
                </DeskField>

                <DeskField label="Fax / Secondary Phone">
                  <input
                    type="tel"
                    value={fax}
                    onChange={(e) => {
                      setFax(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="+92 42 1234567"
                    className={deskInput}
                  />
                </DeskField>
              </div>
            </div>

            {/* ── Section: Associated Leads Table ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#014582]" />
                    Associated Leads ({leadsList.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Leads that originate from or represent contacts at this organization.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f6] hover:bg-gray-200 text-gray-800 rounded-md text-xs font-medium border border-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Link Lead
                </button>
              </div>

              {/* Add Lead Inline Picker Modal */}
              {showAddLeadModal && (
                <div className="p-3 mb-3 bg-blue-50/50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <select
                    value={selectedLeadToAdd}
                    onChange={(e) => setSelectedLeadToAdd(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800"
                  >
                    <option value="">Select an existing lead to link…</option>
                    {allLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName || `${l.firstName} ${l.lastName || ''}`} ({l.email || l.companyName || l.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddLead}
                    className="px-3 py-1.5 bg-[#014582] text-white rounded text-xs font-semibold hover:bg-[#01366a]"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLeadModal(false);
                      setSelectedLeadToAdd('');
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Lead Name</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Email Address</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leadsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400">
                            No leads linked yet. Click &quot;Link Lead&quot; to attach leads to this organization.
                          </td>
                        </tr>
                      ) : (
                        leadsList.map((item, index) => {
                          const l = item.lead;
                          if (!l) return null;
                          return (
                            <tr key={item.id || index} className="hover:bg-gray-50/50">
                              <td className="py-2 px-3 text-center text-gray-400 font-mono">
                                {index + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-gray-900">
                                {l.fullName}
                              </td>
                              <td className="py-2 px-3 text-gray-600">{l.email || '—'}</td>
                              <td className="py-2 px-3">
                                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#014582] border border-blue-200/60">
                                  {l.status || 'Lead'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Link
                                  href={`/crm/leads/${l.id}`}
                                  className="text-[#014582] hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Section: Opportunities Table ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#014582]" />
                    Opportunities ({opportunitiesList.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sales deals and revenue pipeline connected with this prospect.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleMakeOpportunity}
                  disabled={makingOpportunity}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f6] hover:bg-gray-200 text-gray-800 rounded-md text-xs font-medium border border-gray-200 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Make Opportunity
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Opportunity Name</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Stage</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Expected Revenue</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {opportunitiesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400">
                            No opportunities created yet. Click &quot;Make Opportunity&quot; to begin a sales deal.
                          </td>
                        </tr>
                      ) : (
                        opportunitiesList.map((item, index) => {
                          const opp = item.opportunity;
                          if (!opp) return null;
                          return (
                            <tr key={item.id || index} className="hover:bg-gray-50/50">
                              <td className="py-2 px-3 text-center text-gray-400 font-mono">
                                {index + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-gray-900">
                                {opp.name}
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  {opp.stage || 'Prospecting'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-medium text-emerald-700">
                                {opp.expectedRevenue ? `$${Number(opp.expectedRevenue).toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Link
                                  href={`/crm/opportunities/${opp.id}`}
                                  className="text-[#014582] hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Section: Notes & Comments ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">
                Internal Notes & Deal Strategy
              </h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setDirty(true);
                }}
                className="w-full px-3 py-2 bg-[#f4f5f6] border border-transparent rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#014582]/40 focus:ring-2 focus:ring-[#014582]/15"
              />
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}
