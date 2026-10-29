'use client';

// ERPNext form view. Fields, required flags and workflow buttons all come from
// the document metadata the backend returns, and the lifecycle transitions run
// server-side (POST /docs/:resource/:id/action/:key) — the browser never writes
// a status by hand.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HRActionButton, HRCard, HRPage, HRStatusBadge, HRWorkflowNotice } from '@/hr/ui';
import { HrDocumentFields, errorsByField, useFetchFrom, useFormValues } from '@/hr/components/hr-document-form';
import { DocWorkspaceProvider } from '@/lib/doc-workspace-context';
import { isRequired, isVisible } from '@/lib/hr-field-conditions';
import {
  MfgApiError,
  mfgWorkspaceService,
  type MfgDescriptor,
  type MfgLinkOption,
  type MfgRecordMeta,
  type MfgRow
} from '@/lib/mfg-workspace-service';

const NEW_RECORD = 'new';

// Stable placeholder for the window before the metadata arrives: a fresh object
// here would rebuild `reset` on every render and re-trigger the effect below.
const EMPTY_DESCRIPTOR = { fields: [], resource: '' } as unknown as MfgDescriptor;

export default function MfgDocumentFormPage() {
  const params = useParams<{ workspace: string; document: string; recordId: string }>();
  const router = useRouter();
  const workspaceSlug = params?.workspace || '';
  const resource = params?.document || '';
  const recordId = params?.recordId || NEW_RECORD;
  const isNew = recordId === NEW_RECORD;

  const [descriptor, setDescriptor] = useState<MfgDescriptor | null>(null);
  const [options, setOptions] = useState<Record<string, MfgLinkOption[]>>({});
  const [row, setRow] = useState<MfgRow | null>(null);
  const [recordMeta, setRecordMeta] = useState<MfgRecordMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const meta = await mfgWorkspaceService.documentMeta(resource);
      setDescriptor(meta.descriptor);
      setOptions(meta.options || {});
      if (!isNew) {
        const detail = await mfgWorkspaceService.detail(resource, recordId);
        setRow(detail.row);
        setRecordMeta(detail.meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this record');
    } finally {
      setLoading(false);
    }
  }, [resource, recordId, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  const { values, setValue, reset } = useFormValues(descriptor || EMPTY_DESCRIPTOR, row, isNew);
  const changeField = useFetchFrom(descriptor || EMPTY_DESCRIPTOR, setValue);

  // the record loads after the descriptor, so the form has to pick up its values
  useEffect(() => {
    reset();
  }, [reset]);

  // ERPNext Company Link defaults to the active company on new documents.
  useEffect(() => {
    if (!isNew || !descriptor) return;
    const companyField = descriptor.fields.find((field) => field.t === 'company');
    if (!companyField) return;
    const companyOptions = options.company || [];
    if (!companyOptions.length) return;
    setValue(companyField.n, companyOptions[0].id);
  }, [isNew, descriptor, options, setValue]);

  // ERPNext Department defaults Parent Department to the root "All Departments" group.
  useEffect(() => {
    if (!isNew || !descriptor || resource !== 'department') return;
    const parentField = descriptor.fields.find((field) => field.n === 'parentId');
    if (!parentField) return;
    const key =
      parentField.linkQuery && Object.keys(parentField.linkQuery).length
        ? `department?${Object.entries(parentField.linkQuery)
            .map(([k, v]) => `${k}=${v === true ? 'true' : v === false ? 'false' : String(v)}`)
            .join('&')}`
        : 'department';
    const groups = options[key] || options.department || [];
    const root = groups.find((o) => /^all departments$/i.test(o.label)) || groups[0];
    if (root) setValue('parentId', root.id);
  }, [isNew, descriptor, options, resource, setValue]);

  const editable = useMemo(() => {
    if (isNew) return true;
    if (!descriptor?.statuses || !row) return true;
    // ERPNext locks a document once it moves out of its draft state
    return String(row.status) === descriptor.statuses[0];
  }, [isNew, descriptor, row]);

  const title = useMemo(() => {
    if (!descriptor) return '';
    if (isNew) return `New ${descriptor.doctype}`;
    const field = descriptor.titleField;
    const value = field ? row?.[field] : undefined;
    return value ? String(value) : `${descriptor.doctype} ${String(row?.id || '').slice(-6)}`;
  }, [descriptor, isNew, row]);

  const submit = async () => {
    if (!descriptor) return;
    setSaving(true);
    setFieldErrors({});
    try {
      const payload: Record<string, unknown> = {};
      for (const field of descriptor.fields) {
        if (field.ro || String(field.t).startsWith('computed')) continue;
        if (field.n === 'status' && descriptor.statuses) continue;
        // a field the conditions hide is not sent, matching the write path
        if (!isVisible(field, values)) continue;
        if (values[field.n] === '' && !isRequired(field, values)) continue;
        payload[field.n] = values[field.n];
      }
      if (isNew) {
        const created = await mfgWorkspaceService.create(resource, payload);
        toast.success(`${descriptor.doctype} created`);
        // ERPNext reopens the saved document, so the form leaves "new" mode and
        // the freshly minted name/code and workflow buttons become visible.
        router.push(`/manufacturing/${workspaceSlug}/${resource}/${created.id}`);
      } else {
        await mfgWorkspaceService.update(resource, recordId, payload);
        toast.success('Saved');
        await load();
      }
    } catch (err) {
      if (err instanceof MfgApiError) {
        setFieldErrors(errorsByField(err.errors));
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not save');
      }
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (key: string, label: string) => {
    if (!resource || isNew) return;
    setSaving(true);
    try {
      await mfgWorkspaceService.runAction(resource, recordId, key, {});
      toast.success(`${label} applied`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const runButton = async (key: string, label: string) => {
    if (!resource || isNew) return;
    setSaving(true);
    try {
      await mfgWorkspaceService.runButton(resource, recordId, key, {});
      toast.success(`${label} applied`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not run ${label}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!descriptor || isNew) return;
    if (!window.confirm(`Delete this ${descriptor.doctype}?`)) return;
    setSaving(true);
    try {
      await mfgWorkspaceService.remove(resource, recordId);
      toast.success('Deleted');
      window.location.href = `/manufacturing/${workspaceSlug}/${resource}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <HRPage>
        <HRCard>{<p className="text-sm text-[#7A8FA6]">Loading…</p>}</HRCard>
      </HRPage>
    );
  }

  if (!descriptor) {
    return (
      <HRPage>
        <HRCard title="Not found">
          <p className="text-sm text-[#1A1A2E]">{error || 'This Manufacturing document is not available.'}</p>
        </HRCard>
      </HRPage>
    );
  }

  const actions: MfgRecordMeta['actions'] =
    recordMeta?.actions || descriptor.actions.map((a) => ({ ...a, available: false, allowed: true }));

  return (
    <DocWorkspaceProvider service={mfgWorkspaceService}>
    <HRPage>
      <Link
        href={`/manufacturing/${workspaceSlug}/${resource}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#52677E] hover:text-[#014582] mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {descriptor.doctype} list
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6]">{descriptor.doctype}</p>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            {title}
            {!isNew && row?.status && <HRStatusBadge status={String(row.status)} />}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!descriptor.readOnly && editable && (
            <HRActionButton onClick={() => void submit()} icon={Save} className={saving ? 'opacity-60 pointer-events-none' : ''}>
              {isNew ? 'Create' : 'Save'}
            </HRActionButton>
          )}
          {!isNew &&
            actions.map((action) =>
              action.allowed === false ? null : (
                <HRActionButton
                  key={action.key}
                  variant={action.action === 'approve' ? 'primary' : 'secondary'}
                  icon={action.action === 'approve' ? Check : Clock}
                  onClick={() => void runAction(action.key, action.label)}
                  className={saving ? 'opacity-60 pointer-events-none' : ''}
                >
                  {action.label}
                </HRActionButton>
              )
            )}
          {!isNew &&
            editable &&
            (recordMeta?.buttons || descriptor.buttons || []).map((button) => (
              <HRActionButton
                key={button.key}
                variant="secondary"
                onClick={() => void runButton(button.key, button.label)}
                className={saving ? 'opacity-60 pointer-events-none' : ''}
              >
                {button.label}
              </HRActionButton>
            ))}
          {!isNew && !descriptor.readOnly && (
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#E74C3C] border border-[#E74C3C]/30 hover:bg-[#E74C3C]/5"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/5 px-4 py-3 text-xs font-semibold text-[#E74C3C]">
          {error}
        </div>
      )}

      {!isNew && !editable && (
        <HRWorkflowNotice
          tone="amber"
          title={`${descriptor.doctype} is ${row?.status}`}
          detail="Submitted documents can no longer be edited. Cancel it first to make changes."
        />
      )}

      {descriptor.employeeScoped && !isNew && row?.employeeName ? (
        <p className="mb-3 text-xs text-[#52677E]">
          Employee: <span className="font-bold text-[#1A1A2E]">{String(row.employeeName)}</span>
          {row.employeeCode ? ` (${String(row.employeeCode)})` : ''}
        </p>
      ) : null}

      <HRCard title={isNew ? `${descriptor.doctype} details` : `${descriptor.doctype} — ${String(row?.id || '').slice(-8)}`}>
        <HrDocumentFields
          descriptor={descriptor as import('@/lib/hr-workspace-service').HrDescriptor}
          values={values}
          setValue={changeField}
          optionsByTarget={options}
          errors={fieldErrors}
          disabled={!editable || descriptor.readOnly || saving}
        />
      </HRCard>

      {!isNew ? (
        <MfgFormTimeline resource={resource} recordId={recordId} row={row} />
      ) : null}
    </HRPage>
    </DocWorkspaceProvider>
  );
}

function relativeWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

function activityLine(item: { action: string; detail: string; actorName: string; createdAt: string }): string {
  const when = relativeWhen(item.createdAt);
  if (item.action === 'comment') return `${item.actorName} commented · ${when}`;
  if (item.action === 'create') return `${item.actorName} created this · ${when}`;
  if (item.action === 'update') return `${item.actorName} last edited this · ${when}`;
  if (item.action === 'delete') return `${item.actorName} deleted this · ${when}`;
  return `${item.actorName} ${item.action}${item.detail ? `: ${item.detail}` : ''} · ${when}`;
}

function MfgFormTimeline({
  resource,
  recordId,
  row
}: {
  resource: string;
  recordId: string;
  row: MfgRow | null;
}) {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<
    { id: string; action: string; detail: string; actorName: string; createdAt: string }[]
  >([]);
  const [comments, setComments] = useState<
    { id: string; detail: string; actorName: string; createdAt: string }[]
  >([]);

  const load = useCallback(async () => {
    try {
      const data = await mfgWorkspaceService.timeline(resource, recordId);
      setActivity(data.activity || []);
      setComments(data.comments || []);
    } catch {
      // fall back to created/updated stamps on the row
      const fallback: { id: string; action: string; detail: string; actorName: string; createdAt: string }[] = [];
      if (row?.updatedAt) {
        fallback.push({
          id: 'updated',
          action: 'update',
          detail: '',
          actorName: 'User',
          createdAt: String(row.updatedAt)
        });
      }
      if (row?.createdAt) {
        fallback.push({
          id: 'created',
          action: 'create',
          detail: '',
          actorName: 'User',
          createdAt: String(row.createdAt)
        });
      }
      setActivity(fallback);
      setComments([]);
    }
  }, [resource, recordId, row]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitComment = async () => {
    const text = comment.trim();
    if (!text) return;
    setSaving(true);
    try {
      const data = await mfgWorkspaceService.addComment(resource, recordId, text);
      setActivity(data.activity || []);
      setComments(data.comments || []);
      setComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <HRCard title="Comments">
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-[12.5px] text-[#9c9c9c]">No comments yet</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((item) => (
                <li key={item.id} className="rounded border border-[#e2e2e2] bg-[#fafafa] px-3 py-2">
                  <p className="text-[12.5px] text-[#171717] whitespace-pre-wrap">{item.detail}</p>
                  <p className="mt-1 text-[11px] text-[#7c7c7c]">
                    {item.actorName} · {relativeWhen(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Type a comment"
            className="h-auto w-full rounded border border-[#c7c7c7] bg-white px-2.5 py-2 text-[12.5px] text-[#171717] outline-none focus:border-[#014582]"
          />
          <button
            type="button"
            disabled={saving || !comment.trim()}
            onClick={() => void submitComment()}
            className="rounded border border-[#c7c7c7] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#171717] hover:bg-[#f3f3f3] disabled:opacity-50"
          >
            Comment
          </button>
        </div>
      </HRCard>

      <HRCard title="Activity">
        {activity.length === 0 ? (
          <p className="text-[12.5px] text-[#9c9c9c]">No activity yet</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((item) => (
              <li key={item.id} className="text-[12.5px] text-[#525252]">
                {item.action === 'comment' ? (
                  <div>
                    <p className="text-[#171717] whitespace-pre-wrap">{item.detail}</p>
                    <p className="mt-0.5 text-[11px] text-[#7c7c7c]">{activityLine(item)}</p>
                  </div>
                ) : (
                  activityLine(item)
                )}
              </li>
            ))}
          </ul>
        )}
      </HRCard>
    </div>
  );
}
