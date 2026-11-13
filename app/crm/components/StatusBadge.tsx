'use client';
import {
  STATUS_COLORS, OPPORTUNITY_STAGE_COLORS, PRIORITY_COLORS,
  TASK_STATUS_COLORS,
} from '@/lib/crm-api';

export function StatusBadge({ status, type = 'lead' }: { status: string; type?: 'lead' | 'opportunity' | 'priority' | 'task' }) {
  const colorMap =
    type === 'opportunity' ? OPPORTUNITY_STAGE_COLORS :
    type === 'priority' ? PRIORITY_COLORS :
    type === 'task' ? TASK_STATUS_COLORS :
    STATUS_COLORS;
  const cls = colorMap[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-[#014582] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}
