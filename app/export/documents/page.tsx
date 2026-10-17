'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderArchive,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  UploadCloud,
  CheckCircle2,
  Send,
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
} from '../../../components/trade/TradeUI';
import { useTradeStore } from '../../../lib/mock/trade-store';
import type { ExportDocument } from '../../../lib/mock/trade-data';

export default function ExportDocumentsPage() {
  const { state } = useTradeStore();
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ExportDocument | null>(null);

  const filtered = state.exportDocs.filter(
    (d) =>
      d.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.orderRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TradePage>
      <TradePageHeader
        title="Export Documents & Bank Presentation"
        subtitle="Commercial invoices, Chamber of Commerce legalized Certificates of Origin, Ocean B/Ls and DHL tracking"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FolderArchive className="w-5 h-5 text-white" />}
      />

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search document no, customer, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={['Document Type', 'Document Number', 'Order Ref', 'Overseas Customer', 'Issue Date', 'Courier Tracking', 'Status', 'File']}
          />
          <TradeTableBody>
            {filtered.map((doc) => (
              <TradeTableRow key={doc.id}>
                <TradeTableCell className="font-bold text-[#014582]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#014582]" />
                    <span>{doc.docType}</span>
                  </div>
                </TradeTableCell>
                <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">
                  {doc.docNumber}
                </TradeTableCell>
                <TradeTableCell className="text-gray-700">
                  <Link href={`/export/orders?order=${doc.orderRef}`} className="hover:underline text-blue-700">
                    {doc.orderRef}
                  </Link>
                </TradeTableCell>
                <TradeTableCell className="font-semibold text-gray-900">{doc.customerName}</TradeTableCell>
                <TradeTableCell className="text-gray-600">{doc.issueDate}</TradeTableCell>
                <TradeTableCell className="font-mono text-xs text-gray-700">
                  {doc.courierTrackingNo || 'N/A (Electronic)'}
                </TradeTableCell>
                <TradeTableCell>
                  <TradeStatusBadge status={doc.status} />
                </TradeTableCell>
                <TradeTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="inline-flex items-center gap-1 text-xs text-[#014582] hover:underline font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> {doc.filePlaceholder}
                  </button>
                </TradeTableCell>
              </TradeTableRow>
            ))}
          </TradeTableBody>
        </TradeTable>
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.docNumber || 'Export Document'}
        subtitle={`Type: ${selectedDoc?.docType} • Buyer: ${selectedDoc?.customerName}`}
      >
        {selectedDoc && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Document Type</span>
                <span className="font-bold text-gray-900">{selectedDoc.docType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Document Number</span>
                <span className="font-mono font-bold text-gray-900">{selectedDoc.docNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order Ref</span>
                <span className="font-semibold text-gray-900">{selectedDoc.orderRef}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Courier Dispatched</span>
                <span className="font-mono font-semibold text-blue-700">{selectedDoc.courierTrackingNo || 'Electronic Delivery'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issue Date</span>
                <span className="font-medium text-gray-800">{selectedDoc.issueDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Legalization Status</span>
                <TradeStatusBadge status={selectedDoc.status} />
              </div>
            </div>

            <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 text-center space-y-3">
              <FileText className="w-12 h-12 text-[#014582] mx-auto opacity-70" />
              <div>
                <p className="font-bold text-gray-800 text-sm">{selectedDoc.filePlaceholder}</p>
                <p className="text-gray-500 text-xs mt-0.5">Commercial invoice attested by Dubai Chamber & Ministry of Foreign Affairs</p>
              </div>
              <button
                type="button"
                onClick={() => alert(`Simulated download of ${selectedDoc.filePlaceholder}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#014582] text-white font-bold hover:bg-[#01366a] transition-all"
              >
                <Download className="w-4 h-4" /> Download Attested PDF
              </button>
            </div>
          </div>
        )}
      </TradeDetailDrawer>
    </TradePage>
  );
}
