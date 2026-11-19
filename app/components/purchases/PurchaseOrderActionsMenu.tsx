'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical,
  Eye,
  Download,
  Send,
  CheckCircle,
  Ban,
  Trash2,
  Package,
  FileText,
  Edit3,
} from 'lucide-react';
import type { PurchaseOrderModel } from '../../api/purchaseorder/route';

export type PurchaseOrderAction =
  | 'view'
  | 'edit'
  | 'downloadPdf'
  | 'send'
  | 'approve'
  | 'cancel'
  | 'delete'
  | 'createGrn'
  | 'createInvoice';

interface PurchaseOrderActionsMenuProps {
  order: PurchaseOrderModel;
  onAction: (action: PurchaseOrderAction, order: PurchaseOrderModel) => void;
  align?: 'left' | 'right';
}

function canCreateGrn(order: PurchaseOrderModel) {
  if (order.status === 'Cancelled' || order.status === 'Draft') return false;
  const remaining = order.totalRemainingQty;
  if (remaining != null) return remaining > 0;
  return order.receivingStatus !== 'Fully Received';
}

function canCreateInvoice(order: PurchaseOrderModel) {
  return order.status === 'Approved' || order.status === 'Sent';
}

export default function PurchaseOrderActionsMenu({
  order,
  onAction,
  align = 'right',
}: PurchaseOrderActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 192;
      const gap = 4;
      let left = align === 'right' ? rect.right - menuWidth : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
      const estimatedHeight = menuRef.current?.offsetHeight || 280;
      const openUp = rect.bottom + gap + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
      const top = openUp ? rect.top - estimatedHeight - gap : rect.bottom + gap;
      setMenuPos({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    // Defer so the opening click doesn't immediately close the menu
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocPointer);
      document.addEventListener('touchstart', onDocPointer);
    }, 0);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('touchstart', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 192;
      let left = align === 'right' ? rect.right - menuWidth : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
      setMenuPos({ top: rect.bottom + 4, left });
    }
    setOpen(true);
  };

  const run = (action: PurchaseOrderAction) => {
    setOpen(false);
    onAction(action, order);
  };

  const items: Array<{
    key: PurchaseOrderAction;
    label: string;
    icon: ReactNode;
    show: boolean;
    danger?: boolean;
  }> = [
    {
      key: 'view',
      label: 'View details',
      icon: <Eye className="w-3.5 h-3.5" />,
      show: true,
    },
    {
      key: 'edit',
      label: 'Edit order',
      icon: <Edit3 className="w-3.5 h-3.5" />,
      show: Boolean(order.canEdit && ['Draft', 'Sent'].includes(order.status)),
    },
    {
      key: 'createGrn',
      label: 'Create GRN',
      icon: <Package className="w-3.5 h-3.5" />,
      show: canCreateGrn(order),
    },
    {
      key: 'createInvoice',
      label: 'Create invoice',
      icon: <FileText className="w-3.5 h-3.5" />,
      show: canCreateInvoice(order),
    },
    {
      key: 'downloadPdf',
      label: 'Download PDF',
      icon: <Download className="w-3.5 h-3.5" />,
      show: true,
    },
    {
      key: 'send',
      label: 'Send email',
      icon: <Send className="w-3.5 h-3.5" />,
      show: Boolean(order.canSend),
    },
    {
      key: 'approve',
      label: 'Approve',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      show: Boolean(order.canApprove),
    },
    {
      key: 'cancel',
      label: 'Cancel',
      icon: <Ban className="w-3.5 h-3.5" />,
      show: Boolean(order.canCancel),
      danger: true,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      show: Boolean(order.canDelete),
      danger: true,
    },
  ];

  const menu =
    open && mounted && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-[100] w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          >
            {items
              .filter((item) => item.show)
              .map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    run(item.key);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#014582]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            setOpen(false);
          } else {
            openMenu();
          }
        }}
        className="p-1.5 text-gray-400 hover:text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all"
        title="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {menu}
    </div>
  );
}
