'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Building2, Package, Loader2, Check, ChevronDown, Landmark } from 'lucide-react';
import { TradeModal, TradePagination } from '@/components/trade/TradeUI';
import { customerService, type Customer } from '@/api/customer/route';
import { productService, type Product } from '@/api/product/route';
import { bankAccountService, type BankAccount } from '@/lib/bank-accounts-service';
import { chartOfAccountService, type ChartOfAccount } from '@/lib/chart-of-accounts-service';
import exportApi, {
  type ExportOrder,
  type ExportPort,
  type ExportListQuery,
} from '@/lib/export-api';
import { apiClient } from '@/lib/api-client';

type CurrencyOption = {
  id?: string;
  code: string;
  name?: string;
  symbol?: string;
};

function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export interface SelectedCustomer {
  id?: string;
  name?: string;
  country?: string;
  code?: string;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get('/api/currencies?activeOnly=true')
      .then((res) => {
        if (cancelled) return;
        const list = (res.data?.data || res.data || []) as CurrencyOption[];
        setOptions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setError('Failed to load currencies');
        }
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
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582] disabled:bg-gray-50"
      >
        <option value="">{loading ? 'Loading currencies…' : 'Select currency…'}</option>
        {options.map((c) => (
          <option key={c.id || c.code} value={c.code}>
            {c.code} — {c.name || c.code}
            {c.symbol ? ` (${c.symbol})` : ''}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function CustomerSelectField({
  selected,
  onSelect,
  disabled,
}: {
  selected: SelectedCustomer | null;
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 text-xs">
        {selected?.name ? (
          <div>
            <p className="font-semibold text-gray-900 truncate">{selected.name}</p>
            <p className="text-[10px] text-gray-400">
              {[selected.code, selected.country].filter(Boolean).join(' · ') || 'Selected buyer'}
            </p>
          </div>
        ) : (
          <span className="text-gray-400">No overseas buyer selected</span>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] disabled:opacity-50"
      >
        <Building2 className="w-3.5 h-3.5" /> Select Buyer
      </button>
      <CustomerPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(c) => {
          onSelect(c);
          setOpen(false);
        }}
      />
    </div>
  );
}

export function CustomerPickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 8;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers({
        page,
        limit,
        search: debounced.trim() || undefined,
        status: 'Active',
      });
      setRows(res.data || []);
      setTotal(res.stats?.total ?? res.data?.length ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load customers');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  return (
    <TradeModal isOpen={isOpen} onClose={onClose} title="Select Overseas Buyer" maxWidth="max-w-3xl">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, number, country…"
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
            <div className="py-12 text-center text-gray-400 text-xs">No customers found</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                <tr>
                  <th className="text-left px-3 py-2">Number</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Country</th>
                  <th className="text-right px-3 py-2">Outstanding</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id || c._id}
                    className="border-t border-gray-50 hover:bg-blue-50/40 cursor-pointer"
                    onClick={() => onSelect(c)}
                  >
                    <td className="px-3 py-2 font-mono text-gray-500">{c.customerNumber || '—'}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {c.name}
                      {c.companyName ? (
                        <span className="block text-[10px] font-normal text-gray-400">{c.companyName}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.address?.country || '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {Number(c.outstandingBalance || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c);
                        }}
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
      </div>
    </TradeModal>
  );
}

export function ProductSelectButton({
  onSelect,
  label = 'Add Products',
  disabled,
}: {
  onSelect: (products: Product[]) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold hover:bg-blue-50 disabled:opacity-50"
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
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, Product>>({});
  const limit = 8;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getProducts({
        page,
        limit,
        search: debounced.trim() || undefined,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
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
        {error && <p className="text-xs text-red-600">{error}</p>}
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
                  <th className="text-right px-3 py-2">Stock</th>
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
                      <td className="px-3 py-2">{p.stockUnit || 'PCS'}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{p.currentStock ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{p.sellingPrice ?? '—'}</td>
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

export function OrderSelect({
  value,
  onChange,
  className = '',
  disabled,
  required,
  status,
}: {
  value: string;
  onChange: (orderId: string, order?: ExportOrder | null) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  status?: string;
}) {
  const [options, setOptions] = useState<ExportOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query: ExportListQuery = { limit: 200, status };
    exportApi
      .listOrders(query)
      .then((res) => {
        if (!cancelled) setOptions(res.items || []);
      })
      .catch((e: any) => {
        if (!cancelled) {
          setOptions([]);
          setError(e.message || 'Failed to load export orders');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="relative">
        <select
          disabled={disabled || loading}
          required={required}
          value={value}
          onChange={(e) => {
            const id = e.target.value;
            onChange(id, options.find((o) => o.id === id) || null);
          }}
          className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582] disabled:bg-gray-50"
        >
          <option value="">{loading ? 'Loading export orders…' : 'Select export order…'}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNumber} — {o.customerName} · {o.currency} {Number(o.totalForeign).toLocaleString()} ·{' '}
              {o.status}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

export function PortSelect({
  value,
  onChange,
  className = '',
  disabled,
  required,
  placeholder = 'Select port (UN/LOCODE)…',
}: {
  value: string;
  onChange: (portName: string, port?: ExportPort | null) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<ExportPort[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    exportApi
      .listPorts()
      .then((list) => {
        if (!cancelled) setOptions(Array.isArray(list) ? list : []);
      })
      .catch((e: any) => {
        if (!cancelled) {
          setOptions([]);
          setError(e.message || 'Failed to load ports');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`space-y-1 ${className}`}>
      <select
        disabled={disabled || loading}
        required={required}
        value={value}
        onChange={(e) => {
          const name = e.target.value;
          onChange(name, options.find((o) => o.name === name) || null);
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582] disabled:bg-gray-50"
      >
        <option value="">{loading ? 'Loading ports…' : placeholder}</option>
        {options.map((p) => (
          <option key={p.id || `${p.name}-${p.unLocode}`} value={p.name}>
            {p.name}
            {p.unLocode ? ` (${p.unLocode})` : ''}
            {p.country ? ` — ${p.country}` : ''}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

export function BankAccountSelect({
  value,
  onChange,
  className = '',
  disabled,
  required,
  currency,
}: {
  value: string;
  onChange: (id: string, account?: BankAccount | null) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  currency?: string;
}) {
  const [options, setOptions] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    bankAccountService
      .getAccounts({ limit: 100, status: 'Active' })
      .then((res) => {
        if (cancelled) return;
        const list = res.data || [];
        setOptions(
          currency ? list.filter((a) => (a.currency || '').toUpperCase() === currency.toUpperCase()) : list
        );
      })
      .catch((e: any) => {
        if (!cancelled) {
          setOptions([]);
          setError(e.message || 'Failed to load bank accounts');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  return (
    <div className={`space-y-1 ${className}`}>
      <select
        disabled={disabled || loading}
        required={required}
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          onChange(id, options.find((a) => a.id === id) || null);
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582] disabled:bg-gray-50"
      >
        <option value="">{loading ? 'Loading bank accounts…' : 'Select bank account…'}</option>
        {options.map((a) => (
          <option key={a.id} value={a.id}>
            {a.bankName} — {a.accountName} · {a.accountNumber} ({a.currency})
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

export function AccountSelect({
  value,
  onChange,
  className = '',
  disabled,
  required,
  type,
  placeholder = 'Select GL account…',
}: {
  value: string;
  onChange: (id: string, account?: ChartOfAccount | null) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    chartOfAccountService
      .getAccounts({ limit: 100, type })
      .then((res) => {
        if (!cancelled) setOptions((res.data || []).filter((a) => a.isActive !== false));
      })
      .catch((e: any) => {
        if (!cancelled) {
          setOptions([]);
          setError(e.message || 'Failed to load accounts');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <div className={`space-y-1 ${className}`}>
      <select
        disabled={disabled || loading}
        required={required}
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          onChange(id, options.find((a) => a.id === id) || null);
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#014582] disabled:bg-gray-50"
      >
        <option value="">{loading ? 'Loading accounts…' : placeholder}</option>
        {options.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code} — {a.name}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
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

export function OrderFilterBanner({
  orderId,
  entityLabel,
}: {
  orderId?: string;
  entityLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [order, setOrder] = useState<ExportOrder | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    exportApi
      .getOrder(orderId)
      .then((record) => {
        if (!cancelled) setOrder(record);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        <Landmark className="w-4 h-4" />
        {order ? (
          <>
            Showing {entityLabel} for{' '}
            <Link href={`/export/orders?order=${order.id}`} className="font-bold hover:underline">
              {order.orderNumber}
            </Link>{' '}
            · {order.customerName}
          </>
        ) : (
          <>Filtered to a single export order</>
        )}
      </span>
      <button
        type="button"
        onClick={() => router.push(pathname || '/export/dashboard')}
        className="font-bold text-[#014582] hover:underline"
      >
        Clear order filter
      </button>
    </div>
  );
}
