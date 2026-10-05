'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Warehouse, Search, ArrowUpRight, Package, AlertTriangle } from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export default function Warehouse360Page() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const headers = browserCompanyAuthHeaders();
        const res = await fetch('http://localhost:5000/api/warehouse/locations', { headers });
        const json = await res.json();
        if (json.success || Array.isArray(json.data)) {
          setLocations(json.data || json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-[#014582]" />
          Multi-Warehouse 360 Analytics
        </h1>
        <p className="text-xs text-gray-500 mt-1">Warehouse Stock Valuation, Low Stock Items & Internal Stock Movements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading warehouses...</div>
        ) : locations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No locations found</div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{loc.name}</h3>
                  <p className="text-[11px] text-gray-400">{loc.code || 'MAIN-WH'}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#014582]">
                  {loc.type || 'Warehouse'}
                </span>
              </div>

              <div className="pt-2">
                <Link
                  href="/warehouse/dashboard"
                  className="w-full block text-center py-2 bg-[#014582] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-all shadow-sm"
                >
                  View Warehouse Stock
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
