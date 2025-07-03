import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { env } from '@/config/env';
import { Product } from '@/types/products';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productsResponse, setProductsResponse] = useState<any>(null);
  const { token } = useAuth();

  const fetchProducts = async (page: number = 1, limit: number = 10) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data: any = await api.get(`/products?page=${page}&limit=${limit}`);
      
      // Handle pagination response format
      if (data.data && Array.isArray(data.data)) {
        // Set file url for display
        data.data.map((product: any) => {
          if (product.file_url) {
            product.file_url = `${env.API_URL}${product.file_url}`;
          }
        });
        // Sort products by created_at in descending order (latest first)
        const sortedData = data.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setProducts(sortedData);
        setProductsResponse(data);
      } else {
        // Fallback for old format
        const products = data as Product[];
        products.map((product: any) => {
          if (product.file_url) {
            product.file_url = `${env.API_URL}${product.file_url}`;
          }
        });
        const sortedData = products.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setProducts(sortedData);
      }
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
      // Sort products by created_at in descending order (latest first)
      const sortedData = (data as Product[]).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setProducts(sortedData);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/products/${categoryId}`);
      // Sort products by created_at in descending order (latest first)
      const sortedData = (data as Product[]).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setProducts(sortedData);
    } catch (error: any) {
      console.error("Error fetching products by category:", error);
      toast.error(`Failed to load products: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async (formData: FormData, currentPage: number = 1) => {
    if (!token) throw new Error("Not authenticated");
    try {
      const newProduct = await api.submitForm("/products", formData);
      // Fetch the latest products from server to ensure consistency
      await fetchProducts(currentPage);
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
      // Update local state and maintain sorting order
      setProducts(prev => {
        const updated = prev.map(p => p._id === productId ? updatedProduct : p);
        return updated.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
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

  const getProductById = (id: string) => {
    return products.find(product => product._id === id);
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product?.name || "Unknown Product";
  };

  const viewProductContent = (content: string) => {
    console.log("Product Content:", content);
  };

  return {
    products,
    isLoading,
    setIsLoading,
    productsResponse,
    setProducts,
    fetchProducts,
    fetchAllProducts,
    fetchProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductName,
    viewProductContent
  };
};
