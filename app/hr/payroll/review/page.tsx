'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import OfficePayrollWorkspace from '../office-payroll-workspace';

export default function PayrollReviewPage() {
  return (
    <React.Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#014582]" /></div>}>
      <OfficePayrollWorkspace view="review" />
    </React.Suspense>
  );
}
