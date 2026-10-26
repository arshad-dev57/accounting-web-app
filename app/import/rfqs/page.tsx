'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Send,
  ShoppingCart,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Package,
  Globe,
  ExternalLink,
  Trophy,
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
  TradeDetailDrawer,
  TradeModal,
  TradePagination,
  TradeWorkflowStepper,
} from '@/components/trade/TradeUI';
import importApi, {
  type ImportRfq,
  type ImportRfqItem,
  type ImportSupplierQuotation,
} from '@/lib/import-api';
import { supplierService, type Supplier } from '@/api/supplier/route';
import type { Product } from '@/api/product/route';
import { GEO_COUNTRIES } from '@/lib/geo-data';
import { loadCurrencyLocal } from '@/lib/currency-service';
import {
  convertAmountBetweenCodes,
  fetchCurrencies,
  type CurrencyMaster,
} from '@/lib/multi-currency';
import {
  SupplierSelectField,
  ProductSelectButton,
  ProductPickerModal,
  CurrencySelect,
  PortSelect,
  FormSection,
  FieldLabel,
} from '@/components/import/ImportSelectors';
import { usePermissions } from '@/lib/usePermissions';

const IMPORT_WORKFLOW_STEPS = [
  'Import RFQ',
  'Supplier Quotation',
  'Purchase Order',
  'Proforma Invoice',
  'Shipment',
  'Customs Clearance',
  'Goods Receipt',
  'Landed Cost',
  'Supplier Bill',
  'Payment',
];

const RFQ_STATUS_FILTERS = [
  'All',
  'Draft',
  'Sent',
  'Quotes Received',
  'Under Comparison',
  'Awarded',
  'Pending Approval',
  'Approved',
  'Converted to PO',
  'Cancelled',
  'Expired',
] as const;

const INCOTERMS_2020 = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as const;
const SEA_ONLY_INCOTERMS = ['FOB', 'CFR', 'CIF', 'FAS'];

const INCOTERM_LABELS: Record<string, string> = {
  EXW: 'EXW — Ex Works',
  FCA: 'FCA — Free Carrier',
  FAS: 'FAS — Free Alongside Ship',
  FOB: 'FOB — Free On Board',
  CFR: 'CFR — Cost and Freight',
  CIF: 'CIF — Cost, Insurance & Freight',
  CPT: 'CPT — Carriage Paid To',
  CIP: 'CIP — Carriage and Insurance Paid To',
  DAP: 'DAP — Delivered at Place',
  DPU: 'DPU — Delivered at Place Unloaded',
  DDP: 'DDP — Delivered Duty Paid',
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function rfqDisplayDate(rfq: ImportRfq): string {
  const raw = rfq.createdAt || rfq.date || rfq.issueDate;
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function lineTargetPrice(it: ImportRfqItem): number {
  return Number(it.targetPriceUsd ?? 0);
}

function lineQuotedPrice(it: ImportRfqItem): number | null {
  if (it.quotedPriceUsd == null || it.quotedPriceUsd === undefined) return null;
  return Number(it.quotedPriceUsd);
}

function lineDisplayTotal(it: ImportRfqItem): { amount: number; estimated: boolean } {
  const qty = Number(it.quantity || 0);
  const quoted = lineQuotedPrice(it);
  if (quoted != null) return { amount: qty * quoted, estimated: false };
  return { amount: qty * lineTargetPrice(it), estimated: true };
}

function rfqTargetTotal(rfq: ImportRfq): number {
  if (rfq.targetTotal != null) return Number(rfq.targetTotal);
  return (rfq.items || []).reduce(
    (sum, it) => sum + Number(it.quantity || 0) * lineTargetPrice(it),
    0
  );
}

function rfqAwardedTotal(rfq: ImportRfq): number | null {
  if (rfq.awardedTotal != null) return Number(rfq.awardedTotal);
  const selected = (rfq.quotations || []).find((q) => q.id === rfq.selectedQuotationId);
  if (selected) return Number(selected.totalForeign || 0);
  return null;
}

function isValidHsCode(code: string): boolean {
  if (!String(code || '').trim()) return true;
  const raw = String(code).trim();
  if (!/^[\d.]+$/.test(raw)) return false;
  const digits = raw.replace(/\./g, '');
  return digits.length >= 6 && digits.length <= 10;
}

function hsFromProduct(product: Product): string {
  const raw = String((product as { hsCode?: string }).hsCode || '').trim();
  if (!raw || !isValidHsCode(raw)) return '';
  return raw;
}

function seaIncotermAirPortWarning(incoterm: string, port: string): string | null {
  if (!SEA_ONLY_INCOTERMS.includes(incoterm)) return null;
  const p = String(port || '').toLowerCase();
  if (/\b(air|airport|aiport|a\.?i\.?r)\b/.test(p) || /\b(DXB|LHR|JFK|SHA|PVG|HKG)\b/i.test(port || '')) {
    return `Incoterm ${incoterm} is typically sea-freight only; port "${port}" looks air-related.`;
  }
  return null;
}

function canAddQuotation(status: string): boolean {
  return ['Sent', 'Quotes Received', 'Under Comparison'].includes(status);
}

const RFQ_HS_REFRESH_STATUSES = [
  'Draft',
  'Sent',
  'Quotes Received',
  'Under Comparison',
  'Awarded',
  'Pending Approval',
  'Approved',
];

function canRefreshHsCode(status: string): boolean {
  return RFQ_HS_REFRESH_STATUSES.includes(status);
}

function lineNeedsHsRefresh(it: ImportRfqItem): boolean {
  const lineHs = String(it.hsCode || '').trim();
  const productHs = String(it.productHsCode || '').trim();
  if (!productHs) return false;
  return !lineHs || lineHs !== productHs;
}

function isActiveQuotation(q: ImportSupplierQuotation): boolean {
  return q.status !== 'Superseded' && q.status !== 'Expired';
}

function activeQuotations(list: ImportSupplierQuotation[] = []): ImportSupplierQuotation[] {
  return list.filter(isActiveQuotation);
}

function distinctActiveSupplierCount(list: ImportSupplierQuotation[] = []): number {
  const keys = new Set<string>();
  for (const q of activeQuotations(list)) {
    keys.add(q.supplierId ? `id:${q.supplierId}` : `name:${String(q.supplierName || '').toLowerCase()}`);
  }
  return keys.size;
}

function displayUserLabel(user?: { name?: string | null; email?: string | null } | null, fallback?: string | null) {
  if (!user) return fallback || '—';
  const raw = String(user.name || '').trim();
  const looksInternal = !raw || /^customer\s*\d+$/i.test(raw) || /^user\s*\d+$/i.test(raw);
  if (looksInternal) return user.email || raw || fallback || '—';
  return raw;
}

const AUDIT_REASON_LABELS: Record<string, string> = {
  pre_award: 'Before award',
  post_award: 'After award',
  reopen: 'RFQ reopened',
  change_award: 'Award changed',
  quotation_revision: 'Quotation revision',
  quotation_received: 'Quotation received',
  legacy_duplicate_cleanup: 'Legacy duplicate cleanup',
  'legacy duplicate cleanup': 'Legacy duplicate cleanup',
  'HS code back-filled from product master': 'HS code back-filled from product master',
  'legacy HS code back-fill': 'Legacy HS code back-fill',
  hs_code_refresh: 'HS code refreshed from product',
};

/** Map internal audit codes; hide empty/unknown codes; keep free-text user reasons. */
function formatAuditReasonLabel(raw?: string | null): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const key = text.toLowerCase();
  if (AUDIT_REASON_LABELS[key]) return AUDIT_REASON_LABELS[key];
  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/.test(key)) return null;
  if (['reopen', 'pre_award', 'post_award', 'change_award'].includes(key)) return null;
  return text;
}

/** Compare quotations in a single base (USD) using totalUsd or foreign × FX. */
function quoteComparableUsd(q: ImportSupplierQuotation): number {
  const totalUsd = Number(q.totalUsd);
  let usd =
    Number.isFinite(totalUsd) && totalUsd > 0
      ? totalUsd
      : Number(q.totalForeign || 0) *
        (Number(q.exchangeRateToUsd) > 0 ? Number(q.exchangeRateToUsd) : 1);
  if (!Number.isFinite(usd)) usd = 0;
  return Math.round(usd * 100) / 100;
}

type RfqLineDraft = {
  key: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  uom: string;
  /** Target unit price in the RFQ (supplier) currency. */
  targetPrice: number;
  /** Original product unit price in the app display currency. */
  sourcePriceApp: number;
  hsCode: string;
};

function productUnitPriceApp(p: Product): number {
  const cost = Number((p as { costPrice?: number }).costPrice);
  if (cost > 0) return cost;
  const sell = Number((p as { sellingPrice?: number }).sellingPrice);
  if (sell > 0) return sell;
  return 0;
}

function newLineFromProduct(p: Product, targetPrice?: number): RfqLineDraft {
  const id = p.id || (p as { _id?: string })._id;
  const sourcePriceApp = productUnitPriceApp(p);
  return {
    key: id || `line-${Date.now()}-${Math.random()}`,
    productId: id,
    productName: p.name,
    sku: p.sku || undefined,
    quantity: 1,
    uom: (p as { stockUnitName?: string }).stockUnitName || (p as { stockUnit?: string }).stockUnit || 'PCS',
    targetPrice: targetPrice != null ? targetPrice : sourcePriceApp,
    sourcePriceApp,
    hsCode: hsFromProduct(p),
  };
}

export default function ImportRfqsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ImportRfqsPageContent />
    </React.Suspense>
  );
}

function ImportRfqsPageContent() {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canApproveRfq = can('import.rfqs.approve');

  const [rfqs, setRfqs] = useState<ImportRfq[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRfq, setSelectedRfq] = useState<ImportRfq | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createSupplier, setCreateSupplier] = useState<Supplier | null>(null);
  const [createCountry, setCreateCountry] = useState('China');
  const [createCurrency, setCreateCurrency] = useState('USD');
  const [createIncoterm, setCreateIncoterm] = useState<string>('CIF');
  const [createPortId, setCreatePortId] = useState('');
  const [createPortLabel, setCreatePortLabel] = useState('');
  const [createExpectedDelivery, setCreateExpectedDelivery] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [createLines, setCreateLines] = useState<RfqLineDraft[]>([]);
  const [productPickOpen, setProductPickOpen] = useState(false);
  const [currencyMasters, setCurrencyMasters] = useState<CurrencyMaster[]>([]);
  const [appCurrencyCode, setAppCurrencyCode] = useState(() => loadCurrencyLocal().code);
  const [fxConverting, setFxConverting] = useState(false);
  const [fxHint, setFxHint] = useState<string | null>(null);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSupplier, setQuoteSupplier] = useState<Supplier | null>(null);
  const [quoteCurrency, setQuoteCurrency] = useState('USD');
  const [quoteUnitPrice, setQuoteUnitPrice] = useState('');
  const [quoteQty, setQuoteQty] = useState('');
  const [quoteValidUntil, setQuoteValidUntil] = useState('');
  const [quoteLeadDays, setQuoteLeadDays] = useState('');
  const [quotePaymentTerms, setQuotePaymentTerms] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteExchangeRate, setQuoteExchangeRate] = useState('');
  const [quoteModalError, setQuoteModalError] = useState<string | null>(null);
  const [quoteFxHint, setQuoteFxHint] = useState<string | null>(null);

  const [awardOpen, setAwardOpen] = useState(false);
  const [awardQuotationId, setAwardQuotationId] = useState<string | null>(null);
  const [awardJustification, setAwardJustification] = useState('');
  const [changeAwardOpen, setChangeAwardOpen] = useState(false);
  const [changeAwardReason, setChangeAwardReason] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [requireSeparateApprover, setRequireSeparateApprover] = useState(true);

  const countryNames = useMemo(
    () =>
      Array.from(new Set([...GEO_COUNTRIES.map((c) => c.name), createCountry].filter(Boolean))).sort(),
    [createCountry]
  );

  const createSeaWarning = seaIncotermAirPortWarning(createIncoterm, createPortLabel);

  const fetchRfqs = useCallback(() => {
    setLoading(true);
    importApi
      .listRfqs({ search, status: statusFilter, page, limit: pageSize })
      .then((data) => {
        setRfqs(data.items || []);
        setTotal(data.pagination?.total ?? data.items?.length ?? 0);
      })
      .catch((err: { response?: { data?: { message?: string } }; message?: string }) =>
        setError(err?.response?.data?.message || err.message || 'Failed to load RFQs')
      )
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  useEffect(() => {
    const openId = searchParams?.get('id');
    if (!openId) return;
    let cancelled = false;
    importApi
      .getRfq(openId)
      .then((rfq) => {
        if (!cancelled) setSelectedRfq(rfq);
      })
      .catch(() => {
        /* ignore — user may lack access or id invalid */
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    setAppCurrencyCode(loadCurrencyLocal().code);
    const onCurrency = () => setAppCurrencyCode(loadCurrencyLocal().code);
    window.addEventListener('app-currency-changed', onCurrency);
    return () => window.removeEventListener('app-currency-changed', onCurrency);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCurrencies(true)
      .then((list) => {
        if (!cancelled) setCurrencyMasters(list);
      })
      .catch(() => {
        if (!cancelled) setCurrencyMasters([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      importApi.getSettings().catch(() => null),
      fetch('/api/me')
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([settings, me]) => {
      if (cancelled) return;
      if (settings && typeof settings.requireSeparateRfqApprover === 'boolean') {
        setRequireSeparateApprover(settings.requireSeparateRfqApprover);
      }
      const uid =
        me?.data?.id || me?.data?.user?.id || me?.id || me?.user?.id || null;
      if (uid) setCurrentUserId(String(uid));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const convertAppPriceToRfq = useCallback(
    async (amountInApp: number, toCurrency: string) => {
      return convertAmountBetweenCodes({
        amount: amountInApp,
        fromCode: appCurrencyCode,
        toCode: toCurrency,
        currencies: currencyMasters,
      });
    },
    [appCurrencyCode, currencyMasters]
  );

  const addProductsWithConversion = useCallback(
    async (products: Product[]) => {
      if (!products.length) return;
      setFxConverting(true);
      setFxHint(null);
      try {
        const lines: RfqLineDraft[] = [];
        let missingRate = false;
        let lastRate = 1;
        for (const p of products) {
          const source = productUnitPriceApp(p);
          const converted = await convertAppPriceToRfq(source, createCurrency);
          if (converted.missingRate) missingRate = true;
          if (converted.converted) lastRate = converted.rate;
          lines.push(newLineFromProduct(p, converted.amount));
        }
        setCreateLines((prev) => [...prev, ...lines]);
        if (
          createCurrency &&
          appCurrencyCode &&
          createCurrency.toUpperCase() !== appCurrencyCode.toUpperCase()
        ) {
          if (missingRate) {
            setFxHint(
              `No conversion rate for ${appCurrencyCode} → ${createCurrency}. Showing app currency prices — add a rate under Currency → Conversion Rates.`
            );
          } else {
            setFxHint(
              `Prices converted ${appCurrencyCode} → ${createCurrency} using company rate (${lastRate.toLocaleString(
                undefined,
                { maximumFractionDigits: 6 }
              )}).`
            );
          }
        } else {
          setFxHint(null);
        }
      } finally {
        setFxConverting(false);
      }
    },
    [appCurrencyCode, convertAppPriceToRfq, createCurrency]
  );

  const handleCreateCurrencyChange = useCallback(
    async (code: string) => {
      const next = String(code || '').toUpperCase();
      const prev = createCurrency;
      setCreateCurrency(next);
      if (!next || next === prev || createLines.length === 0) {
        if (!next || next === appCurrencyCode.toUpperCase()) setFxHint(null);
        return;
      }

      setFxConverting(true);
      setFxHint(null);
      try {
        let missingRate = false;
        let lastRate = 1;
        let anyConverted = false;
        const appCode = appCurrencyCode.toUpperCase();
        const updated: RfqLineDraft[] = [];
        for (const line of createLines) {
          const source =
            line.sourcePriceApp > 0 ? line.sourcePriceApp : line.targetPrice;

          if (next === appCode) {
            updated.push({ ...line, targetPrice: source });
            anyConverted = true;
            lastRate = 1;
            continue;
          }

          const converted = await convertAppPriceToRfq(source, next);
          if (converted.converted) {
            anyConverted = true;
            lastRate = converted.rate;
            updated.push({ ...line, targetPrice: converted.amount });
          } else {
            missingRate = true;
            updated.push(line);
          }
        }
        setCreateLines(updated);
        if (next === appCode) {
          setFxHint(`Line prices reset to app currency (${appCurrencyCode}).`);
        } else if (missingRate && !anyConverted) {
          setFxHint(
            `No conversion rate for ${appCurrencyCode} → ${next}. Line prices kept as-is — add a rate under Currency → Conversion Rates.`
          );
        } else if (missingRate) {
          setFxHint(
            `Some lines could not convert ${appCurrencyCode} → ${next}. Add missing rates under Currency → Conversion Rates.`
          );
        } else {
          setFxHint(
            `Line prices re-converted ${appCurrencyCode} → ${next} @ ${lastRate.toLocaleString(
              undefined,
              { maximumFractionDigits: 6 }
            )}.`
          );
        }
      } finally {
        setFxConverting(false);
      }
    },
    [appCurrencyCode, convertAppPriceToRfq, createCurrency, createLines]
  );

  const refreshRfqDetail = async (id: string) => {
    const full = await importApi.getRfq(id);
    setSelectedRfq(full);
    setRfqs((prev) => prev.map((r) => (r.id === id ? full : r)));
    return full;
  };

  const openRfqDetail = async (rfq: ImportRfq) => {
    setSelectedRfq(rfq);
    setDetailLoading(true);
    setError(null);
    try {
      await refreshRfqDetail(rfq.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Failed to load RFQ');
    } finally {
      setDetailLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateSupplier(null);
    setCreateCountry('China');
    setCreateCurrency('USD');
    setCreateIncoterm('CIF');
    setCreatePortId('');
    setCreatePortLabel('');
    setCreateExpectedDelivery('');
    setCreateNotes('');
    setCreateLines([]);
    setFxHint(null);
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!createSupplier) {
      setError('Supplier is required');
      return;
    }
    const supplierName =
      createSupplier.name || (createSupplier as { companyName?: string }).companyName || '';
    if (!supplierName.trim()) {
      setError('Supplier is required');
      return;
    }
    if (!createPortId) {
      setError('Port of discharge must be selected from the port master list');
      return;
    }
    if (!createExpectedDelivery || createExpectedDelivery < todayIso) {
      setError('Expected delivery must be today or later');
      return;
    }
    if (!createLines.length) {
      setError('Add at least one product line');
      return;
    }
    for (const line of createLines) {
      if (!(line.quantity > 0) || !(line.targetPrice > 0)) {
        setError('Each line needs quantity and target price greater than zero');
        return;
      }
      if (line.hsCode.trim() && !isValidHsCode(line.hsCode)) {
        setError(`Invalid HS code on line "${line.productName}" (6–10 digits, dots optional)`);
        return;
      }
    }

    setSaving(true);
    try {
      await importApi.createRfq({
        supplierId: createSupplier?.id || (createSupplier as { _id?: string })?._id || undefined,
        supplierName,
        supplierCountry: createCountry,
        countryOfDispatch: createCountry,
        currency: createCurrency,
        incoterm: createIncoterm,
        portId: createPortId,
        expectedDelivery: createExpectedDelivery,
        notes: createNotes.trim() || undefined,
        specialNotes: createNotes.trim() || undefined,
        items: createLines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          quantity: line.quantity,
          uom: line.uom || 'PCS',
          targetPriceUsd: line.targetPrice,
          hsCode: line.hsCode.trim() || undefined,
        })) as ImportRfq['items'],
      });
      setIsCreateOpen(false);
      resetCreateForm();
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Failed to create RFQ');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (rfqId: string, newStatus: string) => {
    setSaving(true);
    setError(null);
    try {
      await importApi.updateRfq(rfqId, { status: newStatus });
      await refreshRfqDetail(rfqId);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Status update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async (rfqId: string) => {
    setSaving(true);
    setError(null);
    try {
      await importApi.submitRfqForApproval(rfqId);
      await refreshRfqDetail(rfqId);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Submit for approval failed');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRfq = async (rfqId: string) => {
    setSaving(true);
    setError(null);
    try {
      await importApi.approveRfq(rfqId);
      await refreshRfqDetail(rfqId);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Approve RFQ failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectApproval = async (rfqId: string) => {
    const reason = window.prompt('Optional reason for rejecting approval (sent back to Awarded):') || undefined;
    setSaving(true);
    setError(null);
    try {
      await importApi.rejectRfqApproval(rfqId, reason ? { reason } : {});
      await refreshRfqDetail(rfqId);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Reject approval failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToPo = async (rfq: ImportRfq) => {
    if (rfq.status !== 'Approved' || !rfq.selectedQuotationId) {
      setError('Approve the RFQ and select a quotation before converting to PO');
      return;
    }
    // Backend resolves empty line HS from product master (and back-fills). Only soft-warn here.
    setSaving(true);
    setError(null);
    try {
      await importApi.convertRfqToPo(rfq.id);
      await refreshRfqDetail(rfq.id);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const msg = e?.response?.data?.message || e.message || 'Convert to PO failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshHsCode = async (itemId: string) => {
    if (!selectedRfq) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await importApi.refreshRfqItemHsCode(selectedRfq.id, itemId);
      setSelectedRfq(updated);
      setRfqs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Failed to refresh HS code');
    } finally {
      setSaving(false);
    }
  };

  const applySupplierToQuoteForm = (
    supplier: Supplier | null,
    fallbackCurrency?: string,
    opts?: { fillPaymentTerms?: boolean }
  ) => {
    setQuoteSupplier(supplier);
    const supplierCurrency = supplier?.currency?.code
      ? String(supplier.currency.code).toUpperCase()
      : '';
    setQuoteCurrency(supplierCurrency || fallbackCurrency || 'USD');
    if (opts?.fillPaymentTerms && supplier?.paymentTerms) {
      setQuotePaymentTerms(String(supplier.paymentTerms));
    }
  };

  const resolveQuoteFxRate = useCallback(
    async (currency: string, amountForeign: number) => {
      const code = String(currency || '').trim().toUpperCase();
      if (!code) {
        setQuoteFxHint(null);
        return;
      }
      try {
        const preview = await importApi.previewFx({
          currency: code,
          foreignAmount: amountForeign > 0 ? amountForeign : 1,
          exchangeRateDate: todayIso,
        });
        if (preview?.exchangeRate != null && Number(preview.exchangeRate) > 0) {
          setQuoteExchangeRate(String(preview.exchangeRate));
          setQuoteFxHint(
            `1 ${preview.currencyCode || code} = ${preview.exchangeRate} ${
              preview.baseCurrencyCode || appCurrencyCode
            }`
          );
          return;
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setQuoteFxHint(
          e?.message ||
            `No company rate for ${code} → ${appCurrencyCode}. Enter exchange rate manually or add it under Currency → Conversion Rates.`
        );
      }
    },
    [appCurrencyCode, todayIso]
  );

  const openQuoteModal = async (rfq: ImportRfq) => {
    const first = rfq.items?.[0];
    const rfqCurrency = (rfq.currency || 'USD').toUpperCase();
    setQuoteUnitPrice('');
    setQuoteQty(first ? String(first.quantity) : '1');
    setQuoteValidUntil('');
    setQuoteLeadDays('');
    setQuotePaymentTerms('');
    setQuoteNotes('');
    setQuoteExchangeRate('');
    setQuoteModalError(null);
    setQuoteFxHint(null);
    setQuoteOpen(true);

    // Prefill RFQ supplier immediately, then enrich currency from supplier master.
    const seed: Supplier | null = rfq.supplierName
      ? {
          id: rfq.supplierId,
          name: rfq.supplierName,
          country: rfq.supplierCountry || rfq.countryOfDispatch || undefined,
        }
      : null;
    applySupplierToQuoteForm(seed, rfqCurrency);

    let currencyForFx = rfqCurrency;
    if (rfq.supplierId) {
      try {
        const full = await supplierService.getSupplierById(rfq.supplierId);
        applySupplierToQuoteForm(full, rfqCurrency, { fillPaymentTerms: true });
        if (full?.currency?.code) {
          currencyForFx = String(full.currency.code).toUpperCase();
        }
      } catch {
        // Keep RFQ seed + currency if supplier fetch fails
      }
    }
    void resolveQuoteFxRate(currencyForFx, Number(first?.quantity || 1));
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    setQuoteModalError(null);

    const supplierName =
      quoteSupplier?.name || (quoteSupplier as { companyName?: string })?.companyName || '';
    if (!supplierName.trim()) {
      setQuoteModalError('Quotation supplier is required');
      return;
    }
    if (!quoteCurrency) {
      setQuoteModalError('Quotation currency is required');
      return;
    }
    const unitPrice = Number(quoteUnitPrice);
    const quantity = Number(quoteQty);
    if (!(unitPrice > 0) || !(quantity > 0)) {
      setQuoteModalError('Unit price and quantity must be greater than zero');
      return;
    }
    if (quoteLeadDays === '' || Number(quoteLeadDays) < 0 || Number.isNaN(Number(quoteLeadDays))) {
      setQuoteModalError('Lead time (days) is required');
      return;
    }
    if (!quotePaymentTerms.trim()) {
      setQuoteModalError('Payment terms are required');
      return;
    }
    if (!quoteValidUntil || quoteValidUntil < todayIso) {
      setQuoteModalError('Validity date is required and must be today or later');
      return;
    }

    const baseItem = selectedRfq.items?.[0];
    setSaving(true);
    setError(null);
    try {
      await importApi.createQuotation(selectedRfq.id, {
        supplierId: quoteSupplier?.id || (quoteSupplier as { _id?: string })?._id,
        supplierName,
        currency: quoteCurrency,
        unitPrice,
        quantity,
        validUntil: quoteValidUntil,
        leadTimeDays: Number(quoteLeadDays),
        paymentTerms: quotePaymentTerms.trim(),
        notes: quoteNotes || undefined,
        exchangeRate: quoteExchangeRate ? Number(quoteExchangeRate) : undefined,
        items: baseItem
          ? [
              {
                productId: baseItem.productId,
                productName: baseItem.productName,
                sku: baseItem.sku,
                quantity,
                uom: baseItem.uom,
                unitPrice,
                lineTotal: quantity * unitPrice,
              },
            ]
          : undefined,
      });
      setQuoteOpen(false);
      setQuoteModalError(null);
      await refreshRfqDetail(selectedRfq.id);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message || e.message || 'Failed to save quotation';
      setQuoteModalError(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openAwardModal = (quotationId: string) => {
    setAwardQuotationId(quotationId);
    setAwardJustification('');
    setAwardOpen(true);
  };

  const openChangeAwardModal = (quotationId: string) => {
    setAwardQuotationId(quotationId);
    setChangeAwardReason('');
    setChangeAwardOpen(true);
  };

  const handleSelectQuotation = async (
    quotationId: string,
    opts?: { justification?: string; changeReason?: string }
  ) => {
    if (!selectedRfq) return;
    const isChangeAward =
      selectedRfq.status === 'Awarded' &&
      selectedRfq.selectedQuotationId &&
      selectedRfq.selectedQuotationId !== quotationId;

    if (isChangeAward && !String(opts?.changeReason || '').trim()) {
      openChangeAwardModal(quotationId);
      return;
    }

    const supplierCount =
      selectedRfq.distinctActiveSupplierCount ??
      distinctActiveSupplierCount(selectedRfq.quotations || []);
    if (!isChangeAward && supplierCount < 2 && !String(opts?.justification || '').trim()) {
      openAwardModal(quotationId);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await importApi.selectQuotation(quotationId, {
        singleSourceJustification: opts?.justification?.trim() || undefined,
        changeReason: opts?.changeReason?.trim() || undefined,
      });
      setAwardOpen(false);
      setChangeAwardOpen(false);
      setAwardQuotationId(null);
      await refreshRfqDetail(selectedRfq.id);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; code?: string } }; message?: string };
      const code = e?.response?.data?.code;
      if (code === 'SINGLE_SOURCE_JUSTIFICATION_REQUIRED') {
        openAwardModal(quotationId);
        setError(e.response?.data?.message || 'Single-source justification required');
      } else if (code === 'CHANGE_AWARD_REASON_REQUIRED') {
        openChangeAwardModal(quotationId);
        setError(e.response?.data?.message || 'Change-award reason required');
      } else {
        setError(e?.response?.data?.message || e.message || 'Failed to award quotation');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReopenRfq = async () => {
    if (!selectedRfq) return;
    if (!reopenReason.trim()) {
      setError('A reason is required to reopen an approved RFQ');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await importApi.reopenRfq(selectedRfq.id, { reason: reopenReason.trim() });
      setReopenOpen(false);
      setReopenReason('');
      await refreshRfqDetail(selectedRfq.id);
      fetchRfqs();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e.message || 'Failed to reopen RFQ');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;
  const quotations: ImportSupplierQuotation[] = selectedRfq?.quotations || [];

  const renderStatusActions = (rfq: ImportRfq) => {
    const st = rfq.status;
    const actions: React.ReactNode[] = [];

    if (st === 'Draft') {
      actions.push(
        <button
          key="send"
          type="button"
          disabled={saving}
          onClick={() => handleStatusUpdate(rfq.id, 'Sent')}
          className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" /> Send RFQ
        </button>
      );
    }
    if (st === 'Sent') {
      actions.push(
        <button
          key="quotes"
          type="button"
          disabled={saving}
          onClick={() => handleStatusUpdate(rfq.id, 'Quotes Received')}
          className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
        >
          Mark Quotes Received
        </button>
      );
    }
    if (st === 'Awarded') {
      actions.push(
        <button
          key="submit-approval"
          type="button"
          disabled={saving || !rfq.selectedQuotationId}
          onClick={() => handleSubmitForApproval(rfq.id)}
          className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" /> Send for Approval
        </button>
      );
    }
    if (st === 'Pending Approval') {
      const cannotApprove =
        requireSeparateApprover &&
        Boolean(currentUserId) &&
        Boolean(rfq.awardedBy) &&
        currentUserId === rfq.awardedBy;
      if (canApproveRfq && !cannotApprove) {
        actions.push(
          <button
            key="approve"
            type="button"
            disabled={saving}
            onClick={() => handleApproveRfq(rfq.id)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        );
        actions.push(
          <button
            key="reject-approval"
            type="button"
            disabled={saving}
            onClick={() => handleRejectApproval(rfq.id)}
            className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 disabled:opacity-50"
          >
            Reject
          </button>
        );
      } else if (cannotApprove && canApproveRfq) {
        actions.push(
          <span
            key="approve-blocked"
            className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold"
            title="Award and approval must be done by different users"
          >
            Approve locked (you awarded this RFQ)
          </span>
        );
      } else {
        actions.push(
          <span
            key="awaiting-approval"
            className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold"
          >
            Awaiting approval
          </span>
        );
      }
    }
    if (st === 'Approved' && rfq.selectedQuotationId) {
      actions.push(
        <button
          key="reopen"
          type="button"
          disabled={saving}
          onClick={() => {
            setReopenReason('');
            setReopenOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-50 disabled:opacity-50"
        >
          Reopen RFQ
        </button>
      );
      actions.push(
        <button
          key="convert"
          type="button"
          disabled={saving}
          onClick={() => handleConvertToPo(rfq)}
          className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-1.5"
        >
          <ShoppingCart className="w-4 h-4" /> Convert to PO
        </button>
      );
    }

    return actions.length ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null;
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Import RFQs & Supplier Quotations"
        subtitle="Request quotations, compare supplier offers, approve, and convert to import purchase orders"
        moduleName="Import Management"
        backHref="/import/dashboard"
        icon={<FileQuestion className="w-5 h-5 text-white" />}
        actions={
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Import RFQ
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold underline hover:no-underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      <TradeCard>
        <div className="mb-4">
          <TradeWorkflowStepper steps={IMPORT_WORKFLOW_STEPS} currentStepIndex={0} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQ, supplier, country..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582] focus:ring-1 focus:ring-[#014582]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {RFQ_STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st ? 'bg-[#014582] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <TradeTable>
          <TradeTableHeader
            columns={[
              'RFQ Number',
              'Date',
              'Supplier',
              'Incoterm',
              'Currency',
              'Target Total',
              'Awarded Total',
              'Expected Delivery',
              'Status',
              'Actions',
            ]}
          />
          <TradeTableBody>
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
                  Loading import RFQs...
                </td>
              </tr>
            ) : rfqs.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-gray-500">
                  No Import RFQs found matching the filter criteria.
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => {
                const awarded = rfqAwardedTotal(rfq);
                return (
                <TradeTableRow key={rfq.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{rfq.rfqNumber}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{rfqDisplayDate(rfq)}</TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{rfq.supplierName}</span>
                    <span className="text-[10px] text-gray-400">{rfq.supplierCountry || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[11px] text-gray-700">
                      {rfq.incoterm || '—'}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs">{rfq.currency || 'USD'}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {formatMoney(rfqTargetTotal(rfq), rfq.currency || 'USD')}
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-emerald-700">
                    {awarded != null ? formatMoney(awarded, rfq.currency || 'USD') : '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">
                    {rfq.expectedDelivery
                      ? new Date(rfq.expectedDelivery).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : rfq.validUntil
                        ? new Date(rfq.validUntil).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={rfq.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openRfqDetail(rfq)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              );
              })
            )}
          </TradeTableBody>
        </TradeTable>

        <TradePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedRfq)}
        onClose={() => setSelectedRfq(null)}
        title={selectedRfq?.rfqNumber || 'Import RFQ Details'}
        subtitle={
          selectedRfq
            ? `Supplier: ${selectedRfq.supplierName}${selectedRfq.supplierCountry ? ` (${selectedRfq.supplierCountry})` : ''}`
            : undefined
        }
        actions={selectedRfq ? renderStatusActions(selectedRfq) : undefined}
      >
        {detailLoading && (
          <div className="py-8 text-center text-xs text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
            Refreshing RFQ…
          </div>
        )}
        {selectedRfq && !detailLoading && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">RFQ Number</span>
                <span className="font-bold text-gray-900">{selectedRfq.rfqNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Date</span>
                <span className="font-semibold text-gray-900">{rfqDisplayDate(selectedRfq)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selectedRfq.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Incoterm</span>
                <span className="font-bold text-gray-900">{selectedRfq.incoterm || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Discharge</span>
                <span className="font-semibold text-gray-900">
                  {selectedRfq.port
                    ? `${selectedRfq.port.name} (${selectedRfq.port.unLocode})`
                    : selectedRfq.portOfDischarge || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Country of Dispatch / Origin</span>
                <span className="font-semibold text-gray-900">
                  {selectedRfq.countryOfDispatch || selectedRfq.supplierCountry || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Target Total</span>
                <span className="font-extrabold text-[#014582]">
                  {formatMoney(rfqTargetTotal(selectedRfq), selectedRfq.currency || 'USD')}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Awarded Total</span>
                <span className="font-extrabold text-emerald-700">
                  {rfqAwardedTotal(selectedRfq) != null
                    ? formatMoney(rfqAwardedTotal(selectedRfq)!, selectedRfq.currency || 'USD')
                    : '—'}
                </span>
              </div>
            </div>

            {selectedRfq.localPurchaseWarning && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{selectedRfq.localPurchaseWarning}</span>
              </div>
            )}

            {selectedRfq.status === 'Converted to PO' && (selectedRfq.purchaseOrders?.length ?? 0) > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                <span className="font-bold block text-[11px] mb-1">Linked Import Purchase Orders</span>
                <ul className="space-y-1">
                  {selectedRfq.purchaseOrders!.map((po) => (
                    <li key={po.id}>
                      <Link
                        href="/import/purchase-orders"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                      >
                        {po.poNumber}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      {po.status ? <span className="text-gray-500 ml-2">({po.status})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Requested Product Items</h4>
              <TradeTable>
                <TradeTableHeader
                  columns={[
                    'SKU',
                    'Item Name',
                    'HS Code',
                    'Qty',
                    'Target Price',
                    'Quoted Price',
                    `Line Total (${selectedRfq.currency || 'Foreign'})`,
                  ]}
                />
                <TradeTableBody>
                  {(selectedRfq.items || []).map((it, idx) => {
                    const target = lineTargetPrice(it);
                    const quotedNum = lineQuotedPrice(it);
                    const line = lineDisplayTotal(it);
                    const showRefresh =
                      canRefreshHsCode(selectedRfq.status) && lineNeedsHsRefresh(it);
                    return (
                      <TradeTableRow key={it.id || idx}>
                        <TradeTableCell className="font-mono">{it.sku || '—'}</TradeTableCell>
                        <TradeTableCell className="font-medium text-gray-900">{it.productName}</TradeTableCell>
                        <TradeTableCell className="font-mono text-gray-500">
                          <span>{it.hsCode || '—'}</span>
                          {!String(it.hsCode || '').trim() ? (
                            <span className="block text-[10px] text-amber-700 font-sans font-semibold mt-0.5">
                              HS code missing. Required before PO conversion.
                            </span>
                          ) : null}
                          {showRefresh ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleRefreshHsCode(it.id)}
                              className="mt-1 block text-[10px] font-bold text-[#014582] hover:underline disabled:opacity-50 font-sans"
                            >
                              Refresh HS code from product
                              {it.productHsCode ? ` (${it.productHsCode})` : ''}
                            </button>
                          ) : null}
                        </TradeTableCell>
                        <TradeTableCell className="font-bold">
                          {it.quantity} {it.uom}
                        </TradeTableCell>
                        <TradeTableCell>{formatMoney(target, selectedRfq.currency || 'USD')}</TradeTableCell>
                        <TradeTableCell className="font-semibold text-emerald-700">
                          {quotedNum != null
                            ? formatMoney(quotedNum, selectedRfq.currency || 'USD')
                            : '—'}
                        </TradeTableCell>
                        <TradeTableCell className="font-bold text-gray-900">
                          <span>{formatMoney(line.amount, selectedRfq.currency || 'USD')}</span>
                          {line.estimated ? (
                            <span className="block text-[10px] font-normal text-gray-400">
                              Estimated (target)
                            </span>
                          ) : null}
                        </TradeTableCell>
                      </TradeTableRow>
                    );
                  })}
                </TradeTableBody>
              </TradeTable>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900">
              <span className="font-bold block text-[11px] mb-1">Commercial Notes</span>
              <p className="text-xs whitespace-pre-wrap">{selectedRfq.notes?.trim() || 'No special instructions recorded.'}</p>
            </div>

            {(selectedRfq.singleSourceJustification ||
              selectedRfq.awardedAt ||
              selectedRfq.approvedAt ||
              (selectedRfq.statusHistory && selectedRfq.statusHistory.length > 0)) && (
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900">Approval trail</h4>
                <div className="p-3 rounded-xl border border-gray-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Awarded by</span>
                    <span className="font-semibold text-gray-900">
                      {displayUserLabel(selectedRfq.awardedByUser)}
                    </span>
                    {selectedRfq.awardedAt ? (
                      <span className="block text-[10px] text-gray-500">
                        {new Date(selectedRfq.awardedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Approved by</span>
                    <span className="font-semibold text-gray-900">
                      {displayUserLabel(selectedRfq.approvedByUser)}
                    </span>
                    {selectedRfq.approvedAt ? (
                      <span className="block text-[10px] text-gray-500">
                        {new Date(selectedRfq.approvedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>
                {selectedRfq.singleSourceJustification ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-950">
                    <span className="font-bold block text-[11px] mb-1">
                      {selectedRfq.singleSourceJustificationHistorical ||
                      (selectedRfq.distinctActiveSupplierCount ??
                        distinctActiveSupplierCount(selectedRfq.quotations || [])) >= 2
                        ? 'Single-source justification (at time of award)'
                        : 'Single-source justification'}
                    </span>
                    <p className="whitespace-pre-wrap">{selectedRfq.singleSourceJustification}</p>
                  </div>
                ) : null}
                {(selectedRfq.statusHistory || []).length > 0 ? (
                  <ul className="space-y-1.5 border border-gray-100 rounded-xl p-3 bg-gray-50">
                    {selectedRfq.statusHistory!.map((ev) => {
                      const reasonLabel = formatAuditReasonLabel(ev.reason);
                      return (
                      <li key={ev.id} className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
                        <span className="text-gray-400">
                          {ev.at ? new Date(ev.at).toLocaleString() : '—'}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {ev.from || '—'} → {ev.to || '—'}
                        </span>
                        <span className="text-gray-500">
                          {displayUserLabel(
                            ev.userName ? { name: ev.userName, email: null } : null,
                            'System'
                          )}
                        </span>
                        {reasonLabel ? (
                          <span className="text-amber-800">— {reasonLabel}</span>
                        ) : null}
                      </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-gray-900">Supplier Quotations</h4>
                {canAddQuotation(selectedRfq.status) && (
                  <button
                    type="button"
                    onClick={() => openQuoteModal(selectedRfq)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#014582] text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Quotation
                  </button>
                )}
              </div>

              {quotations.length === 0 ? (
                <p className="text-gray-500 text-xs py-4 text-center border border-dashed border-gray-200 rounded-xl">
                  No supplier quotations recorded yet.
                </p>
              ) : (
                <>
                  {selectedRfq.quotationsLocked ? (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      Quotations are locked while this RFQ is {selectedRfq.status}.
                      {selectedRfq.status === 'Awarded'
                        ? ' You can Change Award to another active quote, then Send for Approval.'
                        : selectedRfq.status === 'Pending Approval'
                          ? ' Waiting for an approver. Reject returns the RFQ to Awarded.'
                          : selectedRfq.status === 'Approved'
                            ? ' Reopen the RFQ to change the award.'
                            : ''}
                    </p>
                  ) : null}
                  {(() => {
                    const compareQuotes = activeQuotations(quotations);
                    if (compareQuotes.length < 2) return null;
                    const usdTotals = compareQuotes.map((q) => quoteComparableUsd(q));
                    const lowestUsd = Math.min(...usdTotals);
                    const lowestCount = usdTotals.filter((v) => v === lowestUsd).length;
                    const lowestLabel = lowestCount > 1 ? 'Lowest (tie)' : 'Lowest';
                    return (
                      <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40">
                        <span className="font-bold block text-[11px] mb-2 text-indigo-900">
                          Quotation comparison (active only · ranked by USD)
                        </span>
                        <TradeTable>
                          <TradeTableHeader
                            columns={[
                              'Supplier',
                              'Price',
                              'Currency',
                              'Lead time',
                              'Payment terms',
                              'Validity',
                            ]}
                          />
                          <TradeTableBody>
                            {compareQuotes.map((q) => {
                              const total = Number(q.totalForeign || 0);
                              const usd = quoteComparableUsd(q);
                              const isLowest = usd === lowestUsd;
                              return (
                                <TradeTableRow
                                  key={`cmp-${q.id}`}
                                  className={isLowest ? 'bg-emerald-50/80' : undefined}
                                >
                                  <TradeTableCell className="font-semibold">
                                    {q.supplierName}
                                    {Number(q.revision) > 1 ? (
                                      <span className="ml-1 text-[10px] text-gray-500">
                                        Rev {q.revision}
                                      </span>
                                    ) : null}
                                    {isLowest ? (
                                      <span className="ml-1 text-[10px] text-emerald-700 font-bold">
                                        {lowestLabel}
                                      </span>
                                    ) : null}
                                  </TradeTableCell>
                                  <TradeTableCell className="font-bold">
                                    {formatMoney(total, q.currency || selectedRfq.currency || 'USD')}
                                    <span className="block text-[10px] font-normal text-gray-400">
                                      ≈ {formatMoney(usd, 'USD')}
                                    </span>
                                  </TradeTableCell>
                                  <TradeTableCell className="font-mono">{q.currency || '—'}</TradeTableCell>
                                  <TradeTableCell>
                                    {q.leadTimeDays != null ? `${q.leadTimeDays} days` : '—'}
                                  </TradeTableCell>
                                  <TradeTableCell>{q.paymentTerms || '—'}</TradeTableCell>
                                  <TradeTableCell>
                                    {q.validUntil
                                      ? new Date(q.validUntil).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </TradeTableCell>
                                </TradeTableRow>
                              );
                            })}
                          </TradeTableBody>
                        </TradeTable>
                      </div>
                    );
                  })()}
                  <TradeTable>
                    <TradeTableHeader
                      columns={[
                        'Supplier',
                        'Currency',
                        'Total',
                        'Lead time',
                        'Payment terms',
                        'Validity',
                        'Status',
                        'Action',
                      ]}
                    />
                    <TradeTableBody>
                      {quotations.map((q) => {
                        const active = isActiveQuotation(q);
                        const isSelected = selectedRfq.selectedQuotationId === q.id;
                        const canAwardInitial = ['Quotes Received', 'Under Comparison'].includes(
                          selectedRfq.status
                        );
                        const canChangeAward = selectedRfq.status === 'Awarded' && !isSelected;
                        return (
                          <TradeTableRow
                            key={q.id}
                            className={!active ? 'opacity-60' : undefined}
                          >
                            <TradeTableCell>
                              <span className="font-semibold text-gray-900">{q.supplierName}</span>
                              {q.quotationNumber ? (
                                <span className="block text-[10px] text-gray-400 font-mono">
                                  {q.quotationNumber}
                                  {Number(q.revision) > 1 ? ` · Rev ${q.revision}` : ''}
                                </span>
                              ) : null}
                            </TradeTableCell>
                            <TradeTableCell className="font-mono">{q.currency || '—'}</TradeTableCell>
                            <TradeTableCell className="font-bold">
                              {formatMoney(
                                Number(q.totalForeign || 0),
                                q.currency || selectedRfq.currency || 'USD'
                              )}
                            </TradeTableCell>
                            <TradeTableCell>
                              {q.leadTimeDays != null ? `${q.leadTimeDays} days` : '—'}
                            </TradeTableCell>
                            <TradeTableCell className="max-w-[140px]">
                              <span className="truncate block" title={q.paymentTerms || ''}>
                                {q.paymentTerms || '—'}
                              </span>
                            </TradeTableCell>
                            <TradeTableCell>
                              {q.validUntil
                                ? new Date(q.validUntil).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </TradeTableCell>
                            <TradeTableCell>
                              <TradeStatusBadge status={q.status} />
                            </TradeTableCell>
                            <TradeTableCell>
                              {isSelected ? (
                                <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                  <Trophy className="w-3.5 h-3.5" /> Selected
                                </span>
                              ) : !active ? (
                                <span className="text-[11px] text-gray-400">History only</span>
                              ) : canAwardInitial ? (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSelectQuotation(q.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold disabled:opacity-40"
                                >
                                  Award
                                </button>
                              ) : canChangeAward ? (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSelectQuotation(q.id)}
                                  className="px-2.5 py-1 rounded-lg border border-emerald-600 text-emerald-700 text-[11px] font-bold disabled:opacity-40"
                                >
                                  Change Award
                                </button>
                              ) : (
                                <span className="text-[11px] text-gray-400">—</span>
                              )}
                            </TradeTableCell>
                          </TradeTableRow>
                        );
                      })}
                    </TradeTableBody>
                  </TradeTable>
                </>
              )}
            </div>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Import RFQ"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateRfq} className="space-y-4 text-xs">
          <FormSection title="Supplier & trade terms" subtitle="Required fields for overseas sourcing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <FieldLabel required>Supplier</FieldLabel>
                <SupplierSelectField
                  selected={
                    createSupplier
                      ? {
                          id: createSupplier.id || (createSupplier as { _id?: string })._id,
                          name: createSupplier.name || (createSupplier as { companyName?: string }).companyName,
                          country: (createSupplier as { country?: string }).country,
                          code: (createSupplier as { code?: string }).code,
                        }
                      : null
                  }
                  onSelect={(s) => {
                    setCreateSupplier(s);
                    if ((s as { country?: string }).country?.trim()) {
                      setCreateCountry((s as { country?: string }).country!.trim());
                    }
                  }}
                />
              </div>
              <div>
                <FieldLabel required>Supplier country</FieldLabel>
                <div className="relative">
                  <select
                    value={createCountry}
                    onChange={(e) => setCreateCountry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white appearance-none pr-8"
                    required
                  >
                    {countryNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Globe className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <FieldLabel required>Currency</FieldLabel>
                <CurrencySelect
                  value={createCurrency}
                  onChange={(code) => {
                    void handleCreateCurrencyChange(code);
                  }}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Supplier / RFQ currency. Product prices convert from app currency (
                  {appCurrencyCode}).
                </p>
              </div>
              <div>
                <FieldLabel required>Incoterms 2020</FieldLabel>
                <select
                  value={createIncoterm}
                  onChange={(e) => setCreateIncoterm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
                  required
                >
                  {INCOTERMS_2020.map((code) => (
                    <option key={code} value={code}>
                      {INCOTERM_LABELS[code] || code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel required>Port of discharge</FieldLabel>
                <PortSelect
                  value={createPortId}
                  required
                  onChange={(id, port) => {
                    setCreatePortId(id);
                    setCreatePortLabel(
                      port ? `${port.name} ${port.unLocode} ${port.portType || ''}` : ''
                    );
                  }}
                />
              </div>
            </div>
            {createSeaWarning && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createSeaWarning}</span>
              </div>
            )}
            <div>
              <FieldLabel required>Expected delivery date</FieldLabel>
              <input
                type="date"
                min={todayIso}
                value={createExpectedDelivery}
                onChange={(e) => setCreateExpectedDelivery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <FieldLabel>Special notes</FieldLabel>
              <textarea
                rows={2}
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Certificates, packaging, inspection requirements…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </FormSection>

          <FormSection
            title="Product lines"
            subtitle={`Pick from inventory; target price shows in RFQ currency (${createCurrency || '—'})`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <ProductSelectButton
                label="Add product"
                onSelect={(products) => {
                  void addProductsWithConversion(products);
                }}
              />
              <button
                type="button"
                onClick={() => setProductPickOpen(true)}
                disabled={fxConverting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Package className="w-3.5 h-3.5" /> Single pick…
              </button>
              {fxConverting ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#014582]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Converting prices…
                </span>
              ) : null}
            </div>
            {fxHint ? (
              <div
                className={`flex items-start gap-2 p-2.5 rounded-xl text-[11px] border ${
                  fxHint.startsWith('No conversion')
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-sky-50 border-sky-200 text-sky-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{fxHint}</span>
              </div>
            ) : null}
            <ProductPickerModal
              isOpen={productPickOpen}
              onClose={() => setProductPickOpen(false)}
              multi={false}
              onSelect={(products) => {
                void addProductsWithConversion(products);
                setProductPickOpen(false);
              }}
            />

            {createLines.length === 0 ? (
              <p className="text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                Add at least one product line.
              </p>
            ) : (
              <div className="space-y-3">
                {createLines.map((line, idx) => (
                  <div key={line.key} className="p-3 rounded-xl border border-gray-100 bg-gray-50/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{line.productName}</p>
                        {line.sku ? <p className="font-mono text-[10px] text-gray-500">{line.sku}</p> : null}
                        {line.sourcePriceApp > 0 &&
                        createCurrency &&
                        appCurrencyCode &&
                        createCurrency.toUpperCase() !== appCurrencyCode.toUpperCase() ? (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            App price: {formatMoney(line.sourcePriceApp, appCurrencyCode)}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreateLines((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 font-bold text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <FieldLabel required>Qty</FieldLabel>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={line.quantity}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setCreateLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, quantity: v } : l))
                            );
                          }}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel required>
                          Target price ({createCurrency || '—'})
                        </FieldLabel>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={line.targetPrice}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setCreateLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, targetPrice: v } : l))
                            );
                          }}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel>UOM</FieldLabel>
                        <input
                          type="text"
                          value={line.uom}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCreateLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, uom: v } : l))
                            );
                          }}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <FieldLabel>HS code</FieldLabel>
                        <input
                          type="text"
                          placeholder="e.g. 1006.30"
                          value={line.hsCode}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCreateLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, hsCode: v } : l))
                            );
                          }}
                          className={`w-full rounded-lg border px-2 py-1.5 text-xs font-mono ${
                            line.hsCode.trim() && !isValidHsCode(line.hsCode)
                              ? 'border-red-300'
                              : 'border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                    {!line.hsCode.trim() ? (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          HS code missing. Required before PO conversion.{' '}
                          {line.productId ? (
                            <Link
                              href={`/products?highlight=${encodeURIComponent(line.productId)}`}
                              className="font-bold underline hover:no-underline"
                              target="_blank"
                            >
                              Open product
                            </Link>
                          ) : null}
                        </span>
                      </div>
                    ) : line.hsCode.trim() && !isValidHsCode(line.hsCode) ? (
                      <p className="text-[11px] text-red-600">
                        Invalid HS code. Use 6–10 digits with optional dots (e.g. 940542 or 9405.42).
                      </p>
                    ) : null}
                    <p className="text-[10px] text-gray-500">
                      Line total:{' '}
                      <strong className="text-[#014582]">
                        {formatMoney(line.quantity * line.targetPrice, createCurrency)}
                      </strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Import RFQ
            </button>
          </div>
        </form>
      </TradeModal>

      <TradeModal
        isOpen={quoteOpen}
        onClose={() => {
          setQuoteOpen(false);
          setQuoteModalError(null);
        }}
        title="Add Supplier Quotation"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-3 text-xs">
          {quoteModalError ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{quoteModalError}</span>
            </div>
          ) : null}
          <div>
            <FieldLabel required>Supplier</FieldLabel>
            <SupplierSelectField
              selected={
                quoteSupplier
                  ? {
                      id: quoteSupplier.id || (quoteSupplier as { _id?: string })._id,
                      name: quoteSupplier.name || (quoteSupplier as { companyName?: string }).companyName,
                      country: (quoteSupplier as { country?: string }).country,
                    }
                  : null
              }
              onSelect={(supplier) => {
                applySupplierToQuoteForm(supplier, selectedRfq?.currency || quoteCurrency, {
                  fillPaymentTerms: true,
                });
                const code =
                  supplier?.currency?.code ||
                  selectedRfq?.currency ||
                  quoteCurrency;
                void resolveQuoteFxRate(
                  String(code),
                  Number(quoteUnitPrice || 0) * Number(quoteQty || 1) || 1
                );
              }}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Prefills from this RFQ&apos;s supplier; currency comes from the supplier master when set.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Currency</FieldLabel>
              <CurrencySelect
                value={quoteCurrency}
                onChange={(c) => {
                  setQuoteCurrency(c);
                  void resolveQuoteFxRate(
                    c,
                    Number(quoteUnitPrice || 0) * Number(quoteQty || 1) || 1
                  );
                }}
              />
              {quoteSupplier?.currency?.code ? (
                <p className="text-[10px] text-gray-400 mt-1">
                  Supplier default: {quoteSupplier.currency.code}
                </p>
              ) : null}
            </div>
            <div>
              <FieldLabel required>Unit price</FieldLabel>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={quoteUnitPrice}
                onChange={(e) => setQuoteUnitPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <FieldLabel required>Quantity</FieldLabel>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={quoteQty}
                onChange={(e) => setQuoteQty(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <FieldLabel required>Valid until</FieldLabel>
              <input
                type="date"
                min={todayIso}
                value={quoteValidUntil}
                onChange={(e) => setQuoteValidUntil(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <FieldLabel required>Lead time (days)</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={quoteLeadDays}
                onChange={(e) => setQuoteLeadDays(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <FieldLabel>Exchange rate → {appCurrencyCode}</FieldLabel>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={quoteExchangeRate}
                onChange={(e) => setQuoteExchangeRate(e.target.value)}
                placeholder={`1 ${quoteCurrency || 'foreign'} = ? ${appCurrencyCode}`}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </div>
          {quoteFxHint ? (
            <p
              className={`text-[11px] rounded-xl px-3 py-2 border ${
                quoteFxHint.startsWith('No company') || quoteFxHint.startsWith('No exchange')
                  ? 'bg-amber-50 border-amber-100 text-amber-900'
                  : 'bg-sky-50 border-sky-100 text-sky-900'
              }`}
            >
              {quoteFxHint}
            </p>
          ) : null}
          <div>
            <FieldLabel required>Payment terms</FieldLabel>
            <input
              type="text"
              value={quotePaymentTerms}
              onChange={(e) => setQuotePaymentTerms(e.target.value)}
              placeholder="e.g. 30% advance, 70% against BL"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              required
            />
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              rows={2}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setQuoteOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save quotation'}
            </button>
          </div>
        </form>
      </TradeModal>

      <TradeModal
        isOpen={awardOpen}
        onClose={() => {
          setAwardOpen(false);
          setAwardQuotationId(null);
        }}
        title="Single-source justification"
        maxWidth="max-w-md"
      >
        <form
          className="space-y-3 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (!awardQuotationId) return;
            if (!awardJustification.trim()) {
              setError(
                'Single-source justification is required when fewer than 2 distinct suppliers have active quotations'
              );
              return;
            }
            void handleSelectQuotation(awardQuotationId, {
              justification: awardJustification.trim(),
            });
          }}
        >
          <p className="text-gray-600">
            Fewer than two distinct suppliers have active quotations. Enter a justification before
            awarding.
          </p>
          <div>
            <FieldLabel required>Justification</FieldLabel>
            <textarea
              rows={4}
              value={awardJustification}
              onChange={(e) => setAwardJustification(e.target.value)}
              placeholder="e.g. Sole authorized distributor for this SKU in the region"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setAwardOpen(false);
                setAwardQuotationId(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Awarding…' : 'Award quotation'}
            </button>
          </div>
        </form>
      </TradeModal>

      <TradeModal
        isOpen={changeAwardOpen}
        onClose={() => {
          setChangeAwardOpen(false);
          setAwardQuotationId(null);
        }}
        title="Change award"
        maxWidth="max-w-md"
      >
        <form
          className="space-y-3 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (!awardQuotationId) return;
            if (!changeAwardReason.trim()) {
              setError('A reason is required to change the awarded quotation');
              return;
            }
            void handleSelectQuotation(awardQuotationId, {
              changeReason: changeAwardReason.trim(),
            });
          }}
        >
          <p className="text-gray-600">
            Changing the award updates Awarded Total and the approval trail. Provide a reason.
          </p>
          <div>
            <FieldLabel required>Reason</FieldLabel>
            <textarea
              rows={3}
              value={changeAwardReason}
              onChange={(e) => setChangeAwardReason(e.target.value)}
              placeholder="e.g. Better lead time on revised quotation"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setChangeAwardOpen(false);
                setAwardQuotationId(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Updating…' : 'Change award'}
            </button>
          </div>
        </form>
      </TradeModal>

      <TradeModal
        isOpen={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen RFQ"
        maxWidth="max-w-md"
      >
        <form
          className="space-y-3 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            void handleReopenRfq();
          }}
        >
          <p className="text-gray-600">
            Reopening clears approval so the award can be changed. Convert to PO will be blocked until
            the RFQ is approved again.
          </p>
          <div>
            <FieldLabel required>Reason</FieldLabel>
            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Supplier revised commercial terms after approval"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setReopenOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Reopening…' : 'Reopen RFQ'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
