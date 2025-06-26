import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { env } from '@/config/env';
import { Product } from '@/types/products';
import { Category } from '@/types/categories';
import { CategoryResponse } from '@/types/categories';

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
      setProducts(data as Product[]);
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
        
      const data = await api.get(`/products/all`);
      setProducts(data as Product[]);
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
      setProducts(prev => [...prev, newProduct as Product]);
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
      const updatedProduct = await api.handleResponse(response) as Product;
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
      const newCategory = await api.post('/categories', { name }) as CategoryResponse;
const formattedCategory = {
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
      console.error("Error creating product:", error);
      toast.error(`Failed to create product: ${error.message}`);
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
      console.error("Error editing product:", error);
      toast.error(`Failed to edit product: ${error.message}`);
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
      console.error("Error deleting category:", error);
      toast.error(`Failed to delete category: ${error.message}`);
      throw error;
    }
  };

  const fetchProductById=(id: string)=>products.find(product=>product._id===id)
 const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product?.name || "Unknown Product";
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
    fetchProductById,
    getProductName
  };
};
