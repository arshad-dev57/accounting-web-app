'use client';

export const dynamic = 'force-dynamic';

import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  Clock3,
  Link2,
  Settings,
  Tags,
  BriefcaseBusiness,
} from 'lucide-react';
import {
  BusinessAppShell,
  type BizNavGroup,
} from '../../components/business-apps/BusinessAppShell';

const NAV_GROUPS: BizNavGroup[] = [
  {
    id: 'core',
    label: 'Booking',
    defaultOpen: true,
    items: [
      { href: '/appointments/bookings', label: 'Bookings', icon: CalendarClock },
      { href: '/appointments/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/appointments/services', label: 'Services', icon: BriefcaseBusiness },
      { href: '/appointments/types', label: 'Appointment Types', icon: Tags },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    defaultOpen: true,
    items: [
      { href: '/appointments/availability', label: 'Availability', icon: Clock3 },
      { href: '/appointments/public', label: 'Public Booking Page', icon: Link2 },
      { href: '/appointments/reports', label: 'Reports', icon: BarChart3 },
      { href: '/appointments/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessAppShell
      appKey="appointments"
      appTitle="Appointment Booking"
      menuLabel="APPOINTMENTS MENU"
      dashboardHref="/appointments/dashboard"
      navGroups={NAV_GROUPS}
    >
      {children}
    </BusinessAppShell>
  );
}
