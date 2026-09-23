'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface SignatureBlockProps {
  preparedBy?: { name: string; designation?: string; date?: string };
  checkedBy?: { name: string; designation?: string; date?: string };
  approvedBy?: { name: string; designation?: string; date?: string };
  signatureUrl?: string;
  stampUrl?: string;
  companyName?: string;
  className?: string;
}

export default function DigitalSignatureBlock({
  preparedBy = { name: 'HR Admin', designation: 'HR Specialist', date: new Date().toISOString().slice(0, 10) },
  checkedBy = { name: 'Finance Manager', designation: 'Finance Lead', date: new Date().toISOString().slice(0, 10) },
  approvedBy = { name: 'Executive Director', designation: 'Authorized Signatory', date: new Date().toISOString().slice(0, 10) },
  signatureUrl,
  stampUrl,
  companyName = 'Bisonstechs Enterprise',
  className = '',
}: SignatureBlockProps) {
  return (
    <div className={`w-full bg-white rounded-2xl p-6 border border-[#DDE4EE] shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-[#DDE4EE] pb-3 mb-6">
        <div className="flex items-center gap-2 text-[#014582]">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider">
            Corporate Authorization & Digital Signatures
          </h4>
        </div>
        <span className="text-[10px] text-[#7A8FA6] font-medium">
          {companyName} • Audit & Control Record
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
        {/* Prepared By */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
          <div className="w-full flex justify-between items-center text-[10px] uppercase font-bold text-[#7A8FA6] mb-2">
            <span>Prepared By</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="py-2 min-h-[48px] flex items-center justify-center">
            {signatureUrl ? (
              <img src={signatureUrl} alt="Signature" className="max-h-12 object-contain" />
            ) : (
              <span className="font-serif italic text-[#014582] text-sm opacity-80">
                {preparedBy.name}
              </span>
            )}
          </div>
          <div className="w-full pt-2 border-t border-[#DDE4EE] mt-2">
            <p className="font-extrabold text-[#1A1A2E]">{preparedBy.name}</p>
            <p className="text-[10px] text-[#7A8FA6]">{preparedBy.designation || 'HR Officer'}</p>
            <p className="text-[9px] text-[#7A8FA6] mt-0.5">{preparedBy.date || 'Date N/A'}</p>
          </div>
        </div>

        {/* Checked By */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50">
          <div className="w-full flex justify-between items-center text-[10px] uppercase font-bold text-[#7A8FA6] mb-2">
            <span>Checked By</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="py-2 min-h-[48px] flex items-center justify-center">
            <span className="font-serif italic text-[#014582] text-sm opacity-80">
              {checkedBy.name}
            </span>
          </div>
          <div className="w-full pt-2 border-t border-[#DDE4EE] mt-2">
            <p className="font-extrabold text-[#1A1A2E]">{checkedBy.name}</p>
            <p className="text-[10px] text-[#7A8FA6]">{checkedBy.designation || 'Finance Lead'}</p>
            <p className="text-[9px] text-[#7A8FA6] mt-0.5">{checkedBy.date || 'Date N/A'}</p>
          </div>
        </div>

        {/* Approved By */}
        <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-[#DDE4EE] bg-[#F0F4F8]/50 relative overflow-hidden">
          <div className="w-full flex justify-between items-center text-[10px] uppercase font-bold text-[#7A8FA6] mb-2">
            <span>Approved By</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="py-2 min-h-[48px] flex items-center justify-center">
            {stampUrl ? (
              <img src={stampUrl} alt="Stamp" className="max-h-12 object-contain opacity-70" />
            ) : (
              <span className="font-serif italic text-[#014582] text-sm font-bold">
                {approvedBy.name}
              </span>
            )}
          </div>
          <div className="w-full pt-2 border-t border-[#DDE4EE] mt-2">
            <p className="font-extrabold text-[#1A1A2E]">{approvedBy.name}</p>
            <p className="text-[10px] text-[#7A8FA6]">{approvedBy.designation || 'Authorized Signatory'}</p>
            <p className="text-[9px] text-[#7A8FA6] mt-0.5">{approvedBy.date || 'Date N/A'}</p>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-center text-[#7A8FA6] mt-4 italic">
        Electronic Signature Asset • Authorized for internal Bisonstechs ERP record generation
      </p>
    </div>
  );
}
