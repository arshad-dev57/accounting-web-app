'use client';

import { useEffect, useState } from 'react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';
import {
  salesAgentSettingsService,
  type SalesAgentSettings,
} from '@/lib/sales-agent-settings-service';

type AgentOption = {
  id: string;
  name: string;
  commissionRate?: number;
  commissionType?: string;
};

type Props = {
  salesPersonId: string;
  commissionPercent: string;
  onSalesPersonChange: (id: string, agent?: AgentOption | null) => void;
  onCommissionPercentChange: (value: string) => void;
  className?: string;
};

export default function SalesAgentFields({
  salesPersonId,
  commissionPercent,
  onSalesPersonChange,
  onCommissionPercentChange,
  className = '',
}: Props) {
  const [settings, setSettings] = useState<SalesAgentSettings | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cfg, listRes] = await Promise.all([
          salesAgentSettingsService.getSettings(),
          fetch('/api/distributor/salespersons?status=Active&limit=200', {
            headers: browserCompanyAuthHeaders(),
            cache: 'no-store',
          }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setSettings(cfg);
        setAgents(Array.isArray(listRes?.data) ? listRes.data : []);
      } catch {
        if (!cancelled) {
          setSettings(null);
          setAgents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !settings?.enableSalesAgents) {
    return null;
  }

  const selected = agents.find((a) => a.id === salesPersonId) || null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sales Agent{settings.agentRequired ? ' *' : ''}
        </label>
        <select
          value={salesPersonId}
          onChange={(e) => {
            const id = e.target.value;
            const agent = agents.find((a) => a.id === id) || null;
            onSalesPersonChange(id, agent);
            if (settings.trackCommission && agent) {
              if (String(agent.commissionType || 'flat').toLowerCase() === 'flat') {
                onCommissionPercentChange(String(agent.commissionRate ?? 0));
              }
            }
          }}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
          required={settings.agentRequired}
        >
          <option value="">Select agent…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.commissionType === 'slab' ? ' (Slab rules)' : ''}
            </option>
          ))}
        </select>
      </div>

      {settings.trackCommission && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commission %
            {selected?.commissionType === 'slab' ? (
              <span className="ml-1 text-xs font-normal text-gray-500">
                (pre-filled from slab rules; editable)
              </span>
            ) : null}
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={commissionPercent}
            onChange={(e) => onCommissionPercentChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014582]"
          />
        </div>
      )}
    </div>
  );
}
