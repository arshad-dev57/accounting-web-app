'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit, Trash2, FolderTree, Settings,
  X, Save, Loader2, FolderOpen, Folder, Layers,
  ChevronDown, ChevronRight, Hash, User
} from 'lucide-react';
import { categoryService, Category } from '../../api/category/route';

// ============================================================
// TYPES
// ============================================================
interface Subcategory {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  code?: string;
}

// Extend Category to include subCategories for UI
interface CategoryWithSubs extends Category {
  subCategories: Subcategory[];
  children?: Subcategory[]; // For backward compatibility
}

// ============================================================
// CATEGORY LIST VIEW (Tab 1)
// ============================================================
function CategoryListView({
  categories,
  loading,
  searchTerm,
  setSearchTerm,
  onAdd,
  onEdit,
  onDelete,
}: {
  categories: CategoryWithSubs[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onAdd: () => void;
  onEdit: (cat: CategoryWithSubs) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-[#014582]" />
          Categories ({categories.length})
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subcategories</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No categories found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat._id || cat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{cat.code || '-'}</td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{cat.description || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{cat.subCategories?.length || 0}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(cat._id || cat.id!)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUBCATEGORY LIST VIEW (Tab 2)
// ============================================================
function SubcategoryListView({
  categories,
  loading,
  searchTerm,
  setSearchTerm,
  onAdd,
  onEdit,
  onDelete,
}: {
  categories: CategoryWithSubs[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onAdd: () => void;
  onEdit: (sub: Subcategory, parentId: string) => void;
  onDelete: (subId: string, parentId: string) => void;
}) {
  // Flatten subcategories with parent info
  const allSubs: { sub: Subcategory; parentId: string; parentName: string }[] = [];
  categories.forEach(cat => {
    // Check both subCategories and children arrays
    const subs = cat.subCategories || cat.children || [];
    subs.forEach(sub => {
      allSubs.push({ 
        sub, 
        parentId: cat._id || cat.id!, 
        parentName: cat.name 
      });
    });
  });

  const filtered = allSubs.filter(item =>
    item.sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sub.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#014582]" />
          Subcategories ({allSubs.length})
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Subcategory
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No subcategories found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(({ sub, parentId, parentName }) => (
                  <tr key={sub._id || sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800">{sub.name}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{sub.code || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{parentName}</td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{sub.description || '-'}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(sub, parentId)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(sub._id || sub.id!, parentId)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CATEGORY FORM MODAL
// ============================================================
function CategoryFormModal({
  initialData,
  onSave,
  onCancel,
  saving,
}: {
  initialData?: Partial<Category>;
  onSave: (data: Partial<Category>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    onSave({ 
      name: name.trim(), 
      code: code.trim() || undefined, 
      description: description.trim() || undefined 
    });
  };

  const title = initialData?._id || initialData?.id ? 'Edit Category' : 'Add Category';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#014582]/10 rounded-lg">
              <FolderTree className="w-5 h-5 text-[#014582]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generated or custom"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {initialData?._id || initialData?.id ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SUBCATEGORY FORM MODAL
// ============================================================
function SubcategoryFormModal({
  categories,
  initialData,
  parentId,
  onSave,
  onCancel,
  saving,
}: {
  categories: CategoryWithSubs[];
  initialData?: Partial<Subcategory>;
  parentId?: string;
  onSave: (data: Partial<Subcategory> & { parentId: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedParent, setSelectedParent] = useState(parentId || (categories.length > 0 ? categories[0]._id || categories[0].id! : ''));
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!selectedParent) {
      setError('Please select a parent category');
      return;
    }
    setError('');
    onSave({
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      parentId: selectedParent,
    });
  };

  const title = initialData?._id || initialData?.id ? 'Edit Subcategory' : 'Add Subcategory';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#014582]/10 rounded-lg">
              <Layers className="w-5 h-5 text-[#014582]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Category *</label>
            <select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            >
              <option value="">Select parent...</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subcategory name..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generated or custom"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {initialData?._id || initialData?.id ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// TABS COMPONENT
// ============================================================
function Tabs({ tabs, activeTab, onChange }: { tabs: string[]; activeTab: string; onChange: (tab: string) => void }) {
  return (
    <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-6 py-3 text-sm font-medium transition-all border-b-2 ${
            activeTab === tab
              ? 'border-[#014582] text-[#014582] bg-[#014582]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// MAIN CATEGORIES PAGE
// ============================================================
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Categories');

  // Modal states
  const [categoryModal, setCategoryModal] = useState<{ isOpen: boolean; editData?: CategoryWithSubs }>({ isOpen: false });
  const [subcategoryModal, setSubcategoryModal] = useState<{
    isOpen: boolean;
    editData?: Subcategory;
    parentId?: string;
  }>({ isOpen: false });
  const [saving, setSaving] = useState(false);

  // ── Fetch categories ──
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories with subcategories (tree structure)
      const data = await categoryService.getCategories({ tree: true });
      
      // Transform: each category's children become subCategories
      const transformed = data.map((cat: any) => ({
        ...cat,
        subCategories: cat.children || [],
        children: undefined, // remove children to avoid confusion
      }));
      setCategories(transformed);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      alert(error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Category CRUD ──
  const handleAddCategory = () => setCategoryModal({ isOpen: true });
  const handleEditCategory = (cat: CategoryWithSubs) => setCategoryModal({ isOpen: true, editData: cat });
  
  const handleDeleteCategory = async (id: string) => {
    if (!id) {
      alert('Invalid category ID');
      return;
    }
    if (!confirm('Delete this category? All subcategories will also be removed.')) return;
    try {
      await categoryService.deleteCategory(id);
      await fetchCategories();
    } catch (error: any) {
      alert(error.message || 'Failed to delete category');
    }
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    setSaving(true);
    try {
      const id = data._id || data.id;
      if (id) {
        await categoryService.updateCategory(id, data);
      } else {
        await categoryService.createCategory(data);
      }
      setCategoryModal({ isOpen: false });
      await fetchCategories();
    } catch (error: any) {
      alert(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  // ── Subcategory CRUD ──
  const handleAddSubcategory = () => setSubcategoryModal({ isOpen: true });
  
  const handleEditSubcategory = (sub: Subcategory, parentId: string) => {
    setSubcategoryModal({ isOpen: true, editData: sub, parentId });
  };
  
  const handleDeleteSubcategory = async (subId: string, parentId: string) => {
    if (!subId) {
      alert('Invalid subcategory ID');
      return;
    }
    if (!confirm('Delete this subcategory?')) return;
    try {
      await categoryService.deleteCategory(subId);
      await fetchCategories();
    } catch (error: any) {
      alert(error.message || 'Failed to delete subcategory');
    }
  };
  
  const handleSaveSubcategory = async (data: Partial<Subcategory> & { parentId: string }) => {
    setSaving(true);
    try {
      // Prepare payload
      const payload = {
        name: data.name!,
        description: data.description,
        code: data.code,
        parentId: data.parentId,
      };
      
      const id = data._id || data.id;
      if (id) {
        await categoryService.updateCategory(id, payload);
      } else {
        await categoryService.createCategory(payload);
      }
      setSubcategoryModal({ isOpen: false });
      await fetchCategories();
    } catch (error: any) {
      alert(error.message || 'Failed to save subcategory');
    } finally {
      setSaving(false);
    }
  };

  const closeCategoryModal = () => setCategoryModal({ isOpen: false });
  const closeSubcategoryModal = () => setSubcategoryModal({ isOpen: false });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-[#014582]" />
          Categories & Subcategories
        </h2>
        <Link
          href="/warehouse/product-settings"
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={['Categories', 'Subcategories']} activeTab={activeTab} onChange={handleTabChange} />

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 p-6">
        {activeTab === 'Categories' ? (
          <CategoryListView
            categories={categories}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        ) : (
          <SubcategoryListView
            categories={categories}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAdd={handleAddSubcategory}
            onEdit={handleEditSubcategory}
            onDelete={handleDeleteSubcategory}
          />
        )}
      </div>

      {/* Modals */}
      {categoryModal.isOpen && (
        <CategoryFormModal
          initialData={categoryModal.editData}
          onSave={handleSaveCategory}
          onCancel={closeCategoryModal}
          saving={saving}
        />
      )}
      {subcategoryModal.isOpen && (
        <SubcategoryFormModal
          categories={categories}
          initialData={subcategoryModal.editData}
          parentId={subcategoryModal.parentId}
          onSave={handleSaveSubcategory}
          onCancel={closeSubcategoryModal}
          saving={saving}
        />
      )}
    </div>
  );
}