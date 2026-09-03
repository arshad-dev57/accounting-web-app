'use client';

import { useFiscalYear } from './fiscal-year-context';
import { useLocationOptional } from './location-context';

/** Wait until fiscal year + location filters are resolved before dashboard API calls. */
export function useDashboardFiltersReady() {
  const {
    loading: fiscalLoading,
    selectedFiscalYearId,
    selectedFiscalYear,
  } = useFiscalYear();
  const location = useLocationOptional();

  const ready = !fiscalLoading && !location.loading;

  return {
    ready,
    selectedFiscalYearId,
    selectedFiscalYear,
    locationIdForApi: location.locationIdForApi,
    selectedLocationId: location.selectedLocationId,
  };
}
