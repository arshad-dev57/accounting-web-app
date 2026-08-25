'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Download, Calendar, TrendingUp, TrendingDown,
  FileSpreadsheet, FileText, ChevronDown, Loader2, X,
  AlertCircle, CheckCircle, Clock, DollarSign,
  ArrowUpRight, ArrowDownRight, Receipt, Wallet, Building, Landmark,
  BarChart, PieChart, Settings, HelpCircle, ChevronRight, Printer,
  CheckCircle as CheckCircleIcon, AlertTriangle, Minus, Plus,
  Equal, Calculator, Shield, Briefcase, TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon, Activity,
  Users, Mail, Phone, Search, Filter, CalendarDays,
  User, Mail as MailIcon, Phone as PhoneIcon, Receipt as ReceiptIcon
} from 'lucide-react';
import { agedReceivablesService, AgedCustomer, AgedInvoice, AgedSummary } from '../../api/aged-recievables/route';
import { toast } from 'react-hot-toast';
import { useLocation } from '../../../lib/location-context';
import { useCurrency } from '../../../lib/currency-context';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  bucket: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function AgedReceivablesPage() {
  const { locationIdForApi } = useLocation();
  const [customers, setCustomers] = useState<AgedCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<AgedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AgedSummary>({
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    daysOver90: 0,
    totalOutstanding: 0
  });
  const [asAtDate, setAsAtDate] = useState(new Date());
  const { symbol: currencySymbol } = useCurrency();
  const [filter, setFilter] = useState<FilterState>({
    bucket: 'All',
    search: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState<AgedCustomer | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);

  const bucketOptions = ['All', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];


  const calculateAging = useCallback((customersData: AgedCustomer[], asOfDate: Date) => {
    const updatedCustomers = customersData.map(customer => {
      let current = 0;
      let days1to30 = 0;
      let days31to60 = 0;
      let days61to90 = 0;
      let daysOver90 = 0;

      customer.invoices.forEach(invoice => {
        const outstanding = invoice.amount - invoice.paidAmount;
        if (outstanding <= 0) return;

        const daysOverdue = Math.floor((asOfDate.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 0) {
          current += outstanding;
        } else if (daysOverdue <= 30) {
          days1to30 += outstanding;
        } else if (daysOverdue <= 60) {
          days31to60 += outstanding;
        } else if (daysOverdue <= 90) {
          days61to90 += outstanding;
        } else {
          daysOver90 += outstanding;
        }
      });

      return {
        ...customer,
        current,
        days1to30,
        days31to60,
        days61to90,
        daysOver90
      };
    });

    // Calculate totals
    const totals = updatedCustomers.reduce((acc, c) => ({
      current: acc.current + c.current,
      days1to30: acc.days1to30 + c.days1to30,
      days31to60: acc.days31to60 + c.days31to60,
      days61to90: acc.days61to90 + c.days61to90,
      daysOver90: acc.daysOver90 + c.daysOver90,
      totalOutstanding: acc.totalOutstanding + c.totalOutstanding
    }), {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      daysOver90: 0,
      totalOutstanding: 0
    });

    return { updatedCustomers, totals };
  }, []);

  // ─── Fetch Data ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agedReceivablesService.getAgedReceivables({
        locationId: locationIdForApi || undefined,
      });
      
      const { updatedCustomers, totals } = calculateAging(data.data.customers, asAtDate);
      setCustomers(updatedCustomers);
      setFilteredCustomers(updatedCustomers);
      setSummary(totals);
    } catch (error: any) {
      console.error('Failed to fetch aged receivables:', error);
      toast.error(error.message || 'Failed to load aged receivables');
    } finally {
      setLoading(false);
    }
  }, [asAtDate, calculateAging, locationIdForApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Apply Filters ────────────────────────────────────────────

  useEffect(() => {
    let filtered = [...customers];

    if (filter.bucket !== 'All') {
      filtered = filtered.filter(c => {
        switch (filter.bucket) {
          case 'Current': return c.current > 0;
          case '1-30 Days': return c.days1to30 > 0;
          case '31-60 Days': return c.days31to60 > 0;
          case '61-90 Days': return c.days61to90 > 0;
          case '90+ Days': return c.daysOver90 > 0;
          default: return true;
        }
      });
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query)
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, filter]);

  // ─── Handle Date Change ──────────────────────────────────────

  const handleDateChange = async (date: Date) => {
    setAsAtDate(date);
    const { updatedCustomers, totals } = calculateAging(customers, date);
    setCustomers(updatedCustomers);
    setFilteredCustomers(updatedCustomers);
    setSummary(totals);
  };

  // ─── Format Currency ──────────────────────────────────────

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── Render Summary Cards ──────────────────────────────────

  const renderSummaryCards = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">Current</p>
          <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{formatCurrency(summary.current)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">1-30 Days</p>
          <p className="text-lg md:text-xl font-bold text-yellow-600 mt-0.5 md:mt-1">{formatCurrency(summary.days1to30)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">31-60 Days</p>
          <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{formatCurrency(summary.days31to60)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">61-90 Days</p>
          <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.days61to90)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">90+ Days</p>
          <p className="text-lg md:text-xl font-bold text-red-700 mt-0.5 md:mt-1">{formatCurrency(summary.daysOver90)}</p>
        </div>
      </div>
    );
  };

  // ─── Render Aging Buckets ──────────────────────────────────

  const renderAgingBuckets = (customer: AgedCustomer) => {
    const buckets = [
      { label: 'Current', value: customer.current, color: 'text-green-600' },
      { label: '1-30', value: customer.days1to30, color: 'text-yellow-600' },
      { label: '31-60', value: customer.days31to60, color: 'text-orange-600' },
      { label: '61-90', value: customer.days61to90, color: 'text-red-600' },
      { label: '90+', value: customer.daysOver90, color: 'text-red-700' },
    ];

    return (
      <div className="flex gap-1 mt-2">
        {buckets.map((bucket, idx) => (
          <div key={idx} className="flex-1 text-center">
            <p className="text-[8px] text-gray-400">{bucket.label}</p>
            <p className={`text-[10px] font-bold ${bucket.value > 0 ? bucket.color : 'text-gray-300'}`}>
              {formatCurrency(bucket.value)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-[#014582] animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading Aged Receivables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
              Aged Receivables
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{filteredCustomers.length} customers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={fetchData}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => agedReceivablesService.exportToExcel(customers, summary, asAtDate, formatCurrency)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-600 transition-all"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">As at:</span>
          <input
            type="date"
            value={asAtDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                handleDateChange(date);
              }
            }}
            className="px-3 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
          />
          <span className="text-sm text-gray-500 ml-auto">
            {formatDate(asAtDate.toISOString())}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
          <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
            {filter.search && (
              <button
                onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="relative flex-1 sm:flex-none min-w-[100px]">
            <select
              value={filter.bucket}
              onChange={(e) => setFilter(prev => ({ ...prev, bucket: e.target.value }))}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {bucketOptions.map((bucket) => (
                <option key={bucket} value={bucket}>{bucket}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3 md:space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 md:py-12 text-gray-400">
            <Users className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
            <p className="text-sm md:text-lg font-medium text-gray-500">No customers found</p>
            <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setSelectedCustomer(customer);
                setShowCustomerDetail(true);
              }}
            >
              <div className="p-3 md:p-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{customer.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                      <span className="text-[10px] md:text-xs text-gray-500">{customer.email}</span>
                      <span className="text-[10px] md:text-xs text-gray-300">•</span>
                      <span className="text-[10px] md:text-xs text-gray-500">{customer.phone}</span>
                      <span className="text-[10px] md:text-xs text-gray-300">•</span>
                      <span className="text-[10px] md:text-xs text-gray-400">{customer.invoices.length} invoices</span>
                    </div>
                    {renderAgingBuckets(customer)}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm md:text-base font-bold text-red-600">{formatCurrency(customer.totalOutstanding)}</p>
                    <p className="text-[10px] md:text-xs text-gray-400">Outstanding</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          asAtDate={asAtDate}
          onClose={() => {
            setShowCustomerDetail(false);
            setSelectedCustomer(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOMER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function CustomerDetailModal({
  customer,
  asAtDate,
  onClose,
  formatCurrency,
  formatDate
}: any) {
  const getDaysOverdue = (dueDate: string) => {
    return Math.floor((asAtDate.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysOverdue: number) => {
    if (daysOverdue <= 0) return 'text-green-600 bg-green-100';
    if (daysOverdue <= 30) return 'text-yellow-600 bg-yellow-100';
    if (daysOverdue <= 60) return 'text-orange-600 bg-orange-100';
    if (daysOverdue <= 90) return 'text-red-600 bg-red-100';
    return 'text-red-700 bg-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xl">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className="text-[10px] md:text-xs text-gray-500">{customer.email}</span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{customer.phone}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-500">Current</p>
              <p className="text-xs font-bold text-green-600">{formatCurrency(customer.current)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-500">1-30</p>
              <p className="text-xs font-bold text-yellow-600">{formatCurrency(customer.days1to30)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-500">31-60</p>
              <p className="text-xs font-bold text-orange-600">{formatCurrency(customer.days31to60)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-500">61-90</p>
              <p className="text-xs font-bold text-red-600">{formatCurrency(customer.days61to90)}</p>
            </div>
            <div className="bg-red-100 rounded-lg p-2 text-center">
              <p className="text-[8px] text-gray-500">90+</p>
              <p className="text-xs font-bold text-red-700">{formatCurrency(customer.daysOver90)}</p>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Outstanding</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(customer.totalOutstanding)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Invoices ({customer.invoices.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {customer.invoices.map((invoice: AgedInvoice, index: number) => {
                const outstanding = invoice.amount - invoice.paidAmount;
                const daysOverdue = getDaysOverdue(invoice.dueDate);
                const isPaid = outstanding <= 0;
                const statusColor = getStatusColor(daysOverdue);

                return (
                  <div key={index} className={`p-3 rounded-lg border ${isPaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{invoice.id}</p>
                        <p className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        {isPaid ? (
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Paid</span>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-red-600">{formatCurrency(outstanding)}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColor}`}>
                              {daysOverdue <= 0 ? 'Current' : `${daysOverdue} days overdue`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}