'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Power,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradePagination,
  TradeModal,
} from '@/components/trade/TradeUI';
import { FieldLabel } from '@/components/import/ImportSelectors';
import importApi, { type ImportCarrier } from '@/lib/import-api';

const CARRIER_TYPES = ['Ocean', 'Air', 'Road', 'Rail', 'Multimodal', 'Other'];

export default function ImportCarriersPage() {
  const [items, setItems] = useState<ImportCarrier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ImportCarrier | null>(null);
  const [saving, setSaving] = useState(false);
  const limit = 12;

  const [form, setForm] = useState({
    code: '',
    name: '',
    carrierType: 'Ocean',
    scacCode: '',
    iataCode: '',
    country: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    servicesNotes: '',
    trackingUrlTemplate: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await importApi.listCarriers({
        page,
        limit,
        search: search || undefined,
        status: statusFilter,
        carrierType: typeFilter,
      });
      setItems(res.items || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load carriers');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setForm({
      code: '',
      name: '',
      carrierType: 'Ocean',
      scacCode: '',
      iataCode: '',
      country: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      servicesNotes: '',
      trackingUrlTemplate: '',
      status: 'Active',
    });
    setIsOpen(true);
  };

  const openEdit = (c: ImportCarrier) => {
    setEditing(c);
    setFormError(null);
    setForm({
      code: c.code || '',
      name: c.name || '',
      carrierType: c.carrierType || 'Ocean',
      scacCode: c.scacCode || '',
      iataCode: c.iataCode || '',
      country: c.country || '',
      contactPerson: c.contactPerson || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      website: c.website || '',
      servicesNotes: c.servicesNotes || '',
      trackingUrlTemplate: c.trackingUrlTemplate || '',
      status: c.status || 'Active',
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Carrier email format is invalid');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await importApi.updateCarrier(editing.id, form);
      } else {
        await importApi.createCarrier(form);
      }
      setIsOpen(false);
      load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (err?.response?.data?.code === 'DUPLICATE_CARRIER_CODE'
          ? 'Carrier code already exists'
          : 'Save failed');
      setFormError(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await importApi.toggleCarrierStatus(id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Carriers & Freight Forwarders"
        subtitle="Company-scoped ocean, air, road, rail and multimodal transport providers"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<Truck className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> New Carrier
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <TradeCard>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search code, name, country…"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
          >
            <option value="All">All types</option>
            {CARRIER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
          >
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading carriers…
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">No carriers found. Create one to use on shipments.</div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={['Code', 'Name', 'SCAC / IATA', 'Type', 'Country', 'Contact', 'Status', 'Actions']}
            />
            <TradeTableBody>
              {items.map((c) => (
                <TradeTableRow key={c.id}>
                  <TradeTableCell className="font-mono text-gray-500">{c.code}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">
                    {c.name}
                    {c.trackingUrlTemplate ? (
                      <a
                        href={c.trackingUrlTemplate.replace('{ref}', 'TRACK')}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[10px] text-blue-600 underline font-normal"
                      >
                        Tracking URL preview
                      </a>
                    ) : null}
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-[11px] text-gray-600">
                    {[c.scacCode, c.iataCode].filter(Boolean).join(' / ') || '—'}
                  </TradeTableCell>
                  <TradeTableCell>{c.carrierType}</TradeTableCell>
                  <TradeTableCell>{c.country || '—'}</TradeTableCell>
                  <TradeTableCell>
                    <div className="text-[11px]">
                      <p>{c.contactPerson || '—'}</p>
                      <p className="text-gray-400">{c.email || c.phone || ''}</p>
                    </div>
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={c.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="px-2 py-1 rounded-lg border text-[11px] font-bold text-[#014582]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(c.id)}
                        className="px-2 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Power className="w-3 h-3" />
                        {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        )}

        <div className="mt-4">
          <TradePagination
            currentPage={page}
            totalPages={Math.ceil(total / limit) || 1}
            totalItems={total}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      </TradeCard>

      <TradeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Edit Carrier' : 'Create Carrier'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-3">
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Code</FieldLabel>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Auto if blank"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <FieldLabel required>Legal / display name</FieldLabel>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <FieldLabel>Carrier type</FieldLabel>
              <select
                value={form.carrierType}
                onChange={(e) => setForm((f) => ({ ...f, carrierType: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              >
                {CARRIER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>SCAC code</FieldLabel>
              <input
                value={form.scacCode}
                onChange={(e) => setForm((f) => ({ ...f, scacCode: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                placeholder="Ocean SCAC"
              />
            </div>
            <div>
              <FieldLabel>IATA code</FieldLabel>
              <input
                value={form.iataCode}
                onChange={(e) => setForm((f) => ({ ...f, iataCode: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                placeholder="Air IATA"
              />
            </div>
            <div>
              <FieldLabel>Country</FieldLabel>
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <FieldLabel>Contact person</FieldLabel>
              <input
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <FieldLabel>Website</FieldLabel>
              <input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>Address</FieldLabel>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>Service notes</FieldLabel>
              <textarea
                value={form.servicesNotes}
                onChange={(e) => setForm((f) => ({ ...f, servicesNotes: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>Tracking URL template</FieldLabel>
              <input
                value={form.trackingUrlTemplate}
                onChange={(e) => setForm((f) => ({ ...f, trackingUrlTemplate: e.target.value }))}
                placeholder="https://track.example.com/{ref}"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            {editing && (
              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl border text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Update Carrier' : 'Create Carrier'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
