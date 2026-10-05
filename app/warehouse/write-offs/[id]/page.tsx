'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Trash2,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  Send,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export default function WriteOffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [writeOff, setWriteOff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const headers = browserCompanyAuthHeaders();
      const res = await fetch(`/api/inventory/write-offs/${id}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setWriteOff(json.data);
      }
    } catch (err) {
      console.error('Error loading write-off detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleAction = async (action: 'submit' | 'approve' | 'reject' | 'post') => {
    try {
      setProcessing(true);
      const headers = browserCompanyAuthHeaders();
      let url = `/api/inventory/write-offs/${id}/${action}`;
      let method = 'POST';

      if (action === 'submit') method = 'PUT';

      const res = await fetch(url, { method, headers });
      if (res.ok) {
        fetchDetail();
      } else {
        const err = await res.json();
        alert(err.message || `Failed to ${action} write-off.`);
      }
    } catch (err: any) {
      alert(err.message || 'Error processing request.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading write-off entry...</div>;
  }

  if (!writeOff) {
    return <div className="p-6 text-center text-slate-500">Write-off entry not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Write-Off Register
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-rose-600" />
            Write-Off #{writeOff.writeOffNumber}
          </h1>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {writeOff.status === 'Draft' && (
              <button
                onClick={() => handleAction('submit')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Submit for Approval
              </button>
            )}

            {(writeOff.status === 'Submitted' || writeOff.status === 'Draft') && (
              <button
                onClick={() => handleAction('approve')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve Entry
              </button>
            )}

            {writeOff.status === 'Approved' && (
              <button
                onClick={() => handleAction('post')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all"
              >
                <FileCheck className="w-3.5 h-3.5" /> Post Write-Off (Deduct Stock & Post GL)
              </button>
            )}

            {writeOff.status !== 'Posted' && writeOff.status !== 'Rejected' && (
              <button
                onClick={() => handleAction('reject')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                writeOff.status === 'Posted'
                  ? 'bg-emerald-50 text-emerald-700'
                  : writeOff.status === 'Approved'
                  ? 'bg-blue-50 text-blue-700'
                  : writeOff.status === 'Submitted'
                  ? 'bg-amber-50 text-amber-700'
                  : writeOff.status === 'Rejected'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {writeOff.status}
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Warehouse</span>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {writeOff.location?.name || 'Main Branch'}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</span>
          <div className="mt-1 text-sm font-semibold text-rose-600">{writeOff.reason}</div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Loss Value</span>
          <div className="mt-1 text-base font-bold text-rose-600">
            PKR {(writeOff.totalCost || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Accounting & Stock Audit Trace */}
      {writeOff.journalEntry && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
          <div className="font-bold text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" /> Accounting Entry Posted
          </div>
          <div>
            Journal Entry <span className="font-mono font-bold">#{writeOff.journalEntry.entryNumber}</span> posted to GL.
          </div>
          <div className="font-mono text-[11px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200">
            Dr: {writeOff.expenseAccount?.name || 'Inventory Write-Off Expense'} (PKR {writeOff.totalCost.toLocaleString()}) <br />
            Cr: Inventory Asset Account (PKR {writeOff.totalCost.toLocaleString()})
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Write-Off Line Items</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                <th className="py-2.5 px-3">SKU & Product Name</th>
                <th className="py-2.5 px-3 text-center">Write-Off Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Cost (PKR)</th>
                <th className="py-2.5 px-3 text-right">Total Loss (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {writeOff.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    {item.productName}
                    <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {item.quantity} {item.unitOfMeasure || 'pcs'}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    PKR {(item.unitCost || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">
                    PKR {(item.totalCost || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
