'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  deriveProductTaxType,
  formatTaxRateLabel,
  loadTaxContext,
  type TaxRateOption,
} from '../lib/tax-service';

export default function TaxRateSelect({
  value,
  typeHint,
  onChange,
  className = '',
  autoDefault = false,
}: {
  value: number;
  typeHint?: string;
  onChange: (rate: number, option?: TaxRateOption) => void;
  className?: string;
  autoDefault?: boolean;
}) {
  const [rates, setRates] = useState<TaxRateOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadTaxContext()
      .then((ctx) => {
        if (cancelled) return;
        const list = ctx.rates || [];
        setRates(list);
        setConfigured(Boolean(ctx.configured));
        setEnabled(Boolean(ctx.enabled));
        if (!ctx.enabled) {
          if (Number(value) !== 0) onChange(0);
          return;
        }
        if (autoDefault && !(Number(value) > 0) && ctx.defaultRate) {
          const def = list.find((r) => r.id === ctx.defaultRate.id) || list.find((r) => r.isDefault) || list[0];
          if (def) onChange(def.rate, def);
        }
      })
      .catch(() => {
        if (!cancelled) setRates([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => {
    const numeric = Number(value) || 0;
    const hint = (typeHint || '').toLowerCase();
    return (
      rates.find((r) => hint && Number(r.rate) === numeric && (r.taxTypeName || '').toLowerCase() === hint) ||
      rates.find((r) => Number(r.rate) === numeric && r.isDefault) ||
      rates.find((r) => Number(r.rate) === numeric) ||
      null
    );
  }, [rates, value, typeHint]);

  if (loaded && !enabled) {
    return (
      <div className="text-xs text-gray-500 px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50">
        Tax not used —{' '}
        <Link href="/tax/setup" className="text-[#014582] font-medium">turn on</Link>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center min-w-0">
      <select
        value={selected?.id || (numericKey(value))}
        onChange={(e) => {
          const option = rates.find((r) => r.id === e.target.value);
          if (option) {
            onChange(option.rate, option);
            return;
          }
          onChange(parseFloat(e.target.value) || 0);
        }}
        className={className}
      >
        <option value="0">Exempt / none · 0%</option>
        {rates.map((r) => (
          <option key={r.id} value={r.id}>
            {formatTaxRateLabel(r)}{r.isDefault ? ' (default)' : ''}
          </option>
        ))}
        {!selected && Number(value) > 0 && (
          <option value={numericKey(value)}>Custom {value}%</option>
        )}
      </select>
      {loaded && (!configured || rates.length === 0) && (
        <Link href="/tax/setup" className="text-xs text-[#014582] whitespace-nowrap">
          Set up tax
        </Link>
      )}
    </div>
  );
}

function numericKey(value: number) {
  return String(Number(value) || 0);
}

export function ProductTaxFields({
  taxRate,
  taxType,
  onChange,
  selectClassName,
}: {
  taxRate: number | string;
  taxType?: string;
  onChange: (next: { taxRate: string; taxType: string }) => void;
  selectClassName?: string;
}) {
  const [pricingHint, setPricingHint] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadTaxContext()
      .then((ctx) => {
        setEnabled(Boolean(ctx.enabled));
        if (!ctx.enabled) {
          onChange({ taxRate: '0', taxType: 'Exclusive' });
          setPricingHint('Taxation is turned off for this company.');
          return;
        }
        const model = ctx.pricingModel === 'inclusive' ? 'Tax inclusive' : 'Tax exclusive';
        const regime = ctx.regime ? `${ctx.regime} · ` : '';
        setPricingHint(`${regime}${model} (company profile)`);
      })
      .catch(() => {});
  }, []);

  if (!enabled) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs md:text-sm font-semibold text-gray-700">Tax</label>
        <p className="text-sm text-gray-500">
          Taxation is off for this company. Documents will not add VAT/GST.{' '}
          <Link href="/tax/setup" className="text-[#014582] font-medium">Enable in Tax Compliance</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs md:text-sm font-semibold text-gray-700">Tax class</label>
      <TaxRateSelect
        value={parseFloat(String(taxRate)) || 0}
        typeHint={taxType}
        autoDefault={!taxRate}
        onChange={(rate, option) => {
          onChange({
            taxRate: String(rate),
            taxType: deriveProductTaxType(option, option?.pricingModel),
          });
        }}
        className={selectClassName || 'w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50'}
      />
      <p className="text-[11px] text-gray-500">
        {pricingHint || 'Rates are managed in Tax Compliance — not warehouse settings.'}
        {' '}
        <Link href="/tax/rates" className="text-[#014582] font-medium">Edit rates</Link>
      </p>
    </div>
  );
}

export function TaxCodeSelect({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  const [options, setOptions] = useState<string[]>(['N/A']);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadTaxContext()
      .then((ctx) => {
        setEnabled(Boolean(ctx.enabled));
        if (!ctx.enabled) {
          setOptions(['N/A']);
          if (value && value !== 'N/A') onChange('N/A');
          return;
        }
        const live = (ctx.rates || []).map((r) => formatTaxRateLabel(r));
        const next = ['N/A', ...live];
        if (value && !next.includes(value)) next.push(value);
        setOptions(next);
      })
      .catch(() => setOptions(['N/A', value].filter(Boolean)));
  }, [value]);

  if (!enabled) {
    return (
      <select value="N/A" disabled className={`${className} opacity-60`}>
        <option value="N/A">N/A — tax off</option>
      </select>
    );
  }

  return (
    <select value={value || 'N/A'} onChange={(e) => onChange(e.target.value)} className={className}>
      {options.map((tax) => (
        <option key={tax} value={tax}>{tax}</option>
      ))}
    </select>
  );
}
