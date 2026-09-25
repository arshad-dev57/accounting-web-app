'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  CornerDownLeft,
  Factory,
  Home,
  Package,
  Scale,
  Search,
  ShoppingCart,
  Store,
  UsersRound,
  Warehouse,
  X,
} from 'lucide-react';
import { usePermissions } from '../lib/usePermissions';
import {
  GLOBAL_SEARCH_PAGES,
  QUICK_ACCESS_LIMIT,
  SEARCH_GROUPS,
  groupGlobalSearchResults,
  searchGlobalPages,
  splitHighlight,
  type GlobalSearchGroupKey,
} from '../lib/global-search';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '../lib/subscription-ui';

const GROUP_ICONS: Record<GlobalSearchGroupKey, ElementType> = {
  home: Home,
  accounting: Calculator,
  sales: ShoppingCart,
  purchases: Package,
  warehouse: Warehouse,
  manufacturing: Factory,
  hr: UsersRound,
  tax: Scale,
  pos: Store,
};

const MAX_RESULTS = 48;
/** Space (px) the panel needs — used to decide whether it opens up or down. */
const PANEL_SPACE = 420;

/**
 * Header search: a small icon that expands into an animated page-search panel
 * anchored to the icon. Any page of the app can be found by name and opened
 * with a click, ⌘K / Ctrl+K or Enter.
 */
export default function GlobalSearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const { isAdmin, loading, canViewRegisteredUsers, hasSubPageAccess } =
    usePermissions();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Pages the current user may open — mirrors the sidebar permission rules.
  const allowedPages = useMemo(
    () =>
      GLOBAL_SEARCH_PAGES.filter((page) => {
        if (
          !SUBSCRIPTION_PURCHASE_UI_ENABLED &&
          (page.path === '/plans' || page.path === '/billing')
        ) {
          return false;
        }
        if (page.ownerOnly) return canViewRegisteredUsers;
        if (page.adminOnly) return isAdmin;
        // Permissions are read from localStorage after mount; until they are
        // available show everything instead of flashing an empty list.
        if (loading || isAdmin) return true;
        if (!page.module || !page.permission) return true;
        return hasSubPageAccess(page.module, page.permission);
      }),
    [isAdmin, loading, canViewRegisteredUsers, hasSubPageAccess]
  );

  const results = useMemo(
    () => searchGlobalPages(query, allowedPages, MAX_RESULTS),
    [query, allowedPages]
  );

  // Group results and remember where each group starts inside the flat list so
  // keyboard navigation and rendering use the same index.
  const groupedResults = useMemo(() => {
    const groups = groupGlobalSearchResults(results);
    return groups.map((group, groupIndex) => ({
      ...group,
      start: groups
        .slice(0, groupIndex)
        .reduce((total, previous) => total + previous.items.length, 0),
    }));
  }, [results]);

  const quickLinks = useMemo(
    () =>
      (Object.keys(SEARCH_GROUPS) as GlobalSearchGroupKey[])
        .map((key) => ({ key, ...SEARCH_GROUPS[key] }))
        .filter((group) =>
          allowedPages.some((page) => page.path === group.href)
        )
        .slice(0, QUICK_ACCESS_LIMIT),
    [allowedPages]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const openPanel = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setOpenUp(window.innerHeight - rect.bottom < PANEL_SPACE);
    }
    setActiveIndex(0);
    setOpen(true);
  }, []);

  const toggle = useCallback(() => {
    if (open) close();
    else openPanel();
  }, [open, close, openPanel]);

  // Close when clicking anywhere outside the search.
  useEffect(() => {
    if (!open) return;
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, [open, close]);

  // ⌘K / Ctrl+K toggles the search from anywhere in the app.
  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
        return;
      }
      event.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [toggle]);

  // Focus the input once the opening animation has started.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Keep the keyboard-highlighted row inside the visible list.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, results]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      buttonRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current + 1) % results.length : 0
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) {
        close();
        router.push(target.path);
      }
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const panelPosition = openUp
    ? 'bottom-full mb-2 origin-bottom-right'
    : 'top-full mt-2 origin-top-right';

  const panelAnimation = open
    ? 'visible translate-y-0 scale-100 opacity-100'
    : `invisible scale-95 opacity-0 ${
        openUp ? 'translate-y-1' : '-translate-y-1'
      }`;

  const hasQuery = query.trim().length > 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Search pages"
        aria-expanded={open}
        title="Search pages (⌘K)"
        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all ${
          open
            ? 'bg-[#014582]/10 text-[#014582]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1 text-[10px] font-medium text-gray-400 xl:inline">
          ⌘K
        </kbd>
      </button>

      <div
        role="dialog"
        aria-label="Search pages"
        aria-hidden={!open}
        className={`absolute right-0 z-50 w-[330px] max-w-[92vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 transition-[opacity,transform,visibility] duration-200 ease-out ${panelPosition} ${panelAnimation}`}
      >
        {/* Search field */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
          <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search any page…"
            aria-label="Search any page"
            autoComplete="off"
            spellCheck={false}
            className="w-full min-w-0 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                handleQueryChange('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex-shrink-0 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto overscroll-contain py-1"
        >
          {!hasQuery ? (
            <div className="px-3 py-2">
              <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Quick access
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={close}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-[#014582]/30 hover:bg-[#014582]/5 hover:text-[#014582]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="px-1 pt-3 text-xs text-gray-400">
                Type a page name — e.g. “journal”, “payroll”, “stock”.
              </p>
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              No page matches “{query.trim()}”
            </p>
          ) : (
            groupedResults.map((group) => {
              const Icon = GROUP_ICONS[group.key] ?? Search;
              return (
                <div key={group.key} className="pb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.label}
                  </p>
                  {group.items.map((page, index) => {
                    const flatIndex = group.start + index;
                    const active = flatIndex === activeIndex;
                    return (
                      <Link
                        key={page.path}
                        href={page.path}
                        data-index={flatIndex}
                        onClick={close}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-[#014582]/5 text-[#01366a]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            active ? 'text-[#014582]' : 'text-gray-400'
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {splitHighlight(page.label, query).map(
                            (part, partIndex) =>
                              part.match ? (
                                <span
                                  key={partIndex}
                                  className="font-semibold text-[#014582]"
                                >
                                  {part.text}
                                </span>
                              ) : (
                                <span key={partIndex}>{part.text}</span>
                              )
                          )}
                        </span>
                        <span className="max-w-[40%] truncate text-[10px] text-gray-400">
                          {page.path}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Shortcut hints */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            open
          </span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

