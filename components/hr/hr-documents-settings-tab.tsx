'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  PenTool,
  Sliders,
  Sparkles,
  RefreshCw,
  Copy,
  Eye,
  Loader2,
  AlertCircle,
  Hash,
  Award,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  hrPrintService,
  HRPrintSettingItem,
  HRSignatoryItem,
  HRDocumentTemplateItem
} from '@/lib/hr-print-service';
import { HRDocumentRenderer } from './hr-document-renderer';

export const HRDocumentsSettingsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'branding' | 'signatures' | 'setup' | 'templates' | 'numbering'>('branding');
  const [settings, setSettings] = useState<HRPrintSettingItem | null>(null);
  const [templates, setTemplates] = useState<HRDocumentTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // File upload refs for branding
  const primaryLogoRef = useRef<HTMLInputElement>(null);
  const secondaryLogoRef = useRef<HTMLInputElement>(null);
  const officialStampRef = useRef<HTMLInputElement>(null);

  // Signatory modal state
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigLabel, setSigLabel] = useState('Authorized Signatory');
  const [sigName, setSigName] = useState('');
  const [sigDesignation, setSigDesignation] = useState('');
  const [sigAlignment, setSigAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);

  // Template editor state
  const [selectedTemplate, setSelectedTemplate] = useState<HRDocumentTemplateItem | null>(null);
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('AppointmentLetter');

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const [settingData, templateData] = await Promise.all([
        hrPrintService.getSettings(),
        hrPrintService.listTemplates()
      ]);
      setSettings(settingData);
      setTemplates(templateData);

      if (templateData.length > 0) {
        const defaultTpl = templateData[0];
        setSelectedTemplate(defaultTpl);
        setTemplateName(defaultTpl.name);
        setTemplateType(defaultTpl.templateType);
        setTemplateContent(defaultTpl.contentBody || '');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed loading HR print settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (overrides?: Partial<HRPrintSettingItem>) => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await hrPrintService.updateSettings({
        ...settings,
        ...overrides
      });
      setSettings(updated);
      toast.success('HR document & print settings updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBrandingUpload = async (file: File, assetKey: 'primaryLogo' | 'secondaryLogo' | 'officialStamp') => {
    const formData = new FormData();
    formData.append(assetKey, file);
    setSaving(true);
    try {
      const updated = await hrPrintService.uploadBrandingAssets(formData);
      setSettings(updated);
      toast.success(`Uploaded HR ${assetKey}`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBranding = async (assetKey: 'primaryLogo' | 'secondaryLogo' | 'officialStamp') => {
    if (!window.confirm(`Remove ${assetKey}?`)) return;
    setSaving(true);
    try {
      const updated = await hrPrintService.removeBrandingAsset(assetKey);
      setSettings(updated);
      toast.success(`Removed ${assetKey}`);
    } catch (err: any) {
      toast.error(err.message || 'Removal failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSignatory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigLabel.trim()) {
      toast.error('Signatory label is required');
      return;
    }

    const formData = new FormData();
    formData.append('label', sigLabel);
    formData.append('name', sigName);
    formData.append('designation', sigDesignation);
    formData.append('alignment', sigAlignment);
    if (sigFile) formData.append('signature', sigFile);
    if (stampFile) formData.append('stamp', stampFile);

    setSaving(true);
    try {
      await hrPrintService.createSignatory(formData);
      toast.success('Signatory added to library');
      setShowSigModal(false);
      setSigLabel('Authorized Signatory');
      setSigName('');
      setSigDesignation('');
      setSigFile(null);
      setStampFile(null);
      await loadAllSettings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add signatory');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignatory = async (id: string, label: string) => {
    if (!window.confirm(`Delete signatory "${label}"?`)) return;
    try {
      await hrPrintService.deleteSignatory(id);
      toast.success('Signatory deleted');
      await loadAllSettings();
    } catch (err: any) {
      toast.error(err.message || 'Failed deleting signatory');
    }
  };

  const handleSaveTemplateDraft = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const updated = await hrPrintService.updateTemplate(selectedTemplate.id, {
        name: templateName,
        contentBody: templateContent
      });
      setSelectedTemplate(updated);
      toast.success('Template draft saved');
      await loadAllSettings();
    } catch (err: any) {
      toast.error(err.message || 'Save draft failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishTemplateVersion = async () => {
    if (!selectedTemplate) return;
    const summary = window.prompt('Enter version change notes:', `Updated ${selectedTemplate.name}`);
    if (summary === null) return;

    setSaving(true);
    try {
      const updated = await hrPrintService.publishTemplate(selectedTemplate.id, summary);
      setSelectedTemplate(updated);
      toast.success(`Published version ${updated.version} of ${updated.name}`);
      await loadAllSettings();
    } catch (err: any) {
      toast.error(err.message || 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    try {
      const dup = await hrPrintService.duplicateTemplate(id);
      toast.success(`Duplicated template: ${dup.name}`);
      await loadAllSettings();
    } catch (err: any) {
      toast.error(err.message || 'Duplicate failed');
    }
  };

  const insertPlaceholder = (ph: string) => {
    setTemplateContent((prev) => `${prev} ${ph}`);
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#014582] mb-2" />
        <p className="text-xs font-semibold">Loading HR Document & Print Engine Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px bg-slate-50 p-1.5 rounded-2xl">
        {[
          { id: 'branding', label: '1. Branding & Identity', icon: ImageIcon },
          { id: 'signatures', label: '2. Dynamic Signature Library', icon: PenTool },
          { id: 'setup', label: '3. Page Setup & Payslips', icon: Sliders },
          { id: 'templates', label: '4. Document Templates', icon: FileText },
          { id: 'numbering', label: '5. Document Numbering', icon: Hash }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                isActive
                  ? 'bg-white text-[#014582] shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 text-indigo-600" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. BRANDING & IDENTITY */}
      {subTab === 'branding' && (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
            <p className="font-bold">⭐ HR-Only Branding Isolation</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              These logos and address settings are consumed exclusively by HR reports, payslips, and employee letters. Sales invoices and non-HR documents are completely separate and will not be affected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Logo */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-slate-900">HR Primary Logo</h4>
              <input
                ref={primaryLogoRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleBrandingUpload(e.target.files[0], 'primaryLogo')}
              />
              <div className="h-28 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                {settings.primaryLogo ? (
                  <img src={settings.primaryLogo} alt="Primary Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No primary logo uploaded</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => primaryLogoRef.current?.click()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{settings.primaryLogo ? 'Replace Logo' : 'Upload Logo'}</span>
                </button>
                {settings.primaryLogo && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBranding('primaryLogo')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Secondary Logo */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-slate-900">HR Secondary Logo</h4>
              <input
                ref={secondaryLogoRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleBrandingUpload(e.target.files[0], 'secondaryLogo')}
              />
              <div className="h-28 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                {settings.secondaryLogo ? (
                  <img src={settings.secondaryLogo} alt="Secondary Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No secondary logo uploaded</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => secondaryLogoRef.current?.click()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{settings.secondaryLogo ? 'Replace Logo' : 'Upload Logo'}</span>
                </button>
                {settings.secondaryLogo && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBranding('secondaryLogo')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Official Stamp / Seal */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-slate-900">HR Official Stamp / Seal</h4>
              <input
                ref={officialStampRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleBrandingUpload(e.target.files[0], 'officialStamp')}
              />
              <div className="h-28 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                {settings.officialStamp ? (
                  <img src={settings.officialStamp} alt="Official Stamp" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No official stamp uploaded</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => officialStampRef.current?.click()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{settings.officialStamp ? 'Replace Stamp' : 'Upload Stamp'}</span>
                </button>
                {settings.officialStamp && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBranding('officialStamp')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* HR Header Info */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">HR Company Header Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Display Name</label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Email</label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Contact Phone</label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={settings.companyWebsite || ''}
                  onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration / Tax ID</label>
                <input
                  type="text"
                  value={settings.registrationNo || ''}
                  onChange={(e) => setSettings({ ...settings, registrationNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Header Subtitle</label>
                <input
                  type="text"
                  value={settings.headerSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, headerSubtitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HR Physical Address</label>
              <textarea
                rows={2}
                value={settings.companyAddress || ''}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Branding Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC SIGNATURE LIBRARY */}
      {subTab === 'signatures' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 border border-slate-200 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-900 text-base">HR Signature Library</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add unlimited signatory blocks (Prepared By, Reviewed By, HR Manager, Finance Director, Employee Acknowledgement, etc.)
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSigModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Signature Block</span>
            </button>
          </div>

          {/* Signatories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(settings.signatories || []).map((sig) => (
              <div key={sig.id} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {sig.label}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{sig.name || 'Name Unspecified'}</h4>
                    <p className="text-xs text-slate-500">{sig.designation || 'No Designation'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSignatory(sig.id, sig.label)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete signatory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-2">
                  {sig.signatureUrl ? (
                    <img src={sig.signatureUrl} alt={sig.label} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No signature image uploaded</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>Alignment: <strong className="capitalize">{sig.alignment}</strong></span>
                  <span>Order #: <strong>{sig.displayOrder}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PAGE SETUP & PAYSLIPS */}
      {subTab === 'setup' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">HR Print Layout & Payslip Rules</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paper Size</label>
              <select
                value={settings.paperSize || 'A4'}
                onChange={(e) => setSettings({ ...settings, paperSize: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="Letter">US Letter (8.5 x 11 in)</option>
                <option value="Legal">US Legal (8.5 x 14 in)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation</label>
              <select
                value={settings.orientation || 'portrait'}
                onChange={(e) => setSettings({ ...settings, orientation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HR Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.primaryColor || '#014582'}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={settings.primaryColor || '#014582'}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Font Family</label>
              <select
                value={settings.fontFamily || 'Inter'}
                onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white"
              >
                <option value="Inter">Inter (Enterprise Sans)</option>
                <option value="Roboto">Roboto</option>
                <option value="Outfit">Outfit (Modern)</option>
                <option value="Times New Roman">Times New Roman (Serif)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Top Margin (mm)</label>
              <input
                type="number"
                value={settings.marginTop ?? 15}
                onChange={(e) => setSettings({ ...settings, marginTop: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bottom Margin (mm)</label>
              <input
                type="number"
                value={settings.marginBottom ?? 15}
                onChange={(e) => setSettings({ ...settings, marginBottom: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Left Margin (mm)</label>
              <input
                type="number"
                value={settings.marginLeft ?? 15}
                onChange={(e) => setSettings({ ...settings, marginLeft: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Right Margin (mm)</label>
              <input
                type="number"
                value={settings.marginRight ?? 15}
                onChange={(e) => setSettings({ ...settings, marginRight: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Payslip Specific Display Controls</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payslip Document Header Title</label>
                <input
                  type="text"
                  value={settings.payslipTitle || 'PAYSLIP STATEMENT'}
                  onChange={(e) => setSettings({ ...settings, payslipTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none font-bold"
                />
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showEarningsBreakdown ?? true}
                    onChange={(e) => setSettings({ ...settings, showEarningsBreakdown: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Show Detailed Earnings Breakdown (Basic, House, Medical, Allowances)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showDeductionsBreakdown ?? true}
                    onChange={(e) => setSettings({ ...settings, showDeductionsBreakdown: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Show Deductions Breakdown (Tax, EOBI, PF, Late Cuts, Loans)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={settings.showAttendanceSummary ?? true}
                    onChange={(e) => setSettings({ ...settings, showAttendanceSummary: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Include Monthly Attendance Summary (Work Days, Present, Absents, Overtime)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Footer Notes on Payslip</label>
              <textarea
                rows={2}
                value={settings.payslipNotes || ''}
                onChange={(e) => setSettings({ ...settings, payslipNotes: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Setup & Payslip Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. DOCUMENT & LETTER TEMPLATES BUILDER */}
      {subTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template Selector & List (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Letter & Doc Templates</h3>
            </div>

            <div className="space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setTemplateName(tpl.name);
                    setTemplateType(tpl.templateType);
                    setTemplateContent(tpl.contentBody || '');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{tpl.name}</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-slate-100 text-slate-600">
                      v{tpl.version}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{tpl.description || tpl.templateType}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editor & Preview Pane (8 cols) */}
          <div className="lg:col-span-8 p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            {selectedTemplate ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedTemplate.name}</h3>
                    <p className="text-xs text-slate-500">
                      Type: {selectedTemplate.templateType} • Active Version: v{selectedTemplate.version}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTemplate(selectedTemplate.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTemplateDraft}
                      disabled={saving}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishTemplateVersion}
                      disabled={saving}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publish New Version</span>
                    </button>
                  </div>
                </div>

                {/* Variable Placeholder Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Insert Controlled Employee Placeholders
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: '{{employee.name}}', label: 'Full Name' },
                      { key: '{{employee.code}}', label: 'Emp Code' },
                      { key: '{{employee.designation}}', label: 'Designation' },
                      { key: '{{employee.department}}', label: 'Department' },
                      { key: '{{employee.joiningDate}}', label: 'Joining Date' },
                      { key: '{{employee.salary}}', label: 'Salary (PKR)' }
                    ].map((ph) => (
                      <button
                        key={ph.key}
                        type="button"
                        onClick={() => insertPlaceholder(ph.key)}
                        className="px-2 py-1 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                      >
                        + {ph.label} ({ph.key})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Textarea */}
                <div>
                  <textarea
                    rows={12}
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="w-full p-4 font-mono text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400">Select a template to view or edit</div>
            )}
          </div>
        </div>
      )}

      {/* 5. DOCUMENT NUMBERING */}
      {subTab === 'numbering' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">HR Document Numbering & Sequence Rules</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-indigo-900 uppercase">Appointment Letters Numbering</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={settings.appointmentPrefix || 'APT-'}
                    onChange={(e) => setSettings({ ...settings, appointmentPrefix: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Next Sequence #</label>
                  <input
                    type="number"
                    value={settings.appointmentSeq || 1001}
                    onChange={(e) => setSettings({ ...settings, appointmentSeq: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Next Document # format: <strong>{settings.appointmentPrefix || 'APT-'}2026-01001</strong></p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-indigo-900 uppercase">Salary Certificates Numbering</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={settings.salaryCertPrefix || 'SAL-'}
                    onChange={(e) => setSettings({ ...settings, salaryCertPrefix: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Next Sequence #</label>
                  <input
                    type="number"
                    value={settings.salaryCertSeq || 1001}
                    onChange={(e) => setSettings({ ...settings, salaryCertSeq: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Next Document # format: <strong>{settings.salaryCertPrefix || 'SAL-'}2026-01001</strong></p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Numbering Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Add Signatory */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add HR Signatory</h3>
              <button onClick={() => setShowSigModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSignatory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Role / Label *</label>
                <input
                  type="text"
                  value={sigLabel}
                  onChange={(e) => setSigLabel(e.target.value)}
                  placeholder="e.g. Prepared By / HR Manager / Director"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Name</label>
                <input
                  type="text"
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Designation</label>
                <input
                  type="text"
                  value={sigDesignation}
                  onChange={(e) => setSigDesignation(e.target.value)}
                  placeholder="e.g. Head of Human Resources"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alignment</label>
                <select
                  value={sigAlignment}
                  onChange={(e) => setSigAlignment(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white"
                >
                  <option value="left">Left Aligned</option>
                  <option value="center">Center Aligned</option>
                  <option value="right">Right Aligned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Signature Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSigFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Stamp File (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setStampFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSigModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {saving ? 'Saving...' : 'Add Signatory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
