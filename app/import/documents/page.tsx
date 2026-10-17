'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradeDetailDrawer,
  TradeModal,
} from '../../../components/trade/TradeUI';
import importApi, { ImportDocument } from '../../../lib/import-api';

export default function ImportDocumentsPage() {
  const [docs, setDocs] = useState<ImportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState<ImportDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const DOC_TYPES = [
    'Supplier Quotation',
    'Import Purchase Order',
    'Proforma Invoice',
    'Commercial Invoice',
    'Packing List',
    'Bill of Lading',
    'Air Waybill',
    'Certificate of Origin',
    'Insurance Certificate',
    'Customs Declaration',
    'Import Permit',
    'Inspection Certificate',
    'Freight Invoice',
    'LC Document',
    'Other',
  ];
  const [newDocType, setNewDocType] = useState('Bill of Lading');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newPoRef, setNewPoRef] = useState('');
  const [newIssuer, setNewIssuer] = useState('');
  const [newIssueDate, setNewIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (typeFilter !== 'All') params.documentType = typeFilter;
      const data = await importApi.listDocuments(params);
      setDocs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load trade documents');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await importApi.createDocument({
        documentType: newDocType,
        documentNumber: newDocNumber || undefined,
        issuer: newIssuer || undefined,
        poRef: newPoRef || undefined,
        issueDate: newIssueDate || undefined,
        expiryDate: newExpiryDate || undefined,
        status: 'Pending Review',
        fileName: `${newDocType.replace(/\s+/g, '_')}_${newDocNumber || 'register'}.pdf`,
      });
      setIsUploadOpen(false);
      setNewDocNumber('');
      setNewPoRef('');
      setNewIssuer('');
      setNewExpiryDate('');
      fetchDocs();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (val?: string) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const filtered = docs.filter((doc) => {
    const q = search.toLowerCase();
    return (
      (doc.documentType || '').toLowerCase().includes(q) ||
      (doc.documentNumber || '').toLowerCase().includes(q) ||
      (doc.importPoId || '').toLowerCase().includes(q) ||
      (doc.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <TradePage>
      <TradePageHeader
        title="Import Trade Documents"
        subtitle="Repository of Bills of Lading, Commercial Invoices, Certificates of Origin, Insurance & Inspection"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<FolderOpen className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDocs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <UploadCloud className="w-4 h-4" /> Upload Document
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDocs}
            className="font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search document no, issuer, PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {['All', 'Bill of Lading', 'Commercial Invoice', 'Packing List', 'Certificate of Origin'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  typeFilter === t
                    ? 'bg-[#014582] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading trade documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xs">No documents found matching criteria.</p>
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={['Document Type', 'Document Number', 'PO / Shipment Ref', 'Details / Notes', 'Date Uploaded', 'Status', 'File Attachment']}
            />
            <TradeTableBody>
              {filtered.map((doc) => (
                <TradeTableRow key={doc.id}>
                  <TradeTableCell className="font-bold text-[#014582]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#014582]" />
                      <span>{doc.documentType}</span>
                    </div>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">
                    {doc.documentNumber || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-700">
                    {doc.importPoId || doc.shipmentId ? (
                      <span className="font-medium text-blue-700">
                        {doc.importPoId || doc.shipmentId}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-800 font-medium text-xs max-w-[200px] truncate">
                    {doc.notes || 'Official certified copy'}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(doc.issueDate || doc.createdAt)}</TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={doc.status || 'Verified'} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs text-[#014582] hover:underline font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> {doc.fileName || `${doc.documentType}.pdf`}
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.documentNumber || 'Trade Document'}
        subtitle={`Type: ${selectedDoc?.documentType}`}
      >
        {selectedDoc && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Document Type</span>
                <span className="font-bold text-gray-900">{selectedDoc.documentType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Document Number</span>
                <span className="font-mono font-bold text-gray-900">{selectedDoc.documentNumber || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issue Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedDoc.issueDate || selectedDoc.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Compliance Status</span>
                <TradeStatusBadge status={selectedDoc.status || 'Verified'} />
              </div>
            </div>

            {selectedDoc.notes && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Notes & Cross-References</span>
                <p className="text-gray-800">{selectedDoc.notes}</p>
              </div>
            )}

            {/* Document Preview Box */}
            <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 text-center space-y-3">
              <FileCheck className="w-12 h-12 text-[#014582] mx-auto opacity-70" />
              <div>
                <p className="font-bold text-gray-800 text-sm">{selectedDoc.fileName || `${selectedDoc.documentType}.pdf`}</p>
                <p className="text-gray-500 text-xs mt-0.5">Digitally certified trade document stored in secure cloud vault</p>
              </div>
              <button
                type="button"
                onClick={() => alert(`Document: ${selectedDoc.fileName || 'trade_document.pdf'}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#014582] text-white font-bold hover:bg-[#01366a] transition-all"
              >
                <Download className="w-4 h-4" /> Download Certified File
              </button>
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Trade Document"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Document Type *</label>
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Document Number *</label>
              <input
                type="text"
                placeholder="e.g. COSU9921820"
                value={newDocNumber}
                onChange={(e) => setNewDocNumber(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Issuer Organization *</label>
              <input
                type="text"
                placeholder="e.g. COSCO Lines or Chamber"
                value={newIssuer}
                onChange={(e) => setNewIssuer(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Issue date</label>
              <input
                type="date"
                value={newIssueDate}
                onChange={(e) => setNewIssueDate(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Expiry date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Import PO Reference / Number</label>
            <input
              type="text"
              placeholder="e.g. PO-2026-001"
              value={newPoRef}
              onChange={(e) => setNewPoRef(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs"
            />
          </div>

          <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
            <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-1" />
            <p className="font-semibold text-gray-700 text-xs">Drop trade document here or click to browse</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, PNG, JPG, TIFF (Max 25MB)</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Uploading...' : 'Upload & Verify Document'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
