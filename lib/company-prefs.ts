import { locationService } from './location-service';
import { fiscalYearService } from './fiscal-year-service';

/**
 * One-time fetch after login/register: store locations + fiscal years in localStorage
 * so dropdowns do not hit the API on every page load.
 */
export async function hydrateCompanyPrefsFromApi(): Promise<void> {
  await Promise.allSettled([locationService.list(), fiscalYearService.list()]);
}
