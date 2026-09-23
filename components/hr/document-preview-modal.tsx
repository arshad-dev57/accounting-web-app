'use client';

import React from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  ShieldCheck,
  Calendar,
  User,
  Building,
  Info
} from 'lucide-react';
import { HRDocumentItem, formatFileSize, getExpiryStatus } from '@/lib/hr-documents-service';

interface DocumentPreviewModalProps {
  document: HRDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (doc: HRDocumentItem) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onDownload
}) => {
  if (!isOpen || !doc) return null;

  const fileUrl = doc.fileUrl || '';
  const fileName = doc.fileName || doc.title;
  const ext = (fileName.split('.').pop() || fileUrl.split('.').pop() || '').toLowerCase();

  const isPdf = ext === 'pdf' || doc.mimeType?.includes('pdf') || fileUrl.toLowerCase().includes('.pdf');
  const isImage =
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) ||
    doc.mimeType?.includes('image') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(fileUrl);
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);

  const expiry = getExpiryStatus(doc.expiresAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              {isPdf && <FileText className="w-5 h-5 text-rose-400" />}
              {isImage && <FileImage className="w-5 h-5 text-blue-400" />}
              {isOffice && <FileSpreadsheet className="w-5 h-5 text-emerald-400" />}
              {!isPdf && !isImage && !isOffice && <File className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base truncate">{doc.title}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  v{doc.version || 1}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                    doc.status === 'Verified'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {doc.status || 'Uploaded'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {doc.employee ? `Employee: ${doc.employee} • ` : ''}
                Category: {doc.category || 'General'} • Size: {formatFileSize(doc.fileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {fileUrl && (
              <>
                <button
                  onClick={() => onDownload?.(doc)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950/90 relative overflow-hidden flex items-center justify-center p-4">
          {!fileUrl ? (
            <div className="text-center p-8 text-slate-400">
              <File className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-base">No preview file attached</p>
              <p className="text-xs text-slate-500 mt-1">This document record does not have an attached media file.</p>
            </div>
          ) : isPdf ? (
            <iframe src={fileUrl} className="w-full h-full rounded-xl border border-slate-800 bg-white" title={doc.title} />
          ) : isImage ? (
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-2">
              <img
                src={fileUrl}
                alt={doc.title}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center text-slate-300 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-emerald-500/30">
                {isOffice ? <FileSpreadsheet className="w-8 h-8" /> : <File className="w-8 h-8" />}
              </div>
              <h4 className="font-bold text-lg text-white mb-1">{doc.title}</h4>
              <p className="text-xs text-slate-400 mb-6">
                Office documents ({ext.toUpperCase()}) cannot be embedded directly in browser preview without downloading.
              </p>
              <button
                onClick={() => onDownload?.(doc)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File ({formatFileSize(doc.fileSize)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Metadata Strip */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-4">
            {doc.documentNumber && (
              <span className="flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Ref: <strong className="text-slate-800">{doc.documentNumber}</strong></span>
              </span>
            )}
            {doc.issuingAuthority && (
              <span className="flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Authority: <strong className="text-slate-800">{doc.issuingAuthority}</strong></span>
              </span>
            )}
            {doc.expiresAt && (
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Expires: <strong className="text-slate-800">{doc.expiresAt}</strong>
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 font-bold rounded text-[10px] ${
                      expiry.tone === 'red'
                        ? 'bg-rose-100 text-rose-700'
                        : expiry.tone === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {expiry.label}
                  </span>
                </span>
              </span>
            )}
          </div>

          {doc.verifiedBy && (
            <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified by {doc.verifiedBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
