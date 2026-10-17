'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import {
  Settings as FiSettings,
  Save as FiSave,
  Percent as FiPercent,
  DollarSign as FiDollarSign,
  Shield as FiShield,
  Layers as FiLayers,
  CheckCircle2 as FiCheckCircle,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard
} from '@/components/trade/TradeUI';

export default function TradingSettingsPage() {
  const [minMarginPct, setMinMarginPct] = useState(20.0);
  const [autoAllocateStock, setAutoAllocateStock] = useState(true);
  const [priceListPriority, setPriceListPriority] = useState('CustomerContractFirst');
  const [defaultCreditDays, setDefaultCreditDays] = useState(30);
  const [maxCustomerExposureUsd, setMaxCustomerExposureUsd] = useState(250000);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Trading Management Settings"
        description="Global parameters for commercial wholesale margins, automated stock allocation, and tiered pricing resolution."
        badge="System Configuration"
      />

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600" />
            Trading configuration preferences saved successfully for the current session.
          </div>
        )}

        {/* Profitability & Margins */}
        <TradeCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FiPercent className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Profit Margin & Markup Guardrails
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Gross Margin Hurdle (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="60"
                value={minMarginPct}
                onChange={(e) => setMinMarginPct(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sales orders pricing below this gross margin will require managerial approval.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pricing Engine Hierarchy
              </label>
              <select
                value={priceListPriority}
                onChange={(e) => setPriceListPriority(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="CustomerContractFirst">
                  1. Customer Negotiated Agreement → 2. Tier Matrix → 3. MSRP
                </option>
                <option value="TierFirst">
                  1. Tier Matrix → 2. Customer Agreement → 3. MSRP
                </option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Resolution sequence when determining sales order unit prices.
              </p>
            </div>
          </div>
        </TradeCard>

        {/* Stock Allocation & Warehouse */}
        <TradeCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FiLayers className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Stock Reservation Policy
            </h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="autoAllocate"
                checked={autoAllocateStock}
                onChange={(e) => setAutoAllocateStock(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <label htmlFor="autoAllocate" className="text-xs font-semibold text-slate-800">
                  Automatic Stock Reservation on Order Confirmation
                </label>
                <p className="text-[11px] text-slate-500">
                  Immediately earmark unreserved inventory when a Trading Sales Order moves from Draft to Confirmed status.
                </p>
              </div>
            </div>
          </div>
        </TradeCard>

        {/* Credit Limit & Terms */}
        <TradeCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FiShield className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Credit Policy & Customer Exposure
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Credit Terms (Days)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={defaultCreditDays}
                onChange={(e) => setDefaultCreditDays(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Standard payment window for approved wholesale accounts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Credit Limit Exposure ($)
              </label>
              <input
                type="number"
                step="10000"
                value={maxCustomerExposureUsd}
                onChange={(e) => setMaxCustomerExposureUsd(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum unpaid accounts receivable balance per wholesale debtor.
              </p>
            </div>
          </div>
        </TradeCard>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <FiSave className="w-4 h-4" />
            Save Trading Settings
          </button>
        </div>
      </form>
    </TradePage>
  );
}
