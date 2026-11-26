'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BizEmptyState,
  BizPageHeader,
  BizStatusBadge,
} from '../../../components/business-apps/BusinessAppShell';
import {
  BizCard,
  BizLoading,
  bizBtnPrimary,
  bizInput,
} from '../../../components/business-apps/bizUi';
import { noticesApi, type NtcCategory } from '../../../lib/business-apps-api';

export default function NoticesCategoriesPage() {
  const [items, setItems] = useState<NtcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems((await noticesApi.categories()) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await noticesApi.createCategory({ name: name.trim() });
      toast.success('Category created');
      setName('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BizPageHeader title="Categories" description="Organise notices by category." />

      <form onSubmit={onCreate} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className={`${bizInput} sm:max-w-sm`}
        />
        <button type="submit" disabled={saving || !name.trim()} className={bizBtnPrimary}>
          {saving ? 'Adding…' : 'Add category'}
        </button>
      </form>

      {loading ? (
        <BizLoading />
      ) : error ? (
        <BizEmptyState title="Unable to load categories" description={error} />
      ) : items.length === 0 ? (
        <BizEmptyState title="No categories" description="Add a category to group your notices." />
      ) : (
        <BizCard>
          <ul className="divide-y divide-gray-100">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.slug}</p>
                </div>
                {c.isSystem ? <BizStatusBadge status="default" /> : null}
              </li>
            ))}
          </ul>
        </BizCard>
      )}
    </div>
  );
}
