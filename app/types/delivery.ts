// Delivery Types

export interface DeliveryItem {
  id: string;
  deliveryId: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  notes?: string;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  deliveryDate: string;
  deliveryStatus: 'Pending' | 'Partially Delivered' | 'Delivered';
  deliveryPerson?: string;
  trackingNumber?: string;
  notes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: DeliveryItem[];
  totalOrderedQty?: number;
  totalDeliveredQty?: number;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  paidAmount?: number;
  outstandingAmount?: number;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  partiallyDelivered: number;
  delivered: number;
}

export interface OrderForDelivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderDate: string;
  orderStatus: string;
  items?: OrderItemForDelivery[];
  remainingItems?: OrderItemForDelivery[];
  hasRemainingItems?: boolean;
}

export interface OrderItemForDelivery {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unit: string;
}

export interface DeliveryLineDraft {
  productId: string;
  productName: string;
  sku: string;
  orderQuantity: number;
  remainingQuantity: number;
  unit: string;
  selected: boolean;
  deliveryQuantity: number;
}
