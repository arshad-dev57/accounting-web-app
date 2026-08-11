'use client';

import React from 'react';

// ============================================================
// POS LAYOUT
// ============================================================
export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
