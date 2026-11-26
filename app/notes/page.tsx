'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Search, Pin, PinOff, Trash2, CheckSquare, Square,
  StickyNote, ListTodo, X, Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LocalNote,
  LocalChecklistItem,
  NOTE_COLORS,
  loadLocalNotes,
  saveLocalNotes,
  createBlankNote,
  createChecklistItem,
  sortNotes,
} from '@/lib/local-notes';

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function LocalNotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');
  const filter: 'all' | 'pinned' | 'todos' =
    urlFilter === 'pinned' || urlFilter === 'todos' ? urlFilter : 'all';
  const wantNew = searchParams.get('new') === '1';

  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = sortNotes(loadLocalNotes());
    setNotes(loaded);
    if (loaded.length) setSelectedId(loaded[0].id);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: LocalNote[]) => {
    const sorted = sortNotes(next);
    setNotes(sorted);
    saveLocalNotes(sorted);
  }, []);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (filter === 'pinned' && !n.pinned) return false;
      if (filter === 'todos' && n.checklist.length === 0) return false;
      if (!q) return true;
      const hay = `${n.title} ${n.body} ${n.checklist.map((c) => c.text).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, query, filter]);

  const openTodos = useMemo(
    () => notes.reduce((acc, n) => acc + n.checklist.filter((c) => !c.done).length, 0),
    [notes],
  );

  const handleNew = useCallback(() => {
    const note = createBlankNote();
    note.title = 'Untitled note';
    const next = sortNotes([note, ...loadLocalNotes()]);
    setNotes(next);
    saveLocalNotes(next);
    setSelectedId(note.id);
  }, []);

  useEffect(() => {
    if (!hydrated || !wantNew) return;
    handleNew();
    router.replace('/notes');
  }, [hydrated, wantNew, handleNew, router]);

  const patchSelected = (patch: Partial<LocalNote>) => {
    if (!selected) return;
    const next = notes.map((n) =>
      n.id === selected.id
        ? { ...n, ...patch, updatedAt: new Date().toISOString() }
        : n,
    );
    persist(next);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this note from this device?')) return;
    const next = notes.filter((n) => n.id !== id);
    persist(next);
    if (selectedId === id) setSelectedId(next[0]?.id || null);
    toast.success('Note deleted');
  };

  const togglePin = (id: string) => {
    persist(
      notes.map((n) =>
        n.id === id
          ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
  };

  const addChecklistItem = () => {
    if (!selected) return;
    patchSelected({ checklist: [...selected.checklist, createChecklistItem()] });
  };

  const updateChecklistItem = (itemId: string, patch: Partial<LocalChecklistItem>) => {
    if (!selected) return;
    patchSelected({
      checklist: selected.checklist.map((c) => (c.id === itemId ? { ...c, ...patch } : c)),
    });
  };

  const removeChecklistItem = (itemId: string) => {
    if (!selected) return;
    patchSelected({ checklist: selected.checklist.filter((c) => c.id !== itemId) });
  };

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Loading local notes…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-[#014582]" />
            Notes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Personal notes &amp; todos saved on this machine only — not synced to the server.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="px-2 py-1 rounded-md bg-white border border-gray-200">{notes.length} notes</span>
        <span className="px-2 py-1 rounded-md bg-white border border-gray-200 flex items-center gap-1">
          <ListTodo className="w-3.5 h-3.5" /> {openTodos} open todos
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[70vh]">
        {/* List */}
        <aside className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#f4f5f6] rounded-md border border-transparent focus:outline-none focus:bg-white focus:border-[#014582]/40"
              />
            </div>
            </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[62vh]">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                {notes.length === 0 ? 'No notes yet. Create one.' : 'No matches.'}
              </div>
            ) : (
              filtered.map((n) => {
                const open = n.checklist.filter((c) => !c.done).length;
                const active = n.id === selectedId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      active ? 'bg-[#f0f6ff]' : 'hover:bg-gray-50'
                    }`}
                    style={{ borderLeft: `3px solid ${n.color === '#FFFFFF' ? '#e5e7eb' : n.color}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {n.title || 'Untitled note'}
                      </p>
                      {n.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                      {n.body || (open ? `${open} open todo(s)` : 'Empty note')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatWhen(n.updatedAt)}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Editor */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[70vh]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
              <StickyNote className="w-12 h-12 opacity-40" />
              <p className="text-sm font-medium text-gray-600">Select a note or create a new one</p>
              <button
                type="button"
                onClick={handleNew}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#014582] border border-[#014582]/30 hover:bg-[#014582]/5"
              >
                New Note
              </button>
            </div>
          ) : (
            <>
              <div
                className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100"
                style={{ background: selected.color === '#FFFFFF' ? '#fff' : selected.color }}
              >
                <input
                  value={selected.title}
                  onChange={(e) => patchSelected({ title: e.target.value })}
                  placeholder="Note title"
                  className="flex-1 bg-transparent text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative group">
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-500 hover:bg-white/70"
                      title="Color"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:flex gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => patchSelected({ color: c })}
                          className={`w-5 h-5 rounded-full border ${
                            selected.color === c ? 'ring-2 ring-[#014582] ring-offset-1' : 'border-gray-200'
                          }`}
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePin(selected.id)}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-white/70"
                    title={selected.pinned ? 'Unpin' : 'Pin'}
                  >
                    {selected.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selected.id)}
                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ background: selected.color === '#FFFFFF' ? '#fff' : `${selected.color}55` }}>
                <textarea
                  value={selected.body}
                  onChange={(e) => patchSelected({ body: e.target.value })}
                  placeholder="Write your note…"
                  rows={8}
                  className="w-full resize-y min-h-[160px] bg-white/80 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#014582]/40 focus:ring-2 focus:ring-[#014582]/10"
                />

                <div className="bg-white/90 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5" /> Checklist / Todos
                    </h3>
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="text-xs font-medium text-[#014582] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add item
                    </button>
                  </div>

                  {selected.checklist.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No todos yet. Add checklist items like a todo app.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selected.checklist.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 group">
                          <button
                            type="button"
                            onClick={() => updateChecklistItem(item.id, { done: !item.done })}
                            className="text-gray-500 hover:text-[#014582] shrink-0"
                            aria-label={item.done ? 'Mark open' : 'Mark done'}
                          >
                            {item.done
                              ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                              : <Square className="w-4 h-4" />}
                          </button>
                          <input
                            value={item.text}
                            onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                            placeholder="Todo item…"
                            className={`flex-1 bg-transparent text-sm focus:outline-none ${
                              item.done ? 'line-through text-gray-400' : 'text-gray-800'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                            aria-label="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="text-[11px] text-gray-400">
                  Updated {formatWhen(selected.updatedAt)} · Stored in this browser only
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function LocalNotesPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-gray-400 py-12">Loading notes…</div>}>
      <LocalNotesContent />
    </Suspense>
  );
}
