'use client';

import React from 'react';

/** CRM desk-style field chrome (3-col form pages). */
export const deskInput =
  'w-full px-3 py-2 bg-[#f4f5f6] border border-transparent rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#014582]/40 focus:ring-2 focus:ring-[#014582]/15';

export const deskSelect =
  'w-full px-3 py-2 bg-[#f4f5f6] border border-transparent rounded-md text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#014582]/40 focus:ring-2 focus:ring-[#014582]/15';

export const deskLabel = 'block text-[12px] font-medium text-gray-600 mb-1';

export function DeskField({
  label,
  required,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={deskLabel}>
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function DeskSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-5 mt-2">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 whitespace-nowrap">{title}</h3>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">{children}</div>
    </div>
  );
}

export function DeskPageHeader({
  title,
  dirty = true,
  saving,
  onSave,
  onCancel,
  actions,
}: {
  title: string;
  dirty?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-3 mb-2 bg-[#f8f9fa]/95 backdrop-blur border-b border-gray-200/80 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 text-sm px-1"
            aria-label="Back"
          >
            ←
          </button>
        ) : null}
        <h1 className="text-xl font-semibold text-gray-900 truncate">{title}</h1>
        {dirty ? (
          <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Not Saved
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Saved
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function DeskFormShell({
  children,
  side,
}: {
  children: React.ReactNode;
  side?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className={`grid grid-cols-1 ${side ? 'xl:grid-cols-[1fr_260px]' : ''} gap-4`}>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 md:px-5 md:py-5">
          {children}
        </div>
        {side ? (
          <aside className="space-y-3">
            {side}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function DeskSideCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h4>
      {children || <p className="text-xs text-gray-400">No {title.toLowerCase()}</p>}
    </div>
  );
}

// ─── CRM desk-style list page ─────────────────────────────────────────────

export const listInput =
  'w-full px-2.5 py-1.5 bg-[#f4f5f6] border border-transparent rounded text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#014582]/40';

export const listSelect =
  'w-full px-2.5 py-1.5 bg-[#f4f5f6] border border-transparent rounded text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-[#014582]/40 appearance-none cursor-pointer';

/** One column definition for ErpDeskList */
export interface ListColumn<T> {
  key: string;
  label: string;
  filterType?: 'text' | 'select' | 'none';
  filterOptions?: string[];
  filterPlaceholder?: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface DeskFilterUserOption {
  id: string;
  label: string;
}

interface ErpDeskListProps<T> {
  title: string;
  addLabel: string;
  addHref?: string;
  onAdd?: () => void;
  columns: ListColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: () => void;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  totalCount?: number;
  menuItems?: { label: string; onClick: () => void }[];
  /** Filter-bar dropdown data (Assigned To / Created By / Tags) */
  filterUsers?: DeskFilterUserOption[];
  filterCreators?: DeskFilterUserOption[];
  filterTags?: string[];
  showTags?: boolean;
  onToggleShowTags?: () => void;
  savedFilters?: { name: string; filters: Record<string, string> }[];
  onSaveFilter?: (name: string) => void;
  onApplySavedFilter?: (name: string) => void;
  getRowTags?: (row: T) => string[];
}

export function ErpDeskList<T>({
  title, addLabel, addHref, onAdd,
  columns, rows, loading,
  emptyIcon, emptyTitle, emptySubtitle,
  filters, onFilterChange,
  pageSize, onPageSizeChange,
  sortField = 'Last Updated On', sortDir = 'desc', onSortChange,
  getRowId, onRowClick,
  selectedIds = new Set(), onSelect, onSelectAll,
  totalCount = 0, menuItems = [],
  filterUsers = [], filterCreators = [], filterTags = [],
  showTags = false, onToggleShowTags,
  savedFilters = [], onSaveFilter, onApplySavedFilter,
  getRowTags,
}: ErpDeskListProps<T>) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showEditFilters, setShowEditFilters] = React.useState(true);
  const [saveName, setSaveName] = React.useState('');
  const [openDropdown, setOpenDropdown] = React.useState<'assigned' | 'created' | 'tags' | 'saved' | null>(null);
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  const assignedLabel = filters.assignedToId === '__unassigned__'
    ? 'Unassigned'
    : filterUsers.find(u => u.id === filters.assignedToId)?.label || 'Assigned To';
  const createdLabel = filterCreators.find(u => u.id === filters.createdBy)?.label || 'Created By';
  const tagLabel = filters.tags || 'Tags';

  React.useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openDropdown]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">{title}</h1>
        <div className="flex items-center gap-2">
          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 border border-gray-200"
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="14" cy="8" r="1.5"/>
              </svg>
            </button>
            {showMenu && menuItems.length > 0 && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                {menuItems.map((item, i) => (
                  <button key={i} onClick={() => { item.onClick(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Add button */}
          {addHref ? (
            <a href={addHref}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-sm font-medium shadow-sm transition-colors">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2H9v4a1 1 0 0 1-2 0V9H3a1 1 0 0 1 0-2h4V3a1 1 0 0 1 1-1z"/></svg>
              {addLabel}
            </a>
          ) : (
            <button onClick={onAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-sm font-medium shadow-sm transition-colors">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2H9v4a1 1 0 0 1-2 0V9H3a1 1 0 0 1 0-2h4V3a1 1 0 0 1 1-1z"/></svg>
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-2.5 border-b border-gray-100 bg-[#f8f9fa] text-xs text-gray-500">
        <span className="font-semibold text-[11px] uppercase tracking-wide text-gray-400">Filter By</span>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpenDropdown(v => v === 'assigned' ? null : 'assigned')}
            className={`hover:text-[#014582] ${filters.assignedToId ? 'text-[#014582] font-medium' : ''}`}
          >
            {assignedLabel} ⌄
          </button>
          {openDropdown === 'assigned' && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] max-h-60 overflow-auto">
              <button type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                onClick={() => { onFilterChange('assignedToId', ''); setOpenDropdown(null); }}>
                All
              </button>
              <button type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                onClick={() => { onFilterChange('assignedToId', '__unassigned__'); setOpenDropdown(null); }}>
                Unassigned
              </button>
              {filterUsers.map(u => (
                <button key={u.id} type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                  onClick={() => { onFilterChange('assignedToId', u.id); setOpenDropdown(null); }}>
                  {u.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpenDropdown(v => v === 'created' ? null : 'created')}
            className={`hover:text-[#014582] ${filters.createdBy ? 'text-[#014582] font-medium' : ''}`}
          >
            {createdLabel} ⌄
          </button>
          {openDropdown === 'created' && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] max-h-60 overflow-auto">
              <button type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                onClick={() => { onFilterChange('createdBy', ''); setOpenDropdown(null); }}>
                All
              </button>
              {filterCreators.map(u => (
                <button key={u.id} type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                  onClick={() => { onFilterChange('createdBy', u.id); setOpenDropdown(null); }}>
                  {u.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="text-[#014582] font-medium hover:underline"
          onClick={() => setShowEditFilters(v => !v)}
        >
          {showEditFilters ? 'Hide Filters' : 'Edit Filters'}
        </button>

        <span className="text-gray-200 hidden sm:block">|</span>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpenDropdown(v => v === 'tags' ? null : 'tags')}
            className={`hover:text-[#014582] ${filters.tags ? 'text-[#014582] font-medium' : ''}`}
          >
            {tagLabel} ⌄
          </button>
          {openDropdown === 'tags' && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-h-60 overflow-auto">
              <button type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                onClick={() => { onFilterChange('tags', ''); setOpenDropdown(null); }}>
                All Tags
              </button>
              {filterTags.length === 0 ? (
                <div className="px-3 py-2 text-gray-400">No tags yet</div>
              ) : filterTags.map(tag => (
                <button key={tag} type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                  onClick={() => { onFilterChange('tags', tag); setOpenDropdown(null); }}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`font-medium hover:underline ${showTags ? 'text-[#014582]' : 'text-gray-500'}`}
          onClick={() => onToggleShowTags?.()}
        >
          {showTags ? 'Hide Tags' : 'Show Tags'}
        </button>

        <span className="text-gray-200 hidden sm:block">|</span>

        <span className="font-semibold text-[11px] uppercase tracking-wide text-gray-400">Save Filter</span>
        <input
          className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#014582]/40 w-28"
          placeholder="Filter Name"
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && saveName.trim() && onSaveFilter) {
              onSaveFilter(saveName.trim());
              setSaveName('');
            }
          }}
        />
        {onSaveFilter && (
          <button
            type="button"
            className="text-[#014582] font-medium hover:underline disabled:opacity-40"
            disabled={!saveName.trim()}
            onClick={() => {
              if (!saveName.trim()) return;
              onSaveFilter(saveName.trim());
              setSaveName('');
            }}
          >
            Save
          </button>
        )}
        {savedFilters.length > 0 && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="hover:text-[#014582]"
              onClick={() => setOpenDropdown(v => v === 'saved' ? null : 'saved')}
            >
              Saved ⌄
            </button>
            {openDropdown === 'saved' && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-h-60 overflow-auto">
                {savedFilters.map(sf => (
                  <button key={sf.name} type="button" className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                    onClick={() => { onApplySavedFilter?.(sf.name); setOpenDropdown(null); }}>
                    {sf.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Single table: filters + rows stay column-aligned ─ */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm border-collapse">
          <colgroup>
            {onSelect ? <col className="w-10" /> : null}
            {columns.map((col) => (
              <col key={col.key} className={col.width || ''} />
            ))}
            <col className="w-36" />
          </colgroup>

          {showEditFilters && (
            <thead>
              <tr className="bg-[#f4f5f6] border-b border-gray-100 text-xs">
                {onSelect && (
                  <th className="pl-4 pr-2 py-2 w-10 text-left align-middle">
                    <input type="checkbox" className="rounded-sm" checked={allSelected}
                      onChange={onSelectAll} />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className={`px-3 py-2 text-left align-middle ${col.width || ''}`}>
                    {col.filterType === 'text' ? (
                      <input className={listInput} placeholder={col.filterPlaceholder || col.label}
                        value={filters[col.key] || ''} onChange={e => onFilterChange(col.key, e.target.value)} />
                    ) : col.filterType === 'select' ? (
                      <select className={listSelect} value={filters[col.key] || ''}
                        onChange={e => onFilterChange(col.key, e.target.value)}>
                        <option value="">{col.filterPlaceholder || col.label}</option>
                        {(col.filterOptions || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{col.label}</span>
                    )}
                  </th>
                ))}
                <th className="px-3 py-2 text-right whitespace-nowrap align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={onSortChange}
                      className="text-gray-400 hover:text-gray-700 text-[10px]">
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </button>
                    <button type="button" className="text-[11px] text-gray-500 hover:text-gray-800 font-medium">{sortField}</button>
                  </div>
                </th>
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {onSelect && <td className="pl-4 pr-2 py-3"><div className="h-3.5 w-3.5 rounded bg-gray-100 animate-pulse" /></td>}
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-3">
                      <div className="h-3.5 rounded bg-gray-100 animate-pulse w-3/4" />
                    </td>
                  ))}
                  <td className="px-3 py-3" />
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={(onSelect ? 1 : 0) + columns.length + 1} className="py-20">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    {emptyIcon || (
                      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="8" width="40" height="40" rx="4" fill="#f4f5f6"/>
                        <rect x="16" y="20" width="24" height="3" rx="1.5" fill="#d1d5db"/>
                        <rect x="16" y="26" width="18" height="3" rx="1.5" fill="#d1d5db"/>
                        <rect x="16" y="32" width="20" height="3" rx="1.5" fill="#d1d5db"/>
                      </svg>
                    )}
                    <p className="text-sm font-medium text-gray-600">{emptyTitle}</p>
                    {emptySubtitle && <p className="text-xs text-gray-400">{emptySubtitle}</p>}
                    {(addHref || onAdd) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">Create your first {title}</span>
                        {addHref ? (
                          <a href={addHref}
                            className="text-xs font-medium text-[#014582] hover:underline border border-[#014582]/30 px-2 py-0.5 rounded">
                            Create New
                          </a>
                        ) : (
                          <button type="button" onClick={onAdd}
                            className="text-xs font-medium text-[#014582] hover:underline border border-[#014582]/30 px-2 py-0.5 rounded">
                            Create New
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr key={id}
                    className="hover:bg-[#f4f8ff] cursor-pointer transition-colors"
                    onClick={() => onRowClick?.(row)}>
                    {onSelect && (
                      <td className="pl-4 pr-2 py-2.5 w-10 align-middle">
                        <input type="checkbox" className="rounded-sm"
                          checked={selectedIds.has(id)}
                          onChange={e => { e.stopPropagation(); onSelect(id); }}
                          onClick={e => e.stopPropagation()} />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={`px-3 py-2.5 text-left align-middle text-gray-700 text-sm ${col.width || ''}`}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 align-middle">
                      {showTags && getRowTags ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(getRowTags(row) || []).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 border border-gray-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-[#f8f9fa] text-xs text-gray-500">
        <span>{totalCount > 0 ? `${totalCount} records` : ''}</span>
        <div className="flex items-center gap-1">
          {[20, 100, 500, 2500].map(size => (
            <button key={size} onClick={() => onPageSizeChange(size)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${pageSize === size ? 'bg-white border border-gray-300 text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
