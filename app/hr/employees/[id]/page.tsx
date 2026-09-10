'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRStatusBadge, HRWorkflowNotice, HRStatCard } from '../../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { Fingerprint, PlaneTakeoff, Wallet, ClipboardCheck } from 'lucide-react';

export default function EmployeeDossierPage() {
  const params = useParams();
  const id = String(params.id || '');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('profile');

  React.useEffect(() => {
    if (!id) return;
    hrHcmService.dossier(id).then(setData).catch((e) => toast.error(e.message || 'Failed to load')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <HRPage><div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#014582]" /></div></HRPage>;
  if (!data) return <HRPage><p className="p-6 text-sm">Employee not found.</p></HRPage>;

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'performance', label: 'Performance' },
    { id: 'docs', label: 'Documents' },
    { id: 'lifecycle', label: 'Lifecycle' },
  ];

  return (
    <HRPage>
      <HRPageHeader title={data.name} subtitle={`${data.employeeCode} · ${data.designation || ''} · ${data.department || ''}`} backHref="/hr/employees" />
      <HRWorkflowNotice title="Employee 360" detail="This dossier reads the existing employee, attendance, leave, payroll and performance records. Auto geofence check-in/out is unchanged." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HRStatCard label="Status" value={data.status} icon={Fingerprint} color="#014582" />
        <HRStatCard label="Leave types" value={(data.leaveBalances || []).length} icon={PlaneTakeoff} color="#F39C12" />
        <HRStatCard label="Payslips" value={(data.payrolls || []).length} icon={Wallet} color="#2ECC71" />
        <HRStatCard label="Reviews" value={(data.reviews || []).length} icon={ClipboardCheck} color="#8E44AD" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`px-3 py-2 rounded-xl text-xs font-bold ${tab === t.id ? 'bg-[#014582] text-white' : 'bg-white border border-[#DDE4EE] text-[#7A8FA6]'}`}>{t.label}</button>
        ))}
      </div>
      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HRCard title="Employment">
            <div className="space-y-2 text-sm">
              <p><span className="text-[#7A8FA6]">Manager</span><br /><b>{data.manager || '—'}</b></p>
              <p><span className="text-[#7A8FA6]">Office</span><br /><b>{data.office || '—'}</b></p>
              <p><span className="text-[#7A8FA6]">Type</span><br /><b>{data.employmentType} · {data.employeeType}</b></p>
              <p><span className="text-[#7A8FA6]">Shift</span><br /><b>{data.shift || '—'}</b></p>
              <p><span className="text-[#7A8FA6]">Cost center</span><br /><b>{data.costCenter || '—'}</b></p>
              {data.salary != null && <p><span className="text-[#7A8FA6]">Salary</span><br /><b>Rs {Number(data.salary).toLocaleString()}</b></p>}
              <p><span className="text-[#7A8FA6]">Live tracking</span><br /><b>{data.trackingEnabled ? 'Enabled' : 'Disabled'}</b></p>
            </div>
          </HRCard>
          <HRCard title="Leave balances">
            {(data.leaveBalances || []).map((b: any) => (
              <div key={b.id} className="flex justify-between text-sm border-b border-[#F0F4F8] py-2">
                <span>{b.type}</span>
                <b>{b.remaining} remaining</b>
              </div>
            ))}
          </HRCard>
        </div>
      )}
      {tab === 'attendance' && (
        <HRCard title="Attendance history">
          <HRTable columns={['Date', 'In', 'Out', 'Status']}>
            {(data.attendance || []).map((r: any) => (
              <HRTableRow key={r.id}>
                <HRTableCell>{r.workDate}</HRTableCell>
                <HRTableCell>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</HRTableCell>
                <HRTableCell>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</HRTableCell>
                <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}
      {tab === 'leave' && (
        <HRCard title="Leave history">
          <HRTable columns={['Type', 'From', 'To', 'Days', 'Status']}>
            {(data.leaves || []).map((r: any) => (
              <HRTableRow key={r.id}>
                <HRTableCell>{r.type}</HRTableCell>
                <HRTableCell>{r.from}</HRTableCell>
                <HRTableCell>{r.to}</HRTableCell>
                <HRTableCell>{r.days}</HRTableCell>
                <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}
      {tab === 'payroll' && (
        <HRCard title="Payroll history">
          <HRTable columns={['Period', 'Net', 'Status']}>
            {(data.payrolls || []).map((r: any) => (
              <HRTableRow key={r.id}>
                <HRTableCell>{r.period}</HRTableCell>
                <HRTableCell>Rs {Number(r.net || 0).toLocaleString()}</HRTableCell>
                <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        </HRCard>
      )}
      {tab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HRCard title="Reviews">
            {(data.reviews || []).map((r: any) => (
              <p key={r.id} className="text-sm border-b border-[#F0F4F8] py-2"><b>{r.period}</b> · rating {r.rating} · {r.status}</p>
            ))}
          </HRCard>
          <HRCard title="Goals / KPIs">
            {(data.goals || []).map((r: any) => (
              <p key={r.id} className="text-sm border-b border-[#F0F4F8] py-2"><b>{r.title}</b> · {r.progress}% · {r.kpi}</p>
            ))}
          </HRCard>
        </div>
      )}
      {tab === 'docs' && (
        <HRCard title="Documents">
          {(data.documents || []).map((r: any) => (
            <p key={r.id} className="text-sm border-b border-[#F0F4F8] py-2">{r.title} · {r.category} · exp {r.expiresAt || '—'}</p>
          ))}
        </HRCard>
      )}
      {tab === 'lifecycle' && (
        <HRCard title="Lifecycle events">
          {(data.lifecycle || []).map((r: any) => (
            <p key={r.id} className="text-sm border-b border-[#F0F4F8] py-2"><b>{r.type}</b> · {r.fromValue} → {r.toValue} · {r.effective}</p>
          ))}
        </HRCard>
      )}
    </HRPage>
  );
}
