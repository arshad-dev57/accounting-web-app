'use client';

import Link from 'next/link';
import { MapPin, Settings2 } from 'lucide-react';
import { ALL_LOCATIONS_VALUE } from '../lib/location-service';
import { useLocation } from '../lib/location-context';
import { usePermissions } from '../lib/usePermissions';

export default function LocationSelect({
  compact = true,
  showManageLink = true,
  className = '',
  allowAll,
  variant = 'light',
}: {
  compact?: boolean;
  showManageLink?: boolean;
  className?: string;
  /** Override provider allowAll for the All option in the dropdown. */
  allowAll?: boolean;
  variant?: 'light' | 'dark';
}) {
  const {
    locations,
    selectedLocationId,
    selectedLocation,
    loading,
    setSelectedLocationId,
    allowAll: providerAllowAll,
  } = useLocation();
  const { isAdmin } = usePermissions();

  const showAll = allowAll ?? providerAllowAll;

  const dark = variant === 'dark';

  if (loading && locations.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border overflow-hidden isolate ${dark ? 'border-white/25 bg-white/10 text-white/80' : 'border-gray-200 bg-white text-gray-500'}`}>
          <MapPin className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-white' : 'text-[#014582]'}`} />
          <span className="text-sm">Loading location…</span>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    if (!isAdmin) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-600 ${className}`}>
          <MapPin className="w-4 h-4" />
          No store assigned
        </div>
      );
    }
    return (
      <Link
        href="/warehouse/locations"
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 ${className}`}
      >
        <MapPin className="w-4 h-4" />
        Set up location
      </Link>
    );
  }

  const selectValue =
    showAll &&
    (selectedLocationId === ALL_LOCATIONS_VALUE || !selectedLocationId)
      ? ALL_LOCATIONS_VALUE
      : selectedLocationId;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border overflow-hidden isolate ${dark ? 'border-white/25 bg-white/10' : 'border-gray-200 bg-white'}`}>
        <MapPin className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-white' : 'text-[#014582]'}`} />
        <div className="min-w-0 flex-1">
          {!compact && (
            <p className={`text-[10px] uppercase tracking-wide leading-none mb-0.5 ${dark ? 'text-white/70' : 'text-gray-400'}`}>
              Location
            </p>
          )}
          <select
            key={selectValue || 'loc'}
            value={selectValue}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
            }}
            className={`appearance-none text-sm font-semibold bg-transparent border-0 outline-none w-[9.5rem] sm:w-[11rem] cursor-pointer ${dark ? 'text-white' : 'text-gray-800'}`}
            style={dark ? { colorScheme: 'dark' } : undefined}
            title={
              selectValue === ALL_LOCATIONS_VALUE
                ? 'All locations'
                : selectedLocation
                  ? `${selectedLocation.name} (${selectedLocation.code})`
                  : 'Select location'
            }
          >
            {showAll && (
              <option value={ALL_LOCATIONS_VALUE}>All locations</option>
            )}
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.type ? ` · ${l.type}` : ''}
                {l.isDefault ? ' · Default' : ''}
              </option>
            ))}
          </select>
        </div>
        {!compact && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${dark ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'}`}>
            {selectValue === ALL_LOCATIONS_VALUE
              ? 'ALL'
              : selectedLocation?.code || 'LOC'}
          </span>
        )}
      </div>
      {showManageLink && isAdmin && (
        <Link
          href="/warehouse/locations"
          className="p-1.5 rounded-lg text-gray-400 hover:text-[#014582] hover:bg-gray-100"
          title="Manage locations"
        >
          <Settings2 className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
