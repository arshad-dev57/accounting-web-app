'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import POSReceipt from './POSReceipt';
import { posReceiptService } from '../../../lib/pos-service';
import {
  DEFAULT_RECEIPT_TEMPLATE,
  loadReceiptTemplate,
  saveReceiptTemplate,
  type PosReceiptTemplate,
} from '../../../lib/pos-settings';
import { sampleReceiptSale } from '../../../lib/pos-receipt';

const field = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '9px 14px',
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
} as const;

const labelStyle = {
  display: 'block',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
} as const;

export default function ReceiptEditorTab({ isAdmin }: { isAdmin: boolean }) {
  const [template, setTemplate] = useState<PosReceiptTemplate>(DEFAULT_RECEIPT_TEMPLATE);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [receiptRes, profileRes] = await Promise.all([
          posReceiptService.get().catch(() => null),
          fetch('/api/profile', {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem('auth_token') ||
                document.cookie.split('; ').find((c) => c.startsWith('auth_token='))?.split('=')[1] ||
                ''
              }`,
            },
          }).then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        if (receiptRes?.data) {
          const next = saveReceiptTemplate(receiptRes.data);
          setTemplate(next);
        } else {
          setTemplate(loadReceiptTemplate());
        }
        if (profileRes?.success) setCompanyProfile(profileRes.data);
      } catch (e: any) {
        if (!cancelled) {
          setTemplate(loadReceiptTemplate());
          setError(e.message || 'Failed to load receipt template');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (partial: Partial<PosReceiptTemplate>) => {
    setTemplate((prev) => ({ ...prev, ...partial }));
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res: any = await posReceiptService.save(template);
      const next = saveReceiptTemplate(res.data || template);
      setTemplate(next);
      setMessage('Receipt template saved. Desktop POS will use this on the next sync / print.');
    } catch (e: any) {
      setError(e.message || 'Failed to save receipt template');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setTemplate({ ...DEFAULT_RECEIPT_TEMPLATE });
    setMessage('Defaults restored. Click Save to apply.');
  };

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '10px 14px',
      cursor: 'pointer',
    }}>
      <span style={{ fontSize: 13, color: '#0f172a' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );

  if (loading) {
    return <p style={{ color: '#64748b' }}>Loading receipt template...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: 18, fontWeight: 700 }}>Receipt template</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '6px 0 0' }}>
            Company-wide logo, store details, and receipt text. Desktop POS terminals sync this template for printing — print size and format stay the same on the sell screen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={resetDefaults}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          {isAdmin && (
            <button
              onClick={save}
              disabled={saving}
              style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#014582', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save receipt'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '10px 14px', color: '#059669', fontSize: 13, marginBottom: 14 }}>
          {message}
        </div>
      )}
      {!isAdmin && (
        <p style={{ color: '#fbbf24', fontSize: 13, marginTop: 0 }}>View only. Ask an admin to change the receipt template.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Section title="Store details (leave blank to use company profile)">
            <Field label="Store name" value={template.storeName} onChange={(v) => patch({ storeName: v })} disabled={!isAdmin} placeholder="Uses company name if empty" />
            <Field label="Address" value={template.storeAddress} onChange={(v) => patch({ storeAddress: v })} disabled={!isAdmin} />
            <Field label="Phone" value={template.phone} onChange={(v) => patch({ phone: v })} disabled={!isAdmin} />
            <Field label="Email" value={template.email} onChange={(v) => patch({ email: v })} disabled={!isAdmin} />
            <Field label="Website" value={template.website} onChange={(v) => patch({ website: v })} disabled={!isAdmin} />
            <Field label="NTN / Tax ID" value={template.taxId} onChange={(v) => patch({ taxId: v })} disabled={!isAdmin} />
            <div>
              <label style={labelStyle}>Receipt logo</label>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>
                Upload a logo for POS receipts. Remove clears it on print — company profile logo is not used as a fallback.
              </p>
              {template.storeLogo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <img
                    src={template.storeLogo}
                    alt="Receipt logo"
                    style={{ height: 56, maxWidth: 140, objectFit: 'contain', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: 6 }}
                  />
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => patch({ storeLogo: '', showLogo: false })}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#b91c1c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ) : null}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={!isAdmin}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  if (file.size > 1.5 * 1024 * 1024) {
                    setError('Logo must be under 1.5 MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === 'string' ? reader.result : '';
                    if (result) {
                      patch({ storeLogo: result, showLogo: true });
                      setError('');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                style={{ ...field, padding: '8px 10px' }}
              />
              <div style={{ marginTop: 8 }}>
                <Field
                  label="Or paste logo URL"
                  value={template.storeLogo.startsWith('data:') ? '' : template.storeLogo}
                  onChange={(v) => patch({ storeLogo: v.trim(), showLogo: v.trim() ? true : template.showLogo })}
                  disabled={!isAdmin}
                  placeholder="https://… or leave blank"
                />
              </div>
            </div>
          </Section>

          <Section title="Receipt text">
            <Field label="Header" value={template.receiptHeader} onChange={(v) => patch({ receiptHeader: v })} disabled={!isAdmin} />
            <Field label="Copy label" value={template.copyLabel} onChange={(v) => patch({ copyLabel: v })} disabled={!isAdmin} />
            <Field label="Footer" value={template.receiptFooter} onChange={(v) => patch({ receiptFooter: v })} disabled={!isAdmin} />
            <Field label="Return / exchange policy" value={template.receiptReturnPolicy} onChange={(v) => patch({ receiptReturnPolicy: v })} disabled={!isAdmin} textarea />
            <Field label="Extra notes" value={template.receiptNotes} onChange={(v) => patch({ receiptNotes: v })} disabled={!isAdmin} textarea />
            <Field label="Served by prefix" value={template.servedByPrefix} onChange={(v) => patch({ servedByPrefix: v })} disabled={!isAdmin} />
            <Field label="Bottom line" value={template.poweredBy} onChange={(v) => patch({ poweredBy: v })} disabled={!isAdmin} />
            <div>
              <label style={labelStyle}>Thermal paper width</label>
              <select
                value={template.thermalPaperWidthMm}
                disabled={!isAdmin}
                onChange={(e) => patch({ thermalPaperWidthMm: Number(e.target.value) as 58 | 80 })}
                style={field}
              >
                <option value={58}>58mm</option>
                <option value={80}>80mm</option>
              </select>
            </div>
          </Section>

          <Section title="Show / hide sections">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Toggle label="Logo" checked={template.showLogo} onChange={(v) => isAdmin && patch({ showLogo: v })} />
              <Toggle label="Address" checked={template.showAddress} onChange={(v) => isAdmin && patch({ showAddress: v })} />
              <Toggle label="Phone" checked={template.showPhone} onChange={(v) => isAdmin && patch({ showPhone: v })} />
              <Toggle label="Email" checked={template.showEmail} onChange={(v) => isAdmin && patch({ showEmail: v })} />
              <Toggle label="Website" checked={template.showWebsite} onChange={(v) => isAdmin && patch({ showWebsite: v })} />
              <Toggle label="Tax ID" checked={template.showTaxId} onChange={(v) => isAdmin && patch({ showTaxId: v })} />
              <Toggle label="Barcode" checked={template.showBarcode} onChange={(v) => isAdmin && patch({ showBarcode: v })} />
              <Toggle label="SKU" checked={template.showSku} onChange={(v) => isAdmin && patch({ showSku: v })} />
              <Toggle label="Cashier" checked={template.showCashier} onChange={(v) => isAdmin && patch({ showCashier: v })} />
              <Toggle label="Terminal" checked={template.showTerminal} onChange={(v) => isAdmin && patch({ showTerminal: v })} />
              <Toggle label="Loyalty points" checked={template.showLoyalty} onChange={(v) => isAdmin && patch({ showLoyalty: v })} />
            </div>
          </Section>
        </div>

        <div style={{ position: 'sticky', top: 16 }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: 0.6 }}>LIVE PREVIEW</div>
          <div style={{ background: '#e5e7eb', borderRadius: 16, padding: 12, maxHeight: '80vh', overflow: 'auto' }}>
            <POSReceipt
              sale={sampleReceiptSale()}
              companyProfile={companyProfile}
              template={template}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18 }}>
      <h3 style={{ color: '#0f172a', margin: '0 0 14px', fontSize: 14 }}>{title}</h3>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...field, resize: 'vertical' }}
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={field}
        />
      )}
    </div>
  );
}
