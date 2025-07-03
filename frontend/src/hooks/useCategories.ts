import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { Category, CategoryResponse, PaginatedResponse } from '@/types/categories';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoriesResponse, setCategoriesResponse] = useState<PaginatedResponse<CategoryResponse> | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const { token } = useAuth();

  const formatCategory = (cat: CategoryResponse): Category => ({
    id: cat._id,
    name: cat.name,
    created_at: cat.created_at,
    created_by: cat.created_by,
    updated_at: cat.updated_at,
    updated_by: cat.updated_by,
  });

  const fetchCategories = async (page: number = 1, limit: number = 10) => {
    if (!token) return;
    setIsCategoriesLoading(true);
    try {
      const response = await api.get(`/categories?page=${page}&limit=${limit}`);
      const data = response as PaginatedResponse<CategoryResponse>;
      
      if (data.data && Array.isArray(data.data)) {
        const formattedCategories = data.data.map(formatCategory);
        setCategories(formattedCategories);
        setCategoriesResponse(data);
        if (formattedCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(formattedCategories[0].id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      // Error toast is handled by api utility
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    if (!token) return;
    try {
      const response = await api.get('/categories?limit=1000');
      const data = response as PaginatedResponse<CategoryResponse>;
      
      if (data.data && Array.isArray(data.data)) {
        const formattedCategories = data.data.map(formatCategory);
        setCategories(formattedCategories);
        if (formattedCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(formattedCategories[0].id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching all categories:", error);
    }
  };

  const createCategory = async (name: string, currentPage: number = 1) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newCategory = await api.post('/categories', { name }) as CategoryResponse;
      // Refresh the current page after creation
      await fetchCategories(currentPage);
      toast.success('Category created successfully');
      return formatCategory(newCategory);
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast.error(`Failed to create category: ${error.message}`);
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, name: string, currentPage: number = 1) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const updatedCategory = await api.put(`/categories/${categoryId}`, { name }) as CategoryResponse;
      // Refresh the current page after update
      await fetchCategories(currentPage);
      toast.success('Category updated successfully');
      return formatCategory(updatedCategory);
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(`Failed to update category: ${error.message}`);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string, currentPage: number = 1) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.delete(`/categories/${categoryId}`);
      // Refresh the current page after deletion
      await fetchCategories(currentPage);
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(`Failed to delete category: ${error.message}`);
      throw error;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  return {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    categoriesResponse,
    isCategoriesLoading,
    setCategories,
    fetchCategories,
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryName,
    getCategoryById
  };
};
