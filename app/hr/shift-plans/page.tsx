'use client';

import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';

export default function ShiftPlansPage() {
  return (
    <HcmCrudPage
      title="Shift plans"
      subtitle="Start/end, grace, night and flexible shifts"
      notice="The previous local Shifts screen still exists. These backend shift plans are used by Roster. Geofence attendance is not replaced."
      columns={['Name', 'Time', 'Grace', 'Night', 'Flexible']}
      load={() => hrHcmService.shifts()}
      create={(input) => hrHcmService.saveShift(input)}
      fields={[
        { key: 'name', label: 'Shift name' },
        { key: 'startTime', label: 'Start (HH:MM)' },
        { key: 'endTime', label: 'End (HH:MM)' },
        { key: 'graceMinutes', label: 'Grace minutes', type: 'number' },
        { key: 'breakMinutes', label: 'Break minutes', type: 'number' },
      ]}
      rowCells={(r) => (
        <>
          <HRTableCell className="font-bold">{r.name}</HRTableCell>
          <HRTableCell>{r.startTime} – {r.endTime}</HRTableCell>
          <HRTableCell>{r.graceMinutes}m</HRTableCell>
          <HRTableCell>{r.isNight ? 'Yes' : 'No'}</HRTableCell>
          <HRTableCell>{r.isFlexible ? 'Yes' : 'No'}</HRTableCell>
        </>
      )}
    />
  );
}
