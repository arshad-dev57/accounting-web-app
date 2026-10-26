'use client';

import { CompanyProvider } from '../lib/company-context';
import AppUsageTracker from './AppUsageTracker';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CompanyProvider>
      <AppUsageTracker />
      {children}
    </CompanyProvider>
  );
}
