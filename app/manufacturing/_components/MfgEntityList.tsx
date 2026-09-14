'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Pencil, X, Save } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgSearchInput,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgLoading,
  MfgEmpty,
  MfgError,
  MfgPagination,
  MfgButton,
  MfgAddButton,
  MfgField,
  MfgInput,
  MfgSelect,
  MfgTextarea,
} from '../ui';
import { ProductPicker, type PickedProduct } from './ProductPicker';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea' | 'product' | 'products';
export interface MfgFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;
  withQuantity?: boolean;
}

function nameKeyFor(fieldName: string) {
  if (fieldName === 'productId') return 'productName';
  if (fieldName.endsWith('Id')) return `${fieldName.slice(0, -2)}Name`;
  return `${fieldName}Name`;
}

function skuKeyFor(fieldName: string) {
  if (fieldName === 'productId') return 'productSku';
  if (fieldName.endsWith('Id')) return `${fieldName.slice(0, -2)}Sku`;
  return `${fieldName}Sku`;
}

function pickedKeyFor(fieldName: string) {
  return `${fieldName}__picked`;
}

function pickedFromRow(row: any, fieldName: string): PickedProduct | null {
  const id = String(row?.[fieldName] || row?.productId || row?.componentId || '');
  if (!id) return null;
  return {
    id,
    name: row.productName || row.componentName || row.product?.name || id,
    sku: row.productSku || row.product?.sku || row.sku,
  };
}

function pickedListFromRow(row: any, fieldName: string): PickedProduct[] {
  const list = Array.isArray(row?.[fieldName]) ? row[fieldName] : Array.isArray(row?.components) ? row.components : [];
  return list
    .map((c: any) => ({
      id: String(c.componentId || c.productId || c.id || ''),
      name: c.componentName || c.productName || c.name || '',
      sku: c.sku,
      quantity: Number(c.quantity ?? 1),
    }))
    .filter((p: PickedProduct) => p.id);
}

export interface MfgEntityListProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  service: {
    list: (params: any) => Promise<{ data: any[]; pagination: any }>;
    create?: (data: any) => Promise<any>;
    update?: (id: string, data: any) => Promise<any>;
    remove?: (id: string) => Promise<void>;
  };
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  fields: MfgFieldConfig[];
  idKey?: string;
  requireLocation?: boolean;
  actions?: React.ReactNode;
}

export function MfgEntityList({
  title,
  subtitle,
  icon,
  service,
  columns,
  fields,
  idKey = 'id',
  requireLocation = true,
  actions,
}: MfgEntityListProps) {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 20, search: search || undefined };
      if (requireLocation && locationIdForApi) params.locationId = locationIdForApi;
      const res = await service.list(params);
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi, service, requireLocation]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'products') initial[f.name] = [];
      else if (f.type === 'product') {
        initial[f.name] = '';
        initial[pickedKeyFor(f.name)] = [];
      }
      else if (f.type === 'number') initial[f.name] = 0;
      else initial[f.name] = f.options?.[0]?.value || '';
    });
    setEditing(null);
    setForm(initial);
    setShowForm(true);
  };

  const openEdit = (row: any) => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'products') {
        initial[f.name] = pickedListFromRow(row, f.name);
      } else if (f.type === 'product') {
        const picked = pickedFromRow(row, f.name);
        initial[f.name] = picked?.id || '';
        initial[nameKeyFor(f.name)] = picked?.name || '';
        initial[skuKeyFor(f.name)] = picked?.sku || '';
        initial[pickedKeyFor(f.name)] = picked ? [picked] : [];
      } else {
        initial[f.name] = row[f.name] ?? '';
      }
    });
    setEditing(row);
    setForm(initial);
    setShowForm(true);
  };

  const save = async () => {
    const missing = fields.find((f) => {
      if (!f.required) return false;
      if (f.type === 'products') return !Array.isArray(form[f.name]) || form[f.name].length === 0;
      if (f.type === 'product') {
        const picked = form[pickedKeyFor(f.name)];
        return !form[f.name] && !(Array.isArray(picked) && picked.length);
      }
      return form[f.name] === undefined || form[f.name] === '';
    });
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = { ...form };
      fields.forEach((f) => {
        if (f.type === 'products') {
          payload[f.name] = (Array.isArray(form[f.name]) ? form[f.name] : []).map((p: PickedProduct, i: number) => ({
            componentId: p.id,
            productId: p.id,
            componentName: p.name,
            productName: p.name,
            sku: p.sku,
            quantity: Number(p.quantity ?? 1),
            unitOfMeasure: 'pcs',
            sequence: i + 1,
          }));
        }
        delete payload[pickedKeyFor(f.name)];
      });
      if (requireLocation && locationIdForApi) payload.locationId = locationIdForApi;
      const productField = fields.find((f) => f.type === 'product');
      const pickedProducts: PickedProduct[] = productField
        ? (Array.isArray(form[pickedKeyFor(productField.name)]) ? form[pickedKeyFor(productField.name)] : [])
        : [];
      if (editing) {
        if (service.update) { await service.update(String(editing[idKey] || editing._id), payload); toast.success('Updated'); }
      } else if (service.create) {
        if (productField && pickedProducts.length > 1) {
          for (const prod of pickedProducts) {
            await service.create({
              ...payload,
              [productField.name]: prod.id,
              [nameKeyFor(productField.name)]: prod.name,
              [skuKeyFor(productField.name)]: prod.sku,
            });
          }
          toast.success(`Created ${pickedProducts.length} records`);
        } else {
          await service.create(payload);
          toast.success('Created');
        }
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    if (!service.remove) return;
    if (!window.confirm(`Delete this ${title.toLowerCase()} entry?`)) return;
    try {
      await service.remove(String(row[idKey] || row._id));
      toast.success('Deleted');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const fieldInput = (f: MfgFieldConfig) => {
    if (f.type === 'product') {
      const selected: PickedProduct[] = Array.isArray(form[pickedKeyFor(f.name)]) && form[pickedKeyFor(f.name)].length
        ? form[pickedKeyFor(f.name)]
        : form[f.name]
          ? [{ id: String(form[f.name]), name: form[nameKeyFor(f.name)] || String(form[f.name]), sku: form[skuKeyFor(f.name)] }]
          : [];
      return (
        <ProductPicker
          multiple
          selected={selected}
          placeholder={f.placeholder || 'Select product…'}
          onChange={(products) => {
            const picked = products[0];
            setForm((p) => ({
              ...p,
              [f.name]: picked?.id || '',
              [nameKeyFor(f.name)]: picked?.name || '',
              [skuKeyFor(f.name)]: picked?.sku || '',
              [pickedKeyFor(f.name)]: products,
            }));
          }}
        />
      );
    }
    if (f.type === 'products') {
      return (
        <ProductPicker
          multiple
          withQuantity={f.withQuantity !== false}
          selected={Array.isArray(form[f.name]) ? form[f.name] : []}
          placeholder={f.placeholder || 'Select products…'}
          onChange={(products) => setForm((p) => ({ ...p, [f.name]: products }))}
        />
      );
    }
    const value = form[f.name] ?? '';
    const base = {
      name: f.name,
      required: f.required,
      placeholder: f.placeholder,
      value,
      onChange: (e: any) => setForm((p) => ({ ...p, [f.name]: e.target.value })),
    };
    if (f.type === 'textarea') return <MfgTextarea {...(base as any)} />;
    if (f.type === 'select')
      return (
        <MfgSelect {...(base as any)}>
          <option value="">Select…</option>
          {(f.options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </MfgSelect>
      );
    if (f.type === 'number') return <MfgInput {...(base as any)} type="number" />;
    if (f.type === 'date') return <MfgInput {...(base as any)} type="date" />;
    return <MfgInput {...(base as any)} type="text" />;
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={
          <>
            {actions}
            {service.create && <MfgAddButton label="Add" onClick={openCreate} />}
          </>
        }
      />

      <MfgCard>
        <div className="mb-4">
          <MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search…" />
        </div>

        {loading ? (
          <MfgLoading />
        ) : error ? (
          <MfgError message={error} />
        ) : rows.length === 0 ? (
          <MfgEmpty title="No records" message="Records created here appear once the backend returns data." />
        ) : (
          <>
            <MfgTable columns={[...columns.map((c) => c.label), ...(service.remove || service.update ? [''] : [])]}>
              {rows.map((row, i) => (
                <MfgTableRow key={row[idKey] || row._id || i}>
                  {columns.map((c) => (
                    <MfgTableCell key={c.key}>
                      {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                    </MfgTableCell>
                  ))}
                  {(service.remove || service.update) && (
                    <MfgTableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {service.update && (
                          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-[#0FA3E0] hover:bg-[#0FA3E0]/10 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {service.remove && (
                          <button onClick={() => remove(row)} className="p-1.5 rounded-lg text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </MfgTableCell>
                  )}
                </MfgTableRow>
              ))}
            </MfgTable>
            <MfgPagination page={page} total={total} onPage={setPage} />
          </>
        )}
      </MfgCard>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE4EE]">
              <h3 className="text-sm font-extrabold text-[#1A1A2E]">
                {editing ? `Edit ${title}` : `Add ${title}`}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.name} className={f.full ? 'md:col-span-2' : ''}>
                    <MfgField label={f.label}>{fieldInput(f)}</MfgField>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#DDE4EE]">
              <MfgButton variant="secondary" onClick={() => setShowForm(false)}>Cancel</MfgButton>
              <MfgButton onClick={save} loading={saving}>
                <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
              </MfgButton>
            </div>
          </div>
        </div>
      )}
    </MfgPage>
  );
}

// Re-export badge helper for use in column render functions
export { MfgStatusBadge };