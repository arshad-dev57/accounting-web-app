'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Plus,
  Loader2,
  Eye,
  X,
  Calendar,
  Building2,
  FileCheck,
  Download,
  History,
  Trash2,
  RefreshCw,
  FolderOpen,
  FileSpreadsheet,
  FileImage,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  HRPage,
  HRPageHeader,
  HRCard,
  HRStatCard,
  HRStatusBadge,
  HRToolbar,
  HRTable,
  HRTableRow,
  HRTableCell,
  HRFilterChips,
} from '../ui';
import {
  hrDocumentsService,
  HRDocumentItem,
  getExpiryStatus,
  formatFileSize
} from '@/lib/hr-documents-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import { DocumentUploadModal } from '@/components/hr/document-upload-modal';
import { DocumentPreviewModal } from '@/components/hr/document-preview-modal';
import { DocumentVersionModal } from '@/components/hr/document-version-modal';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<HRDocumentItem[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<HRDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<HRDocumentItem | null>(null);
  const [versionTarget, setVersionTarget] = useState<HRDocumentItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, empsRaw] = await Promise.all([
        hrDocumentsService.listDocuments(),
        hrEmployeesService.list().catch(() => []),
      ]);
      setDocuments(docs);
      
      const formattedEmps = Array.isArray(empsRaw)
        ? empsRaw.map((e: any) => ({
            id: e.id,
            name: e.user ? `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim() : e.name || e.employeeCode || 'Employee',
            code: e.employeeCode
          }))
        : [];
      setEmployees(formattedEmps);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load document records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories = ['All', 'Identity', 'Employment', 'Payroll / Financial', 'Compliance', 'Education', 'Other'];
  const statusOptions = ['All', 'Verified', 'Under Review', 'Uploaded', 'Expired'];

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (doc.title || '').toLowerCase().includes(q) ||
      (doc.employee || '').toLowerCase().includes(q) ||
      (doc.documentNumber || '').toLowerCase().includes(q) ||
      (doc.reference || '').toLowerCase().includes(q) ||
      (doc.fileName || '').toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;

    const expiryStatus = getExpiryStatus(doc.expiresAt);
    let matchesStatus = true;
    if (statusFilter === 'Verified') matchesStatus = doc.status === 'Verified';
    else if (statusFilter === 'Under Review') matchesStatus = doc.status === 'Under Review' || doc.status === 'Uploaded';
    else if (statusFilter === 'Expired') matchesStatus = expiryStatus.label === 'Expired' || expiryStatus.tone === 'red';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleVerifyStatus = async (docId: string, status: 'Verified' | 'Rejected') => {
    try {
      await hrDocumentsService.updateDocumentStatus(docId, status);
      toast.success(`Document marked as ${status}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document status');
    }
  };

  const handleDownload = async (doc: HRDocumentItem) => {
    try {
      if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank');
      } else {
        const data = await hrDocumentsService.downloadDocument(doc.id);
        if (data.fileUrl) {
          window.open(data.fileUrl, '_blank');
        } else {
          toast.error('File URL not found');
        }
      }
    } catch (err: any) {
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete document "${title}"?`)) return;
    try {
      await hrDocumentsService.deleteDocument(docId);
      toast.success('Document deleted');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    }
  };

  const getDocTypeIcon = (doc: HRDocumentItem) => {
    const fileName = doc.fileName || doc.fileUrl || doc.title;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || doc.mimeType?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '') || doc.mimeType?.includes('image')) {
      return <FileImage className="w-5 h-5 text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const expiringCount = documents.filter((d) => {
    const st = getExpiryStatus(d.expiresAt);
    return st.tone === 'amber' || st.tone === 'red';
  }).length;

  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Document Repository"
        subtitle="Real file upload, preview, verification, version control, and document expiry management."
        backHref="/hr/dashboard"
        actions={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setReplaceTarget(null);
                setShowUploadModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md hover:shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Total Documents" value={documents.length} icon={FileText} color="#014582" />
        <HRStatCard label="Verified Documents" value={verifiedCount} icon={FileCheck} color="#2ECC71" />
        <HRStatCard label="Expiring / Expired" value={expiringCount} icon={AlertTriangle} color="#F39C12" />
        <HRStatCard label="Categories" value={6} icon={FolderOpen} color="#3498DB" />
      </div>

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Search documents by title, employee, file name, or reference #"
        filters={
          <div className="flex flex-col md:flex-row gap-3">
            <HRFilterChips options={categories} value={categoryFilter} onChange={setCategoryFilter} />
            <HRFilterChips options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-slate-800">No Documents Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'No document records match your current search and filter criteria.'
              : 'Click [Upload Document] to attach PDFs, photos, or certificates.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setReplaceTarget(null);
              setShowUploadModal(true);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <HRCard title="Document Files Repository">
          <HRTable columns={['File & Document', 'Category', 'Employee', 'File Info', 'Expiry Status', 'Verification', 'Actions']}>
            {filteredDocs.map((doc) => {
              const expiry = getExpiryStatus(doc.expiresAt);
              return (
                <HRTableRow key={doc.id}>
                  <HRTableCell>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0">
                        {getDocTypeIcon(doc)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-slate-900 text-sm leading-tight">{doc.title}</p>
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-slate-100 text-slate-600 border border-slate-200">
                            v{doc.version || 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {doc.documentNumber ? `Ref: ${doc.documentNumber}` : doc.issuingAuthority || 'No Ref Number'}
                        </p>
                      </div>
                    </div>
                  </HRTableCell>

                  <HRTableCell>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {doc.category || 'HR'}
                    </span>
                  </HRTableCell>

                  <HRTableCell>
                    <span className="font-semibold text-slate-800 text-xs">
                      {doc.employee || 'Company-wide'}
                    </span>
                  </HRTableCell>

                  <HRTableCell>
                    <div className="text-xs text-slate-600">
                      <p className="font-medium truncate max-w-[120px]">{doc.fileName || 'Document File'}</p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </HRTableCell>

                  <HRTableCell>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                        expiry.tone === 'red'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : expiry.tone === 'amber'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {doc.expiresAt ? `${doc.expiresAt} (${expiry.label})` : 'No Expiry'}
                    </span>
                  </HRTableCell>

                  <HRTableCell>
                    <HRStatusBadge status={doc.status || 'Uploaded'} />
                  </HRTableCell>

                  <HRTableCell>
                    <div className="flex items-center space-x-1">
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Preview document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Version History Button */}
                      <button
                        type="button"
                        onClick={() => setVersionTarget(doc)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Version history"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Replace File Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplaceTarget(doc);
                          setShowUploadModal(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Replace file (new version)"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* Verify / Unverify Toggle */}
                      {doc.status !== 'Verified' ? (
                        <button
                          type="button"
                          onClick={() => handleVerifyStatus(doc.id, 'Verified')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Mark as Verified"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifyStatus(doc.id, 'Rejected')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Mark as Rejected"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </HRTableCell>
                </HRTableRow>
              );
            })}
          </HRTable>
        </HRCard>
      )}

      {/* Upload / Replace Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setReplaceTarget(null);
        }}
        onSuccess={loadData}
        employees={employees}
        replaceTarget={replaceTarget}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      {/* Version History Modal */}
      <DocumentVersionModal
        isOpen={Boolean(versionTarget)}
        document={versionTarget}
        onClose={() => setVersionTarget(null)}
        onPreview={(versionDoc) => setPreviewDoc(versionDoc)}
        onReplace={(targetDoc) => {
          setVersionTarget(null);
          setReplaceTarget(targetDoc);
          setShowUploadModal(true);
        }}
      />
    </HRPage>
  );
}
