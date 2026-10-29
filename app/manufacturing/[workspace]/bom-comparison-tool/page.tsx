'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GitCompare } from 'lucide-react';
import { HRCard, HRPage, HRTable, HRTableCell, HRTableRow } from '@/hr/ui';
import { mfgWorkspaceService, type MfgLinkOption, type MfgRow } from '@/lib/mfg-workspace-service';

type BomComponent = {
  componentId?: string;
  componentName?: string;
  quantity?: number;
  unitOfMeasure?: string;
};

export default function BomComparisonToolPage() {
  const [options, setOptions] = useState<MfgLinkOption[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [left, setLeft] = useState<MfgRow | null>(null);
  const [right, setRight] = useState<MfgRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void mfgWorkspaceService.linkOptions('bom').then(setOptions).catch(() => setOptions([]));
  }, []);

  const compare = useCallback(async () => {
    if (!leftId || !rightId) {
      setError('Select both Current BOM and New BOM');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [a, b] = await Promise.all([
        mfgWorkspaceService.detail('bom', leftId),
        mfgWorkspaceService.detail('bom', rightId)
      ]);
      setLeft(a.row);
      setRight(b.row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to compare BOMs');
      setLeft(null);
      setRight(null);
    } finally {
      setLoading(false);
    }
  }, [leftId, rightId]);

  const rows = useMemo(() => {
    const leftItems = (Array.isArray(left?.components) ? left?.components : []) as BomComponent[];
    const rightItems = (Array.isArray(right?.components) ? right?.components : []) as BomComponent[];
    const keys = new Set([
      ...leftItems.map((c) => String(c.componentId || c.componentName || '')),
      ...rightItems.map((c) => String(c.componentId || c.componentName || ''))
    ]);
    return [...keys].filter(Boolean).map((key) => {
      const a = leftItems.find((c) => String(c.componentId || c.componentName) === key);
      const b = rightItems.find((c) => String(c.componentId || c.componentName) === key);
      return {
        key,
        name: a?.componentName || b?.componentName || key,
        leftQty: a?.quantity ?? null,
        rightQty: b?.quantity ?? null,
        leftUom: a?.unitOfMeasure || '',
        rightUom: b?.unitOfMeasure || ''
      };
    });
  }, [left, right]);

  const selectCls =
    'w-full rounded border border-[#c7c7c7] bg-white px-2.5 py-2 text-[12.5px] text-[#171717] outline-none focus:border-[#014582]';

  return (
    <HRPage>
      <div className="mb-4 border-b border-[#e2e2e2] pb-3">
        <p className="text-[11px] text-[#7c7c7c]">Manufacturing · Tools</p>
        <h1 className="flex items-center gap-2 text-[18px] font-semibold text-[#171717]">
          <GitCompare className="h-4 w-4 text-[#525252]" />
          BOM Comparison Tool
        </h1>
        <p className="mt-0.5 text-[12px] text-[#7c7c7c]">Compare raw materials between two BOMs</p>
      </div>

      <HRCard title="Select BOMs">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-[12px]">
            <span className="mb-1 block text-[#525252]">Current BOM</span>
            <select className={selectCls} value={leftId} onChange={(e) => setLeftId(e.target.value)}>
              <option value="">Select…</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px]">
            <span className="mb-1 block text-[#525252]">New BOM</span>
            <select className={selectCls} value={rightId} onChange={(e) => setRightId(e.target.value)}>
              <option value="">Select…</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => void compare()}
          disabled={loading}
          className="mt-3 rounded bg-[#014582] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Comparing…' : 'Compare'}
        </button>
        {error && <p className="mt-2 text-sm text-[#e24c4c]">{error}</p>}
      </HRCard>

      {(left || right) && (
        <HRCard title="Comparison" className="mt-4">
          <div className="mb-3 grid gap-2 text-[12.5px] md:grid-cols-2">
            <p>
              <span className="text-[#7c7c7c]">Current: </span>
              {String(left?.bomNumber || '—')} · {String(left?.productName || '')}
            </p>
            <p>
              <span className="text-[#7c7c7c]">New: </span>
              {String(right?.bomNumber || '—')} · {String(right?.productName || '')}
            </p>
          </div>
          <HRTable columns={['Item', 'Current Qty', 'New Qty', 'Difference']}>
            {rows.map((row) => {
              const diff =
                row.leftQty === null || row.rightQty === null
                  ? '—'
                  : Number(row.rightQty) - Number(row.leftQty);
              return (
                <HRTableRow key={row.key}>
                  <HRTableCell>{row.name}</HRTableCell>
                  <HRTableCell>
                    {row.leftQty === null ? '—' : `${row.leftQty} ${row.leftUom}`.trim()}
                  </HRTableCell>
                  <HRTableCell>
                    {row.rightQty === null ? '—' : `${row.rightQty} ${row.rightUom}`.trim()}
                  </HRTableCell>
                  <HRTableCell>{diff}</HRTableCell>
                </HRTableRow>
              );
            })}
          </HRTable>
        </HRCard>
      )}
    </HRPage>
  );
}
