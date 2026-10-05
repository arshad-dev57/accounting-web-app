'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, Eye, Plus, Search, Award, DollarSign, Users } from 'lucide-react';
import { fetchSalespersons } from '@/lib/distributor-service';

export default function SalespersonHubPage() {
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchSalespersons();
        if (res.success) setSalespersons(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = salespersons.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.territory?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#014582]" />
            Salesperson 360 & Target Performance
          </h1>
          <p className="text-xs text-gray-500 mt-1">Manage Sales Representatives, Monthly Targets & Assigned Customers</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search salesperson or territory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#014582]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading salespersons...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No salespersons found</div>
        ) : (
          filtered.map((sp) => (
            <div key={sp.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{sp.name}</h3>
                  <p className="text-[11px] text-gray-400">{sp.salespersonNumber} &bull; {sp.territory || 'No Territory'}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#014582]">
                  {sp.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Target Progress</span>
                  <span className="font-bold text-gray-900">{sp.targetAchievement}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-[#014582] h-full rounded-full"
                    style={{ width: Math.min(100, sp.targetAchievement) + "%" }}
                  ></div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400 block">Total Sales</span>
                    <span className="font-bold text-emerald-600">PKR {sp.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400 block">Customers</span>
                    <span className="font-bold text-gray-900">{sp.assignedCustomersCount} Assigned</span>
                  </div>
                </div>
              </div>

              <Link
                href={'/sales/salespersons'}
                className="w-full block text-center py-2 bg-[#014582] text-white rounded-xl text-xs font-semibold hover:bg-blue-900 transition-all shadow-sm"
              >
                Salesperson 360
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
