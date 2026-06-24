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
  getCategories: async (params?: { tree?: boolean; includeInactive?: boolean }): Promise<Category[]> => {
    const query = new URLSearchParams();
    if (params?.tree) query.append('tree', 'true');
    if (params?.includeInactive) query.append('includeInactive', 'true');
    const url = `/api/warehouse/categories${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch categories');
    }
    return response.data.data || [];
  },

  // Get single category
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/api/warehouse/categories/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch category');
    }
    return response.data.data;
  },

  // ✅ Get subcategories for a specific parent category
  getSubCategories: async (parentId: string): Promise<Category[]> => {
    try {
      // First try: Fetch all categories with tree structure and filter by parent
      const allCategories = await categoryService.getCategories({ tree: true });
      
      // Find the parent category
      const parent = allCategories.find(c => c._id === parentId || c.id === parentId);
      
      // If parent found, return its children/subCategories
      if (parent) {
        return parent.children || parent.subCategories || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
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