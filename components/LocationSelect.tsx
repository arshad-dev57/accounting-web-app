'use client';

import Link from 'next/link';
import { MapPin, Settings2 } from 'lucide-react';
import { ALL_LOCATIONS_VALUE } from '../lib/location-service';
import { useLocation } from '../lib/location-context';

export default function LocationSelect({
  compact = true,
  showManageLink = true,
  className = '',
  allowAll,
}: {
  compact?: boolean;
  showManageLink?: boolean;
  className?: string;
  /** Override provider allowAll for the All option in the dropdown. */
  allowAll?: boolean;
}) {
  const {
    locations,
    selectedLocationId,
    selectedLocation,
    loading,
    setSelectedLocationId,
    allowAll: providerAllowAll,
  } = useLocation();

  const showAll = allowAll ?? providerAllowAll;

  if (loading && locations.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <MapPin className="w-4 h-4" />
        <span>Loading location…</span>
      </div>
    );
  }

  if (locations.length === 0) {
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
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white">
        <MapPin className="w-4 h-4 text-[#014582] flex-shrink-0" />
        <div className="min-w-0">
          {!compact && (
            <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none mb-0.5">
              Location
            </p>
          )}
          <select
            key={selectValue || 'loc'}
            value={selectValue}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
            }}
            className="text-sm font-medium text-gray-800 bg-transparent border-0 outline-none max-w-[220px] cursor-pointer"
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
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">
          {selectValue === ALL_LOCATIONS_VALUE
            ? 'ALL'
            : selectedLocation?.code || 'LOC'}
        </span>
      </div>
      {showManageLink && (
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
