'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createOpportunity,
  getAccounts,
  getContacts,
  getLeads,
  getLeadSources,
  getOpportunityTypes,
  getSalesStages,
  getTerritories,
  getMarketSegments,
  createLeadSource,
  createOpportunityType,
  createSalesStage,
  createTerritory,
  createMarketSegment,
  OPPORTUNITY_STAGES,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_FROM,
  NO_OF_EMPLOYEES,
  DEFAULT_LEAD_SOURCES,
  type CRMAccount,
  type Contact,
  type Lead,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSection,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';
import {
  QuickAddSelect,
  getEmployeeSizeOptions,
  addEmployeeSizeOption,
} from '../../components/QuickAddSelect';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewOpportunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<CRMAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>(DEFAULT_LEAD_SOURCES);
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([...OPPORTUNITY_TYPES]);
  const [salesStages, setSalesStages] = useState<string[]>([...OPPORTUNITY_STAGES]);
  const [territories, setTerritories] = useState<string[]>([]);
  const [marketSegments, setMarketSegments] = useState<string[]>([]);
  const [employeeSizes, setEmployeeSizes] = useState<string[]>(NO_OF_EMPLOYEES);

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

  useEffect(() => {
    setEmployeeSizes(getEmployeeSizeOptions(NO_OF_EMPLOYEES));
    Promise.all([
      getAccounts({ limit: 200 }).catch(() => ({ accounts: [], total: 0, page: 1, limit: 200, pages: 1 })),
      getContacts({ limit: 200 }).catch(() => ({ contacts: [], total: 0, page: 1, limit: 200, pages: 1 })),
      getLeads({ limit: 200 }).catch(() => ({ leads: [], total: 0, page: 1, limit: 200, pages: 1 })),
      getLeadSources().catch(() => []),
      getOpportunityTypes().catch(() => []),
      getSalesStages().catch(() => []),
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
    ]).then(([accRes, ctxRes, leadRes, srcList, typeList, stageList, terrList, segList]) => {
      setAccounts(accRes.accounts ?? []);
      setContacts(ctxRes.contacts ?? []);
      setLeads(leadRes.leads ?? []);
      const list = Array.isArray(srcList) ? srcList : [];
      const names = list.length > 0 ? list.map((s) => s.name) : [...DEFAULT_LEAD_SOURCES];
      setSourceOptions(names);
      setForm((p) => ({ ...p, source: p.source || names[0] || 'Walk In' }));
      const typeNames = Array.isArray(typeList) ? typeList.map((x) => x.name) : [];
      if (typeNames.length) setOpportunityTypes(typeNames);
      const stageNames = Array.isArray(stageList) ? stageList.map((x) => x.name) : [];
      if (stageNames.length) setSalesStages(stageNames);
      setTerritories(Array.isArray(terrList) ? terrList.map((x) => x.name) : []);
      setMarketSegments(Array.isArray(segList) ? segList.map((x) => x.name) : []);
    });
  }, []);

  const setField = (name: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'opportunityFrom') {
        next.leadId = '';
        next.customerId = '';
        next.customerName = '';
      }
      return next;
    });
  };

  const handleLeadPick = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leadId = e.target.value;
    const lead = leads.find((l) => l.id === leadId);
    setForm((p) => ({
      ...p,
      leadId,
      customerName: lead?.companyName || lead?.fullName || p.customerName,
      contactPerson: p.contactPerson || lead?.contactPerson || lead?.fullName || '',
      contactEmail: p.contactEmail || lead?.email || '',
      contactMobile: p.contactMobile || lead?.mobile || lead?.phone || '',
      whatsapp: p.whatsapp || lead?.whatsapp || '',
      phone: p.phone || lead?.phone || '',
      industry: p.industry || lead?.industry || '',
      city: p.city || lead?.city || '',
      state: p.state || lead?.state || '',
      country: p.country || lead?.country || 'Pakistan',
      territory: p.territory || lead?.territory || '',
      website: p.website || lead?.website || '',
      noOfEmployees: p.noOfEmployees || lead?.noOfEmployees || '',
      annualRevenue:
        p.annualRevenue || (lead?.annualRevenue != null ? String(lead.annualRevenue) : ''),
      marketSegment: p.marketSegment || lead?.marketSegment || '',
      source: p.source || lead?.source || '',
    }));
  };

  const handleContactPick = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    const c = contacts.find((x) => x.id === contactId);
    setForm((p) => ({
      ...p,
      contactId,
      contactPerson: c ? `${c.firstName} ${c.lastName}`.trim() : p.contactPerson,
      jobTitle: p.jobTitle || c?.title || '',
      contactEmail: p.contactEmail || c?.email || '',
      contactMobile: p.contactMobile || c?.mobile || c?.phone || '',
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Opportunity name is required');
      return;
    }
    if (form.opportunityFrom === 'Lead' && !form.leadId) {
      toast.error('Select a lead');
      return;
    }
    if (form.opportunityFrom === 'Customer' && !form.customerId) {
      toast.error('Select a customer');
      return;
    }
    if (form.opportunityFrom === 'Prospect' && !form.customerName.trim()) {
      toast.error('Party name is required for prospects');
      return;
    }

    setLoading(true);
    try {
      const opp = await createOpportunity({
        name: form.name.trim(),
        opportunityFrom: form.opportunityFrom,
        status: form.status,
        type: form.type,
        source: form.source || undefined,
        stage: form.stage,
        expectedClosingDate: form.expectedClosingDate || undefined,
        probability: form.probability ? parseInt(form.probability, 10) : 100,
        transactionDate: form.transactionDate || todayISO(),
        currency: form.currency || 'PKR',
        expectedRevenue: form.amount ? parseFloat(form.amount) : undefined,
        leadId: form.opportunityFrom === 'Lead' ? form.leadId : undefined,
        customerId: form.opportunityFrom === 'Customer' ? form.customerId : undefined,
        customerName:
          form.opportunityFrom === 'Prospect'
            ? form.customerName.trim()
            : form.customerName.trim() || undefined,
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
        notes: form.notes || undefined,
        contactId: form.contactId || undefined,
        contactPerson: form.contactPerson || undefined,
        jobTitle: form.jobTitle || undefined,
        contactEmail: form.contactEmail || undefined,
        contactMobile: form.contactMobile || undefined,
        whatsapp: form.whatsapp || undefined,
        phone: form.phone || undefined,
        phoneExt: form.phoneExt || undefined,
      });
      toast.success('Opportunity created!');
      router.push(`/crm/opportunities/${opp.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create opportunity';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To">
            <p className="text-xs text-gray-500">Assign users after save.</p>
          </DeskSideCard>
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
        </>
      }
    >
      <DeskPageHeader
        title="New Opportunity"
        dirty
        saving={loading}
        onCancel={() => router.push('/crm/opportunities')}
        onSave={handleSave}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">
          <DeskField label="Opportunity Name" required className="md:col-span-3">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Acme ERP Implementation"
              className={deskInput}
            />
          </DeskField>

          <DeskField label="Series">
            <input className={deskInput} value="CRM-OPP-.YYYY.-" readOnly />
          </DeskField>
          <DeskField label="Opportunity From" required>
            <select
              name="opportunityFrom"
              value={form.opportunityFrom}
              onChange={handleChange}
              className={deskSelect}
            >
              {OPPORTUNITY_FROM.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </DeskField>
          <DeskField label="Party" required>
            {form.opportunityFrom === 'Lead' && (
              <select value={form.leadId} onChange={handleLeadPick} className={deskSelect} required>
                <option value="">Select lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName}
                    {l.companyName ? ` — ${l.companyName}` : ''}
                  </option>
                ))}
              </select>
            )}
            {form.opportunityFrom === 'Customer' && (
              <select name="customerId" value={form.customerId} onChange={handleChange} className={deskSelect} required>
                <option value="">Select customer…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
            {form.opportunityFrom === 'Prospect' && (
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Prospect / party name"
                className={deskInput}
                required
              />
            )}
          </DeskField>

          <DeskField label="Status" required>
            <select name="status" value={form.status} onChange={handleChange} className={deskSelect}>
              {OPPORTUNITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
            <input className={deskInput} value="(Current User)" readOnly />
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
            <input
              name="expectedClosingDate"
              type="date"
              value={form.expectedClosingDate}
              onChange={handleChange}
              className={deskInput}
            />
          </DeskField>

          <DeskField label="Probability %">
            <input
              name="probability"
              type="number"
              min={0}
              max={100}
              value={form.probability}
              onChange={handleChange}
              className={deskInput}
            />
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
            <input
              name="annualRevenue"
              type="number"
              value={form.annualRevenue}
              onChange={handleChange}
              placeholder="0"
              className={deskInput}
            />
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
            <input name="website" type="url" value={form.website} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="City">
            <input name="city" value={form.city} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="State/Province">
            <input name="state" value={form.state} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Country">
            <input name="country" value={form.country} onChange={handleChange} className={deskInput} />
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
        </DeskSection>

        <DeskSection title="Opportunity Value">
          <DeskField label="Currency">
            <input name="currency" value={form.currency} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Opportunity Amount">
            <input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="500000"
              className={deskInput}
            />
          </DeskField>
        </DeskSection>

        <DeskSection title="More Information">
          <DeskField label="Campaign">
            <input name="campaign" value={form.campaign} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Opportunity Date">
            <input
              name="transactionDate"
              type="date"
              value={form.transactionDate}
              onChange={handleChange}
              className={deskInput}
            />
          </DeskField>
          <DeskField label="Notes" className="md:col-span-3">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes…"
              className={`${deskInput} resize-none`}
            />
          </DeskField>
        </DeskSection>

        <DeskSection title="Primary Contact">
          <DeskField label="Link Contact" className="md:col-span-3">
            <select value={form.contactId} onChange={handleContactPick} className={deskSelect}>
              <option value="">—</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.email ? ` (${c.email})` : ''}
                </option>
              ))}
            </select>
          </DeskField>
          <DeskField label="Contact Person">
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Job Title">
            <input name="jobTitle" value={form.jobTitle} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Contact Email">
            <input
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              className={deskInput}
            />
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
      </form>
    </DeskFormShell>
  );
}
