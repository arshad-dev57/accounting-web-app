'use client';

export const dynamic = 'force-dynamic';

import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  Settings,
  Users,
  Video,
} from 'lucide-react';
import {
  BusinessAppShell,
  type BizNavGroup,
} from '../../components/business-apps/BusinessAppShell';

const NAV_GROUPS: BizNavGroup[] = [
  {
    id: 'core',
    label: 'Meetings',
    defaultOpen: true,
    items: [
      { href: '/meetings/list', label: 'All Meetings', icon: Video },
      { href: '/meetings/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/meetings/participants', label: 'Participants', icon: Users },
      { href: '/meetings/agenda', label: 'Agenda', icon: ClipboardList },
    ],
  },
  {
    id: 'followup',
    label: 'Follow-up',
    defaultOpen: true,
    items: [
      { href: '/meetings/minutes', label: 'Minutes', icon: FileText },
      { href: '/meetings/action-items', label: 'Action Items', icon: CheckSquare },
      { href: '/meetings/reports', label: 'Reports', icon: BarChart3 },
      { href: '/meetings/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function MeetingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessAppShell
      appKey="meetings"
      appTitle="Meeting Management"
      menuLabel="MEETINGS MENU"
      dashboardHref="/meetings/dashboard"
      navGroups={NAV_GROUPS}
    >
      {children}
    </BusinessAppShell>
  );
}
