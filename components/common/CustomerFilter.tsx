'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import { customerService } from '@/api/customer/route';

export type CustomerFilterValue = { id: string; name: string; customerNumber?: string };

function toOptions(rows: any[]): CustomerFilterValue[] {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const id = row?.id || row?._id;
      const name = row?.name || row?.companyName || row?.company || '';
      if (!id || !name) return null;
      return { id: String(id), name: String(name), customerNumber: row?.customerNumber };
    })
    .filter(Boolean) as CustomerFilterValue[];
}

export function CustomerFilter({
  value,
  onChange,
}: {
  value: CustomerFilterValue | null;
  onChange: (next: CustomerFilterValue | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState<CustomerFilterValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customerService
      .getCustomers({ page: 1, limit: 50 })
      .then((res) => {
        if (!cancelled) setOptions(toOptions(res.data));
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

  useEffect(() => {
    if (!open || !touched) return;
    const search = term.trim();
    if (!search) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      setLoading(true);
      customerService
        .searchCustomers(search, 20)
        .then((rows) => {
          if (!cancelled) setOptions(toOptions(rows));
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [term, open, touched]);

  const displayValue = open ? term : value?.name || '';

  const handleFocus = useCallback(() => {
    setOpen(true);
    setTerm('');
    setTouched(false);
  }, []);

  const handleTerm = (next: string) => {
    setTerm(next);
    setTouched(true);
    if (!next.trim() && value) onChange(null);
  };

  const filtered = useMemo(() => {
    const search = term.trim().toLowerCase();
    if (!search) return options;
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(search) ||
        (option.customerNumber || '').toLowerCase().includes(search)
    );
  }, [options, term]);

  return (
    <div ref={boxRef} className="relative min-w-[230px]">
      <label className="text-[10px] font-bold uppercase text-gray-500 flex flex-col gap-1">
        Customer
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg bg-white px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={displayValue}
            onFocus={handleFocus}
            onChange={(event) => handleTerm(event.target.value)}
            placeholder={value ? value.name : 'All customers'}
            className="w-full bg-transparent text-xs font-medium text-gray-700 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />
          ) : value ? (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setTerm('');
                setOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              title="Clear customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}
        </div>
      </label>

      {open ? (
        <div className="absolute z-40 mt-1 w-full max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setTerm('');
            }}
            className={`w-full text-left px-3 py-2 text-xs font-semibold ${
              value ? 'text-gray-600 hover:bg-gray-50' : 'bg-[#014582]/5 text-[#014582]'
            }`}
          >
            All customers
          </button>
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-400">No customers found</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setTerm('');
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                  value?.id === option.id ? 'bg-[#014582]/5 text-[#014582] font-bold' : 'text-gray-700'
                }`}
              >
                <span className="block font-semibold">{option.name}</span>
                {option.customerNumber ? (
                  <span className="block text-[10px] text-gray-400">{option.customerNumber}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
