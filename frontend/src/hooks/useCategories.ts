import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/utils/api";
import {
  Category,
  CategoryResponse,
  PaginatedResponse,
} from "@/types/categories";

interface ApiResponse {
  data: CategoryResponse[];
  page?: number;
  limit?: number;
  count?: number;
  total_count?: number;
  total_pages?: number;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoriesResponse, setCategoriesResponse] =
    useState<PaginatedResponse<CategoryResponse> | null>(null);
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
      const response = (await api.get(
        `/categories?page=${page}&limit=${limit}`
      )) as ApiResponse;
      if (response && Array.isArray(response.data)) {
        const formattedCategories = response.data.map(formatCategory);
        setCategories(formattedCategories);
        setCategoriesResponse(response as PaginatedResponse<CategoryResponse>);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      throw error;
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    if (!token) return;
    setIsCategoriesLoading(true);
    try {
      const response = await api.get("/categories");

      // Handle case where response is an array directly
      if (Array.isArray(response)) {
        const formattedCategories = response.map((cat: CategoryResponse) =>
          formatCategory(cat)
        );
        setCategories(formattedCategories);
        return;
      }

      // Handle case where response is an object with data property
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        const formattedCategories = response.data.map(formatCategory);
        setCategories(formattedCategories);
        return;
      }

      throw new Error("Invalid response format from categories API");
    } catch (error: any) {
      console.error("Error fetching all categories:", error);
      toast.error("Failed to load categories");
      throw error;
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    if (!categoryId) return "Not Assigned";
    if (categories.length === 0) return "Loading...";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const createCategory = async (name: string, currentPage: number = 1) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newCategory = (await api.post("/categories", {
        name,
      })) as CategoryResponse;
      await fetchCategories(currentPage);
      toast.success("Category created successfully");
      return formatCategory(newCategory);
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast.error(`Failed to create category: ${error.message}`);
      throw error;
    }
  };

  const updateCategory = async (
    categoryId: string,
    name: string,
    currentPage: number = 1
  ) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const updatedCategory = (await api.put(`/categories/${categoryId}`, {
        name,
      })) as CategoryResponse;
      await fetchCategories(currentPage);
      toast.success("Category updated successfully");
      return formatCategory(updatedCategory);
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(`Failed to update category: ${error.message}`);
      throw error;
    }
  };

  const deleteCategory = async (
    categoryId: string,
    currentPage: number = 1
  ) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.delete(`/categories/${categoryId}`);
      await fetchCategories(currentPage);
      toast.success("Category deleted successfully");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(`Failed to delete category: ${error.message}`);
      throw error;
    }
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
    getCategoryById: (id: string) => categories.find((cat) => cat.id === id),
  };
};
