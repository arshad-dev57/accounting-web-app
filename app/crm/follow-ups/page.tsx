'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Phone, MessageSquare,
  Users, Plus, Search, Filter, Check, X, ArrowRight, CheckCircle,
} from 'lucide-react';
import {
  getFollowUps, createFollowUp, completeFollowUp, getLeads,
  type LeadFollowUp, type Lead,
} from '@/lib/crm-api';
import toast from 'react-hot-toast';

export default function FollowUpsPage() {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    leadId: '',
    followUpDate: new Date().toISOString().split('T')[0],
    followUpTime: '10:00',
    type: 'Phone Call',
    notes: '',
  });

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFollowUps();
      setFollowUps(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollowUps();
    getLeads({ limit: 100 }).then(res => setLeads(res.leads || [])).catch(() => {});
  }, [loadFollowUps]);

  const handleComplete = async (id: string) => {
    try {
      await completeFollowUp(id);
      toast.success('Marked as completed!');
      loadFollowUps();
    } catch {
      toast.error('Failed to complete follow-up');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId) {
      toast.error('Please select a lead');
      return;
    }
    try {
      await createFollowUp(formData);
      toast.success('Follow-up scheduled!');
      setShowScheduleModal(false);
      setFormData({
        leadId: '',
        followUpDate: new Date().toISOString().split('T')[0],
        followUpTime: '10:00',
        type: 'Phone Call',
        notes: '',
      });
      loadFollowUps();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule');
    }
  };

  const now = new Date();
  const filtered = followUps.filter(f => {
    const d = new Date(f.followUpDate);
    const isOverdue = f.status === 'Pending' && d < now;

    if (activeTab === 'pending') return f.status === 'Pending' && !isOverdue;
    if (activeTab === 'overdue') return isOverdue;
    if (activeTab === 'completed') return f.status === 'Completed';
    return true;
  }).filter(f => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      f.lead?.fullName?.toLowerCase().includes(s) ||
      f.lead?.companyName?.toLowerCase().includes(s) ||
      f.notes?.toLowerCase().includes(s) ||
      f.type?.toLowerCase().includes(s)
    );
  });

  const pendingCount = followUps.filter(f => f.status === 'Pending' && new Date(f.followUpDate) >= now).length;
  const overdueCount = followUps.filter(f => f.status === 'Pending' && new Date(f.followUpDate) < now).length;
  const completedCount = followUps.filter(f => f.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Follow-ups</h1>
          <p className="text-gray-500 text-sm">Schedule, track calls, and manage upcoming reminders</p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#014582] text-white rounded-xl text-sm font-semibold hover:bg-[#01366a] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Schedule Follow-up
        </button>
      </div>

      {/* Tabs / Filter Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { key: 'pending', label: 'Upcoming', count: pendingCount, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { key: 'overdue', label: 'Overdue', count: overdueCount, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { key: 'completed', label: 'Completed', count: completedCount, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { key: 'all', label: 'All Follow-ups', count: followUps.length, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === t.key ? `${t.bg} ring-2 ring-[#014582]/20 shadow-xs` : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.label}</p>
            <p className={`text-2xl font-bold mt-1 ${t.color}`}>{t.count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter follow-ups by lead, company, or note..."
          className="flex-1 text-sm outline-none"
        />
      </div>

      {/* Follow-up Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No follow-ups found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === 'pending'
              ? 'No upcoming tasks scheduled. Enjoy your day or add one!'
              : 'No follow-up records found matching this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isDone = item.status === 'Completed';
            const dateStr = new Date(item.followUpDate).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            });
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center justify-between gap-4 transition-all hover:border-gray-300 ${
                  isDone ? 'opacity-70 bg-gray-50/50 border-gray-200' : 'border-gray-200/90'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => !isDone && handleComplete(item.id)}
                    disabled={isDone}
                    className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-600 text-transparent hover:text-green-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 hover:text-[#014582] cursor-pointer" onClick={() => router.push(`/crm/leads/${item.leadId}`)}>
                        {item.lead?.fullName}
                      </span>
                      {item.lead?.companyName && (
                        <span className="text-xs text-gray-500">({item.lead.companyName})</span>
                      )}
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-sm text-gray-600 line-clamp-1">{item.notes}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <Clock className="w-3.5 h-3.5" /> {dateStr} {item.followUpTime ? `at ${item.followUpTime}` : ''}
                      </span>
                      {item.assignedTo && (
                        <span>Assigned to: {item.assignedTo.firstName} {item.assignedTo.lastName}</span>
                      )}
                      {item.lead?.phone && <span>📞 {item.lead.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/crm/leads/${item.leadId}`)}
                    className="p-2 text-gray-400 hover:text-[#014582] rounded-lg hover:bg-gray-50"
                    title="View Lead"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Schedule Lead Follow-up</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Select Lead *</label>
                <select
                  required
                  value={formData.leadId}
                  onChange={e => setFormData(p => ({ ...p, leadId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                >
                  <option value="">-- Choose a Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.fullName} {l.companyName ? `(${l.companyName})` : ''} - {l.phone || l.email || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Follow-up Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.followUpDate}
                    onChange={e => setFormData(p => ({ ...p, followUpDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.followUpTime}
                    onChange={e => setFormData(p => ({ ...p, followUpTime: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Follow-up Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">In-Person Meeting</option>
                  <option value="Demo">Product Demo</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Notes / Agenda</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="What is the objective of this follow-up?"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#014582] text-white rounded-xl text-sm font-semibold hover:bg-[#01366a]"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

