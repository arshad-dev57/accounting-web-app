'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MfgCard, MFG_PIE_COLORS } from '../ui';

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #DDE4EE',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#1A1A2E',
};

function PieDonut({ rows }: { rows: Array<{ label: string; value: number; color?: string }> }) {
  if (!rows || rows.length === 0) {
    return <p className="py-10 text-center text-xs text-[#7A8FA6]">No data available.</p>;
  }
  const colored = rows.map((r, i) => ({ ...r, color: r.color || MFG_PIE_COLORS[i % MFG_PIE_COLORS.length] }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={colored} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={2}>
          {colored.map((r, i) => (
            <Cell key={i} fill={r.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DashboardCharts({ prod, mat, qual, mach }: {
  prod: any;
  mat: any;
  qual: any;
  mach: any;
}) {
  return (
    <div className="space-y-6">
      {/* PRODUCTION — Planned vs Actual */}
      <MfgCard title="Production — Planned vs Actual">
        {prod.plannedVsActual?.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={prod.plannedVsActual} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="planned" name="Planned" fill="#0FA3E0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#2ECC71" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <p className="py-10 text-center text-xs text-[#7A8FA6]">No production data.</p>}
      </MfgCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MfgCard title="Daily Production">
          {prod.daily?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={prod.daily} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="produced" name="Produced" fill="#8E44AD" radius={[4, 4, 0, 0]} />
                <Line dataKey="planned" name="Planned" stroke="#014582" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <p className="py-10 text-center text-xs text-[#7A8FA6]">No daily data.</p>}
        </MfgCard>

        <MfgCard title="Monthly Production">
          {prod.monthly?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={prod.monthly} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="produced" name="Produced" fill="#014582" radius={[4, 4, 0, 0]} />
                <Line dataKey="planned" name="Planned" stroke="#F39C12" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <p className="py-10 text-center text-xs text-[#7A8FA6]">No monthly data.</p>}
        </MfgCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MfgCard title="Production by Product"><PieDonut rows={prod.byProduct || []} /></MfgCard>
        <MfgCard title="Production by Branch / Factory"><PieDonut rows={prod.byBranch || []} /></MfgCard>
      </div>

      {/* MATERIALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MfgCard title="Material Consumption"><PieDonut rows={mat.consumption || []} /></MfgCard>
        <MfgCard title="Raw Material Availability"><PieDonut rows={mat.rawAvailability || []} /></MfgCard>
        <MfgCard title="WIP vs Finished Goods">
          <PieDonut rows={[...(mat.wip || []), ...(mat.finishedGoods || [])]} />
        </MfgCard>
      </div>

      {mat.shortage && mat.shortage.length > 0 && (
        <MfgCard title="Top Material Shortages">
          <div className="space-y-2">
            {mat.shortage.slice(0, 8).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#1A1A2E]">{s.productName || s.label || 'Material'}</span>
                <span className="text-[#E74C3C] font-bold">{s.shortageQty ?? s.value ?? 0}</span>
              </div>
            ))}
          </div>
        </MfgCard>
      )}

      {/* QUALITY */}
      <MfgCard title="Quality Summary">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          {[
            ['Passed', qual.passed || 0, '#2ECC71'],
            ['Failed', qual.failed || 0, '#E74C3C'],
            ['Rework', qual.rework || 0, '#F39C12'],
            ['Scrap', qual.scrap || 0, '#E74C3C'],
            ['Reject Rate', `${qual.rejectionRate || 0}%`, '#8E44AD'],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-xl border border-[#DDE4EE] p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6]">{label}</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
        {qual.byStatus?.length ? (
          <div className="max-w-sm mx-auto"><PieDonut rows={qual.byStatus} /></div>
        ) : <p className="py-6 text-center text-xs text-[#7A8FA6]">No quality data.</p>}
      </MfgCard>

      {/* MACHINES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MfgCard title="Machine Status">
          <PieDonut rows={mach.statusChart?.length ? mach.statusChart : [
            { label: 'Running', value: mach.machinesRunning || 0, color: '#2ECC71' },
            { label: 'Idle', value: mach.machinesIdle || 0, color: '#7A8FA6' },
            { label: 'Maintenance', value: mach.machinesMaintenance || 0, color: '#8E44AD' },
          ]} />
        </MfgCard>
        <MfgCard title="Machine KPIs">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Utilization', `${mach.utilization || 0}%`],
              ['Downtime (hrs)', mach.downtime || 0],
              ['Machines Running', mach.machinesRunning || 0],
              ['Machines Idle', mach.machinesIdle || 0],
              ['Under Maintenance', mach.machinesMaintenance || 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-[#F4F7FB] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6]">{label}</p>
                <p className="text-2xl font-extrabold text-[#1A1A2E] mt-1">{value}</p>
              </div>
            ))}
          </div>
        </MfgCard>
      </div>
    </div>
  );
}
