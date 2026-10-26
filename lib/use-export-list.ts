'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExportListQuery, Paginated } from './export-api';

function useDebounced(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

interface UseExportListOptions {
  limit?: number;
  initialStatus?: string;
  extraQuery?: Record<string, unknown>;
  enabled?: boolean;
}

export function useExportList<T>(
  fetcher: (query: ExportListQuery) => Promise<Paginated<T>>,
  options: UseExportListOptions = {}
) {
  const { limit = 20, initialStatus = '', extraQuery, enabled = true } = options;
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState('');
  const [status, setStatusState] = useState(initialStatus);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebounced(search);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const extraRef = useRef(extraQuery);
  extraRef.current = extraQuery;
  const extraKey = JSON.stringify(extraQuery || {});

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
        ...(extraRef.current || {}),
      });
      setItems(res?.items || []);
      setTotal(res?.pagination?.total ?? 0);
      setPages(res?.pagination?.pages ?? 1);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || 'Failed to load records'
      );
      setItems([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, sortBy, sortOrder, extraKey, enabled]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    const onCompanyChange = () => {
      setPage(1);
      setItems([]);
      setReloadKey((v) => v + 1);
    };
    window.addEventListener('active-company-changed', onCompanyChange);
    return () => window.removeEventListener('active-company-changed', onCompanyChange);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setStatus = useCallback((value: string) => {
    setStatusState(value);
    setPage(1);
  }, []);

  const changePage = useCallback((next: number) => {
    setPage(Math.max(1, next));
  }, []);

  const toggleSort = useCallback(
    (field: string) => {
      setSortBy(field);
      setSortOrder((prev) => (sortBy === field && prev === 'desc' ? 'asc' : 'desc'));
      setPage(1);
    },
    [sortBy]
  );

  const reload = useCallback(() => setReloadKey((v) => v + 1), []);

  const pageInfo = useMemo(
    () => ({
      page,
      limit,
      total,
      pages,
    }),
    [page, limit, total, pages]
  );

  return {
    items,
    setItems,
    total,
    pages,
    page,
    pageInfo,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    sortBy,
    sortOrder,
    toggleSort,
    changePage,
    reload,
  };
}

export default useExportList;
