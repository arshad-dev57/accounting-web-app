'use client';

export const dynamic = 'force-dynamic';

import { BizPageHeader, BizStatusBadge } from '../../../components/business-apps/BusinessAppShell';
import { BizCard, BizNote } from '../../../components/business-apps/bizUi';

const TYPES = ['internal', 'client', 'board', 'standup', 'review', 'training', 'other'];
const STATUSES = [
  { key: 'scheduled', tone: 'info' },
  { key: 'in_progress', tone: 'warning' },
  { key: 'completed', tone: 'success' },
  { key: 'cancelled', tone: 'danger' },
] as const;

export default function MeetingsSettingsPage() {
  return (
    <div>
      <BizPageHeader title="Meeting Settings" description="Meeting types and statuses used across the module." />
      <div className="mb-6">
        <BizNote>These defaults are read-only for now. Custom types and reminders will be configurable later.</BizNote>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BizCard title="Meeting types">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <BizStatusBadge key={t} status={t} />
            ))}
          </div>
        </BizCard>
        <BizCard title="Meeting statuses">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <BizStatusBadge key={s.key} status={s.key} tone={s.tone} />
            ))}
          </div>
        </BizCard>
      </div>
    </div>
  );
}
