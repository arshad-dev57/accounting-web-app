'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, CheckSquare, Trash2, Edit, ChevronLeft, ChevronRight,
  AlertCircle, X, Save, GripVertical,
} from 'lucide-react';
import {
  getTasks, createTask, updateTask, deleteTask,
  TASK_STATUSES, TASK_STATUS_COLORS, PRIORITY_COLORS,
  type CRMTask,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

type ViewMode = 'list' | 'kanban';

function TaskModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<CRMTask>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'Open', priority: 'Medium', dueDate: '' });
  const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    await onSave(form).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder="Task title..." className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputCls}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className={inputCls}>
                {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Task details..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#014582] text-white rounded-xl text-sm font-medium hover:bg-[#01366a] flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTasks({
        page: viewMode === 'kanban' ? 1 : pagination.page,
        limit: viewMode === 'kanban' ? 200 : pagination.limit,
        search: search || undefined,
        status: filterStatus || undefined,
      });
      setTasks(result.tasks ?? []);
      setPagination((p) => ({
        ...p,
        total: Number(result.total) || 0,
        pages: Number(result.pages) || 1,
      }));
    } catch (e: any) {
      setError(e.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filterStatus, viewMode]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (data: Partial<CRMTask>) => {
    await createTask(data);
    toast.success('Task created!');
    setShowModal(false);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id).catch(() => {});
    fetchTasks();
  };

  const handleStatusDrop = async (newStatus: string) => {
    if (!draggingId) { setDragOverStatus(null); return; }
    const task = tasks.find((t) => t.id === draggingId);
    if (!task || task.status === newStatus) { setDraggingId(null); setDragOverStatus(null); return; }
    setTasks((prev) => prev.map((t) => t.id === draggingId ? { ...t, status: newStatus } : t));
    setDraggingId(null);
    setDragOverStatus(null);
    await updateTask(draggingId, { status: newStatus }).catch(() => fetchTasks());
  };

  const grouped = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<string, CRMTask[]>);

  return (
    <div className="space-y-4">
      {showModal && <TaskModal onClose={() => setShowModal(false)} onSave={handleCreate} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm">{Number(pagination.total || 0).toLocaleString()} total tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {(['list', 'kanban'] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${viewMode === v ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-medium hover:bg-[#01366a]">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search tasks..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]"
          />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {TASK_STATUSES.map((status) => {
            const cols = grouped[status] || [];
            const statusCls = TASK_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
            return (
              <div
                key={status}
                className={`flex-shrink-0 w-64 bg-white rounded-2xl border-2 transition-all ${dragOverStatus === status ? 'border-[#014582] bg-blue-50/50' : 'border-gray-100'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={() => handleStatusDrop(status)}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusCls}`}>{status}</span>
                  <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">{cols.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-32 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {cols.map((task) => (
                    <div key={task.id} draggable
                      onDragStart={() => setDraggingId(task.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                      className={`bg-white border rounded-xl p-3 cursor-grab hover:shadow-md transition-all ${draggingId === task.id ? 'opacity-50 border-[#014582]' : 'border-gray-100 shadow-sm'}`}>
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">{task.title}</p>
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 ml-1" />
                      </div>
                      {task.priority && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}>{task.priority}</span>
                      )}
                      {task.dueDate && <p className="text-xs text-gray-400 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                    </div>
                  ))}
                  {cols.length === 0 && <div className="text-center py-6 text-gray-300 text-xs">Drop here</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-500 font-medium mb-2">No tasks found</h3>
          <button onClick={() => setShowModal(true)} className="mt-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-medium">New Task</button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TASK_STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-700'}`}>{task.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {task.priority && <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600'}`}>{task.priority}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(task.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">{((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-600">{pagination.page} / {pagination.pages}</span>
                <button onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))} disabled={pagination.page === pagination.pages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
