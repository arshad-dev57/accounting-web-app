'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle,
  RefreshCw,
  ChevronRight as ChevronRightIcon,
  AlertTriangle,
  Save,
  BookOpen,
  PlusCircle, MinusCircle,
  Edit,
} from 'lucide-react';
import { journalEntryService, JournalEntry, JournalLine, JournalEntryStats } from '../../../lib/journal-entries-service';
import { chartOfAccountService } from '../../../lib/chart-of-accounts-service';

const PAGE_LIMIT = 10;

interface JournalLineInput {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestRef = useRef(0);

  const [stats, setStats] = useState<JournalEntryStats>({
    totalDebit: 0, totalCredit: 0, difference: 0, postedCount: 0, draftCount: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToActOn, setEntryToActOn] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');

  const filters = ['All', 'Posted', 'Draft'];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sales_selected_currency');
      if (saved) { const c = JSON.parse(saved); setCurrencySymbol(c.symbol || 'Rs.'); }
    } catch (e) {}
  }, []);

  useEffect(() => {
    chartOfAccountService.getAccounts({ limit: 100 }).then(r => {
      if (r.success) setAccounts(r.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);

    journalEntryService.getEntries({
      page: currentPage,
      limit: PAGE_LIMIT,
      search: debouncedSearch.trim() || undefined,
      status: selectedFilter !== 'All' ? selectedFilter : undefined,
      startDate: dateRange?.start || undefined,
      endDate: dateRange?.end || undefined,
    }).then(response => {
      if (requestId !== latestRequestRef.current) return;
      const pages = Math.max(1, response.pagination?.pages ?? 1);
      const page = response.pagination?.page ?? currentPage;
      setEntries(response.data || []);
      setPagination({
        page,
        limit: PAGE_LIMIT,
        total: response.pagination?.total ?? 0,
        pages,
        hasNext: response.pagination?.hasNext ?? page < pages,
        hasPrev: response.pagination?.hasPrev ?? page > 1,
      });
      if (response.stats) setStats(response.stats);
    }).catch(error => {
      if (requestId !== latestRequestRef.current) return;
      console.error('Error fetching entries:', error);
      alert(error.message || 'Failed to load journal entries');
    }).finally(() => {
      if (requestId === latestRequestRef.current) setLoading(false);
    });
  }, [debouncedSearch, selectedFilter, dateRange, currentPage, refreshTick]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(query);
      setCurrentPage(1);
    }, 300);
  };
  const clearSearch = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };
  const handleFilterChange = (filter: string) => { setSelectedFilter(filter); setCurrentPage(1); };
  const handleRefresh = () => { setCurrentPage(1); setRefreshTick(t => t + 1); };
  const handlePageChange = (newPage: number) => {
    if (
      loading ||
      newPage < 1 ||
      newPage > pagination.pages ||
      newPage === currentPage
    ) {
      return;
    }
    setCurrentPage(newPage);
  };
  const handleDateRangeChange = (start: string, end: string) => { setDateRange({ start, end }); setCurrentPage(1); };
  const clearDateRange = () => { setDateRange(null); setCurrentPage(1); };

  const handleCreateEntry = async (data: any) => {
    setSubmitting(true);
    try {
      await journalEntryService.createEntry(data);
      setShowCreateForm(false);
      setCurrentPage(1);
      setRefreshTick(t => t + 1);
    } catch (error: any) {
      alert(error.message || 'Failed to create journal entry');
    } finally { setSubmitting(false); }
  };

  const handleDeleteEntry = async () => {
    if (!entryToActOn) return;
    setSubmitting(true);
    try {
      await journalEntryService.deleteEntry(entryToActOn);
      setShowDeleteConfirm(false);
      setEntryToActOn(null);
      setViewingEntry(null);
      setCurrentPage(1);
      setRefreshTick(t => t + 1);
    } catch (error: any) {
      alert(error.message || 'Failed to delete entry');
    } finally { setSubmitting(false); }
  };

  const getStatusColor = (status: string) =>
    status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

  const getStatusIcon = (status: string) =>
    status === 'Posted'
      ? <CheckCircle className="w-4 h-4 text-green-600" />
      : <Edit className="w-4 h-4 text-yellow-600" />;

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return `${currencySymbol} 0.00`;
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateEntryForm accounts={accounts} onCancel={() => setShowCreateForm(false)}
          onSave={handleCreateEntry} submitting={submitting} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Journal Entries
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">({pagination.total} entries)</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={handleRefresh} disabled={loading}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all" title="Refresh">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Entry</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Debit</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalDebit)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Credit</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalCredit)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Difference</p>
              <p className={`text-lg md:text-xl font-bold ${Math.abs(stats.difference) < 0.01 ? 'text-green-600' : 'text-orange-600'} mt-0.5 md:mt-1`}>
                {formatCurrency(stats.difference)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Entries</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">
                {stats.postedCount + stats.draftCount}
                <span className="text-xs font-normal text-gray-400 ml-1">({stats.postedCount} posted, {stats.draftCount} draft)</span>
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input type="text" placeholder="Search entries..." value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none" />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select value={selectedFilter} onChange={(e) => handleFilterChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50">
                    {filters.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  <input type="date" onChange={(e) => { if (e.target.value) handleDateRangeChange(e.target.value, dateRange?.end || ''); }}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto" />
                  <span className="text-gray-400 text-xs md:text-sm hidden xs:inline">to</span>
                  <input type="date" onChange={(e) => { if (e.target.value) handleDateRangeChange(dateRange?.start || '', e.target.value); }}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto" />
                  {dateRange && (
                    <button onClick={clearDateRange} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="space-y-3 md:space-y-4">
            {loading && entries.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading journal entries...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <BookOpen className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No journal entries found</p>
                <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setViewingEntry(entry)}>
                  <div className="p-3 md:p-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`p-2 md:p-2.5 rounded-xl ${entry.status === 'Posted' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {getStatusIcon(entry.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{entry.entryNumber}</p>
                          <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 truncate mt-0.5">{entry.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                          <span className="text-[10px] md:text-xs text-gray-400">{formatDate(entry.date)}</span>
                          {entry.reference && (<>
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">Ref: {entry.reference}</span>
                          </>)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm md:text-base font-bold text-green-600">{formatCurrency(entry.totalDebit)}</p>
                        <p className="text-xs text-gray-400">Dr</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(entry.totalCredit)}</p>
                        <p className="text-xs text-gray-400">Cr</p>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination.total > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs md:text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">
                    {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  –{' '}
                  <span className="font-semibold text-gray-700">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-700">{pagination.total}</span> entries
                </p>

                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1 || loading}
                    className="hidden sm:flex p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="First page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev || loading}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                      let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);

                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-xs md:text-sm font-medium transition-all"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="start-ellipsis" className="px-2 text-gray-400">...</span>
                          );
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-xs md:text-sm font-medium transition-all ${
                              i === pagination.page
                                ? 'bg-[#014582] text-white border-[#014582] shadow-md shadow-[#014582]/25'
                                : 'border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (endPage < pagination.pages) {
                        if (endPage < pagination.pages - 1) {
                          pages.push(
                            <span key="end-ellipsis" className="px-2 text-gray-400">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={pagination.pages}
                            onClick={() => handlePageChange(pagination.pages)}
                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-xs md:text-sm font-medium transition-all"
                          >
                            {pagination.pages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages || loading}
                    className="hidden sm:flex p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Last page"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-gray-500">Go to</span>
                  <input
                    type="number"
                    min={1}
                    max={pagination.pages}
                    value={pagination.page}
                    onChange={(e) => {
                      const page = parseInt(e.target.value, 10);
                      if (page >= 1 && page <= pagination.pages) {
                        handlePageChange(page);
                      }
                    }}
                    className="w-12 md:w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm text-center focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                  <span className="text-xs md:text-sm text-gray-500">of {pagination.pages}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {viewingEntry && (
        <EntryDetailModal entry={viewingEntry} onClose={() => setViewingEntry(null)}
          onDelete={() => { setEntryToActOn(viewingEntry.id); setShowDeleteConfirm(true); setViewingEntry(null); }}
          formatCurrency={formatCurrency} formatDate={formatDate}
          getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} submitting={submitting} />
      )}

      {showDeleteConfirm && (
        <ConfirmationModal title="Delete Journal Entry"
          message="Are you sure you want to delete this journal entry? This action cannot be undone and will reverse all balance updates."
          confirmLabel="Delete" confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteEntry}
          onCancel={() => { setShowDeleteConfirm(false); setEntryToActOn(null); }}
          loading={submitting} />
      )}
    </div>
  );
}

function CreateEntryForm({ accounts, onCancel, onSave, submitting, formatCurrency, currencySymbol }: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [] as JournalLineInput[]
  });
  const [error, setError] = useState('');
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});

  const addLine = () => setFormData(prev => ({
    ...prev,
    lines: [...prev.lines, { id: crypto.randomUUID(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0 }]
  }));

  const removeLine = (index: number) =>
    setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));

  const updateLine = (index: number, field: keyof JournalLineInput, value: any) => {
    setFormData(prev => {
      const newLines = [...prev.lines];
      const line = { ...newLines[index], [field]: value };
      if (field === 'debit' && value > 0) line.credit = 0;
      else if (field === 'credit' && value > 0) line.debit = 0;
      if (field === 'accountId') {
        const acc = accounts.find((a: any) => a.id === value);
        if (acc) { line.accountName = acc.name || ''; line.accountCode = acc.code || ''; }
      }
      newLines[index] = line;
      return { ...prev, lines: newLines };
    });
  };

  const getTotalDebit = () => formData.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const getTotalCredit = () => formData.lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = () => Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;

  const validateLines = () => {
    const errors: Record<number, string> = {};
    let hasError = false;
    formData.lines.forEach((line, i) => {
      if (!line.accountId) { errors[i] = 'Please select an account'; hasError = true; }
      else if (line.debit === 0 && line.credit === 0) { errors[i] = 'Enter debit or credit amount'; hasError = true; }
      else if (line.debit > 0 && line.credit > 0) { errors[i] = 'Cannot have both debit and credit'; hasError = true; }
    });
    if (formData.lines.length < 2) { setError('Add at least two journal lines'); return false; }
    if (!isBalanced()) { setError('Total debit must equal total credit'); return false; }
    setLineErrors(errors); setError('');
    return !hasError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) { setError('Description is required'); return; }
    if (!validateLines()) return;
    onSave({
      date: formData.date,
      description: formData.description.trim(),
      reference: formData.reference.trim(),
      lines: formData.lines.map(l => ({ accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0 }))
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">New Journal Entry</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-4 md:p-6 max-h-[600px] md:max-h-[700px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Journal Date *</label>
            <input type="date" value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" required />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea rows={2} placeholder="Enter journal description" value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none" required />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference (Optional)</label>
            <input type="text" placeholder="e.g., INV-001" value={formData.reference}
              onChange={e => setFormData(p => ({ ...p, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs md:text-sm font-semibold text-gray-700">Journal Lines *</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs md:text-sm text-[#014582] font-semibold hover:text-[#01366a]">
                <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />Add Line
              </button>
            </div>
            <div className="space-y-3">
              {formData.lines.map((line, index) => (
                <div key={line.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Line {index + 1}</span>
                    {formData.lines.length > 2 && (
                      <button type="button" onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700">
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <select value={line.accountId} onChange={e => updateLine(index, 'accountId', e.target.value)}
                        className={`w-full px-3 md:px-4 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white ${lineErrors[index] ? 'border-red-500' : 'border-gray-200'}`}>
                        <option value="">Select account</option>
                        {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                      </select>
                      {lineErrors[index] && <p className="text-[10px] md:text-xs text-red-500 mt-1">{lineErrors[index]}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] md:text-xs text-gray-500">Debit</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs md:text-sm">{currencySymbol}</span>
                          <input type="number" step="0.01" min="0" value={line.debit || ''}
                            onChange={e => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 md:pl-10 pr-2 py-1 md:py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] md:text-xs text-gray-500">Credit</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs md:text-sm">{currencySymbol}</span>
                          <input type="number" step="0.01" min="0" value={line.credit || ''}
                            onChange={e => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 md:pl-10 pr-2 py-1 md:py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {formData.lines.length > 0 && (
              <div className={`mt-3 p-3 rounded-lg ${isBalanced() ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Total Debit</span>
                  <span className="font-bold text-green-600">{formatCurrency(getTotalDebit())}</span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Total Credit</span>
                  <span className="font-bold text-red-600">{formatCurrency(getTotalCredit())}</span>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm pt-1 border-t border-gray-200 mt-1">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-bold ${isBalanced() ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isBalanced() ? '✓ Balanced' : '⚠ Not Balanced'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button type="button" onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EntryDetailModal({ entry, onClose, onDelete, formatCurrency, formatDate, getStatusColor, getStatusIcon, submitting }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className={`p-2 md:p-2.5 rounded-xl ${entry.status === 'Posted' ? 'bg-green-50' : 'bg-yellow-50'}`}>
              {getStatusIcon(entry.status)}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{entry.entryNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${getStatusColor(entry.status)}`}>
                  {entry.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(entry.date)}</span>
                {entry.reference && (<>
                  <span className="text-[10px] md:text-xs text-gray-400">•</span>
                  <span className="text-[10px] md:text-xs text-gray-500">Ref: {entry.reference}</span>
                </>)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-4">
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">Description</p>
            <p className="text-sm md:text-base text-gray-800 mt-1">{entry.description}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm md:text-base font-bold text-gray-700">Journal Lines</h4>
              <span className="text-[10px] md:text-xs text-gray-400">{entry.lines.length} lines</span>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Account</th>
                    <th className="text-right px-3 py-2 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Debit</th>
                    <th className="text-right px-3 py-2 text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines.map((line: JournalLine, index: number) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-800">{line.accountName}</p>
                        <p className="text-[10px] md:text-xs text-gray-400">{line.accountCode}</p>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-green-600">
                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">
                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-3 py-2 text-[10px] md:text-xs text-gray-500 uppercase">Total</td>
                    <td className="px-3 py-2 text-right text-green-600">{formatCurrency(entry.totalDebit)}</td>
                    <td className="px-3 py-2 text-right text-red-600">{formatCurrency(entry.totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 mt-4 grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Created By</p>
              <p className="text-xs md:text-sm text-gray-800">{entry.createdBy}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Created At</p>
              <p className="text-xs md:text-sm text-gray-800">{formatDate(entry.createdAt)}</p>
            </div>
            {entry.postedBy && <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Posted By</p>
              <p className="text-xs md:text-sm text-gray-800">{entry.postedBy}</p>
            </div>}
            {entry.postedAt && <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Posted At</p>
              <p className="text-xs md:text-sm text-gray-800">{formatDate(entry.postedAt)}</p>
            </div>}
          </div>
          {entry.status === 'Draft' && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button onClick={onDelete} disabled={submitting}
                className="w-full px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50">
                Delete Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading, extraContent }: {
  title: string; message: string; confirmLabel: string; confirmColor: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean; extraContent?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl mx-3 md:mx-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600">{message}</p>
          {extraContent}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 md:mt-6">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${confirmColor}`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

