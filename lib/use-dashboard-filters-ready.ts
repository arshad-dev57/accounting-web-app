'use client';

import { useFiscalYear } from './fiscal-year-context';
import { useLocationOptional } from './location-context';

/**
 * Wait until fiscal year (+ optional location) filters are resolved before dashboard API calls.
 * Accounting is company-level and may not mount LocationProvider — location is optional.
 */
export function useDashboardFiltersReady() {
  const {
    loading: fiscalLoading,
    selectedFiscalYearId,
    selectedFiscalYear,
  } = useFiscalYear();
  const location = useLocationOptional();

  const ready = !fiscalLoading && (!location || !location.loading);

  return {
    ready,
    selectedFiscalYearId,
    selectedFiscalYear,
    locationIdForApi: location?.locationIdForApi || '',
    selectedLocationId: location?.selectedLocationId || '',
  };
}
