'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type NavLayoutMode = 'sidebar' | 'topbar';

const STORAGE_KEY = 'bisonstechs_nav_layout';
const EVENT = 'bisonstechs-nav-layout-changed';

type Listener = () => void;
const listeners = new Set<Listener>();

function readMode(): NavLayoutMode {
  if (typeof window === 'undefined') return 'sidebar';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'topbar' ? 'topbar' : 'sidebar';
  } catch {
    return 'sidebar';
  }
}

function writeMode(next: NavLayoutMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
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
  return readMode();
}

function getServerSnapshot(): NavLayoutMode {
  return 'sidebar';
}

/** Global app chrome preference: left sidebar vs top dropdown bar. */
export function useNavLayout() {
  const layout = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLayout = useCallback((next: NavLayoutMode) => {
    writeMode(next);
  }, []);

  return { layout, setLayout, isTopbar: layout === 'topbar', isSidebar: layout === 'sidebar' };
}

export function getNavLayoutMode(): NavLayoutMode {
  return readMode();
}
