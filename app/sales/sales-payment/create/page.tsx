'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, CreditCard, Loader2, X,
  ChevronLeft, ChevronRight, AlertCircle, Receipt,
  Wallet, CheckCircle, Users, Calendar, Banknote,
  Building2,
} from 'lucide-react';
import { salesPaymentService, InvoiceForPayment, Customer, BankAccount } from '@/api/salespayment/route';
import { useLocationOptional } from '@/lib/location-context';
import { SalesNumberInput } from '@/components/sales/sales-number-input';

interface SelectedInvoice extends InvoiceForPayment {
  customerName?: string;
  customerId?: string;
}

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

export default function CreatePaymentPage() {
  const router = useRouter();
  const { selectedLocationId } = useLocationOptional();

  const [browseTab, setBrowseTab] = useState<'customer' | 'list'>('list');

  // List mode
  const [listInvoices, setListInvoices] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [listHasNext, setListHasNext] = useState(false);
  const [listHasPrev, setListHasPrev] = useState(false);

  // Customer search mode
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<InvoiceForPayment[]>([]);
  const [isLoadingCustInvoices, setIsLoadingCustInvoices] = useState(false);

  // Selection
  const [selected, setSelected] = useState<SelectedInvoice[]>([]);

  // Payment form
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const paymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'];

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch unpaid invoices list
  const fetchListInvoices = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({ page: listPage.toString(), limit: '10' });
      if (listSearch.trim()) params.append('search', listSearch.trim());
      if (selectedLocationId) params.append('locationId', selectedLocationId);

      const response = await fetch(`/api/sales-invoices?${params.toString()}`, { headers });
      const result = await response.json();

      if (result.success) {
        const rows = (result.data || []).filter((inv: any) =>
          inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partial' || inv.paymentStatus === 'Overdue'
        ).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          grandTotal: inv.grandTotal,
          paidAmount: inv.paidAmount || 0,
          outstanding: inv.outstanding ?? (inv.grandTotal - (inv.paidAmount || 0)),
          invoiceStatus: inv.invoiceStatus,
          paymentStatus: inv.paymentStatus,
          customerName: inv.customerName,
          customerId: inv.customerId,
          isSelected: false,
          amountToPay: 0,
        }));
        setListInvoices(rows);
        const pag = result.pagination;
        if (pag) {
          setListTotalPages(pag.pages || 1);
          setListTotal(pag.total || 0);
          setListHasNext(Boolean(pag.hasNext));
          setListHasPrev(Boolean(pag.hasPrev));
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [listPage, listSearch, selectedLocationId]);

  useEffect(() => {
    if (browseTab === 'list') fetchListInvoices();
  }, [browseTab, fetchListInvoices]);

  const handleCustomerQueryChange = (val: string) => {
    setCustomerQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (val.trim().length < 2) { setCustomerResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingCustomers(true);
      try {
        const results = await salesPaymentService.searchCustomers(val);
        setCustomerResults(results);
      } finally {
        setIsSearchingCustomers(false);
      }
    }, 300);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name || '');
    setCustomerResults([]);
    setIsLoadingCustInvoices(true);
    try {
      const invoices = await salesPaymentService.getCustomerInvoices(
        customer.id || customer._id || '',
        selectedLocationId || undefined
      );
      setCustomerInvoices(invoices);
    } catch (err) {
      setCustomerInvoices([]);
    } finally {
      setIsLoadingCustInvoices(false);
    }
  };

  useEffect(() => {
    salesPaymentService.getBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  const toggleInvoice = (inv: any) => {
    const exists = selected.find((s) => s.id === inv.id);
    if (exists) {
      const updated = selected.filter((s) => s.id !== inv.id);
      setSelected(updated);
      setPaymentAmount(updated.reduce((sum, s) => sum + s.amountToPay, 0).toFixed(2));
      setFormError('');
      return;
    }
    if (selected.length > 0) {
      const firstCustId = selected[0].customerId || '';
      const firstCustName = (selected[0].customerName || '').toLowerCase();
      const thisCustId = inv.customerId || '';
      const thisCustName = (inv.customerName || '').toLowerCase();
      const idMismatch = firstCustId && thisCustId && firstCustId !== thisCustId;
      const nameMismatch = !firstCustId && !thisCustId && firstCustName && thisCustName && firstCustName !== thisCustName;
      if (idMismatch || nameMismatch) {
        setFormError(`⚠️ All selected invoices must be from the same customer. "${inv.invoiceNumber}" belongs to a different customer.`);
        return;
      }
    }
    setFormError('');
    const updated = [...selected, { ...inv, amountToPay: inv.outstanding }];
    setSelected(updated);
    setPaymentAmount(updated.reduce((sum, s) => sum + s.amountToPay, 0).toFixed(2));
  };

  const updateAmount = (id: string, val: number) => {
    const updated = selected.map((s) =>
      s.id === id ? { ...s, amountToPay: Math.max(0, Math.min(val, s.outstanding)) } : s
    );
    setSelected(updated);
    setPaymentAmount(updated.reduce((sum, s) => sum + s.amountToPay, 0).toFixed(2));
  };

  const handleSubmit = async () => {
    setFormError('');
    if (selected.length === 0) { setFormError('⚠️ Please select at least one invoice.'); return; }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) { setFormError('⚠️ Please enter a valid payment amount.'); return; }
    if ((paymentMethod === 'Bank Transfer' || paymentMethod === 'Cheque') && !selectedBank) {
      setFormError('⚠️ Please select a bank account for this payment method.');
      return;
    }
    if (!paymentDate) { setFormError('⚠️ Please select a payment date.'); return; }

    const custId = selected[0].customerId || '';
    const custName = selected[0].customerName || selectedCustomer?.name || '';

    setIsSubmitting(true);
    try {
      await salesPaymentService.receivePayment({
        customerId: custId,
        customerName: custName,
        amount,
        paymentMethod,
        ...(paymentMethod !== 'Cash' && selectedBank?.id
          ? { bankAccountId: selectedBank.id, bankAccountName: selectedBank.accountName || '' }
          : {}),
        reference,
        notes,
        paymentDate,
        invoicePayments: selected.map((s) => ({
          invoiceId: s.id,
          invoiceNumber: s.invoiceNumber,
          amountPaid: s.amountToPay,
        })),
      });
      router.push('/sales/sales-payment');
    } catch (err: any) {
      setFormError(err.message || 'Failed to receive payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSelected = selected.reduce((sum, s) => sum + s.amountToPay, 0);
  const customerName = selected.length > 0
    ? (selected[0].customerName || selectedCustomer?.name || '')
    : '';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/sales/sales-payment')}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#014582] transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Payments
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-[#014582]" /> Receive Sales Payment
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Select unpaid invoices from the list or search by customer to receive payment.
          </p>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Invoice Selection */}
        <section className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            {/* Tab switcher */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => { setBrowseTab('list'); setFormError(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  browseTab === 'list' ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Receipt className="w-4 h-4" /> All Unpaid Invoices
              </button>
              <button
                type="button"
                onClick={() => { setBrowseTab('customer'); setFormError(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  browseTab === 'customer' ? 'bg-white text-[#014582] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" /> Search by Customer
              </button>
            </div>

            {/* LIST TAB */}
            {browseTab === 'list' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search invoices by number or customer..."
                    value={listSearch}
                    onChange={(e) => { setListSearch(e.target.value); setListPage(1); }}
                    className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
                  />
                  {listSearch && (
                    <button type="button" onClick={() => { setListSearch(''); setListPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isLoadingList ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
                    <span className="ml-3 text-sm text-gray-500">Loading invoices...</span>
                  </div>
                ) : listInvoices.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center space-y-2">
                    <Receipt className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-gray-700">No unpaid invoices found</p>
                    <p className="text-xs text-gray-400">{listSearch ? `No invoices match "${listSearch}"` : 'All invoices are paid.'}</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-center w-12">Select</th>
                          <th className="px-4 py-3">Invoice #</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Due Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {listInvoices.map((inv: any) => {
                          const isSelected = selected.some((s) => s.id === inv.id);
                          const isOverdue = new Date(inv.dueDate) < new Date();
                          const isDifferentCust =
                            selected.length > 0 &&
                            (selected[0].customerId || selected[0].customerName || '').toLowerCase() !==
                              (inv.customerId || inv.customerName || '').toLowerCase();

                          return (
                            <tr
                              key={inv.id}
                              onClick={() => toggleInvoice(inv)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-sky-50/80 font-medium' : isDifferentCust ? 'opacity-60 hover:bg-amber-50/30' : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleInvoice(inv)} className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]" />
                              </td>
                              <td className="px-4 py-3 font-semibold text-[#014582]">{inv.invoiceNumber}</td>
                              <td className="px-4 py-3 text-gray-900">
                                {inv.customerName || '—'}
                                {isDifferentCust && <span className="text-[10px] text-amber-700 font-semibold block">Different customer</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {fmtDate(inv.dueDate)}
                                {isOverdue && <span className="ml-1 text-[10px] text-red-600 font-bold">OVERDUE</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  inv.paymentStatus === 'Unpaid' ? 'bg-red-100 text-red-700'
                                  : inv.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}>{inv.paymentStatus}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.outstanding)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {listTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-500">{listInvoices.length} of {listTotal} invoices</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setListPage((p) => Math.max(1, p - 1))} disabled={!listHasPrev || isLoadingList} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                      <span className="text-xs font-semibold text-gray-700 px-2">Page {listPage} of {listTotalPages}</span>
                      <button type="button" onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))} disabled={!listHasNext || isLoadingList} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CUSTOMER SEARCH TAB */}
            {browseTab === 'customer' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name, email, phone..."
                      value={customerQuery}
                      onChange={(e) => handleCustomerQueryChange(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    />
                  </div>
                  {isSearchingCustomers && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
                      <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
                    </div>
                  )}
                  {customerResults.length > 0 && !isSearchingCustomers && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button key={c.id || c._id} onClick={() => handleSelectCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors">
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email} {c.phone && `• ${c.phone}`}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-500">{selectedCustomer.email} {selectedCustomer.phone && `• ${selectedCustomer.phone}`}</p>
                    </div>
                    <button onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); setCustomerInvoices([]); }} className="p-1 hover:bg-gray-200 rounded-lg transition-all">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}

                {selectedCustomer && (
                  isLoadingCustInvoices ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
                      <span className="ml-3 text-sm text-gray-500">Loading invoices...</span>
                    </div>
                  ) : customerInvoices.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
                      <Receipt className="w-8 h-8 text-gray-400 mx-auto opacity-50 mb-2" />
                      <p className="text-sm font-semibold text-gray-700">No unpaid invoices for this customer</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-center w-12">Select</th>
                            <th className="px-4 py-3">Invoice #</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerInvoices.map((inv: any) => {
                            const isSelected = selected.some((s) => s.id === inv.id);
                            const isOverdue = new Date(inv.dueDate) < new Date();
                            return (
                              <tr key={inv.id} onClick={() => toggleInvoice({ ...inv, customerName: selectedCustomer?.name, customerId: selectedCustomer?.id || selectedCustomer?._id })} className={`cursor-pointer transition-colors ${isSelected ? 'bg-sky-50/80' : 'hover:bg-gray-50'}`}>
                                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input type="checkbox" checked={isSelected} onChange={() => toggleInvoice({ ...inv, customerName: selectedCustomer?.name, customerId: selectedCustomer?.id || selectedCustomer?._id })} className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]" />
                                </td>
                                <td className="px-4 py-3 font-semibold text-[#014582]">{inv.invoiceNumber}</td>
                                <td className="px-4 py-3 text-gray-600">
                                  {fmtDate(inv.dueDate)}
                                  {isOverdue && <span className="ml-1 text-[10px] text-red-600 font-bold">OVERDUE</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.paymentStatus === 'Unpaid' ? 'bg-red-100 text-red-700' : inv.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{inv.paymentStatus}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">{fmt(inv.grandTotal)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.outstanding)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Selected Invoices Summary */}
          {selected.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#014582]" />
                  <h3 className="font-bold text-gray-900">
                    Selected Invoices ({selected.length})
                    {customerName && <span className="text-gray-500 font-normal text-sm"> — {customerName}</span>}
                  </h3>
                </div>
                <button type="button" onClick={() => { setSelected([]); setPaymentAmount(''); setFormError(''); }} className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Clear All
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3 text-right">Outstanding</th>
                      <th className="px-4 py-3 text-right min-w-[180px]">Amount to Pay</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 font-semibold text-[#014582]">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(inv.outstanding)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <SalesNumberInput
                              step={0.01}
                              min={0}
                              max={inv.outstanding}
                              value={inv.amountToPay}
                              onChange={(val) => updateAmount(inv.id, val)}
                              className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none text-right"
                            />
                            <button type="button" onClick={() => updateAmount(inv.id, inv.outstanding)} className="text-xs text-[#014582] font-semibold hover:underline whitespace-nowrap">
                              Full
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" onClick={() => toggleInvoice(inv)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>

        {/* RIGHT: Payment Details */}
        <div className="space-y-4">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#014582]" /> Payment Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date <span className="text-red-500">*</span></label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method <span className="text-red-500">*</span></label>
              <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); if (e.target.value === 'Cash') setSelectedBank(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none bg-gray-50">
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {paymentMethod !== 'Cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account <span className="text-red-500">*</span></label>
                <select value={selectedBank?.id || ''} onChange={(e) => setSelectedBank(bankAccounts.find((a) => a.id === e.target.value) || null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none bg-gray-50">
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.accountName} — {a.bankName}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">Rs.</span>
                <input type="number" step="0.01" min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
              <input type="text" placeholder="Cheque number, transaction ID..." value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea rows={2} placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none resize-none" />
            </div>
          </section>

          {selected.length > 0 && (
            <section className="bg-[#014582]/5 border border-[#014582]/20 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm border-b border-[#014582]/10 pb-2">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                {customerName && (
                  <div className="flex justify-between text-gray-700">
                    <span>Customer</span>
                    <span className="font-semibold text-gray-900">{customerName}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Invoices Selected</span>
                  <span className="font-semibold text-gray-900">{selected.length}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Payment Method</span>
                  <span className="font-semibold text-gray-900">{paymentMethod}</span>
                </div>
                <div className="border-t border-[#014582]/10 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total Payment</span>
                  <span className="font-bold text-[#014582] text-base">{fmt(totalSelected)}</span>
                </div>
              </div>
            </section>
          )}

          <div className="space-y-3">
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || selected.length === 0} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><CreditCard className="w-4 h-4" /> Receive Payment</>}
            </button>
            <button type="button" onClick={() => router.push('/sales/sales-payment')} className="w-full px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
