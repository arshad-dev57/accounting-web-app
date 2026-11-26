'use client';

export const dynamic = 'force-dynamic';

import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  GanttChart,
  MessageSquare,
  Settings,
  Timer,
  Users,
  Flag,
} from 'lucide-react';
import {
  BusinessAppShell,
  type BizNavGroup,
} from '../../components/business-apps/BusinessAppShell';

const NAV_GROUPS: BizNavGroup[] = [
  {
    id: 'work',
    label: 'Work',
    defaultOpen: true,
    items: [
      { href: '/projects/list', label: 'Projects', icon: FolderKanban },
      { href: '/projects/tasks', label: 'Tasks & Subtasks', icon: CheckSquare },
      { href: '/projects/board', label: 'Kanban Board', icon: GanttChart },
      { href: '/projects/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/projects/milestones', label: 'Milestones', icon: Flag },
    ],
  },
  {
    id: 'people',
    label: 'People & Time',
    defaultOpen: true,
    items: [
      { href: '/projects/teams', label: 'Teams & Resources', icon: Users },
      { href: '/projects/time', label: 'Time Tracking', icon: Timer },
      { href: '/projects/communication', label: 'Communication', icon: MessageSquare },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    defaultOpen: false,
    items: [
      { href: '/projects/reports', label: 'Reports', icon: BarChart3 },
      { href: '/projects/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessAppShell
      appKey="projects"
      appTitle="Project Management"
      menuLabel="PROJECTS MENU"
      dashboardHref="/projects/dashboard"
      navGroups={NAV_GROUPS}
    >
      {children}
    </BusinessAppShell>
  );
}
