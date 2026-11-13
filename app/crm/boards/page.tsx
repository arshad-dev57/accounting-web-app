'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table2, Kanban, LayoutList, Plus, Search, Filter, Download,
  MoreHorizontal, ChevronDown, CheckCircle, Clock, Star, Phone,
  Building2, GripVertical, User, ArrowUpDown, Eye, Settings2, RefreshCw,
} from 'lucide-react';
import {
  getLeads, getCustomFields, getDefaultBoard, updateLead,
  updateLeadBoardOrder, bulkUpdateLeads, exportLeads,
  LEAD_STATUSES, STATUS_COLORS, STATUS_DOT_COLORS, PRIORITY_COLORS,
  type Lead, type LeadCustomField, type LeadBoard,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

export default function LeadBoardsPage() {
  const router = useRouter();
  const [board, setBoard] = useState<LeadBoard | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customFields, setCustomFields] = useState<LeadCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    try {
      const [boardData, fieldsData, leadsData] = await Promise.all([
        getDefaultBoard().catch(() => null),
        getCustomFields().catch(() => []),
        getLeads({ limit: 200, search: search || undefined, status: statusFilter || undefined }),
      ]);
      setBoard(boardData);
      setCustomFields(Array.isArray(fieldsData) ? fieldsData : []);
      setLeads(leadsData.leads || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try {
      await updateLead(leadId, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
      fetchBoardData();
    }
  };

  const handleInlineSave = async (leadId: string, field: string, value: any) => {
    setEditingCell(null);
    try {
      await updateLead(leadId, { [field]: value });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l));
      toast.success('Updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleCustomFieldInlineSave = async (leadId: string, fieldKey: string, value: any) => {
    setEditingCell(null);
    const target = leads.find(l => l.id === leadId);
    if (!target) return;
    const newCustom = { ...(target.customFields || {}), [fieldKey]: value };
    try {
      await updateLead(leadId, { customFields: newCustom });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, customFields: newCustom } : l));
      toast.success('Updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const columns = board?.columns || LEAD_STATUSES.map((s, idx) => ({
    id: s,
    boardId: 'default',
    name: s,
    statusKey: s,
    color: STATUS_DOT_COLORS[s] || '#6b7280',
    sortOrder: idx,
  }));

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Lead Pipelines & Boards</h1>
            <span className="text-xs bg-blue-100 text-[#014582] font-semibold px-2.5 py-0.5 rounded-full">
              {leads.length} Active Leads
            </span>
          </div>
          <p className="text-gray-500 text-sm">Interactive Monday.com-style visual workspace</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'kanban' ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'table' ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" /> Spreadsheet
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list' ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            onClick={() => exportLeads({ ids: selectedIds.size > 0 ? [...selectedIds] : undefined })}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 text-gray-500" /> Export
          </button>

          <button
            onClick={() => router.push('/crm/leads/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#014582] text-white rounded-xl text-sm font-medium hover:bg-[#01366a] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads by name, email, company, phone..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
        >
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          onClick={fetchBoardData}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Board Surface */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 h-96 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : view === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar items-start min-h-[calc(100vh-280px)]">
          {columns.map((col) => {
            const colLeads = leads.filter(l => l.status === col.statusKey);
            const isTarget = dragOverCol === col.statusKey;
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-80 bg-[#f8fafc] rounded-2xl border transition-all flex flex-col max-h-[calc(100vh-270px)] ${
                  isTarget ? 'border-[#014582] bg-blue-50/50 shadow-md' : 'border-gray-200/80 shadow-xs'
                }`}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOverCol(col.statusKey);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (draggingId && draggingId !== col.statusKey) {
                    handleStatusChange(draggingId, col.statusKey);
                  }
                  setDragOverCol(null);
                  setDraggingId(null);
                }}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-gray-200/80 flex items-center justify-between bg-white rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color || '#3b82f6' }}
                    />
                    <h3 className="font-bold text-sm text-gray-800">{col.name}</h3>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => router.push(`/crm/leads/${lead.id}`)}
                      className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-xs hover:shadow-md hover:border-[#014582]/40 transition-all cursor-pointer group space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-900 group-hover:text-[#014582] transition-colors">
                            {lead.fullName}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">{lead.leadNumber}</p>
                        </div>
                        <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {lead.companyName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{lead.companyName}</span>
                        </div>
                      )}

                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}

                      {lead.budget && (
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          {lead.currency || 'PKR'} {lead.budget.toLocaleString()}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_COLORS[lead.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {lead.priority}
                        </span>
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-1 text-gray-600 font-medium" title={lead.assignedTo.email}>
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] truncate max-w-[90px]">{lead.assignedTo.firstName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-xs text-gray-400">No leads in this stage</p>
                    </div>
                  )}
                </div>

                {/* Add Card to Column */}
                <button
                  onClick={() => router.push(`/crm/leads/new?status=${col.statusKey}`)}
                  className="m-3 mt-0 p-2 text-xs font-medium text-gray-600 hover:text-[#014582] hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Lead
                </button>
              </div>
            );
          })}
        </div>
      ) : view === 'table' ? (
        /* MONDAY.COM SPREADSHEET VIEW WITH INLINE EDIT */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === leads.length && leads.length > 0}
                    onChange={() => setSelectedIds(selectedIds.size === leads.length ? new Set() : new Set(leads.map(l => l.id)))}
                    className="rounded"
                  />
                </th>
                <th className="p-3 min-w-[200px]">Lead Name</th>
                <th className="p-3 min-w-[140px]">Status</th>
                <th className="p-3 min-w-[120px]">Priority</th>
                <th className="p-3 min-w-[160px]">Company</th>
                <th className="p-3 min-w-[140px]">Phone</th>
                <th className="p-3 min-w-[160px]">Email</th>
                <th className="p-3 min-w-[130px]">Budget</th>
                <th className="p-3 min-w-[140px]">Assigned To</th>
                {customFields.filter(f => f.isVisible).map(f => (
                  <th key={f.id} className="p-3 min-w-[140px]">{f.fieldName}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/20 group transition-colors">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => handleSelect(lead.id)}
                      className="rounded"
                    />
                  </td>

                  {/* Name */}
                  <td className="p-3 font-semibold text-gray-900 cursor-pointer hover:text-[#014582]" onClick={() => router.push(`/crm/leads/${lead.id}`)}>
                    <div className="flex items-center justify-between">
                      <span>{lead.fullName}</span>
                      <span className="text-[10px] text-gray-400 font-mono font-normal">{lead.leadNumber}</span>
                    </div>
                  </td>

                  {/* Inline Status Dropdown */}
                  <td className="p-3">
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#014582]"
                    >
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>

                  {/* Inline Priority */}
                  <td className="p-3">
                    <select
                      value={lead.priority}
                      onChange={e => handleInlineSave(lead.id, 'priority', e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#014582]"
                    >
                      {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>

                  {/* Inline Company */}
                  <td className="p-3 text-gray-700">
                    {editingCell?.leadId === lead.id && editingCell?.field === 'companyName' ? (
                      <input
                        autoFocus
                        defaultValue={lead.companyName || ''}
                        onBlur={e => handleInlineSave(lead.id, 'companyName', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInlineSave(lead.id, 'companyName', (e.target as any).value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <span
                        onClick={() => setEditingCell({ leadId: lead.id, field: 'companyName' })}
                        className="cursor-pointer hover:underline text-xs"
                      >
                        {lead.companyName || '—'}
                      </span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="p-3 text-gray-700 text-xs font-mono">{lead.phone || '—'}</td>

                  {/* Email */}
                  <td className="p-3 text-gray-700 text-xs">{lead.email || '—'}</td>

                  {/* Budget */}
                  <td className="p-3 text-gray-700 text-xs font-semibold">
                    {lead.budget ? `${lead.currency || 'PKR'} ${lead.budget.toLocaleString()}` : '—'}
                  </td>

                  {/* Assigned To */}
                  <td className="p-3 text-xs text-gray-700">
                    {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                  </td>

                  {/* Dynamic Custom Fields */}
                  {customFields.filter(f => f.isVisible).map(f => (
                    <td key={f.id} className="p-3 text-xs text-gray-600">
                      {String(lead.customFields?.[f.fieldKey] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* TASK-ORIENTED LIST VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100">
          {leads.map(lead => (
            <div
              key={lead.id}
              onClick={() => router.push(`/crm/leads/${lead.id}`)}
              className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={e => {
                    e.stopPropagation();
                    handleSelect(lead.id);
                  }}
                  className="rounded"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{lead.fullName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {lead.companyName && <span>🏢 {lead.companyName}</span>}
                    {lead.phone && <span>📞 {lead.phone}</span>}
                    <span>🏷️ {lead.source}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PRIORITY_COLORS[lead.priority]}`}>
                  {lead.priority}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

