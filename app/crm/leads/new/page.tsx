'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  createLead,
  getCustomFields,
  getLeadSources,
  getTerritories,
  getMarketSegments,
  LEAD_STATUSES,
  LEAD_TYPES,
  REQUEST_TYPES,
  QUALIFICATION_STATUSES,
  NO_OF_EMPLOYEES,
  SALUTATIONS,
  GENDERS,
  DEFAULT_LEAD_SOURCES,
  type LeadCustomField,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSection,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';

function buildFullName(firstName: string, middleName: string, lastName: string) {
  return [firstName, middleName, lastName].map((s) => s.trim()).filter(Boolean).join(' ');
}

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<LeadCustomField[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>(DEFAULT_LEAD_SOURCES);
  const [territories, setTerritories] = useState<string[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});

  const [formData, setFormData] = useState({
    salutation: '',
    firstName: '',
    middleName: '',
    lastName: '',
    jobTitle: '',
    gender: '',
    source: '',
    status: 'Lead',
    fromCustomerId: '',
    leadType: '',
    requestType: '',
    email: '',
    website: '',
    mobile: '',
    whatsapp: '',
    phone: '',
    phoneExt: '',
    companyName: '',
    noOfEmployees: '1-10',
    annualRevenue: '',
    industry: '',
    marketSegment: '',
    territory: '',
    fax: '',
    city: '',
    state: '',
    country: 'Pakistan',
    qualificationStatus: '',
    qualifiedOn: '',
    campaignName: '',
    language: '',
    disabled: false,
    unsubscribed: false,
    blogSubscriber: false,
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      getCustomFields().catch(() => []),
      getLeadSources().catch(() => []),
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
    ]).then(([fields, srcList, terrList, segList]) => {
      setCustomFields(Array.isArray(fields) ? fields : []);
      const names = Array.isArray(srcList) && srcList.length
        ? srcList.map((s: any) => s.name)
        : [...DEFAULT_LEAD_SOURCES];
      setSourceOptions(names);
      setTerritories(Array.isArray(terrList) ? terrList.map((t: any) => t.name) : []);
      setSegments(Array.isArray(segList) ? segList.map((s: any) => s.name) : []);
      setFormData((prev) => ({ ...prev, source: prev.source || names[0] || 'Walk In' }));
    });
  }, []);

  const computedFullName = useMemo(
    () => buildFullName(formData.firstName, formData.middleName, formData.lastName),
    [formData.firstName, formData.middleName, formData.lastName],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() && !formData.companyName.trim()) {
      toast.error('First Name or Organization Name is required');
      return;
    }
    setLoading(true);
    try {
      const fullName = computedFullName || formData.companyName.trim() || 'Unnamed Lead';
      const annualRevenue = formData.annualRevenue ? parseFloat(formData.annualRevenue) : undefined;
      const lead = await createLead({
        fullName,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        middleName: formData.middleName || undefined,
        salutation: formData.salutation || undefined,
        title: formData.jobTitle || undefined,
        jobTitle: formData.jobTitle || undefined,
        gender: formData.gender || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        mobile: formData.mobile || undefined,
        whatsapp: formData.whatsapp || undefined,
        phone: formData.phone || undefined,
        phoneExt: formData.phoneExt || undefined,
        companyName: formData.companyName || undefined,
        industry: formData.industry || undefined,
        territory: formData.territory || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || 'Pakistan',
        source: formData.source || sourceOptions[0] || 'Walk In',
        status: formData.status || 'Lead',
        leadType: formData.leadType || undefined,
        requestType: formData.requestType || undefined,
        noOfEmployees: formData.noOfEmployees || undefined,
        annualRevenue,
        marketSegment: formData.marketSegment || undefined,
        fax: formData.fax || undefined,
        qualificationStatus: formData.qualificationStatus || undefined,
        qualifiedOn: formData.qualifiedOn || undefined,
        campaignName: formData.campaignName || undefined,
        language: formData.language || undefined,
        disabled: formData.disabled,
        unsubscribed: formData.unsubscribed,
        blogSubscriber: formData.blogSubscriber,
        fromCustomerId: formData.fromCustomerId || undefined,
        notes: formData.notes || undefined,
        customFields: customFieldValues,
      } as any);
      toast.success('Lead saved');
      router.push(`/crm/leads/${lead.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To">
            <p className="text-xs text-gray-500">Lead Owner set after save (current user).</p>
          </DeskSideCard>
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
          <DeskSideCard title="Share" />
        </>
      }
    >
      <DeskPageHeader
        title="New Lead"
        dirty
        saving={loading}
        onCancel={() => router.push('/crm/leads')}
        onSave={handleSave}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* Top identity — ERPNext 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">
          <DeskField label="Series">
            <input className={deskInput} value="CRM-LEAD-.YYYY.-" readOnly />
          </DeskField>
          <DeskField label="Job Title">
            <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Lead Owner">
            <input className={deskInput} value="(Current User)" readOnly />
          </DeskField>

          <DeskField label="Salutation">
            <select name="salutation" value={formData.salutation} onChange={handleChange} className={deskSelect}>
              <option value="" />
              {SALUTATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </DeskField>
          <DeskField label="Gender">
            <select name="gender" value={formData.gender} onChange={handleChange} className={deskSelect}>
              <option value="" />
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </DeskField>
          <DeskField label="Status" required>
            <select name="status" value={formData.status} onChange={handleChange} className={deskSelect} required>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </DeskField>

          <DeskField label="First Name" required>
            <input name="firstName" value={formData.firstName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Source">
            <select name="source" value={formData.source} onChange={handleChange} className={deskSelect}>
              {sourceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </DeskField>
          {formData.source === 'Existing Customer' ? (
            <DeskField label="From Customer">
              <input name="fromCustomerId" value={formData.fromCustomerId} onChange={handleChange} className={deskInput} placeholder="Customer id / name" />
            </DeskField>
          ) : (
            <DeskField label="Lead Type">
              <select name="leadType" value={formData.leadType} onChange={handleChange} className={deskSelect}>
                {LEAD_TYPES.map((t) => (
                  <option key={t || 'empty'} value={t}>{t}</option>
                ))}
              </select>
            </DeskField>
          )}

          <DeskField label="Middle Name">
            <input name="middleName" value={formData.middleName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div />
          {formData.source === 'Existing Customer' ? (
            <DeskField label="Lead Type">
              <select name="leadType" value={formData.leadType} onChange={handleChange} className={deskSelect}>
                {LEAD_TYPES.map((t) => (
                  <option key={t || 'empty'} value={t}>{t}</option>
                ))}
              </select>
            </DeskField>
          ) : (
            <DeskField label="Request Type">
              <select name="requestType" value={formData.requestType} onChange={handleChange} className={deskSelect}>
                {REQUEST_TYPES.map((t) => (
                  <option key={t || 'empty'} value={t}>{t}</option>
                ))}
              </select>
            </DeskField>
          )}

          <DeskField label="Last Name">
            <input name="lastName" value={formData.lastName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div />
          {formData.source === 'Existing Customer' ? (
            <DeskField label="Request Type">
              <select name="requestType" value={formData.requestType} onChange={handleChange} className={deskSelect}>
                {REQUEST_TYPES.map((t) => (
                  <option key={t || 'empty'} value={t}>{t}</option>
                ))}
              </select>
            </DeskField>
          ) : (
            <div />
          )}
        </div>

        {computedFullName ? (
          <p className="text-xs text-gray-500 mt-2">Full Name: <span className="font-medium text-gray-700">{computedFullName}</span></p>
        ) : null}

        <DeskSection title="Contact Info">
          <DeskField label="Email">
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Mobile No">
            <input name="mobile" value={formData.mobile} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Phone">
            <input name="phone" value={formData.phone} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Website">
            <input name="website" value={formData.website} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="WhatsApp">
            <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Phone Ext.">
            <input name="phoneExt" value={formData.phoneExt} onChange={handleChange} className={deskInput} />
          </DeskField>
        </DeskSection>

        <DeskSection title="Organization">
          <DeskField label="Organization Name">
            <input name="companyName" value={formData.companyName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Annual Revenue">
            <input type="number" name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Territory">
            {territories.length ? (
              <select name="territory" value={formData.territory} onChange={handleChange} className={deskSelect}>
                <option value="" />
                {territories.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input name="territory" value={formData.territory} onChange={handleChange} className={deskInput} />
            )}
          </DeskField>
          <DeskField label="No of Employees">
            <select name="noOfEmployees" value={formData.noOfEmployees} onChange={handleChange} className={deskSelect}>
              {NO_OF_EMPLOYEES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </DeskField>
          <DeskField label="Industry">
            <input name="industry" value={formData.industry} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Fax">
            <input name="fax" value={formData.fax} onChange={handleChange} className={deskInput} />
          </DeskField>
          <div />
          <DeskField label="Market Segment">
            {segments.length ? (
              <select name="marketSegment" value={formData.marketSegment} onChange={handleChange} className={deskSelect}>
                <option value="" />
                {segments.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input name="marketSegment" value={formData.marketSegment} onChange={handleChange} className={deskInput} />
            )}
          </DeskField>
        </DeskSection>

        <DeskSection title="Address & Contacts">
          <DeskField label="City">
            <input name="city" value={formData.city} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="State/Province">
            <input name="state" value={formData.state} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Country">
            <input name="country" value={formData.country} onChange={handleChange} className={deskInput} />
          </DeskField>
        </DeskSection>

        <DeskSection title="Qualification">
          <DeskField label="Qualification Status">
            <select name="qualificationStatus" value={formData.qualificationStatus} onChange={handleChange} className={deskSelect}>
              <option value="" />
              {QUALIFICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </DeskField>
          <DeskField label="Qualified on">
            <input type="date" name="qualifiedOn" value={formData.qualifiedOn} onChange={handleChange} className={deskInput} />
          </DeskField>
        </DeskSection>

        <DeskSection title="Additional Information">
          <DeskField label="Campaign Name">
            <input name="campaignName" value={formData.campaignName} onChange={handleChange} className={deskInput} />
          </DeskField>
          <DeskField label="Print Language">
            <input name="language" value={formData.language} onChange={handleChange} className={deskInput} />
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
                  checked={(formData as any)[key]}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                />
                {label}
              </label>
            ))}
          </div>
          <DeskField label="Notes" className="md:col-span-3">
            <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className={`${deskInput} resize-none`} />
          </DeskField>
        </DeskSection>

        {customFields.length > 0 ? (
          <DeskSection title="Custom Fields">
            {customFields.map((field) => {
              const val = (customFieldValues[field.fieldKey] as string) ?? field.defaultValue ?? '';
              return (
                <DeskField key={field.id} label={field.fieldName} required={field.isRequired} className={field.fieldType === 'textarea' ? 'md:col-span-3' : ''}>
                  {field.fieldType === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={val}
                      required={field.isRequired}
                      onChange={(e) => setCustomFieldValues((p) => ({ ...p, [field.fieldKey]: e.target.value }))}
                      className={`${deskInput} resize-none`}
                    />
                  ) : (
                    <input
                      value={val}
                      required={field.isRequired}
                      onChange={(e) => setCustomFieldValues((p) => ({ ...p, [field.fieldKey]: e.target.value }))}
                      className={deskInput}
                    />
                  )}
                </DeskField>
              );
            })}
          </DeskSection>
        ) : null}
      </form>
    </DeskFormShell>
  );
}
