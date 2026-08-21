// lib/api/category.ts
import { apiClient } from '../../lib/api-client';

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  parentName?: string;
  level?: number;
  path?: string;
  subCategories?: Category[];
  children?: Category[]; // For tree structure
  subCategoryCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const categoryService = {
  // Get all categories (flat or tree)
  getCategories: async (params?: {
    tree?: boolean;
    includeInactive?: boolean;
    parentId?: string;
  }): Promise<Category[]> => {
    const query = new URLSearchParams();
    if (params?.tree) query.append('tree', 'true');
    if (params?.includeInactive) query.append('includeInactive', 'true');
    if (params?.parentId) query.append('parentId', params.parentId);
    const url = `/api/warehouse/categories${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    const raw = response.data?.data ?? response.data ?? [];
    return Array.isArray(raw) ? raw : [];
  },

  // ✅ Get subcategories for a specific parent category
  getSubCategories: async (parentId: string): Promise<Category[]> => {
    try {
      // Prefer direct parentId filter (flat, reliable)
      const children = await categoryService.getCategories({ parentId });
      if (children.length > 0) {
        return children.map((c) => ({
          ...c,
          id: c.id || (c as any)._id || '',
        })).filter((c) => !!c.id);
      }

      // Fallback: tree walk
      const allCategories = await categoryService.getCategories({ tree: true });
      const parent = allCategories.find(
        (c) => c._id === parentId || c.id === parentId
      );
      if (parent) {
        return (parent.children || parent.subCategories || []).map((c) => ({
          ...c,
          id: c.id || (c as any)._id || '',
        })).filter((c) => !!c.id);
      }
      return [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  },

  // Get single category
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/api/warehouse/categories/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch category');
    }
    return response.data.data;
  },

  // Create category
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/api/warehouse/categories', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create category');
    }
    return response.data.data;
  },

  // Update category
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/api/warehouse/categories/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update category');
    }
    return response.data.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/categories/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete category');
    }
  },
};