import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { env } from '@/config/env';

interface Product {
  _id: string;
  name: string;
  category_id: string;
  content: string;
  metadata: {
    title: string;
    author: string;
    creation_date: string;
    total_pages: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  description: string | null;
}

interface Category {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
}

interface CategoryResponse {
  _id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  updated_by: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const fetchCategories = async () => {
    if (!token) return;
    try {
      const data: CategoryResponse[] = await api.get('/categories');
      const formattedCategories = data.map(cat => ({ 
        id: cat._id, 
        name: cat.name,
        created_at: cat.created_at,
        created_by: cat.created_by
      }));
      setCategories(formattedCategories);
      if (formattedCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(formattedCategories[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      // Error toast is handled by api utility
    }
  };

  const fetchProducts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
        
      const data = await api.get("/products");
      setProducts(data);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
        
      const data = await api.get(`/all-products`);
      setProducts(data);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async (formData: FormData) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newProduct = await api.submitForm("/products", formData);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(`Failed to create product: ${error.message}`);
      throw error;
    }
  };

  const updateProduct = async (productId: string, formData: FormData) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const token = api.getToken();
      const response = await fetch(`${env.API_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const updatedProduct = await api.handleResponse(response);
      setProducts(prev => prev.map(p => p._id === productId ? updatedProduct : p));
      return updatedProduct;
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(`Failed to update product: ${error.message}`);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!token) throw new Error("Not authenticated");
    try {
        console.log("Deleting product:", productId);
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(`Failed to delete product: ${error.message}`);
      throw error;
    }
  };

  const viewProductContent = (content: string) => {
    console.log("Product Content:", content);
  };
  const fetchProductsByCategory = async (categoryId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/products/${categoryId}`);
      setProducts(data as Product[]);
    } catch (error: any) {
      console.error("Error fetching products by category:", error);
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const createCategory = async (name: string) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newCategory: CategoryResponse = await api.post('/categories', { name });
      const formattedCategory: Category = { 
        id: newCategory._id, 
        name: newCategory.name,
        created_at: newCategory.created_at,
        created_by: newCategory.created_by
      };
      setCategories(prev => [...prev, formattedCategory]);
      toast.success('Category created successfully');
      return formattedCategory;
    } catch (error) {
      // Error toast is handled by api utility
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, name: string) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const updatedCategory = await api.put(`/categories/${categoryId}`, { name }) as CategoryResponse;
      const formattedCategory: Category = { 
        id: updatedCategory._id, 
        name: updatedCategory.name,
        created_at: updatedCategory.created_at,
        created_by: updatedCategory.created_by
      };
      setCategories(prev => 
        prev.map(cat => cat.id === categoryId ? formattedCategory : cat)
      );
      toast.success('Category updated successfully');
      return formattedCategory;
    } catch (error) {
      // Error toast is handled by api utility
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      // Error toast is handled by api utility
      throw error;
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
    }
  }, [token]);

  return {
    products,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    isLoading,
    setIsLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    viewProductContent,    
    setCategories,
    fetchProducts,
    fetchCategories,
    fetchAllProducts,
    fetchProductsByCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
