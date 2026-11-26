/** Local-only Notes + checklist storage (browser localStorage). No server. */

export type LocalChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type LocalNote = {
  id: string;
  title: string;
  body: string;
  checklist: LocalChecklistItem[];
  pinned: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'bisonstechs.localNotes.v1';

export const NOTE_COLORS = [
  '#FFFFFF',
  '#FEF3C7',
  '#DBEAFE',
  '#D1FAE5',
  '#FCE7F3',
  '#EDE9FE',
  '#FFEDD5',
];

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadLocalNotes(): LocalNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeNote).filter(Boolean) as LocalNote[];
  } catch {
    return [];
  }
}

function normalizeNote(n: any): LocalNote | null {
  if (!n || typeof n !== 'object') return null;
  return {
    id: String(n.id || uid()),
    title: String(n.title || ''),
    body: String(n.body || ''),
    checklist: Array.isArray(n.checklist)
      ? n.checklist.map((c: any) => ({
          id: String(c.id || uid()),
          text: String(c.text || ''),
          done: !!c.done,
        }))
      : [],
    pinned: !!n.pinned,
    color: NOTE_COLORS.includes(n.color) ? n.color : NOTE_COLORS[0],
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
  };
}

export function saveLocalNotes(notes: LocalNote[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function createBlankNote(): LocalNote {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: '',
    body: '',
    checklist: [],
    pinned: false,
    color: NOTE_COLORS[0],
    createdAt: now,
    updatedAt: now,
  };
}

export function createChecklistItem(text = ''): LocalChecklistItem {
  return { id: uid(), text, done: false };
}

export function sortNotes(notes: LocalNote[]): LocalNote[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
