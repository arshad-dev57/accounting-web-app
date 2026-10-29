'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { HRCard } from '../ui';
import type { HrChart, HrDashboardChart } from '../../../lib/hr-workspace-service';

export const CHART_COLORS = ['#014582', '#0FA3E0', '#2ECC71', '#F39C12', '#E74C3C', '#8E44AD', '#16A085', '#9B59B6'];

export function HrChartCard({ chart, height = 256 }: { chart: HrChart | HrDashboardChart; height?: number }) {
  if (!chart) return null;
  const hasSecondary = 'chartType' in chart ? false : chart.points.some((point) => point.secondary !== undefined);
  const data = chart.points.map((point) => ({ ...point, name: point.label || '—' }));

  return (
    <HRCard title={chart.label}>
      {data.length === 0 ? (
        <div style={{ height }} className="flex items-center justify-center text-xs text-[#7A8FA6]">
          No rows in this company yet.
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {hasSecondary ? (
              <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EE" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="value" name="Joined" stroke="#014582" strokeWidth={2} />
                <Line type="monotone" dataKey="secondary" name="Left" stroke="#E74C3C" strokeWidth={2} />
              </LineChart>
            ) : ('chartType' in chart && chart.chartType === 'line') ? (
              <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EE" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#014582" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }} barCategoryGap="24%">
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EE" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </HRCard>
  );
}
