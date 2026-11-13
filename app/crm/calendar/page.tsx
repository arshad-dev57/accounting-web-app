'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CalendarDays, Phone, Calendar, Activity,
  AlertCircle, List,
} from 'lucide-react';
import { getCalendarEvents, type CalendarEvent } from '@/lib/crm-api';

type ViewMode = 'month' | 'week' | 'agenda';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getEventColor(type: string) {
  if (type === 'activity') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (type === 'task') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (type === 'followup') return 'bg-purple-100 text-purple-700 border-purple-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function getEventIcon(type: string) {
  if (type === 'activity') return Activity;
  if (type === 'followup') return Phone;
  return Calendar;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let from: string, to: string;
      if (viewMode === 'month') {
        from = new Date(year, month, 1).toISOString().split('T')[0];
        to = new Date(year, month + 1, 0).toISOString().split('T')[0];
      } else if (viewMode === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        from = startOfWeek.toISOString().split('T')[0];
        to = endOfWeek.toISOString().split('T')[0];
      } else {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 30);
        from = start.toISOString().split('T')[0];
        to = end.toISOString().split('T')[0];
      }
      const data = await getCalendarEvents({ from, to });
      setEvents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Build calendar grid for month view
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date.startsWith(dateStr));
  };

  const navigate = (dir: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + dir);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + dir * 7);
      } else {
        d.setMonth(d.getMonth() + dir);
      }
      return d;
    });
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 text-sm">{events.length} events this period</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            {(['month', 'week', 'agenda'] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${viewMode === v ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => { setCurrentDate(new Date()); }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Today</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 min-w-48 text-center">
          {viewMode === 'month' || viewMode === 'agenda'
            ? `${MONTHS[month]} ${year}`
            : (() => {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              })()
          }
        </h2>
        <button onClick={() => navigate(1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
        {loading && <span className="text-sm text-gray-400 animate-pulse">Loading...</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-3 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarCells.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(isSelected ? null : dateStr)}
                  className={`min-h-24 p-2 border-b border-r border-gray-50 cursor-pointer transition-colors ${!day ? 'bg-gray-50/50' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  {day && (
                    <>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? 'bg-[#014582] text-white' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div key={ev.id} className={`text-xs px-1.5 py-0.5 rounded border truncate ${getEventColor(ev.type)}`}>
                            {ev.time ? ev.time.slice(0, 5) + ' ' : ''}{ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {Array.from({ length: 7 }, (_, i) => {
              const startOfWeek = new Date(currentDate);
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
              const day = new Date(startOfWeek);
              day.setDate(startOfWeek.getDate() + i);
              const dateStr = day.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const dayEvents = events.filter((e) => e.date.startsWith(dateStr));
              return (
                <div key={i} className={`p-3 border-r border-gray-50 ${isToday ? 'bg-blue-50/50' : ''}`}>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{DAYS[i]}</div>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-2 ${isToday ? 'bg-[#014582] text-white' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className={`text-xs px-2 py-1 rounded-lg border ${getEventColor(ev.type)}`}>
                        <p className="font-medium truncate">{ev.title}</p>
                        {ev.time && <p className="opacity-70">{ev.time.slice(0, 5)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {events.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-500 font-medium">No events this period</h3>
            </div>
          )}
          {events.map((ev) => {
            const Icon = getEventIcon(ev.type);
            return (
              <div key={ev.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="text-center min-w-14 flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{new Date(ev.date).toLocaleDateString('en', { month: 'short' })}</p>
                  <p className="text-2xl font-bold text-gray-800">{new Date(ev.date).getDate()}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getEventColor(ev.type).split(' ').filter(c => c.startsWith('bg-')).join(' ')}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{ev.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    {ev.time && <span>{ev.time.slice(0, 5)}</span>}
                    <span className="capitalize">{ev.type}</span>
                    {ev.status && <span className="capitalize">{ev.status}</span>}
                    {ev.assignedTo && <span>{ev.assignedTo.firstName} {ev.assignedTo.lastName}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected day event detail */}
      {selectedDay && viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-[#014582]/20 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <List className="w-4 h-4 text-[#014582]" />
            <h3 className="font-semibold text-gray-800">Events on {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          </div>
          {(() => {
            const dayEvents = events.filter((e) => e.date.startsWith(selectedDay));
            if (dayEvents.length === 0) return <p className="text-gray-400 text-sm">No events this day.</p>;
            return (
              <div className="space-y-3">
                {dayEvents.map((ev) => {
                  const Icon = getEventIcon(ev.type);
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getEventColor(ev.type).split(' ').filter(c => c.startsWith('bg-')).join(' ')}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{ev.type} · {ev.status}{ev.time ? ` · ${ev.time.slice(0, 5)}` : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
