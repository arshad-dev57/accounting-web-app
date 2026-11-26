'use client';

export const dynamic = 'force-dynamic';

import {
  BarChart3,
  Bell,
  Eye,
  FolderOpen,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import {
  BusinessAppShell,
  type BizNavGroup,
} from '../../components/business-apps/BusinessAppShell';

const NAV_GROUPS: BizNavGroup[] = [
  {
    id: 'core',
    label: 'Notices',
    defaultOpen: true,
    items: [
      { href: '/notices/list', label: 'All Notices', icon: Megaphone },
      { href: '/notices/categories', label: 'Categories', icon: FolderOpen },
      { href: '/notices/audience', label: 'Audience', icon: Users },
      { href: '/notices/reads', label: 'Read Receipts', icon: Eye },
    ],
  },
  {
    id: 'engage',
    label: 'Engagement',
    defaultOpen: false,
    items: [
      { href: '/notices/comments', label: 'Comments', icon: MessageSquare },
      { href: '/notices/reports', label: 'Reports', icon: BarChart3 },
      { href: '/notices/settings', label: 'Settings', icon: Settings },
      { href: '/notices/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessAppShell
      appKey="notices"
      appTitle="Notice Board"
      menuLabel="NOTICES MENU"
      dashboardHref="/notices/dashboard"
      navGroups={NAV_GROUPS}
    >
      {children}
    </BusinessAppShell>
  );
}
