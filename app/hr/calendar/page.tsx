'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, CalendarCheck2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRWorkflowNotice } from '../ui';
import { hrHolidaysService } from '@/lib/hr-holidays-service';
import { hrWorkforceService } from '@/lib/hr-workforce-service';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarViewPage() {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [holidays, setHolidays] = React.useState<{ date: string; name: string }[]>([]);
  const [leaves, setLeaves] = React.useState<{ from: string; to: string; employee: string }[]>([]);

  React.useEffect(() => {
    hrHolidaysService.list().then((rows) => setHolidays(rows.map((h) => ({ date: h.date, name: h.name })))).catch(() => {});
    hrWorkforceService.leaves().then((rows) => setLeaves(rows.filter((l: any) => l.status === 'Approved').map((l: any) => ({ from: l.from, to: l.to, employee: l.employee })))).catch(() => {});
  }, []);

  const now = new Date();
  const view = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const holidayDays = holidays.filter((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  }).map((h) => ({ day: new Date(h.date + 'T00:00:00').getDate(), name: h.name }));

  const leaveDays = new Set<number>();
  leaves.forEach((l) => {
    const from = new Date(l.from + 'T00:00:00');
    const to = new Date(l.to + 'T00:00:00');
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === year && d.getMonth() === month) leaveDays.add(d.getDate());
    }
  });

  return (
    <HRPage>
      <HRPageHeader
        title="Calendar View"
        subtitle="Holidays and approved leave"
        backHref="/hr/dashboard"
      />

      <HRWorkflowNotice title="Unified people calendar" detail="Blue days are holidays from Holiday Management. Purple days have approved leave. Weekend and today are marked separately." />

      <HRCard>
        <div className="flex items-center justify-between mb-5">
          <button type="button" onClick={() => setMonthOffset((v) => v - 1)} className="w-8 h-8 rounded-lg bg-[#F0F4F8] flex items-center justify-center hover:bg-[#014582]/10">
            <ChevronLeft className="w-4 h-4 text-[#014582]" />
          </button>
          <p className="text-sm font-extrabold text-[#1A1A2E]">
            {view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <button type="button" onClick={() => setMonthOffset((v) => v + 1)} className="w-8 h-8 rounded-lg bg-[#F0F4F8] flex items-center justify-center hover:bg-[#014582]/10">
            <ChevronRight className="w-4 h-4 text-[#014582]" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6] py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = isCurrentMonth && day === today;
            const holiday = holidayDays.find((h) => h.day === day);
            const onLeave = leaveDays.has(day);
            const isWeekend = new Date(year, month, day).getDay() % 6 === 0;
            return (
              <div
                key={day}
                title={holiday?.name}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold border ${
                  holiday
                    ? 'bg-[#014582] text-white border-[#014582]'
                    : onLeave
                      ? 'bg-[#8E44AD]/15 text-[#8E44AD] border-[#8E44AD]/40'
                      : isToday
                        ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]'
                        : isWeekend
                          ? 'bg-[#F0F4F8] text-[#7A8FA6] border-[#DDE4EE]'
                          : 'bg-white text-[#1A1A2E] border-[#DDE4EE]'
                }`}
              >
                {day}
                {holiday && <span className="text-[7px] mt-0.5 opacity-80">{holiday.name.slice(0, 8)}</span>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#DDE4EE] text-[10px] font-semibold text-[#7A8FA6]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#014582]" /> Holiday</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#2ECC71]/30" /> Today</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#F0F4F8]" /> Weekend</span>
          <span className="flex items-center gap-1.5"><CalendarCheck2 className="w-3.5 h-3.5 text-[#8E44AD]" /> Approved leave</span>
        </div>
      </HRCard>
    </HRPage>
  );
}
