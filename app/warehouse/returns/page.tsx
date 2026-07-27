'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Edit, Trash2, Eye, Package,
  ChevronDown, X, Save, User, Mail, Phone, MapPin,
  DollarSign, Tag, Truck, Calendar, Loader2,
  CheckCircle, XCircle, Clock, Filter, Download,
  Printer, RefreshCw, Layers, ShoppingCart,
  CreditCard, Receipt, Building2, Hash, Type,
  AlignLeft, Box, Minus, Plus as PlusIcon,
  AlertCircle, Globe, CalendarDays, UserRound,
  FileText, ListChecks, TruckIcon, PackageOpen,
  Shield, BadgePercent, Clock3, UserCheck,
  ClipboardList, Building, Briefcase, PackageCheck,
  Settings, ChevronLeft, ChevronRight, Undo2,
  RotateCcw, Ban, FileCheck, MessageSquare,
  Star, StarHalf, ThumbsUp, ThumbsDown,
  HelpCircle, Info, ExternalLink, Upload,
  Image, Paperclip, Send, DownloadCloud
} from 'lucide-react';

import { returnService, Return, ReturnItem } from '../../api/returns/route';
import { orderService } from '../../api/order/route';

function ReturnList({ 
  returns, 
  loading, 
  onView, 
  onApprove, 
  onReject,
  onAdd,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onRefresh,
  stats
}: {
  returns: Return[];
  loading: boolean;
  onView: (returnData: Return) => void;
  onApprove: (returnData: Return) => void;
  onReject: (returnData: Return) => void;
  onAdd: () => void;
  pagination: { page: number; limit: number; total: number; pages: number; hasNext: boolean; hasPrev: boolean };
  onPageChange: (page: number) => void;
  filters: {
    search: string;
    status: string;
    type: string;
    fromDate: string;
    toDate: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
  stats: {
    total: number;
    totalRefund: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
  };
}) {
  const statusOptions = ['all', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'];
  const typeOptions = ['all', 'Return', 'Exchange', 'Warranty'];

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Completed: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  const typeColors: Record<string, string> = {
    Return: 'bg-purple-100 text-purple-700',
    Exchange: 'bg-indigo-100 text-indigo-700',
    Warranty: 'bg-orange-100 text-orange-700',
  };

  const StatusBadge = ({ status, colors }: { status: string; colors: Record<string, string> }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#7c4dff]" />
            Returns
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({pagination.total} returns)
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage product returns, exchanges, and warranty claims</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-4 h-4" />
            New Return
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Returns</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
          <p className="text-xs text-gray-400">Awaiting review</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved || 0}</p>
          <p className="text-xs text-gray-400">Ready for processing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
          <p className="text-xs text-gray-400">Not eligible</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Refund Amount</p>
          <p className="text-2xl font-bold text-[#7c4dff]">Rs. {(stats.totalRefund || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search returns by order #, customer..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-[#7c4dff] animate-spin" />
            <p className="mt-2 text-gray-500">Loading returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No returns found</p>
            <p className="text-sm text-gray-400">Click "New Return" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Return #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnData) => (
                  <tr key={returnData._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-[#7c4dff]">
                      {returnData.returnNumber}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {returnData.orderNumber}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{returnData.customerName}</p>
                      <p className="text-xs text-gray-400">{returnData.customerEmail || ''}</p>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={returnData.returnType} colors={typeColors} />
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {returnData.items.reduce((sum, item) => sum + item.returnQuantity, 0)} items
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-700">
                      Rs. {returnData.totalRefund.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={returnData.returnStatus} colors={statusColors} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(returnData.returnDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(returnData)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {returnData.returnStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => onApprove(returnData)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onReject(returnData)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {returns.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="px-3 py-1 bg-[#7c4dff] text-white rounded-lg">
              {pagination.page}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATE RETURN MODAL
// ─────────────────────────────────────────────────────────────
function CreateReturnModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // ─── Return Information ──────────────────────────────────
  const [returnData, setReturnData] = useState({
    orderId: '',
    orderNumber: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    returnType: 'Return',
    reason: '',
    returnMethod: 'Original Payment',
    notes: '',
    restockingFee: 0,
    shippingCost: 0,
  });

  // ─── Return Items ────────────────────────────────────────
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);

  // ─── Handle Search Order ─────────────────────────────────
  const [searchOrder, setSearchOrder] = useState('');
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [orderSearchResults, setOrderSearchResults] = useState<any[]>([]);

  const handleSearchOrder = async (value: string) => {
    setSearchOrder(value);
    if (value.length < 2) {
      setOrderSearchResults([]);
      return;
    }
    
    setOrderSearchLoading(true);
    try {
      // Search orders API call
      const response = await orderService.getOrders({
        search: value,
        limit: 10,
        page: 1
      });
      setOrderSearchResults(response.data || []);
    } catch (error) {
      console.error('Search order error:', error);
      setOrderSearchResults([]);
    } finally {
      setOrderSearchLoading(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    setReturnData({
      ...returnData,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId || '',
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
    });
    setSelectedOrderItems(order.items || []);
    setSearchOrder('');
    setOrderSearchResults([]);
  };

  // ─── Handle Return Item Selection ────────────────────────
  const toggleReturnItem = (item: any) => {
    const existing = returnItems.find(i => i.productId === item.productId);
    if (existing) {
      setReturnItems(returnItems.filter(i => i.productId !== item.productId));
    } else {
      setReturnItems([...returnItems, {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        returnQuantity: 1,
        condition: 'New',
        refundAmount: item.unitPrice,
        reason: ''
      }]);
    }
  };

  const updateReturnQuantity = (productId: string, quantity: number) => {
    setReturnItems(returnItems.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            returnQuantity: Math.min(quantity, item.quantity), 
            refundAmount: item.unitPrice * Math.min(quantity, item.quantity) 
          }
        : item
    ));
  };

  const updateReturnCondition = (productId: string, condition: string) => {
    setReturnItems(returnItems.map(item => 
      item.productId === productId ? { ...item, condition } : item
    ));
  };

  // ─── Calculations ─────────────────────────────────────────
  const subtotal = returnItems.reduce((sum, item) => sum + (item.unitPrice * item.returnQuantity), 0);
  const totalRefund = subtotal - returnData.restockingFee - returnData.shippingCost;

  // ─── Handle Submit ────────────────────────────────────────
  const handleSubmit = async () => {
    if (returnItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    if (!returnData.reason) {
      setError('Please provide a return reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        orderId: returnData.orderId,
        orderNumber: returnData.orderNumber,
        customerId: returnData.customerId,
        customerName: returnData.customerName,
        customerEmail: returnData.customerEmail,
        customerPhone: returnData.customerPhone,
        items: returnItems,
        returnType: returnData.returnType,
        reason: returnData.reason,
        notes: returnData.notes,
        returnMethod: returnData.returnMethod,
        restockingFee: returnData.restockingFee,
        shippingCost: returnData.shippingCost,
        subtotal,
        refundAmount: subtotal,
        totalRefund: Math.max(0, totalRefund),
      };

      await returnService.createReturn(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create return');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">New Return Request</h2>
              <p className="text-xs text-gray-400">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Step 1: Find Order */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#7c4dff]" />
                Find Order
              </h3>
              <p className="text-xs text-gray-400">Search for the order to process return</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number or customer name..."
                  value={searchOrder}
                  onChange={(e) => handleSearchOrder(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
                {orderSearchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {orderSearchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {orderSearchResults.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => handleSelectOrder(order)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm font-semibold text-[#7c4dff]">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">Rs. {order.grandTotal}</p>
                          <p className="text-xs text-gray-400">{order.items?.length || 0} items</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {returnData.orderNumber && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Order Selected</p>
                      <p className="font-mono text-sm text-[#7c4dff]">{returnData.orderNumber}</p>
                      <p className="text-sm text-gray-600">{returnData.customerName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setReturnData({ 
                          ...returnData, 
                          orderId: '',
                          orderNumber: '', 
                          customerId: '',
                          customerName: '' 
                        });
                        setSelectedOrderItems([]);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!returnData.orderNumber}
                  className="px-6 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Items */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#7c4dff]" />
                Select Items to Return
              </h3>
              <p className="text-xs text-gray-400">Choose items from the order and specify return details</p>

              {selectedOrderItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No items found in this order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedOrderItems.map((item, index) => {
                    const isSelected = returnItems.some(i => i.productId === item.productId);
                    const selectedItem = returnItems.find(i => i.productId === item.productId);
                    
                    return (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-[#7c4dff] transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleReturnItem(item)}
                                className="w-4 h-4 text-[#7c4dff] rounded border-gray-300"
                              />
                              <div>
                                <p className="font-medium text-gray-800">{item.productName}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span>SKU: {item.sku}</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                  <span>•</span>
                                  <span>Price: Rs. {item.unitPrice}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">Rs. {item.unitPrice * item.quantity}</p>
                          </div>
                        </div>

                        {isSelected && selectedItem && (
                          <div className="mt-3 pl-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Return Quantity</label>
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={selectedItem.returnQuantity}
                                onChange={(e) => updateReturnQuantity(item.productId, parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Condition</label>
                              <select
                                value={selectedItem.condition}
                                onChange={(e) => updateReturnCondition(item.productId, e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                              >
                                <option value="New">New</option>
                                <option value="Used">Used</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Open Box">Open Box</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Refund Amount</label>
                              <p className="text-sm font-semibold text-[#7c4dff]">
                                Rs. {selectedItem.refundAmount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={returnItems.length === 0}
                  className="px-6 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Return Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7c4dff]" />
                Return Details
              </h3>
              <p className="text-xs text-gray-400">Provide additional return information</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Return Type *
                  </label>
                  <select
                    value={returnData.returnType}
                    onChange={(e) => setReturnData({ ...returnData, returnType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  >
                    <option value="Return">Return</option>
                    <option value="Exchange">Exchange</option>
                    <option value="Warranty">Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Return Method *
                  </label>
                  <select
                    value={returnData.returnMethod}
                    onChange={(e) => setReturnData({ ...returnData, returnMethod: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  >
                    <option value="Original Payment">Original Payment</option>
                    <option value="Store Credit">Store Credit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Return Reason *
                </label>
                <textarea
                  placeholder="Please describe the reason for return..."
                  value={returnData.reason}
                  onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Restocking Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={returnData.restockingFee}
                    onChange={(e) => setReturnData({ ...returnData, restockingFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Shipping Cost (Rs.)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={returnData.shippingCost}
                    onChange={(e) => setReturnData({ ...returnData, shippingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Any additional information..."
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Return Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Restocking Fee</span>
                    <span className="font-medium text-red-600">- Rs. {returnData.restockingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Cost</span>
                    <span className="font-medium text-red-600">- Rs. {returnData.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg">
                    <span>Total Refund</span>
                    <span className="text-[#7c4dff]">Rs. {Math.max(0, totalRefund).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Items: {returnItems.reduce((sum, i) => sum + i.returnQuantity, 0)}</span>
                    <span>Type: {returnData.returnType}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !returnData.reason}
                    className="px-6 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Return
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReturnDetailModal({ returnData, onClose, onApprove, onReject }: { 
  returnData: Return; 
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Completed: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  const StatusBadge = ({ status, colors }: { status: string; colors: Record<string, string> }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );

  const handleApprove = async () => {
    if (onApprove && returnData._id) {
      await onApprove(returnData._id);
    }
  };

  const handleReject = async () => {
    if (onReject && returnData._id && rejectionReason) {
      await onReject(returnData._id, rejectionReason);
      setShowRejectModal(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{returnData.returnNumber}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <StatusBadge status={returnData.returnStatus} colors={statusColors} />
                <span className="text-xs text-gray-400">• {new Date(returnData.returnDate).toLocaleDateString()}</span>
                <span className="text-xs text-gray-400">• {returnData.returnType}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="font-semibold text-gray-800">{returnData.customerName}</p>
              <p className="text-sm text-gray-600">{returnData.customerEmail || 'N/A'}</p>
              <p className="text-sm text-gray-600">{returnData.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Order</p>
              <p className="font-mono text-sm text-[#7c4dff]">{returnData.orderNumber}</p>
              <p className="text-sm text-gray-600">Return Type: {returnData.returnType}</p>
              <p className="text-sm text-gray-600">Method: {returnData.returnMethod}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Return Reason</p>
              <p className="text-sm text-gray-700">{returnData.reason}</p>
              {returnData.notes && (
                <p className="text-sm text-gray-500 mt-1">{returnData.notes}</p>
              )}
            </div>
          </div>

          {/* Return Items */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#7c4dff]" />
              Return Items ({returnData.items.length})
            </h3>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Product</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">SKU</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500">Return Qty</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Condition</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {returnData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2 text-center">{item.returnQuantity}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{item.condition}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">Rs. {item.refundAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-right font-semibold">Total Refund</td>
                    <td className="px-4 py-2 text-right font-bold text-[#7c4dff]">
                      Rs. {returnData.totalRefund.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Refund Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Refund Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>Rs. {returnData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Restocking Fee</span>
                  <span className="text-red-600">- Rs. {returnData.restockingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Cost</span>
                  <span className="text-red-600">- Rs. {returnData.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                  <span>Total Refund</span>
                  <span className="text-[#7c4dff]">Rs. {returnData.totalRefund.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Return Requested</p>
                    <p className="text-xs text-gray-400">{new Date(returnData.returnDate).toLocaleString()}</p>
                  </div>
                </div>
                {returnData.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Approved</p>
                      <p className="text-xs text-gray-400">{new Date(returnData.approvedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {returnData.receivedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Items Received</p>
                      <p className="text-xs text-gray-400">{new Date(returnData.receivedDate).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {returnData.returnStatus === 'Completed' && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Refund Completed</p>
                      <p className="text-xs text-gray-400">{new Date(returnData.updatedAt || '').toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tracking */}
          {returnData.trackingNumber && (
            <div className="p-4 border border-gray-200 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Tracking Information
              </h4>
              <p className="text-sm text-gray-700">Carrier: {returnData.shippingCarrier || 'N/A'}</p>
              <p className="text-sm text-gray-700">Tracking: {returnData.trackingNumber}</p>
              {returnData.returnLabel && (
                <a href="#" className="text-sm text-[#7c4dff] hover:underline flex items-center gap-1">
                  <Download className="w-4 h-4" /> Download Return Label
                </a>
              )}
            </div>
          )}

          {/* Rejection Reason */}
          {returnData.returnStatus === 'Rejected' && returnData.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Rejection Reason</h4>
              <p className="text-sm text-gray-700">{returnData.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          {returnData.returnStatus === 'Pending' && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve Return
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject Return
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Reject Return</h3>
              <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this return.</p>
              <textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false
  });

  const [stats, setStats] = useState({
    total: 0,
    totalRefund: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    fromDate: '',
    toDate: ''
  });

  // ─── Fetch Returns ─────────────────────────────────────────
  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await returnService.getReturns({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      setReturns(response.data);
      setStats(response.stats);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        pages: response.pagination.pages,
        hasNext: response.pagination.hasNext,
        hasPrev: response.pagination.hasPrev
      });
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const handleView = (returnData: Return) => {
    setSelectedReturn(returnData);
    setShowDetailModal(true);
  };

  const handleApprove = async (id: string) => {
    try {
      await returnService.approveReturn(id);
      await fetchReturns();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Failed to approve return:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await returnService.rejectReturn(id, reason);
      await fetchReturns();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Failed to reject return:', error);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchReturns();
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchReturns();
  };

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sales/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Returns</h1>
      </div>

      <ReturnList
        returns={returns}
        loading={loading}
        onView={handleView}
        onApprove={() => {}}
        onReject={() => {}}
        onAdd={() => setShowCreateModal(true)}
        pagination={pagination}
        onPageChange={handlePageChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        stats={stats}
      />

      {showCreateModal && (
        <CreateReturnModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showDetailModal && selectedReturn && (
        <ReturnDetailModal
          returnData={selectedReturn}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReturn(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}