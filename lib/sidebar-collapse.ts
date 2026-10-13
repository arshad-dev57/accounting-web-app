'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'app-sidebar-collapsed';
const EVENT = 'app-sidebar-collapsed-changed';

type Listener = () => void;
const listeners = new Set<Listener>();

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  const onCustom = () => listener();
  window.addEventListener('storage', onStorage);
  window.addEventListener(EVENT, onCustom);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(EVENT, onCustom);
  };
}

function getSnapshot() {
  return readCollapsed();
}

function getServerSnapshot() {
  return false;
}

/** Shared collapse state across all app sidebars (persisted). */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(readCollapsed()) : next;
    writeCollapsed(Boolean(value));
  }, []);

  const toggle = useCallback(() => {
    writeCollapsed(!readCollapsed());
  }, []);

  return { collapsed, setCollapsed, toggle };
}

/** Keep CSS var in sync so main content margin follows sidebar width. */
export function useSidebarWidthVar(expandedPx: number) {
  const { collapsed } = useSidebarCollapsed();

  useEffect(() => {
    const width = collapsed ? 64 : expandedPx;
    document.documentElement.style.setProperty('--app-sidebar-width', `${width}px`);
    document.documentElement.dataset.sidebarCollapsed = collapsed ? 'true' : 'false';
  }, [collapsed, expandedPx]);

  return collapsed;
}

export function sidebarMainClassName(extra = '') {
  return `min-h-screen flex flex-col transition-[margin] duration-200 ease-out ml-[var(--app-sidebar-width,16rem)] ${extra}`.trim();
}
