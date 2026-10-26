'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  isRead: boolean;
  data?: {
    link?: string;
    href?: string;
    url?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  readAt?: string | null;
};

function authToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('auth_token') ||
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('auth_token='))
      ?.split('=')[1] ||
    ''
  );
}

function authHeaders(): HeadersInit {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function timeAgo(value?: string) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function typeIcon(type?: string) {
  const t = (type || 'info').toLowerCase();
  if (t === 'success') return CheckCircle2;
  if (t === 'warning' || t === 'action') return AlertTriangle;
  if (t === 'error') return XCircle;
  return Info;
}

function typeColor(type?: string) {
  const t = (type || 'info').toLowerCase();
  if (t === 'success') return 'text-emerald-600 bg-emerald-50';
  if (t === 'warning' || t === 'action') return 'text-amber-600 bg-amber-50';
  if (t === 'error') return 'text-red-600 bg-red-50';
  return 'text-[#014582] bg-[#014582]/10';
}

function notificationLink(n: AppNotification): string | null {
  const d = n.data;
  if (!d || typeof d !== 'object') return null;
  const link = d.link || d.href || d.url;
  return typeof link === 'string' && link.trim() ? link.trim() : null;
}

type Props = {
  className?: string;
};

const POLL_MS = 60_000;

export default function NotificationDropdown({ className = '' }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: authHeaders(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setUnread(Number(data?.data?.count || 0));
      }
    } catch {
      /* ignore badge poll errors */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/notifications?limit=30', {
        headers: authHeaders(),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load notifications');
      }
      setItems(Array.isArray(data.data) ? data.data : []);
      setUnread(Number(data?.meta?.unread ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnread();
    const id = window.setInterval(() => void loadUnread(), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadUnread]);

  useEffect(() => {
    if (open) void loadList();
  }, [open, loadList]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const markRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnread((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeaders(),
      });
    } catch {
      void loadList();
    }
  };

  const markAllRead = async () => {
    if (unread === 0 || markingAll) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: authHeaders(),
      });
    } catch {
      void loadList();
    } finally {
      setMarkingAll(false);
    }
  };

  const removeOne = async (id: string) => {
    const target = items.find((n) => n.id === id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) setUnread((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
    } catch {
      void loadList();
    }
  };

  const onOpenItem = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    const link = notificationLink(n);
    setOpen(false);
    if (link) router.push(link);
  };

  const badge =
    unread > 99 ? '99+' : unread > 0 ? String(unread) : '';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
        className={`relative flex items-center justify-center rounded-lg p-2 transition-all ${
          open
            ? 'bg-[#014582]/10 text-[#014582]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        <Bell className="h-4 w-4" />
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          data-header-panel
          className="absolute right-0 z-50 mt-2 w-[380px] max-w-[94vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              <p className="text-[11px] text-gray-500">
                {unread > 0 ? `${unread} unread` : 'You are all caught up'}
              </p>
            </div>
            <button
              type="button"
              disabled={unread === 0 || markingAll}
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#014582] hover:bg-[#014582]/10 disabled:cursor-default disabled:opacity-40"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </button>
          </div>

          <div className="max-h-[min(70vh,420px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : null}

            {!loading && error ? (
              <div className="px-4 py-6 text-center text-sm text-red-600">{error}</div>
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No notifications yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Approvals, alerts, and system updates will show up here.
                </p>
              </div>
            ) : null}

            {!loading &&
              !error &&
              items.map((n) => {
                const Icon = typeIcon(n.type);
                const colors = typeColor(n.type);
                const link = notificationLink(n);
                return (
                  <div
                    key={n.id}
                    className={`group flex gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0 ${
                      n.isRead ? 'bg-white' : 'bg-[#014582]/5'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => void onOpenItem(n)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            n.isRead ? 'font-medium text-gray-800' : 'font-bold text-gray-900'
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.isRead ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#014582]" />
                        ) : null}
                      </div>
                      {n.message ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
                      ) : null}
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
                        {n.category ? (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-gray-500">
                            {n.category}
                          </span>
                        ) : null}
                        <span>{timeAgo(n.createdAt)}</span>
                        {link ? <span className="text-[#014582]">Open →</span> : null}
                      </div>
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => void removeOne(n.id)}
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-lg text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="mx-auto h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
