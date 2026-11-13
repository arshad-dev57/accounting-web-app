'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight,
  RefreshCw, Plus, Check, X, Info, Download, Save, Layers,
} from 'lucide-react';
import {
  previewImportFile, importFromFile, getImportJobs, getMappingTemplates,
  saveMappingTemplate, createCustomField,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

export default function LeadImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow State: 1 = Upload, 2 = Mapping & Preview, 3 = Complete
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Parsed Data from Backend
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<'SKIP' | 'UPDATE' | 'IMPORT_ANYWAY'>('SKIP');

  // Templates
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);

  // Result
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    getMappingTemplates().then(setTemplates).catch(() => {});
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Only .xlsx, .xls, and .csv files are supported');
      return;
    }

    setFile(selected);
    setLoading(true);

    try {
      const res = await previewImportFile(selected);
      if (!res.success) throw new Error(res.message);

      setHeaders(res.data.headers || []);
      setPreview(res.data.preview || []);
      setTotalRows(res.data.totalRows || 0);
      setAvailableFields(res.data.availableFields || []);
      setMapping(res.data.autoMapping || {});
      setStep(2);
      toast.success(`Detected ${res.data.headers.length} columns & ${res.data.totalRows} rows`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDynamicField = async (headerName: string) => {
    const fieldKey = headerName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    try {
      await createCustomField({
        fieldKey,
        fieldName: headerName,
        fieldType: 'text',
        isVisible: true,
      });
      setMapping(prev => ({ ...prev, [headerName]: fieldKey }));
      setAvailableFields(prev => [...prev, { fieldKey, fieldName: headerName, fieldType: 'text' }]);
      toast.success(`Created CRM custom field "${headerName}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create field');
    }
  };

  const handleApplyTemplate = (tmpl: any) => {
    if (tmpl?.mapping) {
      setMapping(tmpl.mapping);
      toast.success(`Applied template "${tmpl.templateName}"`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Enter a name for the template');
      return;
    }
    try {
      await saveMappingTemplate({ templateName, mapping });
      toast.success('Mapping template saved!');
      setTemplateName('');
      getMappingTemplates().then(setTemplates);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;

    // Validate if at least Name or Email or Phone is mapped
    const mappedValues = Object.values(mapping);
    const hasIdentifier = mappedValues.some(v => ['fullName', 'firstName', 'phone', 'email', 'companyName'].includes(v));
    if (!hasIdentifier) {
      toast.error('Please map at least one contact identifier (Full Name, Phone, or Email)');
      return;
    }

    setLoading(true);
    try {
      const res = await importFromFile(file, mapping, duplicateAction);
      if (!res.success) throw new Error(res.message);

      setImportResult(res.data);
      setStep(3);
      toast.success('Leads imported successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Leads from Spreadsheet</h1>
        <p className="text-gray-500 text-sm">
          Bulk import leads from Excel (.xlsx, .xls) or CSV files with dynamic column mapping and duplicate protection
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        {[
          { num: 1, title: 'Upload File', desc: 'Select .xlsx, .xls or .csv' },
          { num: 2, title: 'Column Mapping', desc: 'Map columns & detect duplicates' },
          { num: 3, title: 'Complete', desc: 'Import summary & confirmation' },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                step === s.num
                  ? 'bg-[#014582] text-white ring-4 ring-[#014582]/20'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s.num ? <Check className="w-5 h-5" /> : s.num}
            </div>
            <div>
              <p className={`text-sm font-bold ${step === s.num ? 'text-gray-900' : 'text-gray-500'}`}>{s.title}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{s.desc}</p>
            </div>
            {idx < 2 && <ArrowRight className="w-4 h-4 text-gray-300 mx-4 hidden md:block" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-[#014582] rounded-2xl p-12 transition-all cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 group"
          >
            <div className="w-16 h-16 bg-blue-100 text-[#014582] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {loading ? 'Reading and parsing file...' : 'Click to upload or drag & drop'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">Microsoft Excel (.xlsx, .xls) or CSV files up to 20MB</p>
          </div>

          {/* Quick tips */}
          <div className="bg-blue-50/60 rounded-xl p-4 text-left border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-blue-950">
              <Info className="w-4 h-4" /> Smart Import Engine:
            </p>
            <p>• The system automatically matches headers like &ldquo;Full Name&rdquo;, &ldquo;WhatsApp&rdquo;, &ldquo;City&rdquo;, &ldquo;Business&rdquo; etc.</p>
            <p>• Any unmapped columns can be turned into new CRM custom fields with one click — no data will be lost!</p>
            <p>• Phone numbers are sanitized and formatted automatically before duplicate detection.</p>
          </div>
        </div>
      )}

      {/* STEP 2: Mapping & Duplicate Rules */}
      {step === 2 && (
        <div className="space-y-6">
          {/* File summary + templates */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{file?.name}</p>
                <p className="text-xs text-gray-400">{totalRows} records found · {headers.length} spreadsheet columns</p>
              </div>
            </div>

            {templates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Saved Template:</span>
                <select
                  onChange={e => {
                    const tmpl = templates.find(t => t.id === e.target.value);
                    if (tmpl) handleApplyTemplate(tmpl);
                  }}
                  className="text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">Select template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.templateName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Column Mapping Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Match Spreadsheet Headers to CRM Fields</h3>
              <span className="text-xs text-gray-400">Map columns or create new fields on the fly</span>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {headers.map(header => {
                const currentMapped = mapping[header] || '';
                const isMapped = currentMapped && currentMapped !== '__skip__';
                return (
                  <div key={header} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50">
                    <div className="w-1/3 min-w-44">
                      <p className="font-semibold text-sm text-gray-800">{header}</p>
                      <p className="text-xs text-gray-400 truncate">Sample: {String(preview[0]?.[header] || '—')}</p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />

                    <div className="flex-1 flex items-center gap-2">
                      <select
                        value={currentMapped}
                        onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className={`w-full max-w-xs px-3 py-1.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#014582]/20 ${
                          isMapped ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 font-bold' : 'border-gray-200'
                        }`}
                      >
                        <option value="">-- Choose CRM Field --</option>
                        <option value="__skip__">🚫 Skip this column</option>
                        <optgroup label="Standard CRM Fields">
                          <option value="fullName">Full Name</option>
                          <option value="firstName">First Name</option>
                          <option value="lastName">Last Name</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number</option>
                          <option value="whatsapp">WhatsApp Number</option>
                          <option value="companyName">Company / Organization</option>
                          <option value="city">City</option>
                          <option value="state">State / Province</option>
                          <option value="country">Country</option>
                          <option value="source">Lead Source</option>
                          <option value="status">Lead Status</option>
                          <option value="priority">Priority</option>
                          <option value="interest">Interest / Product</option>
                          <option value="budget">Estimated Budget</option>
                          <option value="notes">Notes / Remarks</option>
                          <option value="tags">Tags</option>
                        </optgroup>
                        {availableFields.length > 0 && (
                          <optgroup label="Custom Fields">
                            {availableFields.map(f => (
                              <option key={f.fieldKey} value={f.fieldKey}>
                                {f.fieldName} ({f.fieldType})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>

                      {!isMapped && (
                        <button
                          type="button"
                          onClick={() => handleCreateDynamicField(header)}
                          className="px-2.5 py-1.5 border border-dashed border-[#014582] text-[#014582] rounded-xl text-xs font-semibold hover:bg-[#014582]/5 flex items-center gap-1 flex-shrink-0"
                          title="Create this column as a dynamic CRM field"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create Field
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duplicate Detection Options */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Duplicate Handling Rules
            </h3>
            <p className="text-xs text-gray-500">
              Duplicates are automatically checked by matching <strong>Phone Number</strong>, <strong>WhatsApp</strong>, or <strong>Email Address</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { key: 'SKIP', label: 'Skip Duplicates', desc: 'Do not import rows that already exist in CRM (recommended)' },
                { key: 'UPDATE', label: 'Update Existing', desc: 'Overwrite matching leads with newest spreadsheet values' },
                { key: 'IMPORT_ANYWAY', label: 'Import Anyway', desc: 'Create duplicates as separate leads' },
              ].map(opt => (
                <label
                  key={opt.key}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    duplicateAction === opt.key ? 'border-[#014582] bg-blue-50/40 ring-2 ring-[#014582]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="duplicateAction"
                      value={opt.key}
                      checked={duplicateAction === opt.key}
                      onChange={() => setDuplicateAction(opt.key as any)}
                      className="text-[#014582]"
                    />
                    <span className="font-bold text-xs text-gray-900">{opt.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 pl-5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Save Mapping Template */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name (e.g. Google Ads Leads Export)"
                className="text-xs border px-3 py-1.5 rounded-lg w-64 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold"
              >
                Save Template
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={loading}
                className="px-6 py-2 bg-[#014582] text-white rounded-xl text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {loading ? 'Processing...' : `Import ${totalRows} Leads`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Complete */}
      {step === 3 && importResult && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Completed!</h2>
            <p className="text-sm text-gray-500 mt-1">Your lead pipeline has been updated with real database records.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500">Total Rows</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{importResult.totalRows}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-600 font-semibold">Imported</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{importResult.importedCount}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-600 font-semibold">Skipped Duplicates</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{importResult.skippedCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-xs text-red-600 font-semibold">Failed</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{importResult.failedCount}</p>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setImportResult(null);
              }}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push('/crm/leads')}
              className="px-6 py-2.5 bg-[#014582] text-white rounded-xl text-sm font-semibold hover:bg-[#01366a]"
            >
              View Leads in CRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

