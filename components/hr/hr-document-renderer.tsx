'use client';

import React from 'react';
import { HRPrintSettingItem, HRSignatoryItem } from '@/lib/hr-print-service';

interface HRDocumentRendererProps {
  settings?: HRPrintSettingItem | null;
  signatories?: HRSignatoryItem[];
  title?: string;
  subtitle?: string;
  documentNumber?: string;
  date?: string;
  children: React.ReactNode;
  showSignatures?: boolean;
}

export const HRDocumentRenderer: React.FC<HRDocumentRendererProps> = ({
  settings,
  signatories = [],
  title,
  subtitle,
  documentNumber,
  date,
  children,
  showSignatures = true
}) => {
  const brand = settings || {
    companyName: 'Bisonstechs ERP',
    primaryColor: '#014582',
    fontFamily: 'Inter',
    showLogo: true,
    showStamp: true,
    showFooter: true,
    showPageNumbers: true,
    footerText: 'Confidential HR Document - For Internal Use Only',
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15
  };

  const sigList = signatories.length > 0 ? signatories : settings?.signatories || [];

  return (
    <div
      className="hr-print-document font-sans text-slate-900 bg-white shadow-xl rounded-2xl p-8 max-w-4xl mx-auto border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-full"
      style={{
        fontFamily: brand.fontFamily || 'Inter, sans-serif',
        paddingTop: `${brand.marginTop || 15}mm`,
        paddingBottom: `${brand.marginBottom || 15}mm`,
        paddingLeft: `${brand.marginLeft || 15}mm`,
        paddingRight: `${brand.marginRight || 15}mm`
      }}
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between pb-6 border-b-2 border-slate-200 mb-6">
        <div className="flex items-center space-x-4">
          {brand.showLogo && brand.primaryLogo && (
            <img
              src={brand.primaryLogo}
              alt="HR Logo"
              className="h-14 max-w-[180px] object-contain"
            />
          )}
          <div>
            <h1 className="font-extrabold text-xl leading-tight" style={{ color: brand.primaryColor || '#014582' }}>
              {brand.companyName || 'Bisonstechs ERP'}
            </h1>
            {brand.companyAddress && (
              <p className="text-xs text-slate-500 max-w-md mt-0.5">{brand.companyAddress}</p>
            )}
            {brand.companyPhone || brand.companyEmail ? (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {brand.companyPhone ? `Tel: ${brand.companyPhone}` : ''}
                {brand.companyPhone && brand.companyEmail ? ' • ' : ''}
                {brand.companyEmail ? `Email: ${brand.companyEmail}` : ''}
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          {title && (
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</h2>
          )}
          {documentNumber && (
            <p className="text-xs font-mono font-bold mt-1 text-slate-600">Ref: {documentNumber}</p>
          )}
          {date && (
            <p className="text-xs text-slate-500 mt-0.5">Date: {date}</p>
          )}
          {brand.secondaryLogo && (
            <img src={brand.secondaryLogo} alt="Secondary Logo" className="h-8 object-contain ml-auto mt-2" />
          )}
        </div>
      </div>

      {/* Subtitle Bar if present */}
      {subtitle && (
        <div className="mb-6 p-3 bg-slate-50 border-l-4 rounded-r-xl border-indigo-600">
          <p className="text-xs font-medium text-slate-700">{subtitle}</p>
        </div>
      )}

      {/* Main Document Content */}
      <div className="min-h-[400px] text-sm leading-relaxed text-slate-800 space-y-4">
        {children}
      </div>

      {/* Signatures Section */}
      {showSignatures && sigList.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-end">
            {sigList.map((sig) => (
              <div
                key={sig.id}
                className={`text-xs space-y-2 ${
                  sig.alignment === 'right'
                    ? 'text-right'
                    : sig.alignment === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {/* Signature Image & Stamp */}
                <div className="h-16 flex items-end justify-start min-h-[50px]">
                  {sig.signatureUrl ? (
                    <img
                      src={sig.signatureUrl}
                      alt={sig.label}
                      className="max-h-14 max-w-[140px] object-contain inline-block"
                    />
                  ) : (
                    <div className="w-32 border-b-2 border-slate-300 pb-1 text-[10px] text-slate-400 italic">
                      [Signature Required]
                    </div>
                  )}
                  {sig.stampUrl && (
                    <img src={sig.stampUrl} alt="Stamp" className="h-10 opacity-85 ml-1 object-contain inline-block" />
                  )}
                </div>

                {/* Signatory Label & Info */}
                <div className="border-t border-slate-300 pt-1.5">
                  <p className="font-extrabold text-slate-900 text-xs">{sig.label}</p>
                  {sig.name && <p className="font-semibold text-slate-700 text-[11px]">{sig.name}</p>}
                  {sig.designation && <p className="text-[10px] text-slate-500">{sig.designation}</p>}
                </div>
              </div>
            ))}

            {/* Official Stamp if enabled */}
            {brand.showStamp && brand.officialStamp && (
              <div className="text-right flex flex-col items-end justify-end">
                <img src={brand.officialStamp} alt="Official Seal" className="h-20 max-w-[100px] object-contain" />
                <p className="text-[10px] font-bold text-slate-400 mt-1">Official Seal</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {brand.showFooter && (
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>{brand.footerText || 'Confidential HR Document'}</span>
          {brand.showPageNumbers && <span>Page 1 of 1</span>}
        </div>
      )}
    </div>
  );
};
