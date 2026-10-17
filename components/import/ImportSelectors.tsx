'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Building2,
  Package,
  Truck,
  Loader2,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { TradeModal, TradePagination } from '@/components/trade/TradeUI';
import { supplierService, type Supplier } from '@/api/supplier/route';
import { productService, type Product } from '@/api/product/route';
import { apiClient } from '@/lib/api-client';
import importApi, { type ImportCarrier } from '@/lib/import-api';

type CurrencyOption = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces?: number;
};

function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CurrencySelect({
  value,
  onChange,
  className = '',
  disabled,
}: {
  value: string;
  onChange: (code: string, currency?: CurrencyOption) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/api/currencies?activeOnly=true')
      .then((res) => {
        if (cancelled) return;
        const list = (res.data?.data || res.data || []) as CurrencyOption[];
        setOptions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <select
        disabled={disabled || loading}
        value={value}
        onChange={(e) => {
          const code = e.target.value;
          onChange(
            code,
            options.find((o) => o.code === code)
          );
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582]"
      >
        <option value="">{loading ? 'Loading currencies…' : 'Select currency…'}</option>
        {options.map((c) => (
          <option key={c.id || c.code} value={c.code}>
            {c.code} — {c.name} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}

export function SupplierSelectField({
  selected,
  onSelect,
  allowCreate = true,
}: {
  selected: { id?: string; name?: string; country?: string; code?: string } | null;
  onSelect: (supplier: Supplier) => void;
  allowCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 text-xs">
          {selected?.name ? (
            <div>
              <p className="font-semibold text-gray-900 truncate">{selected.name}</p>
              <p className="text-[10px] text-gray-400">
                {[selected.code, selected.country].filter(Boolean).join(' · ') || 'Selected supplier'}
              </p>
            </div>
          ) : (
            <span className="text-gray-400">No supplier selected</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a]"
        >
          <Building2 className="w-3.5 h-3.5" /> Select Supplier
        </button>
      </div>
      <SupplierPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(s) => {
          onSelect(s);
          setOpen(false);
        }}
        allowCreate={allowCreate}
      />
    </div>
  );
}

export function ProductSelectButton({
  onSelect,
  label = 'Add Products',
}: {
  onSelect: (products: Product[]) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold hover:bg-blue-50"
      >
        <Package className="w-3.5 h-3.5" /> {label}
      </button>
      <ProductPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        multi
        onSelect={(products) => {
          onSelect(products);
          setOpen(false);
        }}
      />
    </>
  );
}

export function CarrierSelectField({
  selected,
  onSelect,
  allowCreate = true,
}: {
  selected: { id?: string; name?: string; code?: string; carrierType?: string } | null;
  onSelect: (carrier: ImportCarrier) => void;
  allowCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 text-xs">
          {selected?.name ? (
            <div>
              <p className="font-semibold text-gray-900 truncate">
                {selected.name}
                {selected.code ? (
                  <span className="font-mono font-normal text-gray-500"> ({selected.code})</span>
                ) : null}
              </p>
              <p className="text-[10px] text-gray-400">{selected.carrierType || 'Carrier'}</p>
            </div>
          ) : (
            <span className="text-gray-400">No carrier selected</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a]"
        >
          <Truck className="w-3.5 h-3.5" /> Select Carrier
        </button>
      </div>
      <CarrierPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(c) => {
          onSelect(c);
          setOpen(false);
        }}
        allowCreate={allowCreate}
      />
    </div>
  );
}

export function SupplierPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowCreate = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplier: Supplier) => void;
  allowCreate?: boolean;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const limit = 8;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierService.getSuppliers({
        page,
        limit,
        search: debounced.trim() || undefined,
        status: 'active',
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load suppliers');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await supplierService.createSupplier({
        name: newName.trim(),
        country: newCountry.trim() || 'Pakistan',
        status: 'active',
      } as Partial<Supplier>);
      onSelect(created);
    } catch (e: any) {
      setError(e.message || 'Failed to create supplier');
    } finally {
      setCreating(false);
    }
  };

  return (
    <TradeModal isOpen={isOpen} onClose={onClose} title="Select Supplier" maxWidth="max-w-3xl">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, code, country…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="border border-gray-100 rounded-xl overflow-hidden min-h-[220px]">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No suppliers found</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                <tr>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Country</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id || (s as any)._id} className="border-t border-gray-50 hover:bg-blue-50/40">
                    <td className="px-3 py-2 font-mono text-gray-500">{(s as any).code || '—'}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-3 py-2 text-gray-600">{(s as any).country || '—'}</td>
                    <td className="px-3 py-2">{(s as any).status || 'active'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#014582] text-white text-[11px] font-bold"
                      >
                        <Check className="w-3 h-3" /> Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <TradePagination
          currentPage={page}
          totalPages={Math.ceil(total / limit) || 1}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
        />
        {allowCreate && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Quick create supplier</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Legal / display name"
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
              <input
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="Country"
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="button"
              disabled={creating || !newName.trim()}
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold text-[#014582] disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> {creating ? 'Creating…' : 'Create & Select'}
            </button>
          </div>
        )}
      </div>
    </TradeModal>
  );
}

export function ProductPickerModal({
  isOpen,
  onClose,
  onSelect,
  multi = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (products: Product[]) => void;
  multi?: boolean;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Record<string, Product>>({});
  const limit = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({
        page,
        limit,
        search: debounced.trim() || undefined,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total ?? res.count ?? res.data?.length ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);

  useEffect(() => {
    if (isOpen) {
      setPicked({});
      void load();
    }
  }, [isOpen, load]);

  const toggle = (p: Product) => {
    const id = p.id || (p as any)._id;
    if (!multi) {
      onSelect([p]);
      return;
    }
    setPicked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = p;
      return next;
    });
  };

  return (
    <TradeModal
      isOpen={isOpen}
      onClose={onClose}
      title={multi ? 'Add Products' : 'Select Product'}
      maxWidth="max-w-3xl"
      actions={
        multi ? (
          <button
            type="button"
            disabled={!Object.keys(picked).length}
            onClick={() => onSelect(Object.values(picked))}
            className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
          >
            Add {Object.keys(picked).length || ''} selected
          </button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search SKU or product name…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200"
          />
        </div>
        <div className="border border-gray-100 rounded-xl overflow-hidden min-h-[220px]">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No products found</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                <tr>
                  {multi && <th className="px-3 py-2" />}
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">UOM</th>
                  <th className="text-right px-3 py-2">Price</th>
                  {!multi && <th className="px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const id = p.id || (p as any)._id;
                  const checked = Boolean(picked[id]);
                  return (
                    <tr
                      key={id}
                      className={`border-t border-gray-50 hover:bg-blue-50/40 ${checked ? 'bg-blue-50/60' : ''}`}
                    >
                      {multi && (
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={checked} onChange={() => toggle(p)} />
                        </td>
                      )}
                      <td className="px-3 py-2 font-mono text-gray-500">{p.sku || '—'}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{p.name}</td>
                      <td className="px-3 py-2">{(p as any).unit || (p as any).uom || 'PCS'}</td>
                      <td className="px-3 py-2 text-right">
                        {(p as any).purchasePrice ?? (p as any).sellingPrice ?? '—'}
                      </td>
                      {!multi && (
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => toggle(p)}
                            className="px-2.5 py-1 rounded-lg bg-[#014582] text-white text-[11px] font-bold"
                          >
                            Select
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <TradePagination
          currentPage={page}
          totalPages={Math.ceil(total / limit) || 1}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
        />
      </div>
    </TradeModal>
  );
}

export function CarrierPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowCreate = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (carrier: ImportCarrier) => void;
  allowCreate?: boolean;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ImportCarrier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Ocean');
  const [creating, setCreating] = useState(false);
  const limit = 8;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await importApi.listCarriers({
        page,
        limit,
        search: debounced.trim() || undefined,
        status: 'Active',
      });
      setRows(res.items || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load carriers');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await importApi.createCarrier({
        name: newName.trim(),
        carrierType: newType,
        status: 'Active',
      });
      onSelect(created);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create carrier');
    } finally {
      setCreating(false);
    }
  };

  return (
    <TradeModal isOpen={isOpen} onClose={onClose} title="Select Carrier / Freight Forwarder" maxWidth="max-w-3xl">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search carrier code or name…"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200"
            />
          </div>
          {allowCreate && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold text-[#014582]"
            >
              {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showCreate ? 'Cancel' : 'New'}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {showCreate && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Carrier name"
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
            >
              {['Ocean', 'Air', 'Road', 'Rail', 'Multimodal', 'Other'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={creating || !newName.trim()}
              onClick={handleCreate}
              className="col-span-2 px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create & Select Carrier'}
            </button>
          </div>
        )}
        <div className="border border-gray-100 rounded-xl overflow-hidden min-h-[200px]">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">No carriers found</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                <tr>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Country</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-blue-50/40">
                    <td className="px-3 py-2 font-mono text-gray-500">{c.code}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {c.name}
                      {[c.scacCode, c.iataCode].filter(Boolean).length > 0 ? (
                        <span className="block text-[10px] font-mono font-normal text-gray-400">
                          {[c.scacCode, c.iataCode].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{c.carrierType}</td>
                    <td className="px-3 py-2">{c.country || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onSelect(c)}
                        className="px-2.5 py-1 rounded-lg bg-[#014582] text-white text-[11px] font-bold"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <TradePagination
          currentPage={page}
          totalPages={Math.ceil(total / limit) || 1}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
        />
      </div>
    </TradeModal>
  );
}

export type ImportPortOption = {
  id: string;
  unLocode: string;
  name: string;
  country: string;
  countryCode?: string | null;
  portType?: string;
};

export function PortSelect({
  value,
  onChange,
  className = '',
  disabled,
  required,
}: {
  value: string;
  onChange: (portId: string, port?: ImportPortOption | null) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [options, setOptions] = useState<ImportPortOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    importApi
      .listPorts()
      .then((list) => {
        if (!cancelled) setOptions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <select
        disabled={disabled || loading}
        required={required}
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          onChange(
            id,
            options.find((o) => o.id === id) || null
          );
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582]"
      >
        <option value="">{loading ? 'Loading ports…' : 'Select port (UN/LOCODE)…'}</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.unLocode}) — {p.country}
            {p.portType ? ` · ${p.portType}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#DDE4EE] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#DDE4EE] bg-[#f8fafc]">
        <h3 className="text-sm font-bold text-[#1A1A2E]">{title}</h3>
        {subtitle && <p className="text-[11px] text-[#7A8FA6] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
      {children}
      {required ? <span className="text-red-500 ml-0.5">*</span> : null}
    </label>
  );
}
