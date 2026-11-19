'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface PortalMenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  show?: boolean;
  danger?: boolean;
}

interface PortalActionsMenuProps {
  items: PortalMenuItem[];
  onSelect: (key: string) => void;
  align?: 'left' | 'right';
  title?: string;
}

export default function PortalActionsMenu({
  items,
  onSelect,
  align = 'right',
  title = 'Actions',
}: PortalActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const placeMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = 192;
    const gap = 4;
    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
    const estimatedHeight = menuRef.current?.offsetHeight || 280;
    const openUp =
      rect.bottom + gap + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    const top = openUp ? rect.top - estimatedHeight - gap : rect.bottom + gap;
    setMenuPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
    const onReposition = () => placeMenu();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
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

  const visible = items.filter((item) => item.show !== false);

  const menu =
    open && mounted && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed z-[100] w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          >
            {visible.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onSelect(item.key);
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
            placeMenu();
            setOpen(true);
          }
        }}
        className="p-1.5 text-gray-400 hover:text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {menu}
    </div>
  );
}
