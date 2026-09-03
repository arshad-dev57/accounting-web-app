'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
  PenLine,
  Building2,
  LayoutTemplate,
  ToggleLeft,
  Palette,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  DEFAULT_PDF_REPORT_SETTINGS,
  loadPdfReportSettingsLocal,
  normalizePdfReportSettings,
  savePdfReportSettingsLocal,
  suggestFromUserProfile,
  type PdfReportSettings,
} from '../../../lib/pdf-report-settings';

const LAYOUTS = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
] as const;

const LOGO_POSITIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
] as const;

const ACCENT_PRESETS = [
  '#014582',
  '#0FA3E0',
  '#1B4332',
  '#7F1D1D',
  '#4A044E',
  '#0F172A',
  '#1088dd',
];

export function PdfReportSettingsPage() {
  const [settings, setSettings] = useState<PdfReportSettings>({
    ...DEFAULT_PDF_REPORT_SETTINGS,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncedFromPrefs, setSyncedFromPrefs] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);

      const local = loadPdfReportSettingsLocal();
      if (local) {
        setSettings(local);
        setLogoPreview(local.logo || '');
        setSignaturePreview(local.signature || '');
        setSyncedFromPrefs(true);
      } else {
        const suggested = suggestFromUserProfile();
        setSettings((prev) => ({
          ...prev,
          companyName: suggested.companyName || '',
          companyAddress: suggested.companyAddress || '',
          logo: suggested.logo || '',
          signature: suggested.signature || '',
        }));
        setLogoPreview(suggested.logo || '');
        setSignaturePreview(suggested.signature || '');
        setSyncedFromPrefs(true);
      }

      await refreshFromApi();
    } finally {
      setLoading(false);
    }
  };

  const refreshFromApi = async () => {
    try {
      const response = await fetch('/api/pdf-report-settings');
      const result = await response.json();
      if (!result.success || !result.data) return;

      const data = normalizePdfReportSettings(result.data);
      const hasSaved =
        !!data.id ||
        !!data.logo ||
        !!data.signature ||
        !!data.companyName ||
        (data.footerText &&
          data.footerText !== DEFAULT_PDF_REPORT_SETTINGS.footerText);

      if (hasSaved || data.id) {
        setSettings(data);
        setLogoPreview(data.logo || '');
        setSignaturePreview(data.signature || '');
        savePdfReportSettingsLocal(data);
        setSyncedFromPrefs(true);
      }
    } catch (e) {
      console.error('PDF settings API load error:', e);
    }
  };

  const update = <K extends keyof PdfReportSettings>(
    key: K,
    value: PdfReportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onPickLogo = (file: File | null) => {
    if (!file) return;
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    update('logo', url);
  };

  const onPickSignature = (file: File | null) => {
    if (!file) return;
    setSignatureFile(file);
    const url = URL.createObjectURL(file);
    setSignaturePreview(url);
    update('signature', url);
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    update('logo', '');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const clearSignature = () => {
    setSignatureFile(null);
    setSignaturePreview('');
    update('signature', '');
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const form = new FormData();
      form.append('companyName', settings.companyName.trim());
      form.append('companyAddress', settings.companyAddress.trim());
      form.append('showLogo', String(settings.showLogo));
      form.append('showSignature', String(settings.showSignature));
      form.append('showCompanyName', String(settings.showCompanyName));
      form.append('showAddress', String(settings.showAddress));
      form.append('showPageNumbers', String(settings.showPageNumbers));
      form.append('layout', settings.layout);
      form.append('logoPosition', settings.logoPosition);
      form.append('headerSubtitle', settings.headerSubtitle.trim());
      form.append(
        'footerText',
        settings.footerText.trim() || DEFAULT_PDF_REPORT_SETTINGS.footerText
      );
      form.append('accentColor', settings.accentColor);
      form.append(
        'signatureLabel',
        settings.signatureLabel.trim() ||
          DEFAULT_PDF_REPORT_SETTINGS.signatureLabel
      );

      // Keep existing remote URLs when no new file picked
      if (!logoFile && settings.logo && settings.logo.startsWith('http')) {
        form.append('logo', settings.logo);
      }
      if (
        !signatureFile &&
        settings.signature &&
        settings.signature.startsWith('http')
      ) {
        form.append('signature', settings.signature);
      }
      if (logoFile) form.append('logo', logoFile);
      if (signatureFile) form.append('signature', signatureFile);

      // Always persist locally first (Flutter also does this on failure)
      const localPayload = {
        ...settings,
        companyName: settings.companyName.trim(),
        companyAddress: settings.companyAddress.trim(),
        footerText:
          settings.footerText.trim() || DEFAULT_PDF_REPORT_SETTINGS.footerText,
        signatureLabel:
          settings.signatureLabel.trim() ||
          DEFAULT_PDF_REPORT_SETTINGS.signatureLabel,
      };
      savePdfReportSettingsLocal(localPayload);

      const response = await fetch('/api/pdf-report-settings', {
        method: 'PUT',
        body: form,
      });
      const result = await response.json();

      if (result.success && result.data) {
        const normalized = normalizePdfReportSettings(result.data);
        setSettings(normalized);
        setLogoPreview(normalized.logo || '');
        setSignaturePreview(normalized.signature || '');
        setLogoFile(null);
        setSignatureFile(null);
        savePdfReportSettingsLocal(normalized);
        toast.success('PDF report settings saved');
      } else {
        toast.error(
          result.message || 'Saved locally; server sync failed'
        );
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Could not sync settings');
    } finally {
      setSaving(false);
    }
  };

  const previewJustify = useMemo(() => {
    if (settings.logoPosition === 'center') return 'justify-center';
    if (settings.logoPosition === 'right') return 'justify-end';
    return 'justify-start';
  }, [settings.logoPosition]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="w-8 h-8 animate-spin text-[#1088dd]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-[#1088dd] text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Report Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure logo, signature, layout & branding for all PDF reports
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left column */}
        <div className="xl:col-span-3 space-y-4">
          <SectionCard
            title="Company branding"
            subtitle="Used on PDF headers — separate from company profile"
            icon={Building2}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company name">
                <input
                  value={settings.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  className="input"
                  placeholder="Your company name"
                />
              </Field>
              <Field label="Header subtitle">
                <input
                  value={settings.headerSubtitle}
                  onChange={(e) => update('headerSubtitle', e.target.value)}
                  className="input"
                  placeholder="Optional subtitle"
                />
              </Field>
            </div>
            <Field label="Company address">
              <textarea
                value={settings.companyAddress}
                onChange={(e) => update('companyAddress', e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="Address shown on reports"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UploadBox
                label="Logo"
                preview={logoPreview}
                inputRef={logoInputRef}
                onPick={onPickLogo}
                onClear={clearLogo}
                icon={ImageIcon}
              />
              <UploadBox
                label="Signature"
                preview={signaturePreview}
                inputRef={signatureInputRef}
                onPick={onPickSignature}
                onClear={clearSignature}
                icon={PenLine}
              />
            </div>
          </SectionCard>

          <SectionCard title="Layout" subtitle="PDF structure" icon={LayoutTemplate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Template">
                <div className="flex flex-wrap gap-2">
                  {LAYOUTS.map((l) => (
                    <Chip
                      key={l.value}
                      active={settings.layout === l.value}
                      onClick={() => update('layout', l.value)}
                      label={l.label}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Logo position">
                <div className="flex flex-wrap gap-2">
                  {LOGO_POSITIONS.map((p) => (
                    <Chip
                      key={p.value}
                      active={settings.logoPosition === p.value}
                      onClick={() => update('logoPosition', p.value)}
                      label={p.label}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Content text" icon={FileText}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Footer text">
                <input
                  value={settings.footerText}
                  onChange={(e) => update('footerText', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Signature label">
                <input
                  value={settings.signatureLabel}
                  onChange={(e) => update('signatureLabel', e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Display options" icon={ToggleLeft}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                label="Show logo"
                checked={settings.showLogo}
                onChange={(v) => update('showLogo', v)}
              />
              <Toggle
                label="Show signature"
                checked={settings.showSignature}
                onChange={(v) => update('showSignature', v)}
              />
              <Toggle
                label="Show company name"
                checked={settings.showCompanyName}
                onChange={(v) => update('showCompanyName', v)}
              />
              <Toggle
                label="Show address"
                checked={settings.showAddress}
                onChange={(v) => update('showAddress', v)}
              />
              <Toggle
                label="Show page numbers"
                checked={settings.showPageNumbers}
                onChange={(v) => update('showPageNumbers', v)}
              />
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="xl:col-span-2 space-y-4">
          <SectionCard title="Live preview" subtitle={`${settings.layout} layout`} icon={FileText}>
            <div
              className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"
              style={{ borderTop: `4px solid ${settings.accentColor}` }}
            >
              <div className={`p-4 flex ${previewJustify} items-center gap-3 border-b border-gray-100`}>
                {settings.showLogo && logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo" className="h-10 object-contain max-w-[120px]" />
                ) : settings.showLogo ? (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: settings.accentColor }}
                  >
                    LOGO
                  </div>
                ) : null}
                <div className={settings.logoPosition === 'center' ? 'text-center' : ''}>
                  {settings.showCompanyName && (
                    <p className="text-sm font-bold text-gray-900">
                      {settings.companyName || 'Company Name'}
                    </p>
                  )}
                  {settings.headerSubtitle && (
                    <p className="text-[11px] text-gray-500">{settings.headerSubtitle}</p>
                  )}
                  {settings.showAddress && settings.companyAddress && (
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                      {settings.companyAddress}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-8 rounded bg-gray-50 border border-gray-100" />
                  <div className="h-8 rounded bg-gray-50 border border-gray-100" />
                  <div className="h-8 rounded bg-gray-50 border border-gray-100" />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 flex items-end justify-between gap-3">
                <p className="text-[10px] text-gray-400 flex-1">{settings.footerText}</p>
                {settings.showSignature && (
                  <div className="text-right">
                    {signaturePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="h-8 object-contain ml-auto mb-1 max-w-[100px]"
                      />
                    ) : (
                      <div className="h-8 w-24 border-b border-gray-300 mb-1 ml-auto" />
                    )}
                    <p className="text-[10px] text-gray-500">{settings.signatureLabel}</p>
                  </div>
                )}
              </div>
              {settings.showPageNumbers && (
                <div className="text-center text-[10px] text-gray-400 pb-2">Page 1</div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Accent color" icon={Palette}>
            <div className="flex flex-wrap gap-2 mb-3">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update('accentColor', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    settings.accentColor === c
                      ? 'border-gray-800 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <Field label="Custom hex">
              <input
                value={settings.accentColor}
                onChange={(e) => update('accentColor', e.target.value)}
                className="input font-mono"
                placeholder="#014582"
              />
            </Field>
          </SectionCard>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-64 right-0 z-20 bg-white border-t border-gray-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-xs text-gray-500 flex-1">
          {syncedFromPrefs
            ? 'PDF branding is stored separately from company profile (local + server)'
            : 'Set branding for PDF exports'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1088dd] text-white text-sm font-semibold hover:bg-[#0d6fad] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          background: #f9fafb;
        }
        .input:focus {
          background: #fff;
          border-color: #1088dd;
          box-shadow: 0 0 0 2px rgba(16, 136, 221, 0.15);
        }
      `}</style>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-50 text-[#1088dd]">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-[#1088dd] text-white shadow-sm'
          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-left"
    >
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <span
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#1088dd]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  );
}

function UploadBox({
  label,
  preview,
  inputRef,
  onPick,
  onClear,
  icon: Icon,
}: {
  label: string;
  preview: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File | null) => void;
  onClear: () => void;
  icon: typeof ImageIcon;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        {preview && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-500 inline-flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-20 object-contain mx-auto mb-2" />
      ) : (
        <div className="h-20 flex flex-col items-center justify-center text-gray-400 mb-2">
          <Icon className="w-6 h-6 mb-1" />
          <span className="text-[11px]">No image</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <Upload className="w-4 h-4" /> Upload
      </button>
    </div>
  );
}
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
