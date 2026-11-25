'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Folder, FolderOpen, Plus, Trash2, Edit3,
  Network, List, RefreshCw, ChevronRight, ChevronDown,
  Search, ShieldAlert, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCustomerGroups,
  deleteCustomerGroup,
  type CustomerGroupRecord,
} from '@/lib/crm-api';

interface TreeNode extends CustomerGroupRecord {
  childrenNodes: TreeNode[];
}

export default function CustomerGroupListPage() {
  const router = useRouter();
  const [customerGroups, setCustomerGroups] = useState<CustomerGroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [search, setSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCustomerGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerGroups();
      const list = Array.isArray(data) ? (data as unknown as CustomerGroupRecord[]) : [];
      setCustomerGroups(list);
      setExpandedNodes(new Set(list.map((c) => c.id)));
    } catch {
      toast.error('Failed to load customer groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerGroups();
  }, [fetchCustomerGroups]);


  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer group "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteCustomerGroup(id);
      toast.success(`Customer group "${name}" deleted`);
      fetchCustomerGroups();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer group');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedNodes(new Set(customerGroups.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Build hierarchical tree
  const { tree, flatFiltered } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, TreeNode>();

    customerGroups.forEach((c) => {
      map.set(c.id, { ...c, childrenNodes: [] });
    });

    const roots: TreeNode[] = [];

    customerGroups.forEach((c) => {
      const node = map.get(c.id)!;
      let parent: TreeNode | undefined;

      if (c.parentId && map.has(c.parentId)) {
        parent = map.get(c.parentId);
      } else if (c.parentCustomerGroup) {
        parent = customerGroups
          .map((x) => map.get(x.id))
          .find((x) => x?.name === c.parentCustomerGroup);
      }

      if (parent && parent.id !== node.id) {
        parent.childrenNodes.push(node);
      } else {
        roots.push(node);
      }
    });

    // Ensure 'All Customer Groups' is the primary root
    roots.sort((a, b) => {
      if (a.name.toLowerCase() === 'all customer groups') return -1;
      if (b.name.toLowerCase() === 'all customer groups') return 1;
      return a.name.localeCompare(b.name);
    });

    const filtered = customerGroups.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.parentCustomerGroup && c.parentCustomerGroup.toLowerCase().includes(term))
    );

    return { tree: roots, flatFiltered: filtered };
  }, [customerGroups, search]);

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.childrenNodes.length > 0;
    const isGroup = node.isGroup ?? (hasChildren || node.name.toLowerCase() === 'all customer groups');
    const matchesSearch =
      search.trim() && node.name.toLowerCase().includes(search.trim().toLowerCase());

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors ${
            matchesSearch ? 'bg-amber-50 border border-amber-200' : ''
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 28 + 12)}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-gray-300">•</span>
            )}

            {isGroup ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-[#014582] shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-[#014582] shrink-0" />
              )
            ) : (
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            )}

            <Link
              href={`/crm/customer-group/${node.id}`}
              className="text-sm font-medium text-gray-900 hover:text-[#014582] hover:underline truncate"
            >
              {node.name}
            </Link>

            {isGroup ? (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#014582] border border-blue-200/60">
                Group
              </span>
            ) : (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Leaf
              </span>
            )}

            {node.defaultPriceList ? (
              <span className="hidden sm:inline-block text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                Price: {node.defaultPriceList}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/crm/customer-group/new?parent=${encodeURIComponent(node.name)}`}
              title="Add Child Customer Group"
              className="p-1.5 rounded hover:bg-white text-gray-600 hover:text-[#014582] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/crm/customer-group/${node.id}`}
              title="Edit Customer Group"
              className="p-1.5 rounded hover:bg-white text-gray-600 hover:text-[#014582] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(node.id, node.name)}
              disabled={deletingId === node.id}
              title="Delete Customer Group"
              className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200 ml-6 pl-2 space-y-0.5">
            {node.childrenNodes.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* ── Breadcrumb & Top Bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/crm/dashboard" className="hover:text-gray-900">CRM</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Customer Group</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#014582]" />
            Customer Group
          </h1>
          <p className="text-xs text-gray-500">
            Groups customers, for pricing and reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <Link
            href="/crm/customer-group/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer Group
          </Link>
        </div>
      </div>

      {/* ── Main View Container ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* View Switcher & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-[#f8f9fa]">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-[#014582] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Tree View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#014582] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List View
              </button>
            </div>

            {viewMode === 'tree' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2 py-1 rounded hover:bg-gray-200/70"
                >
                  Expand All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2 py-1 rounded hover:bg-gray-200/70"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer groups…"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:border-[#014582] focus:ring-1 focus:ring-[#014582]"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#014582]" />
            Loading customer groups…
          </div>
        ) : customerGroups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#014582] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No customer groups found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Customer groups allow categorization of customers for special pricing, payment terms, and credit limits.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/crm/customer-group/new"
                className="px-3.5 py-1.5 bg-[#014582] hover:bg-[#01366a] text-white rounded-md text-xs font-semibold"
              >
                Create Customer Group
              </Link>
            </div>
          </div>
        ) : viewMode === 'tree' ? (
          /* Tree View */
          <div className="p-4 sm:p-6 space-y-1">
            {tree.map((node) => renderTreeNode(node))}
          </div>
        ) : (
          /* List View Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8f9fa] text-gray-600 font-semibold">
                  <th className="py-2.5 px-4">Customer Group Name</th>
                  <th className="py-2.5 px-4">Parent Customer Group</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Default Price List</th>
                  <th className="py-2.5 px-4">Payment Terms</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flatFiltered.map((c) => {
                  const parentName =
                    c.parentCustomerGroup ||
                    customerGroups.find((x) => x.id === c.parentId)?.name ||
                    '—';
                  const isGroup = c.isGroup ?? (c.name.toLowerCase() === 'all customer groups');

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/crm/customer-group/${c.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        {isGroup ? (
                          <Folder className="w-4 h-4 text-[#014582] shrink-0" />
                        ) : (
                          <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        <span>{c.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{parentName}</td>
                      <td className="py-3 px-4">
                        {isGroup ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#014582] border border-blue-200/60">
                            Group
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Leaf
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{c.defaultPriceList || '—'}</td>
                      <td className="py-3 px-4 text-gray-600">{c.paymentTerms || '—'}</td>
                      <td className="py-3 px-4">
                        {c.isActive === false ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            Inactive
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/crm/customer-group/${c.id}`}
                            className="p-1 rounded text-gray-500 hover:text-[#014582] hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.name)}
                            disabled={deletingId === c.id}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-gray-100 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CRM guidance ───────────────────────── */}
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3 text-xs text-blue-900">
        <ShieldAlert className="w-5 h-5 text-[#014582] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">Customer group structure</p>
          <p className="text-gray-600 leading-relaxed">
            Customer groups form a tree structure. <strong>Group</strong> nodes classify customer types (e.g., Commercial, Non-Profit). <strong>Leaf</strong> nodes can be directly assigned to Customers, which cascades default pricing lists, payment terms, and credit limits to all sales orders and invoices.
          </p>
        </div>
      </div>
    </div>
  );
}

