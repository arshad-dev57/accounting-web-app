'use client';

export default function InstallmentStatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  let cls = 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'paid') cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  else if (s === 'overdue') cls = 'bg-red-50 text-red-700 border-red-200';
  else if (s === 'partial') cls = 'bg-amber-50 text-amber-800 border-amber-200';
  else if (s === 'cancelled') cls = 'bg-zinc-100 text-zinc-500 border-zinc-200';

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}
