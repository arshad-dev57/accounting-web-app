'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  Upload
} from 'lucide-react';
import {
  hrDocumentsService,
  HRDocumentItem,
  formatFileSize
} from '@/lib/hr-documents-service';

interface DocumentVersionModalProps {
  document: HRDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (doc: HRDocumentItem) => void;
  onReplace: (doc: HRDocumentItem) => void;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onPreview,
  onReplace
}) => {
  const [versions, setVersions] = useState<HRDocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && doc?.id) {
      loadVersions();
    }
  }, [isOpen, doc?.id]);

  const loadVersions = async () => {
    if (!doc?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await hrDocumentsService.getDocumentVersions(doc.id);
      setVersions(data);
    } catch (err: any) {
      console.error('[Load Versions Error]', err);
      setError(err.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">Document Version History</h3>
              <p className="text-xs text-slate-400">{doc.title} • Current Version: v{doc.version || 1}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-medium">Fetching document version history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">Single Version Record</p>
              <p className="text-xs text-slate-400 mt-0.5">This document has no previous recorded revisions.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {versions.map((ver, idx) => {
                const isCurrent = ver.id === doc.id || idx === 0;
                return (
                  <div key={ver.id} className="relative group">
                    {/* Timeline Node */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${
                        isCurrent
                          ? 'border-indigo-600 text-indigo-600 shadow-sm'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      />
                    </div>

                    {/* Version Card */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">
                              Version {ver.version || 1}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-600 text-white rounded-md uppercase tracking-wider">
                                Active Version
                              </span>
                            )}
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                              {ver.status || 'Uploaded'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Uploaded on {ver.createdAt ? new Date(ver.createdAt).toLocaleDateString() : 'N/A'} • Size: {formatFileSize(ver.fileSize)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onPreview(ver)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Preview version"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {ver.fileUrl && (
                            <a
                              href={ver.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Download version"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {ver.notes && (
                        <div className="mt-2 text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700">Notes: </span>
                          {ver.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => onReplace(doc)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Version</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
