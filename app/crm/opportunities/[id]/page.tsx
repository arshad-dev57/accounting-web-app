'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getOpportunityById, updateOpportunity, deleteOpportunity,
  getAccounts, getContacts, getLeads, getLeadSources,
  getOpportunityTypes, getSalesStages, getTerritories, getMarketSegments,
  createLeadSource, createOpportunityType, createSalesStage, createTerritory, createMarketSegment,
  makeQuotationFromOpportunity, convertLead,
  OPPORTUNITY_STAGES, OPPORTUNITY_STATUSES, OPPORTUNITY_TYPES, OPPORTUNITY_FROM,
  NO_OF_EMPLOYEES, DEFAULT_LEAD_SOURCES,
  type Opportunity, type CRMAccount, type Contact, type Lead,
} from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';
import {
  QuickAddSelect,
  getEmployeeSizeOptions,
  addEmployeeSizeOption,
} from '../../components/QuickAddSelect';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateVal(v?: string | null) {
  return v ? String(v).slice(0, 10) : '';
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [accounts, setAccounts] = useState<CRMAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>(DEFAULT_LEAD_SOURCES);
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([...OPPORTUNITY_TYPES]);
  const [salesStages, setSalesStages] = useState<string[]>([...OPPORTUNITY_STAGES]);
  const [territories, setTerritories] = useState<string[]>([]);
  const [marketSegments, setMarketSegments] = useState<string[]>([]);
  const [employeeSizes, setEmployeeSizes] = useState<string[]>(NO_OF_EMPLOYEES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    opportunityFrom: 'Lead',
    leadId: '',
    customerId: '',
    customerName: '',
    status: 'Open',
    type: 'Sales',
    source: '',
    stage: 'Prospecting',
    expectedClosingDate: '',
    probability: '100',
    noOfEmployees: '',
    annualRevenue: '',
    industry: '',
    marketSegment: '',
    website: '',
    city: '',
    state: '',
    country: 'Pakistan',
    territory: '',
    currency: 'PKR',
    amount: '',
    campaign: '',
    transactionDate: todayISO(),
    notes: '',
    contactId: '',
    contactPerson: '',
    jobTitle: '',
    contactEmail: '',
    contactMobile: '',
    whatsapp: '',
    phone: '',
    phoneExt: '',
  });

  const fetchOpp = useCallback(async () => {
    try {
      const data = await getOpportunityById(id);
      setOpp(data);
      const crm = data as Opportunity & Record<string, unknown>;
      setForm({
        name: data.name || '',
        opportunityFrom: (crm.opportunityFrom as string) || (data.leadId ? 'Lead' : data.accountId ? 'Customer' : 'Prospect'),
        leadId: data.leadId || '',
        customerId: data.accountId || (crm.customerId as string) || '',
        customerName: (crm.customerName as string) || data.account?.name || '',
        status: (crm.status as string) || 'Open',
        type: data.type || 'Sales',
        source: data.source || '',
        stage: data.stage || 'Prospecting',
        expectedClosingDate: dateVal(data.expectedCloseDate || (crm.expectedClosingDate as string)),
        probability: String(data.probability ?? crm.probability ?? 100),
        noOfEmployees: (crm.noOfEmployees as string) || '',
        annualRevenue: crm.annualRevenue != null ? String(crm.annualRevenue) : '',
        industry: (crm.industry as string) || '',
        marketSegment: (crm.marketSegment as string) || '',
        website: (crm.website as string) || '',
        city: (crm.city as string) || '',
        state: (crm.state as string) || '',
        country: (crm.country as string) || 'Pakistan',
        territory: (crm.territory as string) || '',
        currency: data.currency || 'PKR',
        amount: data.amount != null ? String(data.amount) : (crm.expectedRevenue != null ? String(crm.expectedRevenue) : ''),
        campaign: (crm.campaign as string) || '',
        transactionDate: dateVal(crm.transactionDate as string) || todayISO(),
        notes: data.description || (crm.notes as string) || '',
        contactId: data.contactId || '',
        contactPerson: (crm.contactPerson as string) || (data.contact ? `${data.contact.firstName} ${data.contact.lastName}` : ''),
        jobTitle: (crm.jobTitle as string) || '',
        contactEmail: (crm.contactEmail as string) || data.contact?.email || '',
        contactMobile: (crm.contactMobile as string) || '',
        whatsapp: (crm.whatsapp as string) || '',
        phone: (crm.phone as string) || '',
        phoneExt: (crm.phoneExt as string) || '',
      });
      setDirty(false);
    } catch {
      router.push('/crm/opportunities');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    setEmployeeSizes(getEmployeeSizeOptions(NO_OF_EMPLOYEES));
    fetchOpp();
    Promise.all([
      getAccounts({ limit: 200 }).catch(() => ({ accounts: [] })),
      getContacts({ limit: 200 }).catch(() => ({ contacts: [] })),
      getLeads({ limit: 200 }).catch(() => ({ leads: [] })),
      getLeadSources().catch(() => []),
      getOpportunityTypes().catch(() => []),
      getSalesStages().catch(() => []),
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
    ]).then(([ar, cr, lr, src, typeList, stageList, terrList, segList]) => {
      setAccounts(ar.accounts ?? []);
      setContacts(cr.contacts ?? []);
      setLeads(lr.leads ?? []);
      const list = Array.isArray(src) ? src : [];
      setSourceOptions(list.length ? list.map((s) => s.name) : [...DEFAULT_LEAD_SOURCES]);
      const typeNames = Array.isArray(typeList) ? typeList.map((x) => x.name) : [];
      if (typeNames.length) setOpportunityTypes(typeNames);
      const stageNames = Array.isArray(stageList) ? stageList.map((x) => x.name) : [];
      if (stageNames.length) setSalesStages(stageNames);
      setTerritories(Array.isArray(terrList) ? terrList.map((x) => x.name) : []);
      setMarketSegments(Array.isArray(segList) ? segList.map((x) => x.name) : []);
    });
  }, [fetchOpp]);

  const setField = (name: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    setDirty(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!opp) return;
    if (!form.name.trim()) {
      toast.error('Opportunity name is required');
      return;
    }
    setSaving(true);
    try {
      await updateOpportunity(opp.id, {
        name: form.name.trim(),
        opportunityFrom: form.opportunityFrom,
        status: form.status,
        type: form.type,
        source: form.source || undefined,
        stage: form.stage,
        expectedClosingDate: form.expectedClosingDate || undefined,
        expectedCloseDate: form.expectedClosingDate || undefined,
        probability: form.probability ? parseInt(form.probability, 10) : 100,
        transactionDate: form.transactionDate || undefined,
        currency: form.currency || 'PKR',
        amount: form.amount ? parseFloat(form.amount) : undefined,
        expectedRevenue: form.amount ? parseFloat(form.amount) : undefined,
        leadId: form.opportunityFrom === 'Lead' ? form.leadId || undefined : undefined,
        customerId: form.opportunityFrom === 'Customer' ? form.customerId || undefined : undefined,
        accountId: form.opportunityFrom === 'Customer' ? form.customerId || undefined : undefined,
        customerName: form.customerName || undefined,
        noOfEmployees: form.noOfEmployees || undefined,
        annualRevenue: form.annualRevenue ? parseFloat(form.annualRevenue) : undefined,
        industry: form.industry || undefined,
        marketSegment: form.marketSegment || undefined,
        website: form.website || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        territory: form.territory || undefined,
        campaign: form.campaign || undefined,
        description: form.notes || undefined,
        contactId: form.contactId || undefined,
        contactPerson: form.contactPerson || undefined,
        jobTitle: form.jobTitle || undefined,
        contactEmail: form.contactEmail || undefined,
        contactMobile: form.contactMobile || undefined,
        whatsapp: form.whatsapp || undefined,
        phone: form.phone || undefined,
        phoneExt: form.phoneExt || undefined,
      } as Partial<Opportunity>);
      toast.success('Opportunity updated');
      setDirty(false);
      fetchOpp();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!opp || !confirm('Delete this opportunity?')) return;
    await deleteOpportunity(opp.id).catch(() => {});
    router.push('/crm/opportunities');
  };

  const handleCreateQuotation = async () => {
    if (!opp) return;
    setActionLoading('quotation');
    try {
      const quotation = await makeQuotationFromOpportunity(opp.id);
      const num = quotation?.quotationNumber || quotation?.id;
      toast.success(num ? `Quotation ${num} created` : 'Quotation created');
      router.push('/sales/quotations');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create quotation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertCustomer = async () => {
    if (!opp?.leadId) {
      toast.error('No linked lead to convert');
      return;
    }
    setActionLoading('customer');
    try {
      await convertLead(opp.leadId, { createNewCustomer: true, createContact: false, createOpportunity: false });
      await updateOpportunity(opp.id, { status: 'Converted', stage: 'Negotiation/Review' } as Partial<Opportunity>);
      toast.success('Converted to customer');
      fetchOpp();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Convert failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !opp) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const ownerLabel = opp.assignedTo
    ? `${opp.assignedTo.firstName} ${opp.assignedTo.lastName}`
    : '(Unassigned)';

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To">
            <p className="text-sm text-gray-700">{ownerLabel}</p>
          </DeskSideCard>
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
          <DeskSideCard title="Actions">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCreateQuotation}
                disabled={!!actionLoading}
                className="w-full px-2 py-1.5 text-xs font-medium rounded-md bg-[#014582] text-white disabled:opacity-50"
              >
                {actionLoading === 'quotation' ? 'Creating…' : 'Create Quotation'}
              </button>
              {opp.leadId && (
                <button
                  type="button"
                  onClick={handleConvertCustomer}
                  disabled={!!actionLoading}
                  className="w-full px-2 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {actionLoading === 'customer' ? 'Converting…' : 'Convert to Customer'}
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-2 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </DeskSideCard>
        </>
      }
    >
      <DeskPageHeader
        title={opp.name}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/opportunities')}
      />
      {(opp as Opportunity & { opportunityNumber?: string }).opportunityNumber && (
        <p className="text-xs text-gray-400 mb-3">
          {(opp as Opportunity & { opportunityNumber?: string }).opportunityNumber}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">
        <DeskField label="Opportunity Name" required className="md:col-span-3">
          <input name="name" value={form.name} onChange={handleChange} className={deskInput} required />
        </DeskField>

        <DeskField label="Series">
          <input
            className={deskInput}
            value={(opp as Opportunity & { opportunityNumber?: string }).opportunityNumber || 'CRM-OPP-.YYYY.-'}
            readOnly
          />
        </DeskField>
        <DeskField label="Opportunity From" required>
          <select name="opportunityFrom" value={form.opportunityFrom} onChange={handleChange} className={deskSelect}>
            {OPPORTUNITY_FROM.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </DeskField>
        <DeskField label="Party" required>
          {form.opportunityFrom === 'Lead' && (
            <select name="leadId" value={form.leadId} onChange={handleChange} className={deskSelect}>
              <option value="">Select lead…</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.fullName}{l.companyName ? ` — ${l.companyName}` : ''}</option>
              ))}
            </select>
          )}
          {form.opportunityFrom === 'Customer' && (
            <select name="customerId" value={form.customerId} onChange={handleChange} className={deskSelect}>
              <option value="">Select customer…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          {form.opportunityFrom === 'Prospect' && (
            <input name="customerName" value={form.customerName} onChange={handleChange} className={deskInput} />
          )}
        </DeskField>

        <DeskField label="Status" required>
          <select name="status" value={form.status} onChange={handleChange} className={deskSelect}>
            {OPPORTUNITY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </DeskField>
        <QuickAddSelect
          label="Opportunity Type"
          value={form.type}
          options={opportunityTypes}
          onChange={(v) => setField('type', v)}
          placeholder="Select Opportunity Type"
          addTitle="Add Opportunity Type"
          extraFields={[
            { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional notes' },
          ]}
          onCreate={async ({ name, description }) => {
            const row = await createOpportunityType({ name, description: description || undefined } as any);
            const created = row?.name || name;
            setOpportunityTypes((prev) => Array.from(new Set([...prev, created])));
            return created;
          }}
        />
        <QuickAddSelect
          label="Source"
          value={form.source}
          options={sourceOptions}
          onChange={(v) => setField('source', v)}
          placeholder="Select Source"
          addTitle="Add Lead Source"
          onCreate={async ({ name }) => {
            const row = await createLeadSource({ name });
            const created = row?.name || name;
            setSourceOptions((prev) => Array.from(new Set([...prev, created])));
            return created;
          }}
        />

        <DeskField label="Opportunity Owner">
          <input className={deskInput} value={ownerLabel} readOnly />
        </DeskField>
        <QuickAddSelect
          label="Sales Stage"
          value={form.stage}
          options={salesStages}
          onChange={(v) => setField('stage', v)}
          placeholder="Select Sales Stage"
          addTitle="Add Sales Stage"
          onCreate={async ({ name }) => {
            const row = await createSalesStage({ name });
            const created = row?.name || name;
            setSalesStages((prev) => Array.from(new Set([...prev, created])));
            return created;
          }}
        />
        <DeskField label="Expected Closing Date">
          <input name="expectedClosingDate" type="date" value={form.expectedClosingDate} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Probability %">
          <input name="probability" type="number" min={0} max={100} value={form.probability} onChange={handleChange} className={deskInput} />
        </DeskField>
      </div>

      <DeskSection title="Organization">
        <QuickAddSelect
          label="No of Employees"
          value={form.noOfEmployees}
          options={employeeSizes}
          onChange={(v) => setField('noOfEmployees', v)}
          placeholder="Select Size"
          addTitle="Add Employee Size"
          onCreate={async ({ name }) => {
            setEmployeeSizes(addEmployeeSizeOption(name, NO_OF_EMPLOYEES));
            return name;
          }}
        />
        <DeskField label="Annual Revenue">
          <input name="annualRevenue" type="number" value={form.annualRevenue} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Industry">
          <input name="industry" value={form.industry} onChange={handleChange} className={deskInput} />
        </DeskField>
        <QuickAddSelect
          label="Market Segment"
          value={form.marketSegment}
          options={marketSegments}
          onChange={(v) => setField('marketSegment', v)}
          placeholder="Select Market Segment"
          addTitle="Add Market Segment"
          extraFields={[
            { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional notes' },
          ]}
          onCreate={async ({ name, description }) => {
            const row = await createMarketSegment({ name, description: description || undefined } as any);
            const created = row?.name || name;
            setMarketSegments((prev) => Array.from(new Set([...prev, created])));
            return created;
          }}
        />
        <DeskField label="Website">
          <input name="website" value={form.website} onChange={handleChange} className={deskInput} />
        </DeskField>
        <QuickAddSelect
          label="Territory"
          value={form.territory}
          options={territories}
          onChange={(v) => setField('territory', v)}
          placeholder="Select Territory"
          addTitle="Add Territory"
          extraFields={[
            { key: 'parentTerritory', label: 'Parent Territory', type: 'select', options: territories, placeholder: 'No Parent (Root)' },
          ]}
          onCreate={async ({ name, parentTerritory }) => {
            const row = await createTerritory({ name, parentTerritory: parentTerritory || undefined } as any);
            const created = row?.name || name;
            setTerritories((prev) => Array.from(new Set([...prev, created])));
            return created;
          }}
        />
        <DeskField label="City">
          <input name="city" value={form.city} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="State/Province">
          <input name="state" value={form.state} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Country">
          <input name="country" value={form.country} onChange={handleChange} className={deskInput} />
        </DeskField>
      </DeskSection>

      <DeskSection title="Opportunity Value">
        <DeskField label="Currency">
          <select name="currency" value={form.currency} onChange={handleChange} className={deskSelect}>
            {['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </DeskField>
        <DeskField label="Opportunity Amount">
          <input name="amount" type="number" value={form.amount} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Opportunity Date">
          <input name="transactionDate" type="date" value={form.transactionDate} onChange={handleChange} className={deskInput} />
        </DeskField>
      </DeskSection>

      <DeskSection title="Primary Contact">
        <DeskField label="Contact">
          <select name="contactId" value={form.contactId} onChange={handleChange} className={deskSelect}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </DeskField>
        <DeskField label="Job Title">
          <input name="jobTitle" value={form.jobTitle} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Contact Email">
          <input name="contactEmail" value={form.contactEmail} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Contact Mobile">
          <input name="contactMobile" value={form.contactMobile} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="WhatsApp">
          <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Phone">
          <input name="phone" value={form.phone} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Phone Ext.">
          <input name="phoneExt" value={form.phoneExt} onChange={handleChange} className={deskInput} />
        </DeskField>
      </DeskSection>

      <DeskSection title="More Information">
        <DeskField label="Campaign">
          <input name="campaign" value={form.campaign} onChange={handleChange} className={deskInput} />
        </DeskField>
        <DeskField label="Notes" className="md:col-span-2">
          <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className={`${deskInput} resize-none`} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
