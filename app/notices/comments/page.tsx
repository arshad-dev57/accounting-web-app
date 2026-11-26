'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BizEmptyState, BizStatusBadge } from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizField,
  BizLoading,
  BizNote,
  bizBtnPrimary,
  bizInput,
  fmtDateTime,
  noticeStatusTone,
} from '../../../components/business-apps/bizUi';
import NoticePicker from '../../../components/business-apps/NoticePicker';
import { displayName, noticesApi, type NtcNotice, type PmUser } from '../../../lib/business-apps-api';

type Comment = { id?: string; body?: string; createdAt?: string; user?: PmUser | null };

function CommentsPanel({ notice }: { notice: NtcNotice }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const canComment = notice.allowComments && notice.status === 'published';

  const load = useCallback(async () => {
    try {
      const rows = await noticesApi.comments(notice.id);
      setComments(Array.isArray(rows) ? (rows as Comment[]) : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [notice.id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await noticesApi.addComment(notice.id, { body: body.trim() });
      toast.success('Comment added');
      setBody('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
        <Link href={`/notices/${notice.id}`} className="font-medium text-[#014582] hover:underline">
          {notice.title}
        </Link>
        <BizStatusBadge status={notice.status} tone={noticeStatusTone(notice.status)} />
        <BizStatusBadge
          status={notice.allowComments ? 'comments enabled' : 'comments disabled'}
          tone={notice.allowComments ? 'success' : 'neutral'}
        />
      </div>

      {canComment ? (
        <BizCard title="Add comment">
          <form onSubmit={onSubmit} className="space-y-3">
            <BizField label="Comment">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={5000}
                className={bizInput}
                required
              />
            </BizField>
            <button type="submit" disabled={saving} className={bizBtnPrimary}>
              {saving ? 'Posting…' : 'Post comment'}
            </button>
          </form>
        </BizCard>
      ) : (
        <BizNote>
          {!notice.allowComments
            ? 'Comments are disabled for this notice.'
            : 'Comments can only be added to published notices.'}
        </BizNote>
      )}

      {loading ? (
        <BizLoading height="h-32" />
      ) : comments.length === 0 ? (
        <BizEmptyState title="No comments yet" description="Comments on this notice will be listed here." />
      ) : (
        <BizCard title={`Comments (${comments.length})`}>
          <ul className="divide-y divide-gray-100">
            {comments.map((c, i) => (
              <li key={c.id || i} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">{displayName(c.user)}</span>
                  <span className="text-xs text-gray-400">{fmtDateTime(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-gray-700">{c.body}</p>
              </li>
            ))}
          </ul>
        </BizCard>
      )}
    </div>
  );
}

export default function NoticesCommentsPage() {
  return (
    <NoticePicker title="Comments" description="Discussion on each notice.">
      {(notice) => <CommentsPanel key={notice.id} notice={notice} />}
    </NoticePicker>
  );
}
