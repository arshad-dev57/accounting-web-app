'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Headset,
  Loader2,
  Plus,
  Search,
  Paperclip,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  supportTicketService,
  type SupportTicket,
} from '../../lib/support-ticket-service';
import { usePermissions } from '../../lib/usePermissions';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';

function statusColor(status: string) {
  switch (status) {
    case 'Open':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'In Progress':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Closed':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'Critical':
      return 'text-red-600';
    case 'High':
      return 'text-orange-600';
    case 'Medium':
      return 'text-amber-600';
    default:
      return 'text-gray-500';
  }
}

export default function SupportTicketsPage() {
  const { isAdmin } = usePermissions();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [adminStatus, setAdminStatus] = useState('In Progress');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    stepsToReproduce: '',
    module: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await supportTicketService.list({
        status: status === 'all' ? undefined : status,
        priority: priority === 'all' ? undefined : priority,
        search: search.trim() || undefined,
        limit: 50,
      });
      if (!res.success) throw new Error(res.message || 'Failed to load tickets');
      setTickets(res.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [status, priority, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitTicket = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res: any = await supportTicketService.create({
        ...form,
        attachment,
      });
      if (!res.success) throw new Error(res.message || 'Failed to create ticket');
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        category: 'General',
        priority: 'Medium',
        stepsToReproduce: '',
        module: '',
      });
      setAttachment(null);
      await load();
      if (res.data) setSelected(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const updateStaff = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res: any = await supportTicketService.update(selected.id, {
        status: adminStatus,
        adminResponse,
      });
      if (!res.success) throw new Error(res.message || 'Update failed');
      setSelected(res.data);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const removeTicket = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      const res: any = await supportTicketService.remove(id);
      if (!res.success) throw new Error(res.message || 'Delete failed');
      if (selected?.id === id) setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-56 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
        <BrandHeader subtitle="Support" compact />
        <div className="flex-1 px-3 py-4">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <TopBarBrand title="Support Tickets" icon={<Headset className="w-5 h-5 text-[#014582]" />} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Your issues & complaints</h2>
                <p className="text-sm text-gray-500">
                  Report a problem and track replies from the support team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6c3ae8]"
              >
                <Plus className="w-4 h-4" />
                New ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets…"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#014582]"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                {SUPPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All priorities</option>
                {SUPPORT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading tickets…
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 text-sm">
                    No tickets yet. Create one to report an issue.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {tickets.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(t);
                            setAdminResponse(t.adminResponse || '');
                            setAdminStatus(t.status === 'Open' ? 'In Progress' : t.status);
                          }}
                          className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                            selected?.id === t.id ? 'bg-[#014582]/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-gray-400">
                                  {t.ticketNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(
                                    t.status
                                  )}`}
                                >
                                  {t.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 truncate">{t.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {t.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-semibold ${priorityColor(t.priority)}`}>
                                {t.priority}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 min-h-[320px]">
                {!selected ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    Select a ticket to view details
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400">{selected.ticketNumber}</p>
                        <h3 className="text-base font-bold text-gray-900">{selected.title}</h3>
                      </div>
                      {selected.status === 'Open' && (
                        <button
                          type="button"
                          onClick={() => void removeTicket(selected.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full border ${statusColor(selected.status)}`}>
                        {selected.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                        {selected.category}
                      </span>
                      <span className={`font-semibold ${priorityColor(selected.priority)}`}>
                        {selected.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
                    {selected.stepsToReproduce && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                          Steps to reproduce
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {selected.stepsToReproduce}
                        </p>
                      </div>
                    )}
                    {selected.attachmentUrl && (
                      <a
                        href={selected.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#014582]"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> View attachment
                      </a>
                    )}
                    {selected.adminResponse && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-[11px] font-semibold text-emerald-700 mb-1">Support reply</p>
                        <p className="text-sm text-emerald-900 whitespace-pre-wrap">
                          {selected.adminResponse}
                        </p>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500">Staff update</p>
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                          {SUPPORT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          rows={3}
                          placeholder="Reply to the user…"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#014582]"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void updateStaff()}
                          className="w-full rounded-xl bg-[#1088dd] text-white text-sm font-semibold py-2.5 disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : 'Update ticket'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">New support ticket</p>
                <p className="text-xs text-gray-500">Describe the issue you are facing</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <label className="block text-xs font-semibold text-gray-600">
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#014582]"
                  placeholder="Short summary of the issue"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#014582]"
                  placeholder="What went wrong? What did you expect?"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-gray-600">
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  >
                    {SUPPORT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-gray-600">
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  >
                    {SUPPORT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold text-gray-600">
                Steps to reproduce (optional)
                <textarea
                  value={form.stepsToReproduce}
                  onChange={(e) => setForm((f) => ({ ...f, stepsToReproduce: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#014582]"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                Screenshot / attachment (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-sm"
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submitTicket()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#014582] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Submit ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
