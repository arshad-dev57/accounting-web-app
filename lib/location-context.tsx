'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ALL_LOCATIONS_VALUE,
  Location,
  LOCATION_STORAGE_KEY,
  LOCATIONS_CACHE_EVENT,
  effectiveLocationId,
  getCachedLocations,
  getStoredLocationId,
  isAllLocationsId,
  locationService,
  setStoredLocationId,
} from './location-service';

interface LocationContextValue {
  locations: Location[];
  selectedLocation: Location | null;
  /** Raw selection; may be ALL_LOCATIONS_VALUE when allowAll is enabled. */
  selectedLocationId: string;
  /** Empty when All is selected — safe to put on API query params. */
  locationIdForApi: string;
  isAllLocations: boolean;
  allowAll: boolean;
  loading: boolean;
  error: string;
  setSelectedLocationId: (id: string) => void;
  refresh: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

function pickDefault(
  locations: Location[],
  preferredId: string | null
): Location | null {
  if (!locations.length) return null;
  if (preferredId && !isAllLocationsId(preferredId)) {
    const match = locations.find((l) => l.id === preferredId);
    if (match) return match;
  }
  return locations.find((l) => l.isDefault) || locations[0];
}

function applySelection(
  list: Location[],
  allowAll: boolean,
  setSelectedId: (id: string) => void
) {
  const stored = getStoredLocationId();
  if (allowAll && isAllLocationsId(stored)) {
    setSelectedId(ALL_LOCATIONS_VALUE);
    return;
  }
  if (allowAll && !stored) {
    setSelectedId(ALL_LOCATIONS_VALUE);
    setStoredLocationId(ALL_LOCATIONS_VALUE);
    return;
  }
  const preferred = !allowAll && isAllLocationsId(stored) ? null : stored;
  const chosen = pickDefault(list, preferred);
  const id = chosen?.id || '';
  setSelectedId(id);
  if (!(!allowAll && isAllLocationsId(stored))) {
    setStoredLocationId(id || null);
  }
}

export function LocationProvider({
  children,
  allowAll = false,
}: {
  children: React.ReactNode;
  /** When true, "All locations" is a valid selection (accounting). */
  allowAll?: boolean;
}) {
  const [locations, setLocations] = useState<Location[]>(() =>
    typeof window === 'undefined' ? [] : getCachedLocations()
  );
  const [selectedLocationId, setSelectedId] = useState(() =>
    typeof window === 'undefined' ? '' : getStoredLocationId() || ''
  );
  const [loading, setLoading] = useState(
    () => (typeof window === 'undefined' ? true : getCachedLocations().length === 0)
  );
  const [error, setError] = useState('');
  const [ready, setReady] = useState(
    () => (typeof window === 'undefined' ? false : getCachedLocations().length > 0)
  );

  const refresh = useCallback(async () => {
    setError('');
    try {
      const list = await locationService.list();
      setLocations(list);
      applySelection(list, allowAll, setSelectedId);
    } catch (e: any) {
      setError(e?.message || 'Failed to load locations');
      const cached = getCachedLocations();
      if (cached.length) setLocations(cached);
      else setLocations([]);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [allowAll]);

  useEffect(() => {
    const cached = getCachedLocations();
    if (cached.length) {
      setLocations(cached);
      applySelection(cached, allowAll, setSelectedId);
      setLoading(false);
      setReady(true);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onCache = () => {
      const list = getCachedLocations();
      setLocations(list);
      applySelection(list, allowAll, setSelectedId);
    };
    window.addEventListener(LOCATIONS_CACHE_EVENT, onCache);
    return () => window.removeEventListener(LOCATIONS_CACHE_EVENT, onCache);
  }, [allowAll]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCATION_STORAGE_KEY) {
        const next = e.newValue || '';
        if (allowAll && isAllLocationsId(next)) {
          setSelectedId(ALL_LOCATIONS_VALUE);
        } else if (next) {
          setSelectedId(next);
        }
        return;
      }
      if (e.key === 'cached_locations') {
        const list = getCachedLocations();
        setLocations(list);
        applySelection(list, allowAll, setSelectedId);
      }
    };
    const onLocal = (e: Event) => {
      const id = (e as CustomEvent)?.detail?.id;
      if (typeof id !== 'string') return;
      if (allowAll && isAllLocationsId(id)) {
        setSelectedId(ALL_LOCATIONS_VALUE);
      } else if (id) {
        setSelectedId(id);
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('location-changed', onLocal as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('location-changed', onLocal as EventListener);
    };
  }, [allowAll]);

  const setSelectedLocationId = useCallback(
    (id: string) => {
      const next = String(id || '').trim();
      if (allowAll && isAllLocationsId(next)) {
        if (selectedLocationId === ALL_LOCATIONS_VALUE) return;
        setSelectedId(ALL_LOCATIONS_VALUE);
        setStoredLocationId(ALL_LOCATIONS_VALUE);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('location-changed', {
              detail: { id: ALL_LOCATIONS_VALUE },
            })
          );
        }
        return;
      }
      if (!next || next === selectedLocationId) return;
      if (!locations.some((l) => l.id === next)) return;
      setSelectedId(next);
      setStoredLocationId(next);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('location-changed', { detail: { id: next } })
        );
      }
    },
    [allowAll, locations, selectedLocationId]
  );

  const selectedLocation = useMemo(
    () =>
      isAllLocationsId(selectedLocationId)
        ? null
        : locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );

  const resolvedId = ready ? selectedLocationId : '';
  const isAll = allowAll && isAllLocationsId(resolvedId);

  const value = useMemo(
    () => ({
      locations,
      selectedLocation,
      selectedLocationId: resolvedId,
      locationIdForApi: effectiveLocationId(resolvedId),
      isAllLocations: isAll,
      allowAll,
      loading: loading || !ready,
      error,
      setSelectedLocationId,
      refresh,
    }),
    [
      locations,
      selectedLocation,
      resolvedId,
      isAll,
      allowAll,
      ready,
      loading,
      error,
      setSelectedLocationId,
      refresh,
    ]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return ctx;
}

/** Safe hook when provider may be missing (returns empty defaults). */
export function useLocationOptional(): LocationContextValue {
  const ctx = useContext(LocationContext);
  return (
    ctx || {
      locations: [],
      selectedLocation: null,
      selectedLocationId: '',
      locationIdForApi: '',
      isAllLocations: true,
      allowAll: false,
      loading: false,
      error: '',
      setSelectedLocationId: () => {},
      refresh: async () => {},
    }
  );
}
