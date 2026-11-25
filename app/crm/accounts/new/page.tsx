'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  createAccount,
  createCustomerGroup, createTerritory, createMarketSegment,
  getCustomerGroups, getTerritories, getMarketSegments,
} from '@/lib/crm-api';
import {
  DeskPageHeader, DeskFormShell, DeskSection, DeskField,
  deskInput, deskSelect, DeskSideCard,
} from '../../components/ErpDeskForm';
import {
  QuickAddSelect,
  getIndustryOptions,
  addIndustryOption,
} from '../../components/QuickAddSelect';

const CUSTOMER_TYPES = ['Individual', 'Company'];
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
const LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Hindi', 'Urdu'];
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

const SERIES_DEFAULT = 'CUST-.YYYY.-';

const emptyForm = {
  series: SERIES_DEFAULT,
  customerName: '',
  customerType: 'Individual',
  customerGroup: 'All Customer Groups',
  territory: 'All Territories',
  fromLead: '',
  accountManager: '',
  defaultCurrency: 'PKR',
  language: 'English',
  taxId: '',
  // Address & Contact
  email: '',
  mobile: '',
  phone: '',
  website: '',
  // Details
  industry: '',
  marketSegment: '',
  // Notes
  notes: '',
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<string[]>([]);
  const [territories, setTerritories] = useState<string[]>([]);
  const [marketSegments, setMarketSegments] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>(INDUSTRIES);

  useEffect(() => {
    setIndustries(getIndustryOptions(INDUSTRIES));
    Promise.all([
      getCustomerGroups().catch(() => []),
      getTerritories().catch(() => []),
      getMarketSegments().catch(() => []),
    ]).then(([g, t, m]) => {
      setCustomerGroups(Array.isArray(g) ? g.map((x) => x.name) : []);
      setTerritories(Array.isArray(t) ? t.map((x) => x.name) : []);
      setMarketSegments(Array.isArray(m) ? m.map((x) => x.name) : []);
    });
  }, []);

  const setField = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.customerName.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    setSaving(true);
    try {
      const account = await createAccount({
        name: form.customerName.trim(),
        customerType: form.customerType,
        customerGroup: form.customerGroup,
        territory: form.territory !== 'All Territories' ? form.territory : undefined,
        defaultCurrency: form.defaultCurrency,
        language: form.language,
        email: form.email || undefined,
        phone: form.phone || undefined,
        mobile: form.mobile || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        marketSegment: form.marketSegment || undefined,
        taxId: form.taxId || undefined,
        notes: form.notes || undefined,
      });
      setDirty(false);
      toast.success('Customer saved');
      router.push(`/crm/accounts/${account.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To" />
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
          <DeskSideCard title="Connections" />
        </>
      }
    >
      <DeskPageHeader
        title="New Customer"
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.back()}
      />

      {/* Top grid — Series, Customer Type, Customer Group */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-4">
        <DeskField label="Series">
          <input className={deskInput} value={form.series} onChange={set('series')} />
        </DeskField>
        <DeskField label="Customer Name" required>
          <input className={deskInput} value={form.customerName} onChange={set('customerName')} placeholder="Enter Customer Name" />
        </DeskField>
        <div />

        <DeskField label="Customer Type">
          <select className={deskSelect} value={form.customerType} onChange={set('customerType')}>
            {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </DeskField>
        <QuickAddSelect
          label="Customer Group"
          value={form.customerGroup}
          options={customerGroups}
          onChange={(v) => setField('customerGroup', v)}
          placeholder="Select Customer Group"
          addTitle="Add Customer Group"
          extraFields={[
            { key: 'parentCustomerGroup', label: 'Parent Customer Group', type: 'select', options: customerGroups, placeholder: 'No Parent (Root)' },
          ]}
          onCreate={async ({ name, parentCustomerGroup }) => {
            const row = await createCustomerGroup({ name, parentCustomerGroup: parentCustomerGroup || undefined } as any);
            const created = row?.name || name;
            setCustomerGroups((prev) => Array.from(new Set([...prev, created])));
            return created;
          }}
        />
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

        <DeskField label="From Lead">
          <input className={deskInput} value={form.fromLead} onChange={set('fromLead')} placeholder="Lead" />
        </DeskField>
        <DeskField label="Account Manager">
          <input className={deskInput} value={form.accountManager} onChange={set('accountManager')} />
        </DeskField>
        <div />
      </div>

      {/* Section: Address & Contact */}
      <DeskSection title="Address & Contact">
        <DeskField label="Email">
          <input type="email" className={deskInput} value={form.email} onChange={set('email')} />
        </DeskField>
        <DeskField label="Mobile No">
          <input className={deskInput} value={form.mobile} onChange={set('mobile')} />
        </DeskField>
        <DeskField label="Phone">
          <input className={deskInput} value={form.phone} onChange={set('phone')} />
        </DeskField>
        <DeskField label="Website">
          <input className={deskInput} value={form.website} onChange={set('website')} />
        </DeskField>
      </DeskSection>

      {/* Section: More Information */}
      <DeskSection title="More Information">
        <QuickAddSelect
          label="Industry"
          value={form.industry}
          options={industries}
          onChange={(v) => setField('industry', v)}
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
        <DeskField label="Default Currency">
          <select className={deskSelect} value={form.defaultCurrency} onChange={set('defaultCurrency')}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </DeskField>
        <DeskField label="Language">
          <select className={deskSelect} value={form.language} onChange={set('language')}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </DeskField>
        <DeskField label="Tax ID">
          <input className={deskInput} value={form.taxId} onChange={set('taxId')} />
        </DeskField>
        <div />
      </DeskSection>

      {/* Notes */}
      <DeskSection title="Notes">
        <DeskField label="Customer Details" className="md:col-span-3">
          <textarea rows={3} className={deskInput} value={form.notes} onChange={set('notes')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
