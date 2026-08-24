'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Headset,
  ChevronDown,
  Phone,
  Search,
  Loader2,
  Mail,
  UserRound,
} from 'lucide-react';
import { MainHubSidebar } from '../../components/MainHubSidebar';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import { usePermissions } from '../../lib/usePermissions';
import { usersService } from '../users/service';
import type { User } from '../users/types';

function toDateKey(iso: string) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(key: string) {
  if (key === 'Unknown') return 'Unknown date';
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function RegisteredUsersPage() {
  const { user, loading: permLoading, canViewRegisteredUsers } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (permLoading) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (!canViewRegisteredUsers) {
      window.location.href = '/dashboard';
    }
  }, [permLoading, user, canViewRegisteredUsers]);

  useEffect(() => {
    if (!canViewRegisteredUsers) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await usersService.getRegisteredUsers();
        if (!cancelled) setUsers(res.data || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canViewRegisteredUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const key = toDateKey(u.createdAt);
      if (fromDate && key !== 'Unknown' && key < fromDate) return false;
      if (toDate && key !== 'Unknown' && key > toDate) return false;
      if (!q) return true;
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return name.includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q);
    });
  }, [users, search, fromDate, toDate]);

  const grouped = useMemo(() => {
    const map = new Map<string, User[]>();
    for (const user of filtered) {
      const key = toDateKey(user.createdAt);
      const list = map.get(key) || [];
      list.push(user);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/registered-users" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <TopBarBrand title="Registered Users" />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/support';
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Headset className="w-4 h-4" />
              <span>Support Ticket</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#014582]" />
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Registered users</h1>
              <p className="text-sm text-gray-500 mt-1">
                Who signed up, grouped by registration date.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-end">
              <label className="flex-1">
                <span className="block text-xs font-medium text-gray-500 mb-1">Search</span>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, email or phone"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
                  />
                </div>
              </label>
              <label>
                <span className="block text-xs font-medium text-gray-500 mb-1">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </label>
              <label>
                <span className="block text-xs font-medium text-gray-500 mb-1">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#014582]"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const t = todayKey();
                  setFromDate(t);
                  setToDate(t);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setSearch('');
                }}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Total registered</p>
                <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500">Showing</p>
                <p className="text-2xl font-bold text-[#014582]">{filtered.length}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading users…
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-4 text-sm">
                {error}
              </div>
            ) : grouped.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
                No users for this date range.
              </div>
            ) : (
              grouped.map(([day, list]) => (
                <section key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <CalendarDays className="w-4 h-4 text-[#014582]" />
                      {formatDayLabel(day)}
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {list.length} {list.length === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {list.map((user) => (
                      <li key={user.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#014582]/10 text-[#014582] flex items-center justify-center">
                            <UserRound className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-gray-600 capitalize">{user.role}</p>
                          <p className="text-xs text-gray-400">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
