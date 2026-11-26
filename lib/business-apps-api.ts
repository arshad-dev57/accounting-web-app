/**
 * Business Applications Suite API — Projects, Meetings, Notices, Appointments
 *
 * NOTE on apiClient: `apiClient.get(endpoint, requiresAuth)` does NOT accept axios config
 * (no `params`), and its `res.data` is the raw HTTP body `{ success, data, message, pagination }`.
 * So query strings are built here and the payload is read from `res.data.data`.
 */
import { apiClient } from '@/lib/api-client';

type ApiResult = {
  success: boolean;
  statusCode?: number;
  data?: unknown;
  message?: string;
};

type QueryParams = Record<string, string | number | boolean | undefined | null>;

/** Build `?a=1&b=2`; `q` is mapped to the backend's `search` param. */
function toQuery(params?: QueryParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    sp.set(key === 'q' ? 'search' : key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function unwrap<T>(promise: Promise<ApiResult>): Promise<T> {
  const res = await promise;
  const body = res?.data as { success?: boolean; data?: unknown; message?: string } | null | undefined;
  if (!res?.success || body?.success === false) {
    throw new Error(body?.message || res?.message || 'Request failed');
  }
  // Backend envelope: { success, data, message, pagination? }
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

type Paged<T> = { items: T[]; total?: number } | T[];

// ── Projects ─────────────────────────────────────────────────────────────────

export type PmUser = { id: string; firstName?: string; lastName?: string; email?: string };

export type PmActivity = {
  id?: string;
  action?: string;
  message?: string;
  createdAt?: string;
  user?: PmUser | null;
  project?: { id: string; name: string; projectCode?: string } | null;
};

export type PmDashboard = {
  projects: {
    total: number;
    active: number;
    planning: number;
    onHold: number;
    completed: number;
    cancelled: number;
    overdue: number;
    archived: number;
    byStatus: Record<string, number>;
  };
  tasks: {
    total: number;
    open: number;
    completed: number;
    overdue: number;
    myOpen: number;
    byStatus: Record<string, number>;
  };
  milestones: { upcoming: number; overdue: number };
  time: { minutesLast7Days: number; hoursLast7Days: number; myRunningTimers: number };
  budget: { totalBudget: number | string; totalEstimatedCost: number | string };
  recentActivity: PmActivity[];
};

export type PmMilestone = {
  id: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: string;
  completedAt?: string | null;
};

export type PmProject = {
  id: string;
  projectCode: string;
  name: string;
  description?: string | null;
  customerId?: string | null;
  managerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | number | null;
  estimatedCost?: string | number | null;
  priority: string;
  status: string;
  progressPercent: number;
  isArchived: boolean;
  createdAt: string;
  manager?: PmUser | null;
  customer?: { id: string; name?: string } | null;
  _count?: { tasks?: number; members?: number; milestones?: number };
  members?: Array<{ id: string; userId: string; role: string; user?: PmUser }>;
  tasks?: PmTask[];
  milestones?: PmMilestone[];
  taskStats?: Record<string, number>;
  totalMinutesLogged?: number;
};

export type PmTask = {
  id: string;
  projectId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  priority: string;
  status: string;
  startDate?: string | null;
  dueDate?: string | null;
  progressPercent: number;
  estimatedHours?: number | string | null;
  actualHours?: number | string | null;
  sortOrder?: number;
  assignee?: PmUser | null;
};

export type PmMember = { id: string; userId: string; role: string; user?: PmUser };
export type PmTimeEntry = {
  id: string;
  projectId: string;
  taskId?: string | null;
  userId: string;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  description?: string | null;
  isRunning: boolean;
  user?: PmUser;
};

export const projectsApi = {
  dashboard: () => unwrap<PmDashboard>(apiClient.get('/api/projects/dashboard')),
  list: (params?: QueryParams) =>
    unwrap<Paged<PmProject>>(apiClient.get(`/api/projects${toQuery(params)}`)),
  get: (id: string) => unwrap<PmProject>(apiClient.get(`/api/projects/${id}`)),
  create: (body: Record<string, unknown>) => unwrap<PmProject>(apiClient.post('/api/projects', body)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<PmProject>(apiClient.put(`/api/projects/${id}`, body)),
  remove: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/api/projects/${id}`)),
  listTasks: (projectId: string, params?: QueryParams) =>
    unwrap<Paged<PmTask>>(apiClient.get(`/api/projects/${projectId}/tasks${toQuery(params)}`)),
  createTask: (projectId: string, body: Record<string, unknown>) =>
    unwrap<PmTask>(apiClient.post(`/api/projects/${projectId}/tasks`, body)),
  updateTask: (taskId: string, body: Record<string, unknown>) =>
    unwrap<PmTask>(apiClient.put(`/api/projects/tasks/${taskId}`, body)),
  members: (projectId: string) =>
    unwrap<PmMember[]>(apiClient.get(`/api/projects/${projectId}/members`)),
  addMember: (projectId: string, body: Record<string, unknown>) =>
    unwrap<PmMember>(apiClient.post(`/api/projects/${projectId}/members`, body)),
  removeMember: (projectId: string, memberId: string) =>
    unwrap<{ id: string }>(apiClient.delete(`/api/projects/${projectId}/members/${memberId}`)),
  milestones: (projectId: string) =>
    unwrap<PmMilestone[]>(apiClient.get(`/api/projects/${projectId}/milestones`)),
  createMilestone: (projectId: string, body: Record<string, unknown>) =>
    unwrap<PmMilestone>(apiClient.post(`/api/projects/${projectId}/milestones`, body)),
  updateMilestone: (milestoneId: string, body: Record<string, unknown>) =>
    unwrap<PmMilestone>(apiClient.put(`/api/projects/milestones/${milestoneId}`, body)),
  deleteMilestone: (milestoneId: string) =>
    unwrap<{ id: string }>(apiClient.delete(`/api/projects/milestones/${milestoneId}`)),
  timeEntries: (projectId: string, params?: QueryParams) =>
    unwrap<Paged<PmTimeEntry>>(apiClient.get(`/api/projects/${projectId}/time-entries${toQuery(params)}`)),
  createTimeEntry: (projectId: string, body: Record<string, unknown>) =>
    unwrap<PmTimeEntry>(apiClient.post(`/api/projects/${projectId}/time-entries`, body)),
  stopTimeEntry: (entryId: string) =>
    unwrap<PmTimeEntry>(apiClient.post(`/api/projects/time-entries/${entryId}/stop`, {})),
  activities: (projectId: string) =>
    unwrap<PmActivity[]>(apiClient.get(`/api/projects/${projectId}/activities`)),
  settings: () => unwrap<Record<string, unknown>>(apiClient.get('/api/projects/settings')),
  updateSettings: (body: Record<string, unknown>) =>
    unwrap<Record<string, unknown>>(apiClient.put('/api/projects/settings', body)),
  reports: () => unwrap<Record<string, unknown>>(apiClient.get('/api/projects/reports/summary')),
};

// ── Meetings ─────────────────────────────────────────────────────────────────

export type MtgUser = PmUser;

export type MtgParticipant = {
  id: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  response: string;
  attended?: boolean | null;
  user?: MtgUser | null;
};

export type MtgAgendaItem = {
  id: string;
  title: string;
  allocatedMinutes?: number | null;
  sortOrder?: number;
  notes?: string | null;
  presenter?: MtgUser | null;
};

export type MtgMinute = {
  id: string;
  content: string;
  decisions?: string | null;
  recordedAt: string;
};

export type MtgActionItem = {
  id: string;
  title: string;
  dueDate?: string | null;
  status: string;
  assignee?: MtgUser | null;
};

export type MtgMeeting = {
  id: string;
  title: string;
  description?: string | null;
  meetingType: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  location?: string | null;
  meetingLink?: string | null;
  organizerId: string;
  status: string;
  agendaSummary?: string | null;
  minutesSummary?: string | null;
  organizer?: MtgUser | null;
  participants?: MtgParticipant[];
  agendaItems?: MtgAgendaItem[];
  minutes?: MtgMinute[];
  actionItems?: MtgActionItem[];
  _count?: { participants?: number; actionItems?: number; agendaItems?: number };
};

export type MtgDashboard = {
  meetings: {
    total: number;
    today: number;
    upcoming: number;
    next7Days: number;
    inProgress: number;
    completed: number;
    completedThisMonth: number;
    cancelled: number;
    byStatus: Record<string, number>;
  };
  actionItems: { open: number; overdue: number; myOpen: number };
  invitations: { myPending: number };
  nextMeetings: MtgMeeting[];
};

export const meetingsApi = {
  dashboard: () => unwrap<MtgDashboard>(apiClient.get('/api/meetings/dashboard')),
  list: (params?: QueryParams) => unwrap<Paged<MtgMeeting>>(apiClient.get(`/api/meetings${toQuery(params)}`)),
  get: (id: string) => unwrap<MtgMeeting>(apiClient.get(`/api/meetings/${id}`)),
  create: (body: Record<string, unknown>) => unwrap<MtgMeeting>(apiClient.post('/api/meetings', body)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<MtgMeeting>(apiClient.put(`/api/meetings/${id}`, body)),
  remove: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/api/meetings/${id}`)),
  participants: (id: string) => unwrap<MtgParticipant[]>(apiClient.get(`/api/meetings/${id}/participants`)),
  addParticipants: (id: string, body: Record<string, unknown>) =>
    unwrap<MtgParticipant[]>(apiClient.post(`/api/meetings/${id}/participants`, body)),
  agenda: (id: string) => unwrap<MtgAgendaItem[]>(apiClient.get(`/api/meetings/${id}/agenda`)),
  createAgendaItem: (id: string, body: Record<string, unknown>) =>
    unwrap<MtgAgendaItem>(apiClient.post(`/api/meetings/${id}/agenda`, body)),
  updateAgendaItem: (itemId: string, body: Record<string, unknown>) =>
    unwrap<MtgAgendaItem>(apiClient.put(`/api/meetings/agenda/${itemId}`, body)),
  deleteAgendaItem: (itemId: string) =>
    unwrap<{ id: string }>(apiClient.delete(`/api/meetings/agenda/${itemId}`)),
  minutes: (id: string) =>
    unwrap<{ minute?: MtgMinute | null; latest?: MtgMinute | null; history?: MtgMinute[]; minutesSummary?: string | null }>(
      apiClient.get(`/api/meetings/${id}/minutes`)
    ),
  saveMinutes: (id: string, body: Record<string, unknown>) =>
    unwrap<MtgMinute>(apiClient.put(`/api/meetings/${id}/minutes`, body)),
  actionItems: (id: string) => unwrap<MtgActionItem[]>(apiClient.get(`/api/meetings/${id}/action-items`)),
  createActionItem: (id: string, body: Record<string, unknown>) =>
    unwrap<MtgActionItem>(apiClient.post(`/api/meetings/${id}/action-items`, body)),
  updateActionItem: (itemId: string, body: Record<string, unknown>) =>
    unwrap<MtgActionItem>(apiClient.put(`/api/meetings/action-items/${itemId}`, body)),
  complete: (id: string) => unwrap<MtgMeeting>(apiClient.post(`/api/meetings/${id}/complete`, {})),
  reports: () => unwrap<Record<string, unknown>>(apiClient.get('/api/meetings/reports/summary')),
};

// ── Notices ──────────────────────────────────────────────────────────────────

export type NtcNotice = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  status: string;
  publishAt?: string | null;
  expireAt?: string | null;
  allowComments: boolean;
  publishedAt?: string | null;
  createdAt: string;
  isRead?: boolean;
  readAt?: string | null;
  creator?: PmUser | null;
  audiences?: Array<{ id?: string; audienceType: string; audienceId?: string | null }>;
  _count?: { readReceipts?: number; comments?: number; attachments?: number };
};

export type NtcDashboard = {
  notices: {
    total: number;
    draft: number;
    pendingApproval: number;
    scheduled: number;
    published: number;
    expired: number;
    archived: number;
    publishedToday: number;
    expiringSoon: number;
    urgentActive: number;
    byStatus: Record<string, number>;
  };
  engagement: { readReceipts: number; comments: number };
  me: { unread: number };
  recent: NtcNotice[];
};

export type NtcCategory = { id: string; name: string; slug: string; isSystem?: boolean };

export const noticesApi = {
  dashboard: () => unwrap<NtcDashboard>(apiClient.get('/api/notices/dashboard')),
  list: (params?: QueryParams) => unwrap<Paged<NtcNotice>>(apiClient.get(`/api/notices${toQuery(params)}`)),
  get: (id: string) => unwrap<NtcNotice>(apiClient.get(`/api/notices/${id}`)),
  create: (body: Record<string, unknown>) => unwrap<NtcNotice>(apiClient.post('/api/notices', body)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<NtcNotice>(apiClient.put(`/api/notices/${id}`, body)),
  remove: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/api/notices/${id}`)),
  markRead: (id: string) => unwrap<unknown>(apiClient.post(`/api/notices/${id}/read`, {})),
  categories: () => unwrap<NtcCategory[]>(apiClient.get('/api/notices/categories')),
  createCategory: (body: { name: string }) => unwrap<NtcCategory>(apiClient.post('/api/notices/categories', body)),
  comments: (id: string) => unwrap<Array<Record<string, unknown>>>(apiClient.get(`/api/notices/${id}/comments`)),
  addComment: (id: string, body: Record<string, unknown>) =>
    unwrap<Record<string, unknown>>(apiClient.post(`/api/notices/${id}/comments`, body)),
  reads: (id: string) => unwrap<Record<string, unknown>>(apiClient.get(`/api/notices/${id}/reads`)),
  setAudience: (id: string, body: Record<string, unknown>) =>
    unwrap<unknown>(apiClient.put(`/api/notices/${id}/audience`, body)),
  settings: () => unwrap<Record<string, unknown>>(apiClient.get('/api/notices/settings')),
  updateSettings: (body: Record<string, unknown>) =>
    unwrap<Record<string, unknown>>(apiClient.put('/api/notices/settings', body)),
  reports: () => unwrap<Record<string, unknown>>(apiClient.get('/api/notices/reports/summary')),
};

// ── Appointments ─────────────────────────────────────────────────────────────

export type ApptBooking = {
  id: string;
  serviceId?: string | null;
  typeId?: string | null;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  location?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
  service?: { id: string; name: string } | null;
  type?: { id: string; name: string } | null;
  assignee?: PmUser | null;
};

export type ApptDashboard = {
  bookings: {
    today: number;
    todayActive: number;
    upcoming: number;
    next7Days: number;
    pendingApproval: number;
    thisMonth: {
      total: number;
      completed: number;
      cancelled: number;
      noShow: number;
      byStatus: Record<string, number>;
    };
  };
  catalog: { activeServices: number; activeTypes: number };
  todaysSchedule: ApptBooking[];
  nextBookings: ApptBooking[];
};

export type ApptService = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: string | number | null;
  typeId?: string | null;
  isActive: boolean;
  type?: { id: string; name: string } | null;
};

export type ApptType = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  durationMinutes: number;
  isActive: boolean;
};

export type ApptAvailabilitySlot = {
  id: string;
  userId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  user?: PmUser | null;
};

export type ApptHoliday = { id: string; date: string; name?: string | null };

export type ApptSettings = {
  bufferMinutes?: number;
  slotIntervalMinutes?: number;
  requireApproval?: boolean;
  publicSlug?: string | null;
  publicEnabled?: boolean;
  reminderMinutesBefore?: number;
};

export const appointmentsApi = {
  dashboard: () => unwrap<ApptDashboard>(apiClient.get('/api/appointments/dashboard')),
  bookings: (params?: QueryParams) =>
    unwrap<Paged<ApptBooking>>(apiClient.get(`/api/appointments/bookings${toQuery(params)}`)),
  createBooking: (body: Record<string, unknown>) =>
    unwrap<ApptBooking>(apiClient.post('/api/appointments/bookings', body)),
  updateBooking: (id: string, body: Record<string, unknown>) =>
    unwrap<ApptBooking>(apiClient.put(`/api/appointments/bookings/${id}`, body)),
  services: () => unwrap<ApptService[]>(apiClient.get('/api/appointments/services')),
  createService: (body: Record<string, unknown>) =>
    unwrap<ApptService>(apiClient.post('/api/appointments/services', body)),
  types: () => unwrap<ApptType[]>(apiClient.get('/api/appointments/types')),
  createType: (body: Record<string, unknown>) => unwrap<ApptType>(apiClient.post('/api/appointments/types', body)),
  /** Backend returns `{ availability, holidays }`. */
  availability: () =>
    unwrap<{ availability: ApptAvailabilitySlot[]; holidays: ApptHoliday[] } | ApptAvailabilitySlot[]>(
      apiClient.get('/api/appointments/availability')
    ),
  settings: () => unwrap<ApptSettings>(apiClient.get('/api/appointments/settings')),
  updateSettings: (body: Record<string, unknown>) =>
    unwrap<ApptSettings>(apiClient.put('/api/appointments/settings', body)),
  createAvailability: (body: Record<string, unknown>) =>
    unwrap<ApptAvailabilitySlot>(apiClient.post('/api/appointments/availability', body)),
  deleteAvailability: (id: string) =>
    unwrap<{ id: string }>(apiClient.delete(`/api/appointments/availability/${id}`)),
  holidays: () => unwrap<ApptHoliday[]>(apiClient.get('/api/appointments/holidays')),
  createHoliday: (body: Record<string, unknown>) =>
    unwrap<ApptHoliday>(apiClient.post('/api/appointments/holidays', body)),
  deleteHoliday: (id: string) =>
    unwrap<{ id: string }>(apiClient.delete(`/api/appointments/holidays/${id}`)),
  /** Public (unauthenticated) booking page payload. */
  publicPage: async (slug: string, params?: QueryParams) => {
    const res = await fetch(`/api/appointments/public/${encodeURIComponent(slug)}${toQuery(params)}`);
    const body = await res.json();
    if (!body?.success) throw new Error(body?.message || 'Failed to load booking page');
    return body.data as Record<string, unknown>;
  },
  publicBook: async (slug: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/appointments/public/${encodeURIComponent(slug)}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!body?.success) throw new Error(body?.message || 'Booking failed');
    return body.data as ApptBooking;
  },
};

export function asList<T>(data: { items: T[]; total?: number } | T[] | undefined | null): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

export function displayName(user?: { firstName?: string; lastName?: string; email?: string } | null) {
  if (!user) return '—';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || '—';
}
