import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
}

interface TestConfiguration {
  id: string;
  name: string;
  product_id: string;
  visitorPersona: { [key: string]: any };
  additionalCriteria: { [key: string]: boolean };
  created_at: string;
}

export const usePracticeSession = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [testConfigurations, setTestConfigurations] = useState<TestConfiguration[]>([]);
  const [selectedTestConfigId, setSelectedTestConfigId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.get("/categories");
      const fetchedCategories: Category[] = data.map((cat: any) => ({ 
        id: cat._id, 
        name: cat.name 
      }));
      setCategories(fetchedCategories);
      if (fetchedCategories.length > 0) {
        setSelectedCategoryId(fetchedCategories[0].id);
      }
    } catch (error: any) {
      toast.error(`Failed to load categories: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Products
  const fetchProducts = async (categoryId: string) => {
    if (!categoryId) {
      setProducts([]);
      setSelectedProductId("");
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.get(`/products/${categoryId}`);
      const fetchedProducts: Product[] = data.map((prod: any) => ({
        id: prod._id,
        name: prod.name,
        description: prod.description,
        category_id: prod.category_id,
      }));
      setProducts(fetchedProducts);
      if (fetchedProducts.length > 0) {
        setSelectedProductId(fetchedProducts[0].id);
      }
    } catch (error: any) {
      toast.error(`Failed to load products: ${error.message}`);
      setProducts([]);
      setSelectedProductId("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Test Configurations
  const fetchTestConfigurations = async (productId: string) => {
    if (!productId) {
      setTestConfigurations([]);
      setSelectedTestConfigId("");
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.get(`/test-configurations/${productId}`);
      const formattedConfigs = data.map((config: any) => ({
        id: config.id || config._id,
        name: config.name,
        product_id: config.product_id,
        visitorPersona: config.visitorPersona || {},
        additionalCriteria: config.additionalCriteria || {},
        created_at: config.created_at
      }));
      setTestConfigurations(formattedConfigs);
      if (formattedConfigs.length > 0) {
        setSelectedTestConfigId(formattedConfigs[0].id);
      }
    } catch (error: any) {
      toast.error(`Failed to load test configurations: ${error.message}`);
      setTestConfigurations([]);
      setSelectedTestConfigId("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for initial categories load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Effect for products load when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchProducts(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Effect for test configurations load when product changes
  useEffect(() => {
    if (selectedProductId) {
      fetchTestConfigurations(selectedProductId);
    }
  }, [selectedProductId]);

  return {
    categories,
    products,
    testConfigurations,
    selectedCategoryId,
    selectedProductId,
    selectedTestConfigId,
    setSelectedCategoryId,
    setSelectedProductId,
    setSelectedTestConfigId,
    isLoading
  };
};
