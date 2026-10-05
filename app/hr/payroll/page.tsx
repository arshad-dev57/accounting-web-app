'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { Loader2 } from 'lucide-react';
import OfficePayrollWorkspace from './office-payroll-workspace';

/** Legacy route — preserved for bookmarks; same as Run Payroll */
export default function PayrollPage() {
  return (
    <React.Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#014582]" /></div>}>
      <OfficePayrollWorkspace view="run" />
    </React.Suspense>
  );
}
