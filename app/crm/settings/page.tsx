'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings, Plus, Trash2, Edit2, GripVertical, Check, Eye, EyeOff,
  Palette, Tag, Layers, RefreshCw, X, AlertCircle, Save, Sliders,
} from 'lucide-react';
import {
  getCustomFields, createCustomField, updateCustomField, deleteCustomField,
  reorderCustomFields, getLeadSources, createLeadSource, initDefaultSources,
  getCrmSettings, updateCrmSettings, seedErpnextMasters,
  FIELD_TYPES, type LeadCustomField, type LeadSource, type CrmErpSettings,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

function CRMSettingsPage() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'fields' | 'sources' | 'erpnext'>(
    initTab === 'sources' ? 'sources' : initTab === 'erpnext' ? 'erpnext' : 'fields',
  );
  const [fields, setFields] = useState<LeadCustomField[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);

  // Field Modal State
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<LeadCustomField | null>(null);
  const [fieldForm, setFieldForm] = useState<{
    fieldName: string;
    fieldKey: string;
    fieldType: string;
    description: string;
    defaultValue: string;
    placeholder: string;
    isRequired: boolean;
    options: string;
  }>({
    fieldName: '',
    fieldKey: '',
    fieldType: 'text',
    description: '',
    defaultValue: '',
    placeholder: '',
    isRequired: false,
    options: '',
  });

  // Source Modal State
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceColor, setSourceColor] = useState('#10b981');
  const [erpSettings, setErpSettings] = useState<CrmErpSettings | null>(null);
  const [erpSaving, setErpSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fieldList, sourceList] = await Promise.all([
        getCustomFields().catch(() => []),
        getLeadSources().catch(() => []),
      ]);
      setFields(Array.isArray(fieldList) ? fieldList : []);
      setSources(Array.isArray(sourceList) ? sourceList : []);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadErpSettings = useCallback(async () => {
    try {
      const s = await getCrmSettings();
      setErpSettings(s && typeof s === 'object' ? s : null);
    } catch {
      toast.error('Failed to load CRM preferences');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'erpnext') loadErpSettings();
  }, [activeTab, loadErpSettings]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'sources' || tab === 'erpnext' || tab === 'fields') setActiveTab(tab);
  }, [searchParams]);

  const handleSaveErpSettings = async () => {
    if (!erpSettings) return;
    setErpSaving(true);
    try {
      const updated = await updateCrmSettings({
        allowLeadDuplicationBasedOnEmail: erpSettings.allowLeadDuplicationBasedOnEmail,
        autoCreationOfContact: erpSettings.autoCreationOfContact,
        closeOpportunityAfterDays: erpSettings.closeOpportunityAfterDays,
        defaultQuotationValidTillDays: erpSettings.defaultQuotationValidTillDays,
        carryForwardCommunication: erpSettings.carryForwardCommunication,
      });
      setErpSettings(updated);
      toast.success('CRM preferences saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setErpSaving(false);
    }
  };

  const handleOpenNewField = () => {
    setEditingField(null);
    setFieldForm({
      fieldName: '',
      fieldKey: '',
      fieldType: 'text',
      description: '',
      defaultValue: '',
      placeholder: '',
      isRequired: false,
      options: '',
    });
    setShowFieldModal(true);
  };

  const handleOpenEditField = (f: LeadCustomField) => {
    setEditingField(f);
    setFieldForm({
      fieldName: f.fieldName,
      fieldKey: f.fieldKey,
      fieldType: f.fieldType,
      description: f.description || '',
      defaultValue: f.defaultValue || '',
      placeholder: f.placeholder || '',
      isRequired: f.isRequired,
      options: Array.isArray(f.options) ? f.options.map(o => typeof o === 'object' ? o.label : o).join(', ') : '',
    });
    setShowFieldModal(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.fieldName.trim()) {
      toast.error('Field name is required');
      return;
    }

    const optionsArray = fieldForm.options
      ? fieldForm.options.split(',').map(o => o.trim()).filter(Boolean).map(o => ({ label: o, value: o }))
      : [];

    try {
      if (editingField) {
        await updateCustomField(editingField.id, {
          fieldName: fieldForm.fieldName,
          description: fieldForm.description,
          defaultValue: fieldForm.defaultValue,
          placeholder: fieldForm.placeholder,
          isRequired: fieldForm.isRequired,
          options: optionsArray,
        });
        toast.success('Field updated!');
      } else {
        const key = fieldForm.fieldKey.trim() || fieldForm.fieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        await createCustomField({
          fieldKey: key,
          fieldName: fieldForm.fieldName,
          fieldType: fieldForm.fieldType,
          description: fieldForm.description,
          defaultValue: fieldForm.defaultValue,
          placeholder: fieldForm.placeholder,
          isRequired: fieldForm.isRequired,
          options: optionsArray,
        });
        toast.success('Custom field created!');
      }
      setShowFieldModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleToggleVisibility = async (f: LeadCustomField) => {
    try {
      await updateCustomField(f.id, { isVisible: !f.isVisible });
      setFields(prev => prev.map(item => item.id === f.id ? { ...item, isVisible: !item.isVisible } : item));
      toast.success(f.isVisible ? 'Column hidden' : 'Column visible');
    } catch {
      toast.error('Failed to change visibility');
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field? Existing values will not be lost from raw records.')) return;
    try {
      await deleteCustomField(id);
      toast.success('Field deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;
    try {
      await createLeadSource({ name: sourceName.trim(), color: sourceColor });
      toast.success('Source added');
      setSourceName('');
      setShowSourceModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create source');
    }
  };

  const handleInitDefaults = async () => {
    try {
      await initDefaultSources();
      toast.success('Default sources initialized');
      loadData();
    } catch {
      toast.error('Failed to initialize');
    }
  };

  const [seedingMasters, setSeedingMasters] = useState(false);
  const handleSeedMasters = async () => {
    setSeedingMasters(true);
    try {
      const res = await seedErpnextMasters();
      toast.success(res?.message || 'CRM masters seeded (territories, groups, stages, sources, competitors…)');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to seed masters');
    } finally {
      setSeedingMasters(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM Settings & Configuration</h1>
        <p className="text-gray-500 text-sm">
          Customize dynamic fields, column schemas, pipeline statuses, and lead sources without database migrations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('fields')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'fields'
              ? 'border-[#014582] text-[#014582]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" /> Custom Fields ({fields.length})
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'border-[#014582] text-[#014582]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag className="w-4 h-4" /> Lead Sources ({sources.length})
        </button>
        <button
          onClick={() => setActiveTab('erpnext')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'erpnext'
              ? 'border-[#014582] text-[#014582]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sliders className="w-4 h-4" /> CRM Preferences
        </button>
      </div>

      {activeTab === 'erpnext' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-800">Seed CRM Masters</h2>
                <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
                  Load default territories, customer groups, market segments, sales stages, opportunity types,
                  lost reasons, lead sources, and competitors. Safe to re-run — existing names are upserted.
                </p>
              </div>
              <button
                type="button"
                disabled={seedingMasters}
                onClick={handleSeedMasters}
                className="flex items-center gap-2 px-4 py-2 border border-[#014582]/30 text-[#014582] bg-[#014582]/5 hover:bg-[#014582]/10 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seedingMasters ? 'animate-spin' : ''}`} />
                {seedingMasters ? 'Seeding…' : 'Seed Masters'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-800">CRM Preferences</h2>
            {!erpSettings ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <>
                {[
                  { key: 'allowLeadDuplicationBasedOnEmail' as const, label: 'Allow Lead Duplication Based on Email' },
                  { key: 'autoCreationOfContact' as const, label: 'Auto Creation of Contact' },
                  { key: 'carryForwardCommunication' as const, label: 'Carry Forward Communication' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={!!erpSettings[key]}
                      onChange={(e) => setErpSettings((s) => (s ? { ...s, [key]: e.target.checked } : s))}
                      className="w-4 h-4 accent-[#014582]"
                    />
                  </label>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Close Opportunity After (days)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      value={erpSettings.closeOpportunityAfterDays ?? ''}
                      onChange={(e) => setErpSettings((s) => s ? { ...s, closeOpportunityAfterDays: e.target.value ? parseInt(e.target.value, 10) : null } : s)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Default Quotation Valid Till (days)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      value={erpSettings.defaultQuotationValidTillDays ?? ''}
                      onChange={(e) => setErpSettings((s) => s ? { ...s, defaultQuotationValidTillDays: e.target.value ? parseInt(e.target.value, 10) : null } : s)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={erpSaving}
                  onClick={handleSaveErpSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {erpSaving ? 'Saving…' : 'Save Settings'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: Dynamic Custom Fields */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Dynamic Columns & Metadata</h2>
              <p className="text-xs text-gray-400">
                These fields appear on CRM boards, lead forms, and import mapping.
              </p>
            </div>
            <button
              onClick={handleOpenNewField}
              className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-xl text-xs font-bold hover:bg-[#01366a] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Custom Field
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="divide-y divide-gray-100">
              {fields.map(f => (
                <div key={f.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{f.fieldName}</span>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {f.fieldKey}
                        </span>
                        <span className="text-[11px] font-semibold bg-blue-50 text-[#014582] px-2 py-0.5 rounded-full">
                          {f.fieldType}
                        </span>
                        {f.isRequired && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      {f.description && <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>}
                      {Array.isArray(f.options) && f.options.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Options: {f.options.map(o => typeof o === 'object' ? o.label : o).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(f)}
                      className={`p-2 rounded-lg text-xs font-medium border ${
                        f.isVisible ? 'text-gray-600 border-gray-200 hover:bg-gray-50' : 'text-gray-400 bg-gray-50 border-gray-200'
                      }`}
                      title={f.isVisible ? 'Hide Column' : 'Show Column'}
                    >
                      {f.isVisible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => handleOpenEditField(f)}
                      className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                      title="Edit Field"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!f.isSystem && (
                      <button
                        onClick={() => handleDeleteField(f.id)}
                        className="p-2 border border-gray-200 rounded-lg text-red-500 hover:bg-red-50"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-sm">No custom fields created yet.</p>
                  <p className="text-xs mt-1">Click &ldquo;Add Custom Field&rdquo; to build your dynamic CRM columns.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Lead Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Dynamic Lead Sources</h2>
              <p className="text-xs text-gray-400">Manage origin channels for your lead acquisition.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInitDefaults}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Reset Defaults
              </button>
              <button
                onClick={() => setShowSourceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-xl text-xs font-bold hover:bg-[#01366a] shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Source
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sources.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color || '#10b981' }}
                  />
                  <span className="font-bold text-sm text-gray-800">{s.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingField ? 'Edit Custom Field' : 'Create Dynamic Custom Field'}
              </h3>
              <button onClick={() => setShowFieldModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Field Label *</label>
                  <input
                    type="text"
                    required
                    value={fieldForm.fieldName}
                    onChange={e => {
                      const name = e.target.value;
                      setFieldForm(p => ({
                        ...p,
                        fieldName: name,
                        fieldKey: editingField ? p.fieldKey : name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                      }));
                    }}
                    placeholder="e.g. Annual Revenue"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Database Key</label>
                  <input
                    type="text"
                    disabled={!!editingField}
                    value={fieldForm.fieldKey}
                    onChange={e => setFieldForm(p => ({ ...p, fieldKey: e.target.value }))}
                    placeholder="annual_revenue"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm font-mono focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Field Type</label>
                <select
                  disabled={!!editingField}
                  value={fieldForm.fieldType}
                  onChange={e => setFieldForm(p => ({ ...p, fieldType: e.target.value }))}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none disabled:bg-gray-50"
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {['select', 'multiselect'].includes(fieldForm.fieldType) && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={fieldForm.options}
                    onChange={e => setFieldForm(p => ({ ...p, options: e.target.value }))}
                    placeholder="Small, Medium, Enterprise"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Description / Tooltip</label>
                <input
                  type="text"
                  value={fieldForm.description}
                  onChange={e => setFieldForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional explanatory note for agents"
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Default Value</label>
                  <input
                    type="text"
                    value={fieldForm.defaultValue}
                    onChange={e => setFieldForm(p => ({ ...p, defaultValue: e.target.value }))}
                    placeholder="Optional default"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={fieldForm.placeholder}
                    onChange={e => setFieldForm(p => ({ ...p, placeholder: e.target.value }))}
                    placeholder="Hint text"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={fieldForm.isRequired}
                  onChange={e => setFieldForm(p => ({ ...p, isRequired: e.target.checked }))}
                  className="rounded text-[#014582]"
                />
                <label htmlFor="isRequired" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Mark this field as required
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#014582] text-white rounded-xl text-sm font-bold hover:bg-[#01366a]"
                >
                  Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Lead Source</h3>
              <button onClick={() => setShowSourceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  placeholder="e.g. TikTok Ads, Trade Show 2026"
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Badge Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sourceColor}
                    onChange={e => setSourceColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border"
                  />
                  <span className="text-xs font-mono text-gray-500">{sourceColor}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSourceModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#014582] text-white rounded-xl text-sm font-bold hover:bg-[#01366a]"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CRMSettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-center py-12">Loading settings…</div>}>
      <CRMSettingsPage />
    </Suspense>
  );
}
