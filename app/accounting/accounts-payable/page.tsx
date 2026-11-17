'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Users, Receipt,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText, CreditCard,
  RefreshCw, Trash2, Building2, CalendarDays,
  ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown,
  Send, Save, Printer, Download, Landmark,
  ReceiptText, ReceiptIndianRupee, ShoppingCart,
  User, Phone, Mail, Building, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit, Archive, MoreVertical, Info, Layers,
  BookOpen, FileSpreadsheet, FileText as FileTextIcon,
  PlusCircle, MinusCircle, List, Scale,
  Filter as FilterIcon, Calendar as CalendarIcon,
  Download as DownloadIcon, Printer as PrinterIcon,
  Eye as EyeIcon, EyeOff, ChevronUp, ChevronDown as ChevronDownIcon,
  History, Building as BuildingIcon, Hash,
  Banknote as BanknoteIcon, Handshake, Home, ShoppingBag,
  Receipt as ReceiptIcon, Briefcase, DollarSign as DollarSignIcon,
  Home as HomeIcon, Bolt, Users as UsersIcon, Megaphone, Package, Plane, Utensils,
  Shield as Security, Wrench as Build, Monitor as Computer, Receipt as ReceiptIcon2,
  UserCircle, PhoneCall, Mail as MailIcon, FileText as FileTextIcon2
} from 'lucide-react';
import { accountsPayableService, Bill, Summary, Supplier, BankAccount, BillItem } from '../../api/accounts-payable/route';
import TaxRateSelect from '../../../components/TaxRateSelect';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../../../lib/currency-context';

// ─── TYPES ─────────────────────────────────────────────────────

interface FilterState {
  status: string;
  search: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function AccountsPayablePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState<Summary>({
    totalOutstanding: 0,
    overdue: 0,
    dueThisWeek: 0,
    dueThisMonth: 0,
    totalBills: 0
  });
  const [filter, setFilter] = useState<FilterState>({
    status: 'All',
    search: ''
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const { symbol: currencySymbol } = useCurrency();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = ['All', 'Overdue', 'Active'];

  // ─── Fetch suppliers with open purchase invoices (AP ledger) ──

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountsPayableService.getSuppliers({
        search: searchTerm || undefined,
        filter:
          filter.status === 'Overdue'
            ? 'overdue'
            : filter.status === 'All'
              ? 'active'
              : filter.status.toLowerCase(),
      });
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch suppliers:', error);
      toast.error(error.message || 'Failed to load payables');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  // ─── Fetch Bank Accounts ─────────────────────────────────────

  const fetchBankAccounts = useCallback(async () => {
    try {
      const accounts = await accountsPayableService.getBankAccounts();
      setBankAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  }, []);

  // ─── Fetch Summary ───────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      const data = await accountsPayableService.getSummary({
      });
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  // ─── Initial / filter fetch ─────────────────────────────────

  useEffect(() => {
    fetchBankAccounts();
    fetchSummary();
  }, [fetchBankAccounts, fetchSummary]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSuppliers();
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, filter.status, fetchSuppliers]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleStatusChange = (status: string) => {
    setFilter((prev) => ({ ...prev, status }));
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchSuppliers();
  };

  const openPayForm = (bill: Bill, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedBill({
      ...bill,
      items: bill.items || [],
      supplierName: bill.supplierName || selectedSupplier?.name || '',
      supplierId: bill.supplierId || selectedSupplier?.id || '',
    });
    setShowPaymentForm(true);
    void fetchBankAccounts();
  };

  const handleRecordPayment = async (data: any) => {
    setSubmitting(true);
    try {
      await accountsPayableService.recordPayment(data);
      toast.success('Payment recorded successfully!');
      setShowPaymentForm(false);
      setSelectedBill(null);
      setSelectedSupplier(null);
      fetchSummary();
      fetchSuppliers();
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const viewSupplierDetail = (supplier: Supplier) => {
    setSelectedSupplier({
      ...supplier,
      invoices: supplier.invoices || supplier.bills || [],
    });
  };

  const getSupplierStatusText = (supplier: Supplier) => {
    const invoices = supplier.invoices || supplier.bills || [];
    if (invoices.some((inv) => inv.status === 'Overdue')) return 'Overdue';
    if ((supplier.outstandingAmount || 0) > 0) return 'Open';
    return 'Clear';
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Clear':
        return 'bg-green-100 text-green-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Clear':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Partial':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showPaymentForm && selectedBill ? (
        <PaymentForm
          bill={selectedBill}
          bankAccounts={bankAccounts}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedBill(null);
          }}
          onSave={handleRecordPayment}
          submitting={submitting}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/accounting/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Accounts Payable
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({suppliers.length} suppliers)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Link
                href="/purchases/invoices"
                className="px-3 py-1.5 text-xs md:text-sm font-semibold text-[#014582] border border-[#014582]/30 rounded-lg hover:bg-[#014582]/5"
              >
                Purchase Invoices
              </Link>
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-xs md:text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            Supplier-wise outstanding from the <strong>Purchases</strong> module (purchase invoices). Pay here against open supplier balances — same suppliers as Purchases.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{formatCurrency(summary.totalOutstanding)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Overdue</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{formatCurrency(summary.overdue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Due This Week</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{formatCurrency(summary.dueThisWeek)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Due This Month</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{formatCurrency(summary.dueThisMonth)}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select
                    value={filter.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Supplier List */}
          <div className="space-y-3 md:space-y-4">
            {loading && suppliers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                <p className="mt-2 text-xs md:text-sm text-gray-500">Loading suppliers...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <Users className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No open payables</p>
                <p className="text-xs md:text-sm text-gray-400">
                  Suppliers with unpaid purchase invoices will appear here
                </p>
              </div>
            ) : (
              suppliers.map((supplier) => {
                const statusText = getSupplierStatusText(supplier);
                const statusColor = getStatusColor(statusText);
                const statusIcon = getStatusIcon(statusText);
                const invoices = supplier.invoices || supplier.bills || [];
                const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;

                return (
                  <div
                    key={supplier.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => viewSupplierDetail(supplier)}
                  >
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-2.5 rounded-xl bg-orange-100">
                          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{supplier.name}</p>
                            <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                              {statusIcon}
                              <span className="hidden xs:inline">{statusText}</span>
                            </span>
                            {overdueCount > 0 && (
                              <span className="text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                                {overdueCount} OD
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-0.5">
                            {supplier.email && (
                              <>
                                <span className="text-[10px] md:text-xs text-gray-500">{supplier.email}</span>
                                <span className="text-[10px] md:text-xs text-gray-300">•</span>
                              </>
                            )}
                            {supplier.phone && (
                              <span className="text-[10px] md:text-xs text-gray-500">{supplier.phone}</span>
                            )}
                            <span className="text-[10px] md:text-xs text-gray-300">•</span>
                            <span className="text-[10px] md:text-xs text-gray-400">
                              {supplier.totalInvoices || invoices.length} purchase invoice(s)
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-red-600">
                            {formatCurrency(supplier.outstandingAmount || 0)}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-400">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && !showPaymentForm && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          onPayInvoice={(bill: Bill) => openPayForm(bill)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getSupplierStatusText={getSupplierStatusText}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUPPLIER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function SupplierDetailModal({
  supplier,
  onClose,
  onPayInvoice,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getSupplierStatusText,
}: any) {
  const statusText = getSupplierStatusText(supplier);
  const statusColor = getStatusColor(statusText);
  const statusIcon = getStatusIcon(statusText);
  const invoices: Bill[] = supplier.invoices || supplier.bills || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-orange-100">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{supplier.name}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {statusText}
                </span>
                <span className="text-[10px] md:text-xs text-gray-500">
                  {invoices.length} open purchase invoice(s)
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600">
                {formatCurrency(supplier.outstandingAmount || 0)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Open Invoices</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{invoices.length}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {supplier.email && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Email</span>
                <span className="text-sm font-medium text-gray-800">{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Phone</span>
                <span className="text-sm font-medium text-gray-800">{supplier.phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Open Purchase Invoices</h4>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No open invoices</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {invoice.invoiceNumber || invoice.billNumber}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {invoice.documentLabel || (invoice.source === 'purchaseInvoice' ? 'Purchase Invoice' : 'Vendor Bill')}
                        {' · '}Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold text-red-600">
                          {formatCurrency(invoice.outstanding)}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      {invoice.outstanding > 0 && (
                        <button
                          type="button"
                          onClick={() => onPayInvoice(invoice)}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD BILL FORM (legacy — kept for optional manual vendor bills)
// ═══════════════════════════════════════════════════════════════

function AddBillForm({
  suppliers,
  bankAccounts,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol,
  getNextBillNumber
}: any) {
  const [formData, setFormData] = useState({
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supplierId: '',
    reference: '',
    description: '',
    taxRate: 0,
    discount: 0
  });
  const [items, setItems] = useState<BillItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);
  const [error, setError] = useState('');

  // Generate bill number on mount
  useEffect(() => {
    getNextBillNumber().then((num: string) => {
      setFormData(prev => ({ ...prev, billNumber: num }));
    });
  }, []);

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * (formData.taxRate / 100);
    return subtotal + tax - formData.discount;
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = item.quantity * item.unitPrice;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      setError('Please select a supplier');
      return;
    }
    const hasInvalidItem = items.some(item => !item.description.trim() || item.unitPrice <= 0);
    if (hasInvalidItem) {
      setError('Please fill all item details');
      return;
    }
    setError('');

    onSave({
      billNumber: formData.billNumber,
      date: formData.date,
      dueDate: formData.dueDate,
      supplierId: formData.supplierId,
      reference: formData.reference,
      description: formData.description,
      items: items,
      taxRate: formData.taxRate,
      discount: formData.discount,
      subtotal: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    });
  };

  const total = calculateTotal();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Receipt className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Add Bill</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 max-h-[600px] md:max-h-[700px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Number */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bill Number *</label>
            <input
              type="text"
              value={formData.billNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bill Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Supplier *</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s: Supplier) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Items</label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Description *"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                      />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{currencySymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Unit Price *"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                        />
                      </div>
                    </div>
                    {item.amount > 0 && (
                      <p className="text-xs font-semibold text-[#014582] text-right">Amount: {formatCurrency(item.amount)}</p>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-[#014582] font-semibold hover:text-[#01366a]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>

          {/* Tax & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Tax Rate</label>
              <TaxRateSelect
                value={formData.taxRate}
                onChange={(rate) => setFormData(prev => ({ ...prev, taxRate: rate }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Discount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Reference & Description */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="e.g., PO-001"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              placeholder="Enter bill description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          {/* Total Amount */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between text-sm font-bold">
              <span>Total Amount</span>
              <span className="text-red-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Save Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT FORM
// ═══════════════════════════════════════════════════════════════

function PaymentForm({
  bill,
  bankAccounts: bankAccountsProp,
  onCancel,
  onSave,
  submitting,
  formatCurrency,
  currencySymbol
}: any) {
  const [formData, setFormData] = useState({
    amount: bill?.outstanding || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    reference: '',
    bankAccountId: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [bankAccounts, setBankAccounts] = useState<any[]>(bankAccountsProp || []);
  const [loadingBanks, setLoadingBanks] = useState(false);

  useEffect(() => {
    if (Array.isArray(bankAccountsProp) && bankAccountsProp.length > 0) {
      setBankAccounts(bankAccountsProp);
    }
  }, [bankAccountsProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Always refresh when pay form opens — avoids empty keep-alive cache
      setLoadingBanks(true);
      try {
        const accounts = await accountsPayableService.getBankAccounts();
        if (!cancelled) setBankAccounts(accounts || []);
      } catch (err) {
        console.error('Failed to load bank accounts in payment form:', err);
      } finally {
        if (!cancelled) setLoadingBanks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (formData.amount > bill.outstanding) {
      setError('Amount exceeds outstanding balance');
      return;
    }
    if (formData.paymentMethod !== 'Cash' && !formData.bankAccountId) {
      setError(`Please select a bank account for ${formData.paymentMethod}`);
      return;
    }
    setError('');

    onSave({
      billId: bill.id,
      supplierId: bill.supplierId || bill.vendorId,
      amount: formData.amount,
      paymentDate: new Date(formData.paymentDate),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      bankAccountId: formData.paymentMethod !== 'Cash' ? formData.bankAccountId : null,
      notes: formData.notes
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 md:gap-3">
          <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-[#014582]" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">Pay & Clear Payable</h2>
        </div>
        <button onClick={onCancel} className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition-all">
          <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            {bill.invoiceNumber || bill.billNumber}
          </p>
          <p className="text-xs text-gray-500">
            {bill.documentLabel || (bill.source === 'purchaseInvoice' ? 'Purchase Invoice' : 'Vendor Bill')}
            {' · '}Supplier: {bill.supplierName}
          </p>
          <p className="text-xs text-gray-500">
            Outstanding: <span className="font-semibold text-red-600">{formatCurrency(bill.outstanding)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs md:text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={bill.outstanding}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Date *</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Method *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          {formData.paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Bank Account</label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">Select bank account...</option>
                {(bankAccounts || []).map((acc: any) => {
                  const label =
                    acc.name ||
                    acc.accountName ||
                    'Bank account';
                  const bank = acc.bankName ? ` — ${acc.bankName}` : '';
                  const number = acc.accountNumber ? ` (${acc.accountNumber})` : '';
                  return (
                    <option key={acc.id || acc._id} value={acc.id || acc._id}>
                      {label}{bank}{number}
                    </option>
                  );
                })}
              </select>
              {loadingBanks && (
                <p className="mt-1.5 text-[11px] text-gray-500">Loading bank accounts...</p>
              )}
              {!loadingBanks && (!bankAccounts || bankAccounts.length === 0) && (
                <p className="mt-1.5 text-[11px] text-amber-600">
                  No active bank accounts found. Add one under Accounting → Bank Accounts.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Reference</label>
            <input
              type="text"
              placeholder="Reference number"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 md:px-4 py-1.5 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-green-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              Pay & Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BILL DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function BillDetailModal({
  bill,
  onClose,
  onPay,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon
}: any) {
  const statusColor = getStatusColor(bill.status);
  const statusIcon = getStatusIcon(bill.status);
  const overdue = new Date(bill.dueDate) < new Date() && bill.status !== 'Paid';
  const items = bill.items || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-red-100">
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{bill.billNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
                  {statusIcon}
                  {bill.status}
                </span>
                {overdue && (
                  <span className="text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700">
                    Overdue
                  </span>
                )}
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(bill.date)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Total</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(bill.totalAmount)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Paid</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(bill.paidAmount)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{formatCurrency(bill.outstanding)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Supplier</span>
              <span className="text-sm font-medium text-gray-800">{bill.supplierName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Bill Date</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(bill.date)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400 font-medium">Due Date</span>
              <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                {formatDate(bill.dueDate)}
                {overdue && ' (Overdue)'}
              </span>
            </div>
            {bill.currency?.code && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Currency</span>
                <span className="text-sm font-medium text-gray-800">{bill.currency.code}</span>
              </div>
            )}
            {bill.exchangeRate != null && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Rate</span>
                <span className="text-sm font-medium text-gray-800">{bill.exchangeRate}</span>
              </div>
            )}
            {bill.foreignAmount != null && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Foreign Amount</span>
                <span className="text-sm font-medium text-gray-800">
                  {bill.currency?.symbol || ''} {Number(bill.foreignAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {bill.baseAmount != null && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Local Amount</span>
                <span className="text-sm font-medium text-gray-800">
                  {Number(bill.baseAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {bill.reference && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Reference</span>
                <span className="text-sm font-medium text-gray-800">{bill.reference}</span>
              </div>
            )}
            {bill.description && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400 font-medium">Description</span>
                <span className="text-sm font-medium text-gray-800">{bill.description}</span>
              </div>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">Items</h4>
                <span className="text-xs text-gray-400">{items.length} items</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item: BillItem, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {bill.status !== 'Paid' && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={onPay}
                className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
              >
                <CreditCard className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export { AccountsPayablePage };
