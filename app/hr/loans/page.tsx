'use client';

import React from 'react';
import {
  Landmark,
  Plus,
  Loader2,
  CheckCircle2,
  Banknote,
  Search,
  Eye,
  X,
  FileText,
  DollarSign,
  ArrowRight,
  Clock,
  Wallet,
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
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import { pkr } from '@/lib/hr-payroll-slip-utils';

export default function LoansPage() {
  const [loans, setLoans] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [selectedLoan, setSelectedLoan] = React.useState<any | null>(null);
  const [busy, setBusy] = React.useState('');

  const [form, setForm] = React.useState({
    employeeId: '',
    kind: 'loan',
    amount: '',
    installments: '6',
    reason: '',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [lList, eList] = await Promise.all([
        hrHcmService.loans(),
        hrEmployeesService.list().catch(() => []),
      ]);
      setLoans(lList);
      setEmployees(eList);
    } catch (err: any) {
      toast.error(err.message || 'Failed loading loans');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount) {
      toast.error('Select employee and enter loan amount');
      return;
    }
    setBusy('create');
    try {
      await hrHcmService.saveLoan({
        employeeId: form.employeeId,
        kind: form.kind,
        amount: Number(form.amount),
        installments: Number(form.installments || 1),
        reason: form.reason,
      });
      toast.success('Loan request submitted for executive approval');
      setShowRequestModal(false);
      setForm({ employeeId: '', kind: 'loan', amount: '', installments: '6', reason: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed submitting loan request');
    } finally {
      setBusy('');
    }
  };

  const handleUpdateStatus = async (loanId: string, status: 'Approved' | 'Disbursed' | 'Completed' | 'Rejected') => {
    setBusy(loanId);
    try {
      await hrHcmService.updateLoan(loanId, status);
      toast.success(`Loan status updated to ${status}`);
      setSelectedLoan(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed updating loan status');
    } finally {
      setBusy('');
    }
  };

  const filteredLoans = loans.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.employee || '').toLowerCase().includes(q) ||
      (l.kind || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q)
    );
  });

  const totalOutstanding = loans.reduce((s, l) => s + Number(l.remaining || 0), 0);

  return (
    <HRPage>
      <HRPageHeader
        title="Loans & Salary Advances"
        subtitle="End-to-end loan request, executive approval, disbursement, and automated payroll deduction schedule."
        backHref="/hr/dashboard"
        actions={
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-[#014582] font-extrabold text-xs shadow-md hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Request Loan / Advance
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Total Active Loans" value={loans.length} icon={Landmark} color="#014582" />
        <HRStatCard label="Pending Approvals" value={loans.filter((l) => l.status === 'Pending').length} icon={Clock} color="#F39C12" />
        <HRStatCard label="Active Repayments" value={loans.filter((l) => l.status === 'Approved' || l.status === 'Disbursed').length} icon={Banknote} color="#2ECC71" />
        <HRStatCard label="Total Outstanding Balance" value={pkr(totalOutstanding)} icon={Wallet} color="#E74C3C" />
      </div>

      <HRToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Filter loans by employee name, kind, or status..."
      />

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE4EE] shadow-sm">
          <Landmark className="w-12 h-12 text-[#7A8FA6] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-extrabold text-[#1A1A2E]">No Loan Records Found</h3>
          <p className="text-xs text-[#7A8FA6] mt-1">
            Submit salary advance or loan requests to begin tracking repayment schedules.
          </p>
        </div>
      ) : (
        <HRCard title="Loan & Advance Repayment Schedule">
          <HRTable columns={['Employee', 'Kind', 'Total Amount', 'Monthly Deduction', 'Outstanding Balance', 'Status', 'Actions']}>
            {filteredLoans.map((l, idx) => (
              <HRTableRow key={l.id || idx}>
                <HRTableCell>
                  <div className="flex items-center gap-2.5">
                    <HRAvatar name={l.employee || 'Emp'} />
                    <span className="font-extrabold text-[#1A1A2E]">{l.employee || 'Staff'}</span>
                  </div>
                </HRTableCell>
                <HRTableCell>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#014582]/10 text-[#014582]">
                    {l.kind || 'loan'}
                  </span>
                </HRTableCell>
                <HRTableCell><span className="font-bold text-[#1A1A2E]">{pkr(l.amount || 0)}</span></HRTableCell>
                <HRTableCell><span className="font-semibold text-red-600">{pkr(l.monthlyDeduct || (l.amount / (l.installments || 1)))} / mo</span></HRTableCell>
                <HRTableCell><span className="font-extrabold text-[#014582]">{pkr(l.remaining ?? l.amount)}</span></HRTableCell>
                <HRTableCell><HRStatusBadge status={l.status || 'Pending'} /></HRTableCell>
                <HRTableCell>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLoan(l)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F0F4F8] text-[#014582] hover:bg-[#014582] hover:text-white transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    {l.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(l.id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-green-600 text-white hover:bg-green-700 transition-all"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}

      {/* MODAL: Request Loan */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-[#1A1A2E]">Request Loan or Salary Advance</h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
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
                      {emp.name || emp.employeeCode} ({emp.department || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Kind</label>
                  <select
                    value={form.kind}
                    onChange={(e) => setForm({ ...form, kind: e.target.value })}
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  >
                    <option value="loan">Company Loan</option>
                    <option value="advance">Salary Advance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 100000"
                    className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Installment Count (Months)</label>
                <input
                  type="number"
                  value={form.installments}
                  onChange={(e) => setForm({ ...form, installments: e.target.value })}
                  min={1}
                  max={36}
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                  required
                />
              </div>

              {Number(form.amount) > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-extrabold text-[#014582] flex justify-between">
                  <span>Monthly Payroll Deduction:</span>
                  <span>{pkr(Math.round(Number(form.amount) / Math.max(1, Number(form.installments || 1))))} / mo</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Reason / Purpose</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2}
                  placeholder="Reason for advance..."
                  className="w-full bg-white rounded-xl py-2 px-3 text-xs text-[#1A1A2E] border border-[#DDE4EE]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDE4EE]">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A8FA6] hover:bg-[#F0F4F8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'create'}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b] flex items-center gap-2"
                >
                  {busy === 'create' && <Loader2 className="w-4 h-4 animate-spin" />} Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Installment Schedule Breakdown */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDE4EE]">
            <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1A2E]">{selectedLoan.employee}</h3>
                <p className="text-xs text-[#7A8FA6] capitalize">{selectedLoan.kind} Details & Schedule</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="p-1 rounded-lg text-[#7A8FA6] hover:bg-[#F0F4F8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F0F4F8]">
                <div>
                  <span className="text-[#7A8FA6]">Total Amount</span>
                  <p className="font-extrabold text-[#1A1A2E] text-sm">{pkr(selectedLoan.amount)}</p>
                </div>
                <div>
                  <span className="text-[#7A8FA6]">Remaining Balance</span>
                  <p className="font-extrabold text-red-600 text-sm">{pkr(selectedLoan.remaining ?? selectedLoan.amount)}</p>
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Monthly Deduction</span>
                <span className="font-bold text-[#014582]">{pkr(selectedLoan.monthlyDeduct || (selectedLoan.amount / (selectedLoan.installments || 1)))}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Installment Count</span>
                <span className="font-bold text-[#1A1A2E]">{selectedLoan.installments || 1} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE4EE]">
                <span className="text-[#7A8FA6]">Approval Status</span>
                <HRStatusBadge status={selectedLoan.status} />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#DDE4EE] flex items-center justify-between">
              {selectedLoan.status === 'Pending' ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedLoan.id, 'Approved')}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-green-600 text-white hover:bg-green-700"
                >
                  Approve Request
                </button>
              ) : selectedLoan.status === 'Approved' ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedLoan.id, 'Disbursed')}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#014582] text-white hover:bg-[#013a6b]"
                >
                  Mark Disbursed
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
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
