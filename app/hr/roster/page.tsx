'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRWorkflowNotice } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

export default function RosterPage() {
  const [shifts, setShifts] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [employeeId, setEmployeeId] = React.useState('');
  const [shiftId, setShiftId] = React.useState('');
  const [workDate, setWorkDate] = React.useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [s, e, r] = await Promise.all([
        hrHcmService.shifts(),
        hrEmployeesService.list(),
        hrHcmService.roster(),
      ]);
      setShifts(s);
      setEmployees(e);
      setRows(r);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { void load(); }, []);

  return (
    <HRPage>
      <HRPageHeader title="Roster & scheduling" subtitle="Daily / weekly shift assignment" backHref="/hr/dashboard" />
      <HRWorkflowNotice title="Works with existing shifts" detail="This roster stores employee-to-shift assignments on the backend. Existing auto attendance still uses office geofence, not the roster clock." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HRCard title="Assign shift">
          <div className="space-y-3">
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm">
              <option value="">Employee</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className="w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm">
              <option value="">Shift</option>
              {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.startTime}-{s.endTime}</option>)}
            </select>
            <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="w-full rounded-xl border border-[#DDE4EE] px-3 py-2 text-sm" />
            <button
              type="button"
              className="w-full bg-[#014582] text-white rounded-xl py-2.5 text-sm font-bold"
              onClick={async () => {
                try {
                  await hrHcmService.saveRoster({ employeeId, shiftId, workDate });
                  toast.success('Roster saved');
                  await load();
                } catch (error: any) {
                  toast.error(error.message || 'Save failed');
                }
              }}
            >
              Save assignment
            </button>
          </div>
        </HRCard>
        <div className="lg:col-span-2">
          <HRCard title="Scheduled shifts">
            {loading ? <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
              <HRTable columns={['Date', 'Employee', 'Shift', 'Time']}>
                {rows.map((r) => (
                  <HRTableRow key={r.id}>
                    <HRTableCell>{r.workDate}</HRTableCell>
                    <HRTableCell className="font-bold">{r.employee}</HRTableCell>
                    <HRTableCell>{r.shift}</HRTableCell>
                    <HRTableCell>{r.startTime} – {r.endTime}</HRTableCell>
                  </HRTableRow>
                ))}
              </HRTable>
            )}
          </HRCard>
        </div>
      </div>
    </HRPage>
  );
}
