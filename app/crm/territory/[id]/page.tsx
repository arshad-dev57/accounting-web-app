'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Plus, Trash2, ArrowLeft, Info, CheckCircle2,
  Target, RefreshCw, Folder, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getTerritory,
  getTerritories,
  updateTerritory,
  deleteTerritory,
  type TerritoryRecord,
  type TerritoryTarget,
} from '@/lib/crm-api';
import {
  DeskField,
  DeskFormShell,
  DeskPageHeader,
  DeskSideCard,
  deskInput,
  deskSelect,
} from '../../components/ErpDeskForm';
import NewTerritoryPage from '../new/page';

const ITEM_GROUP_OPTIONS = [
  'All Item Groups',
  'Products',
  'Services',
  'Raw Material',
  'Consumable',
  'Sub Assemblies',
];

const FISCAL_YEAR_OPTIONS = [
  '2026-2027',
  '2026',
  '2025-2026',
  '2025',
  '2027-2028',
];

const DISTRIBUTION_OPTIONS = [
  'Monthly Distribution',
  'Evenly Distributed',
  'Quarterly',
  'Bi-Annual',
];

export default function TerritoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const territoryId = resolvedParams.id;

  // Support temporary new-record docname pattern like 'new-territory-yzjvqrxkiv'
  if (territoryId.startsWith('new-territory-')) {
    return <NewTerritoryPage />;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [existingTerritories, setExistingTerritories] = useState<TerritoryRecord[]>([]);

  // Form State
  const [territoryName, setTerritoryName] = useState('');
  const [parentTerritory, setParentTerritory] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [territoryManager, setTerritoryManager] = useState('');
  const [targets, setTargets] = useState<TerritoryTarget[]>([]);
  const [childTerritories, setChildTerritories] = useState<TerritoryRecord[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTerritory(territoryId).catch(() => null),
      getTerritories().catch(() => []),
    ])
      .then(([current, all]) => {
        const list = Array.isArray(all) ? (all as unknown as TerritoryRecord[]) : [];
        setExistingTerritories(list);

        if (current) {
          setTerritoryName(current.name || '');
          setTerritoryManager(current.territoryManager || '');
          setIsGroup(Boolean(current.isGroup));

          // Resolve parent name
          if (current.parentTerritory) {
            setParentTerritory(current.parentTerritory);
          } else if (current.parentId) {
            const p = list.find((x) => x.id === current.parentId);
            setParentTerritory(p ? p.name : '');
          }

          if (Array.isArray(current.targets)) {
            setTargets(current.targets);
          }

          // Find children of this territory
          const kids = list.filter(
            (t) => t.parentId === current.id || t.parentTerritory === current.name
          );
          setChildTerritories(kids);
          if (kids.length > 0) setIsGroup(true);
        } else {
          toast.error('Territory not found');
        }
      })
      .finally(() => setLoading(false));
  }, [territoryId]);

  const handleAddTarget = () => {
    setTargets((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        itemGroup: 'All Item Groups',
        fiscalYear: '2026-2027',
        targetQty: '',
        targetAmount: '',
        distributionId: 'Monthly Distribution',
      },
    ]);
  };

  const handleUpdateTarget = (index: number, field: keyof TerritoryTarget, value: any) => {
    setTargets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveTarget = (index: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== index));
  };

  const totalTargetQty = targets.reduce(
    (sum, t) => sum + (Number(t.targetQty) || 0),
    0
  );
  const totalTargetAmount = targets.reduce(
    (sum, t) => sum + (Number(t.targetAmount) || 0),
    0
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = territoryName.trim();
    if (!name) {
      toast.error('Territory Name is required');
      return;
    }

    let parentId: string | null = null;
    if (parentTerritory) {
      const matched = existingTerritories.find(
        (t) => t.name.toLowerCase() === parentTerritory.toLowerCase()
      );
      if (matched && matched.id !== territoryId) {
        parentId = matched.id;
      }
    }

    setSaving(true);
    try {
      await updateTerritory(territoryId, {
        name,
        parentId,
      } as any);

      toast.success('Territory updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update territory');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${territoryName}"?`)) return;
    setDeleting(true);
    try {
      await deleteTerritory(territoryId);
      toast.success('Territory deleted');
      router.push('/crm/territory');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete territory');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
        Loading territory details…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* ── Form header ───────────────────────── */}
      <DeskPageHeader
        title={territoryName || 'Territory'}
        dirty={false}
        saving={saving}
        onSave={handleSave}
        onCancel={() => router.push('/crm/territory')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/crm/territory/new?parent=${encodeURIComponent(territoryName)}`}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Child
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      />

      <form onSubmit={handleSave}>
        <DeskFormShell
          side={
            <div className="space-y-3">
              <DeskSideCard title="Hierarchy Guidance">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#014582] shrink-0 mt-0.5" />
                    <p>
                      <strong>Group Territories:</strong> Can contain child territories.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Leaf Territories:</strong> Can be selected on Leads, Customers, and Sales transactions.
                    </p>
                  </div>
                </div>
              </DeskSideCard>

              {childTerritories.length > 0 && (
                <DeskSideCard title={`Child Territories (${childTerritories.length})`}>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {childTerritories.map((k) => (
                      <Link
                        key={k.id}
                        href={`/crm/territory/${k.id}`}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-100 text-gray-700"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3 h-3 text-[#014582]" />
                          {k.name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </DeskSideCard>
              )}

              {targets.length > 0 && (
                <DeskSideCard title="Budget Summary">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Total Targets:</span>
                      <span className="font-semibold text-gray-800">{targets.length}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Total Qty:</span>
                      <span className="font-semibold text-gray-800">{totalTargetQty.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Total Amount:</span>
                      <span className="font-semibold text-emerald-700 font-mono">
                        {totalTargetAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </DeskSideCard>
              )}
            </div>
          }
        >
          {/* ── Section: Details ───────────────────────── */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#014582]" />
                Territory Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  <DeskField label="Territory Name" required>
                    <input
                      type="text"
                      required
                      value={territoryName}
                      onChange={(e) => setTerritoryName(e.target.value)}
                      className={deskInput}
                    />
                  </DeskField>

                  <DeskField label="Parent Territory">
                    <select
                      value={parentTerritory}
                      onChange={(e) => setParentTerritory(e.target.value)}
                      className={deskSelect}
                    >
                      <option value="">No Parent (Root Territory)</option>
                      {existingTerritories
                        .filter((t) => t.id !== territoryId)
                        .map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </DeskField>

                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isGroup}
                        onChange={(e) => setIsGroup(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                      />
                      <div>
                        <span className="text-xs font-semibold text-gray-800">Is Group</span>
                        <p className="text-[11px] text-gray-500 leading-normal mt-0.5">
                          Only leaf nodes are allowed in transactions. Check this if the territory will have child territories.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <DeskField label="Territory Manager">
                    <input
                      type="text"
                      value={territoryManager}
                      onChange={(e) => setTerritoryManager(e.target.value)}
                      placeholder="Select or enter Sales Person / Manager"
                      className={deskInput}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Assigned sales person responsible for this territory.
                    </p>
                  </DeskField>
                </div>
              </div>
            </div>

            {/* ── Section Break: Territory Targets ───────────────────────── */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#014582]" />
                    Territory Targets
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Set Item Group-wise budgets on this Territory. You can also include seasonality by setting the Distribution.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddTarget}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f6] hover:bg-gray-200 text-gray-800 rounded-md text-xs font-medium border border-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              {/* Targets Editable Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Item Group</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Fiscal Year *</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Target Qty</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Target Amount</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Target Distribution</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {targets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No targets set yet. Click &quot;Add Row&quot; to assign sales targets for this territory.
                          </td>
                        </tr>
                      ) : (
                        targets.map((row, index) => (
                          <tr key={row.id || index} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 text-center text-gray-400 font-mono">
                              {index + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.itemGroup || ''}
                                onChange={(e) =>
                                  handleUpdateTarget(index, 'itemGroup', e.target.value)
                                }
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              >
                                {ITEM_GROUP_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.fiscalYear || ''}
                                onChange={(e) =>
                                  handleUpdateTarget(index, 'fiscalYear', e.target.value)
                                }
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              >
                                {FISCAL_YEAR_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0"
                                value={row.targetQty || ''}
                                onChange={(e) =>
                                  handleUpdateTarget(index, 'targetQty', e.target.value)
                                }
                                placeholder="0"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs text-right focus:bg-white focus:border-[#014582]/40"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.targetAmount || ''}
                                onChange={(e) =>
                                  handleUpdateTarget(index, 'targetAmount', e.target.value)
                                }
                                placeholder="0.00"
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs text-right font-mono focus:bg-white focus:border-[#014582]/40"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={row.distributionId || ''}
                                onChange={(e) =>
                                  handleUpdateTarget(index, 'distributionId', e.target.value)
                                }
                                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded text-xs focus:bg-white focus:border-[#014582]/40"
                              >
                                {DISTRIBUTION_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTarget(index)}
                                className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {targets.length > 0 && (
                      <tfoot>
                        <tr className="bg-[#f8f9fa] border-t border-gray-200 font-semibold text-gray-700">
                          <td colSpan={3} className="py-2.5 px-4 text-right">
                            Total:
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {totalTargetQty.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                            {totalTargetAmount.toLocaleString()}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <div className="p-2.5 bg-[#f8f9fa] border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddTarget}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DeskFormShell>
      </form>
    </div>
  );
}

