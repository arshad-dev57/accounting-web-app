'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Calendar,
  User,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import {
  hrDocumentsService,
  HRDocumentCategory,
  HRDocumentItem,
  formatFileSize
} from '@/lib/hr-documents-service';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEmployeeId?: string;
  employees?: Array<{ id: string; name: string; code?: string }>;
  replaceTarget?: HRDocumentItem | null;
}

const CATEGORIES: HRDocumentCategory[] = [
  'Identity',
  'Employment',
  'Payroll / Financial',
  'Compliance',
  'Education',
  'Other'
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId = '',
  employees = [],
  replaceTarget = null
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Identity');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (replaceTarget) {
      setTitle(replaceTarget.title || '');
      setCategory(replaceTarget.category || 'Identity');
      setEmployeeId(replaceTarget.employeeId || initialEmployeeId || '');
      setDocumentNumber(replaceTarget.documentNumber || '');
      setIssuingAuthority(replaceTarget.issuingAuthority || '');
      setIssueDate(replaceTarget.issueDate || '');
      setExpiresAt(replaceTarget.expiresAt || '');
      setNotes(replaceTarget.notes || '');
    } else {
      setEmployeeId(initialEmployeeId);
      setTitle('');
      setCategory('Identity');
      setDocumentNumber('');
      setIssuingAuthority('');
      setIssueDate('');
      setExpiresAt('');
      setNotes('');
      setSelectedFile(null);
      setFileUrl('');
    }
    setError(null);
  }, [replaceTarget, initialEmployeeId, isOpen]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp'];
    if (!ext || !allowed.includes(ext)) {
      setError(`Invalid file format .${ext}. Allowed formats: ${allowed.join(', ')}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the maximum allowed limit of 10MB.');
      return;
    }
    setSelectedFile(file);
    if (!title) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(baseName);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }
    if (uploadMode === 'file' && !selectedFile && !replaceTarget) {
      setError('Please select a file to upload.');
      return;
    }
    if (uploadMode === 'url' && !fileUrl.trim()) {
      setError('Please enter a valid document URL.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (replaceTarget) {
        // Replace Document Flow
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('title', title);
          formData.append('category', category);
          if (employeeId) formData.append('employeeId', employeeId);
          if (documentNumber) formData.append('documentNumber', documentNumber);
          if (issuingAuthority) formData.append('issuingAuthority', issuingAuthority);
          if (issueDate) formData.append('issueDate', issueDate);
          if (expiresAt) formData.append('expiresAt', expiresAt);
          if (notes) formData.append('notes', notes);

          await hrDocumentsService.replaceDocument(replaceTarget.id, formData);
        } else {
          // Metadata or URL replace
          await hrDocumentsService.saveDocument({
            employeeId,
            title,
            category,
            fileUrl,
            documentNumber,
            issuingAuthority,
            issueDate,
            expiresAt,
            notes
          });
        }
      } else {
        // Upload New Document Flow
        if (uploadMode === 'file' && selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('title', title);
          formData.append('category', category);
          if (employeeId) formData.append('employeeId', employeeId);
          if (documentNumber) formData.append('documentNumber', documentNumber);
          if (issuingAuthority) formData.append('issuingAuthority', issuingAuthority);
          if (issueDate) formData.append('issueDate', issueDate);
          if (expiresAt) formData.append('expiresAt', expiresAt);
          if (notes) formData.append('notes', notes);

          await hrDocumentsService.uploadDocument(formData);
        } else {
          await hrDocumentsService.saveDocument({
            employeeId,
            title,
            category,
            fileUrl,
            documentNumber,
            issuingAuthority,
            issueDate,
            expiresAt,
            notes
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[Document Upload Error]', err);
      setError(err.response?.data?.message || err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 rounded-lg text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {replaceTarget ? `Replace Document: ${replaceTarget.title}` : 'Upload Employee Document'}
              </h3>
              <p className="text-xs text-slate-400">
                {replaceTarget
                  ? `Upload new file to create Version ${(replaceTarget.version || 1) + 1}`
                  : 'Store employee identity, contracts, certifications, or compliance docs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          {!replaceTarget && (
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  uploadMode === 'file'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>File Upload (PDF, Images, Office)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  uploadMode === 'url'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Paste Web URL</span>
              </button>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          {uploadMode === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
              />

              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Click to browse or drag and drop document file
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(selectedFile.name)}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* URL Mode */}
          {uploadMode === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document File URL *</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://storage.example.com/documents/doc123.pdf"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. National ID Card / Employment Contract"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Selection if multiple available */}
            {employees.length > 0 && !initialEmployeeId && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Associate Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Company-Wide Document (No specific employee)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.code ? `(${emp.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document / Ref Number</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. CNIC-35202-998811-3"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issuing Authority</label>
              <input
                type="text"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="e.g. NADRA / Govt of Pakistan"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry Date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internal Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any verification requirements, comments or remarks..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-indigo-200 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{replaceTarget ? 'Save New Version' : 'Upload Document'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
