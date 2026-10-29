'use client';

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import type { SalesDocument } from '@/lib/sales-document';
import { useCurrency } from '@/lib/currency-context';
import { salesOrderService } from '@/lib/sales-order-service';
import {
  buildSalesOrderWhatsAppMessage,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from '@/lib/whatsapp-share';

export type GeneratedFile = {
  base64: string;
  filename: string;
  mimeType: string;
};

type SendStatus = { type: 'success' | 'error' | 'notice'; text: string } | null;

function downloadBase64(base64: string, mimeType: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function WhatsAppShareModal({
  document,
  companyName,
  generateFiles,
  onClose,
}: {
  document: SalesDocument;
  companyName: string;
  generateFiles: (format: 'pdf' | 'jpeg') => Promise<GeneratedFile[]>;
  onClose: () => void;
}) {
  const { formatAmount } = useCurrency();
  const [phone, setPhone] = useState<string>(document.party.phone || '');
  const [format, setFormat] = useState<'pdf' | 'jpeg'>('pdf');
  const [message, setMessage] = useState<string>(() =>
    buildSalesOrderWhatsAppMessage({
      customerName: document.party.name || 'Customer',
      number: document.number,
      grandTotalLabel: formatAmount(grandTotalOf(document)),
      companyName: companyName || 'BisonsTechs',
    })
  );
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<SendStatus>(null);

  const digits = useMemo(() => normalizeWhatsAppNumber(phone), [phone]);
  const phoneValid = digits.length > 0 && isValidWhatsAppNumber(digits);

  const handleSend = async () => {
    if (sending) return;
    setStatus(null);

    if (!phone.trim()) {
      setStatus({
        type: 'error',
        text: 'The customer has no WhatsApp number on file. Enter a valid WhatsApp number to continue — nothing will be sent without one.',
      });
      return;
    }
    if (!phoneValid) {
      setStatus({
        type: 'error',
        text: 'The WhatsApp number is invalid. Expected formats: 03XXXXXXXXX, +92 3XXXXXXXXX, or any international number. No message was sent.',
      });
      return;
    }
    if (!document.recordId) {
      setStatus({ type: 'error', text: 'This document has no record ID — WhatsApp delivery is unavailable.' });
      return;
    }

    setSending(true);
    try {
      const files = await generateFiles(format);
      if (!files.length) throw new Error('No file was generated');

      let allOk = true;
      let anyConfigured = false;
      let firstError = '';
      for (const file of files) {
        const result = await salesOrderService.sendWhatsApp(document.recordId, {
          to: digits,
          format,
          fileBase64: file.base64,
          filename: file.filename,
          mimeType: file.mimeType,
          caption: message.trim(),
        });
        if (!result.ok) {
          allOk = false;
          if (!firstError) firstError = result.message || 'WhatsApp delivery failed';
        }
        if (result.whatsappConfigured) anyConfigured = true;
      }

      if (allOk && anyConfigured) {
        setStatus({
          type: 'success',
          text: `${files.length > 1 ? 'Pages' : 'Document'} sent to +${digits} on WhatsApp.`,
        });
        return;
      }

      if (allOk && !anyConfigured) {
        // Option B — the server has no WhatsApp Business Cloud API credentials:
        // download locally and open a prefilled chat. Never claim it was attached.
        files.forEach((file) => downloadBase64(file.base64, file.mimeType, file.filename));
        const url = `https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`;
        window.open(url, '_blank', 'noopener');
        setStatus({
          type: 'notice',
          text:
            `WhatsApp Business API is not configured on this server, so WhatsApp cannot attach the file automatically. ` +
            `${files.length > 1 ? 'Each page was' : 'The document was'} downloaded to your device and a chat with +${digits} opened — ` +
            'attach the downloaded file in WhatsApp manually.',
        });
        return;
      }

      setStatus({
        type: 'error',
        text: `${firstError || 'WhatsApp delivery failed'} — the document was NOT sent.`,
      });
    } catch (error: any) {
      setStatus({
        type: 'error',
        text: `${error?.message || 'WhatsApp delivery failed'} — the document was NOT sent.`,
      });
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#128C7E]">
              <MessageCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Share on WhatsApp</h3>
              <p className="text-[11px] text-gray-500">
                {document.title} · {document.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Customer</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
              {document.party.name || 'Customer'}
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp-phone" className="block text-[11px] font-bold text-gray-600 mb-1">
              WhatsApp Number
            </label>
            <input
              id="whatsapp-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. 03XXXXXXXXX or +92 3XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/40"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              {phoneValid
                ? `Will send to +${digits}`
                : phone.trim()
                  ? 'Invalid number — expected 03XXXXXXXXX, +92 3XXXXXXXXX, or an international number'
                  : 'The number is not changed in the customer record — it is only used for this send.'}
            </p>
          </div>

          <div>
            <label htmlFor="whatsapp-format" className="block text-[11px] font-bold text-gray-600 mb-1">
              Attachment Format
            </label>
            <div className="flex gap-2">
              {(['pdf', 'jpeg'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                    format === value
                      ? 'border-[#014582] bg-[#014582]/5 text-[#014582]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {value === 'pdf' ? 'PDF Document' : 'JPEG Image'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp-message" className="block text-[11px] font-bold text-gray-600 mb-1">
              Message
            </label>
            <textarea
              id="whatsapp-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582]/40 resize-none"
            />
          </div>

          {status ? (
            <div
              className={`px-3 py-2 rounded-lg text-xs leading-relaxed border ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : status.type === 'notice'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {status.text}
            </div>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>,
    window.document.body
  );
}

function grandTotalOf(document: SalesDocument): number {
  const emphasized = document.totals.find((row) => row.emphasize);
  const candidate = emphasized ?? document.totals[document.totals.length - 1];
  return Number(candidate?.value) || 0;
}
