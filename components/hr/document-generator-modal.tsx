'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Check,
  Printer,
  Download,
  Loader2,
  Sparkles,
  User,
  Building,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hrPrintService, HRPrintSettingItem, HRDocumentTemplateItem } from '@/lib/hr-print-service';
import { HRDocumentRenderer } from './hr-document-renderer';

interface DocumentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployeeId?: string;
  employees?: Array<{ id: string; name: string; code?: string; designation?: string; department?: string; salary?: number; joiningDate?: string }>;
}

export const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId = '',
  employees = []
}) => {
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [documentType, setDocumentType] = useState<string>('AppointmentLetter');
  const [templates, setTemplates] = useState<HRDocumentTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<HRDocumentTemplateItem | null>(null);
  const [printSettings, setPrintSettings] = useState<HRPrintSettingItem | null>(null);

  const [customTitle, setCustomTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [renderedContent, setRenderedContent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, documentType]);

  useEffect(() => {
    setEmployeeId(initialEmployeeId);
  }, [initialEmployeeId, isOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settings, tpls] = await Promise.all([
        hrPrintService.getSettings(),
        hrPrintService.listTemplates(documentType)
      ]);
      setPrintSettings(settings);
      setTemplates(tpls);

      const activeTpl = tpls.find((t) => t.isDefault) || tpls[0] || null;
      setSelectedTemplate(activeTpl);
    } catch (err: any) {
      console.error('[Document Generator Error]', err);
      setError(err.message || 'Failed loading templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate && employeeId) {
      const emp = employees.find((e) => e.id === employeeId);
      if (emp) {
        let text = selectedTemplate.contentBody || '';
        text = text.replace(/\{\{employee\.name\}\}/g, emp.name || 'Employee Name');
        text = text.replace(/\{\{employee\.code\}\}/g, emp.code || 'EMP-001');
        text = text.replace(/\{\{employee\.designation\}\}/g, emp.designation || 'Staff');
        text = text.replace(/\{\{employee\.department\}\}/g, emp.department || 'General');
        text = text.replace(/\{\{employee\.joiningDate\}\}/g, emp.joiningDate || new Date().toISOString().slice(0, 10));
        text = text.replace(/\{\{employee\.salary\}\}/g, emp.salary ? emp.salary.toLocaleString() : '0');
        setRenderedContent(text);
      } else {
        setRenderedContent(selectedTemplate.contentBody || '');
      }
    } else if (selectedTemplate) {
      setRenderedContent(selectedTemplate.contentBody || '');
    }
  }, [selectedTemplate, employeeId, employees]);

  if (!isOpen) return null;

  const handleGenerateAndSave = async () => {
    if (!employeeId) {
      setError('Please select an employee');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      await hrPrintService.generateDocumentSnapshot({
        employeeId,
        templateId: selectedTemplate?.id,
        documentType,
        customTitle: customTitle || undefined,
        notes: notes || undefined
      });

      toast.success('HR Document generated and saved to Employee Dossier');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('[Generate Document Snapshot Error]', err);
      setError(err.message || 'Failed generating document');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">HR Document Generator</h3>
              <p className="text-xs text-slate-400">Generate, print, and save official employee letters with historical snapshotting</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-100">
          {/* Controls Sidebar (Left 4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white border-r border-slate-200 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">1. Target Employee *</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.code ? `(${emp.code})` : ''} - {emp.designation || 'Staff'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">2. Document Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-indigo-700"
              >
                <option value="AppointmentLetter">Appointment Letter</option>
                <option value="OfferLetter">Offer Letter</option>
                <option value="SalaryCertificate">Salary Certificate</option>
                <option value="ExperienceLetter">Experience & Service Certificate</option>
                <option value="PromotionLetter">Promotion Letter</option>
                <option value="TransferLetter">Transfer Letter</option>
                <option value="WarningLetter">Warning Letter</option>
                <option value="TerminationLetter">Termination Letter</option>
                <option value="Custom">Custom HR Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">3. Select Template Version</label>
              {loading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">No template found for type</div>
              ) : (
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const tpl = templates.find((t) => t.id === e.target.value);
                    if (tpl) setSelectedTemplate(tpl);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (v{t.version}) {t.isDefault ? '⭐ Default' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Custom Title (Optional)</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Overriding Title..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internal Remarks / Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for issuance or special terms..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-bold">✨ Historical Snapshot Guarantee</p>
              <p className="text-[11px] text-slate-600">
                Generating this document freezes employee data, branding, and signatures into a permanent snapshot in the employee dossier.
              </p>
            </div>
          </div>

          {/* Interactive Document Preview (Right 8 cols) */}
          <div className="lg:col-span-8 p-6 overflow-y-auto bg-slate-200/80 flex items-start justify-center">
            <HRDocumentRenderer
              settings={printSettings}
              title={customTitle || selectedTemplate?.name || documentType}
              date={new Date().toLocaleDateString()}
            >
              <div className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                {renderedContent || 'Select employee and template to render preview...'}
              </div>
            </HRDocumentRenderer>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateAndSave}
              disabled={generating || !employeeId}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Snapshot...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Generate & Save to Dossier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
