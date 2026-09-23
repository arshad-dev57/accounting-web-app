'use client';

import React from 'react';
import {
  Star,
  Target,
  Plus,
  Loader2,
  CheckCircle2,
  Search,
  Eye,
  X,
  Award,
  TrendingUp,
  ShieldCheck,
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
  HRAvatar,
} from '../ui';
import { hrWorkforceService } from '@/lib/hr-workforce-service';
import { hrHcmService } from '@/lib/hr-hcm-service';

function RatingStars({ value }: { value: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${
            s <= Math.round(value)
              ? 'text-amber-500 fill-amber-500'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-extrabold text-[#1A1A2E]">{Number(value || 0).toFixed(1)}</span>
    </div>
  );
}

export default function PerformancePage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    employeeId: '',
    period: '2026-Q3 Appraisal',
    reviewer: '',
    rating: '4',
    goals: '',
    strengths: '',
    improvements: '',
    developmentPlan: '',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [reviews, people] = await Promise.all([
        hrWorkforceService.reviews(),
        hrWorkforceService.employees(),
      ]);
      setRows(reviews);
      setEmployees(people);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load performance reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.period) {
      toast.error('Select employee and appraisal cycle period');
      return;
    }
    setSaving(true);
    try {
      await hrWorkforceService.createReview({
        ...form,
        rating: Number(form.rating || 4),
        status: 'Draft',
      });
      toast.success('Performance review initiated');
      setShowModal(false);
      setForm({
        employeeId: '',
        period: '2026-Q3 Appraisal',
        reviewer: '',
        rating: '4',
        goals: '',
        strengths: '',
        improvements: '',
        developmentPlan: '',
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Could not save review');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string, status: string) => {
    try {
      await hrWorkforceService.updateReview(reviewId, { status });
      toast.success(`Review status updated to ${status}`);
      setSelectedReview(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update review status');
    }
  };

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.employee || r.employeeName || '').toLowerCase().includes(q) ||
      (r.period || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    );
  });

  const avgRating = rows.length
    ? (rows.reduce((s, r) => s + Number(r.rating || 0), 0) / rows.length).toFixed(1)
    : '4.0';

  return (
    <HRPage>
      <HRPageHeader
        title="Performance Reviews & Appraisals"
        subtitle="Manage employee performance cycles, KPI goals, manager reviews, ratings, and development plans."
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-[#014582] font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Start Review Cycle
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Total Reviews" value={rows.length} icon={Target} color="#014582" />
        <HRStatCard label="Average Rating" value={`${avgRating} / 5.0`} icon={Star} color="#F39C12" />
        <HRStatCard label="Completed / Finalized" value={rows.filter((r) => r.status === 'Finalized' || r.status === 'Acknowledged').length} icon={CheckCircle2} color="#2ECC71" />
        <HRStatCard label="Pending Manager Review" value={rows.filter((r) => r.status === 'Draft' || r.status === 'In Progress' || r.status === 'Pending').length} icon={ShieldCheck} color="#8E44AD" />
      </div>

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Search reviews by employee or cycle period..."
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE4EE] shadow-sm">
          <Target className="w-12 h-12 text-[#7A8FA6] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-[#1A1A2E]">No Performance Reviews Found</h3>
          <p className="text-xs text-[#7A8FA6] mt-1">
            Initiate a performance evaluation cycle to rate goals and record manager feedback.
          </p>
        </div>
      ) : (
        <HRCard title="Employee Appraisal Records">
          <HRTable columns={['Employee', 'Appraisal Period', 'Reviewer', 'Manager Rating', 'Status', 'Evaluation Action']}>
            {filteredRows.map((r, idx) => (
              <HRTableRow key={r.id || idx}>
                <HRTableCell>
                  <div className="flex items-center gap-2.5">
                    <HRAvatar name={r.employee || r.employeeName || 'Emp'} />
                    <span className="font-extrabold text-[#1A1A2E]">{r.employee || r.employeeName || 'Staff'}</span>
                  </div>
                </HRTableCell>
                <HRTableCell><span className="font-bold text-[#014582]">{r.period}</span></HRTableCell>
                <HRTableCell><span className="text-xs text-[#7A8FA6]">{r.reviewer || 'Line Manager'}</span></HRTableCell>
                <HRTableCell><RatingStars value={Number(r.rating || 0)} /></HRTableCell>
                <HRTableCell><HRStatusBadge status={r.status || 'Draft'} /></HRTableCell>
                <HRTableCell>
                  <button
                    type="button"
                    onClick={() => setSelectedReview(r)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Evaluate
                  </button>
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}

      {/* MODAL: Start Review Cycle */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-[#1A1A2E]">Initiate Performance Review</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Employee *</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.employeeCode} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Appraisal Period / Cycle *</label>
                  <input
                    type="text"
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder="e.g. 2026-Q3 Appraisal"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    value={form.reviewer}
                    onChange={(e) => setForm({ ...form, reviewer: e.target.value })}
                    placeholder="e.g. Line Manager Name"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                >
                  <option value="5">5.0 - Outstanding</option>
                  <option value="4">4.0 - Exceeds Expectations</option>
                  <option value="3">3.0 - Meets Expectations</option>
                  <option value="2">2.0 - Needs Improvement</option>
                  <option value="1">1.0 - Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Goals & Achievements</label>
                <textarea
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                  rows={2}
                  placeholder="Key deliverables and project achievements..."
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Initiate Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Evaluate / View Review */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <HRAvatar name={selectedReview.employee || 'Emp'} size="md" />
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1A2E]">{selectedReview.employee}</h3>
                  <p className="text-xs text-[#7A8FA6]">Cycle: {selectedReview.period}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F0F4F8] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#7A8FA6] font-bold uppercase">Overall Rating</span>
                  <RatingStars value={Number(selectedReview.rating || 0)} />
                </div>
                <HRStatusBadge status={selectedReview.status || 'Draft'} />
              </div>

              <div className="space-y-2">
                <p className="font-extrabold text-[#1A1A2E] text-[11px]">Goals & Achievements:</p>
                <p className="text-[#7A8FA6] p-3 rounded-xl border border-[#DDE4EE] bg-white">
                  {selectedReview.goals || 'No goals specified.'}
                </p>
              </div>

              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Reviewer</span>
                <span className="font-semibold text-[#1A1A2E]">{selectedReview.reviewer || 'Line Manager'}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#DDE4EE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedReview.status !== 'Finalized' && selectedReview.status !== 'Acknowledged' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedReview.id, 'Finalized')}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-green-600 text-white hover:bg-green-700"
                  >
                    Finalize Rating
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl border border-[#DDE4EE] text-[#7A8FA6] text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </HRPage>
  );
}
