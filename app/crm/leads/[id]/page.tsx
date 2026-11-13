'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, Building2, Target, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getLeadById, updateLead, addLeadNote, createFollowUp, convertLead,
  createOpportunity, getLeadSources, getTerritories, getMarketSegments,
  makeQuotationFromLead,
  LEAD_STATUSES, LEAD_TYPES, REQUEST_TYPES, QUALIFICATION_STATUSES,
  NO_OF_EMPLOYEES, SALUTATIONS, GENDERS, DEFAULT_LEAD_SOURCES,
  type Lead,
} from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';

function buildFullName(firstName?: string, middleName?: string, lastName?: string) {
  return [firstName, middleName, lastName].map((s) => (s || '').trim()).filter(Boolean).join(' ');
}

function opportunityNameFromLead(lead: Lead) {
  return lead.companyName?.trim() || lead.fullName?.trim() || 'Opportunity';
}

function canUseCreateActions(status: string) {
  return status !== 'Converted' && status !== 'Do Not Contact';
}

type FormState = {
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  jobTitle: string;
  gender: string;
  source: string;
  status: string;
  fromCustomerId: string;
  leadType: string;
  requestType: string;
  email: string;
  website: string;
  mobile: string;
  whatsapp: string;
  phone: string;
  phoneExt: string;
  companyName: string;
  noOfEmployees: string;
  annualRevenue: string;
  industry: string;
  marketSegment: string;
  territory: string;
  fax: string;
  city: string;
  state: string;
  country: string;
  qualificationStatus: string;
  qualifiedOn: string;
  campaignName: string;
  language: string;
  disabled: boolean;
  unsubscribed: boolean;
  blogSubscriber: boolean;
  notes: string;
};

function leadToForm(lead: Lead): FormState {
  return {
    salutation: lead.salutation || '',
    firstName: lead.firstName || '',
    middleName: lead.middleName || '',
    lastName: lead.lastName || '',
    jobTitle: lead.jobTitle || lead.title || '',
    gender: lead.gender || '',
    source: lead.source || '',
    status: lead.status || 'Lead',
    fromCustomerId: lead.fromCustomerId || '',
    leadType: lead.leadType || '',
    requestType: lead.requestType || '',
    email: lead.email || '',
    website: lead.website || '',
    mobile: lead.mobile || '',
    whatsapp: lead.whatsapp || '',
    phone: lead.phone || '',
    phoneExt: lead.phoneExt || '',
    companyName: lead.companyName || '',
    noOfEmployees: lead.noOfEmployees || '1-10',
    annualRevenue: lead.annualRevenue != null ? String(lead.annualRevenue) : '',
    industry: lead.industry || '',
    marketSegment: lead.marketSegment || '',
    territory: lead.territory || '',
    fax: lead.fax || '',
    city: lead.city || '',
    state: lead.state || '',
    country: lead.country || 'Pakistan',
    qualificationStatus: lead.qualificationStatus || '',
    qualifiedOn: lead.qualifiedOn ? String(lead.qualifiedOn).slice(0, 10) : '',
    campaignName: lead.campaignName || '',
    language: lead.language || '',
    disabled: !!lead.disabled,
    unsubscribed: !!lead.unsubscribed,
    blogSubscriber: !!lead.blogSubscriber,
    notes: lead.notes || '',
  };
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [sourceOptions, setSourceOptions] = useState<string[]>(DEFAULT_LEAD_SOURCES);
  const [territories, setTerritories] = useState<string[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createActionLoading, setCreateActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({ followUpDate: '', followUpTime: '', type: 'Phone Call', notes: '' });
  const createMenuRef = useRef<HTMLDivElement>(null);

  const fetchLead = useCallback(async () => {
    try {
      const data = await getLeadById(id);
      setLead(data);
      setForm(leadToForm(data));
      setDirty(false);
    } catch {
      router.push('/crm/leads');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  useEffect(() => {
    Promise.all([
      getLeadSources().catch(() => []),
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
    ]).then(([srcList, terrList, segList]) => {
      const list = Array.isArray(srcList) ? srcList : [];
      setSourceOptions(list.length ? list.map((s) => s.name) : [...DEFAULT_LEAD_SOURCES]);
      setTerritories(Array.isArray(terrList) ? terrList.map((t: { name: string }) => t.name) : []);
      setSegments(Array.isArray(segList) ? segList.map((s: { name: string }) => s.name) : []);
    });
  }, []);

  useEffect(() => {
    if (!showCreateMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showCreateMenu]);

  const computedFullName = useMemo(
    () => (form ? buildFullName(form.firstName, form.middleName, form.lastName) : ''),
    [form],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => (prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : prev));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!lead || !form) return;
    if (!form.firstName.trim() && !form.companyName.trim()) {
      toast.error('First Name or Organization Name is required');
      return;
    }
    setSaving(true);
    try {
      const fullName = computedFullName || form.companyName.trim() || lead.fullName;
      const annualRevenue = form.annualRevenue ? parseFloat(form.annualRevenue) : undefined;
      await updateLead(lead.id, {
        fullName,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        middleName: form.middleName || undefined,
        salutation: form.salutation || undefined,
        title: form.jobTitle || undefined,
        jobTitle: form.jobTitle || undefined,
        gender: form.gender || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        mobile: form.mobile || undefined,
        whatsapp: form.whatsapp || undefined,
        phone: form.phone || undefined,
        phoneExt: form.phoneExt || undefined,
        companyName: form.companyName || undefined,
        industry: form.industry || undefined,
        territory: form.territory || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        source: form.source || undefined,
        status: form.status || undefined,
        leadType: form.leadType || undefined,
        requestType: form.requestType || undefined,
        noOfEmployees: form.noOfEmployees || undefined,
        annualRevenue: Number.isFinite(annualRevenue) ? annualRevenue : undefined,
        marketSegment: form.marketSegment || undefined,
        fax: form.fax || undefined,
        qualificationStatus: form.qualificationStatus || undefined,
        qualifiedOn: form.qualifiedOn || undefined,
        campaignName: form.campaignName || undefined,
        language: form.language || undefined,
        disabled: form.disabled,
        unsubscribed: form.unsubscribed,
        blogSubscriber: form.blogSubscriber,
        fromCustomerId: form.fromCustomerId || undefined,
        notes: form.notes || undefined,
      } as Partial<Lead>);
      toast.success('Lead updated');
      setDirty(false);
      fetchLead();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!lead) return;
    setCreateActionLoading('customer');
    try {
      await convertLead(lead.id, { createNewCustomer: true, createContact: false, createOpportunity: false });
      toast.success('Customer created — lead marked Converted');
      setShowCreateMenu(false);
      fetchLead();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create customer');
    } finally {
      setCreateActionLoading(null);
    }
  };

  const handleCreateOpportunity = async () => {
    if (!lead) return;
    setCreateActionLoading('opportunity');
    try {
      const opp = await createOpportunity({
        name: opportunityNameFromLead(lead),
        opportunityFrom: 'Lead',
        leadId: lead.id,
        stage: 'Prospecting',
        status: 'Open',
        source: lead.source,
        industry: lead.industry,
        territory: lead.territory,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        website: lead.website,
        annualRevenue: lead.annualRevenue,
        noOfEmployees: lead.noOfEmployees,
        marketSegment: lead.marketSegment,
        contactPerson: lead.fullName,
        jobTitle: lead.jobTitle || lead.title,
        contactEmail: lead.email,
        contactMobile: lead.mobile,
        phone: lead.phone,
        phoneExt: lead.phoneExt,
        whatsapp: lead.whatsapp,
        customerName: lead.companyName,
        assignedToId: lead.assignedToId,
        currency: lead.currency || 'PKR',
        campaign: lead.campaignName,
      });
      await updateLead(lead.id, { status: 'Opportunity' });
      toast.success('Opportunity created');
      setShowCreateMenu(false);
      router.push(`/crm/opportunities/${opp.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create opportunity');
    } finally {
      setCreateActionLoading(null);
    }
  };

  const handleCreateQuotation = async () => {
    if (!lead) return;
    setCreateActionLoading('quotation');
    try {
      const quotation = await makeQuotationFromLead(lead.id);
      const num = quotation?.quotationNumber || quotation?.id;
      toast.success(num ? `Quotation ${num} created` : 'Quotation created');
      setShowCreateMenu(false);
      fetchLead();
      router.push('/sales/quotations');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create quotation');
    } finally {
      setCreateActionLoading(null);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) return;
    try {
      await addLeadNote(lead.id, noteText, 'note_added');
      setNoteText('');
      toast.success('Note added');
      fetchLead();
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleFollowUp = async () => {
    if (!lead || !followUpData.followUpDate) return;
    await createFollowUp({ leadId: lead.id, ...followUpData });
    setShowFollowUp(false);
    toast.success('Follow-up scheduled');
    fetchLead();
  };

  if (loading || !form || !lead) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const showCreate = canUseCreateActions(lead.status);
  const ownerLabel = lead.assignedTo
    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
    : '(Unassigned)';

  return (
    <>
      <DeskFormShell
        side={
          <>
            <DeskSideCard title="Assigned To">
              <p className="text-sm text-gray-700">{ownerLabel}</p>
            </DeskSideCard>
            <DeskSideCard title="Attachments" />
            <DeskSideCard title="Tags" />
            <DeskSideCard title="Activity">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(lead.activities || []).slice(0, 8).map((a) => (
                  <div key={a.id} className="text-xs text-gray-600 border-b border-gray-50 pb-1.5">
                    <p className="font-medium text-gray-800">{a.type?.replace(/_/g, ' ')}</p>
                    {(a.description || a.title) && <p className="text-gray-500 line-clamp-2">{a.description || a.title}</p>}
                    <p className="text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!(lead.activities || []).length && <p className="text-xs text-gray-400">No activity</p>}
              </div>
              <div className="mt-3 space-y-2">
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className={`${deskInput} resize-none text-xs`}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="w-full px-2 py-1.5 text-xs font-medium rounded-md bg-[#014582] text-white disabled:opacity-40"
                >
                  Add Note
                </button>
              </div>
            </DeskSideCard>
            <DeskSideCard title="Follow-ups">
              <button
                type="button"
                onClick={() => setShowFollowUp(true)}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Clock className="w-3.5 h-3.5" /> Schedule Follow-up
              </button>
              <div className="mt-2 space-y-1.5">
                {(lead.followUps || []).slice(0, 5).map((f) => (
                  <div key={f.id} className="text-xs text-gray-600">
                    <p className="font-medium">{f.type} · {f.followUpDate}</p>
                    {f.notes && <p className="text-gray-400 line-clamp-1">{f.notes}</p>}
                  </div>
                ))}
              </div>
            </DeskSideCard>
          </>
        }
      >
        <DeskPageHeader
          title={lead.fullName || lead.leadNumber || 'Lead'}
          dirty={dirty}
          saving={saving}
          onCancel={() => router.push('/crm/leads')}
          onSave={handleSave}
          actions={
            showCreate ? (
              <div className="relative" ref={createMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowCreateMenu((v) => !v)}
                  disabled={!!createActionLoading}
                  className="px-3 py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50"
                >
                  Create <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showCreateMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <button type="button" onClick={handleCreateCustomer} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" /> Customer
                    </button>
                    <button type="button" onClick={handleCreateOpportunity} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" /> Opportunity
                    </button>
                    <button type="button" onClick={handleCreateQuotation} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" /> Quotation
                    </button>
                  </div>
                )}
              </div>
            ) : null
          }
        />

        <p className="text-xs text-gray-400 mb-3">{lead.leadNumber}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">
          <DeskField label="Series">
            <input className={deskInput} value={lead.leadNumber || 'CRM-LEAD-.YYYY.-'} readOnly />
          </DeskField>
          <DeskField label="Job Title">
            <input name="jobTitle" value={form.jobTitle} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Lead Owner">
            <input className={deskInput} value={ownerLabel} readOnly />
          </DeskField>

          <DeskField label="Salutation">
            <select name="salutation" value={form.salutation} onChange={handleChange} className={deskSelect}>
              <option value="" />
              {SALUTATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DeskField>
          <DeskField label="Gender">
            <select name="gender" value={form.gender} onChange={handleChange} className={deskSelect}>
              <option value="" />
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </DeskField>
          <DeskField label="Status" required>
            <select name="status" value={form.status} onChange={handleChange} className={deskSelect} required>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DeskField>

          <DeskField label="First Name" required>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Source">
            <select name="source" value={form.source} onChange={handleChange} className={deskSelect}>
              {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DeskField>
          <DeskField label="Lead Type">
            <select name="leadType" value={form.leadType} onChange={handleChange} className={deskSelect}>
              {LEAD_TYPES.map((t) => <option key={t || 'empty'} value={t}>{t}</option>)}
            </select>
          </DeskField>

          <DeskField label="Middle Name">
            <input name="middleName" value={form.middleName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div />
          <DeskField label="Request Type">
            <select name="requestType" value={form.requestType} onChange={handleChange} className={deskSelect}>
              {REQUEST_TYPES.map((t) => <option key={t || 'empty'} value={t}>{t}</option>)}
            </select>
          </DeskField>

          <DeskField label="Last Name">
            <input name="lastName" value={form.lastName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div />
          <DeskField label="From Customer">
            <input name="fromCustomerId" value={form.fromCustomerId} onChange={handleChange} className={deskInput} />
          </DeskField>
        </div>

        {computedFullName ? (
          <p className="text-xs text-gray-500 mt-2">Full Name: <span className="font-medium text-gray-700">{computedFullName}</span></p>
        ) : null}

        <DeskSection title="Contact Info">
          <DeskField label="Email">
            <input type="email" name="email" value={form.email} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Mobile No">
            <input name="mobile" value={form.mobile} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Website">
            <input name="website" value={form.website} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="WhatsApp">
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Phone Ext.">
            <input name="phoneExt" value={form.phoneExt} onChange={handleChange} className={deskInput} />
          </DeskField>
        </DeskSection>

        <DeskSection title="Organization">
          <DeskField label="Organization Name">
            <input name="companyName" value={form.companyName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Annual Revenue">
            <input type="number" name="annualRevenue" value={form.annualRevenue} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Territory">
            {territories.length ? (
              <select name="territory" value={form.territory} onChange={handleChange} className={deskSelect}>
                <option value="" />
                {territories.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input name="territory" value={form.territory} onChange={handleChange} className={deskInput} />
            )}
          </DeskField>
          <DeskField label="No of Employees">
            <select name="noOfEmployees" value={form.noOfEmployees} onChange={handleChange} className={deskSelect}>
              {NO_OF_EMPLOYEES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </DeskField>
          <DeskField label="Industry">
            <input name="industry" value={form.industry} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Fax">
            <input name="fax" value={form.fax} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div />
          <DeskField label="Market Segment">
            {segments.length ? (
              <select name="marketSegment" value={form.marketSegment} onChange={handleChange} className={deskSelect}>
                <option value="" />
                {segments.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input name="marketSegment" value={form.marketSegment} onChange={handleChange} className={deskInput} />
            )}
          </DeskField>
        </DeskSection>

        <DeskSection title="Address & Contacts">
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

        <DeskSection title="Qualification">
          <DeskField label="Qualification Status">
            <select name="qualificationStatus" value={form.qualificationStatus} onChange={handleChange} className={deskSelect}>
              <option value="" />
              {QUALIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </DeskField>
          <DeskField label="Qualified on">
            <input type="date" name="qualifiedOn" value={form.qualifiedOn} onChange={handleChange} className={deskInput} />
          </DeskField>
        </DeskSection>

        <DeskSection title="Additional Information">
          <DeskField label="Campaign Name">
            <input name="campaignName" value={form.campaignName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Print Language">
            <input name="language" value={form.language} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div className="flex flex-col gap-2 justify-end pb-1">
            {([
              ['disabled', 'Disabled'],
              ['unsubscribed', 'Unsubscribed'],
              ['blogSubscriber', 'Blog Subscriber'],
            ] as const).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name={key}
                  checked={form[key]}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                />
                {label}
              </label>
            ))}
          </div>
          <DeskField label="Notes" className="md:col-span-3">
            <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className={`${deskInput} resize-none`} />
          </DeskField>
        </DeskSection>
      </DeskFormShell>

      {showFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Schedule Follow-up</h3>
            <DeskField label="Date">
              <input type="date" className={deskInput} value={followUpData.followUpDate}
                onChange={(e) => setFollowUpData((p) => ({ ...p, followUpDate: e.target.value }))} />
            </DeskField>
            <DeskField label="Time">
              <input type="time" className={deskInput} value={followUpData.followUpTime}
                onChange={(e) => setFollowUpData((p) => ({ ...p, followUpTime: e.target.value }))} />
            </DeskField>
            <DeskField label="Type">
              <select className={deskSelect} value={followUpData.type}
                onChange={(e) => setFollowUpData((p) => ({ ...p, type: e.target.value }))}>
                {['Phone Call', 'Email', 'Meeting', 'WhatsApp', 'Visit'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </DeskField>
            <DeskField label="Notes">
              <textarea rows={2} className={deskInput} value={followUpData.notes}
                onChange={(e) => setFollowUpData((p) => ({ ...p, notes: e.target.value }))} />
            </DeskField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowFollowUp(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancel</button>
              <button type="button" onClick={handleFollowUp} className="px-3 py-1.5 bg-[#014582] text-white rounded-md text-sm">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
