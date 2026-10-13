'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  moduleName?: string;
  backHref?: string;
}

export default function AccessDenied({
  title = 'Access Denied',
  message = 'You do not have permission to view or manage this page. Please contact your company administrator to request access.',
  moduleName,
  backHref = '/dashboard'
}: AccessDeniedProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-gray-50/50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        {moduleName && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mb-3">
            {moduleName}
          </span>
        )}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-medium hover:bg-[#013565] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
