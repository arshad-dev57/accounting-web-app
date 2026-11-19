'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileCheck,
  Send,
  BookOpen,
  Loader2,
  Calendar,
  Building2,
  User,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Posted: 'bg-emerald-100 text-emerald-700',
    Approved: 'bg-blue-100 text-blue-700',
    Submitted: 'bg-amber-100 text-amber-700',
    Rejected: 'bg-red-100 text-red-700',
    Draft: 'bg-orange-100 text-orange-700',
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        map[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function personName(u?: { firstName?: string; lastName?: string } | null) {
  if (!u) return '—';
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
}

export default function WriteOffDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [writeOff, setWriteOff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/inventory/write-offs/${id}`);
      const data = res.data?.data ?? res.data;
      if (res.success || res.data?.success) {
        setWriteOff(data);
      } else {
        setWriteOff(null);
        toast.error(res.message || 'Write-off not found');
      }
    } catch (err: any) {
      console.error('Error loading write-off detail:', err);
      toast.error(err.message || 'Failed to load write-off');
      setWriteOff(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void fetchDetail();
  }, [id]);

  const handleAction = async (action: 'submit' | 'approve' | 'reject' | 'post') => {
    try {
      setProcessing(true);
      const url = `/api/inventory/write-offs/${id}/${action}`;
      const res =
        action === 'submit'
          ? await apiClient.put(url, {})
          : await apiClient.post(url, action === 'reject' ? { reason: rejectReason || undefined } : {});

      if (res.success || res.data?.success) {
        toast.success(
          action === 'submit'
            ? 'Submitted for approval'
            : action === 'approve'
              ? 'Write-off approved'
              : action === 'post'
                ? 'Posted — stock & GL updated'
                : 'Write-off rejected'
        );
        setShowReject(false);
        setRejectReason('');
        await fetchDetail();
      } else {
        toast.error(res.message || res.data?.message || `Failed to ${action}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing request');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
        <p className="text-sm text-gray-500 mt-2">Loading write-off…</p>
      </div>
    );
  }

  if (!writeOff) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-gray-500">Write-off entry not found.</p>
        <Link href="/warehouse/write-offs" className="text-sm font-semibold text-[#014582] hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const canPost = writeOff.status === 'Approved' || writeOff.status === 'Submitted';

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Link
          href="/warehouse/write-offs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#014582] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to write-offs
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
              {writeOff.writeOffNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={writeOff.status} />
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(writeOff.writeOffDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {writeOff.status === 'Draft' && (
              <button
                type="button"
                onClick={() => void handleAction('submit')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit
              </button>
            )}
            {(writeOff.status === 'Submitted' || writeOff.status === 'Draft') && (
              <button
                type="button"
                onClick={() => void handleAction('approve')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-[#014582] hover:bg-[#01366a] text-white text-xs font-semibold disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
            )}
            {canPost && (
              <button
                type="button"
                onClick={() => void handleAction('post')}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Post (stock + GL)
              </button>
            )}
            {writeOff.status !== 'Posted' && writeOff.status !== 'Rejected' && (
              <button
                type="button"
                onClick={() => setShowReject(true)}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Warehouse</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {writeOff.location?.name || '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Reason</p>
          <p className="mt-1 text-sm font-semibold text-red-600">{writeOff.reason}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total loss</p>
          <p className="mt-1 text-base font-bold text-red-600">{formatMoney(writeOff.totalCost || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Created by</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {personName(writeOff.creator)}
          </p>
        </div>
      </div>

      {(writeOff.notes || writeOff.approver || writeOff.poster) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {writeOff.notes && (
            <div className="md:col-span-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
              <p className="mt-1 text-gray-700">{writeOff.notes}</p>
            </div>
          )}
          {writeOff.approver && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Approved by</p>
              <p className="mt-1 font-medium text-gray-800">{personName(writeOff.approver)}</p>
            </div>
          )}
          {writeOff.poster && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Posted by</p>
              <p className="mt-1 font-medium text-gray-800">{personName(writeOff.poster)}</p>
              {writeOff.postedAt && (
                <p className="text-xs text-gray-400">{new Date(writeOff.postedAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      )}

      {writeOff.journalEntry && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 md:p-5 text-sm text-emerald-900 space-y-2">
          <div className="font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Accounting entry posted
          </div>
          <p>
            Journal{' '}
            <Link
              href="/accounting/journal-entries"
              className="font-mono font-bold text-[#014582] hover:underline"
            >
              #{writeOff.journalEntry.entryNumber}
            </Link>{' '}
            created in GL.
          </p>
          <div className="font-mono text-[11px] bg-white p-3 rounded-lg border border-emerald-200">
            Dr: {writeOff.expenseAccount?.name || 'Inventory Write-Off Expense'} (
            {formatMoney(writeOff.totalCost || 0)})
            <br />
            Cr: Inventory Asset ({formatMoney(writeOff.totalCost || 0)})
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-gray-100">
          <h2 className="text-sm md:text-base font-bold text-gray-800">Line items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                  Product
                </th>
                <th className="text-center px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                  Qty
                </th>
                <th className="text-right px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                  Unit cost
                </th>
                <th className="text-right px-4 md:px-6 py-2 font-semibold text-gray-500 uppercase text-[10px]">
                  Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {(writeOff.items || []).map((item: any) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 md:px-6 py-3 font-medium text-gray-800">
                    {item.productName || item.product?.name}
                    <div className="text-[11px] font-mono text-gray-400">
                      {item.sku || item.product?.sku}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 text-center font-semibold text-gray-700">
                    {item.quantity} {item.unitOfMeasure || 'pcs'}
                  </td>
                  <td className="px-4 md:px-6 py-3 text-right text-gray-700">
                    {formatMoney(item.unitCost || 0)}
                  </td>
                  <td className="px-4 md:px-6 py-3 text-right font-semibold text-red-600">
                    {formatMoney(item.totalCost || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Reject write-off</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Optional rejection reason"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#014582]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => void handleAction('reject')}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
