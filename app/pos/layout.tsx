'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { LocationProvider } from '../../lib/location-context';

export default function POSRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocationProvider allowAll>
      <div className="min-h-screen">{children}</div>
    </LocationProvider>
  );
}
