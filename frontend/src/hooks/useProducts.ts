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
      const data = await api.get("/categories");
      const formattedCategories = data.map((cat: any) => ({ 
        id: cat._id, 
        name: cat.name 
      }));
      setCategories(formattedCategories);
      if (formattedCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(formattedCategories[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error(`Failed to load categories: ${error.message}`);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;
    setIsLoading(true);
    const user_id = "68411e6491ba34cc73ccfd3e";
    try {
        
      const data = await api.get(`/products/${user_id}`);
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
    fetchAllProducts
  };
};
