'use client';

import React from 'react';
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
import { hrDocumentsService, HRDocumentItem, getExpiryStatus } from '@/lib/hr-documents-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<HRDocumentItem[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [statusFilter, setStatusFilter] = React.useState('All');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const [form, setForm] = React.useState({
    employeeId: '',
    title: '',
    category: 'Employment',
    reference: '',
    fileUrl: '',
    issueDate: '',
    expiresAt: '',
    documentNumber: '',
    issuingAuthority: '',
    notes: '',
  });

  const [selectedDoc, setSelectedDoc] = React.useState<HRDocumentItem | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [docs, emps] = await Promise.all([
        hrDocumentsService.listDocuments(),
        hrEmployeesService.list().catch(() => []),
      ]);
      setDocuments(docs);
      setEmployees(emps);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
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
      (doc.reference || '').toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;

    const expiryStatus = getExpiryStatus(doc.expiresAt);
    let matchesStatus = true;
    if (statusFilter === 'Verified') matchesStatus = doc.status === 'Verified';
    else if (statusFilter === 'Under Review') matchesStatus = doc.status === 'Under Review' || doc.status === 'Uploaded';
    else if (statusFilter === 'Expired') matchesStatus = expiryStatus.label === 'Expired' || expiryStatus.tone === 'red';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('Document title is required');
      return;
    }
    setUploading(true);
    try {
      await hrDocumentsService.saveDocument({
        ...form,
        employeeId: form.employeeId || undefined,
      });
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setForm({
        employeeId: '',
        title: '',
        category: 'Employment',
        reference: '',
        fileUrl: '',
        issueDate: '',
        expiresAt: '',
        documentNumber: '',
        issuingAuthority: '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyStatus = async (docId: string, status: 'Verified' | 'Rejected') => {
    try {
      await hrDocumentsService.updateDocumentStatus(docId, status);
      toast.success(`Document status updated to ${status}`);
      setSelectedDoc(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed updating status');
    }
  };

  const expiringCount = documents.filter((d) => {
    const st = getExpiryStatus(d.expiresAt);
    return st.tone === 'amber' || st.tone === 'red';
  }).length;

  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  return (
    <HRPage>
      <HRPageHeader
        title="Employee Document Management"
        subtitle="Central document repository, employee category management, verification, and expiry tracking."
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-[#014582] font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        }
      />

      {/* KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Total Documents" value={documents.length} icon={FileText} color="#014582" />
        <HRStatCard label="Verified Documents" value={verifiedCount} icon={FileCheck} color="#2ECC71" />
        <HRStatCard label="Expiring / Expired" value={expiringCount} icon={AlertTriangle} color="#F39C12" />
        <HRStatCard label="Categories" value={6} icon={FolderOpen} color="#3498DB" />
      </div>

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Search document by title, employee, or ref #"
        filters={
          <div className="flex flex-col md:flex-row gap-3">
            <HRFilterChips options={categories} value={categoryFilter} onChange={setCategoryFilter} />
            <HRFilterChips options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          </div>
        }
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE4EE] shadow-sm">
          <FileText className="w-12 h-12 text-[#7A8FA6] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-[#1A1A2E]">No Documents Found</h3>
          <p className="text-xs text-[#7A8FA6] mt-1 max-w-sm mx-auto">
            {search
              ? 'No documents match your filter criteria.'
              : 'Upload employment contracts, CNIC copies, certificates, or company policies.'}
          </p>
        </div>
      ) : (
        <HRCard title="Document Records Repository">
          <HRTable columns={['Title & Number', 'Category', 'Employee', 'Expiry Status', 'Verification', 'Action']}>
            {filteredDocs.map((doc) => {
              const expiry = getExpiryStatus(doc.expiresAt);
              return (
                <HRTableRow key={doc.id}>
                  <HRTableCell>
                    <div>
                      <p className="font-extrabold text-[#1A1A2E]">{doc.title}</p>
                      <p className="text-[10px] text-[#7A8FA6]">
                        {doc.documentNumber ? `No: ${doc.documentNumber} • ` : ''}
                        {doc.issuingAuthority || doc.reference || 'Ref: N/A'}
                      </p>
                    </div>
                  </HRTableCell>
                  <HRTableCell>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F0F4F8] text-[#014582]">
                      {doc.category || 'HR'}
                    </span>
                  </HRTableCell>
                  <HRTableCell>
                    <span className="font-semibold text-[#1A1A2E]">{doc.employee || 'Company-wide'}</span>
                  </HRTableCell>
                  <HRTableCell>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        expiry.tone === 'red'
                          ? 'bg-red-100 text-red-800'
                          : expiry.tone === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {doc.expiresAt ? `${doc.expiresAt} (${expiry.label})` : 'No Expiry'}
                    </span>
                  </HRTableCell>
                  <HRTableCell>
                    <HRStatusBadge status={doc.status || 'Uploaded'} />
                  </HRTableCell>
                  <HRTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </button>
                  </HRTableCell>
                </HRTableRow>
              );
            })}
          </HRTable>
        </HRCard>
      )}

      {/* MODAL: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-[#1A1A2E]">Upload Employee Document</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                  Employee (Optional for company-wide)
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE] focus:outline-none"
                >
                  <option value="">Company-wide Document</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.employeeCode} ({emp.department || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Document Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Employment Contract"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Document / CNIC #</label>
                  <input
                    type="text"
                    value={form.documentNumber}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    placeholder="e.g. 61101-1234567-1"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    value={form.issuingAuthority}
                    onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })}
                    placeholder="e.g. NADRA / HEC"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">File Storage Reference / URL</label>
                <input
                  type="text"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://storage.bisonstechs.com/docs/file.pdf"
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] flex items-center gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />} Upload & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Inspect / Verify Document */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-[#1A1A2E]">{selectedDoc.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Employee</span>
                <span className="font-bold text-[#1A1A2E]">{selectedDoc.employee || 'Company-wide'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Category</span>
                <span className="font-bold text-[#014582]">{selectedDoc.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Document Number</span>
                <span className="font-mono text-[#1A1A2E]">{selectedDoc.documentNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Issuing Authority</span>
                <span className="font-semibold text-[#1A1A2E]">{selectedDoc.issuingAuthority || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Expiry Date</span>
                <span className="font-bold text-[#1A1A2E]">{selectedDoc.expiresAt || 'No Expiry'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Verification Status</span>
                <HRStatusBadge status={selectedDoc.status} />
              </div>
              {selectedDoc.verifiedBy && (
                <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                  <span className="text-[#7A8FA6]">Verified By</span>
                  <span className="font-semibold text-green-700">{selectedDoc.verifiedBy}</span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-[#DDE4EE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleVerifyStatus(selectedDoc.id, 'Rejected')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100"
              >
                Reject
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyStatus(selectedDoc.id, 'Verified')}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verify Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}

function FolderOpen(props: any) {
  return <FileText {...props} />;
}
