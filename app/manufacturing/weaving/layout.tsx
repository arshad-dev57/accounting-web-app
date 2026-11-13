'use client';

import { WeavingSubNav } from './_components/WeavingSubNav';

export default function WeavingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <WeavingSubNav />
      {children}
    </div>
  );
}
