'use client';

import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  ClipboardList,
  Truck,
  CheckCircle2,
  X,
} from 'lucide-react';

export function MetaChip({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-700">
      <Icon className="w-3 h-3 text-gray-500" />
      {label}
    </span>
  );
}

type SupplierLike = {
  id?: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  paymentTerms?: string;
  gstNumber?: string;
  taxId?: string;
  status?: string;
};

export function SupplierDetailCard({
  supplier,
  selected,
  onClick,
  onClear,
}: {
  supplier: SupplierLike;
  selected?: boolean;
  onClick?: () => void;
  onClear?: () => void;
}) {
  const location = [supplier.city, supplier.country].filter(Boolean).join(', ');
  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-[#014582]/8 border-[#014582]/40'
          : onClick
            ? 'border-gray-200 hover:bg-gray-50 hover:border-[#014582]/30 cursor-pointer'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#014582] text-sm">{supplier.name}</p>
              {supplier.companyName && supplier.companyName !== supplier.name && (
                <p className="text-xs text-gray-500">{supplier.companyName}</p>
              )}
            </div>
            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {supplier.contactPerson && <MetaChip icon={Building2} label={supplier.contactPerson} />}
            {supplier.phone && <MetaChip icon={Phone} label={supplier.phone} />}
            {supplier.email && <MetaChip icon={Mail} label={supplier.email} />}
            {(supplier.address || location) && (
              <MetaChip icon={MapPin} label={supplier.address || location} />
            )}
            {supplier.paymentTerms && <MetaChip icon={ClipboardList} label={supplier.paymentTerms} />}
            {(supplier.gstNumber || supplier.taxId) && (
              <MetaChip icon={CheckCircle2} label={supplier.gstNumber || supplier.taxId || ''} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ProductLike = {
  id?: string;
  name?: string;
  sku?: string;
  costPrice?: number;
  sellingPrice?: number;
  taxRate?: number;
  category?: string | { name?: string };
  stockUnitName?: string;
  barcode?: string;
  currentStock?: number;
};

export function ProductDetailCard({
  product,
  onClick,
  formatCurrency,
}: {
  product: ProductLike;
  onClick?: () => void;
  formatCurrency: (n: number) => string;
}) {
  const category =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 border-b last:border-0 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {product.sku && <MetaChip icon={ClipboardList} label={`SKU ${product.sku}`} />}
            {category && <MetaChip icon={Package} label={category} />}
            <MetaChip icon={CheckCircle2} label={`Cost ${formatCurrency(product.costPrice || 0)}`} />
            {typeof product.taxRate === 'number' && (
              <MetaChip icon={Calendar} label={`Tax ${product.taxRate}%`} />
            )}
            {product.stockUnitName && <MetaChip icon={Truck} label={product.stockUnitName} />}
            {typeof product.currentStock === 'number' && (
              <MetaChip icon={Package} label={`Stock ${product.currentStock}`} />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

type PurchaseOrderLike = {
  id: string;
  orderNumber: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  status?: string;
  grandTotal?: number;
  subtotal?: number;
  totalTax?: number;
  totalDiscount?: number;
  totalRemainingItems?: number;
  totalRemainingQty?: number;
  notes?: string;
  termsConditions?: string;
  purchaseRequisitionNumber?: string;
  remainingItems?: Array<{
    productName?: string;
    sku?: string;
    quantity?: number;
    remainingQuantity?: number;
    unitPrice?: number;
    taxRate?: number;
  }>;
  items?: any[];
};

export function PurchaseOrderDetailCard({
  order,
  selected,
  onClick,
  onClear,
  formatCurrency,
  formatDate,
}: {
  order: PurchaseOrderLike;
  selected?: boolean;
  onClick?: () => void;
  onClear?: () => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
}) {
  const remaining =
    order.totalRemainingItems ??
    order.remainingItems?.length ??
    order.items?.length ??
    0;
  const remainingQty =
    order.totalRemainingQty ??
    order.remainingItems?.reduce((s, i) => s + (i.remainingQuantity || 0), 0) ??
    0;
  const preview = (order.remainingItems || order.items || [])
    .slice(0, 3)
    .map((i: any) => i.productName)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-[#014582]/8 border-[#014582]/40'
          : onClick
            ? 'border-gray-200 hover:bg-gray-50 hover:border-[#014582]/30 cursor-pointer'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#014582] text-sm">{order.orderNumber}</p>
              <p className="text-xs text-gray-600 mt-0.5">{order.supplierName}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.status && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {order.status}
                </span>
              )}
              {selected && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#014582] text-white">
                  Selected
                </span>
              )}
              {onClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="p-1 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {order.orderDate && (
              <MetaChip icon={Calendar} label={`Ordered ${formatDate(order.orderDate)}`} />
            )}
            {order.expectedDeliveryDate && (
              <MetaChip icon={Truck} label={`ETA ${formatDate(order.expectedDeliveryDate)}`} />
            )}
            {typeof order.grandTotal === 'number' && (
              <MetaChip icon={CheckCircle2} label={formatCurrency(order.grandTotal)} />
            )}
            <MetaChip icon={Package} label={`${remaining} lines · ${remainingQty} qty left`} />
            {order.purchaseRequisitionNumber && (
              <MetaChip icon={ClipboardList} label={`PR ${order.purchaseRequisitionNumber}`} />
            )}
            {order.supplierPhone && <MetaChip icon={Phone} label={order.supplierPhone} />}
            {order.supplierEmail && <MetaChip icon={Mail} label={order.supplierEmail} />}
            {order.supplierAddress && <MetaChip icon={MapPin} label={order.supplierAddress} />}
          </div>

          {preview && (
            <p className="text-[11px] text-gray-500 mt-2 truncate">Items: {preview}</p>
          )}
        </div>
      </div>
    </div>
  );
}
