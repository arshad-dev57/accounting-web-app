'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Send, Sparkles, X, Minimize2 } from 'lucide-react';
import { isSubscriptionExemptPath } from '@/lib/subscription-service';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';
import { AI_QUICK_PROMPTS } from '@/lib/ai-agent-knowledge';
import {
  emptySalesSession,
  type SalesFlowSession,
} from '@/lib/ai-agent/sales-flow';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: number;
};

const WELCOME: UiMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Salam! Main **Bison Assistant** hun — English aur Roman Urdu dono samajhta hun.\n\nSales order ke liye bolo: **sales order banao** ya **create sales order**. Customer / product / qty missing hon to main poochunga, phir **aur add?** aur confirm.",
  at: Date.now(),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function renderSoftMarkdown(text: string) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function GlobalAiAgent() {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME]);
  const [session, setSession] = useState<SalesFlowSession>(() => emptySalesSession());
  const [suggestions, setSuggestions] = useState<string[]>(AI_QUICK_PROMPTS);
  const [hasAuth, setHasAuth] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden = useMemo(() => {
    if (isSubscriptionExemptPath(pathname)) return true;
    if (pathname.startsWith('/register')) return true;
    return !hasAuth;
  }, [pathname, hasAuth]);

  const isPos = pathname.startsWith('/pos');
  const inSalesFlow =
    session.intent === 'sales_order' &&
    session.step !== 'idle' &&
    session.step !== 'done';

  useEffect(() => {
    const read = () => {
      try {
        const token =
          localStorage.getItem('auth_token') ||
          document.cookie.split('; ').find((c) => c.startsWith('auth_token='))?.split('=')[1];
        setHasAuth(Boolean(token));
      } catch {
        setHasAuth(false);
      }
    };
    read();
    window.addEventListener('storage', read);
    const id = window.setInterval(read, 4000);
    return () => {
      window.removeEventListener('storage', read);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, messages, sending]);

  const resetChat = useCallback(() => {
    setMessages([{ ...WELCOME, at: Date.now() }]);
    setSession(emptySalesSession());
    setSuggestions(AI_QUICK_PROMPTS);
    setInput('');
  }, []);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = String(raw || '').trim();
      if (!text || sending) return;

      const userMsg: UiMessage = {
        id: uid(),
        role: 'user',
        content: text,
        at: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setSending(true);

      try {
        const res = await fetch('/api/ai-agent/chat', {
          method: 'POST',
          headers: browserCompanyAuthHeaders(),
          body: JSON.stringify({ message: text, session }),
        });
        const json = await res.json().catch(() => ({}));
        const content =
          json?.data?.content ||
          json?.message ||
          "Sorry — I couldn't reply just now. / Abhi reply nahi de saka.";

        if (json?.data?.session) {
          setSession(json.data.session as SalesFlowSession);
        }
        const nextSuggestions = Array.isArray(json?.data?.suggestions)
          ? json.data.suggestions
          : [];
        setSuggestions(nextSuggestions.length ? nextSuggestions : AI_QUICK_PROMPTS);

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: String(content),
            at: Date.now(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: 'Connection issue. / Connection problem — phir try karo.',
            at: Date.now(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, session]
  );

  if (hidden) return null;

  return (
    <div
      className={`fixed z-[80] flex flex-col items-end gap-3 ${
        isPos ? 'bottom-20 right-4 sm:bottom-6 sm:right-6' : 'bottom-5 right-5 sm:bottom-6 sm:right-6'
      }`}
    >
      {open && (
        <div
          className="w-[min(100vw-1.5rem,380px)] h-[min(72vh,560px)] flex flex-col overflow-hidden rounded-2xl border border-[#014582]/15 bg-white shadow-[0_20px_50px_-12px_rgba(1,69,130,0.35)]"
          role="dialog"
          aria-label="Bison Assistant chat"
        >
          <div className="relative shrink-0 px-4 py-3.5 bg-gradient-to-br from-[#014582] via-[#014582] to-[#01366a] text-white">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#00C2FF_0%,transparent_45%),radial-gradient(circle_at_90%_80%,#ffffff_0%,transparent_35%)]" />
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00E676] border-2 border-[#014582]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight truncate">Bison Assistant</p>
                <p className="text-[11px] text-white/70 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-[#00C2FF]" />
                  {inSalesFlow
                    ? `Sales order · ${session.step.replace(/_/g, ' ')}`
                    : 'EN + Roman Urdu · Online'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
                  title="Minimize"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    resetChat();
                  }}
                  className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
                  title="Close & reset"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {inSalesFlow && session.customer && (
              <div className="relative mt-2 text-[11px] text-white/85 bg-white/10 rounded-lg px-2.5 py-1.5 truncate">
                Customer: <strong>{session.customer.name}</strong>
                {session.lines.length > 0 ? ` · ${session.lines.length} item(s)` : ''}
              </div>
            )}
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-[#f0f4f8] [background-image:radial-gradient(#d5dee8_1px,transparent_1px)] [background-size:14px_14px]"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-[#014582] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isUser
                        ? 'bg-[#014582] text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                    }`}
                  >
                    {renderSoftMarkdown(msg.content)}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#014582] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:240ms]" />
                </div>
              </div>
            )}

            {!sending && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 pl-9">
                {suggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="text-[11px] font-medium text-[#014582] bg-white border border-[#014582]/20 hover:border-[#014582]/40 hover:bg-[#014582]/5 rounded-full px-2.5 py-1.5 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="shrink-0 border-t border-gray-200 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-[#014582]/40 focus-within:ring-2 focus-within:ring-[#014582]/15 px-2.5 py-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inSalesFlow
                    ? session.lang === 'ur'
                      ? 'Jawaban likho…'
                      : 'Type your answer…'
                    : 'Ask in English or Roman Urdu…'
                }
                disabled={sending}
                className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400 py-1.5 min-w-0"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 w-9 h-9 rounded-lg bg-[#014582] text-white flex items-center justify-center hover:bg-[#01366a] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              No API key · Sales flow trained · Cancel anytime
            </p>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Open AI assistant'}
        aria-expanded={open}
        className={`group relative w-14 h-14 rounded-full shadow-[0_10px_28px_-6px_rgba(1,69,130,0.55)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
          open
            ? 'bg-gray-800 text-white'
            : 'bg-gradient-to-br from-[#014582] to-[#01366a] text-white'
        }`}
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[#014582]/40 animate-ping opacity-30" />
        )}
        {open ? <X className="w-6 h-6 relative z-10" /> : <Bot className="w-7 h-7 relative z-10" />}
      </button>
    </div>
  );
}
