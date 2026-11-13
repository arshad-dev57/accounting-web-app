'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  getAccountById, updateAccount, getContacts, getOpportunities,
  type CRMAccount, type Contact, type Opportunity,
} from '@/lib/crm-api';
import {
  DeskField, DeskFormShell, DeskPageHeader, DeskSection, DeskSideCard,
  deskInput, deskSelect,
} from '../../components/ErpDeskForm';

const CUSTOMER_TYPES = ['Individual', 'Company'];
const CUSTOMER_GROUPS = ['All Customer Groups', 'Commercial', 'Government', 'Individual', 'Non Profit'];
const TERRITORIES = ['All Territories', 'Pakistan', 'Rest Of The World'];
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
const LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Hindi', 'Urdu'];
const INDUSTRIES = [
  'Advertising', 'Agriculture', 'Automotive', 'Banking', 'Chemical',
  'Commercial', 'Communications', 'Construction', 'Consumer Goods',
  'Education', 'Electronics', 'Energy', 'Entertainment', 'Finance',
  'Government', 'Healthcare', 'Hospitality', 'Information Technology',
  'Insurance', 'Manufacturing', 'Marketing', 'Media', 'Non Profit',
  'Oil & Gas', 'Other', 'Pharmaceuticals', 'Real Estate', 'Retail',
  'Services', 'Technology', 'Telecommunication', 'Transportation', 'Wholesale',
];
const MARKET_SEGMENTS = ['Lower Income', 'Middle Income', 'Upper Income'];

type AddrExtras = {
  customerGroup?: string;
  defaultCurrency?: string;
  language?: string;
  mobile?: string;
  website?: string;
  industry?: string;
  marketSegment?: string;
  fromLeadId?: string;
};

function extrasFromAccount(account: CRMAccount): AddrExtras {
  const addr = (account as unknown as { address?: AddrExtras }).address;
  return (addr && typeof addr === 'object') ? addr : {};
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<CRMAccount | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerType: 'Individual',
    customerGroup: 'All Customer Groups',
    territory: 'All Territories',
    fromLead: '',
    accountManager: '',
    defaultCurrency: 'PKR',
    language: 'English',
    taxId: '',
    email: '',
    mobile: '',
    phone: '',
    website: '',
    industry: '',
    marketSegment: '',
    notes: '',
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [acc, ctxList, oppList] = await Promise.all([
        getAccountById(id),
        getContacts({ accountId: id, limit: 10 }).catch(() => ({ contacts: [] })),
        getOpportunities({ accountId: id, limit: 10 }).catch(() => ({ opportunities: [] })),
      ]);
      if (!acc) {
        router.push('/crm/accounts');
        return;
      }
      setAccount(acc);
      const extras = extrasFromAccount(acc);
      setForm({
        customerName: acc.name || '',
        customerType: (acc as unknown as { customerType?: string }).customerType || acc.type || 'Individual',
        customerGroup: extras.customerGroup || 'All Customer Groups',
        territory: (acc as unknown as { territory?: string }).territory || 'All Territories',
        fromLead: extras.fromLeadId || '',
        accountManager: acc.assignedTo
          ? `${acc.assignedTo.firstName} ${acc.assignedTo.lastName}`
          : '',
        defaultCurrency: extras.defaultCurrency || 'PKR',
        language: extras.language || 'English',
        taxId: (acc as unknown as { taxId?: string }).taxId || '',
        email: acc.email || '',
        mobile: extras.mobile || '',
        phone: acc.phone || '',
        website: extras.website || acc.website || '',
        industry: extras.industry || acc.industry || '',
        marketSegment: extras.marketSegment || '',
        notes: acc.notes || '',
      });
      setContacts(ctxList?.contacts ?? []);
      setOpportunities(oppList?.opportunities ?? []);
      setDirty(false);
    } catch {
      router.push('/crm/accounts');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!account) return;
    if (!form.customerName.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateAccount(account.id, {
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
      toast.success('Customer saved');
      setDirty(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !account) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <DeskFormShell
      side={
        <>
          <DeskSideCard title="Assigned To">
            <p className="text-sm text-gray-700">{form.accountManager || 'No assignee'}</p>
          </DeskSideCard>
          <DeskSideCard title="Contacts">
            <div className="space-y-1.5">
              {contacts.slice(0, 5).map((c) => (
                <Link key={c.id} href={`/crm/contacts/${c.id}`} className="block text-sm text-[#014582] hover:underline">
                  {c.firstName} {c.lastName}
                </Link>
              ))}
              {!contacts.length && <p className="text-xs text-gray-400">No contacts</p>}
            </div>
          </DeskSideCard>
          <DeskSideCard title="Opportunities">
            <div className="space-y-1.5">
              {opportunities.slice(0, 5).map((o) => (
                <Link key={o.id} href={`/crm/opportunities/${o.id}`} className="block text-sm text-[#014582] hover:underline">
                  {o.name}
                </Link>
              ))}
              {!opportunities.length && <p className="text-xs text-gray-400">No opportunities</p>}
            </div>
          </DeskSideCard>
          <DeskSideCard title="Attachments" />
          <DeskSideCard title="Tags" />
        </>
      }
    >
      <DeskPageHeader
        title={account.name}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/accounts')}
      />
      {account.customerNumber && (
        <p className="text-xs text-gray-400 mb-3">{account.customerNumber}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5 mt-2">
        <DeskField label="Series">
          <input className={deskInput} value={account.customerNumber || 'CUST-.YYYY.-'} readOnly />
        </DeskField>
        <DeskField label="Customer Name" required>
          <input className={deskInput} value={form.customerName} onChange={set('customerName')} />
        </DeskField>
        <div />

        <DeskField label="Customer Type">
          <select className={deskSelect} value={form.customerType} onChange={set('customerType')}>
            {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </DeskField>
        <DeskField label="Customer Group" required>
          <select className={deskSelect} value={form.customerGroup} onChange={set('customerGroup')}>
            {CUSTOMER_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </DeskField>
        <DeskField label="Territory" required>
          <select className={deskSelect} value={form.territory} onChange={set('territory')}>
            {TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </DeskField>

        <DeskField label="From Lead">
          <input className={deskInput} value={form.fromLead} onChange={set('fromLead')} />
        </DeskField>
        <DeskField label="Account Manager">
          <input className={deskInput} value={form.accountManager} onChange={set('accountManager')} />
        </DeskField>
        <div />
      </div>

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

      <DeskSection title="More Information">
        <DeskField label="Industry">
          <select className={deskSelect} value={form.industry} onChange={set('industry')}>
            <option value="">—</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </DeskField>
        <DeskField label="Market Segment">
          <select className={deskSelect} value={form.marketSegment} onChange={set('marketSegment')}>
            <option value="">—</option>
            {MARKET_SEGMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </DeskField>
        <DeskField label="Default Currency">
          <select className={deskSelect} value={form.defaultCurrency} onChange={set('defaultCurrency')}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </DeskField>
        <DeskField label="Language">
          <select className={deskSelect} value={form.language} onChange={set('language')}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </DeskField>
        <DeskField label="Tax ID">
          <input className={deskInput} value={form.taxId} onChange={set('taxId')} />
        </DeskField>
        <div />
      </DeskSection>

      <DeskSection title="Notes">
        <DeskField label="Customer Details" className="md:col-span-3">
          <textarea rows={3} className={deskInput} value={form.notes} onChange={set('notes')} />
        </DeskField>
      </DeskSection>
    </DeskFormShell>
  );
}
