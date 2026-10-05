'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calculator,
  Building2,
  Users
} from 'lucide-react';
import { checkCreditLimit } from '@/lib/distributor-service';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export default function CreditControlWorkspacePage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [proposedAmount, setProposedAmount] = useState('50000');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const headers = browserCompanyAuthHeaders();
        const res = await fetch('http://localhost:5000/api/warehouse/customers', { headers });
        const json = await res.json();
        if (json.success || Array.isArray(json.data)) {
          const list = json.data || json;
          setCustomers(list);
          if (list.length > 0) setSelectedCustomerId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleRunCheck = async () => {
    if (!selectedCustomerId) return;
    try {
      setLoadingCheck(true);
      const res = await checkCreditLimit(selectedCustomerId, parseFloat(proposedAmount) || 0);
      if (res.success) setCheckResult(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            Credit Control & Exposure Workspace
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time Exposure Evaluation: AR Outstanding + Open Sales Orders + Unbilled Deliveries vs Credit Policy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Simulator Tool */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#014582]" />
            Credit Exposure Calculator
          </h2>
          <p className="text-xs text-gray-500">Test proposed Sales Order or Invoice against customer policy</p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:border-[#014582]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Proposed Transaction Amount (PKR)</label>
              <input
                type="number"
                value={proposedAmount}
                onChange={(e) => setProposedAmount(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-[#014582]"
              />
            </div>

            <button
              onClick={handleRunCheck}
              disabled={loadingCheck}
              className="w-full py-2.5 bg-[#014582] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-all shadow-md mt-2"
            >
              {loadingCheck ? 'Calculating Exposure...' : 'Run Credit Check Checkpoint'}
            </button>
          </div>
        </div>

        {/* Checkpoint Result Display Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900">Credit Checkpoint Analysis</h2>

          {!checkResult ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Select a customer and click &quot;Run Credit Check Checkpoint&quot; to evaluate exposure.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Decision Alert Pill */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  checkResult.decision === 'BLOCK'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : checkResult.decision === 'WARN'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {checkResult.decision === 'BLOCK' ? (
                    <XCircle className="w-6 h-6 text-rose-600" />
                  ) : checkResult.decision === 'WARN' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  )}
                  <div>
                    <div className="text-sm font-extrabold uppercase">{checkResult.decision} DECISION</div>
                    <div className="text-xs mt-0.5 font-medium">{checkResult.message}</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-white/80 rounded-lg shadow-sm">
                  Policy: {checkResult.creditPolicy}
                </span>
              </div>

              {/* Exposure Component Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <div className="text-gray-500 font-semibold">Customer Credit Limit</div>
                  <div className="text-sm font-bold text-gray-900">PKR {checkResult.creditLimit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-semibold">AR Outstanding</div>
                  <div className="text-sm font-bold text-amber-700">PKR {checkResult.arOutstanding.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-semibold">Open Orders Exposure</div>
                  <div className="text-sm font-bold text-blue-700">PKR {checkResult.openOrdersAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-semibold">Unbilled Deliveries</div>
                  <div className="text-sm font-bold text-purple-700">PKR {checkResult.unbilledDeliveryAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-semibold">Total Current Exposure</div>
                  <div className="text-sm font-extrabold text-gray-900">PKR {checkResult.currentExposure.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-semibold">Projected Remaining</div>
                  <div className={`text-sm font-extrabold ${checkResult.projectedRemainingCredit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    PKR {checkResult.projectedRemainingCredit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
