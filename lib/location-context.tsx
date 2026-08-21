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
  effectiveLocationId,
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

export function LocationProvider({
  children,
  allowAll = false,
}: {
  children: React.ReactNode;
  /** When true, "All locations" is a valid selection (accounting). */
  allowAll?: boolean;
}) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await locationService.list();
      setLocations(list);
      const stored = getStoredLocationId();

      if (allowAll && isAllLocationsId(stored)) {
        setSelectedId(ALL_LOCATIONS_VALUE);
        setStoredLocationId(ALL_LOCATIONS_VALUE);
      } else if (allowAll && !stored) {
        setSelectedId(ALL_LOCATIONS_VALUE);
        setStoredLocationId(ALL_LOCATIONS_VALUE);
      } else {
        // Sales/warehouse need a concrete location. If accounting stored "all",
        // pick a default for this module without overwriting the shared preference.
        const preferred =
          !allowAll && isAllLocationsId(stored) ? null : stored;
        const chosen = pickDefault(list, preferred);
        const id = chosen?.id || '';
        setSelectedId(id);
        if (!(!allowAll && isAllLocationsId(stored))) {
          setStoredLocationId(id || null);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load locations');
      setLocations([]);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [allowAll]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCATION_STORAGE_KEY) return;
      const next = e.newValue || '';
      if (allowAll && isAllLocationsId(next)) {
        setSelectedId(ALL_LOCATIONS_VALUE);
      } else if (next) {
        setSelectedId(next);
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
